import {Bell, ChevronDown, CreditCard, Heart, Home, LogOut, Search, Settings, User, X} from 'lucide-react';
import {Link} from 'react-router';
import {useState} from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {Button} from './ui/button';
import {ListPropertyDialog} from './ListPropertyDialog';
import {Currency, useCurrency} from '../contexts/CurrencyContext';
import {useAuth} from "../../context/AuthContext";
import {supabase} from "../../lib/supabaseClient";
import {Badge} from './ui/badge';
import {ScrollArea} from './ui/scroll-area';
import {Separator} from './ui/separator';

const currencyFlags: Record<Currency, string> = {
  USD: '🇺🇸',
  EUR: '🇪🇺',
  GBP: '🇬🇧',
  JPY: '🇯🇵',
  AUD: '🇦🇺',
  CAD: '🇨🇦',
};

// Mock notifications data
const notifications = [
  {
    id: 1,
    type: 'deal',
    title: '50% Off Weekend Stays',
    description: 'Limited time offer for selected hotels in Paris',
    time: '2 hours ago',
    isNew: true,
  },
  {
    id: 2,
    type: 'favorite',
    title: 'Price Drop Alert',
    description: 'The Grand Palace Hotel is now $280/night (was $320)',
    time: '5 hours ago',
    isNew: true,
  },
  {
    id: 3,
    type: 'deal',
    title: 'Early Bird Special',
    description: 'Book 30 days in advance and save up to 40%',
    time: '1 day ago',
    isNew: false,
  },
  {
    id: 4,
    type: 'favorite',
    title: 'New Availability',
    description: 'Ocean View Resort has rooms available for your dates',
    time: '2 days ago',
    isNew: false,
  },
  {
    id: 5,
    type: 'deal',
    title: 'Flash Sale: Tokyo Hotels',
    description: 'Up to 35% off on 4-star hotels in Tokyo',
    time: '3 days ago',
    isNew: false,
  },
];

export function Header() {
  const { user } = useAuth();
  const avatarUrl =
      user?.user_metadata?.avatar_url ||
      user?.user_metadata?.picture;
  const { currency, setCurrency } = useCurrency();
  const [notificationsList, setNotificationsList] = useState(notifications);

  const clearAllNotifications = () => {
    setNotificationsList([]);
  };

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
            <DropdownMenu>
              <DropdownMenuTrigger className="hidden md:flex items-center gap-1 text-[#1f2937] hover:text-[#2563eb] transition-colors outline-none">
                <span className="text-lg">{currencyFlags[currency]}</span>
                <span className="font-medium">{currency}</span>
                <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {(Object.keys(currencyFlags) as Currency[]).map((curr) => (
                  <DropdownMenuItem
                    key={curr}
                    onClick={() => setCurrency(curr)}
                    className={currency === curr ? 'bg-accent' : ''}
                  >
                    <span className="mr-2">{currencyFlags[curr]}</span>
                    <span>{curr}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* List Property Dialog */}
            <div className="hidden md:block">
              <ListPropertyDialog />
            </div>

            {/* Search Icon */}
            <Link to="/hotels" className="inline-flex items-center justify-center rounded-full h-10 w-10 hover:bg-accent hover:text-accent-foreground">
              <Search className="w-5 h-5 text-[#1f2937]" />
            </Link>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger className="relative inline-flex items-center justify-center rounded-full h-10 w-10 hover:bg-accent hover:text-accent-foreground outline-none">
                <Bell className="w-5 h-5 text-[#1f2937]" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#f59e0b] rounded-full"></span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-96">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-[#1f2937]">Notifications</h3>
                    <p className="text-sm text-[#6b7280]">You have {notificationsList.filter(n => n.isNew).length} new notifications</p>
                  </div>
                  {notificationsList.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-[#717182] hover:text-[#1f2937] transition-colors p-1 rounded hover:bg-gray-100"
                      title="Clear all notifications"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <ScrollArea className="h-[400px]">
                  <div className="p-2">
                    {notificationsList.length === 0 ? (
                      <div className="p-8 text-center text-[#717182]">
                        <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No notifications</p>
                      </div>
                    ) : (
                      <>
                        {notificationsList.map((notification, index) => (
                          <div key={notification.id}>
                            <div className="p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors">
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-full ${
                                  notification.type === 'deal' 
                                    ? 'bg-[#f59e0b]/10 text-[#f59e0b]' 
                                    : 'bg-[#ef4444]/10 text-[#ef4444]'
                                }`}>
                                  {notification.type === 'deal' ? (
                                    <span className="text-lg">🎉</span>
                                  ) : (
                                    <Heart className="w-4 h-4 fill-current" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className="font-medium text-sm text-[#1f2937]">
                                      {notification.title}
                                    </h4>
                                    {notification.isNew && (
                                      <Badge className="bg-[#2563eb] hover:bg-[#1d4ed8] text-xs px-2 py-0">
                                        New
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-[#6b7280] mt-1 line-clamp-2">
                                    {notification.description}
                                  </p>
                                  <span className="text-xs text-[#9ca3af] mt-1 block">
                                    {notification.time}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {index < notificationsList.length - 1 && (
                              <Separator className="my-1" />
                            )}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </ScrollArea>
                <div className="p-3 border-t">
                  <Button variant="ghost" className="w-full text-[#2563eb] hover:text-[#1d4ed8]">
                    View All Notifications
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Avatar Dropdown */}
            {user
                ? <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-full h-10 w-10 hover:bg-accent hover:text-accent-foreground outline-none">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#2563eb] text-white">
                      {avatarUrl ? (
                          <img
                              src={avatarUrl}
                              alt="User avatar"
                              className="w-10 h-10 rounded-full object-cover"
                          />
                      ) : (
                          <User className="w-5 h-5" />
                      )}
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <Link to="/profile">
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                </Link>
                <Link to="/payments">
                  <DropdownMenuItem>
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Payments</span>
                  </DropdownMenuItem>
                </Link>
                <Link to="/settings">
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                </Link>
                    <DropdownMenuSeparator />
                    <Link to="/login">
                  <DropdownMenuItem
                        className="text-red-600"
                    onClick={async () => {
                          await supabase.auth.signOut();
                        }}
                    ><LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </Link>
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