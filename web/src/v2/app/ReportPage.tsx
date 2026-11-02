import { startTransition, use, useEffect, useRef, useState } from 'react';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Scroll } from '../components/Scroll';
import { Tabs } from '../components/Tabs';
import { useT } from '../components/useT';
import { Diagnosis } from '../features/diagnosis/Diagnosis';
import { Masthead } from '../features/masthead/Masthead';
import { Momentum } from '../features/momentum/Momentum';
import { Prescription } from '../features/plan/Prescription';
import { Players } from '../features/players/Players';
import { RallyPhases } from '../features/rally/RallyPhases';
import { reportLabel } from '../lib/format';
import { loadReport, reportIds } from '../lib/load';
import { TABS } from '../lib/route';
import type { Route, Tab } from '../lib/route';
import type { ClipRef, Id } from '../lib/types';
import { ClipDock } from './ClipDock';
import styles from './ReportPage.module.css';

type ReportPageProps = {
  id: string;
  route: Route;
  own: Id | null;
  onOwn: (team: Id) => void;
  onRoute: (route: Route, replace: boolean) => void;
  onReport: (id: string) => void;
};

const PANEL = 'v2-panel';

// One v2 report: the masthead, the sticky bar of tabs and games, and the video dock for whichever rally is playing.
export function ReportPage({ id, route, own, onOwn, onRoute, onReport }: ReportPageProps) {
  const t = useT();
  const report = use(loadReport(id));
  const [clip, setClip] = useState<ClipRef | null>(null);
  // Whether the view on screen came from a click (it fades in) or a key (it appears at once).
  const [fade, setFade] = useState(false);
  const top = useRef<HTMLDivElement>(null);
  const team = own && report.teams.some((x) => x.team_id === own) ? own : report.teams[0].team_id;
  const playing = clip && report.clips.find((c) => c.game === clip.game && c.rally_number === clip.rally_number);
  const label = reportLabel(t, id);

  // A new tab starts at its top, not wherever the last one was scrolled to.
  const open = (tab: Tab, subject: string | null = null, replace = false) => {
    onRoute({ report: id, tab, subject }, replace);
    const y = (top.current?.getBoundingClientRect().top ?? 0) + window.scrollY;
    if (window.scrollY > y) window.scrollTo({ top: y });
  };
  const showTab = (tab: Tab, keyboard: boolean) => {
    if (tab === route.tab) return;
    setFade(!keyboard);
    open(tab, null, keyboard);
  };
  // In one transition with the report switch, so the fade lands on the new report, not the old one.
  const showReport = (next: string) => {
    if (next === id) return;
    startTransition(() => {
      setFade(true);
      onReport(next);
    });
  };
  const watch = { onWatch: setClip };

  useEffect(() => {
    document.title = t('doc.title', { tab: t(`tab.${route.tab}`), report: label });
  }, [t, route.tab, label]);

  return (
    <>
      <Masthead report={report} own={team} compact={route.tab !== 'diagnosis'} onOwn={onOwn} />
      <div ref={top} />
      <div className={styles.bar}>
        <Tabs
          label={t('tab.label')}
          options={TABS.map((x) => ({ value: x, label: t(`tab.${x}`) }))}
          value={route.tab}
          panel={PANEL}
          onChange={showTab}
        />
        <Scroll>
          <SegmentedControl label={t('nav.label')} options={reportIds.map((x) => ({ value: x, label: reportLabel(t, x) }))} value={id} onChange={showReport} />
        </Scroll>
      </div>
      <div className={styles.body} data-docked={Boolean(playing)}>
        <div key={`${id}-${route.tab}`} id={PANEL} role="tabpanel" aria-label={t(`tab.${route.tab}`)} className={styles.panel} data-enter={fade || undefined}>
          {route.tab === 'diagnosis' && <Diagnosis report={report} own={team} {...watch} onPlan={() => showTab('plan', false)} />}
          {route.tab === 'rally' && <RallyPhases report={report} own={team} {...watch} />}
          {route.tab === 'momentum' && <Momentum report={report} own={team} {...watch} />}
          {route.tab === 'players' && <Players report={report} own={team} subject={route.subject} onSubject={(s) => open('players', s)} {...watch} />}
          {route.tab === 'plan' && <Prescription report={report} own={team} {...watch} />}
        </div>
        {playing && <ClipDock clip={playing} match={report.kind === 'match'} onClose={() => setClip(null)} />}
      </div>
    </>
  );
}
