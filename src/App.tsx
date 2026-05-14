import { useGameProfile } from '@/hooks/useGameProfile';
import { useTeam } from '@/hooks/useTeam';
import { Layout } from '@/components/layout/Layout';
import { TeamPanel } from '@/components/team/TeamPanel';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';

export function App() {
  const { gameId, dex, isLoading, error, switchGame } = useGameProfile();
  const { team, setMember, clearTeam } = useTeam(gameId);

  return (
    <Layout gameId={gameId} onSwitchGame={switchGame}>
      {isLoading && (
        <div className="flex items-center justify-center gap-3 py-20 text-gray-400">
          <Spinner />
          <span>Loading {gameId}…</span>
        </div>
      )}
      {error && <ErrorBanner message={`Failed to load game data: ${error}`} />}
      {dex && !isLoading && (
        <div className="space-y-8">
          <TeamPanel
            team={team}
            dex={dex}
            onSetMember={setMember}
            onClearTeam={clearTeam}
          />

          {/* Placeholder for Step 3: Opponent + Recommendations */}
          <div className="rounded bg-gray-800/50 border border-gray-700 p-6 text-center text-gray-500 text-sm">
            Opponent selector coming in Step 3
          </div>
        </div>
      )}
    </Layout>
  );
}
