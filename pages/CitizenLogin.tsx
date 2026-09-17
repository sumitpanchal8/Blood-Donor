
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { getCitizens } from '../supabase';
import { HeartPulse, LogIn, Sparkles } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  navigate: (page: string) => void;
}

const CitizenLogin: React.FC<LoginProps> = ({ onLogin, navigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [donorsList, setDonorsList] = useState<any[]>([]);

  useEffect(() => {
    getCitizens().then(list => setDonorsList(list));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const citizens = await getCitizens();
      const user = citizens.find(c => c.email.toLowerCase() === email.trim().toLowerCase());
      if (user) {
        onLogin(user);
      } else {
        setError(`No donor account found with "${email}". You can register as a new donor below.`);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo1234');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-red-100 shadow-sm">
            <HeartPulse className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-slate-900">Citizen Login</h2>
          <p className="mt-1 text-slate-500 text-sm font-medium">Access your donor dashboard & certificate records</p>
        </div>
        
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-semibold border border-red-100">{error}</div>}
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none text-slate-900 text-sm"
              placeholder="john@example.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none text-slate-900 text-sm"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center text-slate-600 cursor-pointer">
              <input type="checkbox" defaultChecked className="h-4 w-4 text-red-600 focus:ring-red-500 border-slate-300 rounded mr-2" />
              Remember me
            </label>
            <span className="text-slate-400">Default: any password</span>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-base shadow-xl shadow-red-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <LogIn className="w-5 h-5" />
            {loading ? 'Verifying with Supabase...' : 'Sign In to Dashboard'}
          </button>
        </form>

        {/* Demo Fast Login Pills */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quick Demo Accounts
          </p>
          <div className="flex flex-wrap gap-2">
            {(donorsList.length > 0 ? donorsList.slice(0, 3) : [
              { email: 'john@example.com', name: 'John Doe', bloodGroup: 'O+' },
              { email: 'sarah@example.com', name: 'Sarah Smith', bloodGroup: 'A-' }
            ]).map(d => (
              <button
                key={d.email}
                type="button"
                onClick={() => handleQuickDemo(d.email)}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors flex items-center gap-1"
              >
                <span className="font-bold text-red-600">{d.bloodGroup}</span> {d.name}
              </button>
            ))}
          </div>
        </div>
        
        <div className="mt-6 text-center border-t border-slate-100 pt-5">
          <p className="text-slate-600 text-sm">Don't have an account yet?</p>
          <button 
            type="button"
            onClick={() => navigate('register')} 
            className="mt-1 text-red-600 font-bold hover:underline text-sm"
          >
            Register as a Blood Donor
          </button>
        </div>
      </div>
    </div>
  );
};

export default CitizenLogin;
