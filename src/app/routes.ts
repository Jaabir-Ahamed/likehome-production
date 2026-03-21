import {createBrowserRouter} from "react-router";

import {RootLayout} from "./layouts/RootLayout";
import {ProtectedLayout} from "./layouts/ProtectedLayout";

import {HomePage} from "./pages/HomePage";
import {HotelListingPage} from "./pages/HotelListingPage";
import {HotelDetailsPage} from "./pages/HotelDetailsPage";
import {PaymentPage} from "./pages/PaymentPage";
import {ProfilePage} from "./pages/ProfilePage";
import {MyBookingsPage} from "./pages/MyBookingsPage";
import {FavoritesPage} from "./pages/FavoritesPage";
import {PaymentsPage} from "./pages/PaymentsPage";
import {CitiesPage} from "./pages/CitiesPage";
import {SettingsPage} from "./pages/SettingsPage";
import {LoginPage} from "./pages/LoginPage";
import {SignupPage} from "./pages/SignupPage";
import {NotFoundPage} from "./pages/NotFoundPage";
import {ApiTestPage} from "./pages/ApiTestPage";

export const router = createBrowserRouter([
    {
        path: "/",
        Component: RootLayout,
        children: [
            {index: true, Component: HomePage},
            {path: "hotels", Component: HotelListingPage},
            {path: "hotel/:id", Component: HotelDetailsPage},
            {path: "cities", Component: CitiesPage},


            // ✅ Protected routes grouped together
            {
                Component: ProtectedLayout,
                children: [
                    {path: "payment", Component: PaymentPage},
                    {path: "payment/:id", Component: PaymentPage},
                    {path: "profile", Component: ProfilePage},
                    {path: "bookings", Component: MyBookingsPage},
                    {path: "favorites", Component: FavoritesPage},
                    {path: "payments", Component: PaymentsPage},
                    {path: "settings", Component: SettingsPage},

                    {path: "test", Component: ApiTestPage},
                ],
            },

            {path: "*", Component: NotFoundPage},
        ],
    },

    // ✅ Auth routes outside main layout
    {
        path: "/login",
        Component: LoginPage,
    },
    {
        path: "/signup",
        Component: SignupPage,
    },
]);