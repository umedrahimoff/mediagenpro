export const MAX_LOGOS = 10;

export type LogoTint = 'original' | 'white' | 'black';

/** Монохром всех логотипов через filter (прозрачность PNG сохраняется). */
export function logoTintFilter(tint: LogoTint): string | undefined {
  if (tint === 'white') return 'brightness(0) invert(1)';
  if (tint === 'black') return 'brightness(0)';
  return undefined;
}

export interface RowLogoSizeOptions {
  /** Ширина превью-холста (px). */
  previewWidth: number;
  /** Отступ слева/справа от края холста. */
  horizontalPadding: number;
  /** Зазор между логотипами в ряду. */
  gap: number;
  /** Базовая «желаемая» ширина одного логотипа (из слайдера, px). */
  logoSize: number;
  /** Сколько логотипов в этом ряду. */
  countInRow: number;
}

/** Ширина одного логотипа в ряду: не больше logoSize и помещается в ряд. */
export function widthForLogoInRow(o: RowLogoSizeOptions): number {
  const { previewWidth, horizontalPadding, gap, logoSize, countInRow } = o;
  if (countInRow <= 0) return 0;
  const usable = previewWidth - horizontalPadding * 2;
  const maxPerSlot = (usable - (countInRow - 1) * gap) / countInRow;
  return Math.max(12, Math.min(logoSize, maxPerSlot));
}
