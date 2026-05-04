import {ArrowRight, Building2, MapPin, TrendingUp, Users} from 'lucide-react';
import {Link, useNavigate} from 'react-router';
import {Card} from '../components/ui/card';
import {Button} from '../components/ui/button';

export type Occupancy = {
    adults: number;
    children: number[];
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

    return {
        checkIn: dateToString(checkIn),
        checkOut: dateToString(checkOut),
    };
}

function loadStored(): { checkIn: string; checkOut: string; occupancies: Occupancy[] } | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

// Top cities data
const topCities = [
    {
        id: 1,
        name: 'Paris',
        country: 'France',
        hotels: 1243,
        avgPrice: 280,
        popularityScore: 98,
        description: 'The City of Light, known for its art, fashion, and iconic landmarks.',
        image:
            'https://images.unsplash.com/photo-1431274172761-fca41d930114?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXJpcyUyMGVpZmZlbCUyMHRvd2VyfGVufDF8fHx8MTc3MTg0Njc4NXww&ixlib=rb-4.1.0&q=80&w=1080',
        attractions: ['Eiffel Tower', 'Louvre Museum', 'Arc de Triomphe'],
        placeId: 'ChIJD7fiBh9u5kcRYJSMaMOCCwQ',
    },
    {
        id: 2,
        name: 'Tokyo',
        country: 'Japan',
        hotels: 1567,
        avgPrice: 220,
        popularityScore: 96,
        description: 'A vibrant metropolis blending ultra-modern with traditional culture.',
        image:
            'https://images.unsplash.com/photo-1673944083714-92ee2061e25c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b2t5byUyMHNreWxpbmUlMjBjaXR5fGVufDF8fHx8MTc3MTg5MjI3MHww&ixlib=rb-4.1.0&q=80&w=1080',
        attractions: ['Shibuya Crossing', 'Senso-ji Temple', 'Tokyo Skytree'],
        placeId: 'ChIJ51cu8IcbXWARiRtXIothAS4',
    },
    {
        id: 3,
        name: 'New York',
        country: 'USA',
        hotels: 2134,
        avgPrice: 320,
        popularityScore: 97,
        description: 'The city that never sleeps, offering endless entertainment and culture.',
        image:
            'https://images.unsplash.com/photo-1677364317455-63d57308f9e1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXclMjB5b3JrJTIwbWFuaGF0dGFufGVufDF8fHx8MTc3MTkwNDg0N3ww&ixlib=rb-4.1.0&q=80&w=1080',
        attractions: ['Statue of Liberty', 'Central Park', 'Times Square'],
        placeId: 'ChIJOwg_06VPwokRYv534QaPC8g',
    },
    {
        id: 4,
        name: 'London',
        country: 'UK',
        hotels: 1876,
        avgPrice: 290,
        popularityScore: 95,
        description: 'Historic capital with royal palaces, world-class museums, and vibrant culture.',
        image:
            'https://images.unsplash.com/photo-1745016176874-cd3ed3f5bfc6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsb25kb24lMjBiaWclMjBiZW58ZW58MXx8fHwxNzcxODY3NDgwfDA&ixlib=rb-4.1.0&q=80&w=1080',
        attractions: ['Big Ben', 'Tower Bridge', 'Buckingham Palace'],
        placeId: 'ChIJdd4hrwug2EcRmSrV3Vo6llI',
    },
    {
        id: 5,
        name: 'Dubai',
        country: 'UAE',
        hotels: 987,
        avgPrice: 350,
        popularityScore: 94,
        description: 'Luxury destination with stunning architecture and world-record attractions.',
        image:
            'https://images.unsplash.com/photo-1657106251952-2d584ebdf886?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkdWJhaSUyMHNreWxpbmUlMjBuaWdodHxlbnwxfHx8fDE3NzE4NzU4MjF8MA&ixlib=rb-4.1.0&q=80&w=1080',
        attractions: ['Burj Khalifa', 'Dubai Mall', 'Palm Jumeirah'],
        placeId: 'ChIJRcbZaklDXz4RYlEphFBu5r0',
    },
    {
        id: 6,
        name: 'Barcelona',
        country: 'Spain',
        hotels: 1432,
        avgPrice: 195,
        popularityScore: 93,
        description: 'Mediterranean charm with stunning architecture and vibrant beach culture.',
        image:
            'https://images.unsplash.com/photo-1653677903266-1d814985b3cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXJjZWxvbmElMjBhcmNoaXRlY3R1cmV8ZW58MXx8fHwxNzcxODM2NjY5fDA&ixlib=rb-4.1.0&q=80&w=1080',
        attractions: ['Sagrada Familia', 'Park Güell', 'La Rambla'],
        placeId: 'ChIJ5TCOcRaYpBIRCmZHTz37sEQ',
    },
    {
        id: 7,
        name: 'Singapore',
        country: 'Singapore',
        hotels: 765,
        avgPrice: 260,
        popularityScore: 92,
        description: 'Modern city-state with futuristic architecture and diverse cuisine.',
        image:
            'https://images.unsplash.com/photo-1686455746285-4a921419bc6c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaW5nYXBvcmUlMjBtYXJpbmElMjBiYXl8ZW58MXx8fHwxNzcxOTA0ODQ4fDA&ixlib=rb-4.1.0&q=80&w=1080',
        attractions: ['Marina Bay Sands', 'Gardens by the Bay', 'Sentosa Island'],
        placeId: 'ChIJdZOLiiMR2jERxPWrUs9peIg',
    },
    {
        id: 8,
        name: 'Sydney',
        country: 'Australia',
        hotels: 1098,
        avgPrice: 240,
        popularityScore: 91,
        description: 'Harbor city with iconic landmarks and beautiful beaches.',
        image:
            'https://images.unsplash.com/photo-1523059623039-a9ed027e7fad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzeWRuZXklMjBvcGVyYSUyMGhvdXNlfGVufDF8fHx8MTc3MTkwMzAwMnww&ixlib=rb-4.1.0&q=80&w=1080',
        attractions: ['Opera House', 'Harbour Bridge', 'Bondi Beach'],
        placeId: 'ChIJP3Sa8ziYEmsRUKgyFmh9AQM',
    },
    {
        id: 9,
        name: 'Rome',
        country: 'Italy',
        hotels: 1654,
        avgPrice: 210,
        popularityScore: 94,
        description: 'Ancient capital with incredible history, art, and cuisine.',
        image:
            'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb21lJTIwY29sb3NzZXVtfGVufDF8fHx8MTczMzQyMzY0Nnww&ixlib=rb-4.1.0&q=80&w=1080',
        attractions: ['Colosseum', 'Vatican City', 'Trevi Fountain'],
        placeId: 'ChIJ-0CeYsCkiogRKx3zvPnFUCg',
    },
    {
        id: 10,
        name: 'Bangkok',
        country: 'Thailand',
        hotels: 1321,
        avgPrice: 150,
        popularityScore: 90,
        description: 'Vibrant city with ornate temples, bustling markets, and amazing street food.',
        image:
            'https://images.unsplash.com/photo-1563492065421-a0e1adb180b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYW5na29rJTIwdGVtcGxlfGVufDF8fHx8MTczMzQyMzY0N3ww&ixlib=rb-4.1.0&q=80&w=1080',
        attractions: ['Grand Palace', 'Wat Arun', 'Chatuchak Market'],
        placeId: 'ChIJ82ENKDJgHTERIEjiXbIAAQE',
    },
    {
        id: 11,
        name: 'Amsterdam',
        country: 'Netherlands',
        hotels: 876,
        avgPrice: 230,
        popularityScore: 89,
        description: 'Charming city of canals, museums, and cycling culture.',
        image:
            'https://images.unsplash.com/photo-1570716267389-02e8f4d9c223?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbXN0ZXJkYW0lMjBjYW5hbHN8ZW58MXx8fHwxNzMzNDIzNjQ4fDA&ixlib=rb-4.1.0&q=80&w=1080',
        attractions: ['Van Gogh Museum', 'Anne Frank House', 'Canal District'],
        placeId: 'ChIJVXealLU_xkcRja_At0z9AGY',
    },
    {
        id: 12,
        name: 'Istanbul',
        country: 'Turkey',
        hotels: 1543,
        avgPrice: 170,
        popularityScore: 91,
        description: 'Crossroads of East and West with rich history and stunning architecture.',
        image:
            'https://images.unsplash.com/photo-1527838832700-5059252407fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpc3RhbmJ1bCUyMG1vc3F1ZXxlbnwxfHx8fDE3MzM0MjM2NDh8MA&ixlib=rb-4.1.0&q=80&w=1080',
        attractions: ['Hagia Sophia', 'Blue Mosque', 'Grand Bazaar'],
        placeId: 'ChIJawhoAASnyhQR0LABvJj-zOE',
    },
];

