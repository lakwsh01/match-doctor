import { useEffect, useRef, useState } from 'react';
import { Rail } from '../../components/Rail';
import { useT } from '../../components/useT';
import type { ClipRef, Id, PhaseId, ReportV2 } from '../../lib/types';
import { PhaseBlock } from './PhaseBlock';
import { RallyShape } from './RallyShape';
import styles from './RallyPhases.module.css';

type RallyPhasesProps = {
  report: ReportV2;
  own: Id;
  onWatch: (clip: ClipRef) => void;
};

const anchor = (id: string) => `v2-phase-${id}`;
const SETTLE_MS = 150;

// The rally from first shot to last, one phase per section. The rail follows the section being read.
export function RallyPhases({ report, own, onWatch }: RallyPhasesProps) {
  const t = useT();
  const [active, setActive] = useState<PhaseId>(report.phases[0].id);
  const root = useRef<HTMLDivElement>(null);
  // True while a picked phase scrolls into view, so the ball goes straight there instead of
  // stopping at every phase the page passes on the way.
  const settling = useRef(false);

  useEffect(() => {
    const sections = root.current?.querySelectorAll<HTMLElement>('[data-phase]');
    if (!sections) return;
    const seen = new IntersectionObserver(
      (entries) => {
        if (settling.current) return;
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.getAttribute('data-phase') as PhaseId);
      },
      { rootMargin: '-20% 0px -60% 0px' },
    );
    sections.forEach((s) => seen.observe(s));
    return () => seen.disconnect();
  }, [report]);

  // Settled once the page has not scrolled for SETTLE_MS: works where `scrollend` is missing.
  const pick = (id: string) => {
    setActive(id as PhaseId);
    settling.current = true;
    let timer = window.setTimeout(done, SETTLE_MS);
    function onScroll() {
      window.clearTimeout(timer);
      timer = window.setTimeout(done, SETTLE_MS);
    }
    function done() {
      settling.current = false;
      window.removeEventListener('scroll', onScroll);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    document.getElementById(anchor(id))?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  return (
    <div className={styles.layout} ref={root}>
      <div className={styles.rail}>
        <Rail
          label={t('rail.label')}
          stops={report.phases.map((p, i) => ({ id: p.id, number: String(i + 1), label: t(`phase.${p.id}`) }))}
          active={active}
          onPick={pick}
        />
        <p className={styles.legend}>{t('legend.target')}</p>
      </div>
      <div className={styles.phases}>
        {report.phases.map((p, i) => (
          <PhaseBlock key={p.id} id={anchor(p.id)} number={i + 1} phase={p} report={report} own={own} />
        ))}
        <RallyShape report={report} own={own} onWatch={onWatch} />
      </div>
    </div>
  );
}
