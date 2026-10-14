// Module statistiques : fonctions pures et déterministes. Aucun texte explicatif ici (voir stats-text.ts).
import type { HeadToHead, PastGame, TeamHistory } from "./types";

export const MIN_GAMES = 5; // échantillon minimal par équipe pour le modèle de Poisson
export const MIN_VENUE_GAMES = 3; // minimum pour utiliser la séparation domicile/extérieur
export const MAX_GOALS = 10;
export const MODEL_VERSION = "poisson-indep-v1";

export interface VenueSplit { played: number; avgScored: number; avgConceded: number }

export interface TeamStats {
  played: number;
  scored: number;
  conceded: number;
  avgScored: number;
  avgConceded: number;
  home: VenueSplit;
  away: VenueSplit;
  over15: number; // fréquence 0..1
  over25: number;
  btts: number;
  cleanSheet: number;
  failedToScore: number;
  form: ("V" | "N" | "D")[];
  games: PastGame[]; // matchs réellement utilisés (traçabilité)
}

const avg = (n: number, d: number) => (d === 0 ? 0 : n / d);
const sum = (g: PastGame[], f: (x: PastGame) => number) => g.reduce((s, x) => s + f(x), 0);
const freq = (g: PastGame[], p: (x: PastGame) => boolean) => avg(g.filter(p).length, g.length);

function split(games: PastGame[]): VenueSplit {
  return { played: games.length, avgScored: avg(sum(games, (g) => g.gf), games.length), avgConceded: avg(sum(games, (g) => g.ga), games.length) };
}

