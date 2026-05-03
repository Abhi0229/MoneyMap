import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getFirestore, getDoc, doc } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// ✅ Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBS4QA_p4nBQa5luKUHcxhDUAuMQ0mDkdw",
    authDomain: "moneymap-7c056.firebaseapp.com",
    projectId: "moneymap-7c056",
    storageBucket: "moneymap-7c056.firebasestorage.app",
    messagingSenderId: "970186613492",
    appId: "1:970186613492:web:cde89ff662ef0a48d874a1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Helper: set avatar initials
function setInitials(first, last) {
    const initials = ((first?.[0] || '') + (last?.[0] || '')).toUpperCase() || '?';
    const avatarLarge = document.getElementById('avatar-large');
    const userAvatar = document.getElementById('user-avatar');
    if (avatarLarge) avatarLarge.textContent = initials;
    if (userAvatar) userAvatar.textContent = initials;
}

// Auth state listener
onAuthStateChanged(auth, (user) => {
    const loggedInUserId = localStorage.getItem('loggedInUserId');

    if (!loggedInUserId) {
        // Not logged in — redirect to sign in
        window.location.href = '../Html/signin.html';
        return;
    }

    const docRef = doc(db, "users", loggedInUserId);

    getDoc(docRef)
        .then((docSnap) => {
            if (docSnap.exists()) {
                const { firstName, lastName, email } = docSnap.data();

                // Sidebar profile details
                const fNameEl = document.getElementById('loggedUserFName');
                const lNameEl = document.getElementById('loggedUserLName');
                const emailEl = document.getElementById('loggedUserEmail');
                if (fNameEl) fNameEl.textContent = firstName || '—';
                if (lNameEl) lNameEl.textContent = lastName || '—';
                if (emailEl) emailEl.textContent = email || '—';

                // Profile card
                const profileName = document.getElementById('profile-name');
                const profileEmail = document.getElementById('profile-email');
                if (profileName) profileName.textContent = `${firstName || ''} ${lastName || ''}`.trim() || '—';
                if (profileEmail) profileEmail.textContent = email || '—';

                // Nav user name
                const navUserName = document.getElementById('nav-user-name');
                if (navUserName) navUserName.textContent = firstName || email || 'User';

                // Welcome heading — h1 element with full text
                const welcomeName = document.getElementById('welcome-name');
                if (welcomeName) {
                    welcomeName.innerHTML = 'Welcome back, <span class="text-accent">' + (firstName || 'there') + '</span>';
                }

                // Avatar initials
                setInitials(firstName, lastName);

                // Last active
                const lastActiveEl = document.getElementById('lastActive');
                if (lastActiveEl) {
                    lastActiveEl.textContent = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                }

                // Dashboard date
                const dashDateEl = document.getElementById('dash-date');
                if (dashDateEl) {
                    dashDateEl.textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                }

            } else {
                console.warn("No user document found in Firestore.");
            }
        })
        .catch((error) => {
            console.error("Error fetching user data:", error);
        });
});

// Logout
const logoutButton = document.getElementById('logout');
if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('loggedInUserId');
        signOut(auth)
            .then(() => {
                window.location.href = '../Html/Main.html';
            })
            .catch((error) => {
                console.error('Error signing out:', error);
            });
    });
}
