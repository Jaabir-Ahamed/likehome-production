import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router';
import { CreditCard, Lock, ArrowLeft, Check, Calendar, Users, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { useCurrency } from '../contexts/CurrencyContext';
import { useRewards } from '../contexts/RewardsContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { api } from '../../api/liteApi';

// Mock hotel data (fallback for demo/mock navigation without a real prebook)
const mockHotels = [
  { id: 1, name: 'The Grand Palace Hotel', location: 'Paris, France', price: 320, image: 'https://images.unsplash.com/photo-1572177215152-32f247303126?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3RlbCUyMGJlZHJvb218ZW58MXx8fHwxNzcxOTA0ODUxfDA&ixlib=rb-4.1.0&q=80&w=400' },
  { id: 2, name: 'Ocean View Resort', location: 'Bali, Indonesia', price: 180, image: 'https://images.unsplash.com/photo-1729717949782-f40c4a07e3c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWFjaCUyMHJlc29ydCUyMGhvdGVsfGVufDF8fHx8MTc3MTg1Mjk5Nnww&ixlib=rb-4.1.0&q=80&w=400' },
  { id: 3, name: 'Metropolitan Suites', location: 'New York, USA', price: 280, image: 'https://images.unsplash.com/photo-1731336478850-6bce7235e320?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3RlbCUyMHN1aXRlJTIwbHV4dXJ5fGVufDF8fHx8MTc3MTgxOTE3Nnww&ixlib=rb-4.1.0&q=80&w=400' },
  { id: 4, name: 'Skyline Boutique Hotel', location: 'Tokyo, Japan', price: 240, image: 'https://images.unsplash.com/photo-1664908790579-34b71154f603?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib3V0aXF1ZSUyMGhvdGVsJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzcxODA2NDA3fDA&ixlib=rb-4.1.0&q=80&w=400' },
  { id: 5, name: 'City Lights Premium', location: 'Dubai, UAE', price: 350, image: 'https://images.unsplash.com/photo-1661191891844-2e7980ae1c94?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwaG90ZWwlMjByb290dG9wfGVufDF8fHx8MTc3MTkwNDg1Mnww&ixlib=rb-4.1.0&q=80&w=400' },
  { id: 6, name: 'Royal Plaza Hotel', location: 'London, UK', price: 290, image: 'https://images.unsplash.com/photo-1759462692354-404b2c995c99?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3RlbCUyMGxvYmJ5JTIwZWxlZ2FudHxlbnwxfHx8fDE3NzE4ODEyNzZ8MA&ixlib=rb-4.1.0&q=80&w=400' },
  { id: 7, name: 'Coastal Paradise Hotel', location: 'Miami, USA', price: 220, image: 'https://images.unsplash.com/photo-1738407282253-979e31f45785?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBob3RlbCUyMHBvb2x8ZW58MXx8fHwxNzcxODc1NjAzfDA&ixlib=rb-4.1.0&q=80&w=400' },
  { id: 8, name: 'Alpine Luxury Lodge', location: 'Zurich, Switzerland', price: 390, image: 'https://images.unsplash.com/photo-1572177215152-32f247303126?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3RlbCUyMGJlZHJvb218ZW58MXx8fHwxNzcxOTA0ODUxfDA&ixlib=rb-4.1.0&q=80&w=400' },
];

const PHONE_CODES = [
  { code: '+1',   short: 'USA',  name: 'United States' },
  { code: '+1',   short: 'CAN',  name: 'Canada' },
  { code: '+44',  short: 'GBR',  name: 'United Kingdom' },
  { code: '+61',  short: 'AUS',  name: 'Australia' },
  { code: '+49',  short: 'DEU',  name: 'Germany' },
  { code: '+33',  short: 'FRA',  name: 'France' },
  { code: '+81',  short: 'JPN',  name: 'Japan' },
  { code: '+86',  short: 'CHN',  name: 'China' },
  { code: '+91',  short: 'IND',  name: 'India' },
  { code: '+55',  short: 'BRA',  name: 'Brazil' },
  { code: '+52',  short: 'MEX',  name: 'Mexico' },
  { code: '+34',  short: 'ESP',  name: 'Spain' },
  { code: '+39',  short: 'ITA',  name: 'Italy' },
  { code: '+7',   short: 'RUS',  name: 'Russia' },
  { code: '+82',  short: 'KOR',  name: 'South Korea' },
  { code: '+65',  short: 'SGP',  name: 'Singapore' },
  { code: '+971', short: 'UAE',  name: 'United Arab Emirates' },
  { code: '+966', short: 'SAU',  name: 'Saudi Arabia' },
  { code: '+31',  short: 'NLD',  name: 'Netherlands' },
  { code: '+46',  short: 'SWE',  name: 'Sweden' },
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
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const occupanciesParam = searchParams.get('occupancies');

const occupancies: { adults: number; children: number[] }[] =
  occupanciesParam
    ? JSON.parse(occupanciesParam)
    : [{ adults: 2, children: [] }];

const guestsParam = occupancies.reduce(
  (total, room) => total + room.adults + room.children.length,
  0
);
  const navigate = useNavigate();
  const { convertPrice, getCurrencySymbol } = useCurrency();
  const { addPoints, dollarsToPoints } = useRewards();
  const { user } = useAuth();

  const prebookId = searchParams.get('prebookId');
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

  // 2D: roomGuestsList[roomIndex][guestIndex] — first guest per room is required, rest are optional
  const [roomGuestsList, setRoomGuestsList] = useState<RoomGuest[][]>([[{ firstName: '', lastName: '', email: '' }]]);
  // Phone for Room 1 only (holder)
  const [holderPhone, setHolderPhone] = useState({ countryCode: '+1', number: '' });
  // Payment card fields
  const [cardData, setCardData] = useState({ cardNumber: '', cardName: '', expiryDate: '', cvv: '' });
  // Single shared special requests field
  const [remarks, setRemarks] = useState('');

  const [processing, setProcessing] = useState(false);
  const [overlapError, setOverlapError] = useState(false);

  // Autofill Room 1 guest fields from the user's saved profile
  useEffect(() => {
    if (!user) return;
    api.getProfile().then((profile) => {
      if (!profile) return;
      const fullName = profile.full_name ?? '';
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] ?? '';
      const lastName = nameParts.slice(1).join(' ');

      setRoomGuestsList(prev =>
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
        // Split stored phone into country code and number (e.g. "+1 2025551234" or "+442071234567")
        const phoneStr = profile.phone.trim();
        const match = phoneStr.match(/^(\+\d{1,3})\s*(.*)$/);
        if (match) {
          setHolderPhone(prev =>
            prev.number ? prev : { countryCode: match[1], number: match[2] }
          );
        }
      }
    }).catch(() => {
      // Profile load failure is non-critical — fields stay empty
    });
  // Run once after user is available
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Load prebook data from sessionStorage when prebookId is present
  useEffect(() => {
    if (!prebookId) return;
    const raw = sessionStorage.getItem(`prebook:${prebookId}`);
    if (raw) {
      try {
        const data: PrebookData = JSON.parse(raw);
        setPrebookData(data);
        // Init room guest slots: one required guest per room
        const nums = getOccupancyNumbers(data);
        setRoomGuestsList(prev => {
          const filled = prev[0]?.[0] ?? { firstName: '', lastName: '', email: '' };
          return nums.map((_, i) => (i === 0 ? [filled] : [{ firstName: '', lastName: '', email: '' }]));
        });
      } catch {
        // invalid JSON in sessionStorage — ignore
      }
    }
  }, [prebookId]);

  const updateRoomGuest = (roomIdx: number, guestIdx: number, field: keyof RoomGuest, value: string) => {
    setRoomGuestsList(prev =>
      prev.map((room, ri) =>
        ri === roomIdx
          ? room.map((g, gi) => gi === guestIdx ? { ...g, [field]: value } : g)
          : room
      )
    );
  };


  // --- Mock fallback (used when navigating via /payment/:id without prebook) ---
  const mockHotel = mockHotels.find(h => h.id === Number(id));

  // Determine which "mode" we're in
  const isRealPrebook = !!prebookData;

  // Price from prebook or mock
  const prebookPrice = isRealPrebook
    ? (prebookData!.price ?? prebookData!.roomTypes?.[0]?.rates?.[0]?.retailRate?.total?.[0]?.amount ?? 0)
    : 0;
  const mockPrice = mockHotel?.price ?? 0;

  const basePrice = isRealPrebook ? convertPrice(prebookPrice) : convertPrice(mockPrice * nights);
  const serviceFee = Math.round(basePrice * 0.1);
  const finalTotal = basePrice + serviceFee;
  const priceSymbol = getCurrencySymbol();

  // Validity warnings
  const warnings: string[] = [];
  if (isRealPrebook) {
    if (prebookData!.priceDifferencePercent && prebookData!.priceDifferencePercent !== 0) {
      warnings.push(`Price has changed by ${prebookData!.priceDifferencePercent}%`);
    }
    if (prebookData!.cancellationChanged) {
      warnings.push('Cancellation policy has changed since you last viewed this rate');
    }
    if (prebookData!.boardChanged) {
      warnings.push('Meal plan (board) has changed since you last viewed this rate');
    }
  }

  if (!isRealPrebook && !mockHotel) {
    return (
      <div className="w-full bg-gray-50 min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-[#1f2937] mb-4">Booking Not Found</h2>
          <p className="text-[#717182] mb-6">
            {prebookId ? 'Prebook data has expired or is missing. Please start a new search.' : 'No hotel selected.'}
          </p>
          <Button asChild>
            <Link to="/hotels">Back to Hotels</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const occupancyNumbers = getOccupancyNumbers(prebookData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    if (isRealPrebook) {
      try {
        setOverlapError(false);
        const primaryGuest = roomGuestsList[0]?.[0] ?? { firstName: '', lastName: '', email: '' };
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
            ...(remarks ? { remarks } : {}),
          };
        });

        await api.getRatesBook({
          prebookId: prebookData!.prebookId,
          checkin: prebookData!.checkin,
          checkout: prebookData!.checkout,
          holder,
          guests,
          payment: { method: 'CREDIT' },
        });
        // call api to convert dollors to points and add to user's profile on supabase (await to ensure points are added before showing success toast)
        const pointsEarned = dollarsToPoints(finalTotal);
        const newPointsTotal = await addPoints(pointsEarned);
        if (newPointsTotal === null) {
          toast.error('Failed to add reward points.');
        } else {
          toast.success(`Booking confirmed! You've earned ${pointsEarned} points${newPointsTotal !== null ? ` (total: ${newPointsTotal})` : ''}. Check your email for details.`);
        }

        sessionStorage.removeItem(`prebook:${prebookData!.prebookId}`);
        navigate('/bookings');
      } catch (err: unknown) {
        const status = (err as { context?: { status?: number } })?.context?.status;
        if (status === 409) {
          setOverlapError(true);
        } else {
          toast.error('Booking failed. Please try again.');
        }
        setProcessing(false);
      }
    } else {
      // Mock/demo mode simulation
      setTimeout(() => {
        setProcessing(false);
        toast.success('Booking confirmed! Check your email for details.');
        navigate('/bookings');
      }, 2000);
    }
  };

  // Display values
  const hotelName = isRealPrebook
    ? (prebookData!.roomTypes?.[0]?.name ?? `Hotel ${prebookData!.hotelId ?? ''}`)
    : mockHotel!.name;
  const hotelLocation = isRealPrebook ? '' : mockHotel!.location;
  const hotelImage = isRealPrebook ? null : mockHotel!.image;
  const cancellationText = isRealPrebook
    ? (prebookData!.cancellationChanged ? 'Cancellation policy has changed — review before booking.' : 'See cancellation policy details below.')
    : 'You can cancel this reservation up to 24 hours before check-in for a full refund.';
  const backHref = id ? `/hotel/${id}` : '/hotels';

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to={backHref}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Hotel Details
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: guest info + payment */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#1f2937] mb-2">
                Complete Your Booking
              </h1>
              <p className="text-lg text-[#717182]">
                You're just one step away from your perfect stay
              </p>
            </div>

            {/* Validity warnings */}
            {warnings.length > 0 && (
              <Card className="p-4 border-amber-300 bg-amber-50">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-800 mb-1">Rate details have changed</p>
                    <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                      {warnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                </div>
              </Card>
            )}

            {/* Overlap conflict error */}
            {overlapError && (
              <Card className="p-4 border-red-300 bg-red-50">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-red-800 mb-1">Booking dates conflict</p>
                    <p className="text-sm text-red-700 mb-3">
                      You already have a hotel booking that overlaps these dates. Cancel or change your existing booking before booking another stay.
                    </p>
                    <Button variant="outline" size="sm" asChild className="border-red-400 text-red-700 hover:bg-red-100">
                      <Link to="/bookings">View my bookings</Link>
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Who's checking in */}
            <Card className="p-6">
              <div className="flex items-baseline justify-between mb-1">
                <h2 className="text-xl font-bold text-[#1f2937]">Who's checking in?</h2>
                <span className="text-sm text-[#717182]">* Required</span>
              </div>
              <p className="text-sm text-[#717182] mb-6">
                Enter the name of the guest staying in each room exactly as it appears on their ID.
              </p>

              <form id="booking-form" onSubmit={handleSubmit} className="space-y-0">
                {occupancyNumbers.map((occNum, roomIdx) => {
                  const isFirstRoom = roomIdx === 0;
                  const guest = roomGuestsList[roomIdx]?.[0] ?? { firstName: '', lastName: '', email: '' };

                  return (
                    <div key={occNum}>
                      <div className="flex items-center gap-3 mb-5">
                        {roomIdx > 0 && <Separator className="flex-1" />}
                        <span className="text-sm font-semibold text-[#1f2937] whitespace-nowrap">
                          Room {roomIdx + 1}
                        </span>
                        <Separator className="flex-1" />
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
                              onChange={(e) => updateRoomGuest(roomIdx, 0, 'firstName', e.target.value)}
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
                              onChange={(e) => updateRoomGuest(roomIdx, 0, 'lastName', e.target.value)}
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor={`email-${roomIdx}`}>
                            Email address {isFirstRoom && <span className="text-red-500">*</span>}
                          </Label>
                          <Input
                            id={`email-${roomIdx}`}
                            type="email"
                            placeholder="e.g. john@example.com"
                            value={guest.email}
                            onChange={(e) => updateRoomGuest(roomIdx, 0, 'email', e.target.value)}
                            required={isFirstRoom}
                          />
                          {!isFirstRoom && (
                            <p className="text-xs text-[#717182] mt-1">Optional — defaults to Room 1 email</p>
                          )}
                        </div>

                        {/* Phone — Room 1 only (holder) */}
                        {isFirstRoom && (
                          <div>
                            <Label>
                              Phone number <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex gap-2">
                              <select
                                className="border border-input rounded-md px-3 py-2 text-sm bg-background w-36 shrink-0"
                                value={holderPhone.countryCode}
                                onChange={(e) => setHolderPhone({ ...holderPhone, countryCode: e.target.value })}
                                required
                              >
                                {PHONE_CODES.map((c, i) => (
                                  <option key={i} value={c.code}>
                                    {c.short} {c.code}
                                  </option>
                                ))}
                              </select>
                              <Input
                                type="tel"
                                placeholder="Phone number"
                                value={holderPhone.number}
                                onChange={(e) => setHolderPhone({ ...holderPhone, number: e.target.value })}
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

                {/* Special requests */}
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

            {/* Payment Information */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <CreditCard className="w-5 h-5 text-[#2563eb]" />
                <h2 className="text-xl font-bold text-[#1f2937]">Payment Details</h2>
                <Lock className="w-4 h-4 text-green-600 ml-auto" />
                <span className="text-sm text-green-600">Secure Payment</span>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardData.cardNumber}
                    onChange={(e) => setCardData({ ...cardData, cardNumber: e.target.value })}
                    maxLength={19}
                    required
                    form="booking-form"
                  />
                </div>

                <div>
                  <Label htmlFor="cardName">Cardholder Name</Label>
                  <Input
                    id="cardName"
                    placeholder="Name on card"
                    value={cardData.cardName}
                    onChange={(e) => setCardData({ ...cardData, cardName: e.target.value })}
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
                      onChange={(e) => setCardData({ ...cardData, expiryDate: e.target.value })}
                      maxLength={5}
                      required
                      form="booking-form"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      type="password"
                      placeholder="123"
                      value={cardData.cvv}
                      onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                      maxLength={4}
                      required
                      form="booking-form"
                    />
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-[#1f2937]">
                  By completing this booking, you agree to the{' '}
                  <a href="#" className="text-[#2563eb] hover:underline">Terms & Conditions</a>
                  {' '}and{' '}
                  <a href="#" className="text-[#2563eb] hover:underline">Cancellation Policy</a>.
                </p>
              </div>

              <Button
                type="submit"
                form="booking-form"
                disabled={processing}
                className="w-full bg-[#f59e0b] hover:bg-[#d97706] text-white h-12 text-lg mt-6"
              >
                {processing ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  `Confirm and Pay ${priceSymbol}${finalTotal}`
                )}
              </Button>
            </Card>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-28">
              <h2 className="text-xl font-bold text-[#1f2937] mb-4">Booking Summary</h2>

              {/* Hotel Info */}
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
                {isRealPrebook && prebookData!.roomTypes?.[0]?.rates?.[0]?.boardName && (
                  <p className="text-sm text-[#717182] mt-1">{prebookData!.roomTypes[0].rates![0].boardName}</p>
                )}
              </div>

              <Separator className="my-4" />

              {/* Booking Details */}
  
<div className="space-y-3 mb-6">
  <div className="flex items-center gap-2 text-[#1f2937]">
    <Calendar className="w-4 h-4 text-[#2563eb]" />
    <span className="text-sm">
      {checkIn && checkOut
        ? `${checkIn} → ${checkOut}`
        : `${nights} ${nights === 1 ? 'Night' : 'Nights'}`}
    </span>
  </div>

  <div className="flex items-center gap-2 text-[#1f2937]">
    <Users className="w-4 h-4 text-[#2563eb]" />
    <span className="text-sm">
      {occupancyNumbers.length} {occupancyNumbers.length === 1 ? 'Room' : 'Rooms'} • {guestsParam} {guestsParam === 1 ? 'Guest' : 'Guests'}
    </span>
  </div>
</div>
              <Separator className="my-4" />

              {/* Price Breakdown */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-[#1f2937]">
                  <span className="text-sm">
                    {isRealPrebook ? 'Rate total' : `${priceSymbol}${convertPrice(mockPrice)} × ${nights} ${nights === 1 ? 'night' : 'nights'}`}
                  </span>
                  <span className="text-sm">{priceSymbol}{basePrice}</span>
                </div>
                <div className="flex justify-between text-[#1f2937]">
                  <span className="text-sm">Service fee</span>
                  <span className="text-sm">{priceSymbol}{serviceFee}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg text-[#1f2937]">
                  <span>Points you'll earn</span>
                  <span>+{dollarsToPoints(finalTotal)} pts</span>
                  <span>Total</span>
                  <span>{priceSymbol}{finalTotal}</span>
                </div>
              </div>

              {!isRealPrebook && (
                <Badge variant="secondary" className="w-full justify-center bg-green-100 text-green-800 py-2">
                  <Check className="w-4 h-4 mr-2" />
                  Free cancellation
                </Badge>
              )}

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
