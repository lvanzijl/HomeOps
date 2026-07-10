import { useEffect, useState } from "react";
import { FamilyBoardIcon } from "../design";
import { getHelpfulMomentIconName, HomeOpsIcon } from "../icons/homeOpsIcons";
import { CardHeader, ReviewCard } from "../components/cards/Card";
import {
  archiveIndividualGoal,
  type MotivationFamilyGoal,
  type MotivationIndividualGoal,
} from "../motivationData";
import {
  archiveTask,
  keepTaskActive,
  moveTaskToSomeday,
} from "../tasks/tasksApi";
import {
  archiveFamilyGoalForReset,
  loadWeeklyReset,
  type WeeklyReset,
} from "./weeklyResetApi";

export function WeeklyResetPage() {
  const [reset, setReset] = useState<WeeklyReset | null>(null);
  const [status, setStatus] = useState("Weekritueel laden…");
  const [skipped, setSkipped] = useState(false);
  useEffect(() => {
    let ignore = false;
    loadWeeklyReset()
      .then((data) => {
        if (!ignore) {
          setReset(data);
          setStatus("Klaar voor jullie check-in.");
        }
      })
      .catch(() => {
        if (!ignore) setStatus("Het weekritueel kon niet worden geladen.");
      });
    return () => {
      ignore = true;
    };
  }, []);
  async function refresh(message: string) {
    setStatus(message);
    setReset(await loadWeeklyReset());
  }
  if (skipped)
    return (
      <section className="weekly-reset-page weekly-reset-skipped">
        <p className="eyebrow">Familiecheck</p>
        <h2>Vandaag slaan we over</h2>
        <p>Prima. Jullie laten het deze week zoals het is en kunnen later altijd terugkomen.</p>
        <button type="button" onClick={() => setSkipped(false)}>
          Open het weekritueel weer
        </button>
      </section>
    );
  if (!reset)
    return (
      <section className="weekly-reset-page">
        <p>{status}</p>
      </section>
    );

  const completedCount = reset.contributionRecap.completedTaskCount;
  const reviewCount = reset.reviewCandidates.length;
  const resetCount = reset.shoppingReviewCandidates.length + (reset.familyGoal ? 1 : 0) + reset.individualGoals.length;
  const openChoiceCount = reviewCount + reset.shoppingReviewCandidates.length + (reset.familyGoal ? 1 : 0) + reset.individualGoals.length;
  const isReadyForNextWeek = openChoiceCount === 0;

  return (
    <section className="weekly-reset-page" aria-labelledby="weekly-reset-title">
      <header className="weekly-reset-hero">
        <div className="weekly-reset-hero-copy">
          <p className="eyebrow">Familiecheck</p>
          <h2 id="weekly-reset-title">Zijn we klaar voor volgende week?</h2>
          <p>Kijk samen terug, kies wat meegaat en rond af wat niet meer past.</p>
        </div>
        <button
          type="button"
          className="secondary-action"
          onClick={() => setSkipped(true)}
        >
          Deze week overslaan
        </button>
      </header>

      <section className="reset-readiness-grid" aria-label="Overzicht van het weekritueel">
        <RitualMetricCard value={completedCount} label="afgeronde taken" description="Even stilstaan bij wat deze week lukte." />
        <RitualMetricCard value={reviewCount} label="keuzes voor volgende week" description="Taken die samen een rustige keuze vragen." />
        <RitualMetricCard value={resetCount} label="gezinsafspraken" description="Doelen en lijstjes om samen kort langs te lopen." />
      </section>

      <section className="reset-intention-card" aria-label="Wat gebeurt er tijdens het weekritueel">
        <div>
          <p className="eyebrow">Waar letten jullie op?</p>
          <h3>Kies wat nog helpt</h3>
        </div>
        <ul>
          <li>Begin bij wat gelukt is en geef daar even aandacht aan.</li>
          <li>Kies per open taak: meenemen, later bewaren of loslaten.</li>
          <li>Check of gezins- en kinddoelen nog passen bij komende week.</li>
          <li>Loop boodschappenlijstjes kort langs en houd alleen over wat helpt.</li>
        </ul>
      </section>

      <section className="reset-grid">
        <ReviewCard className="ritual-card">
          <CardHeader
            className="reset-card-heading"
            eyebrow="Meenemen"
            title="Wat schuift door?"
            actions={`${reset.reviewCandidates.length} keuze${reset.reviewCandidates.length === 1 ? "" : "s"}`}
          />
          <p className="ritual-card-intro">Kies samen of deze taken nog bij komende week horen.</p>
          {reset.reviewCandidates.length === 0 ? (
            <p className="ritual-empty">Geen losse taken die vandaag een keuze nodig hebben.</p>
          ) : (
            reset.reviewCandidates.map((task) => (
              <div className="reset-row ritual-decision-row" key={task.id}>
                <strong>{task.title}</strong>
                <span>Samen kiezen: mee, later of loslaten.</span>
                <div className="reset-actions">
                  <button
                    type="button"
                    onClick={() =>
                      keepTaskActive(task.id).then(() =>
                        refresh("Taak blijft actief voor volgende week."),
                      )
                    }
                  >
                    Gaat mee
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      moveTaskToSomeday(task.id).then(() =>
                        refresh("Taak staat rustig bij later."),
                      )
                    }
                  >
                    Later bewaren
                  </button>
                  <button
                    type="button"
                    className="secondary-action"
                    onClick={() =>
                      archiveTask(task.id).then(() => refresh("Taak is gearchiveerd."))
                    }
                  >
                    Niet meer nodig
                  </button>
                </div>
              </div>
            ))
          )}
        </ReviewCard>
        <GoalCard
          title="Gezinsdoel"
          goal={reset.familyGoal}
          onArchive={(id) =>
            archiveFamilyGoalForReset(id).then(() =>
              refresh("Gezinsdoel is gearchiveerd."),
            )
          }
        />
        <ReviewCard className="ritual-card">
          <CardHeader
            className="reset-card-heading"
            eyebrow="Blijft kloppen"
            title="Kinddoelen"
            actions={`${reset.individualGoals.length} actief`}
          />
          <p className="ritual-card-intro">Bekijk samen of ieder kind nog een passend doel heeft.</p>
          {reset.individualGoals.length === 0 ? (
            <p className="ritual-empty">Geen actieve kinddoelen om vandaag te bespreken.</p>
          ) : (
            reset.individualGoals.map((goal) => (
              <IndividualGoalRow
                goal={goal}
                key={goal.id}
                onArchive={(id) =>
                  archiveIndividualGoal(id).then(() =>
                    refresh("Kinddoel is gearchiveerd."),
                  )
                }
              />
            ))
          )}
        </ReviewCard>
        <ReviewCard className="ritual-card">
          <CardHeader
            className="reset-card-heading"
            eyebrow="Opfrissen"
            title="Boodschappen"
            actions={`${reset.shoppingReviewCandidates.length} lijst${reset.shoppingReviewCandidates.length === 1 ? "" : "en"}`}
          />
          <p className="ritual-card-intro">Loop samen langs welke lijstjes nog passen bij komende week.</p>
          {reset.shoppingReviewCandidates.length === 0 ? (
            <p className="ritual-empty">Geen boodschappenlijstjes die om aandacht vragen.</p>
          ) : (
            reset.shoppingReviewCandidates.map((list) => (
              <div className="reset-row" key={list.id}>
                <strong>{list.name}</strong>
                <span>{list.itemCount} items · kijk of deze lijst nog past bij komende week</span>
              </div>
            ))
          )}
        </ReviewCard>
        <ReviewCard className="recap-card ritual-card">
          <CardHeader
            className="reset-card-heading"
            eyebrow="Vieren"
            title="Wat is gelukt?"
            actions={`${reset.contributionRecap.completedTaskCount} taken · ${reset.contributionRecap.helpfulMomentCount} momenten`}
          />
          <p className="ritual-card-intro">Begin positief: dit heeft jullie gezin deze week al gedragen.</p>
          {reset.contributionRecap.helpfulMoments.length === 0 && reset.contributionRecap.celebrationMemories.length === 0 ? (
            <p className="ritual-empty">Geen helpmomenten of vieringen in deze terugblik.</p>
          ) : null}
          {reset.contributionRecap.helpfulMoments.map((moment) => (
            <div className="reset-row helpful-reset-row" key={moment.id}>
              <strong>
                <HomeOpsIcon
                  name={getHelpfulMomentIconName(moment.recognitionTag)}
                />
                {moment.familyMemberName}: {moment.title}
              </strong>
              {moment.description ? <span>{moment.description}</span> : null}
            </div>
          ))}
          {reset.contributionRecap.celebrationMemories.map((memory) => (
            <div className="reset-row" key={memory.familyGoalId}>
              <strong>Gevierd: {memory.title}</strong>
              {memory.description ? <span>{memory.description}</span> : null}
            </div>
          ))}
        </ReviewCard>
      </section>
      <section className={`reset-completion-card${isReadyForNextWeek ? " is-complete" : ""}`} aria-label="Afronding van het weekritueel">
        <div>
          <p className="eyebrow">Afronden</p>
          <h3>{isReadyForNextWeek ? "Jullie zijn klaar voor volgende week" : "Rond samen af wanneer de keuzes helder zijn"}</h3>
          <p>
            {isReadyForNextWeek
              ? "Alles wat aandacht vroeg is rustig bekeken. De week mag dicht; jullie kunnen met een helder hoofd aan de volgende beginnen."
              : "Neem nog één rustig rondje langs de open keuzes. Daarna is het ritueel klaar en blijft alles bewust gekozen."}
          </p>
        </div>
        <span className="reset-completion-badge" aria-hidden="true"><FamilyBoardIcon name={isReadyForNextWeek ? "status.ready" : "status.pending"} size={32} /></span>
      </section>
      <p role="status" className="reset-status">{status}</p>
    </section>
  );
}

