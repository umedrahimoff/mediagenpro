import React, { useRef } from 'react';
import type { CoverState } from '../../App';
import * as htmlToImage from 'html-to-image';
import { Download, FileType } from 'lucide-react';
import './Preview.css';

interface PreviewProps {
    state: CoverState;
}

export const Preview: React.FC<PreviewProps> = ({ state }) => {
    const ref = useRef<HTMLDivElement>(null);

    const downloadImage = async (format: 'png' | 'jpeg') => {
        if (!ref.current) return;

        // Target dimensions
        let targetWidth = 1080;
        let targetHeight = 1350;

        if (state.appMode === 'website') {
            targetWidth = 1200;
            if (state.ratio === 'horizontal') targetHeight = 628;
            else if (state.ratio === 'square') targetHeight = 1200;
            else if (state.ratio === 'vertical') targetHeight = 1500;
        } else {
            // Instagram defaults
            if (state.ratio === 'square') {
                targetHeight = 1080;
            } else if (state.ratio === 'horizontal') {
                targetHeight = 608;
            }
        }

        const node = ref.current;

        // Calculate scale factor
        const scale = targetWidth / node.clientWidth;

        try {
            const func = format === 'png' ? htmlToImage.toPng : htmlToImage.toJpeg;
            const options: any = {
                width: targetWidth,
                height: targetHeight,
                style: {
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    width: `${node.clientWidth}px`,
                    height: `${node.clientHeight}px`,
                }
            };

            if (format === 'jpeg') {
                // 0.8 is the sweet spot for web optimization (good quality, small size)
                options.quality = state.appMode === 'website' ? 0.8 : 0.95;
            }

            const dataUrl = await func(node, {
                ...options,
                filter: (domNode: any) => {
                    const classList = domNode.classList;
                    return !classList || !classList.contains('ig-ui-overlay');
                }
            });

            const link = document.createElement('a');
            link.download = `cover-${Date.now()}.${format}`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to generate image', err);
            alert('Failed to generate image. Please try again.');
        }
    };

    const bgStyle: React.CSSProperties = state.isGradient
        ? { background: `linear-gradient(135deg, ${state.bgColor} 0%, #000 150%)` }
        : { backgroundImage: `url(${state.image})`, backgroundSize: 'cover', backgroundPosition: 'center' };

    const isSplit = !state.isGradient && state.ratio !== 'vertical';

    // Dynamic preview dimensions
    const previewWidth = 360;
    let previewHeight = 450; // default 4:5

    if (state.appMode === 'website') {
        if (state.ratio === 'horizontal') previewHeight = 188; // 1200x628 -> 360x188
        else if (state.ratio === 'square') previewHeight = 360;
        else if (state.ratio === 'vertical') previewHeight = 450;
    } else {
        if (state.ratio === 'square') previewHeight = 360;
        else if (state.ratio === 'horizontal') previewHeight = 203;
    }

    return (
        <div className="preview-layout">
            <div className="preview-wrapper">
                <div
                    className={`cover-node ${isSplit && state.appMode === 'instagram' ? 'split-layout' : ''} ${state.ratio === 'horizontal' ? 'horizontal-ratio' : ''}`}
                    ref={ref}
                    style={isSplit && state.appMode === 'instagram' ?
                        { width: `${previewWidth}px`, height: `${previewHeight}px`, backgroundColor: state.bgColor } :
                        {
                            ...bgStyle,
                            width: `${previewWidth}px`,
                            height: `${previewHeight}px`
                        }}
                >
                    {state.showSafeZones && state.appMode === 'instagram' && (
                        <div className="ig-ui-overlay">
                            <div className="ig-top-bar">
                                <div className="ig-user">
                                    <div className="ig-avatar" />
                                    <div className="ig-username">mediagen_pro</div>
                                </div>
                            </div>
                            <div className="ig-bottom-actions">
                                <div className="ig-main-actions">
                                    <div className="ig-icon" />
                                    <div className="ig-icon" />
                                    <div className="ig-icon" />
                                </div>
                                <div className="ig-caption-area">
                                    <strong>mediagen_pro</strong> This is where your caption will appear...
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
                        </>
                    ) : isSplit ? (
                        <>
                            <div className="split-image" style={{ backgroundImage: `url(${state.image})` }} />
                            <div className="split-content" style={{ backgroundColor: state.bgColor }}>
                                {state.category && (
                                    <div className="category" style={{ color: state.categoryColor }}>
                                        {state.category}
                                    </div>
                                )}
                                <div className="title" style={{ color: state.titleColor }}>
                                    {state.title}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {!state.isGradient && <div className="overlay" />}
                            <div className="content">
                                {state.category && (
                                    <div className="category" style={{ color: state.categoryColor }}>
                                        {state.category}
                                    </div>
                                )}
                                <div className="title" style={{ color: state.titleColor }}>
                                    {state.title}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="download-actions">
                <button className="download-btn" onClick={() => downloadImage('png')}>
                    <Download size={18} /> Download PNG
                </button>
                <button className="download-btn" onClick={() => downloadImage('jpeg')}>
                    <FileType size={18} /> Download JPG
                </button>
            </div>
            {state.appMode === 'website' && (
                <p className="hint" style={{ marginTop: '12px', textAlign: 'center' }}>
                    * Tip: Use <strong>JPG</strong> for best compression and small file size (under 500kb).
                </p>
            )}
        </div>
    );
};
