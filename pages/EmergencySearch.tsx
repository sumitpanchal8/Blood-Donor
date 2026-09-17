
import React, { useState, useEffect } from 'react';
import { BloodGroup, Hospital, Citizen, UserRole } from '../types';
import { MOCK_HOSPITALS, MOCK_CITIZENS } from '../mockData';
import { calculateDistance, playEmergencySound } from '../utils';

interface EmergencySearchProps {
  user: any;
  navigate: (page: string) => void;
}

const EmergencySearch: React.FC<EmergencySearchProps> = ({ user, navigate }) => {
  const [selectedBlood, setSelectedBlood] = useState<BloodGroup | ''>('');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [hospitalsFound, setHospitalsFound] = useState<(Hospital & {distance: number})[]>([]);
  const [donorsFound, setDonorsFound] = useState<(Citizen & {distance: number})[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    // Attempt to get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation({ lat: 28.6139, lng: 77.2090 }) // Default to Delhi
      );
    }
  }, []);

  const handleSearch = () => {
    if (!selectedBlood || !userLocation) return;
    
    setSearching(true);
    // Simulate API delay
    setTimeout(() => {
      // 1. Search Hospitals with Stock
      const nearbyHospitals = MOCK_HOSPITALS
        .filter(h => h.inventory[selectedBlood as BloodGroup] > 0)
        .map(h => ({
          ...h,
          distance: calculateDistance(userLocation.lat, userLocation.lng, h.location.lat, h.location.lng)
        }))
        .sort((a, b) => a.distance - b.distance);
      
      setHospitalsFound(nearbyHospitals);

      // 2. Search Donors (only if not found or always show)
      const nearbyDonors = MOCK_CITIZENS
        .filter(d => d.bloodGroup === selectedBlood)
        .map(d => ({
          ...d,
          distance: calculateDistance(userLocation.lat, userLocation.lng, d.location.lat, d.location.lng)
        }))
        .sort((a, b) => a.distance - b.distance);
      
      setDonorsFound(nearbyDonors);
      setSearching(false);
    }, 800);
  };

  const triggerAlert = (donorName: string) => {
    playEmergencySound();
    alert(`Emergency Alert Sent to ${donorName}! Their phone is now beeping with your hospital details.`);
  };

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-slate-900 mb-4">Emergency Blood Search</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">Instant search across all partner hospitals and registered donors. Use this only for critical medical emergencies.</p>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 mb-10">
        <div className="flex flex-col md:flex-row items-end gap-6">
          <div className="flex-grow w-full">
            <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Required Blood Group</label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {bloodGroups.map(bg => (
                <button
                  key={bg}
                  onClick={() => setSelectedBlood(bg)}
                  className={`py-3 rounded-xl font-black text-sm border-2 transition-all ${selectedBlood === bg ? 'border-red-600 bg-red-600 text-white' : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-red-300'}`}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>
          <button 
            onClick={handleSearch}
            disabled={!selectedBlood || searching}
            className="w-full md:w-auto px-10 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold shadow-xl transition-all disabled:opacity-50"
          >
            {searching ? 'Locating...' : 'Search Now'}
          </button>
        </div>
      </div>

      {searching && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium">Scanning live database & nearby locations...</p>
        </div>
      )}

      {!searching && selectedBlood && (
        <div className="space-y-12 animate-in fade-in duration-500">
          {/* Hospital Results */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Nearby Hospitals with {selectedBlood} Stock</h2>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{hospitalsFound.length} Found</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {hospitalsFound.length > 0 ? hospitalsFound.map(h => (
                <div key={h.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-lg hover:shadow-xl transition-shadow flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg mb-1">{h.name}</h3>
                    <p className="text-sm text-slate-500 mb-4">{h.location.city}, {h.location.state} • <span className="text-red-600 font-bold">{h.distance.toFixed(1)} km away</span></p>
                    <div className="flex items-center space-x-2">
                       <span className="text-xs font-bold text-slate-400 uppercase">Available:</span>
                       <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-black">{h.inventory[selectedBlood as BloodGroup]} Units</span>
                    </div>
                  </div>
                  <button className="p-3 bg-slate-100 rounded-2xl hover:bg-slate-200 text-slate-700 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  </button>
                </div>
              )) : (
                <div className="col-span-2 bg-red-50 p-8 rounded-3xl text-center border border-red-100">
                  <p className="text-red-700 font-bold">No hospitals nearby have {selectedBlood} stock currently.</p>
                </div>
              )}
            </div>
          </section>

          {/* Donor Results */}
          <section>
             <div className="flex items-center justify-between mb-6">
               <h2 className="text-2xl font-bold text-slate-900">Registered Donors ({selectedBlood}) Nearby</h2>
               <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">{donorsFound.length} Available</span>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {donorsFound.length > 0 ? donorsFound.map(d => (
                 <div key={d.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-lg relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">{d.name.charAt(0)}</div>
                        <div>
                          <h3 className="font-bold text-slate-900">{d.name}</h3>
                          <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">{d.distance.toFixed(1)} km away</p>
                        </div>
                      </div>
                      <div className="text-red-600 font-black text-xl">{d.bloodGroup}</div>
                    </div>
                    
                    {user?.role === UserRole.HOSPITAL ? (
                      <div className="flex space-x-2 mt-6">
                        <button 
                          onClick={() => triggerAlert(d.name)}
                          className="flex-grow py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-100 transition-all emergency-pulse"
                        >
                          Send Emergency Alert
                        </button>
                        <a 
                          href={`tel:${d.phone}`}
                          className="px-4 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                        >
                          Call
                        </a>
                      </div>
                    ) : (
                      <div className="mt-4 p-3 bg-slate-50 rounded-xl text-center">
                        <p className="text-xs text-slate-500 font-medium">Donor contact details are only visible to Hospitals during emergencies.</p>
                      </div>
                    )}
                 </div>
               )) : (
                 <div className="col-span-2 bg-slate-100 p-8 rounded-3xl text-center">
                    <p className="text-slate-500 font-bold">No registered donors found for {selectedBlood} in this radius.</p>
                 </div>
               )}
             </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default EmergencySearch;
