import type { GameReport, TeamReport } from '../../lib/report/analysis.ts';
import type { PlayerReport } from '../../lib/report/player.ts';
import type { Id } from '../../lib/report/types';
import { gameRallies, teamOf } from './rallies.ts';
import type { Court, GameRally } from './rallies.ts';

// Everything one v2 report is built from: a game, or every game of a match with their merged totals.
export type Context = {
  id: string;
  games: GameReport[];
  teams: TeamReport[];
  players: PlayerReport[];
  rallies: GameRally[];
  court: Court;
  teamIds: Id[];
  teamOf: (player: Id | null) => Id | null;
  other: (team: Id) => Id;
};

export function context(id: string, games: GameReport[], teams: TeamReport[], players: PlayerReport[]): Context {
  const teamIds = teams.map((t) => t.team_id);
  return {
    id,
    games,
    teams,
    players,
    rallies: gameRallies(games),
    court: games[0].court,
    teamIds,
    teamOf: teamOf(games),
    other: (team) => teamIds.find((t) => t !== team) ?? team,
  };
}
