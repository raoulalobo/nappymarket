# Plan — Implementation des menus de navigation dashboard

## Probleme identifie

Les Phases 2 et 3 sont terminees mais **il n'existe aucune navigation interne** dans les
espaces dashboard (client, coiffeuse, admin). Le seul moyen de naviguer entre les pages
d'un meme espace est le `UserMenu` dropdown dans le Header, qui ne propose que 2 liens :

- "Mon espace" → dashboard principal
- "Mon profil" → page profil

**Pages inaccessibles via le menu :**

| Role      | Pages sans lien de navigation                                  |
| --------- | -------------------------------------------------------------- |
| CLIENT    | `/client/profil` (accessible via UserMenu, mais c'est tout)    |
| STYLIST   | `/coiffeuse/portfolio`, `/coiffeuse/prestations`               |
| ADMIN     | `/admin/catalogue`, `/admin/coiffeuses`                        |

Par exemple, une coiffeuse sur `/coiffeuse/dashboard` n'a **aucun moyen** de naviguer vers
sa page portfolio ou prestations sans taper l'URL manuellement.

## Etat actuel

```
┌──────────────────────────────────────────────────┐
│ Header : [Logo]   [Trouver une coiffeuse]  [👤] │
├──────────────────────────────────────────────────┤
│                                                  │
│              {children} (page)                   │
│          (AUCUNE sidebar, aucun menu)            │
│                                                  │
├──────────────────────────────────────────────────┤
│ Footer                                           │
└──────────────────────────────────────────────────┘
```

## Solution proposee

Ajouter une **sidebar de navigation** dans le `DashboardLayout`, avec des liens
specifiques a chaque role. La sidebar sera :
- **Desktop (md+)** : sidebar fixe a gauche (largeur 240px), toujours visible
- **Mobile (<md)** : drawer (Sheet shadcn) accessible via un bouton hamburger dans le Header

```
┌──────────────────────────────────────────────────────┐
│ Header : [☰ mobile] [Logo]   [Recherche]       [👤] │
├────────────┬─────────────────────────────────────────┤
│  Sidebar   │                                         │
│            │           {children} (page)             │
│  - Tableau │                                         │
│  - Profil  │                                         │
│  - Portf.  │                                         │
│  - Presta. │                                         │
│            │                                         │
├────────────┴─────────────────────────────────────────┤
│ Footer                                               │
└──────────────────────────────────────────────────────┘
```

## Composants shadcn/ui disponibles

- `Sheet` (drawer mobile) → **deja installe**
- `Button`, `Separator`, `Tooltip` → **deja installes**
- Pas besoin du composant `Sidebar` shadcn (trop complexe pour notre besoin)

## Liens de navigation par role

### CLIENT
| Icone          | Label          | Route               | Phase actuelle |
| -------------- | -------------- | ------------------- | -------------- |
| LayoutDashboard| Tableau de bord| `/client`            | Placeholder    |
| User           | Mon profil     | `/client/profil`     | ✅ Complet     |
| Calendar       | Reservations   | `/client/reservations` | Phase 5      |
| MessageCircle  | Messages       | `/client/messages`   | Phase 7        |

### STYLIST
| Icone          | Label          | Route                       | Phase actuelle |
| -------------- | -------------- | --------------------------- | -------------- |
| LayoutDashboard| Tableau de bord| `/coiffeuse/dashboard`       | Placeholder    |
| User           | Mon profil     | `/coiffeuse/profil`          | ✅ Complet     |
| Image          | Portfolio      | `/coiffeuse/portfolio`       | ✅ Complet     |
| Scissors       | Prestations    | `/coiffeuse/prestations`     | ✅ Complet     |
| Clock          | Disponibilites | `/coiffeuse/disponibilites`  | Phase 5        |
| Calendar       | Reservations   | `/coiffeuse/reservations`    | Phase 5        |
| MessageCircle  | Messages       | `/coiffeuse/messages`        | Phase 7        |

### ADMIN
| Icone          | Label          | Route                 | Phase actuelle |
| -------------- | -------------- | --------------------- | -------------- |
| LayoutDashboard| Dashboard      | `/admin/dashboard`     | Placeholder    |
| Tags           | Catalogue      | `/admin/catalogue`     | ✅ Complet     |
| Scissors       | Coiffeuses     | `/admin/coiffeuses`    | ✅ Complet     |
| Users          | Utilisateurs   | `/admin/utilisateurs`  | Phase 8        |

> Les pages non encore implementees (.gitkeep) seront quand meme presentes
> dans le menu mais avec un style `disabled` ou un badge "Bientot".

---

## Taches d'implementation

### Tache 1 — Creer la configuration des liens sidebar

**Fichier** : `src/shared/lib/navigation.ts`

Creer un fichier de configuration qui definit les liens de navigation
pour chaque role, avec icone, label, route, et statut (actif/bientot).

```typescript
// Structure de chaque item de navigation
interface NavItem {
  label: string        // Texte affiche
  href: string         // Route Next.js
  icon: LucideIcon     // Icone Lucide
  disabled?: boolean   // true = page pas encore implementee (style grise + badge)
}

// Map role -> items[]
const NAVIGATION_ITEMS: Record<"CLIENT" | "STYLIST" | "ADMIN", NavItem[]>
```

### Tache 2 — Creer le composant DashboardSidebar (desktop)

**Fichier** : `src/shared/components/layout/DashboardSidebar.tsx`

Composant client qui :
- Recupere le role via `useSession()`
- Affiche les liens correspondants depuis `NAVIGATION_ITEMS`
- Met en surbrillance le lien actif via `usePathname()`
- Masque en mobile (`hidden md:flex`)
- Largeur fixe : `w-60` (240px)
- Style : fond leger, bordure droite, liens avec hover/active state

### Tache 3 — Creer le composant MobileSidebar (drawer)

**Fichier** : `src/shared/components/layout/MobileSidebar.tsx`

Composant client qui :
- Utilise `Sheet` (shadcn) avec `side="left"`
- Memes liens que DashboardSidebar
- S'ouvre via un bouton hamburger (icone `Menu`)
- Se ferme automatiquement quand on clique un lien
- Visible uniquement en mobile (`md:hidden`)

### Tache 4 — Modifier le DashboardLayout

**Fichier** : `src/app/(dashboard)/layout.tsx`

Modifier le layout pour integrer la sidebar :
- Ajouter `DashboardSidebar` a gauche du contenu
- Structure flex : `<div class="flex"><Sidebar /><main class="flex-1">{children}</main></div>`
- Le Header reste inchange en haut (full width)
- Le Footer reste en bas (full width)

### Tache 5 — Ajouter le bouton hamburger dans le Header

**Fichier** : `src/shared/components/layout/Header.tsx`

Modifier le Header pour :
- Ajouter un bouton hamburger (`Menu` icon) visible uniquement en mobile (`md:hidden`)
- Ce bouton doit ouvrir le `MobileSidebar`
- Solution : passer par un state partage (props ou context)

**Alternative** : Integrer le `MobileSidebar` directement dans le DashboardLayout
et passer un trigger au Header. Ou utiliser un petit store Zustand `sidebar-store.ts`.

**Decision retenue** : Integrer le bouton hamburger + Sheet dans `MobileSidebar.tsx`
directement (le composant contient le trigger ET le drawer). Il est place dans le
DashboardLayout, pas dans le Header. Cela evite de modifier le Header pour les pages
publiques qui n'ont pas besoin de sidebar.

### Tache 6 — Verifier le responsive et l'UX

Tests manuels :
- [ ] Desktop : sidebar visible a gauche, liens cliquables, lien actif en surbrillance
- [ ] Mobile : bouton hamburger visible, ouvre le drawer, liens fonctionnels
- [ ] Changement de page : le lien actif se met a jour
- [ ] Pages desactivees : affichees en grise avec badge "Bientot"
- [ ] Chaque role voit uniquement ses propres liens
- [ ] Build passe sans erreur (`pnpm build`)

---

## Fichiers concernes (resume)

| Action   | Fichier                                              |
| -------- | ---------------------------------------------------- |
| CREER    | `src/shared/lib/navigation.ts`                       |
| CREER    | `src/shared/components/layout/DashboardSidebar.tsx`  |
| CREER    | `src/shared/components/layout/MobileSidebar.tsx`     |
| MODIFIER | `src/app/(dashboard)/layout.tsx`                     |

> Le Header et le UserMenu ne sont PAS modifies. Le bouton hamburger
> est gere par `MobileSidebar.tsx` directement dans le DashboardLayout.

---

## Estimation

- 4 fichiers touches (2 nouveaux, 1 modifie, 1 config)
- Aucune dependance externe a installer (Sheet, Button, Separator deja presents)
- Pas de migration BDD
- Pas de modification du middleware ou de la logique auth
