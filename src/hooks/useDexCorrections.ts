import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import type { DexCorrection } from '@/types';
import { getItem, setItem } from '@/lib/storage';

const DexCorrectionSchema = z.object({
  species: z.string(),
  gameId: z.string(),
  overrides: z.object({
    types: z.tuple([z.string(), z.string().optional()]).optional(),
    abilities: z.array(z.string()).optional(),
  }),
});

const DexCorrectionsSchema = z.array(DexCorrectionSchema);

function storageKey(gameId: string) {
  return `dexCorrections:${gameId}`;
}

interface UseDexCorrections {
  corrections: DexCorrection[];
  getCorrection: (species: string) => DexCorrection | undefined;
  addCorrection: (correction: DexCorrection) => void;
  removeCorrection: (species: string) => void;
}

export function useDexCorrections(gameId: string): UseDexCorrections {
  const [corrections, setCorrections] = useState<DexCorrection[]>(() => {
    return (getItem(storageKey(gameId), DexCorrectionsSchema) as DexCorrection[] | null) ?? [];
  });

  useEffect(() => {
    const stored = getItem(storageKey(gameId), DexCorrectionsSchema) as DexCorrection[] | null;
    setCorrections(stored ?? []);
  }, [gameId]);

  useEffect(() => {
    setItem(storageKey(gameId), corrections);
  }, [gameId, corrections]);

  const getCorrection = useCallback(
    (species: string) =>
      corrections.find((c) => c.species.toLowerCase() === species.toLowerCase()),
    [corrections],
  );

  const addCorrection = useCallback((correction: DexCorrection) => {
    setCorrections((prev) => {
      const without = prev.filter((c) => c.species !== correction.species);
      return [...without, correction];
    });
  }, []);

  const removeCorrection = useCallback((species: string) => {
    setCorrections((prev) => prev.filter((c) => c.species !== species));
  }, []);

  return { corrections, getCorrection, addCorrection, removeCorrection };
}
