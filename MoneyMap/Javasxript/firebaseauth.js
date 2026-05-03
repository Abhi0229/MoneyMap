// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getFirestore, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// ✅ Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBS4QA_p4nBQa5luKUHcxhDUAuMQ0mDkdw",
  authDomain: "moneymap-7c056.firebaseapp.com",
  projectId: "moneymap-7c056",
  storageBucket: "moneymap-7c056.firebasestorage.app",
  messagingSenderId: "970186613492",
  appId: "1:970186613492:web:cde89ff662ef0a48d874a1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Show inline feedback messages (replaces browser alerts)
function showMessage(message, divId) {
  const messageDiv = document.getElementById(divId);
  if (!messageDiv) return;
  messageDiv.style.display = 'block';
  messageDiv.innerHTML = message;
  messageDiv.style.opacity = 1;
  setTimeout(() => {
    messageDiv.style.opacity = 0;
    setTimeout(() => { messageDiv.style.display = 'none'; }, 500);
  }, 4000);
}

// ── Sign Up ──────────────────────────────────────────────────────────────────
const signUp = document.getElementById('submitSignUp');
signUp?.addEventListener('click', (event) => {
  event.preventDefault();

  const email     = document.getElementById('rEmail').value.trim();
  const password  = document.getElementById('rPassword').value;
  const firstName = document.getElementById('fName').value.trim();
  const lastName  = document.getElementById('lName').value.trim();

  if (!email || !password || !firstName || !lastName) {
    showMessage('Please fill in all fields.', 'signUpMessage');
    return;
  }

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      showMessage('Account created! Redirecting…', 'signUpMessage');
      return setDoc(doc(db, "users", user.uid), { email, firstName, lastName });
    })
    .then(() => {
      window.location.href = '../Html/signin.html';
    })
    .catch((error) => {
      if (error.code === 'auth/email-already-in-use') {
        showMessage('An account with this email already exists.', 'signUpMessage');
      } else if (error.code === 'auth/weak-password') {
        showMessage('Password must be at least 6 characters.', 'signUpMessage');
      } else {
        console.error('Sign-up error:', error);
        showMessage('Sign-up failed. Please try again.', 'signUpMessage');
      }
    });
});

// ── Sign In ──────────────────────────────────────────────────────────────────
const signIn = document.getElementById('submitSignIn');
signIn?.addEventListener('click', (event) => {
  event.preventDefault();

  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    showMessage('Please enter your email and password.', 'signInMessage');
    return;
  }

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      localStorage.setItem('loggedInUserId', user.uid);
      showMessage('Login successful! Redirecting…', 'signInMessage');
      setTimeout(() => {
        window.location.href = '../Html/profilepage.html';
      }, 800);
    })
    .catch((error) => {
      // Firebase v10 uses 'auth/invalid-credential' for wrong email/password
      // (replaces deprecated 'auth/wrong-password' and 'auth/user-not-found')
      if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/user-not-found'
      ) {
        showMessage('Incorrect email or password. Please try again.', 'signInMessage');
      } else if (error.code === 'auth/invalid-email') {
        showMessage('Please enter a valid email address.', 'signInMessage');
      } else if (error.code === 'auth/too-many-requests') {
        showMessage('Too many failed attempts. Please wait and try again.', 'signInMessage');
      } else {
        console.error('Sign-in error:', error);
        showMessage('Login failed. Please try again.', 'signInMessage');
      }
    });
});
