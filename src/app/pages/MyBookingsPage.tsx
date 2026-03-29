import { useState, useEffect } from "react";
import {
  MapPin,
  Calendar,
  CreditCard,
  Download,
  X,
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
import { useCurrency } from "../contexts/CurrencyContext";
import { api } from "../../api/liteApi";

interface BookingDetail {
  bookingId: string;
  status: string;
  hotelName?: string;
  checkin: string;
  checkout: string;
  holder?: { firstName: string; lastName: string };
  totalAmount?: number;
  currency?: string;
  clientReference?: string;
  roomTypeName?: string;
}

export function MyBookingsPage() {
  const { convertPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState("scheduled");
  const [bookings, setBookings] = useState<BookingDetail[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    api.getListBookings()
      .then(async ({ data: rows }) => {
        const capped = (rows as { booking_id: string }[]).slice(0, 20);
        const details = await Promise.all(
          capped.map(r => api.getBooking(r.booking_id).catch(() => null))
        );
        setBookings(
          details
            .filter(Boolean)
            .map((d: any) => d?.data ?? d)
            .filter((b: any) => b?.bookingId)
        );
      })
      .catch(err => setFetchError(err.message))
      .finally(() => setLoadingBookings(false));
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const scheduledBookings = bookings.filter(b => b.checkin >= today && b.status !== 'CANCELLED');
  const previousBookings = bookings.filter(b => b.checkin < today || b.status === 'CANCELLED');

  const handleCancelBooking = (bookingId: string) => {
    console.log("Cancelling booking:", bookingId);
  };

  const handleDownloadReceipt = (bookingId: string) => {
    console.log("Downloading receipt:", bookingId);
  };

  const renderBookingCard = (booking: BookingDetail, canCancel: boolean) => (
    <Card
      key={booking.bookingId}
      className="overflow-hidden border-gray-200 hover:shadow-lg transition-shadow"
    >
      <div className="flex flex-col md:flex-row">
        {/* Status bar */}
        <div className="md:w-4 bg-[#2563eb]" />

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="flex flex-col md:flex-row justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-[#1f2937]">
                  {booking.hotelName ?? 'Hotel Booking'}
                </h3>
                <Badge
                  className={
                    booking.status === 'CONFIRMED'
                      ? "bg-[#10b981] hover:bg-[#059669]"
                      : booking.status === 'CANCELLED'
                      ? "bg-[#ef4444] hover:bg-[#dc2626]"
                      : "bg-[#6b7280] hover:bg-[#4b5563]"
                  }
                >
                  {booking.status}
                </Badge>
              </div>
              {booking.roomTypeName && (
                <div className="flex items-center gap-2 text-[#6b7280] mb-1">
                  <MapPin className="w-4 h-4" />
                  <span>{booking.roomTypeName}</span>
                </div>
              )}
            </div>
            <div className="text-right">
              {booking.totalAmount != null && (
                <>
                  <div className="font-bold text-[#2563eb] mb-1">
                    {convertPrice(booking.totalAmount)}
                  </div>
                  <div className="text-sm text-[#6b7280]">Total</div>
                </>
              )}
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#6b7280]" />
              <div>
                <div className="text-sm text-[#6b7280]">Check-in</div>
                <div className="font-medium text-[#1f2937]">
                  {new Date(booking.checkin).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#6b7280]" />
              <div>
                <div className="text-sm text-[#6b7280]">Check-out</div>
                <div className="font-medium text-[#1f2937]">
                  {new Date(booking.checkout).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-[#6b7280]">
              <CreditCard className="w-4 h-4" />
              <span>
                Booking ID:{" "}
                <span className="font-medium text-[#1f2937]">{booking.bookingId}</span>
              </span>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" size="sm" onClick={() => handleDownloadReceipt(booking.bookingId)}>
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </Button>
              {canCancel && (
                <Button variant="destructive" size="sm" onClick={() => handleCancelBooking(booking.bookingId)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel Booking
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  if (loadingBookings) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#2563eb] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-[#ef4444] mb-2">Failed to load bookings</p>
          <p className="text-sm text-[#6b7280]">{fetchError}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-bold text-[#1f2937] mb-2">
            My Bookings
          </h1>
          <p className="text-[#6b7280]">
            Manage your hotel reservations and view booking history
          </p>
        </div>

        {/* Tabs */}
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
              Scheduled Bookings ({scheduledBookings.length})
            </TabsTrigger>
            <TabsTrigger
              value="previous"
              className="data-[state=active]:bg-[#2563eb] data-[state=active]:text-white"
            >
              Previous Bookings ({previousBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scheduled" className="space-y-6">
            {scheduledBookings.length > 0 ? (
              scheduledBookings.map(booking => renderBookingCard(booking, true))
            ) : (
              <Card className="p-12 text-center border-gray-200">
                <Calendar className="w-16 h-16 text-[#6b7280] mx-auto mb-4" />
                <h3 className="font-semibold text-[#1f2937] mb-2">No Scheduled Bookings</h3>
                <p className="text-[#6b7280] mb-6">You don't have any upcoming reservations.</p>
                <Button className="bg-[#2563eb] hover:bg-[#1d4ed8]">Browse Hotels</Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="previous" className="space-y-6">
            {previousBookings.length > 0 ? (
              previousBookings.map(booking => renderBookingCard(booking, false))
            ) : (
              <Card className="p-12 text-center border-gray-200">
                <Calendar className="w-16 h-16 text-[#6b7280] mx-auto mb-4" />
                <h3 className="font-semibold text-[#1f2937] mb-2">No Previous Bookings</h3>
                <p className="text-[#6b7280]">Your booking history will appear here.</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}