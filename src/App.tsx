import { useState, useEffect, useRef } from 'react';
import { Editor } from './components/Editor/Editor';
import { Preview } from './components/Preview/Preview';
import { STORAGE_KEY } from './constants/coverDefaults';
import type { CoverState, PostFormat } from './types/cover';
import { loadCoverStateFromStorage, saveCoverStateToStorage } from './utils/sanitizeCoverState';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

function App() {
  const [state, setState] = useState(() => loadCoverStateFromStorage(localStorage.getItem(STORAGE_KEY)));
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    saveCoverStateToStorage(state);
  }, [state]);

  /** Сброс на диск при уходе со страницы — иначе последний useEffect может не успеть (закрытие вкладки). */
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

  const updateState = (updates: Partial<CoverState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div className="flex h-svh w-svw flex-col overflow-hidden">
      <header className="flex shrink-0 flex-col gap-2 border-b border-border bg-card px-3 py-2 md:h-11 md:flex-row md:items-center md:justify-between md:gap-3 md:py-0 md:px-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="shrink-0 text-sm font-medium tracking-tight text-foreground">MediaGen Pro</span>
          {state.appMode === 'instagram' && (
            <ToggleGroup
              type="single"
              spacing={0}
              variant="outline"
              size="sm"
              value={state.postFormat}
              onValueChange={(v) => v && updateState({ postFormat: v as PostFormat })}
              className={cn(
                'max-md:w-full max-md:justify-stretch',
                '[&_[data-slot=toggle-group-item]]:h-7 [&_[data-slot=toggle-group-item]]:px-2 [&_[data-slot=toggle-group-item]]:text-[11px]'
              )}
            >
              <ToggleGroupItem value="news" className="max-md:flex-1">
                Новости
              </ToggleGroupItem>
              <ToggleGroupItem value="event" className="max-md:flex-1">
                Мероприятие
              </ToggleGroupItem>
              <ToggleGroupItem value="promo" className="max-md:flex-1">
                Промо
              </ToggleGroupItem>
            </ToggleGroup>
          )}
        </div>
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
