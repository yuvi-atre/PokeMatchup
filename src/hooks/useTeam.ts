import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import type { TeamMember } from '@/types';
import { getItem, setItem } from '@/lib/storage';

const BaseStatsSchema = z.object({
  hp: z.number(),
  attack: z.number(),
  defense: z.number(),
  specialAttack: z.number(),
  specialDefense: z.number(),
  speed: z.number(),
});

const TeamMemberSchema = z.object({
  id: z.string(),
  species: z.string(),
  nickname: z.string().optional(),
  level: z.number(),
  stats: BaseStatsSchema,
  ability: z.string().nullable(),
  heldItem: z.string().nullable(),
  moves: z.tuple([
    z.string().nullable(),
    z.string().nullable(),
    z.string().nullable(),
    z.string().nullable(),
  ]),
});

const TeamSchema = z.array(TeamMemberSchema.nullable()).length(6);

const EMPTY_TEAM: (TeamMember | null)[] = [null, null, null, null, null, null];

function storageKey(gameId: string) {
  return `team:${gameId}`;
}

interface UseTeam {
  team: (TeamMember | null)[];
  setMember(index: number, member: TeamMember | null): void;
  clearTeam(): void;
  isComplete: boolean;
}

export function useTeam(gameId: string): UseTeam {
  const [team, setTeam] = useState<(TeamMember | null)[]>(() => {
    const stored = getItem(storageKey(gameId), TeamSchema);
    return stored ?? [...EMPTY_TEAM];
  });

  useEffect(() => {
    const stored = getItem(storageKey(gameId), TeamSchema);
    setTeam(stored ?? [...EMPTY_TEAM]);
  }, [gameId]);

  useEffect(() => {
    setItem(storageKey(gameId), team);
  }, [gameId, team]);

  const setMember = useCallback((index: number, member: TeamMember | null) => {
    setTeam((prev) => {
      const next = [...prev] as (TeamMember | null)[];
      next[index] = member;
      return next;
    });
  }, []);

  const clearTeam = useCallback(() => {
    setTeam([...EMPTY_TEAM]);
  }, []);

  const isComplete = team.every((m) => m !== null);

  return { team, setMember, clearTeam, isComplete };
}
