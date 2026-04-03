import {useEffect, useState} from 'react';
import {Link, useNavigate, useParams, useSearchParams} from 'react-router';
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  Dumbbell,
  Heart,
  Info,
  MapPin,
  ParkingSquare,
  Star,
  ThumbsDown,
  ThumbsUp,
  Users,
  Utensils,
  Wifi
} from 'lucide-react';
import {Button} from '../components/ui/button';
import {Card} from '../components/ui/card';
import {Badge} from '../components/ui/badge';
import {Separator} from '../components/ui/separator';
import {MapComponent} from '../components/MapComponent';
import {api} from '../../api/liteApi';
import {toast} from 'sonner';

interface HotelImage {
    url: string;
    urlHd: string;
    caption: string;
    defaultImage: boolean;
}

interface BedType {
    quantity: number;
    bedType: string;
    bedSize: string;
}

interface RoomAmenity {
    amenitiesId: number;
    name: string;
}

interface RoomPhoto {
    url: string;
    mainPhoto: boolean;
}

interface Room {
    id: number;
    roomName: string;
    description: string;
    roomSizeSquare: number | null;
    roomSizeUnit: string;
    maxOccupancy: number;
    bedTypes: BedType[];
    roomAmenities: RoomAmenity[];
    photos: RoomPhoto[];
}

interface Policy {
    id: number;
    name: string;
    description: string;
}

interface SentimentCategory {
    name: string;
    rating: number;
}

interface HotelDetails {
    id: string;
    name: string;
    hotelDescription: string;
    hotelImportantInformation: string;
    checkinCheckoutTimes: {
        checkin_start: string;
        checkin_end: string;
        checkout: string;
    };
    hotelImages: HotelImage[];
    main_photo: string;
    country: string;
    city: string;
    starRating: number;
    location: { latitude: number; longitude: number };
    address: string;
    hotelFacilities: string[];
    rating: number;
    reviewCount: number;
    rooms: Room[];
    policies: Policy[];
    sentiment_analysis?: {
        pros: string[];
        cons: string[];
        categories: SentimentCategory[];
    };
}

const FACILITY_ICON_KEYWORDS: { keywords: string[]; Icon: React.ComponentType<{ className?: string }> }[] = [
    {keywords: ['wifi', 'internet', 'wired'], Icon: Wifi},
    {keywords: ['restaurant', 'dining', 'coffee shop', 'coffee'], Icon: Utensils},
    {keywords: ['parking', 'garage'], Icon: ParkingSquare},
    {keywords: ['fitness', 'gym', 'sport'], Icon: Dumbbell},
];

function getFacilityIcon(name: string): React.ComponentType<{ className?: string }> {
    const lower = name.toLowerCase();
    for (const {keywords, Icon} of FACILITY_ICON_KEYWORDS) {
        if (keywords.some(k => lower.includes(k))) return Icon;
    }
    return Check;
}

