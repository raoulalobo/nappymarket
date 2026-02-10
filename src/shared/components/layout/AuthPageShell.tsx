/**
 * AuthPageShell — Layout Split Screen pour les pages d'authentification
 *
 * Role : Fournir un layout 50/50 avec une image pleine hauteur a gauche
 *        et le formulaire d'authentification centre a droite.
 *        Pattern "Split Screen" (Vercel, Clerk, Linear, Notion).
 *
 * Interactions :
 *   - Utilise par les 4 pages auth : connexion, inscription,
 *     mot-de-passe-oublie, reinitialiser-mot-de-passe
 *   - Chaque page passe une image et une citation differentes
 *   - L'image est masquee sur mobile (form plein ecran)
 *   - Le logo NappyMarket renvoie vers l'accueil
 *
 * Exemple :
 *   <AuthPageShell
 *     imageSrc="/images/good-faces-3yvAe5gJ-SI-unsplash.jpg"
 *     imageAlt="Femme avec de longues box braids"
 *     quote="Retrouvez vos coiffeuses preferees"
 *   >
 *     <LoginForm />
 *   </AuthPageShell>
 */
import Image from "next/image"
import Link from "next/link"
import { APP_NAME } from "@/shared/lib/constants"

/** Props du composant AuthPageShell */
interface AuthPageShellProps {
  /** Chemin de l'image affichee dans la colonne gauche */
  imageSrc: string
  /** Texte alternatif de l'image (accessibilite) */
  imageAlt: string
  /** Citation ou accroche affichee en overlay sur l'image (optionnel) */
  quote?: string
  /** Contenu de la colonne droite (formulaire) */
  children: React.ReactNode
}

export function AuthPageShell({
  imageSrc,
  imageAlt,
  quote,
  children,
}: AuthPageShellProps) {
  return (
    <div className="flex min-h-screen">
      {/* ============================================================ */}
      {/* Colonne gauche — Image pleine hauteur (masquee sur mobile)   */}
      {/* ============================================================ */}
      <div className="relative hidden lg:block lg:w-1/2">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="50vw"
          priority
          className="object-cover"
        />

        {/* Overlay degrade + citation optionnelle en bas de l'image */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-10 pb-10 pt-24">
          {quote && (
            <blockquote className="max-w-md">
              <p className="text-xl font-medium leading-relaxed text-white">
                &laquo; {quote} &raquo;
              </p>
              <footer className="mt-3 text-sm text-white/70">
                {APP_NAME}
              </footer>
            </blockquote>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* Colonne droite — Logo + formulaire centre verticalement      */}
      {/* ============================================================ */}
      <div className="flex w-full flex-col items-center justify-center px-4 py-12 lg:w-1/2">
        {/* Logo / Nom de l'app — lien vers l'accueil */}
        <Link
          href="/"
          className="mb-8 text-2xl font-bold tracking-tight text-primary"
        >
          {APP_NAME}
        </Link>

        {/* Formulaire (enfant passe par la page) */}
        {children}
      </div>
    </div>
  )
}
