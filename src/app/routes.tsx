import { createBrowserRouter } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { HomePage } from "./pages/HomePage";
import { HotelListingPage } from "./pages/HotelListingPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Profile from "./pages/Profile";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "hotels", element: <HotelListingPage /> },

      {
        path: "profile",
        element: (
            <ProtectedRoute>
                <Profile />
            </ProtectedRoute>
        ),
      },

      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);