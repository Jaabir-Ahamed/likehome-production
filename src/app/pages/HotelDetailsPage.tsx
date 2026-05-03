import {useEffect, useRef, useState} from 'react';
import {Link, useLocation, useNavigate, useParams, useSearchParams} from 'react-router';
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
    Wifi,
} from 'lucide-react';
import {Button} from '../components/ui/button';
import {Card} from '../components/ui/card';
import {Separator} from '../components/ui/separator';
import {MapComponent} from '../components/MapComponent';
import {api} from '../../api/liteApi';
import {useAuth} from '../contexts/AuthContext';
import {useCurrency} from '../contexts/CurrencyContext';
import {toast} from 'sonner';
import {RoomRateCard} from '../components/RoomRateCard';
import {findBestHotelRoomMatch} from '../../lib/roomMatching';
import type {HotelDetails, Rate} from '../../types/hotel';

const FACILITY_ICON_KEYWORDS: { keywords: string[]; Icon: React.ComponentType<{ className?: string }> }[] = [
    {keywords: ['wifi', 'internet', 'wired'], Icon: Wifi},
    {keywords: ['restaurant', 'dining', 'coffee shop', 'coffee'], Icon: Utensils},
    {keywords: ['parking', 'garage'], Icon: ParkingSquare},
    {keywords: ['fitness', 'gym', 'sport'], Icon: Dumbbell},
];

function getFacilityIcon(name: string): React.ComponentType<{ className?: string }> {
    const lower = name.toLowerCase();
    for (const {keywords, Icon} of FACILITY_ICON_KEYWORDS) {
        if (keywords.some((k) => lower.includes(k))) return Icon;
    }
    return Check;
}

