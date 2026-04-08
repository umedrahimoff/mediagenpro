import type { CoverOverlayTextureId } from '../types/cover';

/**
 * Overlay textures on the background. To add one:
 * 1) extend id in types/cover.ts (CoverOverlayTextureId);
 * 2) add a row here in ORDER and META;
 * 3) add class .cover-overlay-texture--<cssSuffix> in Preview.css.
 */
export const COVER_OVERLAY_TEXTURE_ORDER: CoverOverlayTextureId[] = [
  'none',
  'paper_grain',
  'fine_halftone',
];

export const COVER_OVERLAY_TEXTURE_META: Record<
  CoverOverlayTextureId,
  { label: string; cssSuffix: string | null }
> = {
  none: { label: 'None', cssSuffix: null },
  paper_grain: { label: 'Paper grain', cssSuffix: 'paper-grain' },
  fine_halftone: { label: 'Fine halftone', cssSuffix: 'fine-halftone' },
};

const TEX_IDS = new Set<string>(COVER_OVERLAY_TEXTURE_ORDER);

export function isCoverOverlayTextureId(v: string): v is CoverOverlayTextureId {
  return TEX_IDS.has(v);
}
