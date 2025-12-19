import React, { useEffect, useState } from 'react'
import { Link } from 'wouter'
import { Link as LinkIcon, Shield, ArrowLeft, RefreshCw, Trash2, User, Settings, AlertTriangle, Lock, Save, Activity, CheckCircle, X, Search, Ban } from 'lucide-react'
import { useToast } from '../components/ToastContext'
import DashboardLayout from '../components/DashboardLayout'

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('users'); // 'users' or 'settings'
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Global Settings State
    const [globalSettings, setGlobalSettings] = useState({
        forceApproval: false,
        pickupsPaused: false,
        disableAutoApproval: false,
        maxGiftsPerFan: 3
    });

    const [selectedUser, setSelectedUser] = useState(null); // For detail modal
    const { addToast } = useToast();

    // Fetch Users & Settings
    const fetchData = async () => {
        setLoading(true);
        try {
            const { collection, getDocs, doc, getDoc } = await import('firebase/firestore');
            const { db } = await import('../firebase');
            
            // Fetch Users
            const usersSnapshot = await getDocs(collection(db, "users"));
            const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(usersList);

            // Fetch Global Settings
            const settingsDoc = await getDoc(doc(db, "admin_settings", "global_config"));
            if (settingsDoc.exists()) {
                setGlobalSettings(settingsDoc.data());
            } else {
                // Initialize if not exists
                setGlobalSettings({
                    forceApproval: false,
                    pickupsPaused: false,
                    disableAutoApproval: false,
                    maxGiftsPerFan: 3
                });
            }

            setLoading(false);
        } catch (err) {
            console.error("Fetch error:", err);
            addToast("Failed to load dashboard data", 'error');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const saveGlobalSettings = async () => {
        try {
            const { doc, setDoc } = await import('firebase/firestore');
            const { db } = await import('../firebase');
            
            await setDoc(doc(db, "admin_settings", "global_config"), globalSettings);
            addToast("Global safety settings saved", "success");
        } catch (error) {
            console.error("Save settings error", error);
            addToast("Failed to save settings", "error");
        }
    };

    const handleUserOverride = async (userId, updates) => {
        try {
            const { doc, updateDoc } = await import('firebase/firestore');
            const { db } = await import('../firebase');
            
            await updateDoc(doc(db, "users", userId), updates);
            
            // Update local state
            setUsers(users.map(u => u.id === userId ? { ...u, ...updates } : u));
            if (selectedUser && selectedUser.id === userId) {
                setSelectedUser({ ...selectedUser, ...updates });
            }

            addToast("User settings updated", "success");
        } catch (error) {
            console.error("Update user error", error);
            addToast("Failed to update user", "error");
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm("CRITICAL: Are you sure you want to DELETE this user? Data retrieval will be impossible.")) return;

        try {
            const { doc, deleteDoc } = await import('firebase/firestore');
            const { db } = await import('../firebase');
            
            await deleteDoc(doc(db, "users", userId));
            
            setUsers(users.filter(u => u.id !== userId));
            if (selectedUser?.id === userId) setSelectedUser(null);
            
            addToast('User deleted permanently', 'success');
        } catch (error) {
            addToast('Error deleting user', 'error');
        }
    };

    const fans = users.filter(u => u.role === 'fan');
    const creators = users.filter(u => u.role === 'creator');

    return (
        <DashboardLayout role="admin">
           {/* Header & Tabs */}
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                     <h1 className="text-3xl font-extrabold text-slate-900">Admin Control Center</h1>
                     <p className="text-slate-500">Manage users, safety overrides, and global system limits.</p>
                </div>
                
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                    <button 
                        onClick={() => setActiveTab('users')}
                        className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        <User size={18} /> Manage Users
                    </button>
                    <button 
                         onClick={() => setActiveTab('settings')}
                         className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'settings' ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:text-red-600'}`}
                    >
                        <Shield size={18} /> Safety Overrides
                    </button>
                </div>
           </div>

           {/* --- USERS TAB --- */}
           {activeTab === 'users' && (
               <div className="space-y-8 animate-in fade-in duration-300">
                    <UserTable 
                        title="Creators" 
                        users={creators} 
                        icon="🦁" 
                        color="text-emerald-600"
                        bgColor="bg-emerald-50"
                        onSelect={setSelectedUser}
                    />
                    <UserTable 
                        title="Fans" 
                        users={fans} 
                        icon="🦄" 
                        color="text-blue-600" 
                        bgColor="bg-blue-50"
                        onSelect={setSelectedUser}
                    />
               </div>
           )}

           {/* --- SETTINGS TAB --- */}
           {activeTab === 'settings' && (
               <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-right-4 duration-300">
                   {/* Global Safety (Red/Critical) */}
                   <div className="bg-white p-8 rounded-2xl border-2 border-red-100 shadow-lg shadow-red-50 relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
                       <h2 className="text-xl font-bold text-red-700 mb-6 flex items-center gap-2">
                            <AlertTriangle className="text-red-600" /> Global Safety Overrides
                       </h2>
                       
                       <div className="space-y-6">
                           <div className="flex justify-between items-start pb-6 border-b border-red-50">
                               <div>
                                   <div className="font-bold text-slate-800 text-lg">Force Global Approval</div>
                                   <p className="text-slate-500 text-sm mt-1">Require ALL creators to manually approve specific items, ignoring their auto-accept settings.<br/><span className="text-red-500 font-bold text-xs uppercase">Use during abuse spikes</span></p>
                               </div>
                               <Toggle 
                                    active={globalSettings.forceApproval} 
                                    onToggle={() => setGlobalSettings({...globalSettings, forceApproval: !globalSettings.forceApproval})} 
                                    color="bg-red-600"
                               />
                           </div>

                           <div className="flex justify-between items-start pb-6 border-b border-red-50">
                               <div>
                                   <div className="font-bold text-slate-800 text-lg">Pause All Pickups</div>
                                   <p className="text-slate-500 text-sm mt-1">Suspend all logistics operations immediately. No new pickups will be scheduled.<br/><span className="text-red-500 font-bold text-xs uppercase">Emergency Kill Switch</span></p>
                               </div>
                               <Toggle 
                                    active={globalSettings.pickupsPaused} 
                                    onToggle={() => setGlobalSettings({...globalSettings, pickupsPaused: !globalSettings.pickupsPaused})} 
                                    color="bg-red-600"
                               />
                           </div>
                           
                           <div className="flex justify-between items-start">
                               <div>
                                   <div className="font-bold text-slate-800 text-lg">Disable Auto-Approval</div>
                                   <p className="text-slate-500 text-sm mt-1">Globally disable "Auto-Accept" for all creator accounts.</p>
                               </div>
                               <Toggle 
                                    active={globalSettings.disableAutoApproval} 
                                    onToggle={() => setGlobalSettings({...globalSettings, disableAutoApproval: !globalSettings.disableAutoApproval})} 
                                    color="bg-red-600"
                               />
                           </div>
                       </div>
                   </div>

                   {/* System Limits */}
                   <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Activity className="text-blue-500" /> System Limits
                        </h2>
                        
                        <div className="max-w-xs">
                             <label className="block text-sm font-bold text-slate-700 mb-2">Max Gifts Per Fan (Daily)</label>
                             <div className="flex items-center gap-4">
                                 <input 
                                    type="number" 
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-lg font-bold"
                                    value={globalSettings.maxGiftsPerFan}
                                    onChange={e => setGlobalSettings({...globalSettings, maxGiftsPerFan: parseInt(e.target.value) || 0})}
                                 />
                                 <span className="text-slate-400 font-medium">gifts/day</span>
                             </div>
                             <p className="text-xs text-slate-400 mt-2">Prevents spam and logistics overload.</p>
                        </div>
                   </div>

                   <div className="pb-12 pt-4">
                       <button 
                            onClick={saveGlobalSettings}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-xl"
                       >
                           <Save size={20} /> Save Global Config
                       </button>
                   </div>
               </div>
           )}

           {/* --- USER DETAIL MODAL (Overrides) --- */}
           {selectedUser && (
               <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                   <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                                {selectedUser.role === 'creator' ? '🦁' : '🦄'} Manage User: {selectedUser.firstName} {selectedUser.lastName}
                            </h3>
                            <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        
                        <div className="p-8 space-y-8">
                            {/* Verification & Status */}
                            <div className="grid grid-cols-2 gap-4">
                                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                     <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Account Status</div>
                                     <div className="flex items-center gap-2">
                                         {selectedUser.blocked ? (
                                             <span className="text-red-600 font-bold flex items-center gap-1"><Ban size={16}/> Blocked</span>
                                         ) : (
                                             <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle size={16}/> Active</span>
                                         )}
                                     </div>
                                 </div>
                                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                     <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Verification</div>
                                     <button 
                                        onClick={() => handleUserOverride(selectedUser.id, { verified: !selectedUser.verified })}
                                        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${selectedUser.verified ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
                                     >
                                         {selectedUser.verified ? 'Verified ✅' : 'Unverified ❌'}
                                     </button>
                                 </div>
                            </div>
                            
                            {/* Safety Overrides */}
                            <div>
                                <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Lock size={18} className="text-slate-400" /> Admin Overrides
                                </h4>
                                <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                    {selectedUser.role === 'creator' && (
                                        <>
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <div className="font-bold text-slate-800">Strict Approval Mode</div>
                                                    <div className="text-xs text-slate-500">Force creator to approve all gifts manually.</div>
                                                </div>
                                                <Toggle 
                                                    active={selectedUser.overrides?.forceApproval} 
                                                    onToggle={() => handleUserOverride(selectedUser.id, { overrides: { ...selectedUser.overrides, forceApproval: !selectedUser.overrides?.forceApproval } })}
                                                />
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <div className="font-bold text-slate-800">Disable Incoming Gifts</div>
                                                    <div className="text-xs text-slate-500">Prevent fans from sending gifts to this creator.</div>
                                                </div>
                                                <Toggle 
                                                    active={selectedUser.overrides?.disableGifting} 
                                                    onToggle={() => handleUserOverride(selectedUser.id, { overrides: { ...selectedUser.overrides, disableGifting: !selectedUser.overrides?.disableGifting } })}
                                                    color="bg-red-500"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* Generic Controls */}
                                    <div className="flex justify-between items-center pt-4 border-t border-slate-200 mt-4">
                                        <div>
                                            <div className="font-bold text-red-600">Block User</div>
                                            <div className="text-xs text-slate-500">Prevent login and all actions.</div>
                                        </div>
                                        <Toggle 
                                            active={selectedUser.blocked} 
                                            onToggle={() => handleUserOverride(selectedUser.id, { blocked: !selectedUser.blocked })}
                                            color="bg-red-600"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Dangerous Actions */}
                            <div className="pt-6 border-t border-slate-100">
                                <button 
                                    onClick={() => handleDeleteUser(selectedUser.id)}
                                    className="w-full py-3 border-2 border-red-100 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={18} /> Permanently Delete Account
                                </button>
                            </div>

                        </div>
                   </div>
               </div>
           )}

        </DashboardLayout>
    )
}

const Toggle = ({ active, onToggle, color = 'bg-blue-600' }) => (
    <button 
        onClick={onToggle}
        className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${active ? color : 'bg-slate-200'}`}
    >
        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200 ${active ? 'translate-x-6' : 'translate-x-0'}`}></div>
    </button>
)

const UserTable = ({ title, users, icon, color, bgColor, onSelect }) => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span>{icon}</span> {title}
                <span className="text-sm bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{users.length}</span>
            </h2>
        </div>

        {users.length === 0 ? (
            <p className="text-center py-12 text-slate-400">No {title.toLowerCase()} found.</p>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-100">
                            <th className="p-4 font-bold">Name</th>
                            <th className="p-4 font-bold">Email</th>
                            <th className="p-4 font-bold">Status</th>
                            <th className="p-4 font-bold text-right">Settings</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => onSelect(user)}>
                                <td className="p-4 font-bold text-slate-700">{user.firstName} {user.lastName}</td>
                                <td className="p-4 text-slate-500 text-sm">{user.email}</td>
                                <td className="p-4">
                                    <div className="flex gap-2">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase ${bgColor} ${color}`}>
                                            {user.role}
                                        </span>
                                        {user.blocked && <span className="px-2 py-1 rounded-lg text-xs font-bold uppercase bg-red-100 text-red-600">BLOCKED</span>}
                                        {user.verified && <span className="px-2 py-1 rounded-lg text-xs font-bold uppercase bg-blue-100 text-blue-600">VERIFIED</span>}
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <button className="text-slate-400 hover:text-blue-600 p-2 rounded-lg hover:bg-slate-100 transition-colors">
                                        <Settings size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
)

export default AdminDashboard
