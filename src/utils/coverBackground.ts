import type { GradientPresetId } from '@/types/cover';
import { getPresetGradientStops } from '@/constants/gradientPresets';

/** CSS-фон градиента: линейный переход под фиксированным «диагональ вправо-вниз» углом. */
export function resolveCoverBackgroundCss(preset: GradientPresetId, accentHex: string): string {
  const stops = getPresetGradientStops(preset, accentHex);
  const list = stops.map((s) => `${s.color} ${s.percent}%`).join(', ');
  return `linear-gradient(135deg, ${list})`;
}
