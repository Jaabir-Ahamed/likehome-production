import {Bell, ChevronDown, CreditCard, Home, LogOut, Search, Settings, User} from 'lucide-react';
import {Link} from 'react-router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {Button} from './ui/button';
import imgFlagIcon from '../../assets/931d54a4b25c0576599d8d5399c4280f06c9318a.png';
import {useAuth} from "../../context/AuthContext";
import {supabase} from "../../lib/supabaseClient";

export function Header() {
  const { user } = useAuth();
  const avatarUrl =
      user?.user_metadata?.avatar_url ||
      user?.user_metadata?.picture;
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 border-b border-gray-200">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-24">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Home className="w-8 h-8 text-[#2563eb]" />
            <span className="text-3xl font-bold text-[#454545]">LikeHome</span>
          </Link>

          {/* Center Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link to="/" className="text-[#1f2937] hover:text-[#2563eb] transition-colors font-medium">
              Home
            </Link>
            <Link to="/hotels" className="text-[#1f2937] hover:text-[#2563eb] transition-colors font-medium">
              Hotels
            </Link>
            <Link to="/bookings" className="text-[#1f2937] hover:text-[#2563eb] transition-colors font-medium">
              My Bookings
            </Link>
            <Link to="/favorites" className="text-[#1f2937] hover:text-[#2563eb] transition-colors font-medium">
              Favorites
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-6">
            {/* Currency Selector */}
            <button className="hidden md:flex items-center gap-1 text-[#1f2937] hover:text-[#2563eb] transition-colors">
              <img src={imgFlagIcon} alt="USD" className="w-5 h-3 object-contain" />
              <span className="font-medium">USD</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {/* List Property Link */}
            <Link 
              to="/list-property" 
              className="hidden md:block text-[#1f2937] hover:text-[#2563eb] transition-colors font-medium"
            >
              List Your Property
            </Link>

            {/* Support Link */}
            <Link 
              to="/support" 
              className="hidden md:block text-[#1f2937] hover:text-[#2563eb] transition-colors font-medium"
            >
              Support
            </Link>

            {/* Search Icon */}
            <Button variant="ghost" size="icon" className="rounded-full">
              <Search className="w-5 h-5 text-[#1f2937]" />
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative rounded-full">
              <Bell className="w-5 h-5 text-[#1f2937]" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#f59e0b] rounded-full"></span>
            </Button>

            {/* User Avatar Dropdown */}
            {user
                ? <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center justify-center w-10 h-10 rounded-full bg-[#2563eb] text-white hover:opacity-90 transition-opacity">
                      {avatarUrl ? (
                          <img
                              src={avatarUrl}
                              alt="User avatar"
                              className="w-10 h-10 rounded-full object-cover"
                          />
                      ) : (
                          <User className="w-5 h-5" />
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span>Payments</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="text-red-600"
                        onClick={async () => {
                          await supabase.auth.signOut();
                        }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                :  (
                    <Button
                        onClick={async () => {
                          await supabase.auth.signInWithOAuth({
                            provider: "google",
                          });
                        }}
                        className="bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                    >
                      Login with Google
                    </Button>
                )}

          </div>
        </div>
      </div>
    </header>
  );
}