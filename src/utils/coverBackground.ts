import type { GradientFlowId, GradientGeometryId, GradientPresetId, GradientStop } from '@/types/cover';
import { getPresetGradientStops, gradientFlowToDeg } from '@/constants/gradientPresets';

const MAX_STOPS = 10;

export function normalizeGradientStops(raw: GradientStop[]): GradientStop[] {
  const sorted = [...raw]
    .slice(0, MAX_STOPS)
    .map((s) => ({
      color: typeof s.color === 'string' ? s.color.trim().slice(0, 32) : '#000000',
      percent: Math.min(100, Math.max(0, Number.isFinite(s.percent) ? s.percent : 0)),
    }))
    .sort((a, b) => a.percent - b.percent);
  return sorted;
}

function stopsToCssList(stops: GradientStop[]): string {
  return stops.map((s) => `${s.color} ${s.percent}%`).join(', ');
}

function radialShapeAt(geometry: GradientGeometryId): string {
  switch (geometry) {
    case 'radial_center':
      return 'ellipse 125% 110% at 50% 50%';
    case 'radial_spot_tl':
      return 'ellipse 140% 120% at 12% 10%';
    case 'radial_spot_tr':
      return 'ellipse 140% 120% at 88% 10%';
    case 'radial_spot_bl':
      return 'ellipse 140% 120% at 12% 90%';
    case 'radial_spot_br':
      return 'ellipse 140% 120% at 88% 90%';
    default:
      return 'ellipse 125% 110% at 50% 50%';
  }
}

export function resolveCoverBackgroundCss(
  preset: GradientPresetId,
  accentHex: string,
  flow: GradientFlowId,
  geometry: GradientGeometryId,
  customStops: GradientStop[] | null
): string {
  const presetStops = getPresetGradientStops(preset, accentHex);
  const stops =
    customStops && customStops.length >= 2 ? normalizeGradientStops(customStops) : presetStops;

  if (geometry === 'linear') {
    const deg = gradientFlowToDeg(flow);
    return `linear-gradient(${deg}deg, ${stopsToCssList(stops)})`;
  }

  const shape = radialShapeAt(geometry);
  return `radial-gradient(${shape}, ${stopsToCssList(stops)})`;
}
