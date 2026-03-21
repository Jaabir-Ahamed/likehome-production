import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { Star, MapPin, Wifi, Utensils, ParkingSquare, Dumbbell, Heart, ArrowLeft, Check, Users, Calendar, Clock, Info, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { MapComponent } from '../components/MapComponent';
import { api } from '../../api/liteApi';
import { toast } from 'sonner';

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
  { keywords: ['wifi', 'internet', 'wired'], Icon: Wifi },
  { keywords: ['restaurant', 'dining', 'coffee shop', 'coffee'], Icon: Utensils },
  { keywords: ['parking', 'garage'], Icon: ParkingSquare },
  { keywords: ['fitness', 'gym', 'sport'], Icon: Dumbbell },
];

function getFacilityIcon(name: string): React.ComponentType<{ className?: string }> {
  const lower = name.toLowerCase();
  for (const { keywords, Icon } of FACILITY_ICON_KEYWORDS) {
    if (keywords.some(k => lower.includes(k))) return Icon;
  }
  return Check;
}

export function HotelDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [guests, setGuests] = useState(2);
  const [nights, setNights] = useState(1);
  const [prebookLoading, setPrebookLoading] = useState(false);
  const [selectedOfferId] = useState<string | null>(null);
  const [hotel, setHotel] = useState<HotelDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="w-full bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#2563eb] border-t-transparent rounded-full animate-spin" />
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

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 lg:px-8 py-8">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/hotels">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Hotels
          </Link>
        </Button>

        {/* Hotel Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-[#1f2937] mb-2">{hotel.name}</h1>
              <p className="text-lg text-[#717182] flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {hotel.city} • {hotel.address}
              </p>
            </div>
            <button
              className="w-12 h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center hover:border-[#f59e0b] hover:bg-[#f59e0b]/10 transition-colors"
              aria-label="Add to favorites"
            >
              <Heart className="w-6 h-6 text-[#1f2937]" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {hotel.starRating > 0 && (
              <div className="flex items-center gap-1">
                {Array.from({ length: hotel.starRating }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-[#f59e0b] text-[#f59e0b]" />
                ))}
              </div>
            )}
            {hotel.starRating > 0 && <Separator orientation="vertical" className="h-6" />}
            {hotel.rating > 0 && (
              <div className="bg-[#2563eb] text-white px-3 py-1.5 rounded-lg flex items-center gap-1">
                <Star className="w-4 h-4 fill-white" />
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
                  dangerouslySetInnerHTML={{ __html: hotel.hotelDescription }}
                />
              </Card>
            )}

            {/* Check-in / Check-out */}
            {hotel.checkinCheckoutTimes && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold text-[#1f2937] mb-4">Check-in & Check-out</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-[#2563eb] mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#1f2937]">Check-in</p>
                      <p className="text-[#717182]">From {hotel.checkinCheckoutTimes.checkin_start}</p>
                      {hotel.checkinCheckoutTimes.checkin_end && (
                        <p className="text-[#717182]">Until {hotel.checkinCheckoutTimes.checkin_end}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-[#2563eb] mt-0.5" />
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
                        <Icon className="w-4 h-4 text-[#2563eb] flex-shrink-0" />
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
                  <Info className="w-6 h-6 text-[#f59e0b]" />
                  Important Information
                </h2>
                <pre className="text-sm text-[#1f2937] whitespace-pre-wrap font-sans leading-relaxed">
                  {hotel.hotelImportantInformation}
                </pre>
              </Card>
            )}

            {/* Rooms */}
            {hotel.rooms?.length > 0 && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold text-[#1f2937] mb-4">Available Room Types</h2>
                <div className="space-y-4">
                  {hotel.rooms.slice(0, 5).map((room) => {
                    const mainPhoto = room.photos?.find(p => p.mainPhoto)?.url ?? room.photos?.[0]?.url;
                    return (
                      <div key={room.id} className="border border-gray-200 rounded-lg p-4 flex gap-4">
                        {mainPhoto && (
                          <img
                            src={mainPhoto}
                            alt={room.roomName}
                            className="w-24 h-20 object-cover rounded-lg flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-[#1f2937] mb-1">{room.roomName}</h3>
                          {room.roomSizeSquare && (
                            <p className="text-sm text-[#717182] mb-1">{room.roomSizeSquare} {room.roomSizeUnit}</p>
                          )}
                          <p className="text-sm text-[#717182] mb-2">
                            Up to {room.maxOccupancy} guests
                            {room.bedTypes?.length > 0 && ` • ${room.bedTypes.map(b => `${b.quantity}× ${b.bedType}`).join(', ')}`}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {room.roomAmenities?.slice(0, 5).map(a => (
                              <Badge key={a.amenitiesId} variant="secondary" className="text-xs">{a.name}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {hotel.rooms.length > 5 && (
                    <p className="text-sm text-[#717182] text-center">
                      +{hotel.rooms.length - 5} more room types available
                    </p>
                  )}
                </div>
              </Card>
            )}

            {/* Guest Sentiment */}
            {hotel.sentiment_analysis && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold text-[#1f2937] mb-4">Guest Reviews</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {hotel.sentiment_analysis.pros?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-green-700 flex items-center gap-2 mb-2">
                        <ThumbsUp className="w-4 h-4" />
                        What guests love
                      </h3>
                      <ul className="space-y-1">
                        {hotel.sentiment_analysis.pros.map((pro, i) => (
                          <li key={i} className="text-sm text-[#1f2937] flex items-center gap-2">
                            <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {hotel.sentiment_analysis.cons?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-red-600 flex items-center gap-2 mb-2">
                        <ThumbsDown className="w-4 h-4" />
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
                            style={{ width: `${Math.min((cat.rating / 10) * 100, 100)}%` }}
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
                  <MapPin className="w-4 h-4 text-[#2563eb]" />
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
                <p className="text-sm text-[#717182] mb-1">Nightly rate</p>
                <p className="text-lg font-semibold text-[#1f2937]">Select dates for pricing</p>
                <Badge variant="secondary" className="mt-2 bg-green-100 text-green-800">
                  Free cancellation available
                </Badge>
              </div>

              <Separator className="my-6" />

              {/* Booking Options */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm font-medium text-[#1f2937] mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
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
                    <Calendar className="w-4 h-4" />
                    Number of Nights
                  </label>
                  <select
                    value={nights}
                    onChange={(e) => setNights(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 14, 21, 30].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'Night' : 'Nights'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Button
                className="w-full bg-[#f59e0b] hover:bg-[#d97706] text-white h-12 text-lg"
                disabled={prebookLoading}
                onClick={async () => {
                  if (!selectedOfferId) {
                    navigate(`/payment/${hotel.id}?guests=${guests}&nights=${nights}`);
                    return;
                  }
                  setPrebookLoading(true);
                  try {
                    const prebook = await api.getRatesPrebook({ offerId: selectedOfferId, usePaymentSdk: false });
                    const prebookData = prebook?.data;
                    if (!prebookData?.prebookId) throw new Error('Invalid prebook response');
                    sessionStorage.setItem(`prebook:${prebookData.prebookId}`, JSON.stringify(prebookData));
                    navigate(`/payment?prebookId=${prebookData.prebookId}`);
                  } catch (err) {
                    toast.error('Failed to reserve rate. Please try again.');
                  } finally {
                    setPrebookLoading(false);
                  }
                }}
              >
                {prebookLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Reserving...
                  </span>
                ) : 'Reserve Now'}
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
