import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { Star, MapPin, Wifi, Utensils, ParkingSquare, Dumbbell, Heart, ArrowLeft, Check, Users, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { useCurrency } from '../contexts/CurrencyContext';
import { MapComponent } from '../components/MapComponent';

// Mock hotel data (same as HotelListingPage)
const hotels = [
  {
    id: 1,
    name: 'The Grand Palace Hotel',
    location: 'Paris, France',
    neighborhood: 'Champs-Élysées',
    rating: 4.9,
    reviews: 1243,
    price: 320,
    images: [
      'https://images.unsplash.com/photo-1572177215152-32f247303126?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3RlbCUyMGJlZHJvb218ZW58MXx8fHwxNzcxOTA0ODUxfDA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1729717949782-f40c4a07e3c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWFjaCUyMHJlc29ydCUyMGhvdGVsfGVufDF8fHx8MTc3MTg1Mjk5Nnww&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1731336478850-6bce7235e320?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3RlbCUyMHN1aXRlJTIwbHV4dXJ5fGVufDF8fHx8MTc3MTgxOTE3Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    ],
    stars: 5,
    amenities: ['wifi', 'restaurant', 'parking', 'gym'],
    description: 'Luxurious 5-star hotel in the heart of Paris, featuring elegant rooms and world-class service.',
    fullDescription: 'The Grand Palace Hotel is a beacon of luxury in the heart of Paris. Our elegant rooms combine classic French architecture with modern amenities, offering stunning views of the city. Each room is meticulously designed with comfort in mind, featuring plush bedding, marble bathrooms, and state-of-the-art technology. Our world-class restaurant serves exquisite French cuisine, while our rooftop bar offers panoramic views of the Eiffel Tower. Whether you\'re here for business or pleasure, our dedicated concierge team is ready to make your stay unforgettable.',
    features: [
      '24/7 Room Service',
      'Spa & Wellness Center',
      'Rooftop Bar',
      'Business Center',
      'Concierge Service',
      'Airport Shuttle',
    ],
  },
  {
    id: 2,
    name: 'Ocean View Resort',
    location: 'Bali, Indonesia',
    neighborhood: 'Seminyak',
    rating: 4.8,
    reviews: 892,
    price: 180,
    images: [
      'https://images.unsplash.com/photo-1729717949782-f40c4a07e3c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWFjaCUyMHJlc29ydCUyMGhvdGVsfGVufDF8fHx8MTc3MTg1Mjk5Nnww&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1572177215152-32f247303126?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3RlbCUyMGJlZHJvb218ZW58MXx8fHwxNzcxOTA0ODUxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    ],
    stars: 4,
    amenities: ['wifi', 'restaurant', 'gym'],
    description: 'Beautiful beachfront resort with stunning ocean views and modern amenities.',
    fullDescription: 'Escape to paradise at Ocean View Resort. Located on the pristine shores of Seminyak, our resort offers direct beach access and breathtaking sunsets. Each room features a private balcony with ocean views, modern furnishings, and luxurious amenities. Indulge in authentic Balinese cuisine at our beachfront restaurant, or relax by our infinity pool overlooking the sea.',
    features: [
      'Private Beach Access',
      'Infinity Pool',
      'Water Sports',
      'Beach Bar',
      'Yoga Classes',
      'Traditional Spa',
    ],
  },
  {
    id: 3,
    name: 'Metropolitan Suites',
    location: 'New York, USA',
    neighborhood: 'Manhattan',
    rating: 4.7,
    reviews: 1567,
    price: 280,
    images: [
      'https://images.unsplash.com/photo-1731336478850-6bce7235e320?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3RlbCUyMHN1aXRlJTIwbHV4dXJ5fGVufDF8fHx8MTc3MTgxOTE3Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    ],
    stars: 5,
    amenities: ['wifi', 'restaurant', 'parking', 'gym'],
    description: 'Modern luxury suites in the heart of Manhattan, perfect for business and leisure.',
    fullDescription: 'Metropolitan Suites offers the perfect blend of luxury and convenience in the heart of Manhattan. Our spacious suites feature contemporary design, full kitchens, and stunning city views. Located steps from Times Square and Broadway, you\'re at the center of everything NYC has to offer.',
    features: [
      'Full Kitchen',
      'City Views',
      'Meeting Rooms',
      'Executive Lounge',
      'Valet Parking',
      'Pet Friendly',
    ],
  },
  {
    id: 4,
    name: 'Skyline Boutique Hotel',
    location: 'Tokyo, Japan',
    neighborhood: 'Shibuya',
    rating: 4.9,
    reviews: 723,
    price: 240,
    images: [
      'https://images.unsplash.com/photo-1664908790579-34b71154f603?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib3V0aXF1ZSUyMGhvdGVsJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzcxODA2NDA3fDA&ixlib=rb-4.1.0&q=80&w=1080',
    ],
    stars: 4,
    amenities: ['wifi', 'restaurant', 'gym'],
    description: 'Contemporary boutique hotel with Japanese hospitality and stunning city views.',
    fullDescription: 'Experience the perfect fusion of traditional Japanese hospitality and modern design at Skyline Boutique Hotel. Located in vibrant Shibuya, our hotel offers uniquely designed rooms with cutting-edge technology and minimalist aesthetics. Enjoy authentic Japanese cuisine at our on-site restaurant.',
    features: [
      'Smart Room Technology',
      'Traditional Onsen',
      'Sushi Bar',
      'Roof Garden',
      'Cultural Activities',
      'Multilingual Staff',
    ],
  },
  {
    id: 5,
    name: 'City Lights Premium',
    location: 'Dubai, UAE',
    neighborhood: 'Downtown Dubai',
    rating: 4.8,
    reviews: 1034,
    price: 350,
    images: [
      'https://images.unsplash.com/photo-1661191891844-2e7980ae1c94?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwaG90ZWwlMjByb290dG9wfGVufDF8fHx8MTc3MTkwNDg1Mnww&ixlib=rb-4.1.0&q=80&w=1080',
    ],
    stars: 5,
    amenities: ['wifi', 'restaurant', 'parking', 'gym'],
    description: 'Luxury hotel with panoramic views of Dubai skyline and premium facilities.',
    fullDescription: 'City Lights Premium offers unparalleled luxury in the heart of Downtown Dubai. With direct views of the Burj Khalifa and Dubai Fountain, our hotel provides an unforgettable experience. Each room features floor-to-ceiling windows, premium amenities, and Arabian-inspired décor.',
    features: [
      'Burj Khalifa Views',
      'Indoor/Outdoor Pools',
      'Fine Dining',
      'Luxury Spa',
      'Shopping Access',
      'Premium Transfers',
    ],
  },
  {
    id: 6,
    name: 'Royal Plaza Hotel',
    location: 'London, UK',
    neighborhood: 'Covent Garden',
    rating: 4.6,
    reviews: 945,
    price: 290,
    images: [
      'https://images.unsplash.com/photo-1759462692354-404b2c995c99?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3RlbCUyMGxvYmJ5JTIwZWxlZ2FudHxlbnwxfHx8fDE3NzE4ODEyNzZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    ],
    stars: 5,
    amenities: ['wifi', 'restaurant', 'parking'],
    description: 'Historic hotel in central London with elegant interiors and classic British charm.',
    fullDescription: 'The Royal Plaza Hotel combines Victorian elegance with modern luxury in the heart of London\'s West End. Our historic building has been meticulously restored to preserve its original character while offering contemporary comfort. Located in Covent Garden, you\'re steps from world-class theaters, restaurants, and shopping.',
    features: [
      'Historic Architecture',
      'Afternoon Tea Service',
      'Theater District Access',
      'British Restaurant',
      'Heritage Rooms',
      'Butler Service',
    ],
  },
  {
    id: 7,
    name: 'Coastal Paradise Hotel',
    location: 'Miami, USA',
    neighborhood: 'South Beach',
    rating: 4.7,
    reviews: 654,
    price: 220,
    images: [
      'https://images.unsplash.com/photo-1738407282253-979e31f45785?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBob3RlbCUyMHBvb2x8ZW58MXx8fHwxNzcxODc1NjAzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    ],
    stars: 4,
    amenities: ['wifi', 'restaurant', 'gym'],
    description: 'Beachfront hotel with tropical vibes and modern amenities in Miami.',
    fullDescription: 'Feel the Miami vibe at Coastal Paradise Hotel. Our Art Deco-inspired hotel sits directly on South Beach, offering stunning ocean views and easy access to Miami\'s vibrant nightlife and culture. Relax by our tropical pool or enjoy fresh seafood at our beachfront restaurant.',
    features: [
      'Direct Beach Access',
      'Oceanfront Pool',
      'Beach Club',
      'Water Sports',
      'Live Entertainment',
      'Poolside Bar',
    ],
  },
  {
    id: 8,
    name: 'Alpine Luxury Lodge',
    location: 'Zurich, Switzerland',
    neighborhood: 'Old Town',
    rating: 4.9,
    reviews: 432,
    price: 390,
    images: [
      'https://images.unsplash.com/photo-1572177215152-32f247303126?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3RlbCUyMGJlZHJvb218ZW58MXx8fHwxNzcxOTA0ODUxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    ],
    stars: 5,
    amenities: ['wifi', 'restaurant', 'parking', 'gym'],
    description: 'Exclusive mountain lodge with Swiss hospitality and breathtaking Alpine views.',
    fullDescription: 'Experience Swiss luxury at Alpine Luxury Lodge. Nestled in Zurich\'s charming Old Town with views of the Alps, our lodge combines rustic charm with modern sophistication. Enjoy authentic Swiss cuisine, relax in our alpine spa, or explore the nearby ski slopes.',
    features: [
      'Mountain Views',
      'Alpine Spa',
      'Swiss Restaurant',
      'Ski Storage',
      'Fireplace Lounge',
      'Wine Cellar',
    ],
  },
];

const amenityIcons = {
  wifi: Wifi,
  restaurant: Utensils,
  parking: ParkingSquare,
  gym: Dumbbell,
};

export function HotelDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { convertPrice, getCurrencySymbol } = useCurrency();
  const [selectedImage, setSelectedImage] = useState(0);
  const [guests, setGuests] = useState(2);
  const [nights, setNights] = useState(1);

  const hotel = hotels.find(h => h.id === Number(id));

  if (!hotel) {
    return (
      <div className="w-full bg-gray-50 min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-[#1f2937] mb-4">Hotel Not Found</h2>
          <p className="text-[#717182] mb-6">The hotel you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to="/hotels">Back to Hotels</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const totalPrice = convertPrice(hotel.price * nights);
  const priceSymbol = getCurrencySymbol();

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
                {hotel.location} • {hotel.neighborhood}
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
            <div className="flex items-center gap-1">
              {Array.from({ length: hotel.stars }).map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-[#f59e0b] text-[#f59e0b]" />
              ))}
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="bg-[#2563eb] text-white px-3 py-1.5 rounded-lg flex items-center gap-1">
              <Star className="w-4 h-4 fill-white" />
              <span className="font-bold">{hotel.rating}</span>
            </div>
            <span className="text-[#717182]">({hotel.reviews} reviews)</span>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="col-span-4 md:col-span-3">
            <img
              src={hotel.images[selectedImage]}
              alt={hotel.name}
              className="w-full h-[500px] object-cover rounded-lg"
            />
          </div>
          <div className="col-span-4 md:col-span-1 flex md:flex-col gap-4">
            {hotel.images.slice(0, 3).map((image, index) => (
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-[#1f2937] mb-4">About This Hotel</h2>
              <p className="text-[#1f2937] leading-relaxed">{hotel.fullDescription || hotel.description}</p>
            </Card>

            {/* Amenities */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-[#1f2937] mb-4">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {hotel.amenities.map((amenity) => {
                  const Icon = amenityIcons[amenity as keyof typeof amenityIcons];
                  return (
                    <div key={amenity} className="flex items-center gap-3">
                      {Icon && <Icon className="w-5 h-5 text-[#2563eb]" />}
                      <span className="capitalize text-[#1f2937]">{amenity}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Features */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-[#1f2937] mb-4">Property Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {hotel.features?.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-[#2563eb]" />
                    <span className="text-[#1f2937]">{feature}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Location Map */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-[#1f2937] mb-4">Location</h2>
              <MapComponent 
                location={hotel.location}
                height="400px"
              />
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-[#717182] flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#2563eb]" />
                  <span className="font-medium text-[#1f2937]">{hotel.neighborhood}</span>
                  <span>•</span>
                  <span>{hotel.location}</span>
                </p>
              </div>
            </Card>
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-28">
              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold text-[#1f2937]">
                    {priceSymbol}{convertPrice(hotel.price)}
                  </span>
                  <span className="text-lg text-[#717182]">/night</span>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Free cancellation
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

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-[#1f2937]">
                  <span>{priceSymbol}{convertPrice(hotel.price)} × {nights} {nights === 1 ? 'night' : 'nights'}</span>
                  <span>{priceSymbol}{totalPrice}</span>
                </div>
                <div className="flex justify-between text-[#1f2937]">
                  <span>Service fee</span>
                  <span>{priceSymbol}{Math.round(totalPrice * 0.1)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg text-[#1f2937]">
                  <span>Total</span>
                  <span>{priceSymbol}{totalPrice + Math.round(totalPrice * 0.1)}</span>
                </div>
              </div>

              <Button
                className="w-full bg-[#f59e0b] hover:bg-[#d97706] text-white h-12 text-lg"
                onClick={() => navigate(`/payment/${hotel.id}?guests=${guests}&nights=${nights}`)}
              >
                Reserve Now
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
