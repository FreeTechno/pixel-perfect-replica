// Module collecte : import CSV de matchs.
import type { Match } from "./types";

export const CSV_TEMPLATE =
  "championnat;domicile;exterieur;date;heure;source\nLigue 1 Bénin;Équipe A;Équipe B;2026-10-20;16:00;Saisie manuelle";

function parseLine(line: string, sep: string) {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (const c of line) {
    if (c === '"') q = !q;
    else if (c === sep && !q) { out.push(cur.trim()); cur = ""; }
    else cur += c;
  }
  out.push(cur.trim());
  return out;
}

export interface CsvResult { matches: Match[]; errors: string[] }

export function parseMatchesCsv(text: string): CsvResult {
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim());
  if (lines.length < 2) return { matches: [], errors: ["Fichier vide ou sans ligne de données."] };
  const sep = lines[0].includes(";") ? ";" : ",";
  const head = parseLine(lines[0], sep).map((h) => h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
  const need = ["championnat", "domicile", "exterieur", "date", "heure"];
  const missing = need.filter((n) => !head.includes(n));
  if (missing.length) return { matches: [], errors: [`Colonnes manquantes : ${missing.join(", ")}`] };
  const idx = (k: string) => head.indexOf(k);
  const matches: Match[] = [];
  const errors: string[] = [];
  lines.slice(1).forEach((l, i) => {
    const c = parseLine(l, sep);
    const date = c[idx("date")], time = c[idx("heure")];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{1,2}:\d{2}$/.test(time)) {
      errors.push(`Ligne ${i + 2} : date ou heure invalide (attendu AAAA-MM-JJ et HH:MM).`);
      return;
    }
    const home = c[idx("domicile")], away = c[idx("exterieur")];
    if (!home || !away) { errors.push(`Ligne ${i + 2} : équipe manquante.`); return; }
    // Heure saisie en heure de Porto-Novo (UTC+1)
    const kickoff = new Date(`${date}T${time.padStart(5, "0")}:00+01:00`).toISOString();
    matches.push({
      id: `csv-${Date.now()}-${i}`,
      league: c[idx("championnat")] || "Non précisé",
      home, away, kickoff,
      status: "à venir",
      source: (idx("source") >= 0 && c[idx("source")]) || "Import CSV",
      isDemo: false,
      statsAvailable: false,
    });
  });
  return { matches, errors };
}
