import { firebaseConfig, firebaseEnabled } from './firebase-config.js';

let sdkPromise = null;

async function loadSdk() {
  if (!firebaseEnabled) return null;
  if (sdkPromise) return sdkPromise;

  sdkPromise = (async () => {
    const [appModule, authModule, firestoreModule, storageModule] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js'),
      import('https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js')
    ]);

    const app = appModule.initializeApp(firebaseConfig);
    const auth = authModule.getAuth(app);
    const db = firestoreModule.getFirestore(app);
    const storage = storageModule.getStorage(app);
    return { app, auth, db, storage, authModule, firestoreModule, storageModule };
  })();

  return sdkPromise;
}

export function isAdminFirebaseConfigured() {
  return firebaseEnabled;
}

export async function observeAuth(callback) {
  const sdk = await loadSdk();
  if (!sdk) return () => {};
  return sdk.authModule.onAuthStateChanged(sdk.auth, callback);
}

export async function signIn(email, password) {
  const sdk = await loadSdk();
  const credential = await sdk.authModule.signInWithEmailAndPassword(sdk.auth, email, password);
  const allowed = await isAdminUser(credential.user.uid);
  if (!allowed) {
    await sdk.authModule.signOut(sdk.auth);
    throw new Error('Usuário autenticado, mas não autorizado como administrador.');
  }
  return credential.user;
}

export async function signOutAdmin() {
  const sdk = await loadSdk();
  if (sdk) await sdk.authModule.signOut(sdk.auth);
}

export async function isAdminUser(uid) {
  const sdk = await loadSdk();
  if (!sdk || !uid) return false;
  const ref = sdk.firestoreModule.doc(sdk.db, 'admins', uid);
  const snap = await sdk.firestoreModule.getDoc(ref);
  return snap.exists();
}

function collectionFor(type) {
  if (type === 'posts') return 'posts';
  if (type === 'events') return 'events';
  if (type === 'prayers') return 'prayer_requests';
  throw new Error('Coleção inválida');
}

export async function listDocuments(type) {
  const sdk = await loadSdk();
  const name = collectionFor(type);
  const snap = await sdk.firestoreModule.getDocs(sdk.firestoreModule.collection(sdk.db, name));
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function saveDocument(type, data, id = null) {
  const sdk = await loadSdk();
  const f = sdk.firestoreModule;
  const name = collectionFor(type);
  const payload = {
    ...data,
    updatedAt: f.serverTimestamp()
  };

  if (id) {
    await f.updateDoc(f.doc(sdk.db, name, id), payload);
    return id;
  }

  const ref = await f.addDoc(f.collection(sdk.db, name), {
    ...payload,
    createdAt: f.serverTimestamp()
  });
  return ref.id;
}

export async function removeDocument(type, id) {
  const sdk = await loadSdk();
  const name = collectionFor(type);
  await sdk.firestoreModule.deleteDoc(sdk.firestoreModule.doc(sdk.db, name, id));
}

export async function uploadContentImage(file, folder = 'content') {
  const sdk = await loadSdk();
  const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : 'jpg';
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
  const path = `${folder}/${safeName}`;
  const ref = sdk.storageModule.ref(sdk.storage, path);
  await sdk.storageModule.uploadBytes(ref, file, { contentType: file.type || 'image/jpeg' });
  return sdk.storageModule.getDownloadURL(ref);
}