export function CitiesPage() {
    const navigate = useNavigate();

    const defaults = getDefaultDates();
    const stored = loadStored();

    const checkIn = stored?.checkIn ?? defaults.checkIn;
    const checkOut = stored?.checkOut ?? defaults.checkOut;
    const occupancies = stored?.occupancies ?? [{adults: 2, children: []}];

    const handleCitySearch = (city: { name: string; placeId?: string }) => {
        const queryParams = new URLSearchParams({
            checkIn,
            checkOut,
            occupancies: JSON.stringify(occupancies),
            location: city.name,
        });

        if (city.placeId) {
            queryParams.set('placeId', city.placeId);
        }

        navigate(`/hotels?${queryParams.toString()}`);
    };

    return (
        <div className="w-full bg-background min-h-screen">
            <div
                className="relative bg-gradient-to-r from-secondary to-secondary text-white py-16 md:py-24 overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1760502431557-2976b538959b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnbG9iYWwlMjBjaXRpZXMlMjBza3lsaW5lJTIwcGFub3JhbWF8ZW58MXx8fHwxNzcyNjgyNTEyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                        alt="Cities around the world"
                        className="w-full h-full object-cover opacity-20"
                    />
                </div>

                <div className="relative z-10 container mx-auto px-4 lg:px-8">
                    <div className="max-w-3xl">
                        <h1 className="text-4xl md:text-6xl font-bold mb-6">Discover Top Cities</h1>
                        <p className="text-xl md:text-2xl text-white/90">
                            Explore the world's most popular destinations and find your perfect getaway
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-card border-b">
                <div className="container mx-auto px-4 lg:px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-[#2563eb]/10 rounded-xl flex items-center justify-center">
                                <MapPin className="w-7 h-7 text-[#2563eb]"/>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-bold-text">12</div>
                                <div className="text-subtle-text">Top Cities</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-[#f59e0b]/10 rounded-xl flex items-center justify-center">
                                <Building2 className="w-7 h-7 text-[#f59e0b]"/>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-bold-text">16,500+</div>
                                <div className="text-subtle-text">Hotels Available</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-[#10b981]/10 rounded-xl flex items-center justify-center">
                                <Users className="w-7 h-7 text-[#10b981]"/>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-bold-text">2M+</div>
                                <div className="text-subtle-text">Happy Travelers</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 lg:px-8 py-16">
                <div className="mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-bold-text mb-2">Most Popular Cities</h2>
                    <p className="text-lg text-subtle-text">
                        Browse through our handpicked selection of top travel destinations
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {topCities.map((city) => (
                        <Card
                            key={city.id}
                            className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                        >
                            <div className="relative h-64 overflow-hidden">
                                <img
                                    src={city.image}
                                    alt={city.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div
                                    className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"/>

                                <div
                                    className="absolute top-4 right-4 bg-[#f59e0b] text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                                    <TrendingUp className="w-4 h-4"/>
                                    {city.popularityScore}%
                                </div>

                                <div className="absolute bottom-4 left-4 right-4">
                                    <h3 className="text-2xl font-bold text-white mb-1">{city.name}</h3>
                                    <div className="flex items-center text-white/90 text-sm">
                                        <MapPin className="w-4 h-4 mr-1"/>
                                        {city.country}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                <p className="text-subtle-text mb-4 line-clamp-2">{city.description}</p>

                                <div className="flex items-center gap-6 mb-4 pb-4 border-b">
                                    <div>
                                        <div className="text-sm text-subtle-text">Hotels</div>
                                        <div className="text-lg font-bold text-bold-text">
                                            {city.hotels.toLocaleString()}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-subtle-text">Avg. Price</div>
                                        <div className="text-lg font-bold text-bold-text">${city.avgPrice}</div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <div className="text-sm font-medium text-bold-text mb-2">Top Attractions</div>
                                    <div className="flex flex-wrap gap-2">
                                        {city.attractions.map((attraction, index) => (
                                            <span
                                                key={index}
                                                className="text-xs bg-input-background text-subtle-text px-2 py-1 rounded-md"
                                            >
                        {attraction}
                      </span>
                                        ))}
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    onClick={() => handleCitySearch(city)}
                                    className="w-full bg-[#1d2d44] dark:bg-background hover:bg-[#1e40af] dark:hover:bg-[#1e40af] text-white cursor-pointer"
                                >
                  <span className="flex items-center justify-center gap-2">
                    Explore Hotels
                    <ArrowRight className="w-4 h-4"/>
                  </span>
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            <div className="relative bg-gradient-to-r from-secondary to-secondary text-white py-16">
                <div className="container mx-auto px-4 lg:px-8 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Can't Find Your City?</h2>
                    <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                        We have hotels in over 100 cities worldwide. Search for your destination now!
                    </p>
                    <Button
                        asChild
                        size="lg"
                        className="bg-white text-[#2563eb] hover:bg-white/90 text-lg px-8 py-6 rounded-xl"
                    >
                        <Link to="/hotels">
                            Browse All Hotels
                            <ArrowRight className="w-5 h-5 ml-2"/>
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}