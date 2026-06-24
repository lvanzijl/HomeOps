import { useEffect, useState } from "react";
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
  const [status, setStatus] = useState("Loading weekly reset…");
  const [skipped, setSkipped] = useState(false);
  useEffect(() => {
    let ignore = false;
    loadWeeklyReset()
      .then((data) => {
        if (!ignore) {
          setReset(data);
          setStatus("Ready");
        }
      })
      .catch(() => {
        if (!ignore) setStatus("Weekly reset could not be loaded.");
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
      <section className="weekly-reset-page">
        <p className="eyebrow">Optional family check-in</p>
        <h2>Skipped for now</h2>
        <p>No problem. The family plan will stay as it is for now.</p>
        <button type="button" onClick={() => setSkipped(false)}>
          Open family reset again
        </button>
      </section>
    );
  if (!reset)
    return (
      <section className="weekly-reset-page">
        <p>{status}</p>
      </section>
    );
  return (
    <section className="weekly-reset-page" aria-labelledby="weekly-reset-title">
      <header className="weekly-reset-hero">
        <div>
          <p className="eyebrow">Family check-in</p>
          <h2 id="weekly-reset-title">Weekly Reset</h2>
          <p>Take a quick look at loose tasks, family goals, shopping, and wins from the week.</p>
        </div>
        <button
          type="button"
          className="secondary-action"
          onClick={() => setSkipped(true)}
        >
          Skip this week
        </button>
      </header>
      <section className="reset-grid">
        <ReviewCard>
          <CardHeader
            className="reset-card-heading"
            title="Loose tasks"
            actions={`${reset.reviewCandidates.length} to check`}
          />
          {reset.reviewCandidates.length === 0 ? (
            <p>No loose tasks need a decision right now.</p>
          ) : (
            reset.reviewCandidates.map((task) => (
              <div className="reset-row" key={task.id}>
                <strong>{task.title}</strong>
                <span>{task.noDateReviewState ?? "Active"}</span>
                <div className="reset-actions">
                  <button
                    type="button"
                    onClick={() =>
                      keepTaskActive(task.id).then(() =>
                        refresh("Kept active."),
                      )
                    }
                  >
                    Keep this week
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      moveTaskToSomeday(task.id).then(() =>
                        refresh("Moved to someday."),
                      )
                    }
                  >
                    Later
                  </button>
                  <button
                    type="button"
                    className="secondary-action"
                    onClick={() =>
                      archiveTask(task.id).then(() => refresh("Archived."))
                    }
                  >
                    Archive
                  </button>
                </div>
              </div>
            ))
          )}
        </ReviewCard>
        <GoalCard
          title="Family goal"
          goal={reset.familyGoal}
          onArchive={(id) =>
            archiveFamilyGoalForReset(id).then(() =>
              refresh("Family goal archived."),
            )
          }
        />
        <ReviewCard>
          <CardHeader
            className="reset-card-heading"
            title="Kids’ goals"
            actions={`${reset.individualGoals.length} active`}
          />
          {reset.individualGoals.length === 0 ? (
            <p>No active kid goals to confirm.</p>
          ) : (
            reset.individualGoals.map((goal) => (
              <IndividualGoalRow
                goal={goal}
                key={goal.id}
                onArchive={(id) =>
                  archiveIndividualGoal(id).then(() =>
                    refresh("Kid goal archived."),
                  )
                }
              />
            ))
          )}
        </ReviewCard>
        <ReviewCard>
          <CardHeader
            className="reset-card-heading"
            title="Shopping check"
            actions={`${reset.shoppingReviewCandidates.length} to check`}
          />
          {reset.shoppingReviewCandidates.length === 0 ? (
            <p>No shopping cleanup suggested this week.</p>
          ) : (
            reset.shoppingReviewCandidates.map((list) => (
              <div className="reset-row" key={list.id}>
                <strong>{list.name}</strong>
                <span>
                  {list.reason} · {list.itemCount} items
                </span>
              </div>
            ))
          )}
        </ReviewCard>
        <ReviewCard className="recap-card">
          <CardHeader
            className="reset-card-heading"
            title="Family wins"
            actions={`${reset.contributionRecap.completedTaskCount} tasks · ${reset.contributionRecap.helpfulMomentCount} moments`}
          />
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
              <strong>Celebrated: {memory.title}</strong>
              {memory.description ? <span>{memory.description}</span> : null}
            </div>
          ))}
        </ReviewCard>
      </section>
      <p role="status">{status}</p>
    </section>
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
    <ReviewCard>
      <CardHeader
        className="reset-card-heading"
        title={title}
        actions={goal ? "Active" : "None active"}
      />
      {!goal ? (
        <p>No active family goal to check today.</p>
      ) : (
        <div className="reset-row">
          <strong>{goal.title}</strong>
          <span>
            {goal.currentProgress} / {goal.targetCount} {goal.unitLabel}
          </span>
          <div className="reset-actions">
            <button type="button">Keep this week</button>
            <button
              type="button"
              className="secondary-action"
              onClick={() => onArchive(goal.id)}
            >
              Archive
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
    <div className="reset-row">
      <strong>
        {goal.familyMemberName}: {goal.title}
      </strong>
      <span>
        {goal.currentProgress} / {goal.targetCount} {goal.unitLabel}
      </span>
      <div className="reset-actions">
        <button type="button">Keep this week</button>
        <button
          type="button"
          className="secondary-action"
          onClick={() => onArchive(goal.id)}
        >
          Archive
        </button>
      </div>
    </div>
  );
}
