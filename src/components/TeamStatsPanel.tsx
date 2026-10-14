import { computeProbabilities, computeTeamStats, dec, pct } from "@/lib/stats";
import { MODEL_TEXT, REASON_TEXT } from "@/lib/stats-text";
import type { Match, TeamHistory } from "@/lib/types";
import { Badge, Bar, Card, Empty } from "./kit";
import { cn } from "@/lib/utils";

export function TeamStatsPanel({ team, history, before }: { team: string; history?: TeamHistory; before?: string }) {
  const s = computeTeamStats(history, { before });
  if (!s || !history) return <Card title={team}><Empty title="Statistiques non disponibles" text="Aucun match antérieur connu pour cette équipe. Rien n'est estimé." /></Card>;
  return (
    <Card title={team} action={<div className="flex gap-1"><Badge>Échantillon : {s.played} match{s.played > 1 ? "s" : ""}</Badge>{history.isDemo && <Badge tone="warning">Démo</Badge>}</div>}>
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
      <p className="mt-4 text-[11px] text-muted-foreground">{MODEL_TEXT.frequencies}</p>
      <div className="mt-2 space-y-3">
        <Bar label={`Plus de 1,5 but (${Math.round(s.over15 * s.played)}/${s.played})`} value={s.over15} />
        <Bar label={`Plus de 2,5 buts (${Math.round(s.over25 * s.played)}/${s.played})`} value={s.over25} />
        <Bar label={`Les deux équipes marquent (${Math.round(s.btts * s.played)}/${s.played})`} value={s.btts} />
        <Bar label={`Sans but encaissé (${Math.round(s.cleanSheet * s.played)}/${s.played})`} value={s.cleanSheet} />
      </div>
      <details className="mt-4 text-xs">
        <summary className="cursor-pointer text-muted-foreground">Matchs utilisés</summary>
        <ul className="mt-2 space-y-1">
          {s.games.map((g, i) => (
            <li key={i} className="flex justify-between"><span>{g.date} · {g.venue === "D" ? "vs" : "@"} {g.opponent}</span><span className="num">{g.gf}-{g.ga}</span></li>
          ))}
        </ul>
      </details>
    </Card>
  );
}

export function ProbabilitiesNotice({ match, histories }: { match: Match; histories: TeamHistory[] }) {
  const r = computeProbabilities(histories.find((h) => h.team === match.home), histories.find((h) => h.team === match.away), match.kickoff);
  if (!r.ok) {
    return (
      <Card title={MODEL_TEXT.unavailable}>
        <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">{r.reasons.map((x) => <li key={x}>{REASON_TEXT[x]}</li>)}</ul>
        <p className="mt-2 text-xs text-muted-foreground">Échantillons : {r.homePlayed} / {r.awayPlayed} matchs.</p>
      </Card>
    );
  }
  const v = r.value, t = v.trace;
  return (
    <Card title={MODEL_TEXT.title} action={match.isDemo ? <Badge tone="warning">Démo</Badge> : undefined}>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[["1", v.homeWin], ["N", v.draw], ["2", v.awayWin]].map(([l, p]) => (
          <div key={l as string} className="rounded-lg bg-muted/50 p-2"><dd className="num text-lg font-semibold">{pct(p as number)}</dd><dt className="text-[11px] text-muted-foreground">{l}</dt></div>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        <Bar label="Plus de 1,5 but" value={v.over15} />
        <Bar label="Plus de 2,5 buts" value={v.over25} />
        <Bar label="Les deux équipes marquent" value={v.btts} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Score le plus probable : <span className="num text-foreground">{v.mostLikelyScore.home}-{v.mostLikelyScore.away}</span> ({pct(v.mostLikelyScore.p)})</p>
      <details className="mt-3 text-xs">
        <summary className="cursor-pointer text-muted-foreground">Traçabilité du calcul</summary>
        <div className="mt-2 space-y-1 text-muted-foreground">
          <p>Modèle : {t.model} · matchs antérieurs au {t.cutoff.slice(0, 10)}</p>
          <p>Buts attendus : {match.home} <span className="num text-foreground">{dec(v.lambdaHome)}</span> = ({dec(t.inputs.homeAttack)} + {dec(t.inputs.awayDefence)}) / 2</p>
          <p>Buts attendus : {match.away} <span className="num text-foreground">{dec(v.lambdaAway)}</span> = ({dec(t.inputs.awayAttack)} + {dec(t.inputs.homeDefence)}) / 2</p>
          <p>{match.home} : {t.homeSample.played} matchs ({t.homeSample.usedVenueSplit ? `${t.homeSample.venueGames} à domicile` : "moyenne globale"}), du {t.homeSample.dates.at(-1)} au {t.homeSample.dates[0]}</p>
          <p>{match.away} : {t.awaySample.played} matchs ({t.awaySample.usedVenueSplit ? `${t.awaySample.venueGames} à l'extérieur` : "moyenne globale"}), du {t.awaySample.dates.at(-1)} au {t.awaySample.dates[0]}</p>
          <p>Couverture de la grille 0–10 buts : {(t.coverage * 100).toFixed(3).replace(".", ",")} %</p>
          <p className="pt-1">{MODEL_TEXT.method}</p>
        </div>
      </details>
      <p className="mt-3 text-[11px] text-muted-foreground">{MODEL_TEXT.disclaimer}</p>
    </Card>
  );
}
