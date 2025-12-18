import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// Read config directly
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if config is present and valid (rudimentary check)
const isConfigured = !!(firebaseConfig.apiKey && firebaseConfig.apiKey.length > 5);

let auth, db;
if (isConfigured) {
    try {
        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
    } catch (e) {
        console.warn("Firebase Init Failed in Service:", e);
    }
} else {
    console.warn("Giftify is running in DEMO MODE (No Firebase Config Found)");
}

// Helper for Demo Persistence
const getDemoUsers = () => {
    try {
        return JSON.parse(localStorage.getItem('demo_users') || '{}');
    } catch {
        return {};
    }
};

const saveDemoUser = (user) => {
    const users = getDemoUsers();
    users[user.email] = user;
    localStorage.setItem('demo_users', JSON.stringify(users));
};

export const login = async (email, password) => {
    if (!isConfigured) {
        console.log("Using CHECK_MOCK_LOGIN");
        await new Promise(r => setTimeout(r, 800)); // Simulate network delay

        // 1. Check if user exists in local demo storage (Registered during this session)
        const demoUsers = getDemoUsers();
        if (demoUsers[email]) {
            console.log("Found existing demo user:", demoUsers[email]);
            return demoUsers[email];
        }

        // 2. Fallback: Auto-assign role based on email keyword if not found
        const role = email.includes('creator') ? 'creator' : 'fan';

        return {
            uid: 'demo_user_' + Date.now(),
            email: email,
            firstName: 'Demo',
            lastName: role === 'creator' ? 'Creator' : 'Fan',
            role: role,
            isDemo: true
        };
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const docRef = doc(db, "users", user.uid);

        // Timeout race for Firestore
        const fetchPromise = getDoc(docRef);
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Database timeout")), 8000)
        );

        try {
            const docSnap = await Promise.race([fetchPromise, timeoutPromise]);

            if (docSnap.exists()) {
                return { uid: user.uid, ...docSnap.data() };
            } else {
                return { uid: user.uid, email: user.email, role: 'fan', firstName: 'User' };
            }
        } catch (dbError) {
            console.warn("DB Timeout, falling back to auth data only");
            return { uid: user.uid, email: user.email, role: 'fan', firstName: 'User', isLimited: true };
        }

    } catch (error) {
        throw error;
    }
};

export const register = async (data) => {
    if (!isConfigured) {
        console.log("Using DEMO REGISTER");
        await new Promise(r => setTimeout(r, 1000));

        const newUser = {
            uid: 'demo_new_' + Date.now(),
            ...data,
            isDemo: true
        };

        // Save to local storage so Login can find it later
        saveDemoUser(newUser);

        return newUser;
    }

    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const user = userCredential.user;

    await updateProfile(user, { displayName: `${data.firstName} ${data.lastName}` });

    const userData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.role,
        createdAt: new Date().toISOString()
    };

    try {
        await setDoc(doc(db, "users", user.uid), userData);
    } catch (e) {
        console.warn("Failed to create user profile in DB, but Auth succeeded", e);
    }

    return { uid: user.uid, ...userData };
};
