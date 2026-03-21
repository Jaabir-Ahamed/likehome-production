import { MapPin, Calendar, Users, Search, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../../api/liteApi';
import type { Place } from '../../types/hotel';
import { placesFromResponse } from '../../lib/placesFromApi';

export function SearchComponent() {
  const navigate = useNavigate();

  const [location, setLocation] = useState('');
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);
  const [rooms, setRooms] = useState(1);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const localToday = getToday();

  function dateToString(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Debounced place search
  useEffect(() => {
    if (placeId) return;

    const query = location.trim();
    if (query.length < 2) {
      setPlaces([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingPlaces(true);
      try {
        const raw = await api.getPlaces(query);
        const results = placesFromResponse(raw);
        setPlaces(results);
        setShowDropdown(results.length > 0);
        setHighlightedIndex(-1);
      } catch {
        setPlaces([]);
        setShowDropdown(false);
      } finally {
        setIsLoadingPlaces(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [location, placeId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectPlace = useCallback((place: Place) => {
    setPlaceId(place.placeId);
    setLocation(place.displayName || place.formattedAddress);
    setShowDropdown(false);
    setPlaces([]);
    setHighlightedIndex(-1);
  }, []);

  const handleLocationChange = (value: string) => {
    setLocation(value);
    setPlaceId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || places.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < places.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : places.length - 1
      );
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      selectPlace(places[highlightedIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const handleSearch = () => {
    if (!placeId) return;

    const params = new URLSearchParams({
      placeId,
      location: location.trim(),
      checkIn,
      checkOut,
      adults: adults.toString(),
      rooms: rooms.toString(),
    });

    navigate(`/hotels?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="bg-white shadow-md rounded-2xl md:rounded-full p-3 md:p-2">
        <div className="flex flex-col md:flex-row md:items-stretch">
          {/* Location with Autocomplete */}
          <div className="relative flex-1 px-4 py-2 md:py-1 md:pl-6 md:pr-4 md:border-r md:border-gray-200" ref={dropdownRef}>
            <label className="block text-[11px] font-bold text-[#1f2937] leading-none mb-1">
              Location
            </label>
            <MapPin className="absolute left-4 md:left-6 top-[34px] md:top-[30px] w-5 h-5 text-[#717182] z-10" />
            {isLoadingPlaces && (
              <Loader2 className="absolute right-4 top-[34px] md:top-[30px] w-4 h-4 text-[#717182] animate-spin z-10" />
            )}
            <Input
              ref={inputRef}
              type="text"
              placeholder="Where are you going?"
              value={location}
              onChange={(e) => handleLocationChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (places.length > 0 && !placeId) setShowDropdown(true);
              }}
              className="h-10 pl-10 pr-8 bg-transparent border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
              autoComplete="off"
            />

            {/* Autocomplete Dropdown */}
            {showDropdown && places.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 max-h-64 overflow-y-auto z-50">
                {places.map((place, index) => (
                  <button
                    key={place.placeId}
                    type="button"
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      index === highlightedIndex
                        ? "bg-[#eff6ff]"
                        : "hover:bg-[#f3f3f5]"
                    } ${index === 0 ? "rounded-t-xl" : ""} ${
                      index === places.length - 1 ? "rounded-b-xl" : ""
                    }`}
                    onClick={() => selectPlace(place)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    aria-label={`Select ${place.displayName}`}
                  >
                    <MapPin className="w-4 h-4 text-[#2563eb] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#1f2937] truncate">
                        {place.displayName}
                      </p>
                      <p className="text-xs text-[#717182] truncate">
                        {place.formattedAddress}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Check-in */}
          <div className="relative flex-1 px-4 py-2 md:py-1 md:border-r md:border-gray-200">
            <label className="block text-[11px] font-bold text-[#1f2937] leading-none mb-1">
              Check-in
            </label>
            <Calendar className="absolute left-4 top-[34px] md:top-[30px] w-5 h-5 text-[#717182]" />
            <Input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              onBlur={() => {
                let newCheckIn = checkIn;
                if (!checkIn || checkIn < localToday) {
                  newCheckIn = localToday;
                  setCheckIn(localToday);
                }
                const tmp = new Date(newCheckIn + "T00:00:00");
                tmp.setDate(tmp.getDate() + 1);
                if (!checkOut || checkOut < dateToString(tmp)) {
                  setCheckOut(dateToString(tmp));
                }
              }}
              className="h-10 pl-10 bg-transparent border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
            />
          </div>

          {/* Check-out */}
          <div className="relative flex-1 px-4 py-2 md:py-1 md:border-r md:border-gray-200">
            <label className="block text-[11px] font-bold text-[#1f2937] leading-none mb-1">
              Check-out
            </label>
            <Calendar className="absolute left-4 top-[34px] md:top-[30px] w-5 h-5 text-[#717182]" />
            <Input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              onBlur={() => {
                const minDate = checkIn || localToday;
                const tmp = new Date(minDate + "T00:00:00");
                tmp.setDate(tmp.getDate() + 1);
                if (!checkOut || checkOut < dateToString(tmp)) {
                  setCheckOut(dateToString(tmp));
                }
              }}
              className="h-10 pl-10 bg-transparent border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
            />
          </div>

          {/* Guests */}
          <div className="flex-[1.2] px-4 py-2 md:py-1">
            <label className="block text-[11px] font-bold text-[#1f2937] leading-none mb-1">
              Guests
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative flex items-center">
                <Users className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#717182]" />
                <div className="flex items-center w-full h-10 rounded-md pl-6 pr-1 border border-transparent hover:border-gray-200 transition-colors">
                  <button
                    type="button"
                    onClick={() => setAdults(Math.max(1, adults - 1))}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-sm"
                    aria-label="Decrease adults"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center text-sm font-medium">
                    {adults} {adults === 1 ? 'Adult' : 'Adults'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAdults(adults + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-sm"
                    aria-label="Increase adults"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <div className="flex items-center w-full h-10 rounded-md px-1 border border-transparent hover:border-gray-200 transition-colors">
                  <button
                    type="button"
                    onClick={() => setRooms(Math.max(1, rooms - 1))}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-sm"
                    aria-label="Decrease rooms"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center text-sm font-medium">
                    {rooms} {rooms === 1 ? 'Room' : 'Rooms'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRooms(rooms + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-sm"
                    aria-label="Increase rooms"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Search Button */}
          <div className="mt-3 md:mt-0 md:pl-2 flex items-center">
            <Button
              onClick={handleSearch}
              className="w-full md:w-12 h-12 bg-[#2563eb] hover:bg-[#1e40af] text-white font-medium rounded-xl md:rounded-full transition-colors px-4 md:px-0"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
              <span className="md:hidden ml-2">Search</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
