import { useMemo } from 'react';
import type { TeamMember, ResolvedOpponent, MatchupScore } from '@/types';
import type { Dex } from '@/lib/dex';
import { computeMatchup } from '@/lib/damage';

export function useMatchup(
  team: (TeamMember | null)[],
  resolved: ResolvedOpponent | null,
  dex: Dex | null,
): MatchupScore[] {
  return useMemo(() => {
    if (!resolved || !dex) return [];
    return computeMatchup(team, resolved, dex);
  }, [team, resolved, dex]);
}
