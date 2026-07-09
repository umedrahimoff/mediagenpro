import React, { useLayoutEffect, useRef } from 'react';
import type { CoverState } from '../../types/cover';
import type { Options } from 'html-to-image/lib/types';
import * as htmlToImage from 'html-to-image';
import { Download, FileType } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { logoTintFilter, widthForLogoInRow } from '@/utils/logoLayout';
import { coverImageLayerStyle, duotoneFilter } from '@/utils/coverImageLayerStyle';
import { coverFontStack } from '@/constants/coverFonts';
import { COVER_OVERLAY_TEXTURE_META } from '@/constants/coverOverlayTextures';
import { resolveCoverBackgroundCss } from '@/utils/coverBackground';
import './Preview.css';

interface PreviewProps {
    state: CoverState;
}

const getTransformedText = (text: string, transform: 'none' | 'uppercase' | 'lowercase' | 'capitalize') => {
    if (!text) return '';
    if (transform === 'uppercase') return text.toUpperCase();
    if (transform === 'lowercase') return text.toLowerCase();
    if (transform === 'capitalize') {
        return text
            .toLowerCase()
            .split('\n')
            .map((line) =>
                line
                    .split(' ')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')
            )
            .join('\n');
    }
    return text;
};

/** Читаемый цвет текста (тёмный/белый) на заданном фоне — для кикер-пилюли. */
function readableOn(hex: string): string {
    const m = hex.replace('#', '');
    const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    if ([r, g, b].some(Number.isNaN)) return '#FFFFFF';
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.6 ? '#141B2E' : '#FFFFFF';
}

function InstagramContentBlock({ state }: { state: CoverState }) {
    const dataLine = state.dataLine.trim();
    return (
        <div className="instagram-cover-text">
            {state.category &&
                (state.kickerStyle === 'pill' ? (
                    <div
                        className="category category--pill"
                        style={{ backgroundColor: state.categoryColor, color: readableOn(state.categoryColor) }}
                    >
                        {state.category}
                    </div>
                ) : (
                    <div className="category" style={{ color: state.categoryColor }}>
                        {state.category}
                    </div>
                ))}
            {dataLine && (
                <div className="data-line" style={{ color: state.categoryColor }}>
                    {dataLine}
                </div>
            )}
            <div
                className="title"
                style={{
                    color: state.titleColor,
                    textTransform: 'none',
                }}
            >
                {getTransformedText(state.title, state.textTransform)}
            </div>
        </div>
    );
}

/** Текстовые узлы и комментарии не имеют classList — иначе filter падает и весь экспорт ломается. */
const filterExcludeIgOverlay: NonNullable<Options['filter']> = (domNode) => {
    if (!(domNode instanceof Element)) return true;
    return !domNode.classList.contains('ig-ui-overlay');
};

function photoCreditVisible(state: CoverState): boolean {
    return !state.isGradient && Boolean(state.image) && state.photoCredit.trim().length > 0;
}

function PhotoCreditMark({ state, inSplit }: { state: CoverState; inSplit?: boolean }) {
    if (!photoCreditVisible(state)) return null;
    return (
        <div
            className={cn(
                'photo-credit-mark',
                `photo-credit-mark--${state.photoCreditCorner}`,
                inSplit && 'photo-credit-mark--in-split'
            )}
        >
            {state.photoCredit.trim()}
        </div>
    );
}

