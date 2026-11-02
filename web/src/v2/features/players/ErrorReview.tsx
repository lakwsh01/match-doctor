import { Block } from '../../components/Block';
import { Flag } from '../../components/Flag';
import { useT } from '../../components/useT';
import { figure, orNone, player, rallyRef, sample } from '../../lib/format';
import type { ClipRef, PlayerV2 } from '../../lib/types';
import styles from './ErrorReview.module.css';

type ErrorReviewProps = {
  person: PlayerV2;
  match: boolean;
  onWatch: (clip: ClipRef) => void;
};

// Each error with the ball before it (IA-06..12), the repeats among them (IA-13), and the error rate by contact height (IA-14).
export function ErrorReview({ person, match, onWatch }: ErrorReviewProps) {
  const t = useT();
  const demo = <Flag label={t('source.demo')} hint={t('source.demo_hint')} />;
  const chain = person.error_chain;

  return (
    <Block title={t('ef.title')} level={2} note={t('ef.note')}>
      <div className={styles.summary}>
        <section className={styles.part}>
          <h3 className={styles.subtitle}>{t('ef.patterns')}</h3>
          {person.patterns.length ? (
            <ul className={styles.patterns}>
              {person.patterns.map((p) => (
                <li key={`${p.gesture}-${p.height}`}>
                  {t('ef.pattern', { count: p.count, of: p.of, shot: t(`mix.${p.gesture}` as 'mix.dink'), height: t(`height.${p.height}`) })}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.none}>{t('ef.no_patterns')}</p>
          )}
        </section>
        {person.conditional.length > 0 && (
          <table className={styles.table}>
            <caption className={styles.subtitle}>{t('ef.by_height')}</caption>
            <thead>
              <tr>
                <th scope="col">{t('ef.col.shot')}</th>
                <th scope="col">{t('ef.below')}</th>
                <th scope="col">{t('ef.above')}</th>
              </tr>
            </thead>
            <tbody>
              {person.conditional.map((c) => (
                <tr key={c.gesture}>
                  <th scope="row">{t(`mix.${c.gesture}` as 'mix.dink')}</th>
                  {[c.below, c.above].map((f, i) => (
                    <td key={i} className={styles.num}>
                      {figure(t, 'pct', f)}
                      <span className={styles.detail}>{sample(t, f)}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {chain.length ? (
        <div className={styles.scroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">{t('ef.col.rally')}</th>
                <th scope="col">{t('ef.col.shot')}</th>
                <th scope="col">{t('ef.col.incoming')}</th>
                <th scope="col">{t('ef.col.height')}</th>
                <th scope="col">{t('ef.col.zone')}</th>
                <th scope="col">{t('ef.col.source')}</th>
                <th scope="col">
                  <span className={styles.head}>
                    {t('ef.col.spin')}
                    {demo}
                  </span>
                </th>
                <th scope="col">
                  <span className={styles.head}>
                    {t('ef.col.cause')}
                    {demo}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {chain.map((e) => (
                <tr key={`${e.game}-${e.rally_number}-${e.gesture}`}>
                  <td>
                    <button type="button" className={styles.watch} onClick={() => onWatch(e)} aria-label={t('watch.rally', { game: e.game, n: e.rally_number })}>
                      {rallyRef(t, e, match)}
                    </button>
                  </td>
                  <td>
                    {t.term('gesture', e.gesture)}
                    {e.error_type && <span className={styles.detail}>{t.term('error', e.error_type)}</span>}
                  </td>
                  <td className={styles.num}>
                    {orNone(e.incoming && t(`incoming.${e.incoming}`))}
                    {e.incoming_kmh !== null && <span className={styles.detail}>{figure(t, 'kmh', e.incoming_kmh)}</span>}
                  </td>
                  <td>{orNone(e.height && t(`contact.${e.height}`))}</td>
                  <td>{t(`zone.${e.zone}`)}</td>
                  <td>{orNone(e.from_player && e.from_dir && t(`dir.${e.from_dir}`, { player: player(e.from_player) }))}</td>
                  <td>{t(`spin.${e.spin}`)}</td>
                  <td>{t(`cause_tag.${e.cause}`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={styles.none}>{t('ef.none')}</p>
      )}
    </Block>
  );
}
