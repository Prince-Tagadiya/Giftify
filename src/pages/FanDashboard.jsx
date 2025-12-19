import React, { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { Search, Filter, Star, Gift, Package, MapPin, CheckCircle, Clock, Truck, X, Heart, Save, Phone, Shield, Bell, Trash2, AlertTriangle, Info } from 'lucide-react'
import { useToast } from '../components/ToastContext'
import SendGiftModal from '../components/SendGiftModal'
import PickupAddressModal from '../components/PickupAddressModal'
import { useLocation } from 'wouter'

const FanDashboard = ({ params }) => {
  const [location, setLocation] = useLocation();
  const subpage = params?.subpage; 
  // Map subpages to tabs. Default is 'discover'
  const activeTab = subpage === 'history' ? 'history' : (subpage === 'favorites' ? 'favorites' : (subpage === 'settings' ? 'settings' : 'discover'));

  const categories = ['All', 'Gaming', 'Music', 'Tech', 'Lifestyle']
  const [activeCat, setActiveCat] = useState('All')

  const [creators, setCreators] = useState([]);
  const [myGifts, setMyGifts] = useState([]);
  
  const [loadingCreators, setLoadingCreators] = useState(true);
  const [loadingGifts, setLoadingGifts] = useState(true);
  
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [pickupModalOpen, setPickupModalOpen] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [giftDetailOpen, setGiftDetailOpen] = useState(false);

  const { addToast } = useToast();
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  
  // Settings State
  const [fanSettings, setFanSettings] = useState({
      defaultPickupAddress: "",
      allowContactForPickup: true,
      confirmBeforeSubmit: true,
      notifications: {
          approval: true,
          pickup: true,
          delivery: true,
          thankYou: true
      }
  });

  useEffect(() => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          if(parsed.fanSettings) setFanSettings(parsed.fanSettings);
          if(parsed.favorites) setFavorites(parsed.favorites);
      }
  }, []);

  // Fetch Creators
  useEffect(() => {
    const fetchCreators = async () => {
        try {
            const { collection, getDocs, query, where } = await import('firebase/firestore');
            const { db } = await import('../firebase');
            
            const q = query(collection(db, "users"), where("role", "==", "creator"));
            const snapshot = await getDocs(q);
            
            const fetchedCreators = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    name: data.displayName || `${data.firstName} ${data.lastName}`,
                    category: data.profile?.categories?.[0] || 'Lifestyle',
                    avatar: data.profile?.avatarUrl || '🦁',
                    handle: `@${data.firstName}`.toLowerCase(),
                    verified: true // In real app, check data.verified
                };
            });
            
            setCreators(fetchedCreators);
        } catch (error) {
            console.error("Error fetching creators:", error);
        } finally {
            setLoadingCreators(false);
        }
    };
    
    fetchCreators();
  }, []);

  // Fetch My Gifts (Real-time listener)
  useEffect(() => {
      if (!user) return;

      let unsubscribe;
      const fetchGifts = async () => {
          try {
            const { collection, query, where, onSnapshot } = await import('firebase/firestore');
            const { db } = await import('../firebase');

            const q = query(
                collection(db, "gift_requests"), 
                where("fanId", "==", user.uid)
            );

            unsubscribe = onSnapshot(q, (snapshot) => {
                const gifts = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })).sort((a,b) => (b.timeline?.created_at?.seconds || 0) - (a.timeline?.created_at?.seconds || 0));
                setMyGifts(gifts);
                setLoadingGifts(false);
            });

          } catch (e) {
              console.error("Error setting up listener:", e);
              setLoadingGifts(false);
          }
      };

      fetchGifts();
      return () => unsubscribe && unsubscribe();
  }, [user]);

  const saveSettings = async (newSettings = fanSettings) => {
      if (!user) return;
      try {
          const { doc, updateDoc } = await import('firebase/firestore');
          const { db } = await import('../firebase');

          const updatedUser = { 
              ...user, 
              fanSettings: newSettings,
              favorites: favorites
          };
          
          await updateDoc(doc(db, "users", user.uid), {
             fanSettings: newSettings,
             favorites: favorites
          });

          localStorage.setItem('user', JSON.stringify(updatedUser)); 
          setUser(updatedUser);
          setFanSettings(newSettings);
          addToast("Settings saved successfully!", "success");
      } catch (error) {
          console.error("Save error:", error);
          addToast("Failed to save settings", "error");
      }
  };

  const toggleFavorite = async (creatorId, e) => {
      e.stopPropagation();
      let newFavs;
      if (favorites.includes(creatorId)) {
          newFavs = favorites.filter(id => id !== creatorId);
          addToast("Removed from favorites", "default");
      } else {
          newFavs = [...favorites, creatorId];
          addToast("Added to favorites!", "success");
      }
      setFavorites(newFavs);
      
      // Persist to user profile logic reused
      if (!user) return;
          
      try {
        const { doc, updateDoc } = await import('firebase/firestore');
        const { db } = await import('../firebase');
        const updatedUser = { ...user, favorites: newFavs };
        
        await updateDoc(doc(db, "users", user.uid), {
             favorites: newFavs
        });
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      } catch(err) {
          console.error("Fav save check", err);
      }
  };

  const filteredCreators = activeCat === 'All' 
    ? creators 
    : creators.filter(c => c.category === activeCat);

  // Filter Favorite Creators
  const favoriteCreatorsList = creators.filter(c => favorites.includes(c.id));


  // Status Badge Helper
  const getStatusBadge = (status) => {
      const config = {
          'pending': { color: 'text-amber-600', bg: 'bg-amber-50', label: 'Pending Approval', icon: Clock },
          'accepted_need_address': { color: 'text-blue-600', bg: 'bg-blue-50', label: 'Accepted - Action Needed', icon: MapPin },
          'ready_for_pickup': { color: 'text-purple-600', bg: 'bg-purple-50', label: 'Pickup Scheduled', icon: Truck },
          'picked_up': { color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'In Transit', icon: Package },
          'delivered': { color: 'text-green-600', bg: 'bg-green-50', label: 'Delivered', icon: CheckCircle },
          'rejected': { color: 'text-red-600', bg: 'bg-red-50', label: 'Declined', icon: X },
      }[status] || { color: 'text-gray-600', bg: 'bg-gray-50', label: status, icon: Clock };

      const Icon = config.icon;
      return (
          <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${config.color} ${config.bg}`}>
              <Icon size={12} /> {config.label}
          </span>
      );
  };

  return (
    <DashboardLayout role="fan">
        
        {activeTab === 'discover' && (
            <>
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
                        Welcome back, {user ? user.firstName : 'Fan'}! 👋
                    </h1>
                    <p className="text-slate-500">Support your favorite creators safely using Physical Logistics.</p>
                </div>

                {/* --- SECTION: DISCOVER --- */}
                <div className="flex gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search creators..." 
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                    </div>
                    <div className="flex gap-2">
                         {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCat(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                    activeCat === cat 
                                        ? 'bg-slate-900 text-white shadow-lg' 
                                        : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Creators Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {loadingCreators ? (
                        [1,2,3,4].map(i => <div key={i} className="h-64 bg-slate-100 rounded-2xl animate-pulse"></div>)
                    ) : filteredCreators.length > 0 ? (
                        filteredCreators.map(creator => (
                        <div 
                            key={creator.id} 
                            onClick={() => {
                                setSelectedCreator(creator);
                                setDetailModalOpen(true);
                            }}
                            className="bg-white p-6 rounded-2xl border border-slate-200 hover:shadow-xl transition-all cursor-pointer group hover:-translate-y-1 relative"
                        >
                            {/* Heart Icon */}
                            <button 
                                onClick={(e) => toggleFavorite(creator.id, e)}
                                className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-sm transition-all z-10 ${favorites.includes(creator.id) ? 'bg-pink-50 text-pink-500' : 'bg-slate-100/50 text-slate-400 hover:bg-pink-50 hover:text-pink-400'}`}
                            >
                                <Heart size={18} fill={favorites.includes(creator.id) ? "currentColor" : "none"} />
                            </button>

                            <div className="flex flex-col items-center mb-4">
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-4xl mb-3 shadow-inner">
                                    {creator.avatar}
                                </div>
                                <h3 className="font-bold text-lg text-slate-900 flex items-center gap-1">
                                    {creator.name}
                                    {creator.verified && <CheckCircle size={16} className="text-blue-500" fill="currentColor" color="white" />}
                                </h3>
                                <p className="text-slate-400 text-sm">{creator.handle}</p>
                                <span className="mt-2 text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                                    {creator.category}
                                </span>
                            </div>
                            
                            <button 
                                className="w-full py-2.5 bg-blue-50 text-blue-600 rounded-xl font-bold flex items-center justify-center gap-2 group-hover:bg-blue-600 group-hover:text-white transition-colors"
                            >
                                <Eye size={18} /> View Profile
                            </button>
                        </div>
                    ))
                    ) : (
                        <div className="col-span-full text-center py-12 text-slate-400">
                            <div className="text-4xl mb-2">🤔</div>
                            <p>No creators found in this category.</p>
                        </div>
                    )}
                </div>
            </>
        )}

        {activeTab === 'history' && (
            <div className="max-w-4xl mx-auto">
                 <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Package className="text-blue-500" /> My Gift History
                </h2>
                
                {myGifts.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
                        <Gift size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-600">No gifts sent yet</h3>
                        <p className="text-slate-400 mb-6">Find a creator and make their day!</p>
                        <button onClick={() => setLocation('/dashboard/fan')} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Browse Creators</button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {myGifts.map(gift => (
                            <div key={gift.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 md:items-center">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-bold text-lg text-slate-900">{gift.itemDetails.name}</h3>
                                        {getStatusBadge(gift.status)}
                                    </div>
                                    <div className="text-slate-500 text-sm flex gap-4">
                                        <span>To: <span className="font-semibold text-slate-700">@{gift.creatorName}</span></span>
                                        <span>Sent: {gift.timeline?.created_at ? new Date(gift.timeline.created_at.seconds * 1000).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                    {gift.logistics?.trackingNumber && (
                                        <div className="text-xs text-slate-400 font-mono mt-2 bg-slate-50 inline-block px-2 py-1 rounded">
                                            Tracking: {gift.logistics.trackingNumber}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex gap-2 shrink-0">
                                    {gift.status === 'accepted_need_address' && (
                                         <button 
                                            onClick={() => {
                                                setSelectedRequest(gift);
                                                setPickupModalOpen(true);
                                            }}
                                            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                                        >
                                            <MapPin size={18} /> Schedule Pickup
                                        </button>
                                    )}
                                     <button 
                                        onClick={() => {
                                            setSelectedRequest(gift);
                                            setGiftDetailOpen(true);
                                        }}
                                        className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 font-bold border border-slate-200"
                                     >
                                        Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {activeTab === 'favorites' && (
            <div className="max-w-6xl mx-auto">
                 <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Heart className="text-red-500" fill="currentColor" /> My Favorites
                </h2>

                {favoriteCreatorsList.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
                        <Heart size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-600">No favorites yet</h3>
                        <p className="text-slate-400 mb-6">Star creators you love to see them here.</p>
                        <button onClick={() => setLocation('/dashboard/fan')} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Browse Creators</button>
                    </div>
                ) : (
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {favoriteCreatorsList.map(creator => (
                             <div 
                                key={creator.id} 
                                onClick={() => {
                                    setSelectedCreator(creator);
                                    setDetailModalOpen(true);
                                }}
                                className="bg-white p-6 rounded-2xl border border-slate-200 hover:shadow-xl transition-all cursor-pointer group hover:-translate-y-1 relative"
                            >
                                <button 
                                    onClick={(e) => toggleFavorite(creator.id, e)}
                                    className="absolute top-4 right-4 p-2 rounded-full bg-pink-50 text-pink-500 hover:bg-slate-100 hover:text-slate-400 transition-all z-10"
                                >
                                    <Heart size={18} fill="currentColor" />
                                </button>
                                {/* Creator Info Reduced */}
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-2xl shadow-inner shrink-0">
                                        {creator.avatar}
                                    </div>
                                    <div>
                                         <h3 className="font-bold text-slate-900 flex items-center gap-1">
                                            {creator.name}
                                         </h3>
                                         <p className="text-slate-400 text-xs">{creator.handle}</p>
                                    </div>
                                </div>
                                <button 
                                    className="w-full py-2 bg-blue-50 text-blue-600 rounded-xl font-bold flex items-center justify-center gap-2 text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors"
                                >
                                    <Eye size={16} /> View Profile
                                </button>
                            </div>
                        ))}
                     </div>
                )}
            </div>
        )}

        {/* --- SETTINGS TAB --- */}
        {activeTab === 'settings' && (
             <div className="max-w-3xl mx-auto space-y-6">
                 <h2 className="text-2xl font-bold text-slate-900 mb-2">Account Settings</h2>
                 <p className="text-slate-500 mb-6">Manage your improved privacy and gift preferences.</p>

                 {/* 1. Default Pickup Address */}
                 <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                          <MapPin className="text-blue-500" /> Default Pickup Address
                      </h3>
                      <p className="text-slate-400 text-sm mb-4">Saved address for quicker pickups. Only shared with logistics after creator approval.</p>
                      
                      <textarea 
                          className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 min-h-[100px]"
                          placeholder="Your full address (Street, City, Zip, Country)"
                          value={fanSettings.defaultPickupAddress}
                          onChange={e => setFanSettings({...fanSettings, defaultPickupAddress: e.target.value})}
                      />
                 </div>

                 {/* 2. Contact & Confirmation */}
                 <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                      <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                          <Phone className="text-green-500" /> Contact & Preferences
                      </h3>
                      
                      <div className="space-y-6">
                           <div className="flex justify-between items-center pb-6 border-b border-slate-100">
                               <div>
                                   <div className="font-bold text-slate-800">Allow Contact for Pickup</div>
                                   <p className="text-slate-400 text-sm mt-1">Allow logistics team to call/text if there are issues.</p>
                               </div>
                               <button 
                                  onClick={() => setFanSettings({...fanSettings, allowContactForPickup: !fanSettings.allowContactForPickup})}
                                  className={`relative w-12 h-6 rounded-full transition-colors ${fanSettings.allowContactForPickup ? 'bg-green-500' : 'bg-slate-200'}`}
                               >
                                   <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform ${fanSettings.allowContactForPickup ? 'translate-x-6' : 'translate-x-0'}`}></div>
                               </button>
                           </div>

                           <div className="flex justify-between items-center">
                               <div>
                                   <div className="font-bold text-slate-800">Confirm Before Submitting</div>
                                   <p className="text-slate-400 text-sm mt-1">Show a confirmation screen before sending a gift request.</p>
                               </div>
                               <button 
                                  onClick={() => setFanSettings({...fanSettings, confirmBeforeSubmit: !fanSettings.confirmBeforeSubmit})}
                                  className={`relative w-12 h-6 rounded-full transition-colors ${fanSettings.confirmBeforeSubmit ? 'bg-blue-600' : 'bg-slate-200'}`}
                               >
                                   <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform ${fanSettings.confirmBeforeSubmit ? 'translate-x-6' : 'translate-x-0'}`}></div>
                               </button>
                           </div>
                      </div>
                 </div>

                 {/* 3. Notifications */}
                 <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                      <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                          <Bell className="text-amber-500" /> Notification Preferences
                      </h3>
                      <div className="space-y-3">
                          {[
                              { label: 'Gift Accepted / Rejected', key: 'approval' },
                              { label: 'Pickup Scheduled', key: 'pickup' },
                              { label: 'Gift Delivered', key: 'delivery' },
                              { label: 'Thank-You Message Received', key: 'thankYou' }
                          ].map(item => (
                              <label key={item.key} className="flex items-center gap-3 cursor-pointer p-4 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                                  <input 
                                      type="checkbox" 
                                      className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                                      checked={fanSettings.notifications[item.key]}
                                      onChange={e => setFanSettings({
                                          ...fanSettings, 
                                          notifications: { ...fanSettings.notifications, [item.key]: e.target.checked }
                                      })}
                                  />
                                  <span className="font-medium text-slate-700">{item.label}</span>
                              </label>
                          ))}
                      </div>
                 </div>

                 {/* 4. Safety (Read Only) */}
                 <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-lg">
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                          <Shield className="text-blue-400" /> Safety Agreement
                      </h3>
                      <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 space-y-3 text-sm text-slate-300">
                          <div className="flex gap-3">
                              <AlertTriangle size={16} className="text-yellow-500 shrink-0 mt-0.5" />
                              <p>Strictly no harmful, illegal, or dangerous items allowed.</p>
                          </div>
                          <div className="flex gap-3">
                              <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                              <p>Giftify inspects every package. We reject anything suspicious.</p>
                          </div>
                          <div className="flex gap-3">
                              <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                              <p>False declarations or abuse will result in an immediate account ban.</p>
                          </div>
                      </div>
                 </div>

                 {/* 5. Account Actions */}
                 <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                      <h3 className="text-lg font-bold text-slate-900 mb-6">Account Safety</h3>
                      <div className="space-y-4">
                          <button className="w-full text-left p-4 rounded-xl border border-slate-200 hover:bg-slate-50 flex justify-between items-center group">
                               <span className="font-medium text-slate-700">View Blocked Creators</span>
                               <span className="text-slate-400 text-sm">0 blocked</span>
                          </button>
                          <button className="w-full text-left p-4 rounded-xl border border-slate-200 hover:bg-red-50 hover:border-red-100 flex justify-between items-center group">
                               <span className="font-medium text-red-600">Request Account Deletion</span>
                               <Trash2 size={16} className="text-red-300 group-hover:text-red-600" />
                          </button>
                      </div>
                 </div>

                 {/* Save Button */}
                  <div className="pt-2 pb-12">
                      <button 
                         onClick={() => saveSettings()}
                         className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-3"
                      >
                          <Save size={20} /> Save Changes
                      </button>
                  </div>
             </div>
        )}

        {/* MODALS */}
        {sendModalOpen && selectedCreator && (
            <SendGiftModal 
                creator={selectedCreator} 
                user={user}
                onClose={() => setSendModalOpen(false)} 
                onSuccess={() => {
                     // Optionally refresh or show confetti
                }}
            />
        )}
        
        {pickupModalOpen && selectedRequest && (
            <PickupAddressModal
                request={selectedRequest}
                onClose={() => setPickupModalOpen(false)}
                onSuccess={() => {
                     // MyGifts will update automatically via listener
                }}
                defaultAddress={fanSettings.defaultPickupAddress} // Pass default address if available
            />
        )}

        {detailModalOpen && selectedCreator && (
            <CreatorDetailModal 
                creator={selectedCreator}
                onClose={() => setDetailModalOpen(false)}
                onSendGift={() => {
                    setDetailModalOpen(false);
                    setSendModalOpen(true);
                }}
                isFavorite={favorites.includes(selectedCreator.id)}
                onToggleFavorite={(e) => toggleFavorite(selectedCreator.id, e)}
            />
        )}

        {giftDetailOpen && selectedRequest && (
            <GiftDetailModal 
                gift={selectedRequest}
                onClose={() => setGiftDetailOpen(false)}
            />
        )}

    </DashboardLayout>
  )
}

const CreatorDetailModal = ({ creator, onClose, onSendGift, isFavorite, onToggleFavorite }) => {
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 relative">
                <button onClick={onClose} className="absolute right-4 top-4 bg-black/20 hover:bg-black/40 text-white rounded-full p-2 z-10 transition-colors">
                    <X size={20} />
                </button>
                
                {/* Cover Image Stub */}
                <div className="h-48 bg-gradient-to-r from-blue-500 to-indigo-600 w-full relative">
                    <div className="absolute -bottom-16 left-8">
                        <div className="w-32 h-32 bg-white rounded-full p-1.5 shadow-lg">
                            <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-6xl">
                                {creator.avatar}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-20 px-8 pb-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
                                {creator.name}
                                {creator.verified && <CheckCircle size={24} className="text-blue-500" fill="currentColor" color="white" />}
                            </h2>
                            <p className="text-slate-500 font-medium text-lg">{creator.handle}</p>
                            <div className="flex gap-2 mt-3">
                                {creator.profile?.categories?.map(cat => (
                                    <span key={cat} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wide">
                                        {cat}
                                    </span>
                                ))}
                                {!creator.profile?.categories?.length && (
                                     <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wide">
                                        {creator.category}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3">
                             <button
                                onClick={onToggleFavorite}
                                className={`p-3 rounded-xl border border-slate-200 hover:border-pink-200 transition-colors ${isFavorite ? 'bg-pink-50 text-pink-500' : 'bg-white text-slate-400 hover:text-pink-400'}`}
                             >
                                 <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
                             </button>
                            <button 
                                onClick={onSendGift}
                                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2 hover:-translate-y-1"
                            >
                                <Gift size={20} /> Send Gift
                            </button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-3">About</h3>
                            <p className="text-slate-600 leading-relaxed text-lg">
                                {creator.profile?.bio || "Hey! I'm a content creator who loves unboxing gifts from my fans. Send me something cool via Giftify!"}
                            </p>
                        </div>

                        {creator.profile?.socials && (
                           <div>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-3">Socials</h3>
                                <div className="flex gap-4">
                                    {creator.profile.socials.twitter && (
                                        <a href={`https://twitter.com/${creator.profile.socials.twitter}`} target="_blank" className="flex items-center gap-2 text-slate-500 hover:text-blue-400 transition-colors font-medium">
                                            Twitter
                                        </a>
                                    )}
                                    {creator.profile.socials.instagram && (
                                        <a href={`https://instagram.com/${creator.profile.socials.instagram}`} target="_blank" className="flex items-center gap-2 text-slate-500 hover:text-pink-500 transition-colors font-medium">
                                            Instagram
                                        </a>
                                    )}
                                </div>
                           </div>
                        )}
                        
                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
                             <div className="bg-amber-100 p-2 rounded-lg text-amber-600"><Star size={20} /></div>
                             <div>
                                 <h4 className="font-bold text-amber-900">Wishlist Highlights</h4>
                                 <p className="text-amber-800 text-sm mt-1">Check out {creator.name}'s items to see what they really need!</p>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { Eye } from 'lucide-react'

const GiftDetailModal = ({ gift, onClose }) => {
    if (!gift) return null;

    const timelineEvents = [
        { status: 'pending', label: 'Request Sent', date: gift.timeline?.created_at },
        { status: 'accepted_need_address', label: 'Accepted', date: gift.timeline?.accepted_at },
        { status: 'ready_for_pickup', label: 'Pickup Scheduled', date: gift.timeline?.ready_for_pickup_at },
        { status: 'picked_up', label: 'In Transit', date: gift.timeline?.picked_up_at },
        { status: 'delivered', label: 'Delivered', date: gift.timeline?.delivered_at },
    ].filter(e => e.date); // Only show occurred events

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 relative max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-xl text-slate-900">Gift Details</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    {/* Header Info */}
                    <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-4">
                        <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
                             <Gift size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-slate-800">{gift.itemDetails.name}</h4>
                            <div className="text-slate-500 text-sm">To: <span className="font-semibold">@{gift.creatorName}</span></div>
                            <div className="mt-2 inline-block">
                                <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide bg-white border border-blue-200 text-blue-700`}>
                                   Status: {gift.status.replace(/_/g, ' ')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="mb-8">
                        <h4 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wide">Tracking Timeline</h4>
                        <div className="space-y-0 relative border-l-2 border-slate-100 ml-3 pl-6 pb-2">
                             {timelineEvents.map((event, idx) => (
                                 <div key={idx} className="relative mb-6 last:mb-0">
                                     <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-blue-500 ring-4 ring-white"></div>
                                     <div className="font-bold text-slate-800 text-sm">{event.label}</div>
                                     <div className="text-xs text-slate-400">
                                         {new Date(event.date.seconds * 1000).toLocaleString()}
                                     </div>
                                 </div>
                             ))}
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                         <div className="p-3 bg-slate-50 rounded-lg">
                             <div className="text-xs text-slate-400 uppercase font-bold mb-1">Value</div>
                             <div className="font-mono text-slate-700 font-semibold">${gift.itemDetails.approxValue}</div>
                         </div>
                         <div className="p-3 bg-slate-50 rounded-lg">
                             <div className="text-xs text-slate-400 uppercase font-bold mb-1">Category</div>
                             <div className="text-slate-700 font-semibold">{gift.itemDetails.category}</div>
                         </div>
                         <div className="p-3 bg-slate-50 rounded-lg col-span-2">
                             <div className="text-xs text-slate-400 uppercase font-bold mb-1">Packing Preference</div>
                             <div className="text-slate-700 font-semibold flex items-center gap-2">
                                 {gift.itemDetails.packingType || 'Standard'} 
                             </div>
                         </div>
                    </div>

                    {/* Description */}
                    <div>
                        <h4 className="font-bold text-slate-900 mb-2 text-sm uppercase tracking-wide">Description & Notes</h4>
                        <p className="text-slate-600 text-sm bg-slate-50 p-4 rounded-xl mb-3">
                            {gift.itemDetails.description}
                        </p>
                         {gift.itemDetails.note && (
                            <div className="text-slate-500 text-xs italic border-l-2 border-slate-200 pl-3">
                                " {gift.itemDetails.note} "
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FanDashboard
