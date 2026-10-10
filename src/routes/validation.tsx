import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { seo } from "@/lib/seo";
import { fmtDateTime } from "@/lib/format";
import { computeTeamStats, dec, pct } from "@/lib/stats";
import { Badge, Button, Card, Empty, Input, Label, PageHeader, StatusBadge, Textarea } from "@/components/kit";
import type { AnalysisStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/validation")({
  head: () => seo("Validation des analyses", "Examiner, annoter, valider ou rejeter les analyses."),
  component: Validation,
});

const filters: (AnalysisStatus | "toutes")[] = ["toutes", "brouillon", "à vérifier", "validée", "rejetée", "publiée"];

function Validation() {
  const s = useStore();
  const { data } = s;
  const [f, setF] = useState<(typeof filters)[number]>("à vérifier");
  const list = data.analyses.filter((a) => f === "toutes" || a.status === f);
  const [selId, setSelId] = useState<string | null>(null);
  const a = data.analyses.find((x) => x.id === selId) ?? list[0];
  const m = a && data.matches.find((x) => x.id === a.matchId);
  const [summary, setSummary] = useState("");
  const [selection, setSelection] = useState("");
  const [note, setNote] = useState("");
  useEffect(() => { setSummary(a?.summary ?? ""); setSelection(a?.selection ?? ""); }, [a?.id]);

  const act = (status: AnalysisStatus, msg: string) => { if (a) { s.setAnalysisStatus(a.id, status); toast.success(msg); } };
  const dirty = a && (summary !== a.summary || selection !== a.selection);

  return (
    <>
      <PageHeader title="Validation des analyses" description="Aucune analyse non validée ne peut entrer dans un ebook." />
      <div className="mb-4 flex flex-wrap gap-1.5">
        {filters.map((x) => (
          <button key={x} onClick={() => { setF(x); setSelId(null); }}
            className={cn("rounded-lg px-3 py-1.5 text-xs", f === x ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground")}>
            {x === "toutes" ? "Toutes" : x} <span className="num ml-1 opacity-70">{x === "toutes" ? data.analyses.length : data.analyses.filter((y) => y.status === x).length}</span>
          </button>
        ))}
      </div>
      {list.length === 0 ? <Empty title="Aucune analyse dans ce statut" text="Créez une analyse depuis la fiche d'un match." action={<Link to="/matchs" className="text-sm text-primary">Voir les matchs</Link>} /> : (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="space-y-2">
            {list.map((x) => {
              const mm = data.matches.find((y) => y.id === x.matchId);
              return (
                <button key={x.id} onClick={() => setSelId(x.id)} className={cn("w-full rounded-xl border bg-card p-3 text-left", a?.id === x.id && "border-primary/60")}>
                  <p className="text-sm font-medium">{mm?.home} – {mm?.away}</p>
                  <div className="mt-1.5 flex items-center gap-2"><StatusBadge status={x.status} />{mm?.isDemo && <Badge tone="warning">Démo</Badge>}</div>
                </button>
              );
            })}
          </div>
          {a && m && (
            <div className="space-y-4">
              <Card title="Analyse" action={<StatusBadge status={a.status} />}>
                <p className="mb-4 text-xs text-muted-foreground">{m.league} · {fmtDateTime(m.kickoff)} · <Link to="/matchs/$id" params={{ id: m.id }} className="text-primary">fiche du match</Link></p>
                <div className="space-y-3">
                  <div><Label>Sélection retenue</Label><Input value={selection} onChange={(e) => setSelection(e.target.value)} placeholder="ex. Plus de 1,5 but" disabled={a.status === "publiée"} /></div>
                  <div><Label>Analyse explicative</Label><Textarea rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} disabled={a.status === "publiée"} /></div>
                  {dirty && <Button variant="secondary" onClick={() => { s.updateAnalysis(a.id, { summary, selection }); toast.success("Modifications enregistrées"); }}>Enregistrer</Button>}
                </div>
                {a.status !== "publiée" && (
                  <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
                    {a.status === "brouillon" && <Button variant="secondary" disabled={!summary || !!dirty} onClick={() => act("à vérifier", "Envoyée en vérification")}>Envoyer en vérification</Button>}
                    {a.status !== "validée" && <Button disabled={!a.summary || !a.selection || !!dirty} onClick={() => act("validée", "Analyse validée")}>Valider</Button>}
                    {a.status !== "rejetée" && <Button variant="danger" onClick={() => act("rejetée", "Analyse rejetée")}>Rejeter</Button>}
                    {(a.status === "rejetée" || a.status === "validée") && <Button variant="ghost" onClick={() => act("brouillon", "Repassée en brouillon")}>Repasser en brouillon</Button>}
                  </div>
                )}
              </Card>
              <SourceData teamA={m.home} teamB={m.away} source={m.source} />
              <Card title="Notes de l'administrateur">
                <ul className="mb-3 space-y-2">
                  {a.notes.length === 0 && <li className="text-sm text-muted-foreground">Aucune note.</li>}
                  {a.notes.map((n, i) => <li key={i} className="rounded-lg bg-muted/50 p-2.5 text-sm">{n.text}<p className="num mt-1 text-[11px] text-muted-foreground">{fmtDateTime(n.date)}</p></li>)}
                </ul>
                <div className="flex gap-2">
                  <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ajouter une note" />
                  <Button variant="secondary" disabled={!note.trim()} onClick={() => { s.addNote(a.id, note.trim()); setNote(""); }}>Ajouter</Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function SourceData({ teamA, teamB, source }: { teamA: string; teamB: string; source: string }) {
  const { data } = useStore();
  const rows = [teamA, teamB].map((t) => ({ t, s: computeTeamStats(data.histories.find((h) => h.team === t)) }));
  return (
    <Card title={`Données sources · ${source}`}>
      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map(({ t, s }) => (
          <div key={t} className="rounded-lg bg-muted/50 p-3 text-xs">
            <p className="mb-2 text-sm font-medium">{t}</p>
            {!s ? <p className="text-muted-foreground">Non disponible</p> : (
              <p className="num leading-6 text-muted-foreground">{s.played} matchs · moy. {dec(s.avgScored)} / {dec(s.avgConceded)}<br />+1,5 : {pct(s.over15)} · +2,5 : {pct(s.over25)} · BTTS : {pct(s.btts)}</p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
