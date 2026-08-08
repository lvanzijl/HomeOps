import { useState } from "react";
import { type FloorPlanAssetDto } from "../api/homeOpsApiClient";
import type { Floor } from "./woningApi";
import {
  activateFloorPlan,
  acceptedFloorPlanExtensions,
  friendlyFloorPlanUploadError,
  maxFloorPlanUploadBytes,
  uploadFloorPlan,
  validateFloorPlanFile,
} from "./floorPlanUploadApi";
import { startReplacementReview } from "./floorPlanReplacementReviewApi";

interface Props {
  floor: Floor;
  activeAsset: FloorPlanAssetDto | null;
  onClose: () => void;
  onChanged: () => Promise<void>;
  onOpenEditor: () => void;
  onOpenReplacementReview: () => void;
}

type PendingAction = "upload" | "activate" | "review" | null;

export function FloorPlanUploadDialog({ floor, activeAsset, onClose, onChanged, onOpenEditor, onOpenReplacementReview }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState<FloorPlanAssetDto | null>(null);
  const [activated, setActivated] = useState(false);
  const [pending, setPending] = useState<PendingAction>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("Kies een plattegrondbestand om te controleren.");
  const validation = file ? validateFloorPlanFile(file) : [];
  const phone = typeof window !== "undefined" && window.matchMedia?.("(max-width: 640px)").matches;

  async function upload() {
    if (!file || validation.length) return;
    setPending("upload");
    setError(null);
    try {
      const asset = await uploadFloorPlan(floor.id ?? "", file);
      setUploaded(asset);
      setMessage("Upload gecontroleerd. De veilige afgeleide afbeelding is klaar voor beoordeling.");
      await onChanged();
    } catch (err) {
      setError(friendlyFloorPlanUploadError(err, "Uploaden lukt niet. Het gekozen bestand blijft geselecteerd voor een nieuwe poging."));
    } finally {
      setPending(null);
    }
  }

  async function activate() {
    if (!uploaded?.id) return;
    setPending("activate");
    setError(null);
    try {
      await activateFloorPlan(floor.id ?? "", uploaded.id);
      setActivated(true);
      setMessage("De eerste plattegrond is actief. Kamergrenzen kun je als volgende stap instellen.");
      await onChanged();
    } catch (err) {
      setError(friendlyFloorPlanUploadError(err, "Activeren lukt niet. De gevalideerde upload blijft bewaard."));
    } finally {
      setPending(null);
    }
  }

  async function beginReplacementReview() {
    if (!uploaded?.id) return;
    setPending("review");
    setError(null);
    try {
      await startReplacementReview(floor.id ?? "", uploaded.id);
      await onChanged();
      onClose();
      onOpenReplacementReview();
    } catch (err) {
      setError(friendlyFloorPlanUploadError(err, "De vervangingscontrole starten lukt niet. De upload blijft beschikbaar voor een nieuwe poging."));
    } finally {
      setPending(null);
    }
  }

  function openEditor() {
    onClose();
    onOpenEditor();
  }

  return <div className="settings-surface-backdrop" role="presentation">
    <section className="settings-surface-dialog woning-dialog floor-plan-upload-dialog" role="dialog" aria-modal="true" aria-label={`Plattegrond uploaden voor ${floor.name}`}>
      <header className="settings-surface-header floor-plan-upload-head">
        <div><h3>Plattegrond uploaden</h3><p>{floor.name}</p></div>
        <button disabled={pending !== null} onClick={onClose}>Sluiten</button>
      </header>
      <div className="settings-surface-body floor-plan-upload-body">
        <section className="floor-plan-upload-guidance">
          <h4>Veilige bestandscontrole</h4>
          <p>SVG, PNG, JPG of JPEG, maximaal {Math.round(maxFloorPlanUploadBytes / 1024 / 1024)} MiB. De server controleert het echte bestandstype, afmetingen, volledigheid en onveilige SVG-inhoud.</p>
          <p className="muted">Uploaden kan op een telefoon. Kamergrenzen controleren en tekenen werkt beter op een groter scherm.</p>
          {phone ? <p className="floor-plan-phone-note" role="status">Je gebruikt een smal scherm; rond grenscontrole later af op een groter scherm.</p> : null}
        </section>

        {!uploaded ? <section className="floor-plan-file-step">
          <label className="settings-file-field">
            <span>Plattegrondbestand</span>
            <input
              type="file"
              accept={acceptedFloorPlanExtensions.join(",")}
              disabled={pending !== null}
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setError(null);
                setMessage("Controleer het gekozen bestand en start daarna de upload.");
              }}
            />
          </label>
          {file ? <dl className="floor-plan-file-facts"><div><dt>Bestand</dt><dd>{file.name}</dd></div><div><dt>Grootte</dt><dd>{formatBytes(file.size)}</dd></div></dl> : null}
          {validation.length ? <div className="floor-plan-upload-error" role="alert"><strong>Dit bestand kan nog niet worden geüpload.</strong><ul>{validation.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
        </section> : <FloorPlanPreview asset={uploaded} />}

        <p role={error ? "alert" : "status"} className={error ? "floor-plan-upload-error" : "floor-plan-upload-status"}>{error ?? message}</p>
      </div>
      <footer className="settings-surface-actions floor-plan-upload-actions">
        <button disabled={pending !== null} onClick={onClose}>{uploaded ? "Later afronden" : "Annuleren"}</button>
        {!uploaded ? <button disabled={!file || validation.length > 0 || pending !== null} onClick={() => void upload()}>{pending === "upload" ? "Uploaden…" : "Uploaden en controleren"}</button> : null}
        {uploaded && !activeAsset && !activated ? <button disabled={pending !== null} onClick={() => void activate()}>{pending === "activate" ? "Activeren…" : "Plattegrond activeren"}</button> : null}
        {uploaded && !activeAsset && activated ? <button disabled={pending !== null || phone} onClick={openEditor}>Kamergrenzen tekenen</button> : null}
        {uploaded && activeAsset ? <button disabled={pending !== null} onClick={() => void beginReplacementReview()}>{pending === "review" ? "Beoordeling starten…" : "Verder naar vervangingscontrole"}</button> : null}
      </footer>
    </section>
  </div>;
}

