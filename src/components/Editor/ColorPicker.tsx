import { Palette } from 'lucide-react';
import { BRAND_COLORS } from '@/constants/coverDefaults';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface ColorPickerProps {
  label: string;
  value: string;
  onChangeColor: (color: string) => void;
}

const BRAND_SWATCHES = Object.values(BRAND_COLORS);

function normalizeHex(hex: string): string {
  const h = hex.trim();
  if (!h.startsWith('#')) return h.toUpperCase();
  let x = h.slice(1);
  if (x.length === 3) {
    x = x
      .split('')
      .map((ch) => ch + ch)
      .join('');
  }
  if (x.length === 6 && /^[0-9A-Fa-f]+$/.test(x)) {
    return `#${x.toUpperCase()}`;
  }
  return h.toUpperCase();
}

function hexForNativeInput(hex: string): string {
  const n = normalizeHex(hex);
  return /^#[0-9A-F]{6}$/i.test(n) ? n : '#808080';
}

export function ColorPicker({ label, value, onChangeColor }: ColorPickerProps) {
  const brandSet = new Set(BRAND_SWATCHES.map(normalizeHex));
  const normalizedValue = normalizeHex(value);
  const isBrandSelected = brandSet.has(normalizedValue);

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <Palette className="size-3 opacity-70" />
        {label}
      </Label>
      <div className="flex flex-wrap gap-1.5">
        {BRAND_SWATCHES.map((color) => (
          <Button
            key={color}
            type="button"
            variant="outline"
            size="icon"
            aria-label={`Color ${color}`}
            className={cn(
              'size-6 min-w-6 rounded-full border-2 p-0 shadow-none',
              normalizedValue === normalizeHex(color) && 'border-primary ring-2 ring-primary/30'
            )}
            style={{ backgroundColor: color }}
            title={color}
            onClick={() => onChangeColor(color)}
          />
        ))}
        <label
          className={cn(
            'relative flex size-6 min-w-6 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-border bg-background shadow-none transition-[box-shadow]',
            !isBrandSelected && 'border-primary ring-2 ring-primary/30'
          )}
          title="Custom color (picker)"
        >
          <input
            type="color"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            value={hexForNativeInput(value)}
            onChange={(e) => onChangeColor(e.target.value.toUpperCase())}
            aria-label="Custom color, picker"
          />
          <span
            className="pointer-events-none size-full rounded-full border border-border/40"
            style={{
              background: isBrandSelected
                ? 'conic-gradient(from 0deg, #f43, #fb0, #8f0, #0d9, #06f, #93f, #f43)'
                : value,
            }}
          />
        </label>
      </div>
    </div>
  );
}
