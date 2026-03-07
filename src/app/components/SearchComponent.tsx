import { MapPin, Calendar, Users, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useState } from 'react';
import { useNavigate } from 'react-router';

export function SearchComponent() {
  const navigate = useNavigate();

  const [location, setLocation] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);

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

  const handleSearch = () => {
    const queryParams = new URLSearchParams({
      location: location.trim(),
      checkIn,
      checkOut,
      guests: guests.toString(),
    });

    navigate(`/hotels?${queryParams.toString()}`);
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl p-6 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
        {/* Location */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-[#1f2937] mb-2">Location</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#717182]" />
            <Input
              type="text"
              placeholder="Where are you going?"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10 h-12 bg-[#f3f3f5] border-0 focus:ring-2 focus:ring-[#2563eb]"
            />
          </div>
        </div>

        {/* Check-in */}
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-[#1f2937] mb-2">Check-in</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#717182]" />
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
              className="pl-10 h-12 bg-[#f3f3f5] border-0 focus:ring-2 focus:ring-[#2563eb]"
            />
          </div>
        </div>

        {/* Check-out */}
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-[#1f2937] mb-2">Check-out</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#717182]" />
            <Input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              onBlur={() => {
                const minDate = checkIn || localToday;
                const tmp = new Date(minDate + "T00:00:00");
                tmp.setDate(tmp.getDate() + 1);
                if (!checkOut || checkOut < dateToString(tmp)) {
                  setCheckOut(dateToString(tmp)); // auto-correct to check-in or today + 1
                }
              }}
              className="pl-10 h-12 bg-[#f3f3f5] border-0 focus:ring-2 focus:ring-[#2563eb]"
            />
          </div>
        </div>

        {/* Guests */}
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-[#1f2937] mb-2">Guests</label>
          <div className="relative flex items-center">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#717182]" />
            <div className="flex items-center w-full h-12 bg-[#f3f3f5] rounded-lg pl-10 pr-3">
              <button
                onClick={() => setGuests(Math.max(1, guests - 1))}
                className="w-8 h-8 flex items-center justify-center rounded bg-white hover:bg-[#e9ebef] transition-colors"
                aria-label="Decrease guests"
              >
                -
              </button>
              <span className="flex-1 text-center font-medium">{guests}</span>
              <button
                onClick={() => setGuests(guests + 1)}
                className="w-8 h-8 flex items-center justify-center rounded bg-white hover:bg-[#e9ebef] transition-colors"
                aria-label="Increase guests"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Search Button */}
        <div className="md:col-span-1 flex items-end">
          <Button 
            onClick={handleSearch}
            className="w-full h-12 bg-[#2563eb] hover:bg-[#1e40af] text-white font-medium rounded-lg transition-colors px-4"
          >
            <Search className="w-5 h-5" />
            <span className="hidden lg:inline ml-2">Search</span>
          </Button>
        </div>
      </div>
    </div>
  );
}