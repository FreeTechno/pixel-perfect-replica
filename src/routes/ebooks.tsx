import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { seo } from "@/lib/seo";
import { fmtDateTime } from "@/lib/format";
import { generateEbookPdf } from "@/lib/pdf";
import { Badge, Button, Card, Empty, Input, Label, PageHeader } from "@/components/kit";
import { FileDown, Loader2 } from "lucide-react";

export const Route = createFileRoute("/ebooks")({
  head: () => seo("Générateur d'ebooks", "Créer un rapport PDF à partir des analyses validées."),
  component: Ebooks,
});

const colors = ["#0f1e3a", "#12382b", "#2a2f3a", "#3a1f12"];
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Porto-Novo" });

function Ebooks() {
  const { data, addEbook } = useStore();
  const validated = data.analyses.filter((a) => a.status === "validée");
  const [picked, setPicked] = useState<string[]>([]);
  const [title, setTitle] = useState("Analyses statistiques de la semaine");
  const [subtitle, setSubtitle] = useState("Sélection de matchs étudiés par FootData Analytics");
  const [date, setDate] = useState(today());
  const [color, setColor] = useState(colors[0]);
  const [busy, setBusy] = useState(false);
  const chosen = picked.filter((id) => validated.some((a) => a.id === id));

  async function generate() {
    setBusy(true);
    try {
      const id = `eb-${Date.now()}`;
      const fileName = `footdata-${date}-${id.slice(-5)}.pdf`;
      const eb = { id, title, subtitle, publicationDate: date, coverColor: color, analysisIds: chosen, fileName };
      await generateEbookPdf(eb, data);
      addEbook({ ...eb, status: "généré", createdAt: new Date().toISOString() });
      toast.success("PDF généré et archivé");
      setPicked([]);
    } catch (e) {
      toast.error("Échec de la génération du PDF");
      console.error(e);
    } finally { setBusy(false); }
  }

  return (
    <>
      <PageHeader title="Générateur d'ebooks" description="Seules les analyses au statut « Validée » peuvent être incluses." />
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <Card title="Analyses validées">
          {validated.length === 0 ? <Empty title="Aucune analyse validée" action={<Link to="/validation" className="text-sm text-primary">Aller à la validation</Link>} /> : (
            <ul className="space-y-2">
              {validated.map((a) => {
                const m = data.matches.find((x) => x.id === a.matchId)!;
                const on = picked.includes(a.id);
                return (
                  <li key={a.id}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-accent/40">
                      <input type="checkbox" checked={on} onChange={() => setPicked(on ? picked.filter((x) => x !== a.id) : [...picked, a.id])} className="mt-1 accent-primary" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{m.home} – {m.away} {m.isDemo && <Badge tone="warning" className="ml-1">Démo</Badge>}</p>
                        <p className="text-xs text-muted-foreground">{fmtDateTime(m.kickoff)} · {a.selection}</p>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <Card title="Couverture et contenu">
          <div className="space-y-3">
            <div className="flex aspect-[3/4] flex-col justify-between rounded-lg p-4" style={{ background: color }}>
              <div />
              <div><p className="font-display text-lg font-semibold leading-tight text-foreground">{title}</p><p className="mt-1 text-xs text-foreground/70">{subtitle}</p></div>
              <p className="text-[10px] text-foreground/60">{date}</p>
            </div>
            <div className="flex gap-2">{colors.map((c) => <button key={c} aria-label={`Couleur ${c}`} onClick={() => setColor(c)} className="h-7 w-7 rounded-md border-2" style={{ background: c, borderColor: c === color ? "var(--primary)" : "transparent" }} />)}</div>
            <div><Label>Titre</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div><Label>Sous-titre</Label><Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} /></div>
            <div><Label>Date de publication</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <p className="text-xs text-muted-foreground">Inclus automatiquement : présentation des matchs, statistiques, analyses, méthode, limites et avertissement sur les risques des paris.</p>
            <Button className="w-full" disabled={!chosen.length || !title.trim() || busy} onClick={generate}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}Générer le PDF ({chosen.length})
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
