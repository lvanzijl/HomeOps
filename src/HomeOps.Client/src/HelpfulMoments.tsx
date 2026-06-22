import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
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
  title = "Things My Family Appreciates",
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
  const [creating, setCreating] = useState(!compact && showCreate);
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
  const visibleMoments = compact && !expanded ? moments.slice(0, 1) : moments;
  return (
    <section
      className={`helpful-moments-section ${compact ? "compact-overview-section" : ""}`}
      aria-label={title}
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">My Family Appreciates</p>
          <h3>{title}</h3>
          <p>
            {compact
              ? `${moments.length} appreciation ${moments.length === 1 ? "note" : "notes"} · latest example first.`
              : "Kind things your family noticed."}
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
                {creating ? "Close note form" : "Add appreciation"}
              </button>
            ) : null}
            <button
              type="button"
              className="secondary-action compact-action"
              onClick={() => setExpanded((current) => !current)}
            >
              {expanded ? "Show preview" : "View all appreciation"}
            </button>
          </div>
        ) : null}
      </div>
      {creating && showCreate ? (
        <HelpfulMomentForm
          members={members}
          onCreated={(moment) => {
            setMoments((current) => [moment, ...current].slice(0, 8));
            setExpanded(true);
          }}
        />
      ) : null}
      {status === "loading" ? (
        <p>Finding what your family appreciated…</p>
      ) : null}
      {status === "error" ? (
        <p>Family appreciation notes are unavailable right now.</p>
      ) : null}
      {status === "ready" && moments.length === 0 ? (
        <p>No appreciation notes yet. A grown-up can add one.</p>
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
                <HomeOpsIcon name={iconName} />
              </div>
              <div>
                <div className="moment-card-heading">
                  <strong>We noticed {moment.familyMemberName}</strong>
                  <span>
                    <HomeOpsIcon name={iconName} />
                    {moment.recognitionTag}
                  </span>
                </div>
                <h4>{moment.title}</h4>
                {moment.description && (!compact || expanded) ? (
                  <p>{moment.description}</p>
                ) : null}
                <p className="moment-bridge">You helped.</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function HelpfulMomentForm({
  members,
  onCreated,
}: {
  members: readonly FamilyMember[];
  onCreated: (moment: HelpfulMoment) => void;
}) {
  const [familyMemberId, setFamilyMemberId] = useState(members[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [recognitionTag, setRecognitionTag] =
    useState<RecognitionTag>("Kindness");
  const [error, setError] = useState<string | null>(null);
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
      setTitle("");
      setDescription("");
      setError(null);
    } catch {
      setError("We could not save that appreciation note.");
    }
  }
  return (
    <form
      className="helpful-moment-form"
      aria-label="Create helpful moment"
      onSubmit={submit}
    >
      <label>
        Family member
        <select
          value={familyMemberId}
          onChange={(event) => setFamilyMemberId(event.target.value)}
          required
        >
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        What happened?
        <input
          value={title}
          maxLength={160}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Helped without being asked"
          required
        />
      </label>
      <label>
        We appreciated
        <select
          value={recognitionTag}
          onChange={(event) =>
            setRecognitionTag(event.target.value as RecognitionTag)
          }
        >
          {recognitionTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </label>
      <label>
        Warm note
        <textarea
          value={description}
          maxLength={500}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="A short warm note"
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button type="submit">Save appreciation</button>
    </form>
  );
}
