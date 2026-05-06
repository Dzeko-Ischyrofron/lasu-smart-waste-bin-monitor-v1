import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Map as MapIcon } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons (Leaflet expects assets at specific paths)
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface BinPin {
  id: string;
  name: string;
  location: string;
  fill_level: number;
  is_online: boolean;
  latitude: number | null;
  longitude: number | null;
}

interface BinMapProps {
  bins: BinPin[];
}

// Default center: Lagos State University, Epe Campus
const DEFAULT_CENTER: [number, number] = [6.5908, 3.9817];

export function BinMap({ bins }: BinMapProps) {
  const placed = bins.filter((b) => b.latitude != null && b.longitude != null);
  const center: [number, number] = placed.length > 0
    ? [placed[0].latitude as number, placed[0].longitude as number]
    : DEFAULT_CENTER;

  // Force map invalidate on mount to fix tile-render issues inside cards
  useEffect(() => {
    const t = setTimeout(() => window.dispatchEvent(new Event("resize")), 200);
    return () => clearTimeout(t);
  }, []);

  if (placed.length === 0) {
    return (
      <Card className="animate-fade-in">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <MapIcon className="h-5 w-5 text-primary" />
            Fleet Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full rounded-md border bg-muted/30 grid place-items-center text-center px-6">
            <div className="space-y-2">
              <MapIcon className="h-10 w-10 text-muted-foreground/50 mx-auto" />
              <p className="text-sm font-medium">No bins to track yet</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Once an admin registers a bin and sets its latitude/longitude in
                Settings → Bin Management, it will appear here on the map.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <MapIcon className="h-5 w-5 text-primary" />
          Fleet Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full rounded-md overflow-hidden border">
          <MapContainer
            center={center}
            zoom={14}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {placed.map((b) => (
              <Marker
                key={b.id}
                position={[b.latitude as number, b.longitude as number]}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">{b.name}</div>
                    <div className="text-xs text-muted-foreground">{b.location}</div>
                    <div className="mt-1">Fill: <strong>{b.fill_level}%</strong></div>
                    <div>{b.is_online ? "🟢 Online" : "🔴 Offline"}</div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
}
