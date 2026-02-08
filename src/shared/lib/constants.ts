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
