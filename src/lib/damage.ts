import type {
  TeamMember,
  MoveData,
  PokemonData,
  ResolvedOpponent,
  MatchupScore,
  MoveScore,
  ThreatEntry,
  ScoreBreakdown,
  BaseStats,
  TypeName,
} from '@/types';
import type { Dex } from '@/lib/dex';

export interface ScoringConfig {
  W_OFF: number;
  W_DEF: number;
  SPEED_BONUS: number;
  ONESHOT_PENALTY: number;
}

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  W_OFF: 1.0,
  W_DEF: 0.8,
  SPEED_BONUS: 20,
  ONESHOT_PENALTY: 60,
};

// Simplified stat formula (no EVs, IVs, or nature) for estimating opponent stats.
function estimateOpponentStats(baseStats: BaseStats, level: number): BaseStats {
  const stat = (base: number) => Math.floor((2 * base * level) / 100) + 5;
  return {
    hp: Math.floor((2 * baseStats.hp * level) / 100) + level + 10,
    attack: stat(baseStats.attack),
    defense: stat(baseStats.defense),
    specialAttack: stat(baseStats.specialAttack),
    specialDefense: stat(baseStats.specialDefense),
    speed: stat(baseStats.speed),
  };
}

// Simplified Gen 3+ damage formula. Gives HP-unit estimates good enough for ranking.
function estimateDamage(
  attackerLevel: number,
  power: number,
  attackStat: number,
  defenseStat: number,
  effectiveness: number,
  isSTAB: boolean,
): number {
  const base = (((2 * attackerLevel) / 5 + 2) * power * (attackStat / defenseStat)) / 50 + 2;
  return base * effectiveness * (isSTAB ? 1.5 : 1);
}

// For each of the opponent's types, find their highest-power STAB move in the learnset.
// Used when the opponent's exact moveset is unknown.
export function getDefaultOpponentMoves(
  species: PokemonData,
  dex: Dex,
  level: number | null,
): MoveData[] {
  const learned = species.learnset
    .filter(
      (e) =>
        e.method === 'level-up' &&
        (level == null || (e.levelLearnedAt ?? 0) <= level),
    )
    .map((e) => dex.getMove(e.moveName))
    .filter((m): m is MoveData => m != null && m.category !== 'Status' && (m.power ?? 0) > 0);

  const result: MoveData[] = [];
  for (const type of species.types) {
    if (!type) continue;
    const best = [...learned]
      .filter((m) => m.type === type)
      .sort((a, b) => (b.power ?? 0) - (a.power ?? 0))[0];
    if (best) result.push(best);
  }

  // Fallback: if no STAB damaging moves found, use the highest-power move overall.
  if (result.length === 0) {
    const best = [...learned].sort((a, b) => (b.power ?? 0) - (a.power ?? 0))[0];
    if (best) result.push(best);
  }

  return result;
}

