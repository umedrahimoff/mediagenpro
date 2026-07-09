/** Шрифт текста на превью/экспорте обложки. По умолчанию — системный стек в духе Instagram. */
export type CoverFontPreset = 'instagram' | 'geist' | 'inter' | 'editorial';

/** Пресет фонового градиента (режим «градиент»). «brand» использует bgColor как стартовый цвет. */
export type GradientPresetId =
  | 'brand'
  | 'mac_big_sur'
  | 'mac_monterey'
  | 'mac_ventura'
  | 'mac_sonoma';

/** Угол мелкой подписи-источника фото (водяной знак). */
export type PhotoCreditCorner = 'br' | 'bl' | 'tr' | 'tl';

/**
 * Как фото вписывается в рамку обложки:
 * - 'cover'  — кадрируем под рамку (object-fit: cover), фото обрезается;
 * - 'blur'   — показываем фото целиком (contain), пустоты заполняем размытой копией фото.
 */
export type CoverImageFitId = 'cover' | 'blur';

export interface CoverState {
  /** Пресет шрифта для текста на обложке. */
  coverFontPreset: CoverFontPreset;
  title: string;
  /** Масштаб заголовка в % (100 = базовый размер). Умножает font-size. */
  titleScale: number;
  /** Авто-подгонка: ужимать заголовок, если он не влезает в текстовый блок. titleScale — верхняя граница. */
  titleAutoFit: boolean;
  category: string;
  image: string | null;
  /** Точка кадрирования при object-fit: cover, % по осям (0–100). */
  imageFocusX: number;
  imageFocusY: number;
  /** Масштаб фона относительно точки фокуса, % (100 = без увеличения). */
  imageZoom: number;
  /** Как фото вписано в рамку: кадрирование или «целиком + размытый фон». */
  imageFit: CoverImageFitId;
  /** Дуотон: тонировать фото-фон в фирменный цвет (bgColor). Только режим фото-фона. */
  photoDuotone: boolean;
  isGradient: boolean;
  /** Пресет градиента фона; «бренд» использует bgColor как стартовый цвет. */
  gradientPreset: GradientPresetId;
  ratio: 'vertical' | 'square' | 'story';
  /** Затемнение фото снизу для читаемости текста, 0–1. */
  overlayOpacity: number;
  titleColor: string;
  categoryColor: string;
  bgColor: string;
  /** Подпись источника фото (мелкий текст на превью/экспорте), только при фоне-картинке. */
  photoCredit: string;
  /** Угол размещения подписи источника. */
  photoCreditCorner: PhotoCreditCorner;
  showSafeZones: boolean;
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  contentAlignment: 'flex-start' | 'center' | 'flex-end';
  /** До 10 логотипов вверху обложки (data URL). */
  logos: string[];
  logoSize: number;
  logoOpacity: number;
  /** Единый монохром для всех логотипов (CSS filter). */
  logoTint: 'original' | 'white' | 'black';
}
