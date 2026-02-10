/**
 * PasswordInput — Champ de mot de passe avec toggle de visibilite
 *
 * Role : Remplace l'Input standard pour les champs password en ajoutant
 *        un bouton oeil (Eye/EyeOff) qui bascule entre type="password"
 *        et type="text" pour afficher/masquer le mot de passe.
 *
 * Interactions :
 *   - Compatible avec React Hook Form (accepte les memes props que <Input>)
 *   - Utilise dans LoginForm, RegisterForm, ChangePasswordForm, ResetPasswordForm
 *   - L'icone EyeOff (barre) = mot de passe masque, Eye (ouvert) = visible
 *
 * Exemple :
 *   <PasswordInput placeholder="Votre mot de passe" autoComplete="current-password" {...field} />
 */
"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/** PasswordInput accepte les memes props que <Input> sauf `type` (force en password/text) */
type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, "type">

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    /** Etat de visibilite du mot de passe (false = masque, true = visible) */
    const [showPassword, setShowPassword] = React.useState(false)

    return (
      <div className="relative">
        {/* Champ input — bascule entre password et text selon l'etat */}
        <Input
          type={showPassword ? "text" : "password"}
          className={cn("pr-10", className)}
          ref={ref}
          {...props}
        />

        {/* Bouton toggle visibilite — positionne a droite dans l'input */}
        <button
          type="button"
          tabIndex={-1}
          aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-0 top-0 flex h-full items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          {showPassword ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </button>
      </div>
    )
  }
)

PasswordInput.displayName = "PasswordInput"

export { PasswordInput }
