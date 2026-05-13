import { useGameProfile } from '@/hooks/useGameProfile';
import { Layout } from '@/components/layout/Layout';

export function App() {
  const { gameId, dex, isLoading, error, switchGame } = useGameProfile();

  return (
    <Layout gameId={gameId} onSwitchGame={switchGame}>
      {isLoading && (
        <div className="flex items-center justify-center py-20 text-gray-400">
          Loading {gameId}…
        </div>
      )}
      {error && (
        <div className="rounded bg-red-900/40 border border-red-600 p-4 text-red-300">
          Failed to load game data: {error}
        </div>
      )}
      {dex && !isLoading && (
        <div className="rounded bg-gray-800 border border-gray-700 p-6 text-center">
          <p className="text-green-400 font-semibold text-lg">
            ✓ Dex loaded: {dex.gameId}
          </p>
          <p className="text-gray-400 mt-1 text-sm">
            {dex.getAllPokemon().length} species · {dex.getAllMoves().length} moves
          </p>
          <p className="text-gray-500 mt-4 text-xs">
            Team builder coming next (Step 2)
          </p>
        </div>
      )}
    </Layout>
  );
}
