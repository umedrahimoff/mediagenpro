/** Формат контента: новости (текущий набор полей), мероприятие (дата/место, спикеры), промо (как новости, зарезервировано под будущие фичи). */
export type PostFormat = 'news' | 'event' | 'promo';

/** Шрифт текста на превью/экспорте обложки. По умолчанию — системный стек в духе Instagram. */
export type CoverFontPreset = 'instagram' | 'geist' | 'inter' | 'editorial';

/** Пресет фонового градиента (режим «градиент»). */
export type GradientPresetId =
  | 'brand'
  | 'mac_big_sur'
  | 'mac_monterey'
  | 'mac_ventura'
  | 'mac_sonoma';

/** Направление линейного градиента (угол CSS): куда «тянется» переход между стопами. */
export type GradientFlowId =
  | 'to-top'
  | 'to-bottom'
  | 'to-left'
  | 'to-right'
  | 'diag-tr'
  | 'diag-br'
  | 'diag-bl'
  | 'diag-tl';

/** Форма градиента: линейный или радиал / «пятно» из угла. */
export type GradientGeometryId =
  | 'linear'
  | 'radial_center'
  | 'radial_spot_tl'
  | 'radial_spot_tr'
  | 'radial_spot_bl'
  | 'radial_spot_br';

/** Один цветовой стоп градиента (% вдоль линии или радиуса). */
export interface GradientStop {
  color: string;
  percent: number;
}

/** Горизонтальное выравнивание заголовка в анонсе (формат «Мероприятие»). */
export type EventTitleAlign = 'left' | 'center' | 'right';

/** Угол мелкой подписи-источника фото (водяной знак). */
export type PhotoCreditCorner = 'br' | 'bl' | 'tr' | 'tl';

/**
 * Как фото вписывается в рамку обложки:
 * - 'cover'  — кадрируем под рамку (object-fit: cover), фото обрезается;
 * - 'blur'   — показываем фото целиком (contain), пустоты заполняем размытой копией фото.
 */
export type CoverImageFitId = 'cover' | 'blur';

/** Текстура поверх фона. Новый вариант — дописать union, coverOverlayTextures.ts и Preview.css. */
export type CoverOverlayTextureId = 'none' | 'paper_grain' | 'fine_halftone';

export interface EventSpeaker {
  name: string;
  /** Компания / роль — строка под именем на превью. */
  company: string;
  /** Data URL портрета или null — тогда показываем инициал. */
  photo: string | null;
}

export interface CoverState {
  appMode: 'instagram' | 'website';
  /** Смысловой формат поста; влияет на доступные поля и блок на превью. */
  postFormat: PostFormat;
  /** Пресет шрифта для текста на обложке. */
  coverFontPreset: CoverFontPreset;
  title: string;
  /** Масштаб заголовка в % (100 = базовый размер режима/шаблона). Умножает font-size во всех макетах. */
  titleScale: number;
  /** Авто-подгонка: ужимать заголовок, если он не влезает в текстовый блок. titleScale работает как верхняя граница. */
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
  isGradient: boolean;
  /** Пресет градиента фона; «бренд» использует bgColor как стартовый цвет. */
  gradientPreset: GradientPresetId;
  /** Направление градиента (угол линии перехода) для всех пресетов. */
  gradientFlow: GradientFlowId;
  /** Линейный / радиал / пятно из угла. */
  gradientGeometry: GradientGeometryId;
  /**
   * Ручные стопы: null — цвета из пресета; массив из ≥2 — только он (игнор палитры пресета).
   * Добавлять стопы — расширять массив в редакторе (лимит в sanitize).
   */
  gradientCustomStops: GradientStop[] | null;
  /** Текстура поверх фона (градиент / сплошной / фото). */
  overlayTexture: CoverOverlayTextureId;
  /** Непрозрачность текстуры, 0–100. */
  overlayTextureOpacity: number;
  ratio: 'vertical' | 'square' | 'horizontal' | 'story';
  imageOrientation: 'vertical' | 'square' | 'horizontal';
  layoutMode: 'overlay' | 'split';
  template: 'bold' | 'minimal' | 'quote';
  overlayOpacity: number;
  titleColor: string;
  categoryColor: string;
  bgColor: string;
  caption: string;
  captionColor: string;
  /** Подпись источника фото (мелкий текст на превью/экспорте), только при фоне-картинке. */
  photoCredit: string;
  /** Угол размещения подписи источника. */
  photoCreditCorner: PhotoCreditCorner;
  showSafeZones: boolean;
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  useGlassmorphism: boolean;
  contentAlignment: 'flex-start' | 'center' | 'flex-end';
  glassBlur: number;
  glassWidth: 'full' | 'fit';
  /** До 10 логотипов вверху обложки (data URL). */
  logos: string[];
  logoSize: number;
  logoOpacity: number;
  /** Единый монохром для всех логотипов (CSS filter). */
  logoTint: 'original' | 'white' | 'black';
  /** Выравнивание основного заголовка в анонсе (только postFormat event). */
  eventTitleAlign: EventTitleAlign;
  /** Дата, время, город (одна-две строки) — для формата «Мероприятие». */
  eventMeta: string;
  /** Спикеры: слева фото, справа имя и компания на превью. */
  eventSpeakers: EventSpeaker[];
}
