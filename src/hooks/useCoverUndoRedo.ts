import { useCallback, useEffect, useRef, useState } from 'react';
import type { CoverState } from '@/types/cover';

const MAX_HISTORY = 25;
const DEBOUNCE_MS = 400;

function cloneState(s: CoverState): CoverState {
  return JSON.parse(JSON.stringify(s)) as CoverState;
}

function statesEqual(a: CoverState, b: CoverState): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function isEditableTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

export function useCoverUndoRedo(initialPresent: CoverState) {
  const [present, setPresent] = useState<CoverState>(initialPresent);
  const [past, setPast] = useState<CoverState[]>([]);
  const [future, setFuture] = useState<CoverState[]>([]);
  const [hasPendingBurst, setHasPendingBurst] = useState(false);

  const presentRef = useRef(present);
  presentRef.current = present;

  const burstStartRef = useRef<CoverState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDebounce = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const flushPendingHistory = useCallback(() => {
    clearDebounce();
    const start = burstStartRef.current;
    burstStartRef.current = null;
    setHasPendingBurst(false);
    if (!start) return;
    const cur = presentRef.current;
    if (statesEqual(start, cur)) return;
    setPast((p) => [...p.slice(-(MAX_HISTORY - 1)), start]);
    setFuture([]);
  }, [clearDebounce]);

  const scheduleCommit = useCallback(
    (before: CoverState) => {
      if (burstStartRef.current === null) {
        burstStartRef.current = cloneState(before);
        setHasPendingBurst(true);
      }
      clearDebounce();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        const burstStart = burstStartRef.current;
        burstStartRef.current = null;
        setHasPendingBurst(false);
        if (!burstStart) return;
        const cur = presentRef.current;
        if (statesEqual(burstStart, cur)) return;
        setPast((p) => [...p.slice(-(MAX_HISTORY - 1)), burstStart]);
        setFuture([]);
      }, DEBOUNCE_MS);
    },
    [clearDebounce]
  );

  const updateState = useCallback(
    (updates: Partial<CoverState>) => {
      setPresent((prev) => {
        scheduleCommit(prev);
        return { ...prev, ...updates };
      });
    },
    [scheduleCommit]
  );

  const undo = useCallback(() => {
    flushPendingHistory();
    setPast((pastArr) => {
      if (pastArr.length === 0) return pastArr;
      const prevSnapshot = pastArr[pastArr.length - 1];
      const newPast = pastArr.slice(0, -1);
      const cur = presentRef.current;
      setFuture((f) => [cloneState(cur), ...f].slice(0, MAX_HISTORY));
      setPresent(cloneState(prevSnapshot));
      return newPast;
    });
  }, [flushPendingHistory]);

  const redo = useCallback(() => {
    flushPendingHistory();
    setFuture((futureArr) => {
      if (futureArr.length === 0) return futureArr;
      const nextSnapshot = futureArr[0];
      const newFuture = futureArr.slice(1);
      const cur = presentRef.current;
      setPast((p) => [...p.slice(-(MAX_HISTORY - 1)), cloneState(cur)]);
      setPresent(cloneState(nextSnapshot));
      return newFuture;
    });
  }, [flushPendingHistory]);

  useEffect(() => () => clearDebounce(), [clearDebounce]);

  const canUndo = past.length > 0 || hasPendingBurst;
  const canRedo = future.length > 0;

  const canUndoRef = useRef(canUndo);
  const canRedoRef = useRef(canRedo);
  canUndoRef.current = canUndo;
  canRedoRef.current = canRedo;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      if (isEditableTarget(e.target)) return;

      if (e.key === 'z' || e.key === 'Z') {
        if (e.shiftKey) {
          if (!canRedoRef.current) return;
          e.preventDefault();
          redo();
        } else {
          if (!canUndoRef.current) return;
          e.preventDefault();
          undo();
        }
        return;
      }
      if (e.key === 'y' && e.ctrlKey && !e.metaKey) {
        if (!canRedoRef.current) return;
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undo, redo]);

  return { state: present, updateState, undo, redo, canUndo, canRedo };
}
