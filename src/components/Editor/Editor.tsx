import React, { type ChangeEvent, useState } from 'react';
import type { CoverFontPreset, CoverState } from '@/types/cover';
import { GRADIENT_PRESET_META, GRADIENT_PRESET_ORDER } from '@/constants/gradientPresets';
import { COVER_FONT_PRESETS, COVER_FONT_PRESET_ORDER } from '@/constants/coverFonts';
import { ColorPicker } from './ColorPicker';
import { Upload, X, RotateCcw, ChevronDown } from 'lucide-react';
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
      alert(`Файл слишком большой (макс. ${MAX_IMAGE_BYTES / (1024 * 1024)} МБ).`);
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
        setPendingBackground({
          url,
          imageOrientation: orientation,
          layoutMode: 'overlay',
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
      alert(`Можно не больше ${MAX_LOGOS} логотипов.`);
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
            {state.postFormat === 'news' && 'Новости и инфопосты'}
            {state.postFormat === 'event' && 'Анонсы: спикеры, дата и место'}
            {state.postFormat === 'promo' && 'Промо — пока те же поля, что у новостей'}
          </p>
        )}
      </div>

      <EditorSection title="Шрифт обложки">
        <FieldLabel>Пресет</FieldLabel>
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
                <FieldLabel>Пресет градиента</FieldLabel>
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
                <p className="text-[10px] leading-snug text-muted-foreground">
                  {GRADIENT_PRESET_META[state.gradientPreset].hint}
                </p>
                <ColorPicker
                  label="Фирменный цвет"
                  value={state.bgColor}
                  onChangeColor={(c) => onChange({ bgColor: c })}
                />
                <p className="text-[10px] leading-snug text-muted-foreground">
                  Для пресета «Бренд» — старт градиента; также фон split и другие элементы с этим цветом.
                </p>
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
                <FieldLabel>Источник фото (водяной знак)</FieldLabel>
                <Input
                  className="h-7 text-xs"
                  value={state.photoCredit}
                  onChange={(e) => onChange({ photoCredit: e.target.value })}
                  placeholder="Напр. Unsplash / автор"
                  maxLength={200}
                />
                <Label className="text-[10px] font-normal text-muted-foreground">Угол на обложке</Label>
                <ToggleGroup
                  type="single"
                  spacing={0}
                  variant="outline"
                  size="sm"
                  value={state.photoCreditCorner}
                  onValueChange={(v) => v && onChange({ photoCreditCorner: v as CoverState['photoCreditCorner'] })}
                  className={cn('grid w-full grid-cols-4 gap-1', compactToggle)}
                >
                  <ToggleGroupItem value="tl" title="Слева сверху" className="text-xs">
                    ↖
                  </ToggleGroupItem>
                  <ToggleGroupItem value="tr" title="Справа сверху" className="text-xs">
                    ↗
                  </ToggleGroupItem>
                  <ToggleGroupItem value="bl" title="Слева снизу" className="text-xs">
                    ↙
                  </ToggleGroupItem>
                  <ToggleGroupItem value="br" title="Справа снизу" className="text-xs">
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
      </EditorSection>

      {state.appMode === 'instagram' && state.postFormat === 'event' && (
        <EditorSection title="Мероприятие">
          <div className="flex flex-col gap-2">
            <FieldLabel>Заголовок на обложке</FieldLabel>
            <div className="grid grid-cols-3 gap-1">
              {(
                [
                  { value: 'left' as const, label: 'Слева' },
                  { value: 'center' as const, label: 'Центр' },
                  { value: 'right' as const, label: 'Справа' },
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
            <FieldLabel>Дата и место</FieldLabel>
            <Textarea
              rows={2}
              className="min-h-[2.75rem] py-1.5 text-xs"
              value={state.eventMeta}
              onChange={(e) => onChange({ eventMeta: e.target.value })}
              placeholder="Напр. 12 апреля · 18:00 · Dubai"
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <FieldLabel>Спикеры</FieldLabel>
              <span className="text-[10px] tabular-nums text-muted-foreground">
                {state.eventSpeakers.length}/{MAX_EVENT_SPEAKERS}
              </span>
            </div>
            <p className="text-[10px] leading-snug text-muted-foreground">
              Слева фото на обложке, справа имя и компания; без фото — инициал.
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
                    title="Фото спикера"
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
                      placeholder="Имя и фамилия"
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
                      placeholder="Компания"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="shrink-0"
                    title="Удалить"
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
              Добавить спикера
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
                  ? 'Заголовок / тема'
                  : 'Title'}
            </FieldLabel>
            <Textarea
              rows={3}
              className="min-h-[4.25rem] py-1.5 text-xs"
              value={state.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder={
                state.template === 'quote'
                  ? 'Enter the quote…'
                  : state.postFormat === 'event'
                    ? 'Тема сессии или название события'
                    : 'Enter title…'
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
                Title case
              </ToggleGroupItem>
              <ToggleGroupItem value="none" className="flex-1">
                As is
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <ColorPicker label="Title color" value={state.titleColor} onChangeColor={(c) => onChange({ titleColor: c })} />

          <div className="flex flex-col gap-2">
            <FieldLabel>
              {state.template === 'quote'
                ? 'Author'
                : state.postFormat === 'event'
                  ? 'Серия / организатор'
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
                    ? 'Напр. STANBASE MEETUP'
                    : 'e.g. VISUAL DESIGN'
              }
            />
            <div className="flex flex-wrap gap-1.5">
              {(state.postFormat === 'event'
                ? ['MEETUP', 'SUMMIT', 'WEBINAR', 'PANEL', 'FORUM']
                : ['news', 'investments', 'startups', 'analytics', 'founders']
              ).map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  variant={
                    state.category.toLowerCase() === preset.toLowerCase() ? 'default' : 'outline'
                  }
                  size="xs"
                  className="rounded-full capitalize"
                  onClick={() => onChange({ category: preset.toUpperCase() })}
                >
                  {preset}
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
            Один ряд по центру; ширина уменьшается, если логотипов больше.
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
                    title="Удалить"
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
              <span className="text-[11px] font-normal">Добавить логотип</span>
            </Button>
            {state.logos.length > 0 && (
              <Button type="button" variant="ghost" size="xs" className="h-8 text-[11px]" onClick={() => onChange({ logos: [] })}>
                Сбросить все
              </Button>
            )}
          </div>
          {state.logos.length > 0 && (
            <div className="space-y-3 border-l-2 border-primary/20 pl-2.5">
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Цвет всех логотипов</FieldLabel>
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
                    Как в файле
                  </ToggleGroupItem>
                  <ToggleGroupItem value="white" className="flex-1">
                    Белые
                  </ToggleGroupItem>
                  <ToggleGroupItem value="black" className="flex-1">
                    Чёрные
                  </ToggleGroupItem>
                </ToggleGroup>
                <p className="text-[10px] leading-snug text-muted-foreground">
                  Монохром через фильтр; удобно на тёмном или светлом фоне.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <Label className="flex-1 text-[11px] font-normal text-muted-foreground">
                    Базовая ширина: {state.logoSize}px
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
          <FieldLabel>Caption (OG, только Website)</FieldLabel>
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
