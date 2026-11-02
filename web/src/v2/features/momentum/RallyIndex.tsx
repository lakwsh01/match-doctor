import { useState } from 'react';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { Block } from '../../components/Block';
import { Scroll } from '../../components/Scroll';
import { useT } from '../../components/useT';
import { clock, orNone, player, teamTone } from '../../lib/format';
import type { Clip, ClipRef, ClipTag, ReportV2 } from '../../lib/types';
import styles from './RallyIndex.module.css';

type RallyIndexProps = {
  report: ReportV2;
  onWatch: (clip: ClipRef) => void;
};

type Filter = 'all' | 'highlight' | 'error' | 'attack' | 'erne';

const MATCHES: Record<Filter, (tags: ClipTag[]) => boolean> = {
  all: () => true,
  highlight: (tags) => tags.includes('highlight'),
  error: (tags) => tags.includes('error'),
  attack: (tags) => tags.includes('attack'),
  erne: (tags) => tags.includes('erne') || tags.includes('atp'),
};

// Every rally with its score call, server, length, and ending (MO-01), filtered by tag (MO-02 to MO-05).
export function RallyIndex({ report, onWatch }: RallyIndexProps) {
  const t = useT();
  const [filter, setFilter] = useState<Filter>('all');
  const rows = report.clips.filter((c) => MATCHES[filter](c.tags));

  const ending = (c: Clip) => {
    const who = c.ended.player_id ? player(c.ended.player_id) : '';
    const how =
      c.ended.kind === 'error' && c.ended.player_id
        ? c.ended.cause
          ? t('end.error', { player: who, type: t.term('error', c.ended.error_type ?? 'error'), cause: t.term('cause', c.ended.cause) })
          : t('end.error_plain', { player: who, type: t.term('error', c.ended.error_type ?? 'error') })
        : c.ended.kind === 'winner' && who
          ? t('end.winner', { player: who })
          : t('end.unknown');
    const result = c.scoring && c.winner_team_id ? t('end.point', { team: t('team', { id: c.winner_team_id }) }) : t('end.side_out');
    return { how, result };
  };

  return (
    <Block
      title={t('clips.title')}
      level={2}
      note={t('clips.count', { n: rows.length })}
      aside={
        <Scroll>
          <SegmentedControl
            label={t('clips.filter')}
            options={(Object.keys(MATCHES) as Filter[]).map((value) => ({ value, label: t(`filter.${value}`) }))}
            value={filter}
            onChange={(v) => setFilter(v as Filter)}
          />
        </Scroll>
      }
    >
      {rows.length ? (
        <div className={styles.scroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">{t('col.rally')}</th>
                <th scope="col">{t('col.score')}</th>
                <th scope="col">{t('col.server')}</th>
                <th scope="col" className={styles.num}>
                  {t('col.shots')}
                </th>
                <th scope="col">{t('col.result')}</th>
                <th scope="col" className={styles.num}>
                  {t('col.time')}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const end = ending(c);
                return (
                  <tr key={`${c.game}-${c.rally_number}`}>
                    <th scope="row" className={styles.rally}>
                      {report.kind === 'match' ? t('rally.ref', { game: c.game, n: c.rally_number }) : t('rally.ref_short', { n: c.rally_number })}
                    </th>
                    <td className={styles.mono}>{orNone(c.score_call)}</td>
                    <td>{orNone(c.server_id && player(c.server_id))}</td>
                    <td className={styles.num}>{c.shots}</td>
                    <td>
                      <span className={styles.end}>
                        <span className={styles.dot} style={{ background: teamTone(c.winner_team_id) }} />
                        <span>
                          {end.result}
                          <span className={styles.how}>{end.how}</span>
                        </span>
                      </span>
                    </td>
                    <td className={styles.num}>
                      <button type="button" className={styles.watch} onClick={() => onWatch(c)} aria-label={t('watch.rally', { game: c.game, n: c.rally_number })}>
                        {clock(c.start_sec)}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={styles.none}>{t('clips.empty')}</p>
      )}
    </Block>
  );
}
