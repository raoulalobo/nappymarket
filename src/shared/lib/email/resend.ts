/**
 * resend.ts — Instance Resend singleton pour l'envoi d'emails
 *
 * Role : Fournir une instance unique du client Resend pour tout le projet.
 *        Retourne null si RESEND_API_KEY n'est pas configuree (dev/test).
 *
 * Interactions :
 *   - Utilise par send-email.ts pour envoyer les emails transactionnels
 *   - En dev sans API key, les emails sont logges en console
 *
 * Exemple :
 *   import { resend } from "@/shared/lib/email/resend"
 *   if (resend) await resend.emails.send({ ... })
 */
import { Resend } from "resend"

/**
 * Instance Resend initialisee avec la cle API.
 * Retourne null si RESEND_API_KEY n'est pas definie.
 */
export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null
