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

function CoverContentBlock({ state }: { state: CoverState }) {
    return (
        <div className="instagram-cover-text">
            {state.category && (
                <div className="category" style={{ color: state.categoryColor }}>
                    {state.category}
                </div>
            )}
            <div className="title" style={{ color: state.titleColor, textTransform: 'none' }}>
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

function PhotoCreditMark({ state }: { state: CoverState }) {
    if (!photoCreditVisible(state)) return null;
    return (
        <div className={cn('photo-credit-mark', `photo-credit-mark--${state.photoCreditCorner}`)}>
            {state.photoCredit.trim()}
        </div>
    );
}

export const Preview: React.FC<PreviewProps> = ({ state }) => {
    const ref = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    /**
     * Авто-подгонка размера заголовка: если текст не влезает в текстовый блок, ужимаем через
     * CSS-переменную --title-fit (умножается на ручной --title-scale). titleScale — верхняя граница.
     * Меряем высоту внутреннего блока против доступной высоты контейнера (scrollHeight контейнера
     * не годится: при justify-content: flex-end переполнение уходит вверх за край).
     */
    useLayoutEffect(() => {
        const cover = ref.current;

        const applyFit = () => {
            if (!cover) return;
            const box = contentRef.current;
            const inner = box?.querySelector<HTMLElement>('.instagram-cover-text');
            if (!state.titleAutoFit || !box || !inner) {
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

        // Шрифты могут догрузиться после первого замера — пересчитываем.
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

        const targetWidth = 1080;
        const targetHeight = state.ratio === 'square' ? 1080 : state.ratio === 'story' ? 1920 : 1350;

        const node = ref.current;
        const scale = targetWidth / node.clientWidth;

        const baseOptions: Options = {
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
            const func = format === 'png' ? htmlToImage.toPng : htmlToImage.toJpeg;
            const options: Options = format === 'jpeg' ? { ...baseOptions, quality: 0.95 } : baseOptions;
            const dataUrl = await func(node, options);

            const link = document.createElement('a');
            link.download = `cover-${Date.now()}.${format}`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to generate image', err);
            const msg = err instanceof Error ? err.message : String(err);
            alert(`Could not create image.${msg ? ` ${msg}` : ''}`);
        }
    };

    // Дуотон активен только для фото-фона; тонируем в фирменный bgColor.
    const duotoneColor = !state.isGradient && state.image && state.photoDuotone ? state.bgColor : undefined;

    const bgStyle: React.CSSProperties = state.isGradient
        ? { background: resolveCoverBackgroundCss(state.gradientPreset, state.bgColor) }
        : !state.image
          ? { backgroundColor: state.bgColor }
          : {};

    const previewWidth = 360;
    const previewHeight = state.ratio === 'square' ? 360 : state.ratio === 'story' ? 640 : 450;

    const hasBrandingLogos = state.logos.length > 0;

    const coverClassName = [
        'cover-node',
        state.isGradient ? 'gradient-mode' : '',
        state.ratio === 'story' ? 'story-layout' : '',
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
                    style={{
                        ...coverFontVars,
                        ...bgStyle,
                        width: `${previewWidth}px`,
                        height: `${previewHeight}px`,
                    }}
                >
                    {!state.isGradient && state.image && (
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
                        const isStory = state.ratio === 'story';
                        const n = state.logos.length;
                        const tintCss = logoTintFilter(state.logoTint);
                        return (
                            <div className={cn('branding-logos-strip', isStory && 'branding-logos-strip--story')}>
                                <div className="branding-logos-row">
                                    {state.logos.map((src, idx) => {
                                        const w = widthForLogoInRow({
                                            previewWidth,
                                            horizontalPadding: 22,
                                            gap: 8,
                                            logoSize: state.logoSize,
                                            countInRow: n,
                                        });
                                        return (
                                            <div
                                                key={`${idx}-${src.slice(0, 16)}`}
                                                className="branding-logo-item"
                                                style={{ width: w, opacity: state.logoOpacity / 100 }}
                                            >
                                                <img src={src} alt="" style={tintCss ? { filter: tintCss } : undefined} />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })()}

                    {state.showSafeZones && (
                        <div className="ig-ui-overlay">
                            <div className="ig-top-bar">
                                <div className="ig-user">
                                    <div
                                        className="ig-avatar"
                                        style={{ backgroundImage: 'url(/stanbase-logo.svg)', backgroundSize: 'cover' }}
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

                    {!state.isGradient && state.image && (
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
                        className="content"
                        style={{ justifyContent: state.contentAlignment }}
                    >
                        <CoverContentBlock state={state} />
                    </div>
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
        </div>
    );
};
