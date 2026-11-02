import { Block } from '../../components/Block';
import { Flag } from '../../components/Flag';
import { Stack } from '../../components/Stack';
import { ZoneGrid } from '../../components/ZoneGrid';
import { useT } from '../../components/useT';
import { figure, pct, ramp, teamTone } from '../../lib/format';
import type { PlayerV2 } from '../../lib/types';
import styles from './UnderAttack.module.css';

type UnderAttackProps = {
  person: PlayerV2;
  other: string;
};

// How the other team attacked this player (IA-01..05). Every figure here is a demo value.
export function UnderAttack({ person, other }: UnderAttackProps) {
  const t = useT();
  const ua = person.under_attack;
  const holes = [...ua.holes].sort((a, b) => b.value - a.value);
  const top = Math.max(...holes.map((h) => h.value), 1);

  return (
    <Block title={t('ua.title')} level={2} aside={<Flag label={t('source.demo')} hint={t('source.demo_hint')} />}>
      <div className={styles.grid}>
        <ZoneGrid label={t('ua.from')} cells={ua.from} texts={ua.from.map((c) => pct(t, c))} net={t('court.net')} baseline={t('court.baseline')} tone={teamTone(other)} />
        <div className={styles.side}>
          <Stack
            label={t('ua.targets')}
            parts={ua.targets.map((x, i) => ({ key: x.label, label: t(`target.${x.label}` as 'target.middle'), share: x.value, text: pct(t, x.value), tone: ramp(i) }))}
          />
          <p className={styles.stance}>
            {t('ua.stance', { behind: figure(t, 'm', ua.behind_line_m), off: figure(t, 'm', ua.off_ideal_m), over: pct(t, ua.over_1m) })}
          </p>
          <figure className={styles.holes}>
            <figcaption className={styles.subtitle}>{t('ua.holes')}</figcaption>
            <ul className={styles.list}>
              {holes.map((h) => (
                <li key={h.label} className={styles.hole}>
                  <span>{t(`hole.${h.label}` as 'hole.middle_gap')}</span>
                  <span className={styles.track} aria-hidden="true">
                    <span className={styles.bar} style={{ width: `${(h.value / top) * 100}%`, background: teamTone(other) }} />
                  </span>
                  <span className={styles.count}>{t.number(h.value)}</span>
                </li>
              ))}
            </ul>
          </figure>
        </div>
      </div>
    </Block>
  );
}
