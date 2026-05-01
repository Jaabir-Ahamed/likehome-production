import {ArrowRight, MapPin, Star} from 'lucide-react';
import {Link, useNavigate} from 'react-router';
import {SearchComponent} from '../components/SearchComponent';
import {Button} from '../components/ui/button';
import {Card} from '../components/ui/card';
import {useCurrency} from '../contexts/CurrencyContext';
import imgHeroBackground from '../../assets/910a43fa90ece96610082739bbdb02f24d6b7f70.png';
import {useEffect, useState} from 'react';
import {api} from '../../api/liteApi';
 
type Occupancy = {
    adults: number;
    children: number[];
};
 
const STORAGE_KEY = 'likehome_search';
 
function dateToString(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
 
function getDefaultDates() {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 7);
 
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 2);
 
    return {
        checkIn: dateToString(checkIn),
        checkOut: dateToString(checkOut),
    };
}
 
function loadStored(): { checkIn: string; checkOut: string; occupancies: Occupancy[] } | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}
 
const trendingDestinations = [
    {
        id: 1,
        name: 'Paris',
        country: 'France',
        image: 'https://images.unsplash.com/photo-1431274172761-fca41d930114?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXJpcyUyMGVpZmZlbCUyMHRvd2VyfGVufDF8fHx8MTc3MTg0Njc4NXww&ixlib=rb-4.1.0&q=80&w=1080',
        placeId: 'ChIJD7fiBh9u5kcRYJSMaMOCCwQ',
    },
    {
        id: 2,
        name: 'Tokyo',
        country: 'Japan',
        image: 'https://images.unsplash.com/photo-1673944083714-92ee2061e25c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b2t5byUyMHNreWxpbmUlMjBjaXR5fGVufDF8fHx8MTc3MTg5MjI3MHww&ixlib=rb-4.1.0&q=80&w=1080',
        placeId: 'ChIJ51cu8IcbXWARiRtXIothAS4',
    },
    {
        id: 3,
        name: 'New York',
        country: 'USA',
        image: 'https://images.unsplash.com/photo-1677364317455-63d57308f9e1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXclMjB5b3JrJTIwbWFuaGF0dGFufGVufDF8fHx8MTc3MTkwNDg0N3ww&ixlib=rb-4.1.0&q=80&w=1080',
        placeId: 'ChIJOwg_06VPwokRYv534QaPC8g',
    },
    {
        id: 4,
        name: 'London',
        country: 'UK',
        image: 'https://images.unsplash.com/photo-1745016176874-cd3ed3f5bfc6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsb25kb24lMjBiaWclMjBiZW58ZW58MXx8fHwxNzcxODY3NDgwfDA&ixlib=rb-4.1.0&q=80&w=1080',
        placeId: 'ChIJdd4hrwug2EcRmSrV3Vo6llI',
    },
    {
        id: 5,
        name: 'Dubai',
        country: 'UAE',
        image: 'https://images.unsplash.com/photo-1657106251952-2d584ebdf886?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkdWJhaSUyMHNreWxpbmUlMjBuaWdodHxlbnwxfHx8fDE3NzE4NzU4MjF8MA&ixlib=rb-4.1.0&q=80&w=1080',
        placeId: 'ChIJRcbZaklDXz4RYlEphFBu5r0',
    },
    {
        id: 6,
        name: 'Barcelona',
        country: 'Spain',
        image: 'https://images.unsplash.com/photo-1653677903266-1d814985b3cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXJjZWxvbmElMjBhcmNoaXRlY3R1cmV8ZW58MXx8fHwxNzcxODM2NjY5fDA&ixlib=rb-4.1.0&q=80&w=1080',
        placeId: 'ChIJ5TCOcRaYpBIRCmZHTz37sEQ',
    },
    {
        id: 7,
        name: 'Singapore',
        country: 'Singapore',
        image: 'https://images.unsplash.com/photo-1686455746285-4a921419bc6c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaW5nYXBvcmUlMjBtYXJpbmElMjBiYXl8ZW58MXx8fHwxNzcxOTA0ODQ4fDA&ixlib=rb-4.1.0&q=80&w=1080',
        placeId: 'ChIJdZOLiiMR2jERxPWrUs9peIg',
    },
    {
        id: 8,
        name: 'Sydney',
        country: 'Australia',
        image: 'https://images.unsplash.com/photo-1523059623039-a9ed027e7fad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzeWRuZXklMjBvcGVyYSUyMGhvdXNlfGVufDF8fHx8MTc3MTkwMzAwMnww&ixlib=rb-4.1.0&q=80&w=1080',
        placeId: 'ChIJP3Sa8ziYEmsRUKgyFmh9AQM',
    },
];
 
