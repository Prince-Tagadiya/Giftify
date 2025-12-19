import React, { useState } from 'react';
import { X, Gift, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useToast } from './ToastContext';

const SendGiftModal = ({ creator, onClose, user, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

    // Form State
    const [formData, setFormData] = useState({
        itemName: '',
        itemDescription: '',
        approxValue: '',
        category: 'Tech', // Default
        note: '',
        sensitiveContent: false,
        safetyAgreement: false
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.safetyAgreement) {
            addToast("You must certify the safety of this item.", "error");
            return;
        }

        setLoading(true);

        try {
            // Dynamically import Firestore to keep bundle size optimized
            const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
            const { db } = await import('../firebase');

            const giftRequest = {
                fanId: user.uid,
                fanName: `${user.firstName} ${user.lastName}`,
                creatorId: creator.id,
                creatorName: creator.name, // Or creator.firstName
                status: 'pending', // Initial status
                itemDetails: {
                    name: formData.itemName,
                    description: formData.itemDescription,
                    approxValue: parseFloat(formData.approxValue) || 0,
                    category: formData.category,
                    note: formData.note, // Note for creator
                    sensitiveContent: formData.sensitiveContent
                },
                logistics: {
                    weight: 0, // To be filled later
                    trackingNumber: null
                },
                timeline: {
                    created_at: serverTimestamp(),
                }
            };

            await addDoc(collection(db, "gift_requests"), giftRequest);
            
            addToast("Gift Request Sent! Wait for approval.", "success");
            if (onSuccess) onSuccess();
            onClose();

        } catch (error) {
            console.error("Error sending gift:", error);
            addToast("Failed to send request. Try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Gift size={20} className="text-blue-500" />
                        Send Gift to {creator?.name || 'Creator'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh]">
                    {step === 1 && (
                        <div className="space-y-4">
                            {/* Privacy Notice */}
                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 text-sm text-blue-800">
                                <ShieldCheck size={20} className="shrink-0" />
                                <div>
                                    <span className="font-bold block mb-1">Privacy Guaranteed</span>
                                    You do NOT need the creator's address. We handle the logistics. You will enter <strong>your</strong> pickup address after the creator accepts this request.
                                </div>
                            </div>

                            {/* Item Details */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                                    <input 
                                        type="text" 
                                        name="itemName" 
                                        required
                                        className="minimal-input"
                                        placeholder="e.g. Sony Camera"
                                        value={formData.itemName}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Est. Value ($)</label>
                                    <input 
                                        type="number" 
                                        name="approxValue" 
                                        required
                                        className="minimal-input"
                                        placeholder="0.00"
                                        value={formData.approxValue}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">What is it?</label>
                                <textarea 
                                    name="itemDescription" 
                                    required
                                    rows="2"
                                    className="minimal-input resize-none"
                                    placeholder="Describe the item consistently (color, size, etc.)"
                                    value={formData.itemDescription}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Personal Note (for {creator?.firstName || 'Creator'})</label>
                                <textarea 
                                    name="note" 
                                    required
                                    rows="3"
                                    className="minimal-input resize-none"
                                    placeholder="Write a message..."
                                    value={formData.note}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <label className="flex items-start gap-3 cursor-pointer p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-200">
                                    <input 
                                        type="checkbox" 
                                        name="safetyAgreement"
                                        checked={formData.safetyAgreement}
                                        onChange={handleChange}
                                        className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <div className="text-sm text-gray-600">
                                        <span className="font-bold text-gray-900">Safety Declaration:</span> I certify that this package contains no hazardous materials, illegal items, weapons, or perishable goods. I understand strictly prohibited items will be rejected.
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    <div className="mt-8">
                        <button 
                            type="submit" 
                            disabled={loading || !formData.safetyAgreement}
                            className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all transform flex items-center justify-center gap-2
                                ${loading || !formData.safetyAgreement ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:scale-[1.02]'}
                            `}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span> Sending...
                                </>
                            ) : (
                                <>Send Request <Gift size={18} /></>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SendGiftModal;
