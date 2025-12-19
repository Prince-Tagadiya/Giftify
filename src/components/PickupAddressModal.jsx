import React, { useState } from 'react';
import { X, MapPin, Truck } from 'lucide-react';
import { useToast } from './ToastContext';

const PickupAddressModal = ({ request, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

    const [formData, setFormData] = useState({
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'USA',
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

        try {
            const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
            const { db } = await import('../firebase');

            const requestRef = doc(db, "gift_requests", request.id);
            
            await updateDoc(requestRef, {
                status: 'ready_for_pickup',
                pickupDetails: {
                    address: {
                        street: formData.street,
                        city: formData.city,
                        state: formData.state,
                        zip: formData.zip,
                        country: formData.country,
                    },
                    contactPhone: formData.phone,
                    instructions: formData.instructions
                },
                'timeline.address_added_at': serverTimestamp()
            });

            addToast("Address Added! Scheduling Pickup...", "success");
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Truck size={20} className="text-green-600" />
                        Schedule Pickup for {request.itemDetails.name}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <p className="text-sm text-gray-600 mb-4 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                        The creator accepted your gift! Please enter the address where our courier can pick it up.
                        <br/><span className="font-bold text-xs mt-1 block text-yellow-800">Note: This address is safely stored with Giftify and NOT shared with the creator.</span>
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                            <input type="text" name="street" required className="minimal-input" value={formData.street} onChange={handleChange} placeholder="123 Main St" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                <input type="text" name="city" required className="minimal-input" value={formData.city} onChange={handleChange} placeholder="New York" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                <input type="text" name="state" required className="minimal-input" value={formData.state} onChange={handleChange} placeholder="NY" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                                <input type="text" name="zip" required className="minimal-input" value={formData.zip} onChange={handleChange} placeholder="10001" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                <input type="text" name="country" required className="minimal-input" value={formData.country} onChange={handleChange} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone (for Driver)</label>
                            <input type="tel" name="phone" required className="minimal-input" value={formData.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Instructions (Optional)</label>
                            <textarea name="instructions" rows="2" className="minimal-input" value={formData.instructions} onChange={handleChange} placeholder="Gate code, leave at reception, etc." />
                        </div>
                    </div>

                    <div className="mt-6">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-3 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <span className="spinner"></span> : <><MapPin size={18} /> Confirm Address</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PickupAddressModal;
