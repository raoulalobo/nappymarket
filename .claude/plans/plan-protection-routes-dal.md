# Plan : Protection globale des routes par DAL (Data Access Layer)

## Contexte

Le `/admin/catalogue` est accessible sans etre connecte. Le `middleware.ts` est
deprece en Next.js 16 et ne s'execute plus de maniere fiable. La protection
actuelle repose sur du code duplique dans chaque page (10+ lignes repetees).

La documentation officielle Next.js recommande un pattern en 2 couches :
1. **Proxy** (`proxy.ts`) : check optimiste rapide (cookie, pas de BDD)
2. **DAL** (Data Access Layer) : check securise au niveau de chaque page

> Important : Next.js deconseille explicitement les checks d'auth dans les
> layouts car le Partial Rendering fait que les layouts ne se re-executent
> PAS lors de la navigation entre pages soeurs.

Sources :
- https://nextjs.org/docs/app/guides/authentication
- https://nextjs.org/docs/app/getting-started/proxy
- https://nextjs.org/docs/messages/middleware-to-proxy

## Objectif

Mettre en place une protection globale, centralisee et fiable de toutes les
routes protegees, en suivant le pattern officiel Next.js 16. Chaque nouvelle
page n'aura besoin que d'une seule ligne (`await requireRole("ADMIN")`) pour
etre protegee.

## Plans en relation

| Plan                     | Relation   | Description de l'interaction                                      |
| ------------------------ | ---------- | ----------------------------------------------------------------- |
| `plan-nappymarket.md`    | Prerequis  | Le schema Prisma et Better Auth doivent etre en place (Phase 1-2) |

## Architecture

### Couche 1 : Proxy (check optimiste)

`proxy.ts` remplace `middleware.ts`. Meme logique, nouveau nom :
- Verifie la **presence du cookie** de session Better Auth
- Redirige vers `/connexion?callbackUrl=...` si absent
- Ne fait **aucun appel BDD** (rapide, Edge-compatible)
- Premiere barriere : bloque les visiteurs non connectes

### Couche 2 : DAL (check securise)

`src/shared/lib/auth/dal.ts` — point central d'autorisation :

```typescript
import "server-only"
import { cache } from "react"

// verifySession() — verifie que la session est valide (appel BDD)
// Utilise React.cache() pour deduplicquer les appels dans un meme render
export const verifySession = cache(async () => { ... })

// requireRole(role) — verifie session + role specifique
// Redirige automatiquement si non autorise
export const requireRole = cache(async (role: "CLIENT" | "STYLIST" | "ADMIN") => { ... })
```

**Avantages de `React.cache()`** : si 3 composants appellent `requireRole("ADMIN")`
dans le meme render, un seul appel BDD est fait. Les autres recoivent le resultat
en cache.

## Fichiers concernes

### 1. Renommer `src/middleware.ts` → `src/proxy.ts`

- Renommer la fonction `middleware()` → `proxy()`
- Garder la meme logique (check cookie de session)
- Garder le meme `config.matcher`

### 2. Creer `src/shared/lib/auth/dal.ts`

Fonctions exportees :

**`verifySession()`** :
- Appelle `getSession()` (Better Auth, via headers/cookies)
- Si pas de session → `redirect("/connexion")`
- Si session valide → retourne `{ user: { id, role, firstName, ... } }`
- Wrappee dans `cache()` pour deduplication

**`requireRole(role)`** :
- Appelle `verifySession()` (beneficie du cache)
- Si `session.user.role !== role` → redirect vers l'espace du role reel :
  - CLIENT → `/client`
  - STYLIST → `/coiffeuse/dashboard`
  - ADMIN → `/admin/dashboard`
- Si role OK → retourne la session
- Wrappee dans `cache()` pour deduplication

### 3. Simplifier les pages protegees existantes

**Pages admin** (3 pages) :
- `src/app/(dashboard)/admin/dashboard/page.tsx`
- `src/app/(dashboard)/admin/catalogue/page.tsx`
- `src/app/(dashboard)/admin/coiffeuses/page.tsx`

Remplacer les ~12 lignes de check par :
```typescript
const session = await requireRole("ADMIN")
```

**Pages client** (3 pages) :
- `src/app/(dashboard)/client/page.tsx`
- `src/app/(dashboard)/client/profil/page.tsx`
- `src/app/(dashboard)/client/reservations/page.tsx`

Remplacer par :
```typescript
const session = await requireRole("CLIENT")
```

**Pages coiffeuse** (6 pages) :
- `src/app/(dashboard)/coiffeuse/dashboard/page.tsx`
- `src/app/(dashboard)/coiffeuse/portfolio/page.tsx`
- `src/app/(dashboard)/coiffeuse/prestations/page.tsx`
- `src/app/(dashboard)/coiffeuse/profil/page.tsx`
- `src/app/(dashboard)/coiffeuse/disponibilites/page.tsx`
- `src/app/(dashboard)/coiffeuse/reservations/page.tsx`

Remplacer par :
```typescript
const session = await requireRole("STYLIST")
```

### 4. Conserver le check auth dans `(dashboard)/layout.tsx`

Le layout garde `getSession()` pour :
- Alimenter la sidebar avec les infos user (nom, role)
- Rediriger vers `/connexion` si session invalide (filet de securite)

Mais la **protection de role** se fait exclusivement dans les pages via le DAL.

## Etapes d'implementation

1. Creer `src/shared/lib/auth/dal.ts` avec `verifySession()` et `requireRole()`
2. Renommer `src/middleware.ts` → `src/proxy.ts` (fonction `middleware` → `proxy`)
3. Mettre a jour les 3 pages admin pour utiliser `requireRole("ADMIN")`
4. Mettre a jour les 3 pages client pour utiliser `requireRole("CLIENT")`
5. Mettre a jour les 6 pages coiffeuse pour utiliser `requireRole("STYLIST")`
6. Verifier la compilation (`pnpm dev`)
7. Tester : acceder a `/admin/catalogue` sans etre connecte → doit rediriger

## Verification

- [ ] `proxy.ts` existe, `middleware.ts` supprime
- [ ] `pnpm dev` ne montre plus le warning "middleware deprecated"
- [ ] `/admin/catalogue` sans session → redirige vers `/connexion`
- [ ] `/admin/catalogue` connecte en CLIENT → redirige vers `/client`
- [ ] `/admin/catalogue` connecte en ADMIN → affiche la page
- [ ] `/client` connecte en STYLIST → redirige vers `/coiffeuse/dashboard`
- [ ] Les pages existantes fonctionnent toujours normalement
