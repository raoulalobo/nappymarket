/**
 * AvailabilityManager — Gestionnaire des creneaux de disponibilite
 *
 * Role : Permettre a la coiffeuse de gerer ses creneaux de disponibilite
 *        hebdomadaires. Affiche une vue par jour avec les creneaux configures,
 *        et offre des actions pour ajouter, modifier, supprimer et activer/desactiver.
 *
 * Interactions :
 *   - Utilise useStylistAvailabilities() pour lire les creneaux
 *   - Utilise useAddAvailability() pour ajouter un creneau
 *   - Utilise useUpdateAvailability() pour modifier un creneau
 *   - Utilise useDeleteAvailability() pour supprimer un creneau
 *   - Utilise useToggleAvailability() pour activer/desactiver
 *   - Composants shadcn : Card, Dialog, AlertDialog, Button, Select, Switch, Badge, Skeleton
 *
 * Exemple :
 *   <AvailabilityManager />
 *   // Affiche 7 jours avec les creneaux et les boutons d'action
 */
"use client"

import { useState } from "react"
import {
  useStylistAvailabilities,
  useAddAvailability,
  useUpdateAvailability,
  useDeleteAvailability,
  useToggleAvailability,
} from "../hooks/useAvailabilities"
import { DAYS_OF_WEEK_FR } from "@/shared/lib/constants"
import { formatTime } from "@/shared/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Plus, Pencil, Trash2, Clock } from "lucide-react"
import type { Availability } from "@prisma/client"
import type { AvailabilitySchema } from "../schemas/availability-schema"

/* ------------------------------------------------------------------ */
/* Constantes : options de creneaux horaires (pas de 30 min)           */
/* ------------------------------------------------------------------ */

/**
 * Generer les options de temps (00:00 a 23:30 par pas de 30 min)
 * pour les selects de debut et fin de creneau.
 */
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2)
  const m = i % 2 === 0 ? "00" : "30"
  return `${h.toString().padStart(2, "0")}:${m}`
})

/* ------------------------------------------------------------------ */
/* Composant principal                                                 */
/* ------------------------------------------------------------------ */

export function AvailabilityManager() {
  const { availabilities, isLoading } = useStylistAvailabilities()
  const { addAvailability, isAdding } = useAddAvailability()
  const { updateAvailability, isUpdating } = useUpdateAvailability()
  const { deleteAvailability, isDeleting } = useDeleteAvailability()
  const { toggleAvailability } = useToggleAvailability()

  // Etat des dialogues
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Etat du formulaire (ajout/modification)
  const [formDayOfWeek, setFormDayOfWeek] = useState<number>(1)
  const [formStartTime, setFormStartTime] = useState("09:00")
  const [formEndTime, setFormEndTime] = useState("18:00")

  // Creneau en cours de modification/suppression
  const [selectedAvailability, setSelectedAvailability] = useState<Availability | null>(null)

  // Grouper les disponibilites par jour (0-6)
  const groupedByDay = Array.from({ length: 7 }, (_, dayIndex) =>
    availabilities.filter((a) => a.dayOfWeek === dayIndex)
  )

  /* ---------------------------------------------------------------- */
  /* Handlers                                                          */
  /* ---------------------------------------------------------------- */

  /** Ouvrir le dialogue d'ajout avec des valeurs par defaut */
  const handleOpenAdd = (dayOfWeek?: number) => {
    setFormDayOfWeek(dayOfWeek ?? 1)
    setFormStartTime("09:00")
    setFormEndTime("18:00")
    setAddDialogOpen(true)
  }

  /** Ouvrir le dialogue de modification avec les valeurs existantes */
  const handleOpenEdit = (avail: Availability) => {
    setSelectedAvailability(avail)
    setFormDayOfWeek(avail.dayOfWeek)
    setFormStartTime(avail.startTime)
    setFormEndTime(avail.endTime)
    setEditDialogOpen(true)
  }

  /** Ouvrir le dialogue de confirmation de suppression */
  const handleOpenDelete = (avail: Availability) => {
    setSelectedAvailability(avail)
    setDeleteDialogOpen(true)
  }

  /** Soumettre le formulaire d'ajout */
  const handleAdd = async () => {
    const data: AvailabilitySchema = {
      dayOfWeek: formDayOfWeek,
      startTime: formStartTime,
      endTime: formEndTime,
    }
    try {
      await addAvailability(data)
      setAddDialogOpen(false)
    } catch {
      // L'erreur est geree par le hook (toast)
    }
  }

  /** Soumettre le formulaire de modification */
  const handleEdit = async () => {
    if (!selectedAvailability) return
    const data: AvailabilitySchema = {
      dayOfWeek: formDayOfWeek,
      startTime: formStartTime,
      endTime: formEndTime,
    }
    try {
      await updateAvailability({ id: selectedAvailability.id, data })
      setEditDialogOpen(false)
      setSelectedAvailability(null)
    } catch {
      // L'erreur est geree par le hook (toast)
    }
  }

  /** Confirmer la suppression */
  const handleDelete = async () => {
    if (!selectedAvailability) return
    try {
      await deleteAvailability(selectedAvailability.id)
      setDeleteDialogOpen(false)
      setSelectedAvailability(null)
    } catch {
      // L'erreur est geree par le hook (toast)
    }
  }

  /* ---------------------------------------------------------------- */
  /* Rendu                                                             */
  /* ---------------------------------------------------------------- */

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Bouton global d'ajout */}
      <div className="flex justify-end">
        <Button onClick={() => handleOpenAdd()}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un creneau
        </Button>
      </div>

      {/* Vue par jour de la semaine */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {DAYS_OF_WEEK_FR.map((dayName, dayIndex) => {
          const daySlots = groupedByDay[dayIndex]

          return (
            <Card key={dayIndex} className={daySlots.length === 0 ? "opacity-60" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{dayName}</CardTitle>
                  {/* Bouton d'ajout rapide pour ce jour */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleOpenAdd(dayIndex)}
                    title={`Ajouter un creneau le ${dayName.toLowerCase()}`}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {daySlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun creneau</p>
                ) : (
                  daySlots.map((avail) => (
                    <div
                      key={avail.id}
                      className="flex items-center justify-between gap-2 rounded-md border p-2"
                    >
                      {/* Horaires du creneau */}
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {formatTime(avail.startTime)} - {formatTime(avail.endTime)}
                        </span>
                        {!avail.isActive && (
                          <Badge variant="outline" className="text-xs">
                            Inactif
                          </Badge>
                        )}
                      </div>

                      {/* Actions : switch + modifier + supprimer */}
                      <div className="flex items-center gap-1">
                        <Switch
                          checked={avail.isActive}
                          onCheckedChange={() => toggleAvailability(avail.id)}
                          aria-label={
                            avail.isActive ? "Desactiver le creneau" : "Activer le creneau"
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleOpenEdit(avail)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleOpenDelete(avail)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ============================================================ */}
      {/* DIALOG AJOUT                                                  */}
      {/* ============================================================ */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un creneau</DialogTitle>
          </DialogHeader>
          <AvailabilityForm
            dayOfWeek={formDayOfWeek}
            startTime={formStartTime}
            endTime={formEndTime}
            onDayChange={setFormDayOfWeek}
            onStartChange={setFormStartTime}
            onEndChange={setFormEndTime}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAdd} disabled={isAdding}>
              {isAdding ? "Ajout..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* DIALOG MODIFICATION                                           */}
      {/* ============================================================ */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le creneau</DialogTitle>
          </DialogHeader>
          <AvailabilityForm
            dayOfWeek={formDayOfWeek}
            startTime={formStartTime}
            endTime={formEndTime}
            onDayChange={setFormDayOfWeek}
            onStartChange={setFormStartTime}
            onEndChange={setFormEndTime}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEdit} disabled={isUpdating}>
              {isUpdating ? "Modification..." : "Modifier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* ALERT DIALOG SUPPRESSION                                      */}
      {/* ============================================================ */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce creneau ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le creneau{" "}
              {selectedAvailability && (
                <>
                  du{" "}
                  <strong>
                    {DAYS_OF_WEEK_FR[selectedAvailability.dayOfWeek]}
                  </strong>{" "}
                  de{" "}
                  <strong>
                    {formatTime(selectedAvailability.startTime)}
                  </strong>{" "}
                  a{" "}
                  <strong>
                    {formatTime(selectedAvailability.endTime)}
                  </strong>
                </>
              )}{" "}
              sera supprime definitivement. Les reservations existantes ne
              seront pas affectees.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Sous-composant : Formulaire de creneau (ajout/modification)         */
/* ------------------------------------------------------------------ */

/**
 * AvailabilityForm — Formulaire reutilisable pour les creneaux
 *
 * Affiche 3 selects : jour de la semaine, heure de debut, heure de fin.
 * Utilise dans les dialogues d'ajout et de modification.
 */
interface AvailabilityFormProps {
  dayOfWeek: number
  startTime: string
  endTime: string
  onDayChange: (day: number) => void
  onStartChange: (time: string) => void
  onEndChange: (time: string) => void
}

function AvailabilityForm({
  dayOfWeek,
  startTime,
  endTime,
  onDayChange,
  onStartChange,
  onEndChange,
}: AvailabilityFormProps) {
  return (
    <div className="space-y-4 py-2">
      {/* Select du jour de la semaine */}
      <div className="space-y-2">
        <Label>Jour de la semaine</Label>
        <Select
          value={dayOfWeek.toString()}
          onValueChange={(v) => onDayChange(parseInt(v))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DAYS_OF_WEEK_FR.map((name, index) => (
              <SelectItem key={index} value={index.toString()}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Selects heure de debut et fin (cote a cote) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Heure de debut</Label>
          <Select value={startTime} onValueChange={onStartChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map((time) => (
                <SelectItem key={time} value={time}>
                  {formatTime(time)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Heure de fin</Label>
          <Select value={endTime} onValueChange={onEndChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.filter((t) => t > startTime).map((time) => (
                <SelectItem key={time} value={time}>
                  {formatTime(time)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
