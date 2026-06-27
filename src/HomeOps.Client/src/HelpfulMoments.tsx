import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { FamilyAvatar } from "./home/FamilyAvatar";
import type { FamilyMember } from "./home/familyMembers";
import {
  createHelpfulMoment,
  loadHelpfulMoments,
  recognitionTags,
  type HelpfulMoment,
  type RecognitionTag,
} from "./helpfulMomentsData";
import { getHelpfulMomentIconName, HomeOpsIcon } from "./icons/homeOpsIcons";

export function HelpfulMomentsSection({
  members,
  familyMemberId,
  showCreate = false,
  title = "Wat wij waarderen",
  compact = false,
}: {
  members: readonly FamilyMember[];
  familyMemberId?: string;
  showCreate?: boolean;
  title?: string;
  compact?: boolean;
}) {
  const [moments, setMoments] = useState<HelpfulMoment[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [expanded, setExpanded] = useState(!compact);
  const [creating, setCreating] = useState(false);
  useEffect(() => {
    let ignore = false;
    setStatus("loading");
    loadHelpfulMoments(familyMemberId, 8)
      .then((loaded) => {
        if (!ignore) {
          setMoments(loaded);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!ignore) setStatus("error");
      });
    return () => {
      ignore = true;
    };
  }, [familyMemberId]);
  const visibleMoments = compact && !expanded ? moments.slice(0, 2) : moments;
  return (
    <section
      className={`helpful-moments-section ${compact ? "compact-overview-section" : ""}`}
      aria-label={title}
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">Waardering</p>
          <h3>{title}</h3>
          <p>
            {compact
              ? `${moments.length} waarderingen · nieuwste eerst.`
              : "Lieve dingen die jullie hebben gezien."}
          </p>
        </div>
        {compact ? (
          <div className="overview-actions">
            {showCreate ? (
              <button
                type="button"
                className="secondary-action compact-action"
                onClick={() => setCreating((current) => !current)}
              >
                {creating ? "Waardering sluiten" : "Waardering toevoegen"}
              </button>
            ) : null}
            <button
              type="button"
              className="secondary-action compact-action"
              onClick={() => setExpanded((current) => !current)}
            >
              {expanded ? "Voorbeeld tonen" : "Alles bekijken"}
            </button>
          </div>
        ) : null}
      </div>
      {!compact && showCreate ? (
        <button
          type="button"
          className="secondary-action compact-action"
          onClick={() => setCreating(true)}
        >
          Waardering toevoegen
        </button>
      ) : null}
      {creating && showCreate ? (
        <div className="avatar-editor-backdrop" role="presentation">
          <section
            className="motivation-dialog helpful-moment-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Waardering delen"
            style={
              {
                "--domain-tint": "#fff7ed",
                "--domain-accent": "#f59e0b",
                "--domain-border": "rgba(251, 191, 36, 0.32)",
              } as CSSProperties
            }
          >
            <header>
              <div>
                <p className="eyebrow">Waardering</p>
                <h3>Waardering delen</h3>
                <p>Maak van een helpend moment een warm bedankje.</p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setCreating(false)}
                aria-label="Waardering sluiten dialog"
              >
                <HomeOpsIcon name="close" />
              </button>
            </header>
            <HelpfulMomentForm
              members={members}
              onAnnuleren={() => setCreating(false)}
              onCreated={(moment) => {
                setMoments((current) => [moment, ...current].slice(0, 8));
                setExpanded(true);
                setCreating(false);
              }}
            />
          </section>
        </div>
      ) : null}
      {status === "loading" ? <p>Waarderingen ophalen…</p> : null}
      {status === "error" ? (
        <p>Waarderingen zijn nu niet beschikbaar.</p>
      ) : null}
      {status === "ready" && moments.length === 0 ? (
        <p>Nog geen waarderingen. Een volwassene kan er één toevoegen.</p>
      ) : null}
      <div className="helpful-moment-feed">
        {visibleMoments.map((moment) => {
          const iconName = getHelpfulMomentIconName(moment.recognitionTag);
          return (
            <article
              className="helpful-moment-card"
              key={moment.id}
              style={
                {
                  "--member-color": moment.familyMemberDisplayColor,
                } as CSSProperties
              }
            >
              <div className="moment-avatar" aria-hidden="true">
                <FamilyAvatar
                  member={{
                    id: moment.familyMemberId,
                    name: moment.familyMemberName,
                    initials: moment.familyMemberInitials,
                    displayColor: moment.familyMemberDisplayColor,
                    memberKind: "child",
                  }}
                />
              </div>
              <div>
                <div className="moment-card-heading">
                  <strong>{moment.familyMemberName}</strong>
                  <span>
                    <HomeOpsIcon name={iconName} />
                    {moment.recognitionTag}
                  </span>
                </div>
                <h4>{moment.title}</h4>
                {moment.description && (!compact || expanded) ? (
                  <p>{moment.description}</p>
                ) : null}
                <p className="moment-bridge">Dank je wel.</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

type HelpfulMomentQuestion = "member" | "title" | "tag" | "note" | "review";

function HelpfulMomentForm({
  members,
  onCreated,
  onAnnuleren,
}: {
  members: readonly FamilyMember[];
  onCreated: (moment: HelpfulMoment) => void;
  onAnnuleren: () => void;
}) {
  const [question, setQuestion] = useState<HelpfulMomentQuestion>("member");
  const [familyMemberId, setFamilyMemberId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [recognitionTag, setRecognitionTag] =
    useState<RecognitionTag>("Kindness");
  const [error, setError] = useState<string | null>(null);
  const selectedMember = members.find((member) => member.id === familyMemberId);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onAnnuleren();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onAnnuleren]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!familyMemberId || !title.trim()) return;
    try {
      const moment = await createHelpfulMoment({
        familyMemberId,
        title: title.trim(),
        description: description.trim() || undefined,
        recognitionTag,
      });
      onCreated(moment);
      setError(null);
    } catch {
      setError("We konden deze waardering niet delen.");
    }
  }

  function chooseMember(memberId: string) {
    setFamilyMemberId(memberId);
    setQuestion("title");
  }

  function chooseTag(tag: RecognitionTag) {
    setRecognitionTag(tag);
    setQuestion("note");
  }

  return (
    <form
      className="helpful-moment-form helpful-moment-conversation"
      aria-label="Waardering maken"
      onSubmit={submit}
    >
      <div className="task-conversation-panel" key={question}>
        {question === "member" ? (
          <section className="helpful-dialog-question" aria-label="Wie hielp?">
            <h4>Wie hielp?</h4>
            <div className="helpful-choice-grid">
              {members.map((member) => (
                <button
                  type="button"
                  className="helpful-member-card"
                  key={member.id}
                  onClick={() => chooseMember(member.id)}
                >
                  <FamilyAvatar member={member} size="large" />
                  <strong>{member.name}</strong>
                </button>
              ))}
            </div>
          </section>
        ) : null}
        {question === "title" ? (
          <section
            className="helpful-dialog-question"
            aria-label="Wat gebeurde er?"
          >
            <label className="task-conversation-question">
              <span>Wat gebeurde er?</span>
              <textarea
                value={title}
                maxLength={160}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Riley hielp opruimen zonder dat iemand het vroeg."
                required
                autoFocus
              />
            </label>
          </section>
        ) : null}
        {question === "tag" ? (
          <section
            className="helpful-dialog-question"
            aria-label="Hoe zou je het noemen?"
          >
            <h4>Hoe zou je het noemen?</h4>
            <div className="helpful-choice-grid helpful-tag-grid">
              {recognitionTags.map((tag) => (
                <button
                  type="button"
                  className="helpful-tag-card"
                  key={tag}
                  onClick={() => chooseTag(tag)}
                >
                  <HomeOpsIcon name={getHelpfulMomentIconName(tag)} />
                  <strong>{tag}</strong>
                </button>
              ))}
            </div>
          </section>
        ) : null}
        {question === "note" ? (
          <section
            className="helpful-dialog-question"
            aria-label="Nog iets erbij?"
          >
            <label className="task-conversation-question">
              <span>Nog iets erbij?</span>
              <textarea
                value={description}
                maxLength={500}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Voeg eventueel een persoonlijk bericht toe."
                autoFocus
              />
            </label>
          </section>
        ) : null}
        {question === "review" ? (
          <section
            className="helpful-dialog-question helpful-review"
            aria-label="Waardering controleren"
          >
            <h4>Klaar om te delen?</h4>
            <p>
              <strong>{selectedMember?.name}</strong>
            </p>
            <p>{title}</p>
            <p>{recognitionTag}</p>
            {description.trim() ? (
              <p>{description}</p>
            ) : (
              <p>Deze keer geen extra bericht.</p>
            )}
          </section>
        ) : null}
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="task-conversation-actions">
        {question !== "member" ? (
          <button
            type="button"
            className="secondary-action"
            onClick={() => setQuestion(previousHelpfulQuestion(question))}
          >
            Terug
          </button>
        ) : (
          <span />
        )}
        {question === "title" ? (
          <button
            type="button"
            onClick={() => setQuestion("tag")}
            disabled={!title.trim()}
          >
            Verder
          </button>
        ) : null}
        {question === "note" ? (
          <>
            <button
              type="button"
              className="secondary-action"
              onClick={() => {
                setDescription("");
                setQuestion("review");
              }}
            >
              Overslaan
            </button>
            <button type="button" onClick={() => setQuestion("review")}>
              Verder
            </button>
          </>
        ) : null}
        {question === "review" ? (
          <button type="submit">Waardering delen</button>
        ) : null}
      </div>
    </form>
  );
}

function previousHelpfulQuestion(
  question: HelpfulMomentQuestion,
): HelpfulMomentQuestion {
  if (question === "title") return "member";
  if (question === "tag") return "title";
  if (question === "note") return "tag";
  return "note";
}
