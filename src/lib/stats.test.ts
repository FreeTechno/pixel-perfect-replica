import { describe, expect, it } from "vitest";
import { computeProbabilities, computeTeamStats, gamesBefore, goalDistribution, headToHead, poissonPmf } from "./stats";
import type { PastGame, TeamHistory } from "./types";

const g = (date: string, venue: "D" | "E", gf: number, ga: number): PastGame => ({ date, opponent: "X", venue, gf, ga });
const hist = (games: PastGame[]): TeamHistory => ({ team: "T", games, isDemo: false });

describe("statistiques descriptives", () => {
  const h = hist([g("2026-01-01", "D", 2, 1), g("2026-01-08", "E", 0, 0), g("2026-01-15", "D", 3, 2)]);
  it("calcule moyennes, splits et fréquences", () => {
    const s = computeTeamStats(h)!;
    expect(s.played).toBe(3);
    expect(s.avgScored).toBeCloseTo(5 / 3);
    expect(s.home).toEqual({ played: 2, avgScored: 2.5, avgConceded: 1.5 });
    expect(s.away.played).toBe(1);
    expect(s.over25).toBeCloseTo(2 / 3);
    expect(s.btts).toBeCloseTo(2 / 3);
    expect(s.form).toEqual(["V", "N", "V"]); // plus récent d'abord
  });
  it("ignore les matchs du jour ou postérieurs au coup d'envoi", () => {
    expect(gamesBefore(h.games, "2026-01-08T18:00:00Z").map((x) => x.date)).toEqual(["2026-01-01"]);
    expect(computeTeamStats(h, { before: "2026-01-01T10:00:00Z" })).toBeNull();
  });
  it("filtre les confrontations futures", () => {
    const all = [{ date: "2026-01-01", home: "A", away: "B", homeGoals: 1, awayGoals: 0 }, { date: "2026-03-01", home: "B", away: "A", homeGoals: 2, awayGoals: 2 }];
    expect(headToHead(all, "A", "B", "2026-02-01")).toHaveLength(1);
  });
});

describe("modèle de Poisson", () => {
  it("pmf exacte", () => {
    expect(poissonPmf(0, 1.5)).toBeCloseTo(Math.exp(-1.5), 12);
    expect(poissonPmf(2, 1.5)).toBeCloseTo((1.5 ** 2 * Math.exp(-1.5)) / 2, 12);
    expect(goalDistribution(1.3, 15).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
  });
  const many = (n: number, gf: number, ga: number) => Array.from({ length: n }, (_, i) => g(`2026-01-${String(i + 1).padStart(2, "0")}`, i % 2 ? "E" : "D", gf, ga));
  it("refuse un historique de moins de 5 matchs", () => {
    const r = computeProbabilities(hist(many(4, 1, 1)), hist(many(10, 1, 1)), "2026-02-01");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reasons).toEqual(["historique-domicile-insuffisant"]);
  });
  it("probabilités cohérentes et traçables", () => {
    const r = computeProbabilities(hist(many(10, 2, 1)), hist(many(10, 1, 1)), "2026-02-01");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const v = r.value;
    expect(v.lambdaHome).toBeCloseTo(1.5); // (2 + 1) / 2
    expect(v.lambdaAway).toBeCloseTo(1); // (1 + 1) / 2
    expect(v.homeWin + v.draw + v.awayWin).toBeCloseTo(1, 9);
    expect(v.btts).toBeCloseTo((1 - Math.exp(-1.5)) * (1 - Math.exp(-1)), 6);
    expect(v.trace.homeSample.played).toBe(10);
  });
  it("n'utilise pas un résultat postérieur au match", () => {
    const base = many(10, 1, 1);
    const a = computeProbabilities(hist(base), hist(base), "2026-02-01");
    const b = computeProbabilities(hist([...base, g("2026-02-01", "D", 9, 0), g("2026-03-01", "D", 9, 0)]), hist(base), "2026-02-01");
    expect(a).toEqual(b);
  });
});
