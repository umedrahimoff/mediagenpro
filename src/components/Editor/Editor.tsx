import React, { type ChangeEvent, useState } from 'react';
import type {
  CoverFontPreset,
  CoverOverlayTextureId,
  CoverState,
  GradientFlowId,
  GradientGeometryId,
  GradientStop,
} from '@/types/cover';
import { GRADIENT_BACKGROUND_DEFAULTS } from '@/constants/coverDefaults';
import { COVER_OVERLAY_TEXTURE_META, COVER_OVERLAY_TEXTURE_ORDER } from '@/constants/coverOverlayTextures';
import {
  GRADIENT_GEOMETRY_META,
  GRADIENT_GEOMETRY_ORDER,
} from '@/constants/coverGradientGeometry';
import {
  getPresetGradientStops,
  GRADIENT_FLOW_GRID,
  GRADIENT_FLOW_META,
  GRADIENT_PRESET_META,
  GRADIENT_PRESET_ORDER,
} from '@/constants/gradientPresets';
import { COVER_FONT_PRESETS, COVER_FONT_PRESET_ORDER } from '@/constants/coverFonts';
import { ColorPicker } from './ColorPicker';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowDown,
  ArrowDownLeft,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpLeft,
  ArrowUpRight,
  ChevronDown,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

const GRADIENT_FLOW_ICONS: Record<GradientFlowId, LucideIcon> = {
  'to-top': ArrowUp,
  'to-bottom': ArrowDown,
  'to-left': ArrowLeft,
  'to-right': ArrowRight,
  'diag-tl': ArrowUpLeft,
  'diag-tr': ArrowUpRight,
  'diag-bl': ArrowDownLeft,
  'diag-br': ArrowDownRight,
};
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { logoTintFilter, MAX_LOGOS } from '@/utils/logoLayout';
import { ImageCropDialog, type PendingBackgroundImage } from './ImageCropDialog';

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_EVENT_SPEAKERS = 6;
const MAX_CUSTOM_GRADIENT_STOPS = 8;

function hexForNativeColorInput(hex: string): string {
  const h = hex.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(h)) return h.toUpperCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(h)) {
    const x = h.slice(1);
    return `#${x[0]}${x[0]}${x[1]}${x[1]}${x[2]}${x[2]}`.toUpperCase();
  }
  return '#808080';
}

interface EditorProps {
  state: CoverState;
  onChange: (updates: Partial<CoverState>) => void;
}

const compactToggle =
  '[&_[data-slot=toggle-group-item]]:h-7 [&_[data-slot=toggle-group-item]]:min-h-7 [&_[data-slot=toggle-group-item]]:px-1.5 [&_[data-slot=toggle-group-item]]:text-[11px]';

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </Label>
  );
}

function EditorSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Collapsible defaultOpen className="rounded-md border border-border bg-card shadow-sm">
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-xs font-medium hover:bg-muted/50 [&[data-state=open]>svg]:rotate-180">
        <span>{title}</span>
        <ChevronDown className="size-3.5 shrink-0 opacity-50 transition-transform duration-200" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col gap-2.5 border-t border-border px-2.5 py-2">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export const Editor: React.FC<EditorProps> = ({ state, onChange }) => {
  const [pendingBackground, setPendingBackground] = useState<PendingBackgroundImage | null>(null);
  const [speakerPhotoIdx, setSpeakerPhotoIdx] = useState<number | null>(null);

  const readImageFile = (file: File, onReady: (dataUrl: string) => void) => {
    if (file.size > MAX_IMAGE_BYTES) {
      alert(`File too large (max ${MAX_IMAGE_BYTES / (1024 * 1024)} MB).`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result;
      if (typeof url === 'string') onReady(url);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readImageFile(file, (url) => {
      const img = new Image();
      img.onload = () => {
        const aspect = img.width / img.height;
        let orientation: 'vertical' | 'square' | 'horizontal' = 'square';
        if (aspect <= 0.85) orientation = 'vertical';
        else if (aspect >= 1.3) orientation = 'horizontal';
        // Ориентация рамки текущего формата.
        const canvasOrientation: 'vertical' | 'square' | 'horizontal' =
          state.appMode === 'website'
            ? 'horizontal'
            : state.ratio === 'square'
              ? 'square'
              : 'vertical';
        // Если фото не совпадает по форме с рамкой — предлагаем «целиком + размытый фон»,
        // чтобы горизонтальное фото в вертикальной обложке не обрезалось.
        const suggestedFit: CoverState['imageFit'] =
          orientation !== canvasOrientation ? 'blur' : 'cover';
        setPendingBackground({
          url,
          imageOrientation: orientation,
          layoutMode: 'overlay',
          imageFit: suggestedFit,
        });
      };
      img.src = url;
    });
    e.target.value = '';
  };

  const handleSpeakerPhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const idx = speakerPhotoIdx;
    e.target.value = '';
    if (!file || idx === null) return;
    readImageFile(file, (url) => {
      const next = state.eventSpeakers.map((s, i) => (i === idx ? { ...s, photo: url } : s));
      onChange({ eventSpeakers: next });
    });
    setSpeakerPhotoIdx(null);
  };

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (state.logos.length >= MAX_LOGOS) {
      alert(`At most ${MAX_LOGOS} logos allowed.`);
      e.target.value = '';
      return;
    }
    readImageFile(file, (url) => onChange({ logos: [...state.logos, url] }));
    e.target.value = '';
  };

  const removeLogoAt = (index: number) => {
    onChange({ logos: state.logos.filter((_, i) => i !== index) });
  };

  const logosPreviewFilter = logoTintFilter(state.logoTint);

  const bgMode = state.isGradient ? 'gradient' : 'image';

  return (
    <div className="flex flex-col gap-2 pb-3">
      <ImageCropDialog
        open={pendingBackground !== null}
        pending={pendingBackground}
        canvasState={state}
        onOpenChange={(open) => {
          if (!open) setPendingBackground(null);
        }}
        onApply={(payload) => {
          onChange({
            image: payload.url,
            isGradient: false,
            imageOrientation: payload.imageOrientation,
            layoutMode: payload.layoutMode,
            imageFit: payload.imageFit,
            imageFocusX: payload.imageFocusX,
            imageFocusY: payload.imageFocusY,
            imageZoom: payload.imageZoom,
          });
          setPendingBackground(null);
        }}
      />
      <input id="file-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
      <input id="logo-upload" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
      <input
        id="speaker-photo-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleSpeakerPhotoUpload}
      />

      <div>
        <h2 className="text-xs font-medium text-muted-foreground">
          {state.appMode === 'website' ? 'Website' : 'Instagram'}
        </h2>
        {state.appMode === 'instagram' && (
          <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
            {state.postFormat === 'news' && 'News and info posts'}
            {state.postFormat === 'event' && 'Events: speakers, date & place'}
            {state.postFormat === 'promo' && 'Promo — same fields as news for now'}
          </p>
        )}
      </div>

      <EditorSection title="Cover font">
        <FieldLabel>Preset</FieldLabel>
        <ToggleGroup
          type="single"
          spacing={0}
          variant="outline"
          size="sm"
          value={state.coverFontPreset}
          onValueChange={(v) => v && onChange({ coverFontPreset: v as CoverFontPreset })}
          className={cn('flex w-full flex-wrap gap-1', compactToggle)}
        >
          {COVER_FONT_PRESET_ORDER.map((id) => (
            <ToggleGroupItem key={id} value={id} className="min-w-[calc(50%-2px)] flex-1 sm:min-w-0">
              {COVER_FONT_PRESETS[id].label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="text-[10px] leading-snug text-muted-foreground">
          {COVER_FONT_PRESETS[state.coverFontPreset].description}
        </p>
      </EditorSection>

      <EditorSection title="Layout & Canvas">
        {state.appMode === 'website' ? (
          <div className="flex flex-col gap-2">
            <FieldLabel>Website proportions</FieldLabel>
            <Button type="button" variant="secondary" size="xs" className="h-7 w-full justify-center text-xs" disabled>
              1200×628 (fixed)
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <FieldLabel>Proportions</FieldLabel>
              <ToggleGroup
                type="single"
                spacing={0}
                variant="outline"
                size="sm"
                value={state.ratio}
                onValueChange={(v) => v && onChange({ ratio: v as CoverState['ratio'] })}
                className={cn('w-full justify-stretch', compactToggle)}
              >
                <ToggleGroupItem value="vertical" className="flex-1">
                  4:5
                </ToggleGroupItem>
                <ToggleGroupItem value="square" className="flex-1">
                  1:1
                </ToggleGroupItem>
                <ToggleGroupItem value="story" className="flex-1">
                  9:16
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="ig-safe"
                checked={state.showSafeZones}
                onCheckedChange={(c) => onChange({ showSafeZones: c === true })}
              />
              <Label htmlFor="ig-safe" className="text-xs font-normal leading-snug">
                Show IG safe zones
              </Label>
            </div>
          </>
        )}
      </EditorSection>

      <EditorSection title="Background & image">
        {state.appMode === 'website' ? (
          <div className="flex flex-col gap-2">
            <FieldLabel>Image (OG)</FieldLabel>
            <Button
              type="button"
              variant="secondary"
              size="xs"
              className="h-7 w-full text-xs"
              onClick={() => {
                onChange({ isGradient: false });
                if (!state.image) document.getElementById('file-upload')?.click();
              }}
            >
              {state.image ? 'Change image' : 'Upload image'}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <FieldLabel>Background style</FieldLabel>
            <ToggleGroup
              type="single"
              spacing={0}
              variant="outline"
              size="sm"
              value={bgMode}
              onValueChange={(v) => {
                if (v === 'gradient') onChange({ isGradient: true });
                if (v === 'image') {
                  onChange({ isGradient: false });
                  if (!state.image) document.getElementById('file-upload')?.click();
                }
              }}
              className={cn('w-full justify-stretch', compactToggle)}
            >
              <ToggleGroupItem value="gradient" className="flex-1">
                Brand gradient
              </ToggleGroupItem>
              <ToggleGroupItem value="image" className="flex-1">
                Image
              </ToggleGroupItem>
            </ToggleGroup>
            {state.isGradient && (
              <div className="flex flex-col gap-2 border-t border-border pt-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 w-full gap-1.5 text-[11px]"
                  title="Brand preset, linear, default flow, no custom stops, accent color and texture as on first load"
                  onClick={() => onChange({ ...GRADIENT_BACKGROUND_DEFAULTS })}
                >
                  <RotateCcw className="size-3" />
                  Reset gradient settings
                </Button>
                <Collapsible defaultOpen={false} className="rounded-md border border-border bg-muted/15">
                  <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left text-[11px] font-medium text-muted-foreground hover:bg-muted/40 [&[data-state=open]>svg]:rotate-180">
                    <span>Gradient settings</span>
                    <ChevronDown className="size-3.5 shrink-0 opacity-70 transition-transform" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="flex flex-col gap-2 border-t border-border px-2 pb-2.5 pt-2">
                    <FieldLabel>Gradient preset</FieldLabel>
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {GRADIENT_PRESET_ORDER.map((id) => (
                        <Button
                          key={id}
                          type="button"
                          variant={state.gradientPreset === id ? 'default' : 'outline'}
                          size="sm"
                          className="h-auto min-h-8 w-full whitespace-normal px-2 py-2 text-center text-[11px] leading-snug"
                          onClick={() => onChange({ gradientPreset: id })}
                        >
                          {GRADIENT_PRESET_META[id].label}
                        </Button>
                      ))}
                    </div>
                    <FieldLabel>Gradient shape</FieldLabel>
                    <ToggleGroup
                      type="single"
                      spacing={0}
                      variant="outline"
                      size="sm"
                      value={state.gradientGeometry}
                      onValueChange={(v) => v && onChange({ gradientGeometry: v as GradientGeometryId })}
                      className={cn('grid w-full grid-cols-2 gap-1', compactToggle)}
                    >
                      {GRADIENT_GEOMETRY_ORDER.map((id) => (
                        <ToggleGroupItem
                          key={id}
                          value={id}
                          title={GRADIENT_GEOMETRY_META[id].hint}
                          className="h-auto min-h-8 whitespace-normal px-1.5 py-1.5 text-[10px] leading-tight"
                        >
                          {GRADIENT_GEOMETRY_META[id].label}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                    {state.gradientGeometry === 'linear' ? (
                      <>
                        <FieldLabel>Direction (linear)</FieldLabel>
                        <ToggleGroup
                          type="single"
                          spacing={0}
                          variant="outline"
                          size="sm"
                          value={state.gradientFlow}
                          onValueChange={(v) => v && onChange({ gradientFlow: v as GradientFlowId })}
                          className={cn('grid w-full grid-cols-3 gap-1', compactToggle)}
                        >
                          {GRADIENT_FLOW_GRID.flatMap((row, ri) =>
                            row.map((cell, ci) =>
                              cell === null ? (
                                <span key={`gf-${ri}-${ci}`} className="h-8 min-h-8" aria-hidden />
                              ) : (
                                <ToggleGroupItem
                                  key={cell}
                                  value={cell}
                                  className="h-8 min-h-8 w-full p-0 [&_svg]:size-3.5"
                                  title={GRADIENT_FLOW_META[cell].label}
                                >
                                  {(() => {
                                    const Icon = GRADIENT_FLOW_ICONS[cell];
                                    return <Icon aria-hidden />;
                                  })()}
                                </ToggleGroupItem>
                              )
                            )
                          )}
                        </ToggleGroup>
                        <p className="text-[10px] leading-snug text-muted-foreground">
                          Same preset stops; in linear mode only the blend angle changes.
                        </p>
                      </>
                    ) : (
                      <p className="text-[10px] leading-snug text-muted-foreground">
                        Radial and corner spots use the same preset colors along the radius.
                      </p>
                    )}
                    <p className="text-[10px] leading-snug text-muted-foreground">
                      {GRADIENT_PRESET_META[state.gradientPreset].hint}
                    </p>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="custom-gradient-stops"
                        checked={state.gradientCustomStops !== null}
                        onCheckedChange={(c) =>
                          onChange(
                            c === true
                              ? {
                                  gradientCustomStops: getPresetGradientStops(
                                    state.gradientPreset,
                                    state.bgColor
                                  ),
                                }
                              : { gradientCustomStops: null }
                          )
                        }
                      />
                      <Label htmlFor="custom-gradient-stops" className="text-xs font-normal leading-snug">
                        Custom stops (% and color)
                      </Label>
                    </div>
                    {state.gradientCustomStops !== null && (
                      <div className="flex flex-col gap-1.5 rounded-md border border-border bg-muted/20 p-2">
                        {state.gradientCustomStops.map((stop, i) => (
                          <div key={`gs-${i}`} className="flex items-center gap-1.5">
                            <input
                              type="color"
                              className="h-7 w-9 shrink-0 cursor-pointer overflow-hidden rounded border border-border bg-transparent p-0"
                              value={hexForNativeColorInput(stop.color)}
                              onChange={(e) => {
                                const next: GradientStop[] = [...state.gradientCustomStops!];
                                next[i] = { ...next[i], color: e.target.value.toUpperCase() };
                                onChange({ gradientCustomStops: next });
                              }}
                              title="Color"
                            />
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              className="h-7 w-14 text-xs tabular-nums"
                              value={stop.percent}
                              onChange={(e) => {
                                const v = Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0));
                                const next: GradientStop[] = [...state.gradientCustomStops!];
                                next[i] = { ...next[i], percent: v };
                                onChange({ gradientCustomStops: next });
                              }}
                            />
                            <span className="text-[10px] text-muted-foreground">%</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              className="ml-auto shrink-0"
                              title="Remove stop"
                              disabled={state.gradientCustomStops!.length <= 2}
                              onClick={() =>
                                onChange({
                                  gradientCustomStops: state.gradientCustomStops!.filter((_, j) => j !== i),
                                })
                              }
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1 text-[11px]"
                          disabled={state.gradientCustomStops!.length >= MAX_CUSTOM_GRADIENT_STOPS}
                          onClick={() => {
                            const arr = state.gradientCustomStops!;
                            const last = arr[arr.length - 1];
                            onChange({
                              gradientCustomStops: [
                                ...arr,
                                { color: '#FFFFFF', percent: Math.min(100, (last?.percent ?? 0) + 8) },
                              ],
                            });
                          }}
                        >
                          <Plus className="size-3" />
                          Stop
                        </Button>
                      </div>
                    )}
                    <ColorPicker
                      label="Accent color"
                      value={state.bgColor}
                      onChangeColor={(c) => onChange({ bgColor: c })}
                    />
                    <p className="text-[10px] leading-snug text-muted-foreground">
                      For the Brand preset — gradient start; also split background and other elements using this color.
                    </p>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}
          </div>
        )}

        {!state.isGradient && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-auto flex-1 flex-col gap-0.5 border-dashed py-2"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <Upload className="size-3.5 opacity-70" />
                <span className="text-[11px] font-normal">{state.image ? 'Replace' : 'Upload image'}</span>
              </Button>
              {state.image && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-sm"
                  className="shrink-0"
                  title="Remove image"
                  onClick={() => onChange({ image: null, isGradient: true, photoCredit: '' })}
                >
                  <X className="size-3.5" />
                </Button>
              )}
            </div>

            {!state.isGradient && state.image && state.layoutMode !== 'split' && (
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Image fill</FieldLabel>
                <ToggleGroup
                  type="single"
                  spacing={0}
                  variant="outline"
                  size="sm"
                  value={state.imageFit}
                  onValueChange={(v) => v && onChange({ imageFit: v as CoverState['imageFit'] })}
                  className={cn('w-full', compactToggle)}
                >
                  <ToggleGroupItem value="cover" className="flex-1">
                    Crop
                  </ToggleGroupItem>
                  <ToggleGroupItem value="blur" className="flex-1">
                    Fit + blur
                  </ToggleGroupItem>
                </ToggleGroup>
                <p className="text-[10px] leading-snug text-muted-foreground">
                  «Fit + blur» shows the whole photo and fills the sides with a blurred copy — great for
                  horizontal photos in a vertical cover.
                </p>
              </div>
            )}

            {!state.isGradient && state.image && state.appMode === 'instagram' && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Label className="flex-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Image darkness
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    title="Reset to 60%"
                    onClick={() => onChange({ overlayOpacity: 0.6 })}
                  >
                    <RotateCcw className="size-3" />
                  </Button>
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {Math.round(state.overlayOpacity * 100)}%
                  </span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  step={5}
                  value={[Math.round(state.overlayOpacity * 100)]}
                  onValueChange={([v]) => onChange({ overlayOpacity: (v ?? 0) / 100 })}
                />
              </div>
            )}

            {state.image && !state.isGradient && (
              <div className="flex flex-col gap-2">
                <FieldLabel>Photo credit (watermark)</FieldLabel>
                <Input
                  className="h-7 text-xs"
                  value={state.photoCredit}
                  onChange={(e) => onChange({ photoCredit: e.target.value })}
                  placeholder="e.g. Unsplash / author"
                  maxLength={200}
                />
                <Label className="text-[10px] font-normal text-muted-foreground">Corner on cover</Label>
                <ToggleGroup
                  type="single"
                  spacing={0}
                  variant="outline"
                  size="sm"
                  value={state.photoCreditCorner}
                  onValueChange={(v) => v && onChange({ photoCreditCorner: v as CoverState['photoCreditCorner'] })}
                  className={cn('grid w-full grid-cols-4 gap-1', compactToggle)}
                >
                  <ToggleGroupItem value="tl" title="Top left" className="text-xs">
                    ↖
                  </ToggleGroupItem>
                  <ToggleGroupItem value="tr" title="Top right" className="text-xs">
                    ↗
                  </ToggleGroupItem>
                  <ToggleGroupItem value="bl" title="Bottom left" className="text-xs">
                    ↙
                  </ToggleGroupItem>
                  <ToggleGroupItem value="br" title="Bottom right" className="text-xs">
                    ↘
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            )}

            {state.appMode === 'website' && (
              <p className="text-[11px] leading-snug text-muted-foreground">High-quality compression &lt; 500 KB (JPG).</p>
            )}
          </div>
        )}

        {state.appMode === 'instagram' && !state.isGradient && state.image && (
          <div className="flex flex-col gap-2">
            <FieldLabel>Layout type</FieldLabel>
            <ToggleGroup
              type="single"
              spacing={0}
              variant="outline"
              size="sm"
              value={state.layoutMode}
              onValueChange={(v) => v && onChange({ layoutMode: v as CoverState['layoutMode'] })}
              className={cn('w-full', compactToggle)}
            >
              <ToggleGroupItem value="overlay" className="flex-1">
                Overlay
              </ToggleGroupItem>
              <ToggleGroupItem value="split" className="flex-1">
                Split
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        )}

        <div className="mt-2 flex flex-col gap-2 border-t border-border pt-2.5">
          <FieldLabel>Texture over background</FieldLabel>
          <ToggleGroup
            type="single"
            spacing={0}
            variant="outline"
            size="sm"
            value={state.overlayTexture}
            onValueChange={(v) => v && onChange({ overlayTexture: v as CoverOverlayTextureId })}
            className={cn('grid w-full grid-cols-1 gap-1 sm:grid-cols-3', compactToggle)}
          >
            {COVER_OVERLAY_TEXTURE_ORDER.map((id) => (
              <ToggleGroupItem key={id} value={id} className="text-[11px]">
                {COVER_OVERLAY_TEXTURE_META[id].label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {state.overlayTexture !== 'none' && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-[10px] font-normal text-muted-foreground">Texture strength</Label>
              <Slider
                min={5}
                max={100}
                step={1}
                value={[state.overlayTextureOpacity]}
                onValueChange={([v]) => onChange({ overlayTextureOpacity: v ?? 22 })}
              />
            </div>
          )}
          <p className="text-[10px] leading-snug text-muted-foreground">
            New texture: extend types/cover.ts, coverOverlayTextures.ts, and a class in Preview.css.
          </p>
          {state.appMode === 'instagram' && state.layoutMode === 'split' && state.image && (
            <p className="text-[10px] leading-snug text-amber-700 dark:text-amber-500">
              Texture is disabled on preview in split layout with a photo.
            </p>
          )}
        </div>
      </EditorSection>

      {state.appMode === 'instagram' && state.postFormat === 'event' && (
        <EditorSection title="Event">
          <div className="flex flex-col gap-2">
            <FieldLabel>Title on cover</FieldLabel>
            <div className="grid grid-cols-3 gap-1">
              {(
                [
                  { value: 'left' as const, label: 'Left' },
                  { value: 'center' as const, label: 'Center' },
                  { value: 'right' as const, label: 'Right' },
                ] as const
              ).map(({ value, label }) => (
                <Button
                  key={value}
                  type="button"
                  variant={state.eventTitleAlign === value ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => onChange({ eventTitleAlign: value })}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel>Date & place</FieldLabel>
            <Textarea
              rows={2}
              className="min-h-[2.75rem] py-1.5 text-xs"
              value={state.eventMeta}
              onChange={(e) => onChange({ eventMeta: e.target.value })}
              placeholder="e.g. Apr 12 · 6:00 PM · Dubai"
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <FieldLabel>Speakers</FieldLabel>
              <span className="text-[10px] tabular-nums text-muted-foreground">
                {state.eventSpeakers.length}/{MAX_EVENT_SPEAKERS}
              </span>
            </div>
            <p className="text-[10px] leading-snug text-muted-foreground">
              Photo on the left on the cover, name and company on the right; without photo — initial.
            </p>
            {state.eventSpeakers.map((sp, index) => (
              <div
                key={`speaker-${index}`}
                className="rounded-md border border-border bg-muted/30 p-2"
              >
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted"
                    onClick={() => {
                      setSpeakerPhotoIdx(index);
                      document.getElementById('speaker-photo-upload')?.click();
                    }}
                    title="Speaker photo"
                  >
                    {sp.photo ? (
                      <img src={sp.photo} alt="" className="size-full object-cover" />
                    ) : (
                      <Upload className="size-3.5 opacity-50" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1 flex flex-col gap-1">
                    <Input
                      className="h-7 text-xs"
                      value={sp.name}
                      onChange={(e) => {
                        const next = state.eventSpeakers.map((s, i) =>
                          i === index ? { ...s, name: e.target.value } : s
                        );
                        onChange({ eventSpeakers: next });
                      }}
                      placeholder="Full name"
                    />
                    <Input
                      className="h-7 text-xs"
                      value={sp.company}
                      onChange={(e) => {
                        const next = state.eventSpeakers.map((s, i) =>
                          i === index ? { ...s, company: e.target.value } : s
                        );
                        onChange({ eventSpeakers: next });
                      }}
                      placeholder="Company"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="shrink-0"
                    title="Remove"
                    onClick={() =>
                      onChange({
                        eventSpeakers: state.eventSpeakers.filter((_, i) => i !== index),
                      })
                    }
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              disabled={state.eventSpeakers.length >= MAX_EVENT_SPEAKERS}
              onClick={() =>
                onChange({
                  eventSpeakers: [...state.eventSpeakers, { name: '', company: '', photo: null }],
                })
              }
            >
              Add speaker
            </Button>
          </div>
        </EditorSection>
      )}

      {state.appMode === 'instagram' && (
        <EditorSection title="Typography">
          <div className="flex flex-col gap-2">
            <FieldLabel>
              {state.template === 'quote'
                ? 'Quote text'
                : state.postFormat === 'event'
                  ? 'Headline / topic'
                  : 'Title'}
            </FieldLabel>
            <Textarea
              rows={3}
              className="min-h-[4.25rem] py-1.5 text-xs"
              value={state.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder={
                state.template === 'quote'
                  ? 'Enter quote text…'
                  : state.postFormat === 'event'
                    ? 'Session topic or event name'
                    : 'Enter headline…'
              }
            />
            <ToggleGroup
              type="single"
              spacing={0}
              variant="outline"
              size="sm"
              value={state.textTransform}
              onValueChange={(v) => v && onChange({ textTransform: v as CoverState['textTransform'] })}
              className={cn('w-full justify-stretch', compactToggle)}
            >
              <ToggleGroupItem value="uppercase" className="flex-1">
                ALL CAPS
              </ToggleGroupItem>
              <ToggleGroupItem value="capitalize" className="flex-1">
                Title Case
              </ToggleGroupItem>
              <ToggleGroupItem value="none" className="flex-1">
                As typed
              </ToggleGroupItem>
            </ToggleGroup>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="title-autofit"
                  checked={state.titleAutoFit}
                  onCheckedChange={(c) => onChange({ titleAutoFit: c === true })}
                />
                <Label htmlFor="title-autofit" className="text-xs font-normal leading-snug">
                  Auto-fit long titles
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Label className="flex-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {state.titleAutoFit ? 'Max title size' : 'Title size'}
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  title="Reset to 100%"
                  onClick={() => onChange({ titleScale: 100 })}
                >
                  <RotateCcw className="size-3" />
                </Button>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {state.titleScale}%
                </span>
              </div>
              <Slider
                min={50}
                max={150}
                step={5}
                value={[state.titleScale]}
                onValueChange={([v]) => onChange({ titleScale: v ?? 100 })}
              />
              {state.titleAutoFit && (
                <p className="text-[11px] leading-snug text-muted-foreground">
                  Long headlines shrink to fit; the slider caps the largest size.
                </p>
              )}
            </div>
          </div>

          <ColorPicker label="Title color" value={state.titleColor} onChangeColor={(c) => onChange({ titleColor: c })} />

          <div className="flex flex-col gap-2">
            <FieldLabel>
              {state.template === 'quote'
                ? 'Author'
                : state.postFormat === 'event'
                  ? 'Series / organizer'
                  : 'Category'}
            </FieldLabel>
            <Input
              className="h-7 text-xs"
              value={state.category}
              onChange={(e) => onChange({ category: e.target.value })}
              placeholder={
                state.template === 'quote'
                  ? 'e.g. Steve Jobs'
                  : state.postFormat === 'event'
                    ? 'e.g. STANBASE MEETUP'
                    : 'e.g. VISUAL DESIGN'
              }
            />
            <div className="flex flex-wrap gap-1.5">
              {(state.postFormat === 'event'
                ? (
                    [
                      { value: 'MEETUP', label: 'Meetup' },
                      { value: 'SUMMIT', label: 'Summit' },
                      { value: 'WEBINAR', label: 'Webinar' },
                      { value: 'PANEL', label: 'Panel' },
                      { value: 'FORUM', label: 'Forum' },
                    ] as const
                  )
                : (
                    [
                      { value: 'NEWS', label: 'News' },
                      { value: 'INVESTMENTS', label: 'Investments' },
                      { value: 'STARTUPS', label: 'Startups' },
                      { value: 'ANALYTICS', label: 'Analytics' },
                      { value: 'FOUNDERS', label: 'Founders' },
                    ] as const
                  )
              ).map((preset) => (
                <Button
                  key={preset.value}
                  type="button"
                  variant={
                    state.category.toUpperCase() === preset.value ? 'default' : 'outline'
                  }
                  size="xs"
                  className="rounded-full text-[11px]"
                  onClick={() => onChange({ category: preset.value })}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          <ColorPicker
            label="Category color"
            value={state.categoryColor}
            onChangeColor={(c) => onChange({ categoryColor: c })}
          />
        </EditorSection>
      )}

      {state.appMode === 'instagram' && (
        <EditorSection title="Visual style & effects">
          <div className="flex flex-col gap-2">
            <FieldLabel>Style template</FieldLabel>
            <ToggleGroup
              type="single"
              spacing={0}
              variant="outline"
              size="sm"
              value={state.template}
              onValueChange={(v) => v && onChange({ template: v as CoverState['template'] })}
              className={cn('w-full justify-stretch', compactToggle)}
            >
              <ToggleGroupItem value="bold" className="flex-1">
                Bold
              </ToggleGroupItem>
              <ToggleGroupItem value="minimal" className="flex-1">
                Minimal
              </ToggleGroupItem>
              <ToggleGroupItem value="quote" className="flex-1">
                Quote
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {state.layoutMode === 'overlay' && (
            <>
              <div className="flex flex-col gap-2">
                <FieldLabel>Visual effects</FieldLabel>
                <ToggleGroup
                  type="single"
                  spacing={0}
                  variant="outline"
                  size="sm"
                  value={state.useGlassmorphism ? 'glass' : 'standard'}
                  onValueChange={(v) => {
                    if (v === 'glass') onChange({ useGlassmorphism: true });
                    if (v === 'standard') onChange({ useGlassmorphism: false });
                  }}
                  className={cn('w-full', compactToggle)}
                >
                  <ToggleGroupItem value="glass" className="flex-1">
                    Glass card
                  </ToggleGroupItem>
                  <ToggleGroupItem value="standard" className="flex-1">
                    Standard
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {state.useGlassmorphism && (
                <div className="space-y-3 border-l-2 border-primary/20 pl-2.5">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <Label className="flex-1 text-[11px] font-normal text-muted-foreground">
                        Card opacity: {state.glassBlur}%
                      </Label>
                      <Button type="button" variant="ghost" size="icon-xs" onClick={() => onChange({ glassBlur: 25 })}>
                        <RotateCcw className="size-3" />
                      </Button>
                    </div>
                    <Slider
                      min={10}
                      max={95}
                      step={1}
                      value={[state.glassBlur]}
                      onValueChange={([v]) => onChange({ glassBlur: v ?? 25 })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[11px] font-normal text-muted-foreground">Card width</Label>
                    <ToggleGroup
                      type="single"
                      spacing={0}
                      variant="outline"
                      size="sm"
                      value={state.glassWidth}
                      onValueChange={(v) => v && onChange({ glassWidth: v as CoverState['glassWidth'] })}
                      className={cn('w-full', compactToggle)}
                    >
                      <ToggleGroupItem value="full" className="flex-1">
                        Full
                      </ToggleGroupItem>
                      <ToggleGroupItem value="fit" className="flex-1">
                        Fit
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <FieldLabel>Vertical alignment</FieldLabel>
                <ToggleGroup
                  type="single"
                  spacing={0}
                  variant="outline"
                  size="sm"
                  value={state.contentAlignment}
                  onValueChange={(v) => v && onChange({ contentAlignment: v as CoverState['contentAlignment'] })}
                  className={cn('w-full justify-stretch', compactToggle)}
                >
                  <ToggleGroupItem value="flex-start" className="flex-1">
                    Top
                  </ToggleGroupItem>
                  <ToggleGroupItem value="center" className="flex-1">
                    Center
                  </ToggleGroupItem>
                  <ToggleGroupItem value="flex-end" className="flex-1">
                    Bottom
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </>
          )}
        </EditorSection>
      )}

      <EditorSection title="Branding">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <FieldLabel>Logos (top)</FieldLabel>
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {state.logos.length}/{MAX_LOGOS}
            </span>
          </div>
          <p className="text-[10px] leading-snug text-muted-foreground">
            One centered row; width shrinks when there are more logos.
          </p>
          {state.logos.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {state.logos.map((src, index) => (
                <div
                  key={`${index}-${src.slice(0, 24)}`}
                  className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded border border-border bg-muted/40"
                >
                  <img
                    src={src}
                    alt=""
                    className="max-h-9 max-w-9 object-contain"
                    style={logosPreviewFilter ? { filter: logosPreviewFilter } : undefined}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon-xs"
                    className="absolute -right-1 -top-1 size-5 min-w-5 rounded-full p-0 shadow-sm"
                    title="Remove"
                    onClick={() => removeLogoAt(index)}
                  >
                    <X className="size-2.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-auto flex-1 flex-col gap-0.5 border-dashed py-1.5 min-w-[120px]"
              disabled={state.logos.length >= MAX_LOGOS}
              onClick={() => document.getElementById('logo-upload')?.click()}
            >
              <Upload className="size-3.5 opacity-70" />
              <span className="text-[11px] font-normal">Add logo</span>
            </Button>
            {state.logos.length > 0 && (
              <Button type="button" variant="ghost" size="xs" className="h-8 text-[11px]" onClick={() => onChange({ logos: [] })}>
                Clear all
              </Button>
            )}
          </div>
          {state.logos.length > 0 && (
            <div className="space-y-3 border-l-2 border-primary/20 pl-2.5">
              <div className="flex flex-col gap-1.5">
                <FieldLabel>All logos color</FieldLabel>
                <ToggleGroup
                  type="single"
                  spacing={0}
                  variant="outline"
                  size="sm"
                  value={state.logoTint}
                  onValueChange={(v) => v && onChange({ logoTint: v as CoverState['logoTint'] })}
                  className={cn('w-full justify-stretch', compactToggle)}
                >
                  <ToggleGroupItem value="original" className="flex-1">
                    Original
                  </ToggleGroupItem>
                  <ToggleGroupItem value="white" className="flex-1">
                    White
                  </ToggleGroupItem>
                  <ToggleGroupItem value="black" className="flex-1">
                    Black
                  </ToggleGroupItem>
                </ToggleGroup>
                <p className="text-[10px] leading-snug text-muted-foreground">
                  Monochrome via filter; works on dark or light backgrounds.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Label className="flex-1 text-[11px] font-normal text-muted-foreground">
                    Base width: {state.logoSize}px
                  </Label>
                  <Button type="button" variant="ghost" size="icon-xs" onClick={() => onChange({ logoSize: 100 })}>
                    <RotateCcw className="size-3" />
                  </Button>
                </div>
                <Slider
                  min={20}
                  max={200}
                  step={1}
                  value={[state.logoSize]}
                  onValueChange={([v]) => onChange({ logoSize: v ?? 100 })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Label className="flex-1 text-[11px] font-normal text-muted-foreground">Opacity: {state.logoOpacity}%</Label>
                  <Button type="button" variant="ghost" size="icon-xs" onClick={() => onChange({ logoOpacity: 100 })}>
                    <RotateCcw className="size-3" />
                  </Button>
                </div>
                <Slider
                  min={10}
                  max={100}
                  step={1}
                  value={[state.logoOpacity]}
                  onValueChange={([v]) => onChange({ logoOpacity: v ?? 100 })}
                />
              </div>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <FieldLabel>Caption (OG, Website only)</FieldLabel>
          <Input
            className="h-7 text-xs"
            value={state.caption}
            onChange={(e) => onChange({ caption: e.target.value })}
            placeholder="e.g. stanbase.tech"
          />
        </div>
        <ColorPicker label="Caption color" value={state.captionColor} onChangeColor={(c) => onChange({ captionColor: c })} />
      </EditorSection>

      <Separator className="my-1.5" />

      <footer className="text-center">
        <a
          href="https://stanbase.tech/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-wrap items-center justify-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-primary"
        >
          <span>Powered by</span>
          <span className="font-medium text-foreground">Stanbase</span>
          <span className="rounded bg-muted px-1 py-0.5 font-mono text-[10px] text-muted-foreground">v2.0.0</span>
        </a>
      </footer>
    </div>
  );
};
