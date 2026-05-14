import { clamp } from '@/lib/utils';

interface StatInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export function StatInput({ label, value, onChange }: StatInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-400 uppercase tracking-wider">{label}</label>
      <input
        type="number"
        min={1}
        max={999}
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!isNaN(n)) onChange(clamp(n, 1, 999));
        }}
        className="w-full rounded px-2 py-1 text-sm text-center bg-gray-800 border border-gray-600 text-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
      />
    </div>
  );
}
