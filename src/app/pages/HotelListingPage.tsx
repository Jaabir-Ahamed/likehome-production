import {useEffect, useState} from 'react';
import {Link, useSearchParams} from 'react-router';
import {Dumbbell, Heart, Loader2, Map, MapPin, ParkingSquare, Star, Utensils, Wifi} from 'lucide-react';
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

// Mock hotel data


const amenityIcons = {
    wifi: Wifi,
    restaurant: Utensils,
    parking: ParkingSquare,
    gym: Dumbbell,
};

type ApiHotel = {
    id: string;
    name: string;
    hotelDescription?: string;
    address?: { city?: string; country?: string; countryCode?: string; line1?: string };
    rating?: number;
    starRating?: number;
    main_photo?: string;
    thumbnail?: string;
};

export function HotelListingPage() {
    const {convertPrice, getCurrencySymbol} = useCurrency();
    const [searchParams] = useSearchParams();
    const placeIdParam = searchParams.get('placeId');
    const locationParam = searchParams.get('location')?.toLowerCase() || '';
    const checkInParam = searchParams.get('checkIn');
    const checkOutParam = searchParams.get('checkOut');
    const occupanciesParam = searchParams.get('occupancies');

    const [apiHotels, setApiHotels] = useState<ApiHotel[]>([]);
    const [isLoadingHotels, setIsLoadingHotels] = useState(false);
    const [hotelsError, setHotelsError] = useState('');

    const [locationFilter, setLocationFilter] = useState(() => searchParams.get('location')?.toLowerCase() || '');

    useEffect(() => {
        setLocationFilter(searchParams.get('location')?.toLowerCase() || '');
    }, [searchParams]);

    useEffect(() => {
        if (!placeIdParam) {
            setApiHotels([]);
            return;
        }
        setIsLoadingHotels(true);
        setHotelsError('');
        api.getHotels({placeId: placeIdParam})
            .then((result) => {
                setApiHotels(result?.data ?? []);
            })
            .catch((err) => {
                setHotelsError(err?.message ?? 'Failed to load hotels');
                setApiHotels([]);
            })
            .finally(() => setIsLoadingHotels(false));
    }, [placeIdParam]);

    const [priceRange, setPriceRange] = useState([0, 500]);
    const [selectedStars, setSelectedStars] = useState<number[]>([]);
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
    const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);
    const [guestRating, setGuestRating] = useState<number>(0);
    const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState('recommended');
    const [showMap, setShowMap] = useState(true);

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

    const handleNeighborhoodToggle = (neighborhood: string) => {
        setSelectedNeighborhoods(prev =>
            prev.includes(neighborhood) ? prev.filter(n => n !== neighborhood) : [...prev, neighborhood]
        );
    };

    const handlePropertyTypeToggle = (type: string) => {
        setPropertyTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    return (
        <div className="w-full bg-gray-50 min-h-screen">
            <div className="container mx-auto px-4 lg:px-8 py-8">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-[#1f2937] mb-2">
                        Find Your Perfect Stay
                    </h1>
                    <p className="text-lg text-[#717182]">
                        {placeIdParam ? `${apiHotels.length} hotels available` : `${0} hotels available`}
                    </p>
                </div>

                {/* Search Component */}
                <div className="mb-8">
                    <SearchComponent/>
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
                                    <Map className="w-4 h-4 mr-2"/>
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
                                                {value: 4.5, label: '4.5+ Excellent'},
                                                {value: 4.0, label: '4.0+ Very Good'},
                                                {value: 3.5, label: '3.5+ Good'},
                                                {value: 3.0, label: '3.0+ Average'},
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

                                {/* Neighborhood Filter */}
                                <AccordionItem value="neighborhoods">
                                    <AccordionTrigger className="text-base font-medium">
                                        Neighborhoods
                                    </AccordionTrigger>
                                    {/*<AccordionContent>*/}
                                    {/*    <div className="space-y-3 pt-2 max-h-48 overflow-y-auto">*/}
                                    {/*        {neighborhoods.map((neighborhood) => (*/}
                                    {/*            <div key={neighborhood} className="flex items-center space-x-2">*/}
                                    {/*                <Checkbox*/}
                                    {/*                    id={`neighborhood-${neighborhood}`}*/}
                                    {/*                    checked={selectedNeighborhoods.includes(neighborhood)}*/}
                                    {/*                    onCheckedChange={() => handleNeighborhoodToggle(neighborhood)}*/}
                                    {/*                />*/}
                                    {/*                <Label htmlFor={`neighborhood-${neighborhood}`}*/}
                                    {/*                       className="cursor-pointer text-sm">*/}
                                    {/*                    {neighborhood}*/}
                                    {/*                </Label>*/}
                                    {/*            </div>*/}
                                    {/*        ))}*/}
                                    {/*    </div>*/}
                                    {/*</AccordionContent>*/}
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
                                    setSelectedNeighborhoods([]);
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
                                    location="Hotels in Various Locations"
                                    height="500px"
                                    className="w-full"
                                />
                            </div>
                        )}

                        {/* Sorting Bar */}
                        <div
                            className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <p className="text-sm text-[#717182]">
                                Showing {placeIdParam ? apiHotels.length : filteredHotels.length} properties
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
                                        {apiHotels.map((hotel) => (
                                            <Card key={hotel.id}
                                                  className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
                                                <div className="flex flex-col md:flex-row">
                                                    <div className="md:w-1/3 relative group bg-gray-100">
                                                        {hotel.main_photo || hotel.thumbnail ? (
                                                            <img
                                                                src={hotel.main_photo ?? hotel.thumbnail}
                                                                alt={hotel.name}
                                                                className="w-full h-64 md:h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                            />
                                                        ) : (
                                                            <div
                                                                className="w-full h-64 md:h-full flex items-center justify-center text-[#717182]">
                                                                No image
                                                            </div>
                                                        )}
                                                        <button
                                                            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                                                            aria-label="Add to favorites"
                                                        >
                                                            <Heart className="w-5 h-5 text-[#1f2937]"/>
                                                        </button>
                                                    </div>

                                                    <div className="md:w-2/3 p-6 flex flex-col justify-between">
                                                        <div>
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div>
                                                                    <h3 className="text-2xl font-bold text-[#1f2937] mb-2">{hotel.name}</h3>
                                                                    {hotel.address && (
                                                                        <p className="text-sm text-[#717182] flex items-center gap-1 mb-2">
                                                                            <MapPin className="w-4 h-4"/>
                                                                            {[hotel.address.city, hotel.address.country].filter(Boolean).join(', ')}
                                                                        </p>
                                                                    )}
                                                                    {hotel.starRating != null && (
                                                                        <div className="flex items-center gap-1 mb-3">
                                                                            {Array.from({length: hotel.starRating}).map((_, i) => (
                                                                                <Star key={i}
                                                                                      className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]"/>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {hotel.rating != null && (
                                                                    <div
                                                                        className="bg-[#2563eb] text-white px-3 py-1.5 rounded-lg flex items-center gap-1">
                                                                        <Star className="w-4 h-4 fill-white"/>
                                                                        <span
                                                                            className="font-bold">{hotel.rating}</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {hotel.hotelDescription && (
                                                                <p className="text-[#1f2937] mb-4 line-clamp-2">{hotel.hotelDescription}</p>
                                                            )}
                                                        </div>

                                                        <div className="flex items-end justify-end mt-4 pt-4 border-t">
                                                            <Button asChild
                                                                    className="bg-[#2563eb] hover:bg-[#1e40af] text-white px-8">
                                                                <Link
                                                                    to={`/hotel/${hotel.id}?checkIn=${checkInParam ?? ''}&checkOut=${checkOutParam ?? ''}${occupanciesParam ? `&occupancies=${encodeURIComponent(occupanciesParam)}` : ''}`}>
                                                                    View Details
                                                                </Link>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                        {apiHotels.length === 0 && (
                                            <Card className="p-12 text-center">
                                                <p className="text-xl text-[#717182]">No hotels found for this
                                                    location</p>
                                            </Card>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            <Card className="p-12 text-center">
                                <p className="text-xl text-[#717182] mb-4">No hotels found matching your
                                    criteria</p>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setLocationFilter('');
                                        setPriceRange([0, 500]);
                                        setSelectedStars([]);
                                        setSelectedAmenities([]);
                                    }}
                                >
                                    Clear Filters
                                </Button>
                            </Card>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}