// État de l'application (stockage local du navigateur pour cette première étape).
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { createDemoData } from "./demo-data";
import type { AnalysisStatus, AppData, Ebook, Match } from "./types";

const KEY = "footdata-v1";

interface Store {
  data: AppData;
  ready: boolean;
  setAnalysisStatus: (id: string, status: AnalysisStatus) => void;
  addNote: (id: string, text: string) => void;
  updateAnalysis: (id: string, patch: { summary?: string; selection?: string }) => void;
  createAnalysis: (matchId: string) => string;
  setOutcome: (id: string, outcome: "réussie" | "échouée" | null) => void;
  addEbook: (e: Ebook) => void;
  publishEbook: (id: string) => void;
  importMatches: (m: Match[]) => void;
  resetDemo: () => void;
  clearDemo: () => void;
}

const Ctx = createContext<Store | null>(null);
const nowIso = () => new Date().toISOString();

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(createDemoData);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setData(JSON.parse(raw));
    } catch { /* données corrompues : on garde la démo */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(data));
  }, [data, ready]);

  const mapA = useCallback((id: string, fn: (a: AppData["analyses"][number]) => AppData["analyses"][number]) =>
    setData((d) => ({ ...d, analyses: d.analyses.map((a) => (a.id === id ? { ...fn(a), updatedAt: nowIso() } : a)) })), []);

  const store: Store = {
    data,
    ready,
    setAnalysisStatus: (id, status) => mapA(id, (a) => ({ ...a, status })),
    addNote: (id, text) => mapA(id, (a) => ({ ...a, notes: [...a.notes, { date: nowIso(), text }] })),
    updateAnalysis: (id, patch) => mapA(id, (a) => ({ ...a, ...patch, status: a.status === "validée" ? "à vérifier" : a.status })),
    setOutcome: (id, outcome) => mapA(id, (a) => ({ ...a, outcome })),
    createAnalysis: (matchId) => {
      const id = `a-${Date.now()}`;
      setData((d) => ({ ...d, analyses: [...d.analyses, {
        id, matchId, status: "brouillon", summary: "", selection: "", notes: [], outcome: null, updatedAt: nowIso(),
      }] }));
      return id;
    },
    addEbook: (e) => setData((d) => ({ ...d, ebooks: [e, ...d.ebooks] })),
    publishEbook: (id) => setData((d) => {
      const eb = d.ebooks.find((e) => e.id === id);
      return {
        ...d,
        ebooks: d.ebooks.map((e) => (e.id === id ? { ...e, status: "publié", publishedAt: nowIso() } : e)),
        analyses: d.analyses.map((a) => (eb?.analysisIds.includes(a.id) ? { ...a, status: "publiée" } : a)),
      };
    }),
    importMatches: (m) => setData((d) => ({
      ...d,
      matches: [...d.matches, ...m],
      lastSync: nowIso(),
      logs: [{ date: nowIso(), level: "info", message: `Import CSV : ${m.length} match(s) ajouté(s).` }, ...d.logs],
    })),
    resetDemo: () => setData(createDemoData()),
    clearDemo: () => setData((d) => {
      const keep = new Set(d.matches.filter((m) => !m.isDemo).map((m) => m.id));
      return {
        ...d,
        matches: d.matches.filter((m) => keep.has(m.id)),
        histories: d.histories.filter((h) => !h.isDemo),
        h2h: [],
        analyses: d.analyses.filter((a) => keep.has(a.matchId)),
        ebooks: [],
      };
    }),
  };

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore hors StoreProvider");
  return s;
}
