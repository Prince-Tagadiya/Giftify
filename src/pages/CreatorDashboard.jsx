import React, { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import DashboardLayout from '../components/DashboardLayout'
import { Package, DollarSign, TrendingUp, Clock, Eye, Check, X, User, Settings, Shield, Plus, Gift, Truck, MapPin, Search, AlertTriangle, Lock, ToggleLeft, ToggleRight, Info } from 'lucide-react'
import { useToast } from '../components/ToastContext'

const CreatorDashboard = ({ params }) => {
  const [location, setLocation] = useLocation();
  const activeTab = params?.subpage || 'overview';

  const [stats, setStats] = useState({
      gifts: 0,
      pending: 0
  });
  const [requests, setRequests] = useState([]);
  const [user, setUser] = useState(null);
  
  // Modals
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [newWishlistItem, setNewWishlistItem] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null); // For viewing details

  // Profile Form State (for Settings tab) - kept separate for clarity logic
  const [profileForm, setProfileForm] = useState({
      firstName: '',
      lastName: '',
      bio: '',
      categories: [],
      socials: { twitter: '', instagram: '' }
  });

  // NEW: Gift Settings State
  const [creatorSettings, setCreatorSettings] = useState({
      approvalRequired: true,
      acceptingGifts: true,
      allowedCategories: [], // Artwork, Books, etc.
      autoReject: {
          noDescription: false,
          categoryOther: false
      },
      allowFanMessages: true,
      enableThankYou: true
  });

  const { addToast } = useToast();

  useEffect(() => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          
          // Initialize profile form state
          if (parsedUser) {
              setProfileForm({
                  firstName: parsedUser.firstName || '',
                  lastName: parsedUser.lastName || '',
                  bio: parsedUser.profile?.bio || '',
                  categories: parsedUser.profile?.categories || [],
                  socials: parsedUser.profile?.socials || { twitter: '', instagram: '' }
              });

              // Initialize Settings if they exist, else defaults
              if(parsedUser.creatorSettings) {
                  setCreatorSettings(parsedUser.creatorSettings);
              }
          }
      }
  }, []);

  // Fetch Requests
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
                // Sort by date desc
                data.sort((a,b) => (b.timeline?.created_at?.seconds || 0) - (a.timeline?.created_at?.seconds || 0));
                
                setRequests(data);
                setStats({
                    gifts: data.filter(d => d.status === 'delivered').length,
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
          if(selectedRequest) setSelectedRequest(null); // Close modal if open
      } catch (error) {
          console.error("Action error:", error);
          addToast("Failed to update request", "error");
      }
  };

  const saveSettings = async () => {
      if (!user) return;
      try {
          const { doc, updateDoc } = await import('firebase/firestore');
          const { db } = await import('../firebase');

          const updatedUser = { 
              ...user, 
              firstName: profileForm.firstName,
              lastName: profileForm.lastName,
              profile: {
                  bio: profileForm.bio,
                  categories: profileForm.categories,
                  socials: profileForm.socials
              },
              creatorSettings: creatorSettings // Save the new settings
          };
          
          await updateDoc(doc(db, "users", user.uid), {
             firstName: profileForm.firstName,
             lastName: profileForm.lastName,
             profile: updatedUser.profile,
             creatorSettings: updatedUser.creatorSettings
          });

          localStorage.setItem('user', JSON.stringify(updatedUser)); 
          setUser(updatedUser);
          addToast("All settings saved successfully!", "success");
      } catch (error) {
          console.error("Profile save error:", error);
          addToast("Failed to save settings", "error");
      }
  };

  const toggleCategory = (cat) => {
      setCreatorSettings(prev => {
          const exists = prev.allowedCategories.includes(cat);
          return {
              ...prev,
              allowedCategories: exists 
                 ? prev.allowedCategories.filter(c => c !== cat)
                 : [...prev.allowedCategories, cat]
          }
      })
  }

  return (
    <DashboardLayout role="creator">
        {/* Top Stats - Only show on Overview */}
        {activeTab === 'overview' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                     <div className="text-slate-500 text-sm font-bold uppercase mb-1">Total Gifts</div>
                     <div className="text-3xl font-extrabold text-slate-800">{stats.gifts}</div>
                 </div>
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                     <div className="text-slate-500 text-sm font-bold uppercase mb-1">Pending Actions</div>
                     <div className="text-3xl font-extrabold text-amber-500">{stats.pending}</div>
                 </div>
             </div>
        )}
        
        {/* --- TAB CONTENT: INVENTORY (Shipments) --- */}
        {activeTab === 'inventory' && (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-900">Inventory & Requests</h2>
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-3 text-slate-400" />
                        <input type="text" placeholder="Search items..." className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-64" />
                    </div>
                </div>

                {requests.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200">
                        <Package size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No inventory items found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {requests.map(req => (
                            <div key={req.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${req.status === 'pending' ? 'bg-amber-100 text-amber-600' : (req.status === 'delivered' ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-600')}`}>
                                            <Gift size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-lg">{req.itemDetails.name}</h3>
                                            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                                                <User size={14} /> From: <span className="font-semibold text-slate-700">{req.fanName || 'Anonymous Fan'}</span>
                                            </div>
                                            <div className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-md inline-block uppercase tracking-wide">
                                                {req.status.replace(/_/g, ' ')}
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedRequest(req)}
                                        className="px-4 py-2 bg-slate-50 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-100 transition-colors"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* --- TAB CONTENT: SETTINGS (Now includes Gift Controls) --- */}
        {activeTab === 'settings' && (
             <div className="max-w-4xl mx-auto space-y-6">
                 
                 {/* Section 1: Profile Details */}
                 <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                     <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <User className="text-slate-400" /> Profile Details
                     </h2>
                     
                     <div className="space-y-6">
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                 <label className="block text-sm font-bold text-slate-700 mb-2">First Name</label>
                                 <input 
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={profileForm.firstName}
                                    onChange={e => setProfileForm({...profileForm, firstName: e.target.value})}
                                 />
                            </div>
                            <div>
                                 <label className="block text-sm font-bold text-slate-700 mb-2">Last Name</label>
                                 <input 
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={profileForm.lastName}
                                    onChange={e => setProfileForm({...profileForm, lastName: e.target.value})}
                                 />
                            </div>
                         </div>
                         <div>
                             <label className="block text-sm font-bold text-slate-700 mb-2">Bio</label>
                             <textarea 
                                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
                                placeholder="Tell fans what you love..."
                                value={profileForm.bio}
                                onChange={e => setProfileForm({...profileForm, bio: e.target.value})}
                             />
                         </div>
                         
                         <div>
                             <label className="block text-sm font-bold text-slate-700 mb-2">Primary Category</label>
                             <select 
                                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={profileForm.categories[0] || ''}
                                onChange={e => setProfileForm({...profileForm, categories: [e.target.value]})}
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
                                        value={profileForm.socials?.twitter || ''}
                                        onChange={e => setProfileForm({...profileForm, socials: {...profileForm.socials, twitter: e.target.value}})}
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
                                        value={profileForm.socials?.instagram || ''}
                                        onChange={e => setProfileForm({...profileForm, socials: {...profileForm.socials, instagram: e.target.value}})}
                                    />
                                </div>
                            </div>
                        </div>
                     </div>
                 </div>

                 {/* Section 2: Gift Controls & Preferences */}
                 <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                      <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Settings className="text-slate-400" /> Gift Preferences
                      </h2>

                      <div className="space-y-8">
                          {/* Approval Settings */}
                          <div className="flex justify-between items-start pb-6 border-b border-slate-100">
                             <div>
                                 <div className="font-bold text-slate-800 text-lg">Require Gift Approval</div>
                                 <p className="text-slate-500 text-sm mt-1">If ON, you must accept requests before pickup starts. <br/><span className="text-green-600 font-semibold text-xs">Recommended (Safety First)</span></p>
                             </div>
                             <button 
                                onClick={() => setCreatorSettings({...creatorSettings, approvalRequired: !creatorSettings.approvalRequired})}
                                className={`relative w-14 h-8 rounded-full transition-colors duration-200 ${creatorSettings.approvalRequired ? 'bg-blue-600' : 'bg-slate-200'}`}
                             >
                                 <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${creatorSettings.approvalRequired ? 'translate-x-6' : 'translate-x-0'}`}></div>
                             </button>
                          </div>

                          {/* Accepting Gifts Toggle */}
                          <div className="flex justify-between items-start pb-6 border-b border-slate-100">
                             <div>
                                 <div className="font-bold text-slate-800 text-lg">Accept New Gifts</div>
                                 <p className="text-slate-500 text-sm mt-1">Turn OFF if you are busy or traveling.</p>
                             </div>
                             <button 
                                onClick={() => setCreatorSettings({...creatorSettings, acceptingGifts: !creatorSettings.acceptingGifts})}
                                className={`relative w-14 h-8 rounded-full transition-colors duration-200 ${creatorSettings.acceptingGifts ? 'bg-green-500' : 'bg-slate-200'}`}
                             >
                                 <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${creatorSettings.acceptingGifts ? 'translate-x-6' : 'translate-x-0'}`}></div>
                             </button>
                          </div>

                          {/* Allowed Categories */}
                          <div className="pb-6 border-b border-slate-100">
                              <div className="font-bold text-slate-800 text-lg mb-4">Allowed Gift Categories</div>
                              <div className="flex flex-wrap gap-3">
                                  {['Handmade', 'Artwork', 'Books', 'Clothing', 'Accessories', 'Other'].map(cat => (
                                      <button
                                        key={cat}
                                        onClick={() => toggleCategory(cat)}
                                        className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                                            creatorSettings.allowedCategories.includes(cat)
                                                ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm'
                                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                        }`}
                                      >
                                          {cat}
                                      </button>
                                  ))}
                              </div>
                              <p className="text-xs text-slate-400 mt-3">Fans can only select categories you allow.</p>
                          </div>

                           {/* Auto-Reject Rules */}
                           <div className="pb-6 border-b border-slate-100">
                              <div className="font-bold text-slate-800 text-lg mb-4">Auto-Reject Rules</div>
                              <div className="space-y-3">
                                  <label className="flex items-center gap-3 cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                                        checked={creatorSettings.autoReject.noDescription}
                                        onChange={e => setCreatorSettings({...creatorSettings, autoReject: {...creatorSettings.autoReject, noDescription: e.target.checked}})}
                                      />
                                      <span className="text-slate-700 font-medium">Reject gifts without a description</span>
                                  </label>
                                  <label className="flex items-center gap-3 cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                                        checked={creatorSettings.autoReject.categoryOther}
                                        onChange={e => setCreatorSettings({...creatorSettings, autoReject: {...creatorSettings.autoReject, categoryOther: e.target.checked}})}
                                      />
                                      <span className="text-slate-700 font-medium">Reject gifts marked as "Other"</span>
                                  </label>
                              </div>
                          </div>

                          {/* Fan Message Controls */}
                          <div className="flex justify-between items-center pb-6 border-b border-slate-100">
                             <div>
                                 <div className="font-bold text-slate-800">Allow Fan Messages</div>
                             </div>
                             <button 
                                onClick={() => setCreatorSettings({...creatorSettings, allowFanMessages: !creatorSettings.allowFanMessages})}
                                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${creatorSettings.allowFanMessages ? 'bg-blue-600' : 'bg-slate-200'}`}
                             >
                                 <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200 ${creatorSettings.allowFanMessages ? 'translate-x-6' : 'translate-x-0'}`}></div>
                             </button>
                          </div>

                          {/* Thank You Messages */}
                          <div className="flex justify-between items-center">
                             <div>
                                 <div className="font-bold text-slate-800">Enable Thank-You Messages</div>
                                 <p className="text-slate-400 text-xs mt-1">Send a thank you note after delivery.</p>
                             </div>
                             <button 
                                onClick={() => setCreatorSettings({...creatorSettings, enableThankYou: !creatorSettings.enableThankYou})}
                                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${creatorSettings.enableThankYou ? 'bg-blue-600' : 'bg-slate-200'}`}
                             >
                                 <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200 ${creatorSettings.enableThankYou ? 'translate-x-6' : 'translate-x-0'}`}></div>
                             </button>
                          </div>
                      </div>
                 </div>

                 {/* Section 3: Privacy (Read-Only) */}
                 <div className="bg-slate-900 p-8 rounded-2xl text-white shadow-lg">
                      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Shield className="text-green-400" /> Privacy & Safety
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                              <MapPin size={24} className="text-slate-400 mb-3" />
                              <h3 className="font-bold text-slate-200 mb-1">Fan Address Privacy</h3>
                              <p className="text-slate-400 text-sm">Fans never see your physical address. We handle all logistics.</p>
                          </div>
                          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                              <Eye size={24} className="text-slate-400 mb-3" />
                              <h3 className="font-bold text-slate-200 mb-1">Gift Inspection</h3>
                              <p className="text-slate-400 text-sm">Every gift is physically inspected by Giftify before delivery.</p>
                          </div>
                          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                              <Check size={24} className="text-slate-400 mb-3" />
                              <h3 className="font-bold text-slate-200 mb-1">Final Approval</h3>
                              <p className="text-slate-400 text-sm">You have the final say. Reject any item before pickup.</p>
                          </div>
                      </div>
                 </div>

                 {/* Save Button */}
                 <div className="pt-4 pb-12">
                     <button 
                        onClick={saveSettings}
                        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-3"
                     >
                         <Check size={24} /> Save All Settings
                     </button>
                 </div>
             </div>
        )}

         {/* --- TAB CONTENT: PROFILE (Read Only) --- */}
         {activeTab === 'profile' && user && (
             <div className="max-w-3xl mx-auto">
                 <div className="relative mb-20">
                     <div className="h-48 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl w-full shadow-lg"></div>
                     <div className="absolute -bottom-16 left-8">
                        <div className="w-32 h-32 bg-white rounded-full p-1.5 shadow-lg">
                            <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-6xl">
                                🦁
                            </div>
                        </div>
                    </div>
                     {/* Edit Profile Button */}
                     <div className="absolute top-4 right-4">
                         <button 
                            onClick={() => setLocation('/dashboard/creator/settings')}
                            className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-xl font-bold hover:bg-white/30 transition-all flex items-center gap-2 border border-white/30"
                         >
                             <Settings size={16} /> Edit Profile
                         </button>
                     </div>
                 </div>
                 
                 <div className="px-4">
                     <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2 mb-2">
                        {user.firstName} {user.lastName} 
                        <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full uppercase tracking-wide">Creator</span>
                     </h1>
                     <p className="text-slate-500 font-medium text-lg mb-6">@{user.firstName?.toLowerCase()}</p>
                     
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <div className="md:col-span-2 space-y-6">
                             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                 <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs mb-4">About</h3>
                                 <p className="text-slate-600 leading-relaxed">
                                     {user.profile?.bio || "No bio yet."}
                                 </p>
                             </div>
                             
                             <div className="flex gap-4">
                                {user.profile?.socials?.twitter && (
                                    <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                                        Twitter
                                    </div>
                                )}
                                {user.profile?.socials?.instagram && (
                                    <div className="bg-pink-50 text-pink-600 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                                        Instagram
                                    </div>
                                )}
                             </div>
                         </div>
                         
                         <div>
                             <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                                 <h3 className="font-bold text-amber-900 mb-2">Stats</h3>
                                 <ul className="space-y-3">
                                     <li className="flex justify-between text-sm">
                                         <span className="text-amber-800">Gifts Received</span>
                                         <span className="font-bold text-amber-900">{stats.gifts}</span>
                                     </li>
                                     <li className="flex justify-between text-sm">
                                         <span className="text-amber-800">Category</span>
                                         <span className="font-bold text-amber-900">{user.profile?.categories?.[0] || 'N/A'}</span>
                                     </li>
                                 </ul>
                             </div>
                         </div>
                     </div>
                 </div>
             </div>
         )}


        {/* --- TAB CONTENT: OVERVIEW (Default) --- */}
         {activeTab === 'overview' && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* Left Column */}
                 <div className="space-y-8">
                     {/* Wishlist CTA */}
                     <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-8 rounded-2xl text-white shadow-xl shadow-blue-200 relative overflow-hidden">
                         <div className="relative z-10">
                            <h2 className="text-2xl font-bold mb-2">Share your Wishlist</h2>
                            <p className="text-blue-100 mb-6">Let your fans know what gifts you really want. Safe, secure, and private.</p>
                            <button 
                                onClick={() => setShowWishlistModal(true)}
                                className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors flex items-center gap-2"
                            >
                                <Plus size={18} /> Create Wishlist Item
                            </button>
                         </div>
                         <Gift className="absolute -right-6 -bottom-6 text-blue-400 opacity-30" size={180} />
                     </div>

                     {/* Incoming Gifts */}
                     <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Truck size={20} className="text-indigo-500" /> Incoming Gifts
                        </h3>
                        <div className="space-y-4">
                            {requests.filter(r => ['picked_up', 'ready_for_pickup'].includes(r.status)).length === 0 ? (
                                <p className="text-slate-400 text-sm">No gifts currently on the way.</p>
                            ) : (
                                requests.filter(r => ['picked_up', 'ready_for_pickup'].includes(r.status)).map(req => (
                                    <div key={req.id} className="flex items-center gap-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                                        <div className="bg-white p-2 rounded-full shadow-sm">
                                            <Gift size={20} className="text-indigo-500" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800">{req.itemDetails.name}</div>
                                            <div className="text-xs text-indigo-600 font-semibold uppercase tracking-wide">
                                                {req.status === 'picked_up' ? 'In Transit' : 'Ready for Pickup'}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                     </div>
                 </div>
                 
                 {/* Right Column - Activity */}
                 <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm h-fit">
                    <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <TrendingUp size={20} className="text-slate-400" /> Recent Activity
                    </h3>
                    <div className="space-y-6">
                        <div className="flex gap-4 items-start relative pb-6 border-l-2 border-slate-100 pl-6 last:border-0 last:pb-0">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-500"></div>
                            <div>
                                <div className="font-bold text-slate-800 text-sm">You joined Giftify!</div>
                                <div className="text-slate-400 text-xs mt-1">Welcome board 🚀</div>
                            </div>
                        </div>
                        {requests.slice(0, 5).map(req => (
                             <div key={req.id} className="flex gap-4 items-start relative pb-6 border-l-2 border-slate-100 pl-6 last:border-0 last:pb-0">
                                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${req.status === 'pending' ? 'bg-amber-100 border-amber-500' : 'bg-green-100 border-green-500'}`}></div>
                                <div>
                                    <div className="font-bold text-slate-800 text-sm">
                                        {req.status === 'pending' ? 'New Gift Request' : `Gift ${req.status}`}
                                    </div>
                                    <div className="text-slate-500 text-xs mt-1">
                                        {req.itemDetails.name} from a fan
                                    </div>
                                    <div className="text-slate-400 text-[10px] mt-1">
                                        {req.timeline?.created_at ? new Date(req.timeline.created_at.seconds * 1000).toLocaleDateString() : 'Recently'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
             </div>
         )}
         
         {/* Wishlist Modal */}
         {showWishlistModal && (
             <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                 <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-in fade-in zoom-in duration-200">
                     <div className="flex justify-between items-center mb-4">
                         <h3 className="font-bold text-lg">Add to Wishlist</h3>
                         <button onClick={() => setShowWishlistModal(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
                     </div>
                     <input 
                        type="text" 
                        placeholder="What would you like? (e.g. Gaming Headset)"
                        className="w-full p-3 border border-slate-200 rounded-xl mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newWishlistItem}
                        onChange={e => setNewWishlistItem(e.target.value)}
                     />
                     <button 
                         onClick={() => {
                             if(newWishlistItem) {
                                 addToast('Item added to wishlist!', 'success');
                                 setShowWishlistModal(false);
                                 setNewWishlistItem('');
                             }
                         }}
                         className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700"
                     >
                         Add Item
                     </button>
                 </div>
             </div>
         )}

        {/* Request Details Modal */}
        {selectedRequest && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                            <Package size={20} className="text-blue-500" /> Gift Details
                        </h3>
                        <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
                    </div>
                    
                    <div className="p-6 space-y-6">
                         {/* Header Info */}
                         <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                             <h2 className="text-xl font-bold text-slate-900 mb-1">{selectedRequest.itemDetails.name}</h2>
                             <div className="flex items-center gap-2 text-slate-600 mb-2">
                                 <User size={16} /> Sent by: <span className="font-bold text-slate-800">{selectedRequest.fanName || 'Anonymous Fan'}</span>
                             </div>
                             <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full text-xs font-bold uppercase tracking-wide text-blue-600 shadow-sm">
                                 <DollarSign size={12} /> Aprx. Value: ${selectedRequest.itemDetails.approxValue}
                             </div>
                         </div>

                         {/* Details Grid */}
                         <div className="space-y-4">
                             <div>
                                 <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Item Description</label>
                                 <p className="bg-slate-50 p-4 rounded-xl text-slate-700 border border-slate-100 leading-relaxed text-sm">
                                     {selectedRequest.itemDetails.description}
                                 </p>
                             </div>
                             
                             {selectedRequest.itemDetails.note && (
                                 <div>
                                     <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Personal Message</label>
                                     <p className="bg-slate-50 p-4 rounded-xl text-slate-700 border border-slate-100 italic text-sm">
                                         "{selectedRequest.itemDetails.note}"
                                     </p>
                                 </div>
                             )}
                         </div>

                        {/* Safety Info */}
                        <div className="flex gap-2 items-center text-xs text-slate-400 bg-slate-50 p-3 rounded-lg">
                            <Shield size={14} className="text-green-500" />
                            <span>Fan certified safety agreement signed.</span>
                        </div>

                         {/* Action Buttons (Only if Pending) */}
                         {selectedRequest.status === 'pending' && (
                             <div className="flex gap-3 pt-4 border-t border-slate-100">
                                 <button 
                                     onClick={() => handleAction(selectedRequest.id, 'reject')}
                                     className="flex-1 py-3 text-red-600 font-bold hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"
                                 >
                                     Decline
                                 </button>
                                 <button 
                                     onClick={() => handleAction(selectedRequest.id, 'accept')}
                                     className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                                 >
                                     Accept Gift
                                 </button>
                             </div>
                         )}
                         
                         {/* Close Button if not pending */}
                         {selectedRequest.status !== 'pending' && (
                             <div className="pt-2">
                                <button 
                                    onClick={() => setSelectedRequest(null)}
                                    className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                                >
                                    Close
                                </button>
                             </div>
                         )}
                    </div>
                </div>
            </div>
        )}

    </DashboardLayout>
  )
}

export default CreatorDashboard


