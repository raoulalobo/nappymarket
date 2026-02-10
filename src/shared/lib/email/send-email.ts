/**
 * send-email.ts — Helper generique pour l'envoi d'emails transactionnels
 *
 * Role : Fournir des fonctions d'envoi d'emails pour les reservations
 *        (confirmation, annulation) et l'authentification (reset password).
 *        Echoue silencieusement si la cle Resend n'est pas configuree (dev/test).
 *
 * Interactions :
 *   - Utilise l'instance Resend de resend.ts
 *   - Appele par booking-actions.ts apres createBooking et updateBookingStatus
 *   - Appele par Better Auth (auth.ts) via le callback sendResetPassword
 *   - Les templates sont dans templates/ (React Email)
 *
 * Exemple :
 *   await sendBookingConfirmation(bookingWithDetails)
 *   await sendBookingCancellation(bookingWithDetails)
 *   await sendPasswordResetEmail("user@email.com", "https://nappymarket.fr/reset?token=xxx")
 */
import { resend } from "./resend"
import type { BookingWithDetails } from "@/modules/booking/types"
import { formatDate, formatTime, formatPrice } from "@/shared/lib/utils"

/** Adresse email de l'expediteur (domaine Resend ou onboarding) */
const FROM_EMAIL = "NappyMarket <noreply@nappymarket.fr>"

/**
 * sendBookingConfirmation — Envoyer l'email de confirmation de reservation
 *
 * Envoie un email a la cliente et a la coiffeuse pour confirmer
 * la creation de la reservation. Echoue silencieusement sans API key.
 *
 * @param booking - Reservation avec details complets
 */
export async function sendBookingConfirmation(booking: BookingWithDetails) {
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY non configuree, email de confirmation non envoye")
    return
  }

  // Nom de la coiffeuse
  const stylistName =
    booking.stylist.user.firstName && booking.stylist.user.lastName
      ? `${booking.stylist.user.firstName} ${booking.stylist.user.lastName}`
      : booking.stylist.user.name

  // Nom de la cliente
  const clientName =
    booking.client.firstName && booking.client.lastName
      ? `${booking.client.firstName} ${booking.client.lastName}`
      : booking.client.name

  const dateStr = formatDate(new Date(booking.date))
  const timeStr = formatTime(booking.startTime)
  const priceStr = formatPrice(booking.totalPrice)

  try {
    // Email a la cliente
    await resend.emails.send({
      from: FROM_EMAIL,
      to: booking.client.email,
      subject: `Reservation confirmee — ${booking.service.category.name}`,
      html: `
        <h2>Votre reservation est confirmee !</h2>
        <p>Bonjour ${clientName},</p>
        <p>Votre reservation a bien ete enregistree :</p>
        <ul>
          <li><strong>Coiffeuse :</strong> ${stylistName}</li>
          <li><strong>Prestation :</strong> ${booking.service.category.name}</li>
          <li><strong>Date :</strong> ${dateStr}</li>
          <li><strong>Heure :</strong> ${timeStr}</li>
          <li><strong>Adresse :</strong> ${booking.address}${booking.city ? `, ${booking.city}` : ""}</li>
          <li><strong>Prix :</strong> ${priceStr}</li>
        </ul>
        ${booking.notes ? `<p><em>Notes : ${booking.notes}</em></p>` : ""}
        <p>A bientot sur NappyMarket !</p>
      `,
    })

    console.info("[Email] Confirmation envoyee a", booking.client.email)
  } catch (error) {
    console.warn("[Email] Erreur envoi email confirmation:", error)
  }
}

/**
 * sendBookingCancellation — Envoyer l'email d'annulation de reservation
 *
 * Envoie un email a la cliente et a la coiffeuse pour signaler
 * l'annulation. Echoue silencieusement sans API key.
 *
 * @param booking - Reservation avec details complets
 */
export async function sendBookingCancellation(booking: BookingWithDetails) {
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY non configuree, email d'annulation non envoye")
    return
  }

  const clientName =
    booking.client.firstName && booking.client.lastName
      ? `${booking.client.firstName} ${booking.client.lastName}`
      : booking.client.name

  const dateStr = formatDate(new Date(booking.date))
  const timeStr = formatTime(booking.startTime)

  try {
    // Email a la cliente
    await resend.emails.send({
      from: FROM_EMAIL,
      to: booking.client.email,
      subject: `Reservation annulee — ${booking.service.category.name}`,
      html: `
        <h2>Reservation annulee</h2>
        <p>Bonjour ${clientName},</p>
        <p>Votre reservation du <strong>${dateStr}</strong> a <strong>${timeStr}</strong>
           pour <strong>${booking.service.category.name}</strong> a ete annulee.</p>
        <p>N'hesitez pas a effectuer une nouvelle reservation sur NappyMarket.</p>
      `,
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
 * Le lien contient un token unique avec une duree de validite limitee.
 * Echoue silencieusement sans API key (dev/test).
 *
 * @param email - Adresse email de l'utilisateur
 * @param resetUrl - URL de reinitialisation generee par Better Auth (contient le token)
 *
 * Exemple :
 *   await sendPasswordResetEmail("user@email.com", "https://nappymarket.fr/reinitialiser-mot-de-passe?token=abc123")
 */
export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY non configuree, email de reinitialisation non envoye")
    return
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Reinitialiser votre mot de passe — NappyMarket",
      html: `
        <h2>Reinitialisation de mot de passe</h2>
        <p>Bonjour,</p>
        <p>Vous avez demande la reinitialisation de votre mot de passe NappyMarket.</p>
        <p>Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe :</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}"
             style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Reinitialiser mon mot de passe
          </a>
        </p>
        <p>Si vous n'avez pas fait cette demande, ignorez simplement cet email.</p>
        <p style="color: #6b7280; font-size: 14px;">Ce lien expire dans 1 heure.</p>
        <p>L'equipe NappyMarket</p>
      `,
    })

    console.info("[Email] Reinitialisation envoyee a", email)
  } catch (error) {
    console.warn("[Email] Erreur envoi email reinitialisation:", error)
  }
}
