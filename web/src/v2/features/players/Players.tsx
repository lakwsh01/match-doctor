import { useState } from 'react';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { Scroll } from '../../components/Scroll';
import { useT } from '../../components/useT';
import { player } from '../../lib/format';
import type { ClipRef, Id, ReportV2 } from '../../lib/types';
import { ErrorReview } from './ErrorReview';
import { Pair } from './Pair';
import { PlayerProfile } from './PlayerProfile';
import { UnderAttack } from './UnderAttack';
import styles from './Players.module.css';

type PlayersProps = {
  report: ReportV2;
  own: Id;
  subject: string | null;
  onSubject: (subject: string) => void;
  onWatch: (clip: ClipRef) => void;
};

const PAIR = 'pair-';

// One player at a time, or a team as a pair. Subjects: a player id, or "pair-<team id>".
export function Players({ report, own, subject, onSubject, onWatch }: PlayersProps) {
  const t = useT();
  // The first subject is part of the tab and arrives with it; each one picked after that fades in.
  const [picked, setPicked] = useState(false);
  const ownTeam = report.teams.find((x) => x.team_id === own) ?? report.teams[0];
  const options = report.teams.flatMap((team) => [
    ...team.player_ids.map((id) => ({ value: id, label: player(id) })),
    { value: `${PAIR}${team.team_id}`, label: t('pl.pair', { id: team.team_id }) },
  ]);
  const current = options.find((o) => o.value === subject)?.value ?? ownTeam.player_ids[0];
  const pairTeam = current.startsWith(PAIR) ? current.slice(PAIR.length) : null;
  const person = report.players.find((p) => p.player_id === current);

  return (
    <div className={styles.page}>
      <Scroll>
        <SegmentedControl
          label={t('pl.pick')}
          options={options}
          value={current}
          onChange={(next) => {
            setPicked(true);
            onSubject(next);
          }}
        />
      </Scroll>
      <div key={current} className={styles.subject} data-enter={picked || undefined}>
        {pairTeam && <Pair report={report} team={pairTeam} />}
        {person && (
          <>
            <PlayerProfile person={person} />
            <ErrorReview person={person} match={report.kind === 'match'} onWatch={onWatch} />
            <UnderAttack person={person} other={report.teams.find((x) => x.team_id !== person.team_id)?.team_id ?? person.team_id} />
          </>
        )}
      </div>
    </div>
  );
}
