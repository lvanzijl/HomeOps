import { useMemo, useState } from 'react';
import { avatarV2AccessoryAssets, avatarV2ClothingAssets, avatarV2HairAssets, expandAvatarPaletteToken, renderAvatarV2Svg, type AccessoryStyle, type HairStyle, type PaletteToken, type ShirtStyle } from '../avatarV2/avatarV2';
import { avatarV2ConfigurationsEqual, avatarV2DefaultConfiguration, normalizeAvatarV2Configuration, toAvatarV2RenderConfig, type AvatarV2Configuration } from '../avatarV2/avatarConfig';
import { HomeOpsIcon } from '../icons/homeOpsIcons';
import type { FamilyMember } from './familyMembers';

interface FamilyAvatarEditorProps {
  member: FamilyMember;
  onChange: (member: FamilyMember) => void;
  onClose: () => void;
}

const hairOptions: HairStyle[] = ['softCrop', 'curlyCloud', 'sideBob', 'swoop', 'layeredMessy', 'shortMessy', 'longSoft', 'curlyPlayful'];
const clothingOptions: ShirtStyle[] = ['tShirt', 'roundedTee', 'collar', 'hoodie', 'sweater', 'overall'];
const accessoryOptions: AccessoryStyle[] = ['none', 'star', 'flower', 'headband', 'bow', 'chestStar', 'leafPin', 'tinyCrown'];
const hairSwatches: PaletteToken[] = ['hairCocoa', 'hairChestnut', 'hairPlum'];
const clothingSwatches: PaletteToken[] = ['shirtSky', 'shirtMint', 'shirtRose', 'shirtSun'];
const accessorySwatches: PaletteToken[] = ['accessoryLilac', 'accessoryCoral'];

