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

export function ColorPicker({ label, value, onChangeColor }: ColorPickerProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <Palette className="size-3 opacity-70" />
        {label}
      </Label>
      <div className="flex flex-wrap gap-1.5">
        {Object.values(BRAND_COLORS).map((color) => (
          <Button
            key={color}
            type="button"
            variant="outline"
            size="icon"
            aria-label={`Color ${color}`}
            className={cn(
              'size-6 min-w-6 rounded-full border-2 p-0 shadow-none',
              value === color && 'border-primary ring-2 ring-primary/30'
            )}
            style={{ backgroundColor: color }}
            title={color}
            onClick={() => onChangeColor(color)}
          />
        ))}
      </div>
    </div>
  );
}
