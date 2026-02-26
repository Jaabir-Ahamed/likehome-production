import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Star, MapPin, Wifi, Utensils, ParkingSquare, Dumbbell, Heart, ChevronDown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Slider } from '../components/ui/slider';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';

// Mock hotel data
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
    ],
    stars: 5,
    amenities: ['wifi', 'restaurant', 'parking', 'gym'],
    description: 'Luxurious 5-star hotel in the heart of Paris, featuring elegant rooms and world-class service.',
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
    ],
    stars: 4,
    amenities: ['wifi', 'restaurant', 'gym'],
    description: 'Beautiful beachfront resort with stunning ocean views and modern amenities.',
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
  },
];

const amenityIcons = {
  wifi: Wifi,
  restaurant: Utensils,
  parking: ParkingSquare,
  gym: Dumbbell,
};

export function HotelListingPage() {
  const [searchParams] = useSearchParams();
  const locationParam = searchParams.get('location')?.toLowerCase() || '';
  const checkInParam = searchParams.get('checkIn');
  const checkOutParam = searchParams.get('checkOut');
  const guestsParam = searchParams.get('guests');
  
  const [locationFilter, setLocationFilter] = useState(() => searchParams.get('location')?.toLowerCase() || '');

  useEffect(() => {
    setLocationFilter(searchParams.get('location')?.toLowerCase() || '');
  }, [searchParams]);

  const [priceRange, setPriceRange] = useState([0, 500]);
  const [selectedStars, setSelectedStars] = useState<number[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('recommended');

  const handleStarToggle = (star: number) => {
    setSelectedStars(prev => 
      prev.includes(star) ? prev.filter(s => s !== star) : [...prev, star]
    );
  };

  const handleAmenityToggle = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  // Filter and sort hotels
  const filteredHotels = hotels
    .filter(hotel => {
      const hotelLocationParts = hotel.location.toLowerCase().split(',').map(part => part.trim());
      const locationMatch = locationFilter ? hotelLocationParts.some(part => part.includes(locationFilter) || hotel.neighborhood.toLowerCase().includes(locationFilter)) : true;

      const priceMatch = hotel.price >= priceRange[0] && hotel.price <= priceRange[1];
      const starMatch = selectedStars.length === 0 || selectedStars.includes(hotel.stars);
      const amenityMatch = selectedAmenities.length === 0 || 
        selectedAmenities.every(amenity => hotel.amenities.includes(amenity));
      return locationMatch && priceMatch && starMatch && amenityMatch;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0; // recommended
    });

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1f2937] mb-2">
            Find Your Perfect Stay
          </h1>
          <p className="text-lg text-[#717182]">
            {filteredHotels.length} hotels available
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Filters */}
          <aside className="w-full lg:w-1/4">
            <Card className="p-6 sticky top-28">
              <h2 className="text-xl font-bold text-[#1f2937] mb-6">Filters</h2>

              <Accordion type="multiple" defaultValue={['price', 'stars', 'amenities']} className="w-full">
                {/* Price Range Filter */}
                <AccordionItem value="price">
                  <AccordionTrigger className="text-base font-medium">
                    Price Range
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      <Slider
                        min={0}
                        max={500}
                        step={10}
                        value={priceRange}
                        onValueChange={setPriceRange}
                        className="w-full"
                      />
                      <div className="flex items-center justify-between text-sm text-[#717182]">
                        <span>${priceRange[0]}</span>
                        <span>${priceRange[1]}</span>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Star Rating Filter */}
                <AccordionItem value="stars">
                  <AccordionTrigger className="text-base font-medium">
                    Star Rating
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      {[5, 4, 3, 2, 1].map((star) => (
                        <div key={star} className="flex items-center space-x-2">
                          <Checkbox
                            id={`star-${star}`}
                            checked={selectedStars.includes(star)}
                            onCheckedChange={() => handleStarToggle(star)}
                          />
                          <Label htmlFor={`star-${star}`} className="flex items-center cursor-pointer">
                            <div className="flex items-center gap-1">
                              {Array.from({ length: star }).map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]" />
                              ))}
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Amenities Filter */}
                <AccordionItem value="amenities">
                  <AccordionTrigger className="text-base font-medium">
                    Amenities
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      {[
                        { id: 'wifi', label: 'Free Wi-Fi' },
                        { id: 'restaurant', label: 'Restaurant' },
                        { id: 'parking', label: 'Parking' },
                        { id: 'gym', label: 'Fitness Center' },
                      ].map((amenity) => (
                        <div key={amenity.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={amenity.id}
                            checked={selectedAmenities.includes(amenity.id)}
                            onCheckedChange={() => handleAmenityToggle(amenity.id)}
                          />
                          <Label htmlFor={amenity.id} className="cursor-pointer">
                            {amenity.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <Button 
                variant="outline" 
                className="w-full mt-6"
                onClick={() => {
                  setLocationFilter('');
                  setPriceRange([0, 500]);
                  setSelectedStars([]);
                  setSelectedAmenities([]);
                }}
              >
                Clear All Filters
              </Button>
            </Card>
          </aside>

          {/* Main Content - Hotel Results */}
          <main className="flex-1">
            {/* Sorting Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-sm text-[#717182]">
                Showing {filteredHotels.length} properties
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#1f2937]">Sort by:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recommended">Recommended</SelectItem>
                    <SelectItem value="price-low">Lowest Price</SelectItem>
                    <SelectItem value="price-high">Highest Price</SelectItem>
                    <SelectItem value="rating">Highest Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Hotel Cards */}
            <div className="space-y-6">
              {filteredHotels.map((hotel) => (
                <Card key={hotel.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  <div className="flex flex-col md:flex-row">
                    {/* Hotel Image */}
                    <div className="md:w-1/3 relative group">
                      <img 
                        src={hotel.images[0]} 
                        alt={hotel.name}
                        className="w-full h-64 md:h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <button 
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                        aria-label="Add to favorites"
                      >
                        <Heart className="w-5 h-5 text-[#1f2937]" />
                      </button>
                    </div>

                    {/* Hotel Details */}
                    <div className="md:w-2/3 p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-2xl font-bold text-[#1f2937] mb-2">{hotel.name}</h3>
                            <p className="text-sm text-[#717182] flex items-center gap-1 mb-2">
                              <MapPin className="w-4 h-4" />
                              {hotel.location} • {hotel.neighborhood}
                            </p>
                            <div className="flex items-center gap-1 mb-3">
                              {Array.from({ length: hotel.stars }).map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]" />
                              ))}
                            </div>
                          </div>
                          <div className="bg-[#2563eb] text-white px-3 py-1.5 rounded-lg flex items-center gap-1">
                            <Star className="w-4 h-4 fill-white" />
                            <span className="font-bold">{hotel.rating}</span>
                          </div>
                        </div>

                        <p className="text-[#1f2937] mb-4 line-clamp-2">{hotel.description}</p>

                        {/* Amenities */}
                        <div className="flex flex-wrap gap-3 mb-4">
                          {hotel.amenities.map((amenity) => {
                            const Icon = amenityIcons[amenity as keyof typeof amenityIcons];
                            return (
                              <div 
                                key={amenity} 
                                className="flex items-center gap-1 text-sm text-[#717182] bg-gray-100 px-3 py-1.5 rounded-full"
                              >
                                {Icon && <Icon className="w-4 h-4" />}
                                <span className="capitalize">{amenity}</span>
                              </div>
                            );
                          })}
                        </div>

                        <p className="text-xs text-[#717182]">{hotel.reviews} reviews</p>
                      </div>

                      {/* Price and CTA */}
                      <div className="flex items-end justify-between mt-4 pt-4 border-t">
                        <div>
                          <p className="text-sm text-[#717182] mb-1">Starting from</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold text-[#1f2937]">${hotel.price}</span>
                            <span className="text-sm text-[#717182]">/night</span>
                          </div>
                        </div>
                        <Button className="bg-[#2563eb] hover:bg-[#1e40af] text-white px-8">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {filteredHotels.length === 0 && (
              <Card className="p-12 text-center">
                <p className="text-xl text-[#717182] mb-4">No hotels found matching your criteria</p>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setLocationFilter('');
                    setPriceRange([0, 500]);
                    setSelectedStars([]);
                    setSelectedAmenities([]);
                  }}
                >
                  Clear Filters
                </Button>
              </Card>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
