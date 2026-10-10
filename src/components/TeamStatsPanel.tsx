import { computeTeamStats, dec } from "@/lib/stats";
import type { TeamHistory } from "@/lib/types";
import { Badge, Bar, Card, Empty } from "./kit";
import { cn } from "@/lib/utils";

export function TeamStatsPanel({ team, history }: { team: string; history?: TeamHistory }) {
  const s = computeTeamStats(history);
  if (!s || !history) return <Card title={team}><Empty title="Statistiques non disponibles" text="Aucun historique de matchs pour cette équipe. Rien n'est estimé." /></Card>;
  return (
    <Card title={team} action={history.isDemo ? <Badge tone="warning">Démo</Badge> : undefined}>
      <div className="mb-4 flex gap-1">
        {s.form.map((f, i) => (
          <span key={i} className={cn("num flex h-6 w-6 items-center justify-center rounded text-[11px] font-semibold",
            f === "V" ? "bg-success/20 text-success" : f === "N" ? "bg-muted text-muted-foreground" : "bg-destructive/15 text-destructive")}>{f}</span>
        ))}
      </div>
      <dl className="grid grid-cols-3 gap-3 text-center">
        {[["Buts marqués", s.scored], ["Buts encaissés", s.conceded], ["Matchs", s.played]].map(([l, v]) => (
          <div key={l} className="rounded-lg bg-muted/50 p-2"><dd className="num text-lg font-semibold">{v}</dd><dt className="text-[11px] text-muted-foreground">{l}</dt></div>
        ))}
      </dl>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <p className="text-muted-foreground">Moy. marqués <span className="num ml-1 text-foreground">{dec(s.avgScored)}</span></p>
        <p className="text-muted-foreground">Moy. encaissés <span className="num ml-1 text-foreground">{dec(s.avgConceded)}</span></p>
        <p className="text-muted-foreground">Domicile ({s.home.played}) <span className="num ml-1 text-foreground">{dec(s.home.avgScored)} / {dec(s.home.avgConceded)}</span></p>
        <p className="text-muted-foreground">Extérieur ({s.away.played}) <span className="num ml-1 text-foreground">{dec(s.away.avgScored)} / {dec(s.away.avgConceded)}</span></p>
      </div>
      <div className="mt-4 space-y-3">
        <Bar label="Plus de 1,5 but" value={s.over15} />
        <Bar label="Plus de 2,5 buts" value={s.over25} />
        <Bar label="Les deux équipes marquent" value={s.btts} />
      </div>
      <details className="mt-4 text-xs">
        <summary className="cursor-pointer text-muted-foreground">Derniers matchs</summary>
        <ul className="mt-2 space-y-1">
          {history.games.map((g, i) => (
            <li key={i} className="flex justify-between"><span>{g.date} · {g.venue === "D" ? "vs" : "@"} {g.opponent}</span><span className="num">{g.gf}-{g.ga}</span></li>
          ))}
        </ul>
      </details>
    </Card>
  );
}

export function ProbabilitiesNotice() {
  return (
    <Card title="Probabilités calculées">
      <p className="text-sm text-muted-foreground">Le moteur probabiliste n'est pas encore opérationnel. Aucune probabilité n'est affichée afin de ne pas présenter de chiffres non fondés. Les pourcentages ci-dessus sont des <strong className="text-foreground">fréquences observées</strong>, pas des probabilités.</p>
    </Card>
  );
}
