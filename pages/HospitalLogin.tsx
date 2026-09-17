
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { getHospitals } from '../supabase';
import { Hospital as HospitalIcon, LogIn, Sparkles } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  navigate: (page: string) => void;
}

const HospitalLogin: React.FC<LoginProps> = ({ onLogin, navigate }) => {
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hospitalsList, setHospitalsList] = useState<any[]>([]);

  useEffect(() => {
    getHospitals().then(list => setHospitalsList(list));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const hospitals = await getHospitals();
      const hospital = hospitals.find(
        h => h.hospitalCode.toUpperCase() === code.trim().toUpperCase() && 
             h.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (hospital) {
        onLogin(hospital);
      } else {
        setError('Invalid credentials. Use Code: HOS001, Email: admin@citycare.org or select a demo hospital below.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (hCode: string, hEmail: string) => {
    setCode(hCode);
    setEmail(hEmail);
    setPassword('demo1234');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-blue-100 shadow-sm">
            <HospitalIcon className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-slate-900">Hospital Portal</h2>
          <p className="mt-1 text-slate-500 text-sm font-medium">Manage stock, record donations & emergency lookup</p>
        </div>
        
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-semibold border border-red-100">{error}</div>}
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Hospital Unique Code</label>
            <input 
              type="text" 
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-slate-900 text-sm font-mono uppercase"
              placeholder="HOS001"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Admin Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-slate-900 text-sm"
              placeholder="admin@citycare.org"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-slate-900 text-sm"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-base shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <LogIn className="w-5 h-5" />
            {loading ? 'Authenticating with Supabase...' : 'Access Hospital Portal'}
          </button>
        </form>

        {/* Demo Fast Login Pills */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Demo Hospitals in Supabase
          </p>
          <div className="flex flex-col gap-2">
            {(hospitalsList.length > 0 ? hospitalsList.slice(0, 2) : [
              { hospitalCode: 'HOS001', email: 'admin@citycare.org', name: 'City Care General' },
              { hospitalCode: 'HOS002', email: 'info@stmarys.org', name: 'St. Mary\'s Trauma' }
            ]).map(h => (
              <button
                key={h.hospitalCode}
                type="button"
                onClick={() => handleQuickDemo(h.hospitalCode, h.email)}
                className="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-medium text-slate-700 transition-colors flex items-center justify-between border border-slate-100"
              >
                <span className="font-bold text-slate-900">{h.name}</span>
                <span className="font-mono text-[11px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">{h.hospitalCode}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="mt-6 text-center border-t border-slate-100 pt-5">
          <p className="text-slate-500 text-xs">
            Want to register as a blood donor instead?{' '}
            <button onClick={() => navigate('register')} className="text-red-600 font-bold hover:underline">
              Citizen Register
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default HospitalLogin;