export function FamilyAvatarEditor({ member, onChange, onClose }: FamilyAvatarEditorProps) {
  const persistedConfiguration = normalizeAvatarV2Configuration(member.avatarV2Config ?? avatarV2DefaultConfiguration);
  const [draftConfiguration, setDraftConfiguration] = useState<AvatarV2Configuration>(persistedConfiguration);
  const hasUnsavedChanges = !avatarV2ConfigurationsEqual(persistedConfiguration, draftConfiguration);
  const previewSvg = useMemo(() => renderAvatarV2Svg(toAvatarV2RenderConfig(draftConfiguration)), [draftConfiguration]);

  function updateConfiguration(update: Partial<AvatarV2Configuration>) {
    setDraftConfiguration((current) => ({ ...current, ...update }));
  }

  function save() {
    onChange({ ...member, avatarV2Config: draftConfiguration });
    onClose();
  }

  return (
    <div className="avatar-editor-backdrop" role="presentation">
      <section className="avatar-editor avatar-v2-family-editor" role="dialog" aria-modal="true" aria-label={`Avatarbewerker voor ${member.name}`}>
        <header>
          <div>
            <p className="eyebrow">Gezinslidavatar</p>
            <h3>Avatar van {member.name} bewerken</h3>
            <p>Bekijk wijzigingen voor {member.name} en sla ze op bij dit gezinslid.</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Avatarbewerker sluiten"><HomeOpsIcon name="close" /></button>
        </header>
        <div className="avatar-v2-editor-layout">
          <aside className="avatar-v2-preview-card" aria-label={`Live avatarvoorbeeld voor ${member.name}`}>
            <div className="avatar-v2-preview" data-testid="family-avatar-v2-live-preview" dangerouslySetInnerHTML={{ __html: previewSvg }} />
            <p className={hasUnsavedChanges ? 'avatar-v2-status avatar-v2-status-unsaved' : 'avatar-v2-status'} aria-live="polite">{hasUnsavedChanges ? 'Niet-opgeslagen wijzigingen' : 'Opgeslagen'}</p>
            <div className="avatar-v2-actions">
              <button type="button" onClick={save} disabled={!hasUnsavedChanges}>Opslaan</button>
              <button type="button" onClick={() => setDraftConfiguration(persistedConfiguration)} disabled={!hasUnsavedChanges}>Annuleren</button>
              <button type="button" onClick={() => setDraftConfiguration(avatarV2DefaultConfiguration)}>Resetten</button>
            </div>
          </aside>
          <div className="avatar-v2-controls" aria-label={`${member.name} avatar choices`}>
            <AssetSection title="Hair" description="Pick a hairstyle." options={hairOptions} selected={draftConfiguration.hairStyle} renderPreview={(style) => renderAvatarV2Svg(toAvatarV2RenderConfig({ ...draftConfiguration, hairStyle: style, accessory: 'none' }))} getLabel={(style) => avatarV2HairAssets[style].metadata.displayName} onSelect={(hairStyle) => updateConfiguration({ hairStyle })} />
            <SwatchSection title="Hair color" swatches={hairSwatches} selected={draftConfiguration.hairColor} onSelect={(hairColor) => updateConfiguration({ hairColor })} />
            <AssetSection title="Clothing" description="Pick an outfit shape." options={clothingOptions} selected={draftConfiguration.clothingStyle} renderPreview={(style) => renderAvatarV2Svg(toAvatarV2RenderConfig({ ...draftConfiguration, clothingStyle: style }))} getLabel={(style) => avatarV2ClothingAssets[style].metadata.displayName} onSelect={(clothingStyle) => updateConfiguration({ clothingStyle })} />
            <SwatchSection title="Clothing color" swatches={clothingSwatches} selected={draftConfiguration.clothingColor} onSelect={(clothingColor) => updateConfiguration({ clothingColor })} />
            <AssetSection title="Accessory" description="Pick a finishing touch." options={accessoryOptions} selected={draftConfiguration.accessory} renderPreview={(style) => renderAvatarV2Svg(toAvatarV2RenderConfig({ ...draftConfiguration, accessory: style }))} getLabel={(style) => style === 'none' ? 'No accessory' : avatarV2AccessoryAssets[style].metadata.displayName} onSelect={(accessory) => updateConfiguration({ accessory })} />
            <SwatchSection title="Accessory color" swatches={accessorySwatches} selected={draftConfiguration.accessoryColor} onSelect={(accessoryColor) => updateConfiguration({ accessoryColor })} />
          </div>
        </div>
      </section>
    </div>
  );
}

function AssetSection<T extends string>({ title, description, options, selected, renderPreview, getLabel, onSelect }: { title: string; description: string; options: T[]; selected: T; renderPreview: (value: T) => string; getLabel: (value: T) => string; onSelect: (value: T) => void }) {
  return <section className="avatar-v2-choice-section" aria-labelledby={`${title}-title`}><div><h3 id={`${title}-title`}>{title}</h3><p>{description}</p></div><div className="avatar-v2-asset-grid">{options.map((option) => <button className="avatar-v2-asset-tile" aria-pressed={option === selected} key={option} onClick={() => onSelect(option)} type="button"><span dangerouslySetInnerHTML={{ __html: renderPreview(option) }} /><strong>{getLabel(option)}</strong></button>)}</div></section>;
}

function SwatchSection({ title, swatches, selected, onSelect }: { title: string; swatches: PaletteToken[]; selected: PaletteToken; onSelect: (value: PaletteToken) => void }) {
  return <section className="avatar-v2-swatch-section" aria-labelledby={`${title}-title`}><h3 id={`${title}-title`}>{title}</h3><div className="avatar-v2-swatch-row">{swatches.map((swatch) => <button aria-label={`${title} option ${swatches.indexOf(swatch) + 1}`} aria-pressed={swatch === selected} className="avatar-v2-swatch" key={swatch} onClick={() => onSelect(swatch)} style={{ background: expandAvatarPaletteToken(swatch).base }} type="button" />)}</div></section>;
}
