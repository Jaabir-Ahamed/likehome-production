import { useState } from 'react';
import { Building2, MapPin, DollarSign, Image as ImageIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { toast } from 'sonner';

export function ListPropertyDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    type: '',
    price: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    toast.success('Property submitted successfully! We will review your listing shortly.');
    setOpen(false);
    setFormData({
      name: '',
      location: '',
      type: '',
      price: '',
      description: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-[#1f2937] hover:text-[#2563eb] transition-colors font-medium">
          List Your Property
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#1f2937]">
            List Your Property
          </DialogTitle>
          <DialogDescription>
            Fill in the details below to list your property on LikeHome. We'll review your submission and get back to you shortly.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Property Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Property Name
            </Label>
            <Input
              id="name"
              placeholder="e.g., Grand Palace Hotel"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </Label>
            <Input
              id="location"
              placeholder="e.g., Paris, France"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />
          </div>

          {/* Property Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Property Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Select property type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hotel">Hotel</SelectItem>
                <SelectItem value="resort">Resort</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="villa">Villa</SelectItem>
                <SelectItem value="guesthouse">Guest House</SelectItem>
                <SelectItem value="hostel">Hostel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Starting Price (per night in USD)
            </Label>
            <Input
              id="price"
              type="number"
              placeholder="e.g., 150"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your property, amenities, and what makes it special..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="min-h-[120px]"
              required
            />
          </div>

          {/* Photo Upload Note */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ImageIcon className="w-5 h-5 text-[#2563eb] mt-0.5" />
              <div>
                <p className="font-medium text-[#1f2937] mb-1">Photo Upload</p>
                <p className="text-sm text-[#717182]">
                  After submitting this form, our team will contact you to arrange professional photography or guide you through uploading your property photos.
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#2563eb] hover:bg-[#1e40af] text-white"
            >
              Submit Property
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
