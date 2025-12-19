import React, { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { Package, DollarSign, TrendingUp, Clock, Eye, Check, X, User, Settings, Shield } from 'lucide-react'
import { useToast } from '../components/ToastContext'

const CreatorDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // overview, shipments, profile
  const [stats, setStats] = useState({
      gifts: 0,
      earnings: 0,
      pending: 0
  });
  const [requests, setRequests] = useState([]);
  const [user, setUser] = useState(null);

  // Profile State
  const [profile, setProfile] = useState({
      bio: '',
      categories: [],
      socials: { twitter: '', instagram: '' }
  });

  const { addToast } = useToast();

  useEffect(() => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          // Initialize profile state if available
          if (parsedUser.profile) {
              setProfile({
                  bio: parsedUser.profile.bio || '',
                  categories: parsedUser.profile.categories || [],
                  socials: parsedUser.profile.socials || { twitter: '', instagram: '' }
              });
          }
      }
  }, []);

  // Fetch Requests Logic ... (kept same as before, omitted for brevity but should be included in full file)
  useEffect(() => {
    if (!user) return;
    let unsubscribe;
    const fetchRequests = async () => {
        try {
            const { collection, query, where, onSnapshot } = await import('firebase/firestore');
            const { db } = await import('../firebase');
            const q = query(collection(db, "gift_requests"), where("creatorId", "==", user.uid));
            unsubscribe = onSnapshot(q, (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setRequests(data);
                setStats({
                    gifts: data.filter(d => d.status === 'delivered').length,
                    earnings: data.filter(d => d.status === 'delivered').length * 5, // Mock earnings
                    pending: data.filter(d => d.status === 'pending').length
                });
            });
        } catch (e) {
            console.error("Fetch error", e);
        }
    };
    fetchRequests();
    return () => unsubscribe && unsubscribe();
  }, [user]);

  const handleAction = async (requestId, action) => {
      try {
          const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
          const { db } = await import('../firebase');

          const newStatus = action === 'accept' ? 'accepted_need_address' : 'rejected';

          await updateDoc(doc(db, "gift_requests", requestId), {
              status: newStatus,
              [`timeline.${newStatus}_at`]: serverTimestamp()
          });

          addToast(`Request ${action}ed!`, "success");
      } catch (error) {
          console.error("Action error:", error);
          addToast("Failed to update request", "error");
      }
  };

  const saveProfile = async () => {
      if (!user) return;
      try {
          const { doc, updateDoc } = await import('firebase/firestore');
          const { db } = await import('../firebase');

          const updatedUser = { ...user, profile: profile };
          await updateDoc(doc(db, "users", user.uid), {
             profile: profile
          });

          localStorage.setItem('user', JSON.stringify(updatedUser)); // Update local storage
          addToast("Profile updated successfully!", "success");
      } catch (error) {
          console.error("Profile save error:", error);
          addToast("Failed to save profile", "error");
      }
  };

  return (
    <DashboardLayout role="creator">
        {/* Top Stats Row */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                 <div className="text-slate-500 text-sm font-bold uppercase mb-1">Total Gifts</div>
                 <div className="text-3xl font-extrabold text-slate-800">{stats.gifts}</div>
             </div>
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                 <div className="text-slate-500 text-sm font-bold uppercase mb-1">Est. Earnings</div>
                 <div className="text-3xl font-extrabold text-green-600">${stats.earnings}</div>
             </div>
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                 <div className="text-slate-500 text-sm font-bold uppercase mb-1">Pending Actions</div>
                 <div className="text-3xl font-extrabold text-amber-500">{stats.pending}</div>
             </div>
         </div>

         {/* Tabs Navigation */}
         <div className="flex gap-6 border-b border-slate-200 mb-8">
             {['overview', 'shipments', 'profile'].map(tab => (
                 <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 px-2 font-bold text-sm capitalize transition-all border-b-2 ${
                        activeTab === tab
                            ? 'text-blue-600 border-blue-600'
                            : 'text-slate-400 border-transparent hover:text-slate-600'
                    }`}
                 >
                     {tab}
                 </button>
             ))}
         </div>

        {/* --- TAB CONTENT: SHIPMENTS (Requests) --- */}
        {activeTab === 'shipments' && (
            <div className="space-y-4">
                {requests.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200">
                        <Package size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No gift requests yet. Share your profile!</p>
                    </div>
                ) : (
                    requests.map(req => (
                        <div key={req.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center group hover:shadow-md transition-all">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`w-2 h-2 rounded-full ${req.status === 'pending' ? 'bg-amber-500' : 'bg-slate-300'}`}></span>
                                    <h3 className="font-bold text-slate-800 text-lg">{req.itemDetails.name}</h3>
                                </div>
                                <p className="text-slate-500 text-sm">From a fan • <span className="capitalize">{req.status.replace(/_/g, ' ')}</span></p>
                                {req.message && <p className="mt-2 text-slate-600 italic text-sm">"{req.message}"</p>}
                            </div>
                            {/* Actions only if Pending */}
                            {req.status === 'pending' && (
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => handleAction(req.id, 'reject')}
                                        className="px-4 py-2 rounded-xl text-red-600 font-bold hover:bg-red-50 transition-colors text-sm"
                                    >
                                        Decline
                                    </button>
                                    <button 
                                        onClick={() => handleAction(req.id, 'accept')}
                                        className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all text-sm"
                                    >
                                        Accept Gift
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        )}

        {/* --- TAB CONTENT: PROFILE --- */}
        {activeTab === 'profile' && (
             <div className="max-w-2xl bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                 <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <User className="text-blue-500" /> Edit Public Profile
                 </h2>
                 
                 <div className="space-y-6">
                     <div>
                         <label className="block text-sm font-bold text-slate-700 mb-2">Bio</label>
                         <textarea 
                            className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
                            placeholder="Tell fans what you love..."
                            value={profile.bio}
                            onChange={e => setProfile({...profile, bio: e.target.value})}
                         />
                     </div>
                     
                     <div>
                         <label className="block text-sm font-bold text-slate-700 mb-2">Primary Category</label>
                         <select 
                            className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={profile.categories[0] || ''}
                            onChange={e => setProfile({...profile, categories: [e.target.value]})}
                         >
                             <option value="Lifestyle">Lifestyle</option>
                             <option value="Gaming">Gaming</option>
                             <option value="Music">Music</option>
                             <option value="Tech">Tech</option>
                             <option value="Art">Art</option>
                         </select>
                     </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Twitter Handle</label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-slate-400">@</span>
                                <input 
                                    type="text" 
                                    className="w-full pl-8 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                                    placeholder="username" 
                                    value={profile.socials?.twitter || ''}
                                    onChange={e => setProfile({...profile, socials: {...profile.socials, twitter: e.target.value}})}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Instagram Handle</label>
                            <div className="relative">
                                <span className="absolute left-3 top-3 text-slate-400">@</span>
                                <input 
                                    type="text" 
                                    className="w-full pl-8 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                                    placeholder="username" 
                                    value={profile.socials?.instagram || ''}
                                    onChange={e => setProfile({...profile, socials: {...profile.socials, instagram: e.target.value}})}
                                />
                            </div>
                        </div>
                    </div>
                     
                     <div className="pt-4">
                         <button 
                            onClick={saveProfile}
                            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all w-full flex items-center justify-center gap-2"
                         >
                             <Settings size={18} /> Save Changes
                         </button>
                     </div>
                 </div>
             </div>
        )}


        {/* --- TAB CONTENT: OVERVIEW (Default) --- */}
        {activeTab === 'overview' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-8 rounded-2xl text-white shadow-xl shadow-blue-200">
                     <h2 className="text-2xl font-bold mb-2">Share your Wishlist</h2>
                     <p className="text-blue-100 mb-6">Let your fans know what gifts you really want. Safe, secure, and private.</p>
                     <button className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors">
                         Create Wishlist Item
                     </button>
                 </div>
                 
                 <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><TrendingUp size={20} className="text-slate-400" /> Recent Actvity</h3>
                    <div className="space-y-4">
                        <div className="flex gap-4 items-center text-sm text-slate-500">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">🎉</div>
                            <div>You joined Giftify! <span className="text-slate-400 text-xs ml-2">Just now</span></div>
                        </div>
                    </div>
                 </div>
             </div>
        )}

    </DashboardLayout>
  )
}

export default CreatorDashboard