function RitualMetricCard({ value, label, description }: { value: number; label: string; description: string }) {
  return (
    <article className="ritual-metric-card">
      <strong>{value}</strong>
      <span>{label}</span>
      <p>{description}</p>
    </article>
  );
}

function GoalCard({
  title,
  goal,
  onArchive,
}: {
  title: string;
  goal?: MotivationFamilyGoal;
  onArchive: (id: string) => void;
}) {
  return (
    <ReviewCard className="ritual-card">
      <CardHeader
        className="reset-card-heading"
        eyebrow="Richting"
        title={title}
        actions={goal ? "loopt door" : "geen actief doel"}
      />
      <p className="ritual-card-intro">Bespreek of dit gezinsdoel nog past bij komende week.</p>
      {!goal ? (
        <p className="ritual-empty">Geen actief gezinsdoel om vandaag te bespreken.</p>
      ) : (
        <div className="reset-row ritual-decision-row">
          <strong>{goal.title}</strong>
          <span>
            {goal.currentProgress} / {goal.targetCount} {goal.unitLabel} · kijk samen of dit doel nog past
          </span>
          <div className="reset-actions">
            <button type="button">Gaat mee</button>
            <button
              type="button"
              className="secondary-action"
              onClick={() => onArchive(goal.id)}
            >
              Afronden
            </button>
          </div>
        </div>
      )}
    </ReviewCard>
  );
}
function IndividualGoalRow({
  goal,
  onArchive,
}: {
  goal: MotivationIndividualGoal;
  onArchive: (id: string) => void;
}) {
  return (
    <div className="reset-row ritual-decision-row">
      <strong>
        {goal.familyMemberName}: {goal.title}
      </strong>
      <span>
        {goal.currentProgress} / {goal.targetCount} {goal.unitLabel} · kijk samen of dit doel nog past
      </span>
      <div className="reset-actions">
        <button type="button">Gaat mee</button>
        <button
          type="button"
          className="secondary-action"
          onClick={() => onArchive(goal.id)}
        >
          Afronden
        </button>
      </div>
    </div>
  );
}
