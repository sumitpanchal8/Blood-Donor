import { createClient } from '@supabase/supabase-js';
import { Citizen, Hospital, BloodGroup, UserRole } from './types';
import { MOCK_CITIZENS, MOCK_HOSPITALS } from './mockData';

// Priority: Vite env variables -> Provided credentials as fallback
export const SUPABASE_URL = 
  import.meta.env.VITE_SUPABASE_URL || 'https://sjyoryvkiwzvlyrbqddi.supabase.co';

export const SUPABASE_ANON_KEY = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeW9yeXZraXd6dmx5cmJxZGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NDcxOTIsImV4cCI6MjEwNTIyMzE5Mn0.tCWkbCWzYIAkLkNP9V0EB_hBEUfWXn1HA6QxL5EFSvA';

export const SUPABASE_PUBLISHABLE_KEY = 
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
  'sb_publishable_k2iYSetThz82otQMPDz2Tw_nnq5Hi4-';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

export const SUPABASE_SQL_SCHEMA = `-- Vision Seekers Blood Bank Schema for Supabase
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/sjyoryvkiwzvlyrbqddi/sql)

-- 1. Citizens Table
CREATE TABLE IF NOT EXISTS public.citizens (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  blood_group TEXT NOT NULL,
  age INTEGER NOT NULL,
  city TEXT,
  state TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  total_donated DOUBLE PRECISION DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Hospitals Table
CREATE TABLE IF NOT EXISTS public.hospitals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  hospital_code TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  city TEXT,
  state TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  inventory JSONB NOT NULL DEFAULT '{"A+": 10, "A-": 4, "B+": 12, "B-": 3, "AB+": 6, "AB-": 2, "O+": 15, "O-": 5}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Donations Table
CREATE TABLE IF NOT EXISTS public.donations (
  id TEXT PRIMARY KEY,
  citizen_id TEXT REFERENCES public.citizens(id) ON DELETE CASCADE,
  hospital_id TEXT,
  hospital_name TEXT NOT NULL,
  amount_litres DOUBLE PRECISION NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Emergency Alerts Table
CREATE TABLE IF NOT EXISTS public.emergency_alerts (
  id TEXT PRIMARY KEY,
  donor_name TEXT NOT NULL,
  hospital_name TEXT,
  blood_group TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) with public access policies for anon client demo
ALTER TABLE public.citizens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access to citizens" ON public.citizens;
CREATE POLICY "Public access to citizens" ON public.citizens FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to hospitals" ON public.hospitals;
CREATE POLICY "Public access to hospitals" ON public.hospitals FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to donations" ON public.donations;
CREATE POLICY "Public access to donations" ON public.donations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to emergency_alerts" ON public.emergency_alerts;
CREATE POLICY "Public access to emergency_alerts" ON public.emergency_alerts FOR ALL USING (true) WITH CHECK (true);

-- Seed Initial Data
INSERT INTO public.hospitals (id, name, hospital_code, email, city, state, lat, lng, inventory)
VALUES 
  ('h1', 'City Care General Hospital', 'HOS001', 'admin@citycare.org', 'New Delhi', 'Delhi', 28.6139, 77.2090, '{"A+": 12, "A-": 5, "B+": 15, "B-": 2, "AB+": 8, "AB-": 1, "O+": 20, "O-": 4}'::JSONB),
  ('h2', 'St. Mary''s Trauma Center', 'HOS002', 'info@stmarys.org', 'Mumbai', 'Maharashtra', 19.0760, 72.8777, '{"A+": 4, "A-": 0, "B+": 10, "B-": 3, "AB+": 5, "AB-": 0, "O+": 15, "O-": 1}'::JSONB)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.citizens (id, name, email, phone, blood_group, age, city, state, lat, lng, total_donated)
VALUES 
  ('c1', 'John Doe', 'john@example.com', '+91 9876543210', 'O+', 28, 'New Delhi', 'Delhi', 28.6139, 77.2090, 3.5),
  ('c2', 'Sarah Smith', 'sarah@example.com', '+91 9876543211', 'A-', 32, 'Mumbai', 'Maharashtra', 19.0760, 72.8777, 1.2)
ON CONFLICT (id) DO NOTHING;
`;

