import { useState } from "react";
import { Link } from "react-router";
import {
  Heart,
  Star,
  MapPin,
  Wifi,
  Utensils,
  ParkingSquare,
  Dumbbell,
  Trash2,
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { useCurrency } from "../contexts/CurrencyContext";

// Mock favorite hotels data
const initialFavorites = [
  {
    id: 1,
    name: "The Grand Palace Hotel",
    location: "Paris, France",
    neighborhood: "Champs-Élysées",
    rating: 4.9,
    reviews: 1243,
    price: 320,
    image:
      "https://images.unsplash.com/photo-1572177215152-32f247303126?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3RlbCUyMGJlZHJvb218ZW58MXx8fHwxNzcxOTA0ODUxfDA&ixlib=rb-4.1.0&q=80&w=1080",
    stars: 5,
    amenities: ["wifi", "restaurant", "parking", "gym"],
    savedDate: "2026-02-20",
  },
  {
    id: 2,
    name: "Ocean View Resort",
    location: "Bali, Indonesia",
    neighborhood: "Seminyak",
    rating: 4.8,
    reviews: 892,
    price: 180,
    image:
      "https://images.unsplash.com/photo-1729717949782-f40c4a07e3c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWFjaCUyMHJlc29ydCUyMGhvdGVsfGVufDF8fHx8MTc3MTg1Mjk5Nnww&ixlib=rb-4.1.0&q=80&w=1080",
    stars: 4,
    amenities: ["wifi", "restaurant", "gym"],
    savedDate: "2026-02-18",
  },
  {
    id: 3,
    name: "Metropolitan Suites",
    location: "New York, USA",
    neighborhood: "Manhattan",
    rating: 4.7,
    reviews: 1567,
    price: 280,
    image:
      "https://images.unsplash.com/photo-1731336478850-6bce7235e320?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3RlbCUyMHN1aXRlJTIwbHV4dXJ5fGVufDF8fHx8MTc3MTgxOTE3Nnww&ixlib=rb-4.1.0&q=80&w=1080",
    stars: 5,
    amenities: ["wifi", "restaurant", "parking", "gym"],
    savedDate: "2026-02-15",
  },
  {
    id: 4,
    name: "Skyline Boutique Hotel",
    location: "Tokyo, Japan",
    neighborhood: "Shibuya",
    rating: 4.9,
    reviews: 723,
    price: 240,
    image:
      "https://images.unsplash.com/photo-1664908790579-34b71154f603?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib3V0aXF1ZSUyMGhvdGVsJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzcxODA2NDA3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    stars: 4,
    amenities: ["wifi", "restaurant", "gym"],
    savedDate: "2026-02-10",
  },
  {
    id: 5,
    name: "City Lights Premium",
    location: "Dubai, UAE",
    neighborhood: "Downtown Dubai",
    rating: 4.8,
    reviews: 1034,
    price: 350,
    image:
      "https://images.unsplash.com/photo-1661191891844-2e7980ae1c94?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwaG90ZWwlMjByb290dG9wfGVufDF8fHx8MTc3MTkwNDg1Mnww&ixlib=rb-4.1.0&q=80&w=1080",
    stars: 5,
    amenities: ["wifi", "restaurant", "parking", "gym"],
    savedDate: "2026-02-08",
  },
  {
    id: 6,
    name: "Riverside Luxury Inn",
    location: "London, UK",
    neighborhood: "Westminster",
    rating: 4.6,
    reviews: 956,
    price: 290,
    image:
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBob3RlbCUyMGxvYmJ5fGVufDF8fHx8MTc3MTkwNDg1M3ww&ixlib=rb-4.1.0&q=80&w=1080",
    stars: 5,
    amenities: ["wifi", "restaurant", "parking", "gym"],
    savedDate: "2026-02-05",
  },
  {
    id: 7,
    name: "Coastal Paradise Hotel",
    location: "Santorini, Greece",
    neighborhood: "Oia",
    rating: 4.9,
    reviews: 1678,
    price: 380,
    image:
      "https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlY2UlMjBob3RlbCUyMHNhbnRvcmluaXxlbnwxfHx8fDE3NzE5MDQ4NTN8MA&ixlib=rb-4.1.0&q=80&w=1080",
    stars: 5,
    amenities: ["wifi", "restaurant", "gym"],
    savedDate: "2026-02-01",
  },
  {
    id: 8,
    name: "Alpine Chalet Resort",
    location: "Zurich, Switzerland",
    neighborhood: "Alps View",
    rating: 4.7,
    reviews: 645,
    price: 420,
    image:
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGhvdGVsJTIwc3dpdHplcmxhbmR8ZW58MXx8fHwxNzcxOTA0ODU0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    stars: 4,
    amenities: ["wifi", "restaurant", "parking", "gym"],
    savedDate: "2026-01-28",
  },
];

const amenityIcons = {
  wifi: Wifi,
  restaurant: Utensils,
  parking: ParkingSquare,
  gym: Dumbbell,
};

export function FavoritesPage() {
  const { convertPrice } = useCurrency();
  const [favorites, setFavorites] = useState(initialFavorites);
  const [sortBy, setSortBy] = useState<
    "recent" | "price-low" | "price-high" | "rating"
  >("recent");

  const handleRemoveFavorite = (id: number) => {
    setFavorites(favorites.filter((hotel) => hotel.id !== id));
  };

  // Sort favorites
  const sortedFavorites = [...favorites].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "rating":
        return b.rating - a.rating;
      case "recent":
      default:
        return (
          new Date(b.savedDate).getTime() -
          new Date(a.savedDate).getTime()
        );
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="font-bold text-[#1f2937] mb-2">
              My Favorites
            </h1>
            <p className="text-[#6b7280]">
              {favorites.length} saved hotel
              {favorites.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-4">
            <label
              htmlFor="sort"
              className="text-sm text-[#6b7280]"
            >
              Sort by:
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-[#1f2937] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
            >
              <option value="recent">Recently Added</option>
              <option value="price-low">
                Price: Low to High
              </option>
              <option value="price-high">
                Price: High to Low
              </option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Favorites Grid */}
        {sortedFavorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedFavorites.map((hotel) => (
              <Card
                key={hotel.id}
                className="overflow-hidden border-gray-200 hover:shadow-xl transition-all duration-300 group"
              >
                {/* Image */}
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={hotel.image}
                    alt={hotel.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <button
                    onClick={() =>
                      handleRemoveFavorite(hotel.id)
                    }
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/90 hover:bg-white text-[#ef4444] transition-colors shadow-lg"
                    aria-label="Remove from favorites"
                  >
                    <Heart className="w-5 h-5 fill-current" />
                  </button>
                  <Badge className="absolute top-4 left-4 bg-[#2563eb] hover:bg-[#1d4ed8]">
                    {hotel.stars} Star
                    {hotel.stars !== 1 ? "s" : ""}
                  </Badge>
                </div>

                {/* Content */}
                <div className="p-6">
                  <Link
                    to={`/hotel/${hotel.id}`}
                    className="block group-hover:text-[#2563eb] transition-colors"
                  >
                    <h3 className="font-bold text-[#1f2937] mb-2 line-clamp-1">
                      {hotel.name}
                    </h3>
                  </Link>

                  <div className="flex items-center gap-2 text-sm text-[#6b7280] mb-3">
                    <MapPin className="w-4 h-4" />
                    <span className="line-clamp-1">
                      {hotel.location}
                    </span>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1 bg-[#2563eb] text-white px-2 py-1 rounded">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-semibold">
                        {hotel.rating}
                      </span>
                    </div>
                    <span className="text-sm text-[#6b7280]">
                      ({hotel.reviews} reviews)
                    </span>
                  </div>

                  {/* Amenities */}
                  <div className="flex gap-3 mb-4">
                    {hotel.amenities
                      .slice(0, 4)
                      .map((amenity) => {
                        const Icon =
                          amenityIcons[
                            amenity as keyof typeof amenityIcons
                          ];
                        return (
                          <div
                            key={amenity}
                            className="p-2 bg-gray-100 rounded-lg"
                            title={amenity}
                          >
                            <Icon className="w-4 h-4 text-[#6b7280]" />
                          </div>
                        );
                      })}
                  </div>

                  {/* Price & CTA */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div>
                      <div className="font-bold text-[#2563eb]">
                        {convertPrice(hotel.price)}
                      </div>
                      <div className="text-xs text-[#6b7280]">
                        per night
                      </div>
                    </div>
                    <Link to={`/hotel/${hotel.id}`}>
                      <Button
                        size="sm"
                        className="bg-[#2563eb] hover:bg-[#1d4ed8]"
                      >
                        View Details
                      </Button>
                    </Link>
                  </div>

                  {/* Saved Date */}
                  <div className="text-xs text-[#9ca3af] mt-3">
                    Saved on{" "}
                    {new Date(
                      hotel.savedDate,
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center border-gray-200">
            <Heart className="w-16 h-16 text-[#6b7280] mx-auto mb-4" />
            <h3 className="font-semibold text-[#1f2937] mb-2">
              No Favorites Yet
            </h3>
            <p className="text-[#6b7280] mb-6">
              Start adding hotels to your favorites to see them
              here.
            </p>
            <Link to="/hotels">
              <Button className="bg-[#2563eb] hover:bg-[#1d4ed8]">
                Browse Hotels
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}