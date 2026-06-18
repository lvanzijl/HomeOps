import { useMemo, useState } from 'react';
import { groupEventsByDay, groupEventsByMonth, filterEventsBySource, formatEventTime, hydrateAgendaEvents } from '../../agenda/agendaUtils';
import { useAgendaLayerSettings } from '../../agenda/layerSettings';
import { demoEvents, demoEventSources, demoToday } from '../../demo/demoAgendaData';
import type { WidgetRenderProps } from '../WidgetRenderer';

type AgendaView = 'week' | 'months';

export function AgendaWidget({ instance }: WidgetRenderProps) {
  const [activeView, setActiveView] = useState<AgendaView>('week');
  const { settings, setSourceEnabled } = useAgendaLayerSettings(demoEventSources);

  const selectedSources = settings[activeView].enabledSourceIds;

  const agendaEvents = useMemo(() => {
    const filteredEvents = filterEventsBySource(demoEvents, selectedSources);
    return hydrateAgendaEvents(filteredEvents, demoEventSources);
  }, [selectedSources]);

  const weekGroups = useMemo(() => groupEventsByDay(agendaEvents, demoToday, 7), [agendaEvents]);
  const monthGroups = useMemo(() => groupEventsByMonth(agendaEvents), [agendaEvents]);

  return (
    <article className="widget-card agenda-widget" aria-label={instance.title}>
      <div className="agenda-header">
        <div>
          <p className="widget-type">Agenda Widget</p>
          <h3>{instance.title}</h3>
        </div>
        <div className="agenda-view-toggle" aria-label="Agenda view selector">
          <button aria-pressed={activeView === 'week'} onClick={() => setActiveView('week')} type="button">
            Week View
          </button>
          <button aria-pressed={activeView === 'months'} onClick={() => setActiveView('months')} type="button">
            Months View
          </button>
        </div>
      </div>

      <fieldset className="source-selector">
        <legend>Sources</legend>
        {demoEventSources.map((source) => (
          <label key={source.id}>
            <input
              checked={selectedSources[source.id] ?? false}
              onChange={(event) => setSourceEnabled(activeView, source.id, event.target.checked)}
              type="checkbox"
            />
            <span className="source-color" style={{ backgroundColor: source.color.hex }} aria-hidden="true" />
            {source.name}
          </label>
        ))}
      </fieldset>

      {activeView === 'week' ? <WeekView groups={weekGroups} /> : <MonthsView groups={monthGroups} />}
    </article>
  );
}

function WeekView({ groups }: { groups: ReturnType<typeof groupEventsByDay> }) {
  return (
    <section className="agenda-view" aria-label="Week View">
      {groups.map((group) => (
        <div className="agenda-group" key={group.date}>
          <h4>{group.label}</h4>
          <AgendaEventList events={group.events} />
        </div>
      ))}
    </section>
  );
}

function MonthsView({ groups }: { groups: ReturnType<typeof groupEventsByMonth> }) {
  return (
    <section className="agenda-view agenda-months-view" aria-label="Months View">
      {groups.map((group) => (
        <div className="agenda-group" key={group.month}>
          <h4>{group.label}</h4>
          <AgendaEventList events={group.events} />
        </div>
      ))}
    </section>
  );
}

function AgendaEventList({ events }: { events: ReturnType<typeof hydrateAgendaEvents> }) {
  return (
    <ul className="agenda-event-list">
      {events.map((event) => (
        <li className="agenda-event" key={event.id}>
          <span className="source-color" style={{ backgroundColor: event.source.color.hex }} aria-hidden="true" />
          <span>
            <strong>{event.title}</strong>
            <small>
              {formatEventTime(event)} · {event.source.name} · {event.editable ? 'Writable' : 'Read-only'}
            </small>
          </span>
        </li>
      ))}
    </ul>
  );
}
