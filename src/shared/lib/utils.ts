/**
 * utils.ts — Fonctions utilitaires metier partagees
 *
 * Role : Fournir des fonctions utilitaires metier utilisees partout dans le projet.
 *        Les utilitaires shadcn/ui (cn) restent dans src/lib/utils.ts
 *
 * Interactions :
 *   - formatPrice() : affichage des prix (modules payment, booking, stylist)
 *   - formatDate() : affichage des dates (modules booking, messaging)
 *   - formatTime() : affichage des heures (modules booking, stylist)
 */

/**
 * formatPrice — Formater un prix en centimes vers un affichage en euros
 *
 * Les prix sont stockes en centimes dans la BDD pour eviter les erreurs
 * d'arrondi (ex: 4500 = 45.00€).
 *
 * Exemple :
 *   formatPrice(4500)  // "45,00 €"
 *   formatPrice(3599)  // "35,99 €"
 */
export function formatPrice(priceInCents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(priceInCents / 100)
}

/**
 * formatDate — Formater une date en francais
 *
 * Exemple :
 *   formatDate(new Date())  // "7 fevrier 2026"
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

/**
 * formatTime — Formater une heure au format "HH:mm"
 *
 * Exemple :
 *   formatTime("14:30")  // "14h30"
 */
export function formatTime(time: string): string {
  return time.replace(":", "h")
}
