import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { seo } from "@/lib/seo";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { generateEbookPdf } from "@/lib/pdf";
import { Badge, Button, Card, Empty, PageHeader, Table } from "@/components/kit";

export const Route = createFileRoute("/historique")({
  head: () => seo("Historique des publications", "Archive des rapports PDF générés et publiés."),
  component: Historique,
});

function Historique() {
  const { data, publishEbook } = useStore();
  return (
    <>
      <PageHeader title="Historique des publications" description="Marquez un rapport comme publié une fois mis en vente sur Chariow (manuel)." />
      <Card>
        {data.ebooks.length === 0 ? <Empty title="Aucun rapport généré" action={<Link to="/ebooks" className="text-sm text-primary">Créer un ebook</Link>} /> : (
          <Table head={["Titre", "Publication", "Analyses", "Créé le", "Statut", ""]}>
            {data.ebooks.map((e) => (
              <tr key={e.id}>
                <td className="px-3 py-2.5 font-medium">{e.title}</td>
                <td className="px-3 py-2.5 text-xs">{fmtDate(e.publicationDate)}</td>
                <td className="num px-3 py-2.5">{e.analysisIds.length}</td>
                <td className="num px-3 py-2.5 text-xs">{fmtDateTime(e.createdAt)}</td>
                <td className="px-3 py-2.5">{e.status === "publié" ? <Badge tone="success">Publié</Badge> : <Badge>Généré</Badge>}</td>
                <td className="px-3 py-2.5"><div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => generateEbookPdf(e, data)}>Télécharger</Button>
                  {e.status !== "publié" && <Button variant="secondary" onClick={() => { publishEbook(e.id); toast.success("Rapport marqué comme publié"); }}>Marquer publié</Button>}
                </div></td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
