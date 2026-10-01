import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap
} from '@vis.gl/react-google-maps';
import { Hospital, Citizen, BloodGroup, UserRole } from '../types';
import { calculateDistance, formatDistance, estimateTravelTime, playEmergencySound } from '../utils';
import { sendEmergencyAlert } from '../supabase';
import { RouteRenderer } from './RouteRenderer';
import {
  Navigation,
  Compass,
  AlertTriangle,
  Hospital as HospitalIcon,
  Heart,
  Phone,
  Radio,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  RefreshCw,
  LocateFixed
} from 'lucide-react';

const GOOGLE_MAPS_API_KEY = 
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyA9JPm8IfKAeUbOJlFhLy4XeoJjx8t6Cc4';

interface LiveBloodMapProps {
  hospitals: Hospital[];
  citizens: Citizen[];
  currentUser?: any;
  initialBloodGroup?: BloodGroup | '';
  onBloodGroupChange?: (bg: BloodGroup | '') => void;
}

export type SelectedDestination = {
  type: 'hospital' | 'donor';
  id: string;
  name: string;
  bloodGroupInfo: string;
  location: { lat: number; lng: number; city?: string; state?: string };
  distance: number;
  phone?: string;
  stock?: number;
};

// Preset locations for quick testing and simulation if GPS is unavailable
const LOCATION_PRESETS = [
  { name: 'Current GPS (Live)', lat: 0, lng: 0, isGps: true },
  { name: 'Delhi (Connaught Place)', lat: 28.6304, lng: 77.2177, isGps: false },
  { name: 'Delhi South (Saket)', lat: 28.5244, lng: 77.2066, isGps: false },
  { name: 'Bengaluru (MG Road)', lat: 12.9752, lng: 77.6080, isGps: false },
  { name: 'Mumbai (Marine Lines)', lat: 18.9438, lng: 72.8234, isGps: false }
];

