import type { Place } from "../types/hotel";

/** Normalize `places` edge JSON (shape varies slightly by LiteAPI version). */
export function placesFromResponse(raw: unknown): Place[] {
  const root = raw as Record<string, unknown> | unknown[] | null | undefined;
  const list = Array.isArray(root)
    ? root
    : Array.isArray((root as { data?: unknown })?.data)
      ? ((root as { data: unknown[] }).data)
      : [];

  return list
    .map((item): Place | null => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const placeId = String(o.placeId ?? o.id ?? "");
      if (!placeId) return null;
      return {
        placeId,
        displayName: String(o.displayName ?? o.name ?? ""),
        formattedAddress: String(
          o.formattedAddress ?? o.formatted_address ?? o.address ?? ""
        ),
        types: Array.isArray(o.types) ? (o.types as string[]) : [],
      };
    })
    .filter((p): p is Place => p !== null);
}
