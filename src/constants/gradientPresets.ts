import type { GradientPresetId } from '../types/cover';

/** Порядок в UI. */
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
    label: 'Бренд',
    hint: 'От выбранного фирменного цвета к тёмному, как раньше',
  },
  mac_big_sur: {
    label: 'Mac · Big Sur',
    hint: 'Тёплый сине‑фиолетово‑розовый, в духе обоев Big Sur',
  },
  mac_monterey: {
    label: 'Mac · Monterey',
    hint: 'Глубокий сине‑бирюзовый, холодный macOS',
  },
  mac_ventura: {
    label: 'Mac · Ventura',
    hint: 'Ночной фиолетово‑синий',
  },
  mac_sonoma: {
    label: 'Mac · Sonoma',
    hint: 'Тёплый закат / терракота',
  },
};

const IDS = new Set<GradientPresetId>(GRADIENT_PRESET_ORDER);

export function isGradientPresetId(v: string): v is GradientPresetId {
  return IDS.has(v as GradientPresetId);
}

/** Итоговый CSS для `background` на обложке. */
export function resolveCoverGradient(preset: GradientPresetId, accentHex: string): string {
  const a = accentHex.trim() || '#146AFF';
  switch (preset) {
    case 'brand':
      return `linear-gradient(135deg, ${a} 0%, #0a0a14 42%, #000000 100%)`;
    case 'mac_big_sur':
      return [
        'linear-gradient(168deg,',
        '#1a237e 0%,',
        '#283593 18%,',
        '#6a1b9a 42%,',
        '#ad1457 68%,',
        '#ff6f00 88%,',
        '#ffb74d 100%',
        ')',
      ].join(' ');
    case 'mac_monterey':
      return [
        'linear-gradient(152deg,',
        '#020617 0%,',
        '#0c4a6e 28%,',
        '#0e7490 52%,',
        '#155e75 72%,',
        '#134e4a 100%',
        ')',
      ].join(' ');
    case 'mac_ventura':
      return [
        'linear-gradient(160deg,',
        '#0c0a1a 0%,',
        '#1e1b4b 30%,',
        '#312e81 55%,',
        '#4c1d95 78%,',
        '#1e1b4b 100%',
        ')',
      ].join(' ');
    case 'mac_sonoma':
      return [
        'linear-gradient(155deg,',
        '#1c0a05 0%,',
        '#431407 22%,',
        '#7c2d12 48%,',
        '#c2410c 72%,',
        '#ea580c 88%,',
        '#fb923c 100%',
        ')',
      ].join(' ');
    default:
      return resolveCoverGradient('brand', a);
  }
}
