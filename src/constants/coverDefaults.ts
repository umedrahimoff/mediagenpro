import type { CoverState } from '../types/cover';

export const BRAND_COLORS = {
  primaryBlue: '#146AFF',
  lightBlue: '#CBDDFF',
  accentYellow: '#F5A623',
  darkText: '#183444',
  white: '#FFFFFF',
} as const;

export const STORAGE_KEY = 'mediagen_pro_state';

export const DEFAULT_STATE: CoverState = {
  appMode: 'instagram',
  postFormat: 'news',
  coverFontPreset: 'instagram',
  title: 'THE FUTURE OF\nVENTURE CAPITAL',
  titleScale: 100,
  titleAutoFit: true,
  category: 'SaaS Trends',
  image: null,
  imageFocusX: 50,
  imageFocusY: 50,
  imageZoom: 100,
  imageFit: 'cover',
  isGradient: true,
  gradientPreset: 'brand',
  gradientFlow: 'diag-br',
  gradientGeometry: 'linear',
  gradientCustomStops: null,
  overlayTexture: 'none',
  overlayTextureOpacity: 22,
  ratio: 'vertical',
  imageOrientation: 'vertical',
  layoutMode: 'overlay',
  template: 'bold',
  overlayOpacity: 0.6,
  titleColor: '#FFFFFF',
  categoryColor: '#F5A623',
  bgColor: '#146AFF',
  caption: 'stanbase.tech',
  captionColor: '#FFFFFF',
  photoCredit: '',
  photoCreditCorner: 'br',
  showSafeZones: false,
  textTransform: 'uppercase',
  useGlassmorphism: false,
  contentAlignment: 'flex-end',
  glassBlur: 25,
  glassWidth: 'full',
  logos: [],
  logoSize: 100,
  logoOpacity: 100,
  logoTint: 'original',
  eventTitleAlign: 'left',
  eventMeta: '',
  eventSpeakers: [],
};

/** Сброс всего, что относится к градиенту и связанному фону (текстура, фирменный цвет). */
export const GRADIENT_BACKGROUND_DEFAULTS: Pick<
  CoverState,
  | 'gradientPreset'
  | 'gradientFlow'
  | 'gradientGeometry'
  | 'gradientCustomStops'
  | 'bgColor'
  | 'overlayTexture'
  | 'overlayTextureOpacity'
> = {
  gradientPreset: DEFAULT_STATE.gradientPreset,
  gradientFlow: DEFAULT_STATE.gradientFlow,
  gradientGeometry: DEFAULT_STATE.gradientGeometry,
  gradientCustomStops: DEFAULT_STATE.gradientCustomStops,
  bgColor: DEFAULT_STATE.bgColor,
  overlayTexture: DEFAULT_STATE.overlayTexture,
  overlayTextureOpacity: DEFAULT_STATE.overlayTextureOpacity,
};
