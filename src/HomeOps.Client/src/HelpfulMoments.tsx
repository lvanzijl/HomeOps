import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { FamilyAvatar } from "./home/FamilyAvatar";
import type { FamilyMember } from "./home/familyMembers";
import {
  createHelpfulMoment,
  deleteHelpfulMoment,
  getRecognitionTagLabel,
  loadHelpfulMoments,
  recognitionTags,
  updateHelpfulMoment,
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
  previewCount = 2,
  contextualHistory = false,
}: {
  members: readonly FamilyMember[];
  familyMemberId?: string;
  showCreate?: boolean;
  title?: string;
  compact?: boolean;
  previewCount?: number;
  contextualHistory?: boolean;
}) {
  const [moments, setMoments] = useState<HelpfulMoment[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [expanded, setExpanded] = useState(!compact);
  const [creating, setCreating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editingMoment, setEditingMoment] = useState<HelpfulMoment>();
  const [deletingMoment, setDeletingMoment] = useState<HelpfulMoment>();
  const [lifecycleError, setLifecycleError] = useState<string | null>(null);
  useEffect(() => {
    let ignore = false;
    setStatus("loading");
    loadHelpfulMoments(familyMemberId, contextualHistory ? 50 : 8)
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
  }, [contextualHistory, familyMemberId]);
  const previewMoments = moments.slice(0, previewCount);
  const hiddenMoments = Math.max(0, moments.length - previewMoments.length);
  const visibleMoments =
    compact && (contextualHistory || !expanded) ? previewMoments : moments;

  function renderMomentCard(
    moment: HelpfulMoment,
    options?: { showDescription?: boolean; showActions?: boolean },
  ) {
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
            <strong>
              {moment.familyMemberName}
              {moment.familyMemberIsRemoved ? " (voormalig gezinslid)" : ""}
            </strong>
            <span>
              <HomeOpsIcon name={iconName} />
              {getRecognitionTagLabel(moment.recognitionTag)}
            </span>
          </div>
          <h4>{moment.title}</h4>
          {moment.description && options?.showDescription ? (
            <p>{moment.description}</p>
          ) : null}
          <p className="moment-bridge">Dank je wel.</p>
          {options?.showActions ? (
            <div className="helpful-moment-actions">
              <button
                type="button"
                className="secondary-action compact-action"
                onClick={() => {
                  setLifecycleError(null);
                  setEditingMoment(moment);
                }}
              >
                Aanpassen
              </button>
              <button
                type="button"
                className="secondary-action compact-action"
                onClick={() => {
                  setLifecycleError(null);
                  setDeletingMoment(moment);
                }}
              >
                Verwijderen
              </button>
            </div>
          ) : null}
        </div>
      </article>
    );
  }

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
            {contextualHistory ? (
              moments.length > 0 ? (
                <button
                  type="button"
                  className="secondary-action compact-action"
                  onClick={() => setShowHistory(true)}
                >
                  {hiddenMoments > 0 ? `+${hiddenMoments} meer` : "Alles bekijken"}
                </button>
              ) : null
            ) : (
              <button
                type="button"
                className="secondary-action compact-action"
                onClick={() => setExpanded((current) => !current)}
              >
                {expanded ? "Voorbeeld tonen" : "Alles bekijken"}
              </button>
            )}
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
                aria-label="Waardering sluiten"
              >
                <HomeOpsIcon name="close" />
              </button>
            </header>
            <HelpfulMomentForm
              members={members}
              onAnnuleren={() => setCreating(false)}
              onCreated={(moment) => {
                setMoments((current) => [moment, ...current].slice(0, 8));
                if (!contextualHistory) setExpanded(true);
                setCreating(false);
              }}
            />
          </section>
        </div>
      ) : null}
      {showHistory && contextualHistory ? (
        <div
          className="avatar-editor-backdrop"
          role="presentation"
          onClick={() => {
            setShowHistory(false);
            setEditingMoment(undefined);
            setDeletingMoment(undefined);
            setLifecycleError(null);
          }}
        >
        <section
          className="motivation-dialog helpful-moment-history-dialog"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} geschiedenis`}
          onClick={(event) => event.stopPropagation()}
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
              <h3>{title}</h3>
              <p>{moments.length} waarderingen om rustig terug te lezen.</p>
            </div>
            <button
              type="button"
              className="icon-button"
              onClick={() => {
                setShowHistory(false);
                setEditingMoment(undefined);
                setDeletingMoment(undefined);
                setLifecycleError(null);
              }}
              aria-label="Waarderingsgeschiedenis sluiten"
            >
              <HomeOpsIcon name="close" />
            </button>
          </header>
          {editingMoment ? (
            <HelpfulMomentEditForm
              moment={editingMoment}
              members={members}
              error={lifecycleError}
              onCancel={() => {
                setEditingMoment(undefined);
                setLifecycleError(null);
              }}
              onSaved={(saved) => {
                setMoments((current) =>
                  current.map((moment) => (moment.id === saved.id ? saved : moment)),
                );
                setEditingMoment(undefined);
                setLifecycleError(null);
              }}
              onError={() =>
                setLifecycleError(
                  "Deze waardering kon niet worden aangepast. Je invoer is behouden; vernieuw de geschiedenis en probeer opnieuw.",
                )
              }
            />
          ) : deletingMoment ? (
            <section className="motivation-confirmation" aria-label="Waardering verwijderen bevestigen">
              <h4>‘{deletingMoment.title}’ verwijderen?</h4>
              <p>
                Deze waardering verdwijnt uit het overzicht. De historische verwijzing blijft veilig bewaard.
              </p>
              {lifecycleError ? <p className="form-error">{lifecycleError}</p> : null}
              <div className="form-actions">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await deleteHelpfulMoment(deletingMoment.id);
                      setMoments((current) => current.filter((moment) => moment.id !== deletingMoment.id));
                      setDeletingMoment(undefined);
                      setLifecycleError(null);
                    } catch {
                      setLifecycleError("Deze waardering kon niet worden verwijderd. Probeer het opnieuw.");
                    }
                  }}
                >
                  Waardering verwijderen
                </button>
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => {
                    setDeletingMoment(undefined);
                    setLifecycleError(null);
                  }}
                >
                  Behouden
                </button>
              </div>
            </section>
          ) : (
            <div className="helpful-moment-feed helpful-moment-history-feed">
              {moments.map((moment) =>
                renderMomentCard(moment, { showDescription: true, showActions: true }),
              )}
            </div>
          )}
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
        {visibleMoments.map((moment) =>
          renderMomentCard(moment, {
            showDescription: !compact || expanded,
          }),
        )}
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
                  <strong>{getRecognitionTagLabel(tag)}</strong>
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
            <p>{getRecognitionTagLabel(recognitionTag)}</p>
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

function HelpfulMomentEditForm({
  moment,
  members,
  error,
  onCancel,
  onSaved,
  onError,
}: {
  moment: HelpfulMoment;
  members: readonly FamilyMember[];
  error: string | null;
  onCancel: () => void;
  onSaved: (moment: HelpfulMoment) => void;
  onError: () => void;
}) {
  const [familyMemberId, setFamilyMemberId] = useState(moment.familyMemberId);
  const [title, setTitle] = useState(moment.title);
  const [description, setDescription] = useState(moment.description ?? "");
  const [recognitionTag, setRecognitionTag] = useState(moment.recognitionTag);
  const [saving, setSaving] = useState(false);
  const currentMemberIsMissing = !members.some((member) => member.id === moment.familyMemberId);

  return (
    <form
      className="helpful-moment-edit-form"
      aria-label="Waardering aanpassen formulier"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!familyMemberId || !title.trim()) return;
        setSaving(true);
        try {
          onSaved(
            await updateHelpfulMoment(moment.id, {
              familyMemberId,
              title: title.trim(),
              description: description.trim() || undefined,
              recognitionTag,
              expectedUpdatedUtc: moment.updatedUtc ?? moment.createdUtc,
            }),
          );
        } catch {
          onError();
        } finally {
          setSaving(false);
        }
      }}
    >
      <div>
        <p className="eyebrow">Correctie</p>
        <h4>Waardering aanpassen</h4>
        <p>Pas alleen aan wat niet klopt; de waardering blijft aan hetzelfde moment gekoppeld.</p>
      </div>
      <label>
        Gezinslid
        <select value={familyMemberId} onChange={(event) => setFamilyMemberId(event.target.value)}>
          {currentMemberIsMissing ? (
            <option value={moment.familyMemberId}>{moment.familyMemberName} (voormalig gezinslid)</option>
          ) : null}
          {members.map((member) => (
            <option key={member.id} value={member.id}>{member.name}</option>
          ))}
        </select>
      </label>
      <label>
        Wat gebeurde er?
        <textarea value={title} maxLength={160} required onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label>
        Soort waardering
        <select value={recognitionTag} onChange={(event) => setRecognitionTag(event.target.value as RecognitionTag)}>
          {recognitionTags.map((tag) => (
            <option key={tag} value={tag}>{getRecognitionTagLabel(tag)}</option>
          ))}
        </select>
      </label>
      <label>
        Persoonlijk bericht
        <textarea value={description} maxLength={500} onChange={(event) => setDescription(event.target.value)} />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="form-actions">
        <button type="submit" disabled={saving || !title.trim()}>{saving ? "Opslaan…" : "Waardering bewaren"}</button>
        <button type="button" className="secondary-action" onClick={onCancel}>Annuleren</button>
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
