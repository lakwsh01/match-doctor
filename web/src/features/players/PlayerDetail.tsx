import { BarList } from '../../components/BarList';
import { useT } from '../../components/useT';
import type { MessageKey } from '../../lib/i18n/messages/en-US';
import type { TermGroup, Translator } from '../../lib/i18n/translate';
import type { PlayerReport } from '../../lib/report/player';
import type { Rate, Tally } from '../../lib/stats';
import { formatRate, playerLabel, teamTone } from '../../lib/format';
import styles from './PlayerDetail.module.css';

type PlayerDetailProps = {
  player: PlayerReport | null;
};

const named = (t: Translator, group: TermGroup, list: Tally) => list.map((row) => ({ ...row, label: t.term(group, row.label) }));

// Rates with a sample, shown as a share of a full bar.
function rates(t: Translator, rows: [MessageKey, Rate][]) {
  return rows
    .filter(([, r]) => r.of > 0)
    .map(([label, r]) => ({ label: t(label), value: r.pct ?? 0, text: t('players.rate', { pct: formatRate(r), of: r.of }) }));
}

export function PlayerDetail({ player }: PlayerDetailProps) {
  const t = useT();
  if (player === null) return <p className={styles.prompt}>{t('players.prompt')}</p>;

  const tone = teamTone(player.team_id);
  const p = player;

  return (
    <div className={styles.grid}>
      <BarList
        title={t('players.serve_title', { player: playerLabel(p.player_id) })}
        tone={tone}
        max={1}
        empty={t('players.serve_empty')}
        items={rates(t, [
          ['players.serves_in', p.serve.in],
          ['players.deep_serves', p.serve.deep],
          ['players.returns_in', p.return.in],
          ['players.deep_returns', p.return.deep],
          ['players.third_shot', p.third_shot.drop_in_kitchen],
          ['players.dinks', p.dinks.in_kitchen],
        ])}
      />
      <BarList
        title={t('players.position_title')}
        tone={tone}
        max={1}
        empty={t('players.position_empty')}
        items={rates(t, [
          ['players.kitchen_time', p.positioning.kitchen_time],
          ['players.kitchen_arrival', p.positioning.kitchen_arrival],
          ['players.above_net', p.contact.above_net],
          ['players.targeted', p.targeted],
        ])}
      />
      <BarList title={t('players.shots_title')} items={named(t, 'gesture', p.shots.by_gesture)} tone={tone} empty={t('players.shots_empty')} />
      <BarList title={t('players.errors_title')} items={named(t, 'error', p.errors.by_type)} tone="var(--ink)" empty={t('players.errors_empty')} />
    </div>
  );
}
