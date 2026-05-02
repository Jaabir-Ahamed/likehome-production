import {useEffect, useMemo, useState} from 'react';
import {Bed, Check} from 'lucide-react';
import {Badge} from '../components/ui/badge';
import {Button} from '../components/ui/button';
import type {Rate, Room} from '../../types/hotel';
import {formatBeds, getTopAmenities, isRateRefundable, stripHtml} from '../../lib/roomMatching';

export function RoomRateCard({
                                 rate,
                                 room,
                                 actualNights,
                                 isSelected,
                                 onSelect,
                                 fallbackImage,
                             }: {
    rate: Rate;
    room: Room | null;
    actualNights: number;
    isSelected: boolean;
    onSelect: () => void;
    fallbackImage?: string | null;
}) {
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

    const roomPhotos = useMemo(
        () =>
            room?.photos?.length
                ? room.photos.map((photo) => photo.hd_url || photo.url).filter(Boolean)
                : [],
        [room]
    );

    useEffect(() => {
        setSelectedPhotoIndex(0);
    }, [room?.id, rate.rateId]);

    const primaryPhoto = roomPhotos[0] ?? fallbackImage ?? null;
    const displayedPhoto = roomPhotos[selectedPhotoIndex] ?? primaryPhoto ?? null;

    const price = rate.retailRate?.total?.[0]?.amount;
    const currency = rate.retailRate?.total?.[0]?.currency ?? 'USD';
    const taxes = rate.retailRate?.taxesAndFees?.[0]?.amount;
    const pricePerNight = price != null ? price / actualNights : null;

    const beds = formatBeds(room?.bedTypes);
    const amenities = getTopAmenities(room, 6);
    const roomDescription = stripHtml(room?.description);
    const freeCancellation = isRateRefundable(rate);

    return (
        <div
            className={`border rounded-xl overflow-hidden transition-all ${
                isSelected ? 'border-2' : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
        >
            <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] bg-card">
                <div className="border-b md:border-b-0 md:border-r border-gray-200 bg-gray-100">
                    {displayedPhoto ? (
                        <div className="h-full">
                            <img
                                src={displayedPhoto}
                                alt={room?.roomName || rate.name}
                                className="w-full h-56 md:h-full max-h-[260px] object-cover"
                            />

                            {roomPhotos.length > 1 && (
                                <div className="p-2 flex gap-2 overflow-x-auto bg-white border-t border-gray-200">
                                    {roomPhotos.slice(0, 5).map((photo, idx) => (
                                        <button
                                            key={`${photo}-${idx}`}
                                            type="button"
                                            onClick={() => setSelectedPhotoIndex(idx)}
                                            className={`shrink-0 rounded-md overflow-hidden border ${
                                                selectedPhotoIndex === idx ? 'border-[#2563eb]' : 'border-gray-200'
                                            }`}
                                        >
                                            <img
                                                src={photo}
                                                alt={`${room?.roomName || rate.name} ${idx + 1}`}
                                                className="w-16 h-16 object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div
                            className="w-full h-56 md:h-full min-h-[220px] flex items-center justify-center text-sm text-[#717182]">
                            No room photo available
                        </div>
                    )}
                </div>

                <div className="p-5">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <h4 className="text-lg font-semibold text-bold-text mb-2">{room?.roomName || rate.name}</h4>

                            <div className="flex flex-wrap gap-2 mb-3">
                                {rate.boardName && (
                                    <Badge variant="secondary" className="text-xs">
                                        {rate.boardName}
                                    </Badge>
                                )}
                                {freeCancellation && (
                                    <Badge className="text-xs bg-green-100 text-green-800 hover:bg-green-100">
                                        Free cancellation
                                    </Badge>
                                )}
                                {(room?.maxOccupancy ?? rate.maxOccupancy) != null && (
                                    <Badge variant="secondary" className="text-xs">
                                        Up to {room?.maxOccupancy ?? rate.maxOccupancy} guests
                                    </Badge>
                                )}
                                {room?.roomSizeSquare ? (
                                    <Badge variant="secondary" className="text-xs">
                                        {room.roomSizeSquare} {room.roomSizeUnit}
                                    </Badge>
                                ) : null}
                            </div>

                            <div className="space-y-2 text-sm mb-4">
                                {beds && (
                                    <div className="flex items-center gap-2">
                                        <Bed className="w-4 h-4 text-[#2563eb] flex-shrink-0"/>
                                        <span className="font-medium text-bold-text">Beds:</span>
                                        <span className="text-[#717182]">{beds}</span>
                                    </div>
                                )}

                                {roomDescription && <p className="line-clamp-3 text-[#717182]">{roomDescription}</p>}
                            </div>

                            {amenities.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-sm font-medium text-bold-text mb-2">Room amenities</p>
                                    <div className="flex flex-wrap gap-2">
                                        {amenities.map((amenity) => (
                                            <Badge key={amenity} variant="outline" className="text-xs">
                                                {amenity}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="lg:w-[190px] lg:text-right shrink-0">
                            {pricePerNight != null && (
                                <>
                                    <p className="text-xl font-bold text-bold-text">
                                        {currency} {pricePerNight.toFixed(0)}
                                        <span className="text-sm font-normal text-bold-text">/night</span>
                                    </p>
                                    <p className="text-sm text-[#717182]">
                                        {currency} {price!.toFixed(0)} total
                                    </p>
                                    {taxes != null && (
                                        <p className="text-xs text-[#717182] mt-1">
                                            Includes {currency} {taxes.toFixed(0)} taxes & fees
                                        </p>
                                    )}
                                </>
                            )}

                            <Button
                                size="sm"
                                variant={isSelected ? 'default' : 'outline'}
                                className={`mt-4 w-full cursor-pointer ${isSelected ? 'bg-[#2563eb] hover:bg-[#1d4ed8]' : ''}`}
                                onClick={onSelect}
                            >
                                {isSelected ? (
                                    <>
                                        <Check className="w-3 h-3 mr-1"/>
                                        Selected
                                    </>
                                ) : (
                                    'Select'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}