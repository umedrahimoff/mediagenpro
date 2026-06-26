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
export function coverImageLayerStyle(focus: CoverImageFocus, fit: CoverImageFitId = 'cover'): CSSProperties {
  return {
    width: '100%',
    height: '100%',
    objectFit: fit === 'blur' ? 'contain' : 'cover',
    objectPosition: `${focus.imageFocusX}% ${focus.imageFocusY}%`,
    transform: `scale(${focus.imageZoom / 100})`,
    transformOrigin: `${focus.imageFocusX}% ${focus.imageFocusY}%`,
  };
}
