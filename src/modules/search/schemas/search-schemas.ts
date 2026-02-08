/**
 * search-schemas.ts — Schemas Zod pour la validation des filtres de recherche
 *
 * Role : Valider les donnees envoyees au serveur lors d'une recherche de coiffeuses.
 *        Utilisé coté client (formulaire) ET coté serveur (server action).
 *
 * Interactions :
 *   - Utilise par la server action searchStylists() pour valider les inputs
 *   - Les limites de rayon correspondent aux constantes de constants.ts
 *     (MAX_SEARCH_RADIUS_KM = 50)
 *
 * Exemple :
 *   const parsed = searchFiltersSchema.safeParse({
 *     city: "Paris", latitude: 48.85, longitude: 2.35,
 *     radiusKm: 10, sortBy: "distance", page: 1
 *   })
 */
import { z } from "zod"

/**
 * searchFiltersSchema — Validation des filtres de recherche geographique
 *
 * Champs :
 *   - city : nom de la ville (min 1 caractere)
 *   - latitude/longitude : coordonnees GPS du centre de recherche
 *   - radiusKm : rayon de recherche entre 1 et 50 km
 *   - categoryId : filtre optionnel par categorie de service
 *   - sortBy : tri par distance, prix croissant ou decroissant
 *   - page : numero de page (1-indexed)
 */
export const searchFiltersSchema = z.object({
  city: z
    .string()
    .min(1, "Veuillez saisir une ville"),
  latitude: z
    .number()
    .min(-90, "Latitude invalide")
    .max(90, "Latitude invalide"),
  longitude: z
    .number()
    .min(-180, "Longitude invalide")
    .max(180, "Longitude invalide"),
  radiusKm: z
    .number()
    .min(1, "Le rayon minimum est de 1 km")
    .max(50, "Le rayon maximum est de 50 km"),
  categoryId: z
    .string()
    .optional(),
  sortBy: z
    .enum(["distance", "price_asc", "price_desc"], {
      message: "Tri invalide",
    }),
  page: z
    .number()
    .int("Le numero de page doit etre un entier")
    .min(1, "Le numero de page minimum est 1"),
})

/** Type infere depuis le schema — correspond a SearchFilters dans types.ts */
export type SearchFiltersInput = z.infer<typeof searchFiltersSchema>