export function HotelDetailsPage() {
    const {id} = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const checkIn = searchParams.get('checkIn') ?? '';
    const checkOut = searchParams.get('checkOut') ?? '';
    const occupanciesParam = searchParams.get('occupancies');
    const occupancies = occupanciesParam ? JSON.parse(occupanciesParam) : [{adults: 2}];
    const [selectedImage, setSelectedImage] = useState(0);
    const [guests, setGuests] = useState(2);
    const [manualNights, setManualNights] = useState(1);
    const [prebookLoading, setPrebookLoading] = useState(false);
    const [ratesByOccupancy, setRatesByOccupancy] = useState<Record<number, any[]>>({});
    const [selectedRates, setSelectedRates] = useState<Record<number, any>>({});
    const [ratesLoading, setRatesLoading] = useState(false);
    const [hotel, setHotel] = useState<HotelDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isSelectionComplete = Object.keys(selectedRates).length === occupancies.length;

    const actualNights = checkIn && checkOut
        ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
        : manualNights;

    function handleSelectRate(occupancyNumber: number, rate: any) {
        setSelectedRates(prev => ({
            ...prev,
            [occupancyNumber]: rate
        }));
    }

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        api.getHotelDetails(id)
            .then(res => setHotel(res?.data ?? null))
            .catch(() => {
                setError('Failed to load hotel details.');
                toast.error('Failed to load hotel details.');
            })
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        if (!id || !checkIn || !checkOut) return;

        setRatesLoading(true);
        setSelectedRates({});

        api.getHotelRates({
            hotelIds: [id],
            checkin: checkIn,
            checkout: checkOut,
            occupancies
        })
            .then(result => {
                const hotelData = (result?.data ?? []).find((h: any) => h.hotelId === id);

                const flattened =
                    hotelData?.roomTypes?.flatMap((roomType: any) =>
                        roomType.rates.map((rate: any) => ({
                            ...rate,
                            offerId: roomType.offerId,
                            roomTypeId: roomType.roomTypeId
                        }))
                    ) ?? [];

                const grouped = flattened.reduce((acc: any, rate: any) => {
                    const key = rate.occupancyNumber;
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(rate);
                    return acc;
                }, {});

                setRatesByOccupancy(grouped);
            })
            .catch(() => toast.error('Could not load room rates.'))
            .finally(() => setRatesLoading(false));
    }, [id, checkIn, checkOut]);

    if (loading) {
        return (
            <div className="w-full bg-gray-50 min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[#2563eb] border-t-transparent rounded-full animate-spin"/>
            </div>
        );
    }

    if (error || !hotel) {
        return (
            <div className="w-full bg-gray-50 min-h-screen flex items-center justify-center">
                <Card className="p-8 text-center">
                    <h2 className="text-2xl font-bold text-[#1f2937] mb-4">Hotel Not Found</h2>
                    <p className="text-[#717182] mb-6">{error ?? "The hotel you're looking for doesn't exist."}</p>
                    <Button asChild>
                        <Link to="/hotels">Back to Hotels</Link>
                    </Button>
                </Card>
            </div>
        );
    }

    const images = hotel.hotelImages?.length > 0
        ? hotel.hotelImages.map(img => img.urlHd || img.url)
        : hotel.main_photo ? [hotel.main_photo] : [];

    const locationString = [hotel.address, hotel.city].filter(Boolean).join(', ');

    // Summary for booking card: total price across all selected rates
    const selectedTotal = Object.values(selectedRates).reduce((sum: number, rate: any) => {
        const amount = rate?.retailRate?.total?.[0]?.amount ?? 0;
        return sum + amount;
    }, 0);
    const selectedCurrency = Object.values(selectedRates)[0]?.retailRate?.total?.[0]?.currency ?? 'USD';

    return (
        <div className="w-full bg-gray-50 min-h-screen">
            <div className="container mx-auto px-4 lg:px-8 py-8">
                {/* Back Button */}
                <Button variant="ghost" asChild className="mb-6">
                    <Link to="/hotels">
                        <ArrowLeft className="w-4 h-4 mr-2"/>
                        Back to Hotels
                    </Link>
                </Button>

                {/* Hotel Header */}
                <div className="mb-6">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h1 className="text-4xl font-bold text-[#1f2937] mb-2">{hotel.name}</h1>
                            <p className="text-lg text-[#717182] flex items-center gap-2">
                                <MapPin className="w-5 h-5"/>
                                {hotel.city} • {hotel.address}
                            </p>
                        </div>
                        <button
                            className="w-12 h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center hover:border-[#f59e0b] hover:bg-[#f59e0b]/10 transition-colors"
                            aria-label="Add to favorites"
                        >
                            <Heart className="w-6 h-6 text-[#1f2937]"/>
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        {hotel.starRating > 0 && (
                            <div className="flex items-center gap-1">
                                {Array.from({length: hotel.starRating}).map((_, i) => (
                                    <Star key={i} className="w-5 h-5 fill-[#f59e0b] text-[#f59e0b]"/>
                                ))}
                            </div>
                        )}
                        {hotel.starRating > 0 && <Separator orientation="vertical" className="h-6"/>}
                        {hotel.rating > 0 && (
                            <div className="bg-[#2563eb] text-white px-3 py-1.5 rounded-lg flex items-center gap-1">
                                <Star className="w-4 h-4 fill-white"/>
                                <span className="font-bold">{hotel.rating}</span>
                            </div>
                        )}
                        {hotel.reviewCount > 0 && (
                            <span className="text-[#717182]">({hotel.reviewCount.toLocaleString()} reviews)</span>
                        )}
                    </div>
                </div>

                {/* Image Gallery */}
                {images.length > 0 && (
                    <div className="grid grid-cols-4 gap-4 mb-8">
                        <div className="col-span-4 md:col-span-3">
                            <img
                                src={images[selectedImage]}
                                alt={hotel.name}
                                className="w-full h-[500px] object-cover rounded-lg"
                            />
                        </div>
                        <div className="col-span-4 md:col-span-1 flex md:flex-col gap-4">
                            {images.slice(0, 3).map((image, index) => (
                                <img
                                    key={index}
                                    src={image}
                                    alt={`${hotel.name} ${index + 1}`}
                                    className={`w-full h-[155px] object-cover rounded-lg cursor-pointer transition-all ${
                                        selectedImage === index ? 'ring-2 ring-[#2563eb]' : 'hover:opacity-80'
                                    }`}
                                    onClick={() => setSelectedImage(index)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Description */}
                        {hotel.hotelDescription && (
                            <Card className="p-6">
                                <h2 className="text-2xl font-bold text-[#1f2937] mb-4">About This Hotel</h2>
                                <div
                                    className="text-[#1f2937] leading-relaxed prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{__html: hotel.hotelDescription}}
                                />
                            </Card>
                        )}

                        {/* Check-in / Check-out */}
                        {hotel.checkinCheckoutTimes && (
                            <Card className="p-6">
                                <h2 className="text-2xl font-bold text-[#1f2937] mb-4">Check-in & Check-out</h2>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="flex items-start gap-3">
                                        <Clock className="w-5 h-5 text-[#2563eb] mt-0.5"/>
                                        <div>
                                            <p className="font-semibold text-[#1f2937]">Check-in</p>
                                            <p className="text-[#717182]">From {hotel.checkinCheckoutTimes.checkin_start}</p>
                                            {hotel.checkinCheckoutTimes.checkin_end && (
                                                <p className="text-[#717182]">Until {hotel.checkinCheckoutTimes.checkin_end}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Clock className="w-5 h-5 text-[#2563eb] mt-0.5"/>
                                        <div>
                                            <p className="font-semibold text-[#1f2937]">Check-out</p>
                                            <p className="text-[#717182]">By {hotel.checkinCheckoutTimes.checkout}</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Facilities */}
                        {hotel.hotelFacilities?.length > 0 && (
                            <Card className="p-6">
                                <h2 className="text-2xl font-bold text-[#1f2937] mb-4">Hotel Facilities</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {hotel.hotelFacilities.slice(0, 18).map((facility) => {
                                        const Icon = getFacilityIcon(facility);
                                        return (
                                            <div key={facility} className="flex items-center gap-2">
                                                <Icon className="w-4 h-4 text-[#2563eb] flex-shrink-0"/>
                                                <span className="text-sm text-[#1f2937]">{facility}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                        )}

                        {/* Important Information */}
                        {hotel.hotelImportantInformation && (
                            <Card className="p-6">
                                <h2 className="text-2xl font-bold text-[#1f2937] mb-4 flex items-center gap-2">
                                    <Info className="w-6 h-6 text-[#f59e0b]"/>
                                    Important Information
                                </h2>
                                <pre className="text-sm text-[#1f2937] whitespace-pre-wrap font-sans leading-relaxed">
                  {hotel.hotelImportantInformation}
                </pre>
                            </Card>
                        )}

                        {/* Available Room Rates */}
                        <Card className="p-6">
                            <h2 className="text-2xl font-bold text-[#1f2937] mb-4">Available Rooms</h2>
                            {ratesLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                                            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"/>
                                            <div className="h-3 bg-gray-200 rounded w-1/4"/>
                                        </div>
                                    ))}
                                </div>
                            ) : !checkIn || !checkOut ? (
                                <p className="text-sm text-[#717182]">
                                    Search from the hotel listing to see live rates and available rooms.
                                </p>
                            ) : Object.keys(ratesByOccupancy).length === 0 ? (
                                <p className="text-sm text-[#717182]">No rooms available for the selected dates.</p>
                            ) : (
                                <div className="space-y-6">
                                    {Object.entries(ratesByOccupancy).map(([occNumber, rates]) => {
                                        const occIndex = Number(occNumber) - 1;
                                        const occ = occupancies[occIndex] ?? {adults: 1};

                                        return (
                                            <div key={occNumber} className="border border-gray-200 rounded-lg p-4">
                                                <h3 className="font-bold text-lg text-[#1f2937] mb-3">
                                                    Room {occNumber} — {occ.adults} {occ.adults === 1 ? 'adult' : 'adults'}
                                                    {occ.children?.length ? `, ${occ.children.length} ${occ.children.length === 1 ? 'child' : 'children'}` : ''}
                                                </h3>

                                                <div className="space-y-3">
                                                    {(rates as any[]).map((rate: any) => {
                                                        const price = rate.retailRate?.total?.[0]?.amount;
                                                        const currency = rate.retailRate?.total?.[0]?.currency ?? 'USD';
                                                        const pricePerNight = price != null ? price / actualNights : null;
                                                        const isFreeCancellation = rate.cancellationPolicies?.[0]?.cancelPolicyInfos?.[0]?.amount === 0;
                                                        const isSelected = selectedRates[Number(occNumber)]?.rateId === rate.rateId;

                                                        return (
                                                            <div
                                                                key={rate.rateId}
                                                                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                                                    isSelected
                                                                        ? 'border-2 border-[#2563eb] bg-blue-50'
                                                                        : 'border-gray-200 hover:border-gray-300'
                                                                }`}
                                                                onClick={() => handleSelectRate(Number(occNumber), rate)}
                                                            >
                                                                <div className="flex items-start justify-between gap-4">
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className="font-semibold text-[#1f2937] mb-1">{rate.name}</h4>
                                                                        <div className="flex flex-wrap gap-1 mb-2">
                                                                            {rate.boardName && (
                                                                                <Badge variant="secondary" className="text-xs">{rate.boardName}</Badge>
                                                                            )}
                                                                            {isFreeCancellation && (
                                                                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">Free cancellation</Badge>
                                                                            )}
                                                                            {rate.maxOccupancy != null && (
                                                                                <Badge variant="secondary" className="text-xs">Up to {rate.maxOccupancy} guests</Badge>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right flex-shrink-0">
                                                                        {pricePerNight != null && (
                                                                            <>
                                                                                <p className="font-bold text-[#1f2937]">
                                                                                    {currency} {pricePerNight.toFixed(0)}<span className="text-sm font-normal text-[#717182]">/night</span>
                                                                                </p>
                                                                                <p className="text-xs text-[#717182]">{currency} {price!.toFixed(0)} total</p>
                                                                            </>
                                                                        )}
                                                                        <Button
                                                                            size="sm"
                                                                            variant={isSelected ? 'default' : 'outline'}
                                                                            className={`mt-2 ${isSelected ? 'bg-[#2563eb] hover:bg-[#1d4ed8]' : ''}`}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleSelectRate(Number(occNumber), rate);
                                                                            }}
                                                                        >
                                                                            {isSelected ? <><Check className="w-3 h-3 mr-1"/>Selected</> : 'Select'}
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>

                        {/* Guest Sentiment */}
                        {hotel.sentiment_analysis && (
                            <Card className="p-6">
                                <h2 className="text-2xl font-bold text-[#1f2937] mb-4">Guest Reviews</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    {hotel.sentiment_analysis.pros?.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold text-green-700 flex items-center gap-2 mb-2">
                                                <ThumbsUp className="w-4 h-4"/>
                                                What guests love
                                            </h3>
                                            <ul className="space-y-1">
                                                {hotel.sentiment_analysis.pros.map((pro, i) => (
                                                    <li key={i} className="text-sm text-[#1f2937] flex items-center gap-2">
                                                        <Check className="w-3 h-3 text-green-500 flex-shrink-0"/>
                                                        {pro}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {hotel.sentiment_analysis.cons?.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold text-red-600 flex items-center gap-2 mb-2">
                                                <ThumbsDown className="w-4 h-4"/>
                                                Areas for improvement
                                            </h3>
                                            <ul className="space-y-1">
                                                {hotel.sentiment_analysis.cons.map((con, i) => (
                                                    <li key={i} className="text-sm text-[#1f2937] flex items-start gap-2">
                                                        <span className="text-red-400 flex-shrink-0 mt-0.5">•</span>
                                                        {con}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                                {hotel.sentiment_analysis.categories?.length > 0 && (
                                    <div className="space-y-3">
                                        {hotel.sentiment_analysis.categories.map((cat) => (
                                            <div key={cat.name}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm font-medium text-[#1f2937]">{cat.name}</span>
                                                    <span className="text-sm font-bold text-[#2563eb]">{cat.rating.toFixed(1)}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-[#2563eb] h-2 rounded-full"
                                                        style={{width: `${Math.min((cat.rating / 10) * 100, 100)}%`}}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        )}

                        {/* Policies */}
                        {hotel.policies?.length > 0 && (
                            <Card className="p-6">
                                <h2 className="text-2xl font-bold text-[#1f2937] mb-4">Hotel Policies</h2>
                                <div className="space-y-4">
                                    {hotel.policies.map((policy) => (
                                        <div key={policy.id}>
                                            <h3 className="font-semibold text-[#1f2937] mb-1">{policy.name}</h3>
                                            <p className="text-sm text-[#717182] whitespace-pre-line">{policy.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {/* Location Map */}
                        <Card className="p-6">
                            <h2 className="text-2xl font-bold text-[#1f2937] mb-4">Location</h2>
                            <MapComponent
                                location={locationString}
                                height="400px"
                            />
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-[#717182] flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-[#2563eb]"/>
                                    <span className="font-medium text-[#1f2937]">{hotel.address}</span>
                                    <span>•</span>
                                    <span>{hotel.city}</span>
                                </p>
                            </div>
                        </Card>
                    </div>

                    {/* Booking Card */}
                    <div className="lg:col-span-1">
                        <Card className="p-6 sticky top-28">
                            <div className="mb-6">
                                {isSelectionComplete ? (
                                    <>
                                        <p className="text-sm text-[#717182] mb-1">Total for {occupancies.length} {occupancies.length === 1 ? 'room' : 'rooms'}</p>
                                        <p className="text-lg font-semibold text-[#1f2937]">
                                            {selectedCurrency} {(selectedTotal / actualNights).toFixed(0)}/night
                                        </p>
                                        <p className="text-sm text-[#717182] mt-1">
                                            {selectedCurrency} {selectedTotal.toFixed(0)} total ({actualNights} {actualNights === 1 ? 'night' : 'nights'})
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm text-[#717182] mb-1">Nightly rate</p>
                                        <p className="text-lg font-semibold text-[#1f2937]">
                                            {checkIn && checkOut
                                                ? occupancies.length > 1
                                                    ? `Select a room for each of ${occupancies.length} guests`
                                                    : 'Select a room below'
                                                : 'Select dates for pricing'}
                                        </p>
                                        {occupancies.length > 1 && checkIn && checkOut && (
                                            <p className="text-xs text-[#717182] mt-1">
                                                {Object.keys(selectedRates).length} of {occupancies.length} rooms selected
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>

                            <Separator className="my-6"/>

                            {/* Booking Options */}
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="text-sm font-medium text-[#1f2937] mb-2 flex items-center gap-2">
                                        <Users className="w-4 h-4"/>
                                        Guests
                                    </label>
                                    <select
                                        value={guests}
                                        onChange={(e) => setGuests(Number(e.target.value))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                                    >
                                        {[1, 2, 3, 4, 5, 6].map((num) => (
                                            <option key={num} value={num}>
                                                {num} {num === 1 ? 'Guest' : 'Guests'}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-[#1f2937] mb-2 flex items-center gap-2">
                                        <Calendar className="w-4 h-4"/>
                                        {checkIn && checkOut ? 'Stay' : 'Number of Nights'}
                                    </label>
                                    {checkIn && checkOut ? (
                                        <div className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-[#1f2937]">
                                            {checkIn} → {checkOut} <span className="text-[#717182]">({actualNights} {actualNights === 1 ? 'night' : 'nights'})</span>
                                        </div>
                                    ) : (
                                        <select
                                            value={manualNights}
                                            onChange={(e) => setManualNights(Number(e.target.value))}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                                        >
                                            {[1, 2, 3, 4, 5, 6, 7, 14, 21, 30].map((num) => (
                                                <option key={num} value={num}>
                                                    {num} {num === 1 ? 'Night' : 'Nights'}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>

                            <Button
                                className="w-full bg-[#f59e0b] hover:bg-[#d97706] text-white h-12 text-lg"
                                disabled={prebookLoading || !isSelectionComplete}
                                onClick={async () => {
                                    if (!isSelectionComplete) return;
                                    setPrebookLoading(true);
                                    try {
                                        // Use the offerId from the first selected rate (single-room booking)
                                        const firstRate = Object.values(selectedRates)[0];
                                        const prebook = await api.getRatesPrebook({
                                            offerId: firstRate.offerId,
                                            usePaymentSdk: false
                                        });
                                        const prebookData = prebook?.data;
                                        if (!prebookData?.prebookId) throw new Error('Invalid prebook response');
                                        sessionStorage.setItem(
                                            `prebook:${prebookData.prebookId}`,
                                            JSON.stringify({
                                                ...prebookData,
                                                checkin: checkIn || undefined,
                                                checkout: checkOut || undefined
                                            })
                                        );
                                        navigate(`/payment?prebookId=${prebookData.prebookId}`);
                                    } catch (err: any) {
                                        if (err?.context?.status === 409) {
                                            const body = await err.context.json().catch(() => null);
                                            if (body?.error === 'booking_conflict') {
                                                toast.error(body.message ?? 'You already have a booking on overlapping dates.');
                                                return;
                                            }
                                        }
                                        toast.error('Failed to reserve rate. Please try again.');
                                    } finally {
                                        setPrebookLoading(false);
                                    }
                                }}
                            >
                                {prebookLoading ? (
                                    <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                    Reserving...
                  </span>
                                ) : isSelectionComplete ? 'Reserve Now' : 'Select a Room'}
                            </Button>

                            <p className="text-xs text-center text-[#717182] mt-4">
                                You won't be charged yet
                            </p>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
