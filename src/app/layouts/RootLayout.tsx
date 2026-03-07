import { Outlet } from "react-router";
import { Header } from "../components/Header";
import { CurrencyProvider } from "../contexts/CurrencyContext";
import { Toaster } from "../components/ui/sonner";

export function RootLayout() {
  return (
    <CurrencyProvider>
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