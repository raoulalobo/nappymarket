/**
 * /api/contact — Endpoint d'envoi du formulaire de contact
 *
 * Role : Valider les champs du formulaire de contact (email, telephone, message)
 *        et envoyer un email a contact@nappymarket.store via Resend.
 *
 * Interactions :
 *   - Appelee par le composant ContactModal (Client Component) via fetch
 *   - Utilise l'instance Resend singleton de src/shared/lib/email/resend.ts
 *   - Action publique : pas de verification d'authentification (formulaire visiteur)
 *
 * Securite :
 *   - Validation stricte Zod (email format, longueurs min/max)
 *   - Pas d'injection HTML possible (contenu echappe dans le corps de l'email)
 *   - Rate limiting : non implemente en MVP (a ajouter en Phase 8+)
 *
 * Exemple de requete :
 *   POST /api/contact
 *   { "email": "user@email.com", "phone": "06 12 34 56 78", "message": "Bonjour..." }
 *
 * Exemple de reponse succes :
 *   200 { "success": true }
 *
 * Exemple de reponse erreur :
 *   400 { "error": "Champs invalides" }
 *   500 { "error": "Erreur lors de l'envoi" }
 */
import { NextResponse } from "next/server"
import { z } from "zod"
import { resend } from "@/shared/lib/email/resend"

/** Adresse de destination des messages de contact */
const CONTACT_EMAIL = "contact@nappymarket.store"

/** Adresse expediteur (domaine verifie dans Resend) */
const FROM_EMAIL = "NappyMarket <noreply@nappymarket.store>"

/**
 * Schema Zod pour valider le formulaire de contact
 * Messages d'erreur en francais conformement aux conventions du projet
 */
const contactSchema = z.object({
  email: z
    .string()
    .min(1, "L'adresse email est requise")
    .email("Adresse email invalide"),
  phone: z
    .string()
    .optional()
    .transform((val) => val ?? ""),
  message: z
    .string()
    .min(10, "Le message doit contenir au moins 10 caracteres")
    .max(2000, "Le message ne peut pas depasser 2000 caracteres"),
})

export async function POST(request: Request) {
  try {
    // 1. Parser et valider le body JSON
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: "Corps de la requete invalide" },
        { status: 400 }
      )
    }

    // 2. Valider les champs avec Zod
    const parsed = contactSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Champs invalides" },
        { status: 400 }
      )
    }

    const { email, phone, message } = parsed.data

    // 3. Verifier que Resend est configure (API key presente)
    if (!resend) {
      console.warn("[Contact] RESEND_API_KEY non configuree — email non envoye")
      // En dev sans API key : simuler le succes pour tester le formulaire
      return NextResponse.json({ success: true })
    }

    // 4. Construire le corps de l'email (HTML simple, pas de template React)
    //    Contenu echappe pour eviter tout XSS dans le corps HTML
    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a; border-bottom: 2px solid #f4a261; padding-bottom: 8px;">
          Nouveau message de contact — NappyMarket
        </h2>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px; font-weight: 600; color: #555; width: 120px;">Email</td>
            <td style="padding: 8px; color: #1a1a1a;">${escapeHtml(email)}</td>
          </tr>
          ${phone ? `
          <tr>
            <td style="padding: 8px; font-weight: 600; color: #555;">Téléphone</td>
            <td style="padding: 8px; color: #1a1a1a;">${escapeHtml(phone)}</td>
          </tr>
          ` : ""}
        </table>

        <div style="background: #f9f9f9; border-left: 4px solid #f4a261; padding: 16px; margin: 16px 0; border-radius: 4px;">
          <p style="font-weight: 600; color: #555; margin: 0 0 8px 0;">Message</p>
          <p style="color: #1a1a1a; white-space: pre-wrap; margin: 0;">${escapeHtml(message)}</p>
        </div>

        <p style="color: #888; font-size: 12px; margin-top: 24px;">
          Message recu via le formulaire de contact de NappyMarket.
        </p>
      </div>
    `

    // 5. Envoyer l'email via Resend
    await resend.emails.send({
      from: FROM_EMAIL,
      to: CONTACT_EMAIL,
      // Mettre l'email de l'expediteur en reply-to pour repondre directement
      replyTo: email,
      subject: `Nouveau message de contact — NappyMarket`,
      html: htmlBody,
    })

    console.info("[Contact] Email envoye depuis", email)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Contact] Erreur envoi email :", error)
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du message. Veuillez reessayer." },
      { status: 500 }
    )
  }
}

/**
 * escapeHtml — Echapper les caracteres HTML speciaux pour prevenir le XSS
 *
 * Remplace &, <, >, ", ' par leurs entites HTML equivalentes.
 *
 * @param text - Chaine de caracteres a echapper
 * @returns Chaine avec les caracteres speciaux echappes
 *
 * Exemple :
 *   escapeHtml('<script>alert("xss")</script>')
 *   // → '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
