import {useEffect, useMemo, useState} from 'react';
import {Link, useNavigate, useSearchParams} from 'react-router';
import {AlertTriangle, ArrowLeft, Calendar, CreditCard, Lock, Users} from 'lucide-react';
import {Button} from '../components/ui/button';
import {Card} from '../components/ui/card';
import {Input} from '../components/ui/input';
import {Label} from '../components/ui/label';
import {Separator} from '../components/ui/separator';
import {useCurrency} from '../contexts/CurrencyContext';
import {useRewards} from '../contexts/RewardsContext';
import {useAuth} from '../contexts/AuthContext';
import {toast} from 'sonner';
import {api} from '../../api/liteApi';

const PHONE_CODES = [
    {code: '+1', short: 'USA', name: 'United States'},
    {code: '+1', short: 'CAN', name: 'Canada'},
    {code: '+44', short: 'GBR', name: 'United Kingdom'},
    {code: '+61', short: 'AUS', name: 'Australia'},
    {code: '+49', short: 'DEU', name: 'Germany'},
    {code: '+33', short: 'FRA', name: 'France'},
    {code: '+81', short: 'JPN', name: 'Japan'},
    {code: '+86', short: 'CHN', name: 'China'},
    {code: '+91', short: 'IND', name: 'India'},
    {code: '+55', short: 'BRA', name: 'Brazil'},
    {code: '+52', short: 'MEX', name: 'Mexico'},
    {code: '+34', short: 'ESP', name: 'Spain'},
    {code: '+39', short: 'ITA', name: 'Italy'},
    {code: '+7', short: 'RUS', name: 'Russia'},
    {code: '+82', short: 'KOR', name: 'South Korea'},
    {code: '+65', short: 'SGP', name: 'Singapore'},
    {code: '+971', short: 'UAE', name: 'United Arab Emirates'},
    {code: '+966', short: 'SAU', name: 'Saudi Arabia'},
    {code: '+31', short: 'NLD', name: 'Netherlands'},
    {code: '+46', short: 'SWE', name: 'Sweden'},
];

type PrebookRate = {
    rateId?: string;
    occupancyNumber: number;
    boardName?: string;
    adultCount?: number;
    childCount?: number;
    retailRate?: { total?: { amount?: number; currency?: string }[] };
    cancellationPolicies?: {
        cancelPolicyInfos?: { cancelTime?: string; amount?: number }[];
        refundableTag?: string;
    };
};

type PrebookRoomType = {
    name?: string;
    rates?: PrebookRate[];
};

type PrebookData = {
    prebookId: string;
    hotelId?: string;
    checkin?: string;
    checkout?: string;
    roomTypes?: PrebookRoomType[];
    price?: number;
    currency?: string;
    priceDifferencePercent?: number;
    cancellationChanged?: boolean;
    boardChanged?: boolean;
};

type RoomGuest = {
    firstName: string;
    lastName: string;
    email: string;
};

type RewardAdjustmentRecord = {
    earnedPoints: number;
    redeemedPoints: number;
};

const REWARD_ADJUSTMENTS_STORAGE_KEY = 'reward:bookingAdjustments';

function persistBookingRewardAdjustment(bookingId: string, adjustment: RewardAdjustmentRecord) {
    try {
        const raw = localStorage.getItem(REWARD_ADJUSTMENTS_STORAGE_KEY);
        const parsed: Record<string, RewardAdjustmentRecord> = raw ? JSON.parse(raw) : {};
        parsed[bookingId] = adjustment;
        localStorage.setItem(REWARD_ADJUSTMENTS_STORAGE_KEY, JSON.stringify(parsed));
    } catch {
        // Best-effort persistence; don't block checkout on localStorage issues.
    }
}

function getOccupancyNumbers(prebookData: PrebookData | null): number[] {
    if (!prebookData) return [1];

    const nums: number[] = [];
    for (const rt of prebookData.roomTypes ?? []) {
        for (const r of rt.rates ?? []) {
            if (!nums.includes(r.occupancyNumber)) nums.push(r.occupancyNumber);
        }
    }

    return nums.length > 0 ? nums.sort((a, b) => a - b) : [1];
}

