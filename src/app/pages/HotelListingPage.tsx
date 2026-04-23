import {useEffect, useMemo, useState} from 'react';
import {Link, useSearchParams} from 'react-router';
import {Heart, Loader2, Map as MapIcon, MapPin, Star} from 'lucide-react';
import {Button} from '../components/ui/button';
import {Card} from '../components/ui/card';
import {Slider} from '../components/ui/slider';
import {Checkbox} from '../components/ui/checkbox';
import {Label} from '../components/ui/label';
import {useCurrency} from '../contexts/CurrencyContext';
import {SearchComponent} from '../components/SearchComponent';
import {MapComponent} from '../components/MapComponent';
import {api} from '../../api/liteApi';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '../components/ui/select';
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger,} from '../components/ui/accordion';

function getDefaultDates() {
    const today = new Date();
    const checkIn = new Date(today);
    checkIn.setDate(today.getDate() + 1);
    const checkOut = new Date(today);
    checkOut.setDate(today.getDate() + 4);
    return {
        checkIn: checkIn.toISOString().split('T')[0],
        checkOut: checkOut.toISOString().split('T')[0],
    };
}

function getRatingLabel(rating: number): string {
    if (rating >= 9) return 'Exceptional';
    if (rating >= 8) return 'Great';
    if (rating >= 7) return 'Decent';
    if (rating >= 6) return 'Average';
    return 'Fair';
}

function stripHtml(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
}

type HotelRateInfo = { pricePerNight: number; totalPrice: number; currency: string };

type ApiHotel = {
    id: string;
    name: string;
    hotelDescription?: string;
    address?: { city?: string; country?: string; countryCode?: string; line1?: string };
    rating?: number;
    stars?: number;
    main_photo?: string;
    thumbnail?: string;
};

