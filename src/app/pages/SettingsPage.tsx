import { useState } from 'react';
import { 
  Shield, 
  Moon, 
  MapPin, 
  Bell, 
  Globe, 
  Lock, 
  Eye, 
  UserCheck,
  Smartphone,
  Cookie,
  Database
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

export function SettingsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState('public');
  const [showBookingHistory, setShowBookingHistory] = useState(true);
  const [allowDataSharing, setAllowDataSharing] = useState(false);
  const [cookies, setCookies] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [language, setLanguage] = useState('en');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1f2937] mb-2">
            Settings
          </h1>
          <p className="text-lg text-[#717182]">
            Manage your account preferences and privacy settings
          </p>
        </div>

        {/* Appearance Settings */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#2563eb]/10 rounded-lg flex items-center justify-center">
              <Moon className="w-5 h-5 text-[#2563eb]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1f2937]">Appearance</h2>
              <p className="text-sm text-[#717182]">Customize how LikeHome looks</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode" className="text-base font-medium text-[#1f2937]">
                  Dark Mode
                </Label>
                <p className="text-sm text-[#717182]">
                  Switch between light and dark themes
                </p>
              </div>
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={setDarkMode}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="language" className="text-base font-medium text-[#1f2937]">
                Language
              </Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="language" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Privacy Settings */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#10b981]/10 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#10b981]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1f2937]">Privacy</h2>
              <p className="text-sm text-[#717182]">Control your privacy and data</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="profile-visibility" className="text-base font-medium text-[#1f2937] flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Profile Visibility
                </Label>
                <p className="text-sm text-[#717182]">
                  Who can see your profile information
                </p>
              </div>
              <Select value={profileVisibility} onValueChange={setProfileVisibility}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="friends">Friends Only</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="booking-history" className="text-base font-medium text-[#1f2937]">
                  Show Booking History
                </Label>
                <p className="text-sm text-[#717182]">
                  Display your booking history on your profile
                </p>
              </div>
              <Switch
                id="booking-history"
                checked={showBookingHistory}
                onCheckedChange={setShowBookingHistory}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="data-sharing" className="text-base font-medium text-[#1f2937] flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Data Sharing
                </Label>
                <p className="text-sm text-[#717182]">
                  Share anonymous data to improve our services
                </p>
              </div>
              <Switch
                id="data-sharing"
                checked={allowDataSharing}
                onCheckedChange={setAllowDataSharing}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="cookies" className="text-base font-medium text-[#1f2937] flex items-center gap-2">
                  <Cookie className="w-4 h-4" />
                  Cookie Preferences
                </Label>
                <p className="text-sm text-[#717182]">
                  Allow cookies for better experience
                </p>
              </div>
              <Switch
                id="cookies"
                checked={cookies}
                onCheckedChange={setCookies}
              />
            </div>
          </div>
        </Card>

        {/* Location Settings */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#f59e0b]/10 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-[#f59e0b]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1f2937]">Location</h2>
              <p className="text-sm text-[#717182]">Manage location permissions</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="location" className="text-base font-medium text-[#1f2937]">
                  Location Services
                </Label>
                <p className="text-sm text-[#717182]">
                  Allow LikeHome to access your location for better recommendations
                </p>
              </div>
              <Switch
                id="location"
                checked={locationEnabled}
                onCheckedChange={setLocationEnabled}
              />
            </div>

            {locationEnabled && (
              <div className="ml-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-[#2563eb]">
                  <Globe className="w-4 h-4 inline mr-2" />
                  Location services are enabled. We'll show you hotels near you.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Notification Settings */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#8b5cf6]/10 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-[#8b5cf6]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1f2937]">Notifications</h2>
              <p className="text-sm text-[#717182]">Choose what notifications you receive</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notif" className="text-base font-medium text-[#1f2937] flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  Push Notifications
                </Label>
                <p className="text-sm text-[#717182]">
                  Receive push notifications about bookings and deals
                </p>
              </div>
              <Switch
                id="push-notif"
                checked={pushNotifications}
                onCheckedChange={setPushNotifications}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notif" className="text-base font-medium text-[#1f2937]">
                  Email Notifications
                </Label>
                <p className="text-sm text-[#717182]">
                  Get email updates about your bookings
                </p>
              </div>
              <Switch
                id="email-notif"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="marketing" className="text-base font-medium text-[#1f2937]">
                  Marketing Emails
                </Label>
                <p className="text-sm text-[#717182]">
                  Receive promotional offers and deals
                </p>
              </div>
              <Switch
                id="marketing"
                checked={marketingEmails}
                onCheckedChange={setMarketingEmails}
              />
            </div>
          </div>
        </Card>

        {/* Security Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#ef4444]/10 rounded-lg flex items-center justify-center">
              <Lock className="w-5 h-5 text-[#ef4444]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1f2937]">Security</h2>
              <p className="text-sm text-[#717182]">Protect your account</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="2fa" className="text-base font-medium text-[#1f2937] flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Two-Factor Authentication
                </Label>
                <p className="text-sm text-[#717182]">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Switch
                id="2fa"
                checked={twoFactorAuth}
                onCheckedChange={setTwoFactorAuth}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
