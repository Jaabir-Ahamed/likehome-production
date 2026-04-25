import type {BedType, Rate, Room} from '../types/hotel';

export function stripHtml(html?: string) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function normalizeRoomName(value?: string) {
    return (value ?? '')
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/\(.*?\)/g, ' ')
        .replace(/no air conditioning/g, ' ')
        .replace(/hearing impaired/g, ' ')
        .replace(/accessible/g, ' ')
        .replace(/room only/g, ' ')
        .replace(/non-refundable/g, ' ')
        .replace(/free cancellation/g, ' ')
        .replace(/[\-_/(),]/g, ' ')
        .replace(/\b1 bedroom\b/g, 'suite')
        .replace(/\bqueen bed\b/g, 'queen')
        .replace(/\bqueen room\b/g, 'queen')
        .replace(/\btwo double beds\b/g, 'double double')
        .replace(/\bdeluxe two double beds\b/g, 'double double')
        .replace(/\btwin room\b/g, 'twin')
        .replace(/\btwo twin beds\b/g, 'twin')
        .replace(/\bsuperior\b/g, 'deluxe')
        .replace(/\bclassic\b/g, 'standard')
        .replace(/\s+/g, ' ')
        .trim();
}

export function getRoomNameTokens(value?: string) {
    return new Set(
        normalizeRoomName(value)
            .split(' ')
            .filter(Boolean)
            .filter((token) => !['room', 'suite', 'deluxe', 'standard'].includes(token))
    );
}

export function scoreRoomMatch(rateName: string, roomName: string) {
    const a = getRoomNameTokens(rateName);
    const b = getRoomNameTokens(roomName);

    if (!a.size || !b.size) return 0;

    let overlap = 0;
    for (const token of a) {
        if (b.has(token)) overlap++;
    }

    const baseScore = overlap / Math.max(a.size, b.size);

    const normalizedRate = normalizeRoomName(rateName);
    const normalizedRoom = normalizeRoomName(roomName);

    let boost = 0;
    if (normalizedRate === normalizedRoom) boost += 1;
    if (normalizedRate.includes('queen') && normalizedRoom.includes('queen')) boost += 0.2;
    if (normalizedRate.includes('twin') && normalizedRoom.includes('twin')) boost += 0.2;
    if (normalizedRate.includes('double') && normalizedRoom.includes('double')) boost += 0.2;
    if (normalizedRate.includes('suite') && normalizedRoom.includes('suite')) boost += 0.25;
    if (normalizedRate.includes('hearing') && normalizedRoom.includes('hearing')) boost += 0.25;

    return baseScore + boost;
}

export function findBestHotelRoomMatch(rate: Rate, rooms: Room[]) {
    if (!rooms?.length) return null;

    const mappedRoomId = String(rate.mappedRoomId ?? '');
    const directMapped = rooms.find((room: Room & { mappedRoomId?: string | number }) => {
        return String(room.mappedRoomId ?? '') === mappedRoomId;
    });

    if (mappedRoomId && directMapped) return directMapped;

    let best: Room | null = null;
    let bestScore = 0;

    for (const room of rooms) {
        const score = scoreRoomMatch(rate.name, room.roomName);
        if (score > bestScore) {
            bestScore = score;
            best = room;
        }
    }

    return bestScore >= 0.45 ? best : null;
}

export function formatBeds(bedTypes?: BedType[]) {
    if (!bedTypes?.length) return null;
    return bedTypes.map((bed) => `${bed.quantity} ${bed.bedType}`).join(', ');
}

export function getTopAmenities(room?: Room | null, limit = 6) {
    if (!room?.roomAmenities?.length) return [];
    return room.roomAmenities
        .map((a) => a.name)
        .filter(Boolean)
        .slice(0, limit);
}

export function isRateRefundable(rate: Rate) {
    const cancelPolicy = rate.cancellationPolicies?.[0];
    return (
        cancelPolicy?.cancelPolicyInfos?.[0]?.amount === 0 ||
        cancelPolicy?.refundableTag?.toLowerCase().includes('refundable') ||
        false
    );
}