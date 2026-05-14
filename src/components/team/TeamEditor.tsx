import { useState } from 'react';
import type { TeamMember } from '@/types';
import type { Dex } from '@/lib/dex';
import { Modal } from '@/components/shared/Modal';
import { MemberForm } from './MemberForm';

interface TeamEditorProps {
  isOpen: boolean;
  onClose: () => void;
  team: (TeamMember | null)[];
  dex: Dex;
  onSetMember: (index: number, member: TeamMember | null) => void;
  initialSlot?: number;
}

export function TeamEditor({
  isOpen,
  onClose,
  team,
  dex,
  onSetMember,
  initialSlot = 0,
}: TeamEditorProps) {
  const [activeSlot, setActiveSlot] = useState(initialSlot);

  function slotLabel(index: number) {
    const member = team[index];
    return member ? member.species : `Slot ${index + 1}`;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Team">
      {/* Slot picker tabs */}
      <div className="flex border-b border-gray-700 shrink-0 overflow-x-auto">
        {([0, 1, 2, 3, 4, 5] as const).map((i) => (
          <button
            key={i}
            onClick={() => setActiveSlot(i)}
            className={[
              'px-4 py-2.5 text-sm whitespace-nowrap transition-colors border-b-2 -mb-px',
              activeSlot === i
                ? 'border-blue-500 text-blue-400 font-medium'
                : team[i]
                ? 'border-transparent text-gray-300 hover:text-gray-100'
                : 'border-transparent text-gray-500 hover:text-gray-400',
            ].join(' ')}
          >
            <span className="text-xs text-gray-500 mr-1">{i + 1}</span>
            {slotLabel(i)}
          </button>
        ))}
      </div>

      {/* Active slot form */}
      <MemberForm
        member={team[activeSlot]}
        dex={dex}
        onChange={(updated) => onSetMember(activeSlot, updated)}
        onClear={() => onSetMember(activeSlot, null)}
      />

      {/* Slot navigation */}
      <div className="flex justify-between px-6 py-3 border-t border-gray-700 shrink-0">
        <button
          onClick={() => setActiveSlot((s) => Math.max(s - 1, 0))}
          disabled={activeSlot === 0}
          className="text-sm text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ← Prev
        </button>
        <span className="text-xs text-gray-500">{activeSlot + 1} / 6</span>
        <button
          onClick={() => setActiveSlot((s) => Math.min(s + 1, 5))}
          disabled={activeSlot === 5}
          className="text-sm text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next →
        </button>
      </div>
    </Modal>
  );
}
