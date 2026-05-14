import type { TeamMember, TypeName } from '@/types';
import type { Dex } from '@/lib/dex';

interface TeamMemberCardProps {
  member: TeamMember | null;
  slotIndex: number;
  onEdit: () => void;
  dex: Dex;
}

const TYPE_COLORS: Record<string, string> = {
  Normal: 'bg-gray-500',
  Fire: 'bg-orange-600',
  Water: 'bg-blue-600',
  Electric: 'bg-yellow-500',
  Grass: 'bg-green-600',
  Ice: 'bg-cyan-500',
  Fighting: 'bg-red-700',
  Poison: 'bg-purple-600',
  Ground: 'bg-yellow-700',
  Flying: 'bg-indigo-400',
  Psychic: 'bg-pink-600',
  Bug: 'bg-lime-600',
  Rock: 'bg-yellow-800',
  Ghost: 'bg-purple-900',
  Dragon: 'bg-indigo-700',
  Dark: 'bg-gray-800',
  Steel: 'bg-gray-400',
  Fairy: 'bg-pink-400',
};

export function TeamMemberCard({ member, slotIndex, onEdit, dex }: TeamMemberCardProps) {
  if (!member) {
    return (
      <button
        onClick={onEdit}
        className="flex flex-col items-center justify-center h-28 rounded-lg border-2 border-dashed border-gray-700 hover:border-gray-500 text-gray-500 hover:text-gray-400 transition-colors gap-1"
      >
        <span className="text-2xl">+</span>
        <span className="text-xs">Slot {slotIndex + 1}</span>
      </button>
    );
  }

  const species = dex.getPokemon(member.species);
  const types: TypeName[] = species
    ? species.types.filter((t): t is TypeName => t !== undefined)
    : [];
  const filledMoves = member.moves.filter(Boolean);

  return (
    <button
      onClick={onEdit}
      className="flex flex-col h-28 rounded-lg border border-gray-700 bg-gray-800 hover:border-gray-500 hover:bg-gray-750 transition-colors p-3 text-left gap-1 w-full"
    >
      {/* Species + types */}
      <div className="flex items-center justify-between gap-1">
        <span className="text-sm font-semibold text-gray-100 truncate">
          {member.nickname ?? member.species}
        </span>
        <div className="flex gap-1 shrink-0">
          {types.map((t) => (
            <span
              key={t}
              className={`text-xs px-1.5 py-0.5 rounded font-medium text-white ${TYPE_COLORS[t] ?? 'bg-gray-600'}`}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Level */}
      <span className="text-xs text-gray-400">Lv.{member.level}</span>

      {/* Moves */}
      <div className="mt-auto space-y-0.5">
        {filledMoves.slice(0, 2).map((move) => (
          <p key={move} className="text-xs text-gray-400 truncate">
            {move}
          </p>
        ))}
        {filledMoves.length > 2 && (
          <p className="text-xs text-gray-500">+{filledMoves.length - 2} more</p>
        )}
      </div>
    </button>
  );
}
