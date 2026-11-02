import { Block } from '../../components/Block';
import { useT } from '../../components/useT';
import { figure, player, teamTone } from '../../lib/format';
import type { ClipRef, Focus, Id, ReportV2 } from '../../lib/types';
import { FocusItem } from './FocusItem';
import styles from './Prescription.module.css';

type PrescriptionProps = {
  report: ReportV2;
  own: Id;
  onWatch: (clip: ClipRef) => void;
};

// What the reader's team trains before the next match (TR-01..06): up to three focus items per player, then the pair.
export function Prescription({ report, own, onWatch }: PrescriptionProps) {
  const t = useT();
  const team = report.teams.find((x) => x.team_id === own) ?? report.teams[0];
  const other = report.teams.find((x) => x.team_id !== team.team_id)?.team_id ?? null;
  const targets = new Map(report.phases.flatMap((p) => p.metrics).map((m) => [m.key, m.target]));
  const match = report.kind === 'match';
  const items = (list: Focus[], who: string) =>
    list.length ? (
      <ol className={styles.list}>
        {list.map((f) => (
          <FocusItem
            key={f.key}
            focus={f}
            who={who}
            tone={teamTone(team.team_id)}
            otherTone={teamTone(other)}
            band={targets.get(f.key) ?? null}
            match={match}
            onWatch={onWatch}
          />
        ))}
      </ol>
    ) : (
      <p className={styles.none}>{t('rx.none')}</p>
    );

  return (
    <div className={styles.page}>
      <p className={styles.lead}>{t('rx.lead')}</p>
      {report.plan.players
        .filter((p) => team.player_ids.includes(p.player_id))
        .map((p) => (
          <Block
            key={p.player_id}
            title={player(p.player_id)}
            level={2}
            aside={
              p.keep && (
                <p className={styles.keep}>
                  {t('rx.keep_line', { metric: t(`metric.${p.keep.key}`), value: figure(t, p.keep.unit, p.keep.value) })}
                </p>
              )
            }
          >
            {items(p.focus, player(p.player_id))}
          </Block>
        ))}
      <Block title={t('rx.team')} level={2} note={t('team', { id: team.team_id })}>
        {items(report.plan.teams[team.team_id] ?? [], t('team', { id: team.team_id }))}
      </Block>
    </div>
  );
}
