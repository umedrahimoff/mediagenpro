import type { GradientGeometryId } from '../types/cover';

/** UI order. For a new variant, extend here and in buildRadialAt(). */
export const GRADIENT_GEOMETRY_ORDER: GradientGeometryId[] = [
  'linear',
  'radial_center',
  'radial_spot_tl',
  'radial_spot_tr',
  'radial_spot_bl',
  'radial_spot_br',
];

export const GRADIENT_GEOMETRY_META: Record<GradientGeometryId, { label: string; hint?: string }> = {
  linear: { label: 'Linear', hint: 'Direction — arrow grid below' },
  radial_center: { label: 'Radial (center)', hint: 'Circle/ellipse from card center' },
  radial_spot_tl: { label: 'Spot ↖', hint: 'Light spot from top-left' },
  radial_spot_tr: { label: 'Spot ↗' },
  radial_spot_bl: { label: 'Spot ↙' },
  radial_spot_br: { label: 'Spot ↘' },
};

const G_IDS = new Set<GradientGeometryId>(GRADIENT_GEOMETRY_ORDER);

export function isGradientGeometryId(v: string): v is GradientGeometryId {
  return G_IDS.has(v as GradientGeometryId);
}
