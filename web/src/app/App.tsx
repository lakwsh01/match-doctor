import { Suspense, useState, useTransition } from 'react';
import { SegmentedControl } from '../components/SegmentedControl';
import { reportEntries } from '../lib/report/load';
import type { Id } from '../lib/report/types';
import { GameView } from './GameView';
import styles from './App.module.css';

export function App() {
  const [gameId, setGameId] = useState(reportEntries[0]?.id);
  const [rally, setRally] = useState<number | null>(null);
  const [player, setPlayer] = useState<Id | null>(null);
  const [loading, startTransition] = useTransition();

  const pickGame = (id: string) =>
    startTransition(() => {
      setGameId(id);
      setRally(null);
    });

  return (
    <div className={styles.page} aria-busy={loading}>
      <header className={styles.header}>
        <p className={styles.brand}>Match Doctor</p>
        {gameId && (
          <SegmentedControl
            label="Game"
            options={reportEntries.map((e) => ({ value: e.id, label: e.label }))}
            value={gameId}
            onChange={pickGame}
          />
        )}
      </header>
      {gameId ? (
        <Suspense fallback={<p className={styles.status}>Loading report…</p>}>
          <div className={styles.body} data-loading={loading}>
            <GameView gameId={gameId} rally={rally} player={player} onRally={setRally} onPlayer={setPlayer} />
          </div>
        </Suspense>
      ) : (
        <p className={styles.status}>No reports found. Add a report JSON file to docs/demo/raw and reload.</p>
      )}
    </div>
  );
}
