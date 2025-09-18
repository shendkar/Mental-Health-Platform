// Firebase Auth + Firestore integration
// Uses Firebase v9+ modular SDK from CDN

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { createUserWithEmailAndPassword, getAuth, onAuthStateChanged, signInWithEmailAndPassword, updateProfile } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { doc, getFirestore, serverTimestamp, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const config = window.firebaseConfig;
if (!config || !config.apiKey) {
  console.warn('Firebase config missing. Add your credentials in index.html.');
}

const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

// UI helpers
function $(id) { return document.getElementById(id); }
function show(el) { el?.classList.remove('hidden'); el?.classList.add('show'); }
function hide(el) { el?.classList.add('hidden'); el?.classList.remove('show'); }
function closeModals() {
  hide($('authOverlay'));
  hide($('loginModal'));
  hide($('signupModal'));
}

// Lightweight dialog (inline-styled for portability)
function showDialog(message, type = 'info') {
  const existing = document.getElementById('app-dialog');
  if (existing) existing.remove();
  const dialog = document.createElement('div');
  dialog.id = 'app-dialog';
  const bg = type === 'error' ? '#FEE2E2' : type === 'success' ? '#DCFCE7' : '#EFF6FF';
  const border = type === 'error' ? '#FCA5A5' : type === 'success' ? '#86EFAC' : '#93C5FD';
  const color = type === 'error' ? '#991B1B' : type === 'success' ? '#14532D' : '#1E3A8A';
  dialog.style.cssText = `
    position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
    background: ${bg}; color: ${color}; border: 1px solid ${border};
    padding: 12px 16px; border-radius: 10px; z-index: 3000; box-shadow: 0 10px 20px rgba(0,0,0,0.1);
    font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; font-weight: 600;
  `;
  dialog.textContent = message;
  document.body.appendChild(dialog);
  setTimeout(() => dialog.remove(), 2500);
}

// Auth state observer: no auto-redirect; show modals until user acts
onAuthStateChanged(auth, () => {
  // Intentionally left empty to avoid auto-redirect
});

// Login form
const loginForm = $('loginForm');
loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('loginEmail').value.trim();
  const password = $('loginPassword').value;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) { showDialog('Please enter a valid email.', 'error'); return; }
  if (!password || password.length < 6) { showDialog('Password must be at least 6 characters.', 'error'); return; }
  try {
    await signInWithEmailAndPassword(auth, email, password);
    showDialog('Login successful', 'success');
    closeModals();
    setTimeout(() => { window.location.href = 'index1.html'; }, 500);
  } catch (err) {
    const code = err?.code || '';
    if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
      showDialog('Invalid credentials', 'error');
    } else {
      showDialog(err.message || 'Login failed', 'error');
    }
  }
});

// Google auth removed per request

// Signup form
const signupForm = $('signupForm');
signupForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = $('signupName').value.trim();
  const email = $('signupEmail').value.trim();
  const password = $('signupPassword').value;
  const confirm = $('signupConfirm').value;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) { showDialog('Please enter a valid email.', 'error'); return; }
  if (!password || password.length < 6) { showDialog('Password must be at least 6 characters.', 'error'); return; }
  if (password !== confirm) { alert('Passwords do not match'); return; }
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (name) {
      await updateProfile(cred.user, { displayName: name });
    }
    // Create user doc
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      displayName: name || null,
      email,
      createdAt: serverTimestamp()
    }, { merge: true });
    showDialog('Account created', 'success');
    closeModals();
    setTimeout(() => { window.location.href = 'index1.html'; }, 500);
  } catch (err) {
    const code = err?.code || '';
    if (code.includes('email-already-in-use')) {
      showDialog('Email already in use', 'error');
    } else if (code.includes('weak-password')) {
      showDialog('Password is too weak', 'error');
    } else {
      showDialog(err.message || 'Sign up failed', 'error');
    }
  }
});

// Google auth removed per request

// Logout
// Logout control intentionally not shown on index.html per request


