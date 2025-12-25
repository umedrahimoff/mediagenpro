import React from 'react';
import type { ChangeEvent } from 'react';
import { BRAND_COLORS } from '../../App';
import type { CoverState } from '../../App';
import { Upload, Palette, X } from 'lucide-react';
import './Editor.css';

interface EditorProps {
    state: CoverState;
    onChange: (updates: Partial<CoverState>) => void;
}

export const Editor: React.FC<EditorProps> = ({ state, onChange }) => {
    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();

            reader.onload = (event) => {
                const url = event.target?.result as string;

                // Detect aspect ratio
                const img = new Image();
                img.onload = () => {
                    const aspect = img.width / img.height;
                    let orientation: 'vertical' | 'square' | 'horizontal' = 'square';

                    if (aspect <= 0.85) {
                        orientation = 'vertical';
                    } else if (aspect >= 1.3) {
                        orientation = 'horizontal';
                    }

                    const newLayout = orientation === 'horizontal' ? 'split' : 'overlay';
                    onChange({ image: url, isGradient: false, imageOrientation: orientation, layoutMode: newLayout });
                };
                img.src = url;
            };

            reader.readAsDataURL(file);
        }
    };

    const ColorPicker = ({ label, value, onChangeColor }: { label: string, value: string, onChangeColor: (c: string) => void }) => (
        <div className="control-group">
            <label className="picker-label"><Palette size={14} /> {label}</label>
            <div className="color-swatches">
                {Object.values(BRAND_COLORS).map((color) => (
                    <button
                        key={color}
                        className={`swatch ${value === color ? 'active' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => onChangeColor(color)}
                        title={color}
                    />
                ))}
            </div>
        </div>
    );

    return (
        <div className="editor">
            <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                hidden
            />
            <div className="logo">
                <h2>
                    {state.appMode === 'website' ? 'Website Poster Gen' :
                        state.appMode === 'linkedin' ? 'LinkedIn Mode' : 'Instagram Cover Gen'}
                </h2>
            </div>

            {state.appMode === 'website' ? (
                <div className="control-group">
                    <label>Proportions</label>
                    <div className="toggle-group">
                        <button
                            className={state.ratio === 'horizontal' ? 'active' : ''}
                            onClick={() => onChange({ ratio: 'horizontal' })}
                        >
                            1200x628
                        </button>
                        <button
                            className={state.ratio === 'square' ? 'active' : ''}
                            onClick={() => onChange({ ratio: 'square' })}
                        >
                            Square
                        </button>
                        <button
                            className={state.ratio === 'vertical' ? 'active' : ''}
                            onClick={() => onChange({ ratio: 'vertical' })}
                        >
                            4:5
                        </button>
                    </div>
                </div>
            ) : state.appMode === 'linkedin' ? (
                <div className="control-group">
                    <label>LinkedIn Proportions</label>
                    <div className="toggle-group">
                        <button
                            className={state.ratio === 'horizontal' ? 'active' : ''}
                            onClick={() => onChange({ ratio: 'horizontal' })}
                        >
                            Feed (1200x627)
                        </button>
                        <button
                            className={state.ratio === 'square' ? 'active' : ''}
                            onClick={() => onChange({ ratio: 'square' })}
                        >
                            Square (1200x1200)
                        </button>
                    </div>

                    {!state.isGradient && state.image && (
                        <div style={{ marginTop: '16px' }}>
                            <label style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '8px', display: 'block' }}>Layout Type</label>
                            <div className="toggle-group">
                                <button
                                    className={state.layoutMode === 'overlay' ? 'active' : ''}
                                    onClick={() => onChange({ layoutMode: 'overlay' })}
                                >
                                    Overlay
                                </button>
                                <button
                                    className={state.layoutMode === 'split' ? 'active' : ''}
                                    onClick={() => onChange({ layoutMode: 'split' })}
                                >
                                    Split
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="control-group">
                    <label>Proportions</label>
                    <div className="toggle-group">
                        <button
                            className={state.ratio === 'vertical' ? 'active' : ''}
                            onClick={() => onChange({ ratio: 'vertical' })}
                        >
                            Portrait (4:5)
                        </button>
                        <button
                            className={state.ratio === 'square' ? 'active' : ''}
                            onClick={() => onChange({ ratio: 'square' })}
                        >
                            Square (1:1)
                        </button>
                        <button
                            className={state.ratio === 'story' ? 'active' : ''}
                            onClick={() => onChange({ ratio: 'story' })}
                        >
                            Story (9:16)
                        </button>
                    </div>
                    <div className="safe-zone-toggle">
                        <label className="checkbox-container">
                            <input
                                type="checkbox"
                                checked={state.showSafeZones}
                                onChange={(e) => onChange({ showSafeZones: e.target.checked })}
                            />
                            <span className="checkmark"></span>
                            Show IG Safe Zones
                        </label>
                    </div>

                    {!state.isGradient && state.image && (
                        <div style={{ marginTop: '16px' }}>
                            <label style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '8px', display: 'block' }}>Layout Type</label>
                            <div className="toggle-group">
                                <button
                                    className={state.layoutMode === 'overlay' ? 'active' : ''}
                                    onClick={() => onChange({ layoutMode: 'overlay' })}
                                >
                                    Overlay
                                </button>
                                <button
                                    className={state.layoutMode === 'split' ? 'active' : ''}
                                    onClick={() => onChange({ layoutMode: 'split' })}
                                >
                                    Split
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {state.appMode === 'instagram' ? (
                <>
                    <div className="control-group">
                        <label>Style Template</label>
                        <div className="toggle-group">
                            <button
                                className={state.template === 'bold' ? 'active' : ''}
                                onClick={() => onChange({ template: 'bold' })}
                            >
                                Bold
                            </button>
                            <button
                                className={state.template === 'minimal' ? 'active' : ''}
                                onClick={() => onChange({ template: 'minimal' })}
                            >
                                Minimal
                            </button>
                            <button
                                className={state.template === 'quote' ? 'active' : ''}
                                onClick={() => onChange({ template: 'quote' })}
                            >
                                Quote
                            </button>
                        </div>
                    </div>

                    <div className="control-group">
                        <label>{state.template === 'quote' ? 'Quote Text' : 'Title'}</label>
                        <textarea
                            value={state.title}
                            onChange={(e) => onChange({ title: e.target.value })}
                            rows={4}
                            placeholder={state.template === 'quote' ? "Enter the quote..." : "Enter title..."}
                        />
                        <div className="toggle-group" style={{ marginTop: '8px' }}>
                            <button
                                className={state.textTransform === 'uppercase' ? 'active' : ''}
                                onClick={() => onChange({ textTransform: 'uppercase' })}
                                style={{ fontSize: '10px' }}
                            >
                                ALL CAPS
                            </button>
                            <button
                                className={state.textTransform === 'capitalize' ? 'active' : ''}
                                onClick={() => onChange({ textTransform: 'capitalize' })}
                                style={{ fontSize: '10px' }}
                            >
                                Title Case
                            </button>
                            <button
                                className={state.textTransform === 'none' ? 'active' : ''}
                                onClick={() => onChange({ textTransform: 'none' })}
                                style={{ fontSize: '10px' }}
                            >
                                As Is
                            </button>
                        </div>
                    </div>

                    <ColorPicker
                        label="Title Color"
                        value={state.titleColor}
                        onChangeColor={(c) => onChange({ titleColor: c })}
                    />

                    <div className="control-group">
                        <label>{state.template === 'quote' ? 'Author' : 'Category'}</label>
                        <input
                            type="text"
                            value={state.category}
                            onChange={(e) => onChange({ category: e.target.value })}
                            placeholder={state.template === 'quote' ? "e.g. Steve Jobs" : "e.g. VISUAL DESIGN"}
                        />
                        <div className="category-presets">
                            {['news', 'investments', 'startups', 'analytics', 'founders'].map(preset => (
                                <button
                                    key={preset}
                                    className={`preset-chip ${state.category.toLowerCase() === preset.toLowerCase() ? 'active' : ''}`}
                                    onClick={() => onChange({ category: preset.toUpperCase() })}
                                >
                                    {preset}
                                </button>
                            ))}
                        </div>
                    </div>

                    <ColorPicker
                        label="Category Color"
                        value={state.categoryColor}
                        onChangeColor={(c) => onChange({ categoryColor: c })}
                    />
                </>
            ) : (
                <>
                    <div className="control-group">
                        <label>Caption / Watermark</label>
                        <input
                            type="text"
                            value={state.caption}
                            onChange={(e) => onChange({ caption: e.target.value })}
                            placeholder="e.g. stanbase.tech"
                        />
                    </div>
                    <ColorPicker
                        label="Caption Color"
                        value={state.captionColor}
                        onChangeColor={(c) => onChange({ captionColor: c })}
                    />
                </>
            )}

            <div className="control-group">
                <label>Background Style</label>
                <div className="toggle-group">
                    {state.appMode !== 'website' && (
                        <button
                            className={state.isGradient ? 'active' : ''}
                            onClick={() => onChange({ isGradient: true })}
                        >
                            Brand Gradient
                        </button>
                    )}
                    <button
                        className={!state.isGradient ? 'active' : ''}
                        onClick={() => {
                            onChange({ isGradient: false });
                            if (!state.image) document.getElementById('file-upload')?.click();
                        }}
                    >
                        {state.appMode === 'website' ? 'Image to Process' : 'Image'}
                    </button>
                </div>

                {!state.isGradient && (
                    <div className="upload-area">
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="upload-btn" onClick={() => document.getElementById('file-upload')?.click()} style={{ flex: 1 }}>
                                <Upload size={16} /> {state.image ? 'Replace' : 'Upload Image'}
                            </button>
                            {state.image && (
                                <button
                                    className="remove-btn"
                                    onClick={() => onChange({ image: null, isGradient: true })}
                                    title="Remove Image"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {!state.isGradient && state.image && state.appMode !== 'linkedin' && (
                            <div style={{ marginTop: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <label style={{ fontSize: '0.75rem', opacity: 0.7 }}>Image Darkness</label>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{Math.round(state.overlayOpacity * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={state.overlayOpacity}
                                    onChange={(e) => onChange({ overlayOpacity: parseFloat(e.target.value) })}
                                    style={{ width: '100%', cursor: 'pointer' }}
                                />
                            </div>
                        )}

                        {state.appMode === 'website' && (
                            <span className="hint" style={{ marginTop: '8px', display: 'block' }}>
                                High-quality compression &lt; 500kb
                            </span>
                        )}
                    </div>
                )}
            </div>

            {(state.isGradient || state.layoutMode === 'split') && (
                <ColorPicker
                    label="Background Color"
                    value={state.bgColor}
                    onChangeColor={(c) => onChange({ bgColor: c })}
                />
            )}

            <footer className="editor-footer">
                <a href="https://stanbase.tech/" target="_blank" rel="noopener noreferrer">
                    <span>Powered by</span>
                    <strong>Stanbase</strong>
                </a>
            </footer>
        </div>
    );
};
