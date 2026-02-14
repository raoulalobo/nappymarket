# NappyMarket — CLAUDE.md

## Description du projet

NappyMarket est une marketplace mettant en relation des **coiffeuses afro**
(etudiantes, chercheuses d'emploi, etc.) souhaitant arrondir leurs fins de mois
avec des **clientes** recherchant des prestations de coiffure afro a domicile,
partout en France.

---

## Stack Technique

| Outil                    | Role                                                    |
| ------------------------ | ------------------------------------------------------- |
| **Next.js 15**           | Framework fullstack (App Router, Server Components, RSC)|
| **Turbopack**            | Bundler dev (integre a Next.js 15, mode --turbopack)    |
| **TypeScript**           | Typage statique sur tout le projet                      |
| **pnpm**                 | Package manager (rapide, strict, economie disque)       |
| **Supabase (Cloud)**     | BDD PostgreSQL, Storage (images), Realtime (chat)       |
| **Prisma**               | ORM pour les requetes DB                                |
| **ZenStack**             | Access policies au niveau du schema Prisma              |
| **Better Auth**          | Authentification (email/password)                       |
| **TanStack Query**       | Cache serveur, fetching, synchronisation, mutations     |
| **Zustand + Immer**      | State UI client pur (filtres, modales, navigation)      |
| **Zod**                  | Validation des donnees (formulaires, API)               |
| **React Hook Form**      | Gestion des formulaires (resolver Zod natif)            |
| **Stripe + Connect**     | Paiement en ligne + commission plateforme               |
| **Tailwind CSS v4**      | Styling utilitaire                                      |
| **shadcn/ui**            | Composants UI accessibles (base Radix UI)               |
| **Leaflet + OSM**        | Carte interactive OpenStreetMap (recherche coiffeuses)  |
| **Mapbox Geocoding**     | Geocoding + autocompletion (api.mapbox.com)             |
| **Resend + React Email** | Emails transactionnels (confirmation, rappels)          |
| **Supabase Storage**     | Upload d'images (avatars, portfolio)                    |
| **Vercel**               | Deploiement + CI/CD                                     |

### Pourquoi ces choix

- **pnpm** > npm : lockfile stricte, installation 2x plus rapide, espace disque reduit
- **Turbopack** > Webpack : HMR instantane, integre a Next.js 15
- **React Hook Form** > Formik : moins de re-renders, resolver Zod natif, plus leger
- **shadcn/ui** > NextUI/Mantine : composants copy-paste, personnalisation totale, pas de lock-in
- **Supabase Storage** > UploadThing/Cloudinary : deja dans la stack, gratuit 1GB, CDN integre
- **Leaflet/OSM** > Google Maps : gratuit, open-source, pas de cle API requise
- **Mapbox Geocoding** > API Adresse Gouv : couverture mondiale, 100k req/mois gratuites, preparation internationalisation
- **Resend** > SMTP : API moderne, templates React (react.email), 3000 emails/mois gratuits
- **TanStack Query** > fetch dans useEffect : cache automatique, deduplication, revalidation,
  background refetch, optimistic updates, devtools. Zustand garde uniquement le state UI pur
- **Tests manuels pour le MVP** : pas de Vitest/Playwright au debut, tests auto en Phase 8+

---

## Agent Skills

Skills installes dans le projet pour guider le developpement avec les
bonnes pratiques officielles de chaque technologie. Chaque skill injecte
des instructions contextuelles que l'agent IA doit suivre.

### Installation

```bash
# Next.js — bonnes pratiques officielles Vercel
npx skills add https://github.com/vercel-labs/next-skills --skill next-best-practices

# React — bonnes pratiques Vercel (Server Components, hooks, patterns)
npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-best-practices

# Composition Patterns — patterns de composition avances (layouts, slots, RSC)
npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-composition-patterns

# Frontend Design — guide de design frontend Anthropic (accessibilite, UX, responsive)
npx skills add https://github.com/anthropics/skills --skill frontend-design

# Supabase/Postgres — bonnes pratiques BDD, queries, RLS, migrations
npx skills add https://github.com/supabase/agent-skills --skill supabase-postgres-best-practices

# Better Auth — config auth, sessions, middleware, providers
npx skills add https://github.com/better-auth/skills --skill better-auth-best-practices

# Agent Browser — automatisation navigateur pour tests manuels assistes
npx skills add https://github.com/vercel-labs/agent-browser --skill agent-browser
```

### Quand utiliser chaque skill

| Skill                              | Utiliser lors de                                          |
| ---------------------------------- | --------------------------------------------------------- |
| `next-best-practices`              | Creation de routes, layouts, middleware, API routes, RSC   |
| `vercel-react-best-practices`      | Ecriture de composants, hooks, gestion d'etat, formulaires|
| `vercel-composition-patterns`      | Architecture des layouts, slots, composition de composants |
| `frontend-design`                  | Design UI/UX, responsive, accessibilite, couleurs, typo   |
| `supabase-postgres-best-practices` | Queries SQL, schema, RLS policies, storage, realtime       |
| `better-auth-best-practices`       | Config auth, inscription, connexion, sessions, middleware  |
| `agent-browser`                    | Tests manuels assistes, navigation automatisee, debug UI   |

### Regles d'utilisation des skills

1. **Toujours consulter le skill pertinent** avant d'implementer une feature
   - Ex: avant de creer une route -> consulter `next-best-practices`
   - Ex: avant de toucher au schema -> consulter `supabase-postgres-best-practices`
2. **Combiner les skills** quand une feature touche plusieurs domaines
   - Ex: page de connexion -> `better-auth-best-practices` + `vercel-react-best-practices` + `frontend-design`
3. **Ne pas contredire les skills** : si un skill recommande un pattern, le suivre
   sauf decision explicite documentee dans ce fichier
4. **agent-browser** : utiliser pour valider visuellement les pages en cours de dev
   (verification responsive, tests de flow utilisateur)

---

## Roles Utilisateurs

### 1. Visiteur (non connecte)
- Parcourir la page d'accueil
- Rechercher des coiffeuses par localisation (ville / rayon)
- Consulter les profils publics des coiffeuses (portfolio, prestations, tarifs)
- S'inscrire / se connecter

### 2. Cliente (ROLE: `CLIENT`)
- Tout ce que fait le visiteur
- Reserver un creneau chez une coiffeuse
- Payer en ligne via Stripe
- Messagerie temps reel avec la coiffeuse
- Consulter l'historique de ses reservations
- Gerer son profil (adresse, preferences)

### 3. Coiffeuse (ROLE: `STYLIST`)
- Gerer son profil public (bio, photo, zone de deplacement)
- Gerer son portfolio (upload photos avant/apres)
- Definir ses disponibilites (calendrier de creneaux)
- Selectionner ses prestations dans le catalogue + fixer ses prix
- Accepter/refuser les reservations (automatique par defaut)
- Messagerie temps reel avec les clientes
- Voir son tableau de bord (revenus, reservations, stats)
- Configurer son compte Stripe Connect pour recevoir les paiements

### 4. Admin (ROLE: `ADMIN`)
- Gerer le catalogue de prestations (CRUD types de coiffures)
- Valider / suspendre les profils coiffeuses
- Moderer les contenus (photos, messages signales)
- Dashboard : statistiques globales (inscriptions, CA, reservations)
- Gerer les utilisateurs (recherche, ban, modification de role)

---

## Structure du Projet (Architecture Modulaire)

```
np/
├── .claude/
│   └── plans/                    # Plans incrementaux du projet
├── .env.local                    # Variables d'environnement (NON commit)
├── .env.example                  # Template des variables d'env
├── next.config.ts                # Configuration Next.js
├── tailwind.config.ts            # Configuration Tailwind
├── tsconfig.json                 # Configuration TypeScript
├── prisma/
│   └── schema.prisma             # Schema de base de donnees
├── zenstack/
│   └── schema.zmodel             # Schema ZenStack (policies d'acces)
├── public/
│   ├── images/                   # Assets statiques (logo, illustrations)
│   └── fonts/                    # Polices custom
├── src/
│   ├── app/                      # App Router Next.js
│   │   ├── (public)/             # Routes publiques (visiteurs)
│   │   │   ├── page.tsx          # Page d'accueil
│   │   │   ├── recherche/        # Recherche de coiffeuses
│   │   │   └── coiffeuse/[id]/   # Profil public d'une coiffeuse
│   │   ├── (auth)/               # Routes d'authentification
│   │   │   ├── connexion/        # Page de connexion
│   │   │   └── inscription/      # Page d'inscription (choix role)
│   │   ├── (dashboard)/          # Routes protegees (connecte)
│   │   │   ├── client/           # Espace cliente
│   │   │   │   ├── reservations/ # Historique reservations
│   │   │   │   ├── messages/     # Messagerie
│   │   │   │   └── profil/       # Profil cliente
│   │   │   ├── coiffeuse/        # Espace coiffeuse
│   │   │   │   ├── dashboard/    # Tableau de bord
│   │   │   │   ├── disponibilites/ # Gestion calendrier
│   │   │   │   ├── prestations/  # Prestations et tarifs
│   │   │   │   ├── portfolio/    # Gestion photos
│   │   │   │   ├── reservations/ # Reservations recues
│   │   │   │   └── messages/     # Messagerie
│   │   │   └── admin/            # Espace admin
│   │   │       ├── dashboard/    # Statistiques
│   │   │       ├── catalogue/    # Gestion des types de coiffures
│   │   │       ├── coiffeuses/   # Validation des profils
│   │   │       └── utilisateurs/ # Gestion des users
│   │   ├── api/                  # API Routes
│   │   │   ├── auth/             # Endpoints Better Auth
│   │   │   ├── stripe/           # Webhooks Stripe
│   │   │   └── upload/           # Upload d'images via Supabase Storage
│   │   ├── layout.tsx            # Layout racine
│   │   └── globals.css           # Styles globaux
│   ├── modules/                  # Modules metier (feature-based)
│   │   ├── auth/                 # Module authentification
│   │   │   ├── components/       # Composants UI (LoginForm, RegisterForm)
│   │   │   ├── hooks/            # useAuth, useSession
│   │   │   ├── actions/          # Server actions (login, register, logout)
│   │   │   ├── schemas/          # Schemas Zod (loginSchema, registerSchema)
│   │   │   └── types.ts          # Types TypeScript du module
│   │   ├── search/               # Module recherche
│   │   │   ├── components/       # SearchBar, SearchResults, StylistCard
│   │   │   ├── hooks/            # useSearch, useGeolocation
│   │   │   ├── actions/          # Server actions (searchStylists)
│   │   │   ├── schemas/          # searchSchema
│   │   │   └── types.ts
│   │   ├── booking/              # Module reservation
│   │   │   ├── components/       # BookingCalendar, BookingForm, BookingCard
│   │   │   ├── hooks/            # useBooking, useAvailability
│   │   │   ├── actions/          # Server actions (createBooking, cancelBooking)
│   │   │   ├── schemas/          # bookingSchema
│   │   │   └── types.ts
│   │   ├── payment/              # Module paiement Stripe
│   │   │   ├── components/       # PaymentForm, PaymentStatus
│   │   │   ├── hooks/            # usePayment
│   │   │   ├── actions/          # Server actions (createPaymentIntent)
│   │   │   ├── lib/              # Configuration Stripe, helpers
│   │   │   ├── schemas/
│   │   │   └── types.ts
│   │   ├── messaging/            # Module messagerie temps reel
│   │   │   ├── components/       # ChatWindow, MessageBubble, ConversationList
│   │   │   ├── hooks/            # useChat, useMessages
│   │   │   ├── actions/          # Server actions (sendMessage)
│   │   │   ├── schemas/
│   │   │   └── types.ts
│   │   ├── stylist/              # Module profil coiffeuse
│   │   │   ├── components/       # StylistProfile, PortfolioGrid, AvailabilityCalendar
│   │   │   ├── hooks/            # useStylistProfile, usePortfolio
│   │   │   ├── actions/          # Server actions (updateProfile, uploadPhoto)
│   │   │   ├── schemas/
│   │   │   └── types.ts
│   │   └── admin/                # Module administration
│   │       ├── components/       # AdminDashboard, CatalogManager, UserTable
│   │       ├── hooks/
│   │       ├── actions/          # Server actions (manageCatalog, manageUsers)
│   │       ├── schemas/
│   │       └── types.ts
│   ├── shared/                   # Code partage entre modules
│   │   ├── components/           # Composants UI generiques
│   │   │   ├── ui/               # Composants shadcn/ui
│   │   │   ├── layout/           # Header, Footer, Sidebar, Navigation
│   │   │   └── common/           # Avatar, Badge, Loader, EmptyState
│   │   ├── hooks/                # Hooks partages (useMediaQuery, useDebounce)
│   │   ├── lib/                  # Utilitaires et configurations
│   │   │   ├── supabase/         # Client Supabase (server + client)
│   │   │   ├── auth/             # Configuration Better Auth
│   │   │   ├── stripe/           # Configuration Stripe
│   │   │   ├── db.ts             # Instance Prisma / ZenStack enhance
│   │   │   ├── utils.ts          # Fonctions utilitaires (cn, formatPrice...)
│   │   │   └── constants.ts      # Constantes globales
│   │   ├── stores/               # Stores Zustand
│   │   │   ├── auth-store.ts     # Store d'authentification cote client
│   │   │   ├── search-store.ts   # Store de recherche (filtres, resultats)
│   │   │   ├── booking-store.ts  # Store de reservation en cours
│   │   │   └── chat-store.ts     # Store de messagerie
│   │   ├── types/                # Types globaux
│   │   │   ├── database.ts       # Types generes depuis Prisma
│   │   │   ├── api.ts            # Types de reponses API
│   │   │   └── index.ts          # Re-exports
│   │   └── schemas/              # Schemas Zod partages
│   │       └── common.ts         # emailSchema, phoneSchema, addressSchema...
│   └── middleware.ts             # Middleware Next.js (protection routes, redirections)
├── tests/                        # Tests
│   ├── unit/                     # Tests unitaires (schemas, utils)
│   ├── integration/              # Tests d'integration (API, actions)
│   └── e2e/                      # Tests end-to-end (Playwright)
├── package.json
└── README.md
```

---

## Conventions de Codage

### Nommage

| Element                 | Convention         | Exemple                          |
| ----------------------- | ------------------ | -------------------------------- |
| Fichiers composants     | `PascalCase.tsx`   | `BookingCalendar.tsx`            |
| Fichiers utilitaires    | `kebab-case.ts`    | `format-price.ts`               |
| Fichiers schemas Zod    | `kebab-case.ts`    | `booking-schema.ts`             |
| Fichiers actions        | `kebab-case.ts`    | `create-booking.ts`             |
| Fichiers hooks          | `camelCase.ts`     | `useBooking.ts`                 |
| Fichiers stores Zustand | `kebab-case.ts`    | `booking-store.ts`              |
| Composants React        | `PascalCase`       | `BookingCalendar`               |
| Fonctions / variables   | `camelCase`        | `handleBooking`, `isLoading`    |
| Constantes              | `UPPER_SNAKE_CASE` | `MAX_UPLOAD_SIZE`               |
| Types / Interfaces      | `PascalCase`       | `BookingStatus`, `StylistProfile`|
| Schemas Zod             | `camelCase`        | `bookingSchema`, `loginSchema`  |
| Server actions          | `camelCase`        | `createBooking`, `searchStylists`|
| Routes API              | `kebab-case`       | `/api/stripe/webhook`           |
| Tables DB (Prisma)      | `PascalCase`       | `Booking`, `StylistProfile`     |
| Colonnes DB             | `camelCase`        | `createdAt`, `stylistId`        |

### Regles TypeScript

```typescript
// TOUJOURS typer explicitement les props des composants
// Exemple : composant BookingCard avec ses props typees
interface BookingCardProps {
  booking: Booking        // Donnees de la reservation
  onCancel?: () => void   // Callback optionnel d'annulation
}

export function BookingCard({ booking, onCancel }: BookingCardProps) {
  // ...
}

// TOUJOURS typer le retour des server actions
// Exemple : action qui cree une reservation et retourne un resultat type
export async function createBooking(
  data: CreateBookingInput  // Donnees validees par Zod
): Promise<ActionResult<Booking>> {
  // ...
}

// Type generique pour les retours d'actions serveur
// Permet de standardiser les reponses succes/erreur
type ActionResult<T> = {
  success: true
  data: T           // Donnees retournees en cas de succes
} | {
  success: false
  error: string     // Message d'erreur en cas d'echec
}
```

### Regles de Style

- **Tailwind CSS** pour tout le styling, pas de CSS modules
- **shadcn/ui** comme base de composants UI
- **Mobile-first** : toujours coder en responsive (sm:, md:, lg:)
- Pas de `style={}` inline sauf cas exceptionnel

### Regles de Commentaires

```typescript
// TOUJOURS commenter :
// 1. Le role du fichier / composant en haut du fichier
// 2. Les interactions avec d'autres modules
// 3. La logique metier non evidente
// 4. Les effets de bord (side effects)

// Exemple d'en-tete de fichier :
/**
 * BookingCalendar — Calendrier de selection de creneaux
 *
 * Role : Affiche les disponibilites d'une coiffeuse et permet
 *        a la cliente de selectionner un creneau pour reserver.
 *
 * Interactions :
 *   - Lit les disponibilites via l'action `getAvailability` (module stylist)
 *   - Declenche la creation de reservation via `createBooking` (module booking)
 *   - Met a jour le store Zustand `booking-store` avec le creneau selectionne
 *
 * Exemple d'utilisation :
 *   <BookingCalendar stylistId="abc-123" onSlotSelected={handleSlot} />
 */
```

### Regles TanStack Query + Zustand (separation des responsabilites)

**Principe fondamental** : TanStack Query gere le **state serveur** (donnees BDD),
Zustand gere le **state UI client** (filtres, modales, etapes de formulaire).

| Donnee                        | Outil            | Justification                                    |
| ----------------------------- | ---------------- | ------------------------------------------------ |
| Liste des coiffeuses          | TanStack Query   | Donnee serveur, cache automatique, revalidation  |
| Filtres de recherche          | Zustand          | State UI pur, pas besoin de cache serveur        |
| Detail d'un profil coiffeuse  | TanStack Query   | Donnee serveur, cache par ID                     |
| Etape du flow de reservation  | Zustand          | State UI local (etape 1, 2, 3...)                |
| Reservations de la cliente    | TanStack Query   | Donnee serveur, invalidation apres mutation      |
| Messages de chat              | TanStack Query   | Donnee serveur + Supabase Realtime pour le push  |
| Nombre de messages non lus    | Zustand           | State UI derive des donnees Realtime            |
| Session utilisateur           | TanStack Query   | Donnee serveur (session Better Auth)             |
| Modal ouverte/fermee          | Zustand          | State UI pur                                     |

**Avantages de TanStack Query** :
- **Cache automatique** : pas besoin de re-fetcher les memes donnees
- **Deduplication** : 10 composants demandent la meme query = 1 seule requete
- **Background refetch** : donnees toujours fraiches sans bloquer l'UI
- **Optimistic updates** : UI reactive avant la confirmation serveur
- **Stale-while-revalidate** : affiche le cache pendant le refetch
- **Invalidation** : `queryClient.invalidateQueries()` apres une mutation
- **DevTools** : inspection du cache et des queries en dev

```typescript
// Exemple TanStack Query : hook de recherche de coiffeuses
// Fichier : src/modules/search/hooks/useSearchStylists.ts

import { useQuery } from "@tanstack/react-query"
import { searchStylists } from "../actions/search-stylists"

/**
 * useSearchStylists — Hook pour rechercher des coiffeuses
 *
 * Role : Fetcher les coiffeuses selon les criteres de recherche.
 *        TanStack Query gere le cache, le loading, les erreurs.
 *
 * Interactions :
 *   - Appelle la server action `searchStylists`
 *   - Les filtres viennent du store Zustand `search-store`
 *   - Le cache est invalide quand les filtres changent
 *
 * Exemple :
 *   const { data, isLoading } = useSearchStylists({ city: "Paris", radius: 10 })
 */
export function useSearchStylists(filters: SearchFilters) {
  return useQuery({
    // Cle de cache unique basee sur les filtres
    queryKey: ["stylists", "search", filters],
    // Fonction de fetch (appelle la server action)
    queryFn: () => searchStylists(filters),
    // Garder le cache 5 minutes avant de considerer les donnees "stale"
    staleTime: 5 * 60 * 1000,
    // Ne pas fetcher si pas de ville renseignee
    enabled: !!filters.city,
  })
}
```

```typescript
// Exemple TanStack Query : mutation avec invalidation
// Fichier : src/modules/booking/hooks/useCreateBooking.ts

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createBooking } from "../actions/create-booking"

/**
 * useCreateBooking — Hook pour creer une reservation
 *
 * Role : Envoyer la mutation de creation et invalider les caches associes.
 *
 * Interactions :
 *   - Appelle la server action `createBooking`
 *   - Invalide le cache des reservations apres succes
 *   - Affiche un toast de confirmation (via onSuccess)
 */
export function useCreateBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      // Invalider le cache pour forcer un refetch des reservations
      queryClient.invalidateQueries({ queryKey: ["bookings"] })
    },
  })
}
```

### Regles Zustand (state UI uniquement)

```typescript
// Zustand est reserve au state UI pur (filtres, modales, navigation)
// NE PAS stocker les donnees serveur dans Zustand (utiliser TanStack Query)
// TOUJOURS utiliser immer middleware pour les mutations

// Exemple : store de recherche (UNIQUEMENT les filtres UI, pas les resultats)
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface SearchFiltersState {
  city: string           // Ville selectionnee par la cliente
  radius: number         // Rayon de recherche en km
  categoryId: string | null // Filtre par categorie de prestation
  setCity: (city: string) => void
  setRadius: (radius: number) => void
  setCategoryId: (id: string | null) => void
  reset: () => void
}

export const useSearchFiltersStore = create<SearchFiltersState>()(
  immer((set) => ({
    city: '',
    radius: 10,
    categoryId: null,
    setCity: (city) => set((state) => { state.city = city }),
    setRadius: (radius) => set((state) => { state.radius = radius }),
    setCategoryId: (id) => set((state) => { state.categoryId = id }),
    reset: () => set((state) => {
      state.city = ''
      state.radius = 10
      state.categoryId = null
    }),
  }))
)
```

### Regles Zod

```typescript
// Chaque formulaire a son propre schema Zod
// Les schemas partages sont dans src/shared/schemas/
// TOUJOURS ajouter des messages d'erreur en francais

// Exemple : schema de validation pour l'inscription
export const registerSchema = z.object({
  email: z
    .string()
    .email("Adresse email invalide"),       // Message en francais
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caracteres"),
  role: z
    .enum(["CLIENT", "STYLIST"], {
      errorMap: () => ({ message: "Veuillez choisir un role" })
    }),
  firstName: z
    .string()
    .min(2, "Le prenom doit contenir au moins 2 caracteres"),
  lastName: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caracteres"),
})
```

### Regles Server Actions

```typescript
// TOUJOURS utiliser "use server" en haut du fichier
// TOUJOURS valider les inputs avec Zod
// TOUJOURS verifier l'authentification et l'autorisation
// TOUJOURS retourner un ActionResult<T>

// Exemple : action serveur pour creer une reservation
"use server"

import { bookingSchema } from "../schemas/booking-schema"
import { getSession } from "@/shared/lib/auth"
import { db } from "@/shared/lib/db"

/**
 * createBooking — Cree une nouvelle reservation
 *
 * Role : Valide les donnees, verifie la disponibilite du creneau,
 *        cree la reservation en BDD et declenche le paiement Stripe.
 *
 * Interactions :
 *   - Verifie la session via Better Auth
 *   - Ecrit en BDD via Prisma (enhanced par ZenStack)
 *   - Cree un PaymentIntent via Stripe
 */
export async function createBooking(
  input: unknown  // Input brut, sera valide par Zod
): Promise<ActionResult<Booking>> {
  // 1. Verifier l'authentification
  const session = await getSession()
  if (!session) return { success: false, error: "Non authentifie" }

  // 2. Valider les donnees avec Zod
  const parsed = bookingSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.message }

  // 3. Logique metier...
}
```

---

## Schema de Base de Donnees (Prisma)

```prisma
// Tables principales prevues :

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  firstName     String
  lastName      String
  role          Role     @default(CLIENT)
  phone         String?
  avatarUrl     String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  stylistProfile  StylistProfile?
  clientProfile   ClientProfile?
  bookingsAsClient  Booking[]  @relation("ClientBookings")
  sentMessages      Message[]  @relation("SentMessages")
}

model StylistProfile {
  id            String   @id @default(cuid())
  userId        String   @unique
  bio           String?
  city          String
  address       String?
  latitude      Float?
  longitude     Float?
  radiusKm      Int      @default(10)
  isVerified    Boolean  @default(false)
  isActive      Boolean  @default(true)

  user          User     @relation(fields: [userId], references: [id])
  portfolio     PortfolioImage[]
  services      StylistService[]
  availabilities Availability[]
  bookings      Booking[] @relation("StylistBookings")
}

model ClientProfile {
  id            String   @id @default(cuid())
  userId        String   @unique
  address       String?
  city          String?
  latitude      Float?
  longitude     Float?

  user          User     @relation(fields: [userId], references: [id])
}

model ServiceCategory {
  id            String   @id @default(cuid())
  name          String   @unique    // Ex: "Tresses", "Locks", "Tissage"
  description   String?
  imageUrl      String?
  isActive      Boolean  @default(true)

  services      StylistService[]
}

model StylistService {
  id              String   @id @default(cuid())
  stylistId       String
  categoryId      String
  price           Int               // Prix en centimes
  durationMinutes Int               // Duree estimee en minutes
  description     String?

  stylist         StylistProfile @relation(fields: [stylistId], references: [id])
  category        ServiceCategory @relation(fields: [categoryId], references: [id])
  bookings        Booking[]
}

model PortfolioImage {
  id          String   @id @default(cuid())
  stylistId   String
  url         String
  caption     String?
  createdAt   DateTime @default(now())

  stylist     StylistProfile @relation(fields: [stylistId], references: [id])
}

model Availability {
  id          String   @id @default(cuid())
  stylistId   String
  dayOfWeek   Int              // 0=Dimanche, 1=Lundi, ..., 6=Samedi
  startTime   String           // Format "HH:mm"
  endTime     String           // Format "HH:mm"
  isActive    Boolean  @default(true)

  stylist     StylistProfile @relation(fields: [stylistId], references: [id])
}

model Booking {
  id              String        @id @default(cuid())
  clientId        String
  stylistId       String
  serviceId       String
  date            DateTime               // Date de la prestation
  startTime       String                 // Heure de debut "HH:mm"
  endTime         String                 // Heure de fin "HH:mm"
  status          BookingStatus @default(PENDING)
  totalPrice      Int                    // Prix total en centimes
  address         String                 // Adresse de la prestation (domicile cliente)
  stripePaymentId String?                // ID du paiement Stripe
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  client          User           @relation("ClientBookings", fields: [clientId], references: [id])
  stylist         StylistProfile @relation("StylistBookings", fields: [stylistId], references: [id])
  service         StylistService @relation(fields: [serviceId], references: [id])
  messages        Message[]
  payment         Payment?
}

model Payment {
  id                String   @id @default(cuid())
  bookingId         String   @unique
  stripePaymentId   String   @unique
  amount            Int                  // Montant en centimes
  platformFee       Int                  // Commission plateforme en centimes
  status            PaymentStatus @default(PENDING)
  createdAt         DateTime @default(now())

  booking           Booking  @relation(fields: [bookingId], references: [id])
}

model Message {
  id          String   @id @default(cuid())
  senderId    String
  bookingId   String
  content     String
  isRead      Boolean  @default(false)
  createdAt   DateTime @default(now())

  sender      User     @relation("SentMessages", fields: [senderId], references: [id])
  booking     Booking  @relation(fields: [bookingId], references: [id])
}

model Conversation {
  id          String   @id @default(cuid())
  clientId    String
  stylistId   String
  bookingId   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// --- Enums ---

enum Role {
  CLIENT
  STYLIST
  ADMIN
}

enum BookingStatus {
  PENDING       // En attente de paiement
  CONFIRMED     // Payee et confirmee
  IN_PROGRESS   // Prestation en cours
  COMPLETED     // Terminee
  CANCELLED     // Annulee
}

enum PaymentStatus {
  PENDING
  SUCCEEDED
  FAILED
  REFUNDED
}
```

---

## Workflow de Reservation

```
1. Cliente recherche une coiffeuse par ville
2. Cliente consulte le profil (portfolio, prestations, tarifs)
3. Cliente selectionne une prestation
4. Cliente choisit un creneau disponible dans le calendrier
5. Cliente remplit l'adresse de prestation (son domicile)
6. Paiement via Stripe (pre-autorisation ou paiement complet)
7. Reservation creee avec statut CONFIRMED
8. Coiffeuse recoit une notification (push/email)
9. Messagerie ouverte entre cliente et coiffeuse
10. Jour J : prestation realisee -> statut COMPLETED
11. Paiement capture et vire a la coiffeuse (Stripe Connect)
```

---

## Variables d'Environnement Requises

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Base de donnees (connection string Supabase)
DATABASE_URL=
DIRECT_URL=                      # Connection directe (migrations Prisma)

# Better Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000

# Mapbox (Geocoding / Autocompletion)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Resend (emails transactionnels)
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Commandes Utiles

```bash
# Developpement
pnpm dev                 # Lancer le serveur de dev (Turbopack)

# Base de donnees
pnpm prisma generate     # Generer le client Prisma
pnpm prisma db push      # Pousser le schema vers Supabase
pnpm prisma studio       # UI pour explorer la BDD

# ZenStack
pnpm zenstack generate   # Generer les policies d'acces

# Build & Deploy
pnpm build               # Build de production
pnpm lint                # Linting ESLint

# Dependances
pnpm add <package>       # Ajouter une dependance
pnpm add -D <package>    # Ajouter une dependance de dev
```

---

## Regles Importantes

1. **Securite** : Toujours verifier auth + role avant toute operation sensible
2. **Validation** : Zod cote client ET cote serveur (never trust the client)
3. **Performances** : Utiliser les Server Components par defaut, `"use client"` seulement si necessaire
4. **Images** : Stocker sur Supabase Storage, URLs signees pour le prive
5. **Paiements** : Jamais stocker de donnees bancaires, tout passe par Stripe
6. **RGPD** : Prevoir suppression de compte + export des donnees
7. **Accessibilite** : Labels sur les inputs, navigation clavier, contrastes suffisants
