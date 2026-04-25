export interface HotelImage {
    url: string;
    urlHd: string;
    caption: string;
    defaultImage: boolean;
}

export interface BedType {
    quantity: number;
    bedType: string;
    bedSize: string;
}

export interface RoomAmenity {
    amenitiesId: number;
    name: string;
}

export interface RoomPhoto {
    url: string;
    mainPhoto: boolean;
    hd_url?: string;
    imageDescription?: string;
    imageClass1?: string;
    imageClass2?: string;
}

export interface Room {
    id: number;
    roomName: string;
    description: string;
    roomSizeSquare: number | null;
    roomSizeUnit: string;
    maxOccupancy: number;
    maxAdults?: number;
    maxChildren?: number;
    bedTypes: BedType[];
    roomAmenities: RoomAmenity[];
    photos: RoomPhoto[];
}

export interface Policy {
    id: number;
    name: string;
    description: string;
}

export interface SentimentCategory {
    name: string;
    rating: number;
}

export interface HotelDetails {
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

export interface CancellationPolicyInfo {
    amount?: number;
    from?: string;
    currency?: string;
}

export interface CancellationPolicy {
    refundableTag?: string;
    cancelPolicyInfos?: CancellationPolicyInfo[];
}

export interface RateMoney {
    amount: number;
    currency: string;
}

export interface Rate {
    rateId: string;
    name: string;
    offerId: string;
    roomTypeId?: string | number;
    mappedRoomId?: string | number;
    occupancyNumber: number;
    boardName?: string;
    boardType?: string;
    maxOccupancy?: number;
    adultCount?: number;
    childCount?: number;
    cancellationPolicies?: CancellationPolicy[];
    retailRate?: {
        total?: RateMoney[];
        taxesAndFees?: RateMoney[];
    };
    suggestedSellingPrice?: {
        total?: RateMoney[];
    };
}