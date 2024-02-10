import { PUBLIC_FIREBASE_CONFIG } from '$env/static/public';
import { dev } from '$app/environment';

import { getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';

const firebase_config = JSON.parse(PUBLIC_FIREBASE_CONFIG);

// initialize and login

if (!getApps().length) {
    initializeApp(firebase_config);
}

export const auth = getAuth();
export const db = getFirestore();
export const functions = getFunctions();

// emulators
if (dev) {
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFunctionsEmulator(functions, "http://127.0.0.1", 5001);
}
