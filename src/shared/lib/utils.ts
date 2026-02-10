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

/* ------------------------------------------------------------------ */
/* Phase 5 — Utilitaires date/heure pour les reservations              */
/* ------------------------------------------------------------------ */

/**
 * formatDuration — Convertir une duree en minutes en format lisible
 *
 * Factorisation de la logique dupliquee dans les pages profil et services.
 *
 * Exemples :
 *   formatDuration(45)  // "45 min"
 *   formatDuration(60)  // "1h"
 *   formatDuration(90)  // "1h30"
 *   formatDuration(150) // "2h30"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  return `${hours}h${remainingMinutes.toString().padStart(2, "0")}`
}

/**
 * parseTimeToMinutes — Convertir "HH:mm" en nombre de minutes depuis minuit
 *
 * Exemples :
 *   parseTimeToMinutes("09:00") // 540
 *   parseTimeToMinutes("14:30") // 870
 *   parseTimeToMinutes("00:00") // 0
 */
export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

/**
 * formatMinutesToTime — Convertir un nombre de minutes en "HH:mm"
 *
 * Exemples :
 *   formatMinutesToTime(540)  // "09:00"
 *   formatMinutesToTime(870)  // "14:30"
 *   formatMinutesToTime(0)    // "00:00"
 */
export function formatMinutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
}

/**
 * formatDateShort — Formater une date en format court francais
 *
 * Exemples :
 *   formatDateShort(new Date("2026-01-15")) // "jeu. 15 janv."
 *   formatDateShort(new Date("2026-03-08")) // "dim. 8 mars"
 */
export function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date)
}
