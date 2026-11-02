import { Duel } from '../../components/Duel';
import { Flag } from '../../components/Flag';
import { Stack } from '../../components/Stack';
import { useT } from '../../components/useT';
import { pct, ramp, sides } from '../../lib/format';
import type { MessageKey } from '../../lib/i18n/messages/en-US';
import type { Translator } from '../../lib/i18n/translate';
import type { Id, Phase, ReportV2, Split } from '../../lib/types';
import styles from './PhaseBlock.module.css';

type PhaseBlockProps = {
  id: string;
  number: number;
  phase: Phase;
  report: ReportV2;
  own: Id;
};

// Neutral tones for the parts of a split, darkest first; team colors stay reserved for teams.
// Part labels are ids from the report: error types use the main error names, the rest the v2 part names.
function partLabel(t: Translator, split: Split, label: string) {
  return split.key === 'error_types' ? t.term('error', label) : t(`part.${label}` as MessageKey);
}

// One phase of the rally: both teams on each figure, then how the phase split up for each team.
export function PhaseBlock({ id, number, phase, report, own }: PhaseBlockProps) {
  const t = useT();
  const demo = <Flag label={t('source.demo')} hint={t('source.demo_hint')} />;
  const order = report.teams.map((x) => x.team_id);
  return (
    <section id={id} data-phase={phase.id} className={styles.phase} aria-labelledby={`${id}-title`}>
      <header className={styles.header}>
        <span className={styles.number} aria-hidden="true">
          {number}
        </span>
        <div>
          <h2 id={`${id}-title`} className={styles.title}>
            {t(`phase.${phase.id}`)}
          </h2>
          <p className={styles.note}>{t(`phase.${phase.id}.note`)}</p>
        </div>
      </header>
      <div>
        {phase.metrics.map((m) => (
          <Duel
            key={m.key}
            label={t(`metric.${m.key}` as const)}
            note={t(`hint.${m.key}` as const)}
            sides={sides(t, m.unit, m.teams, own)}
            band={m.target}
            flag={m.source === 'demo' ? demo : undefined}
          />
        ))}
      </div>
      {phase.splits.length > 0 && (
        <div className={styles.splits}>
          {phase.splits.map((split) => (
            <div key={split.key} className={styles.split}>
              <h3 className={styles.splitTitle}>
                {t(`split.${split.key}`)} {split.source === 'demo' && demo}
              </h3>
              {order.map((team) => (
                <Stack
                  key={team}
                  label={t('team', { id: team })}
                  parts={split.teams[team].map((p, i) => ({
                    key: p.label,
                    label: partLabel(t, split, p.label),
                    share: p.value,
                    text: pct(t, p.value),
                    tone: ramp(i),
                  }))}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
