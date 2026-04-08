import type { CSSProperties } from 'react';

export type CoverImageFocus = {
  imageFocusX: number;
  imageFocusY: number;
  imageZoom: number;
};

export function coverImageLayerStyle(focus: CoverImageFocus): CSSProperties {
  return {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: `${focus.imageFocusX}% ${focus.imageFocusY}%`,
    transform: `scale(${focus.imageZoom / 100})`,
    transformOrigin: `${focus.imageFocusX}% ${focus.imageFocusY}%`,
  };
}