export function HotelListingPage() {
    const {convertPrice, getCurrencySymbol} = useCurrency();
    const [searchParams] = useSearchParams();
    const placeIdParam = searchParams.get('placeId');
    const checkInParam = searchParams.get('checkIn');
    const checkOutParam = searchParams.get('checkOut');
    const occupanciesParam = searchParams.get('occupancies');

    const defaults = getDefaultDates();
    const checkIn = checkInParam ?? defaults.checkIn;
    const checkOut = checkOutParam ?? defaults.checkOut;
    const parsedOccupancies: { adults: number; children?: number[] }[] =
        occupanciesParam ? JSON.parse(occupanciesParam) : [{adults: 2}];
    const nights = Math.max(1, Math.round(
        (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
    ));

    const FETCH_SIZE = 50;
    const PAGE_SIZE = 10;

    const [currentPage, setCurrentPage] = useState(1);
    const [apiHotels, setApiHotels] = useState<ApiHotel[]>([]);
    const [isLoadingHotels, setIsLoadingHotels] = useState(false);
    const [hotelsError, setHotelsError] = useState('');
    const [apiOffset, setApiOffset] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    const [hotelRates, setHotelRates] = useState<Map<string, HotelRateInfo>>(new Map());
    const [isLoadingRates, setIsLoadingRates] = useState(false);

    const [priceRange, setPriceRange] = useState([0, 500]);
    const [selectedStars, setSelectedStars] = useState<number[]>([]);
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
    const [guestRating, setGuestRating] = useState<number>(0);
    const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState('recommended');
    const [showMap, setShowMap] = useState(false);

    const [locationFilter, setLocationFilter] = useState(() => searchParams.get('location')?.toLowerCase() || '');

    useEffect(() => {
        setLocationFilter(searchParams.get('location')?.toLowerCase() || '');
    }, [searchParams]);

    const fetchRatesForHotels = (hotels: ApiHotel[]) => {
        if (hotels.length === 0) return;
        setIsLoadingRates(true);
        api.getHotelRates({
            hotelIds: hotels.map(h => h.id),
            checkin: checkIn,
            checkout: checkOut,
            occupancies: parsedOccupancies,
        })
            .then((result) => {
                setHotelRates(prev => {
                    const next = new Map(prev);
                    for (const hotel of (result?.data ?? [])) {
                        const roomTypes: {
                            offerRetailRate?: { amount?: number; currency?: string }
                        }[] = hotel.roomTypes ?? [];
                        let minTotal = Infinity;
                        let currency = 'USD';
                        for (const rt of roomTypes) {
                            const amount = rt.offerRetailRate?.amount;
                            if (amount != null && amount < minTotal) {
                                minTotal = amount;
                                currency = rt.offerRetailRate?.currency ?? 'USD';
                            }
                        }
                        if (minTotal !== Infinity) {
                            next.set(hotel.hotelId, {
                                totalPrice: minTotal,
                                pricePerNight: minTotal / nights,
                                currency,
                            });
                        }
                    }
                    return next;
                });
            })
            .catch(() => {/* rates unavailable */
            })
            .finally(() => setIsLoadingRates(false));
    };

    useEffect(() => {
        if (!placeIdParam) {
            setApiHotels([]);
            setHasMore(false);
            return;
        }
        setIsLoadingHotels(true);
        setHotelsError('');
        setApiOffset(0);
        setHasMore(false);
        setHotelRates(new Map());
        setCurrentPage(1);
        const starFilter = selectedStars.length > 0 ? selectedStars.join(',') : undefined;
        api.getHotels({placeId: placeIdParam}, {limit: FETCH_SIZE, offset: 0, starRating: starFilter})
            .then((result) => {
                const hotels: ApiHotel[] = result?.data ?? [];
                setApiHotels(hotels);
                setHasMore(hotels.length === FETCH_SIZE);
                fetchRatesForHotels(hotels);
            })
            .catch((err) => {
                setHotelsError(err?.message ?? 'Failed to load hotels');
                setApiHotels([]);
            })
            .finally(() => setIsLoadingHotels(false));
    }, [placeIdParam, selectedStars]);

    const filteredHotels = useMemo(() => {
        let result = [...apiHotels];

        if (guestRating > 0) {
            result = result.filter(h => h.rating != null && h.rating >= guestRating);
        }

        result = result.filter(h => {
            const rate = hotelRates.get(h.id);
            if (!rate) return true; // keep hotels with no rate info yet
            return rate.pricePerNight >= priceRange[0] && rate.pricePerNight <= priceRange[1];
        });

        if (propertyTypes.length > 0) {
            result = result.filter(h => {
                const name = h.name.toLowerCase();
                return propertyTypes.some(type => {
                    if (type === 'resort') return name.includes('resort');
                    if (type === 'boutique') return name.includes('boutique');
                    if (type === 'suite') return name.includes('suite') || name.includes('suites');
                    if (type === 'lodge') return name.includes('lodge');
                    return true; // 'hotel' matches everything
                });
            });
        }

        if (sortBy === 'price-low') {
            result.sort((a, b) => (hotelRates.get(a.id)?.pricePerNight ?? Infinity) - (hotelRates.get(b.id)?.pricePerNight ?? Infinity));
        } else if (sortBy === 'price-high') {
            result.sort((a, b) => (hotelRates.get(b.id)?.pricePerNight ?? -Infinity) - (hotelRates.get(a.id)?.pricePerNight ?? -Infinity));
        } else if (sortBy === 'rating') {
            result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        }

        return result;
    }, [apiHotels, guestRating, priceRange, propertyTypes, sortBy, hotelRates]);

    useEffect(() => {
        setCurrentPage(1);
    }, [guestRating, priceRange, propertyTypes, sortBy]);

    useEffect(() => {
        const totalPages = Math.ceil(filteredHotels.length / PAGE_SIZE);
        if (currentPage < totalPages || !hasMore || isFetchingMore || !placeIdParam || apiHotels.length === 0) return;
        const nextOffset = apiOffset + FETCH_SIZE;
        setIsFetchingMore(true);
        const starFilter = selectedStars.length > 0 ? selectedStars.join(',') : undefined;
        api.getHotels({placeId: placeIdParam}, {limit: FETCH_SIZE, offset: nextOffset, starRating: starFilter})
            .then((result) => {
                const newHotels: ApiHotel[] = result?.data ?? [];
                setApiHotels(prev => [...prev, ...newHotels]);
                setApiOffset(nextOffset);
                setHasMore(newHotels.length === FETCH_SIZE);
                fetchRatesForHotels(newHotels);
            })
            .catch(() => {/* silently ignore — user stays on current page */
            })
            .finally(() => setIsFetchingMore(false));
    }, [currentPage, filteredHotels.length]);

    const handleStarToggle = (star: number) => {
        setSelectedStars(prev =>
            prev.includes(star) ? prev.filter(s => s !== star) : [...prev, star]
        );
    };

    const handleAmenityToggle = (amenity: string) => {
        setSelectedAmenities(prev =>
            prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
        );
    };

    const handlePropertyTypeToggle = (type: string) => {
        setPropertyTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    return (
        <div className="w-full bg-background min-h-screen">
            <div className="container mx-auto px-4 lg:px-8 py-8">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-[#1f2937] mb-2">
                        Find Your Perfect Stay
                    </h1>
                    <p className="text-lg text-[#717182]">
                        {placeIdParam ? `${filteredHotels.length} hotels available` : 'Search a location to find hotels'}
                    </p>
                </div>

                {/* Search Component */}
                <div className="mb-8">
                    <SearchComponent
                      initialLocation={searchParams.get('location') || ''}
                      initialPlaceId={searchParams.get('placeId') || ''}
                    />
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar - Filters */}
                    <aside className="w-full lg:w-1/4">
                        <Card className="p-6 sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-[#1f2937]">Filters</h2>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowMap(!showMap)}
                                    className="text-[#2563eb]"
                                >
                                    <MapIcon className="w-4 h-4 mr-2"/>
                                    {showMap ? 'Hide Map' : 'Show Map'}
                                </Button>
                            </div>

                            <Accordion type="multiple" defaultValue={['price', 'stars', 'amenities']}
                                       className="w-full">
                                {/* Price Range Filter */}
                                <AccordionItem value="price">
                                    <AccordionTrigger className="text-base font-medium">
                                        Price Range
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-4 pt-2">
                                            <Slider
                                                min={0}
                                                max={500}
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

                                {/* Star Rating Filter */}
                                <AccordionItem value="stars">
                                    <AccordionTrigger className="text-base font-medium">
                                        Star Rating
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-3 pt-2">
                                            {[5, 4, 3, 2, 1].map((star) => (
                                                <div key={star} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`star-${star}`}
                                                        checked={selectedStars.includes(star)}
                                                        onCheckedChange={() => handleStarToggle(star)}
                                                    />
                                                    <Label htmlFor={`star-${star}`}
                                                           className="flex items-center cursor-pointer">
                                                        <div className="flex items-center gap-1">
                                                            {Array.from({length: star}).map((_, i) => (
                                                                <Star key={i}
                                                                      className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]"/>
                                                            ))}
                                                        </div>
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                {/* Guest Rating Filter */}
                                <AccordionItem value="guestRating">
                                    <AccordionTrigger className="text-base font-medium">
                                        Guest Rating
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-3 pt-2">
                                            {[
                                                {value: 10, label: '10 — Perfect'},
                                                {value: 9, label: '9+ — Great'},
                                                {value: 7, label: '7+ — Good'},
                                                {value: 0, label: 'All Ratings'},
                                            ].map((rating) => (
                                                <div key={rating.value} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`rating-${rating.value}`}
                                                        checked={guestRating === rating.value}
                                                        onCheckedChange={() => setGuestRating(rating.value)}
                                                    />
                                                    <Label htmlFor={`rating-${rating.value}`}
                                                           className="cursor-pointer">
                                                        {rating.label}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                {/* Amenities Filter */}
                                <AccordionItem value="amenities">
                                    <AccordionTrigger className="text-base font-medium">
                                        Amenities
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-3 pt-2">
                                            {[
                                                {id: 'wifi', label: 'Free Wi-Fi'},
                                                {id: 'restaurant', label: 'Restaurant'},
                                                {id: 'parking', label: 'Parking'},
                                                {id: 'gym', label: 'Fitness Center'},
                                            ].map((amenity) => (
                                                <div key={amenity.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={amenity.id}
                                                        checked={selectedAmenities.includes(amenity.id)}
                                                        onCheckedChange={() => handleAmenityToggle(amenity.id)}
                                                    />
                                                    <Label htmlFor={amenity.id} className="cursor-pointer">
                                                        {amenity.label}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                {/* Property Type Filter */}
                                <AccordionItem value="propertyType">
                                    <AccordionTrigger className="text-base font-medium">
                                        Property Type
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-3 pt-2">
                                            {[
                                                {id: 'hotel', label: 'Hotel'},
                                                {id: 'resort', label: 'Resort'},
                                                {id: 'boutique', label: 'Boutique Hotel'},
                                                {id: 'suite', label: 'Suite'},
                                                {id: 'lodge', label: 'Lodge'},
                                            ].map((type) => (
                                                <div key={type.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={type.id}
                                                        checked={propertyTypes.includes(type.id)}
                                                        onCheckedChange={() => handlePropertyTypeToggle(type.id)}
                                                    />
                                                    <Label htmlFor={type.id} className="cursor-pointer">
                                                        {type.label}
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
                                    setLocationFilter('');
                                    setPriceRange([0, 500]);
                                    setSelectedStars([]);
                                    setSelectedAmenities([]);
                                    setGuestRating(0);
                                    setPropertyTypes([]);
                                }}
                            >
                                Clear All Filters
                            </Button>
                        </Card>
                    </aside>

                    {/* Main Content - Hotel Results and Map */}
                    <main className="flex-1">
                        {/* Map Section */}
                        {showMap && (
                            <div className="mb-6">
                                <MapComponent
                                    location={searchParams.get('location')?.trim() || 'Search results'}
                                    height="500px"
                                    className="w-full"
                                />
                            </div>
                        )}

                        {/* Sorting Bar */}
                        <div
                            className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <p className="text-sm text-[#717182]">
                                Showing {filteredHotels.length} properties
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-[#1f2937]">Sort by:</span>
                                <Select value={sortBy} onValueChange={setSortBy}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue/>
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

                        {/* Hotel Cards — API results when placeId present, mock otherwise */}
                        {placeIdParam ? (
                            <>
                                {isLoadingHotels && (
                                    <div className="flex items-center justify-center py-20">
                                        <Loader2 className="w-8 h-8 animate-spin text-[#2563eb]"/>
                                        <span className="ml-3 text-[#717182]">Searching hotels…</span>
                                    </div>
                                )}
                                {hotelsError && !isLoadingHotels && (
                                    <Card className="p-12 text-center">
                                        <p className="text-xl text-[#717182]">{hotelsError}</p>
                                    </Card>
                                )}
                                {!isLoadingHotels && !hotelsError && (
                                    <div className="space-y-6">
                                        {filteredHotels.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((hotel) => {
                                            const rateInfo = hotelRates.get(hotel.id);
                                            const detailLink = `/hotel/${hotel.id}?checkIn=${checkIn}&checkOut=${checkOut}&occupancies=${encodeURIComponent(JSON.stringify(parsedOccupancies))}`;
                                            return (
                                                <Card key={hotel.id}
                                                      className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
                                                    <div className="flex flex-col md:flex-row">
                                                        {/* Image */}
                                                        <div
                                                            className="md:w-72 flex-shrink-0 relative group bg-gray-100">
                                                            {hotel.main_photo || hotel.thumbnail ? (
                                                                <img
                                                                    src={hotel.main_photo ?? hotel.thumbnail}
                                                                    alt={hotel.name}
                                                                    className="w-full h-56 md:h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                                />
                                                            ) : (
                                                                <div
                                                                    className="w-full h-56 md:h-full flex items-center justify-center text-[#717182]">
                                                                    No image
                                                                </div>
                                                            )}
                                                            <button
                                                                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                                                                aria-label="Add to favorites"
                                                            >
                                                                <Heart className="w-4 h-4 text-[#1f2937]"/>
                                                            </button>
                                                        </div>

                                                        {/* Info */}
                                                        <div className="flex-1 p-5 flex flex-col justify-between">
                                                            <div>
                                                                <h3 className="text-xl font-bold text-[#1f2937] mb-1">{hotel.name}</h3>

                                                                {hotel.address != null && (
                                                                    <p className="text-sm text-[#717182] flex items-center gap-1 mb-2">
                                                                        <MapPin className="w-3.5 h-3.5"/>
                                                                        {[hotel.city, hotel.country.toUpperCase()].filter(Boolean).join(', ')}
                                                                    </p>
                                                                )}

                                                                {hotel.stars != null && (
                                                                    <div className="flex items-center gap-0.5 mb-3">
                                                                        {Array.from({length: Math.round(hotel.stars)}).map((_, i) => (
                                                                            <Star key={i}
                                                                                  className="w-3.5 h-3.5 fill-[#f59e0b] text-[#f59e0b]"/>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                {hotel.rating != null && (
                                                                    <div className="flex items-center gap-2 mb-3">
                                                                        <span
                                                                            className={` text-white text-sm font-bold px-2 py-0.5 rounded
                                                                            ${hotel.rating >= 9 ? "bg-[#007c3e]" : hotel.rating >= 8 ? "bg-[#40ad10]" : hotel.rating >= 7 ? "bg-[#ecce00]" : hotel.rating >= 6 ? "bg-[#d6883a]" : "bg-[#d63a3a]"}`}>
                                                                                
                                                                            {hotel.rating.toFixed(1)}
                                                                        </span>
                                                                        <span
                                                                            className="text-sm font-medium text-[#1f2937]">
                                                                            {getRatingLabel(hotel.rating)}
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                {hotel.hotelDescription && (
                                                                    <p className="text-sm text-[#717182] line-clamp-2">
                                                                        {stripHtml(hotel.hotelDescription)}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {/* Price + CTA */}
                                                            <div
                                                                className="flex items-end justify-between mt-4 pt-4 border-t gap-4">
                                                                <div>
                                                                    {isLoadingRates ? (
                                                                        <div
                                                                            className="flex items-center gap-1.5 text-[#717182] text-sm">
                                                                            <Loader2
                                                                                className="w-4 h-4 animate-spin"/>
                                                                            <span>Loading prices…</span>
                                                                        </div>
                                                                    ) : rateInfo ? (
                                                                        <>
                                                                            <p className="text-2xl font-bold text-[#1f2937]">
                                                                                {getCurrencySymbol()}{convertPrice(rateInfo.pricePerNight).toFixed(0)}
                                                                                <span
                                                                                    className="text-sm font-normal text-[#717182] ml-1">/ night</span>
                                                                            </p>
                                                                            <p className="text-sm text-[#717182]">
                                                                                {getCurrencySymbol()}{convertPrice(rateInfo.totalPrice).toFixed(0)} total
                                                                                · {nights} {nights === 1 ? 'night' : 'nights'}
                                                                            </p>
                                                                        </>
                                                                    ) : (
                                                                        <p className="text-sm text-[#717182]">Pricing
                                                                            unavailable</p>
                                                                    )}
                                                                </div>
                                                                <Button asChild
                                                                        className="bg-[#1d2d44] hover:bg-[#1e40af] text-white px-6 flex-shrink-0">
                                                                    <Link to={detailLink}>View Details</Link>
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Card>
                                            );
                                        })}
                                        {filteredHotels.length === 0 && (
                                            <Card className="p-12 text-center">
                                                <p className="text-xl text-[#717182]">
                                                    {apiHotels.length > 0 ? 'No hotels match your filters' : 'No hotels found for this location'}
                                                </p>
                                            </Card>
                                        )}
                                        {filteredHotels.length > PAGE_SIZE && (() => {
                                            const totalPages = Math.ceil(filteredHotels.length / PAGE_SIZE);
                                            const pages: (number | '...')[] = [];
                                            if (totalPages <= 7) {
                                                for (let i = 1; i <= totalPages; i++) pages.push(i);
                                            } else {
                                                pages.push(1);
                                                if (currentPage > 3) pages.push('...');
                                                for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
                                                if (currentPage < totalPages - 2) pages.push('...');
                                                pages.push(totalPages);
                                            }
                                            return (
                                                <div className="flex items-center justify-center gap-2 pt-4">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                        disabled={currentPage === 1 || isFetchingMore}
                                                    >
                                                        Previous
                                                    </Button>
                                                    {pages.map((page, idx) =>
                                                        page === '...' ? (
                                                            <span key={`ellipsis-${idx}`}
                                                                  className="px-1 text-[#717182] select-none">…</span>
                                                        ) : (
                                                            <Button
                                                                key={page}
                                                                variant={page === currentPage ? 'default' : 'outline'}
                                                                size="sm"
                                                                onClick={() => setCurrentPage(page)}
                                                                disabled={isFetchingMore}
                                                                className={page === currentPage ? 'bg-[#1d2d44] hover:bg-[#1e40af] text-white' : ''}
                                                            >
                                                                {page}
                                                            </Button>
                                                        )
                                                    )}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                        disabled={(currentPage === totalPages && !hasMore) || isFetchingMore}
                                                    >
                                                        {isFetchingMore && currentPage === totalPages
                                                            ? <><Loader2
                                                                className="w-3 h-3 animate-spin mr-1"/>Loading…</>
                                                            : 'Next'
                                                        }
                                                    </Button>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}
                            </>
                        ) : (
                            <Card className="p-12 text-center">
                                <p className="text-xl text-[#717182]">Search a location above to find hotels</p>
                            </Card>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}