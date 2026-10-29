import { use } from 'react';
import { loadReport } from '../lib/report/load';
import type { Id } from '../lib/report/types';
import { GameView } from './GameView';
import { MatchView } from './MatchView';

type ReportViewProps = {
  reportId: string;
  rally: number | null;
  player: Id | null;
  onRally: (rally: number | null) => void;
  onPlayer: (player: Id | null) => void;
};

export function ReportView({ reportId, rally, player, onRally, onPlayer }: ReportViewProps) {
  const report = use(loadReport(reportId));
  return report.kind === 'game' ? (
    <GameView report={report} rally={rally} player={player} onRally={onRally} onPlayer={onPlayer} />
  ) : (
    <MatchView report={report} player={player} onPlayer={onPlayer} />
  );
}
