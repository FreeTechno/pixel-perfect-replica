import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { seo } from "@/lib/seo";
import { Badge, Button, Card, PageHeader } from "@/components/kit";

export const Route = createFileRoute("/parametres")({
  head: () => seo("Paramètres et sources de données", "Configuration régionale et sources de données."),
  component: Settings,
});

const sources = [
  { name: "Données de démonstration", status: "Active", tone: "warning" as const, text: "Matchs et historiques fictifs pour tester l'interface." },
  { name: "Import CSV", status: "Active", tone: "success" as const, text: "Ajout manuel de matchs par fichier." },
  { name: "API sportive gratuite", status: "Non connectée", tone: "neutral" as const, text: "À choisir et connecter dans une prochaine étape." },
];

function Settings() {
  const { resetDemo, clearDemo } = useStore();
  return (
    <>
      <PageHeader title="Paramètres et sources de données" />
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Région">
          <dl className="space-y-2 text-sm">
            {[["Langue", "Français"], ["Devise", "FCFA (XOF)"], ["Fuseau horaire", "Africa/Porto-Novo (UTC+1)"]].map(([k, v]) => (
              <div key={k} className="flex justify-between"><dt className="text-muted-foreground">{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
        </Card>
        <Card title="Stockage">
          <p className="text-sm text-muted-foreground">Les données de démonstration restent dans ce navigateur. Les données réelles sont enregistrées en ligne et réservées à l'administrateur. Ces boutons ne touchent que la démo.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => { clearDemo(); toast.success("Données de démonstration supprimées"); }}>Supprimer la démo</Button>
            <Button variant="danger" onClick={() => { if (confirm("Tout réinitialiser avec les données de démonstration ?")) { resetDemo(); toast.success("Réinitialisé"); } }}>Réinitialiser</Button>
          </div>
        </Card>
        <Card title="Sources de données" className="md:col-span-2">
          <ul className="divide-y">
            {sources.map((s) => (
              <li key={s.name} className="flex items-start justify-between gap-3 py-3">
                <div><p className="text-sm font-medium">{s.name}</p><p className="text-xs text-muted-foreground">{s.text}</p></div>
                <Badge tone={s.tone}>{s.status}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