// Real hotel IDs sourced directly from the LiteAPI database.
// Details (name, image, rating, location) are fetched at runtime via api.getHotelDetails().
const TOP_RATED_HOTEL_IDS = [
    'lp9a471', // Dubai
    'lp1ced2', // Tokyo
    'lp22763', // Venice
    'lp1fb31', // Rio de Janeiro
    'lp30fb5', // Paris
    'lp3551d', // Hawaii
];
 
type TopRatedHotel = {
    id: string;
    name: string;
    location: string;
    rating: number;
    reviewCount: number;
    image: string;
};
 
const recommendedHotels = [
    {
        id: 9,
        name: 'Serenity Spa Resort',
        location: 'Santorini, Greece',
        rating: 4.9,
        price: 310,
        image: 'https://images.unsplash.com/photo-1759223198981-661cadbbff36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBob3RlbCUyMHN1aXRlJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzcyNTU2ODU3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        reviews: 876,
    },
    {
        id: 10,
        name: 'Vista Heights Hotel',
        location: 'San Francisco, USA',
        rating: 4.7,
        price: 265,
        image: 'https://images.unsplash.com/photo-1764642498023-8547a9558d47?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3RlbCUyMHJvb2Z0b3AlMjB2aWV3fGVufDF8fHx8MTc3MjY4MjQ4Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        reviews: 543,
    },
    {
        id: 11,
        name: 'Artisan Boutique Stay',
        location: 'Copenhagen, Denmark',
        rating: 4.8,
        price: 245,
        image: 'https://images.unsplash.com/photo-1759264244746-140bbbc54e1b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib3V0aXF1ZSUyMGhvdGVsJTIwYmVkcm9vbSUyMGRlc2lnbnxlbnwxfHx8fDE3NzI2ODI0ODN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        reviews: 621,
    },
    {
        id: 12,
        name: 'Azure Grand Hotel',
        location: 'Monaco',
        rating: 4.9,
        price: 420,
        image: 'https://images.unsplash.com/photo-1741506131058-533fcf894483?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cHNjYWxlJTIwaG90ZWwlMjBsb3VuZ2V8ZW58MXx8fHwxNzcyNjgyNDgzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        reviews: 712,
    },
];
 
