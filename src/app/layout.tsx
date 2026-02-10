/**
 * RootLayout — Layout racine de l'application NappyMarket
 *
 * Role : Definir la structure HTML de base, les polices, les metadata SEO,
 *        et les providers globaux (QueryProvider, Toaster).
 *
 * Interactions :
 *   - Enveloppe toutes les pages de l'application
 *   - Fournit le QueryProvider (TanStack Query) pour le cache et les queries
 *   - Fournit le Toaster (sonner) pour les notifications toast
 *   - Definit la langue francaise et les polices Google (Geist)
 */
import type { Metadata } from "next"
import { Poppins, Open_Sans } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { QueryProvider } from "@/shared/lib/query-provider"
import { APP_NAME, APP_DESCRIPTION } from "@/shared/lib/constants"
import "./globals.css"

// Police titres : Poppins — moderne, arrondie et chaleureuse
const poppins = Poppins({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

// Police corps : Open Sans — lisible, professionnelle et accessible
const openSans = Open_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
})

// Metadata SEO globales (surchargees par chaque page via generateMetadata)
export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    "coiffure afro",
    "coiffeuse a domicile",
    "tresses",
    "locks",
    "tissage",
    "marketplace coiffure",
    "coiffure Paris",
    "coiffure France",
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${poppins.variable} ${openSans.variable} font-sans antialiased`}
      >
        {/* QueryProvider : cache TanStack Query + DevTools en dev */}
        <QueryProvider>
          {children}
        </QueryProvider>
        {/* Notifications toast (succes, erreur, info) */}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
