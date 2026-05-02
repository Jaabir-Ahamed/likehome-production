import {useEffect, useMemo, useRef, useState} from "react";
import {Calendar, CreditCard, Download, ExternalLink, Mail, MapPin, PencilIcon, User, X} from "lucide-react";
import {Link, useNavigate, useSearchParams} from "react-router";
import {toast} from "sonner";

import {api} from "../../api/liteApi";
import {useAuth} from "../contexts/AuthContext";
import {Button} from "../components/ui/button";
import {Card} from "../components/ui/card";
import {Star} from "../components/ui/star";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {Badge} from "../components/ui/badge";
import {Separator} from "../components/ui/separator";
import {Tabs, TabsContent, TabsList, TabsTrigger,} from "../components/ui/tabs";
import {useCurrency} from "../contexts/CurrencyContext";
import {useRewards} from "../contexts/RewardsContext";

interface CancelPolicyInfo {
    cancelTime: string;
    amount: number;
    currency: string;
    type: string;
    timezone: string;
}

interface BookingDetail {
    bookingId: string;
    hotelId?: string;
    status: string;
    hotelName?: string;
    checkin: string;
    checkout: string;
    holder?: {
        firstName: string;
        lastName: string;
        email: string;
    };
    totalAmount?: number;
    currency?: string;
    clientReference?: string;
    roomTypeName?: string;
    cancellationPolicies?: {
        cancelPolicyInfos?: CancelPolicyInfo[];
        refundableTag?: "RFN" | "NRFN";
    };
}

interface HotelSummary {
    photo?: string;
    rating?: number;
    address?: string;
    city?: string;
}

type BookingStatus = BookingDetail["status"];

const MAX_BOOKINGS = 20;
const CANCELLED_STATUSES: BookingStatus[] = [
    "CANCELLED",
    "CANCELLED_WITH_CHARGES",
    "cancelled",
];

function isCancelledBooking(booking: BookingDetail) {
    return CANCELLED_STATUSES.includes(booking.status);
}

function formatBookingDate(date: string) {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function formatPolicyDate(date: string) {
    return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
    });
}

function getStatusBadgeClass(status: BookingStatus) {
    switch (status) {
        case "CONFIRMED":
            return "bg-[#10b981] hover:bg-[#059669]";
        case "CANCELLED":
        case "CANCELLED_WITH_CHARGES":
            return "bg-[#ef4444] hover:bg-[#dc2626]";
        default:
            return "bg-[#6b7280] hover:bg-[#4b5563]";
    }
}

function getRefundableBadgeClass(refundableTag?: "RFN" | "NRFN") {
    if (refundableTag === "RFN") {
        return "bg-[#10b981] hover:bg-[#059669]";
    }

    return "bg-[#ef4444] hover:bg-[#dc2626]";
}

function mapBookingResponse(raw: any): BookingDetail | null {
    console.log('[mapBookingResponse] raw:', JSON.stringify(raw));
    if (!raw?.bookingId) return null;

    return {
        bookingId: raw.bookingId,
        hotelId: raw.hotelId ?? raw.hotel?.id,
        status: raw.status,
        hotelName: raw.hotel?.name ?? raw.hotelName,
        checkin: raw.checkin,
        checkout: raw.checkout,
        holder: raw.holder
            ? {
                firstName: raw.holder.firstName,
                lastName: raw.holder.lastName,
                email: raw.holder.email,
            }
            : undefined,
        totalAmount: raw.sellingPriceToUser ?? raw.price ?? raw.totalAmount,
        currency: raw.currency,
        clientReference: raw.clientReference,
        roomTypeName: raw.bookedRooms?.[0]?.roomType?.name ?? raw.roomTypeName,
        cancellationPolicies: raw.cancellationPolicies,
    };
}

