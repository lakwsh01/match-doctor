import { Section } from '../components/Section';
import { CourtView } from '../features/court/CourtView';
import { PlayerDetail } from '../features/players/PlayerDetail';
import { PlayerTable } from '../features/players/PlayerTable';
import { DataChecks } from '../features/quality/DataChecks';
import { RallyStrip } from '../features/rallies/RallyStrip';
import { PointSummary } from '../features/scoreboard/PointSummary';
import { Scoreboard } from '../features/scoreboard/Scoreboard';
import { TeamCompare } from '../features/teams/TeamCompare';
import type { GameReport } from '../lib/report/analysis';
import type { Id } from '../lib/report/types';
import { formatClock, formatScore, reportName, teamLabel } from '../lib/format';
import { useT } from '../components/useT';
import styles from './GameView.module.css';

type GameViewProps = {
  report: GameReport;
  rally: number | null;
  player: Id | null;
  onRally: (rally: number | null) => void;
  onPlayer: (player: Id | null) => void;
};

export function GameView({ report, rally, player, onRally, onPlayer }: GameViewProps) {
  const t = useT();
  const { result, teams, players } = report;
  const order = teams.map((team) => team.team_id);
  const winnerFirst = [result.winner_team_id, ...order.filter((id) => id !== result.winner_team_id)];
  const summary = t('game.summary', {
    team: teamLabel(t, result.winner_team_id),
    score: formatScore(result.score, winnerFirst),
    rallies: result.rallies,
    clock: formatClock(result.play_sec),
    contacts: result.longest_rally.shot_count,
  });

  return (
    <main>
      <h1 className={styles.title}>{`${report.title} — ${reportName(t, report.id)}`}</h1>
      <div className={styles.hero}>
        <Scoreboard teams={teams} score={result.score} winner={result.winner_team_id} summary={summary} />
        <PointSummary teams={teams} />
        <div className={styles.play}>
          <CourtView
            court={report.court}
            players={players}
            rallies={report.rallies}
            scope="game"
            rally={rally}
            player={player}
            onClearRally={() => onRally(null)}
            onClearPlayer={() => onPlayer(null)}
          >
            <RallyStrip rallies={report.rallies} order={order} selected={rally} onSelect={onRally} />
          </CourtView>
        </div>
      </div>
      <Section title={t('teams.title')} note={t('teams.note_game')}>
        <TeamCompare teams={teams} />
      </Section>
      <Section title={t('players.title')} note={t('players.note_game')}>
        <PlayerTable players={players} selected={player} onSelect={onPlayer} />
        <PlayerDetail player={players.find((p) => p.player_id === player) ?? null} />
      </Section>
      <Section title={t('checks.title')} note={t('checks.note_game')}>
        <DataChecks checks={report.data_quality} />
      </Section>
    </main>
  );
}
