import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard, CalendarDays, BarChart3, ShieldCheck, BookOpen, History, TrendingUp, Upload, Settings, Menu, X, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/matchs", label: "Matchs", icon: CalendarDays },
  { to: "/analyses", label: "Analyses statistiques", icon: BarChart3 },
  { to: "/validation", label: "Validation", icon: ShieldCheck },
  { to: "/ebooks", label: "Générateur d'ebooks", icon: BookOpen },
  { to: "/historique", label: "Historique", icon: History },
  { to: "/performances", label: "Performances", icon: TrendingUp },
  { to: "/import", label: "Import CSV", icon: Upload },
  { to: "/parametres", label: "Paramètres", icon: Settings },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-0.5">
      {nav.map((n) => {
        const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
        return (
          <Link key={n.to} to={n.to} onClick={onNavigate}
            className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              active ? "bg-sidebar-accent text-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-foreground")}>
            <n.icon className={cn("h-4 w-4", active && "text-primary")} />
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2 px-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15"><Activity className="h-4 w-4 text-primary" /></div>
      <span className="font-display text-sm font-semibold">FootData Analytics</span>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-6 border-r border-sidebar-border bg-sidebar py-5 px-3 lg:flex">
        <Brand />
        <NavLinks />
        <p className="mt-auto px-3 text-[11px] leading-relaxed text-muted-foreground">Outil d'analyse statistique. Aucun résultat n'est garanti.</p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/90 px-4 backdrop-blur lg:hidden">
          <Brand />
          <button aria-label="Ouvrir le menu" onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-accent"><Menu className="h-5 w-5" /></button>
        </header>
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-background/70" onClick={() => setOpen(false)} />
            <div className="absolute inset-y-0 left-0 flex w-72 flex-col gap-6 bg-sidebar p-4">
              <div className="flex items-center justify-between"><Brand /><button aria-label="Fermer" onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-accent"><X className="h-5 w-5" /></button></div>
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
          </div>
        )}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
