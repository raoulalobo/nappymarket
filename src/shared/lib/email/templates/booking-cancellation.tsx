/**
 * BookingCancellationEmail — Template email d'annulation de reservation
 *
 * Role : Email envoye a la cliente apres annulation d'une reservation.
 *        Informe de l'annulation et propose de re-reserver.
 *
 * Interactions :
 *   - Rendu par Resend via la propriete `react:` dans send-email.ts
 *   - Declenche apres updateBookingStatus("CANCELLED") dans booking-actions.ts
 *
 * Exemple :
 *   <BookingCancellationEmail
 *     clientName="Marie Dupont"
 *     serviceName="Tresses collees"
 *     date="7 fevrier 2026"
 *     time="14h30"
 *   />
 */
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Preview,
} from "@react-email/components"

/** Props du template d'annulation */
interface BookingCancellationEmailProps {
  clientName: string   // Prenom + nom de la cliente
  serviceName: string  // Nom de la prestation annulee
  date: string         // Date formatee (ex: "7 fevrier 2026")
  time: string         // Heure formatee (ex: "14h30")
}

/** URL de l'application (pour le CTA de re-reservation) */
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://nappymarket.store"

export default function BookingCancellationEmail({
  clientName,
  serviceName,
  date,
  time,
}: BookingCancellationEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      {/* Texte d'apercu visible dans la boite de reception */}
      <Preview>
        Votre reservation pour {serviceName} du {date} a ete annulee
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* En-tete avec logo NappyMarket */}
          <Section style={header}>
            <Text style={logoText}>NappyMarket</Text>
          </Section>

          {/* Titre principal */}
          <Text style={title}>Reservation annulee</Text>

          {/* Message d'accueil */}
          <Text style={text}>Bonjour {clientName},</Text>
          <Text style={text}>
            Votre reservation a ete annulee. Voici les details :
          </Text>

          {/* Bloc details de la reservation annulee */}
          <Section style={detailsBox}>
            <Text style={detailRow}>
              <span style={detailLabel}>Prestation :</span> {serviceName}
            </Text>
            <Text style={detailRow}>
              <span style={detailLabel}>Date :</span> {date}
            </Text>
            <Text style={detailRow}>
              <span style={detailLabel}>Heure :</span> {time}
            </Text>
          </Section>

          <Text style={text}>
            Si un paiement avait ete effectue, le remboursement sera traite
            automatiquement sous quelques jours.
          </Text>

          {/* CTA pour re-reserver */}
          <Section style={ctaSection}>
            <Button style={ctaButton} href={`${APP_URL}/recherche`}>
              Trouver une coiffeuse
            </Button>
          </Section>

          <Text style={textMuted}>
            N&apos;hesitez pas a effectuer une nouvelle reservation sur NappyMarket.
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
/* Styles inline (compatibilite clients email)                        */
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
  backgroundColor: "#D4956A",
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

/** Texte attenue */
const textMuted = {
  fontSize: "15px",
  lineHeight: "22px",
  color: "#6b7280",
  marginBottom: "12px",
}

/** Bloc encadre contenant les details (fond rouge clair pour annulation) */
const detailsBox = {
  backgroundColor: "#fef2f2",
  borderLeft: "4px solid #ef4444",
  borderRadius: "4px",
  padding: "16px",
  marginBottom: "20px",
}

/** Ligne de detail */
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

/** Section du bouton CTA centree */
const ctaSection = {
  textAlign: "center" as const,
  marginBottom: "24px",
}

/** Bouton CTA violet (re-reserver) */
const ctaButton = {
  backgroundColor: "#D4956A",
  color: "#ffffff",
  padding: "12px 32px",
  borderRadius: "6px",
  fontWeight: "600" as const,
  fontSize: "16px",
  textDecoration: "none",
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
