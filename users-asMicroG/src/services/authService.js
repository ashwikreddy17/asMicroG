import api from "./api";

// Firebase is lazy-loaded only when auth functions are called
let _auth = null;
let _googleProvider = null;

async function getFirebase() {
  if (_auth) return { auth: _auth, googleProvider: _googleProvider };
  const [{ initializeApp, getApps }, { getAuth }, { GoogleAuthProvider }] = await Promise.all([
    import("firebase/app"),
    import("firebase/auth"),
    import("firebase/auth"),
  ]);

  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  _auth = getAuth(app);
  _googleProvider = new GoogleAuthProvider();
  return { auth: _auth, googleProvider: _googleProvider };
}

export const loginWithEmail = async (email, password) => {
  const { auth } = await getFirebase();
  const { signInWithEmailAndPassword } = await import("firebase/auth");
  return signInWithEmailAndPassword(auth, email, password);
};

export const registerWithEmail = async (email, password) => {
  const { auth } = await getFirebase();
  const { createUserWithEmailAndPassword } = await import("firebase/auth");
  return createUserWithEmailAndPassword(auth, email, password);
};

export const loginWithGoogle = async () => {
  const { auth, googleProvider } = await getFirebase();
  const { signInWithPopup } = await import("firebase/auth");
  return signInWithPopup(auth, googleProvider);
};

export const firebaseLogout = async () => {
  const { auth } = await getFirebase();
  const { signOut } = await import("firebase/auth");
  return signOut(auth);
};

export const onAuthChange = async (callback) => {
  const { auth } = await getFirebase();
  const { onAuthStateChanged } = await import("firebase/auth");
  return onAuthStateChanged(auth, callback);
};

export const loginWithBackend = async (email, password) => {
  const { data } = await api.post("/auth/login/", { username: email, password });
  return data;
};

export const registerWithBackend = async (payload) => {
  const { data } = await api.post("/auth/register/", payload);
  return data;
};
