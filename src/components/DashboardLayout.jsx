import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'wouter'
import { motion } from 'framer-motion'
import { Home, Gift, Settings, LogOut, User, Heart, Package, Truck, CheckCircle, Bell, X } from 'lucide-react'

const DashboardLayout = ({ children, role = 'fan' }) => {
  const [location] = useLocation()
  const [user, setUser] = useState(null)
  
  // Notification State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        try {
            const u = JSON.parse(storedUser);
            setUser(u);
        } catch (e) {
            console.error("Error parsing stored user", e);
        }
    }
  }, []);

  // Fetch Notifications
  useEffect(() => {
      if (!user) return;
      
      let unsubscribe;
      const fetchNotifs = async () => {
          try {
             const { collection, query, where, onSnapshot, limit } = await import('firebase/firestore');
             const { db } = await import('../firebase');
             
             // Simple fallback query if indexes aren't perfect yet
             // Using userId to filter
             const q = query(
                 collection(db, "notifications"), 
                 where("userId", "==", user.uid),
                 limit(10)
             );

             unsubscribe = onSnapshot(q, (snapshot) => {
                 const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                 
                 // Client-side sort
                 notifs.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

                 setNotifications(notifs);
                 setUnreadCount(notifs.filter(n => !n.read).length);
             });
          } catch(e) {
              console.log("Notification fetch error/setup:", e);
              // Set some dummy notifications for demo if fetch fails (or empty)
              setNotifications([
                  { id: '1', title: 'Welcome!', message: 'Thanks for joining Giftify.', read: false, createdAt: { seconds: Date.now()/1000 } }
              ]);
              setUnreadCount(1);
          }
      };

      fetchNotifs();
      return () => unsubscribe && unsubscribe();
  }, [user]);

  const fanLinks = [
    { icon: Home, label: 'Discover', path: '/dashboard/fan' },
    { icon: Gift, label: 'My Gifts', path: '/dashboard/fan/history' },
    { icon: Heart, label: 'Following', path: '/dashboard/fan/following' },
    { icon: Settings, label: 'Settings', path: '/dashboard/fan/settings' },
  ]

  const creatorLinks = [
    { icon: Home, label: 'Overview', path: '/dashboard/creator' },
    { icon: Package, label: 'Inventory', path: '/dashboard/creator/inventory' },
    { icon: User, label: 'Profile', path: '/dashboard/creator/profile' },
    { icon: Settings, label: 'Settings', path: '/dashboard/creator/settings' },
  ]

  const logisticsLinks = [
    { icon: Truck, label: 'Pickups', path: '/dashboard/logistics' },
    { icon: Package, label: 'In Transit', path: '/dashboard/logistics/transit' },
    { icon: CheckCircle, label: 'Delivered', path: '/dashboard/logistics/delivered' },
    { icon: Settings, label: 'Settings', path: '/dashboard/logistics/settings' },
  ]

  const adminLinks = [
    { icon: User, label: 'Manage Users', path: '/dashboard/admin' },
  ]

  const links = role === 'creator' ? creatorLinks : (role === 'logistics' ? logisticsLinks : (role === 'admin' ? adminLinks : fanLinks))

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-72 bg-white border-r border-slate-200 p-8 flex flex-col justify-between fixed h-full z-10 hidden md:flex"
      >
        <div>
            <div className="text-2xl font-bold text-slate-900 mb-10 flex items-center gap-1">
                Giftify<span className="text-blue-500">.</span>
            </div>

            <nav className="flex flex-col gap-2">
                {links.map((link) => {
                    const isActive = location === link.path
                    const Icon = link.icon
                    return (
                        <Link 
                            key={link.path} 
                            href={link.path}
                        >
                            <a className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                                isActive 
                                    ? 'bg-blue-50 text-blue-600 font-bold' 
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 font-medium'
                            }`}>
                                <Icon size={20} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                                {link.label}
                            </a>
                        </Link>
                    )
                })}
            </nav>
        </div>

        <div className="pt-6 border-t border-slate-100">
            <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${role === 'creator' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                    {role === 'creator' ? '🦁' : '🦄'}
                </div>
                <div className="overflow-hidden">
                    <div className="font-bold text-sm text-slate-800 truncate">
                        {user ? `${user.firstName} ${user.lastName}` : (role === 'creator' ? 'Alex Creator' : 'Sarah Fan')}
                    </div>
                    <div className="text-xs text-slate-400 truncate max-w-[120px]">
                         {user ? user.email : (role === 'creator' ? 'alex@example.com' : 'sarah@example.com')}
                    </div>
                </div>
            </div>
            
            <Link href="/login">
                <button className="flex items-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors w-full text-sm font-medium">
                    <LogOut size={18} />
                    Sign Out
                </button>
            </Link>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 overflow-y-auto p-8">
         <header className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-slate-800">
                {links.find(l => l.path === location)?.label || 'Dashboard'}
            </h1>
            <div className="flex gap-3 relative">
                <div className="relative z-50">
                    <button 
                         onClick={() => {
                             const helpEmail = "support@giftify.com";
                             const subject = "Help Request";
                             window.location.href = `mailto:${helpEmail}?subject=${subject}`;
                         }}
                         className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-full text-sm font-medium hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-2"
                    >
                        <span>Help</span>
                    </button>
                </div>
                
                {/* Bell/Notification Area */}
                <div className="relative z-50">
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={`w-10 h-10 bg-white border rounded-full flex items-center justify-center transition-all ${showNotifications ? 'bg-blue-50 border-blue-200 text-blue-600' : 'text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                             <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                 <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
                                 <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600"><X size={16}/></button>
                             </div>
                             <div className="max-h-[300px] overflow-y-auto">
                                 {notifications.length === 0 ? (
                                     <div className="p-8 text-center text-slate-400 text-sm">
                                         <Bell size={24} className="mx-auto mb-2 opacity-20" />
                                         No new notifications
                                     </div>
                                 ) : (
                                     notifications.map(notif => (
                                         <div key={notif.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!notif.read ? 'bg-blue-50/30' : ''}`}>
                                             <div className="flex gap-3">
                                                 <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notif.read ? 'bg-blue-500' : 'bg-slate-200'}`}></div>
                                                 <div>
                                                     <p className="text-sm font-semibold text-slate-800 mb-1">{notif.title}</p>
                                                     <p className="text-xs text-slate-500 leading-relaxed">{notif.message}</p>
                                                     <p className="text-[10px] text-slate-400 mt-2">
                                                         {notif.createdAt?.seconds ? new Date(notif.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                                     </p>
                                                 </div>
                                             </div>
                                         </div>
                                     ))
                                 )}
                             </div>
                             {notifications.length > 0 && (
                                <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
                                    <button className="text-xs font-bold text-blue-600 hover:text-blue-700">Mark all as read</button>
                                </div>
                             )}
                        </div>
                    )}
                </div>
            </div>
         </header>
         
         <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="pb-10"
         >
            {children}
         </motion.div>
      </main>
    </div>
  )
}

export default DashboardLayout
