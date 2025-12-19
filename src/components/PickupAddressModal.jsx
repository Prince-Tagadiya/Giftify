import React, { useState, useEffect } from 'react';
import { X, MapPin, Truck, Home, Edit } from 'lucide-react';
import { useToast } from './ToastContext';

const PickupAddressModal = ({ request, onClose, onSuccess, defaultAddress }) => {
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();
    const [useDefault, setUseDefault] = useState(!!defaultAddress);

    // Initial form state
    const [formData, setFormData] = useState({
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'India',
        phone: '',
        instructions: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const finalAddress = useDefault ? 
            { street: defaultAddress, city: 'Default', state: 'Saved', zip: '00000', country: 'India' } // Simplified for now since default is a string
            : {
                street: formData.street,
                city: formData.city,
                state: formData.state,
                zip: formData.zip,
                country: formData.country,
            };

        try {
            const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
            const { db } = await import('../firebase');

            const requestRef = doc(db, "gift_requests", request.id);
            
            await updateDoc(requestRef, {
                status: 'ready_for_pickup',
                pickupDetails: {
                    address: finalAddress,
                    contactPhone: formData.phone,
                    instructions: formData.instructions,
                    isDefaultAddress: useDefault
                },
                'timeline.ready_for_pickup_at': serverTimestamp()
            });

            addToast("Pickup Scheduled Successfully!", "success");
            if (onSuccess) onSuccess();
            onClose();

        } catch (error) {
            console.error("Error adding address:", error);
            addToast("Failed to save address.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-3">
                         <div className="bg-green-100 p-2.5 rounded-xl text-green-600">
                             <Truck size={24} />
                         </div>
                         <div>
                             <h3 className="font-bold text-xl text-slate-800">Schedule Pickup</h3>
                             <p className="text-sm text-slate-500">For: <span className="font-semibold">{request.itemDetails.name}</span></p>
                         </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-slate-400">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    {/* Security Note */}
                    <div className="mb-8 flex gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 text-sm leading-relaxed">
                        <div className="shrink-0 mt-0.5"><MapPin size={18} /></div>
                        <div>
                            Your address is <strong>securely encrypted</strong> and never shared with the creator. Only our logistics partner receives this for pickup.
                        </div>
                    </div>

                    {/* Address Selection Toggle */}
                    {defaultAddress && (
                        <div className="mb-6 flex p-1 bg-slate-100 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setUseDefault(true)}
                                className={`flex-1 py-2.5 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${useDefault ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Home size={16} /> Saved Address
                            </button>
                            <button
                                type="button"
                                onClick={() => setUseDefault(false)}
                                className={`flex-1 py-2.5 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${!useDefault ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Edit size={16} /> New Address
                            </button>
                        </div>
                    )}

                    <div className="space-y-5">
                        {useDefault ? (
                            <div className="p-5 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 flex items-start gap-4">
                                <div className="text-slate-400 mt-1"><MapPin size={24} /></div>
                                <div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Pickup From</div>
                                    <div className="text-lg font-bold text-slate-800">{defaultAddress}</div>
                                    <div className="text-sm text-green-600 font-medium mt-2 flex items-center gap-1">
                                        <Truck size={14} /> Ready for next-day pickup
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Street Address</label>
                                    <input type="text" name="street" required={!useDefault} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all placeholder:text-slate-300 font-medium" value={formData.street} onChange={handleChange} placeholder="House/Flat No, Building, Street" />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">City</label>
                                        <input type="text" name="city" required={!useDefault} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all font-medium" value={formData.city} onChange={handleChange} placeholder="Mumbai" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">State</label>
                                        <input type="text" name="state" required={!useDefault} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all font-medium" value={formData.state} onChange={handleChange} placeholder="Maharashtra" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">ZIP Code</label>
                                        <input type="text" name="zip" required={!useDefault} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all font-medium" value={formData.zip} onChange={handleChange} placeholder="400001" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Country</label>
                                        <input type="text" name="country" required={!useDefault} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all font-medium" value={formData.country} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="border-t border-slate-100 my-4"></div>

                        {/* Common Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
                                <input type="tel" name="phone" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all font-medium" value={formData.phone} onChange={handleChange} placeholder="+91 98765 43210" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Instructions</label>
                                <input type="text" name="instructions" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all font-medium" value={formData.instructions} onChange={handleChange} placeholder="Gate code, landmark..." />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-4 rounded-2xl font-bold text-lg text-white bg-green-600 hover:bg-green-700 shadow-xl shadow-green-100 transition-all flex items-center justify-center gap-3 hover:-translate-y-1 active:translate-y-0"
                        >
                            {loading ? <span className="spinner"></span> : <><Truck size={22} /> Confirm & Schedule</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PickupAddressModal;
