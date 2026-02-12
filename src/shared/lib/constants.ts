/**
 * constants.ts — Constantes globales du projet
 *
 * Role : Centraliser les valeurs constantes utilisees dans tout le projet.
 * Modifier ici pour changer le comportement global (commission, limites, etc.)
 */

/** Nom de l'application */
export const APP_NAME = "NappyMarket"

/** Description de l'application (SEO) */
export const APP_DESCRIPTION =
  "Trouvez une coiffeuse afro pres de chez vous. Prestations a domicile dans toute la France."

/** Commission plateforme en pourcentage (ex: 15 = 15%) */
export const PLATFORM_COMMISSION_PERCENT = 15

/** Rayon de recherche par defaut en km */
export const DEFAULT_SEARCH_RADIUS_KM = 10

/** Rayon de recherche maximum en km */
export const MAX_SEARCH_RADIUS_KM = 50

/** Nombre maximum de photos dans le portfolio */
export const MAX_PORTFOLIO_IMAGES = 20

/** Taille maximum d'une image uploadee en octets (5 Mo) */
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

/** Types de fichiers acceptes pour les images */
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]

/** Duree minimale d'une prestation en minutes */
export const MIN_SERVICE_DURATION_MINUTES = 30

/** Duree maximale d'une prestation en minutes (8h) */
export const MAX_SERVICE_DURATION_MINUTES = 480

/** Nombre de resultats de recherche par page */
export const SEARCH_RESULTS_PER_PAGE = 12

/* ------------------------------------------------------------------ */
/* Phase 5 — Disponibilites & Reservation                              */
/* ------------------------------------------------------------------ */

/** Delai minimum avant une prestation en heures (ex: 24 = min 24h avant) */
export const MIN_BOOKING_LEAD_TIME_HOURS = 24

/** Nombre maximum de jours a l'avance pour reserver (60 jours) */
export const MAX_BOOKING_ADVANCE_DAYS = 60

/** Granularite des creneaux de disponibilite en minutes (30 min) */
export const BOOKING_SLOT_INTERVAL_MINUTES = 30

/**
 * Noms des jours de la semaine en francais.
 * Index 0 = Dimanche, 1 = Lundi, ..., 6 = Samedi
 * (alignes sur Date.getDay() et le champ dayOfWeek du schema Prisma)
 */
export const DAYS_OF_WEEK_FR = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
] as const

/**
 * Abbreviations des jours (3 lettres) pour les affichages compacts.
 * Index 0 = Dim, 1 = Lun, ..., 6 = Sam
 */
export const DAYS_OF_WEEK_SHORT_FR = [
  "Dim",
  "Lun",
  "Mar",
  "Mer",
  "Jeu",
  "Ven",
  "Sam",
] as const

/* ------------------------------------------------------------------ */
/* Avis / Reviews                                                      */
/* ------------------------------------------------------------------ */

/** Nombre d'avis par page dans les listes paginées */
export const REVIEWS_PER_PAGE = 10

/** Longueur maximale du commentaire d'un avis (caractères) */
export const MAX_REVIEW_COMMENT_LENGTH = 1000

/** Seuil de note moyenne pour afficher le badge "Top notee" (>= 4/5) */
export const TOP_RATED_THRESHOLD = 4
