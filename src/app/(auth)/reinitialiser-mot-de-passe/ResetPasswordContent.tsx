/**
 * ResetPasswordContent — Wrapper client pour extraire le token des searchParams
 *
 * Role : Lire le token de reinitialisation depuis l'URL (?token=xxx)
 *        et le transmettre au composant ResetPasswordForm.
 *        Separe du page.tsx car useSearchParams() necessite "use client".
 *
 * Interactions :
 *   - useSearchParams() lit le query param "token" dans l'URL
 *   - Passe le token a ResetPasswordForm qui gere le formulaire
 *   - Enveloppe dans un <Suspense> dans page.tsx (requis par Next.js)
 */
"use client"

import { useSearchParams } from "next/navigation"
import { ResetPasswordForm } from "@/modules/auth/components/ResetPasswordForm"

export function ResetPasswordContent() {
  const searchParams = useSearchParams()
  // Better Auth ajoute le token en query param : ?token=xxx
  const token = searchParams.get("token")

  return <ResetPasswordForm token={token} />
}
