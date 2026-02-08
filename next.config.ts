/**
 * next.config.ts — Configuration Next.js
 *
 * Role : Configurer le comportement de Next.js (images, redirections, etc.)
 *
 * Interactions :
 *   - Turbopack est active par defaut via le script `pnpm dev`
 *   - Les images Supabase Storage sont autorisees via remotePatterns
 */
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Resoudre le warning workspace root (lockfile parent detecte)
  turbopack: {
    root: __dirname,
  },

  // Autoriser les images depuis Supabase Storage
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dqplvyzdxouuuyxkaaas.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
}

export default nextConfig
