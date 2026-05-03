import {useEffect, useMemo, useState} from 'react';
import {Link, useNavigate, useSearchParams} from 'react-router';
import {Button} from '../components/ui/button';
import {Card} from '../components/ui/card';
import {Input} from '../components/ui/input';
import {Separator} from '../components/ui/separator';
import {toast} from 'sonner';
import {api} from '../../api/liteApi';
import {Calendar, CreditCard, Loader2, Lock, Users} from 'lucide-react';
import {Label} from '@radix-ui/react-label';
import {useRewards} from '../contexts/RewardsContext';
import {errorCodes} from '../../lib/errorCodes';
import {FunctionsHttpError} from '@supabase/supabase-js';
import {RoomRateCard} from '../components/RoomRateCard';
import {findBestHotelRoomMatch} from '../../lib/roomMatching';
import type {HotelDetails, Rate} from '../../types/hotel';

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

export function AmendBookingPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const bookingId = searchParams.get('bookingId');

    const [bookingData, setBookingData] = useState<any>(null);
    const [hotelDetails, setHotelDetails] = useState<HotelDetails | null>(null);

    const [roomGuestsList, setRoomGuestsList] = useState<any[][]>([]);

    const [holderFirstName, setHolderFirstName] = useState('');
    const [holderLastName, setHolderLastName] = useState('');
    const [holderEmail, setHolderEmail] = useState('');
    const [holderPhone, setHolderPhone] = useState({countryCode: '+1', number: ''});
    const [remarks, setRemarks] = useState('');

    const [editCheckin, setEditCheckin] = useState('');
    const [editCheckout, setEditCheckout] = useState('');
    const [isDateChanged, setIsDateChanged] = useState(false);

    const [ratesByOccupancy, setRatesByOccupancy] = useState<Record<number, Rate[]>>({});
    const [selectedRates, setSelectedRates] = useState<Record<number, Rate>>({});

    const [cardData, setCardData] = useState({
        cardNumber: '',
        cardName: '',
        expiryDate: '',
        cvv: '',
    });

    const [processing, setProcessing] = useState(false);
    const [loadingRates, setLoadingRates] = useState(false);

    const [occupancyNumber, setOccupancyNumber] = useState(0);
    const [prebookResult, setPrebookResult] = useState<any>(null);

    const [showMore, setShowMore] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingCheck, setPendingCheck] = useState(false);

    const [diffamount, setDiffAmount] = useState('');
    const [paymentAction, setPaymentAction] = useState('');

    const [cancellationFee, setCancellationFee] = useState(0);

    const {addPoints, dollarsToPoints, redeemPoints, refreshPoints} = useRewards();

    useEffect(() => {
        const fetchBooking = async () => {
            if (!bookingId) return;

            try {
                const res = await api.getBooking(bookingId);
                const data = res.data;
                setBookingData(data);

                setRoomGuestsList(
                    (data.bookedRooms ?? []).map((room: any) => [
                        {
                            firstName: room?.firstName ?? data?.holder?.firstName ?? '',
                            lastName: room?.lastName ?? data?.holder?.lastName ?? '',
                            email: room?.email ?? data?.holder?.email ?? '',
                            remarks: room?.remarks ?? data?.specialRemarks ?? '',
                        },
                    ])
                );

                setHolderFirstName(data?.holder?.firstName ?? '');
                setHolderLastName(data?.holder?.lastName ?? '');
                setHolderEmail(data?.holder?.email ?? '');
                setHolderPhone(data?.holder?.phone ?? {countryCode: '+1', number: ''});
                setRemarks(data?.bookedRooms?.[0]?.remarks ?? '');

                setEditCheckin(data?.checkin ?? '');
                setEditCheckout(data?.checkout ?? '');
            } catch {
                toast.error('Failed to load booking');
            }
        };

        fetchBooking();
    }, [bookingId]);

    useEffect(() => {
        const fetchHotelDetails = async () => {
            const hotelId = bookingData?.hotel?.hotelId;
            if (!hotelId) return;

            try {
                const res = await api.getHotelDetails(hotelId);
                setHotelDetails(res?.data ?? null);
            } catch {
                console.error('Failed to load hotel details for amend flow');
            }
        };

        fetchHotelDetails();
    }, [bookingData?.hotel?.hotelId]);

    const actualNights = useMemo(() => {
        if (!editCheckin || !editCheckout) return 1;
        return Math.max(
            1,
            Math.round(
                (new Date(editCheckout).getTime() - new Date(editCheckin).getTime()) / 86400000
            )
        );
    }, [editCheckin, editCheckout]);

    const fallbackRoomImage =
        hotelDetails?.main_photo ||
        hotelDetails?.hotelImages?.[0]?.urlHd ||
        hotelDetails?.hotelImages?.[0]?.url ||
        null;

    const handleDateBlur = () => {
        if (!bookingData) return;

        const changed =
            editCheckin !== bookingData.checkin || editCheckout !== bookingData.checkout;

        setIsDateChanged(changed);

        if (changed) {
            handlePrebook();
        }
    };

    const updateRoomGuest = (roomIdx: number, guestIdx: number, field: string, value: string) => {
        setRoomGuestsList((prev) =>
            prev.map((room, ri) =>
                ri === roomIdx
                    ? room.map((g, gi) => (gi === guestIdx ? {...g, [field]: value} : g))
                    : room
            )
        );
    };

    const handlePrebook = async () => {
        try {
            setLoadingRates(true);

            setPrebookResult(null);
            setRatesByOccupancy({});
            setSelectedRates({});

            const occupancies = (bookingData?.bookedRooms ?? []).map((room: any) => ({
                adults: room.adults,
                childrenAges: [],
            }));

            const result = await api.getAlternativePrebooks(bookingId || '', {
                checkin: editCheckin,
                checkout: editCheckout,
                occupancies,
            });

            setPrebookResult(result);

            const hotelResults = result?.data?.filter(
                (h: any) => h.hotelId === bookingData?.hotel?.hotelId
            );

            if (!hotelResults?.length) {
                toast.error('No available rates for this hotel');
                return;
            }

            const flattened: Rate[] = (hotelResults ?? []).flatMap((hotel: any) =>
                (hotel.roomTypes ?? []).flatMap((rt: any) =>
                    (rt.rates ?? []).map((r: any) => ({
                        ...r,
                        offerId: rt.offerId,
                        roomTypeId: rt.roomTypeId,
                        mappedRoomId: r.mappedRoomId ?? rt.mappedRoomId,
                        prebookId: hotel.prebookId,
                    }))
                )
            );

            const grouped = flattened.reduce((acc: Record<number, Rate[]>, rate: Rate) => {
                const key = rate.occupancyNumber;
                if (!acc[key]) acc[key] = [];
                acc[key].push(rate);
                return acc;
            }, {});

            setRatesByOccupancy(grouped);
        } catch (err) {
            console.error(err);

            if (err instanceof FunctionsHttpError) {
                const data = await err.context.json();

                if (data?.error === errorCodes.NO_AVAILABILITY_FOUND) {
                    toast.error(data?.message || 'No availability found.');
                } else {
                    toast.error(data?.message || 'Could not load rates');
                }
            } else {
                toast.error('Could not load rates');
            }
        } finally {
            setLoadingRates(false);
        }
    };

    const handleSelectRate = (occ: number, rate: Rate) => {
        setSelectedRates((prev) => ({...prev, [occ]: rate}));
        setOccupancyNumber(occ);
    };

    const handleRebook = async () => {
        try {
            setProcessing(true);

            if (showMore) {
                const rates = Object.values(selectedRates);

                if (rates.length === 0) {
                    throw new Error('No rates selected');
                }

                const firstSelectedRate = rates[0] as any;
                const prebookId = firstSelectedRate.prebookId;

                const guests = Object.entries(selectedRates).map(([occ], index) => {
                    const roomIdx = index;

                    const guest = roomGuestsList[roomIdx]?.[0] || {
                        firstName: holderFirstName,
                        lastName: holderLastName,
                        email: holderEmail,
                        remarks,
                    };

                    return {
                        occupancyNumber: Number(occ),
                        firstName: guest.firstName || holderFirstName,
                        lastName: guest.lastName || holderLastName,
                        email: guest.email || holderEmail,
                        remarks: guest.remarks || remarks,
                    };
                });

                await api.getRatesBook({
                    prebookId,
                    checkin: editCheckin,
                    checkout: editCheckout,
                    holder: {
                        firstName: holderFirstName,
                        lastName: holderLastName,
                        email: holderEmail,
                        phone: `${holderPhone.countryCode}${holderPhone.number}`,
                    },
                    guests,
                    payment: {method: 'CREDIT'},
                    existingBookingId: bookingId || undefined,
                });
            } else {
                await api.amendBooking(bookingId || '', {
                    firstName: holderFirstName,
                    lastName: holderLastName,
                    email: holderEmail,
                    remarks,
                });
            }

            await handlePoints();

            toast.success('Booking updated');
            navigate('/bookings');
        } catch (err) {
            console.error(err);

            if (err instanceof FunctionsHttpError) {
                const data = await err.context.json();

                if (data?.error === errorCodes.USER_OVERLAPPING_BOOKING) {
                    const conflictingBookingId = data?.conflictingBookingId;

                    if (conflictingBookingId) {
                        toast(
                            <div>
                                <div>{data.message || 'You already have an overlapping booking.'}</div>
                                <Link
                                    className="text-blue-800 flex items-center gap-2 hover:opacity-80 transition-opacity"
                                    to={`/bookings?highlightBookingId=${conflictingBookingId}`}
                                >
                                    View conflicting booking
                                </Link>
                            </div>
                        );
                    } else {
                        toast.error(
                            data?.message || 'You already have an overlapping booking on these days.'
                        );
                    }
                } else {
                    toast.error(data?.message || 'Failed to update booking');
                }
            } else if (err instanceof Error) {
                toast.error(err.message);
            } else {
                toast.error('Failed to update booking, contact admin');
            }
        } finally {
            setProcessing(false);
        }
    };

    const selectedTotal = Object.values(selectedRates).reduce((sum: number, r: any) => {
        return sum + (r?.retailRate?.total?.[0]?.amount ?? 0);
    }, 0);

    const handlePoints = async () => {
        const rewardAdjustment = getBookingRewardAdjustment(bookingData.bookingId);

        if (rewardAdjustment) {
            const {earnedPoints, redeemedPoints} = rewardAdjustment;
            let rewardOpsOk = true;

            if (earnedPoints > 0) {
                const newTotalAfterRedeem = await redeemPoints(earnedPoints);
                if (newTotalAfterRedeem === null) rewardOpsOk = false;
            }

            if (redeemedPoints > 0) {
                const newTotalAfterAdd = await addPoints(redeemedPoints);
                if (newTotalAfterAdd === null) rewardOpsOk = false;
            }

            if (rewardOpsOk) {
                removeBookingRewardAdjustment(bookingData.bookingId);
                await refreshPoints();
            }
        } else {
            const cancelledPrice = Number(bookingData.totalAmount ?? 0);

            if (cancelledPrice > 0) {
                const pointsToSubtract = dollarsToPoints(cancelledPrice);
                if (pointsToSubtract > 0) {
                    const newTotal = await redeemPoints(pointsToSubtract);
                    if (newTotal === null) {
                        toast.error('Booking updated, but reward points were not updated.');
                    } else {
                        await refreshPoints();
                    }
                }
            }
        }

        const pointsEarned = dollarsToPoints(selectedTotal);
        const newPointsTotal = await addPoints(pointsEarned);
        if (newPointsTotal === null) {
            toast.error('Failed to add reward points.');
        }
    };

    type RewardAdjustmentRecord = {
        earnedPoints: number;
        redeemedPoints: number;
    };

    const REWARD_ADJUSTMENTS_STORAGE_KEY = 'reward:bookingAdjustments';

    function getBookingRewardAdjustment(bookingIdValue: string): RewardAdjustmentRecord | null {
        try {
            const raw = localStorage.getItem(REWARD_ADJUSTMENTS_STORAGE_KEY);
            if (!raw) return null;

            const parsed = JSON.parse(raw) as Record<string, RewardAdjustmentRecord>;
            const entry = parsed[bookingIdValue];
            if (!entry) return null;

            return {
                earnedPoints: Math.max(0, Math.floor(Number(entry.earnedPoints) || 0)),
                redeemedPoints: Math.max(0, Math.floor(Number(entry.redeemedPoints) || 0)),
            };
        } catch {
            return null;
        }
    }

    function removeBookingRewardAdjustment(bookingIdValue: string) {
        try {
            const raw = localStorage.getItem(REWARD_ADJUSTMENTS_STORAGE_KEY);
            if (!raw) return;

            const parsed = JSON.parse(raw) as Record<string, RewardAdjustmentRecord>;
            delete parsed[bookingIdValue];
            localStorage.setItem(REWARD_ADJUSTMENTS_STORAGE_KEY, JSON.stringify(parsed));
        } catch {
            // ignore localStorage errors
        }
    }

    useEffect(() => {
        const diff = selectedTotal + cancellationFee - (bookingData?.price ?? 0);
        setPaymentAction(diff < 0 ? 'Refund' : 'Pay');
        setDiffAmount(Math.abs(diff).toFixed(2));
    }, [selectedTotal, cancellationFee, bookingData?.price]);

    const handleCheckboxChange = (checked: boolean) => {
        if (checked) {
            setPendingCheck(true);
            setShowConfirmModal(true);
            handlePrebook();
            checkCancelPolicy();
        } else {
            setShowMore(false);
            setPendingCheck(false);
        }
    };

    const confirmContinue = () => {
        setShowMore(true);
        setShowConfirmModal(false);
    };

    const cancelContinue = () => {
        setPendingCheck(false);
        setShowConfirmModal(false);
    };

    const checkCancelPolicy = () => {
        if (!bookingData?.bookedRooms?.length) return;

        let totalFee = 0;
        let hasNonRefundable = false;
        let latestDeadline: Date | null = null;

        bookingData.bookedRooms.forEach((room: any) => {
            const policies = room?.rate?.cancellationPolicies;
            const retailAmount =
                room?.rate?.retailRate?.total?.amount ||
                room?.rate?.retailRate?.total?.[0]?.amount ||
                0;

            const policyInfo = policies?.cancelPolicyInfos?.[0];

            if (policies?.refundableTag === 'NRFN') {
                hasNonRefundable = true;
                totalFee += retailAmount;
                return;
            }

            if (policyInfo?.cancelTime) {
                const now = new Date();
                const deadline = new Date(policyInfo.cancelTime);

                if (!latestDeadline || deadline < latestDeadline) {
                    latestDeadline = deadline;
                }

                if (now > deadline) {
                    totalFee += policyInfo.amount || retailAmount;
                }
            }
        });

        setCancellationFee(totalFee);

        console.log({
            totalFee,
            hasNonRefundable,
            latestDeadline,
        });
    };

    if (!bookingData) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#2563eb]"/>
                <span className="ml-3 text-[#717182]">Searching for your Booking…</span>
            </div>
        );
    }

    return (
        <div className="w-full bg-background min-h-screen">
            <div className="container mx-auto px-4 lg:px-8 py-8">
                <h1 className="text-3xl font-bold mb-6 text-bold-text">Edit Booking</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="p-6">
                            <h2 className="text-xl font-bold mb-4">Who's checking in?</h2>

                            {roomGuestsList.map((room, roomIdx) => {
                                if (roomIdx === 0) {
                                    return (
                                        <div key={roomIdx} className="mb-6">
                                            {room.map((guest, guestIdx) => (
                                                <div key={guestIdx} className="mb-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                        <div>
                                                            <label
                                                                className="block text-sm font-medium text-bold-text mb-2">
                                                                First Name
                                                            </label>
                                                            <Input
                                                                value={holderFirstName}
                                                                onChange={(e) => setHolderFirstName(e.target.value)}
                                                                placeholder="First name"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label
                                                                className="block text-sm font-medium text-bold-text mb-2">
                                                                Last Name
                                                            </label>
                                                            <Input
                                                                value={holderLastName}
                                                                onChange={(e) => setHolderLastName(e.target.value)}
                                                                placeholder="Last name"
                                                            />
                                                        </div>
                                                    </div>

                                                    <label className="block text-sm font-medium text-bold-text mb-2">
                                                        Email Address
                                                    </label>
                                                    <Input
                                                        value={guest.email}
                                                        onChange={(e) =>
                                                            updateRoomGuest(
                                                                roomIdx,
                                                                guestIdx,
                                                                'email',
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Email"
                                                    />
                                                </div>
                                            ))}

                                            <label className="block text-sm font-medium text-bold-text mb-2">
                                                Phone Number
                                            </label>
                                            <div className="flex gap-2 mt-3">
                                                <select
                                                    className="border rounded px-2 bg-input-background cursor-pointer"
                                                    value={holderPhone.countryCode}
                                                    onChange={(e) =>
                                                        setHolderPhone({
                                                            ...holderPhone,
                                                            countryCode: e.target.value,
                                                        })
                                                    }
                                                >
                                                    {PHONE_CODES.map((c, i) => (
                                                        <option key={i} value={c.code}>
                                                            {c.short} {c.code}
                                                        </option>
                                                    ))}
                                                </select>
                                                <Input
                                                    placeholder="Phone number"
                                                    value={holderPhone.number}
                                                    onChange={(e) =>
                                                        setHolderPhone({
                                                            ...holderPhone,
                                                            number: e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>

                                            <div className="pt-2">
                                                <Label>Special Requests (optional)</Label>
                                                <textarea
                                                    className="w-full border rounded-md px-3 py-2 text-sm mt-1"
                                                    placeholder="e.g. early check-in, ground floor room, extra pillows"
                                                    rows={2}
                                                    value={remarks}
                                                    onChange={(e) => setRemarks(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    );
                                }

                                return null;
                            })}

                            <div className="flex items-center gap-2 mt-4">
                                <input
                                    type="checkbox"
                                    checked={showMore}
                                    onChange={(e) => handleCheckboxChange(e.target.checked)}
                                    className="cursor-pointer"
                                />
                                <label htmlFor="showMore" className="text-sm">
                                    Change dates and room selection
                                </label>
                            </div>
                        </Card>

                        {showMore && (
                            <>
                                <Card className="p-6">
                                    <h2 className="text-xl font-bold mb-4">Change Dates</h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-bold-text mb-2">
                                                Check-in
                                            </label>
                                            <Input
                                                type="date"
                                                value={editCheckin}
                                                onChange={(e) => setEditCheckin(e.target.value)}
                                                onBlur={handleDateBlur}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-bold-text mb-2">
                                                Check-out
                                            </label>
                                            <Input
                                                type="date"
                                                value={editCheckout}
                                                onChange={(e) => setEditCheckout(e.target.value)}
                                                onBlur={handleDateBlur}
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        className="mt-4 dark:bg-background"
                                        onClick={handlePrebook}
                                        disabled={loadingRates || !isDateChanged}
                                    >
                                        {loadingRates ? 'Checking...' : 'Rooms updated'}
                                    </Button>
                                </Card>

                                <Card className="p-6">
                                    <h2 className="text-xl font-bold mb-4">Select New Room</h2>

                                    {loadingRates ? (
                                        <div className="space-y-3">
                                            {[1, 2].map((i) => (
                                                <div
                                                    key={i}
                                                    className="border border-gray-200 rounded-lg p-4 animate-pulse"
                                                >
                                                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"/>
                                                    <div className="h-3 bg-gray-200 rounded w-1/4"/>
                                                </div>
                                            ))}
                                        </div>
                                    ) : Object.keys(ratesByOccupancy).length === 0 ? (
                                        <p className="text-sm text-[#717182]">
                                            No replacement rooms available for the selected dates.
                                        </p>
                                    ) : (
                                        <div className="space-y-6">
                                            {Object.entries(ratesByOccupancy).map(([occ, rates]) => (
                                                <div key={occ}>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Users className="w-4 h-4"/>
                                                        <span className="font-medium">Room {occ}</span>
                                                    </div>

                                                    <div className="space-y-4">
                                                        {(rates as Rate[]).map((rate) => {
                                                            const isSelected =
                                                                selectedRates[Number(occ)]?.rateId === rate.rateId;

                                                            const matchedRoom = findBestHotelRoomMatch(
                                                                rate,
                                                                hotelDetails?.rooms ?? []
                                                            );

                                                            return (
                                                                <div
                                                                    key={rate.rateId}
                                                                    className={`border rounded-lg p-3 transition-colors ${
                                                                        isSelected
                                                                            ? 'border-[#2563eb] bg-background'
                                                                            : 'border-gray-200'
                                                                    }`}
                                                                >
                                                                    <label
                                                                        className="flex items-start gap-3 cursor-pointer">
                                                                        <input
                                                                            type="radio"
                                                                            name={`occupancy-${occ}`}
                                                                            checked={isSelected}
                                                                            onChange={() =>
                                                                                handleSelectRate(Number(occ), rate)
                                                                            }
                                                                            className="mt-2 h-5 w-5"
                                                                        />

                                                                        <div className="flex-1">
                                                                            <RoomRateCard
                                                                                rate={rate}
                                                                                room={matchedRoom}
                                                                                actualNights={actualNights}
                                                                                isSelected={isSelected}
                                                                                onSelect={() =>
                                                                                    handleSelectRate(Number(occ), rate)
                                                                                }
                                                                                fallbackImage={fallbackRoomImage}
                                                                            />
                                                                        </div>
                                                                    </label>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Card>

                                <Card className="p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <CreditCard className="w-5 h-5 text-[#2563eb]"/>
                                        <h2 className="text-xl font-bold">Payment Details</h2>
                                        <Lock className="w-4 h-4 ml-auto text-green-600"/>
                                        <span className="text-sm text-green-600">Secure Payment</span>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-bold-text mb-2">
                                                Card Number
                                            </label>
                                            <Input
                                                placeholder="1234 5678 9012 3456"
                                                value={cardData.cardNumber}
                                                onChange={(e) =>
                                                    setCardData({
                                                        ...cardData,
                                                        cardNumber: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-bold-text mb-2">
                                                Cardholder Name
                                            </label>
                                            <Input
                                                placeholder="Name on card"
                                                value={cardData.cardName}
                                                onChange={(e) =>
                                                    setCardData({
                                                        ...cardData,
                                                        cardName: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-bold-text mb-2">
                                                    Expiry Date
                                                </label>
                                                <Input
                                                    placeholder="MM/YY"
                                                    value={cardData.expiryDate}
                                                    onChange={(e) =>
                                                        setCardData({
                                                            ...cardData,
                                                            expiryDate: e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-bold-text mb-2">
                                                    CVV
                                                </label>
                                                <Input
                                                    placeholder="123"
                                                    value={cardData.cvv}
                                                    onChange={(e) =>
                                                        setCardData({
                                                            ...cardData,
                                                            cvv: e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </>
                        )}
                    </div>

                    <div>
                        <Card className="p-6 sticky top-28">
                            <h2 className="text-xl font-bold mb-4">Summary</h2>

                            <div className="space-y-3 mb-4">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4"/>
                                    <span>
                                        {editCheckin} → {editCheckout}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4"/>
                                    <span>{bookingData.bookedRooms?.length ?? 1} rooms</span>
                                </div>
                            </div>

                            <Separator/>

                            {showMore && (
                                <div className="space-y-2 mt-4">
                                    <div className="flex justify-between">
                                        <span>Current</span>
                                        <span>
                                            -$
                                            {bookingData.sellingPriceToUser ?? bookingData.price}
                                        </span>
                                    </div>

                                    {cancellationFee > 0 && (
                                        <div className="flex justify-between text-red-600">
                                            <span>Cancellation Fee</span>
                                            <span>${cancellationFee}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between">
                                        <span>New</span>
                                        <span>${selectedTotal.toFixed(2)}</span>
                                    </div>
                                </div>
                            )}

                            <Button
                                className="w-full mt-6 dark:bg-background hover:bg-[#1e40af] dark:hover:bg-[#1e40af] cursor-pointer"
                                onClick={handleRebook}
                                disabled={
                                    processing ||
                                    (showMore &&
                                        Object.keys(selectedRates).length !==
                                        (bookingData.bookedRooms?.length ?? 0))
                                }
                            >
                                {processing
                                    ? 'Updating...'
                                    : showMore
                                        ? `${paymentAction} $${diffamount === 'NaN' ? '0.00' : diffamount}`
                                        : 'Confirm Changes'}
                            </Button>
                        </Card>
                    </div>

                    {showConfirmModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <Card className="p-6 w-full max-w-md">
                                <h2 className="text-lg font-bold mb-2">IMPORTANT</h2>
                                <p className="text-sm mb-4">
                                    Changing the dates and rooms will cancel the original booking and
                                    rebook with the new inputs. This will incur charges or refunds
                                    based on the price differences, as well as the cancellation policy.
                                    Your reward points will also be adjusted accordingly.
                                </p>

                                {(bookingData.tag === 'NRFN' || cancellationFee > 0) && (
                                    <div
                                        className="mt-4 p-4 rounded-lg border bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-800">
                                        <h3 className="font-semibold text-sm mb-2 text-red-600 dark:text-red-300">
                                            Cancellation Policy Alerts:
                                        </h3>

                                        {bookingData.tag === 'NRFN' ? (
                                            <p className="text-sm text-red-600 dark:text-red-400">
                                                This booking is non-refundable. You will have to pay
                                                the full price to make changes to the booking.
                                            </p>
                                        ) : (
                                            <p className="text-xs mt-2 text-red-600 dark:text-red-400">
                                                The booking has passed the free cancellation deadline of{' '}
                                                {bookingData.bookedRooms?.[0]?.rate?.cancellationPolicies
                                                    ?.cancelPolicyInfos?.[0]?.cancelTime ?? 'N/A'}{' '}
                                                and a fee of ${cancellationFee} will be applied.
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="flex justify-end gap-2 mt-4">
                                    <Button
                                        variant="outline"
                                        onClick={cancelContinue}
                                        className="cursor-pointer dark:bg-grey"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={confirmContinue}
                                        className="cursor-pointer bg-[#2563eb] hover:bg-[#1e40af]"
                                    >
                                        I understand
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}