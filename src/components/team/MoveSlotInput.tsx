import { useMemo } from 'react';
import type { Dex } from '@/lib/dex';
import type { MoveData } from '@/types';
import { SearchableDropdown } from '@/components/shared/SearchableDropdown';

interface MoveSlotInputProps {
  slotLabel: string;
  value: string | null;
  onChange: (value: string | null) => void;
  dex: Dex;
  speciesName: string | null;
}

export function MoveSlotInput({ slotLabel, value, onChange, dex, speciesName }: MoveSlotInputProps) {
  // Build options: learnset moves first, then remaining moves from full dex
  const options: MoveData[] = useMemo(() => {
    const allMoves = dex.getAllMoves();
    if (!speciesName) return allMoves;

    const species = dex.getPokemon(speciesName);
    if (!species) return allMoves;

    const learnsetNames = new Set(species.learnset.map((e) => e.moveName.toLowerCase()));
    const learnsetMoves = allMoves.filter((m) => learnsetNames.has(m.name.toLowerCase()));
    const otherMoves = allMoves.filter((m) => !learnsetNames.has(m.name.toLowerCase()));

    return [...learnsetMoves, ...otherMoves];
  }, [dex, speciesName]);

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-400">{slotLabel}</label>
      <SearchableDropdown
        options={options}
        getLabel={(m) => m.name}
        getValue={(m) => m.name}
        value={value}
        onChange={onChange}
        placeholder="Move…"
      />
    </div>
  );
}
