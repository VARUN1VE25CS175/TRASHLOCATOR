import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { MapPin, Navigation, Trash2, LogIn, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Custom icons
const createCustomIcon = (color, isNearest = false) => {
  return L.divIcon({
    className: 'custom-icon',
    html: `<div class="${isNearest ? 'dustbin-marker-nearest' : 'dustbin-marker'}">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
      </svg>
    </div>`,
    iconSize: [isNearest ? 36 : 30, isNearest ? 36 : 30],
    iconAnchor: [isNearest ? 18 : 15, isNearest ? 36 : 30],
  });
};

const userIcon = L.divIcon({
  className: 'custom-icon',
  html: '<div class="user-marker"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Component to update map center
function MapUpdater({ center }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  
  return null;
}

function MapView() {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState(null);
  const [dustbins, setDustbins] = useState([]);
  const [nearestDustbin, setNearestDustbin] = useState(null);
  const [distance, setDistance] = useState(null);
  const [locationPermission, setLocationPermission] = useState('prompt');
  const [mapCenter, setMapCenter] = useState([28.6139, 77.2090]); // Default: Delhi
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  // Request user location
  const requestLocation = () => {
    if ('geolocation' in navigator) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setMapCenter([latitude, longitude]);
          setLocationPermission('granted');
          toast.success('Location access granted');
          fetchNearestDustbin(latitude, longitude);
          setLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationPermission('denied');
          toast.error('Location access denied. Please enable location services.');
          setLoading(false);
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
      setLoading(false);
    }
  };

  // Fetch all dustbins
  const fetchDustbins = async () => {
    try {
      const response = await axios.get(`${API}/dustbins`);
      setDustbins(response.data);
    } catch (error) {
      console.error('Error fetching dustbins:', error);
      toast.error('Failed to load dustbins');
    }
  };

  // Fetch nearest dustbin
  const fetchNearestDustbin = async (lat, lng) => {
    try {
      const response = await axios.get(`${API}/dustbins/nearest?lat=${lat}&lng=${lng}`);
      if (response.data.dustbin) {
        setNearestDustbin(response.data.dustbin);
        setDistance(response.data.distance_km);
      } else {
        toast.info('No dustbins found nearby');
      }
    } catch (error) {
      console.error('Error fetching nearest dustbin:', error);
    }
  };

  useEffect(() => {
    fetchDustbins();
    requestLocation();
  }, []);

  // Refresh dustbins when window regains focus (e.g., returning from admin dashboard)
  useEffect(() => {
    const handleFocus = () => {
      fetchDustbins();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  return (
    <div className="relative h-screen w-screen" data-testid="map-view">
      {/* Map Container */}
      <MapContainer
        center={mapCenter}
        zoom={13}
        className="h-full w-full"
        zoomControl={false}
        ref={mapRef}
        data-testid="map-container"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater center={mapCenter} />

        {/* User location marker */}
        {userLocation && (
          <Marker position={userLocation} icon={userIcon} data-testid="user-location-marker">
            <Popup>
              <div className="text-center">
                <p className="font-semibold">Your Location</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Dustbin markers */}
        {dustbins.map((dustbin) => {
          const isNearest = nearestDustbin && nearestDustbin.id === dustbin.id;
          return (
            <Marker
              key={dustbin.id}
              position={[dustbin.latitude, dustbin.longitude]}
              icon={createCustomIcon('#4A7C59', isNearest)}
              data-testid={isNearest ? "nearest-dustbin-marker" : "dustbin-marker"}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold text-[#4A7C59]">{dustbin.name}</p>
                  {dustbin.description && (
                    <p className="text-gray-600 text-xs mt-1">{dustbin.description}</p>
                  )}
                  {isNearest && (
                    <p className="text-[#E07A5F] font-medium text-xs mt-2">
                      Nearest to you ({distance} km)
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating UI - Admin Login Button */}
      <div className="absolute top-4 right-4 z-[1000]">
        <button
          onClick={() => navigate('/admin/login')}
          className="glass rounded-full px-4 py-2 shadow-lg hover:shadow-xl flex items-center gap-2 text-gray-700 hover:text-[#4A7C59] font-medium"
          data-testid="admin-login-button"
        >
          <LogIn size={18} />
          <span className="hidden sm:inline">Admin</span>
        </button>
      </div>

      {/* Floating UI - Get Location Button */}
      {!userLocation && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000]">
          <button
            onClick={requestLocation}
            disabled={loading}
            className="glass rounded-full px-6 py-3 shadow-lg hover:shadow-xl flex items-center gap-2 text-white bg-[#4A7C59] hover:bg-[#3A6346] font-medium disabled:opacity-50"
            data-testid="get-location-button"
          >
            <Navigation size={18} />
            {loading ? 'Getting Location...' : 'Enable Location'}
          </button>
        </div>
      )}

      {/* Floating UI - Nearest Dustbin Card */}
      {nearestDustbin && userLocation && (
        <div 
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[1000] w-[calc(100%-2rem)] max-w-md"
          data-testid="nearest-dustbin-card"
        >
          <div className="glass rounded-2xl p-6 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="bg-[#4A7C59] rounded-xl p-3 flex-shrink-0">
                <Trash2 size={24} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-gray-900 truncate" data-testid="nearest-dustbin-name">
                  {nearestDustbin.name}
                </h3>
                {nearestDustbin.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {nearestDustbin.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <MapPin size={16} className="text-[#E07A5F]" />
                  <span className="text-[#E07A5F] font-semibold" data-testid="nearest-dustbin-distance">
                    {distance} km away
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No dustbins message */}
      {dustbins.length === 0 && !loading && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[1000]">
          <div className="glass rounded-2xl px-6 py-4 shadow-lg">
            <p className="text-gray-600 text-sm">No dustbins added yet. Admin can add dustbins.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default MapView;