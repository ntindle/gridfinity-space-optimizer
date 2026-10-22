import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import type { Bin } from '@/types';

const HISTORY_LIMIT = 50;

export interface BinHistory {
  commit: (next: Bin[]) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const useBinHistory = (
  bins: Bin[],
  setBins: Dispatch<SetStateAction<Bin[]>>
): BinHistory => {
  const [past, setPast] = useState<Bin[][]>([]);
  const [future, setFuture] = useState<Bin[][]>([]);

  const commit = useCallback(
    (next: Bin[]) => {
      if (next === bins) return;
      setPast((previous) => [...previous, bins].slice(-HISTORY_LIMIT));
      setFuture([]);
      setBins(next);
    },
    [bins, setBins]
  );

  const undo = useCallback(() => {
    if (past.length === 0) return;
    setPast(past.slice(0, -1));
    setFuture((next) => [bins, ...next].slice(0, HISTORY_LIMIT));
    setBins(past[past.length - 1]);
  }, [bins, past, setBins]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    setFuture(future.slice(1));
    setPast((previous) => [...previous, bins].slice(-HISTORY_LIMIT));
    setBins(future[0]);
  }, [bins, future, setBins]);

  return { commit, undo, redo, canUndo: past.length > 0, canRedo: future.length > 0 };
};
