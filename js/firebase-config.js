import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
    getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import {
    getFirestore, collection, addDoc, onSnapshot,
    doc, setDoc, deleteDoc,
    initializeFirestore, persistentLocalCache, persistentMultipleTabManager
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// ─── Firebase Config ──────────────────────────────────────────────────────────
const firebaseConfig = {
    apiKey:            "AIzaSyCBe6ir28Nucavqo0KkUWdMkjgVg2t6wmQ",
    authDomain:        "shayan-azmi.firebaseapp.com",
    projectId:         "shayan-azmi",
    storageBucket:     "shayan-azmi.firebasestorage.app",
    messagingSenderId: "177383235583",
    appId:             "1:177383235583:web:32952d4db25bb787bfd1ca",
    measurementId:     "G-8CN6R8SXYL"
};

// ─── Initialize App ───────────────────────────────────────────────────────────
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ─── Firestore: modern persistent cache (replaces deprecated enableIndexedDbPersistence) ──
let db;
try {
    db = initializeFirestore(app, {
        cache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
} catch (e) {
    db = getFirestore(app);
}

// ─── Path Helpers ─────────────────────────────────────────────────────────────
// CMS collections: /cms/{collectionName}/items/{docId}
// UI singletons:   /cms_ui/{docId}
// These are simple flat paths — easy to write Firestore rules for.

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