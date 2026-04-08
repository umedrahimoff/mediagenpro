import type { CoverFontPreset } from '../types/cover';

/** Preset order in the editor UI. */
export const COVER_FONT_PRESET_ORDER: CoverFontPreset[] = ['instagram', 'geist', 'inter', 'editorial'];

/** Font presets for cover text (category, title, speakers, etc.). */
export const COVER_FONT_PRESETS: Record<
  CoverFontPreset,
  { label: string; description: string; stack: string }
> = {
  instagram: {
    label: 'Instagram',
    description: 'System UI sans, similar to iOS/Android feeds',
    stack: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
  },
  geist: {
    label: 'Geist',
    description: 'App UI typeface',
    stack: '"Geist Variable", ui-sans-serif, system-ui, sans-serif',
  },
  inter: {
    label: 'Inter',
    description: 'Neutral grotesk for social posts',
    stack: '"Inter Variable", ui-sans-serif, system-ui, sans-serif',
  },
  editorial: {
    label: 'Editorial',
    description: 'Serif accent for headlines',
    stack: 'Georgia, "Times New Roman", Times, serif',
  },
};

const IDS = new Set<CoverFontPreset>(['instagram', 'geist', 'inter', 'editorial']);

export function isCoverFontPreset(v: string): v is CoverFontPreset {
  return IDS.has(v as CoverFontPreset);
}

export function coverFontStack(preset: CoverFontPreset): string {
  return COVER_FONT_PRESETS[preset].stack;
}
