import type { MatchupScore } from '@/types';
import { ScoreBreakdown } from './ScoreBreakdown';

const TYPE_COLORS: Record<string, string> = {
  Normal: 'bg-gray-500', Fire: 'bg-orange-600', Water: 'bg-blue-600',
  Electric: 'bg-yellow-500', Grass: 'bg-green-600', Ice: 'bg-cyan-500',
  Fighting: 'bg-red-700', Poison: 'bg-purple-600', Ground: 'bg-yellow-700',
  Flying: 'bg-indigo-400', Psychic: 'bg-pink-600', Bug: 'bg-lime-600',
  Rock: 'bg-yellow-800', Ghost: 'bg-purple-900', Dragon: 'bg-indigo-700',
  Dark: 'bg-gray-800', Steel: 'bg-gray-400', Fairy: 'bg-pink-400',
};

const EFF_LABEL: Record<number, string> = {
  0: '0×', 0.25: '¼×', 0.5: '½×', 1: '1×', 2: '2×', 4: '4×',
};

function effColor(eff: number): string {
  if (eff === 0) return 'text-gray-500';
  if (eff < 1) return 'text-red-400';
  if (eff === 1) return 'text-gray-300';
  if (eff === 2) return 'text-green-400';
  return 'text-green-300 font-bold';
}

interface RecommendationPanelProps {
  matchups: MatchupScore[];
}

export function RecommendationPanel({ matchups }: RecommendationPanelProps) {
  if (matchups.length === 0) {
    return (
      <section className="rounded-lg bg-gray-800 border border-gray-700 p-5">
        <h2 className="text-base font-semibold text-gray-200 mb-3">Recommendations</h2>
        <p className="text-sm text-gray-500 text-center py-6">
          Select an opponent to see recommendations
        </p>
      </section>
    );
  }

  const [top, ...rest] = matchups;

  return (
    <section className="rounded-lg bg-gray-800 border border-gray-700 p-5 space-y-4">
      <h2 className="text-base font-semibold text-gray-200">Recommendations</h2>

      {/* Top pick — highlighted */}
      <MatchupRow matchup={top} rank={1} highlight />

      {/* Remaining picks */}
      {rest.map((m, i) => (
        <MatchupRow key={m.teamMember.id} matchup={m} rank={i + 2} highlight={false} />
      ))}
    </section>
  );
}

function MatchupRow({
  matchup,
  rank,
  highlight,
}: {
  matchup: MatchupScore;
  rank: number;
  highlight: boolean;
}) {
  const { teamMember, bestMove, speedFactor, finalScore } = matchup;
  const canOneShot = matchup.defensiveScore >= teamMember.stats.hp;

  return (
    <div
      className={[
        'rounded-lg p-4 space-y-2',
        highlight
          ? 'bg-blue-900/30 border border-blue-700'
          : 'bg-gray-750 border border-gray-700',
      ].join(' ')}
      style={!highlight ? { backgroundColor: '#1c2333' } : undefined}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={[
              'text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0',
              highlight ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400',
            ].join(' ')}
          >
            {rank}
          </span>
          <span className="font-semibold text-gray-100">
            {teamMember.nickname ?? teamMember.species}
          </span>
          <span className="text-xs text-gray-500">Lv.{teamMember.level}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canOneShot && (
            <span className="text-xs text-red-400 font-medium">⚠ one-shot risk</span>
          )}
          {speedFactor === 'faster' && (
            <span className="text-xs text-blue-400">faster</span>
          )}
          {speedFactor === 'slower' && (
            <span className="text-xs text-gray-500">slower</span>
          )}
          <span className="text-sm font-bold text-gray-300 tabular-nums">
            {finalScore >= 0 ? '+' : ''}{Math.round(finalScore)}
          </span>
        </div>
      </div>

      {/* Best move */}
      {bestMove ? (
        <div className="flex items-center gap-2 text-sm pl-8">
          <span className="text-gray-300">{bestMove.moveName}</span>
          <span className={`text-xs ${effColor(bestMove.effectiveness)}`}>
            {EFF_LABEL[bestMove.effectiveness] ?? `${bestMove.effectiveness}×`}
          </span>
          {bestMove.isSTAB && (
            <span className="text-xs text-yellow-400">STAB</span>
          )}
          <span className="text-xs text-gray-500">
            ~{Math.round(bestMove.expectedDamage)} dmg
          </span>
        </div>
      ) : (
        <p className="text-sm text-gray-500 pl-8">No damaging moves</p>
      )}

      {/* Threat badges */}
      {matchup.threats.length > 0 && (
        <div className="flex flex-wrap gap-1 pl-8">
          {matchup.threats.map((t) => (
            <span
              key={t.moveType}
              className={`text-xs px-1.5 py-0.5 rounded font-medium text-white opacity-80 ${TYPE_COLORS[t.moveType] ?? 'bg-gray-600'}`}
              title={`${t.moveType}: ${t.effectiveness}× incoming`}
            >
              {t.moveType} {t.effectiveness}×
            </span>
          ))}
        </div>
      )}

      <div className="pl-8">
        <ScoreBreakdown matchup={matchup} />
      </div>
    </div>
  );
}
