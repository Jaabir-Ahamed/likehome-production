import { useEffect, useRef } from "react";
import { Outlet, useNavigate } from "react-router";
import { Header } from "../components/Header";
import { CurrencyProvider } from "../contexts/CurrencyContext";
import { Toaster } from "../components/ui/sonner";
import { useAuth } from "../contexts/AuthContext";

/**
 * Consumes the 'loginRedirect' key that HotelDetailsPage or ProtectedLayout
 * saves to sessionStorage before sending an unauthenticated user to /login.
 * Fires when the user becomes logged-in on ANY page inside RootLayout,
 * covering both email/password and OAuth login flows.
 */
function AuthRedirectHandler() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      handled.current = false;
      return;
    }

    if (handled.current) return;
    handled.current = true;

    const redirect = sessionStorage.getItem('loginRedirect');
    if (redirect) {
      sessionStorage.removeItem('loginRedirect');
      navigate(redirect, { replace: true });
    }
  }, [user, loading, navigate]);

  return null;
}

export function RootLayout() {
  return (
    <CurrencyProvider>
      <AuthRedirectHandler />
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Toaster />
      </div>
    </CurrencyProvider>
  );
}