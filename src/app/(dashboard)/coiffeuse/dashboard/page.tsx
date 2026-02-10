/**
 * Page Dashboard Coiffeuse — /coiffeuse/dashboard
 *
 * Role : Tableau de bord de la coiffeuse connectee. Affiche un apercu
 *        des dernieres reservations recues et des actions rapides.
 *
 * Interactions :
 *   - Protegee par le proxy (cookie de session requis)
 *   - Protegee par le DAL (requireRole verifie session + role STYLIST)
 *   - Charge les 5 dernieres reservations depuis la BDD
 *   - Liens rapides vers les pages de gestion (disponibilites, prestations, etc.)
 *
 * Exemple d'URL : /coiffeuse/dashboard
 */
import Link from "next/link"
import { requireRole } from "@/shared/lib/auth/dal"
import { db } from "@/shared/lib/db"
import { BookingStatusBadge } from "@/modules/booking/components/BookingStatusBadge"
import { formatDate, formatTime, formatPrice } from "@/shared/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, ArrowRight, User } from "lucide-react"

export default async function StylistDashboardPage() {
  // Verification session + role STYLIST (redirige automatiquement sinon)
  const session = await requireRole("STYLIST")

  // Charger le profil coiffeuse pour obtenir l'ID
  const profile = await db.stylistProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  // Charger les 5 dernieres reservations
  const recentBookings = profile
    ? await db.booking.findMany({
        where: { stylistId: profile.id },
        include: {
          client: { select: { name: true, firstName: true, lastName: true } },
          service: { include: { category: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      })
    : []

  // Compter les reservations en attente
  const pendingCount = profile
    ? await db.booking.count({
        where: { stylistId: profile.id, status: "PENDING" },
      })
    : 0

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">
          Bonjour {session.user.firstName ?? session.user.name} !
        </h1>
        <p className="mt-1 text-muted-foreground">
          Bienvenue dans votre espace coiffeuse.
        </p>
      </div>

      {/* Alerte reservations en attente */}
      {pendingCount > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center justify-between p-4">
            <p className="text-sm font-medium text-yellow-800">
              {pendingCount} reservation{pendingCount > 1 ? "s" : ""} en attente
              de confirmation
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/coiffeuse/reservations">
                Voir
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dernieres reservations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Dernieres reservations</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/coiffeuse/reservations">
              Voir tout
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground">
              Aucune reservation pour le moment.
              Configurez vos disponibilites pour recevoir des reservations.
            </p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((booking) => {
                const clientName =
                  booking.client.firstName && booking.client.lastName
                    ? `${booking.client.firstName} ${booking.client.lastName}`
                    : booking.client.name
                return (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <BookingStatusBadge status={booking.status} />
                        <span className="flex items-center gap-1 text-sm">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          {clientName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(new Date(booking.date))}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatTime(booking.startTime)}
                        </span>
                        <span>{booking.service.category.name}</span>
                      </div>
                    </div>
                    <span className="font-semibold text-primary">
                      {formatPrice(booking.totalPrice)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
