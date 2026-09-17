import React, { useState } from 'react';
import { User, BloodGroup, UserRole } from '../types';
import { saveCitizen } from '../supabase';
import { UserPlus, ArrowLeft, HeartPulse, CheckCircle2 } from 'lucide-react';

interface RegisterProps {
  onLogin: (user: User) => void;
  navigate: (page: string) => void;
}

const CitizenRegister: React.FC<RegisterProps> = ({ onLogin, navigate }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [age, setAge] = useState<number>(25);
  const [city, setCity] = useState('New Delhi');
  const [state, setState] = useState('Delhi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const newCitizen = {
        id: 'c_' + Date.now(),
        name,
        email: email.trim().toLowerCase(),
        phone,
        bloodGroup,
        age: Number(age),
        role: UserRole.CITIZEN as const,
        location: {
          city,
          state,
          lat: 28.6139,
          lng: 77.2090
        },
        totalDonated: 0,
        history: []
      };

      await saveCitizen(newCitizen);
      setSuccess(true);
      setTimeout(() => {
        onLogin(newCitizen);
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-xl w-full bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-slate-100 relative">
        <button 
          onClick={() => navigate('citizen_login')}
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm font-semibold mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-red-100 shadow-sm">
            <HeartPulse className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-slate-900">Register as a Donor</h2>
          <p className="mt-1 text-slate-500 text-sm font-medium">Join our verified network of life-saving blood donors.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center py-10 space-y-3">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Registration Complete!</h3>
            <p className="text-slate-600 text-sm">Saving to Supabase and preparing your donor dashboard...</p>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none text-slate-900 text-sm"
                placeholder="e.g. Alex Johnson"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none text-slate-900 text-sm"
                  placeholder="alex@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Phone Number</label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none text-slate-900 text-sm"
                  placeholder="+91 9876543210"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Blood Group</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none text-slate-900 text-sm font-bold"
                >
                  {bloodGroups.map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Age</label>
                <input 
                  type="number" 
                  min="18" 
                  max="65"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none text-slate-900 text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">City</label>
                <input 
                  type="text" 
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none text-slate-900 text-sm"
                  placeholder="e.g. New Delhi"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">State</label>
                <input 
                  type="text" 
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none text-slate-900 text-sm"
                  placeholder="e.g. Delhi"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-base shadow-xl shadow-red-200 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            >
              <UserPlus className="w-5 h-5" />
              {loading ? 'Registering with Supabase...' : 'Create Donor Profile'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center border-t border-slate-100 pt-5">
          <p className="text-slate-600 text-sm">
            Already registered?{' '}
            <button onClick={() => navigate('citizen_login')} className="text-red-600 font-bold hover:underline">
              Sign In here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CitizenRegister;
