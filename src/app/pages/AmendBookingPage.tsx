// AmendBookingPage with PaymentPage UI + EXACT guest section behavior
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';
import { api } from '../../api/liteApi';
import { Badge, Check, Calendar, Users, CreditCard, Lock } from 'lucide-react';
import { Label } from '@radix-ui/react-label';

// match PaymentPage structure
const PHONE_CODES = [
  { code: '+1', short: 'USA' },
  { code: '+44', short: 'GBR' },
  { code: '+61', short: 'AUS' }
];

export function AmendBookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const bookingId = searchParams.get('bookingId');

  const [bookingData, setBookingData] = useState<any>(null);

  // EXACT same structure as PaymentPage (2D array)
  const [roomGuestsList, setRoomGuestsList] = useState<any[][]>([]);

  const [holderFirstName, setHolderFirstName] = useState('');
  const [holderLastName, setHolderLastName] = useState('');
  const [holderEmail, setHolderEmail] = useState('');
  const [holderPhone, setHolderPhone] = useState({ countryCode: '+1', number: '' });
  const [remarks, setRemarks] = useState('');

  const [editCheckin, setEditCheckin] = useState('');
  const [editCheckout, setEditCheckout] = useState('');
  const [isDateChanged, setIsDateChanged] = useState(false);

  const [ratesByOccupancy, setRatesByOccupancy] = useState<Record<number, any[]>>({});
  const [selectedRates, setSelectedRates] = useState<Record<number, any>>({});

  const [cardData, setCardData] = useState({ cardNumber: '', cardName: '', expiryDate: '', cvv: '' });

  const [processing, setProcessing] = useState(false);
  const [loadingRates, setLoadingRates] = useState(false);

  const [occupancyNumber, setOccupancyNumber] = useState(0);
  const [prebookResult, setPrebookResult] = useState<any>(null);

  const [showMore, setShowMore] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingCheck, setPendingCheck] = useState(false);

  const [diffamount, setDiffAmount] = useState("");
  const [paymentAction, setPaymentAction] = useState("");

  const [cancellationFee, setCancellationFee] = useState(0);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) return;
      try {
        const res = await api.getBooking(bookingId);
        const data = res.data;
        setBookingData(data);

        setRoomGuestsList(
          data.bookedRooms.map((room: any) => ([{
            firstName: room.firstName,
            lastName: room.lastName,
            email: data.holder.email
          }]))
        );

        setHolderFirstName(data.holder.firstName);
        setHolderLastName(data.holder.lastName);
        setHolderEmail(data.holder.email);
        setHolderPhone(data.holder.phone);
        setRemarks(data.specialRemarks);

        setEditCheckin(data.checkin);
        setEditCheckout(data.checkout);
      } catch {
        toast.error('Failed to load booking');
      }
    };

    fetchBooking();
  }, [bookingId]);

  const handleDateBlur = (() => {
    setIsDateChanged(
      editCheckin !== bookingData.checkin ||
      editCheckout !== bookingData.checkout
    );
    handlePrebook();
  });

  const updateRoomGuest = (roomIdx: number, guestIdx: number, field: string, value: string) => {
    setRoomGuestsList(prev =>
      prev.map((room, ri) =>
        ri === roomIdx
          ? room.map((g, gi) => gi === guestIdx ? { ...g, [field]: value } : g)
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

      const occupancies = bookingData.bookedRooms.map((room: any) => ({
        adults: room.adults,
        childrenAges: []
      }));

      console.log({
        bookingId: bookingId,
        checkin: editCheckin,
        checkout: editCheckout,
        occupancies
      });

      const result = await api.getAlternativePrebooks(
        bookingId || "",
        { checkin: editCheckin, checkout: editCheckout, occupancies }
      );

      setPrebookResult(result);

      console.log(result);

      const hotelData = result?.data?.find(
        (h: any) => h.hotelId === bookingData.hotel.hotelId
      );

      const flattened = hotelData?.roomTypes?.flatMap((rt: any) =>
        rt.rates.map((r: any) => ({ ...r, offerId: rt.offerId, roomTypeId: rt.roomTypeId, prebookId: hotelData.prebookId }))
      ) ?? [];

      const grouped = flattened.reduce((acc: any, rate: any) => {
        const key = rate.occupancyNumber;
        if (!acc[key]) acc[key] = [];
        acc[key].push(rate);
        return acc;
      }, {});

      setRatesByOccupancy(grouped);
    } catch {
      toast.error('Could not load rates');
    } finally {
      setLoadingRates(false);
    }
  };

  const handleSelectRate = (occ: number, rate: any) => {
    setSelectedRates(prev => ({ ...prev, [occ]: rate }));
    setOccupancyNumber(occ);
  };

  const handleRebook = async () => {
    try {
      setProcessing(true);

      console.log({
        firstName: holderFirstName || "",
        lastName: holderLastName || "",
        email: holderEmail || "",
        remarks: ""});

      await api.amendBooking(bookingId || '', {
        firstName: holderFirstName || "",
        lastName: holderLastName || "",
        email: holderEmail || "",
        remarks: remarks
      });

      if(showMore) {  
        console.log(selectedRates[occupancyNumber].prebookId);
        await api.getRatesRebook({
          prebookId: selectedRates[occupancyNumber].prebookId,
          existingBookingId: bookingId || ''
        });
      }

      toast.success('Booking updated');
      navigate('/bookings');
    } catch {
      toast.error('Failed to update booking');
    } finally {
      setProcessing(false);
    }
  };

  const selectedTotal = Object.values(selectedRates).reduce(
    (sum: number, r: any) => sum + (r.retailRate?.total?.[0]?.amount ?? 0),
    0
  );

  useEffect(() => {
    console.log(cancellationFee);
    const diff = (selectedTotal + cancellationFee) - bookingData?.price || 0;
    console.log(diff);
    setDiffAmount(Math.abs(diff).toFixed(2));
    setPaymentAction(diff < 0 ? 'Refund' : 'Pay');
  }, [selectedTotal, cancellationFee]);

  const handleCheckboxChange = (checked: boolean) => {
    if (checked) {
      setPendingCheck(true);
      setShowConfirmModal(true);
      handlePrebook();
      checkCancelPolicy();
    } else {
      setShowMore(false);
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
    const room = bookingData.bookedRooms?.[0];
    if (!room) return;

    const policies = room.rate?.cancellationPolicies;
    const retailAmount = room.rate?.retailRate?.total?.amount || 0;

    const policyInfo = policies?.cancelPolicyInfos?.[0];

    // Default
    let fee = 0;

    // 🚨 Non-refundable → always full charge
    if (policies?.refundableTag === "NRFN") {
      fee = retailAmount;
    } 
    // ⏰ Refundable but past deadline
    else if (policyInfo?.cancelTime) {
      const now = new Date();
      const deadline = new Date(policyInfo.cancelTime);

      if (now > deadline) {
        fee = policyInfo.amount || retailAmount;
      }
    }

    setCancellationFee(fee);
  };

  if (!bookingData) return <div className="p-6">Loading...</div>;

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 lg:px-8 py-8">

        <h1 className="text-3xl font-bold mb-6">Edit Booking</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            {/* Guest Section */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Who's checking in?</h2>

              {roomGuestsList.map((room, roomIdx) => {
                const isFirstRoom = roomIdx === 0;
                return (
                  <div key={roomIdx} className="mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <Input
                        value={holderFirstName}
                        onChange={(e) => setHolderFirstName(e.target.value)}
                        placeholder="First name"
                      />
                      <Input
                        value={holderLastName}
                        onChange={(e) => setHolderLastName(e.target.value)}
                        placeholder="Last name"
                      />
                    </div>

                    <Input
                      value={holderEmail}
                      onChange={(e) => setHolderEmail(e.target.value)}
                      placeholder="Email"
                    />

                    <div className="flex gap-2 mt-3">
                      <select
                        className="border rounded px-2"
                        value={holderPhone.countryCode}
                        onChange={(e) => setHolderPhone({ ...holderPhone, countryCode: e.target.value })}
                      >
                        {PHONE_CODES.map((c, i) => (
                          <option key={i} value={c.code}>{c.short} {c.code}</option>
                        ))}
                      </select>
                      <Input
                        placeholder="Phone number"
                        value={holderPhone.number}
                        onChange={(e) => setHolderPhone({ ...holderPhone, number: e.target.value })}
                      />
                    </div>
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
                  </div>
                );
              })}

              {/* Checkbox to reveal rest */}
              <div className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  checked={showMore}
                  onChange={(e) => handleCheckboxChange(e.target.checked)}
                />
                <label htmlFor="showMore" className="text-sm">
                  Change dates and room selection
                </label>
              </div>
            </Card>

            {showMore && (
              <>
                {/* Dates */}
                <Card className="p-6">
                  <h2 className="text-xl font-bold mb-4">Change Dates</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <Input type="date" value={editCheckin} onChange={e => setEditCheckin(e.target.value)} onBlur={handleDateBlur} />
                    <Input type="date" value={editCheckout} onChange={e => setEditCheckout(e.target.value)} onBlur={handleDateBlur} />
                  </div>
                  <Button className="mt-4" onClick={handlePrebook} disabled={loadingRates || !isDateChanged}>
                    {loadingRates ? 'Checking...' : 'Rooms updated'}
                  </Button>
                </Card>

                {/* Rates */}
                <Card className="p-6">
                  <h2 className="text-xl font-bold mb-4">Select New Room</h2>
                  {Object.entries(ratesByOccupancy).map(([occ, rates]) => (
                    <div key={occ} className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4" /> Room {occ}
                      </div>

                      {(rates as any[]).map(rate => {
                        const isSelected = selectedRates[Number(occ)]?.rateId === rate.rateId;
                        const price = rate.retailRate?.total?.[0]?.amount;

                        return (
                          <div
                            key={rate.rateId}
                            onClick={() => handleSelectRate(Number(occ), rate)}
                            className={`p-4 border rounded-lg cursor-pointer mb-2 ${isSelected ? 'border-blue-500 bg-blue-50' : ''}`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">{rate.name}</p>
                                <Badge>{rate.boardName}</Badge>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">${price}</p>
                                <Button size="sm" variant={isSelected ? 'default' : 'outline'}>
                                  {isSelected ? <><Check className="w-3 h-3 mr-1"/>Selected</> : 'Select'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </Card>

                {/* Payment */}
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="w-5 h-5" />
                    <h2 className="text-xl font-bold">Payment Details</h2>
                    <Lock className="w-4 h-4 ml-auto text-green-600" />
                  </div>

                  <div className="space-y-4">
                    <Input placeholder="Card Number" value={cardData.cardNumber} onChange={e => setCardData({ ...cardData, cardNumber: e.target.value })} />
                    <Input placeholder="Cardholder Name" value={cardData.cardName} onChange={e => setCardData({ ...cardData, cardName: e.target.value })} />
                    <div className="grid grid-cols-2 gap-4">
                      <Input placeholder="MM/YY" value={cardData.expiryDate} onChange={e => setCardData({ ...cardData, expiryDate: e.target.value })} />
                      <Input placeholder="CVV" value={cardData.cvv} onChange={e => setCardData({ ...cardData, cvv: e.target.value })} />
                    </div>
                  </div>
                </Card>
              </>
            )}

          </div>

          {/* RIGHT */}
          {(
            <div>
              <Card className="p-6 sticky top-28">
                <h2 className="text-xl font-bold mb-4">Summary</h2>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{editCheckin} → {editCheckout}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{bookingData.bookedRooms.length} rooms</span>
                  </div>
                </div>

                <Separator />

                {showMore && (
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between">
                    <span>Current</span>
                    <span>-${bookingData.price}</span>
                  </div>
                  { (cancellationFee > 0) && (
                    <div className="flex justify-between text-red-600">
                      <span>Cancellation Fee</span>
                      <span>${cancellationFee}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>New</span>
                    <span>${selectedTotal}</span>
                  </div>
                </div>
                )}

                <Button className="w-full mt-6" onClick={handleRebook} disabled={processing || (showMore && Object.keys(selectedRates).length === 0)}>
                  {processing ? 'Updating...' : showMore ? `${paymentAction} $${diffamount}` : 'Confirm Changes'}
                </Button>
              </Card>
            </div>
          )}
          {showConfirmModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="p-6 w-full max-w-md">
                <h2 className="text-lg font-bold mb-2">IMPORTANT</h2>
                <p className="text-sm mb-4">
                  Changing the dates and rooms will cancel the original booking and rebook with the new inputs. This will incur charges or refunds based on the price differences, as well as the cancellation policy.
                </p>

                {(bookingData.tag === 'NRFN' || cancellationFee > 0) && (
                <div className="mt-4 p-4 rounded-lg border bg-gray-50">
                  <>
                    <h3 className="font-semibold text-sm mb-2 text-red-600">
                      Cancellation Policy Alerts:
                    </h3>

                    {bookingData.tag === 'NRFN' ? (
                      <p className="text-sm text-red-600">
                        This booking is non-refundable. You will have to pay the full price to make changes to the booking.
                      </p>
                    ) : (
                      <p className="text-xs text-red-600 mt-2">
                        The booking has passed the free cancellation deadline of {bookingData.bookedRooms[0].rate.cancellationPolicies.cancellationPolicyInfos.cancelTime} and a fee of ${cancellationFee} will be applied.
                      </p>
                    )}
                  </>
                </div>
                )}
              

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={cancelContinue}>
                    Cancel
                  </Button>
                  <Button onClick={confirmContinue}>
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
