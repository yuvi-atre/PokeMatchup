import type { ReactNode } from 'react';
import { Header } from './Header';

interface LayoutProps {
  gameId: string;
  onSwitchGame: (gameId: string) => void;
  children: ReactNode;
}

export function Layout({ gameId, onSwitchGame, children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <Header gameId={gameId} onSwitchGame={onSwitchGame} />
      <main className="flex-1 flex flex-col gap-4 p-4 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
