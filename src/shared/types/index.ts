/**
 * Types globaux — Re-exports
 *
 * Role : Point d'entree unique pour tous les types partages.
 *
 * Exemple :
 *   import { ActionResult } from "@/shared/types"
 */

/**
 * ActionResult — Type generique pour les retours de server actions
 *
 * Standardise les reponses succes/erreur de toutes les actions serveur.
 *
 * Exemple :
 *   async function createBooking(): Promise<ActionResult<Booking>> {
 *     return { success: true, data: booking }
 *     // ou
 *     return { success: false, error: "Creneau indisponible" }
 *   }
 */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }
