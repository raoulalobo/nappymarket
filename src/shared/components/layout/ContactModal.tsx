/**
 * ContactModal — Bouton + Modal de formulaire de contact
 *
 * Role : Afficher un bouton "Contact" qui ouvre un Dialog (arriere-plan blur)
 *        contenant un formulaire de contact a 3 champs (email, telephone, message).
 *        A la soumission, envoie une requete POST vers /api/contact qui relaie
 *        le message a contact@nappymarket.store via Resend.
 *
 * Interactions :
 *   - POST /api/contact (API route Next.js)
 *   - Utilise Dialog (shadcn) pour le rendu du modal avec backdrop blur
 *   - React Hook Form + Zod pour la validation cote client
 *   - Affiche un etat de succes in-modal apres envoi reussi
 *
 * Props :
 *   - isMobileNavItem : si true, le trigger est style comme un item de nav mobile
 *     (icone + label, fond hover muted, arrondi), sinon comme un lien nav desktop
 *
 * Exemple (desktop) :
 *   <ContactModal />
 *
 * Exemple (mobile nav drawer) :
 *   <ContactModal isMobileNavItem />
 */
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Mail, Phone, MessageSquare, Send, CheckCircle2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

// -------------------------------------------------------------------------- //
// Schema de validation Zod (cote client, miroir de l'API route)              //
// -------------------------------------------------------------------------- //

/**
 * Schema de validation du formulaire de contact.
 * Messages en francais, coherents avec les conventions du projet.
 */
const contactFormSchema = z.object({
  email: z
    .string()
    .min(1, "L'adresse email est requise")
    .email("Adresse email invalide"),
  phone: z
    .string()
    .optional(),
  message: z
    .string()
    .min(10, "Le message doit contenir au moins 10 caracteres")
    .max(2000, "Le message ne peut pas depasser 2000 caracteres"),
})

type ContactFormValues = z.infer<typeof contactFormSchema>

// -------------------------------------------------------------------------- //
// Types                                                                        //
// -------------------------------------------------------------------------- //

interface ContactModalProps {
  /**
   * Si true : trigger style comme un item de navigation mobile
   * (icone + label, fond hover muted, pleine largeur, arrondi).
   * Si false (defaut) : trigger style comme un lien de navigation desktop.
   */
  isMobileNavItem?: boolean
}

// -------------------------------------------------------------------------- //
// Composant principal                                                          //
// -------------------------------------------------------------------------- //

export function ContactModal({ isMobileNavItem = false }: ContactModalProps) {
  // Etat d'ouverture du modal (controle par le bouton trigger)
  const [open, setOpen] = useState(false)
  // Etat de soumission : "idle" | "loading" | "success" | "error"
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "success" | "error">("idle")
  // Message d'erreur serveur a afficher sous le formulaire
  const [serverError, setServerError] = useState<string | null>(null)

  // Initialisation React Hook Form avec resolver Zod
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { email: "", phone: "", message: "" },
  })

  /**
   * onSubmit — Envoyer le formulaire vers l'API route /api/contact
   * Appele uniquement si la validation Zod cote client reussit.
   */
  async function onSubmit(values: ContactFormValues) {
    setSubmitState("loading")
    setServerError(null)

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      const data: { success?: boolean; error?: string } = await response.json()

      if (!response.ok || !data.success) {
        // Erreur retournee par le serveur (ex: validation, erreur Resend)
        setServerError(data.error ?? "Une erreur est survenue. Veuillez reessayer.")
        setSubmitState("error")
        return
      }

      // Succes : afficher l'etat de confirmation
      setSubmitState("success")
      reset()
    } catch {
      // Erreur reseau (pas de connexion, timeout, etc.)
      setServerError("Impossible d'envoyer le message. Verifiez votre connexion.")
      setSubmitState("error")
    }
  }

  /**
   * handleClose — Fermer le modal et reinitialiser tous les etats
   * Appele quand l'utilisateur ferme le Dialog (clic croix ou outside).
   */
  function handleClose(isOpen: boolean) {
    setOpen(isOpen)
    if (!isOpen) {
      // Delai court pour eviter le flash de reset pendant l'animation de fermeture
      setTimeout(() => {
        setSubmitState("idle")
        setServerError(null)
        reset()
      }, 200)
    }
  }

  return (
    // Fragment pour envelopper le trigger + le Dialog
    // (le Dialog doit etre au meme niveau que le trigger dans le DOM)
    <>
      {/* ---------------------------------------------------------------- */}
      {/* Bouton trigger — style adapte selon le contexte (desktop/mobile) */}
      {/* ---------------------------------------------------------------- */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          isMobileNavItem
            // Style item de navigation mobile (coherent avec les liens PUBLIC_NAV_LINKS)
            ? "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            // Style lien de navigation desktop (identique aux autres liens du Header)
            : "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        )}
      >
        {/* Icone visible uniquement en mode mobile nav item */}
        {isMobileNavItem && <Mail className="h-5 w-5" />}
        <span>Contact</span>
      </button>

      {/* ---------------------------------------------------------------- */}
      {/* Dialog — arriere-plan blur, contenu centre                       */}
      {/* ---------------------------------------------------------------- */}
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className="sm:max-w-md"
          // Backdrop blur via la classe shadcn par defaut (overlay avec backdrop-blur)
        >
          <DialogHeader>
            <DialogTitle>Nous contacter</DialogTitle>
            <DialogDescription>
              Une question, une suggestion ? Envoyez-nous un message,
              nous vous repondrons dans les plus brefs delais.
            </DialogDescription>
          </DialogHeader>

          {/* ============================================================= */}
          {/* Etat SUCCES — affiche apres envoi reussi                      */}
          {/* ============================================================= */}
          {submitState === "success" ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <div>
                <p className="text-base font-semibold">Message envoye !</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Nous avons bien recu votre message et vous repondrons rapidement.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => handleClose(false)}
                className="mt-2"
              >
                Fermer
              </Button>
            </div>
          ) : (
            /* ============================================================= */
            /* Formulaire de contact                                         */
            /* ============================================================= */
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

              {/* Champ Email */}
              <div className="space-y-1.5">
                <Label htmlFor="contact-email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="votre@email.com"
                    className={cn("pl-9", errors.email && "border-destructive")}
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              {/* Champ Telephone (optionnel) */}
              <div className="space-y-1.5">
                <Label htmlFor="contact-phone">
                  Telephone{" "}
                  <span className="text-xs text-muted-foreground">(optionnel)</span>
                </Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="contact-phone"
                    type="tel"
                    placeholder="06 12 34 56 78"
                    className="pl-9"
                    {...register("phone")}
                  />
                </div>
              </div>

              {/* Champ Message */}
              <div className="space-y-1.5">
                <Label htmlFor="contact-message">
                  Message <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <MessageSquare className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="contact-message"
                    placeholder="Votre message..."
                    rows={4}
                    className={cn("resize-none pl-9", errors.message && "border-destructive")}
                    {...register("message")}
                  />
                </div>
                {errors.message && (
                  <p className="text-xs text-destructive">{errors.message.message}</p>
                )}
              </div>

              {/* Message d'erreur serveur */}
              {submitState === "error" && serverError && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {serverError}
                </p>
              )}

              {/* Bouton d'envoi */}
              <Button
                type="submit"
                disabled={submitState === "loading"}
                className="w-full gap-2"
              >
                {submitState === "loading" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Envoyer le message
                  </>
                )}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
