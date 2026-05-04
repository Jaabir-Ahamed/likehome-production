import { useEffect, useState, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface MapComponentProps {
  location: string;
  height?: string;
  className?: string;
}

type GeoState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; embedUrl: string }
  | { status: 'error' };

/** Nominatim search — https://nominatim.org/release-docs/develop/api/Search/ */
const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search';

function buildEmbedUrl(lat: number, lon: number, west: number, south: number, east: number, north: number): string {
  let minLon = west;
  let minLat = south;
  let maxLon = east;
  let maxLat = north;

  const latSpan = Math.max(maxLat - minLat, 1e-6);
  const lonSpan = Math.max(maxLon - minLon, 1e-6);
  const padLat = Math.max(latSpan * 0.15, 0.08);
  const padLon = Math.max(lonSpan * 0.15, 0.08);

  minLon -= padLon;
  maxLon += padLon;
  minLat -= padLat;
  maxLat += padLat;

  const bbox = `${minLon},${minLat},${maxLon},${maxLat}`;
  const marker = `${lat},${lon}`;
  const params = new URLSearchParams({
    bbox,
    layer: 'mapnik',
    marker,
  });
  return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
}

export function MapComponent({ location, height = '400px', className = '' }: MapComponentProps) {
  const [geo, setGeo] = useState<GeoState>({ status: 'idle' });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const trimmed = location.trim();
  const genericLabels = new Set(['search results', 'hotels in various locations', '']);
  const shouldGeocode = trimmed.length > 0 && !genericLabels.has(trimmed.toLowerCase());

  useEffect(() => {
    if (!shouldGeocode) {
      setGeo({ status: 'idle' });
      return;
    }

    setGeo({ status: 'loading' });

    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();

    debounceRef.current = setTimeout(() => {
      const ac = new AbortController();
      abortRef.current = ac;

      const params = new URLSearchParams({
        q: trimmed,
        format: 'json',
        limit: '1',
        addressdetails: '0',
      });

      fetch(`${NOMINATIM_SEARCH}?${params.toString()}`, {
        signal: ac.signal,
        headers: {
          Accept: 'application/json',
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Geocoding failed');
          return res.json() as Promise<
            Array<{
              lat: string;
              lon: string;
              boundingbox?: [string, string, string, string];
            }>
          >;
        })
        .then((data) => {
          const hit = data?.[0];
          if (!hit) {
            setGeo({ status: 'error' });
            return;
          }
          const lat = parseFloat(hit.lat);
          const lon = parseFloat(hit.lon);
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
            setGeo({ status: 'error' });
            return;
          }

          let west: number;
          let south: number;
          let east: number;
          let north: number;

          if (hit.boundingbox && hit.boundingbox.length >= 4) {
            const [southStr, northStr, westStr, eastStr] = hit.boundingbox;
            south = parseFloat(southStr);
            north = parseFloat(northStr);
            west = parseFloat(westStr);
            east = parseFloat(eastStr);
          } else {
            const d = 0.25;
            west = lon - d;
            east = lon + d;
            south = lat - d;
            north = lat + d;
          }

          if (![west, south, east, north].every(Number.isFinite)) {
            setGeo({ status: 'error' });
            return;
          }

          const embedUrl = buildEmbedUrl(lat, lon, west, south, east, north);
          setGeo({ status: 'ok', embedUrl });
        })
        .catch((err) => {
          if (err?.name === 'AbortError') return;
          setGeo({ status: 'error' });
        });
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, [trimmed, shouldGeocode]);

  const embedUrl = geo.status === 'ok' ? geo.embedUrl : null;
  const placeholderMessage =
    !shouldGeocode || geo.status === 'idle'
      ? 'Enter a destination in search to see it on the map.'
      : geo.status === 'error'
        ? 'Could not place this search on the map. Try a more specific place name.'
        : '';

  return (
    <div className={`relative rounded-lg overflow-hidden border border-gray-200 ${className}`} style={{ height }}>
      {geo.status === 'loading' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-100/90 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-[#2563eb]" aria-hidden />
          <span className="text-sm text-subtle-text">Locating on map…</span>
        </div>
      )}

      {embedUrl ? (
        <iframe
          key={embedUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          style={{ border: 0 }}
          src={embedUrl}
          title={`Map of ${location}`}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
          <p className="text-sm text-subtle-text px-6 text-center">{placeholderMessage}</p>
        </div>
      )}

      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 max-w-[min(90%,24rem)]">
        <MapPin className="w-5 h-5 text-[#2563eb] shrink-0" aria-hidden />
        <span className="font-medium text-[#1f2937] truncate" title={location}>
          {location}
        </span>
      </div>
    </div>
  );
}
