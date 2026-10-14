import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { seo } from "@/lib/seo";
import { fmtDateTime } from "@/lib/format";
import { headToHead } from "@/lib/stats";
import { Badge, Button, Card, DemoBadge, Empty, PageHeader, StatusBadge } from "@/components/kit";
import { ProbabilitiesNotice, TeamStatsPanel } from "@/components/TeamStatsPanel";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/matchs/$id")({
  head: () => seo("Détail du match", "Statistiques et analyse détaillées d'un match."),
  component: MatchDetail,
});

function MatchDetail() {
  const { id } = Route.useParams();
  const { data, ready, createAnalysis } = useStore();
  const nav = useNavigate();
  const m = data.matches.find((x) => x.id === id);
  if (!m) return ready ? <Empty title="Match introuvable" action={<Link to="/matchs" className="text-primary">Retour aux matchs</Link>} /> : null;
  const a = data.analyses.find((x) => x.matchId === m.id);
  const h2h = headToHead(data.h2h, m.home, m.away, m.kickoff);

  return (
    <>
      <Link to="/matchs" className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3 w-3" />Matchs</Link>
      <PageHeader title={`${m.home} – ${m.away}`} description={`${m.league} · ${fmtDateTime(m.kickoff)} · Source : ${m.source}`}
        actions={<>{m.isDemo && <DemoBadge />}<Badge>{m.status}</Badge>{a ? <StatusBadge status={a.status} /> : (
          <Button onClick={() => { createAnalysis(m.id); nav({ to: "/validation" }); }}>Créer une analyse</Button>)}</>} />
      {m.score && <Card className="mb-4"><p className="num text-center text-3xl font-semibold">{m.score.home} – {m.score.away}</p></Card>}
      <div className="grid gap-4 md:grid-cols-2">
        <TeamStatsPanel team={m.home} before={m.kickoff} history={data.histories.find((h) => h.team === m.home)} />
        <TeamStatsPanel team={m.away} before={m.kickoff} history={data.histories.find((h) => h.team === m.away)} />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card title="Confrontations directes">
          {h2h.length === 0 ? <p className="text-sm text-muted-foreground">Aucune confrontation disponible.</p> : (
            <ul className="space-y-2 text-sm">{h2h.map((h, i) => (
              <li key={i} className="flex justify-between"><span>{h.home} – {h.away}</span><span className="num">{h.homeGoals}-{h.awayGoals} <span className="text-xs text-muted-foreground">{h.date}</span></span></li>
            ))}</ul>
          )}
        </Card>
        <ProbabilitiesNotice match={m} histories={data.histories} />
      </div>
      {a && <Card title="Analyse" className="mt-4"><p className="text-sm">{a.selection && <strong>{a.selection} — </strong>}{a.summary || "Pas encore de texte."}</p></Card>}
    </>
  );
}
