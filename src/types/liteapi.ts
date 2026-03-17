export interface LiteApiHotel {
  id: string;
  name: string;
  hotelDescription: string;
  hotelTypeId: number;
  chain: string;
  currency: string;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  address: string;
  zip: string;
  main_photo: string;
  thumbnail: string;
  stars: number;
  rating: number;
  reviewCount: number;
  facilityIds: number[];
}

export interface PriceAmount {
  amount: number;
  currency: string;
}

export interface CancellationPolicy {
  cancelPolicyInfos: {
    cancelTime: string;
    amount: number;
    currency: string;
    type: string;
  }[];
  hotelRemarks: string[];
  refundableTag: "RFN" | "NRFN";
}

export interface RoomRate {
  rateId: string;
  occupancyNumber: number;
  name: string;
  maxOccupancy: number;
  adultCount: number;
  childCount: number;
  boardType: string;
  boardName: string;
  remarks: string;
  retailRate: {
    total: PriceAmount[];
    suggestedSellingPrice: PriceAmount[];
    initialPrice: PriceAmount[];
    taxesAndFees: PriceAmount[] | null;
  };
  cancellationPolicies: CancellationPolicy;
}

export interface RoomType {
  roomTypeId: string;
  offerId: string;
  supplier: string;
  supplierId: number;
  rates: RoomRate[];
  offerRetailRate: PriceAmount;
  suggestedSellingPrice: PriceAmount;
  offerInitialPrice: PriceAmount;
  rateType: string;
}

export interface HotelRateResult {
  hotelId: string;
  roomTypes: RoomType[];
}

export interface HotelRatesResponse {
  data: HotelRateResult[];
  hotels: {
    id: string;
    name: string;
    main_photo: string;
    address: string;
    rating: number;
  }[];
  sandbox: boolean;
}

export interface SearchHotelResult extends LiteApiHotel {
  rates: HotelRateResult | null;
  lowestRate: number | null;
}

export interface SearchHotelsResponse {
  data: SearchHotelResult[];
}

export interface SearchHotelRatesParams {
  countryCode?: string;
  cityName?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  checkin: string;
  checkout: string;
  adults: number;
  rooms: number;
  currency: string;
  guestNationality: string;
  limit?: number;
  minRating?: number;
  starRating?: string;
  facilityIds?: string;
  userId?: string;
}

export interface PrebookResponse {
  prebookId: string;
  offerId: string;
  hotelId: string;
  roomTypes: {
    rates: {
      name: string;
      maxOccupancy: number;
      boardName: string;
      retailRate: { total: PriceAmount[] };
      cancellationPolicies: CancellationPolicy;
    }[];
  }[];
  currency: string;
  totalAmount: number;
}

export interface BookRequest {
  prebookId: string;
  holder: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  guests: {
    occupancyNumber: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  }[];
  payment?: {
    method: string;
  };
}

export interface BookResponse {
  bookingId: string;
  status: string;
  hotelConfirmationCode: string;
  holder: {
    firstName: string;
    lastName: string;
    email: string;
  };
  hotel: {
    hotelId: string;
    name: string;
    address: string;
  };
  checkin: string;
  checkout: string;
  totalAmount: number;
  currency: string;
}

export interface HotelDetail {
  id: string;
  name: string;
  hotelDescription: string;
  chain: string;
  currency: string;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  address: string;
  zip: string;
  main_photo: string;
  stars: number;
  rating: number;
  reviewCount: number;
  facilityIds: number[];
  images: string[];
  rooms: {
    roomId: string;
    name: string;
    maxOccupancy: number;
    images: string[];
  }[];
  facilities: {
    id: number;
    name: string;
  }[];
  checkinTime: string;
  checkoutTime: string;
}