// Helper data access functions with resilient fallback
export async function testSupabaseConnection(): Promise<{ connected: boolean; tablesFound: boolean; message: string }> {
  try {
    const { data, error } = await supabase.from('hospitals').select('id').limit(1);
    if (error) {
      // If table doesn't exist yet, connection is still valid to Supabase
      if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return {
          connected: true,
          tablesFound: false,
          message: 'Connected to Supabase, but database tables need to be initialized.'
        };
      }
      return {
        connected: false,
        tablesFound: false,
        message: error.message
      };
    }
    return {
      connected: true,
      tablesFound: true,
      message: 'Supabase connected and database tables ready!'
    };
  } catch (err: any) {
    return {
      connected: false,
      tablesFound: false,
      message: err.message || 'Unable to connect to Supabase.'
    };
  }
}

// Fetch all Citizens (combines Supabase and local cache)
export async function getCitizens(): Promise<Citizen[]> {
  try {
    const { data: dbCitizens, error: citizenError } = await supabase
      .from('citizens')
      .select('*');

    if (!citizenError && dbCitizens && dbCitizens.length > 0) {
      // Fetch donation histories
      const { data: dbDonations } = await supabase
        .from('donations')
        .select('*');

      return dbCitizens.map((row: any) => {
        const history = (dbDonations || [])
          .filter((d: any) => d.citizen_id === row.id)
          .map((d: any) => ({
            id: d.id,
            hospitalName: d.hospital_name || 'Hospital',
            date: d.date,
            amountLitres: d.amount_litres || 0.5
          }));

        return {
          id: row.id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          bloodGroup: row.blood_group as BloodGroup,
          age: row.age,
          location: {
            lat: row.lat || 28.6139,
            lng: row.lng || 77.2090,
            city: row.city || 'City',
            state: row.state || 'State',
          },
          totalDonated: row.total_donated || 0,
          history: history.length > 0 ? history : [
            { id: 'h1', hospitalName: 'City Care Hospital', date: '2024-01-20', amountLitres: 0.5 }
          ],
          role: UserRole.CITIZEN
        };
      });
    }
  } catch (err) {
    console.warn('Supabase getCitizens fallback to local data:', err);
  }

  // Fallback to local storage or mock
  const local = localStorage.getItem('blood_app_citizens');
  if (local) {
    try {
      return JSON.parse(local);
    } catch {}
  }
  return MOCK_CITIZENS;
}

// Fetch all Hospitals
export async function getHospitals(): Promise<Hospital[]> {
  try {
    const { data: dbHospitals, error } = await supabase
      .from('hospitals')
      .select('*');

    if (!error && dbHospitals && dbHospitals.length > 0) {
      return dbHospitals.map((row: any) => ({
        id: row.id,
        name: row.name,
        hospitalCode: row.hospital_code,
        email: row.email,
        role: UserRole.HOSPITAL,
        location: {
          lat: row.lat || 28.6139,
          lng: row.lng || 77.2090,
          city: row.city || 'City',
          state: row.state || 'State'
        },
        inventory: (typeof row.inventory === 'object' && row.inventory !== null) 
          ? row.inventory 
          : { 'A+': 10, 'A-': 5, 'B+': 12, 'B-': 3, 'AB+': 7, 'AB-': 2, 'O+': 18, 'O-': 4 }
      }));
    }
  } catch (err) {
    console.warn('Supabase getHospitals fallback to local data:', err);
  }

  const local = localStorage.getItem('blood_app_hospitals');
  if (local) {
    try {
      return JSON.parse(local);
    } catch {}
  }
  return MOCK_HOSPITALS;
}

