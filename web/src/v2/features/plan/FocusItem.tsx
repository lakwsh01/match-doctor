import { Duel } from '../../components/Duel';
import { Flag } from '../../components/Flag';
import { useT } from '../../components/useT';
import { figure, position, rallyRef } from '../../lib/format';
import type { ClipRef, Focus } from '../../lib/types';
import styles from './FocusItem.module.css';

type FocusItemProps = {
  focus: Focus;
  who: string;
  tone: string;
  otherTone: string;
  band: [number, number] | null;
  match: boolean;
  onWatch: (clip: ClipRef) => void;
};

// One thing to train (TR-01..04): where it stands against the other team, the target, the drill, and the rallies that show it.
export function FocusItem({ focus, who, tone, otherTone, band, match, onWatch }: FocusItemProps) {
  const t = useT();
  const [now, them] = position(focus.unit, [focus.now, focus.them]);
  const drill = focus.drill;

  return (
    <li className={styles.item}>
      <Duel
        label={t(`metric.${focus.key}`)}
        note={t('rx.goal', { now: figure(t, focus.unit, focus.now), target: figure(t, focus.unit, focus.target) })}
        band={band}
        flag={focus.source === 'demo' ? <Flag label={t('source.demo')} hint={t('source.demo_hint')} /> : undefined}
        sides={[
          { key: 'now', name: who, tone, at: now, text: figure(t, focus.unit, focus.now), detail: who, own: true },
          { key: 'them', name: t('rx.them'), tone: otherTone, at: them, text: figure(t, focus.unit, focus.them), detail: t('rx.them'), own: false },
        ]}
      />
      <div className={styles.drill}>
        <h3 className={styles.name}>{t(`drill.${drill}.name`)}</h3>
        <p className={styles.how}>{t(`drill.${drill}.how`)}</p>
        <p className={styles.next}>{t('rx.next', { step: t(`drill.${drill}.next`) })}</p>
        <p className={styles.verify}>{t('rx.verify', { metric: t(`metric.${focus.key}`), n: focus.min_attempts })}</p>
        {focus.rallies.length > 0 && (
          <div className={styles.evidence}>
            <span className={styles.label}>{t('rx.evidence')}</span>
            {focus.rallies.map((r) => (
              <button key={`${r.game}-${r.rally_number}`} type="button" className={styles.watch} onClick={() => onWatch(r)}>
                {rallyRef(t, r, match)}
              </button>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}
