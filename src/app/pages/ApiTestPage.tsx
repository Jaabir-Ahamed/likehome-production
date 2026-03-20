import {useEffect, useState} from "react";
import {api} from "../../api/liteApi";
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger,} from "../components/ui/accordion";
import hotelsRatesMd from "../../../docs/api/hotels-rates.md?raw";
import ratesPrebookMd from "../../../docs/api/rates-prebook.md?raw";
import ratesBookMd from "../../../docs/api/rates-book.md?raw";
import bookingsRetrieveMd from "../../../docs/api/bookings-retrieve.md?raw";
import listbookingsMd from "../../../docs/api/listbookings.md?raw";

import {supabase} from "../../lib/supabaseClient";

import {FunctionsHttpError} from "@supabase/supabase-js"; // adjust path

type Status = "idle" | "loading" | "success" | "error";

function JsonOutput({status, result}: { status: Status; result: unknown }) {
    if (status === "idle") return null;
    if (status === "loading") return <p className="text-sm text-gray-500 mt-3">Loading...</p>;
    return (
        <pre
            className={`mt-3 p-3 rounded-lg text-xs overflow-auto max-h-72 whitespace-pre-wrap break-all ${
                status === "error" ? "bg-red-50 text-red-700" : "bg-gray-50 text-gray-800"
            }`}
        >
      {JSON.stringify(result, null, 2)}
    </pre>
    );
}

function Field({
                   label,
                   value,
                   onChange,
                   placeholder,
                   type = "text",
               }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
}) {
    return (
        <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
    );
}

function SectionLabel({children}: { children: React.ReactNode }) {
    return (
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 pt-3 pb-1">
            {children}
        </p>
    );
}

