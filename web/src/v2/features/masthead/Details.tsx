import { Flag } from '../../components/Flag';
import { useT } from '../../components/useT';
import { clock, pct, player } from '../../lib/format';
import type { ReportV2 } from '../../lib/types';
import styles from './Details.module.css';

type DetailsProps = {
  report: ReportV2;
};

// Format, date, court, time on court, rallies, and players (MI-01, -02, -03, -05, -06).
export function Details({ report }: DetailsProps) {
  const t = useT();
  const { info } = report;
  const [a, b] = report.teams.map((x) => x.team_id);
  const demo = <Flag label={t('source.demo')} hint={t('source.demo_hint')} />;
  const rows: [string, string, boolean][] = [
    [t('meta.format'), t('meta.format_value', { to: info.format.to }), false],
    [t('meta.date'), new Intl.DateTimeFormat(t.locale, { dateStyle: 'long' }).format(new Date(`${info.event.date}T12:00:00`)), true],
    [t('meta.venue'), info.event.venue, true],
    [t('meta.time'), t('meta.time_value', { total: clock(info.duration_sec), live: pct(t, info.play_sec / info.duration_sec) }), false],
    [
      t('meta.rallies'),
      t('meta.rallies_value', { n: info.rallies, a: info.served[a], teamA: t('team', { id: a }), b: info.served[b], teamB: t('team', { id: b }) }),
      false,
    ],
  ];

  return (
    <dl className={styles.details} aria-label={t('meta.label')}>
      {rows.map(([label, value, isDemo]) => (
        <div key={label} className={styles.row}>
          <dt className={styles.term}>{label}</dt>
          <dd className={styles.value}>
            {value} {isDemo && demo}
          </dd>
        </div>
      ))}
      <div className={styles.row}>
        <dt className={styles.term}>{t('meta.players')}</dt>
        <dd className={styles.value}>
          {report.teams.map((team) => (
            <span key={team.team_id} className={styles.team}>
              {team.player_ids.map((id) => {
                const hand = report.players.find((p) => p.player_id === id)?.hand ?? 'right';
                return (
                  <span key={id} className={styles.player}>
                    {t('roster.player', { player: player(id), hand: t(`hand.${hand}`) })}
                  </span>
                );
              })}
            </span>
          ))}{' '}
          {demo}
        </dd>
      </div>
    </dl>
  );
}
