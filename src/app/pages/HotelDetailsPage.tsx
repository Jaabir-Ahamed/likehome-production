import { useState, useEffect } from "react";
import {
  useParams,
  Link,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router";
import {
  Star,
  MapPin,
  Heart,
  ArrowLeft,
  Check,
  Users,
  Calendar,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Skeleton } from "../components/ui/skeleton";
import { useCurrency } from "../contexts/CurrencyContext";
import { MapComponent } from "../components/MapComponent";
import { useHotelDetails } from "../../hooks/useHotelDetails";
import type { SearchHotelResult, RoomType } from "../../types/liteapi";

export function HotelDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { convertPrice, getCurrencySymbol } = useCurrency();

  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const guestsParam = Number(searchParams.get("guests")) || 2;

  // Attempt to use hotel data passed via router state from listing page
  const passedHotel = (location.state as { hotel?: SearchHotelResult })?.hotel;

  const { hotel, rates, loading, error, fetchRates } = useHotelDetails(id);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);

  // Fetch rates when we have dates
  useEffect(() => {
    if (id && checkIn && checkOut) {
      fetchRates(checkIn, checkOut, guestsParam, "USD");
    }
  }, [id, checkIn, checkOut, guestsParam, fetchRates]);

  // Merge passed data with fetched data
  const hotelName = hotel?.name ?? passedHotel?.name ?? "Hotel";
  const hotelCity = hotel?.city ?? passedHotel?.city ?? "";
  const hotelCountry =
    hotel?.country?.toUpperCase() ?? passedHotel?.country?.toUpperCase() ?? "";
  const hotelAddress = hotel?.address ?? passedHotel?.address ?? "";
  const hotelStars = hotel?.stars ?? passedHotel?.stars ?? 0;
  const hotelRating = hotel?.rating ?? passedHotel?.rating ?? 0;
  const hotelReviewCount = hotel?.reviewCount ?? passedHotel?.reviewCount ?? 0;
  const hotelDescription =
    hotel?.hotelDescription ?? passedHotel?.hotelDescription ?? "";
  const mainPhoto =
    hotel?.main_photo ?? passedHotel?.main_photo ?? "";
  const hotelImages = hotel?.images?.length
    ? hotel.images
    : [mainPhoto].filter(Boolean);
  const facilities = hotel?.facilities ?? [];

  // Room types from the rates API or from passed search data
  const roomTypes: RoomType[] =
    rates?.data?.[0]?.roomTypes ?? passedHotel?.rates?.roomTypes ?? [];

  const ratingDisplay = (hotelRating / 2).toFixed(1);
  const priceSymbol = getCurrencySymbol();

  // Auto-select cheapest room
  useEffect(() => {
    if (roomTypes.length > 0 && !selectedRoom) {
      setSelectedRoom(roomTypes[0]);
    }
  }, [roomTypes, selectedRoom]);

  const selectedPrice = selectedRoom?.offerRetailRate?.amount ?? 0;
  const totalConverted = convertPrice(selectedPrice);

  if (loading && !passedHotel) {
    return (
      <div className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-10 w-96 mb-4" />
          <Skeleton className="h-5 w-64 mb-8" />
          <Skeleton className="h-[500px] w-full rounded-lg mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !passedHotel) {
    return (
      <div className="w-full bg-gray-50 min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#1f2937] mb-2">
            Failed to Load Hotel
          </h2>
          <p className="text-[#717182] mb-6">{error}</p>
          <Button asChild>
            <Link to="/hotels">Back to Hotels</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to={-1 as unknown as string} onClick={(e) => { e.preventDefault(); navigate(-1); }}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Hotels
          </Link>
        </Button>

        {/* Hotel Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-[#1f2937] mb-2">
                {hotelName}
              </h1>
              <p className="text-lg text-[#717182] flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {hotelCity}
                {hotelCountry ? `, ${hotelCountry}` : ""}{" "}
                {hotelAddress ? `\u2022 ${hotelAddress}` : ""}
              </p>
            </div>
            <button
              className="w-12 h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center hover:border-[#f59e0b] hover:bg-[#f59e0b]/10 transition-colors"
              aria-label="Add to favorites"
            >
              <Heart className="w-6 h-6 text-[#1f2937]" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {hotelStars > 0 && (
              <div className="flex items-center gap-1">
                {Array.from({ length: hotelStars }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-[#f59e0b] text-[#f59e0b]"
                  />
                ))}
              </div>
            )}
            {hotelRating > 0 && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <div className="bg-[#2563eb] text-white px-3 py-1.5 rounded-lg flex items-center gap-1">
                  <Star className="w-4 h-4 fill-white" />
                  <span className="font-bold">{ratingDisplay}</span>
                </div>
                <span className="text-[#717182]">
                  ({hotelReviewCount.toLocaleString()} reviews)
                </span>
              </>
            )}
          </div>
        </div>

        {/* Image Gallery */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="col-span-4 md:col-span-3">
            {hotelImages[selectedImage] ? (
              <img
                src={hotelImages[selectedImage]}
                alt={hotelName}
                className="w-full h-[500px] object-cover rounded-lg"
              />
            ) : (
              <Skeleton className="w-full h-[500px] rounded-lg" />
            )}
          </div>
          {hotelImages.length > 1 && (
            <div className="col-span-4 md:col-span-1 flex md:flex-col gap-4">
              {hotelImages.slice(0, 3).map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`${hotelName} ${index + 1}`}
                  className={`w-full h-[155px] object-cover rounded-lg cursor-pointer transition-all ${
                    selectedImage === index
                      ? "ring-2 ring-[#2563eb]"
                      : "hover:opacity-80"
                  }`}
                  onClick={() => setSelectedImage(index)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {hotelDescription && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold text-[#1f2937] mb-4">
                  About This Hotel
                </h2>
                <div
                  className="text-[#1f2937] leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: hotelDescription }}
                />
              </Card>
            )}

            {/* Facilities */}
            {facilities.length > 0 && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold text-[#1f2937] mb-4">
                  Amenities
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {facilities.map((f) => (
                    <div key={f.id} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#2563eb]" />
                      <span className="text-sm text-[#1f2937]">{f.name}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Available Rooms */}
            {roomTypes.length > 0 && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold text-[#1f2937] mb-4">
                  Available Rooms
                </h2>
                <div className="space-y-4">
                  {roomTypes.map((room) => {
                    const rate = room.rates[0];
                    const price = room.offerRetailRate?.amount ?? 0;
                    const isSelected =
                      selectedRoom?.offerId === room.offerId;
                    const refundable =
                      rate?.cancellationPolicies?.refundableTag === "RFN";

                    return (
                      <div
                        key={room.offerId}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? "border-[#2563eb] bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedRoom(room)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-[#1f2937] mb-1">
                              {rate?.name ?? "Room"}
                            </h3>
                            <div className="flex flex-wrap gap-2 mb-2">
                              <Badge
                                variant="secondary"
                                className="text-xs"
                              >
                                <Users className="w-3 h-3 mr-1" />
                                Max {rate?.maxOccupancy ?? 2} guests
                              </Badge>
                              <Badge
                                variant="secondary"
                                className="text-xs"
                              >
                                {rate?.boardName ?? "Room Only"}
                              </Badge>
                              {refundable && (
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                  Free cancellation
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-bold text-[#1f2937]">
                              {priceSymbol}
                              {convertPrice(price)}
                            </span>
                            <p className="text-xs text-[#717182]">total</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Loading rates */}
            {roomTypes.length === 0 && checkIn && checkOut && (
              <Card className="p-6 text-center">
                <Loader2 className="w-8 h-8 text-[#2563eb] mx-auto mb-3 animate-spin" />
                <p className="text-[#717182]">Loading room rates...</p>
              </Card>
            )}

            {/* Location Map */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-[#1f2937] mb-4">
                Location
              </h2>
              <MapComponent
                location={`${hotelCity}${hotelCountry ? `, ${hotelCountry}` : ""}`}
                height="400px"
              />
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-[#717182] flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#2563eb]" />
                  <span className="font-medium text-[#1f2937]">
                    {hotelAddress}
                  </span>
                  <span>&bull;</span>
                  <span>
                    {hotelCity}
                    {hotelCountry ? `, ${hotelCountry}` : ""}
                  </span>
                </p>
              </div>
            </Card>
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-28">
              {selectedRoom ? (
                <>
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-4xl font-bold text-[#1f2937]">
                        {priceSymbol}
                        {totalConverted}
                      </span>
                      <span className="text-lg text-[#717182]">total</span>
                    </div>
                    <p className="text-sm text-[#717182] mb-2">
                      {selectedRoom.rates[0]?.name}
                    </p>
                    {selectedRoom.rates[0]?.cancellationPolicies
                      ?.refundableTag === "RFN" && (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800"
                      >
                        Free cancellation
                      </Badge>
                    )}
                  </div>

                  <Separator className="my-6" />

                  <div className="space-y-3 mb-6">
                    {checkIn && checkOut && (
                      <div className="flex items-center gap-2 text-sm text-[#1f2937]">
                        <Calendar className="w-4 h-4 text-[#2563eb]" />
                        <span>
                          {new Date(checkIn + "T00:00:00").toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )}{" "}
                          &rarr;{" "}
                          {new Date(checkOut + "T00:00:00").toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" }
                          )}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-[#1f2937]">
                      <Users className="w-4 h-4 text-[#2563eb]" />
                      <span>
                        {guestsParam}{" "}
                        {guestsParam === 1 ? "Guest" : "Guests"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between text-[#1f2937]">
                      <span>Room rate</span>
                      <span>
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
                  </div>

                  <Button
                    className="w-full bg-[#f59e0b] hover:bg-[#d97706] text-white h-12 text-lg"
                    onClick={() =>
                      navigate(
                        `/payment/${id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guestsParam}&offerId=${selectedRoom.offerId}`,
                        {
                          state: {
                            hotel: {
                              id: id,
                              name: hotelName,
                              city: hotelCity,
                              country: hotelCountry,
                              main_photo: mainPhoto,
                              address: hotelAddress,
                            },
                            room: selectedRoom,
                          },
                        }
                      )
                    }
                  >
                    Reserve Now
                  </Button>

                  <p className="text-xs text-center text-[#717182] mt-4">
                    You won't be charged yet
                  </p>
                </>
              ) : (
                <div className="text-center py-8">
                  {checkIn && checkOut ? (
                    <>
                      <Loader2 className="w-8 h-8 text-[#2563eb] mx-auto mb-3 animate-spin" />
                      <p className="text-[#717182]">Loading rates...</p>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-12 h-12 text-[#717182] mx-auto mb-3" />
                      <p className="text-[#717182] mb-4">
                        Select dates to see prices
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => navigate("/hotels")}
                      >
                        Search with Dates
                      </Button>
                    </>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
