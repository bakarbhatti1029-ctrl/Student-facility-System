import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';

// Custom icons for the university and hostels.
const universityIcon = new L.Icon({ iconUrl: '/images/marker.png', iconSize: [25, 41] });
const hostelIcon = new L.Icon({ iconUrl: '/images/hostelMarker.png', iconSize: [25, 41] });

// Recenter the map whenever the center/zoom changes (e.g. after a search).
const SetMapView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

// Draw a driving route line between two points (university → hostel).
const RoutingMachine = ({ start, end }) => {
  const map = useMap();
  const startLat = start?.lat;
  const startLng = start?.lng;
  const endLat = end?.lat;
  const endLng = end?.lng;

  useEffect(() => {
    if (!map || !startLat || !startLng || !endLat || !endLng) return;

    let routingControl = null;
    let destroyed = false;

    try {
      routingControl = L.Routing.control({
        waypoints: [L.latLng(startLat, startLng), L.latLng(endLat, endLng)],
        routeWhileDragging: false,
        show: false,
        addWaypoints: false,
        fitSelectedRoutes: false,
        lineOptions: { styles: [{ color: 'blue', opacity: 0.8, weight: 4 }] },
        createMarker: () => null,
      });
      routingControl.on('routesfound routingerror', () => {
        if (destroyed) return;
      });
      routingControl.addTo(map);
    } catch (e) {
      console.warn('Routing error:', e);
    }

    return () => {
      destroyed = true;
      if (!routingControl) return;
      try {
        routingControl.off();
        if (routingControl._line && map.hasLayer(routingControl._line)) {
          map.removeLayer(routingControl._line);
        }
        if (Array.isArray(routingControl._alternatives)) {
          routingControl._alternatives.forEach((alt) => {
            try { if (alt && map.hasLayer(alt)) map.removeLayer(alt); } catch (_) {}
          });
        }
        if (map && map._container) map.removeControl(routingControl);
      } catch (e) {
        // Map/control already torn down — safe to ignore.
      }
    };
  }, [map, startLat, startLng, endLat, endLng]);

  return null;
};

// `university` (when present) is the searched university: { name, lat, lng }.
// The map centers on it, drops a marker, and draws a line to each nearby hostel,
// with the real (calculated) distance shown in each hostel's popup.
const HostelMap = ({ hostels, university, searchPerformed }) => {
  const defaultCenter = [31.5204, 74.3587]; // Lahore
  const defaultZoom = 13;

  const hasUni = university && university.lat != null && university.lng != null;

  const center = hasUni
    ? [university.lat, university.lng]
    : hostels[0] && hostels[0].hostel_lat != null
    ? [hostels[0].hostel_lat, hostels[0].hostel_lng]
    : defaultCenter;

  const zoomLevel = hasUni ? 14 : defaultZoom;

  return (
    <div className="container mx-auto mt-8 p-4">
      <MapContainer center={center} zoom={zoomLevel} className="w-full h-[500px] relative">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <SetMapView center={center} zoom={zoomLevel} />

        {/* Searched-university marker */}
        {searchPerformed && hasUni && (
          <Marker position={[university.lat, university.lng]} icon={universityIcon}>
            <Popup>{university.name}</Popup>
          </Marker>
        )}

        {/* Hostel markers + a route line from the university to each hostel */}
        {searchPerformed &&
          hostels.map((hostel, index) =>
            hostel.hostel_lat != null && hostel.hostel_lng != null ? (
              <React.Fragment key={hostel._id || index}>
                <Marker position={[hostel.hostel_lat, hostel.hostel_lng]} icon={hostelIcon}>
                  <Popup>
                    <strong>{hostel.hostel_name}</strong>
                    <br />
                    {hostel.calculated_distance != null && hasUni
                      ? `${hostel.calculated_distance} km from ${university.name}`
                      : hostel.hostel_address}
                  </Popup>
                </Marker>

                {/* Cap the number of simultaneous route requests. */}
                {hasUni && index < 8 && (
                  <RoutingMachine
                    start={{ lat: university.lat, lng: university.lng }}
                    end={{ lat: hostel.hostel_lat, lng: hostel.hostel_lng }}
                  />
                )}
              </React.Fragment>
            ) : null
          )}
      </MapContainer>
    </div>
  );
};

export default HostelMap;
