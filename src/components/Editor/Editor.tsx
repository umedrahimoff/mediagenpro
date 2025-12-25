import React from 'react';
import type { ChangeEvent } from 'react';
import { BRAND_COLORS } from '../../App';
import type { CoverState } from '../../App';
import { Upload, Palette } from 'lucide-react';
import './Editor.css';

interface EditorProps {
    state: CoverState;
    onChange: (updates: Partial<CoverState>) => void;
}

export const Editor: React.FC<EditorProps> = ({ state, onChange }) => {
    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);

            // Detect aspect ratio
            const img = new Image();
            img.onload = () => {
                const aspect = img.width / img.height;
                let orientation: 'vertical' | 'square' | 'horizontal' = 'square';

                if (aspect <= 0.85) { // Taller than 4:5 (0.8) approx
                    orientation = 'vertical';
                } else if (aspect >= 1.3) { // Wider than 4:3 approx
                    orientation = 'horizontal';
                }

                onChange({ image: url, isGradient: false, imageOrientation: orientation });
            };
            img.src = url;
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
                <h2>{state.appMode === 'website' ? 'Website Poster Gen' : 'Instagram Cover Gen'}</h2>
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
                </div>
            )}

            {state.appMode === 'instagram' ? (
                <>
                    <div className="control-group">
                        <label>Title</label>
                        <textarea
                            value={state.title}
                            onChange={(e) => onChange({ title: e.target.value })}
                            rows={4}
                            placeholder="Enter title..."
                        />
                    </div>

                    <ColorPicker
                        label="Title Color"
                        value={state.titleColor}
                        onChangeColor={(c) => onChange({ titleColor: c })}
                    />

                    <div className="control-group">
                        <label>Category</label>
                        <input
                            type="text"
                            value={state.category}
                            onChange={(e) => onChange({ category: e.target.value })}
                            placeholder="e.g. VISUAL DESIGN"
                        />
                        <div className="category-presets">
                            {['новости', 'инвестиции', 'стартапы', 'аналитика', 'фаундеры'].map(preset => (
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
                            placeholder="e.g. Photo by Standase"
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
                    {state.appMode === 'instagram' && (
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
                        <button className="upload-btn" onClick={() => document.getElementById('file-upload')?.click()}>
                            <Upload size={18} /> {state.image ? 'Replace Image' : 'Upload Image'}
                        </button>
                        {state.appMode === 'website' && (
                            <span className="hint" style={{ marginTop: '8px', display: 'block' }}>
                                High-quality compression &lt; 500kb
                            </span>
                        )}
                    </div>
                )}
            </div>

            {state.isGradient && state.appMode === 'instagram' && (
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
