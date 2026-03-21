import { Star, MapPin, Heart } from 'lucide-react';
import { Link } from 'react-router';
import { Card } from './ui/card';
import { Button } from './ui/button';
import type { NormalizedHotel } from '../../types/hotel';

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80';

function formatPrice(price: number | null, currency: string): string | null {
  if (price === null || price === undefined) return null;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    // Fallback if currency code is unrecognised
    return `${currency} ${Math.round(price)}`;
  }
}

interface HotelCardProps {
  hotel: NormalizedHotel;
}

export function HotelCard({ hotel }: HotelCardProps) {
  const stars = Math.round(hotel.starRating ?? 0);
  const formattedPrice = formatPrice(hotel.price, hotel.currency);

  // address field from the edge function contains city (or "Location unavailable")
  const locationText = hotel.address || hotel.city || null;

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="md:w-1/3 relative group overflow-hidden">
          <img
            src={hotel.image ?? PLACEHOLDER_IMAGE}
            alt={hotel.name ?? 'Hotel image'}
            className="w-full h-64 md:h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
            }}
          />
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
            aria-label="Save to favourites"
          >
            <Heart className="w-5 h-5 text-[#1f2937]" />
          </button>
        </div>

        {/* Details */}
        <div className="md:w-2/3 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0 pr-3">
                {/* Name — sourced from hotel.name */}
                <h3 className="text-2xl font-bold text-[#1f2937] mb-2 truncate">
                  {hotel.name ?? 'Hotel'}
                </h3>

                {/* Location — sourced from hotel.address */}
                {locationText && locationText !== 'Location unavailable' && (
                  <p className="text-sm text-[#717182] flex items-center gap-1 mb-2">
                    <MapPin className="w-4 h-4 shrink-0" />
                    {locationText}
                  </p>
                )}

                {/* Star rating */}
                {stars > 0 && (
                  <div className="flex items-center gap-1 mb-1">
                    {Array.from({ length: Math.min(stars, 5) }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]" />
                    ))}
                  </div>
                )}
              </div>

              {/* Guest rating badge */}
              {(hotel.reviewRating ?? 0) > 0 && (
                <div className="shrink-0 bg-[#2563eb] text-white px-3 py-1.5 rounded-lg flex items-center gap-1">
                  <Star className="w-4 h-4 fill-white" />
                  <span className="font-bold">{hotel.reviewRating}</span>
                </div>
              )}
            </div>

            {(hotel.reviewCount ?? 0) > 0 && (
              <p className="text-xs text-[#717182]">
                {hotel.reviewCount!.toLocaleString()} reviews
              </p>
            )}
          </div>

          {/* Price + CTA */}
          <div className="flex items-end justify-between mt-4 pt-4 border-t">
            <div>
              {formattedPrice ? (
                <>
                  <p className="text-sm text-[#717182] mb-1">Starting from</p>
                  <div className="flex items-baseline gap-1">
                    {/* Price — formatted via Intl.NumberFormat using hotel.currency */}
                    <span className="text-3xl font-bold text-[#1f2937]">
                      {formattedPrice}
                    </span>
                    <span className="text-sm text-[#717182]">/night</span>
                  </div>
                </>
              ) : (
                <p className="text-sm font-medium text-[#717182]">Check Availability</p>
              )}
            </div>
            <Button
              asChild
              className="bg-[#2563eb] hover:bg-[#1e40af] text-white px-8"
            >
              <Link to={`/hotel/${hotel.hotelId}`}>View Details</Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
