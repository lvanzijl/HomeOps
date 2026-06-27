import { useMemo, useState } from 'react';
import { avatarV2AccessoryAssets, avatarV2ClothingAssets, avatarV2HairAssets, expandAvatarPaletteToken, renderAvatarV2Svg, type AccessoryStyle, type HairStyle, type PaletteToken, type ShirtStyle } from './avatarV2';
import { avatarV2ConfigurationsEqual, avatarV2DefaultConfiguration, toAvatarV2RenderConfig, type AvatarV2Configuration } from './avatarConfig';

const hairOptions: HairStyle[] = ['softCrop', 'curlyCloud', 'sideBob', 'swoop', 'layeredMessy', 'shortMessy', 'longSoft', 'curlyPlayful'];
const clothingOptions: ShirtStyle[] = ['tShirt', 'roundedTee', 'collar', 'hoodie', 'sweater', 'overall'];
const accessoryOptions: AccessoryStyle[] = ['none', 'star', 'flower', 'headband', 'bow', 'chestStar', 'leafPin', 'tinyCrown'];
const hairSwatches: PaletteToken[] = ['hairCocoa', 'hairChestnut', 'hairPlum'];
const clothingSwatches: PaletteToken[] = ['shirtSky', 'shirtMint', 'shirtRose', 'shirtSun'];
const accessorySwatches: PaletteToken[] = ['accessoryLilac', 'accessoryCoral'];

export function AvatarEditorPage() {
  const [savedConfiguration, setSavedConfiguration] = useState(avatarV2DefaultConfiguration);
  const [draftConfiguration, setDraftConfiguration] = useState<AvatarV2Configuration>(savedConfiguration);
  const hasUnsavedChanges = !avatarV2ConfigurationsEqual(savedConfiguration, draftConfiguration);
  const previewSvg = useMemo(() => renderAvatarV2Svg(toAvatarV2RenderConfig(draftConfiguration)), [draftConfiguration]);

  function updateConfiguration(update: Partial<AvatarV2Configuration>) {
    setDraftConfiguration((current) => ({ ...current, ...update }));
  }

  function save() {
    setSavedConfiguration(draftConfiguration);
  }

  return (
    <section className="avatar-v2-editor-page" aria-labelledby="avatar-v2-editor-title">
      <header className="avatar-v2-editor-hero">
        <div>
          <p className="eyebrow">Avatarbewerker</p>
          <h2 id="avatar-v2-editor-title">Gezinsavatar maken</h2>
          <p>Probeer stijlen direct. Sla echte avatars op via gezinslidbeheer.</p>
        </div>
        <p className={hasUnsavedChanges ? 'avatar-v2-status avatar-v2-status-unsaved' : 'avatar-v2-status'} aria-live="polite">
          {hasUnsavedChanges ? 'Niet-opgeslagen wijzigingen' : 'Opgeslagen'}
        </p>
      </header>

      <div className="avatar-v2-editor-layout">
        <aside className="avatar-v2-preview-card" aria-label="Live voorbeeld avatar">
          <div className="avatar-v2-preview" data-testid="avatar-v2-live-preview" dangerouslySetInnerHTML={{ __html: previewSvg }} />
          <div className="avatar-v2-actions">
            <button type="button" onClick={save} disabled={!hasUnsavedChanges}>Opslaan</button>
            <button type="button" onClick={() => setDraftConfiguration(savedConfiguration)} disabled={!hasUnsavedChanges}>Annuleren</button>
            <button type="button" onClick={() => setDraftConfiguration(avatarV2DefaultConfiguration)}>Resetten</button>
          </div>
        </aside>

        <div className="avatar-v2-controls" aria-label="Avatarkeuzes">
          <AssetSection title="Haar" description="Kies een kapsel." options={hairOptions} selected={draftConfiguration.hairStyle} renderPreview={(style) => renderAvatarV2Svg(toAvatarV2RenderConfig({ ...draftConfiguration, hairStyle: style, accessory: 'none' }))} getLabel={(style) => avatarV2HairAssets[style].metadata.displayName} onSelect={(hairStyle) => updateConfiguration({ hairStyle })} />
          <SwatchSection title="Haarkleur" swatches={hairSwatches} selected={draftConfiguration.hairColor} onSelect={(hairColor) => updateConfiguration({ hairColor })} />
          <AssetSection title="Kleding" description="Kies een outfitvorm." options={clothingOptions} selected={draftConfiguration.clothingStyle} renderPreview={(style) => renderAvatarV2Svg(toAvatarV2RenderConfig({ ...draftConfiguration, clothingStyle: style }))} getLabel={(style) => avatarV2ClothingAssets[style].metadata.displayName} onSelect={(clothingStyle) => updateConfiguration({ clothingStyle })} />
          <SwatchSection title="Kledingkleur" swatches={clothingSwatches} selected={draftConfiguration.clothingColor} onSelect={(clothingColor) => updateConfiguration({ clothingColor })} />
          <AssetSection title="Accessoire" description="Kies iets extra’s." options={accessoryOptions} selected={draftConfiguration.accessory} renderPreview={(style) => renderAvatarV2Svg(toAvatarV2RenderConfig({ ...draftConfiguration, accessory: style }))} getLabel={(style) => style === 'none' ? 'Geen accessoire' : avatarV2AccessoryAssets[style].metadata.displayName} onSelect={(accessory) => updateConfiguration({ accessory })} />
          <SwatchSection title="Accessoirekleur" swatches={accessorySwatches} selected={draftConfiguration.accessoryColor} onSelect={(accessoryColor) => updateConfiguration({ accessoryColor })} />
        </div>
      </div>
    </section>
  );
}

function AssetSection<T extends string>({ title, description, options, selected, renderPreview, getLabel, onSelect }: { title: string; description: string; options: T[]; selected: T; renderPreview: (value: T) => string; getLabel: (value: T) => string; onSelect: (value: T) => void }) {
  return <section className="avatar-v2-choice-section" aria-labelledby={`${title}-title`}><div><h3 id={`${title}-title`}>{title}</h3><p>{description}</p></div><div className="avatar-v2-asset-grid">{options.map((option) => <button className="avatar-v2-asset-tile" aria-pressed={option === selected} key={option} onClick={() => onSelect(option)} type="button"><span dangerouslySetInnerHTML={{ __html: renderPreview(option) }} /><strong>{getLabel(option)}</strong></button>)}</div></section>;
}

function SwatchSection({ title, swatches, selected, onSelect }: { title: string; swatches: PaletteToken[]; selected: PaletteToken; onSelect: (value: PaletteToken) => void }) {
  return <section className="avatar-v2-swatch-section" aria-labelledby={`${title}-title`}><h3 id={`${title}-title`}>{title}</h3><div className="avatar-v2-swatch-row">{swatches.map((swatch) => <button aria-label={`${title} optie ${swatches.indexOf(swatch) + 1}`} aria-pressed={swatch === selected} className="avatar-v2-swatch" key={swatch} onClick={() => onSelect(swatch)} style={{ background: expandAvatarPaletteToken(swatch).base }} type="button" />)}</div></section>;
}
