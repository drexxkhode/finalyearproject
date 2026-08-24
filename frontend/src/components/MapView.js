import { useEffect, useRef, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const FALLBACK_CENTER = [5.6037, -0.187]; // Accra
const FALLBACK_ZOOM = 12;
const FOCUSED_ZOOM = 15;

function isValidCoord(lat, lng) {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0;
}

function PickerEvents({ onChange }) {
  useMapEvents({ click: (e) => onChange?.(e.latlng.lat, e.latlng.lng) });
  return null;
}

// Watches the map's DOM container. Whenever it flips from hidden (e.g. an
// inactive `d-none` tab) to visible, tells Leaflet to recompute its size —
// otherwise Leaflet keeps using the stale 0x0 size it saw at init and every
// setView/flyTo call after that throws "Invalid LatLng (NaN, NaN)".
function useVisibilityFix() {
  const map = useMap();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const container = map.getContainer();

    const check = () => {
      const visible = container.offsetWidth > 0 && container.offsetHeight > 0;
      if (visible) {
        // let layout settle for a tick before asking Leaflet to remeasure
        requestAnimationFrame(() => map.invalidateSize());
      }
      setIsVisible(visible);
    };

    check();
    const ro = new ResizeObserver(check);
    ro.observe(container);
    return () => ro.disconnect();
  }, [map]);

  return isVisible;
}

// Keeps the map view in sync with an externally-controlled position, but
// only once the map is actually visible/sized — calling setView/flyTo on a
// zero-sized container is what produces the NaN LatLng crash.
function RecenterOnChange({ position, zoom }) {
  const map = useMap();
  const isVisible = useVisibilityFix();
  const hasCentered = useRef(false);

  useEffect(() => {
    if (!position || !isVisible) return;

    if (!hasCentered.current) {
      map.setView(position, zoom, { animate: false });
      hasCentered.current = true;
    } else {
      map.flyTo(position, Math.max(map.getZoom(), zoom), { duration: 0.8 });
    }
  }, [position, zoom, map, isVisible]);

  return null;
}

export function SingleLocationMap({ latitude, longitude, onChange, height = 320 }) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  const hasFetchedCoords = isValidCoord(lat, lng);
  const fetchedPosition = hasFetchedCoords ? [lat, lng] : null;

  const [deviceCenter, setDeviceCenter] = useState(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const triedInitialGeo = useRef(false);

  useEffect(() => {
    if (hasFetchedCoords || triedInitialGeo.current) return;
    triedInitialGeo.current = true;
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setDeviceCenter([coords.latitude, coords.longitude]),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasFetchedCoords]);

  const activePosition = fetchedPosition || deviceCenter || FALLBACK_CENTER;
  const activeZoom = fetchedPosition || deviceCenter ? FOCUSED_ZOOM : FALLBACK_ZOOM;

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation isn't supported on this device.");
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        onChange?.(coords.latitude, coords.longitude);
        setLocating(false);
      },
      (err) => {
        setGeoError(err.message || "Couldn't get your location.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div>
      <div className="position-relative">
        <MapContainer
          center={FALLBACK_CENTER}
          zoom={FALLBACK_ZOOM}
          style={{ width: "100%", height, borderRadius: 10, zIndex: 0 }}
          scrollWheelZoom
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <RecenterOnChange position={activePosition} zoom={activeZoom} />
          <PickerEvents onChange={onChange} />
          {fetchedPosition && (
            <Marker
              position={fetchedPosition}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const p = e.target.getLatLng();
                  onChange?.(p.lat, p.lng);
                },
              }}
            />
          )}
        </MapContainer>

        <button
          type="button"
          className="btn btn-light btn-sm shadow-sm position-absolute d-flex align-items-center gap-1"
          style={{ top: 10, right: 10, zIndex: 400 }}
          onClick={handleLocateMe}
          disabled={locating}
          title="Use my current location"
        >
          {locating ? (
            <span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14 }} />
          ) : (
            <i className="bi bi-crosshair" />
          )}
        </button>
      </div>

      {geoError && <div className="text-danger small mt-1">{geoError}</div>}
      {!fetchedPosition && (
        <div className="text-muted small mt-1">
          <i className="bi bi-info-circle me-1" />
          Click on the map to set the exact location.
        </div>
      )}

      <div className="row g-2 mt-1">
        <div className="col-6">
          <input
            className="form-control form-control-sm"
            value={hasFetchedCoords ? lat.toFixed(6) : ""}
            placeholder="Latitude"
            readOnly
          />
        </div>
        <div className="col-6">
          <input
            className="form-control form-control-sm"
            value={hasFetchedCoords ? lng.toFixed(6) : ""}
            placeholder="Longitude"
            readOnly
          />
        </div>
      </div>
    </div>
  );
}

export default SingleLocationMap;