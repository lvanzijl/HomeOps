import { useEffect, useState } from "react";
import { RoomType } from "../api/homeOpsApiClient";
import type { FamilyMember } from "../home/familyMembers";
import {
  archiveFloor,
  archiveRoom,
  createFloor,
  createRoom,
  deleteFloor,
  deleteRoom,
  getFriendlyWoningError,
  loadClimateConfiguration,
  loadFloors,
  loadRooms,
  moveRoom,
  reorderFloors,
  reorderRooms,
  restoreFloor,
  restoreRoom,
  roomTypeLabels,
  roomTypeOptions,
  updateFloor,
  updateRoom,
  type Floor,
  type Room,
  type RoomClimateConfiguration,
} from "./woningApi";

interface Props { members?: readonly FamilyMember[] }
type Dialog = { kind: "floor"; floor?: Floor } | { kind: "room"; room?: Room } | { kind: "move"; room: Room } | { kind: "confirm"; action: string; title: string; body: string; run: () => Promise<void> } | null;

export function WoningManagement({ members = [] }: Props) {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [roomsByFloor, setRoomsByFloor] = useState<Record<string, Room[]>>({});
  const [climate, setClimate] = useState<Record<string, RoomClimateConfiguration | null>>({});
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Woninginstellingen laden…");
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);

  const activeFloors = floors.filter((floor) => !floor.isArchived).sort(byOrder);
  const archivedFloors = floors.filter((floor) => floor.isArchived).sort(byOrder);
  const selectedFloor = floors.find((floor) => floor.id === selectedFloorId) ?? activeFloors[0] ?? null;
  const selectedRooms = selectedFloor?.id ? (roomsByFloor[selectedFloor.id] ?? []) : [];
  const activeRooms = selectedRooms.filter((room) => !room.isArchived).sort(byOrder);
  const archivedRooms = selectedRooms.filter((room) => room.isArchived).sort(byOrder);

  useEffect(() => { void reloadAll(); }, []);

  async function reloadAll(preferredFloorId?: string) {
    setLoading(true); setError(null);
    try {
      const loadedFloors = (await loadFloors()).sort(byOrder);
      setFloors(loadedFloors);
      const nextSelected = preferredFloorId ?? selectedFloorId ?? loadedFloors.find((floor) => !floor.isArchived)?.id ?? loadedFloors[0]?.id ?? null;
      setSelectedFloorId(nextSelected);
      const roomEntries = await Promise.all(loadedFloors.map(async (floor) => [floor.id ?? "", await loadRooms(floor.id ?? "")] as const));
      const nextRooms = Object.fromEntries(roomEntries);
      setRoomsByFloor(nextRooms);
      const activeRoomIds = Object.values(nextRooms).flat().filter((room) => !room.isArchived && room.id).map((room) => room.id!);
      const configEntries = await Promise.all(activeRoomIds.map(async (id) => [id, await loadClimateConfiguration(id)] as const));
      setClimate(Object.fromEntries(configEntries));
      setMessage("Woningoverzicht is bijgewerkt.");
    } catch (err) {
      setError(getFriendlyWoningError(err, "Verdiepingen laden lukt niet."));
    } finally { setLoading(false); }
  }

  async function runAction(action: () => Promise<void>, success: string, fallback: string, preferredFloorId = selectedFloorId ?? undefined) {
    setBusy(true); setError(null);
    try { await action(); setMessage(success); setDialog(null); await reloadAll(preferredFloorId); }
    catch (err) { setError(getFriendlyWoningError(err, fallback)); }
    finally { setBusy(false); }
  }

  async function shiftFloor(floor: Floor, target: number) {
    const ids = moveId(activeFloors.map((item) => item.id ?? ""), floor.id ?? "", target);
    await runAction(() => reorderFloors(ids), "Volgorde van verdiepingen is opgeslagen.", "Verdiepingen ordenen lukt niet.");
  }
  async function shiftRoom(room: Room, target: number) {
    if (!selectedFloor?.id) return;
    const ids = moveId(activeRooms.map((item) => item.id ?? ""), room.id ?? "", target);
    await runAction(() => reorderRooms(selectedFloor.id!, ids), "Volgorde van kamers is opgeslagen.", "Kamers ordenen lukt niet.");
  }

  return <section className="woning-workspace" aria-label="Woning beheren">
    <header className="woning-header"><div><p className="widget-type">Woning</p><h3>Verdiepingen en kamers</h3><p>Beheer de FamilyBoard-verdiepingen en kamers los van plattegronden, klimaatmetingen en Home Assistant.</p></div><button onClick={() => setDialog({ kind: "floor" })}>Verdieping toevoegen</button></header>
    <div className="woning-status" role={error ? "alert" : "status"}>{error ?? (loading ? "Woninginstellingen laden…" : message)}</div>
    <div className="woning-grid">
      <aside className="woning-panel woning-floor-rail"><h4>Verdiepingen</h4>{loading ? <p>Verdiepingen laden…</p> : null}{!loading && activeFloors.length === 0 ? <div className="woning-empty"><p>Nog geen verdiepingen toegevoegd.</p><button onClick={() => setDialog({ kind: "floor" })}>Verdieping toevoegen</button></div> : null}<div className="woning-scroll-list" role="list">{activeFloors.map((floor, index) => <FloorCard key={floor.id} floor={floor} selected={selectedFloor?.id === floor.id} onSelect={() => setSelectedFloorId(floor.id ?? null)} onEdit={() => setDialog({ kind: "floor", floor })} onArchive={() => setDialog({ kind: "confirm", title: "Verdieping archiveren", action: "Archiveren", body: (floor.activeRoomCount ?? 0) > 0 ? "Deze verdieping kan nog niet worden gearchiveerd omdat er kamers in staan." : "De verdieping verdwijnt uit het actieve overzicht. Kamers worden niet stil verwijderd.", run: () => runAction(() => archiveFloor(floor.id ?? ""), "Verdieping is gearchiveerd.", "Deze verdieping kan nog niet worden gearchiveerd omdat er kamers in staan.") })} onDelete={() => setDialog({ kind: "confirm", title: "Verdieping verwijderen", action: "Verwijderen", body: "Verwijderen kan alleen als de backend dit toestaat. Kamers worden nooit stil verwijderd.", run: () => runAction(() => deleteFloor(floor.id ?? ""), "Verdieping is verwijderd.", "Verdieping verwijderen lukt niet; controleer of er nog kamers zijn.") })} onTop={() => shiftFloor(floor, 0)} onUp={() => shiftFloor(floor, index - 1)} onDown={() => shiftFloor(floor, index + 1)} onBottom={() => shiftFloor(floor, activeFloors.length - 1)} busy={busy} />)}</div>{archivedFloors.length ? <Archived title="Gearchiveerde verdiepingen">{archivedFloors.map((floor) => <button key={floor.id} onClick={() => runAction(() => restoreFloor(floor.id ?? "").then(() => undefined), "Verdieping is hersteld.", "Verdieping herstellen lukt niet.", floor.id)}>Herstellen: {floor.name}</button>)}</Archived> : null}</aside>
      <main className="woning-panel woning-room-panel"><div className="woning-panel-head"><div><h4>{selectedFloor?.name ?? "Geen verdieping geselecteerd"}</h4><p>{setupStatus(activeRooms.length, assetStatus())}</p></div><button disabled={!selectedFloor} onClick={() => setDialog({ kind: "room" })}>Kamer toevoegen</button></div><div className="woning-summary-strip"><span>{assetStatus()}</span><span>{activeRooms.length ? "Bruikbaar" : "Niet gestart"}</span><span>Plattegronden beheren komt later</span></div>{selectedFloor && activeRooms.length === 0 ? <div className="woning-empty"><p>Nog geen kamers op deze verdieping.</p><button onClick={() => setDialog({ kind: "room" })}>Kamer toevoegen</button></div> : null}<div className="woning-scroll-list" role="list" aria-label="Kamers op geselecteerde verdieping">{activeRooms.map((room, index) => <RoomCard key={room.id} room={room} config={climate[room.id ?? ""]} onEdit={() => setDialog({ kind: "room", room })} onMove={() => setDialog({ kind: "move", room })} onArchive={() => setDialog({ kind: "confirm", title: "Kamer archiveren", action: "Archiveren", body: "De kamer verdwijnt uit de actieve lijst, maar blijft herstelbaar.", run: () => runAction(() => archiveRoom(room.id ?? ""), "Kamer is gearchiveerd.", "Kamer archiveren lukt niet.") })} onDelete={() => setDialog({ kind: "confirm", title: "Kamer verwijderen", action: "Verwijderen", body: "Verwijderen kan alleen als de backend dit toestaat. Gebruik archiveren als je de kamer later wilt herstellen.", run: () => runAction(() => deleteRoom(room.id ?? ""), "Kamer is verwijderd.", "Kamer verwijderen lukt niet.") })} onTop={() => shiftRoom(room, 0)} onUp={() => shiftRoom(room, index - 1)} onDown={() => shiftRoom(room, index + 1)} onBottom={() => shiftRoom(room, activeRooms.length - 1)} busy={busy} />)}</div>{archivedRooms.length ? <Archived title="Gearchiveerde kamers">{archivedRooms.map((room) => <button key={room.id} onClick={() => runAction(() => restoreRoom(room.id ?? "").then(() => undefined), "Kamer is hersteld.", "Kamer herstellen lukt niet.")}>Herstellen: {room.name}</button>)}</Archived> : null}</main>
    </div>
    {dialog?.kind === "floor" ? <FloorForm floor={dialog.floor} busy={busy} onCancel={() => setDialog(null)} onSave={(name: string) => runAction(() => dialog.floor ? updateFloor(dialog.floor, name).then(() => undefined) : createFloor(name).then(() => undefined), dialog.floor ? "Verdieping is bijgewerkt." : "Verdieping is toegevoegd.", "Verdieping opslaan lukt niet.")} /> : null}
    {dialog?.kind === "room" && selectedFloor ? <RoomForm room={dialog.room} members={members} busy={busy} onCancel={() => setDialog(null)} onSave={(name: string, type: RoomType, member?: string) => runAction(() => dialog.room ? updateRoom(dialog.room, name, type, member).then(() => undefined) : createRoom(selectedFloor.id ?? "", name, type, member).then(() => undefined), dialog.room ? "Kamer is bijgewerkt." : "Kamer is toegevoegd.", "Kamer opslaan lukt niet.")} /> : null}
    {dialog?.kind === "move" ? <MoveForm room={dialog.room} floors={activeFloors.filter((floor) => floor.id !== dialog.room.floorId)} busy={busy} onCancel={() => setDialog(null)} onMove={(floorId: string) => runAction(() => moveRoom(dialog.room.id ?? "", floorId).then(() => undefined), "Kamer is verplaatst.", "De kamer kan niet naar deze verdieping worden verplaatst.", floorId)} /> : null}
    {dialog?.kind === "confirm" ? <ConfirmDialog dialog={dialog} busy={busy} onCancel={() => setDialog(null)} /> : null}
  </section>;
}

