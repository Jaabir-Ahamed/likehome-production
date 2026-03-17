import {
  MapPin,
  Calendar,
  Users,
  CreditCard,
  Download,
  X,
  Loader2,
  AlertCircle,
  Hotel,
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Skeleton } from "../components/ui/skeleton";
import { useCurrency } from "../contexts/CurrencyContext";
import { useMyBookings } from "../../hooks/useMyBookings";
import { toast } from "sonner";
import type { Booking } from "../../types/database";
import { useState } from "react";

function BookingCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-64 h-48 md:h-auto">
          <Skeleton className="w-full h-full" />
        </div>
        <div className="flex-1 p-6 space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    </Card>
  );
}

export function MyBookingsPage() {
  const { convertPrice, getCurrencySymbol } = useCurrency();
  const { scheduled, previous, loading, error, cancelBooking } =
    useMyBookings();
  const [activeTab, setActiveTab] = useState("scheduled");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancelBooking = async (booking: Booking) => {
    setCancellingId(booking.id);
    const success = await cancelBooking(booking.id);
    setCancellingId(null);

    if (success) {
      toast.success("Booking cancelled successfully.");
    } else {
      toast.error("Failed to cancel booking.");
    }
  };

  const priceSymbol = getCurrencySymbol();

  const renderBookingCard = (booking: Booking, canCancel: boolean) => (
    <Card
      key={booking.id}
      className="overflow-hidden border-gray-200 hover:shadow-lg transition-shadow"
    >
      <div className="flex flex-col md:flex-row">
        <div className="md:w-64 h-48 md:h-auto relative">
          {booking.hotel_image ? (
            <img
              src={booking.hotel_image}
              alt={booking.hotel_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <Hotel className="w-12 h-12 text-gray-400" />
            </div>
          )}
          <Badge
            className={`absolute top-4 right-4 ${
              booking.status === "reserved"
                ? "bg-[#10b981] hover:bg-[#059669]"
                : booking.status === "cancelled"
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-[#6b7280] hover:bg-[#4b5563]"
            }`}
          >
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </Badge>
        </div>

        <div className="flex-1 p-6">
          <div className="flex flex-col md:flex-row justify-between mb-4">
            <div>
              <h3 className="font-bold text-[#1f2937] mb-2">
                {booking.hotel_name}
              </h3>
              {booking.hotel_id && (
                <div className="flex items-center gap-2 text-[#6b7280] mb-4">
                  <MapPin className="w-4 h-4" />
                  <span>Hotel ID: {booking.hotel_id}</span>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="font-bold text-[#2563eb] mb-1">
                {priceSymbol}
                {convertPrice(booking.total_amount)}
              </div>
              <div className="text-sm text-[#6b7280]">
                {booking.currency}
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#6b7280]" />
              <div>
                <div className="text-sm text-[#6b7280]">Check-in</div>
                <div className="font-medium text-[#1f2937]">
                  {new Date(booking.check_in + "T00:00:00").toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#6b7280]" />
              <div>
                <div className="text-sm text-[#6b7280]">Check-out</div>
                <div className="font-medium text-[#1f2937]">
                  {new Date(booking.check_out + "T00:00:00").toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-[#6b7280]" />
              <div>
                <div className="text-sm text-[#6b7280]">Guests & Rooms</div>
                <div className="font-medium text-[#1f2937]">
                  {booking.guests} Guest{booking.guests > 1 ? "s" : ""},{" "}
                  {booking.rooms} Room{booking.rooms > 1 ? "s" : ""}
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-[#6b7280]">
              <CreditCard className="w-4 h-4" />
              <span>
                Booking Ref:{" "}
                <span className="font-medium text-[#1f2937]">
                  {booking.liteapi_booking_id ?? booking.id.slice(0, 8)}
                </span>
              </span>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </Button>
              {canCancel && booking.status === "reserved" && (
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={cancellingId === booking.id}
                  onClick={() => handleCancelBooking(booking)}
                >
                  {cancellingId === booking.id ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <X className="w-4 h-4 mr-2" />
                  )}
                  Cancel Booking
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="font-bold text-[#1f2937] mb-2">My Bookings</h1>
          <p className="text-[#6b7280]">
            Manage your hotel reservations and view booking history
          </p>
        </div>

        {error && (
          <Card className="p-6 mb-6 border-red-200 bg-red-50">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          </Card>
        )}

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 w-full max-w-md mb-8 bg-white border border-gray-200">
            <TabsTrigger
              value="scheduled"
              className="data-[state=active]:bg-[#2563eb] data-[state=active]:text-white"
            >
              Upcoming ({scheduled.length})
            </TabsTrigger>
            <TabsTrigger
              value="previous"
              className="data-[state=active]:bg-[#2563eb] data-[state=active]:text-white"
            >
              Past & Cancelled ({previous.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scheduled" className="space-y-6">
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <BookingCardSkeleton key={i} />
              ))
            ) : scheduled.length > 0 ? (
              scheduled.map((booking) => renderBookingCard(booking, true))
            ) : (
              <Card className="p-12 text-center border-gray-200">
                <Calendar className="w-16 h-16 text-[#6b7280] mx-auto mb-4" />
                <h3 className="font-semibold text-[#1f2937] mb-2">
                  No Upcoming Bookings
                </h3>
                <p className="text-[#6b7280] mb-6">
                  You don't have any upcoming reservations.
                </p>
                <Button asChild className="bg-[#2563eb] hover:bg-[#1d4ed8]">
                  <a href="/hotels">Browse Hotels</a>
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="previous" className="space-y-6">
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <BookingCardSkeleton key={i} />
              ))
            ) : previous.length > 0 ? (
              previous.map((booking) => renderBookingCard(booking, false))
            ) : (
              <Card className="p-12 text-center border-gray-200">
                <Calendar className="w-16 h-16 text-[#6b7280] mx-auto mb-4" />
                <h3 className="font-semibold text-[#1f2937] mb-2">
                  No Past Bookings
                </h3>
                <p className="text-[#6b7280]">
                  Your booking history will appear here.
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
