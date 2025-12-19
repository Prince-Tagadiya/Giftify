import React, { useState, useEffect } from 'react';
import { X, Gift, AlertTriangle, ShieldCheck, Check } from 'lucide-react';
import { useToast } from './ToastContext';

const SendGiftModal = ({ creator, onClose, user, onSuccess }) => {
    const [step, setStep] = useState(1); // 1: Form, 2: Confirmation (if enabled)
    const [loading, setLoading] = useState(false);
    const [globalSettings, setGlobalSettings] = useState({ pickupsPaused: false, maxGiftsPerFan: 100 });
    const [safetyLocked, setSafetyLocked] = useState(false);
    const { addToast } = useToast();

    // Form State
    const [formData, setFormData] = useState({
        itemName: '',
        itemDescription: '',
        approxValue: '',
        category: 'Tech', // Default
        note: '',
        sensitiveContent: false,
        packingType: 'Standard',
        safetyAgreement: false
    });

    // Fetch Global Safety Settings
    useEffect(() => {
        const checkSafety = async () => {
             try {
                 const { doc, getDoc } = await import('firebase/firestore');
                 const { db } = await import('../firebase');
                 const snap = await getDoc(doc(db, "admin_settings", "global_config"));
                 if (snap.exists()) {
                     const settings = snap.data();
                     setGlobalSettings(settings);
                     if (settings.pickupsPaused) {
                         setSafetyLocked(true);
                     }
                 }
                 
                 // Check Creator Overrides
                 if (creator.overrides?.disableGifting) {
                     setSafetyLocked(true);
                 }
             } catch(e) { console.error(e) }
        }
        checkSafety();
    }, [creator]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleInitialSubmit = (e) => {
        e.preventDefault();
        
        if (GlobalSafetyLock) return;

        if (!formData.safetyAgreement) {
            addToast("You must certify the safety of this item.", "error");
            return;
        }

        // Check for User Preference: Confirm Before Submit
        if (user.fanSettings?.confirmBeforeSubmit && step === 1) {
            setStep(2); // Go to confirm step
            return;
        }
        
        // Otherwise submit directly
        submitToFirebase();
    }

    const submitToFirebase = async () => {
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

            const requestRef = await addDoc(collection(db, "gift_requests"), giftRequest);

            // Create Notification for the Creator
            await addDoc(collection(db, "notifications"), {
                userId: creator.id,
                title: "New Gift Request! 🎁",
                message: `${user.firstName} wants to send you a ${formData.itemName}`,
                read: false,
                type: 'gift_request',
                relatedId: requestRef.id,
                createdAt: serverTimestamp()
            });
            
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

    const GlobalSafetyLock = safetyLocked || (globalSettings.pickupsPaused);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in relative">
                
                {/* SAFETY LOCK OVERLAY */}
                {GlobalSafetyLock && (
                    <div className="absolute inset-0 bg-white/90 z-50 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
                        <div className="bg-red-100 p-4 rounded-full mb-4">
                            <AlertTriangle size={48} className="text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Gifting Currently Paused</h2>
                        <p className="text-slate-500 mb-6">
                            {creator.overrides?.disableGifting 
                                ? "This creator is not accepting new gifts at the moment."
                                : "Due to high volume or a safety alert, Giftify logistics are temporarily paused. Please try again later."
                            }
                        </p>
                        <button onClick={onClose} className="px-6 py-2 bg-slate-900 text-white font-bold rounded-xl">Close</button>
                    </div>
                )}

                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Gift size={20} className="text-blue-500" />
                        {step === 1 ? `Send Gift to ${creator?.name || 'Creator'}` : 'Confirm Details'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleInitialSubmit} className="p-6 overflow-y-auto max-h-[80vh]">
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
                                        className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                                        className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    placeholder="Describe the item consistently (color, size, etc.)"
                                    value={formData.itemDescription}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Packing Preference</label>
                                <select 
                                    name="packingType"
                                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.packingType}
                                    onChange={handleChange}
                                >
                                    <option value="Standard">📦 Standard Packing (Free)</option>
                                    <option value="Fragile">🫧 Fragile Handling (+$2.00)</option>
                                    <option value="GiftWrapped">🎁 Premium Gift Wrap (+$5.00)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Personal Note (for {creator?.firstName || 'Creator'})</label>
                                <textarea 
                                    name="note" 
                                    required
                                    rows="3"
                                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
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

                    {step === 2 && (
                        <div className="space-y-6 text-center animate-in slide-in-from-right-8 fade-in">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ShieldCheck size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Confirm Request?</h3>
                            <p className="text-slate-500 text-sm">You are about to send a gift request to <span className="font-bold text-slate-800">{creator.name}</span>.</p>
                            
                            <div className="bg-slate-50 p-4 rounded-xl text-left space-y-2 border border-slate-100">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Item:</span>
                                    <span className="font-bold text-slate-800">{formData.itemName}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Value:</span>
                                    <span className="font-bold text-slate-800">${formData.approxValue}</span>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl"
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={submitToFirebase}
                                    className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg"
                                >
                                    Confirm & Send
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 1 && (
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
                                        <span className="spinner"></span> Processing...
                                    </>
                                ) : (
                                    <>Review & Send <Gift size={18} /></>
                                )}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default SendGiftModal;