function FloorCard({ floor, selected, busy, onSelect, onEdit, onArchive, onDelete, onTop, onUp, onDown, onBottom }: any) { return <article className={`woning-item ${selected ? "selected" : ""}`} role="listitem"><button className="woning-select" onClick={onSelect}><strong>{floor.name}</strong><span>{floor.activeRoomCount ?? 0} kamers</span></button><div className="woning-actions"><button disabled={busy} onClick={onEdit}>Naam wijzigen</button><button disabled={busy} onClick={onTop}>Bovenaan</button><button disabled={busy} onClick={onUp}>Omhoog</button><button disabled={busy} onClick={onDown}>Omlaag</button><button disabled={busy} onClick={onBottom}>Onderaan</button><button disabled={busy} onClick={onArchive}>Archiveren</button><button disabled={busy} onClick={onDelete}>Verwijderen</button></div></article>; }
function RoomCard({ room, config, busy, onEdit, onMove, onArchive, onDelete, onTop, onUp, onDown, onBottom }: any) { return <article className="woning-item woning-room" role="listitem"><div><h5>{room.name}</h5><p>{roomTypeLabels[room.roomType as RoomType] ?? "Anders"}{room.familyMember?.name ? ` · ${room.familyMember.name}` : ""}</p><p>{climateStatus(config)}</p></div><div className="woning-actions"><button disabled={busy} onClick={onEdit}>Bewerken</button><button disabled={busy} onClick={onMove}>Verplaatsen</button><button disabled={busy} onClick={onTop}>Bovenaan</button><button disabled={busy} onClick={onUp}>Omhoog</button><button disabled={busy} onClick={onDown}>Omlaag</button><button disabled={busy} onClick={onBottom}>Onderaan</button><button disabled={busy} onClick={onArchive}>Archiveren</button><button disabled={busy} onClick={onDelete}>Verwijderen</button></div></article>; }
function FloorForm({ floor, busy, onCancel, onSave }: any) { const [name, setName] = useState(floor?.name ?? ""); return <Dialog title={floor ? "Verdieping bewerken" : "Verdieping toevoegen"} onCancel={onCancel}><form onSubmit={(e) => { e.preventDefault(); if (name.trim()) void onSave(name.trim()); }}><label className="settings-file-field"><span>Naam verdieping</span><input autoFocus value={name} onChange={(e) => setName(e.target.value)} required /></label><Actions busy={busy} onCancel={onCancel} save={floor ? "Opslaan" : "Verdieping toevoegen"} /></form></Dialog>; }
function RoomForm({ room, members, busy, onCancel, onSave }: any) { const [name, setName] = useState(room?.name ?? ""); const [type, setType] = useState<RoomType>(room?.roomType ?? RoomType.Other); const [member, setMember] = useState(room?.familyMember?.id ?? ""); return <Dialog title={room ? "Kamer bewerken" : "Kamer toevoegen"} onCancel={onCancel}><form onSubmit={(e) => { e.preventDefault(); if (name.trim()) void onSave(name.trim(), type, member || undefined); }}><label className="settings-file-field"><span>Naam kamer</span><input autoFocus value={name} onChange={(e) => setName(e.target.value)} required /></label><label className="settings-file-field"><span>Kamertype</span><select value={type} onChange={(e) => setType(Number(e.target.value) as RoomType)}>{roomTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label className="settings-file-field"><span>Gezinslid (optioneel)</span><select value={member} onChange={(e) => setMember(e.target.value)}><option value="">Geen gezinslid</option>{members.map((m: FamilyMember) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label><Actions busy={busy} onCancel={onCancel} save={room ? "Kamer opslaan" : "Kamer toevoegen"} /></form></Dialog>; }
function MoveForm({ room, floors, busy, onCancel, onMove }: any) { const [floorId, setFloorId] = useState(floors[0]?.id ?? ""); return <Dialog title="Kamer verplaatsen" onCancel={onCancel}><form onSubmit={(e) => { e.preventDefault(); void onMove(floorId); }}><p>Verplaats {room.name} naar een andere verdieping. De kamer behoudt dezelfde identiteit.</p><label className="settings-file-field"><span>Nieuwe verdieping</span><select value={floorId} onChange={(e) => setFloorId(e.target.value)}>{floors.map((f: Floor) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label><Actions busy={busy} onCancel={onCancel} save="Verplaatsen" /></form></Dialog>; }
function ConfirmDialog({ dialog, busy, onCancel }: any) { return <Dialog title={dialog.title} onCancel={onCancel}><p>{dialog.body}</p><Actions busy={busy} onCancel={onCancel} save={dialog.action} onSave={dialog.run} /></Dialog>; }
function Dialog({ title, onCancel, children }: any) { return <div className="settings-surface-backdrop" role="presentation"><section className="settings-surface-dialog woning-dialog" role="dialog" aria-modal="true" aria-label={title}><header className="settings-surface-header"><h3>{title}</h3><button onClick={onCancel}>Sluiten</button></header><div className="settings-surface-body">{children}</div></section></div>; }
function Actions({ busy, onCancel, save, onSave }: any) { return <div className="settings-surface-actions"><button type="button" onClick={onCancel}>Annuleren</button><button disabled={busy} onClick={onSave} type={onSave ? "button" : "submit"}>{busy ? "Opslaan…" : save}</button></div>; }
function Archived({ title, children }: any) { return <section className="woning-archived" aria-label={title}><h5>{title}</h5>{children}</section>; }
function byOrder(a: { sortOrder?: number; name?: string }, b: { sortOrder?: number; name?: string }) { return (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || (a.name ?? "").localeCompare(b.name ?? "", "nl-NL"); }
function moveId(ids: string[], id: string, target: number) { const next = ids.filter(Boolean).filter((x) => x !== id); next.splice(Math.max(0, Math.min(target, next.length)), 0, id); return next; }
function climateStatus(config?: RoomClimateConfiguration | null) { if (!config?.isConfigured) return "Klimaat nog niet ingesteld"; if (!config.isClimateEnabled) return "Klimaat uitgeschakeld"; if (config.heatingPolicyIntent === 1) return "Verwarming alleen uitlezen"; if (config.heatingPolicyIntent === 2) return "Tijdelijke bediening gewenst"; if (config.isBedtimeRelevant) return "Bedtijd meegenomen"; return "Klimaat ingesteld"; }
function assetStatus() { return "Nog geen plattegrond"; }
function setupStatus(roomCount: number, plan: string) { if (!roomCount) return "Niet gestart"; return plan === "Nog geen plattegrond" ? "Bruikbaar zonder plattegrond" : "In uitvoering"; }
