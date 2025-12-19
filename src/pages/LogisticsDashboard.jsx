import React, { useState, useEffect } from 'react'
import { Link } from 'wouter'
import { Truck, Package, MapPin, CheckCircle, Search, ArrowLeft } from 'lucide-react'
import { useToast } from '../components/ToastContext'
import '../index.css'

import DashboardLayout from '../components/DashboardLayout'

const LogisticsDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();

    // Fetch orders that need action
    useEffect(() => {
        let unsubscribe;
        const fetchOrders = async () => {
             // ... existing fetch logic ...
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
    }, []);

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

    return (
        <DashboardLayout role="logistics">
             {/* Queue Stats */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                     <div>
                        <div className="text-slate-500 text-sm font-bold uppercase mb-1">Ready for Pickup</div>
                        <div className="text-3xl font-extrabold text-purple-600">{orders.filter(o => o.status === 'ready_for_pickup').length}</div>
                     </div>
                     <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                        <Truck size={24} />
                     </div>
                 </div>
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                     <div>
                        <div className="text-slate-500 text-sm font-bold uppercase mb-1">In Transit</div>
                        <div className="text-3xl font-extrabold text-blue-600">{orders.filter(o => o.status === 'picked_up').length}</div>
                     </div>
                     <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <Package size={24} />
                     </div>
                 </div>
                 <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                     <div>
                        <div className="text-slate-500 text-sm font-bold uppercase mb-1">Delivered</div>
                        <div className="text-3xl font-extrabold text-green-600">{orders.filter(o => o.status === 'delivered').length}</div>
                     </div>
                     <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                        <CheckCircle size={24} />
                     </div>
                 </div>
             </div>

             {/* Orders Table */}
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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
                             {orders.map(order => (
                                 <tr key={order.id} className="hover:bg-slate-50 transition-colors text-slate-800">
                                     <td className="p-4 font-mono text-xs text-slate-500">{order.id.slice(0, 8)}...</td>
                                     <td className="p-4">
                                         {order.pickupDetails ? (
                                             <div className="text-sm">
                                                 <div className="font-bold text-slate-900 mb-1 flex items-center gap-1">
                                                    <MapPin size={12} className="text-purple-500"/> 
                                                    {order.pickupDetails.address.city}, {order.pickupDetails.address.state}
                                                 </div>
                                                 <div className="text-slate-500 text-xs">{order.pickupDetails.address.street}</div>
                                             </div>
                                         ) : (
                                             <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">Address Missing</span>
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
                                         {order.status === 'ready_for_pickup' && (
                                             <button 
                                                onClick={() => updateStatus(order.id, 'picked_up')}
                                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 ml-auto transition-colors"
                                             >
                                                 <Truck size={14} /> Mark Picked Up
                                             </button>
                                         )}
                                         {order.status === 'picked_up' && (
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
                     {orders.length === 0 && (
                         <div className="p-12 text-center text-slate-400">
                             <Package size={48} className="mx-auto mb-4 opacity-20" />
                             <p>No active logistics orders found.</p>
                         </div>
                     )}
                 </div>
             </div>
        </DashboardLayout>
    )
}

export default LogisticsDashboard
