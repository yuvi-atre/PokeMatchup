import { GAME_REGISTRY } from '@/data/games';

interface HeaderProps {
  gameId: string;
  onSwitchGame: (gameId: string) => void;
}

export function Header({ gameId, onSwitchGame }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-700">
      <h1 className="text-xl font-bold text-white tracking-tight">
        Poké<span className="text-red-400">Matchup</span>
      </h1>
      <div className="flex items-center gap-2">
        <label htmlFor="game-select" className="text-sm text-gray-400">
          Game:
        </label>
        <select
          id="game-select"
          value={gameId}
          onChange={(e) => onSwitchGame(e.target.value)}
          className="bg-gray-800 text-white text-sm rounded border border-gray-600 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          {GAME_REGISTRY.map((g) => (
            <option key={g.meta.id} value={g.meta.id}>
              {g.meta.name}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}
