import {ArrowRight, MapPin, Star} from 'lucide-react';
import {Link} from 'react-router';
import {SearchComponent} from '../components/SearchComponent';
import {Button} from '../components/ui/button';
import {Card} from '../components/ui/card';
import {useCurrency} from '../contexts/CurrencyContext';
import imgHeroBackground from '../../assets/910a43fa90ece96610082739bbdb02f24d6b7f70.png';


// TODO: take this out, just example to call apis
import {useEffect} from "react";
import {api} from "../../api/liteApi";

// Trending destinations data
const trendingDestinations = [
    {
        id: 1,
        name: 'Paris',
        country: 'France',
        image: 'https://images.unsplash.com/photo-1431274172761-fca41d930114?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXJpcyUyMGVpZmZlbCUyMHRvd2VyfGVufDF8fHx8MTc3MTg0Njc4NXww&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
        id: 2,
        name: 'Tokyo',
        country: 'Japan',
        image: 'https://images.unsplash.com/photo-1673944083714-92ee2061e25c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b2t5byUyMHNreWxpbmUlMjBjaXR5fGVufDF8fHx8MTc3MTg5MjI3MHww&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
        id: 3,
        name: 'New York',
        country: 'USA',
        image: 'https://images.unsplash.com/photo-1677364317455-63d57308f9e1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXclMjB5b3JrJTIwbWFuaGF0dGFufGVufDF8fHx8MTc3MTkwNDg0N3ww&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
        id: 4,
        name: 'London',
        country: 'UK',
        image: 'https://images.unsplash.com/photo-1745016176874-cd3ed3f5bfc6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsb25kb24lMjBiaWclMjBiZW58ZW58MXx8fHwxNzcxODY3NDgwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
        id: 5,
        name: 'Dubai',
        country: 'UAE',
        image: 'https://images.unsplash.com/photo-1657106251952-2d584ebdf886?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkdWJhaSUyMHNreWxpbmUlMjBuaWdodHxlbnwxfHx8fDE3NzE4NzU4MjF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
        id: 6,
        name: 'Barcelona',
        country: 'Spain',
        image: 'https://images.unsplash.com/photo-1653677903266-1d814985b3cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXJjZWxvbmElMjBhcmNoaXRlY3R1cmV8ZW58MXx8fHwxNzcxODM2NjY5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
        id: 7,
        name: 'Singapore',
        country: 'Singapore',
        image: 'https://images.unsplash.com/photo-1686455746285-4a921419bc6c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaW5nYXBvcmUlMjBtYXJpbmElMjBiYXl8ZW58MXx8fHwxNzcxOTA0ODQ4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
        id: 8,
        name: 'Sydney',
        country: 'Australia',
        image: 'https://images.unsplash.com/photo-1523059623039-a9ed027e7fad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzeWRuZXklMjBvcGVyYSUyMGhvdXNlfGVufDF8fHx8MTc3MTkwMzAwMnww&ixlib=rb-4.1.0&q=80&w=1080',
    },
];

// Top rated hotels data
const topRatedHotels = [
    {
        id: 1,
        name: 'The Grand Palace Hotel',
        location: 'Paris, France',
        rating: 4.9,
        price: 320,
        image: 'https://images.unsplash.com/photo-1572177215152-32f247303126?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3RlbCUyMGJlZHJvb218ZW58MXx8fHwxNzcxOTA0ODUxfDA&ixlib=rb-4.1.0&q=80&w=1080',
        reviews: 1243,
    },
    {
        id: 2,
        name: 'Ocean View Resort',
        location: 'Bali, Indonesia',
        rating: 4.8,
        price: 180,
        image: 'https://images.unsplash.com/photo-1729717949782-f40c4a07e3c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWFjaCUyMHJlc29ydCUyMGhvdGVsfGVufDF8fHx8MTc3MTg1Mjk5Nnww&ixlib=rb-4.1.0&q=80&w=1080',
        reviews: 892,
    },
    {
        id: 3,
        name: 'Metropolitan Suites',
        location: 'New York, USA',
        rating: 4.7,
        price: 280,
        image: 'https://images.unsplash.com/photo-1731336478850-6bce7235e320?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3RlbCUyMHN1aXRlJTIwbHV4dXJ5fGVufDF8fHx8MTc3MTgxOTE3Nnww&ixlib=rb-4.1.0&q=80&w=1080',
        reviews: 1567,
    },
    {
        id: 4,
        name: 'Skyline Boutique Hotel',
        location: 'Tokyo, Japan',
        rating: 4.9,
        price: 240,
        image: 'https://images.unsplash.com/photo-1664908790579-34b71154f603?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib3V0aXF1ZSUyMGhvdGVsJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzcxODA2NDA3fDA&ixlib=rb-4.1.0&q=80&w=1080',
        reviews: 723,
    },
    {
        id: 5,
        name: 'City Lights Premium',
        location: 'Dubai, UAE',
        rating: 4.8,
        price: 350,
        image: 'https://images.unsplash.com/photo-1661191891844-2e7980ae1c94?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaXR5JTIwaG90ZWwlMjByb29mdG9wfGVufDF8fHx8MTc3MTkwNDg1Mnww&ixlib=rb-4.1.0&q=80&w=1080',
        reviews: 1034,
    },
    {
        id: 6,
        name: 'Royal Plaza Hotel',
        location: 'London, UK',
        rating: 4.6,
        price: 290,
        image: 'https://images.unsplash.com/photo-1759462692354-404b2c995c99?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3RlbCUyMGxvYmJ5JTIwZWxlZ2FudHxlbnwxfHx8fDE3NzE4ODEyNzZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
        reviews: 945,
    },
];

