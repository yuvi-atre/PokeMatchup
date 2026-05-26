import { useState } from 'react';
import type { MatchupScore } from '@/types';

interface ScoreBreakdownProps {
  matchup: MatchupScore;
}

export function ScoreBreakdown({ matchup }: ScoreBreakdownProps) {
  const [open, setOpen] = useState(false);
  const { breakdown, offensiveScore, defensiveScore, speedFactor, finalScore } = matchup;

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        {open ? '▲ Hide' : '▼ Details'}
      </button>

      {open && (
        <div className="mt-2 space-y-1 pl-3 border-l border-gray-700 text-xs text-gray-400">
          <p>
            <span className="text-gray-500">Off:</span>{' '}
            <span className="text-green-400">{breakdown.offCalc}</span>
          </p>
          <p>
            <span className="text-gray-500">Def:</span>{' '}
            <span className={matchup.defensiveScore >= matchup.teamMember.stats.hp ? 'text-red-400' : 'text-gray-300'}>
              {breakdown.defCalc}
            </span>
          </p>
          <p>
            <span className="text-gray-500">Speed:</span>{' '}
            <span className={speedFactor === 'faster' ? 'text-blue-400' : 'text-gray-400'}>
              {breakdown.speedNote}
            </span>
          </p>
          <p className="text-gray-600 pt-1">
            Score = {offensiveScore.toFixed(0)} off − {defensiveScore.toFixed(0)} def
            {speedFactor === 'faster' ? ' + 20 spd' : ''}
            {matchup.defensiveScore >= matchup.teamMember.stats.hp ? ' − 60 oneshot' : ''}
            {' '}= <span className="text-gray-300 font-medium">{finalScore.toFixed(0)}</span>
          </p>
        </div>
      )}
    </div>
  );
}