function FloorPlanPreview({ asset }: { asset: FloorPlanAssetDto }) {
  return <section className="floor-plan-upload-preview" aria-label="Gecontroleerde plattegrond">
    <div><h4>Veilige afgeleide afbeelding</h4><p>De bronupload is niet actief totdat je de volgende stap bevestigt.</p></div>
    <img src={asset.derivativeUrl ?? `/api/floor-plan-assets/${asset.id}/derivative`} alt={`Voorbeeld van ${asset.originalFilename ?? "de plattegrond"}`} />
    <dl className="floor-plan-file-facts">
      <div><dt>Bestand</dt><dd>{asset.originalFilename}</dd></div>
      <div><dt>Type</dt><dd>{friendlyMediaType(asset.detectedMediaType)}</dd></div>
      <div><dt>Afmetingen</dt><dd>{asset.sourceWidth && asset.sourceHeight ? `${asset.sourceWidth} × ${asset.sourceHeight}` : `${asset.coordinateBasisWidth} × ${asset.coordinateBasisHeight}`}</dd></div>
      <div><dt>Servercontrole</dt><dd>{asset.validationSummary || "Bestand is gevalideerd."}</dd></div>
    </dl>
  </section>;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MiB`;
}

function friendlyMediaType(mediaType?: string) {
  if (mediaType === "image/svg+xml") return "SVG";
  if (mediaType === "image/png") return "PNG";
  if (mediaType === "image/jpeg") return "JPEG";
  return mediaType || "Onbekend";
}
