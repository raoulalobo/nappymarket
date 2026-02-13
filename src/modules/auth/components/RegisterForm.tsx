/**
 * RegisterForm — Formulaire d'inscription
 *
 * Role : Permettre a un visiteur de creer un compte en choisissant
 *        son role (Cliente ou Coiffeuse). Validation Zod + React Hook Form.
 *
 * Interactions :
 *   - Utilise le hook useAuth() pour la mutation d'inscription
 *   - Valide les champs avec registerSchema (Zod)
 *   - Le choix du role (CLIENT/STYLIST) determine l'experience post-inscription
 *   - Affiche les erreurs de validation en francais
 *   - Redirige selon le role apres inscription reussie (via useAuth)
 *
 * Exemple :
 *   <RegisterForm />
 */
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { Loader2, Scissors, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/shared/components/common/PasswordInput"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { registerSchema, type RegisterSchema } from "@/modules/auth/schemas/auth-schemas"
import { useAuth } from "@/modules/auth/hooks/useAuth"
import { GoogleSignInButton } from "@/modules/auth/components/GoogleSignInButton"

export function RegisterForm() {
  const { register, isLoading } = useAuth()

  // Configuration React Hook Form avec resolver Zod
  const form = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      role: undefined,
    },
  })

  // Soumission du formulaire
  async function onSubmit(data: RegisterSchema) {
    await register(data)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Creer un compte</CardTitle>
        <CardDescription>
          Rejoignez NappyMarket en quelques clics
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* Choix du role : Cliente ou Coiffeuse */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Je suis...</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-2 gap-4"
                    >
                      {/* Option Cliente */}
                      <label
                        htmlFor="role-client"
                        className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors hover:bg-accent ${
                          field.value === "CLIENT"
                            ? "border-primary bg-primary/5"
                            : "border-muted"
                        }`}
                      >
                        <RadioGroupItem
                          value="CLIENT"
                          id="role-client"
                          className="sr-only"
                        />
                        <User className="h-8 w-8" />
                        <span className="text-sm font-medium">Cliente</span>
                        <span className="text-xs text-muted-foreground text-center">
                          Je cherche une coiffeuse
                        </span>
                      </label>

                      {/* Option Coiffeuse */}
                      <label
                        htmlFor="role-stylist"
                        className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors hover:bg-accent ${
                          field.value === "STYLIST"
                            ? "border-primary bg-primary/5"
                            : "border-muted"
                        }`}
                      >
                        <RadioGroupItem
                          value="STYLIST"
                          id="role-stylist"
                          className="sr-only"
                        />
                        <Scissors className="h-8 w-8" />
                        <span className="text-sm font-medium">Coiffeuse</span>
                        <span className="text-xs text-muted-foreground text-center">
                          Je propose mes services
                        </span>
                      </label>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Champs prenom et nom sur la meme ligne */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prenom</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Marie"
                        autoComplete="given-name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Dupont"
                        autoComplete="family-name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Champ email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="votre@email.com"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Champ mot de passe */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="8 caracteres min., 1 majuscule, 1 chiffre"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pt-2">
            {/* Bouton de soumission */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creation du compte...
                </>
              ) : (
                "Creer mon compte"
              )}
            </Button>

            {/* Separateur "ou" entre email/password et Google OAuth */}
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            {/* Bouton d'inscription Google OAuth — redirige vers /choix-role */}
            <GoogleSignInButton callbackURL="/choix-role" />

            {/* Lien vers la connexion */}
            <p className="text-center text-sm text-muted-foreground">
              Deja un compte ?{" "}
              <Link
                href="/connexion"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Se connecter
              </Link>
            </p>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
