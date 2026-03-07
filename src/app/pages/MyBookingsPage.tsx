import { useState } from "react";
import {
  MapPin,
  Calendar,
  Users,
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

// Mock bookings data
const scheduledBookings = [
  {
    id: 1,
    hotelName: "The Grand Palace Hotel",
    location: "Paris, France",
    image:
      "https://images.unsplash.com/photo-1572177215152-32f247303126?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3RlbCUyMGJlZHJvb218ZW58MXx8fHwxNzcxOTA0ODUxfDA&ixlib=rb-4.1.0&q=80&w=1080",
    checkIn: "2026-03-15",
    checkOut: "2026-03-18",
    guests: 2,
    rooms: 1,
    total: 960,
    status: "Reserved",
    bookingRef: "BK-2026-001",
  },
  {
    id: 2,
    hotelName: "Ocean View Resort",
    location: "Bali, Indonesia",
    image:
      "https://images.unsplash.com/photo-1729717949782-f40c4a07e3c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWFjaCUyMHJlc29ydCUyMGhvdGVsfGVufDF8fHx8MTc3MTg1Mjk5Nnww&ixlib=rb-4.1.0&q=80&w=1080",
    checkIn: "2026-04-10",
    checkOut: "2026-04-15",
    guests: 2,
    rooms: 1,
    total: 900,
    status: "Reserved",
    bookingRef: "BK-2026-002",
  },
  {
    id: 3,
    hotelName: "Skyline Boutique Hotel",
    location: "Tokyo, Japan",
    image:
      "https://images.unsplash.com/photo-1664908790579-34b71154f603?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib3V0aXF1ZSUyMGhvdGVsJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzcxODA2NDA3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    checkIn: "2026-05-20",
    checkOut: "2026-05-24",
    guests: 1,
    rooms: 1,
    total: 960,
    status: "Reserved",
    bookingRef: "BK-2026-003",
  },
];

const previousBookings = [
  {
    id: 4,
    hotelName: "Metropolitan Suites",
    location: "New York, USA",
    image:
      "https://images.unsplash.com/photo-1731336478850-6bce7235e320?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3RlbCUyMHN1aXRlJTIwbHV4dXJ5fGVufDF8fHx8MTc3MTgxOTE3Nnww&ixlib=rb-4.1.0&q=80&w=1080",
    checkIn: "2026-02-10",
    checkOut: "2026-02-14",
    guests: 2,
    rooms: 1,
    total: 1120,
    status: "Completed",
    bookingRef: "BK-2026-004",
  },
  {
    id: 5,
    hotelName: "City Lights Premium",
    location: "Dubai, UAE",
    image:
      "https://images.unsplash.com/photo-1661191891844-2e7980ae1c94?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwaG90ZWwlMjByb290dG9wfGVufDF8fHx8MTc3MTkwNDg1Mnww&ixlib=rb-4.1.0&q=80&w=1080",
    checkIn: "2026-01-05",
    checkOut: "2026-01-10",
    guests: 2,
    rooms: 1,
    total: 1750,
    status: "Completed",
    bookingRef: "BK-2025-012",
  },
  {
    id: 6,
    hotelName: "The Grand Palace Hotel",
    location: "Paris, France",
    image:
      "https://images.unsplash.com/photo-1572177215152-32f247303126?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3RlbCUyMGJlZHJvb218ZW58MXx8fHwxNzcxOTA0ODUxfDA&ixlib=rb-4.1.0&q=80&w=1080",
    checkIn: "2025-12-20",
    checkOut: "2025-12-25",
    guests: 3,
    rooms: 2,
    total: 1600,
    status: "Completed",
    bookingRef: "BK-2025-008",
  },
];

export function MyBookingsPage() {
  const { convertPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState("scheduled");

  const handleCancelBooking = (id: number) => {
    // Handle booking cancellation
    console.log("Cancelling booking:", id);
  };

  const handleDownloadReceipt = (bookingRef: string) => {
    // Handle receipt download
    console.log("Downloading receipt:", bookingRef);
  };

  const renderBookingCard = (
    booking: (typeof scheduledBookings)[0],
    canCancel: boolean,
  ) => (
    <Card
      key={booking.id}
      className="overflow-hidden border-gray-200 hover:shadow-lg transition-shadow"
    >
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="md:w-64 h-48 md:h-auto relative">
          <img
            src={booking.image}
            alt={booking.hotelName}
            className="w-full h-full object-cover"
          />
          <Badge
            className={`absolute top-4 right-4 ${
              booking.status === "Reserved"
                ? "bg-[#10b981] hover:bg-[#059669]"
                : "bg-[#6b7280] hover:bg-[#4b5563]"
            }`}
          >
            {booking.status}
          </Badge>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="flex flex-col md:flex-row justify-between mb-4">
            <div>
              <h3 className="font-bold text-[#1f2937] mb-2">
                {booking.hotelName}
              </h3>
              <div className="flex items-center gap-2 text-[#6b7280] mb-4">
                <MapPin className="w-4 h-4" />
                <span>{booking.location}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-[#2563eb] mb-1">
                {convertPrice(booking.total)}
              </div>
              <div className="text-sm text-[#6b7280]">
                Total
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#6b7280]" />
              <div>
                <div className="text-sm text-[#6b7280]">
                  Check-in
                </div>
                <div className="font-medium text-[#1f2937]">
                  {new Date(booking.checkIn).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    },
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#6b7280]" />
              <div>
                <div className="text-sm text-[#6b7280]">
                  Check-out
                </div>
                <div className="font-medium text-[#1f2937]">
                  {new Date(
                    booking.checkOut,
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-[#6b7280]" />
              <div>
                <div className="text-sm text-[#6b7280]">
                  Guests & Rooms
                </div>
                <div className="font-medium text-[#1f2937]">
                  {booking.guests} Guests, {booking.rooms} Room
                  {booking.rooms > 1 ? "s" : ""}
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
                  {booking.bookingRef}
                </span>
              </span>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleDownloadReceipt(booking.bookingRef)
                }
              >
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </Button>
              {canCancel && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() =>
                    handleCancelBooking(booking.id)
                  }
                >
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-bold text-[#1f2937] mb-2">
            My Bookings
          </h1>
          <p className="text-[#6b7280]">
            Manage your hotel reservations and view booking
            history
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
              scheduledBookings.map((booking) =>
                renderBookingCard(booking, true),
              )
            ) : (
              <Card className="p-12 text-center border-gray-200">
                <Calendar className="w-16 h-16 text-[#6b7280] mx-auto mb-4" />
                <h3 className="font-semibold text-[#1f2937] mb-2">
                  No Scheduled Bookings
                </h3>
                <p className="text-[#6b7280] mb-6">
                  You don't have any upcoming reservations.
                </p>
                <Button className="bg-[#2563eb] hover:bg-[#1d4ed8]">
                  Browse Hotels
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="previous" className="space-y-6">
            {previousBookings.length > 0 ? (
              previousBookings.map((booking) =>
                renderBookingCard(booking, false),
              )
            ) : (
              <Card className="p-12 text-center border-gray-200">
                <Calendar className="w-16 h-16 text-[#6b7280] mx-auto mb-4" />
                <h3 className="font-semibold text-[#1f2937] mb-2">
                  No Previous Bookings
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