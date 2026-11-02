import type { ReactNode } from 'react';
import { Block } from '../../components/Block';
import { Flag } from '../../components/Flag';
import { Stack } from '../../components/Stack';
import { useT } from '../../components/useT';
import { figure, orNone, pct, player, ramp, sample } from '../../lib/format';
import type { Id, ReportV2, Takeaway } from '../../lib/types';
import styles from './Pair.module.css';

type PairProps = {
  report: ReportV2;
  team: Id;
};

const MIDDLE = ['forehand', 'other', 'both', 'neither'] as const;

// The two partners as one unit (TD-01..10): how they cover the middle, move together, and where the other team aimed.
export function Pair({ report, team }: PairProps) {
  const t = useT();
  const pair = report.partnership.find((p) => p.team_id === team);
  const summary = report.summary[team];
  if (!pair || !summary) return null;
  const demo = <Flag label={t('source.demo')} hint={t('source.demo_hint')} />;
  const metric = (key: Takeaway['key'] | null) => orNone(key && t(`metric.${key}`));
  const mates = report.players.filter((p) => p.team_id === team);
  const rows: { key: string; label: string; value: string; detail?: string | null; flag?: ReactNode }[] = [
    { key: 'middle_lost', label: t('tp.middle_lost'), value: figure(t, 'pct', pair.middle_lost), detail: sample(t, pair.middle_lost), flag: demo },
    { key: 'together', label: t('tp.together'), value: figure(t, 'pct', pair.together), detail: t('tp.together_note', { n: pair.split_count }), flag: demo },
    {
      key: 'spacing',
      label: t('tp.spacing'),
      value: t('tp.spacing_value', { m: figure(t, 'm', pair.spacing_m), gap: pct(t, pair.gap), crowd: pct(t, pair.crowd) }),
      flag: demo,
    },
    {
      key: 'stacking',
      label: t('tp.stacking'),
      value: t('tp.stacking_value', { share: pct(t, pair.stacking.share), won: figure(t, 'pct', pair.stacking.won), not: figure(t, 'pct', pair.stacking.not) }),
      detail: t('tp.switch', { n: pair.stacking.switch_errors }),
      flag: demo,
    },
  ];
  const list = (title: string, items: Takeaway[], message: 'dx.gain' | 'dx.loss') => (
    <section className={styles.part}>
      <h3 className={styles.subtitle}>{title}</h3>
      {items.length ? (
        <ol className={styles.ranked}>
          {items.map((item) => (
            <li key={item.key} className={styles.rank}>
              <span>{t(`metric.${item.key}`)}</span>
              <span className={styles.detail}>{t(message, { n: t.number(Math.abs(item.impact)) })}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className={styles.detail}>{t('dx.none')}</p>
      )}
    </section>
  );

  return (
    <Block title={t('tp.title')} level={2} note={t('team', { id: team })}>
      <p className={styles.lead}>
        {t('tp.summary', { strength: metric(pair.summary.strength), leak: metric(pair.summary.leak), player: orNone(pair.summary.target_player && player(pair.summary.target_player)) })}
      </p>
      <div className={styles.grid}>
        <div className={styles.part}>
          <Stack
            label={t('tp.targeted')}
            parts={mates.map((p, i) => ({ key: p.player_id, label: player(p.player_id), share: p.targeted.value ?? 0, text: pct(t, p.targeted.value), tone: ramp(i * 2) }))}
          />
          <div className={styles.flagged}>
            <Stack
              label={t('tp.middle')}
              parts={MIDDLE.map((k, i) => ({ key: k, label: t(`middle.${k}`), share: pair.middle[k], text: t.number(pair.middle[k]), tone: ramp(i) }))}
            />
            {demo}
          </div>
        </div>
        <dl className={styles.rows}>
          {rows.map((r) => (
            <div key={r.key} className={styles.row}>
              <dt className={styles.label}>{r.label}</dt>
              <dd className={styles.value}>
                <span>{r.value}</span>
                {r.detail && <span className={styles.detail}>{r.detail}</span>}
                {r.flag}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <div className={styles.grid}>
        {list(t('tp.strengths'), summary.strengths, 'dx.gain')}
        {list(t('tp.leaks'), summary.leaks, 'dx.loss')}
      </div>
    </Block>
  );
}
