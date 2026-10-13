import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/lib/store";
import { Button, Card } from "@/components/kit";

export function AuthPanel() {
  const { userEmail, isAdmin, authChecked, setMode } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signup, setSignup] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!authChecked) return <p className="text-sm text-muted-foreground">Vérification de la connexion…</p>;

  if (userEmail && !isAdmin) {
    return (
      <Card title="Accès refusé">
        <p className="text-sm text-muted-foreground">Le compte {userEmail} n'a pas les droits d'administrateur. Les données réelles ne sont pas accessibles.</p>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" onClick={() => supabase.auth.signOut()}>Se déconnecter</Button>
          <Button variant="secondary" onClick={() => setMode("demo")}>Revenir à la démo</Button>
        </div>
      </Card>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = signup
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (r.error) return toast.error(r.error.message);
    if (signup && !r.data.session) toast.success("Vérifiez votre e-mail pour confirmer le compte.");
  };

  return (
    <div className="mx-auto max-w-sm">
      <Card title={signup ? "Créer le compte administrateur" : "Connexion administrateur"}>
        <p className="mb-4 text-xs text-muted-foreground">Les données réelles sont réservées à l'administrateur. Le premier compte créé devient administrateur.</p>
        <form onSubmit={submit} className="space-y-3">
          <input type="email" required placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
          <input type="password" required minLength={8} placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
          <Button type="submit" disabled={busy} className="w-full">{signup ? "Créer le compte" : "Se connecter"}</Button>
        </form>
        <div className="mt-3 flex justify-between text-xs">
          <button className="text-primary" onClick={() => setSignup(!signup)}>{signup ? "J'ai déjà un compte" : "Créer un compte"}</button>
          <button className="text-muted-foreground" onClick={() => setMode("demo")}>Revenir à la démo</button>
        </div>
      </Card>
    </div>
  );
}
