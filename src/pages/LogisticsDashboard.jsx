import React, { useState, useEffect } from 'react'
import { Link } from 'wouter'
import { Truck, Package, MapPin, CheckCircle, Search, ArrowLeft, Settings, AlertTriangle, Shield, Archive, ClipboardList, PauseCircle, PlayCircle, Save } from 'lucide-react'
import { useToast } from '../components/ToastContext'
import '../index.css'

import DashboardLayout from '../components/DashboardLayout'

const LogisticsDashboard = ({ params }) => {
    const subpage = params?.subpage;
    // Map subpages to logical filters or views
    const activeTab = subpage === 'transit' ? 'transit' : (subpage === 'delivered' ? 'delivered' : (subpage === 'settings' ? 'settings' : 'pickups'));

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();

    // Default Settings
    const [settings, setSettings] = useState({
        pickupsEnabled: true,
        pickupWindow: 'next_day', // same_day, next_day, 48h
        inspectionRequired: true,
        prohibitedItems: ["Liquids", "Batteries", "Sharp Objects", "Perishables"],
        autoRejectRules: {
            descriptionMismatch: false,
            damaged: true,
            unsafe: true
        },
        packingType: 'standard', // standard, fragile, extra
        brandedPackaging: true,
        deliveriesEnabled: true,
        deliveryRetries: 2,
        logActivity: true,
        operationsPaused: false
    });

    // Custom setting inputs
    const [newProhibitedItem, setNewProhibitedItem] = useState("");

    // Fetch orders that need action
    useEffect(() => {
        if (activeTab === 'settings') {
             // Fetch Settings
            const fetchSettings = async () => {
                try {
                    const { doc, getDoc } = await import('firebase/firestore');
                    const { db } = await import('../firebase');
                    const docSnap = await getDoc(doc(db, "system_settings", "logistics_config"));
                    if (docSnap.exists()) {
                        setSettings({ ...settings, ...docSnap.data() });
                    }
                } catch(e) { console.error("Settings fetch error", e); }
            };
            fetchSettings();
            return;
        }

        let unsubscribe;
        const fetchOrders = async () => {
            try {
                const { collection, query, onSnapshot } = await import('firebase/firestore');
                const { db } = await import('../firebase');

                const q = query(collection(db, "gift_requests"));

                unsubscribe = onSnapshot(q, (snapshot) => {
                    const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    const relevant = all.filter(o => 
                        ['ready_for_pickup', 'picked_up', 'in_inspection', 'in_transit', 'delivered'].includes(o.status)
                    ).sort((a,b) => b.timeline?.created_at - a.timeline?.created_at);
                    
                    setOrders(relevant);
                    setLoading(false);
                });
            } catch (error) {
                console.error("Logistics fetch error:", error);
                setLoading(false);
            }
        };

        fetchOrders();
        return () => unsubscribe && unsubscribe();
    }, [activeTab]);

    const saveSettings = async () => {
        try {
            const { doc, setDoc } = await import('firebase/firestore');
            const { db } = await import('../firebase');
            await setDoc(doc(db, "system_settings", "logistics_config"), settings);
            addToast("Logistics configuration saved successfully", "success");
        } catch(e) {
            console.error("Save error", e);
            addToast("Failed to save settings", "error");
        }
    };

    const updateStatus = async (orderId, newStatus) => {
        try {
            const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
            const { db } = await import('../firebase');

            await updateDoc(doc(db, "gift_requests", orderId), {
                status: newStatus,
                [`timeline.${newStatus}_at`]: serverTimestamp()
            });

            addToast(`Order updated to: ${newStatus.replace(/_/g, ' ')}`, "success");
        } catch (error) {
            console.error("Update error:", error);
            addToast("Failed to update order", "error");
        }
    };

    // Filter orders based on active tab
    const filteredOrders = orders.filter(o => {
        if (activeTab === 'pickups') return o.status === 'ready_for_pickup';
        if (activeTab === 'transit') return ['picked_up', 'in_inspection', 'in_transit'].includes(o.status);
        if (activeTab === 'delivered') return o.status === 'delivered';
        return false;
    });

    const addProhibitedItem = () => {
        if (newProhibitedItem.trim() && !settings.prohibitedItems.includes(newProhibitedItem.trim())) {
            setSettings(prev => ({
                ...prev,
                prohibitedItems: [...prev.prohibitedItems, newProhibitedItem.trim()]
            }));
            setNewProhibitedItem("");
        }
    }

    const removeProhibitedItem = (item) => {
        setSettings(prev => ({
            ...prev,
            prohibitedItems: prev.prohibitedItems.filter(i => i !== item)
        }));
    }

    return (
        <DashboardLayout role="logistics">
             {/* Dynamic Header */}
             <div className="mb-8 flex justify-between items-center">
                 <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 capitalize">
                        {activeTab === 'pickups' ? 'Pickup Queue' : (activeTab === 'transit' ? 'In Transit' : (activeTab === 'settings' ? 'Logistics Control Center' : 'Delivery History'))}
                    </h1>
                    <p className="text-slate-500">Manage logistics operations and configurations.</p>
                 </div>
                 {activeTab === 'settings' && (
                     settings.operationsPaused ? (
                        <div className="px-4 py-2 bg-red-100 text-red-600 rounded-full font-bold flex items-center gap-2 animate-pulse">
                            <PauseCircle size={20} /> OPERATIONS PAUSED
                        </div>
                     ) : (
                        <div className="px-4 py-2 bg-green-100 text-green-600 rounded-full font-bold flex items-center gap-2">
                            <PlayCircle size={20} /> System Active
                        </div>
                     )
                 )}
             </div>

             {/* SETTINGS VIEW */}
             {activeTab === 'settings' ? (
                 <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                     
                     {/* 1. Pickup Controls */}
                     <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                             <Truck className="text-blue-500" /> Pickup Control Settings
                        </h2>
                        
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl">
                                    <div>
                                        <label className="font-bold text-slate-800 block">Enable Pickups</label>
                                        <span className="text-xs text-slate-500">Allow new pickups to be scheduled.</span>
                                    </div>
                                    <Toggle 
                                        active={settings.pickupsEnabled} 
                                        onToggle={() => setSettings({...settings, pickupsEnabled: !settings.pickupsEnabled})} 
                                    />
                                </div>
                                
                                <div>
                                    <label className="font-bold text-slate-700 block mb-2">Scheduling Window</label>
                                    <select 
                                        value={settings.pickupWindow}
                                        onChange={(e) => setSettings({...settings, pickupWindow: e.target.value})}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                    >
                                        <option value="same_day">⚡ Same Day (Urgent)</option>
                                        <option value="next_day">📅 Next Day (Standard)</option>
                                        <option value="48h">⏳ Within 48 Hours</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                     </section>

                     {/* 2. Inspection & Safety */}
                     <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                             <Shield className="text-amber-500" /> Inspection & Safety
                        </h2>

                        <div className="grid md:grid-cols-2 gap-8">
                             <div>
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <label className="font-bold text-slate-800 block">Mandatory Inspection</label>
                                        <span className="text-xs text-slate-500">Require inspection step before packing.</span>
                                    </div>
                                    <Toggle 
                                        active={settings.inspectionRequired} 
                                        onToggle={() => setSettings({...settings, inspectionRequired: !settings.inspectionRequired})} 
                                        color="bg-amber-500"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <div className="font-bold text-slate-700">Auto-Reject Rules</div>
                                    {Object.keys(settings.autoRejectRules).map(key => (
                                        <label key={key} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                                            <input 
                                                type="checkbox" 
                                                checked={settings.autoRejectRules[key]}
                                                onChange={(e) => setSettings({
                                                    ...settings, 
                                                    autoRejectRules: { ...settings.autoRejectRules, [key]: e.target.checked }
                                                })}
                                                className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                                            />
                                            <span className="text-sm font-medium text-slate-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        </label>
                                    ))}
                                </div>
                             </div>

                             <div>
                                <label className="font-bold text-slate-700 block mb-2">🚫 Prohibited Items List</label>
                                <div className="flex gap-2 mb-3">
                                    <input 
                                        type="text" 
                                        value={newProhibitedItem}
                                        onChange={(e) => setNewProhibitedItem(e.target.value)}
                                        placeholder="Add item (e.g. Fireworks)" 
                                        className="flex-1 p-2 border border-slate-200 rounded-lg text-sm"
                                        onKeyDown={(e) => e.key === 'Enter' && addProhibitedItem()}
                                    />
                                    <button onClick={addProhibitedItem} className="px-4 bg-slate-800 text-white rounded-lg text-sm font-bold">Add</button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {settings.prohibitedItems.map(item => (
                                        <span key={item} className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold flex items-center gap-1 border border-red-100">
                                            {item}
                                            <button onClick={() => removeProhibitedItem(item)} className="hover:text-red-800"><XIcon size={12} /></button>
                                        </span>
                                    ))}
                                </div>
                             </div>
                        </div>
                     </section>



                     {/* 4. Delivery Control */}
                     <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                             <Truck className="text-green-500" /> Delivery Settings
                        </h2>
                         <div className="flex flex-col md:flex-row gap-8 items-center">
                            <div className="w-full md:w-1/2 flex justify-between items-center bg-slate-50 p-4 rounded-xl">
                                <div>
                                    <label className="font-bold text-slate-800 block">Enable Deliveries</label>
                                    <span className="text-xs text-slate-500">Allow items to be marked as delivered.</span>
                                </div>
                                <Toggle 
                                    active={settings.deliveriesEnabled} 
                                    onToggle={() => setSettings({...settings, deliveriesEnabled: !settings.deliveriesEnabled})} 
                                    color="bg-green-600"
                                />
                            </div>
                            <div className="w-full md:w-1/2">
                                <label className="font-bold text-slate-700 block mb-2">Delivery Retry Limit</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3].map(num => (
                                        <button 
                                            key={num}
                                            onClick={() => setSettings({...settings, deliveryRetries: num})}
                                            className={`flex-1 py-2 rounded-lg font-bold border ${settings.deliveryRetries === num ? 'bg-green-600 text-white border-green-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            {num} Attempts
                                        </button>
                                    ))}
                                </div>
                            </div>
                         </div>
                     </section>

                      {/* 5. Visibility (Read Only) */}
                     <section className="bg-slate-100 p-8 rounded-2xl border border-slate-200 opacity-80">
                         <h2 className="text-lg font-bold text-slate-500 mb-4 flex items-center gap-2 uppercase tracking-wide">
                             <AlertTriangle size={18} /> Visibility Controls (Locked)
                        </h2>
                        <div className="flex gap-4 text-xs font-mono text-slate-500">
                            <div className="bg-white px-3 py-2 rounded border border-slate-200">Fan Address: LOGISTICS_ONLY</div>
                            <div className="bg-white px-3 py-2 rounded border border-slate-200">Creator Address: LOGISTICS_ONLY</div>
                            <div className="bg-white px-3 py-2 rounded border border-slate-200">Export: DISABLED</div>
                        </div>
                     </section>

                     {/* 6. Emergency & Save */}
                     <div className="sticky bottom-4 z-10 flex gap-4 pt-4 border-t border-slate-200 bg-slate-50/90 backdrop-blur p-4 rounded-2xl shadow-2xl">
                         <button 
                            onClick={() => {
                                if(confirm("EMERGENCY: Are you sure you want to PAUSE ALL OPERATIONS? This stops all pickups and deliveries.")) {
                                    setSettings({...settings, operationsPaused: !settings.operationsPaused});
                                }
                            }}
                            className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${
                                settings.operationsPaused 
                                ? 'bg-green-600 text-white hover:bg-green-700' 
                                : 'bg-red-600 text-white hover:bg-red-700'
                            }`}
                         >
                             {settings.operationsPaused ? <PlayCircle size={24} /> : <PauseCircle size={24} />}
                             {settings.operationsPaused ? 'RESUME OPERATIONS' : 'EMERGENCY PAUSE'}
                         </button>
                         
                         <button 
                            onClick={saveSettings}
                            className="flex-[2] py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 shadow-xl"
                         >
                             <Save size={24} /> Save Configuration
                         </button>
                     </div>

                 </div>
             ) : (
                 // --- ORDERS / QUEUE VIEW ---
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
                     <div className="overflow-x-auto">
                         <table className="w-full text-left">
                             <thead>
                                 <tr className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200">
                                     <th className="p-4 font-bold">Order ID</th>
                                     <th className="p-4 font-bold">Fan Pickup Location</th>
                                     <th className="p-4 font-bold">Destination (Creator)</th>
                                     <th className="p-4 font-bold">Item</th>
                                     <th className="p-4 font-bold">Status</th>
                                     <th className="p-4 font-bold text-right">Actions</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-100">
                                 {filteredOrders.map(order => (
                                     <tr key={order.id} className="hover:bg-slate-50 transition-colors text-slate-800">
                                         <td className="p-4 font-mono text-xs text-slate-500">{order.id.slice(0, 8)}...</td>
                                         <td className="p-4">
                                             {order.pickupDetails ? (
                                                 <div className="text-sm">
                                                     <div className="font-bold text-slate-900 mb-1 flex items-center gap-1">
                                                        <MapPin size={12} className="text-purple-500"/> 
                                                        {order.pickupDetails.address?.city || 'Unknown City'}, {order.pickupDetails.address?.state || ''}
                                                     </div>
                                                     <div className="text-slate-500 text-xs">{order.pickupDetails.address?.street || 'Street Hidden'}</div>
                                                 </div>
                                             ) : (
                                                 status === 'ready_for_pickup' ? 
                                                    <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">Address Missing</span> :
                                                    <span className="text-xs text-slate-400">Not Available</span>
                                             )}
                                         </td>
                                         <td className="p-4 text-sm text-slate-700 font-medium">
                                             {order.creatorName}
                                         </td>
                                         <td className="p-4 text-sm">
                                             <div className="font-medium text-slate-900">{order.itemDetails.name}</div>
                                         </td>
                                         <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase 
                                                ${order.status === 'ready_for_pickup' ? 'bg-purple-100 text-purple-700' :
                                                  order.status === 'picked_up' ? 'bg-blue-100 text-blue-700' :
                                                  order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                {order.status.replace(/_/g, ' ')}
                                            </span>
                                         </td>
                                         <td className="p-4 text-right">
                                             {/* Actions vary based on tab/status */}
                                             {order.status === 'ready_for_pickup' && activeTab === 'pickups' && (
                                                 <button 
                                                    onClick={() => updateStatus(order.id, 'picked_up')}
                                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 ml-auto transition-colors"
                                                 >
                                                     <Truck size={14} /> Mark Picked Up
                                                 </button>
                                             )}
                                             {order.status === 'picked_up' && activeTab === 'transit' && (
                                                 <button 
                                                    onClick={() => updateStatus(order.id, 'delivered')}
                                                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 ml-auto transition-colors"
                                                 >
                                                     <CheckCircle size={14} /> Mark Delivered
                                                 </button>
                                             )}
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                         {filteredOrders.length === 0 && (
                             <div className="p-12 text-center text-slate-400">
                                 <Package size={48} className="mx-auto mb-4 opacity-20" />
                                 <p>No orders found in {activeTab}.</p>
                             </div>
                         )}
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

const XIcon = ({size}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
)

export default LogisticsDashboard