// Recommended hotels data
const recommendedHotels = [
    {
        id: 9,
        name: 'Serenity Spa Resort',
        location: 'Santorini, Greece',
        rating: 4.9,
        price: 310,
        image: 'https://images.unsplash.com/photo-1759223198981-661cadbbff36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBob3RlbCUyMHN1aXRlJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzcyNTU2ODU3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        reviews: 876,
    },
    {
        id: 10,
        name: 'Vista Heights Hotel',
        location: 'San Francisco, USA',
        rating: 4.7,
        price: 265,
        image: 'https://images.unsplash.com/photo-1764642498023-8547a9558d47?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3RlbCUyMHJvb2Z0b3AlMjB2aWV3fGVufDF8fHx8MTc3MjY4MjQ4Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        reviews: 543,
    },
    {
        id: 11,
        name: 'Artisan Boutique Stay',
        location: 'Copenhagen, Denmark',
        rating: 4.8,
        price: 245,
        image: 'https://images.unsplash.com/photo-1759264244746-140bbbc54e1b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib3V0aXF1ZSUyMGhvdGVsJTIwYmVkcm9vbSUyMGRlc2lnbnxlbnwxfHx8fDE3NzI2ODI0ODN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        reviews: 621,
    },
    {
        id: 12,
        name: 'Azure Grand Hotel',
        location: 'Monaco',
        rating: 4.9,
        price: 420,
        image: 'https://images.unsplash.com/photo-1741506131058-533fcf894483?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cHNjYWxlJTIwaG90ZWwlMjBsb3VuZ2V8ZW58MXx8fHwxNzcyNjgyNDgzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
        reviews: 712,
    },
];