function Badge({color, children}: { color: "blue" | "purple" | "green" | "gray"; children: React.ReactNode }) {
    const cls = {
        blue: "bg-blue-100 text-blue-700",
        purple: "bg-purple-100 text-purple-700",
        green: "bg-green-100 text-green-700",
        gray: "bg-gray-100 text-gray-600",
    }[color];
    return (
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${cls}`}>{children}</span>
    );
}

// ── Simple Markdown renderer ──────────────────────────────────────────────────
function parseInline(text: string): React.ReactNode {
    if (!text) return null;
    const parts: React.ReactNode[] = [];
    let rem = text;
    let k = 0;
    while (rem) {
        const b = rem.search(/\*\*/);
        const c = rem.search(/`/);
        const l = rem.search(/\[/);
        const earliest = Math.min(b >= 0 ? b : Infinity, c >= 0 ? c : Infinity, l >= 0 ? l : Infinity);
        if (!isFinite(earliest)) {
            parts.push(rem);
            break;
        }
        if (earliest > 0) parts.push(rem.slice(0, earliest));
        rem = rem.slice(earliest);
        const boldM = rem.match(/^\*\*(.*?)\*\*(.*)/s);
        if (b === earliest && boldM) {
            parts.push(<strong key={k++}>{boldM[1]}</strong>);
            rem = boldM[2];
            continue;
        }
        const codeM = rem.match(/^`([^`]+)`(.*)/s);
        if (c === earliest && codeM) {
            parts.push(<code key={k++} className="bg-gray-100 px-1 rounded text-xs font-mono">{codeM[1]}</code>);
            rem = codeM[2];
            continue;
        }
        const linkM = rem.match(/^\[([^\]]+)\]\(([^)]+)\)(.*)/s);
        if (l === earliest && linkM) {
            parts.push(<a key={k++} href={linkM[2]} target="_blank" rel="noreferrer"
                          className="text-blue-600 hover:underline">{linkM[1]}</a>);
            rem = linkM[3];
            continue;
        }
        parts.push(rem[0]);
        rem = rem.slice(1);
    }
    return <>{parts}</>;
}

function SimpleMarkdown({content}: { content: string }) {
    const nodes: React.ReactNode[] = [];
    const lines = content.split('\n');
    let i = 0;
    let key = 0;
    const nk = () => key++;
    while (i < lines.length) {
        const line = lines[i];
        // Fenced code block
        if (line.startsWith('```')) {
            const codeLines: string[] = [];
            i++;
            while (i < lines.length && !lines[i].startsWith('```')) {
                codeLines.push(lines[i]);
                i++;
            }
            i++;
            nodes.push(<pre key={nk()}
                            className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-auto whitespace-pre my-3"><code>{codeLines.join('\n')}</code></pre>);
            continue;
        }
        // HR
        if (line.match(/^-{3,}$/) || line.match(/^\*{3,}$/)) {
            nodes.push(<hr key={nk()} className="border-gray-200 my-4"/>);
            i++;
            continue;
        }
        // Headings
        const h1m = line.match(/^# (.+)/);
        if (h1m) {
            nodes.push(<h1 key={nk()} className="text-xl font-bold text-gray-900 mt-6 mb-2">{parseInline(h1m[1])}</h1>);
            i++;
            continue;
        }
        const h2m = line.match(/^## (.+)/);
        if (h2m) {
            nodes.push(<h2 key={nk()}
                           className="text-base font-bold text-gray-800 mt-5 mb-1">{parseInline(h2m[1])}</h2>);
            i++;
            continue;
        }
        const h3m = line.match(/^### (.+)/);
        if (h3m) {
            nodes.push(<h3 key={nk()}
                           className="text-sm font-semibold text-gray-700 mt-4 mb-1">{parseInline(h3m[1])}</h3>);
            i++;
            continue;
        }
        // Table
        if (line.startsWith('|')) {
            const rows: string[][] = [];
            while (i < lines.length && lines[i].startsWith('|')) {
                const cells = lines[i].split('|').slice(1, -1).map(c => c.trim());
                if (!cells.every(c => c.match(/^[-: ]+$/))) rows.push(cells);
                i++;
            }
            if (rows.length > 0) nodes.push(
                <div key={nk()} className="overflow-x-auto my-3">
                    <table className="w-full text-xs border-collapse border border-gray-200 rounded">
                        <thead>
                        <tr className="bg-gray-50">{rows[0].map((cell, ci) => <th key={ci}
                                                                                  className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">{parseInline(cell)}</th>)}</tr>
                        </thead>
                        <tbody>{rows.slice(1).map((row, ri) => <tr key={ri}
                                                                   className="hover:bg-gray-50">{row.map((cell, ci) =>
                            <td key={ci}
                                className="border border-gray-200 px-3 py-2 text-gray-700">{parseInline(cell)}</td>)}</tr>)}</tbody>
                    </table>
                </div>
            );
            continue;
        }
        // Unordered list
        if (line.match(/^- /)) {
            const items: string[] = [];
            while (i < lines.length && lines[i].match(/^- /)) {
                items.push(lines[i].slice(2));
                i++;
            }
            nodes.push(<ul key={nk()}
                           className="list-disc list-inside space-y-1 text-sm text-gray-700 my-2 ml-2">{items.map((item, ii) =>
                <li key={ii}>{parseInline(item)}</li>)}</ul>);
            continue;
        }
        // Blank line
        if (line.trim() === '') {
            i++;
            continue;
        }
        // Paragraph
        nodes.push(<p key={nk()} className="text-sm text-gray-700 my-1">{parseInline(line)}</p>);
        i++;
    }
    return <div>{nodes}</div>;
}

// ── API Reference data ────────────────────────────────────────────────────────
const API_METHODS = [
    {
        name: "getCountries()",
        method: "GET",
        edge: "countries",
        description: "List all countries supported by LiteAPI.",
        params: "none",
        returns: "Array of { code, name }",
        doc: "get_data-countries",
    },
    {
        name: "getPlaces(query)",
        method: "GET",
        edge: "places",
        description: "Text search for destinations (cities, regions, landmarks). Returns placeIds for hotel search.",
        params: "query: string (e.g. \"New York\", \"Paris\")",
        returns: "Array of { name, placeId, ... }",
        doc: "get_data-places",
    },
    {
        name: "getCities(countryCode)",
        method: "GET",
        edge: "cities",
        description: "List cities for a given country code.",
        params: "countryCode: string (ISO 3166-1 alpha-2, e.g. \"US\")",
        returns: "Array of { name, placeId, ... }",
        doc: "get_data-cities",
    },
    {
        name: "getHotels({ placeId })",
        method: "GET",
        edge: "list-hotels-by-placeid",
        description: "List hotels in a place. Use a placeId from getCities().",
        params: "placeId: string, limit?, offset?, starRating?, minRating?, language?",
        returns: "Array of hotel objects with hotelId, name, etc.",
        doc: "get_data-hotels",
    },
    {
        name: "getFacilities()",
        method: "GET",
        edge: "list-facilities",
        description: "List all available hotel facility tags.",
        params: "none",
        returns: "Array of facility objects",
        doc: "get_data-facilities",
    },
    {
        name: "getHotelDetails(hotelId)",
        method: "GET",
        edge: "hotel-details",
        description: "Fetch full details for a single hotel.",
        params: "hotelId: string",
        returns: "Hotel detail object (description, images, facilities, etc.)",
        doc: "get_data-hotel",
    },
    {
        name: "getHotelRates(params)",
        method: "POST",
        edge: "hotels-rates",
        description: "Get available room rates for one or more hotels. Returns offerId per rate.",
        params: "hotelIds: string[], checkin: YYYY-MM-DD, checkout: YYYY-MM-DD, occupancies: [{adults, children?}], currency?, guestNationality?",
        returns: "data[].roomTypes[].rates[].offerId — use offerId in prebook",
        doc: "post_hotels-rates",
    },
    {
        name: "getRatesPrebook(params)",
        method: "POST",
        edge: "rates-prebook",
        description: "Lock a rate. Returns prebookId and confirms final price/cancellation policy.",
        params: "offerId: string, usePaymentSdk: boolean, voucherCode?, addons?, bedTypeIds?",
        returns: "data.prebookId — use in getRatesBook()",
        doc: "post_rates-prebook",
    },
    {
        name: "getRatesBook(params)",
        method: "POST",
        edge: "rates-book",
        description: "Complete the booking. Returns bookingId and confirmation status.",
        params: "prebookId, holder: {firstName, lastName, email, phone}, guests: [{occupancyNumber, firstName, lastName, email}], payment: {method}",
        returns: "data.bookingId, data.status",
        doc: "post_rates-book",
    },
    {
        name: "getBooking(bookingId)",
        method: "POST",
        edge: "bookings-retrieve",
        description: "Retrieve full booking details from LiteAPI by bookingId.",
        params: "bookingId: string",
        returns: "data — full booking object (status, hotel, rooms, holder, etc.)",
        doc: "get_bookings-bookingid",
    },
    {
        name: "getListBookings(params)",
        method: "GET",
        edge: "listbookings",
        description: "List all bookings for the authenticated user. Defaults clientReference to the logged-in user's ID.",
        params: "clientReference?: string, guestId?: string, timeout?: number",
        returns: "data[] — array of booking objects",
        doc: "get_listbookings",
    },
];

const LITEAPI_DOCS_BASE = "https://docs.liteapi.travel/reference/";

const NAV_ITEMS = [
    {group: "Overview"},
    {href: "#how-it-works", label: "How Booking Works"},
    {href: "#api-reference", label: "API Reference"},
    {group: "Testers"},
    {href: "#test-countries", label: "Countries"},
    {href: "#test-cities", label: "Cities by country"},
    {href: "#test-places", label: "Places (search)"},
    {href: "#test-hotels-by-place", label: "Hotels by PlaceID"},
    {href: "#test-hotel-rates", label: "Hotel Rates"},
    {href: "#test-prebook", label: "Prebook"},
    {href: "#test-book", label: "Book"},
    {href: "#test-retrieve", label: "Retrieve Booking"},
    {href: "#test-list-bookings", label: "List Bookings"},
    {group: "Docs"},
    {href: "#doc-hotels-rates", label: "hotels-rates"},
    {href: "#doc-rates-prebook", label: "rates-prebook"},
    {href: "#doc-rates-book", label: "rates-book"},
    {href: "#doc-bookings-retrieve", label: "bookings-retrieve"},
    {href: "#doc-listbookings", label: "listbookings"},
] as ({ group: string } | { href: string; label: string })[];

export function ApiTestPage() {
    const [activeSection, setActiveSection] = useState("#how-it-works");

    // ── Countries ─────────────────────────────────────────────
    const [countriesStatus, setCountriesStatus] = useState<Status>("idle");
    const [countriesResult, setCountriesResult] = useState<unknown>(null);

    async function handleGetCountries() {
        setCountriesStatus("loading");
        try {
            const data = await api.getCountries();
            setCountriesResult(data);
            setCountriesStatus("success");
        } catch (err) {
            let errorMessage: unknown = "Unknown error";
            try {
                if (err instanceof FunctionsHttpError) errorMessage = await err.context.json();
                else if (err instanceof Error) errorMessage = err.message;
                else if (typeof err === "string") errorMessage = err;
            } catch { errorMessage = "Failed to parse error response"; }
            setCountriesResult({error: errorMessage});
            setCountriesStatus("error");
        }
    }

    // ── Places search ─────────────────────────────────────────
    const [placesQuery, setPlacesQuery] = useState("");
    const [placesStatus, setPlacesStatus] = useState<Status>("idle");
    const [placesResult, setPlacesResult] = useState<unknown>(null);

    async function handleGetPlaces() {
        if (!placesQuery.trim()) return alert("query is required");
        setPlacesStatus("loading");
        try {
            const data = await api.getPlaces(placesQuery.trim());
            setPlacesResult(data);
            setPlacesStatus("success");
            const firstId = (data as { data?: { placeId?: string }[] })?.data?.[0]?.placeId;
            if (firstId) setPlaceId(firstId);
        } catch (err) {
            let errorMessage: unknown = "Unknown error";
            try {
                if (err instanceof FunctionsHttpError) errorMessage = await err.context.json();
                else if (err instanceof Error) errorMessage = err.message;
                else if (typeof err === "string") errorMessage = err;
            } catch { errorMessage = "Failed to parse error response"; }
            setPlacesResult({error: errorMessage});
            setPlacesStatus("error");
        }
    }

    // ── Cities by country ─────────────────────────────────────
    const [citiesCountry, setCitiesCountry] = useState("US");
    const [citiesStatus, setCitiesStatus] = useState<Status>("idle");
    const [citiesResult, setCitiesResult] = useState<unknown>(null);

    async function handleListCities() {
        if (!citiesCountry.trim()) return alert("countryCode is required");
        setCitiesStatus("loading");
        try {
            const data = await api.getCities(citiesCountry.trim().toUpperCase());
            setCitiesResult(data);
            setCitiesStatus("success");
        } catch (err) {
            let errorMessage: unknown = "Unknown error";
            try {
                if (err instanceof FunctionsHttpError) errorMessage = await err.context.json();
                else if (err instanceof Error) errorMessage = err.message;
                else if (typeof err === "string") errorMessage = err;
            } catch { errorMessage = "Failed to parse error response"; }
            setCitiesResult({error: errorMessage});
            setCitiesStatus("error");
        }
    }

    // ── Hotels by PlaceID ─────────────────────────────────────
    const [placeId, setPlaceId] = useState("");
    const [hotelsLimit, setHotelsLimit] = useState("10");
    const [hotelsStatus, setHotelsStatus] = useState<Status>("idle");
    const [hotelsResult, setHotelsResult] = useState<unknown>(null);

    async function handleHotelsByPlace() {
        if (!placeId.trim()) return alert("placeId is required");
        setHotelsStatus("loading");
        try {
            const data = await api.getHotels(
                {placeId: placeId.trim()},
                {limit: Number(hotelsLimit) || 10}
            );
            setHotelsResult(data);
            setHotelsStatus("success");
            const firstId = (data as { data?: { hotelId?: string }[] })?.data?.[0]?.hotelId;
            if (firstId) setRatesHotelIds(firstId);
        } catch (err) {
            let errorMessage: unknown = "Unknown error";
            try {
                if (err instanceof FunctionsHttpError) errorMessage = await err.context.json();
                else if (err instanceof Error) errorMessage = err.message;
                else if (typeof err === "string") errorMessage = err;
            } catch { errorMessage = "Failed to parse error response"; }
            setHotelsResult({error: errorMessage});
            setHotelsStatus("error");
        }
    }

    // ── Hotel Rates ───────────────────────────────────────────
    const [ratesHotelIds, setRatesHotelIds] = useState("");
    const [ratesCheckin, setRatesCheckin] = useState("");
    const [ratesCheckout, setRatesCheckout] = useState("");
    const [ratesCurrency, setRatesCurrency] = useState("USD");
    const [ratesGuestNationality, setRatesGuestNationality] = useState("US");
    const [ratesTimeout, setRatesTimeout] = useState("5");
    const [ratesLimit, setRatesLimit] = useState("");
    const [ratesOffset, setRatesOffset] = useState("");
    const [ratesRoomMapping, setRatesRoomMapping] = useState(false);
    const [occupancies, setOccupancies] = useState<{ adults: number; children: string }[]>([
        {adults: 2, children: ""},
    ]);
    const [ratesStatus, setRatesStatus] = useState<Status>("idle");
    const [ratesResult, setRatesResult] = useState<unknown>(null);
    const [offerId, setOfferId] = useState("");

    function addOccupancy() {
        setOccupancies((prev) => [...prev, {adults: 1, children: ""}]);
    }

    function removeOccupancy(i: number) {
        setOccupancies((prev) => prev.filter((_, idx) => idx !== i));
    }

    function updateOccupancy(i: number, field: "adults" | "children", value: string) {
        setOccupancies((prev) =>
            prev.map((o, idx) => idx === i ? {...o, [field]: field === "adults" ? Number(value) || 1 : value} : o)
        );
    }

    async function handleHotelRates() {
        const ids = ratesHotelIds.split(",").map((s) => s.trim()).filter(Boolean);
        if (!ids.length) return alert("At least one hotelId is required");
        if (!ratesCheckin || !ratesCheckout) return alert("checkin and checkout are required");
        setRatesStatus("loading");
        try {
            const parsedOccupancies = occupancies.map((o) => ({
                adults: o.adults,
                ...(o.children.trim()
                    ? {children: o.children.split(",").map((c) => Number(c.trim())).filter((n) => !isNaN(n))}
                    : {}),
            }));
            const data = await api.getHotelRates({
                hotelIds: ids,
                checkin: ratesCheckin,
                checkout: ratesCheckout,
                occupancies: parsedOccupancies,
                currency: ratesCurrency || undefined,
                guestNationality: ratesGuestNationality || undefined,
                ...(ratesTimeout ? {timeout: Number(ratesTimeout)} : {}),
                ...(ratesLimit ? {limit: Number(ratesLimit)} : {}),
                ...(ratesOffset ? {offset: Number(ratesOffset)} : {}),
                ...(ratesRoomMapping ? {roomMapping: true} : {}),
            });
            setRatesResult(data);
            setRatesStatus("success");
            // Auto-extract first offerId
            type RatesData = { data?: { roomTypes?: { rates?: { offerId?: string }[] }[] }[] };
            const firstOffer = (data as RatesData)?.data?.[0]?.roomTypes?.[0]?.rates?.[0]?.offerId;
            if (firstOffer) setOfferId(firstOffer);
        } catch (err) {
            let errorMessage: unknown = "Unknown error";
            try {
                if (err instanceof FunctionsHttpError) errorMessage = await err.context.json();
                else if (err instanceof Error) errorMessage = err.message;
                else if (typeof err === "string") errorMessage = err;
            } catch { errorMessage = "Failed to parse error response"; }
            setRatesResult({error: errorMessage});
            setRatesStatus("error");
        }
    }

    // ── Prebook ───────────────────────────────────────────────
    const [usePaymentSdk, setUsePaymentSdk] = useState(false);
    const [prebookStatus, setPrebookStatus] = useState<Status>("idle");
    const [prebookResult, setPrebookResult] = useState<unknown>(null);
    const [prebookId, setPrebookId] = useState("");

    async function handlePrebook() {
        if (!offerId.trim()) return alert("offerId is required");
        setPrebookStatus("loading");
        try {
            const data = await api.getRatesPrebook({offerId: offerId.trim(), usePaymentSdk});
            setPrebookResult(data);
            setPrebookStatus("success");
            const id = (data as { data?: { prebookId?: string } })?.data?.prebookId;
            if (id) setPrebookId(id);
        } catch (err) {
            let errorMessage: unknown = "Unknown error";
            try {
                if (err instanceof FunctionsHttpError) errorMessage = await err.context.json();
                else if (err instanceof Error) errorMessage = err.message;
                else if (typeof err === "string") errorMessage = err;
            } catch { errorMessage = "Failed to parse error response"; }
            setPrebookResult({error: errorMessage});
            setPrebookStatus("error");
        }
    }

    // ── Book ──────────────────────────────────────────────────
    const [holderFirst, setHolderFirst] = useState("Jane");
    const [holderLast, setHolderLast] = useState("Doe");
    const [holderEmail, setHolderEmail] = useState("jane@example.com");
    const [holderPhone, setHolderPhone] = useState("+14155552671");
    const [guestFirst, setGuestFirst] = useState("Jane");
    const [guestLast, setGuestLast] = useState("Doe");
    const [guestEmail, setGuestEmail] = useState("jane@example.com");
    const [paymentMethod, setPaymentMethod] = useState<"CREDIT" | "WALLET" | "ACC_CREDIT_CARD">("CREDIT");
    const [bookClientRef, setBookClientRef] = useState("");
    const [bookStatus, setBookStatus] = useState<Status>("idle");
    const [bookResult, setBookResult] = useState<unknown>(null);

    async function handleBook() {
        if (!prebookId.trim()) return alert("prebookId is required — run Prebook first");
        setBookStatus("loading");
        try {
            const data = await api.getRatesBook({
                prebookId: prebookId.trim(),
                holder: {firstName: holderFirst, lastName: holderLast, email: holderEmail, phone: holderPhone},
                guests: [{occupancyNumber: 1, firstName: guestFirst, lastName: guestLast, email: guestEmail}],
                payment: {method: paymentMethod},
                clientReference: bookClientRef.trim() || undefined,
            });
            setBookResult(data);
            setBookStatus("success");
            const id = (data as { data?: { bookingId?: string } })?.data?.bookingId;
            if (id) setRetrieveBookingId(id);
        } catch (err) {
            let errorMessage: unknown = "Unknown error";
            try {
                if (err instanceof FunctionsHttpError) errorMessage = await err.context.json();
                else if (err instanceof Error) errorMessage = err.message;
                else if (typeof err === "string") errorMessage = err;
            } catch { errorMessage = "Failed to parse error response"; }
            setBookResult({error: errorMessage});
            setBookStatus("error");
        }
    }

    // ── Retrieve Booking ──────────────────────────────────────
    const [retrieveBookingId, setRetrieveBookingId] = useState("");
    const [retrieveStatus, setRetrieveStatus] = useState<Status>("idle");
    const [retrieveResult, setRetrieveResult] = useState<unknown>(null);

    async function handleRetrieve() {
        if (!retrieveBookingId.trim()) {
            alert("bookingId is required");
            return;
        }

        setRetrieveStatus("loading");

        try {
            const data = await api.getBooking(retrieveBookingId.trim());
            setRetrieveResult(data);
            setRetrieveStatus("success");
        } catch (err) {
            let errorMessage = "Unknown error";

            try {
                if (err instanceof FunctionsHttpError) {
                    errorMessage = await err.context.json();
                } else if (err instanceof Error) {
                    errorMessage = err.message;
                } else if (typeof err === "string") {
                    errorMessage = err;
                }
            } catch {
                errorMessage = "Failed to parse error response";
            }

            setRetrieveResult({error: errorMessage});
            setRetrieveStatus("error");
        }
    }

    // ── List Bookings ─────────────────────────────────────────
    const [listBookingsUserId, setListBookingsUserId] = useState("");
    const [listBookingsStatus, setListBookingsStatus] = useState<Status>("idle");
    const [listBookingsResult, setListBookingsResult] = useState<unknown>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({data: {user}}) => {
            if (user?.id) setListBookingsUserId(user.id);
        });
    }, []);

    async function handleListBookings() {
        setListBookingsStatus("loading");
        try {
            const data = await api.getListBookings();
            setListBookingsResult(data);
            setListBookingsStatus("success");
        } catch (err) {
            let errorMessage: unknown = "Unknown error";
            try {
                if (err instanceof FunctionsHttpError) errorMessage = await err.context.json();
                else if (err instanceof Error) errorMessage = err.message;
                else if (typeof err === "string") errorMessage = err;
            } catch { errorMessage = "Failed to parse error response"; }
            setListBookingsResult({error: errorMessage});
            setListBookingsStatus("error");
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-5xl mx-auto flex gap-8">

                {/* ── Sticky Sidebar ── */}
                <aside className="w-48 shrink-0">
                    <nav className="sticky top-6 bg-white rounded-xl border border-gray-200 p-3">
                        <ul className="space-y-0.5">
                            {NAV_ITEMS.map((item, i) => {
                                if ("group" in item) {
                                    return (
                                        <li key={i}>
                                            <SectionLabel>{item.group}</SectionLabel>
                                        </li>
                                    );
                                }
                                return (
                                    <li key={item.href}>
                                        <a
                                            href={item.href}
                                            onClick={() => setActiveSection(item.href)}
                                            className={`block text-sm px-2 py-1.5 rounded-md transition-colors ${
                                                activeSection === item.href
                                                    ? "font-semibold text-blue-600 bg-blue-50"
                                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                            }`}
                                        >
                                            {item.label}
                                        </a>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>
                </aside>

                {/* ── Main Content ── */}
                <main className="flex-1 space-y-10 min-w-0">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">API Test Page</h1>
                        <p className="text-sm text-gray-500 mt-1">Dev-only. Test the full booking flow or any individual
                            endpoint.</p>
                    </div>

                    {/* ── How Booking Works ── */}
                    <section id="how-it-works" className="scroll-mt-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">How Booking Works</h2>
                        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">3-Step Flow</h3>
                                <div className="flex items-center gap-3 text-sm">
                                    <div
                                        className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                                        <p className="font-semibold text-blue-800">1. Search Rates</p>
                                        <p className="text-blue-600 text-xs mt-0.5">getHotelRates()</p>
                                    </div>
                                    <div className="text-gray-400 font-bold">→</div>
                                    <div
                                        className="flex-1 bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                                        <p className="font-semibold text-purple-800">2. Prebook</p>
                                        <p className="text-purple-600 text-xs mt-0.5">getRatesPrebook()</p>
                                    </div>
                                    <div className="text-gray-400 font-bold">→</div>
                                    <div
                                        className="flex-1 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                                        <p className="font-semibold text-green-800">3. Book</p>
                                        <p className="text-green-600 text-xs mt-0.5">getRatesBook()</p>
                                    </div>
                                </div>
                            </div>

                            <ol className="space-y-3 text-sm text-gray-700">
                                <li className="flex gap-3">
                                    <span
                                        className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">1</span>
                                    <p>Call <code className="bg-gray-100 px-1 rounded text-xs">getHotelRates()</code> —
                                        extract <code
                                            className="bg-gray-100 px-1 rounded text-xs">offerId</code> from <code
                                            className="bg-gray-100 px-1 rounded text-xs">data.data[].roomTypes[].rates[].offerId</code>
                                    </p>
                                </li>
                                <li className="flex gap-3">
                                    <span
                                        className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">2</span>
                                    <p>Call <code className="bg-gray-100 px-1 rounded text-xs">getRatesPrebook({"{"}offerId,
                                        usePaymentSdk: false{"}"})</code> — extract <code
                                        className="bg-gray-100 px-1 rounded text-xs">data.data.prebookId</code></p>
                                </li>
                                <li className="flex gap-3">
                                    <span
                                        className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 font-bold text-xs flex items-center justify-center">3</span>
                                    <p>Call <code className="bg-gray-100 px-1 rounded text-xs">getRatesBook({"{"}prebookId,
                                        holder, guests, payment{"}"})</code> — get <code
                                        className="bg-gray-100 px-1 rounded text-xs">bookingId</code> + <code
                                        className="bg-gray-100 px-1 rounded text-xs">status</code></p>
                                </li>
                            </ol>

                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-1">
                                <h3 className="text-sm font-semibold text-amber-800 mb-2">Key Notes</h3>
                                <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                                    <li><code className="bg-amber-100 px-1 rounded text-xs">offerId</code> expires —
                                        prebook immediately after fetching rates
                                    </li>
                                    <li>Price may change between rates and prebook — check <code
                                        className="bg-amber-100 px-1 rounded text-xs">priceDifferencePercent</code></li>
                                    <li>Check <code
                                        className="bg-amber-100 px-1 rounded text-xs">cancellationChanged</code> before
                                        confirming with user
                                    </li>
                                    <li>Use <code className="bg-amber-100 px-1 rounded text-xs">payment.method:
                                        "CREDIT"</code> for sandbox testing
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">TypeScript Example</h3>
                                <pre
                                    className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-auto whitespace-pre-wrap">{`// 1. Get rates → extract offerId
const rates = await api.getHotelRates({ hotelIds, checkin, checkout, occupancies });
const offerId = rates.data[0].roomTypes[0].rates[0].offerId;

// 2. Prebook → extract prebookId
const prebook = await api.getRatesPrebook({ offerId, usePaymentSdk: false });
const prebookId = prebook.data.prebookId;

// 3. Book
const booking = await api.getRatesBook({
  prebookId,
  holder: { firstName, lastName, email, phone },
  guests: [{ occupancyNumber: 1, firstName, lastName, email }],
  payment: { method: "CREDIT" },
});
const { bookingId, status } = booking.data;`}</pre>
                            </div>
                        </div>
                    </section>

                    {/* ── API Reference ── */}
                    <section id="api-reference" className="scroll-mt-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-1">API Reference</h2>
                        <p className="text-sm text-gray-500 mb-4">
                            All methods live in <code
                            className="bg-gray-100 px-1 rounded">src/api/liteApi.tsx</code> and call Supabase Edge
                            Functions, which proxy to LiteAPI.{" "}
                            <a href={LITEAPI_DOCS_BASE} target="_blank" rel="noreferrer"
                               className="text-blue-600 hover:underline">Full LiteAPI docs →</a>
                        </p>
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-52">Method</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description
                                        & Params
                                    </th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-20">Docs</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                {API_METHODS.map((m) => (
                                    <tr key={m.name} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 align-top">
                                            <div className="flex flex-col gap-1">
                                                <code
                                                    className="text-xs font-semibold text-gray-900 break-all">{m.name}</code>
                                                <Badge color={m.method === "GET" ? "blue" : "purple"}>{m.method}</Badge>
                                                <span className="text-xs text-gray-400">{m.edge}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            <p className="text-gray-700 mb-1">{m.description}</p>
                                            {m.params !== "none" && (
                                                <p className="text-xs text-gray-500"><span
                                                    className="font-medium">Params:</span> {m.params}</p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-0.5"><span
                                                className="font-medium">Returns:</span> {m.returns}</p>
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            <a
                                                href={`${LITEAPI_DOCS_BASE}${m.doc}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                                            >
                                                Docs →
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* ── API Testers ── */}
                    <section className="scroll-mt-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">API Testers</h2>
                        <div className="bg-white rounded-xl border border-gray-200">
                            <Accordion type="single" collapsible>

                                {/* Countries */}
                                <AccordionItem value="countries" id="test-countries" className="scroll-mt-6 px-6">
                                    <AccordionTrigger
                                        className="text-base font-semibold text-gray-800"
                                        onClick={() => setActiveSection("#test-countries")}
                                    >
                    <span className="flex items-center gap-2">
                      <Badge color="blue">GET</Badge>
                      getCountries — list all countries
                    </span>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-3 pb-2">
                                            <p className="text-xs text-gray-500">No params required. Returns all
                                                countries supported by LiteAPI.</p>
                                            <button
                                                onClick={handleGetCountries}
                                                disabled={countriesStatus === "loading"}
                                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                                            >
                                                {countriesStatus === "loading" ? "Loading…" : "GET /data/countries"}
                                            </button>
                                        </div>
                                        <JsonOutput status={countriesStatus} result={countriesResult}/>
                                        <p className="mt-2 text-xs text-gray-400">Use a
                                            returned <code>countryCode</code> in the Places / Cities tester below.</p>
                                    </AccordionContent>
                                </AccordionItem>

                                {/* Cities by country */}
                                <AccordionItem value="cities" id="test-cities"
                                               className="scroll-mt-6 px-6 border-t border-gray-200">
                                    <AccordionTrigger
                                        className="text-base font-semibold text-gray-800"
                                        onClick={() => setActiveSection("#test-cities")}
                                    >
                    <span className="flex items-center gap-2">
                      <Badge color="blue">GET</Badge>
                      getCities — list places / cities by country
                    </span>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-3 pb-2">
                                            <Field
                                                label="countryCode *"
                                                value={citiesCountry}
                                                onChange={setCitiesCountry}
                                                placeholder="e.g. US"
                                            />
                                            <button
                                                onClick={handleListCities}
                                                disabled={citiesStatus === "loading"}
                                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                                            >
                                                {citiesStatus === "loading" ? "Loading…" : "GET /data/cities"}
                                            </button>
                                        </div>
                                        <JsonOutput status={citiesStatus} result={citiesResult}/>
                                        <p className="mt-2 text-xs text-gray-400">Use a returned <code>placeId</code> in
                                            the Hotels by PlaceID tester below.</p>
                                    </AccordionContent>
                                </AccordionItem>

                                {/* Places search */}
                                <AccordionItem value="places" id="test-places"
                                               className="scroll-mt-6 px-6 border-t border-gray-200">
                                    <AccordionTrigger
                                        className="text-base font-semibold text-gray-800"
                                        onClick={() => setActiveSection("#test-places")}
                                    >
                    <span className="flex items-center gap-2">
                      <Badge color="blue">GET</Badge>
                      getPlaces — search destinations by text
                    </span>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-3 pb-2">
                                            <Field
                                                label="query *"
                                                value={placesQuery}
                                                onChange={setPlacesQuery}
                                                placeholder="e.g. New York, Paris, Tokyo"
                                            />
                                            <button
                                                onClick={handleGetPlaces}
                                                disabled={placesStatus === "loading"}
                                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                                            >
                                                {placesStatus === "loading" ? "Loading…" : "GET /data/places"}
                                            </button>
                                        </div>
                                        <JsonOutput status={placesStatus} result={placesResult}/>
                                        {placeId && (
                                            <p className="mt-2 text-xs text-green-700 bg-green-50 rounded p-2">
                                                placeId auto-filled in Hotels by PlaceID
                                                tester: <strong>{placeId}</strong>
                                            </p>
                                        )}
                                        <p className="mt-2 text-xs text-gray-400">Use a returned <code>placeId</code> in
                                            the Hotels by PlaceID tester.</p>
                                    </AccordionContent>
                                </AccordionItem>

                                {/* Hotels by PlaceID */}
                                <AccordionItem value="hotels-by-place" id="test-hotels-by-place"
                                               className="scroll-mt-6 px-6 border-t border-gray-200">
                                    <AccordionTrigger
                                        className="text-base font-semibold text-gray-800"
                                        onClick={() => setActiveSection("#test-hotels-by-place")}
                                    >
                    <span className="flex items-center gap-2">
                      <Badge color="blue">GET</Badge>
                      getHotels — list hotels by placeId
                    </span>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-3 pb-2">
                                            <Field
                                                label="placeId *"
                                                value={placeId}
                                                onChange={setPlaceId}
                                                placeholder="Auto-filled from Places search, or paste manually"
                                            />
                                            <Field
                                                label="limit"
                                                value={hotelsLimit}
                                                onChange={setHotelsLimit}
                                                placeholder="10"
                                            />
                                            <button
                                                onClick={handleHotelsByPlace}
                                                disabled={hotelsStatus === "loading"}
                                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                                            >
                                                {hotelsStatus === "loading" ? "Loading…" : "GET /hotels/hotels"}
                                            </button>
                                        </div>
                                        <JsonOutput status={hotelsStatus} result={hotelsResult}/>
                                        {ratesHotelIds && (
                                            <p className="mt-2 text-xs text-green-700 bg-green-50 rounded p-2">
                                                hotelId auto-filled in Hotel Rates
                                                tester: <strong>{ratesHotelIds}</strong>
                                            </p>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>

                                {/* Hotel Rates */}
                                <AccordionItem value="hotel-rates" id="test-hotel-rates"
                                               className="scroll-mt-6 px-6 border-t border-gray-200">
                                    <AccordionTrigger
                                        className="text-base font-semibold text-gray-800"
                                        onClick={() => setActiveSection("#test-hotel-rates")}
                                    >
                    <span className="flex items-center gap-2">
                      <Badge color="purple">POST</Badge>
                      getHotelRates — search room rates
                    </span>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-3 pb-2">
                                            <Field
                                                label="hotelIds * (comma-separated)"
                                                value={ratesHotelIds}
                                                onChange={setRatesHotelIds}
                                                placeholder="lp24373, lp1234"
                                            />
                                            <div className="grid grid-cols-2 gap-3">
                                                <Field label="checkin *" value={ratesCheckin} onChange={setRatesCheckin}
                                                       placeholder="YYYY-MM-DD"/>
                                                <Field label="checkout *" value={ratesCheckout}
                                                       onChange={setRatesCheckout} placeholder="YYYY-MM-DD"/>
                                            </div>
                                            {/* Occupancies */}
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <label className="block text-xs font-medium text-gray-600">Occupancies
                                                        *</label>
                                                    <button
                                                        type="button"
                                                        onClick={addOccupancy}
                                                        className="text-xs text-blue-600 hover:underline"
                                                    >
                                                        + Add room
                                                    </button>
                                                </div>
                                                <div className="space-y-2">
                                                    {occupancies.map((o, i) => (
                                                        <div key={i}
                                                             className="flex gap-2 items-start bg-gray-50 rounded-lg p-2 border border-gray-200">
                                                            <div className="flex-1 space-y-1">
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <div>
                                                                        <label
                                                                            className="block text-xs text-gray-500 mb-0.5">Adults</label>
                                                                        <input
                                                                            type="number"
                                                                            min={1}
                                                                            value={o.adults}
                                                                            onChange={(e) => updateOccupancy(i, "adults", e.target.value)}
                                                                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label
                                                                            className="block text-xs text-gray-500 mb-0.5">Children
                                                                            ages (comma-separated)</label>
                                                                        <input
                                                                            type="text"
                                                                            value={o.children}
                                                                            onChange={(e) => updateOccupancy(i, "children", e.target.value)}
                                                                            placeholder="e.g. 5, 10"
                                                                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {occupancies.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeOccupancy(i)}
                                                                    className="text-xs text-red-500 hover:text-red-700 mt-1 shrink-0"
                                                                >
                                                                    Remove
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <Field label="currency" value={ratesCurrency}
                                                       onChange={setRatesCurrency} placeholder="USD"/>
                                                <Field label="guestNationality" value={ratesGuestNationality}
                                                       onChange={setRatesGuestNationality} placeholder="US"/>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                <Field label="timeout (s)" value={ratesTimeout}
                                                       onChange={setRatesTimeout} placeholder="5"/>
                                                <Field label="limit" value={ratesLimit}
                                                       onChange={setRatesLimit} placeholder="optional"/>
                                                <Field label="offset" value={ratesOffset}
                                                       onChange={setRatesOffset} placeholder="optional"/>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    id="ratesRoomMapping"
                                                    type="checkbox"
                                                    checked={ratesRoomMapping}
                                                    onChange={(e) => setRatesRoomMapping(e.target.checked)}
                                                    className="rounded"
                                                />
                                                <label htmlFor="ratesRoomMapping"
                                                       className="text-sm text-gray-600">roomMapping</label>
                                            </div>
                                            <button
                                                onClick={handleHotelRates}
                                                disabled={ratesStatus === "loading"}
                                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                                            >
                                                {ratesStatus === "loading" ? "Loading…" : "POST /hotels/hotels-rates"}
                                            </button>
                                        </div>
                                        <JsonOutput status={ratesStatus} result={ratesResult}/>
                                        {offerId && (
                                            <p className="mt-2 text-xs text-green-700 bg-green-50 rounded p-2">
                                                First offerId auto-filled in Prebook tester: <strong>{offerId}</strong>
                                            </p>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>

                                {/* Prebook */}
                                <AccordionItem value="prebook" id="test-prebook"
                                               className="scroll-mt-6 px-6 border-t border-gray-200">
                                    <AccordionTrigger
                                        className="text-base font-semibold text-gray-800"
                                        onClick={() => setActiveSection("#test-prebook")}
                                    >
                    <span className="flex items-center gap-2">
                      <Badge color="purple">POST</Badge>
                      getRatesPrebook — lock a rate
                    </span>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-3 pb-2">
                                            <Field
                                                label="offerId *"
                                                value={offerId}
                                                onChange={setOfferId}
                                                placeholder="Auto-filled from Hotel Rates, or paste manually"
                                            />
                                            <div className="flex items-center gap-2">
                                                <input
                                                    id="usePaymentSdk"
                                                    type="checkbox"
                                                    checked={usePaymentSdk}
                                                    onChange={(e) => setUsePaymentSdk(e.target.checked)}
                                                    className="rounded"
                                                />
                                                <label htmlFor="usePaymentSdk" className="text-sm text-gray-600">
                                                    usePaymentSdk
                                                </label>
                                            </div>
                                            <button
                                                onClick={handlePrebook}
                                                disabled={prebookStatus === "loading"}
                                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                                            >
                                                {prebookStatus === "loading" ? "Loading…" : "POST /rates/prebook"}
                                            </button>
                                        </div>
                                        <JsonOutput status={prebookStatus} result={prebookResult}/>
                                        {prebookId && (
                                            <p className="mt-2 text-xs text-green-700 bg-green-50 rounded p-2">
                                                prebookId auto-filled in Book tester: <strong>{prebookId}</strong>
                                            </p>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>

                                {/* Book */}
                                <AccordionItem value="book" id="test-book"
                                               className="scroll-mt-6 px-6 border-t border-gray-200">
                                    <AccordionTrigger
                                        className="text-base font-semibold text-gray-800"
                                        onClick={() => setActiveSection("#test-book")}
                                    >
                    <span className="flex items-center gap-2">
                      <Badge color="green">POST</Badge>
                      getRatesBook — complete booking
                    </span>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-3 pb-2">
                                            <Field
                                                label="prebookId *"
                                                value={prebookId}
                                                onChange={setPrebookId}
                                                placeholder="Auto-filled from Prebook, or paste manually"
                                            />

                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-1">Holder</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <Field label="First name" value={holderFirst}
                                                       onChange={setHolderFirst}/>
                                                <Field label="Last name" value={holderLast} onChange={setHolderLast}/>
                                            </div>
                                            <Field label="Email" value={holderEmail} onChange={setHolderEmail}
                                                   type="email"/>
                                            <Field label="Phone" value={holderPhone} onChange={setHolderPhone}
                                                   placeholder="+1..."/>

                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-1">Guest
                                                (occupancy 1)</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <Field label="First name" value={guestFirst} onChange={setGuestFirst}/>
                                                <Field label="Last name" value={guestLast} onChange={setGuestLast}/>
                                            </div>
                                            <Field label="Email" value={guestEmail} onChange={setGuestEmail}
                                                   type="email"/>

                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-1">Reference</p>
                                            <Field
                                                label="clientReference (optional)"
                                                value={bookClientRef}
                                                onChange={setBookClientRef}
                                                placeholder="Defaults to your user ID"
                                            />

                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-1">Payment</p>
                                            <div>
                                                <label
                                                    className="block text-xs font-medium text-gray-600 mb-1">Method</label>
                                                <select
                                                    value={paymentMethod}
                                                    onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="CREDIT">CREDIT</option>
                                                    <option value="WALLET">WALLET</option>
                                                    <option value="ACC_CREDIT_CARD">ACC_CREDIT_CARD</option>
                                                </select>
                                            </div>

                                            <button
                                                onClick={handleBook}
                                                disabled={bookStatus === "loading"}
                                                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                                            >
                                                {bookStatus === "loading" ? "Loading…" : "POST /rates/book"}
                                            </button>
                                        </div>
                                        <JsonOutput status={bookStatus} result={bookResult}/>
                                        {retrieveBookingId && (
                                            <p className="mt-2 text-xs text-green-700 bg-green-50 rounded p-2">
                                                bookingId auto-filled in Retrieve
                                                tester: <strong>{retrieveBookingId}</strong>
                                            </p>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>

                                {/* Retrieve Booking */}
                                <AccordionItem value="retrieve" id="test-retrieve"
                                               className="scroll-mt-6 px-6 border-t border-gray-200">
                                    <AccordionTrigger
                                        className="text-base font-semibold text-gray-800"
                                        onClick={() => setActiveSection("#test-retrieve")}
                                    >
                    <span className="flex items-center gap-2">
                      <Badge color="blue">GET</Badge>
                      getBooking — retrieve booking details
                    </span>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-3 pb-2">
                                            <Field
                                                label="bookingId *"
                                                value={retrieveBookingId}
                                                onChange={setRetrieveBookingId}
                                                placeholder="Auto-filled from Book, or paste manually"
                                            />
                                            <button
                                                onClick={handleRetrieve}
                                                disabled={retrieveStatus === "loading"}
                                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                                            >
                                                {retrieveStatus === "loading" ? "Loading…" : "GET /bookings/{bookingId}"}
                                            </button>
                                        </div>
                                        <JsonOutput status={retrieveStatus} result={retrieveResult}/>
                                    </AccordionContent>
                                </AccordionItem>

                                {/* List Bookings */}
                                <AccordionItem value="list-bookings" id="test-list-bookings"
                                               className="scroll-mt-6 px-6 border-t border-gray-200">
                                    <AccordionTrigger
                                        className="text-base font-semibold text-gray-800"
                                        onClick={() => setActiveSection("#test-list-bookings")}
                                    >
                    <span className="flex items-center gap-2">
                      <Badge color="blue">GET</Badge>
                      getListBookings — list bookings for current user
                    </span>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-xs text-gray-500 mb-3">
                                            Reads from your local Supabase <code
                                            className="bg-gray-100 px-1 rounded">bookings</code> table. RLS filters to
                                            the current user.
                                        </p>
                                        <div className="space-y-3 pb-2">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Your
                                                    user ID (read-only)</label>
                                                <input
                                                    readOnly
                                                    value={listBookingsUserId || "Loading…"}
                                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 font-mono"
                                                />
                                            </div>
                                            <button
                                                onClick={handleListBookings}
                                                disabled={listBookingsStatus === "loading"}
                                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                                            >
                                                {listBookingsStatus === "loading" ? "Loading…" : "SELECT * FROM bookings"}
                                            </button>
                                        </div>
                                        <JsonOutput status={listBookingsStatus} result={listBookingsResult}/>
                                    </AccordionContent>
                                </AccordionItem>

                            </Accordion>
                        </div>
                    </section>

                    {/* ── API Docs ── */}
                    {([
                        {id: "doc-hotels-rates", title: "hotels-rates", content: hotelsRatesMd},
                        {id: "doc-rates-prebook", title: "rates-prebook", content: ratesPrebookMd},
                        {id: "doc-rates-book", title: "rates-book", content: ratesBookMd},
                        {id: "doc-bookings-retrieve", title: "bookings-retrieve", content: bookingsRetrieveMd},
                        {id: "doc-listbookings", title: "listbookings", content: listbookingsMd},
                    ] as { id: string; title: string; content: string }[]).map(({id, title, content}) => (
                        <section key={id} id={id} className="scroll-mt-6">
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <SimpleMarkdown content={content}/>
                            </div>
                        </section>
                    ))}

                </main>
            </div>
        </div>
    );
}
