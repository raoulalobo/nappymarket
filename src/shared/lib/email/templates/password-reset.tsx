/**
 * PasswordResetEmail — Template email de reinitialisation de mot de passe
 *
 * Role : Email envoye quand un utilisateur demande a reinitialiser son
 *        mot de passe via Better Auth. Contient un bouton CTA avec le
 *        lien de reinitialisation (token unique, expire en 1h).
 *
 * Interactions :
 *   - Rendu par Resend via la propriete `react:` dans send-email.ts
 *   - Declenche par le callback sendResetPassword de Better Auth (auth.ts)
 *
 * Exemple :
 *   <PasswordResetEmail
 *     resetUrl="https://nappymarket.store/reinitialiser-mot-de-passe?token=abc123"
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

/** Props du template de reinitialisation */
interface PasswordResetEmailProps {
  resetUrl: string  // URL avec token genere par Better Auth
}

export default function PasswordResetEmail({
  resetUrl,
}: PasswordResetEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      {/* Texte d'apercu visible dans la boite de reception */}
      <Preview>
        Reinitialisation de votre mot de passe NappyMarket
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* En-tete avec logo NappyMarket */}
          <Section style={header}>
            <Text style={logoText}>NappyMarket</Text>
          </Section>

          {/* Titre principal */}
          <Text style={title}>Reinitialisation de mot de passe</Text>

          {/* Message explicatif */}
          <Text style={text}>Bonjour,</Text>
          <Text style={text}>
            Vous avez demande la reinitialisation de votre mot de passe
            NappyMarket. Cliquez sur le bouton ci-dessous pour choisir
            un nouveau mot de passe :
          </Text>

          {/* Bouton CTA principal */}
          <Section style={ctaSection}>
            <Button style={ctaButton} href={resetUrl}>
              Reinitialiser mon mot de passe
            </Button>
          </Section>

          {/* Note d'expiration */}
          <Text style={textMuted}>
            Ce lien expire dans 1 heure. Si vous n&apos;avez pas fait cette
            demande, ignorez simplement cet email.
          </Text>

          {/* Lien de secours en texte brut */}
          <Section style={fallbackSection}>
            <Text style={fallbackLabel}>
              Si le bouton ne fonctionne pas, copiez-collez ce lien dans
              votre navigateur :
            </Text>
            <Text style={fallbackUrl}>{resetUrl}</Text>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Text style={footer}>
            L&apos;equipe NappyMarket
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

/** Texte attenue (note expiration) */
const textMuted = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#6b7280",
  marginBottom: "20px",
}

/** Section du bouton CTA centree */
const ctaSection = {
  textAlign: "center" as const,
  marginTop: "24px",
  marginBottom: "24px",
}

/** Bouton CTA violet principal */
const ctaButton = {
  backgroundColor: "#D4956A",
  color: "#ffffff",
  padding: "14px 36px",
  borderRadius: "6px",
  fontWeight: "600" as const,
  fontSize: "16px",
  textDecoration: "none",
}

/** Section du lien de secours (fallback) */
const fallbackSection = {
  backgroundColor: "#f9fafb",
  borderRadius: "4px",
  padding: "12px 16px",
  marginBottom: "20px",
}

/** Label du lien de secours */
const fallbackLabel = {
  fontSize: "13px",
  color: "#6b7280",
  margin: "0 0 8px 0",
}

/** URL du lien de secours (coupure automatique) */
const fallbackUrl = {
  fontSize: "13px",
  color: "#D4956A",
  wordBreak: "break-all" as const,
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
