/**
 * AuthLayout — Layout des pages d'authentification
 *
 * Role : Wrapper minimal pour les pages auth. Le layout visuel
 *        (Split Screen) est gere par AuthPageShell dans chaque page
 *        pour permettre une image differente par page.
 *
 * Interactions :
 *   - Enveloppe /connexion, /inscription, /mot-de-passe-oublie,
 *     /reinitialiser-mot-de-passe
 *   - Pas de Header/Footer complet (experience epuree)
 *   - Le logo et le centrage sont geres par AuthPageShell
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
