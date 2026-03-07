import { MapPin } from 'lucide-react';

interface MapComponentProps {
  location: string;
  height?: string;
  className?: string;
}

export function MapComponent({ location, height = '400px', className = '' }: MapComponentProps) {
  // Simple map placeholder - in production, you'd use Google Maps or Mapbox
  const encodedLocation = encodeURIComponent(location);
  
  return (
    <div className={`relative rounded-lg overflow-hidden border border-gray-200 ${className}`} style={{ height }}>
      <iframe
        width="100%"
        height="100%"
        frameBorder="0"
        style={{ border: 0 }}
        src={`https://www.openstreetmap.org/export/embed.html?bbox=-0.004017949104309083%2C51.47612752641776%2C0.00030577182769775396%2C51.478569861898606&layer=mapnik&marker=51.477348709331114%2C-0.0018560886383056641`}
        title={`Map of ${location}`}
      />
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
        <MapPin className="w-5 h-5 text-[#2563eb]" />
        <span className="font-medium text-[#1f2937]">{location}</span>
      </div>
    </div>
  );
}
