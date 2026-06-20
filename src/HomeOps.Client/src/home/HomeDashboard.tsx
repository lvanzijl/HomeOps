import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { loadCalendarAgendaData } from '../agenda/calendarEventsApi';
import { formatEventTime, hydrateAgendaEvents } from '../agenda/agendaUtils';
import { demoReadOnlyEvents, demoReadOnlyEventSources } from '../demo/demoAgendaData';
import type { EventSource, NormalizedEvent } from '../events/eventSourceModel';
import { loadListSummaries, type ListSummary } from '../shopping/listsSummaryApi';
import { FamilyAvatar } from './FamilyAvatar';
import type { FamilyMember } from './familyMembers';

interface HomeDashboardProps {
  members: readonly FamilyMember[];
  onNavigate: (destination: 'agenda' | 'lists') => void;
  onSelectFamilyMember: (memberId: string) => void;
}

type AgendaBucket = 'Today' | 'Tomorrow' | 'Later / Next';
type AgendaSummaryItem = ReturnType<typeof hydrateAgendaEvents>[number] & { bucket: AgendaBucket };

const visibleAgendaLimit = 5;
const visibleListLimit = 4;

const agendaBucketOrder: readonly AgendaBucket[] = ['Today', 'Tomorrow', 'Later / Next'];

export function HomeDashboard({ members, onNavigate, onSelectFamilyMember }: HomeDashboardProps) {
  const [now, setNow] = useState(() => new Date());
  const [events, setEvents] = useState<NormalizedEvent[]>([]);
  const [sources, setSources] = useState<EventSource[]>([...demoReadOnlyEventSources]);
  const [lists, setLists] = useState<ListSummary[]>([]);
  const [agendaError, setAgendaError] = useState<string | null>(null);
  const [listsError, setListsError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let ignore = false;
    loadCalendarAgendaData()
      .then((data) => {
        if (ignore) return;
        setSources([...data.sources, ...demoReadOnlyEventSources]);
        setEvents([...data.events, ...demoReadOnlyEvents]);
        setAgendaError(null);
      })
      .catch(() => {
        if (!ignore) setAgendaError('Agenda summary could not be loaded.');
      });
    loadListSummaries()
      .then((data) => {
        if (ignore) return;
        setLists(data);
        setListsError(null);
      })
      .catch(() => {
        if (!ignore) setListsError('Lists summary could not be loaded.');
      });
    return () => { ignore = true; };
  }, []);

  const agendaItems = useMemo(() => buildAgendaSummary(events, sources, now), [events, sources, now]);
  const visibleAgenda = agendaItems.slice(0, visibleAgendaLimit);
  const agendaGroups = groupAgendaItems(visibleAgenda);
  const hiddenAgendaCount = Math.max(0, agendaItems.length - visibleAgenda.length);
  const activeListItems = lists.flatMap((list) => list.activeItems.map((item) => ({ ...item, listId: list.id, listName: list.name })));
  const visibleListItems = activeListItems.slice(0, visibleListLimit);
  const hiddenListCount = Math.max(0, activeListItems.length - visibleListItems.length);
  const primaryListName = getPrimaryListName(lists);

  return (
    <section className="home-dashboard" aria-label="Home dashboard">
      <header className="home-hero">
        <div className="home-date-card" aria-label="Home date and time">
          <p className="eyebrow">Today</p>
          <h2>{now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
          <p className="home-time" aria-label="Current time">{now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</p>
          <p className="weather-placeholder">Weather ready when connected</p>
        </div>
        <section className="family-strip" aria-label="Family Members">
          {members.map((member) => (
            <button className="family-chip" key={member.id} type="button" style={{ '--member-color': member.displayColor } as CSSProperties} onClick={() => onSelectFamilyMember(member.id)} aria-label={`Open ${member.name} family member page`}>
              <FamilyAvatar member={member} />
              <strong>{member.name}</strong>
            </button>
          ))}
        </section>
        <section className="quick-capture" aria-label="Quick capture">
          <button type="button" onClick={() => onNavigate('agenda')}>+ Event</button>
          <button type="button" onClick={() => onNavigate('lists')}>+ List item</button>
        </section>
      </header>

      <div className="home-summary-grid">
        <article className="home-summary-card agenda-summary" onClick={() => onNavigate('agenda')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onNavigate('agenda')} aria-label="Agenda summary">
          <CardHeader title="Agenda" action="Open agenda" meta={`${visibleAgenda.length} showing`} />
          {agendaError ? <p role="alert">{agendaError}</p> : null}
          <div className="agenda-group-list">
            {agendaGroups.map((group) => (
              <section className="agenda-summary-group" key={group.bucket} aria-label={group.bucket}>
                <h4>{group.bucket}</h4>
                <ul className="home-summary-list">
                  {group.items.map((event) => (
                    <li key={event.id}>
                      <span>{event.title}</span>
                      <small>{formatEventTime(event)}</small>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          {visibleAgenda.length === 0 && !agendaError ? <p className="shopping-empty">Nothing scheduled for today or tomorrow.</p> : null}
          {hiddenAgendaCount > 0 ? <button className="more-link" type="button" onClick={() => onNavigate('agenda')}>+{hiddenAgendaCount} more</button> : null}
        </article>

        <article className="home-summary-card lists-summary" onClick={() => onNavigate('lists')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onNavigate('lists')} aria-label="Lists summary">
          <CardHeader title={primaryListName ? `${primaryListName} lists` : 'Lists'} action="Open lists" meta={`${activeListItems.length} active`} />
          {listsError ? <p role="alert">{listsError}</p> : null}
          <ul className="home-summary-list">
            {visibleListItems.map((item) => (
              <li key={`${item.listId}-${item.id}`}>
                <strong>{item.listName}</strong>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
          {visibleListItems.length === 0 && !listsError ? <p className="shopping-empty">No active list items.</p> : null}
          {hiddenListCount > 0 ? <button className="more-link" type="button" onClick={() => onNavigate('lists')}>+{hiddenListCount} more</button> : null}
          <p className="home-context-note">Shared for {members.length} household members.</p>
        </article>
      </div>
    </section>
  );
}

function CardHeader({ title, action, meta }: { title: string; action: string; meta?: string }) {
  return <div className="home-card-header"><div><h3>{title}</h3>{meta ? <small>{meta}</small> : null}</div><span>{action}</span></div>;
}

function buildAgendaSummary(events: NormalizedEvent[], sources: EventSource[], now: Date): AgendaSummaryItem[] {
  const hydrated = hydrateAgendaEvents(events, sources).filter((event) => new Date(event.startsAt) >= startOfDay(now));
  const tomorrow = addDays(startOfDay(now), 1);
  const afterTomorrow = addDays(startOfDay(now), 2);
  return hydrated
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .map((event) => ({ ...event, bucket: new Date(event.startsAt) < tomorrow ? 'Today' : new Date(event.startsAt) < afterTomorrow ? 'Tomorrow' : 'Later / Next' }));
}

function groupAgendaItems(items: AgendaSummaryItem[]) {
  return agendaBucketOrder
    .map((bucket) => ({ bucket, items: items.filter((item) => item.bucket === bucket) }))
    .filter((group) => group.items.length > 0);
}

function getPrimaryListName(lists: ListSummary[]) {
  return lists.find((list) => ['shopping', 'boodschappen'].includes(list.name.trim().toLowerCase()))?.name ?? lists[0]?.name;
}

function startOfDay(date: Date) { const next = new Date(date); next.setHours(0, 0, 0, 0); return next; }
function addDays(date: Date, days: number) { const next = new Date(date); next.setDate(next.getDate() + days); return next; }
