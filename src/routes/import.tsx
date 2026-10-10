import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { seo } from "@/lib/seo";
import { fmtDateTime } from "@/lib/format";
import { CSV_TEMPLATE, parseMatchesCsv, type CsvResult } from "@/lib/csv";
import { Button, Card, PageHeader, Table } from "@/components/kit";
import { Upload } from "lucide-react";

export const Route = createFileRoute("/import")({
  head: () => seo("Import des données CSV", "Importer des matchs depuis un fichier CSV."),
  component: ImportPage,
});

function ImportPage() {
  const { importMatches } = useStore();
  const [res, setRes] = useState<CsvResult | null>(null);

  const onFile = async (f?: File) => { if (f) setRes(parseMatchesCsv(await f.text())); };
  const template = () => {
    const url = URL.createObjectURL(new Blob(["\ufeff" + CSV_TEMPLATE], { type: "text/csv" }));
    Object.assign(document.createElement("a"), { href: url, download: "modele-matchs.csv" }).click();
  };

  return (
    <>
      <PageHeader title="Import des données CSV" description="Colonnes : championnat, domicile, exterieur, date (AAAA-MM-JJ), heure (HH:MM, Porto-Novo), source." actions={<Button variant="secondary" onClick={template}>Télécharger le modèle</Button>} />
      <Card>
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center hover:bg-accent/30">
          <Upload className="h-7 w-7 text-muted-foreground" />
          <p className="mt-2 text-sm">Choisir un fichier .csv</p>
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        {res && (
          <div className="mt-5 space-y-4">
            {res.errors.length > 0 && <ul className="space-y-1 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{res.errors.map((e) => <li key={e}>{e}</li>)}</ul>}
            {res.matches.length > 0 && (
              <>
                <Table head={["Championnat", "Match", "Date", "Source"]}>
                  {res.matches.map((m) => <tr key={m.id}><td className="px-3 py-2">{m.league}</td><td className="px-3 py-2">{m.home} – {m.away}</td><td className="num px-3 py-2 text-xs">{fmtDateTime(m.kickoff)}</td><td className="px-3 py-2 text-xs">{m.source}</td></tr>)}
                </Table>
                <Button onClick={() => { importMatches(res.matches); toast.success(`${res.matches.length} match(s) importé(s)`); setRes(null); }}>Importer {res.matches.length} match(s)</Button>
              </>
            )}
          </div>
        )}
      </Card>
    </>
  );
}
