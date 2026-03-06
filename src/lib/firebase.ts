import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyBsDaLJ9DjgKmXvh42Knk02MpduefoDxYQ",
  authDomain: "cutly-us.firebaseapp.com",
  projectId: "cutly-us",
  storageBucket: "cutly-us.firebasestorage.app",
  messagingSenderId: "1066586671887",
  appId: "1:1066586671887:web:20df0e6e46768327c64c7a",
  measurementId: "G-NZJKX5NTN8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
