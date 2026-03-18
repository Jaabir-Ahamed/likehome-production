import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { Link } from 'react-router';
import { Star, MapPin, Heart, Map, Loader2, SearchX, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Slider } from '../components/ui/slider';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { useCurrency } from '../contexts/CurrencyContext';
import { SearchComponent } from '../components/SearchComponent';
import { MapComponent } from '../components/MapComponent';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';
import { api } from '../../api/liteApi';
import type { NormalizedHotel } from '../../api/liteApi';

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80';
const PAGE_SIZE = 15;

function SkeletonCard() {
  return (
    <Card className="overflow-hidden animate-pulse">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-1/3 h-64 bg-gray-200" />
        <div className="md:w-2/3 p-6 space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="flex justify-between items-end pt-4 border-t">
            <div className="h-8 bg-gray-200 rounded w-24" />
            <div className="h-10 bg-gray-200 rounded w-32" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function HotelListingPage() {
  const { getCurrencySymbol, currency } = useCurrency();
  const [searchParams] = useSearchParams();

  const placeIdParam = searchParams.get('placeId');
  const locationParam = searchParams.get('location') || '';
  const checkInParam = searchParams.get('checkIn') || '';
  const checkOutParam = searchParams.get('checkOut') || '';
  const adultsParam = Number(searchParams.get('adults')) || 2;
  const roomsParam = Number(searchParams.get('rooms')) || 1;

  const [hotels, setHotels] = useState<NormalizedHotel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [selectedStars, setSelectedStars] = useState<number[]>([]);
  const [guestRating, setGuestRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState('recommended');
  const [showMap, setShowMap] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [placeIdParam, checkInParam, checkOutParam]);

  useEffect(() => {
    if (!placeIdParam || !checkInParam || !checkOutParam) return;

    let cancelled = false;
    const fetchHotels = async () => {
      setIsLoading(true);
      setError(null);
      setHotels([]);
      try {
        const result = await api.searchHotelRates({
          placeId: placeIdParam,
          checkin: checkInParam,
          checkout: checkOutParam,
          adults: adultsParam,
          rooms: roomsParam,
          currency: currency || 'USD',
          guestNationality: 'US',
          limit: 60,
        });

        console.log('Search Results:', result);

        if (cancelled) return;

        // Guard: result.data must be an array of hotel objects (have a hotelId field).
        // If we receive facilities data or any other non-hotel array, discard it.
        const raw: unknown[] = Array.isArray(result?.data) ? result.data : [];
        const hotelData = raw.filter(
          (item): item is NormalizedHotel =>
            item !== null &&
            typeof item === 'object' &&
            'hotelId' in (item as object)
        );

        if (raw.length > 0 && hotelData.length === 0) {
          console.warn(
            'search-hotel-rates returned items that are not hotel objects. First item:',
            raw[0]
          );
        }

        setHotels(hotelData);
      } catch (err) {
        if (cancelled) return;
        console.error('searchHotelRates error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load hotels. Please try again.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchHotels();
    return () => { cancelled = true; };
  }, [placeIdParam, checkInParam, checkOutParam, adultsParam, roomsParam, currency]);

  const handleStarToggle = (star: number) => {
    setPage(1);
    setSelectedStars((prev) =>
      prev.includes(star) ? prev.filter((s) => s !== star) : [...prev, star]
    );
  };

  const filteredHotels = useMemo(() => {
    return hotels
      .filter((h) => {
        const price = h.price;
        const priceMatch = price === null || (price >= priceRange[0] && price <= priceRange[1]);
        const starMatch =
          selectedStars.length === 0 ||
          selectedStars.includes(Math.round(h.starRating));
        // reviewRating may be absent in the API response; default to 0 so
        // all hotels pass the "All Ratings" (guestRating === 0) check.
        const ratingMatch = (h.reviewRating ?? 0) >= guestRating;
        return priceMatch && starMatch && ratingMatch;
      })
      .sort((a, b) => {
        const priceA = a.price ?? Infinity;
        const priceB = b.price ?? Infinity;
        if (sortBy === 'price-low') return priceA - priceB;
        if (sortBy === 'price-high') return priceB - priceA;
        if (sortBy === 'rating') return b.reviewRating - a.reviewRating;
        return 0;
      });
  }, [hotels, priceRange, selectedStars, guestRating, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredHotels.length / PAGE_SIZE));
  const paginatedHotels = filteredHotels.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hasSearchParams = placeIdParam && checkInParam && checkOutParam;

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1f2937] mb-2">
            {locationParam ? `Hotels in ${locationParam}` : 'Find Your Perfect Stay'}
          </h1>
          <p className="text-lg text-[#717182]">
            {isLoading ? 'Searching for hotels...' : `${filteredHotels.length} hotels available`}
          </p>
        </div>

        {/* Search Component */}
        <div className="mb-8">
          <SearchComponent />
        </div>

        {!hasSearchParams ? (
          <Card className="p-12 text-center">
            <SearchX className="w-12 h-12 text-[#717182] mx-auto mb-4" />
            <p className="text-xl font-semibold text-[#1f2937] mb-2">Search for a destination</p>
            <p className="text-[#717182]">
              Enter a city or location above, select your dates, and hit search to find available hotels.
            </p>
          </Card>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
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
                    {showMap ? 'Hide Map' : 'Show Map'}
                  </Button>
                </div>

                <Accordion type="multiple" defaultValue={['price', 'stars']} className="w-full">
                  <AccordionItem value="price">
                    <AccordionTrigger className="text-base font-medium">Price Range</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        <Slider
                          min={0}
                          max={5000}
                          step={25}
                          value={priceRange}
                          onValueChange={(v) => { setPage(1); setPriceRange(v); }}
                          className="w-full"
                        />
                        <div className="flex items-center justify-between text-sm text-[#717182]">
                          <span>{getCurrencySymbol()}{priceRange[0]}</span>
                          <span>{getCurrencySymbol()}{priceRange[1]}{priceRange[1] === 5000 ? '+' : ''}</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="stars">
                    <AccordionTrigger className="text-base font-medium">Star Rating</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        {[5, 4, 3, 2, 1].map((star) => (
                          <div key={star} className="flex items-center space-x-2">
                            <Checkbox
                              id={`star-${star}`}
                              checked={selectedStars.includes(star)}
                              onCheckedChange={() => handleStarToggle(star)}
                            />
                            <Label htmlFor={`star-${star}`} className="flex items-center cursor-pointer">
                              <div className="flex items-center gap-1">
                                {Array.from({ length: star }).map((_, i) => (
                                  <Star key={i} className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]" />
                                ))}
                              </div>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="guestRating">
                    <AccordionTrigger className="text-base font-medium">Guest Rating</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        {[
                          { value: 4.5, label: '4.5+ Excellent' },
                          { value: 4.0, label: '4.0+ Very Good' },
                          { value: 3.5, label: '3.5+ Good' },
                          { value: 3.0, label: '3.0+ Average' },
                          { value: 0, label: 'All Ratings' },
                        ].map((rating) => (
                          <div key={rating.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`rating-${rating.value}`}
                              checked={guestRating === rating.value}
                              onCheckedChange={() => { setPage(1); setGuestRating(rating.value); }}
                            />
                            <Label htmlFor={`rating-${rating.value}`} className="cursor-pointer">
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
                    setPage(1);
                    setPriceRange([0, 5000]);
                    setSelectedStars([]);
                    setGuestRating(0);
                  }}
                >
                  Clear All Filters
                </Button>
              </Card>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
              {showMap && (
                <div className="mb-6">
                  <MapComponent location={locationParam || 'Hotels'} height="400px" className="w-full" />
                </div>
              )}

              {/* Sorting Bar */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-sm text-[#717182]">
                  {isLoading
                    ? 'Loading...'
                    : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filteredHotels.length)} of ${filteredHotels.length} properties`}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#1f2937]">Sort by:</span>
                  <Select value={sortBy} onValueChange={(v) => { setPage(1); setSortBy(v); }}>
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

              {/* Loading */}
              {isLoading && (
                <div className="space-y-6">
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 text-[#2563eb] animate-spin mr-3" />
                    <span className="text-lg text-[#717182]">Finding the best hotels for you...</span>
                  </div>
                  {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
                </div>
              )}

              {/* Error */}
              {error && !isLoading && (
                <Card className="p-12 text-center">
                  <p className="text-xl text-red-600 mb-4">{error}</p>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                </Card>
              )}

              {/* Hotel Cards */}
              {!isLoading && !error && (
                <div className="space-y-6">
                  {paginatedHotels.map((hotel) => {
                    const stars = Math.round(hotel.starRating ?? 0);
                    const locationText = [hotel.address, hotel.city, hotel.country]
                      .filter(Boolean)
                      .join(', ');

                    return (
                      <Card
                        key={hotel.hotelId}
                        className="overflow-hidden hover:shadow-xl transition-shadow duration-300"
                      >
                        <div className="flex flex-col md:flex-row">
                          {/* Image */}
                          <div className="md:w-1/3 relative group overflow-hidden">
                            <img
                              src={hotel.image ?? PLACEHOLDER_IMAGE}
                              alt={hotel.name ?? 'Hotel'}
                              className="w-full h-64 md:h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                              }}
                            />
                            <button
                              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                              aria-label="Add to favorites"
                            >
                              <Heart className="w-5 h-5 text-[#1f2937]" />
                            </button>
                          </div>

                          {/* Details */}
                          <div className="md:w-2/3 p-6 flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h3 className="text-2xl font-bold text-[#1f2937] mb-2">
                                    {hotel.name ?? 'Hotel'}
                                  </h3>
                                  {locationText && (
                                    <p className="text-sm text-[#717182] flex items-center gap-1 mb-2">
                                      <MapPin className="w-4 h-4 shrink-0" />
                                      {locationText}
                                    </p>
                                  )}
                                  {stars > 0 && (
                                    <div className="flex items-center gap-1 mb-3">
                                      {Array.from({ length: Math.min(stars, 5) }).map((_, i) => (
                                        <Star key={i} className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]" />
                                      ))}
                                    </div>
                                  )}
                                </div>
                                {(hotel.reviewRating ?? 0) > 0 && (
                                  <div className="shrink-0 bg-[#2563eb] text-white px-3 py-1.5 rounded-lg flex items-center gap-1">
                                    <Star className="w-4 h-4 fill-white" />
                                    <span className="font-bold">{hotel.reviewRating}</span>
                                  </div>
                                )}
                              </div>

                              {(hotel.reviewCount ?? 0) > 0 && (
                                <p className="text-xs text-[#717182]">
                                  {hotel.reviewCount!.toLocaleString()} reviews
                                </p>
                              )}
                            </div>

                            {/* Price + CTA */}
                            <div className="flex items-end justify-between mt-4 pt-4 border-t">
                              <div>
                                {hotel.price !== null ? (
                                  <>
                                    <p className="text-sm text-[#717182] mb-1">Starting from</p>
                                    <div className="flex items-baseline gap-1">
                                      <span className="text-3xl font-bold text-[#1f2937]">
                                        {getCurrencySymbol()}{Math.round(hotel.price)}
                                      </span>
                                      <span className="text-sm text-[#717182]">/night</span>
                                    </div>
                                  </>
                                ) : (
                                  <p className="text-sm text-[#717182]">Price unavailable</p>
                                )}
                              </div>
                              <Button
                                asChild
                                className="bg-[#2563eb] hover:bg-[#1e40af] text-white px-8"
                              >
                                <Link to={`/hotel/${hotel.hotelId}`}>View Details</Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Empty after filter */}
              {!isLoading && !error && filteredHotels.length === 0 && hotels.length > 0 && (
                <Card className="p-12 text-center">
                  <p className="text-xl text-[#717182] mb-4">No hotels match your filters</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPage(1);
                      setPriceRange([0, 1000]);
                      setSelectedStars([]);
                      setGuestRating(0);
                    }}
                  >
                    Clear Filters
                  </Button>
                </Card>
              )}

              {/* No results */}
              {!isLoading && !error && hotels.length === 0 && hasSearchParams && (
                <Card className="p-12 text-center">
                  <p className="text-xl text-[#717182] mb-4">No hotels found for this search</p>
                  <p className="text-sm text-[#717182]">Try a different location or adjust your dates.</p>
                </Card>
              )}

              {/* Pagination */}
              {!isLoading && !error && filteredHotels.length > PAGE_SIZE && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={page === 1}
                    className="flex items-center gap-1"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === totalPages ||
                          Math.abs(p - page) <= 2
                      )
                      .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                        if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((item, idx) =>
                        item === 'ellipsis' ? (
                          <span key={`ellipsis-${idx}`} className="px-2 text-[#717182]">
                            …
                          </span>
                        ) : (
                          <Button
                            key={item}
                            variant={page === item ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              setPage(item as number);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={
                              page === item
                                ? 'bg-[#2563eb] hover:bg-[#1e40af] text-white w-9 h-9 p-0'
                                : 'w-9 h-9 p-0'
                            }
                            aria-label={`Page ${item}`}
                            aria-current={page === item ? 'page' : undefined}
                          >
                            {item}
                          </Button>
                        )
                      )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={page === totalPages}
                    className="flex items-center gap-1"
                    aria-label="Next page"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