export function computeMatchup(
  team: (TeamMember | null)[],
  opponent: ResolvedOpponent,
  dex: Dex,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG,
): MatchupScore[] {
  const oppSpecies = dex.getPokemon(opponent.species);

  const oppStats: BaseStats =
    oppSpecies && opponent.level != null
      ? estimateOpponentStats(oppSpecies.baseStats, opponent.level)
      : (oppSpecies?.baseStats ?? {
          hp: 100,
          attack: 100,
          defense: 100,
          specialAttack: 100,
          specialDefense: 100,
          speed: 100,
        });

  const oppMoves: MoveData[] = (() => {
    const known = opponent.moves
      .filter(Boolean)
      .map((name) => dex.getMove(name!))
      .filter((m): m is MoveData => m != null && m.category !== 'Status' && (m.power ?? 0) > 0);
    return known.length > 0
      ? known
      : oppSpecies
        ? getDefaultOpponentMoves(oppSpecies, dex, opponent.level)
        : [];
  })();

  const results: MatchupScore[] = [];

  for (const member of team) {
    if (!member) continue;

    const memberSpecies = dex.getPokemon(member.species);
    const memberTypes: [TypeName, TypeName?] = memberSpecies?.types ?? ['Normal'];

    // --- Offensive scoring ---
    const allMoveScores: MoveScore[] = [];

    for (const moveName of member.moves) {
      if (!moveName) continue;
      const move = dex.getMove(moveName);
      if (!move || move.category === 'Status' || !move.power) continue;

      const effectiveness = dex.getTypeEffectiveness(move.type, opponent.types, opponent.ability);
      const isSTAB = memberTypes.some((t) => t === move.type);
      const attackStat =
        move.category === 'Physical' ? member.stats.attack : member.stats.specialAttack;
      const defenseStat =
        move.category === 'Physical' ? oppStats.defense : oppStats.specialDefense;

      const expectedDamage =
        effectiveness === 0
          ? 0
          : estimateDamage(member.level, move.power, attackStat, defenseStat, effectiveness, isSTAB);

      allMoveScores.push({ moveName, expectedDamage, effectiveness, isSTAB });
    }

    const bestMove =
      allMoveScores.length > 0
        ? allMoveScores.reduce((best, m) =>
            m.expectedDamage > best.expectedDamage ? m : best,
          )
        : null;
    const offensiveScore = bestMove?.expectedDamage ?? 0;

    // --- Defensive scoring ---
    const threats: ThreatEntry[] = [];
    let maxIncoming = 0;

    for (const oppMove of oppMoves) {
      const effectiveness = dex.getTypeEffectiveness(oppMove.type, memberTypes, member.ability);
      if (effectiveness === 0) continue;

      const isSTAB = opponent.types.some((t) => t === oppMove.type);
      const attackStat =
        oppMove.category === 'Physical' ? oppStats.attack : oppStats.specialAttack;
      const defenseStat =
        oppMove.category === 'Physical' ? member.stats.defense : member.stats.specialDefense;
      const power = oppMove.power ?? 0;

      const incoming = estimateDamage(
        opponent.level ?? 50,
        power,
        attackStat,
        defenseStat,
        effectiveness,
        isSTAB,
      );

      if (incoming > maxIncoming) maxIncoming = incoming;
      if (!threats.some((t) => t.moveType === oppMove.type)) {
        threats.push({ moveType: oppMove.type, effectiveness });
      }
    }

    const defensiveScore = maxIncoming;
    const canOneShot = defensiveScore >= member.stats.hp;

    // --- Speed factor ---
    const speedFactor: 'faster' | 'slower' | 'unknown' =
      !oppSpecies && opponent.level == null
        ? 'unknown'
        : member.stats.speed > oppStats.speed
          ? 'faster'
          : 'slower';

    // --- Final score ---
    const finalScore =
      config.W_OFF * offensiveScore -
      config.W_DEF * defensiveScore +
      (speedFactor === 'faster' ? config.SPEED_BONUS : 0) -
      (canOneShot ? config.ONESHOT_PENALTY : 0);

    // --- Human-readable breakdown ---
    const breakdown: ScoreBreakdown = {
      offCalc: bestMove
        ? `${bestMove.moveName}: ${bestMove.effectiveness}× eff → ~${Math.round(bestMove.expectedDamage)} dmg${bestMove.isSTAB ? ' (STAB)' : ''}`
        : 'No damaging moves',
      defCalc:
        oppMoves.length > 0
          ? `Worst incoming: ~${Math.round(defensiveScore)} dmg${canOneShot ? ' ⚠ one-shot risk' : ''}`
          : 'No opponent moves known',
      speedNote:
        speedFactor === 'faster'
          ? `Faster (${member.stats.speed} vs ~${oppStats.speed})`
          : speedFactor === 'slower'
            ? `Slower (${member.stats.speed} vs ~${oppStats.speed})`
            : 'Speed unknown',
    };

    results.push({
      teamMember: member,
      offensiveScore,
      defensiveScore,
      speedFactor,
      finalScore,
      bestMove,
      allMoveScores,
      threats,
      breakdown,
    });
  }

  return results.sort((a, b) => b.finalScore - a.finalScore);
}