// Register or save Citizen in Supabase
export async function saveCitizen(citizen: Citizen): Promise<Citizen> {
  // Update local storage backup
  const current = await getCitizens();
  const existingIndex = current.findIndex(c => c.id === citizen.id || c.email.toLowerCase() === citizen.email.toLowerCase());
  let updatedList: Citizen[];
  if (existingIndex >= 0) {
    updatedList = [...current];
    updatedList[existingIndex] = citizen;
  } else {
    updatedList = [citizen, ...current];
  }
  localStorage.setItem('blood_app_citizens', JSON.stringify(updatedList));

  // Sync to Supabase
  try {
    await supabase.from('citizens').upsert({
      id: citizen.id,
      name: citizen.name,
      email: citizen.email,
      phone: citizen.phone,
      blood_group: citizen.bloodGroup,
      age: citizen.age,
      city: citizen.location.city,
      state: citizen.location.state,
      lat: citizen.location.lat,
      lng: citizen.location.lng,
      total_donated: citizen.totalDonated
    });
  } catch (err) {
    console.warn('Supabase saveCitizen error:', err);
  }

  return citizen;
}

// Update Hospital Inventory in Supabase
export async function updateHospitalStock(hospitalId: string, inventory: Record<BloodGroup, number>): Promise<void> {
  // Update local storage backup
  const hospitals = await getHospitals();
  const updated = hospitals.map(h => h.id === hospitalId ? { ...h, inventory } : h);
  localStorage.setItem('blood_app_hospitals', JSON.stringify(updated));

  // Sync to Supabase
  try {
    await supabase
      .from('hospitals')
      .update({ inventory })
      .eq('id', hospitalId);
  } catch (err) {
    console.warn('Supabase updateHospitalStock error:', err);
  }
}

// Record Donation in Supabase
export async function recordNewDonation(
  hospitalId: string,
  hospitalName: string,
  citizenId: string,
  amountLitres: number,
  bloodGroup: BloodGroup
): Promise<{ success: boolean; message: string }> {
  const donationId = 'don_' + Date.now();
  const dateStr = new Date().toISOString().split('T')[0];

  // Update citizen donation history and totalDonated
  const citizens = await getCitizens();
  const citizen = citizens.find(c => c.id === citizenId);
  if (citizen) {
    citizen.totalDonated = parseFloat((citizen.totalDonated + amountLitres).toFixed(1));
    citizen.history.push({
      id: donationId,
      hospitalName,
      date: dateStr,
      amountLitres
    });
    await saveCitizen(citizen);
  }

  // Update hospital inventory
  const hospitals = await getHospitals();
  const hospital = hospitals.find(h => h.id === hospitalId);
  if (hospital) {
    const currentUnits = hospital.inventory[bloodGroup] || 0;
    const addedUnits = Math.round(amountLitres * 2); // 0.5L is 1 unit
    hospital.inventory[bloodGroup] = currentUnits + (addedUnits || 1);
    await updateHospitalStock(hospitalId, hospital.inventory);
  }

  // Record to Supabase donations table
  try {
    await supabase.from('donations').insert({
      id: donationId,
      citizen_id: citizenId,
      hospital_id: hospitalId,
      hospital_name: hospitalName,
      amount_litres: amountLitres,
      date: dateStr
    });
  } catch (err) {
    console.warn('Supabase recordNewDonation insert error:', err);
  }

  return { success: true, message: `Recorded ${amountLitres}L donation for ${citizen?.name || 'donor'}` };
}

// Send Emergency Alert and log to Supabase
export async function sendEmergencyAlert(donorName: string, hospitalName: string, bloodGroup: string): Promise<void> {
  const alertId = 'alert_' + Date.now();
  try {
    await supabase.from('emergency_alerts').insert({
      id: alertId,
      donor_name: donorName,
      hospital_name: hospitalName,
      blood_group: bloodGroup
    });
  } catch (err) {
    console.warn('Supabase sendEmergencyAlert insert error:', err);
  }
}
