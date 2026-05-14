import { useState } from 'react';
import type { TeamMember } from '@/types';
import type { Dex } from '@/lib/dex';
import { TeamMemberCard } from './TeamMemberCard';
import { TeamEditor } from './TeamEditor';

interface TeamPanelProps {
  team: (TeamMember | null)[];
  dex: Dex;
  onSetMember: (index: number, member: TeamMember | null) => void;
  onClearTeam: () => void;
}

export function TeamPanel({ team, dex, onSetMember, onClearTeam }: TeamPanelProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(0);

  function openSlot(index: number) {
    setEditingSlot(index);
    setEditorOpen(true);
  }

  const filledCount = team.filter(Boolean).length;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-gray-200">Your Team</h2>
          <span className="text-xs text-gray-500">{filledCount}/6</span>
        </div>
        <div className="flex items-center gap-3">
          {filledCount > 0 && (
            <button
              onClick={onClearTeam}
              className="text-xs text-gray-500 hover:text-red-400 transition-colors"
            >
              Clear all
            </button>
          )}
          <button
            onClick={() => openSlot(0)}
            className="text-sm px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors"
          >
            Edit Team
          </button>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-3">
        {team.map((member, i) => (
          <TeamMemberCard
            key={i}
            member={member}
            slotIndex={i}
            dex={dex}
            onEdit={() => openSlot(i)}
          />
        ))}
      </div>

      <TeamEditor
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        team={team}
        dex={dex}
        onSetMember={onSetMember}
        initialSlot={editingSlot}
      />
    </section>
  );
}
