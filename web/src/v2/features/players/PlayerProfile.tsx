import type { ReactNode } from 'react';
import { Block } from '../../components/Block';
import { Flag } from '../../components/Flag';
import { Radar } from '../../components/Radar';
import { Stack } from '../../components/Stack';
import { ZoneGrid } from '../../components/ZoneGrid';
import { useT } from '../../components/useT';
import { figure, pct, player, ramp, sample, teamTone } from '../../lib/format';
import type { PlayerV2 } from '../../lib/types';
import styles from './PlayerProfile.module.css';

type PlayerProfileProps = {
  person: PlayerV2;
};

// A player's skill shape (ST-36), shot mix (ST-31), where they hit from and to (ST-34, ST-35), speeds (ST-28), and errors.
export function PlayerProfile({ person }: PlayerProfileProps) {
  const t = useT();
  const tone = teamTone(person.team_id);
  const demo = <Flag label={t('source.demo')} hint={t('source.demo_hint')} />;
  const shares = (cells: number[]) => cells.map((c) => pct(t, c));
  const facts: { key: string; label: string; value: string; detail?: string | null; flag?: ReactNode }[] = [
    {
      key: 'errors',
      label: t('pl.errors'),
      value: t('pl.errors_value', { unforced: person.errors.unforced, forced: person.errors.forced, per100: t.number(person.errors.per100 ?? 0, 1) }),
    },
    { key: 'speedups', label: t('pl.speedups'), value: t('pl.speedups_value', { n: person.speedups.count, rate: t.number(person.speedups.per10dinks ?? 0, 1) }) },
    { key: 'targeted', label: t('pl.targeted'), value: t('pl.targeted_value', { pct: pct(t, person.targeted.value) }), detail: sample(t, person.targeted) },
    { key: 'poach', label: t('tp.poach'), value: figure(t, 'pct', person.poach), detail: sample(t, person.poach), flag: demo },
    { key: 'hand', label: t('pl.hand_label'), value: t(`hand.${person.hand}`), flag: demo },
  ];

  return (
    <Block title={player(person.player_id)} level={2} note={t('team', { id: person.team_id })}>
      <div className={styles.top}>
        <figure className={styles.radar}>
          <figcaption className={styles.caption}>
            <span className={styles.subtitle}>{t('pl.radar')}</span>
            <span className={styles.note}>{t('pl.radar_note')}</span>
          </figcaption>
          <Radar
            label={t('pl.radar')}
            tone={tone}
            axes={person.radar.map((a) => ({ key: a.axis, label: t(`axis.${a.axis}`), value: a.value, text: t.number(a.value), dashed: a.source === 'demo' }))}
          />
        </figure>
        <div className={styles.side}>
          <Stack
            label={t('pl.mix')}
            caption={t('pl.mix_note', { n: person.shots })}
            parts={person.mix.map((m, i) => ({ key: m.label, label: t(`mix.${m.label}` as 'mix.dink'), share: m.value, text: pct(t, m.value), tone: ramp(i) }))}
          />
          <dl className={styles.facts}>
            {facts.map((f) => (
              <div key={f.key} className={styles.fact}>
                <dt className={styles.label}>{f.label}</dt>
                <dd className={styles.value}>
                  {f.value}
                  {f.detail && <span className={styles.detail}>{f.detail}</span>}
                  {f.flag}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <div className={styles.bottom}>
        <ZoneGrid label={t('pl.touch')} cells={person.touch} texts={shares(person.touch)} net={t('court.net')} baseline={t('court.baseline')} tone={tone} />
        <ZoneGrid label={t('pl.landing')} cells={person.landing} texts={shares(person.landing)} net={t('court.net')} baseline={t('court.baseline')} tone={tone} />
        <table className={styles.speed}>
          <caption className={styles.subtitle}>{t('pl.speed')}</caption>
          <thead>
            <tr>
              <td />
              <th scope="col">{t('speed.avg')}</th>
              <th scope="col">{t('speed.max')}</th>
            </tr>
          </thead>
          <tbody>
            {person.speed.map((s) => (
              <tr key={s.key}>
                <th scope="row">{t(`speed.${s.key}`)}</th>
                <td>{figure(t, 'kmh', s.avg)}</td>
                <td>{figure(t, 'kmh', s.max)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Block>
  );
}
