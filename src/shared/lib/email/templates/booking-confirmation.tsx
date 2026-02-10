/**
 * BookingConfirmationEmail — Template email de confirmation de reservation
 *
 * Role : Email envoye a la cliente apres creation d'une reservation.
 *        Affiche les details complets de la prestation reservee.
 *
 * Interactions :
 *   - Rendu par Resend via la propriete `react:` dans send-email.ts
 *   - Declenche apres createBooking() dans booking-actions.ts
 *
 * Exemple :
 *   <BookingConfirmationEmail
 *     clientName="Marie Dupont"
 *     stylistName="Awa Diallo"
 *     serviceName="Tresses collees"
 *     date="7 fevrier 2026"
 *     time="14h30"
 *     address="12 rue de la Paix"
 *     city="Paris"
 *     price="45,00 EUR"
 *   />
 */
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Preview,
  Img,
} from "@react-email/components"

/** Props du template de confirmation */
interface BookingConfirmationEmailProps {
  clientName: string    // Prenom + nom de la cliente
  stylistName: string   // Prenom + nom de la coiffeuse
  serviceName: string   // Nom de la prestation (ex: "Tresses collees")
  date: string          // Date formatee (ex: "7 fevrier 2026")
  time: string          // Heure formatee (ex: "14h30")
  address: string       // Adresse de la prestation (domicile cliente)
  city?: string         // Ville (optionnel, ajoute apres l'adresse)
  price: string         // Prix formate (ex: "45,00 EUR")
  notes?: string        // Notes de la cliente (optionnel)
}

export default function BookingConfirmationEmail({
  clientName,
  stylistName,
  serviceName,
  date,
  time,
  address,
  city,
  price,
  notes,
}: BookingConfirmationEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      {/* Texte d'apercu visible dans la boite de reception */}
      <Preview>
        Votre reservation pour {serviceName} le {date} est confirmee
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* En-tete avec logo NappyMarket */}
          <Section style={header}>
            <Text style={logoText}>NappyMarket</Text>
          </Section>

          {/* Titre principal */}
          <Text style={title}>Reservation confirmee !</Text>

          {/* Message d'accueil */}
          <Text style={text}>Bonjour {clientName},</Text>
          <Text style={text}>
            Votre reservation a bien ete enregistree. Voici le recapitulatif :
          </Text>

          {/* Bloc details de la reservation */}
          <Section style={detailsBox}>
            <Text style={detailRow}>
              <span style={detailLabel}>Coiffeuse :</span> {stylistName}
            </Text>
            <Text style={detailRow}>
              <span style={detailLabel}>Prestation :</span> {serviceName}
            </Text>
            <Text style={detailRow}>
              <span style={detailLabel}>Date :</span> {date}
            </Text>
            <Text style={detailRow}>
              <span style={detailLabel}>Heure :</span> {time}
            </Text>
            <Text style={detailRow}>
              <span style={detailLabel}>Adresse :</span> {address}
              {city ? `, ${city}` : ""}
            </Text>
            <Text style={detailRow}>
              <span style={detailLabel}>Prix :</span> {price}
            </Text>
          </Section>

          {/* Notes de la cliente (si presentes) */}
          {notes && (
            <Section style={notesBox}>
              <Text style={notesLabel}>Notes :</Text>
              <Text style={notesText}>{notes}</Text>
            </Section>
          )}

          <Text style={text}>
            Votre coiffeuse se deplacera a l&apos;adresse indiquee le jour du rendez-vous.
          </Text>

          <Hr style={hr} />

          {/* Footer */}
          <Text style={footer}>
            A bientot sur NappyMarket !
          </Text>
          <Text style={footerSmall}>
            Cet email a ete envoye automatiquement. Merci de ne pas y repondre.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

/* ------------------------------------------------------------------ */
/* Styles inline (React Email utilise des styles inline pour la       */
/* compatibilite avec tous les clients email)                         */
/* ------------------------------------------------------------------ */

const main = {
  backgroundColor: "#f4f4f7",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
}

const container = {
  margin: "0 auto",
  padding: "24px",
  maxWidth: "580px",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
}

/** En-tete violet NappyMarket */
const header = {
  backgroundColor: "#7c3aed",
  borderRadius: "8px 8px 0 0",
  padding: "24px",
  marginBottom: "24px",
  textAlign: "center" as const,
}

/** Logo texte en blanc sur fond violet */
const logoText = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "700" as const,
  margin: "0",
}

/** Titre principal */
const title = {
  fontSize: "22px",
  fontWeight: "600" as const,
  color: "#1a1a2e",
  marginBottom: "16px",
}

/** Texte courant */
const text = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#374151",
  marginBottom: "12px",
}

/** Bloc encadre contenant les details de la reservation */
const detailsBox = {
  backgroundColor: "#f9f5ff",
  borderLeft: "4px solid #7c3aed",
  borderRadius: "4px",
  padding: "16px",
  marginBottom: "20px",
}

/** Ligne de detail (ex: "Coiffeuse : Awa Diallo") */
const detailRow = {
  fontSize: "15px",
  lineHeight: "26px",
  color: "#374151",
  margin: "0",
}

/** Label en gras dans une ligne de detail */
const detailLabel = {
  fontWeight: "600" as const,
  color: "#1a1a2e",
}

/** Bloc des notes (fond jaune clair) */
const notesBox = {
  backgroundColor: "#fffbeb",
  borderRadius: "4px",
  padding: "12px 16px",
  marginBottom: "20px",
}

const notesLabel = {
  fontSize: "14px",
  fontWeight: "600" as const,
  color: "#92400e",
  margin: "0 0 4px 0",
}

const notesText = {
  fontSize: "14px",
  fontStyle: "italic" as const,
  color: "#78350f",
  margin: "0",
}

/** Separateur horizontal */
const hr = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
}

/** Footer standard */
const footer = {
  fontSize: "14px",
  color: "#6b7280",
  marginBottom: "4px",
}

/** Footer petit texte */
const footerSmall = {
  fontSize: "12px",
  color: "#9ca3af",
}
