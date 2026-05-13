import type { GameMeta } from '@/types';
import unboundMeta from './unbound-2.1/meta.json';
import unboundTypeChart from './unbound-2.1/type-chart.json';
import type { TypeChart } from '@/types';

export interface GameRegistry {
  meta: GameMeta;
  typeChart: TypeChart;
  // pokemon and moves are lazy-loaded by dex.ts
}

export const GAME_REGISTRY: GameRegistry[] = [
  {
    meta: unboundMeta as GameMeta,
    typeChart: unboundTypeChart as TypeChart,
  },
  // To add a new game: import its meta.json and type-chart.json, push a new entry here.
];

export function getRegisteredGame(gameId: string): GameRegistry | undefined {
  return GAME_REGISTRY.find((g) => g.meta.id === gameId);
}
