import { Dot } from '../../components/Dot';
import { finalScore, rallyRows } from '../../lib/report/derive';
import type { Report } from '../../lib/report/types';
import { formatClock, formatScore, playerLabel, teamLabel, teamTone } from '../../lib/format';
import styles from './Scoreboard.module.css';

type ScoreboardProps = {
  report: Report;
};

export function Scoreboard({ report }: ScoreboardProps) {
  const score = finalScore(report);
  const rallies = rallyRows(report);
  const [winner, loser] = report.match.teams.map((t) => t.team_id).sort((a, b) => score[b] - score[a]);
  const playTime = rallies.reduce((sum, r) => sum + r.duration, 0);
  const longest = Math.max(...rallies.map((r) => r.shots));

  return (
    <div className={styles.board}>
      <div className={styles.teams}>
        {report.match.teams.map((team) => (
          <div key={team.team_id} className={styles.team} data-won={team.team_id === winner}>
            <span className={styles.score}>{score[team.team_id]}</span>
            <span className={styles.name}>
              <Dot tone={teamTone(team.team_id)} />
              {teamLabel(team.team_id)}
            </span>
            <span className={styles.meta}>
              {team.player_ids.map(playerLabel).join(' and ')}, {team.end} end
            </span>
          </div>
        ))}
      </div>
      <p className={styles.summary}>
        {teamLabel(winner)} won {formatScore(score, [winner, loser])} over {rallies.length} rallies and{' '}
        {formatClock(playTime)} of play. The longest rally ran {longest} shots.
      </p>
    </div>
  );
}