/** Garde uniquement les matchs joués strictement avant la date limite (anti-fuite), du plus récent au plus ancien. */
export function gamesBefore(games: PastGame[], before?: string): PastGame[] {
  const cutoff = before ? before.slice(0, 10) : undefined;
  return games
    .filter((g) => !cutoff || g.date.slice(0, 10) < cutoff)
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function computeTeamStats(history: TeamHistory | undefined, opts: { before?: string; last?: number } = {}): TeamStats | null {
  if (!history) return null;
  const games = gamesBefore(history.games, opts.before).slice(0, opts.last ?? 10);
  if (games.length === 0) return null;
  const scored = sum(games, (g) => g.gf);
  const conceded = sum(games, (g) => g.ga);
  return {
    played: games.length,
    scored,
    conceded,
    avgScored: avg(scored, games.length),
    avgConceded: avg(conceded, games.length),
    home: split(games.filter((g) => g.venue === "D")),
    away: split(games.filter((g) => g.venue === "E")),
    over15: freq(games, (g) => g.gf + g.ga >= 2),
    over25: freq(games, (g) => g.gf + g.ga >= 3),
    btts: freq(games, (g) => g.gf > 0 && g.ga > 0),
    cleanSheet: freq(games, (g) => g.ga === 0),
    failedToScore: freq(games, (g) => g.gf === 0),
    form: games.map((g) => (g.gf > g.ga ? "V" : g.gf === g.ga ? "N" : "D")),
    games,
  };
}

export function headToHead(all: HeadToHead[], a: string, b: string, before?: string) {
  const cutoff = before?.slice(0, 10);
  return all.filter((h) => ((h.home === a && h.away === b) || (h.home === b && h.away === a)) && (!cutoff || h.date.slice(0, 10) < cutoff));
}

// ---------- Modèle de Poisson ----------

export function poissonPmf(k: number, lambda: number): number {
  if (!Number.isInteger(k) || k < 0 || !(lambda >= 0) || !Number.isFinite(lambda)) return NaN;
  if (lambda === 0) return k === 0 ? 1 : 0;
  let logFact = 0;
  for (let i = 2; i <= k; i++) logFact += Math.log(i);
  return Math.exp(k * Math.log(lambda) - lambda - logFact);
}

export function goalDistribution(lambda: number, max = MAX_GOALS): number[] {
  return Array.from({ length: max + 1 }, (_, k) => poissonPmf(k, lambda));
}

export type InsufficientReason = "historique-domicile-insuffisant" | "historique-exterieur-insuffisant" | "lambda-nul";

export interface ModelTrace {
  model: string;
  cutoff: string;
  homeSample: { played: number; venueGames: number; usedVenueSplit: boolean; dates: string[] };
  awaySample: { played: number; venueGames: number; usedVenueSplit: boolean; dates: string[] };
  inputs: { homeAttack: number; awayDefence: number; awayAttack: number; homeDefence: number };
  coverage: number; // masse de probabilité couverte par la grille 0..MAX_GOALS
}

export interface Probabilities {
  lambdaHome: number;
  lambdaAway: number;
  homeGoals: number[];
  awayGoals: number[];
  homeWin: number;
  draw: number;
  awayWin: number;
  over15: number;
  over25: number;
  btts: number;
  mostLikelyScore: { home: number; away: number; p: number };
  trace: ModelTrace;
}

export type ProbabilityResult = { ok: true; value: Probabilities } | { ok: false; reasons: InsufficientReason[]; homePlayed: number; awayPlayed: number };

function side(s: TeamStats, venue: "home" | "away") {
  const v = s[venue];
  const useSplit = v.played >= MIN_VENUE_GAMES;
  return { attack: useSplit ? v.avgScored : s.avgScored, defence: useSplit ? v.avgConceded : s.avgConceded, useSplit, venueGames: v.played };
}

/**
 * Poisson indépendant : λ_dom = moyenne(attaque dom. à domicile, défense ext. à l'extérieur), idem pour λ_ext.
 * Seuls les matchs antérieurs à `kickoff` sont utilisés.
 */
export function computeProbabilities(home: TeamHistory | undefined, away: TeamHistory | undefined, kickoff: string, last = 10): ProbabilityResult {
  const hs = computeTeamStats(home, { before: kickoff, last });
  const as = computeTeamStats(away, { before: kickoff, last });
  const reasons: InsufficientReason[] = [];
  if (!hs || hs.played < MIN_GAMES) reasons.push("historique-domicile-insuffisant");
  if (!as || as.played < MIN_GAMES) reasons.push("historique-exterieur-insuffisant");
  if (!hs || !as || reasons.length) return { ok: false, reasons, homePlayed: hs?.played ?? 0, awayPlayed: as?.played ?? 0 };

  const h = side(hs, "home");
  const a = side(as, "away");
  const lambdaHome = (h.attack + a.defence) / 2;
  const lambdaAway = (a.attack + h.defence) / 2;
  if (lambdaHome <= 0 || lambdaAway <= 0) return { ok: false, reasons: ["lambda-nul"], homePlayed: hs.played, awayPlayed: as.played };

  const hd = goalDistribution(lambdaHome);
  const ad = goalDistribution(lambdaAway);
  let homeWin = 0, draw = 0, awayWin = 0, over15 = 0, over25 = 0, btts = 0, coverage = 0;
  let best = { home: 0, away: 0, p: -1 };
  for (let i = 0; i <= MAX_GOALS; i++) for (let j = 0; j <= MAX_GOALS; j++) {
    const p = hd[i] * ad[j];
    coverage += p;
    if (i > j) homeWin += p; else if (i === j) draw += p; else awayWin += p;
    if (i + j >= 2) over15 += p;
    if (i + j >= 3) over25 += p;
    if (i > 0 && j > 0) btts += p;
    if (p > best.p) best = { home: i, away: j, p };
  }
  // Renormalisation sur la grille (masse hors grille négligeable, reportée dans la trace).
  const n = (x: number) => x / coverage;
  return {
    ok: true,
    value: {
      lambdaHome, lambdaAway, homeGoals: hd, awayGoals: ad,
      homeWin: n(homeWin), draw: n(draw), awayWin: n(awayWin),
      over15: n(over15), over25: n(over25), btts: n(btts),
      mostLikelyScore: { ...best, p: n(best.p) },
      trace: {
        model: MODEL_VERSION,
        cutoff: kickoff,
        homeSample: { played: hs.played, venueGames: h.venueGames, usedVenueSplit: h.useSplit, dates: hs.games.map((g) => g.date) },
        awaySample: { played: as.played, venueGames: a.venueGames, usedVenueSplit: a.useSplit, dates: as.games.map((g) => g.date) },
        inputs: { homeAttack: h.attack, awayDefence: a.defence, awayAttack: a.attack, homeDefence: h.defence },
        coverage,
      },
    },
  };
}

export const pct = (v: number) => `${Math.round(v * 100)} %`;
export const dec = (v: number) => v.toFixed(2).replace(".", ",");
