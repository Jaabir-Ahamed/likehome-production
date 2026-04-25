import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Edit2, Camera, Trophy } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { useAuth } from '../contexts/AuthContext';
import { useRewards } from '../contexts/RewardsContext';
import { api } from '../../api/liteApi';
import { toast } from 'sonner';

function splitPhoneParts(rawPhone: string): { phoneCode: string; phoneNumber: string } {
  const normalized = rawPhone.trim();
  if (!normalized) return { phoneCode: '+1', phoneNumber: '' };
  const match = normalized.match(/^(\+\d{1,4})(.*)$/);
  if (!match) return { phoneCode: '+1', phoneNumber: normalized };
  return {
    phoneCode: match[1],
    phoneNumber: match[2].trim(),
  };
}

export function ProfilePage() {
  const { user } = useAuth();
  const { points, pointsToDollars, loading: rewardsLoading } = useRewards();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // Editable fields — populated from the profiles table on mount
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phoneCode: '+1',
    phoneNumber: '',
    location: '',
    dateOfBirth: '',
    joinedDate: '',
    bio: '',
  });

  // Load real profile from Supabase profiles table on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await api.getProfile();
        if (profile) {
          const metadataPhone = typeof user?.user_metadata?.phone === 'string' ? user.user_metadata.phone : '';
          const metadataLocation = typeof user?.user_metadata?.location === 'string' ? user.user_metadata.location : '';
          const metadataDateOfBirth = typeof user?.user_metadata?.date_of_birth === 'string' ? user.user_metadata.date_of_birth : '';
          const metadataBio = typeof user?.user_metadata?.bio === 'string' ? user.user_metadata.bio : '';
          const phoneFromProfile =
            typeof profile.phone === 'string' && profile.phone.length > 0
              ? profile.phone
              : metadataPhone;
          const { phoneCode, phoneNumber } = splitPhoneParts(phoneFromProfile);
          setUserData({
            name: profile.full_name ?? '',
            email: profile.email ?? user?.email ?? '',
            phoneCode,
            phoneNumber,
            location: metadataLocation,
            dateOfBirth: metadataDateOfBirth,
            joinedDate: new Date(profile.created_at).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            }),
            bio: metadataBio,
          });
        }
      } catch (err) {
        toast.error('Failed to load profile.');
      } finally {
        setProfileLoading(false);
      }
    };

    if (user) loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) {
      toast.error('You must be signed in to save your profile.');
      return;
    }
    setSaving(true);
    try {
      const { supabase } = await import('../../lib/supabaseClient');
      const trimmedName = userData.name.trim();
      const trimmedPhoneCode = userData.phoneCode.trim() || '+1';
      const trimmedPhoneNumber = userData.phoneNumber.trim();
      const trimmedPhone = `${trimmedPhoneCode}${trimmedPhoneNumber}`;
      const trimmedLocation = userData.location.trim();
      const trimmedDateOfBirth = userData.dateOfBirth.trim();
      const trimmedBio = userData.bio.trim();

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: trimmedName })
        .eq('id', user.id);

      if (profileError) throw profileError;

      const { data: authData, error: authError } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          phone: trimmedPhone,
          location: trimmedLocation,
          date_of_birth: trimmedDateOfBirth,
          bio: trimmedBio,
        },
      });
      if (authError) throw authError;

      const refreshed = await api.getProfile();
      const nextPhone =
        typeof authData.user?.user_metadata?.phone === 'string'
          ? authData.user.user_metadata.phone
          : trimmedPhone;
      const { phoneCode: nextPhoneCode, phoneNumber: nextPhoneNumber } = splitPhoneParts(nextPhone);
      const nextLocation =
        typeof authData.user?.user_metadata?.location === 'string'
          ? authData.user.user_metadata.location
          : trimmedLocation;
      const nextDateOfBirth =
        typeof authData.user?.user_metadata?.date_of_birth === 'string'
          ? authData.user.user_metadata.date_of_birth
          : trimmedDateOfBirth;
      const nextBio =
        typeof authData.user?.user_metadata?.bio === 'string'
          ? authData.user.user_metadata.bio
          : trimmedBio;
      if (refreshed) {
        setUserData((prev) => ({
          ...prev,
          name: refreshed.full_name ?? trimmedName,
          email: refreshed.email ?? user.email ?? prev.email,
          ...(splitPhoneParts(
            typeof refreshed.phone === 'string' && refreshed.phone.length > 0
              ? refreshed.phone
              : nextPhone
          )),
          location: nextLocation,
          dateOfBirth: nextDateOfBirth,
          bio: nextBio,
        }));
      } else {
        setUserData((prev) => ({
          ...prev,
          name: trimmedName,
          phoneCode: nextPhoneCode,
          phoneNumber: nextPhoneNumber,
          location: nextLocation,
          dateOfBirth: nextDateOfBirth,
          bio: nextBio,
        }));
      }

      toast.success('Profile updated!');
      setIsEditing(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save profile.';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  // Initials for avatar fallback
  const initials = userData.name
    ? userData.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? '?';

  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    '';

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2563eb] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-4xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-bold text-[#1f2937] mb-2">My Profile</h1>
          <p className="text-[#6b7280]">Manage your personal information and preferences</p>
        </div>

        {/* Profile Card */}
        <Card className="p-8 mb-6 border-gray-200">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-8">

            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-32 w-32">
                <AvatarImage src={avatarUrl} alt={userData.name} />
                <AvatarFallback className="bg-[#2563eb] text-white text-3xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 bg-[#2563eb] text-white p-2 rounded-full hover:bg-[#1d4ed8] transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Name / bio / edit button */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-[#1f2937]">
                  {userData.name || user?.email}
                </h2>
                <Button
                  variant={isEditing ? 'default' : 'outline'}
                  size="sm"
                  disabled={saving}
                  onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                  className={isEditing ? 'bg-[#2563eb] hover:bg-[#1d4ed8]' : ''}
                >
                  {saving ? (
                    'Saving...'
                  ) : isEditing ? (
                    'Save Changes'
                  ) : (
                    <>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </>
                  )}
                </Button>
              </div>

              {isEditing ? (
                <Input
                  value={userData.bio}
                  placeholder="Tell us about yourself..."
                  onChange={(e) => setUserData({ ...userData, bio: e.target.value })}
                  className="mb-4"
                />
              ) : (
                <p className="text-[#6b7280] mb-4">
                  {userData.bio || 'No bio yet.'}
                </p>
              )}

              <div className="flex items-center gap-2 text-sm text-[#6b7280]">
                <Calendar className="w-4 h-4" />
                <span>Member since {userData.joinedDate || '—'}</span>
              </div>
            </div>
          </div>

          <Separator className="my-8" />

          {/* Personal Information */}
          <div className="space-y-6">
            <h3 className="font-semibold text-[#1f2937] mb-4">Personal Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2 text-[#1f2937]">
                  <User className="w-4 h-4" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={userData.name}
                  onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                  disabled={!isEditing}
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-[#1f2937]">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                {/* Email comes from auth, not editable here */}
                <Input
                  id="email"
                  type="email"
                  value={userData.email}
                  disabled
                  className="bg-gray-50 text-[#6b7280]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2 text-[#1f2937]">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="phoneCode"
                    type="tel"
                    value={userData.phoneCode}
                    onChange={(e) => setUserData({ ...userData, phoneCode: e.target.value })}
                    disabled={!isEditing}
                    className="bg-white w-24"
                  />
                  <Input
                    id="phone"
                    type="tel"
                    value={userData.phoneNumber}
                    onChange={(e) => setUserData({ ...userData, phoneNumber: e.target.value })}
                    disabled={!isEditing}
                    className="bg-white flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2 text-[#1f2937]">
                  <MapPin className="w-4 h-4" />
                  Location
                </Label>
                <Input
                  id="location"
                  value={userData.location}
                  onChange={(e) => setUserData({ ...userData, location: e.target.value })}
                  disabled={!isEditing}
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob" className="flex items-center gap-2 text-[#1f2937]">
                  <Calendar className="w-4 h-4" />
                  Date of Birth
                </Label>
                <Input
                  id="dob"
                  type="date"
                  value={userData.dateOfBirth}
                  onChange={(e) => setUserData({ ...userData, dateOfBirth: e.target.value })}
                  disabled={!isEditing}
                  className="bg-white"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 border-gray-200 text-center">
            <div className="text-4xl font-bold text-[#2563eb] mb-2">12</div>
            <p className="text-[#6b7280]">Total Bookings</p>
          </Card>

          <Card className="p-6 border-gray-200 text-center">
            <div className="text-4xl font-bold text-[#f59e0b] mb-2">8</div>
            <p className="text-[#6b7280]">Favorite Hotels</p>
          </Card>

          <Card className="p-6 border-gray-200 text-center">
            <div className="text-4xl font-bold text-[#10b981] mb-2">15</div>
            <p className="text-[#6b7280]">Cities Visited</p>
          </Card>

          {/* Rewards points card — pulls from RewardsContext */}
          <Card className="p-6 border-gray-200 text-center bg-gradient-to-br from-amber-50 to-yellow-50">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="w-6 h-6 text-[#f59e0b]" />
              <div className="text-4xl font-bold text-[#f59e0b]">
                {rewardsLoading ? '...' : (points ?? 0).toLocaleString()}
              </div>
            </div>
            <p className="text-[#6b7280]">Reward Points</p>
            {!rewardsLoading && points !== null && points > 0 && (
              <p className="text-xs text-amber-600 mt-1">
                ≈ ${pointsToDollars(points).toFixed(2)} value
              </p>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
}
