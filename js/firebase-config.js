import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, setDoc, deleteDoc, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// ─── Firebase Config ──────────────────────────────────────────────────────────
const firebaseConfig = {
    apiKey: "AIzaSyCBe6ir28Nucavqo0KkUWdMkjgVg2t6wmQ",
    authDomain: "shayan-azmi.firebaseapp.com",
    projectId: "shayan-azmi",
    storageBucket: "shayan-azmi.firebasestorage.app",
    messagingSenderId: "177383235583",
    appId: "1:177383235583:web:32952d4db25bb787bfd1ca",
    measurementId: "G-8CN6R8SXYL"
};

// ─── Initialize ───────────────────────────────────────────────────────────────
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
const appId = 'shayan-azmi';

// ─── Offline Persistence (reads work without internet) ───────────────────────
enableIndexedDbPersistence(db).catch(err => {
    if (err.code === 'failed-precondition') {
        console.warn('[Firebase] Multiple tabs open — persistence enabled in first tab only.');
    } else if (err.code === 'unimplemented') {
        console.warn('[Firebase] Offline persistence not supported in this browser.');
    }
});

// ─── Auth Helpers ─────────────────────────────────────────────────────────────
/**
 * Sign in an admin user.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<UserCredential>}
 */
async function adminLogin(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Sign out the current user.
 * @returns {Promise<void>}
 */
async function adminLogout() {
    return signOut(auth);
}

/**
 * Returns true if a user is currently logged in.
 * @returns {boolean}
 */
function isAuthenticated() {
    return !!auth.currentUser;
}

// ─── Firestore Helpers ────────────────────────────────────────────────────────
/** Base Firestore path for all CMS data */
const dataPath = (collectionName) =>
    collection(db, 'artifacts', appId, 'public', 'data', collectionName);

const docPath = (...segments) =>
    doc(db, 'artifacts', appId, 'public', 'data', ...segments);

// ─── Exports ──────────────────────────────────────────────────────────────────
export {
    app, auth, db, appId,

    // Auth
    onAuthStateChanged, signInWithEmailAndPassword, signOut,
    adminLogin, adminLogout, isAuthenticated,

    // Firestore
    collection, addDoc, onSnapshot, doc, setDoc, deleteDoc,
    dataPath, docPath
};
