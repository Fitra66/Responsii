// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAsqkgIj3q39vS6DIWL3HRmVY24WLaDVQA",
    authDomain: "database09-3bf99.firebaseapp.com",
    projectId: "database09-3bf99",
    storageBucket: "database09-3bf99.firebasestorage.app",
    messagingSenderId: "530631795631",
    appId: "1:530631795631:web:92ca91375cc7a5eb89c55a"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getDatabase(app);