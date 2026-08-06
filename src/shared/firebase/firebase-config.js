import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
    getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import {
    getFirestore, collection, addDoc, onSnapshot,
    doc, setDoc, deleteDoc,
    initializeFirestore, persistentLocalCache, persistentMultipleTabManager
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// ─── Firebase Config (Active Project: shayan-portfolio-website) ─────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCROTl9vNoJopwoi0zjfweMeIEZ2ketzZo",
  authDomain: "shayan-portfolio-website.firebaseapp.com",
  projectId: "shayan-portfolio-website",
  storageBucket: "shayan-portfolio-website.firebasestorage.app",
  messagingSenderId: "486161492413",
  appId: "1:486161492413:web:0e845fced5a117ab548ad4",
  measurementId: "G-SKCNC8E681"
};

// ─── Initialize App ───────────────────────────────────────────────────────────
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ─── Firestore: modern persistent cache ──────────────────────────
let db;
try {
    db = initializeFirestore(app, {
        cache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
} catch (e) {
    db = getFirestore(app);
}

// ─── Path Helpers ─────────────────────────────────────────────────────────────
const dataPath  = (collName)         => collection(db, 'cms', collName, 'items');
const docPath   = (collName, docId)  => doc(db, 'cms', collName, 'items', docId);
const uiDocPath = (docId)            => doc(db, 'cms_ui', docId);

// ─── Auth Helpers ─────────────────────────────────────────────────────────────
const adminLogin      = (email, pw) => signInWithEmailAndPassword(auth, email, pw);
const adminLogout     = ()          => signOut(auth);
const isAuthenticated = ()          => !!auth.currentUser;

// ─── Exports ──────────────────────────────────────────────────────────────────
export {
    app, auth, db,
    onAuthStateChanged,
    adminLogin, adminLogout, isAuthenticated,
    collection, addDoc, onSnapshot, doc, setDoc, deleteDoc,
    dataPath, docPath, uiDocPath
};
