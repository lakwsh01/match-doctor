import { Dot } from '../../components/Dot';
import { SplitBar } from '../../components/SplitBar';
import { useT } from '../../components/useT';
import type { TeamReport } from '../../lib/report/analysis';
import type { MessageKey } from '../../lib/i18n/messages/en-US';
import type { Params } from '../../lib/i18n/translate';
import type { Rate } from '../../lib/stats';
import { formatFixed, formatRate, teamLabel, teamTone } from '../../lib/format';
import styles from './TeamCompare.module.css';

type TeamCompareProps = {
  teams: TeamReport[];
};

type Figure = Rate | number | null | undefined;
type Measure = { label: MessageKey; params?: Params; value: (t: TeamReport) => Figure; unit?: string };

const won = (rows: { label: string; won: Rate }[], label: string) => rows.find((r) => r.label === label)?.won;
const isRate = (f: Figure): f is Rate => typeof f === 'object' && f !== null;
const oneDecimal = formatFixed(1);

const MEASURES: Measure[] = [
  { label: 'teams.rallies_won', value: (t) => t.rallies_won },
  { label: 'teams.serve_points_won', value: (t) => t.serve_points_won },
  { label: 'teams.first_server', value: (t) => won(t.serve_points_by_server, '1') },
  { label: 'teams.second_server', value: (t) => won(t.serve_points_by_server, '2') },
  { label: 'teams.deuce_side', value: (t) => won(t.serve_points_by_side, 'deuce') },
  { label: 'teams.ad_side', value: (t) => won(t.serve_points_by_side, 'ad') },
  { label: 'teams.side_outs', value: (t) => t.side_outs },
  ...['1-4', '5-8', '9-12', '13+'].map((bucket) => ({
    label: 'teams.won_by_length' as const,
    params: { bucket },
    value: (t: TeamReport) => won(t.rally_length, bucket),
  })),
  { label: 'teams.both_at_kitchen', value: (t) => t.positioning.both_at_kitchen },
  { label: 'teams.partner_spacing', value: (t) => t.positioning.partner_spacing_m.avg, unit: 'm' },
  { label: 'teams.unforced_errors', value: (t) => t.errors.unforced },
  { label: 'teams.longest_run', value: (t) => t.scoring_runs.max },
];

function side(figure: Figure, team: TeamReport, unit?: string) {
  const tone = teamTone(team.team_id);
  if (isRate(figure)) return { value: figure.pct ?? 0, text: formatRate(figure), note: `${figure.made}/${figure.of}`, tone };
  const n = figure ?? null;
  const text = n === null ? '–' : `${Number.isInteger(n) ? n : oneDecimal(n)}${unit ? ` ${unit}` : ''}`;
  return { value: n ?? 0, text, tone };
}

const hasSample = (f: Figure) => (isRate(f) ? f.of > 0 : f !== null && f !== undefined);

export function TeamCompare({ teams }: TeamCompareProps) {
  const t = useT();
  const [a, b] = teams;
  const shown = MEASURES.filter((m) => hasSample(m.value(a)) || hasSample(m.value(b)));
  return (
    <div className={styles.compare}>
      <div className={styles.head}>
        {[a, b].map((team) => (
          <span key={team.team_id} className={styles.team}>
            <Dot tone={teamTone(team.team_id)} />
            {teamLabel(t, team.team_id)}
          </span>
        ))}
      </div>
      {shown.map((m) => {
        const left = side(m.value(a), a, m.unit);
        const right = side(m.value(b), b, m.unit);
        const max = isRate(m.value(a)) || isRate(m.value(b)) ? 1 : Math.max(left.value, right.value);
        const label = t(m.label, m.params);
        return <SplitBar key={label} label={label} max={max} left={left} right={right} />;
      })}
    </div>
  );
}
