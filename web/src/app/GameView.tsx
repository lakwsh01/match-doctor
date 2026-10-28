import { use } from 'react';
import { Section } from '../components/Section';
import { CourtView } from '../features/court/CourtView';
import { PlayerDetail } from '../features/players/PlayerDetail';
import { PlayerTable } from '../features/players/PlayerTable';
import { RallyStrip } from '../features/rallies/RallyStrip';
import { Scoreboard } from '../features/scoreboard/Scoreboard';
import { loadReport } from '../lib/report/load';
import type { Id } from '../lib/report/types';
import styles from './GameView.module.css';

type GameViewProps = {
  gameId: string;
  rally: number | null;
  player: Id | null;
  onRally: (rally: number | null) => void;
  onPlayer: (player: Id | null) => void;
};

export function GameView({ gameId, rally, player, onRally, onPlayer }: GameViewProps) {
  const report = use(loadReport(gameId));

  return (
    <main>
      <h1 className={styles.title}>{report.match.title}</h1>
      <div className={styles.hero}>
        <Scoreboard report={report} />
        <div className={styles.play}>
          <CourtView
            report={report}
            rally={rally}
            player={player}
            onClearRally={() => onRally(null)}
            onClearPlayer={() => onPlayer(null)}
          />
          <RallyStrip report={report} selected={rally} onSelect={onRally} />
        </div>
      </div>
      <Section title="Players" note="Speeds and positions are estimates from the video. Errors count every type the report logs.">
        <PlayerTable report={report} selected={player} onSelect={onPlayer} />
        <PlayerDetail report={report} player={player} />
      </Section>
    </main>
  );
}
