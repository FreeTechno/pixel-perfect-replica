import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { seo } from "@/lib/seo";
import { fmtDateTime } from "@/lib/format";
import { Card, Empty, PageHeader } from "@/components/kit";
import { ProbabilitiesNotice, TeamStatsPanel } from "@/components/TeamStatsPanel";

export const Route = createFileRoute("/analyses")({
  head: () => seo("Analyses statistiques", "Forme récente, buts, fréquences et confrontations des équipes."),
  component: Analyses,
});

function Analyses() {
  const { data } = useStore();
  const upcoming = data.matches.filter((m) => m.status === "à venir");
  const [sel, setSel] = useState<string | undefined>(undefined);
  const m = upcoming.find((x) => x.id === sel) ?? upcoming[0];

  return (
    <>
      <PageHeader title="Analyses statistiques" description="Statistiques descriptives calculées à partir des 10 derniers matchs disponibles." />
      {!m ? <Empty title="Aucun match à analyser" /> : (
        <>
          <Card className="mb-4">
            <select value={m.id} onChange={(e) => setSel(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
              {upcoming.map((x) => <option key={x.id} value={x.id}>{x.home} – {x.away} · {fmtDateTime(x.kickoff)}{x.isDemo ? " (démo)" : ""}</option>)}
            </select>
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            <TeamStatsPanel team={m.home} before={m.kickoff} history={data.histories.find((h) => h.team === m.home)} />
            <TeamStatsPanel team={m.away} before={m.kickoff} history={data.histories.find((h) => h.team === m.away)} />
          </div>
          <div className="mt-4"><ProbabilitiesNotice match={m} histories={data.histories} /></div>
        </>
      )}
    </>
  );
}
