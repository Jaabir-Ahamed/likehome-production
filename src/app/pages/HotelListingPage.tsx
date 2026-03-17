import { useState } from "react";
import { useSearchParams, Link } from "react-router";
import {
  Star,
  MapPin,
  Wifi,
  Utensils,
  ParkingSquare,
  Dumbbell,
  Heart,
  Map,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Slider } from "../components/ui/slider";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import { Skeleton } from "../components/ui/skeleton";
import { useCurrency } from "../contexts/CurrencyContext";
import { SearchComponent } from "../components/SearchComponent";
import { MapComponent } from "../components/MapComponent";
import { useHotelSearch } from "../../hooks/useHotelSearch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import type { SearchHotelResult } from "../../types/liteapi";

const amenityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  wifi: Wifi,
  restaurant: Utensils,
  parking: ParkingSquare,
  gym: Dumbbell,
};

function getAmenityLabels(facilityIds: number[]): string[] {
  const labels: string[] = [];
  if (facilityIds.includes(28) || facilityIds.includes(109)) labels.push("wifi");
  if (facilityIds.includes(3) || facilityIds.includes(4)) labels.push("restaurant");
  if (facilityIds.includes(16)) labels.push("parking");
  if (facilityIds.includes(91) || facilityIds.includes(48)) labels.push("gym");
  return labels;
}

function HotelCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-1/3">
          <Skeleton className="w-full h-64 md:h-full" />
        </div>
        <div className="md:w-2/3 p-6 space-y-4">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
          <div className="flex justify-between items-end pt-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function HotelListingPage() {
  const { convertPrice, getCurrencySymbol } = useCurrency();
  const [searchParams] = useSearchParams();

  const cityName = searchParams.get("location") || "";
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const guestsParam = Number(searchParams.get("guests")) || 2;

  const { hotels, loading, error } = useHotelSearch({
    cityName,
    checkin: checkIn,
    checkout: checkOut,
    guests: guestsParam,
  });

  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedStars, setSelectedStars] = useState<number[]>([]);
  const [guestRating, setGuestRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState("recommended");
  const [showMap, setShowMap] = useState(false);

  const handleStarToggle = (star: number) => {
    setSelectedStars((prev) =>
      prev.includes(star) ? prev.filter((s) => s !== star) : [...prev, star]
    );
  };

  const filteredHotels = hotels
    .filter((hotel: SearchHotelResult) => {
      const price = hotel.lowestRate ?? 0;
      const priceMatch = price >= priceRange[0] && price <= priceRange[1];
      const starMatch =
        selectedStars.length === 0 || selectedStars.includes(hotel.stars);
      const ratingNormalized = (hotel.rating ?? 0) / 2;
      const ratingMatch = ratingNormalized >= guestRating;
      return priceMatch && starMatch && ratingMatch;
    })
    .sort((a: SearchHotelResult, b: SearchHotelResult) => {
      if (sortBy === "price-low")
        return (a.lowestRate ?? 9999) - (b.lowestRate ?? 9999);
      if (sortBy === "price-high")
        return (b.lowestRate ?? 0) - (a.lowestRate ?? 0);
      if (sortBy === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
      return 0;
    });

  const hasSearchParams = cityName && checkIn && checkOut;

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1f2937] mb-2">
            {cityName
              ? `Hotels in ${cityName}`
              : "Find Your Perfect Stay"}
          </h1>
          <p className="text-lg text-[#717182]">
            {loading
              ? "Searching for the best rates..."
              : `${filteredHotels.length} hotels available`}
          </p>
        </div>

        <div className="mb-8">
          <SearchComponent />
        </div>

        {!hasSearchParams && (
          <Card className="p-12 text-center">
            <MapPin className="w-16 h-16 text-[#717182] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#1f2937] mb-2">
              Start Your Search
            </h3>
            <p className="text-[#717182]">
              Enter a destination, dates, and number of guests to find available
              hotels.
            </p>
          </Card>
        )}

        {hasSearchParams && (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <aside className="w-full lg:w-1/4">
              <Card className="p-6 sticky top-28">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[#1f2937]">Filters</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMap(!showMap)}
                    className="text-[#2563eb]"
                  >
                    <Map className="w-4 h-4 mr-2" />
                    {showMap ? "Hide Map" : "Show Map"}
                  </Button>
                </div>

                <Accordion
                  type="multiple"
                  defaultValue={["price", "stars"]}
                  className="w-full"
                >
                  <AccordionItem value="price">
                    <AccordionTrigger className="text-base font-medium">
                      Price Range
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        <Slider
                          min={0}
                          max={1000}
                          step={10}
                          value={priceRange}
                          onValueChange={setPriceRange}
                          className="w-full"
                        />
                        <div className="flex items-center justify-between text-sm text-[#717182]">
                          <span>${priceRange[0]}</span>
                          <span>${priceRange[1]}</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="stars">
                    <AccordionTrigger className="text-base font-medium">
                      Star Rating
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        {[5, 4, 3, 2, 1].map((star) => (
                          <div
                            key={star}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`star-${star}`}
                              checked={selectedStars.includes(star)}
                              onCheckedChange={() => handleStarToggle(star)}
                            />
                            <Label
                              htmlFor={`star-${star}`}
                              className="flex items-center cursor-pointer"
                            >
                              <div className="flex items-center gap-1">
                                {Array.from({ length: star }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]"
                                  />
                                ))}
                              </div>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="guestRating">
                    <AccordionTrigger className="text-base font-medium">
                      Guest Rating
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        {[
                          { value: 4.5, label: "9+ Exceptional" },
                          { value: 4.0, label: "8+ Excellent" },
                          { value: 3.5, label: "7+ Very Good" },
                          { value: 3.0, label: "6+ Good" },
                          { value: 0, label: "All Ratings" },
                        ].map((rating) => (
                          <div
                            key={rating.value}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`rating-${rating.value}`}
                              checked={guestRating === rating.value}
                              onCheckedChange={() =>
                                setGuestRating(rating.value)
                              }
                            />
                            <Label
                              htmlFor={`rating-${rating.value}`}
                              className="cursor-pointer"
                            >
                              {rating.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <Button
                  variant="outline"
                  className="w-full mt-6"
                  onClick={() => {
                    setPriceRange([0, 1000]);
                    setSelectedStars([]);
                    setGuestRating(0);
                  }}
                >
                  Clear All Filters
                </Button>
              </Card>
            </aside>

            {/* Main Content */}
            <main className="flex-1">
              {showMap && (
                <div className="mb-6">
                  <MapComponent
                    location={`Hotels in ${cityName}`}
                    height="400px"
                    className="w-full"
                  />
                </div>
              )}

              <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-sm text-[#717182]">
                  {loading
                    ? "Loading..."
                    : `Showing ${filteredHotels.length} properties`}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#1f2937]">
                    Sort by:
                  </span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recommended">Recommended</SelectItem>
                      <SelectItem value="price-low">Lowest Price</SelectItem>
                      <SelectItem value="price-high">Highest Price</SelectItem>
                      <SelectItem value="rating">Highest Rating</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 text-[#2563eb] mb-4">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="font-medium">
                      Searching for live rates...
                    </span>
                  </div>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <HotelCardSkeleton key={i} />
                  ))}
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <Card className="p-8 text-center border-red-200 bg-red-50">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-[#1f2937] mb-2">
                    Search Failed
                  </h3>
                  <p className="text-[#717182] mb-4">{error}</p>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </Card>
              )}

              {/* Hotel Cards */}
              {!loading && !error && (
                <div className="space-y-6">
                  {filteredHotels.map((hotel: SearchHotelResult) => {
                    const amenities = getAmenityLabels(
                      hotel.facilityIds ?? []
                    );
                    const ratingDisplay = ((hotel.rating ?? 0) / 2).toFixed(1);
                    const firstRoomType = hotel.rates?.roomTypes?.[0];
                    const offerId = firstRoomType?.offerId;

                    return (
                      <Card
                        key={hotel.id}
                        className="overflow-hidden hover:shadow-xl transition-shadow duration-300"
                      >
                        <div className="flex flex-col md:flex-row">
                          <div className="md:w-1/3 relative group">
                            <img
                              src={hotel.main_photo || hotel.thumbnail}
                              alt={hotel.name}
                              className="w-full h-64 md:h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <button
                              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                              aria-label="Add to favorites"
                            >
                              <Heart className="w-5 h-5 text-[#1f2937]" />
                            </button>
                          </div>

                          <div className="md:w-2/3 p-6 flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h3 className="text-2xl font-bold text-[#1f2937] mb-2">
                                    {hotel.name}
                                  </h3>
                                  <p className="text-sm text-[#717182] flex items-center gap-1 mb-2">
                                    <MapPin className="w-4 h-4" />
                                    {hotel.city},{" "}
                                    {hotel.country?.toUpperCase()} &bull;{" "}
                                    {hotel.address}
                                  </p>
                                  <div className="flex items-center gap-1 mb-3">
                                    {Array.from({
                                      length: hotel.stars || 0,
                                    }).map((_, i) => (
                                      <Star
                                        key={i}
                                        className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]"
                                      />
                                    ))}
                                  </div>
                                </div>
                                {hotel.rating != null && (
                                  <div className="bg-[#2563eb] text-white px-3 py-1.5 rounded-lg flex items-center gap-1">
                                    <Star className="w-4 h-4 fill-white" />
                                    <span className="font-bold">
                                      {ratingDisplay}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-3 mb-4">
                                {amenities.map((amenity) => {
                                  const Icon = amenityIcons[amenity];
                                  return (
                                    <div
                                      key={amenity}
                                      className="flex items-center gap-1 text-sm text-[#717182] bg-gray-100 px-3 py-1.5 rounded-full"
                                    >
                                      {Icon && <Icon className="w-4 h-4" />}
                                      <span className="capitalize">
                                        {amenity}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>

                              {hotel.reviewCount != null && (
                                <p className="text-xs text-[#717182]">
                                  {hotel.reviewCount.toLocaleString()} reviews
                                </p>
                              )}
                            </div>

                            <div className="flex items-end justify-between mt-4 pt-4 border-t">
                              <div>
                                {hotel.lowestRate != null ? (
                                  <>
                                    <p className="text-sm text-[#717182] mb-1">
                                      Starting from
                                    </p>
                                    <div className="flex items-baseline gap-1">
                                      <span className="text-3xl font-bold text-[#1f2937]">
                                        {getCurrencySymbol()}
                                        {convertPrice(hotel.lowestRate)}
                                      </span>
                                      <span className="text-sm text-[#717182]">
                                        /stay
                                      </span>
                                    </div>
                                  </>
                                ) : (
                                  <p className="text-sm text-[#717182]">
                                    No rates available
                                  </p>
                                )}
                              </div>
                              <Button
                                asChild
                                className="bg-[#2563eb] hover:bg-[#1e40af] text-white px-8"
                              >
                                <Link
                                  to={`/hotel/${hotel.id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guestsParam}${offerId ? `&offerId=${offerId}` : ""}`}
                                  state={{ hotel }}
                                >
                                  View Details
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}

              {!loading && !error && filteredHotels.length === 0 && hotels.length > 0 && (
                <Card className="p-12 text-center">
                  <p className="text-xl text-[#717182] mb-4">
                    No hotels match your filters
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPriceRange([0, 1000]);
                      setSelectedStars([]);
                      setGuestRating(0);
                    }}
                  >
                    Clear Filters
                  </Button>
                </Card>
              )}

              {!loading && !error && hotels.length === 0 && hasSearchParams && (
                <Card className="p-12 text-center">
                  <MapPin className="w-16 h-16 text-[#717182] mx-auto mb-4" />
                  <p className="text-xl text-[#717182] mb-2">
                    No hotels found in "{cityName}"
                  </p>
                  <p className="text-[#717182]">
                    Try a different destination or adjust your dates.
                  </p>
                </Card>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
