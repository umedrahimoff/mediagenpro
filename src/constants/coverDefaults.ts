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
  coverFontPreset: 'instagram',
  title: 'THE FUTURE OF\nVENTURE CAPITAL',
  titleScale: 100,
  titleAutoFit: true,
  category: 'SaaS Trends',
  image: null,
  photoDuotone: false,
  imageFocusX: 50,
  imageFocusY: 50,
  imageZoom: 100,
  imageFit: 'cover',
  isGradient: true,
  gradientPreset: 'brand',
  ratio: 'vertical',
  overlayOpacity: 0.6,
  titleColor: '#FFFFFF',
  categoryColor: '#F5A623',
  bgColor: '#146AFF',
  photoCredit: '',
  photoCreditCorner: 'br',
  showSafeZones: false,
  textTransform: 'uppercase',
  contentAlignment: 'flex-end',
  logos: [],
  logoSize: 100,
  logoOpacity: 100,
  logoTint: 'original',
};

/** Сброс фона к дефолту (фирменный пресет + цвет). */
export const GRADIENT_BACKGROUND_DEFAULTS: Pick<
  CoverState,
  'gradientPreset' | 'bgColor'
> = {
  gradientPreset: DEFAULT_STATE.gradientPreset,
  bgColor: DEFAULT_STATE.bgColor,
};
