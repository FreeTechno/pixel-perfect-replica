import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { seo } from "@/lib/seo";
import { fmtDateTime } from "@/lib/format";
import { Badge, Card, Empty, Input, PageHeader, StatusBadge, Table } from "@/components/kit";
import type { MatchStatus } from "@/lib/types";

export const Route = createFileRoute("/matchs/")({
  head: () => seo("Matchs", "Liste des matchs à venir et terminés."),
  component: Matches,
});

const statuses: (MatchStatus | "tous")[] = ["tous", "à venir", "en cours", "terminé", "reporté"];

function Matches() {
  const { data } = useStore();
  const [q, setQ] = useState("");
  const [st, setSt] = useState<(typeof statuses)[number]>("tous");
  const list = data.matches
    .filter((m) => st === "tous" || m.status === st)
    .filter((m) => `${m.home} ${m.away} ${m.league}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff));

  return (
    <>
      <PageHeader title="Matchs" description="Heures affichées en heure de Porto-Novo." />
      <Card>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <Input placeholder="Rechercher une équipe ou un championnat" value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={st} onChange={(e) => setSt(e.target.value as typeof st)} className="rounded-lg border bg-background px-3 py-2 text-sm">
            {statuses.map((s) => <option key={s} value={s}>{s === "tous" ? "Tous les statuts" : s}</option>)}
          </select>
        </div>
        {list.length === 0 ? <Empty title="Aucun match" text="Modifiez les filtres ou importez des matchs." /> : (
          <Table head={["Championnat", "Match", "Date", "Statut", "Source", "Stats", "Analyse"]}>
            {list.map((m) => {
              const a = data.analyses.find((x) => x.matchId === m.id);
              return (
                <tr key={m.id} className="hover:bg-accent/40">
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{m.league}</td>
                  <td className="px-3 py-2.5"><Link to="/matchs/$id" params={{ id: m.id }} className="font-medium hover:text-primary">{m.home} – {m.away}</Link>
                    {m.score && <span className="num ml-2 text-xs text-muted-foreground">{m.score.home}-{m.score.away}</span>}</td>
                  <td className="num whitespace-nowrap px-3 py-2.5 text-xs">{fmtDateTime(m.kickoff)}</td>
                  <td className="px-3 py-2.5"><Badge>{m.status}</Badge></td>
                  <td className="px-3 py-2.5">{m.isDemo ? <Badge tone="warning">Démo</Badge> : <span className="text-xs">{m.source}</span>}</td>
                  <td className="px-3 py-2.5">{m.statsAvailable ? <Badge tone="success">Oui</Badge> : <Badge>Non</Badge>}</td>
                  <td className="px-3 py-2.5">{a ? <StatusBadge status={a.status} /> : <Badge>—</Badge>}</td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>
    </>
  );
}
