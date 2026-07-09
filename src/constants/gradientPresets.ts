import type { GradientPresetId } from '../types/cover';

/** Локальный тип цветового стопа (градиент строится внутри этого модуля). */
type GradientStop = { color: string; percent: number };

/** Order in the editor UI. */
export const GRADIENT_PRESET_ORDER: GradientPresetId[] = [
  'brand',
  'mac_big_sur',
  'mac_monterey',
  'mac_ventura',
  'mac_sonoma',
];

export const GRADIENT_PRESET_META: Record<
  GradientPresetId,
  { label: string; hint: string }
> = {
  brand: {
    label: 'Brand',
    hint: 'From your accent color toward dark',
  },
  mac_big_sur: {
    label: 'Mac · Big Sur',
    hint: 'Warm blue–violet–pink, Big Sur wallpaper vibe',
  },
  mac_monterey: {
    label: 'Mac · Monterey',
    hint: 'Deep blue–teal, cool macOS',
  },
  mac_ventura: {
    label: 'Mac · Ventura',
    hint: 'Night purple–blue',
  },
  mac_sonoma: {
    label: 'Mac · Sonoma',
    hint: 'Warm sunset / terracotta',
  },
};

const IDS = new Set<GradientPresetId>(GRADIENT_PRESET_ORDER);

export function isGradientPresetId(v: string): v is GradientPresetId {
  return IDS.has(v as GradientPresetId);
}

/** Preset color stops. */
export function getPresetGradientStops(preset: GradientPresetId, accentHex: string): GradientStop[] {
  const a = accentHex.trim() || '#146AFF';
  switch (preset) {
    case 'brand':
      return [
        { color: a, percent: 0 },
        { color: '#0a0a14', percent: 42 },
        { color: '#000000', percent: 100 },
      ];
    case 'mac_big_sur':
      return [
        { color: '#1a237e', percent: 0 },
        { color: '#283593', percent: 18 },
        { color: '#6a1b9a', percent: 42 },
        { color: '#ad1457', percent: 68 },
        { color: '#ff6f00', percent: 88 },
        { color: '#ffb74d', percent: 100 },
      ];
    case 'mac_monterey':
      return [
        { color: '#020617', percent: 0 },
        { color: '#0c4a6e', percent: 28 },
        { color: '#0e7490', percent: 52 },
        { color: '#155e75', percent: 72 },
        { color: '#134e4a', percent: 100 },
      ];
    case 'mac_ventura':
      return [
        { color: '#0c0a1a', percent: 0 },
        { color: '#1e1b4b', percent: 30 },
        { color: '#312e81', percent: 55 },
        { color: '#4c1d95', percent: 78 },
        { color: '#1e1b4b', percent: 100 },
      ];
    case 'mac_sonoma':
      return [
        { color: '#1c0a05', percent: 0 },
        { color: '#431407', percent: 22 },
        { color: '#7c2d12', percent: 48 },
        { color: '#c2410c', percent: 72 },
        { color: '#ea580c', percent: 88 },
        { color: '#fb923c', percent: 100 },
      ];
    default:
      return getPresetGradientStops('brand', a);
  }
}
