import { HomeOpsIcon } from '../icons/homeOpsIcons';
import { FamilyAvatar } from './FamilyAvatar';
import type { FamilyMember, FamilyMemberAvatarConfig } from './familyMembers';

interface FamilyAvatarEditorProps {
  member: FamilyMember;
  onChange: (member: FamilyMember) => void;
  onClose: () => void;
}

const skinTones = ['#ffdbac', '#f1c27d', '#c68642', '#8d5524'];
const hairColors = ['#111827', '#3b2416', '#92400e', '#f59e0b', '#6b7280'];
const shirtColors = ['#60a5fa', '#f472b6', '#34d399', '#fbbf24', '#a78bfa'];
const displayColors = ['#f8c8dc', '#c7d2fe', '#bbf7d0', '#fde68a', '#fed7aa'];

export function FamilyAvatarEditor({ member, onChange, onClose }: FamilyAvatarEditorProps) {
  if (!member.avatar) return null;

  const updateAvatar = (avatarPatch: Partial<FamilyMemberAvatarConfig>) => onChange({ ...member, avatar: { ...member.avatar!, ...avatarPatch } });
  const updateMember = (patch: Partial<FamilyMember>) => onChange({ ...member, ...patch });

  return (
    <div className="avatar-editor-backdrop" role="presentation">
      <section className="avatar-editor" role="dialog" aria-modal="true" aria-label={`${member.name} household member avatar editor`}>
        <header>
          <div>
            <p className="eyebrow">Household member avatar</p>
            <h3>{member.name}</h3>
            <p>This changes only the friendly Home avatar. It is not a login, account, security, or profile setting.</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close avatar editor"><HomeOpsIcon name="close" /></button>
        </header>
        <div className="avatar-editor-preview"><FamilyAvatar member={member} size="large" /></div>
        <div className="avatar-editor-grid">
          <label>Age group<select value={member.avatar.ageGroup} onChange={(e) => updateAvatar({ ageGroup: e.target.value as FamilyMemberAvatarConfig['ageGroup'] })}><option value="child">Child</option><option value="adult">Adult</option></select></label>
          <label>Presentation<select value={member.avatar.presentation} onChange={(e) => updateAvatar({ presentation: e.target.value as FamilyMemberAvatarConfig['presentation'] })}><option value="neutral">Neutral</option><option value="masculine">Masculine</option><option value="feminine">Feminine</option></select></label>
          <label>Hair style<select value={member.avatar.hairStyle} onChange={(e) => updateAvatar({ hairStyle: e.target.value as FamilyMemberAvatarConfig['hairStyle'] })}><option value="short">Short</option><option value="curly">Curly</option><option value="bob">Bob</option><option value="long">Long</option><option value="top">Top</option></select></label>
          <label className="checkbox-label"><input type="checkbox" checked={member.avatar.glasses} onChange={(e) => updateAvatar({ glasses: e.target.checked })} /> Glasses</label>
          <ColorSelect label="Skin tone" value={member.avatar.skinTone} colors={skinTones} onChange={(skinTone) => updateAvatar({ skinTone })} />
          <ColorSelect label="Hair color" value={member.avatar.hairColor} colors={hairColors} onChange={(hairColor) => updateAvatar({ hairColor })} />
          <ColorSelect label="Shirt color" value={member.avatar.shirtColor} colors={shirtColors} onChange={(shirtColor) => updateAvatar({ shirtColor })} />
          <ColorSelect label="Display color" value={member.displayColor} colors={displayColors} onChange={(displayColor) => updateMember({ displayColor })} />
        </div>
      </section>
    </div>
  );
}

function ColorSelect({ label, value, colors, onChange }: { label: string; value: string; colors: string[]; onChange: (value: string) => void }) {
  return <label>{label}<select value={value} onChange={(e) => onChange(e.target.value)}>{colors.map((color) => <option key={color} value={color}>{color}</option>)}</select></label>;
}
