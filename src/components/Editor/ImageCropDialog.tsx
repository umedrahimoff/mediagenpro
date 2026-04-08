import React, { useEffect, useState } from 'react';
import { Dialog } from 'radix-ui';
import type { CoverState } from '@/types/cover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { coverImageLayerStyle, type CoverImageFocus } from '@/utils/coverImageLayerStyle';

export type PendingBackgroundImage = {
  url: string;
  imageOrientation: CoverState['imageOrientation'];
  layoutMode: CoverState['layoutMode'];
};

function canvasAspectRatio(state: Pick<CoverState, 'appMode' | 'ratio'>): number {
  if (state.appMode === 'website') return 1200 / 628;
  if (state.ratio === 'square') return 1;
  if (state.ratio === 'story') return 9 / 16;
  return 4 / 5;
}

type Props = {
  open: boolean;
  pending: PendingBackgroundImage | null;
  canvasState: Pick<CoverState, 'appMode' | 'ratio'>;
  onOpenChange: (open: boolean) => void;
  onApply: (payload: PendingBackgroundImage & CoverImageFocus) => void;
};

export const ImageCropDialog: React.FC<Props> = ({ open, pending, canvasState, onOpenChange, onApply }) => {
  const [focus, setFocus] = useState<CoverImageFocus>({
    imageFocusX: 50,
    imageFocusY: 50,
    imageZoom: 100,
  });

  useEffect(() => {
    if (open && pending) {
      setFocus({ imageFocusX: 50, imageFocusY: 50, imageZoom: 100 });
    }
  }, [open, pending?.url]);

  return (
    <Dialog.Root open={Boolean(open && pending)} onOpenChange={onOpenChange}>
      {pending ? (
        <Dialog.Portal>
          <Dialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/60" />
          <Dialog.Content className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 max-h-[min(90vh,720px)] w-[min(calc(100vw-24px),400px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-card p-4 shadow-lg outline-none">
            <Dialog.Title className="text-sm font-semibold text-foreground">Crop background</Dialog.Title>
            <Dialog.Description className="mt-1 text-[11px] leading-snug text-muted-foreground">
              Adjust the visible area for the current cover format.
            </Dialog.Description>

            {(() => {
              const aspect = canvasAspectRatio(canvasState);
              const previewMaxW = 320;
              const previewH = previewMaxW / aspect;
              return (
                <div
                  className="mx-auto mt-3 overflow-hidden rounded-lg border border-border bg-muted"
                  style={{ width: previewMaxW, height: previewH }}
                >
                  <img
                    src={pending.url}
                    alt=""
                    className="block h-full w-full"
                    style={coverImageLayerStyle(focus)}
                  />
                </div>
              );
            })()}

            <div className="mt-4 flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-[11px] text-muted-foreground">Horizontal</Label>
                  <span className="text-[11px] tabular-nums text-muted-foreground">{focus.imageFocusX}%</span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[focus.imageFocusX]}
                  onValueChange={([v]) => setFocus((f) => ({ ...f, imageFocusX: v ?? 50 }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-[11px] text-muted-foreground">Vertical</Label>
                  <span className="text-[11px] tabular-nums text-muted-foreground">{focus.imageFocusY}%</span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[focus.imageFocusY]}
                  onValueChange={([v]) => setFocus((f) => ({ ...f, imageFocusY: v ?? 50 }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-[11px] text-muted-foreground">Zoom</Label>
                  <span className="text-[11px] tabular-nums text-muted-foreground">{focus.imageZoom}%</span>
                </div>
                <Slider
                  min={100}
                  max={200}
                  step={1}
                  value={[focus.imageZoom]}
                  onValueChange={([v]) => setFocus((f) => ({ ...f, imageZoom: v ?? 100 }))}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" size="sm" className="h-8 text-xs">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                type="button"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  onApply({ ...pending, ...focus });
                  onOpenChange(false);
                }}
              >
                Done
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      ) : null}
    </Dialog.Root>
  );
};
