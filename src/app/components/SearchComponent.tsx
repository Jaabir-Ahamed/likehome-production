import { MapPin, Calendar, Users, Search, Loader2, Plus, Minus, X, BedDouble } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../../api/liteApi';

type Place = {
  placeId: string;
  displayName: string;
  formattedAddress: string;
  types: string[];
};

export type Occupancy = {
  adults: number;
  children: number[]; // ages
};

const STORAGE_KEY = 'likehome_search';

function dateToString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDefaultDates() {
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 7);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 2);
  return { checkIn: dateToString(checkIn), checkOut: dateToString(checkOut) };
}

function loadStored(): { checkIn: string; checkOut: string; occupancies: Occupancy[] } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveStored(checkIn: string, checkOut: string, occupancies: Occupancy[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ checkIn, checkOut, occupancies }));
  } catch {
    // ignore
  }
}

function summarizeOccupancies(occupancies: Occupancy[]) {
  const rooms = occupancies.length;
  const guests = occupancies.reduce((sum, o) => sum + o.adults + o.children.length, 0);
  return `${rooms} room${rooms !== 1 ? 's' : ''} · ${guests} guest${guests !== 1 ? 's' : ''}`;
}

export function SearchComponent({ initialLocation = '', initialPlaceId = '' }) {
  const navigate = useNavigate();

  const defaults = getDefaultDates();
  const stored = loadStored();

  const [location, setLocation] = useState(initialLocation);
  const [checkIn, setCheckIn] = useState(stored?.checkIn ?? defaults.checkIn);
  const [checkOut, setCheckOut] = useState(stored?.checkOut ?? defaults.checkOut);
  const [occupancies, setOccupancies] = useState<Occupancy[]>(
    stored?.occupancies ?? [{ adults: 2, children: [] }]
  );

  const [places, setPlaces] = useState<Place[]>([]);
  const [showPlaces, setShowPlaces] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState(initialPlaceId);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [showRooms, setShowRooms] = useState(false);

  const placesRef = useRef<HTMLDivElement>(null);
  const roomsRef = useRef<HTMLDivElement>(null);

  const localToday = dateToString(new Date());

  const [hasUserTyped, setHasUserTyped] = useState(false);

  // Persist dates + occupancies on change
  useEffect(() => {
    saveStored(checkIn, checkOut, occupancies);
  }, [checkIn, checkOut, occupancies]);

  // Debounced place search
  useEffect(() => {
    if (!location.trim() || selectedPlaceId) {
      setPlaces([]);
      setShowPlaces(false);
      return;
    }
    if (!hasUserTyped) return;
    const timer = setTimeout(async () => {
      setIsLoadingPlaces(true);
      try {
        const result = await api.getPlaces(location);
        const data: Place[] = result?.data ?? [];
        setPlaces(data);
        setShowPlaces(data.length > 0);
      } catch {
        setPlaces([]);
        setShowPlaces(false);
      } finally {
        setIsLoadingPlaces(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [location, selectedPlaceId]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (placesRef.current && !placesRef.current.contains(e.target as Node)) {
        setShowPlaces(false);
      }
      if (roomsRef.current && !roomsRef.current.contains(e.target as Node)) {
        setShowRooms(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handlePlaceSelect = (place: Place) => {
    setLocation(place.displayName);
    setSelectedPlaceId(place.placeId);
    setShowPlaces(false);
    setPlaces([]);
  };

  const handleSearch = () => {
    const queryParams = new URLSearchParams({
      checkIn,
      checkOut,
      occupancies: JSON.stringify(occupancies),
    });
    if (selectedPlaceId) {
      queryParams.set('placeId', selectedPlaceId);
      queryParams.set('location', location);
    } else if (location.trim()) {
      queryParams.set('location', location.trim());
    }
    console.log(queryParams.toString());
    navigate(`/hotels?${queryParams.toString()}`);
  };

  // Occupancy helpers
  const updateAdults = (roomIdx: number, delta: number) => {
    setOccupancies(prev =>
      prev.map((o, i) =>
        i === roomIdx ? { ...o, adults: Math.max(1, o.adults + delta) } : o
      )
    );
  };

  const addChild = (roomIdx: number) => {
    setOccupancies(prev =>
      prev.map((o, i) =>
        i === roomIdx ? { ...o, children: [...o.children, 5] } : o
      )
    );
  };

  const updateChildAge = (roomIdx: number, childIdx: number, age: number) => {
    setOccupancies(prev =>
      prev.map((o, i) =>
        i === roomIdx
          ? { ...o, children: o.children.map((a, j) => (j === childIdx ? Math.max(0, Math.min(17, age)) : a)) }
          : o
      )
    );
  };

  const removeChild = (roomIdx: number, childIdx: number) => {
    setOccupancies(prev =>
      prev.map((o, i) =>
        i === roomIdx ? { ...o, children: o.children.filter((_, j) => j !== childIdx) } : o
      )
    );
  };

  const addRoom = () => {
    setOccupancies(prev => [...prev, { adults: 2, children: [] }]);
  };

  const removeRoom = (roomIdx: number) => {
    setOccupancies(prev => prev.filter((_, i) => i !== roomIdx));
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-card rounded-2xl shadow-2xl p-6 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">

        {/* Location */}
        <div className="md:col-span-4">
          <label className="block text-sm font-medium text-bold-text mb-2">Location</label>
          <div className="relative" ref={placesRef}>
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#717182] z-10" />
            {isLoadingPlaces && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#717182] animate-spin z-10" />
            )}
            <Input
              type="text"
              placeholder="Where are you going?"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setSelectedPlaceId('');
                setHasUserTyped(true);
              }}
              onFocus={() => places.length > 0 && setShowPlaces(true)}
              className="pl-10 h-12 bg-input-background border-0 focus:ring-2 focus:ring-[#2563eb]"
            />
            {showPlaces && places.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 max-h-64 overflow-y-auto">
                {places.map((place) => (
                  <button
                    key={place.placeId}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handlePlaceSelect(place)}
                    className="w-full flex items-start gap-3 px-4 py-3 bg-background hover:bg-background/70 dark:hover:bg-background/90 text-left transition-color cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-[#717182] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-bold-text">{place.displayName}</p>
                      <p className="text-xs text-[#717182]">{place.formattedAddress}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Check-in */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-bold-text mb-2">Check-in</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#717182]" />
            <Input
              type="date"
              value={checkIn}
              min={localToday}
              onChange={(e) => {
                const val = e.target.value;
                setCheckIn(val);
                // Push checkout forward if needed
                const minOut = new Date(val + 'T00:00:00');
                minOut.setDate(minOut.getDate() + 1);
                if (!checkOut || checkOut <= val) {
                  setCheckOut(dateToString(minOut));
                }
              }}
              className="pl-10 h-12 bg-input-background border-0 focus:ring-2 focus:ring-[#2563eb] cursor-pointer"
            />
          </div>
        </div>

        {/* Check-out */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-bold-text mb-2">Check-out</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#717182]" />
            <Input
              type="date"
              value={checkOut}
              min={(() => { const d = new Date(checkIn + 'T00:00:00'); d.setDate(d.getDate() + 1); return dateToString(d); })()}
              onChange={(e) => setCheckOut(e.target.value)}
              className="pl-10 h-12 bg-input-background border-0 focus:ring-2 focus:ring-[#2563eb] cursor-pointer"
            />
          </div>
        </div>

        {/* Occupancies */}
        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-bold-text mb-2">Rooms & Guests</label>
          <div className="relative" ref={roomsRef}>
            <button
              type="button"
              onClick={() => setShowRooms((v) => !v)}
              className="w-full h-12 bg-input-background rounded-lg flex items-center gap-2 px-3 text-sm text-[#1f2937] transition-colors cursor-pointer"
            >
              <Users className="w-5 h-5 text-[#717182] shrink-0" />
              <span className="truncate text-medium text-foreground">{summarizeOccupancies(occupancies)}</span>
            </button>

            {showRooms && (
              <div className="absolute z-50 top-full right-0 mt-1 bg-[var(--room-input)] rounded-xl shadow-xl border border-gray-100 w-80 p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                {occupancies.map((room, ri) => (
                  <div key={ri} className="border border-gray-100 rounded-lg p-3 space-y-3">
                    {/* Room header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-bold-text">
                        <BedDouble className="w-4 h-4" />
                        Room {ri + 1}
                      </div>
                      {occupancies.length > 1 && (
                        <button
                          onClick={() => removeRoom(ri)}
                          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 text-[#717182] hover:text-red-500 transition-colors"
                          aria-label="Remove room"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Adults */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-bold-text">Adults</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateAdults(ri, -1)}
                          className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                          disabled={room.adults <= 1}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center text-sm font-medium">{room.adults}</span>
                        <button
                          onClick={() => updateAdults(ri, 1)}
                          className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Children */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-bold-text">Children</span>
                        <button
                          onClick={() => addChild(ri)}
                          className="text-xs text-[#2563eb] hover:underline flex items-center gap-1 cursor-pointer "
                        >
                          <Plus className="w-3 h-3" /> Add child
                        </button>
                      </div>
                      {room.children.map((age, ci) => (
                        <div key={ci} className="flex items-center gap-2">
                          <span className="text-xs text-[#717182] w-16 shrink-0">Age</span>
                          <input
                            type="number"
                            min={0}
                            max={17}
                            value={age}
                            onChange={(e) => updateChildAge(ri, ci, Number(e.target.value))}
                            className="w-16 h-7 text-center text-sm border border-gray-200 rounded px-1 focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                          />
                          <button
                            onClick={() => removeChild(ri, ci)}
                            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 text-[#717182] hover:text-red-500 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Add room */}
                <button
                  onClick={addRoom}
                  className="w-full h-9 border border-dashed border-gray-300 rounded-lg text-sm text-[#2563eb] hover:border-[#2563eb] hover:bg-blue-50 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add room
                </button>

                <Button
                  size="sm"
                  onClick={() => setShowRooms(false)}
                  className="w-full bg-[#2563eb] hover:bg-[#1e40af] text-white cursor-pointer"
                >
                  Done
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Search Button */}
        <div className="md:col-span-1">
          <Button
            onClick={handleSearch}
            className="w-20 h-12 cursor-pointer bg-secondary hover:bg-secondary/70 text-white font-medium rounded-lg transition-colors px-3"
          >
            <Search className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
