import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { seo } from "@/lib/seo";
import { fmtDateTime } from "@/lib/format";
import { Card, DemoBadge, Empty, PageHeader, Skeleton, Stat, StatusBadge, Badge, Table } from "@/components/kit";

export const Route = createFileRoute("/")({
  head: () => seo("Tableau de bord", "Vue d'ensemble des matchs, analyses et rapports PDF."),
  component: Dashboard,
});

function Dashboard() {
  const { data, ready } = useStore();
  const upcoming = data.matches.filter((m) => m.status === "à venir").sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  const analyzed = new Set(data.analyses.map((a) => a.matchId));
  const errors = data.logs.filter((l) => l.level === "erreur").slice(0, 5);
  const hasDemo = data.matches.some((m) => m.isDemo);

  if (!ready) return <div className="grid gap-3 sm:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;

  return (
    <>
      <PageHeader title="Tableau de bord" description="Vue d'ensemble de l'activité." actions={hasDemo ? <DemoBadge /> : undefined} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Matchs disponibles" value={data.matches.length} />
        <Stat label="Matchs analysés" value={analyzed.size} />
        <Stat label="En attente de validation" value={data.analyses.filter((a) => a.status === "à vérifier").length} tone="warning" />
        <Stat label="Rapports PDF générés" value={data.ebooks.length} />
        <Stat label="Rapports publiés" value={data.ebooks.filter((e) => e.status === "publié").length} tone="success" />
        <Stat label="Dernière synchro" value={<span className="text-sm">{data.lastSync ? fmtDateTime(data.lastSync) : "Jamais"}</span>} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card title="Prochains matchs" className="lg:col-span-2" action={<Link to="/matchs" className="text-xs text-primary hover:underline">Tout voir</Link>}>
          {upcoming.length === 0 ? <Empty title="Aucun match à venir" text="Importez un fichier CSV pour ajouter des matchs." /> : (
            <Table head={["Match", "Date", "Analyse"]}>
              {upcoming.slice(0, 6).map((m) => {
                const a = data.analyses.find((x) => x.matchId === m.id);
                return (
                  <tr key={m.id}>
                    <td className="px-3 py-2.5"><Link to="/matchs/$id" params={{ id: m.id }} className="hover:text-primary">{m.home} – {m.away}</Link><p className="text-xs text-muted-foreground">{m.league}</p></td>
                    <td className="num whitespace-nowrap px-3 py-2.5 text-xs">{fmtDateTime(m.kickoff)}</td>
                    <td className="px-3 py-2.5">{a ? <StatusBadge status={a.status} /> : <Badge>Non analysé</Badge>}</td>
                  </tr>
                );
              })}
            </Table>
          )}
        </Card>
        <Card title="Dernières erreurs de collecte">
          {errors.length === 0 ? <p className="text-sm text-muted-foreground">Aucune erreur.</p> : (
            <ul className="space-y-3">{errors.map((e, i) => (
              <li key={i} className="text-sm"><p className="text-destructive">{e.message}</p><p className="num text-xs text-muted-foreground">{fmtDateTime(e.date)}</p></li>
            ))}</ul>
          )}
        </Card>
      </div>
    </>
  );
}
