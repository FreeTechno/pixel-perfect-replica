import type { AppData, PastGame, TeamHistory } from "./types";

// DONNÉES DE DÉMONSTRATION — fictives, uniquement pour tester l'interface.
const DEMO = "Démonstration";
const now = Date.now();
const day = 86_400_000;
const at = (d: number, h = 19) => {
  const t = new Date(now + d * day);
  t.setUTCHours(h - 1, 0, 0, 0); // heure de Porto-Novo (UTC+1)
  return t.toISOString();
};

const teams = [
  "Lions de Cotonou", "Étoile de Porto-Novo", "AS Parakou", "Dragons d'Abomey",
  "Union Ouidah", "Racing Bohicon", "Requins de Lokossa", "Panthères de Natitingou",
];

function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}

function history(team: string, seed: number): TeamHistory {
  const r = seeded(seed);
  const games: PastGame[] = Array.from({ length: 8 }, (_, i) => {
    const opp = teams.filter((t) => t !== team)[Math.floor(r() * 7)];
    return {
      date: at(-(i + 1) * 7, 17).slice(0, 10),
      opponent: opp,
      venue: i % 2 === 0 ? "D" : "E",
      gf: Math.floor(r() * 4),
      ga: Math.floor(r() * 3),
    };
  });
  return { team, games, isDemo: true };
}

export function createDemoData(): AppData {
  const m = (id: string, league: string, home: string, away: string, d: number, h: number, extra = {}) => ({
    id, league, home, away, kickoff: at(d, h), status: "à venir" as const,
    source: DEMO, isDemo: true, statsAvailable: true, ...extra,
  });
  return {
    matches: [
      m("m1", "Ligue Démo A", teams[0], teams[1], 1, 16),
      m("m2", "Ligue Démo A", teams[2], teams[3], 1, 19),
      m("m3", "Ligue Démo A", teams[4], teams[5], 2, 16),
      m("m4", "Coupe Démo", teams[6], teams[7], 3, 18, { statsAvailable: false }),
      m("m5", "Ligue Démo B", teams[1], teams[2], 4, 20),
      m("m6", "Ligue Démo A", teams[3], teams[0], -3, 16, { status: "terminé", score: { home: 2, away: 1 } }),
      m("m7", "Ligue Démo B", teams[5], teams[6], -2, 19, { status: "terminé", score: { home: 0, away: 0 } }),
      m("m8", "Ligue Démo A", teams[7], teams[4], -1, 18, { status: "terminé", score: { home: 1, away: 3 } }),
    ],
    histories: teams.map((t, i) => history(t, i * 37 + 11)),
    h2h: [
      { date: "2026-03-14", home: teams[0], away: teams[1], homeGoals: 2, awayGoals: 2 },
      { date: "2025-10-02", home: teams[1], away: teams[0], homeGoals: 1, awayGoals: 0 },
      { date: "2026-02-20", home: teams[2], away: teams[3], homeGoals: 3, awayGoals: 1 },
    ],
    analyses: [
      { id: "a1", matchId: "m1", status: "à vérifier", selection: "Plus de 1,5 but",
        summary: "Les deux équipes affichent une moyenne offensive correcte sur leurs huit derniers matchs (démo).",
        notes: [], outcome: null, updatedAt: at(-1) },
      { id: "a2", matchId: "m2", status: "brouillon", selection: "Les deux équipes marquent",
        summary: "Analyse en cours de rédaction.", notes: [], outcome: null, updatedAt: at(-1) },
      { id: "a3", matchId: "m3", status: "validée", selection: "Plus de 2,5 buts",
        summary: "Fréquence élevée de matchs à plus de 2,5 buts pour l'équipe à domicile (démo).",
        notes: [{ date: at(-1), text: "Vérifié sur les données de démonstration." }], outcome: null, updatedAt: at(-1) },
      { id: "a4", matchId: "m6", status: "publiée", selection: "Plus de 1,5 but",
        summary: "Analyse publiée (démo).", notes: [], outcome: "réussie", updatedAt: at(-4) },
      { id: "a5", matchId: "m7", status: "publiée", selection: "Les deux équipes marquent",
        summary: "Analyse publiée (démo).", notes: [], outcome: "échouée", updatedAt: at(-3) },
      { id: "a6", matchId: "m8", status: "publiée", selection: "Plus de 2,5 buts",
        summary: "Analyse publiée (démo).", notes: [], outcome: "réussie", updatedAt: at(-2) },
    ],
    ebooks: [],
    logs: [
      { date: at(-1, 8), level: "info", message: "Chargement des données de démonstration." },
      { date: at(-1, 8), level: "erreur", message: "Aucune source réelle connectée — collecte automatique inactive." },
    ],
    lastSync: null,
  };
}
