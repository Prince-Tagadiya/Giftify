
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('/Users/princetagadiya/.gemini/giftify-a2701-firebase-adminsdk-3d23m-4916a03289.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function resetDatabase() {
  console.log('🗑️  Starting Database Reset...');

  const collections = ['users', 'gift_requests', 'notifications', 'admin_settings', 'system_settings'];

  for (const colName of collections) {
    const batch = db.batch();
    const snapshot = await db.collection(colName).get();
    
    if (snapshot.size === 0) continue;

    console.log(`- Deleting ${snapshot.size} docs from [${colName}]`);
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }

  console.log('✨ Database Cleared.');
  console.log('🌱 Seeding fresh data...');

  // 1. Create ADMIN User (Logistics)
  await db.collection('users').doc('admin_master_1').set({
      firstName: 'Logistics',
      lastName: 'Admin',
      email: 'logistics@giftify.com',
      role: 'admin',
      verified: true,
      createdAt: new Date().toISOString()
  });

  // 2. Create CREATORS
  const creators = [
      { id: 'creator_1', name: 'Alex Tech', email: 'alex@creator.com', cat: 'Tech', bio: 'I love reviewing the latest gadgets!' },
      { id: 'creator_2', name: 'Sarah Style', email: 'sarah@creator.com', cat: 'Lifestyle', bio: 'Fashion, travel, and lifestyle vlogs.' },
      { id: 'creator_3', name: 'Gamer Mike', email: 'mike@creator.com', cat: 'Gaming', bio: 'Hardcore gamer and streamer.' }
  ];

  for (const c of creators) {
      await db.collection('users').doc(c.id).set({
          firstName: c.name.split(' ')[0],
          lastName: c.name.split(' ')[1],
          displayName: c.name,
          email: c.email,
          role: 'creator',
          verified: true,
          onboarded: true, // skip onboarding
          profile: {
              avatarUrl: '🦁',
              bio: c.bio,
              categories: [c.cat],
              socials: { twitter: 'demo', instagram: 'demo' }
          },
          createdAt: new Date().toISOString()
      });
  }

  // 3. Create FANS
  const fans = [
      { id: 'fan_1', name: 'John Fan', email: 'john@fan.com' },
      { id: 'fan_2', name: 'Jane Fan', email: 'jane@fan.com' }
  ];

  for (const f of fans) {
      await db.collection('users').doc(f.id).set({
          firstName: f.name.split(' ')[0],
          lastName: f.name.split(' ')[1],
          email: f.email,
          role: 'fan',
          verified: false,
          fanSettings: {
              defaultPickupAddress: "123 Fan St, Fan City, CA",
              confirmBeforeSubmit: true,
              notifications: { approval: true, pickup: true, delivery: true, thankYou: true }
          },
          favorites: ['creator_1'], // Favorite Alex Tech by default
          createdAt: new Date().toISOString()
      });
  }

  // 4. Default System Settings
  await db.collection('system_settings').doc('logistics_config').set({
        pickupsEnabled: true,
        pickupWindow: 'next_day',
        inspectionRequired: true,
        prohibitedItems: ["Liquids", "Batteries", "Sharp Objects", "Perishables"],
        autoRejectRules: { descriptionMismatch: false, damaged: true, unsafe: true },
        packingType: 'standard', 
        brandedPackaging: true,
        deliveriesEnabled: true,
        deliveryRetries: 2,
        logActivity: true,
        operationsPaused: false
  });

  await db.collection('admin_settings').doc('global_config').set({
      forceApproval: false,
      pickupsPaused: false,
      disableAutoApproval: false,
      maxGiftsPerFan: 100
  });

  console.log('✅ Database Reset & Seeded Successfully!');
  process.exit(0);
}

resetDatabase();
