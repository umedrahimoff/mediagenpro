import type {
  CoverState,
  CoverFontPreset,
  GradientPresetId,
  PhotoCreditCorner,
} from '../types/cover';
import { isCoverFontPreset } from '../constants/coverFonts';
import { isGradientPresetId } from '../constants/gradientPresets';
import { DEFAULT_STATE, STORAGE_KEY } from '../constants/coverDefaults';
import { MAX_LOGOS, type LogoTint } from './logoLayout';

const RATIOS = new Set<CoverState['ratio']>(['vertical', 'square', 'story']);

const IMAGE_FITS = new Set<CoverState['imageFit']>(['cover', 'blur']);

const TEXT_TRANSFORMS = new Set<CoverState['textTransform']>([
  'none',
  'uppercase',
  'lowercase',
  'capitalize',
]);

const ALIGNMENTS = new Set<CoverState['contentAlignment']>([
  'flex-start',
  'center',
  'flex-end',
]);

const LOGO_TINTS = new Set<LogoTint>(['original', 'white', 'black']);

const PHOTO_CREDIT_CORNERS = new Set<PhotoCreditCorner>(['br', 'bl', 'tr', 'tl']);

function pickString(src: Record<string, unknown>, key: keyof CoverState): string | undefined {
  const v = src[key as string];
  return typeof v === 'string' ? v : undefined;
}

function pickFiniteNumber(src: Record<string, unknown>, key: keyof CoverState): number | undefined {
  const v = src[key as string];
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

function pickBool(src: Record<string, unknown>, key: keyof CoverState): boolean | undefined {
  const v = src[key as string];
  return typeof v === 'boolean' ? v : undefined;
}

function pickNullableImage(src: Record<string, unknown>, key: 'image'): string | null | undefined {
  const v = src[key];
  if (v === null) return null;
  if (typeof v === 'string') return v;
  return undefined;
}

function sanitizeLogosArray(src: Record<string, unknown>): string[] | undefined {
  const raw = src.logos;
  if (Array.isArray(raw)) {
    return raw.filter((x): x is string => typeof x === 'string').slice(0, MAX_LOGOS);
  }
  const legacy = src.logo;
  if (typeof legacy === 'string' && legacy.length > 0) return [legacy];
  if (legacy === null) return [];
  return undefined;
}

/** Возвращает только безопасно распознанные поля из localStorage. */
export function sanitizeStoredCoverState(raw: unknown): Partial<CoverState> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }
  const src = raw as Record<string, unknown>;
  const partial: Partial<CoverState> = {};

  const cfp = src.coverFontPreset;
  if (typeof cfp === 'string' && isCoverFontPreset(cfp)) {
    partial.coverFontPreset = cfp as CoverFontPreset;
  }

  const gp = src.gradientPreset;
  if (typeof gp === 'string' && isGradientPresetId(gp)) {
    partial.gradientPreset = gp as GradientPresetId;
  }

  const ratio = src.ratio;
  if (typeof ratio === 'string' && RATIOS.has(ratio as CoverState['ratio'])) {
    partial.ratio = ratio as CoverState['ratio'];
  }

  const ifit = src.imageFit;
  if (typeof ifit === 'string' && IMAGE_FITS.has(ifit as CoverState['imageFit'])) {
    partial.imageFit = ifit as CoverState['imageFit'];
  }

  const tt = src.textTransform;
  if (typeof tt === 'string' && TEXT_TRANSFORMS.has(tt as CoverState['textTransform'])) {
    partial.textTransform = tt as CoverState['textTransform'];
  }

  const ca = src.contentAlignment;
  if (typeof ca === 'string' && ALIGNMENTS.has(ca as CoverState['contentAlignment'])) {
    partial.contentAlignment = ca as CoverState['contentAlignment'];
  }

  const s = pickString(src, 'title');
  if (s !== undefined) partial.title = s;

  const tsc = pickFiniteNumber(src, 'titleScale');
  if (tsc !== undefined) partial.titleScale = Math.min(150, Math.max(50, Math.round(tsc)));

  const taf = pickBool(src, 'titleAutoFit');
  if (taf !== undefined) partial.titleAutoFit = taf;

  const cat = pickString(src, 'category');
  if (cat !== undefined) partial.category = cat;

  const pd = pickBool(src, 'photoDuotone');
  if (pd !== undefined) partial.photoDuotone = pd;

  const img = pickNullableImage(src, 'image');
  if (img !== undefined) partial.image = img;
  const logos = sanitizeLogosArray(src);
  if (logos !== undefined) partial.logos = logos;

  const ig = pickBool(src, 'isGradient');
  if (ig !== undefined) partial.isGradient = ig;
  const sz = pickBool(src, 'showSafeZones');
  if (sz !== undefined) partial.showSafeZones = sz;

  const oo = pickFiniteNumber(src, 'overlayOpacity');
  if (oo !== undefined && oo >= 0 && oo <= 1) partial.overlayOpacity = oo;

  const ls = pickFiniteNumber(src, 'logoSize');
  if (ls !== undefined && ls >= 1 && ls <= 500) partial.logoSize = ls;

  const lo = pickFiniteNumber(src, 'logoOpacity');
  if (lo !== undefined && lo >= 0 && lo <= 100) partial.logoOpacity = lo;

  const ifx = pickFiniteNumber(src, 'imageFocusX');
  if (ifx !== undefined && ifx >= 0 && ifx <= 100) partial.imageFocusX = ifx;
  const ify = pickFiniteNumber(src, 'imageFocusY');
  if (ify !== undefined && ify >= 0 && ify <= 100) partial.imageFocusY = ify;
  const iz = pickFiniteNumber(src, 'imageZoom');
  if (iz !== undefined && iz >= 100 && iz <= 250) partial.imageZoom = iz;

  const lt = src.logoTint;
  if (typeof lt === 'string' && LOGO_TINTS.has(lt as LogoTint)) {
    partial.logoTint = lt as CoverState['logoTint'];
  }

  for (const key of ['titleColor', 'categoryColor', 'bgColor'] as const) {
    const v = pickString(src, key);
    if (v !== undefined) partial[key] = v;
  }

  const pc = src.photoCredit;
  if (typeof pc === 'string') partial.photoCredit = pc.slice(0, 200);

  const pcc = src.photoCreditCorner;
  if (typeof pcc === 'string' && PHOTO_CREDIT_CORNERS.has(pcc as PhotoCreditCorner)) {
    partial.photoCreditCorner = pcc as PhotoCreditCorner;
  }

  return partial;
}

export function loadCoverStateFromStorage(json: string | null): CoverState {
  if (!json) return DEFAULT_STATE;
  try {
    const parsed: unknown = JSON.parse(json);
    const partial = sanitizeStoredCoverState(parsed);
    return { ...DEFAULT_STATE, ...partial };
  } catch (e) {
    console.error('Failed to load saved state:', e);
    return DEFAULT_STATE;
  }
}

/** Сохраняет полное состояние редактора в localStorage (тот же ключ, что при загрузке). */
export function saveCoverStateToStorage(state: CoverState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      const lighter: CoverState = { ...state, image: null, logos: [] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lighter));
      } catch {
        /* ignore */
      }
    }
  }
}
