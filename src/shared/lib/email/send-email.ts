/**
 * send-email.ts — Helper generique pour l'envoi d'emails transactionnels
 *
 * Role : Fournir des fonctions d'envoi d'emails pour les reservations
 *        (confirmation, annulation). Echoue silencieusement si la cle
 *        Resend n'est pas configuree (dev/test).
 *
 * Interactions :
 *   - Utilise l'instance Resend de resend.ts
 *   - Appele par booking-actions.ts apres createBooking et updateBookingStatus
 *   - Les templates sont dans templates/ (React Email)
 *
 * Exemple :
 *   await sendBookingConfirmation(bookingWithDetails)
 *   await sendBookingCancellation(bookingWithDetails)
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
