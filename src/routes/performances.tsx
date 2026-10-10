import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { seo } from "@/lib/seo";
import { Badge, Button, Card, DemoBadge, Empty, PageHeader, Stat, Table } from "@/components/kit";

export const Route = createFileRoute("/performances")({
  head: () => seo("Évaluation des performances", "Suivi des résultats des analyses publiées."),
  component: Perf,
});

function Perf() {
  const { data, setOutcome } = useStore();
  const published = data.analyses.filter((a) => a.status === "publiée");
  const done = published.filter((a) => a.outcome);
  const ok = done.filter((a) => a.outcome === "réussie").length;
  const rate = done.length ? Math.round((ok / done.length) * 100) : null;
  const demo = published.some((a) => data.matches.find((m) => m.id === a.matchId)?.isDemo);

  return (
    <>
      <PageHeader title="Évaluation des performances" description="Le résultat de chaque analyse publiée est saisi manuellement." actions={demo ? <DemoBadge /> : undefined} />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Analyses publiées" value={published.length} />
        <Stat label="Résultats saisis" value={done.length} />
        <Stat label="Réussies" value={ok} tone="success" />
        <Stat label="Taux de réussite" value={rate === null ? "—" : `${rate} %`} hint={done.length < 30 ? "Échantillon trop faible pour conclure" : undefined} />
      </div>
      <Card>
        {published.length === 0 ? <Empty title="Aucune analyse publiée" /> : (
          <Table head={["Match", "Sélection", "Score", "Résultat"]}>
            {published.map((a) => {
              const m = data.matches.find((x) => x.id === a.matchId)!;
              return (
                <tr key={a.id}>
                  <td className="px-3 py-2.5">{m.home} – {m.away}</td>
                  <td className="px-3 py-2.5 text-xs">{a.selection}</td>
                  <td className="num px-3 py-2.5">{m.score ? `${m.score.home}-${m.score.away}` : "—"}</td>
                  <td className="px-3 py-2.5"><div className="flex items-center gap-2">
                    {a.outcome ? <Badge tone={a.outcome === "réussie" ? "success" : "danger"}>{a.outcome}</Badge> : <Badge>En attente</Badge>}
                    <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => setOutcome(a.id, "réussie")}>Réussie</Button>
                    <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => setOutcome(a.id, "échouée")}>Échouée</Button>
                  </div></td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>
    </>
  );
}
