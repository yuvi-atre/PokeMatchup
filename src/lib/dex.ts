import type { PokemonData, MoveData, TypeName, TypeChart } from '@/types';
import { getRegisteredGame } from '@/data/games';

// Abilities that grant complete immunity to a move type.
// Applied in getTypeEffectiveness to override the type chart.
const ABILITY_IMMUNITIES: Record<string, TypeName> = {
  'Levitate': 'Ground',
  'Flash Fire': 'Fire',
  'Water Absorb': 'Water',
  'Hydration': 'Water',
  'Volt Absorb': 'Electric',
  'Lightning Rod': 'Electric',
  'Motor Drive': 'Electric',
  'Sap Sipper': 'Grass',
  'Storm Drain': 'Water',
  'Dry Skin': 'Water',
};

// Dry Skin makes the holder take 1.25× from Fire (handled separately in damage.ts).
// This map only covers the immunity direction.

export interface Dex {
  gameId: string;
  getPokemon(name: string): PokemonData | undefined;
  getAllPokemon(): PokemonData[];
  getMove(name: string): MoveData | undefined;
  getAllMoves(): MoveData[];
  getTypeChart(): TypeChart;
  getTypeEffectiveness(
    attackType: TypeName,
    defenderTypes: [TypeName, TypeName?],
    defenderAbility?: string | null,
  ): number;
  getSpriteUrl(species: string): string;
}

export async function createDex(gameId: string): Promise<Dex> {
  const registry = getRegisteredGame(gameId);
  if (!registry) {
    throw new Error(`Unknown game profile: "${gameId}". Check src/data/games/index.ts.`);
  }

  // Dynamic imports keep the initial bundle lean.
  const [pokemonModule, movesModule] = await Promise.all([
    import(`../data/games/${gameId}/pokemon.json`),
    import(`../data/games/${gameId}/moves.json`),
  ]);

  const pokemonList: PokemonData[] = pokemonModule.default;
  const movesList: MoveData[] = movesModule.default;
  const typeChart = registry.typeChart;

  // Build lookup maps for O(1) access.
  const pokemonByName = new Map<string, PokemonData>(
    pokemonList.map((p) => [p.name.toLowerCase(), p]),
  );
  const moveByName = new Map<string, MoveData>(
    movesList.map((m) => [m.name.toLowerCase(), m]),
  );

  console.log(
    `[Dex] Loaded ${gameId}: ${pokemonList.length} species, ${movesList.length} moves`,
  );

  return {
    gameId,

    getPokemon(name: string): PokemonData | undefined {
      return pokemonByName.get(name.toLowerCase());
    },

    getAllPokemon(): PokemonData[] {
      return pokemonList;
    },

    getMove(name: string): MoveData | undefined {
      return moveByName.get(name.toLowerCase());
    },

    getAllMoves(): MoveData[] {
      return movesList;
    },

    getTypeChart(): TypeChart {
      return typeChart;
    },

    getTypeEffectiveness(
      attackType: TypeName,
      defenderTypes: [TypeName, TypeName?],
      defenderAbility?: string | null,
    ): number {
      // Ability immunity check (only for the attack type).
      if (defenderAbility) {
        const immuneType = ABILITY_IMMUNITIES[defenderAbility];
        if (immuneType === attackType) return 0;
      }

      const row = typeChart[attackType];
      const eff1 = row[defenderTypes[0]] ?? 1;
      const eff2 = defenderTypes[1] != null ? (row[defenderTypes[1]] ?? 1) : 1;
      return eff1 * eff2;
    },

    getSpriteUrl(species: string): string {
      // Use nationalId from PokemonData if available (matches PokeAPI sprite numbering).
      const poke = pokemonByName.get(species.toLowerCase());
      const nationalId = poke?.nationalId;
      if (nationalId != null) {
        return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${nationalId}.png`;
      }
      // Name-based fallback for species without a national id.
      const slug = species.toLowerCase().replace(/[^a-z0-9]/g, '-');
      return `https://img.pokemondb.net/sprites/x-y/normal/${slug}.png`;
    },
  };
}
