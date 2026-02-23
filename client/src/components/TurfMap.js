import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Dummy user location (could use navigator.geolocation)
const userLocation = [5.645, -0.208];

export default function TurfMap({ turfs, selectedDistrict }) {
  const [filteredTurfs, setFilteredTurfs] = useState([]);

  useEffect(() => {
    setFilteredTurfs(turfs.filter((t) => t.district === selectedDistrict));
  }, [selectedDistrict, turfs]);

  return (
    <MapContainer center={userLocation} zoom={13} style={{ height: "500px", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* User location */}
      <Marker position={userLocation}>
        <Popup>You are here</Popup>
      </Marker>

      {/* Turf markers */}
      {filteredTurfs.map((turf) => (
        <Marker key={turf.id} position={[turf.lat, turf.lng]}>
          <Popup>
            <h4>{turf.name}</h4>
            <p>District: {turf.district}</p>
            <button onClick={() => alert(`Booking ${turf.name}`)}>
              Book Turf
            </button>
          </Popup>
          {/* Turf allowed radius */}
          <Circle center={[turf.lat, turf.lng]} radius={500} color="blue" />
        </Marker>
      ))}
    </MapContainer>
  );
}