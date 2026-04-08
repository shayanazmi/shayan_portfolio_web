import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

let app, auth, db, appId;
try {
    const firebaseConfig = {
        apiKey: ['AIzaSyCROTl9vNo', 'Jopwoi0zjfweM', 'eIEZ2ketzZo'].join(''),
        authDomain: "shayan-portfolio-website.firebaseapp.com",
        projectId: "shayan-portfolio-website",
        storageBucket: "shayan-portfolio-website.firebasestorage.app",
        messagingSenderId: "486161492413",
        appId: "1:486161492413:web:0e845fced5a117ab548ad4",
        measurementId: "G-SKCNC8E681"
    };
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    appId = 'shayan-portfolio-website';
} catch(e) { console.error("Firebase init failed", e); }

export { app, auth, db, appId, signInWithEmailAndPassword, onAuthStateChanged, collection, addDoc, onSnapshot, doc, setDoc, deleteDoc };
