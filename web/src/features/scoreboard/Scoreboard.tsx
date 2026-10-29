import { Dot } from '../../components/Dot';
import { useT } from '../../components/useT';
import type { TeamReport } from '../../lib/report/analysis';
import type { Score } from '../../lib/report/derive';
import type { Id } from '../../lib/report/types';
import { playerLabel, teamLabel, teamTone } from '../../lib/format';
import styles from './Scoreboard.module.css';

type ScoreboardProps = {
  teams: Pick<TeamReport, 'team_id' | 'end' | 'player_ids'>[];
  score: Score;
  winner: Id;
  summary: string;
};

export function Scoreboard({ teams, score, winner, summary }: ScoreboardProps) {
  const t = useT();
  return (
    <div className={styles.board}>
      <div className={styles.teams}>
        {teams.map((team) => (
          <div key={team.team_id} className={styles.team} data-won={team.team_id === winner}>
            <span className={styles.score}>{score[team.team_id]}</span>
            <span className={styles.name}>
              <Dot tone={teamTone(team.team_id)} />
              {teamLabel(t, team.team_id)}
            </span>
            <span className={styles.meta}>
              {t('scoreboard.meta', { players: t.list(team.player_ids.map(playerLabel)), end: t.term('end', team.end) })}
            </span>
          </div>
        ))}
      </div>
      <p className={styles.summary}>{summary}</p>
    </div>
  );
}
