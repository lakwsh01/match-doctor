import { Section } from '../components/Section';
import { CourtView } from '../features/court/CourtView';
import { PlayerDetail } from '../features/players/PlayerDetail';
import { PlayerTable } from '../features/players/PlayerTable';
import { DataChecks } from '../features/quality/DataChecks';
import { PointSummary } from '../features/scoreboard/PointSummary';
import { Scoreboard } from '../features/scoreboard/Scoreboard';
import { TeamCompare } from '../features/teams/TeamCompare';
import type { MatchReport } from '../lib/report/analysis';
import type { Id } from '../lib/report/types';
import { formatScore, teamLabel } from '../lib/format';
import { useT } from '../components/useT';
import styles from './GameView.module.css';

type MatchViewProps = {
  report: MatchReport;
  player: Id | null;
  onPlayer: (player: Id | null) => void;
};

export function MatchView({ report, player, onPlayer }: MatchViewProps) {
  const t = useT();
  const { result, teams, players } = report;
  const order = teams.map((team) => team.team_id);
  const winnerFirst = [result.winner_team_id, ...order.filter((id) => id !== result.winner_team_id)];
  const summary = t('match.summary', {
    team: teamLabel(t, result.winner_team_id),
    games: formatScore(result.games_won, winnerFirst),
    scores: t.list(report.games.map((g) => formatScore(g.score, order))),
    points: formatScore(result.points, order),
    rallies: report.games.reduce((n, g) => n + g.rallies, 0),
  });

  return (
    <main>
      <h1 className={styles.title}>{report.title}</h1>
      <div className={styles.hero}>
        <Scoreboard teams={teams} score={result.games_won} winner={result.winner_team_id} summary={summary} />
        <PointSummary teams={teams} />
        <div className={styles.play}>
          <CourtView
            court={report.court}
            players={players}
            rallies={[]}
            scope="match"
            rally={null}
            player={player}
            onClearRally={() => undefined}
            onClearPlayer={() => onPlayer(null)}
          />
        </div>
      </div>
      <Section title={t('teams.title')} note={t('teams.note_match', { games: report.games.length })}>
        <TeamCompare teams={teams} />
      </Section>
      <Section title={t('players.title')} note={t('players.note_match')}>
        <PlayerTable players={players} selected={player} onSelect={onPlayer} />
        <PlayerDetail player={players.find((p) => p.player_id === player) ?? null} />
      </Section>
      <Section title={t('checks.title')} note={t('checks.note_match')}>
        <DataChecks checks={report.data_quality} />
      </Section>
    </main>
  );
}
