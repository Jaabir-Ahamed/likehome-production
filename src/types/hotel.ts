/** Place row from `places` edge / LiteAPI (normalized for UI) */
export type Place = {
  placeId: string;
  displayName: string;
  formattedAddress: string;
  types: string[];
};

/** Hotel card row (listing) — merged from list-hotels + hotel-rate where possible */
export type NormalizedHotel = {
  hotelId: string | null;
  name: string | null;
  image: string | null;
  address: string | null;
  city?: string | null;
  country?: string | null;
  starRating: number;
  reviewRating?: number;
  reviewCount?: number;
  price: number | null;
  currency: string;
};