export function HomePage() {
    const navigate = useNavigate();
    const {convertPrice, getCurrencySymbol} = useCurrency();
 
    // Keyed by hotel ID. Cards stream in individually as each fetch resolves.
    const [topRatedHotels, setTopRatedHotels] = useState<Map<string, TopRatedHotel>>(new Map());
 
    useEffect(() => {
        const loadCountries = async () => {
            try {
                await api.getCountries();
            } catch (err) {
                console.error(err);
            }
        };
 
        const loadFacilities = async () => {
            try {
                const facilities = await api.getFacilities();
                console.log(facilities?.data);
            } catch (err) {
                console.error(err);
            }
        };
 
        loadCountries();
        loadFacilities();
 
        // Fire all 6 fetches in parallel. Each updates state independently
        // so cards appear as soon as their own data arrives.
        TOP_RATED_HOTEL_IDS.forEach(async (hotelId) => {
            try {
                const result = await api.getHotelDetails(hotelId);
                const d = result?.data;
                if (!d) return;
 
                const image =
                    d.main_photo ??
                    d.hotelImages?.[0]?.urlHd ??
                    d.hotelImages?.[0]?.url ??
                    '';
 
                // Build a readable location string from whatever fields the API returns
                const location = [d.city, d.address].filter(Boolean).join(', ');
 
                setTopRatedHotels(prev =>
                    new Map(prev).set(hotelId, {
                        id: hotelId,
                        name: d.name ?? 'Hotel',
                        location,
                        rating: d.rating ?? 0,
                        reviewCount: d.reviewCount ?? 0,
                        image,
                    })
                );
            } catch (err) {
                console.error(`Failed to fetch details for hotel ${hotelId}:`, err);
                // Card stays as skeleton — no broken UI
            }
        });
    }, []);
 
    const defaults = getDefaultDates();
    const stored = loadStored();
 
    const checkIn = stored?.checkIn ?? defaults.checkIn;
    const checkOut = stored?.checkOut ?? defaults.checkOut;
    const occupancies = stored?.occupancies ?? [{adults: 2, children: []}];
 
    const handleDestinationSearch = (destination: { name: string; placeId?: string }) => {
        const queryParams = new URLSearchParams({
            checkIn,
            checkOut,
            occupancies: JSON.stringify(occupancies),
            location: destination.name,
        });
 
        if (destination.placeId) {
            queryParams.set('placeId', destination.placeId);
        }
 
        navigate(`/hotels?${queryParams.toString()}`);
    };
 
    const buildHotelDetailLink = (hotelId: string): string => {
        const params = new URLSearchParams({
            checkIn,
            checkOut,
            occupancies: JSON.stringify(occupancies),
        });
        return `/hotel/${hotelId}?${params.toString()}`;
    };
 
    return (
        <div className="w-full">
            <section className="relative h-[824px] w-full overflow-visible">
                <div className="absolute inset-0">
                    <img
                        src={imgHeroBackground}
                        alt="Luxury hotel interior"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50"/>
                </div>
 
                <div
                    className="relative z-10 container mx-auto px-4 h-full flex flex-col items-center justify-center text-center">
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 max-w-4xl">
                        Find your Perfect Hotel
                    </h1>
                    <p className="text-2xl md:text-3xl text-white/90 mb-12 max-w-3xl">
                        Explore our selection of over 5000+ hotels spanning across 15 countries
                    </p>
 
                    <div className="w-full px-4">
                        <SearchComponent/>
                    </div>
                </div>
            </section>
 
            <section className="py-16 md:py-24 bg-background">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-[bg-bold-text] mb-2">
                                Trending Destinations
                            </h2>
                            <p className="text-lg text-[#717182]">
                                Discover the most popular travel destinations
                            </p>
                        </div>
                        <Button
                            asChild
                            variant="ghost"
                            className="hidden md:flex items-center gap-2 text-[#2563eb] hover:text-[#1e40af]"
                        >
                            <Link to="/hotels">
                                View All
                                <ArrowRight className="w-5 h-5"/>
                            </Link>
                        </Button>
                    </div>
 
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {trendingDestinations.map((destination) => (
                            <button
                                key={destination.id}
                                type="button"
                                onClick={() => handleDestinationSearch(destination)}
                                className="text-left"
                            >
                                <Card
                                    className="group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                                    <div className="relative aspect-square overflow-hidden">
                                        <img
                                            src={destination.image}
                                            alt={destination.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                        <div
                                            className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"/>
                                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                            <h3 className="text-2xl font-bold mb-1">{destination.name}</h3>
                                            <p className="text-sm text-white/90 flex items-center gap-1">
                                                <MapPin className="w-4 h-4"/>
                                                {destination.country}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </button>
                        ))}
                    </div>
                </div>
            </section>
 
            {/* Top Rated Hotels — fully data-driven from real LiteAPI hotel IDs */}
            <section className="py-16 md:py-24 bg-background">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-[bg-bold-text] mb-2">
                                Top Rated Hotels
                            </h2>
                            <p className="text-lg text-[#717182]">
                                Hand-picked hotels with exceptional reviews
                            </p>
                        </div>
                        <Button
                            asChild
                            variant="ghost"
                            className="hidden md:flex items-center gap-2 text-[#2563eb] hover:text-[#1e40af]"
                        >
                            <Link to="/hotels">
                                View All
                                <ArrowRight className="w-5 h-5"/>
                            </Link>
                        </Button>
                    </div>
 
                    <div className="overflow-x-auto pb-4 -mx-4 px-4">
                        <div className="flex gap-6 w-max">
                            {TOP_RATED_HOTEL_IDS.map((hotelId) => {
                                const hotel = topRatedHotels.get(hotelId);
 
                                // Skeleton while fetch is in-flight
                                if (!hotel) {
                                    return (
                                        <div
                                            key={hotelId}
                                            className="w-[320px] md:w-[360px] rounded-lg overflow-hidden shadow-lg border border-border animate-pulse flex-shrink-0"
                                        >
                                            <div className="h-64 bg-muted"/>
                                            <div className="p-6 space-y-3">
                                                <div className="h-5 bg-muted rounded w-3/4"/>
                                                <div className="h-4 bg-muted rounded w-1/2"/>
                                                <div className="flex justify-end">
                                                    <div className="h-9 bg-muted rounded w-28"/>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
 
                                return (
                                    <Link key={hotelId} to={buildHotelDetailLink(hotelId)}>
                                        <Card className="group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 w-[320px] md:w-[360px]">
                                            <div className="relative h-64 overflow-hidden">
                                                {hotel.image ? (
                                                    <img
                                                        src={hotel.image}
                                                        alt={hotel.name}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-muted flex items-center justify-center text-[#717182] text-sm">
                                                        No image
                                                    </div>
                                                )}
                                                {hotel.rating > 0 && (
                                                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1">
                                                        <Star className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]"/>
                                                        <span className="font-bold text-[#1f2937]">{hotel.rating.toFixed(1)}</span>
                                                        {hotel.reviewCount > 0 && (
                                                            <span className="text-xs text-[#717182]">({hotel.reviewCount.toLocaleString()})</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-6">
                                                <h3 className="text-xl font-bold text-[bg-bold-text] mb-2 line-clamp-1">{hotel.name}</h3>
                                                {hotel.location && (
                                                    <p className="text-sm text-[#717182] mb-4 flex items-center gap-1">
                                                        <MapPin className="w-4 h-4 shrink-0"/>
                                                        <span className="line-clamp-1">{hotel.location}</span>
                                                    </p>
                                                )}
                                                <div className="flex items-center justify-end">
                                                    <Button className="bg-[#1d2d44] hover:bg-[#1e40af] dark:bg-background dark:hover:bg-[#1e40af] text-white cursor-pointer">
                                                        Quick View
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>
 
            <section className="py-16 md:py-24 bg-background">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-[bg-bold-text] mb-2">
                                Recommended for You
                            </h2>
                            <p className="text-lg text-[#717182]">
                                Handpicked hotels based on your preferences
                            </p>
                        </div>
                        <Button
                            asChild
                            variant="ghost"
                            className="hidden md:flex items-center gap-2 text-[#2563eb] hover:text-[#1e40af]"
                        >
                            <Link to="/hotels">
                                View All
                                <ArrowRight className="w-5 h-5"/>
                            </Link>
                        </Button>
                    </div>
 
                    <div className="overflow-x-auto pb-4 -mx-4 px-4">
                        <div className="flex gap-6 w-max">
                            {recommendedHotels.map((hotel) => (
                                <Link key={hotel.id} to={`/hotel/${hotel.id}`}>
                                    <Card
                                        className="group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 w-[320px] md:w-[360px]">
                                        <div className="relative h-64 overflow-hidden">
                                            <img
                                                src={hotel.image}
                                                alt={hotel.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                            <div
                                                className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1">
                                                <Star className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]"/>
                                                <span className="font-bold text-[#1f2937]">{hotel.rating}</span>
                                                <span className="text-xs text-[#717182]">({hotel.reviews})</span>
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <h3 className="text-xl font-bold text-[bg-bold-text] mb-2">{hotel.name}</h3>
                                            <p className="text-sm text-[#717182] mb-4 flex items-center gap-1">
                                                <MapPin className="w-4 h-4"/>
                                                {hotel.location}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <div>
                          <span className="text-2xl font-bold text-[bg-bold-text]">
                            {getCurrencySymbol()}
                              {convertPrice(hotel.price)}
                          </span>
                                                    <span className="text-sm text-[bold-text]">/night</span>
                                                </div>
                                                <Button
                                                    className="bg-[#1d2d44] hover:bg-[#1e40af] dark:bg-background dark:hover:bg-[#1e40af] text-white cursor-pointer">
                                                    Quick View
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
 
            <section className="py-20 bg-gradient-to-r from-secondary to-secondary/80">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Ready to start your journey?
                    </h2>
                    <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                        Join thousands of travelers who trust LikeHome for their perfect stay
                    </p>
                    <Button
                        asChild
                        size="lg"
                        className="bg-[#f59e0b] hover:bg-[#d97706] text-white px-12 py-6 text-lg rounded-xl"
                    >
                        <Link to="/hotels">Explore Hotels</Link>
                    </Button>
                </div>
            </section>
        </div>
    );
}