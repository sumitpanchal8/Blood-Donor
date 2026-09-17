
import React from 'react';
import { HeartPulse, Search, UserPlus, Users, Hospital, Activity, Phone, AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface HomeProps {
  navigate: (page: string) => void;
}

const Home: React.FC<HomeProps> = ({ navigate }) => {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-white py-20 lg:py-32 overflow-hidden border-b border-slate-100">
        <div className="absolute inset-0 z-0 opacity-10">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 100 C 20 0 50 0 100 100 Z" fill="#ef4444" />
          </svg>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full font-bold text-sm mb-8 border border-red-100"
            >
              <HeartPulse className="h-4 w-4" />
              <span>Real-time Blood Management</span>
            </motion.div>
            <h1 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9] mb-8">
              GIVE BLOOD. <br />
              <span className="text-red-600">SAVE LIVES.</span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed">
              Connect with hospitals and donors across the nation. A unified platform for managing blood stock and enabling emergency donations in real-time.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={() => navigate('emergency')}
                className="group px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-red-200 transition-all hover:scale-105 flex items-center justify-center gap-2"
              >
                <Search className="h-5 w-5" />
                Search Blood (Emergency)
              </button>
              <button 
                onClick={() => navigate('citizen_login')}
                className="group px-8 py-4 bg-white border-2 border-slate-200 hover:border-red-600 text-slate-900 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2"
              >
                <UserPlus className="h-5 w-5" />
                Become a Donor
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 group hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6" />
              </div>
              <div className="text-4xl font-black text-slate-900 mb-2">5,000+</div>
              <div className="text-slate-500 font-bold uppercase tracking-wider text-xs">Active Donors</div>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 group hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Hospital className="h-6 w-6" />
              </div>
              <div className="text-4xl font-black text-slate-900 mb-2">250+</div>
              <div className="text-slate-500 font-bold uppercase tracking-wider text-xs">Partner Hospitals</div>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 group hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Activity className="h-6 w-6" />
              </div>
              <div className="text-4xl font-black text-slate-900 mb-2">12,500+</div>
              <div className="text-slate-500 font-bold uppercase tracking-wider text-xs">Lives Saved</div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Contacts */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-red-50 border-2 border-red-200 rounded-3xl p-8 md:p-12 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <HeartPulse className="w-48 h-48 text-red-600" />
             </div>
             
             <h2 className="text-3xl font-black text-red-800 mb-8 flex items-center gap-3">
               <AlertCircle className="h-8 w-8" />
               Emergency Helpline Numbers
             </h2>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
               <div className="flex items-center space-x-4 bg-white p-6 rounded-2xl border border-red-100 shadow-sm">
                 <div className="bg-red-600 p-3 rounded-xl shadow-lg shadow-red-200">
                   <Phone className="w-6 h-6 text-white" />
                 </div>
                 <div>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-1">National Help Desk</p>
                   <p className="text-3xl font-black text-slate-900">102 / 108</p>
                 </div>
               </div>
               <div className="flex items-center space-x-4 bg-white p-6 rounded-2xl border border-red-100 shadow-sm">
                 <div className="bg-red-600 p-3 rounded-xl shadow-lg shadow-red-200">
                   <Phone className="w-6 h-6 text-white" />
                 </div>
                 <div>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-1">Emergency Blood Support</p>
                   <p className="text-2xl font-black text-slate-900">+91 11 2335 9306</p>
                 </div>
               </div>
             </div>
             <p className="mt-8 text-red-700 font-medium italic">* Dial these numbers for immediate ambulance or rare blood group assistance.</p>
          </div>
        </div>
      </section>

      {/* Role Switch Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center group hover:-translate-y-2 transition-all duration-500">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                <Users className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4">Are you a Donor?</h3>
              <p className="text-slate-500 mb-8 leading-relaxed">Register as a citizen donor, track your donations, and download life-saving certificates.</p>
              <button 
                onClick={() => navigate('citizen_login')}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 group/btn"
              >
                Sign In / Register
                <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
            
            <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center group hover:-translate-y-2 transition-all duration-500">
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                <Hospital className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4">Hospital Partner?</h3>
              <p className="text-slate-500 mb-8 leading-relaxed">Manage your blood inventory, record donations, and request blood from nearby hospitals.</p>
              <button 
                onClick={() => navigate('hospital_login')}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 group/btn"
              >
                Hospital Portal Login
                <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