export const Preview: React.FC<PreviewProps> = ({ state }) => {
    const ref = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    /**
     * Авто-подгонка размера заголовка: если текст не влезает в текстовый блок, ужимаем через
     * CSS-переменную --title-fit (умножается на ручной --title-scale). titleScale задаёт верхнюю
     * границу — авто-режим только уменьшает, никогда не увеличивает.
     *
     * Меряем высоту внутреннего текстового блока (.instagram-cover-text) против доступной высоты
     * контейнера, а не scrollHeight контейнера: при justify-content: flex-end переполнение уходит
     * ВВЕРХ за край, и scrollHeight его не учитывает (всегда равен clientHeight).
     */
    useLayoutEffect(() => {
        const cover = ref.current;

        const applyFit = () => {
            if (!cover) return;
            const box = contentRef.current;
            const inner = box?.querySelector<HTMLElement>('.instagram-cover-text');
            if (!state.titleAutoFit || !box || !inner || state.appMode === 'website') {
                cover.style.setProperty('--title-fit', '1');
                return;
            }
            const MIN = 0.5;
            const s = getComputedStyle(box);
            const avail =
                box.clientHeight - parseFloat(s.paddingTop || '0') - parseFloat(s.paddingBottom || '0');
            const fits = () => inner.scrollHeight <= avail + 0.5;

            cover.style.setProperty('--title-fit', '1');
            void inner.scrollHeight; // форсим рефлоу
            if (fits()) return;

            let lo = MIN;
            let hi = 1;
            for (let i = 0; i < 14; i++) {
                const mid = (lo + hi) / 2;
                cover.style.setProperty('--title-fit', String(mid));
                void inner.scrollHeight;
                if (fits()) lo = mid;
                else hi = mid;
            }
            cover.style.setProperty('--title-fit', String(lo));
        };

        applyFit();

        // Шрифты (Inter/Geist) могут догрузиться после первого замера — пересчитываем.
        let cancelled = false;
        if (typeof document !== 'undefined' && document.fonts && document.fonts.status !== 'loaded') {
            document.fonts.ready.then(() => {
                if (!cancelled) applyFit();
            });
        }
        return () => {
            cancelled = true;
        };
    }, [state]);

    const downloadImage = async (format: 'png' | 'jpeg') => {
        if (!ref.current) return;

        let targetWidth = 1080;
        let targetHeight = 1350;

        if (state.appMode === 'website') {
            targetWidth = 1200;
            targetHeight = 628;
        } else {
            if (state.ratio === 'square') {
                targetHeight = 1080;
            } else if (state.ratio === 'story') {
                targetHeight = 1920;
            } else {
                targetHeight = 1350;
            }
        }

        const node = ref.current;
        const prevWidth = node.style.width;
        const prevHeight = node.style.height;
        const scale = state.appMode === 'website' ? 1 : targetWidth / node.clientWidth;

        const baseOptions: Options =
            state.appMode === 'website'
                ? {
                      width: targetWidth,
                      height: targetHeight,
                      pixelRatio: 1,
                      skipFonts: true,
                      filter: filterExcludeIgOverlay,
                  }
                : {
                      width: targetWidth,
                      height: targetHeight,
                      skipFonts: true,
                      style: {
                          transform: `scale(${scale})`,
                          transformOrigin: 'top left',
                          width: `${node.clientWidth}px`,
                          height: `${node.clientHeight}px`,
                      },
                      filter: filterExcludeIgOverlay,
                  };

        try {
            if (state.appMode === 'website') {
                node.style.width = `${targetWidth}px`;
                node.style.height = `${targetHeight}px`;
            }

            const func = format === 'png' ? htmlToImage.toPng : htmlToImage.toJpeg;
            let dataUrl = '';
            let quality = state.appMode === 'website' ? 0.85 : 0.95;

            if (state.appMode === 'website' && format === 'jpeg') {
                const maxSizeKB = 500;
                let attempts = 0;
                const maxAttempts = 8;

                while (attempts < maxAttempts) {
                    dataUrl = await htmlToImage.toJpeg(node, { ...baseOptions, quality });
                    const base64str = dataUrl.split(',')[1];
                    const sizeKB = Math.round((base64str.length * 3) / 4 / 1024);

                    if (sizeKB <= maxSizeKB) {
                        break;
                    }

                    quality -= 0.1;
                    attempts++;

                    if (quality < 0.3) {
                        alert(`Warning: Image compressed to ${sizeKB}KB (target: ${maxSizeKB}KB). Quality may be reduced.`);
                        break;
                    }
                }
            } else {
                const options: Options = format === 'jpeg' ? { ...baseOptions, quality } : baseOptions;
                dataUrl = await func(node, options);
            }

            const link = document.createElement('a');
            link.download = `cover-${Date.now()}.${format}`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to generate image', err);
            const msg = err instanceof Error ? err.message : String(err);
            alert(`Could not create image.${msg ? ` ${msg}` : ''}`);
        } finally {
            if (state.appMode === 'website') {
                node.style.width = prevWidth;
                node.style.height = prevHeight;
            }
        }
    };

    const isSplit =
        state.appMode === 'instagram' && !state.isGradient && state.image && state.layoutMode === 'split';

    // Дуотон активен только для фото-фона; тонируем в фирменный bgColor.
    const duotoneColor = !state.isGradient && state.image && state.photoDuotone ? state.bgColor : undefined;

    const bgStyle: React.CSSProperties = state.isGradient
        ? {
              background: resolveCoverBackgroundCss(
                  state.gradientPreset,
                  state.bgColor,
                  state.gradientFlow,
                  state.gradientGeometry,
                  state.gradientCustomStops
              ),
          }
        : !state.image
          ? { backgroundColor: state.bgColor }
          : {};

    const overlayTextureSuffix = COVER_OVERLAY_TEXTURE_META[state.overlayTexture].cssSuffix;
    const showOverlayTexture = !isSplit && state.overlayTexture !== 'none' && overlayTextureSuffix;

    const previewWidth = 360;
    let previewHeight = 450;

    if (state.appMode === 'website') {
        previewHeight = 188;
    } else if (state.ratio === 'square') {
        previewHeight = 360;
    } else if (state.ratio === 'story') {
        previewHeight = 640;
    }

    const hasBrandingLogos = state.logos.length > 0;

    const coverClassName = [
        'cover-node',
        state.appMode === 'instagram' ? `style-template-${state.template}` : '',
        state.isGradient ? 'gradient-mode' : '',
        isSplit ? 'split-layout' : '',
        state.ratio === 'story' ? 'story-layout' : '',
        state.appMode === 'website' ? 'horizontal-ratio' : '',
        hasBrandingLogos ? 'has-branding-logos' : '',
    ]
        .filter(Boolean)
        .join(' ');

    const coverFontVars = {
        ['--font-primary' as string]: coverFontStack(state.coverFontPreset),
        ['--title-scale' as string]: String((state.titleScale ?? 100) / 100),
    } as React.CSSProperties;

    return (
        <div className="preview-layout">
            <div className="preview-wrapper">
                <div
                    className={coverClassName}
                    ref={ref}
                    style={
                        isSplit
                            ? {
                                  ...coverFontVars,
                                  width: `${previewWidth}px`,
                                  height: `${previewHeight}px`,
                                  backgroundColor: state.bgColor,
                              }
                            : {
                                  ...coverFontVars,
                                  ...bgStyle,
                                  width: `${previewWidth}px`,
                                  height: `${previewHeight}px`,
                              }
                    }
                >
                    {showOverlayTexture && (
                        <div
                            className={cn('cover-overlay-texture', `cover-overlay-texture--${overlayTextureSuffix}`)}
                            style={{ opacity: state.overlayTextureOpacity / 100 }}
                            aria-hidden
                        />
                    )}
                    {!state.isGradient && state.image && !isSplit && (
                        <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden>
                            {state.imageFit === 'blur' && (
                                <img
                                    src={state.image}
                                    alt=""
                                    className="cover-image-backdrop"
                                    style={
                                        duotoneColor
                                            ? { filter: `blur(20px) saturate(1.1) brightness(0.9) ${duotoneFilter(duotoneColor)}` }
                                            : undefined
                                    }
                                />
                            )}
                            <img
                                src={state.image}
                                alt=""
                                className={cn('block h-full w-full', state.imageFit === 'blur' && 'relative')}
                                style={coverImageLayerStyle(state, state.imageFit, duotoneColor)}
                            />
                        </div>
                    )}

                    {state.logos.length > 0 && (() => {
                        const isWebsite = state.appMode === 'website';
                        const isStory = state.ratio === 'story';
                        const pad = isWebsite ? 14 : 22;
                        const gap = isWebsite ? 5 : 8;
                        const n = state.logos.length;
                        const tintCss = logoTintFilter(state.logoTint);
                        return (
                            <div
                                className={cn(
                                    'branding-logos-strip',
                                    isWebsite && 'branding-logos-strip--website',
                                    isStory && 'branding-logos-strip--story'
                                )}
                            >
                                <div className="branding-logos-row">
                                    {state.logos.map((src, idx) => {
                                        const w = widthForLogoInRow({
                                            previewWidth,
                                            horizontalPadding: pad,
                                            gap,
                                            logoSize: state.logoSize,
                                            countInRow: n,
                                        });
                                        return (
                                            <div
                                                key={`${idx}-${src.slice(0, 16)}`}
                                                className="branding-logo-item"
                                                style={{
                                                    width: w,
                                                    opacity: state.logoOpacity / 100,
                                                }}
                                            >
                                                <img
                                                    src={src}
                                                    alt=""
                                                    style={tintCss ? { filter: tintCss } : undefined}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })()}

                    {state.showSafeZones && state.appMode === 'instagram' && (
                        <div className="ig-ui-overlay">
                            <div className="ig-top-bar">
                                <div className="ig-user">
                                    <div
                                        className="ig-avatar"
                                        style={{
                                            backgroundImage: 'url(/stanbase-logo.svg)',
                                            backgroundSize: 'cover',
                                        }}
                                    />
                                    <div className="ig-username">stanbasetech</div>
                                </div>
                            </div>
                            <div className="ig-bottom-actions">
                                <div className="ig-main-actions">
                                    <div className="ig-icon" />
                                    <div className="ig-icon" />
                                    <div className="ig-icon" />
                                </div>
                                <div className="ig-caption-area">
                                    <strong>stanbasetech</strong> Creating the future of startups and venture capital...
                                </div>
                            </div>
                        </div>
                    )}

                    {state.appMode === 'website' ? (
                        <>
                            {state.caption && (
                                <div className="caption" style={{ color: state.captionColor }}>
                                    {state.caption}
                                </div>
                            )}
                            <PhotoCreditMark state={state} />
                        </>
                    ) : isSplit ? (
                        <div className="split-layout-body">
                            <div className="split-image">
                                <img
                                    src={state.image!}
                                    alt=""
                                    className="split-image__img"
                                    style={coverImageLayerStyle(state, 'cover', duotoneColor)}
                                />
                                <PhotoCreditMark state={state} inSplit />
                            </div>
                            <div
                                ref={contentRef}
                                className="split-content"
                                style={{
                                    backgroundColor: state.bgColor,
                                    justifyContent: state.contentAlignment,
                                }}
                            >
                                <InstagramContentBlock state={state} />
                            </div>
                        </div>
                    ) : (
                        <>
                            {!state.isGradient && (
                                <div
                                    className="overlay"
                                    style={{
                                        background: `linear-gradient(to bottom, rgba(0,0,0,${state.overlayOpacity * 0.3}), rgba(0,0,0,${state.overlayOpacity}))`,
                                    }}
                                />
                            )}
                            <PhotoCreditMark state={state} />
                            <div
                                ref={contentRef}
                                className={`content ${state.useGlassmorphism ? 'glass-effect' : ''} ${state.useGlassmorphism ? `glass-width-${state.glassWidth}` : ''}`}
                                style={{
                                    justifyContent: state.contentAlignment,
                                    backgroundColor: state.useGlassmorphism
                                        ? `rgba(255, 255, 255, ${state.glassBlur / 100})`
                                        : undefined,
                                }}
                            >
                                <InstagramContentBlock state={state} />
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button type="button" variant="default" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => downloadImage('png')}>
                    <Download className="size-3.5" />
                    Download PNG
                </Button>
                <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => downloadImage('jpeg')}>
                    <FileType className="size-3.5" />
                    Download JPG
                </Button>
            </div>
            {state.appMode === 'website' && (
                <p className="mt-2 max-w-md text-center text-[11px] leading-snug text-muted-foreground">
                    Tip: use <span className="font-medium text-foreground">JPG</span> for smaller file size (under 500 KB).
                </p>
            )}
        </div>
    );
};
