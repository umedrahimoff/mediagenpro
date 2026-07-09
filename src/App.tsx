import { useState, useEffect, useRef } from 'react';
import { Undo2, Redo2 } from 'lucide-react';
import { Editor } from './components/Editor/Editor';
import { Preview } from './components/Preview/Preview';
import { STORAGE_KEY } from './constants/coverDefaults';
import { useCoverUndoRedo } from '@/hooks/useCoverUndoRedo';
import { loadCoverStateFromStorage, saveCoverStateToStorage } from './utils/sanitizeCoverState';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

function App() {
  const [initialSnapshot] = useState(() => loadCoverStateFromStorage(localStorage.getItem(STORAGE_KEY)));
  const { state, updateState, undo, redo, canUndo, canRedo } = useCoverUndoRedo(initialSnapshot);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });

  useEffect(() => {
    saveCoverStateToStorage(state);
  }, [state]);

  /** Flush to disk when leaving — last useEffect may not run on tab close. */
  useEffect(() => {
    const flush = () => saveCoverStateToStorage(stateRef.current);
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <div className="flex h-svh w-svw flex-col overflow-hidden">
      <header className="flex shrink-0 flex-col gap-2 border-b border-border bg-card px-3 py-2 md:h-11 md:flex-row md:items-center md:justify-between md:gap-3 md:py-0 md:px-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="shrink-0 text-sm font-medium tracking-tight text-foreground">MediaGen Pro</span>
          <div className="flex items-center gap-0.5">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="h-7 w-7 shrink-0"
              title="Undo (⌘Z / Ctrl+Z)"
              disabled={!canUndo}
              onClick={() => undo()}
            >
              <Undo2 className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="h-7 w-7 shrink-0"
              title="Redo (⌘⇧Z / Ctrl+Y)"
              disabled={!canRedo}
              onClick={() => redo()}
            >
              <Redo2 className="size-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5 md:gap-2">
          <ToggleGroup
            type="single"
            spacing={0}
            variant="outline"
            size="sm"
            value={state.appMode}
            onValueChange={(v) => {
              if (v === 'instagram') updateState({ appMode: 'instagram', ratio: 'vertical' });
              if (v === 'website') updateState({ appMode: 'website', ratio: 'horizontal' });
            }}
            className="max-md:w-full max-md:justify-stretch [&_[data-slot=toggle-group-item]]:h-7 [&_[data-slot=toggle-group-item]]:px-2 [&_[data-slot=toggle-group-item]]:text-xs"
          >
            <ToggleGroupItem value="instagram" className={cn('max-md:flex-1')}>
              Instagram
            </ToggleGroupItem>
            <ToggleGroupItem value="website" className={cn('max-md:flex-1')}>
              Website
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        <aside className="z-10 flex w-full shrink-0 flex-col overflow-y-auto border-border bg-sidebar p-3 shadow-sm md:w-[300px] md:border-r md:shadow-[2px_0_8px_rgba(0,0,0,0.04)]">
          <Editor state={state} onChange={updateState} />
        </aside>
        <main className="flex min-h-[min(420px,50vh)] flex-1 items-center justify-center overflow-auto bg-muted/60 p-3 md:min-h-0 md:p-6">
          <Preview state={state} />
        </main>
      </div>
    </div>
  );
}

export default App;
