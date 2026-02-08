/**
 * Footer — Pied de page de l'application
 *
 * Role : Afficher les liens utiles, les informations legales
 *        et les credits en bas de chaque page.
 *
 * Interactions :
 *   - Visible sur toutes les pages publiques
 *   - Contient les liens vers CGU, politique de confidentialite (Phase 8)
 *
 * Exemple :
 *   <Footer />
 */
import Link from "next/link"
import { APP_NAME } from "@/shared/lib/constants"

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Colonne 1 : A propos */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">{APP_NAME}</h3>
            <p className="text-sm text-muted-foreground">
              La marketplace qui met en relation coiffeuses afro et clientes
              pour des prestations a domicile dans toute la France.
            </p>
          </div>

          {/* Colonne 2 : Liens utiles */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">Navigation</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/recherche" className="hover:text-foreground">
                  Trouver une coiffeuse
                </Link>
              </li>
              <li>
                <Link href="/inscription" className="hover:text-foreground">
                  Devenir coiffeuse
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 3 : Legal */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">Informations</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#" className="hover:text-foreground">
                  Conditions generales
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground">
                  Politique de confidentialite
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground">
                  Mentions legales
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t pt-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} {APP_NAME}. Tous droits reserves.
        </div>
      </div>
    </footer>
  )
}
