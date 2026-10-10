export const TZ = "Africa/Porto-Novo";

export const fmtDateTime = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

export const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, dateStyle: "long" }).format(new Date(iso));

export const fmtXOF = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(n);