export function HotelDetailsPage() {
    const {id} = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const {user, loading: authLoading} = useAuth();
    const {convertPrice, getCurrencySymbol} = useCurrency();

    const initialCheckIn = searchParams.get('checkIn') ?? '';
    const initialCheckOut = searchParams.get('checkOut') ?? '';
    const occupanciesParam = searchParams.get('occupancies');

    const initialOccupancies = (() => {
        try {
            return occupanciesParam
                ? (JSON.parse(occupanciesParam) as { adults: number; children: number[] }[])
                : [{adults: 2, children: []}];
        } catch {
            return [{adults: 2, children: []}];
        }
    })();

    const [checkIn, setCheckIn] = useState(initialCheckIn);
    const [checkOut, setCheckOut] = useState(initialCheckOut);
    const [occupancies, setOccupancies] = useState<{ adults: number; children: number[] }[]>(initialOccupancies);
    const [selectedImage, setSelectedImage] = useState(0);
    const [manualNights, setManualNights] = useState(1);
    const [prebookLoading, setPrebookLoading] = useState(false);
    const [ratesByOccupancy, setRatesByOccupancy] = useState<Record<number, Rate[]>>({});
    const [selectedRates, setSelectedRates] = useState<Record<number, Rate>>({});
    const [ratesLoading, setRatesLoading] = useState(false);
    const [hotel, setHotel] = useState<HotelDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const autoTriggered = useRef(false);

    const totalGuests = occupancies.reduce(
        (total: number, room: { adults: number; children: number[] }) => total + room.adults + room.children.length,
        0
    );
    const roomCount = occupancies.length;

    useEffect(() => {
        if (authLoading || !user || autoTriggered.current) return;

        const raw = sessionStorage.getItem('pendingReservation');
        if (!raw) return;

        let pending: { offerId: string; hotelId?: string };
        try {
            pending = JSON.parse(raw);
        } catch {
            sessionStorage.removeItem('pendingReservation');
            return;
        }

        if (!pending.offerId) {
            sessionStorage.removeItem('pendingReservation');
            return;
        }

        if (pending.hotelId && pending.hotelId !== id) {
            sessionStorage.removeItem('pendingReservation');
            return;
        }

        autoTriggered.current = true;
        sessionStorage.removeItem('pendingReservation');
        setPrebookLoading(true);
        toast.loading('Resuming your reservation…', {id: 'auto-prebook'});

        api
            .getRatesPrebook({offerId: pending.offerId, usePaymentSdk: false})
            .then((prebook: any) => {
                const prebookData = prebook?.data;
                if (!prebookData?.prebookId) throw new Error('Invalid prebook response');
                sessionStorage.setItem(
                    `prebook:${prebookData.prebookId}`,
                    JSON.stringify({
                        ...prebookData,
                        checkin: checkIn || undefined,
                        checkout: checkOut || undefined,
                    })
                );
                toast.dismiss('auto-prebook');
                const paymentParams = new URLSearchParams({
                    prebookId: prebookData.prebookId,
                    hotelId: id ?? '',
                    checkIn,
                    checkOut,
                    occupancies: JSON.stringify(occupancies),
                    location: searchParams.get('location') ?? '',
                    placeId: searchParams.get('placeId') ?? '',
                });

                navigate(`/payment?${paymentParams.toString()}`);
            })
            .catch(() => {
                toast.dismiss('auto-prebook');
                toast.error('Your selected rate has expired. Please choose a room again.');
            })
            .finally(() => setPrebookLoading(false));
    }, [user, authLoading, id, navigate, checkIn, checkOut]);

    const isSelectionComplete = Object.keys(selectedRates).length === occupancies.length;

    const actualNights = checkIn && checkOut
        ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
        : manualNights;

    function handleToggleRate(rate: Rate) {
        setSelectedRates((prev) => {
            const alreadySelectedKey = Object.keys(prev).find(
                (key) => prev[Number(key)]?.rateId === rate.rateId
            );

            if (alreadySelectedKey) {
                const next = {...prev};
                delete next[Number(alreadySelectedKey)];
                return next;
            }

            const nextRoomNumber = Array.from(
                {length: occupancies.length},
                (_, i) => i + 1
            ).find((roomNumber) => !prev[roomNumber]);

            if (!nextRoomNumber) {
                toast.error(`You already selected ${occupancies.length} rooms.`);
                return prev;
            }

            return {
                ...prev,
                [nextRoomNumber]: rate,
            };
        });
    }

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setError(null);

        api
            .getHotelDetails(id)
            .then((res: any) => setHotel(res?.data ?? null))
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

        api
            .getHotelRates({
                hotelIds: [id],
                checkin: checkIn,
                checkout: checkOut,
                occupancies,
            })
            .then((result: any) => {
                const hotelData = (result?.data ?? []).find((h: any) => h.hotelId === id);

                const flattened: Rate[] =
                    hotelData?.roomTypes?.flatMap((roomType: any) =>
                        (roomType.rates ?? []).map((rate: any) => ({
                            ...rate,
                            offerId: roomType.offerId,
                            roomTypeId: roomType.roomTypeId,
                            mappedRoomId: rate.mappedRoomId ?? roomType.mappedRoomId,
                        }))
                    ) ?? [];

                const grouped = flattened.reduce((acc: Record<number, Rate[]>, rate: Rate) => {
                    const key = rate.occupancyNumber;
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(rate);
                    return acc;
                }, {});

                setRatesByOccupancy(grouped);
            })
            .catch(() => toast.error('Could not load room rates.'))
            .finally(() => setRatesLoading(false));
    }, [id, checkIn, checkOut, occupancies]);

    if (loading) {
        return (
            <div className="w-full bg-background min-h-screen flex items-center justify-center">
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
                        <Link to={`/hotels${location.search}`}>Back to Hotels</Link>
                    </Button>
                </Card>
            </div>
        );
    }

    const images =
        hotel.hotelImages?.length > 0 ? hotel.hotelImages.map((img) => img.urlHd || img.url) : hotel.main_photo ? [hotel.main_photo] : [];

    const locationString = [hotel.address, hotel.city].filter(Boolean).join(', ');

    const selectedTotalRaw = Object.values(selectedRates).reduce((sum: number, rate: Rate) => {
        const amount = rate?.retailRate?.total?.[0]?.amount ?? 0;
        return sum + amount;
    }, 0);
    const selectedTotal = convertPrice(selectedTotalRaw);
    const selectedCurrency = getCurrencySymbol() ?? Object.values(selectedRates)[0]?.retailRate?.total?.[0]?.currency ?? 'USD';
    const fallbackRoomImage = hotel.main_photo || hotel.hotelImages?.[0]?.urlHd || hotel.hotelImages?.[0]?.url || null;
    const allRates = Object.values(ratesByOccupancy).flat();

    const selectedRateIds = new Set(
        Object.values(selectedRates).map((rate) => rate.rateId)
    );

    return (
        <div className="w-full bg-background min-h-screen">
            <div className="container mx-auto px-4 lg:px-8 py-8">
                <Button variant="ghost" asChild className="mb-6">
                    <Link to={`/hotels${location.search}`}>
                        <ArrowLeft className="w-4 h-4 mr-2"/>
                        Back to Hotels
                    </Link>
                </Button>

                <div className="mb-6">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h1 className="text-4xl font-bold text-bold-text mb-2">{hotel.name}</h1>
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
                        {hotel.reviewCount > 0 &&
                            <span className="text-[#717182]">({hotel.reviewCount.toLocaleString()} reviews)</span>}
                    </div>
                </div>

                {images.length > 0 && (
                    <div className="grid grid-cols-4 gap-4 mb-8">
                        <div className="col-span-4 md:col-span-3">
                            <img src={images[selectedImage]} alt={hotel.name}
                                 className="w-full h-[500px] object-cover rounded-lg"/>
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
                    <div className="lg:col-span-2 space-y-8">
                        {hotel.hotelDescription && (
                            <Card className="p-6">
                                <h2 className="text-2xl font-bold text-bold-text mb-4">About This Hotel</h2>
                                <div
                                    className="text-bold-text leading-relaxed prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{__html: hotel.hotelDescription}}
                                />
                            </Card>
                        )}

                        {hotel.checkinCheckoutTimes && (
                            <Card className="p-6">
                                <h2 className="text-2xl font-bold text-bold-text mb-4">Check-in & Check-out</h2>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="flex items-start gap-3">
                                        <Clock className="w-5 h-5 text-[#2563eb] mt-0.5"/>
                                        <div>
                                            <p className="font-semibold text-bold-text">Check-in</p>
                                            <p className="text-[#717182]">From {hotel.checkinCheckoutTimes.checkin_start}</p>
                                            {hotel.checkinCheckoutTimes.checkin_end && (
                                                <p className="text-[#717182]">Until {hotel.checkinCheckoutTimes.checkin_end}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Clock className="w-5 h-5 text-[#2563eb] mt-0.5"/>
                                        <div>
                                            <p className="font-semibold text-bold-text">Check-out</p>
                                            <p className="text-[#717182]">By {hotel.checkinCheckoutTimes.checkout}</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {hotel.hotelFacilities?.length > 0 && (
                            <Card className="p-6">
                                <h2 className="text-2xl font-bold bg-bold-text mb-4">Hotel Facilities</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {hotel.hotelFacilities.slice(0, 18).map((facility) => {
                                        const Icon = getFacilityIcon(facility);
                                        return (
                                            <div key={facility} className="flex items-center gap-2">
                                                <Icon className="w-4 h-4 text-[#2563eb] flex-shrink-0"/>
                                                <span className="text-sm text-bold-text">{facility}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                        )}

                        {hotel.hotelImportantInformation && (
                            <Card className="p-6">
                                <h2 className="text-2xl font-bold text-bold-text mb-4 flex items-center gap-2">
                                    <Info className="w-6 h-6 text-[#f59e0b]"/>
                                    Important Information
                                </h2>
                                <div
                                    className="prose prose-sm max-w-none text-bold-text [&_ul]:pl-5 [&_ul]:list-disc [&_li]:mb-2"
                                    dangerouslySetInnerHTML={{__html: hotel.hotelImportantInformation}}
                                />
                            </Card>
                        )}

                        <Card className="p-6">
                            <h2 className="text-2xl font-bold bg-bold-text mb-4">Available Rooms</h2>

                                <div className="sticky top-0 z-10 bg-background pb-3 px-4 rounded-lg pt-3">
                                    <p className="text-sm text-bold-text">
                                        Select {occupancies.length} {occupancies.length === 1 ? 'room' : 'rooms'} from
                                        this list.
                                    </p>
                                    <p className="text-xs text-[#717182] mt-1">
                                        {Object.keys(selectedRates).length} of {occupancies.length} rooms selected
                                    </p>
                                </div>

                            {ratesLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                                            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"/>
                                            <div className="h-3 bg-gray-200 rounded w-1/4"/>
                                        </div>
                                    ))}
                                </div>
                            ) : !checkIn || !checkOut ? (
                                <p className="text-sm text-[#717182]">Search from the hotel listing to see live rates
                                    and available rooms.</p>
                            ) : Object.keys(ratesByOccupancy).length === 0 ? (
                                <p className="text-sm text-[#717182]">No rooms available for the selected rate.</p>
                            ) : (
                                <div className="max-h-[700px] overflow-y-auto pr-3 space-y-4">

                                    {allRates.map((rate) => {
                                        const matchedRoom = findBestHotelRoomMatch(rate, hotel.rooms ?? []);
                                        const isSelected = selectedRateIds.has(rate.rateId);

                                        return (
                                            <div
                                                key={`${rate.rateId}-${rate.occupancyNumber}`}
                                                className={`border rounded-lg p-3 ${
                                                    isSelected ? 'border-[#2563eb] bg-blue-50 dark:bg-background' : 'border-gray-200'
                                                }`}
                                            >
                                                <label className="flex items-start gap-3 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleToggleRate(rate)}
                                                        className="mt-2 w-5 h-5 cursor-pointer"
                                                    />

                                                    <div className="flex-1">
                                                        <RoomRateCard
                                                            rate={rate}
                                                            room={matchedRoom}
                                                            actualNights={actualNights}
                                                            isSelected={isSelected}
                                                            onSelect={() => handleToggleRate(rate)}
                                                            fallbackImage={fallbackRoomImage}
                                                        />
                                                    </div>
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>

                        {hotel.sentiment_analysis && (
                            <Card className="p-6">
                                <h2 className="text-2xl font-bold text-bold-text mb-4">Guest Reviews</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    {hotel.sentiment_analysis.pros?.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold text-green-700 flex items-center gap-2 mb-2">
                                                <ThumbsUp className="w-4 h-4"/>
                                                What guests love
                                            </h3>
                                            <ul className="space-y-1">
                                                {hotel.sentiment_analysis.pros.map((pro, i) => (
                                                    <li key={i}
                                                        className="text-sm text-bold-text flex items-center gap-2">
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
                                                    <li key={i}
                                                        className="text-sm text-bold-text flex items-start gap-2">
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
                                                    <span
                                                        className="text-sm font-medium text-bold-text">{cat.name}</span>
                                                    <span
                                                        className="text-sm font-bold text-[#2563eb]">{cat.rating.toFixed(1)}</span>
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

                        {hotel.policies?.length > 0 && (
                            <Card className="p-6">
                                <h2 className="text-2xl font-bold text-bold-text mb-4">Hotel Policies</h2>
                                <div className="space-y-4">
                                    {hotel.policies.map((policy) => (
                                        <div key={policy.id}>
                                            <h3 className="font-semibold text-bold-text mb-1">{policy.name}</h3>
                                            <p className="text-sm text-bold-text whitespace-pre-line">{policy.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        <Card className="p-6">
                            <h2 className="text-2xl font-bold text-bold-text mb-4">Location</h2>
                            <MapComponent location={locationString} height="400px"/>
                            <div className="mt-4 p-4 bg-background rounded-lg">
                                <p className="text-sm text-bold-text flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-[#2563eb]"/>
                                    <span className="font-medium text-bold-text">{hotel.address}</span>
                                    <span>•</span>
                                    <span>{hotel.city}</span>
                                </p>
                            </div>
                        </Card>
                    </div>

                    <div className="lg:col-span-1">
                        <Card className="p-6 sticky top-28">
                            <div className="mb-6">
                                {isSelectionComplete ? (
                                    <>
                                        <p className="text-sm text-[#717182] mb-1">
                                            Total for {occupancies.length} {occupancies.length === 1 ? 'room' : 'rooms'}
                                        </p>
                                        <p className="text-lg font-semibold text-[#1f2937]">
                                            {selectedCurrency} {(selectedTotal / actualNights).toFixed(0)}/night
                                        </p>
                                        <p className="text-sm text-[#717182] mt-1">
                                            {selectedCurrency} {selectedTotal.toFixed(0)} total ({actualNights}{' '}
                                            {actualNights === 1 ? 'night' : 'nights'})
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm text-[#717182] mb-1">Nightly rate</p>
                                        <p className="text-lg font-semibold text-bold-text">
                                            {checkIn && checkOut
                                                ? occupancies.length > 1
                                                    ? `Select a room for each of ${roomCount} ${roomCount === 1 ? 'room' : 'rooms'}`
                                                    : 'Select a room below'
                                                : 'Select dates for pricing'}
                                        </p>
                                        {occupancies.length > 1 && checkIn && checkOut && (
                                            <p className="text-xs text-[#717182] mt-1">
                                                {Object.keys(selectedRates).length} of {occupancies.length} rooms
                                                selected
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>

                            <Separator className="my-6"/>

                            <div className="space-y-4 mb-6">
                                <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-bold-text mb-2 block">Rooms</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={occupancies.length}
                                        onChange={(e) => {
                                            const newRoomCount = Math.max(1, Number(e.target.value) || 1);

                                            setOccupancies((prev) => {
                                                const currentTotalGuests = prev.reduce(
                                                    (sum, room) => sum + room.adults + room.children.length,
                                                    0
                                                );

                                                const base = Math.floor(currentTotalGuests / newRoomCount);
                                                let remainder = currentTotalGuests % newRoomCount;

                                                return Array.from({length: newRoomCount}, () => {
                                                    const adults = base + (remainder > 0 ? 1 : 0);
                                                    if (remainder > 0) remainder--;
                                                    return {adults: Math.max(1, adults), children: []};
                                                });
                                            });

                                            setSelectedRates({});
                                        }}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-bold-text mb-2 flex items-center gap-2">
                                        <Users className="w-4 h-4"/>
                                        Guests
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={totalGuests}
                                        onChange={(e) => {
                                            const guestCount = Math.max(1, Number(e.target.value) || 1);

                                            setOccupancies((prev) => {
                                                const currentRoomCount = prev.length;
                                                const base = Math.floor(guestCount / currentRoomCount);
                                                let remainder = guestCount % currentRoomCount;

                                                return Array.from({length: currentRoomCount}, () => {
                                                    const adults = base + (remainder > 0 ? 1 : 0);
                                                    if (remainder > 0) remainder--;
                                                    return {adults: Math.max(1, adults), children: []};
                                                });
                                            });

                                            setSelectedRates({});
                                        }}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                            </div>

                                <div>
                                    <label className="text-sm font-medium text-bold-text mb-2 flex items-center gap-2">
                                        <Calendar className="w-4 h-4"/>
                                        Stay
                                    </label>

                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="date"
                                            value={checkIn}
                                            onChange={(e) => {
                                                setCheckIn(e.target.value);
                                                setSelectedRates({});
                                            }}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                                        />

                                        <input
                                            type="date"
                                            value={checkOut}
                                            onChange={(e) => {
                                                setCheckOut(e.target.value);
                                                setSelectedRates({});
                                            }}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                                        />

                                        {checkIn && checkOut && (
                                            <div className="text-sm text-[#717182]">
                                                {actualNights} {actualNights === 1 ? 'night' : 'nights'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <Button
                                className="w-full bg-[#f59e0b] hover:bg-[#d97706] text-white h-12 text-lg"
                                disabled={prebookLoading || !isSelectionComplete}
                                onClick={async () => {
                                    if (!isSelectionComplete) return;

                                    if (!user) {
                                        const firstRate = Object.values(selectedRates)[0];
                                        sessionStorage.setItem(
                                            'pendingReservation',
                                            JSON.stringify({offerId: firstRate.offerId, hotelId: id})
                                        );
                                        const loginRedirectParams = new URLSearchParams({
                                            checkIn,
                                            checkOut,
                                            occupancies: JSON.stringify(occupancies),
                                            location: searchParams.get('location') ?? '',
                                            placeId: searchParams.get('placeId') ?? '',
                                        });

                                        sessionStorage.setItem(
                                            'loginRedirect',
                                            `${location.pathname}?${loginRedirectParams.toString()}`
                                        );
                                        navigate('/login');
                                        return;
                                    }

                                    setPrebookLoading(true);
                                    try {
                                        const firstRate = Object.values(selectedRates)[0];
                                        const prebook = await api.getRatesPrebook({
                                            offerId: firstRate.offerId,
                                            usePaymentSdk: false,
                                        });

                                        const prebookData = prebook?.data;
                                        if (!prebookData?.prebookId) throw new Error('Invalid prebook response');

                                        sessionStorage.setItem(
                                            `prebook:${prebookData.prebookId}`,
                                            JSON.stringify({
                                                ...prebookData,
                                                checkin: checkIn || undefined,
                                                checkout: checkOut || undefined,
                                            })
                                        );

                                        const paymentParams = new URLSearchParams({
                                            prebookId: prebookData.prebookId,
                                            hotelId: id ?? '',
                                            checkIn,
                                            checkOut,
                                            occupancies: JSON.stringify(occupancies),
                                            location: searchParams.get('location') ?? '',
                                            placeId: searchParams.get('placeId') ?? '',
                                        });

                                        navigate(`/payment?${paymentParams.toString()}`);
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
                                ) : isSelectionComplete ? (
                                    'Reserve Now'
                                ) : (
                                    'Select a Room'
                                )}
                            </Button>

                            <p className="text-xs text-center text-[#717182] mt-4">You won't be charged yet</p>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
