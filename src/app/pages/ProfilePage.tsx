import { useState } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Edit2, Camera } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';

export function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    name: 'John Anderson',
    email: 'john.anderson@email.com',
    phone: '+1 (555) 123-4567',
    location: 'New York, USA',
    dateOfBirth: '1990-05-15',
    joinedDate: 'January 2024',
    bio: 'Travel enthusiast exploring the world one hotel at a time.',
  });

  const handleSave = () => {
    setIsEditing(false);
    // Here you would typically save to backend
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="font-bold text-[#1f2937] mb-2">My Profile</h1>
          <p className="text-[#6b7280]">Manage your personal information and preferences</p>
        </div>

        {/* Profile Card */}
        <Card className="p-8 mb-6 border-gray-200">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-8">
            {/* Avatar Section */}
            <div className="relative">
              <Avatar className="h-32 w-32">
                <AvatarImage src="" alt={userData.name} />
                <AvatarFallback className="bg-[#2563eb] text-white text-3xl">
                  {userData.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 bg-[#2563eb] text-white p-2 rounded-full hover:bg-[#1d4ed8] transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* User Info Header */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-[#1f2937]">{userData.name}</h2>
                <Button
                  variant={isEditing ? "default" : "outline"}
                  size="sm"
                  onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                  className={isEditing ? "bg-[#2563eb] hover:bg-[#1d4ed8]" : ""}
                >
                  {isEditing ? (
                    <>Save Changes</>
                  ) : (
                    <>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </>
                  )}
                </Button>
              </div>
              <p className="text-[#6b7280] mb-4">{userData.bio}</p>
              <div className="flex items-center gap-2 text-sm text-[#6b7280]">
                <Calendar className="w-4 h-4" />
                <span>Member since {userData.joinedDate}</span>
              </div>
            </div>
          </div>

          <Separator className="my-8" />

          {/* Personal Information */}
          <div className="space-y-6">
            <h3 className="font-semibold text-[#1f2937] mb-4">Personal Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
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

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-[#1f2937]">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={userData.email}
                  onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                  disabled={!isEditing}
                  className="bg-white"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2 text-[#1f2937]">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={userData.phone}
                  onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                  disabled={!isEditing}
                  className="bg-white"
                />
              </div>

              {/* Location */}
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

              {/* Date of Birth */}
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

        {/* Statistics Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        </div>
      </div>
    </div>
  );
}
