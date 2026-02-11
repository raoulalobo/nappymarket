---
name: plan-management
description: Regles de gestion des fichiers de planification — nommage descriptif, permission obligatoire, relations entre plans, pas d'ecrasement sans accord
user-invocable: false
---

# Plan Management — Gestion des fichiers de planification

## REGLE D'ACTIVATION OBLIGATOIRE

Ce skill doit etre applique **systematiquement** des qu'une planification est en cours,
que ce soit :
- Demande explicite de l'utilisateur ("planifie", "fais un plan", "prepare un plan")
- Planification implicite (EnterPlanMode, ExitPlanMode, creation de fichier dans `.claude/plans/`)
- Toute reflexion structuree en etapes avant implementation d'une feature

**Aucune exception.** Si l'agent planifie, ce skill s'applique.
Cette regle est valable quel que soit le projet, la machine ou le contexte.

---

Appliquer ces regles **a chaque fois** qu'un fichier de plan `.md` est cree, modifie ou ecrase dans `.claude/plans/`.

## Regles

Voir [regles.md](./regles.md) pour :
- Nommage descriptif obligatoire
- Permission utilisateur avant toute action
- Logique ecraser vs creer un nouveau fichier
- Section relations entre plans

## Structure d'un plan

Voir [structure.md](./structure.md) pour :
- Template de fichier de plan
- Section "Plans en relation"
- Format des interactions entre plans
