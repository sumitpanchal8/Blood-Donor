
import React, { useState } from 'react';
import { Hospital, BloodGroup } from '../types';
import { MOCK_CITIZENS } from '../mockData';

interface HospitalDashboardProps {
  user: Hospital;
  navigate: (page: string) => void;
  onLogout: () => void;
}

const HospitalDashboard: React.FC<HospitalDashboardProps> = ({ user, navigate, onLogout }) => {
  const [inventory, setInventory] = useState(user.inventory);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDonor, setSelectedDonor] = useState<any>(null);
  const [donationAmount, setDonationAmount] = useState(0.5);

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const handleStockUpdate = (bg: BloodGroup, delta: number) => {
    setInventory(prev => ({
      ...prev,
      [bg]: Math.max(0, prev[bg] + delta)
    }));
  };

  const filteredDonors = searchTerm 
    ? MOCK_CITIZENS.filter(d => d.email.toLowerCase().includes(searchTerm.toLowerCase()) || d.phone.includes(searchTerm))
    : [];

  const handleRecordDonation = () => {
    if (!selectedDonor) return;
    handleStockUpdate(selectedDonor.bloodGroup, donationAmount);
    alert(`Success: Recorded ${donationAmount}L from ${selectedDonor.name}. Inventory updated.`);
    setSelectedDonor(null);
    setSearchTerm('');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{user.name}</h1>
          <p className="text-slate-600">Hospital Portal: Inventory & Donor Management</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => navigate('emergency')} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm">Emergency Lookup</button>
          <button onClick={onLogout} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg font-bold text-sm">Logout</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Inventory Management */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Blood Stock Status</h2>
              <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">Live Stock</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {bloodGroups.map(bg => (
                <div key={bg} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center">
                  <span className="text-red-600 text-2xl font-black mb-1">{bg}</span>
                  <div className="text-3xl font-bold text-slate-900 mb-4">{inventory[bg]}<span className="text-sm text-slate-400 ml-1">Units</span></div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleStockUpdate(bg, -1)}
                      className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      -
                    </button>
                    <button 
                      onClick={() => handleStockUpdate(bg, 1)}
                      className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-green-50 hover:text-green-600 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Recent Activities</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-4 text-sm font-bold text-slate-400 uppercase tracking-wider">Date</th>
                    <th className="py-4 text-sm font-bold text-slate-400 uppercase tracking-wider">Action</th>
                    <th className="py-4 text-sm font-bold text-slate-400 uppercase tracking-wider">Details</th>
                    <th className="py-4 text-sm font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <tr className="hover:bg-slate-50">
                    <td className="py-4 text-sm font-medium text-slate-900">May 24, 2024</td>
                    <td className="py-4 text-sm">Inventory Update</td>
                    <td className="py-4 text-sm text-slate-500">O+ stock adjusted (+2 units)</td>
                    <td className="py-4 text-sm"><span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold uppercase">Success</span></td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-4 text-sm font-medium text-slate-900">May 23, 2024</td>
                    <td className="py-4 text-sm">Donation Recorded</td>
                    <td className="py-4 text-sm text-slate-500">Donor: John Doe (O+)</td>
                    <td className="py-4 text-sm"><span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold uppercase">Success</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Donor Lookup */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl shadow-slate-200">
            <h2 className="text-xl font-bold mb-6">Record New Donation</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Search Donor (Email/Phone)</label>
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-red-500 text-white"
                  placeholder="e.g., john@example.com"
                />
              </div>

              {searchTerm && !selectedDonor && (
                <div className="bg-slate-800 rounded-xl border border-slate-700 max-h-48 overflow-y-auto">
                  {filteredDonors.length > 0 ? filteredDonors.map(donor => (
                    <button 
                      key={donor.id}
                      onClick={() => setSelectedDonor(donor)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-700 border-b border-slate-700 last:border-0"
                    >
                      <div className="font-bold">{donor.name} ({donor.bloodGroup})</div>
                      <div className="text-xs text-slate-400">{donor.email}</div>
                    </button>
                  )) : <div className="p-4 text-center text-slate-500">No donor found</div>}
                </div>
              )}

              {selectedDonor && (
                <div className="bg-slate-800 p-4 rounded-xl border border-red-900 relative">
                  <button onClick={() => setSelectedDonor(null)} className="absolute top-2 right-2 text-slate-400 hover:text-white">✕</button>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center font-bold">{selectedDonor.bloodGroup}</div>
                    <div>
                      <div className="font-bold text-sm">{selectedDonor.name}</div>
                      <div className="text-xs text-slate-400">{selectedDonor.phone}</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-400 uppercase">Quantity (Litres)</label>
                    <select 
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(parseFloat(e.target.value))}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 outline-none text-sm"
                    >
                      <option value={0.5}>0.5 L (Standard)</option>
                      <option value={1.0}>1.0 L</option>
                    </select>
                    <button 
                      onClick={handleRecordDonation}
                      className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-xl font-bold transition-all shadow-lg shadow-red-900/40"
                    >
                      Record Donation
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-lg">
             <h3 className="font-bold text-slate-900 mb-4">Emergency Support</h3>
             <p className="text-sm text-slate-600 mb-6">Need rare blood groups for a trauma patient? Use our nationwide search.</p>
             <button 
               onClick={() => navigate('emergency')}
               className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-xl transition-colors flex items-center justify-center"
             >
               <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
               Open Emergency Search
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalDashboard;
