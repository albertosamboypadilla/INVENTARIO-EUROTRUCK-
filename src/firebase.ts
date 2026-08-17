import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with offline persistence
let dbInstance;

try {
  dbInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  }, firebaseConfig.firestoreDatabaseId || undefined);
} catch (err) {
  console.warn('initializeFirestore with persistentLocalCache warning, falling back to standard getFirestore:', err);
  dbInstance = getFirestore(app);
  enableIndexedDbPersistence(dbInstance).catch((pErr) => {
    console.info('Firestore offline persistence enable result:', pErr.code);
  });
}

export const db = dbInstance;
export default app;
