import type { CSSProperties } from 'react';
import type { CoverImageFitId } from '../types/cover';

export type CoverImageFocus = {
  imageFocusX: number;
  imageFocusY: number;
  imageZoom: number;
};

/**
 * Стиль переднего слоя фото.
 * - fit='cover' — кадрируем под рамку (фото обрезается);
 * - fit='blur' — показываем фото целиком (object-fit: contain), а пустоты закрывает
 *   размытый backdrop (см. coverImageBackdropStyle / .cover-image-backdrop).
 * Фокус и зум применяются в обоих режимах.
 */
export function coverImageLayerStyle(
  focus: CoverImageFocus,
  fit: CoverImageFitId = 'cover',
  duotoneColor?: string
): CSSProperties {
  const style: CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: fit === 'blur' ? 'contain' : 'cover',
    objectPosition: `${focus.imageFocusX}% ${focus.imageFocusY}%`,
    transform: `scale(${focus.imageZoom / 100})`,
    transformOrigin: `${focus.imageFocusX}% ${focus.imageFocusY}%`,
  };
  if (duotoneColor) style.filter = duotoneFilter(duotoneColor);
  return style;
}

/** Хью (0–360) цвета из hex — для расчёта hue-rotate дуотона. */
function hexHue(hex: string): number {
  const m = hex.replace('#', '');
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  if ([r, g, b].some(Number.isNaN)) return 210; // фолбэк — синий
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 210;
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = Math.round(h * 60);
  return (h + 360) % 360;
}

/**
 * CSS-фильтр «дуотон»: обесцвечиваем фото и подкрашиваем в тон цвета `hex`.
 * grayscale+sepia даёт фиксированный тёплый оттенок (~40°), hue-rotate доводит его до нужного хью.
 * Одно свойство filter на <img> — переживает экспорт html-to-image (как и монохром логотипов).
 */
export function duotoneFilter(hex: string): string {
  const rotate = ((hexHue(hex) - 40) % 360 + 360) % 360;
  return `grayscale(1) sepia(1) saturate(3.4) hue-rotate(${Math.round(rotate)}deg) brightness(1.03) contrast(1.02)`;
}
