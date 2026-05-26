import { useMemo } from 'react';
import type { OpponentState, SessionOverride, ResolvedOpponent, TypeName } from '@/types';
import { ALL_TYPES } from '@/types';
import type { Dex } from '@/lib/dex';
import { SearchableDropdown } from '@/components/shared/SearchableDropdown';
import { MoveSlotInput } from '@/components/team/MoveSlotInput';
import { getDefaultOpponentMoves } from '@/lib/damage';
import { clamp } from '@/lib/utils';

const TYPE_COLORS: Record<string, string> = {
  Normal: 'bg-gray-500', Fire: 'bg-orange-600', Water: 'bg-blue-600',
  Electric: 'bg-yellow-500', Grass: 'bg-green-600', Ice: 'bg-cyan-500',
  Fighting: 'bg-red-700', Poison: 'bg-purple-600', Ground: 'bg-yellow-700',
  Flying: 'bg-indigo-400', Psychic: 'bg-pink-600', Bug: 'bg-lime-600',
  Rock: 'bg-yellow-800', Ghost: 'bg-purple-900', Dragon: 'bg-indigo-700',
  Dark: 'bg-gray-800', Steel: 'bg-gray-400', Fairy: 'bg-pink-400',
};

const TYPE_OPTIONS = ALL_TYPES.map((t) => ({ value: t, label: t }));
const TYPE_OPTIONS_WITH_NONE = [{ value: '', label: 'None' }, ...TYPE_OPTIONS];

interface OpponentPanelProps {
  opponent: OpponentState;
  override: SessionOverride;
  resolved: ResolvedOpponent | null;
  dex: Dex;
  onSetByName: (name: string) => void;
  onSetLevel: (level: number | null) => void;
  onApplyOverride: (partial: Partial<SessionOverride>) => void;
  onResetOverrides: () => void;
  onClear: () => void;
}

export function OpponentPanel({
  opponent,
  override,
  resolved,
  dex,
  onSetByName,
  onSetLevel,
  onApplyOverride,
  onResetOverrides,
  onClear,
}: OpponentPanelProps) {
  const allPokemon = dex.getAllPokemon();
  const hasOverrides = Object.keys(override).length > 0;

  // Estimated moves for display (shown dim when not explicitly set)
  const estimatedMoves = useMemo(() => {
    if (!resolved) return [];
    const species = dex.getPokemon(resolved.species);
    if (!species) return [];
    return getDefaultOpponentMoves(species, dex, resolved.level);
  }, [resolved, dex]);

  const effectiveMoves = resolved?.moves ?? [null, null, null, null];
  const anyMoveSet = effectiveMoves.some(Boolean);

  return (
    <section className="space-y-4 rounded-lg bg-gray-800 border border-gray-700 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-200">Opponent</h2>
        {resolved && (
          <button
            onClick={onClear}
            className="text-xs text-gray-500 hover:text-red-400 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Species + Level */}
      <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 uppercase tracking-wider">Species</label>
          <SearchableDropdown
            options={allPokemon}
            getLabel={(p) => p.name}
            getValue={(p) => p.name}
            value={opponent.species}
            onChange={(name) => name && onSetByName(name)}
            placeholder="Search opponent…"
          />
        </div>
        <div className="flex flex-col gap-1 w-20">
          <label className="text-xs text-gray-400 uppercase tracking-wider">Level</label>
          <input
            type="number"
            min={1}
            max={100}
            value={resolved?.level ?? ''}
            disabled={!resolved}
            placeholder="?"
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              onSetLevel(isNaN(n) ? null : clamp(n, 1, 100));
            }}
            className="w-full rounded px-2 py-1.5 text-sm text-center bg-gray-700 border border-gray-600 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 disabled:opacity-40"
          />
        </div>
      </div>

      {resolved && (
        <>
          {/* Types */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-400 uppercase tracking-wider">Types</label>
              {(override.type1 !== undefined || override.type2 !== undefined) && (
                <span className="text-xs text-yellow-400">overridden</span>
              )}
            </div>
            <div className="flex gap-2">
              {/* Type 1 */}
              <div className="flex-1 flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-1 rounded font-medium text-white shrink-0 ${TYPE_COLORS[resolved.types[0]] ?? 'bg-gray-600'}`}
                >
                  {resolved.types[0]}
                </span>
                <SearchableDropdown
                  options={TYPE_OPTIONS}
                  getLabel={(o) => o.label}
                  getValue={(o) => o.value}
                  value={resolved.types[0]}
                  onChange={(v) => v && onApplyOverride({ type1: v as TypeName })}
                  placeholder="Type 1"
                />
              </div>
              {/* Type 2 */}
              <div className="flex-1 flex items-center gap-2">
                {resolved.types[1] && (
                  <span
                    className={`text-xs px-2 py-1 rounded font-medium text-white shrink-0 ${TYPE_COLORS[resolved.types[1]] ?? 'bg-gray-600'}`}
                  >
                    {resolved.types[1]}
                  </span>
                )}
                <SearchableDropdown
                  options={TYPE_OPTIONS_WITH_NONE}
                  getLabel={(o) => o.label}
                  getValue={(o) => o.value}
                  value={resolved.types[1] ?? ''}
                  onChange={(v) =>
                    onApplyOverride({ type2: (v || null) as TypeName | null })
                  }
                  placeholder="Type 2 (none)"
                />
              </div>
            </div>
          </div>

          {/* Moves */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-400 uppercase tracking-wider">Moves</label>
              {!anyMoveSet && estimatedMoves.length > 0 && (
                <span className="text-xs text-gray-500 italic">
                  estimating from learnset
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {([0, 1, 2, 3] as const).map((slot) => {
                const explicitMove = effectiveMoves[slot];
                const estimatedMove = estimatedMoves[slot]?.name ?? null;
                return (
                  <div key={slot} className="flex flex-col gap-1">
                    <MoveSlotInput
                      slotLabel={
                        !explicitMove && estimatedMove
                          ? `Move ${slot + 1} (est.)`
                          : `Move ${slot + 1}`
                      }
                      value={explicitMove}
                      onChange={(v) => {
                        const moves = [...effectiveMoves] as ResolvedOpponent['moves'];
                        moves[slot] = v;
                        onApplyOverride({ moves });
                      }}
                      dex={dex}
                      speciesName={resolved.species}
                    />
                    {!explicitMove && estimatedMove && (
                      <p className="text-xs text-gray-500 pl-1 italic">{estimatedMove}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Overrides toolbar */}
          {hasOverrides && (
            <div className="pt-1 border-t border-gray-700 flex justify-end">
              <button
                onClick={onResetOverrides}
                className="text-xs text-yellow-400 hover:text-yellow-200 transition-colors"
              >
                Reset to dex defaults
              </button>
            </div>
          )}
        </>
      )}

      {!resolved && (
        <p className="text-sm text-gray-500 text-center py-4">
          Search for an opponent to get recommendations
        </p>
      )}
    </section>
  );
}
