// Module statistiques : calculs descriptifs uniquement, à partir des données disponibles.
import type { HeadToHead, PastGame, TeamHistory } from "./types";

export interface TeamStats {
  played: number;
  scored: number;
  conceded: number;
  avgScored: number;
  avgConceded: number;
  home: { played: number; avgScored: number; avgConceded: number };
  away: { played: number; avgScored: number; avgConceded: number };
  over15: number; // fréquence 0..1
  over25: number;
  btts: number;
  form: ("V" | "N" | "D")[];
}

const avg = (n: number, d: number) => (d === 0 ? 0 : n / d);

function split(games: PastGame[]) {
  return {
    played: games.length,
    avgScored: avg(games.reduce((s, g) => s + g.gf, 0), games.length),
    avgConceded: avg(games.reduce((s, g) => s + g.ga, 0), games.length),
  };
}

export function computeTeamStats(history: TeamHistory | undefined, last = 10): TeamStats | null {
  if (!history || history.games.length === 0) return null;
  const games = history.games.slice(0, last);
  const scored = games.reduce((s, g) => s + g.gf, 0);
  const conceded = games.reduce((s, g) => s + g.ga, 0);
  return {
    played: games.length,
    scored,
    conceded,
    avgScored: avg(scored, games.length),
    avgConceded: avg(conceded, games.length),
    home: split(games.filter((g) => g.venue === "D")),
    away: split(games.filter((g) => g.venue === "E")),
    over15: avg(games.filter((g) => g.gf + g.ga > 1.5).length, games.length),
    over25: avg(games.filter((g) => g.gf + g.ga > 2.5).length, games.length),
    btts: avg(games.filter((g) => g.gf > 0 && g.ga > 0).length, games.length),
    form: games.map((g) => (g.gf > g.ga ? "V" : g.gf === g.ga ? "N" : "D")),
  };
}

export function headToHead(all: HeadToHead[], a: string, b: string) {
  return all.filter((h) => (h.home === a && h.away === b) || (h.home === b && h.away === a));
}

/** Moteur probabiliste : non opérationnel. Retourne null tant qu'aucun modèle validé n'existe. */
export function computeProbabilities(): null {
  return null;
}

export const pct = (v: number) => `${Math.round(v * 100)} %`;
export const dec = (v: number) => v.toFixed(2).replace(".", ",");
