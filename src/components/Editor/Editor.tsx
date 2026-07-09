import React, { type ChangeEvent, useState } from 'react';
import type { CoverFontPreset, CoverState } from '@/types/cover';
import { GRADIENT_BACKGROUND_DEFAULTS } from '@/constants/coverDefaults';
import { GRADIENT_PRESET_META, GRADIENT_PRESET_ORDER } from '@/constants/gradientPresets';
import { COVER_FONT_PRESETS, COVER_FONT_PRESET_ORDER } from '@/constants/coverFonts';
import { ColorPicker } from './ColorPicker';
import { ChevronDown, RotateCcw, Upload, X } from 'lucide-react';
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
          state.ratio === 'square' ? 'square' : 'vertical';
        // Если фото не совпадает по форме с рамкой — предлагаем «целиком + размытый фон».
        const suggestedFit: CoverState['imageFit'] =
          orientation !== canvasOrientation ? 'blur' : 'cover';
        setPendingBackground({ url, imageFit: suggestedFit });
      };
      img.src = url;
    });
    e.target.value = '';
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
        key={pendingBackground?.url ?? 'none'}
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

      <EditorSection title="Format">
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
      </EditorSection>

      <EditorSection title="Background & image">
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
              Gradient
            </ToggleGroupItem>
            <ToggleGroupItem value="image" className="flex-1">
              Image
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {state.isGradient && (
          <div className="flex flex-col gap-2 border-t border-border pt-2.5">
            <div className="flex items-center justify-between gap-2">
              <FieldLabel>Gradient preset</FieldLabel>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                title="Reset to brand"
                onClick={() => onChange({ ...GRADIENT_BACKGROUND_DEFAULTS })}
              >
                <RotateCcw className="size-3" />
              </Button>
            </div>
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
            <ColorPicker label="Brand color" value={state.bgColor} onChangeColor={(c) => onChange({ bgColor: c })} />
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

            {state.image && (
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

            {state.image && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="photo-duotone"
                    checked={state.photoDuotone}
                    onCheckedChange={(c) => onChange({ photoDuotone: c === true })}
                  />
                  <Label htmlFor="photo-duotone" className="text-xs font-normal leading-snug">
                    Duotone (brand tint)
                  </Label>
                </div>
                <p className="text-[10px] leading-snug text-muted-foreground">
                  Tints any photo into your brand color for a consistent, editorial feed.
                </p>
              </div>
            )}

            {state.image && (
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

            {state.image && (
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
          </div>
        )}
      </EditorSection>

      <EditorSection title="Text">
        <div className="flex flex-col gap-2">
          <FieldLabel>Title</FieldLabel>
          <Textarea
            rows={3}
            className="min-h-[4.25rem] py-1.5 text-xs"
            value={state.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Enter headline…"
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
              <span className="text-[11px] tabular-nums text-muted-foreground">{state.titleScale}%</span>
            </div>
            <Slider
              min={50}
              max={150}
              step={5}
              value={[state.titleScale]}
              onValueChange={([v]) => onChange({ titleScale: v ?? 100 })}
            />
          </div>
        </div>

        <ColorPicker label="Title color" value={state.titleColor} onChangeColor={(c) => onChange({ titleColor: c })} />

        <div className="flex flex-col gap-2">
          <FieldLabel>Category</FieldLabel>
          <Input
            className="h-7 text-xs"
            value={state.category}
            onChange={(e) => onChange({ category: e.target.value })}
            placeholder="e.g. VISUAL DESIGN"
          />
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { value: 'NEWS', label: 'News' },
                { value: 'INVESTMENTS', label: 'Investments' },
                { value: 'STARTUPS', label: 'Startups' },
                { value: 'ANALYTICS', label: 'Analytics' },
                { value: 'FOUNDERS', label: 'Founders' },
              ] as const
            ).map((preset) => (
              <Button
                key={preset.value}
                type="button"
                variant={state.category.toUpperCase() === preset.value ? 'default' : 'outline'}
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
      </EditorSection>

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
