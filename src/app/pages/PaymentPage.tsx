import { useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router';
import { CreditCard, Lock, ArrowLeft, Check, Calendar, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { useCurrency } from '../contexts/CurrencyContext';
import { toast } from 'sonner';

// Mock hotel data (simplified for payment page)
const hotels = [
  { id: 1, name: 'The Grand Palace Hotel', location: 'Paris, France', price: 320, image: 'https://images.unsplash.com/photo-1572177215152-32f247303126?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3RlbCUyMGJlZHJvb218ZW58MXx8fHwxNzcxOTA0ODUxfDA&ixlib=rb-4.1.0&q=80&w=400' },
  { id: 2, name: 'Ocean View Resort', location: 'Bali, Indonesia', price: 180, image: 'https://images.unsplash.com/photo-1729717949782-f40c4a07e3c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWFjaCUyMHJlc29ydCUyMGhvdGVsfGVufDF8fHx8MTc3MTg1Mjk5Nnww&ixlib=rb-4.1.0&q=80&w=400' },
  { id: 3, name: 'Metropolitan Suites', location: 'New York, USA', price: 280, image: 'https://images.unsplash.com/photo-1731336478850-6bce7235e320?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3RlbCUyMHN1aXRlJTIwbHV4dXJ5fGVufDF8fHx8MTc3MTgxOTE3Nnww&ixlib=rb-4.1.0&q=80&w=400' },
  { id: 4, name: 'Skyline Boutique Hotel', location: 'Tokyo, Japan', price: 240, image: 'https://images.unsplash.com/photo-1664908790579-34b71154f603?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib3V0aXF1ZSUyMGhvdGVsJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzcxODA2NDA3fDA&ixlib=rb-4.1.0&q=80&w=400' },
  { id: 5, name: 'City Lights Premium', location: 'Dubai, UAE', price: 350, image: 'https://images.unsplash.com/photo-1661191891844-2e7980ae1c94?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwaG90ZWwlMjByb290dG9wfGVufDF8fHx8MTc3MTkwNDg1Mnww&ixlib=rb-4.1.0&q=80&w=400' },
  { id: 6, name: 'Royal Plaza Hotel', location: 'London, UK', price: 290, image: 'https://images.unsplash.com/photo-1759462692354-404b2c995c99?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3RlbCUyMGxvYmJ5JTIwZWxlZ2FudHxlbnwxfHx8fDE3NzE4ODEyNzZ8MA&ixlib=rb-4.1.0&q=80&w=400' },
  { id: 7, name: 'Coastal Paradise Hotel', location: 'Miami, USA', price: 220, image: 'https://images.unsplash.com/photo-1738407282253-979e31f45785?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBob3RlbCUyMHBvb2x8ZW58MXx8fHwxNzcxODc1NjAzfDA&ixlib=rb-4.1.0&q=80&w=400' },
  { id: 8, name: 'Alpine Luxury Lodge', location: 'Zurich, Switzerland', price: 390, image: 'https://images.unsplash.com/photo-1572177215152-32f247303126?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3RlbCUyMGJlZHJvb218ZW58MXx8fHwxNzcxOTA0ODUxfDA&ixlib=rb-4.1.0&q=80&w=400' },
];

export function PaymentPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { convertPrice, getCurrencySymbol } = useCurrency();

  const guests = Number(searchParams.get('guests')) || 2;
  const nights = Number(searchParams.get('nights')) || 1;

  const hotel = hotels.find(h => h.id === Number(id));

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });

  const [processing, setProcessing] = useState(false);

  if (!hotel) {
    return (
      <div className="w-full bg-gray-50 min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-[#1f2937] mb-4">Hotel Not Found</h2>
          <Button asChild>
            <Link to="/hotels">Back to Hotels</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const totalPrice = convertPrice(hotel.price * nights);
  const serviceFee = Math.round(totalPrice * 0.1);
  const finalTotal = totalPrice + serviceFee;
  const priceSymbol = getCurrencySymbol();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false);
      toast.success('Booking confirmed! Check your email for details.');
      navigate('/bookings');
    }, 2000);
  };

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 lg:px-8 py-8">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link to={`/hotel/${id}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Hotel Details
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#1f2937] mb-2">
                Complete Your Booking
              </h1>
              <p className="text-lg text-[#717182]">
                You're just one step away from your perfect stay
              </p>
            </div>

            {/* Guest Information */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-[#1f2937] mb-4">Guest Information</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>

                {/* Payment Information */}
                <Separator className="my-6" />
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-5 h-5 text-[#2563eb]" />
                  <h3 className="text-lg font-bold text-[#1f2937]">Payment Details</h3>
                  <Lock className="w-4 h-4 text-green-600 ml-auto" />
                  <span className="text-sm text-green-600">Secure Payment</span>
                </div>

                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={formData.cardNumber}
                    onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                    maxLength={19}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="cardName">Cardholder Name</Label>
                  <Input
                    id="cardName"
                    placeholder="Name on card"
                    value={formData.cardName}
                    onChange={(e) => setFormData({ ...formData, cardName: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      placeholder="MM/YY"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      maxLength={5}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      type="password"
                      placeholder="123"
                      value={formData.cvv}
                      onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
                      maxLength={4}
                      required
                    />
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
              </form>
            </Card>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-28">
              <h2 className="text-xl font-bold text-[#1f2937] mb-4">Booking Summary</h2>

              {/* Hotel Info */}
              <div className="mb-6">
                <img
                  src={hotel.image}
                  alt={hotel.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <h3 className="font-bold text-[#1f2937] mb-1">{hotel.name}</h3>
                <p className="text-sm text-[#717182]">{hotel.location}</p>
              </div>

              <Separator className="my-4" />

              {/* Booking Details */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-[#1f2937]">
                  <Calendar className="w-4 h-4 text-[#2563eb]" />
                  <span className="text-sm">
                    {nights} {nights === 1 ? 'Night' : 'Nights'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[#1f2937]">
                  <Users className="w-4 h-4 text-[#2563eb]" />
                  <span className="text-sm">
                    {guests} {guests === 1 ? 'Guest' : 'Guests'}
                  </span>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Price Breakdown */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-[#1f2937]">
                  <span className="text-sm">
                    {priceSymbol}{convertPrice(hotel.price)} × {nights} {nights === 1 ? 'night' : 'nights'}
                  </span>
                  <span className="text-sm">{priceSymbol}{totalPrice}</span>
                </div>
                <div className="flex justify-between text-[#1f2937]">
                  <span className="text-sm">Service fee</span>
                  <span className="text-sm">{priceSymbol}{serviceFee}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg text-[#1f2937]">
                  <span>Total</span>
                  <span>{priceSymbol}{finalTotal}</span>
                </div>
              </div>

              <Badge variant="secondary" className="w-full justify-center bg-green-100 text-green-800 py-2">
                <Check className="w-4 h-4 mr-2" />
                Free cancellation
              </Badge>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-[#717182] leading-relaxed">
                  You can cancel this reservation up to 24 hours before check-in for a full refund.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
