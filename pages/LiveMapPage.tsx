import React, { useState, useEffect } from 'react';
import { Hospital, Citizen, BloodGroup } from '../types';
import { getHospitals, getCitizens } from '../supabase';
import { LiveBloodMap } from '../components/LiveBloodMap';
import { Compass, Search, ShieldAlert, HeartPulse, Activity } from 'lucide-react';

interface LiveMapPageProps {
  user: any;
  navigate: (page: string) => void;
  initialBloodGroup?: BloodGroup | '';
}

export const LiveMapPage: React.FC<LiveMapPageProps> = ({ user, navigate, initialBloodGroup }) => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBloodGroup, setActiveBloodGroup] = useState<BloodGroup | ''>(initialBloodGroup || 'O+');

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [hList, cList] = await Promise.all([
          getHospitals(),
          getCitizens()
        ]);
        if (isMounted) {
          setHospitals(hList);
          setCitizens(cList);
        }
      } catch (err) {
        console.error('Error fetching live map data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full font-bold text-xs mb-3 border border-red-100">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
            <Compass className="w-3.5 h-3.5" />
            <span>Real-time GPS Tracking & Destination Routing</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            Live Emergency Blood Navigator
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl">
            Tracks your live location, checks instant hospital blood inventories, and automatically routes you to the nearest hospital or closer matched volunteer donor.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('emergency')}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-colors flex items-center gap-2"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search List View</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-28 bg-white rounded-3xl border border-slate-100 shadow-xl">
          <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 font-bold">Synchronizing Live Hospital Stocks & Donor Locations...</p>
        </div>
      ) : (
        <LiveBloodMap
          hospitals={hospitals}
          citizens={citizens}
          currentUser={user}
          initialBloodGroup={activeBloodGroup}
          onBloodGroupChange={(bg) => setActiveBloodGroup(bg)}
        />
      )}
    </div>
  );
};

export default LiveMapPage;
