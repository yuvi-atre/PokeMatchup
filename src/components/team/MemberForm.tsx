import { useCallback } from 'react';
import type { TeamMember, PokemonData } from '@/types';
import type { Dex } from '@/lib/dex';
import { SearchableDropdown } from '@/components/shared/SearchableDropdown';
import { StatInput } from './StatInput';
import { MoveSlotInput } from './MoveSlotInput';
import { clamp } from '@/lib/utils';

interface MemberFormProps {
  member: TeamMember | null;
  dex: Dex;
  onChange: (member: TeamMember) => void;
  onClear: () => void;
}

function defaultMovesForSpecies(
  species: PokemonData,
  level: number,
): [string | null, string | null, string | null, string | null] {
  const learned = species.learnset
    .filter((e) => e.method === 'level-up' && (e.levelLearnedAt ?? 0) <= level)
    .sort((a, b) => (a.levelLearnedAt ?? 0) - (b.levelLearnedAt ?? 0));

  const last4 = learned.slice(-4).map((e) => e.moveName);
  while (last4.length < 4) last4.unshift(null as unknown as string);
  return last4 as [string | null, string | null, string | null, string | null];
}

function blankMember(species: PokemonData, level: number): TeamMember {
  return {
    id: crypto.randomUUID(),
    species: species.name,
    level,
    stats: { ...species.baseStats },
    ability: species.abilities[0]?.name ?? null,
    heldItem: null,
    moves: defaultMovesForSpecies(species, level),
  };
}

export function MemberForm({ member, dex, onChange, onClear }: MemberFormProps) {
  const allPokemon = dex.getAllPokemon();
  const level = member?.level ?? 50;

  const currentSpecies = member ? dex.getPokemon(member.species) : undefined;

  const handleSpeciesChange = useCallback(
    (name: string | null) => {
      if (!name) return;
      const species = dex.getPokemon(name);
      if (!species) return;
      onChange(blankMember(species, level));
    },
    [dex, level, onChange],
  );

  const handleLevelChange = useCallback(
    (newLevel: number) => {
      if (!member) return;
      onChange({ ...member, level: clamp(newLevel, 1, 100) });
    },
    [member, onChange],
  );

  const handleStatChange = useCallback(
    (stat: keyof TeamMember['stats'], value: number) => {
      if (!member) return;
      onChange({ ...member, stats: { ...member.stats, [stat]: value } });
    },
    [member, onChange],
  );

  const handleMoveChange = useCallback(
    (slot: 0 | 1 | 2 | 3, value: string | null) => {
      if (!member) return;
      const moves = [...member.moves] as TeamMember['moves'];
      moves[slot] = value;
      onChange({ ...member, moves });
    },
    [member, onChange],
  );

  const handleAbilityChange = useCallback(
    (value: string | null) => {
      if (!member) return;
      onChange({ ...member, ability: value });
    },
    [member, onChange],
  );

  const abilityOptions = currentSpecies?.abilities ?? [];

  return (
    <div className="space-y-5 p-6">
      {/* Species + Level */}
      <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 uppercase tracking-wider">Species</label>
          <SearchableDropdown
            options={allPokemon}
            getLabel={(p) => p.name}
            getValue={(p) => p.name}
            value={member?.species ?? null}
            onChange={handleSpeciesChange}
            placeholder="Search species…"
          />
        </div>
        <div className="flex flex-col gap-1 w-20">
          <label className="text-xs text-gray-400 uppercase tracking-wider">Level</label>
          <input
            type="number"
            min={1}
            max={100}
            value={level}
            disabled={!member}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              if (!isNaN(n)) handleLevelChange(n);
            }}
            className="w-full rounded px-2 py-1.5 text-sm text-center bg-gray-800 border border-gray-600 text-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 disabled:opacity-40"
          />
        </div>
      </div>

      {/* Stats */}
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Stats (actual in-game)</p>
        <div className="grid grid-cols-6 gap-2">
          {(['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'] as const).map(
            (stat) => (
              <StatInput
                key={stat}
                label={
                  stat === 'specialAttack'
                    ? 'Sp.Atk'
                    : stat === 'specialDefense'
                    ? 'Sp.Def'
                    : stat.charAt(0).toUpperCase() + stat.slice(1)
                }
                value={member?.stats[stat] ?? 0}
                onChange={(v) => handleStatChange(stat, v)}
              />
            ),
          )}
        </div>
      </div>

      {/* Ability + Held Item */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 uppercase tracking-wider">Ability</label>
          <SearchableDropdown
            options={abilityOptions}
            getLabel={(a) => a.name}
            getValue={(a) => a.name}
            value={member?.ability ?? null}
            onChange={handleAbilityChange}
            placeholder="Ability…"
            disabled={!member}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 uppercase tracking-wider">Held Item</label>
          <input
            type="text"
            value={member?.heldItem ?? ''}
            disabled={!member}
            onChange={(e) =>
              member && onChange({ ...member, heldItem: e.target.value || null })
            }
            placeholder="e.g. Choice Specs"
            className="w-full rounded px-3 py-1.5 text-sm bg-gray-800 border border-gray-600 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 disabled:opacity-40"
          />
        </div>
      </div>

      {/* Moves */}
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Moves</p>
        <div className="grid grid-cols-2 gap-3">
          {([0, 1, 2, 3] as const).map((slot) => (
            <MoveSlotInput
              key={slot}
              slotLabel={`Move ${slot + 1}`}
              value={member?.moves[slot] ?? null}
              onChange={(v) => handleMoveChange(slot, v)}
              dex={dex}
              speciesName={member?.species ?? null}
            />
          ))}
        </div>
      </div>

      {/* Clear slot */}
      {member && (
        <div className="pt-1 border-t border-gray-700">
          <button
            onClick={onClear}
            className="text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            Remove from team
          </button>
        </div>
      )}
    </div>
  );
}
