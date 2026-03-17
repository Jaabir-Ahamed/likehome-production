import { useState, useEffect } from "react";
import {
  useParams,
  useSearchParams,
  useNavigate,
  Link,
  useLocation,
} from "react-router";
import {
  CreditCard,
  Lock,
  ArrowLeft,
  Check,
  Calendar,
  Users,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { useCurrency } from "../contexts/CurrencyContext";
import { useBooking } from "../../hooks/useBooking";
import { toast } from "sonner";
import type { RoomType } from "../../types/liteapi";

interface PassedState {
  hotel?: {
    id: string;
    name: string;
    city: string;
    country: string;
    main_photo: string;
    address: string;
  };
  room?: RoomType;
}

export function PaymentPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { convertPrice, getCurrencySymbol } = useCurrency();

  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const guests = Number(searchParams.get("guests")) || 2;
  const offerId = searchParams.get("offerId") || "";

  const passedState = location.state as PassedState | null;
  const hotelData = passedState?.hotel;
  const roomData = passedState?.room;

  const { stage, prebookData, error, isOverlapping, prebook, confirm } =
    useBooking();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  // Trigger prebook on mount
  useEffect(() => {
    if (offerId && stage === "idle") {
      prebook(offerId);
    }
  }, [offerId, stage, prebook]);

  const priceSymbol = getCurrencySymbol();

  // Use prebook confirmed pricing, or fall back to room offer price
  const totalAmount =
    prebookData?.totalAmount ??
    roomData?.offerRetailRate?.amount ??
    0;
  const currency =
    prebookData?.currency ?? roomData?.offerRetailRate?.currency ?? "USD";
  const totalConverted = convertPrice(totalAmount);

  const roomName =
    prebookData?.roomTypes?.[0]?.rates?.[0]?.name ??
    roomData?.rates?.[0]?.name ??
    "Room";

  const refundable =
    prebookData?.roomTypes?.[0]?.rates?.[0]?.cancellationPolicies
      ?.refundableTag === "RFN" ||
    roomData?.rates?.[0]?.cancellationPolicies?.refundableTag === "RFN";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const success = await confirm({
      holder: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
      },
      hotelMeta: {
        hotelId: id ?? "",
        hotelName: hotelData?.name ?? "Hotel",
        hotelImage: hotelData?.main_photo ?? "",
        checkIn,
        checkOut,
        guests,
        rooms: 1,
        totalAmount,
        currency,
        offerId,
      },
    });

    if (success) {
      toast.success("Booking confirmed! Check your email for details.");
      navigate("/bookings");
    }
  };

  if (!offerId) {
    return (
      <div className="w-full bg-gray-50 min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#1f2937] mb-2">
            Missing Booking Details
          </h2>
          <p className="text-[#717182] mb-6">
            Please select a room from the hotel details page first.
          </p>
          <Button asChild>
            <Link to="/hotels">Browse Hotels</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link
            to={`/hotel/${id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Hotel Details
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#1f2937] mb-2">
                Complete Your Booking
              </h1>
              <p className="text-lg text-[#717182]">
                You're just one step away from your perfect stay
              </p>
            </div>

            {/* Prebooking state */}
            {stage === "prebooking" && (
              <Card className="p-8 text-center">
                <Loader2 className="w-10 h-10 text-[#2563eb] mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-semibold text-[#1f2937] mb-2">
                  Confirming Availability
                </h3>
                <p className="text-[#717182]">
                  Checking live rates and availability for your room...
                </p>
              </Card>
            )}

            {/* Error state */}
            {error && (
              <Card
                className={`p-6 ${isOverlapping ? "border-amber-300 bg-amber-50" : "border-red-300 bg-red-50"}`}
              >
                <div className="flex gap-3">
                  <AlertTriangle
                    className={`w-6 h-6 mt-0.5 flex-shrink-0 ${isOverlapping ? "text-amber-500" : "text-red-500"}`}
                  />
                  <div>
                    <h3
                      className={`font-semibold mb-1 ${isOverlapping ? "text-amber-800" : "text-red-800"}`}
                    >
                      {isOverlapping
                        ? "Overlapping Booking Detected"
                        : "Booking Error"}
                    </h3>
                    <p
                      className={`text-sm ${isOverlapping ? "text-amber-700" : "text-red-700"}`}
                    >
                      {error}
                    </p>
                    {isOverlapping && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => navigate("/bookings")}
                      >
                        View My Bookings
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Guest Information Form */}
            {(stage === "prebooked" || stage === "booking" || stage === "error") && (
              <Card className="p-6">
                <h2 className="text-xl font-bold text-[#1f2937] mb-4">
                  Guest Information
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({ ...formData, firstName: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      required
                    />
                  </div>

                  <Separator className="my-6" />
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="w-5 h-5 text-[#2563eb]" />
                    <h3 className="text-lg font-bold text-[#1f2937]">
                      Payment
                    </h3>
                    <Lock className="w-4 h-4 text-green-600 ml-auto" />
                    <span className="text-sm text-green-600">
                      Secure Payment
                    </span>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-[#1f2937]">
                      Payment will be processed securely through LiteAPI.
                      In sandbox mode, no real charges will be made.
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <p className="text-sm text-[#1f2937]">
                      By completing this booking, you agree to the{" "}
                      <a href="#" className="text-[#2563eb] hover:underline">
                        Terms & Conditions
                      </a>{" "}
                      and{" "}
                      <a href="#" className="text-[#2563eb] hover:underline">
                        Cancellation Policy
                      </a>
                      .
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={stage === "booking"}
                    className="w-full bg-[#f59e0b] hover:bg-[#d97706] text-white h-12 text-lg mt-6"
                  >
                    {stage === "booking" ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      `Confirm and Pay ${priceSymbol}${totalConverted}`
                    )}
                  </Button>
                </form>
              </Card>
            )}
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-28">
              <h2 className="text-xl font-bold text-[#1f2937] mb-4">
                Booking Summary
              </h2>

              {hotelData?.main_photo ? (
                <div className="mb-6">
                  <img
                    src={hotelData.main_photo}
                    alt={hotelData.name}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                  <h3 className="font-bold text-[#1f2937] mb-1">
                    {hotelData.name}
                  </h3>
                  <p className="text-sm text-[#717182]">
                    {hotelData.city}
                    {hotelData.country ? `, ${hotelData.country}` : ""}
                  </p>
                </div>
              ) : (
                <Skeleton className="w-full h-48 rounded-lg mb-6" />
              )}

              <Separator className="my-4" />

              <div className="space-y-3 mb-6">
                <p className="text-sm font-medium text-[#1f2937]">
                  {roomName}
                </p>
                {checkIn && checkOut && (
                  <div className="flex items-center gap-2 text-[#1f2937]">
                    <Calendar className="w-4 h-4 text-[#2563eb]" />
                    <span className="text-sm">
                      {new Date(checkIn + "T00:00:00").toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric" }
                      )}{" "}
                      &rarr;{" "}
                      {new Date(checkOut + "T00:00:00").toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-[#1f2937]">
                  <Users className="w-4 h-4 text-[#2563eb]" />
                  <span className="text-sm">
                    {guests} {guests === 1 ? "Guest" : "Guests"}
                  </span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-3 mb-4">
                {stage === "prebooking" ? (
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-3/4" />
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-[#1f2937]">
                      <span className="text-sm">Room total</span>
                      <span className="text-sm">
                        {priceSymbol}
                        {totalConverted}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg text-[#1f2937]">
                      <span>Total</span>
                      <span>
                        {priceSymbol}
                        {totalConverted}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {refundable && (
                <Badge
                  variant="secondary"
                  className="w-full justify-center bg-green-100 text-green-800 py-2"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Free cancellation
                </Badge>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
