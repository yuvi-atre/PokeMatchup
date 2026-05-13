import { useState, useEffect, useCallback } from 'react';
import { createDex, type Dex } from '@/lib/dex';
import { GAME_REGISTRY } from '@/data/games';
import { getItem, setItem } from '@/lib/storage';
import { z } from 'zod';

const STORAGE_KEY = 'activeGameId';
const DEFAULT_GAME_ID = GAME_REGISTRY[0]?.meta.id ?? 'unbound-2.1';

interface GameProfileState {
  gameId: string;
  dex: Dex | null;
  isLoading: boolean;
  error: string | null;
  switchGame: (gameId: string) => void;
}

export function useGameProfile(): GameProfileState {
  const [gameId, setGameId] = useState<string>(
    () => getItem(STORAGE_KEY, z.string()) ?? DEFAULT_GAME_ID,
  );
  const [dex, setDex] = useState<Dex | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setDex(null);

    createDex(gameId)
      .then((loadedDex) => {
        if (!cancelled) {
          setDex(loadedDex);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [gameId]);

  const switchGame = useCallback((newGameId: string) => {
    setItem(STORAGE_KEY, newGameId);
    setGameId(newGameId);
  }, []);

  return { gameId, dex, isLoading, error, switchGame };
}
