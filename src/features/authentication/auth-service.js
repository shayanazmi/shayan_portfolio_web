import {
    auth, adminLogin, adminLogout, onAuthStateChanged
} from '../../shared/firebase/firebase-config.js';
import {
    createUserWithEmailAndPassword,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

export function login(email, password) {
    return adminLogin(email, password);
}

export function registerAdmin(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
}

export function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
}

export function logout() {
    return adminLogout();
}

export function observeAuth(callback) {
    return onAuthStateChanged(auth, callback);
}

export function getCurrentUser() {
    return auth.currentUser;
}
