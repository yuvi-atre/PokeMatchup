import { useGameProfile } from '@/hooks/useGameProfile';
import { useTeam } from '@/hooks/useTeam';
import { useDexCorrections } from '@/hooks/useDexCorrections';
import { useOpponent } from '@/hooks/useOpponent';
import { useMatchup } from '@/hooks/useMatchup';
import { Layout } from '@/components/layout/Layout';
import { TeamPanel } from '@/components/team/TeamPanel';
import { OpponentPanel } from '@/components/opponent/OpponentPanel';
import { RecommendationPanel } from '@/components/recommendation/RecommendationPanel';
import { Spinner } from '@/components/shared/Spinner';
import { ErrorBanner } from '@/components/shared/ErrorBanner';

export function App() {
  const { gameId, dex, isLoading, error, switchGame } = useGameProfile();
  const { team, setMember, clearTeam } = useTeam(gameId);
  const { getCorrection } = useDexCorrections(gameId);
  const {
    opponent,
    override,
    resolved,
    setOpponentByName,
    setLevel,
    applyOverride,
    resetOverrides,
    clearOpponent,
  } = useOpponent(getCorrection);
  const matchups = useMatchup(team, resolved, dex);

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
        <div className="space-y-6">
          <TeamPanel
            team={team}
            dex={dex}
            onSetMember={setMember}
            onClearTeam={clearTeam}
          />

          <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">
            <OpponentPanel
              opponent={opponent}
              override={override}
              resolved={resolved}
              dex={dex}
              onSetByName={(name) => setOpponentByName(name, dex)}
              onSetLevel={setLevel}
              onApplyOverride={applyOverride}
              onResetOverrides={resetOverrides}
              onClear={clearOpponent}
            />
            <RecommendationPanel matchups={matchups} />
          </div>
        </div>
      )}
    </Layout>
  );
}
