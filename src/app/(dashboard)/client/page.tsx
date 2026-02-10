/**
 * Page Espace Cliente — /client
 *
 * Role : Dashboard de la cliente connectee. Affiche un apercu
 *        des prochaines reservations et des actions rapides.
 *
 * Interactions :
 *   - Protegee par le middleware (cookie de session requis)
 *   - Le layout dashboard verifie la session cote serveur
 *   - La verification du role CLIENT se fait ici
 *   - Charge les prochaines reservations depuis la BDD
 *
 * Exemple d'URL : /client
 */
import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/shared/lib/auth/get-session"
import { db } from "@/shared/lib/db"
import { BookingStatusBadge } from "@/modules/booking/components/BookingStatusBadge"
import { formatDate, formatTime, formatPrice } from "@/shared/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, ArrowRight, User, Search } from "lucide-react"

export default async function ClientDashboardPage() {
  const session = await getSession()

  // Verification du role : seules les clientes peuvent acceder a cette page
  if (session?.user.role === "STYLIST") {
    redirect("/coiffeuse/dashboard")
  }
  if (session?.user.role === "ADMIN") {
    redirect("/admin/dashboard")
  }

  // Charger les prochaines reservations (non annulees, date >= aujourd'hui)
  const upcomingBookings = await db.booking.findMany({
    where: {
      clientId: session!.user.id,
      status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
      date: { gte: new Date() },
    },
    include: {
      service: { include: { category: true } },
      stylist: {
        include: {
          user: { select: { name: true, firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { date: "asc" },
    take: 5,
  })

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">
          Bonjour {session?.user.firstName ?? session?.user.name} !
        </h1>
        <p className="mt-1 text-muted-foreground">
          Bienvenue dans votre espace cliente.
        </p>
      </div>

      {/* Prochaines reservations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Prochaines reservations</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/client/reservations">
              Voir tout
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {upcomingBookings.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-muted-foreground">
                Aucune reservation a venir.
              </p>
              <Button asChild className="mt-3" size="sm">
                <Link href="/recherche">
                  <Search className="mr-2 h-3.5 w-3.5" />
                  Trouver une coiffeuse
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((booking) => {
                const stylistName =
                  booking.stylist.user.firstName && booking.stylist.user.lastName
                    ? `${booking.stylist.user.firstName} ${booking.stylist.user.lastName}`
                    : booking.stylist.user.name
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
                          {stylistName}
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
