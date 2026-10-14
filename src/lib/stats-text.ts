// Textes explicatifs, séparés des calculs.
import type { InsufficientReason } from "./stats";
import { MIN_GAMES, MIN_VENUE_GAMES } from "./stats";

export const REASON_TEXT: Record<InsufficientReason, string> = {
  "historique-domicile-insuffisant": `Moins de ${MIN_GAMES} matchs antérieurs connus pour l'équipe à domicile.`,
  "historique-exterieur-insuffisant": `Moins de ${MIN_GAMES} matchs antérieurs connus pour l'équipe à l'extérieur.`,
  "lambda-nul": "Une moyenne de buts attendue est nulle : le modèle ne peut pas produire d'estimation fiable.",
};

export const MODEL_TEXT = {
  title: "Probabilités estimées (modèle de Poisson)",
  method: `Buts attendus = moyenne entre l'attaque d'une équipe et la défense adverse, calculées sur les 10 derniers matchs joués avant le coup d'envoi. La séparation domicile/extérieur est utilisée si au moins ${MIN_VENUE_GAMES} matchs sont disponibles, sinon la moyenne globale.`,
  disclaimer: "Estimations statistiques, pas des certitudes. Aucun gain n'est garanti.",
  unavailable: "Probabilités non calculées",
  frequencies: "Fréquences observées sur l'échantillon (pas des probabilités).",
};
