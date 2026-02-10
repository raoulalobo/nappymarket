/**
 * send-email.ts — Helper generique pour l'envoi d'emails transactionnels
 *
 * Role : Fournir des fonctions d'envoi d'emails pour les reservations
 *        (confirmation, annulation) et l'authentification (reset password).
 *        Utilise les templates React Email pour un rendu professionnel.
 *        Echoue silencieusement si la cle Resend n'est pas configuree (dev/test).
 *
 * Interactions :
 *   - Utilise l'instance Resend de resend.ts
 *   - Appele par booking-actions.ts apres createBooking et updateBookingStatus
 *   - Appele par Better Auth (auth.ts) via le callback sendResetPassword
 *   - Les templates React Email sont dans templates/
 *
 * Exemple :
 *   await sendBookingConfirmation(bookingWithDetails)
 *   await sendBookingCancellation(bookingWithDetails)
 *   await sendPasswordResetEmail("user@email.com", "https://nappymarket.store/reset?token=xxx")
 */
import { resend } from "./resend"
import type { BookingWithDetails } from "@/modules/booking/types"
import { formatDate, formatTime, formatPrice } from "@/shared/lib/utils"
import BookingConfirmationEmail from "./templates/booking-confirmation"
import BookingCancellationEmail from "./templates/booking-cancellation"
import PasswordResetEmail from "./templates/password-reset"

/** Adresse email de l'expediteur (domaine verifie dans Resend) */
const FROM_EMAIL = "NappyMarket <noreply@nappymarket.store>"

/**
 * sendBookingConfirmation — Envoyer l'email de confirmation de reservation
 *
 * Envoie un email a la cliente pour confirmer la creation de la reservation.
 * Utilise le template React Email BookingConfirmationEmail pour un rendu
 * professionnel responsive. Echoue silencieusement sans API key.
 *
 * @param booking - Reservation avec details complets (client, stylist, service)
 */
export async function sendBookingConfirmation(booking: BookingWithDetails) {
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY non configuree, email de confirmation non envoye")
    return
  }

  // Nom de la coiffeuse (prenom + nom ou name fallback)
  const stylistName =
    booking.stylist.user.firstName && booking.stylist.user.lastName
      ? `${booking.stylist.user.firstName} ${booking.stylist.user.lastName}`
      : booking.stylist.user.name

  // Nom de la cliente (prenom + nom ou name fallback)
  const clientName =
    booking.client.firstName && booking.client.lastName
      ? `${booking.client.firstName} ${booking.client.lastName}`
      : booking.client.name

  // Formatage des donnees pour le template
  const dateStr = formatDate(new Date(booking.date))
  const timeStr = formatTime(booking.startTime)
  const priceStr = formatPrice(booking.totalPrice)

  try {
    // Email a la cliente avec le template React Email
    await resend.emails.send({
      from: FROM_EMAIL,
      to: booking.client.email,
      subject: `Reservation confirmee — ${booking.service.category.name}`,
      react: BookingConfirmationEmail({
        clientName,
        stylistName,
        serviceName: booking.service.category.name,
        date: dateStr,
        time: timeStr,
        address: booking.address,
        city: booking.city ?? undefined,
        price: priceStr,
        notes: booking.notes ?? undefined,
      }),
    })

    console.info("[Email] Confirmation envoyee a", booking.client.email)
  } catch (error) {
    console.warn("[Email] Erreur envoi email confirmation:", error)
  }
}

/**
 * sendBookingCancellation — Envoyer l'email d'annulation de reservation
 *
 * Envoie un email a la cliente pour signaler l'annulation.
 * Utilise le template React Email BookingCancellationEmail avec un CTA
 * pour re-reserver. Echoue silencieusement sans API key.
 *
 * @param booking - Reservation avec details complets
 */
export async function sendBookingCancellation(booking: BookingWithDetails) {
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY non configuree, email d'annulation non envoye")
    return
  }

  // Nom de la cliente (prenom + nom ou name fallback)
  const clientName =
    booking.client.firstName && booking.client.lastName
      ? `${booking.client.firstName} ${booking.client.lastName}`
      : booking.client.name

  const dateStr = formatDate(new Date(booking.date))
  const timeStr = formatTime(booking.startTime)

  try {
    // Email a la cliente avec le template React Email
    await resend.emails.send({
      from: FROM_EMAIL,
      to: booking.client.email,
      subject: `Reservation annulee — ${booking.service.category.name}`,
      react: BookingCancellationEmail({
        clientName,
        serviceName: booking.service.category.name,
        date: dateStr,
        time: timeStr,
      }),
    })

    console.info("[Email] Annulation envoyee a", booking.client.email)
  } catch (error) {
    console.warn("[Email] Erreur envoi email annulation:", error)
  }
}

/**
 * sendPasswordResetEmail — Envoyer l'email de reinitialisation de mot de passe
 *
 * Envoie un lien de reinitialisation genere par Better Auth.
 * Utilise le template React Email PasswordResetEmail avec bouton CTA
 * et lien de secours en texte brut. Echoue silencieusement sans API key.
 *
 * @param email - Adresse email de l'utilisateur
 * @param resetUrl - URL de reinitialisation generee par Better Auth (contient le token)
 *
 * Exemple :
 *   await sendPasswordResetEmail("user@email.com", "https://nappymarket.store/reinitialiser-mot-de-passe?token=abc123")
 */
export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  console.info("[Email] sendPasswordResetEmail() appelee — to:", email, "| url:", resetUrl)

  if (!resend) {
    console.error("[Email] RESEND_API_KEY non configuree ! resend est null. Email de reinitialisation non envoye.")
    console.error("[Email] RESEND_API_KEY presente:", !!process.env.RESEND_API_KEY)
    return
  }

  try {
    // Email avec le template React Email
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Reinitialiser votre mot de passe — NappyMarket",
      react: PasswordResetEmail({ resetUrl }),
    })

    console.info("[Email] Reinitialisation envoyee a", email, "| Resend response:", JSON.stringify(result))
  } catch (error) {
    console.error("[Email] ECHEC envoi email reinitialisation:", error)
  }
}
