import type { GradientFlowId, GradientPresetId, GradientStop } from '../types/cover';

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
    hint: 'From your accent color toward dark; direction is set separately',
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

/**
 * 3×3 flow grid (compass directions); empty center clarifies where the gradient pulls from.
 */
export const GRADIENT_FLOW_GRID: (GradientFlowId | null)[][] = [
  ['diag-tl', 'to-top', 'diag-tr'],
  ['to-left', null, 'to-right'],
  ['diag-bl', 'to-bottom', 'diag-br'],
];

export const GRADIENT_FLOW_META: Record<GradientFlowId, { label: string }> = {
  'to-top': { label: 'Bottom to top' },
  'to-bottom': { label: 'Top to bottom' },
  'to-left': { label: 'Right to left' },
  'to-right': { label: 'Left to right' },
  'diag-tr': { label: 'Diagonal ↗' },
  'diag-br': { label: 'Diagonal ↘ (default)' },
  'diag-bl': { label: 'Diagonal ↙' },
  'diag-tl': { label: 'Diagonal ↖' },
};

const FLOW_IDS = new Set<GradientFlowId>(
  GRADIENT_FLOW_GRID.flat().filter((x): x is GradientFlowId => x !== null)
);

export function isGradientFlowId(v: string): v is GradientFlowId {
  return FLOW_IDS.has(v as GradientFlowId);
}

/** `linear-gradient` angle in degrees (0° = upward in CSS). */
export function gradientFlowToDeg(flow: GradientFlowId): number {
  switch (flow) {
    case 'to-top':
      return 0;
    case 'to-bottom':
      return 180;
    case 'to-right':
      return 90;
    case 'to-left':
      return 270;
    case 'diag-tr':
      return 45;
    case 'diag-br':
      return 135;
    case 'diag-bl':
      return 225;
    case 'diag-tl':
      return 315;
    default:
      return 135;
  }
}

/** Preset color stops (linear and radial). */
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

function buildLinearFromStops(deg: number, stops: GradientStop[]): string {
  const body = stops.map((s) => `${s.color} ${Math.min(100, Math.max(0, s.percent))}%`).join(', ');
  return `linear-gradient(${deg}deg, ${body})`;
}

/** Final CSS `background` (linear preset — legacy path). */
export function resolveCoverGradient(
  preset: GradientPresetId,
  accentHex: string,
  flow: GradientFlowId
): string {
  return buildLinearFromStops(gradientFlowToDeg(flow), getPresetGradientStops(preset, accentHex));
}