function BookingCardSkeleton() {
    return (
        <Card className="overflow-hidden border-gray-200">
            <div className="flex flex-col md:flex-row animate-pulse">
                <div className="md:w-4 bg-gray-200"/>
                <div className="flex-1 p-6">
                    <div className="mb-4 flex flex-col justify-between md:flex-row">
                        <div className="space-y-2">
                            <div className="h-5 w-48 rounded bg-gray-200"/>
                            <div className="h-4 w-32 rounded bg-gray-200"/>
                        </div>
                        <div className="space-y-2 text-right">
                            <div className="h-5 w-20 rounded bg-gray-200"/>
                            <div className="h-4 w-10 rounded bg-gray-200"/>
                        </div>
                    </div>
                    <Separator className="my-4"/>
                    <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="flex items-center gap-3">
                            <div className="h-5 w-5 rounded bg-gray-200"/>
                            <div className="space-y-1">
                                <div className="h-3 w-14 rounded bg-gray-200"/>
                                <div className="h-4 w-28 rounded bg-gray-200"/>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-5 w-5 rounded bg-gray-200"/>
                            <div className="space-y-1">
                                <div className="h-3 w-14 rounded bg-gray-200"/>
                                <div className="h-4 w-28 rounded bg-gray-200"/>
                            </div>
                        </div>
                    </div>
                    <Separator className="my-4"/>
                    <div className="flex items-center justify-between">
                        <div className="h-4 w-40 rounded bg-gray-200"/>
                        <div className="flex gap-3">
                            <div className="h-8 w-36 rounded bg-gray-200"/>
                            <div className="h-8 w-32 rounded bg-gray-200"/>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}

interface BookingCardProps {
    booking: BookingDetail;
    canCancel: boolean;
    onAmend: (booking: BookingDetail) => void;
    onCancel: (booking: BookingDetail) => void;
    onDownloadReceipt: (bookingId: string) => void;
    convertPrice: (amount: number) => number;
    hotelId?: string;
    hotelSummary?: HotelSummary;
    isHighlighted?: boolean;
}

type RewardAdjustmentRecord = {
    earnedPoints: number;
    redeemedPoints: number;
};

const REWARD_ADJUSTMENTS_STORAGE_KEY = "reward:bookingAdjustments";

function getBookingRewardAdjustment(bookingId: string): RewardAdjustmentRecord | null {
    try {
        const raw = localStorage.getItem(REWARD_ADJUSTMENTS_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Record<string, RewardAdjustmentRecord>;
        const entry = parsed[bookingId];
        if (!entry) return null;
        return {
            earnedPoints: Math.max(0, Math.floor(Number(entry.earnedPoints) || 0)),
            redeemedPoints: Math.max(0, Math.floor(Number(entry.redeemedPoints) || 0)),
        };
    } catch {
        return null;
    }
}

function removeBookingRewardAdjustment(bookingId: string) {
    try {
        const raw = localStorage.getItem(REWARD_ADJUSTMENTS_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as Record<string, RewardAdjustmentRecord>;
        delete parsed[bookingId];
        localStorage.setItem(REWARD_ADJUSTMENTS_STORAGE_KEY, JSON.stringify(parsed));
    } catch {
        // Ignore localStorage errors; cancellation still succeeds.
    }
}

function BookingCard({
                         booking,
                         canCancel,
                         onCancel,
                         onAmend,
                         onDownloadReceipt,
                         convertPrice,
                         hotelId,
                         hotelSummary,
                         isHighlighted,
                     }: BookingCardProps) {
    const { getCurrencySymbol } = useCurrency();
    const holderName = booking.holder
        ? `${booking.holder.firstName} ${booking.holder.lastName}`.trim()
        : null;
    const holderEmail = booking.holder?.email ?? null;

    return (
        <Card
            className={`overflow-hidden border-gray-200 transition-all hover:shadow-lg ${
                isHighlighted ? "ring-2 ring-blue-500 ring-offset-2" : ""
            }`}
        >
            <div className="flex flex-col md:flex-row">
                {hotelSummary?.photo ? (
                    <img
                        src={hotelSummary.photo}
                        alt={booking.hotelName ?? "Hotel"}
                        className="md:w-48 h-48 md:h-auto object-cover shrink-0"
                    />
                ) : (
                    <div className="md:w-4 bg-[#1d2d44] shrink-0"/>
                )}

                <div className="flex-1 p-6">
                    <div className="mb-4 flex flex-col justify-between md:flex-row">
                        <div>
                            <div className="mb-1 flex items-center gap-2">
                                <h3 className="font-bold text-bold-text">
                                    {booking.hotelName ?? "Hotel Booking"}
                                </h3>

                                <Badge className={getStatusBadgeClass(booking.status)}>
                                    {booking.status}
                                </Badge>

                                {hotelSummary?.rating != null && hotelSummary.rating > 0 && (
                                    <span
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-[#2563eb] px-2 py-0.5 rounded">
                                        <Star className="h-3 w-3 fill-white"/>
                                        {hotelSummary.rating}
                                    </span>
                                )}
                            </div>

                            {hotelSummary?.address ? (
                                <div className="mb-1 flex items-center gap-1.5 text-sm text-[#6b7280]">
                                    <MapPin className="h-3.5 w-3.5 shrink-0"/>
                                    <span>
                                        {hotelSummary.address} {hotelSummary.city ? `, ${hotelSummary.city}` : ""}
                                    </span>
                                </div>
                            ) : booking.roomTypeName ? (
                                <div className="mb-1 flex items-center gap-2 text-[#6b7280]">
                                    <MapPin className="h-4 w-4"/>
                                    <span>{booking.roomTypeName}</span>
                                </div>
                            ) : null}

                            {hotelSummary?.address && booking.roomTypeName && (
                                <p className="text-xs text-[#6b7280] ml-5">
                                    {booking.roomTypeName}
                                </p>
                            )}
                        </div>

                        <div className="text-right shrink-0">
                            {booking.totalAmount != null && (
                                <>
                                    <div className="mb-1 font-bold text-bold-text">
                                        {getCurrencySymbol()}{convertPrice(booking.totalAmount).toFixed(2)}
                                    </div>
                                    <div className="text-sm text-[#6b7280]">Total</div>
                                </>
                            )}
                        </div>
                    </div>

                    <Separator className="my-4"/>

                    <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-[#6b7280]"/>
                            <div>
                                <div className="text-sm text-[#6b7280]">Check-In</div>
                                <div className="font-medium text-bold-text">
                                    {formatBookingDate(booking.checkin)}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-[#6b7280]"/>
                            <div>
                                <div className="text-sm text-[#6b7280]">Check-Out</div>
                                <div className="font-medium text-bold-text">
                                    {formatBookingDate(booking.checkout)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator className="my-4"/>

                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-[#6b7280]">
                                <CreditCard className="h-4 w-4"/>
                                <span>
                                    Booking ID:{" "}
                                    <span className="font-medium text-bold-text">
                                        {booking.bookingId}
                                    </span>
                                </span>
                            </div>

                            {holderName && (
                                <div className="flex items-center gap-2 text-sm text-[#6b7280]">
                                    <User className="h-4 w-4 shrink-0"/>
                                    <span>
                                        Registered Name:{" "}
                                        <span className="font-medium text-bold-text">
                                            {holderName}
                                        </span>
                                    </span>
                                </div>
                            )}

                            {holderEmail && (
                                <div className="flex items-center gap-2 text-sm text-[#6b7280]">
                                    <Mail className="h-4 w-4 shrink-0"/>
                                    <span>
                                        Registered Email:{" "}
                                        <span className="font-medium text-bold-text">
                                            {holderEmail}
                                        </span>
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {booking.hotelId && (
                                <Button variant="outline" size="sm" asChild>
                                    <Link to={`/hotel/${booking.hotelId}`}>
                                        <ExternalLink className="mr-2 h-4 w-4 cursor-pointer"/>
                                        View Hotel
                                    </Link>
                                </Button>
                            )}

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onDownloadReceipt(booking.bookingId)}
                                className="cursor-pointer"
                            >
                                <Download className="mr-2 h-4 w-4"/>
                                Download Receipt
                            </Button>

                            {canCancel && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onAmend(booking)}
                                    className="cursor-pointer"
                                >
                                    <PencilIcon className="mr-2 h-4 w-4"/>
                                    Edit Booking
                                </Button>
                            )}

                            {canCancel && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => onCancel(booking)}
                                    className="cursor-pointer :hover:-bg-red-80 :dark:hover:bg-red-50"
                                >
                                    <X className="mr-2 h-4 w-4"/>
                                    Cancel Booking
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}

export function MyBookingsPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const {convertPrice, getCurrencySymbol} = useCurrency();
    const {user, loading: authLoading} = useAuth();
    const {addPoints, dollarsToPoints, redeemPoints, refreshPoints} = useRewards();

    const [activeTab, setActiveTab] = useState("scheduled");
    const [bookings, setBookings] = useState<BookingDetail[]>([]);
    const [loadingBookings, setLoadingBookings] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [pendingCount, setPendingCount] = useState(0);
    const [amendTarget, setAmendTarget] = useState<BookingDetail | null>(null);
    const [cancelTarget, setCancelTarget] = useState<BookingDetail | null>(null);
    const [cancelling, setCancelling] = useState(false);
    const [hotelSummaries, setHotelSummaries] = useState<Record<string, HotelSummary>>({});
    const [highlightedBookingId, setHighlightedBookingId] = useState<string | null>(null);

    const bookingRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const hasScrolledRef = useRef(false);

    const highlightBookingId = searchParams.get("highlightBookingId");
    const today = new Date().toISOString().split("T")[0];

    const highlightedCardRef = useRef<HTMLDivElement | null>(null);


    useEffect(() => {
        if (authLoading || !user) return;

        let ignore = false;

        async function loadBookings() {
            setLoadingBookings(true);
            setFetchError(null);
            setBookings([]);
            setPendingCount(0);
            setHotelSummaries({});
            hasScrolledRef.current = false;

            try {
                const listRes = await api.getListBookings();

                console.log(listRes);
                const rows = Array.isArray(listRes?.data)
                    ? listRes.data
                    : Array.isArray(listRes?.data?.data)
                        ? listRes.data.data
                        : [];

                const bookingRows = rows.slice(0, MAX_BOOKINGS);

                if (!ignore) {
                    setLoadingBookings(false);
                    setPendingCount(bookingRows.length);
                }

                for (const row of bookingRows) {
                    if (ignore) break;
                    try {
                        const res = await api.getBooking(row.booking_id);
                        const booking = mapBookingResponse(res?.data ?? res);
                        if (!ignore) {
                            setPendingCount((prev) => prev - 1);
                        }
                        if (booking) {
                            setBookings(prev => [...prev, booking]);
                            if (booking.hotelId) {
                                api.getHotelDetails(booking.hotelId).then(detail => {
                                    const d = detail?.data;
                                    if (!d || ignore) return;
                                    setHotelSummaries(prev => ({
                                        ...prev, [booking.bookingId]: {
                                            photo: d.main_photo ?? d.hotelImages?.[0]?.url,
                                            rating: d.rating,
                                            address: d.address,
                                            city: d.city,
                                        }
                                    }));
                                }).catch(() => {
                                });
                            }
                        }
                    } catch {
                        if (!ignore) setPendingCount((prev) => prev - 1);
                    }
                }
            } catch (error: any) {
                if (!ignore) {
                    setFetchError(error?.message ?? "Failed to load bookings");
                    setLoadingBookings(false);
                }
            }
        }

        loadBookings();

        return () => {
            ignore = true;
        };
    }, [authLoading, user]);

    const scheduledBookings = useMemo(
        () =>
            bookings.filter(
                (booking) => booking.checkin >= today && !isCancelledBooking(booking)
            ),
        [bookings, today]
    );

    const previousBookings = useMemo(
        () =>
            bookings.filter(
                (booking) => booking.checkin < today || isCancelledBooking(booking)
            ),
        [bookings, today]
    );

    useEffect(() => {
        if (!highlightBookingId) return;
        if (loadingBookings) return;
        if (pendingCount > 0) return;
        if (hasScrolledRef.current) return;

        const booking = bookings.find((b) => b.bookingId === highlightBookingId);
        if (!booking) return;

        const targetTab =
            booking.checkin >= today && !isCancelledBooking(booking)
                ? "scheduled"
                : "previous";

        if (activeTab !== targetTab) {
            setActiveTab(targetTab);
            return;
        }

        const el = bookingRefs.current[highlightBookingId];
        if (!el) return;

        el.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });

        setHighlightedBookingId(highlightBookingId);
        hasScrolledRef.current = true;

        const clearHighlightTimer = window.setTimeout(() => {
            setHighlightedBookingId(null);
        }, 3000);

        const clearQueryTimer = window.setTimeout(() => {
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.delete("highlightBookingId");
                return next;
            }, {replace: true});
        }, 1000);

        return () => {
            window.clearTimeout(clearHighlightTimer);
            window.clearTimeout(clearQueryTimer);
        };
    }, [
        highlightBookingId,
        loadingBookings,
        pendingCount,
        bookings,
        activeTab,
        today,
        setSearchParams,
    ]);


    // clear highlighted booking
    useEffect(() => {
        if (!highlightedBookingId) return;

        function handlePointerDown(event: MouseEvent) {
            const target = event.target as Node;
            const cardEl = highlightedCardRef.current;

            if (cardEl && !cardEl.contains(target)) {
                setHighlightedBookingId(null);
            }
        }

        document.addEventListener("mousedown", handlePointerDown);

        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
        };
    }, [highlightedBookingId]);

    async function handleCancelBooking() {
        if (!cancelTarget) return;

        setCancelling(true);

        try {
            const result = await api.cancelBooking(cancelTarget.bookingId);
            const nextStatus = result?.data?.status ?? "CANCELLED";

            setBookings((prev) =>
                prev.map((booking) =>
                    booking.bookingId === cancelTarget.bookingId
                        ? {...booking, status: nextStatus}
                        : booking
                )
            );

            const rewardAdjustment = getBookingRewardAdjustment(cancelTarget.bookingId);
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
                    removeBookingRewardAdjustment(cancelTarget.bookingId);
                    await refreshPoints();
                } else {
                    toast.error("Booking cancelled, but reward points were not fully reverted.");
                }
            } else {
                const cancelledPrice = Number(result?.data?.price ?? cancelTarget.totalAmount ?? 0);
                if (cancelledPrice > 0) {
                    const pointsToSubtract = dollarsToPoints(cancelledPrice);
                    if (pointsToSubtract > 0) {
                        const newTotal = await redeemPoints(pointsToSubtract);
                        if (newTotal === null) {
                            toast.error("Booking cancelled, but reward points were not updated.");
                        } else {
                            await refreshPoints();
                        }
                    }
                }
            }

            toast.success(
                nextStatus === "CANCELLED_WITH_CHARGES"
                    ? "Booking cancelled with charges applied."
                    : "Booking cancelled successfully."
            );
        } catch (error: any) {
            toast.error(error?.message ?? "Failed to cancel booking.");
        } finally {
            setCancelling(false);
            setCancelTarget(null);
        }
    }

    function handleDownloadReceipt(bookingId: string) {
        console.log("Downloading receipt:", bookingId);
    }

    if (loadingBookings) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background py-12">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2563eb] border-t-transparent"/>
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-white py-12">
                <Card className="p-8 text-center">
                    <p className="mb-2 text-[#ef4444]">Failed to load bookings</p>
                    <p className="text-sm text-[#6b7280]">{fetchError}</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen ">
            <div className="container mx-auto max-w-6xl px-4">
                <div className="mb-8">
                    <h1 className="mb-2 font-bold text-bold-text">My Bookings</h1>
                    <p className="text-[#6b7280]">
                        Manage your hotel reservations and view booking history
                    </p>
                </div>

                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                >
                    <TabsList className="mb-8 grid w-full max-w-md grid-cols-2 border border-gray-200 bg-card">
                        <TabsTrigger
                            value="scheduled"
                            className="data-[state=active]:bg-[#1d2d44] data-[state=active]:text-white cursor-pointer"
                        >
                            Scheduled Bookings ({scheduledBookings.length})
                        </TabsTrigger>

                        <TabsTrigger
                            value="previous"
                            className="data-[state=active]:bg-[#1d2d44] data-[state=active]:text-white cursor-pointer"
                        >
                            Previous Bookings ({previousBookings.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="scheduled" className="space-y-6">
                        {scheduledBookings.map((booking) => (
                            <div
                                key={booking.bookingId}
                                ref={(el) => {
                                    bookingRefs.current[booking.bookingId] = el;
                                    if (booking.bookingId === highlightedBookingId) {
                                        highlightedCardRef.current = el;
                                    }
                                }}
                            >
                                <BookingCard
                                    booking={booking}
                                    canCancel
                                    onCancel={setCancelTarget}
                                    onAmend={(booking) => navigate(`/editDetails?bookingId=${booking.bookingId}`)}
                                    onDownloadReceipt={handleDownloadReceipt}
                                    convertPrice={convertPrice}
                                    hotelSummary={hotelSummaries[booking.bookingId]}
                                    isHighlighted={booking.bookingId === highlightedBookingId}
                                />
                            </div>
                        ))}
                        {pendingCount > 0 && Array.from({length: pendingCount}).map((_, i) => (
                            <BookingCardSkeleton key={`skeleton-${i}`}/>
                        ))}
                        {scheduledBookings.length === 0 && pendingCount === 0 && (
                            <Card className="border-gray-200 p-12 text-center">
                                <Calendar className="mx-auto mb-4 h-16 w-16 text-[#6b7280]"/>
                                <h3 className="mb-2 font-semibold text-bold-text">
                                    No Scheduled Bookings
                                </h3>
                                <p className="mb-6 text-[#6b7280]">
                                    You don&apos;t have any upcoming reservations.
                                </p>
                                <Button className="bg-[#1d2d44] hover:bg-[#1d4ed8]">
                                    <Link to="/hotels">
                                        Browse Hotels
                                    </Link>
                                </Button>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="previous" className="space-y-6">
                        {previousBookings.map((booking) => (
                            <div
                                key={booking.bookingId}
                                ref={(el) => {
                                    bookingRefs.current[booking.bookingId] = el;
                                }}
                            >
                                <BookingCard
                                    booking={booking}
                                    canCancel={false}
                                    onAmend={() => {
                                    }}
                                    onCancel={setCancelTarget}
                                    onDownloadReceipt={handleDownloadReceipt}
                                    convertPrice={convertPrice}
                                    hotelSummary={hotelSummaries[booking.bookingId]}
                                    isHighlighted={booking.bookingId === highlightedBookingId}
                                />
                            </div>
                        ))}
                        {previousBookings.length === 0 && pendingCount === 0 && (
                            <Card className="border-gray-200 p-12 text-center">
                                <Calendar className="mx-auto mb-4 h-16 w-16 text-[#6b7280]"/>
                                <h3 className="mb-2 font-semibold text-bold-text">
                                    No Previous Bookings
                                </h3>
                                <p className="text-[#6b7280]">
                                    Your booking history will appear here.
                                </p>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            <AlertDialog
                open={!!cancelTarget}
                onOpenChange={(open) => {
                    if (!open) setCancelTarget(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>

                        {cancelTarget?.cancellationPolicies?.refundableTag && (
                            <div className="mt-1">
                                <Badge
                                    className={getRefundableBadgeClass(
                                        cancelTarget.cancellationPolicies.refundableTag
                                    )}
                                >
                                    {cancelTarget.cancellationPolicies.refundableTag === "RFN"
                                        ? "Free cancellation available"
                                        : "Non-refundable"}
                                </Badge>
                            </div>
                        )}

                        <AlertDialogDescription>
                            Review the policy below before confirming. This action cannot be
                            undone.
                        </AlertDialogDescription>

                        {cancelTarget?.cancellationPolicies?.cancelPolicyInfos?.length ? (
                            <ul className="mt-2 space-y-1 text-sm text-[#374151]">
                                {cancelTarget.cancellationPolicies.cancelPolicyInfos.map(
                                    (policy, index) => (
                                        <li key={index} className="flex items-start gap-1">
                                            <span className="text-[#6b7280]">•</span>

                                            {policy.amount === 0 ? (
                                                <span>
                                                    Cancel before{" "}
                                                    <span className="font-medium">
                                                        {formatPolicyDate(policy.cancelTime)}
                                                    </span>{" "}
                                                    — no charge
                                                </span>
                                            ) : (
                                                <span>
                                                    Cancel after{" "}
                                                    <span className="font-medium">
                                                        {formatPolicyDate(policy.cancelTime)}
                                                    </span>{" "}
                                                    —{" "}
                                                    <span className="font-medium text-[#ef4444]">
                                                        {policy.currency} {policy.amount}
                                                    </span>{" "}
                                                    charge
                                                </span>
                                            )}
                                        </li>
                                    )
                                )}
                            </ul>
                        ) : null}
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={cancelling}>
                            Keep Booking
                        </AlertDialogCancel>

                        <AlertDialogAction
                            onClick={handleCancelBooking}
                            disabled={cancelling}
                            className="bg-[#ef4444] hover:bg-[#dc2626]"
                        >
                            {cancelling ? "Cancelling..." : "Yes, Cancel"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}