export function HomePage() {
    const {convertPrice, getCurrencySymbol} = useCurrency();

    // TODO: take this out, just example to call apis
    useEffect(() => {
        const loadCountries = async () => {
            try {
                const data = await api.getCountries();
                console.log(data);
            } catch (err) {
                console.error(err);
            }
        };

        loadCountries();
    }, []);


    return (
        <div className="w-full">
            {/* Hero Section */}
            <section className="relative h-[824px] w-full overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0">
                    <img
                        src={imgHeroBackground}
                        alt="Luxury hotel interior"
                        className="w-full h-full object-cover"
                    />
                    {/* Dark Overlay */}
                    <div className="absolute inset-0 bg-black/50"/>
                </div>

                {/* Hero Content */}
                <div
                    className="relative z-10 container mx-auto px-4 h-full flex flex-col items-center justify-center text-center">
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 max-w-4xl">
                        Find your Perfect Hotel
                    </h1>
                    <p className="text-2xl md:text-3xl text-white/90 mb-12 max-w-3xl">
                        Explore our selection of over 5000+ hotels spanning across 15 countries
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-16">
                        <Button
                            asChild
                            variant="outline"
                            className="backdrop-blur-sm bg-white/20 border-white text-white hover:bg-white/30 px-8 py-6 text-lg rounded-2xl"
                        >
                            <Link to="/hotels">
                                Search for Hotels
                            </Link>
                        </Button>
                        <Button
                            asChild
                            className="backdrop-blur-sm bg-black/70 hover:bg-white/90 hover:text-[#1f2937] text-white px-8 py-6 text-lg rounded-2xl border border-white/40 transition-all duration-300"
                        >
                            <Link to="/cities">
                                Find a City
                            </Link>
                        </Button>
                    </div>

                    {/* Search Component */}
                    <div className="w-full px-4">
                        <SearchComponent/>
                    </div>
                </div>
            </section>

            {/* Trending Destinations Section */}
            <section className="py-16 md:py-24 bg-gray-50">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-[#1f2937] mb-2">
                                Trending Destinations
                            </h2>
                            <p className="text-lg text-[#717182]">
                                Discover the most popular travel destinations
                            </p>
                        </div>
                        <Button asChild variant="ghost"
                                className="hidden md:flex items-center gap-2 text-[#2563eb] hover:text-[#1e40af]">
                            <Link to="/hotels">
                                View All
                                <ArrowRight className="w-5 h-5"/>
                            </Link>
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {trendingDestinations.map((destination) => (
                            <Card
                                key={destination.id}
                                className="group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                            >
                                <div className="relative aspect-square overflow-hidden">
                                    <img
                                        src={destination.image}
                                        alt={destination.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div
                                        className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"/>
                                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                                        <h3 className="text-2xl font-bold mb-1">{destination.name}</h3>
                                        <p className="text-sm text-white/90 flex items-center gap-1">
                                            <MapPin className="w-4 h-4"/>
                                            {destination.country}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Top Rated Hotels Section */}
            <section className="py-16 md:py-24 bg-white">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-[#1f2937] mb-2">
                                Top Rated Hotels
                            </h2>
                            <p className="text-lg text-[#717182]">
                                Hand-picked hotels with exceptional reviews
                            </p>
                        </div>
                        <Button asChild variant="ghost"
                                className="hidden md:flex items-center gap-2 text-[#2563eb] hover:text-[#1e40af]">
                            <Link to="/hotels">
                                View All
                                <ArrowRight className="w-5 h-5"/>
                            </Link>
                        </Button>
                    </div>

                    <div className="overflow-x-auto pb-4 -mx-4 px-4">
                        <div className="flex gap-6 w-max">
                            {topRatedHotels.map((hotel) => (
                                <Link
                                    key={hotel.id}
                                    to={`/hotel/${hotel.id}`}
                                >
                                    <Card
                                        className="group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 w-[320px] md:w-[360px]"
                                    >
                                        <div className="relative h-64 overflow-hidden">
                                            <img
                                                src={hotel.image}
                                                alt={hotel.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                            <div
                                                className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1">
                                                <Star className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]"/>
                                                <span className="font-bold text-[#1f2937]">{hotel.rating}</span>
                                                <span className="text-xs text-[#717182]">({hotel.reviews})</span>
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <h3 className="text-xl font-bold text-[#1f2937] mb-2">{hotel.name}</h3>
                                            <p className="text-sm text-[#717182] mb-4 flex items-center gap-1">
                                                <MapPin className="w-4 h-4"/>
                                                {hotel.location}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span
                                                        className="text-2xl font-bold text-[#1f2937]">{getCurrencySymbol()}{convertPrice(hotel.price)}</span>
                                                    <span className="text-sm text-[#717182]">/night</span>
                                                </div>
                                                <Button className="bg-[#2563eb] hover:bg-[#1e40af] text-white">
                                                    Quick View
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Recommended for You Section */}
            <section className="py-16 md:py-24 bg-gray-50">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-[#1f2937] mb-2">
                                Recommended for You
                            </h2>
                            <p className="text-lg text-[#717182]">
                                Handpicked hotels based on your preferences
                            </p>
                        </div>
                        <Button asChild variant="ghost"
                                className="hidden md:flex items-center gap-2 text-[#2563eb] hover:text-[#1e40af]">
                            <Link to="/hotels">
                                View All
                                <ArrowRight className="w-5 h-5"/>
                            </Link>
                        </Button>
                    </div>

                    <div className="overflow-x-auto pb-4 -mx-4 px-4">
                        <div className="flex gap-6 w-max">
                            {recommendedHotels.map((hotel) => (
                                <Link
                                    key={hotel.id}
                                    to={`/hotel/${hotel.id}`}
                                >
                                    <Card
                                        className="group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 w-[320px] md:w-[360px]"
                                    >
                                        <div className="relative h-64 overflow-hidden">
                                            <img
                                                src={hotel.image}
                                                alt={hotel.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                            <div
                                                className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1">
                                                <Star className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]"/>
                                                <span className="font-bold text-[#1f2937]">{hotel.rating}</span>
                                                <span className="text-xs text-[#717182]">({hotel.reviews})</span>
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <h3 className="text-xl font-bold text-[#1f2937] mb-2">{hotel.name}</h3>
                                            <p className="text-sm text-[#717182] mb-4 flex items-center gap-1">
                                                <MapPin className="w-4 h-4"/>
                                                {hotel.location}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span
                                                        className="text-2xl font-bold text-[#1f2937]">{getCurrencySymbol()}{convertPrice(hotel.price)}</span>
                                                    <span className="text-sm text-[#717182]">/night</span>
                                                </div>
                                                <Button className="bg-[#2563eb] hover:bg-[#1e40af] text-white">
                                                    Quick View
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Call to Action Section */}
            <section className="py-20 bg-gradient-to-r from-[#2563eb] to-[#1e40af]">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Ready to start your journey?
                    </h2>
                    <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                        Join thousands of travelers who trust LikeHome for their perfect stay
                    </p>
                    <Button
                        asChild
                        size="lg"
                        className="bg-[#f59e0b] hover:bg-[#d97706] text-white px-12 py-6 text-lg rounded-xl"
                    >
                        <Link to="/hotels">
                            Explore Hotels
                        </Link>
                    </Button>
                </div>
            </section>
        </div>
    );
}