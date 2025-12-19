import React, { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { Search, Filter, Star, Gift, Package, MapPin, CheckCircle, Clock, Truck, X } from 'lucide-react'
import { useToast } from '../components/ToastContext'
import SendGiftModal from '../components/SendGiftModal'
import PickupAddressModal from '../components/PickupAddressModal'

const FanDashboard = () => {
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

  const { addToast } = useToast();
  const [user, setUser] = useState(null);
  
  useEffect(() => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) setUser(JSON.parse(storedUser));
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
                    verified: true
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
            const { collection, query, where, onSnapshot, orderBy } = await import('firebase/firestore');
            const { db } = await import('../firebase');

            // Note: orderBy might require an index combo with where clause. If it fails, remove orderBy.
            const q = query(
                collection(db, "gift_requests"), 
                where("fanId", "==", user.uid)
            );

            unsubscribe = onSnapshot(q, (snapshot) => {
                const gifts = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })).sort((a,b) => b.timeline?.created_at - a.timeline?.created_at); // Client-side sort to avoid index issues initially
                setMyGifts(gifts);
                setLoadingGifts(false);
            }, (error) => {
                console.error("Values error:", error);
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

  const filteredCreators = activeCat === 'All' 
    ? creators 
    : creators.filter(c => c.category === activeCat);

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
        {/* Welcome Header */}
        <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
                Welcome back, {user ? user.firstName : 'Super Fan'}! 👋
            </h1>
            <p className="text-slate-500">Support your favorite creators safely using Physical Logistics.</p>
        </div>

        {/* --- SECTION: MY GIFTS (Only if there are any) --- */}
        {myGifts.length > 0 && (
            <div className="mb-10 animate-fade-in">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Package className="text-blue-500" /> Your Shipments
                </h2>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {myGifts.map(gift => (
                        <div key={gift.id} className="min-w-[320px] bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-3">
                                <div className="font-bold text-lg text-slate-800">{gift.itemDetails.name}</div>
                                {getStatusBadge(gift.status)}
                            </div>
                            <div className="text-sm text-slate-500 mb-4">
                                To: <span className="font-semibold text-slate-700">@{gift.creatorName}</span>
                            </div>
                            
                            {/* Action Button for Address */}
                            {gift.status === 'accepted_need_address' && (
                                <button 
                                    onClick={() => {
                                        setSelectedRequest(gift);
                                        setPickupModalOpen(true);
                                    }}
                                    className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 flex items-center justify-center gap-2"
                                >
                                    <MapPin size={16} /> Schedule Pickup
                                </button>
                            )}
                            
                            {/* Status Timeline Preview */}
                             <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-400">
                                <span>Created: {gift.timeline?.created_at ? new Date(gift.timeline.created_at.seconds * 1000).toLocaleDateString() : 'Just now'}</span>
                                {gift.logistics?.trackingNumber && <span className="font-mono">{gift.logistics.trackingNumber}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

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
                    className="bg-white p-6 rounded-2xl border border-slate-200 hover:shadow-xl transition-all cursor-pointer group hover:-translate-y-1"
                >
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
                        onClick={() => {
                            setSelectedCreator(creator);
                            setDetailModalOpen(true);
                        }}
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
            />
        )}

    </DashboardLayout>
  )
}

const CreatorDetailModal = ({ creator, onClose, onSendGift }) => {
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
                        <button 
                            onClick={onSendGift}
                            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2 hover:-translate-y-1"
                        >
                            <Gift size={20} /> Send Gift
                        </button>
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

export default FanDashboard

