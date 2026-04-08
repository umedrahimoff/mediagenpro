import type { CoverFontPreset } from '../types/cover';

/** Порядок пунктов в UI. */
export const COVER_FONT_PRESET_ORDER: CoverFontPreset[] = ['instagram', 'geist', 'inter', 'editorial'];

/** Пресеты для текста на обложке (категория, заголовок, спикеры и т.д.). */
export const COVER_FONT_PRESETS: Record<
  CoverFontPreset,
  { label: string; description: string; stack: string }
> = {
  instagram: {
    label: 'Instagram',
    description: 'Системный sans, как в ленте iOS/Android',
    stack: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
  },
  geist: {
    label: 'Geist',
    description: 'Шрифт интерфейса приложения',
    stack: '"Geist Variable", ui-sans-serif, system-ui, sans-serif',
  },
  inter: {
    label: 'Inter',
    description: 'Нейтральный гротеск для соцсетей',
    stack: '"Inter Variable", ui-sans-serif, system-ui, sans-serif',
  },
  editorial: {
    label: 'Editorial',
    description: 'С засечками для акцента',
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
