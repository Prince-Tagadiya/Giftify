import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { collection, getDocs, writeBatch, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const ResetDB = () => {
    const [status, setStatus] = useState("Initializing...");
    const [, setLocation] = useLocation();

    useEffect(() => {
        const reset = async () => {
            try {
                setStatus("⚠️ Cleaning Collections...");
                const collections = ['users', 'gift_requests', 'notifications', 'admin_settings', 'system_settings'];
                
                for (const col of collections) {
                    const snap = await getDocs(collection(db, col));
                    if (!snap.empty) {
                        const batch = writeBatch(db);
                        snap.docs.forEach(d => batch.delete(d.ref));
                        await batch.commit();
                    }
                }

                setStatus("🌱 Seeding EXTENSIVE Dataset...");
                
                // 1. ADMIN / LOGISTICS
                await setDoc(doc(db, 'users', 'admin_master_1'), {
                    firstName: 'Logistics', lastName: 'Team', email: 'logistics@giftify.com', 
                    role: 'admin', verified: true, createdAt: new Date().toISOString()
                });

                // 2. CREATORS (Large List)
                const creators = [
                    // Comedy
                    { id: 'samay_raina', name: 'Samay Raina', email: 'samay@giftify.com', cat: 'Comedy', bio: 'Supreme Leader. Send chess sets.' },
                    { id: 'tanmay_bhat', name: 'Tanmay Bhat', email: 'tanmay@giftify.com', cat: 'Comedy', bio: 'Bot Army. Finance & Reviews.' },
                    { id: 'zakir_khan', name: 'Zakir Khan', email: 'zakir@giftify.com', cat: 'Comedy', bio: 'Sakht Launda. Poetry & Life.' },
                    { id: 'bass_i', name: 'Anubhav Bassi', email: 'bassi@giftify.com', cat: 'Comedy', bio: 'Cheating & Roommates.' },
                    
                    // Tech
                    { id: 'tech_burner', name: 'Tech Burner', email: 'shlok@giftify.com', cat: 'Tech', bio: 'Layers & Fun Tech.' },
                    { id: 'mkbhd_india', name: 'Marques Brownlee', email: 'mkbhd@giftify.com', cat: 'Tech', bio: 'Quality Tech Reviews (India Visit).' },
                    { id: 'gyan_therapy', name: 'Gyan Therapy', email: 'gyan@giftify.com', cat: 'Tech', bio: 'Unbiased Mobile Reviews.' },
                    
                    // Gaming
                    { id: 'mortal', name: 'Mortal', email: 'mortal@giftify.com', cat: 'Gaming', bio: 'Soul of BGMI.' },
                    { id: 'scout', name: 'ScoutOP', email: 'scout@giftify.com', cat: 'Gaming', bio: 'Aggressive Gameplay.' },
                    { id: 'total_gaming', name: 'Total Gaming', email: 'ajju@giftify.com', cat: 'Gaming', bio: 'Ajeeb Dastaan.' },
                    
                    // Lifestyle & Vlog
                    { id: 'flying_beast', name: 'Flying Beast', email: 'gaurav@giftify.com', cat: 'Lifestyle', bio: 'Fitness & Family Vlogs.' },
                    { id: 'sourav_joshi', name: 'Sourav Joshi', email: 'sourav@giftify.com', cat: 'Lifestyle', bio: 'Number 1 Vlogger.' },
                    { id: 'rimorav', name: 'Rimorav Vlogs', email: 'rishi@giftify.com', cat: 'Lifestyle', bio: 'Crazy Challenges.' },
                    
                    // Music & Others
                    { id: 'arjit_singh', name: 'Arijit Singh', email: 'arjit@giftify.com', cat: 'Music', bio: 'Soulful Melodies.' },
                    { id: 'neha_kakkar', name: 'Neha Kakkar', email: 'neha@giftify.com', cat: 'Music', bio: 'Selfie Queen.' },
                    { id: 'physics_wallah', name: 'Physics Wallah', email: 'alakh@giftify.com', cat: 'Education', bio: 'Padhlo Chahe Kahi Se.' },
                    { id: 'ashish_chanchlani', name: 'Ashish C', email: 'ashish@giftify.com', cat: 'Comedy', bio: 'Bijli Ka Bill.' },
                    { id: 'amit_bhadana', name: 'Amit Bhadana', email: 'amit@giftify.com', cat: 'Comedy', bio: 'Mehnat.' },
                    { id: 'mr_indian_hacker', name: 'Mr Indian Hacker', email: 'dilraj@giftify.com', cat: 'Experiment', bio: 'Titanium Army.' },
                    { id: 'crazy_xyz', name: 'Crazy XYZ', email: 'crazy@giftify.com', cat: 'Experiment', bio: 'Experiments & Cars.' }
                ];
                
                // Batch create creators
                const creatorBatch = writeBatch(db);
                creators.forEach(c => {
                    creatorBatch.set(doc(db, 'users', c.id), {
                        firstName: c.name.split(' ')[0], 
                        lastName: c.name.split(' ').slice(1).join(' '), 
                        displayName: c.name,
                        email: c.email, 
                        role: 'creator', 
                        verified: true,
                        profile: { 
                            avatarUrl: ["🦁","🐼","🐯","🦊","🐶","🦄","🐸","🦉"][Math.floor(Math.random()*8)], 
                            bio: c.bio, 
                            categories: [c.cat], 
                            socials: { twitter: c.id, instagram: c.id } 
                        },
                        createdAt: new Date().toISOString()
                    });
                });
                await creatorBatch.commit();


                // 3. FANS (Main Fan: Prince)
                await setDoc(doc(db, 'users', 'fan_1'), {
                    firstName: 'Prince', lastName: 'Tagadiya', email: 'fan@giftify.com', 
                    role: 'fan', verified: true,
                    fanSettings: { 
                        defaultPickupAddress: "Flat 402, Sunshine Apts, Mumbai, India", 
                        confirmBeforeSubmit: true, 
                        notifications: { approval: true, pickup: true, delivery: true, thankYou: true }
                    },
                    favorites: ['samay_raina', 'tech_burner', 'mortal'],
                    createdAt: new Date().toISOString()
                });

                // 4. GIFT HISTORY (Seeding fake gifts for Prince)
                const giftBatch = writeBatch(db);
                const gifts = [
                    {
                        id: 'gift_001', creatorId: 'samay_raina', creatorName: 'Samay Raina',
                        itemDetails: { name: 'Antique Chess Set', category: 'Gaming', approxValue: 150, description: 'Hand carved wooden set', packingType: 'Fragile' },
                        status: 'pending', timeline: { created_at: { seconds: Date.now()/1000 - 3600 } } // 1 hour ago
                    },
                    {
                        id: 'gift_002', creatorId: 'tech_burner', creatorName: 'Tech Burner',
                        itemDetails: { name: 'Transparent Phone Case', category: 'Tech', approxValue: 20, description: 'Custom printed case', packingType: 'Standard' },
                        status: 'accepted_need_address', timeline: { created_at: { seconds: Date.now()/1000 - 86400 }, accepted_at: { seconds: Date.now()/1000 - 40000 } } // 1 day ago
                    },
                    {
                        id: 'gift_003', creatorId: 'flying_beast', creatorName: 'Flying Beast',
                        itemDetails: { name: 'Protein Powder (Sealed)', category: 'Lifestyle', approxValue: 50, description: 'Brand new tub', packingType: 'Standard' },
                        status: 'ready_for_pickup', timeline: { created_at: { seconds: Date.now()/1000 - 172800 }, accepted_at: { seconds: Date.now()/1000 - 100000 }, ready_for_pickup_at: { seconds: Date.now()/1000 - 80000 } }
                    },
                    {
                        id: 'gift_004', creatorId: 'mortal', creatorName: 'Mortal',
                        itemDetails: { name: 'Gaming Mouse', category: 'Gaming', approxValue: 80, description: 'Logitech G Pro', packingType: 'Standard' },
                        status: 'picked_up', 
                        logistics: { trackingNumber: 'GTFY-8821' },
                        timeline: { created_at: { seconds: Date.now()/1000 - 250000 }, picked_up_at: { seconds: Date.now()/1000 - 50000 } }
                    },
                    {
                        id: 'gift_005', creatorId: 'tanmay_bhat', creatorName: 'Tanmay Bhat',
                        itemDetails: { name: 'Funny Meme Poster', category: 'Comedy', approxValue: 15, description: 'Framed A3 poster', packingType: 'Fragile' },
                        status: 'delivered',
                        logistics: { trackingNumber: 'GTFY-1102' },
                        timeline: { created_at: { seconds: Date.now()/1000 - 600000 }, delivered_at: { seconds: Date.now()/1000 - 200000 } }
                    },
                    {
                        id: 'gift_006', creatorId: 'physics_wallah', creatorName: 'Physics Wallah',
                        itemDetails: { name: 'Box of Chalks', category: 'Education', approxValue: 5, description: 'Premium dustless chalks', packingType: 'Standard' },
                        status: 'rejected',
                        timeline: { created_at: { seconds: Date.now()/1000 - 3000 } }
                    },
                    {
                        id: 'gift_007', creatorId: 'tech_burner', creatorName: 'Tech Burner',
                        itemDetails: { name: 'Cool RGB Light', category: 'Tech', approxValue: 30, description: 'Battery operated', packingType: 'Standard' },
                        status: 'delivered',
                         logistics: { trackingNumber: 'GTFY-9921' },
                        timeline: { created_at: { seconds: Date.now()/1000 - 900000 }, delivered_at: { seconds: Date.now()/1000 - 400000 } }
                    }
                ];

                gifts.forEach(g => {
                    giftBatch.set(doc(db, 'gift_requests', g.id), {
                        ...g,
                        fanId: 'fan_1', fanName: 'Prince Tagadiya', fanEmail: 'fan@giftify.com',
                        createdAt: new Date().toISOString()
                    });
                });
                await giftBatch.commit();


                // Settings
                await setDoc(doc(db, 'system_settings', 'logistics_config'), {
                    pickupsEnabled: true, pickupWindow: 'next_day', inspectionRequired: true,
                    prohibitedItems: ["Liquids", "Batteries"], autoRejectRules: { damaged: true, unsafe: true },
                    packingType: 'standard', brandedPackaging: true, deliveriesEnabled: true, deliveryRetries: 2, operationsPaused: false
                });

                await setDoc(doc(db, 'admin_settings', 'global_config'), {
                    forceApproval: false, pickupsPaused: false, disableAutoApproval: false, maxGiftsPerFan: 100
                });

                setStatus("✅ DONE! Redirecting...");
                setTimeout(() => setLocation('/login'), 2000);

            } catch (e) {
                console.error(e);
                setStatus(`❌ Error: ${e.message}`);
            }
        };
        
        reset();
    }, []);

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white font-mono">
            <div className="text-center">
                <div className="text-4xl mb-4 animate-bounce">🔄</div>
                <h1 className="text-xl font-bold">{status}</h1>
            </div>
        </div>
    );
};

export default ResetDB;
