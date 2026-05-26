import { useState, useCallback, useMemo } from 'react';
import type { OpponentState, SessionOverride, ResolvedOpponent, DexCorrection, TypeName } from '@/types';
import type { Dex } from '@/lib/dex';

const INITIAL_STATE: OpponentState = {
  species: null,
  level: null,
  type1: null,
  type2: null,
  ability: null,
  moves: [null, null, null, null],
  detectedBy: null,
};

interface UseOpponent {
  opponent: OpponentState;
  override: SessionOverride;
  resolved: ResolvedOpponent | null;
  setOpponentByName: (name: string, dex: Dex) => void;
  setLevel: (level: number | null) => void;
  applyOverride: (partial: Partial<SessionOverride>) => void;
  resetOverrides: () => void;
  clearOpponent: () => void;
}

export function useOpponent(
  getCorrection: (species: string) => DexCorrection | undefined = () => undefined,
): UseOpponent {
  const [opponent, setOpponent] = useState<OpponentState>(INITIAL_STATE);
  const [override, setOverride] = useState<SessionOverride>({});

  const setOpponentByName = useCallback(
    (name: string, dex: Dex) => {
      const species = dex.getPokemon(name);
      if (!species) return;
      setOpponent({
        species: species.name,
        level: null,
        type1: species.types[0] ?? null,
        type2: species.types[1] ?? null,
        ability: null,
        moves: [null, null, null, null],
        detectedBy: 'manual',
      });
      setOverride({});
    },
    [],
  );

  const setLevel = useCallback((level: number | null) => {
    setOpponent((prev) => ({ ...prev, level }));
  }, []);

  const applyOverride = useCallback((partial: Partial<SessionOverride>) => {
    setOverride((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetOverrides = useCallback(() => setOverride({}), []);

  const clearOpponent = useCallback(() => {
    setOpponent(INITIAL_STATE);
    setOverride({});
  }, []);

  const resolved = useMemo((): ResolvedOpponent | null => {
    if (!opponent.species) return null;

    // Layer 1: base from dex lookup (already in opponentState)
    let type1: TypeName | null = opponent.type1;
    let type2: TypeName | null = opponent.type2;
    let ability = opponent.ability;

    // Layer 2: persistent dex correction
    const correction = getCorrection(opponent.species);
    if (correction?.overrides.types) {
      type1 = (correction.overrides.types[0] as TypeName) ?? type1;
      type2 = (correction.overrides.types[1] as TypeName | undefined) ?? null;
    }

    // Layer 3: session override (highest priority)
    if (override.type1 !== undefined) type1 = override.type1;
    if (override.type2 !== undefined) type2 = override.type2 ?? null;
    if (override.ability !== undefined) ability = override.ability ?? null;

    const moves = override.moves ?? opponent.moves;
    const level = override.level !== undefined ? override.level : opponent.level;
    const species = override.species ?? opponent.species;

    if (!type1) return null;

    return {
      species,
      level,
      types: type2 ? [type1, type2] : [type1],
      ability,
      moves,
      source: opponent.detectedBy ?? 'manual',
    };
  }, [opponent, override, getCorrection]);

  return {
    opponent,
    override,
    resolved,
    setOpponentByName,
    setLevel,
    applyOverride,
    resetOverrides,
    clearOpponent,
  };
}