export const LiveBloodMap: React.FC<LiveBloodMapProps> = ({
  hospitals,
  citizens,
  currentUser,
  initialBloodGroup = 'O+',
  onBloodGroupChange
}) => {
  const [selectedBlood, setSelectedBlood] = useState<BloodGroup | ''>(initialBloodGroup || 'O+');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({ lat: 28.6139, lng: 77.2090 });
  const [isGpsTracking, setIsGpsTracking] = useState<boolean>(true);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('Current GPS (Live)');
  const [travelMode, setTravelMode] = useState<'DRIVING' | 'WALKING' | 'TRANSIT'>('DRIVING');
  const [activeInfoTarget, setActiveInfoTarget] = useState<{ type: 'hospital' | 'donor'; item: any } | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<SelectedDestination | null>(null);
  const [alertSuccessMessage, setAlertSuccessMessage] = useState<string | null>(null);
  const [computedRouteInfo, setComputedRouteInfo] = useState<{ distanceMeters: number; durationMillis: number } | null>(null);

  const watchIdRef = useRef<number | null>(null);

  // Sync blood group state
  const handleBloodSelect = (bg: BloodGroup | '') => {
    setSelectedBlood(bg);
    if (onBloodGroupChange) {
      onBloodGroupChange(bg);
    }
  };

  // Live geolocation watcher
  useEffect(() => {
    if (!isGpsTracking) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if ('geolocation' in navigator) {
      // First get current immediately
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsAccuracy(Math.round(pos.coords.accuracy));
        },
        (err) => {
          console.warn('Geolocation initial error:', err.message);
          // Fall back gracefully to Delhi default
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );

      // Then continuous watch
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsAccuracy(Math.round(pos.coords.accuracy));
        },
        (err) => {
          console.warn('Geolocation watch error:', err.message);
        },
        { enableHighAccuracy: true, maximumAge: 5000 }
      );
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isGpsTracking]);

  // Handle Preset Selection
  const handlePresetChange = (presetName: string) => {
    setSelectedPreset(presetName);
    const preset = LOCATION_PRESETS.find(p => p.name === presetName);
    if (!preset) return;

    if (preset.isGps) {
      setIsGpsTracking(true);
    } else {
      setIsGpsTracking(false);
      setUserLocation({ lat: preset.lat, lng: preset.lng });
      setGpsAccuracy(15);
    }
  };

  // Calculate distance for all hospitals from user location
  const hospitalsWithDistance = useMemo(() => {
    return hospitals.map(h => {
      const dist = calculateDistance(userLocation.lat, userLocation.lng, h.location.lat, h.location.lng);
      const stockForSelected = selectedBlood ? (h.inventory?.[selectedBlood as BloodGroup] || 0) : 0;
      return {
        ...h,
        distance: dist,
        stockForSelected,
        hasStock: stockForSelected > 0
      };
    }).sort((a, b) => a.distance - b.distance);
  }, [hospitals, userLocation, selectedBlood]);

  // Calculate distance for all citizens (donors) matching blood group
  const matchedDonorsWithDistance = useMemo(() => {
    return citizens
      .filter(c => !selectedBlood || c.bloodGroup === selectedBlood)
      .map(c => {
        const dist = calculateDistance(userLocation.lat, userLocation.lng, c.location.lat, c.location.lng);
        return {
          ...c,
          distance: dist
        };
      })
      .sort((a, b) => a.distance - b.distance);
  }, [citizens, userLocation, selectedBlood]);

  // Proximity intelligence:
  // Nearest Hospital that has stock of selected blood
  const nearestHospitalWithStock = useMemo(() => {
    return hospitalsWithDistance.find(h => h.hasStock) || null;
  }, [hospitalsWithDistance]);

  // Nearest Matched Donor
  const nearestMatchedDonor = useMemo(() => {
    return matchedDonorsWithDistance[0] || null;
  }, [matchedDonorsWithDistance]);

  // Is hospital significantly further away than a matched donor?
  // E.g., if hospital is farther than donor by at least 1.5x or > 3 km difference
  const isHospitalFartherThanDonor = useMemo(() => {
    if (!nearestHospitalWithStock || !nearestMatchedDonor) return false;
    return nearestHospitalWithStock.distance > (nearestMatchedDonor.distance + 2.0) ||
           nearestHospitalWithStock.distance > (nearestMatchedDonor.distance * 1.4);
  }, [nearestHospitalWithStock, nearestMatchedDonor]);

  // Auto-select smart initial destination when blood group or locations load
  useEffect(() => {
    // If hospital is further than donor, recommend donor; otherwise hospital
    if (isHospitalFartherThanDonor && nearestMatchedDonor) {
      setSelectedDestination({
        type: 'donor',
        id: nearestMatchedDonor.id,
        name: nearestMatchedDonor.name,
        bloodGroupInfo: nearestMatchedDonor.bloodGroup,
        location: nearestMatchedDonor.location,
        distance: nearestMatchedDonor.distance,
        phone: nearestMatchedDonor.phone
      });
    } else if (nearestHospitalWithStock) {
      setSelectedDestination({
        type: 'hospital',
        id: nearestHospitalWithStock.id,
        name: nearestHospitalWithStock.name,
        bloodGroupInfo: `${nearestHospitalWithStock.stockForSelected} Units Available`,
        location: nearestHospitalWithStock.location,
        distance: nearestHospitalWithStock.distance,
        phone: nearestHospitalWithStock.email,
        stock: nearestHospitalWithStock.stockForSelected
      });
    } else if (nearestMatchedDonor) {
      setSelectedDestination({
        type: 'donor',
        id: nearestMatchedDonor.id,
        name: nearestMatchedDonor.name,
        bloodGroupInfo: nearestMatchedDonor.bloodGroup,
        location: nearestMatchedDonor.location,
        distance: nearestMatchedDonor.distance,
        phone: nearestMatchedDonor.phone
      });
    }
  }, [selectedBlood, userLocation.lat, userLocation.lng]);

  const selectHospitalAsDestination = (h: any) => {
    setSelectedDestination({
      type: 'hospital',
      id: h.id,
      name: h.name,
      bloodGroupInfo: `${h.stockForSelected || (h.inventory?.[selectedBlood as BloodGroup] || 0)} Units Available`,
      location: h.location,
      distance: h.distance || calculateDistance(userLocation.lat, userLocation.lng, h.location.lat, h.location.lng),
      stock: h.stockForSelected || (h.inventory?.[selectedBlood as BloodGroup] || 0),
      phone: h.email
    });
    setActiveInfoTarget(null);
  };

  const selectDonorAsDestination = (d: any) => {
    setSelectedDestination({
      type: 'donor',
      id: d.id,
      name: d.name,
      bloodGroupInfo: d.bloodGroup,
      location: d.location,
      distance: d.distance || calculateDistance(userLocation.lat, userLocation.lng, d.location.lat, d.location.lng),
      phone: d.phone
    });
    setActiveInfoTarget(null);
  };

  const handleSendAlert = async (donorName: string) => {
    playEmergencySound();
    setAlertSuccessMessage(`Emergency Broadcast Sent to ${donorName}!`);
    const hospitalName = currentUser?.name || 'Emergency Live Map Center';
    await sendEmergencyAlert(donorName, hospitalName, selectedBlood || 'Emergency');
    setTimeout(() => setAlertSuccessMessage(null), 4000);
  };

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  // Google Maps external turn-by-turn navigation URL
  const googleMapsTurnByTurnUrl = selectedDestination
    ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${selectedDestination.location.lat},${selectedDestination.location.lng}&travelmode=${travelMode.toLowerCase()}`
    : '#';

  return (
    <div className="space-y-6">
      {/* Alert Banner for Actions */}
      {alertSuccessMessage && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 bg-white rounded-full animate-ping"></span>
            <div>
              <p className="font-bold text-sm">{alertSuccessMessage}</p>
              <p className="text-xs text-emerald-100">Synchronized with Supabase emergency records and triggered live alert.</p>
            </div>
          </div>
          <button onClick={() => setAlertSuccessMessage(null)} className="text-white hover:text-emerald-200 text-sm font-bold">✕</button>
        </div>
      )}

      {/* Top Controls Card: Blood Group Chips & Live Location Mode */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Blood group selection */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-600 fill-red-600" />
                Required Blood Group for Navigation
              </label>
              <span className="text-xs font-bold text-slate-400">
                {selectedBlood ? `Target: ${selectedBlood}` : 'Select blood group'}
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {bloodGroups.map(bg => (
                <button
                  key={bg}
                  onClick={() => handleBloodSelect(bg)}
                  className={`py-2.5 rounded-xl font-black text-sm border-2 transition-all flex flex-col items-center justify-center ${
                    selectedBlood === bg
                      ? 'border-red-600 bg-red-600 text-white shadow-lg shadow-red-200 scale-105'
                      : 'border-slate-100 bg-slate-50 text-slate-700 hover:border-red-300 hover:bg-red-50/50'
                  }`}
                >
                  <span>{bg}</span>
                </button>
              ))}
            </div>
          </div>

          {/* GPS Simulation / Live controls */}
          <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-100 lg:pl-6 pt-4 lg:pt-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Radio className={`w-4 h-4 ${isGpsTracking ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
                Live Location Tracker
              </span>
              <button
                onClick={() => setIsGpsTracking(!isGpsTracking)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                  isGpsTracking
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {isGpsTracking ? 'GPS Active' : 'GPS Paused'}
              </button>
            </div>

            <div className="space-y-2">
              <select
                value={selectedPreset}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-red-500"
              >
                {LOCATION_PRESETS.map(p => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
                <span>Lat: {userLocation.lat.toFixed(4)}, Lng: {userLocation.lng.toFixed(4)}</span>
                {gpsAccuracy && <span>±{gpsAccuracy}m</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SMART PROXIMITY COMPARISON BANNER */}
      {selectedBlood && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-xl border border-slate-700 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-full bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                {isHospitalFartherThanDonor ? (
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Proximity Alert: Matched Donor is Closer!
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Optimal Hospital Stock Available
                  </span>
                )}
                <span className="text-xs font-bold text-slate-400">
                  Target Blood: <span className="text-red-400 font-black">{selectedBlood}</span>
                </span>
              </div>

              <h3 className="text-lg md:text-xl font-black">
                {isHospitalFartherThanDonor && nearestMatchedDonor && nearestHospitalWithStock ? (
                  <>
                    Nearest hospital with {selectedBlood} stock is <span className="text-red-400">{nearestHospitalWithStock.distance.toFixed(1)} km</span> away, but matched donor <span className="text-emerald-400 font-bold">{nearestMatchedDonor.name}</span> is only <span className="text-emerald-400 font-bold">{nearestMatchedDonor.distance.toFixed(1)} km</span> away!
                  </>
                ) : nearestHospitalWithStock ? (
                  <>
                    Nearest available stock found at <span className="text-emerald-400">{nearestHospitalWithStock.name}</span> ({nearestHospitalWithStock.distance.toFixed(1)} km away with {nearestHospitalWithStock.stockForSelected} units).
                  </>
                ) : (
                  <>
                    No nearby hospital currently has {selectedBlood} stock in inventory. Switching to matched local volunteer donors!
                  </>
                )}
              </h3>

              <p className="text-xs text-slate-300">
                {isHospitalFartherThanDonor
                  ? 'In critical emergencies where hospital transit time exceeds 20 minutes, reaching out directly to the closer verified volunteer donor can save vital time.'
                  : 'Direct navigation to the nearest hospital is recommended for immediate blood supply transfusion.'}
              </p>
            </div>

            {/* Quick destination switch buttons */}
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              {nearestHospitalWithStock && (
                <button
                  onClick={() => selectHospitalAsDestination(nearestHospitalWithStock)}
                  className={`px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    selectedDestination?.type === 'hospital' && selectedDestination.id === nearestHospitalWithStock.id
                      ? 'bg-red-600 text-white ring-2 ring-red-400 shadow-lg'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  }`}
                >
                  <HospitalIcon className="w-4 h-4 text-red-400" />
                  <span>Route to Hospital ({nearestHospitalWithStock.distance.toFixed(1)} km)</span>
                </button>
              )}

              {nearestMatchedDonor && (
                <button
                  onClick={() => selectDonorAsDestination(nearestMatchedDonor)}
                  className={`px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    selectedDestination?.type === 'donor' && selectedDestination.id === nearestMatchedDonor.id
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 shadow-lg'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  }`}
                >
                  <Heart className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                  <span>
                    Route to Donor {isHospitalFartherThanDonor && '⭐ Closer'} ({nearestMatchedDonor.distance.toFixed(1)} km)
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Interactive Map & Destination Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Google Map Canvas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl p-2 shadow-xl border border-slate-100 relative">
            {/* Map Top Bar Controls */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl shadow-lg border border-slate-200/80 text-xs font-bold text-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
              <span>Live GPS: Active</span>
              <span className="text-slate-300">|</span>
              <span>Mode:</span>
              {(['DRIVING', 'WALKING', 'TRANSIT'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setTravelMode(mode)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-colors ${
                    travelMode === mode ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {mode === 'DRIVING' ? 'Drive' : mode === 'WALKING' ? 'Walk' : 'Transit'}
                </button>
              ))}
            </div>

            {/* Recenter Button */}
            <div className="absolute top-4 right-4 z-20">
              <button
                onClick={() => {
                  setIsGpsTracking(true);
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(pos => {
                      setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    });
                  }
                }}
                title="Recenter on My Live Location"
                className="p-3 bg-white/95 hover:bg-white text-slate-700 hover:text-blue-600 rounded-2xl shadow-lg border border-slate-200 transition-all flex items-center gap-2 text-xs font-bold"
              >
                <LocateFixed className="w-4 h-4 text-blue-600" />
                <span className="hidden sm:inline">Recenter</span>
              </button>
            </div>

            {/* Google Map Container with explicit sizing */}
            <div className="w-full h-[580px] rounded-2xl overflow-hidden relative">
              <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['marker', 'routes', 'geometry']}>
                <Map
                  mapId="DEMO_MAP_ID"
                  defaultCenter={userLocation}
                  center={userLocation}
                  defaultZoom={13}
                  gestureHandling="greedy"
                  fullscreenControl={true}
                  mapTypeControl={false}
                  streetViewControl={false}
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  style={{ width: '100%', height: '100%' }}
                >
                  {/* 1. Live User Marker */}
                  <AdvancedMarker
                    position={userLocation}
                    title="Your Current Location (Live GPS)"
                    onClick={() => setActiveInfoTarget({ type: 'hospital', item: { name: 'Your Location', isUser: true } })}
                  >
                    <div className="relative flex items-center justify-center cursor-pointer">
                      {/* Pulsing radar waves */}
                      <span className="absolute w-12 h-12 bg-blue-500/30 rounded-full animate-ping pointer-events-none"></span>
                      <span className="absolute w-8 h-8 bg-blue-500/50 rounded-full animate-pulse pointer-events-none"></span>
                      {/* Core beacon icon */}
                      <div className="relative z-10 w-7 h-7 bg-blue-600 border-2 border-white rounded-full shadow-xl flex items-center justify-center text-white">
                        <Navigation className="w-3.5 h-3.5 transform -rotate-45" />
                      </div>
                      {/* Label badge */}
                      <div className="absolute -bottom-6 bg-slate-900/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md whitespace-nowrap">
                        You (Live)
                      </div>
                    </div>
                  </AdvancedMarker>

                  {/* 2. Hospital Markers */}
                  {hospitalsWithDistance.map(hospital => {
                    const isSelected = selectedDestination?.type === 'hospital' && selectedDestination.id === hospital.id;
                    const stock = hospital.stockForSelected;
                    const hasStock = hospital.hasStock;

                    return (
                      <AdvancedMarker
                        key={hospital.id}
                        position={hospital.location}
                        title={hospital.name}
                        onClick={() => setActiveInfoTarget({ type: 'hospital', item: hospital })}
                      >
                        <div className={`relative flex flex-col items-center cursor-pointer group transition-transform ${isSelected ? 'scale-125 z-30' : 'hover:scale-110 z-20'}`}>
                          {/* Unit counter badge */}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shadow-md border mb-1 whitespace-nowrap ${
                            hasStock
                              ? 'bg-emerald-600 text-white border-emerald-400'
                              : 'bg-slate-700 text-slate-300 border-slate-600'
                          }`}>
                            {selectedBlood ? `${stock} ${selectedBlood}` : hospital.name.split(' ')[0]}
                          </span>

                          {/* Hospital Pin Icon */}
                          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white shadow-xl border-2 border-white ${
                            isSelected
                              ? 'bg-red-600 ring-4 ring-red-400/50'
                              : hasStock
                              ? 'bg-emerald-600'
                              : 'bg-slate-700 opacity-70'
                          }`}>
                            <HospitalIcon className="w-4 h-4" />
                          </div>
                        </div>
                      </AdvancedMarker>
                    );
                  })}

                  {/* 3. Donor Markers (Registered Citizens) */}
                  {matchedDonorsWithDistance.map(donor => {
                    const isSelected = selectedDestination?.type === 'donor' && selectedDestination.id === donor.id;

                    return (
                      <AdvancedMarker
                        key={donor.id}
                        position={donor.location}
                        title={`Donor: ${donor.name} (${donor.bloodGroup})`}
                        onClick={() => setActiveInfoTarget({ type: 'donor', item: donor })}
                      >
                        <div className={`relative flex flex-col items-center cursor-pointer group transition-transform ${isSelected ? 'scale-125 z-30' : 'hover:scale-110 z-20'}`}>
                          {/* Blood Group Tag */}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black shadow-md border mb-1 bg-red-600 text-white border-red-300 whitespace-nowrap">
                            Donor {donor.bloodGroup}
                          </span>

                          {/* Heart Pin */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-xl border-2 border-white ${
                            isSelected
                              ? 'bg-red-600 ring-4 ring-red-400/50'
                              : 'bg-rose-500'
                          }`}>
                            <Heart className="w-4 h-4 fill-white" />
                          </div>
                        </div>
                      </AdvancedMarker>
                    );
                  })}

                  {/* Active Destination Route Path Polyline */}
                  {selectedDestination && (
                    <RouteRenderer
                      origin={userLocation}
                      destination={selectedDestination.location}
                      travelMode={travelMode}
                      strokeColor={selectedDestination.type === 'hospital' ? '#dc2626' : '#059669'}
                      onRouteComputed={(info) => setComputedRouteInfo(info)}
                    />
                  )}

                  {/* Interactive InfoWindow on Click */}
                  {activeInfoTarget && (
                    <InfoWindow
                      position={activeInfoTarget.item.location || userLocation}
                      onCloseClick={() => setActiveInfoTarget(null)}
                    >
                      <div className="p-2 max-w-xs text-slate-900 font-sans">
                        {activeInfoTarget.item.isUser ? (
                          <div className="space-y-1">
                            <h4 className="font-bold text-sm text-blue-600 flex items-center gap-1">
                              <MapPin className="w-4 h-4" /> Your Live Position
                            </h4>
                            <p className="text-xs text-slate-500">Live coordinates: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</p>
                          </div>
                        ) : activeInfoTarget.type === 'hospital' ? (
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-bold text-sm text-slate-900 leading-tight">{activeInfoTarget.item.name}</h4>
                              <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-bold">Hospital</span>
                            </div>
                            <p className="text-xs text-slate-500">
                              {activeInfoTarget.item.location.city}, {activeInfoTarget.item.location.state} • <span className="font-bold text-red-600">{activeInfoTarget.item.distance?.toFixed(1)} km away</span>
                            </p>
                            {selectedBlood && (
                              <div className="p-2 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-600">Stock for {selectedBlood}:</span>
                                <span className={`font-black px-2 py-0.5 rounded-lg ${
                                  (activeInfoTarget.item.inventory?.[selectedBlood as BloodGroup] || 0) > 0
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {activeInfoTarget.item.inventory?.[selectedBlood as BloodGroup] || 0} Units
                                </span>
                              </div>
                            )}
                            <button
                              onClick={() => selectHospitalAsDestination(activeInfoTarget.item)}
                              className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                            >
                              <Navigation className="w-3.5 h-3.5" /> Set as Route Destination
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-sm text-slate-900">{activeInfoTarget.item.name}</h4>
                                <p className="text-xs text-slate-400 font-bold">Registered Volunteer Donor</p>
                              </div>
                              <span className="text-sm font-black px-2 py-1 bg-red-600 text-white rounded-lg">
                                {activeInfoTarget.item.bloodGroup}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">
                              {activeInfoTarget.item.location.city}, {activeInfoTarget.item.location.state} • <span className="font-bold text-emerald-600">{activeInfoTarget.item.distance?.toFixed(1)} km away</span>
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => selectDonorAsDestination(activeInfoTarget.item)}
                                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                              >
                                <Navigation className="w-3.5 h-3.5" /> Route
                              </button>
                              <button
                                onClick={() => handleSendAlert(activeInfoTarget.item.name)}
                                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
                              >
                                Alert
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </InfoWindow>
                  )}
                </Map>
              </APIProvider>
            </div>
          </div>

          {/* Map Legend */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-600 border border-white ring-2 ring-blue-300"></span>
              <span className="font-medium">You (Live Location)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-emerald-600"></span>
              <span className="font-medium">Hospital (Stock Available)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-slate-600"></span>
              <span className="font-medium">Hospital (Out of Stock)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              <span className="font-medium">Matched Registered Donor</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Compass className="w-3.5 h-3.5" />
              <span>Real-time ETA calculated</span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Active Navigation Summary & Destination Cards */}
        <div className="space-y-6">
          {/* Active Navigation Card */}
          {selectedDestination ? (
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      selectedDestination.type === 'hospital'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      Active Destination: {selectedDestination.type === 'hospital' ? 'Hospital Blood Bank' : 'Verified Donor'}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 leading-snug">{selectedDestination.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedDestination.location.city}, {selectedDestination.location.state}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-slate-900">
                    {formatDistance(selectedDestination.distance)}
                  </div>
                  <div className="text-[11px] font-bold text-slate-400 flex items-center justify-end gap-1">
                    <Clock className="w-3 h-3" />
                    <span>~{estimateTravelTime(selectedDestination.distance, travelMode)}</span>
                  </div>
                </div>
              </div>

              {/* Status or Stock Details */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Availability Status:</span>
                  <span className="font-bold text-slate-900">{selectedDestination.bloodGroupInfo}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Live GPS Origin:</span>
                  <span className="font-mono text-slate-600 text-[11px]">{userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</span>
                </div>
                {computedRouteInfo && (
                  <div className="flex items-center justify-between text-xs text-emerald-700 font-bold pt-1 border-t border-slate-200/60">
                    <span>Google Routes API Transit:</span>
                    <span>{(computedRouteInfo.distanceMeters / 1000).toFixed(1)} km ({Math.round(computedRouteInfo.durationMillis / 60000)} mins)</span>
                  </div>
                )}
              </div>

              {/* Primary Actions */}
              <div className="space-y-3">
                <a
                  href={googleMapsTurnByTurnUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 group"
                >
                  <ExternalLink className="w-4 h-4 text-red-400 group-hover:translate-x-0.5 transition-transform" />
                  <span>Start Turn-by-Turn in Google Maps</span>
                </a>

                {selectedDestination.type === 'donor' ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSendAlert(selectedDestination.name)}
                      className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Radio className="w-4 h-4" /> Send Emergency Alert
                    </button>
                    {selectedDestination.phone && (
                      <a
                        href={`tel:${selectedDestination.phone}`}
                        className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-xs transition-colors flex items-center justify-center gap-1"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => alert(`Connecting with Blood Bank Coordinator at ${selectedDestination.name}...`)}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Phone className="w-4 h-4" /> Request Blood Dispatch
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 text-center py-10 space-y-3">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <Compass className="w-6 h-6 animate-spin" />
              </div>
              <h4 className="font-bold text-slate-900">No Destination Selected</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Click any hospital or matched donor pin on the map to set your live destination and calculate directions.
              </p>
            </div>
          )}

          {/* Quick List of Nearby Hospitals */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <HospitalIcon className="w-4 h-4 text-red-600" />
                Hospitals with {selectedBlood || 'Blood'} Stock
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                {hospitalsWithDistance.filter(h => h.hasStock).length} nearby
              </span>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {hospitalsWithDistance.slice(0, 4).map(h => (
                <div
                  key={h.id}
                  onClick={() => selectHospitalAsDestination(h)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedDestination?.id === h.id
                      ? 'border-red-500 bg-red-50/50 shadow-sm'
                      : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-xs text-slate-900 truncate">{h.name}</p>
                    <p className="text-[11px] text-slate-500">{h.location.city} • <span className="font-bold text-red-600">{h.distance.toFixed(1)} km</span></p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${
                      h.hasStock ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {h.stockForSelected} units
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick List of Nearby Matched Donors */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                Nearby Matched Donors ({selectedBlood || 'All'})
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full">
                {matchedDonorsWithDistance.length} available
              </span>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {matchedDonorsWithDistance.length > 0 ? (
                matchedDonorsWithDistance.slice(0, 4).map(d => (
                  <div
                    key={d.id}
                    onClick={() => selectDonorAsDestination(d)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      selectedDestination?.id === d.id
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                        : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-xs text-slate-900 truncate">{d.name}</p>
                      <p className="text-[11px] text-slate-500">{d.location.city} • <span className="font-bold text-emerald-600">{d.distance.toFixed(1)} km</span></p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] font-black px-2 py-1 bg-red-100 text-red-700 rounded-lg">
                        {d.bloodGroup}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">No donors found for this blood group</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveBloodMap;
