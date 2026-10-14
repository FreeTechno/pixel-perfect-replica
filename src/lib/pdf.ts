// Module génération PDF : crée un vrai fichier PDF côté navigateur.
import type { AppData, Ebook } from "./types";
import { computeTeamStats, dec, pct, headToHead } from "./stats";
import { fmtDate, fmtDateTime } from "./format";

export async function generateEbookPdf(ebook: Omit<Ebook, "status" | "createdAt">, data: AppData) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const hex = ebook.coverColor.replace("#", "");
  const rgb = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];

  // Couverture
  doc.setFillColor(...rgb);
  doc.rect(0, 0, W, 297, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text(doc.splitTextToSize(ebook.title, 170), 20, 110);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text(doc.splitTextToSize(ebook.subtitle, 170), 20, 140);
  doc.setFontSize(11);
  doc.text(`Publication : ${fmtDate(ebook.publicationDate)}`, 20, 270);
  doc.text("FootData Analytics", 20, 278);

  const analyses = data.analyses.filter((a) => ebook.analysisIds.includes(a.id));
  const anyDemo = analyses.some((a) => data.matches.find((m) => m.id === a.matchId)?.isDemo);

  // Sommaire / présentation
  doc.addPage();
  doc.setTextColor(20, 24, 36);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Présentation des matchs", 20, 25);
  if (anyDemo) {
    doc.setFontSize(10);
    doc.setTextColor(200, 80, 40);
    doc.text("ATTENTION : ce document contient des DONNÉES DE DÉMONSTRATION fictives.", 20, 33);
    doc.setTextColor(20, 24, 36);
  }
  autoTable(doc, {
    startY: 40,
    head: [["Championnat", "Match", "Date (Porto-Novo)", "Source"]],
    body: analyses.map((a) => {
      const m = data.matches.find((x) => x.id === a.matchId)!;
      return [m.league, `${m.home} - ${m.away}`, fmtDateTime(m.kickoff), m.source];
    }),
    headStyles: { fillColor: rgb },
    styles: { fontSize: 9 },
  });

  // Une page par analyse
  for (const a of analyses) {
    const m = data.matches.find((x) => x.id === a.matchId)!;
    doc.addPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`${m.home} - ${m.away}`, 20, 25);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`${m.league} · ${fmtDateTime(m.kickoff)}${m.isDemo ? " · DONNÉES DE DÉMONSTRATION" : ""}`, 20, 32);

    const hs = computeTeamStats(data.histories.find((h) => h.team === m.home), { before: m.kickoff });
    const as = computeTeamStats(data.histories.find((h) => h.team === m.away), { before: m.kickoff });
    const row = (label: string, f: (s: NonNullable<typeof hs>) => string) =>
      [label, hs ? f(hs) : "Non disponible", as ? f(as) : "Non disponible"];
    autoTable(doc, {
      startY: 40,
      head: [["Statistique", m.home, m.away]],
      body: [
        row("Matchs analysés", (s) => String(s.played)),
        row("Moyenne buts marqués", (s) => dec(s.avgScored)),
        row("Moyenne buts encaissés", (s) => dec(s.avgConceded)),
        row("Plus de 1,5 but", (s) => pct(s.over15)),
        row("Plus de 2,5 buts", (s) => pct(s.over25)),
        row("Les deux équipes marquent", (s) => pct(s.btts)),
      ],
      headStyles: { fillColor: rgb },
      styles: { fontSize: 9 },
    });
    // @ts-expect-error lastAutoTable ajouté par le plugin
    let y = doc.lastAutoTable.finalY + 10;
    const h2h = headToHead(data.h2h, m.home, m.away, m.kickoff);
    doc.setFont("helvetica", "bold");
    doc.text("Confrontations directes", 20, y);
    doc.setFont("helvetica", "normal");
    y += 6;
    if (h2h.length === 0) { doc.text("Aucune confrontation disponible.", 20, y); y += 6; }
    h2h.forEach((h) => { doc.text(`${h.date} : ${h.home} ${h.homeGoals} - ${h.awayGoals} ${h.away}`, 20, y); y += 6; });
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text("Analyse", 20, y);
    doc.setFont("helvetica", "normal");
    y += 6;
    const body = doc.splitTextToSize(`${a.selection ? `Sélection : ${a.selection}. ` : ""}${a.summary}`, 170);
    doc.text(body, 20, y);
    y += body.length * 5 + 6;
    doc.setFont("helvetica", "bold");
    doc.text("Probabilités et méthode", 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize("Non disponibles : le moteur probabiliste n'est pas encore opérationnel. Seules des fréquences observées sont présentées.", 170), 20, y + 6);
  }

  // Limites et avertissement
  doc.addPage();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Limites des analyses", 20, 25);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(doc.splitTextToSize(
    "Les statistiques présentées décrivent des performances passées sur un échantillon limité de matchs. Elles ne tiennent pas compte des blessures, suspensions, conditions météo ou changements d'effectif. Aucune analyse ne garantit un résultat.", 170), 20, 35);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Avertissement sur les paris", 20, 75);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(doc.splitTextToSize(
    "Les paris sportifs comportent des risques de perte financière et peuvent entraîner une dépendance. Ne misez jamais plus que ce que vous pouvez vous permettre de perdre. Ce document est fourni à titre informatif et ne constitue pas un conseil financier. Réservé aux personnes majeures.", 170), 20, 85);

  const total = doc.getNumberOfPages();
  for (let i = 2; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`FootData Analytics · ${ebook.title} · ${i}/${total}`, 20, 290);
  }
  doc.save(ebook.fileName);
}
