import { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Edit2, Trophy } from 'lucide-react';
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

const PHONE_CODES = [
  { code: '+1', short: 'USA' },
  { code: '+1', short: 'CAN' },
  { code: '+44', short: 'GBR' },
  { code: '+61', short: 'AUS' },
  { code: '+49', short: 'DEU' },
  { code: '+33', short: 'FRA' },
  { code: '+81', short: 'JPN' },
  { code: '+86', short: 'CHN' },
  { code: '+91', short: 'IND' },
  { code: '+55', short: 'BRA' },
  { code: '+52', short: 'MEX' },
  { code: '+34', short: 'ESP' },
  { code: '+39', short: 'ITA' },
  { code: '+7', short: 'RUS' },
  { code: '+82', short: 'KOR' },
  { code: '+65', short: 'SGP' },
  { code: '+971', short: 'UAE' },
  { code: '+966', short: 'SAU' },
  { code: '+31', short: 'NLD' },
  { code: '+46', short: 'SWE' },
];
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phoneCode: '+1',
    phoneNumber: '',
    location: '',
    dateOfBirth: '',
    joinedDate: '',
    bio: '',
    avatarUrl: '',
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
            avatarUrl:
              (typeof (profile as { avatar_url?: string | null }).avatar_url === 'string' &&
                (profile as { avatar_url?: string | null }).avatar_url) ||
              (typeof user?.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : '') ||
              (typeof user?.user_metadata?.picture === 'string' ? user.user_metadata.picture : ''),
          });
        }
      } catch {
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${user.id}/avatar.${ext}`;

    setAvatarUploading(true);
    try {
      const { supabase } = await import('../../lib/supabaseClient');

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (dbError) throw dbError;

      setUserData(prev => ({ ...prev, avatarUrl: publicUrl }));
      toast.success('Profile picture updated!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to upload image.';
      toast.error(msg);
    } finally {
      setAvatarUploading(false);
      // Reset file input so the same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const initials = userData.name
    ? userData.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? '?';

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background to-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2563eb] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-4xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-bold text-bold-text mb-2">My Profile</h1>
          <p className="text-[#6b7280]">Manage your personal information and preferences</p>
        </div>

        {/* Profile Card */}
        <Card className="p-8 mb-6 border-gray-200 bg-card">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-8">

            {/* Avatar with upload */}
            <div className="relative">
              <Avatar className="h-32 w-32">
                <AvatarImage src={userData.avatarUrl} alt={userData.name} />
                <AvatarFallback className="bg-[#2563eb] text-white text-3xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <button
                type="button"
                disabled={avatarUploading}
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-[#2563eb] text-white p-2 rounded-full hover:bg-[#1d4ed8] transition-colors disabled:opacity-60"
                aria-label="Upload profile picture"
              >
                {avatarUploading ? (
                  <div className="w-4 h-4 border-2 bg-background border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Name / bio / edit button */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-bold-text">
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
            <h3 className="font-semibold text-bold-text mb-4">Personal Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2 text-bold-text">
                  <User className="w-4 h-4" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={userData.name}
                  onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                  disabled={!isEditing}
                  className="bg-input-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-bold-text">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={userData.email}
                  disabled
                  className="bg-input-background text-[#6b7280]"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-bold-text">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </Label>
                <div className="flex gap-2">
                  <select
                    className="border border-input bg-input-background rounded-md px-3 py-1 text-sm bg-background w-28 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    value={userData.phoneCode}
                    disabled={!isEditing}
                    onChange={(e) => setUserData({ ...userData, phoneCode: e.target.value })}
                  >
                    {PHONE_CODES.map((c, i) => (
                      <option key={i} value={c.code}>
                        {c.short} {c.code}
                      </option>
                    ))}
                  </select>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="e.g. 5106579876"
                    value={userData.phoneNumber}
                    onChange={(e) => setUserData({ ...userData, phoneNumber: e.target.value })}
                    disabled={!isEditing}
                    className="bg-input-background flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2 text-bold-text">
                  <MapPin className="w-4 h-4" />
                  Location
                </Label>
                <Input
                  id="location"
                  value={userData.location}
                  onChange={(e) => setUserData({ ...userData, location: e.target.value })}
                  disabled={!isEditing}
                  placeholder='Enter a Location'
                  className="bg-input-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob" className="flex items-center gap-2 text-bold-text">
                  <Calendar className="w-4 h-4" />
                  Date of Birth
                </Label>
                <Input
                  id="dob"
                  type="date"
                  value={userData.dateOfBirth}
                  onChange={(e) => setUserData({ ...userData, dateOfBirth: e.target.value })}
                  disabled={!isEditing}
                  className="bg-input-background"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 border-gray-200 text-center">
            <div className="text-4xl font-bold text-[#2563eb] mb-2">12</div>
            <p className="text-bold-text">Total Bookings</p>
          </Card>

          <Card className="p-6 border-gray-200 text-center">
            <div className="text-4xl font-bold text-[#f59e0b] mb-2">8</div>
            <p className="text-bold-text">Favorite Hotels</p>
          </Card>

          <Card className="p-6 border-gray-200 text-center">
            <div className="text-4xl font-bold text-[#10b981] mb-2">15</div>
            <p className="text-bold-text">Cities Visited</p>
          </Card>

          {/* Rewards points card — pulls from RewardsContext */}
          <Card className="p-6 border border-gray-200 text-center bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-[#1a2838] dark:to-[#0a0e16]">

            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="w-6 h-6 text-[#f59e0b] dark:text-amber-400" />

              <div className="text-4xl font-bold text-[#f59e0b] dark:text-amber-400">
                {rewardsLoading ? '...' : (points ?? 0).toLocaleString()}
              </div>
            </div>

            <p className="text-bold-text">
              Reward Points
            </p>

            {!rewardsLoading && points !== null && points > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                ≈ ${pointsToDollars(points).toFixed(2)} value
              </p>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
}
