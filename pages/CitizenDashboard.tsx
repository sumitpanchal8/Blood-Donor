
import React from 'react';
import { Citizen } from '../types';

interface CitizenDashboardProps {
  user: Citizen;
  navigate: (page: string) => void;
  onLogout: () => void;
}

const CitizenDashboard: React.FC<CitizenDashboardProps> = ({ user, navigate, onLogout }) => {
  const thresholds = [1, 3, 5];
  const achievedThresholds = thresholds.filter(t => user.totalDonated >= t);

  const handleDownloadCertificate = (level: number) => {
    alert(`Downloading ${level}L Donation Excellence Certificate for ${user.name}...`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome, {user.name}</h1>
          <p className="text-slate-600">Your donor impact and profile overview.</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => navigate('emergency')} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm">Emergency Search</button>
          <button onClick={onLogout} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg font-bold text-sm">Logout</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100 sticky top-24">
            <div className="flex flex-col items-center mb-8">
              <div className="w-24 h-24 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center text-3xl font-black mb-4">
                {user.bloodGroup}
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider mt-2">Active Donor</span>
            </div>
            
            <div className="space-y-4 border-t border-slate-100 pt-6">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Age</span>
                <span className="text-slate-900 font-bold">{user.age} Years</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Phone</span>
                <span className="text-slate-900 font-bold">{user.phone}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Email</span>
                <span className="text-slate-900 font-bold">{user.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Location</span>
                <span className="text-slate-900 font-bold text-right">{user.location.city}, {user.location.state}</span>
              </div>
            </div>
            
            <button className="w-full mt-8 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">
              Update Profile
            </button>
          </div>
        </div>

        {/* Impact & History */}
        <div className="lg:col-span-2 space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-red-600 p-8 rounded-3xl shadow-xl shadow-red-100 text-white">
              <div className="text-red-100 font-medium uppercase text-xs tracking-widest mb-1">Total Contribution</div>
              <div className="text-5xl font-black">{user.totalDonated}<span className="text-2xl ml-1">L</span></div>
              <p className="mt-4 text-red-100 text-sm">You have saved approximately <span className="font-bold">10 lives</span> through your contributions!</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
              <div className="text-slate-400 font-medium uppercase text-xs tracking-widest mb-1">Last Donation</div>
              <div className="text-3xl font-bold text-slate-900">{user.history[user.history.length-1].date}</div>
              <p className="mt-4 text-slate-500 text-sm">At {user.history[user.history.length-1].hospitalName}</p>
            </div>
          </div>

          {/* Certificates */}
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
              <svg className="w-6 h-6 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              Donation Milestones & Certificates
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {thresholds.map(level => {
                const isEarned = user.totalDonated >= level;
                return (
                  <div key={level} className={`p-6 rounded-2xl border-2 transition-all ${isEarned ? 'border-yellow-200 bg-yellow-50' : 'border-slate-100 bg-slate-50 opacity-60'}`}>
                    <div className="text-2xl font-bold mb-1">{level}L</div>
                    <div className="text-xs text-slate-500 font-medium mb-4">Silver Badge</div>
                    <button 
                      disabled={!isEarned}
                      onClick={() => handleDownloadCertificate(level)}
                      className={`w-full py-2 rounded-lg text-sm font-bold flex items-center justify-center ${isEarned ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                      {isEarned ? 'Certificate' : 'Locked'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Donation Timeline */}
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Donation History</h3>
            <div className="space-y-6">
              {user.history.map((record, idx) => (
                <div key={record.id} className="relative pl-8 pb-6 border-l-2 border-slate-100 last:pb-0">
                  <div className="absolute left-[-9px] top-0 w-4 h-4 bg-red-600 rounded-full border-4 border-white"></div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900">{record.hospitalName}</h4>
                      <p className="text-slate-500 text-sm">Donated {record.amountLitres}L of blood</p>
                    </div>
                    <div className="text-sm font-semibold text-slate-400">
                      {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              )).reverse()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;