export function PaymentPage() {
    const [cardErrors, setCardErrors] = useState({
        cardNumber: '',
        expiryDate: '',
        cvv: '',
    });

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const {convertPrice, getCurrencySymbol} = useCurrency();
    const {
        points,
        loading: rewardsLoading,
        addPoints,
        redeemPoints,
        dollarsToPoints,
        maxRedeemableForAmount,
    } = useRewards();
    const {user} = useAuth();

    const checkIn = searchParams.get('checkIn') || '';
    const checkOut = searchParams.get('checkOut') || '';
    const occupanciesParam = searchParams.get('occupancies');
    const prebookId = searchParams.get('prebookId');

    const occupancies: { adults: number; children: number[] }[] = useMemo(() => {
        if (!occupanciesParam) return [{adults: 2, children: []}];
        try {
            return JSON.parse(occupanciesParam);
        } catch {
            return [{adults: 2, children: []}];
        }
    }, [occupanciesParam]);

    const guestsParam = occupancies.reduce(
        (total, room) => total + room.adults + room.children.length,
        0
    );

    const nights =
        checkIn && checkOut
            ? Math.max(
                1,
                Math.round(
                    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000
                )
            )
            : 1;

    const [prebookData, setPrebookData] = useState<PrebookData | null>(null);
    const hotelId = searchParams.get('hotelId') || prebookData?.hotelId || '';

    const [roomGuestsList, setRoomGuestsList] = useState<RoomGuest[][]>([
        [{firstName: '', lastName: '', email: ''}],
    ]);
    const [holderPhone, setHolderPhone] = useState({countryCode: '+1', number: ''});
    const [cardData, setCardData] = useState({
        cardNumber: '',
        cardName: '',
        expiryDate: '',
        cvv: '',
    });
    const [remarks, setRemarks] = useState('');

    const [processing, setProcessing] = useState(false);
    const [overlapError, setOverlapError] = useState(false);
    const [overlapChecking, setOverlapChecking] = useState(false);
    const [pointsToRedeemInput, setPointsToRedeemInput] = useState('');
    const [redeemDiscount, setRedeemDiscount] = useState(0);
    const [redeemQuoteLoading, setRedeemQuoteLoading] = useState(false);
    const [redeemQuoteError, setRedeemQuoteError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        api
            .getProfile()
            .then((profile) => {
                if (!profile) return;

                const fullName = profile.full_name ?? '';
                const nameParts = fullName.trim().split(/\s+/);
                const firstName = nameParts[0] ?? '';
                const lastName = nameParts.slice(1).join(' ');

                setRoomGuestsList((prev) =>
                    prev.map((room, ri) =>
                        ri === 0
                            ? room.map((g, gi) =>
                                gi === 0
                                    ? {
                                        firstName: g.firstName || firstName,
                                        lastName: g.lastName || lastName,
                                        email: g.email || profile.email || user.email || '',
                                    }
                                    : g
                            )
                            : room
                    )
                );

                if (profile.phone) {
                    const phoneStr = profile.phone.trim();
                    const match = phoneStr.match(/^(\+\d{1,3})\s*(.*)$/);
                    if (match) {
                        setHolderPhone((prev) =>
                            prev.number ? prev : {countryCode: match[1], number: match[2]}
                        );
                    }
                }
            })
            .catch(() => {
                // Non-critical.
            });
    }, [user]);

    useEffect(() => {
        if (!prebookId) return;

        const raw = sessionStorage.getItem(`prebook:${prebookId}`);
        if (!raw) return;

        try {
            const data: PrebookData = JSON.parse(raw);
            setPrebookData(data);

            const nums = getOccupancyNumbers(data);
            setRoomGuestsList((prev) => {
                const filled = prev[0]?.[0] ?? {firstName: '', lastName: '', email: ''};
                return nums.map((_, i) =>
                    i === 0 ? [filled] : [{firstName: '', lastName: '', email: ''}]
                );
            });
        } catch {
            // Ignore invalid storage data.
        }
    }, [prebookId]);

    useEffect(() => {
        if (!user) return;
        if (!prebookData?.checkin || !prebookData?.checkout) return;

        let cancelled = false;
        setOverlapChecking(true);
        setOverlapError(false);

        api
            .checkBookingOverlap({
                checkin: prebookData.checkin,
                checkout: prebookData.checkout,
            })
            .then((result) => {
                if (cancelled) return;
                if (result.hasConflict) setOverlapError(true);
            })
            .catch(() => {
                // Ignore pre-check failure.
            })
            .finally(() => {
                if (!cancelled) setOverlapChecking(false);
            });

        return () => {
            cancelled = true;
        };
    }, [user, prebookData?.checkin, prebookData?.checkout]);

    const updateRoomGuest = (
        roomIdx: number,
        guestIdx: number,
        field: keyof RoomGuest,
        value: string
    ) => {
        setRoomGuestsList((prev) =>
            prev.map((room, ri) =>
                ri === roomIdx
                    ? room.map((g, gi) => (gi === guestIdx ? {...g, [field]: value} : g))
                    : room
            )
        );
    };

    const isRealPrebook = !!prebookData;

    const prebookPrice =
        prebookData?.price ??
        prebookData?.roomTypes?.[0]?.rates?.[0]?.retailRate?.total?.[0]?.amount ??
        0;

    const basePrice = convertPrice(prebookPrice);
    const serviceFee = Math.round(basePrice * 0.1);
    const finalTotal = basePrice + serviceFee;
    const priceSymbol = getCurrencySymbol();

    const parsedPointsToRedeem = useMemo(() => {
        const trimmed = pointsToRedeemInput.trim();
        if (!trimmed) return 0;

        const parsed = Number(trimmed);
        if (!Number.isFinite(parsed)) return -1;

        return Math.floor(parsed);
    }, [pointsToRedeemInput]);

    const pointsBalance = points ?? 0;
    const maxRedeemablePoints = maxRedeemableForAmount(finalTotal);
    const discountedTotal = Math.max(finalTotal - redeemDiscount, 0);

    useEffect(() => {
        if (!pointsToRedeemInput.trim()) {
            setRedeemDiscount(0);
            setRedeemQuoteError(null);
            setRedeemQuoteLoading(false);
            return;
        }

        if (parsedPointsToRedeem < 0) {
            setRedeemDiscount(0);
            setRedeemQuoteError('Enter a whole number of points.');
            setRedeemQuoteLoading(false);
            return;
        }

        if (parsedPointsToRedeem === 0) {
            setRedeemDiscount(0);
            setRedeemQuoteError(null);
            setRedeemQuoteLoading(false);
            return;
        }

        if (!Number.isInteger(parsedPointsToRedeem)) {
            setRedeemDiscount(0);
            setRedeemQuoteError('Points must be a whole number.');
            setRedeemQuoteLoading(false);
            return;
        }

        if (parsedPointsToRedeem > pointsBalance) {
            setRedeemDiscount(0);
            setRedeemQuoteError(`You only have ${pointsBalance.toLocaleString()} points.`);
            setRedeemQuoteLoading(false);
            return;
        }

        if (parsedPointsToRedeem > maxRedeemablePoints) {
            setRedeemDiscount(0);
            setRedeemQuoteError(
                `You can redeem up to ${maxRedeemablePoints.toLocaleString()} points for this booking total.`
            );
            setRedeemQuoteLoading(false);
            return;
        }

        let cancelled = false;
        setRedeemQuoteLoading(true);
        setRedeemQuoteError(null);

        const timer = window.setTimeout(async () => {
            try {
                const dollars = await api.callPointsToDollars(parsedPointsToRedeem);
                if (!cancelled) {
                    const boundedDiscount = Math.min(Math.max(dollars, 0), finalTotal);
                    setRedeemDiscount(boundedDiscount);
                }
            } catch {
                if (!cancelled) {
                    setRedeemDiscount(0);
                    setRedeemQuoteError('Could not calculate points discount right now.');
                }
            } finally {
                if (!cancelled) setRedeemQuoteLoading(false);
            }
        }, 300);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [
        pointsToRedeemInput,
        parsedPointsToRedeem,
        pointsBalance,
        finalTotal,
        maxRedeemablePoints,
    ]);

    const warnings: string[] = [];
    if (isRealPrebook) {
        if (prebookData.priceDifferencePercent && prebookData.priceDifferencePercent !== 0) {
            warnings.push(`Price has changed by ${prebookData.priceDifferencePercent}%`);
        }
        if (prebookData.cancellationChanged) {
            warnings.push('Cancellation policy has changed since you last viewed this rate');
        }
        if (prebookData.boardChanged) {
            warnings.push('Meal plan (board) has changed since you last viewed this rate');
        }
    }

    if (!isRealPrebook) {
        return (
            <div className="w-full bg-gray-50 min-h-screen flex items-center justify-center">
                <Card className="p-8 text-center">
                    <h2 className="text-2xl font-bold text-[#1f2937] mb-4">Booking Not Found</h2>
                    <p className="text-[#717182] mb-6">
                        Prebook data has expired or is missing. Please start a new search.
                    </p>
                    <Button asChild>
                        <Link to="/hotels">Back to Hotels</Link>
                    </Button>
                </Card>
            </div>
        );
    }

    const occupancyNumbers = getOccupancyNumbers(prebookData);

    const hotelName =
        prebookData.roomTypes?.[0]?.name ?? `Hotel ${prebookData.hotelId ?? ''}`;
    const hotelLocation = '';
    const hotelImage = null;
    const cancellationText = prebookData.cancellationChanged
        ? 'Cancellation policy has changed — review before booking.'
        : 'See cancellation policy details below.';

    const backSearchParams = new URLSearchParams();
    if (checkIn) backSearchParams.set('checkIn', checkIn);
    if (checkOut) backSearchParams.set('checkOut', checkOut);
    if (occupanciesParam) backSearchParams.set('occupancies', occupanciesParam);

    const locationParam = searchParams.get('location');
    const placeIdParam = searchParams.get('placeId');

    if (locationParam) backSearchParams.set('location', locationParam);
    if (placeIdParam) backSearchParams.set('placeId', placeIdParam);

    const backHref = hotelId
        ? `/hotel/${hotelId}?${backSearchParams.toString()}`
        : `/hotels${backSearchParams.toString() ? `?${backSearchParams.toString()}` : ''}`;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const errors = {
            cardNumber: '',
            expiryDate: '',
            cvv: '',
        };

        setProcessing(true);

        const cardNumber = cardData.cardNumber.replace(/\s/g, '');

        if (!/^\d{12,19}$/.test(cardNumber)) {
            errors.cardNumber = 'Card number is invalid';
        }

        if (!/^\d{2}\/\d{2}$/.test(cardData.expiryDate)) {
            errors.expiryDate = 'Invalid expiry date (MM/YY)';
        }

        if (!/^\d{3,4}$/.test(cardData.cvv)) {
            errors.cvv = 'Invalid CVV';
        }

        setCardErrors(errors);

        if (errors.cardNumber || errors.expiryDate || errors.cvv) {
            setProcessing(false);
            return;
        }

        try {
            setOverlapError(false);

            const primaryGuest = roomGuestsList[0]?.[0] ?? {
                firstName: '',
                lastName: '',
                email: '',
            };

            const holder = {
                firstName: primaryGuest.firstName,
                lastName: primaryGuest.lastName,
                email: primaryGuest.email,
                phone: `${holderPhone.countryCode}${holderPhone.number}`,
            };

            const guests = occupancyNumbers.map((occupancyNumber, roomIdx) => {
                const g = roomGuestsList[roomIdx]?.[0] ?? primaryGuest;
                return {
                    occupancyNumber,
                    firstName: g.firstName,
                    lastName: g.lastName,
                    email: g.email || primaryGuest.email,
                    ...(remarks ? {remarks} : {}),
                };
            });

            const redeemNow = Math.max(
                0,
                Math.min(
                    Number.isInteger(parsedPointsToRedeem) ? parsedPointsToRedeem : 0,
                    maxRedeemablePoints
                )
            );

            const bookingResponse = await api.getRatesBook({
                prebookId: prebookData.prebookId,
                checkin: prebookData.checkin,
                checkout: prebookData.checkout,
                holder,
                guests,
                payment: {method: 'CREDIT'},
            });

            if (redeemNow > 0) {
                const newRedeemedTotal = await redeemPoints(redeemNow);
                if (newRedeemedTotal === null) {
                    toast.error('Booking succeeded, but we could not redeem your points.');
                }
            }

            const pointsEarned = dollarsToPoints(discountedTotal);
            let newPointsTotal: number | null = pointsBalance;

            if (pointsEarned > 0) {
                newPointsTotal = await addPoints(pointsEarned);
            }

            const bookingId =
                (bookingResponse as { data?: { bookingId?: string }; bookingId?: string })?.data
                    ?.bookingId ??
                (bookingResponse as { bookingId?: string })?.bookingId;

            if (bookingId) {
                persistBookingRewardAdjustment(bookingId, {
                    earnedPoints: pointsEarned,
                    redeemedPoints: redeemNow,
                });
            }

            if (pointsEarned > 0 && newPointsTotal === null) {
                toast.error('Failed to add reward points.');
            } else {
                toast.success(
                    `Booking confirmed! You've earned ${pointsEarned} points${
                        redeemNow > 0 ? ` and redeemed ${redeemNow} points` : ''
                    }${newPointsTotal !== null ? ` (total: ${newPointsTotal})` : ''}. Check your email for details.`
                );
            }

            sessionStorage.removeItem(`prebook:${prebookData.prebookId}`);
            navigate('/bookings');
        } catch (err: unknown) {
            const status = (err as { context?: { status?: number } })?.context?.status;
            const ctx = (err as { context?: Response | undefined })?.context;

            let serverMessage = '';
            let liteApiMessage = '';

            if (ctx && typeof (ctx as Response).json === 'function') {
                const body = (await (ctx as Response).json().catch(() => null)) as
                    | { error?: string; message?: string; liteapi_response?: string }
                    | null;

                serverMessage = (body?.message ?? body?.error ?? '').toLowerCase();

                if (typeof body?.liteapi_response === 'string') {
                    try {
                        const parsed = JSON.parse(body.liteapi_response) as {
                            error?: { description?: string; message?: string };
                        };
                        liteApiMessage = parsed?.error?.description ?? parsed?.error?.message ?? '';
                    } catch {
                        // Ignore parsing failures.
                    }
                }
            }

            const looksLikeOverlap =
                status === 409 ||
                (status === 403 &&
                    (serverMessage.includes('overlap') ||
                        serverMessage.includes('conflict') ||
                        serverMessage.includes('already') ||
                        serverMessage.includes('existing booking')));

            if (looksLikeOverlap) {
                setOverlapError(true);
            } else if (status === 403 && liteApiMessage.toLowerCase().includes('fraud')) {
                toast.error(`Booking was rejected by provider fraud checks: ${liteApiMessage}`);
            } else if (status === 403) {
                toast.error(
                    'Booking request was rejected by the server (403). Please check account permissions or function auth settings.'
                );
            } else {
                toast.error('Booking failed. Please try again.');
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="w-full bg-gray-50 min-h-screen">
            <div className="container mx-auto px-4 lg:px-8 py-8">
                <Button variant="ghost" asChild className="mb-6">
                    <Link to={backHref}>
                        <ArrowLeft className="w-4 h-4 mr-2"/>
                        Back to Hotel Details
                    </Link>
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-[#1f2937] mb-2">
                                Complete Your Booking
                            </h1>
                            <p className="text-lg text-[#717182]">
                                You're just one step away from your perfect stay
                            </p>
                        </div>

                        {warnings.length > 0 && (
                            <Card className="p-4 border-amber-300 bg-amber-50">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0"/>
                                    <div>
                                        <p className="font-semibold text-amber-800 mb-1">Rate details have changed</p>
                                        <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                                            {warnings.map((w, i) => (
                                                <li key={i}>{w}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </Card>
                        )}

                        <Card className="p-6">
                            <div className="flex items-baseline justify-between mb-1">
                                <h2 className="text-xl font-bold text-[#1f2937]">Who's checking in?</h2>
                                <span className="text-sm text-[#717182]">* Required</span>
                            </div>
                            <p className="text-sm text-[#717182] mb-6">
                                Enter the name of the guest staying in each room exactly as it appears on their
                                ID.
                            </p>

                            <form id="booking-form" onSubmit={handleSubmit} className="space-y-0">
                                {occupancyNumbers.map((occNum, roomIdx) => {
                                    const isFirstRoom = roomIdx === 0;
                                    const guest = roomGuestsList[roomIdx]?.[0] ?? {
                                        firstName: '',
                                        lastName: '',
                                        email: '',
                                    };

                                    return (
                                        <div key={occNum}>
                                            <div className="flex items-center gap-3 mb-5">
                                                {roomIdx > 0 && <Separator className="flex-1"/>}
                                                <span
                                                    className="text-sm font-semibold text-[#1f2937] whitespace-nowrap">
                          Room {roomIdx + 1}
                        </span>
                                                <Separator className="flex-1"/>
                                            </div>

                                            <div className="space-y-4 mb-2">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor={`firstName-${roomIdx}`}>
                                                            First name <span className="text-red-500">*</span>
                                                        </Label>
                                                        <Input
                                                            id={`firstName-${roomIdx}`}
                                                            placeholder="e.g. John"
                                                            value={guest.firstName}
                                                            onChange={(e) =>
                                                                updateRoomGuest(roomIdx, 0, 'firstName', e.target.value)
                                                            }
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor={`lastName-${roomIdx}`}>
                                                            Last name <span className="text-red-500">*</span>
                                                        </Label>
                                                        <Input
                                                            id={`lastName-${roomIdx}`}
                                                            placeholder="e.g. Smith"
                                                            value={guest.lastName}
                                                            onChange={(e) =>
                                                                updateRoomGuest(roomIdx, 0, 'lastName', e.target.value)
                                                            }
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <Label htmlFor={`email-${roomIdx}`}>
                                                        Email address {isFirstRoom &&
                                                        <span className="text-red-500">*</span>}
                                                    </Label>
                                                    <Input
                                                        id={`email-${roomIdx}`}
                                                        type="email"
                                                        placeholder="e.g. john@example.com"
                                                        value={guest.email}
                                                        onChange={(e) =>
                                                            updateRoomGuest(roomIdx, 0, 'email', e.target.value)
                                                        }
                                                        required={isFirstRoom}
                                                    />
                                                    {!isFirstRoom && (
                                                        <p className="text-xs text-[#717182] mt-1">
                                                            Optional — defaults to Room 1 email
                                                        </p>
                                                    )}
                                                </div>

                                                {isFirstRoom && (
                                                    <div>
                                                        <Label>
                                                            Phone number <span className="text-red-500">*</span>
                                                        </Label>
                                                        <div className="flex gap-2">
                                                            <select
                                                                className="border border-input rounded-md px-3 py-2 text-sm bg-background w-36 shrink-0"
                                                                value={holderPhone.countryCode}
                                                                onChange={(e) =>
                                                                    setHolderPhone({
                                                                        ...holderPhone,
                                                                        countryCode: e.target.value,
                                                                    })
                                                                }
                                                                required
                                                            >
                                                                {PHONE_CODES.map((c, i) => (
                                                                    <option key={`${c.short}-${i}`} value={c.code}>
                                                                        {c.short} {c.code}
                                                                    </option>
                                                                ))}
                                                            </select>

                                                            <Input
                                                                type="tel"
                                                                placeholder="Phone number"
                                                                value={holderPhone.number}
                                                                onChange={(e) =>
                                                                    setHolderPhone({
                                                                        ...holderPhone,
                                                                        number: e.target.value,
                                                                    })
                                                                }
                                                                required
                                                                className="flex-1"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                <div className="pt-2">
                                    <Label htmlFor="remarks">Special Requests (optional)</Label>
                                    <textarea
                                        id="remarks"
                                        className="w-full border border-input rounded-md px-3 py-2 text-sm resize-none bg-background mt-1"
                                        rows={2}
                                        placeholder="e.g. early check-in, ground floor room, extra pillows"
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                    />
                                </div>
                            </form>
                        </Card>

                        <Card className="p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <CreditCard className="w-5 h-5 text-[#2563eb]"/>
                                <h2 className="text-xl font-bold text-[#1f2937]">Payment Details</h2>
                                <Lock className="w-4 h-4 text-green-600 ml-auto"/>
                                <span className="text-sm text-green-600">Secure Payment</span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="cardNumber">Card Number</Label>
                                    <Input
                                        id="cardNumber"
                                        placeholder="1234 5678 9012 3456"
                                        value={cardData.cardNumber}
                                        onChange={(e) => {
                                            let value = e.target.value.replace(/\D/g, '');
                                            value = value.match(/.{1,4}/g)?.join(' ') || '';

                                            setCardData({
                                                ...cardData,
                                                cardNumber: value,
                                            });

                                            setCardErrors((prev) => ({...prev, cardNumber: ''}));
                                        }}
                                        className={cardErrors.cardNumber ? 'border-red-500' : ''}
                                        maxLength={19}
                                        required
                                        form="booking-form"
                                    />
                                    {cardErrors.cardNumber && (
                                        <p className="text-red-500 text-sm mt-1">{cardErrors.cardNumber}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="cardName">Cardholder Name</Label>
                                    <Input
                                        id="cardName"
                                        placeholder="Name on card"
                                        value={cardData.cardName}
                                        onChange={(e) =>
                                            setCardData({...cardData, cardName: e.target.value})
                                        }
                                        required
                                        form="booking-form"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="expiryDate">Expiry Date</Label>
                                        <Input
                                            id="expiryDate"
                                            placeholder="MM/YY"
                                            value={cardData.expiryDate}
                                            onChange={(e) => {
                                                let value = e.target.value.replace(/\D/g, '');

                                                if (value.length > 2) {
                                                    value = value.slice(0, 2) + '/' + value.slice(2, 4);
                                                }

                                                setCardData({...cardData, expiryDate: value});
                                                setCardErrors((prev) => ({...prev, expiryDate: ''}));
                                            }}
                                            className={cardErrors.expiryDate ? 'border-red-500' : ''}
                                            maxLength={5}
                                            required
                                            form="booking-form"
                                        />
                                        {cardErrors.expiryDate && (
                                            <p className="text-red-500 text-sm mt-1">{cardErrors.expiryDate}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="cvv">CVV</Label>
                                        <Input
                                            id="cvv"
                                            type="password"
                                            placeholder="123"
                                            value={cardData.cvv}
                                            onChange={(e) => {
                                                setCardData({
                                                    ...cardData,
                                                    cvv: e.target.value.replace(/\D/g, ''),
                                                });
                                                setCardErrors((prev) => ({...prev, cvv: ''}));
                                            }}
                                            className={cardErrors.cvv ? 'border-red-500' : ''}
                                            maxLength={4}
                                            required
                                            form="booking-form"
                                        />
                                        {cardErrors.cvv && (
                                            <p className="text-red-500 text-sm mt-1">{cardErrors.cvv}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                                <p className="text-sm text-[#1f2937]">
                                    By completing this booking, you agree to the{' '}
                                    <a href="#" className="text-[#2563eb] hover:underline">
                                        Terms & Conditions
                                    </a>{' '}
                                    and{' '}
                                    <a href="#" className="text-[#2563eb] hover:underline">
                                        Cancellation Policy
                                    </a>
                                    .
                                </p>
                            </div>

                            {overlapError && (
                                <Card className="p-4 border-red-300 bg-red-50 mt-6">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0"/>
                                        <div>
                                            <p className="font-semibold text-red-800 mb-1">Booking dates conflict</p>
                                            <p className="text-sm text-red-700 mb-3">
                                                You already have a hotel booking that overlaps these dates. Cancel or
                                                change your existing booking before booking another stay.
                                            </p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                                className="border-red-400 text-red-700 hover:bg-red-100"
                                            >
                                                <Link to="/bookings">View my bookings</Link>
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            <Button
                                type="submit"
                                form="booking-form"
                                disabled={
                                    processing ||
                                    overlapError ||
                                    overlapChecking ||
                                    redeemQuoteLoading ||
                                    !!redeemQuoteError
                                }
                                className="w-full bg-[#f59e0b] hover:bg-[#d97706] text-white h-12 text-lg mt-6"
                            >
                                {processing ? (
                                    <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                    Processing...
                  </span>
                                ) : overlapChecking ? (
                                    <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                    Checking availability...
                  </span>
                                ) : overlapError ? (
                                    'Dates unavailable'
                                ) : redeemQuoteLoading ? (
                                    <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                    Calculating rewards discount...
                  </span>
                                ) : (
                                    `Confirm and Pay ${priceSymbol}${discountedTotal.toFixed(2)}`
                                )}
                            </Button>
                        </Card>
                    </div>

                    <div className="lg:col-span-1">
                        <Card className="p-6 sticky top-28">
                            <h2 className="text-xl font-bold text-[#1f2937] mb-4">Booking Summary</h2>

                            <div className="mb-6">
                                {hotelImage && (
                                    <img
                                        src={hotelImage}
                                        alt={hotelName}
                                        className="w-full h-48 object-cover rounded-lg mb-4"
                                    />
                                )}
                                <h3 className="font-bold text-[#1f2937] mb-1">{hotelName}</h3>
                                {hotelLocation && <p className="text-sm text-[#717182]">{hotelLocation}</p>}
                                {prebookData.roomTypes?.[0]?.rates?.[0]?.boardName && (
                                    <p className="text-sm text-[#717182] mt-1">
                                        {prebookData.roomTypes[0].rates?.[0]?.boardName}
                                    </p>
                                )}
                            </div>

                            <Separator className="my-4"/>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-2 text-[#1f2937]">
                                    <Calendar className="w-4 h-4 text-[#2563eb]"/>
                                    <span className="text-sm">
                    {checkIn && checkOut
                        ? `${checkIn} → ${checkOut}`
                        : `${nights} ${nights === 1 ? 'Night' : 'Nights'}`}
                  </span>
                                </div>

                                <div className="flex items-center gap-2 text-[#1f2937]">
                                    <Users className="w-4 h-4 text-[#2563eb]"/>
                                    <span className="text-sm">
                    {occupancyNumbers.length} {occupancyNumbers.length === 1 ? 'Room' : 'Rooms'} •{' '}
                                        {guestsParam} {guestsParam === 1 ? 'Guest' : 'Guests'}
                  </span>
                                </div>
                            </div>

                            <Separator className="my-4"/>

                            <div className="space-y-3 mb-4">
                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                                    <p className="text-sm font-semibold text-amber-900 mb-2">Redeem Points</p>
                                    <p className="text-xs text-amber-800 mb-2">
                                        Balance:{' '}
                                        {rewardsLoading ? 'Loading...' : `${pointsBalance.toLocaleString()} pts`}
                                    </p>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={maxRedeemablePoints}
                                        step={1}
                                        placeholder="Enter points to redeem"
                                        value={pointsToRedeemInput}
                                        onChange={(e) => setPointsToRedeemInput(e.target.value)}
                                        disabled={processing || rewardsLoading}
                                    />
                                    {redeemQuoteError && (
                                        <p className="text-xs text-red-600 mt-2">{redeemQuoteError}</p>
                                    )}
                                    {!redeemQuoteError && parsedPointsToRedeem > 0 && (
                                        <p className="text-xs text-amber-800 mt-2">
                                            {redeemQuoteLoading
                                                ? 'Calculating discount...'
                                                : `${parsedPointsToRedeem.toLocaleString()} pts = ${priceSymbol}${redeemDiscount.toFixed(2)} off`}
                                        </p>
                                    )}
                                    {!redeemQuoteError && (
                                        <p className="text-xs text-amber-800 mt-2">
                                            Max redeemable for this total: {maxRedeemablePoints.toLocaleString()} pts
                                        </p>
                                    )}
                                </div>

                                <div className="flex justify-between text-[#1f2937]">
                                    <span className="text-sm">Rate total</span>
                                    <span className="text-sm">
                    {priceSymbol}
                                        {basePrice}
                  </span>
                                </div>

                                <div className="flex justify-between text-[#1f2937]">
                                    <span className="text-sm">Service fee</span>
                                    <span className="text-sm">
                    {priceSymbol}
                                        {serviceFee}
                  </span>
                                </div>

                                {redeemDiscount > 0 && (
                                    <div className="flex justify-between text-green-700">
                                        <span className="text-sm">Points discount</span>
                                        <span className="text-sm">
                      -{priceSymbol}
                                            {redeemDiscount.toFixed(2)}
                    </span>
                                    </div>
                                )}

                                <Separator/>

                                <div className="flex justify-between text-[#1f2937]">
                                    <span>Points you'll earn</span>
                                    <span>+{dollarsToPoints(discountedTotal)} pts</span>
                                </div>

                                <div className="flex justify-between font-bold text-lg text-[#1f2937]">
                                    <span>Total</span>
                                    <span>
                    {priceSymbol}
                                        {discountedTotal.toFixed(2)}
                  </span>
                                </div>
                            </div>

                            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                <p className="text-xs text-[#717182] leading-relaxed">{cancellationText}</p>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}