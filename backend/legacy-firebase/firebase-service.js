import { firebaseConfig, firebaseEnabled } from './firebase-config.js';

let servicesPromise = null;

async function loadSdk() {
  if (!firebaseEnabled) return null;
  if (servicesPromise) return servicesPromise;

  servicesPromise = (async () => {
    const appModule = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js');
    const firestoreModule = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
    const app = appModule.initializeApp(firebaseConfig);
    const db = firestoreModule.getFirestore(app);
    return { app, db, firestoreModule };
  })();

  return servicesPromise;
}

export function isFirebaseActive() {
  return firebaseEnabled;
}

export async function getRemoteContent() {
  if (!firebaseEnabled || !navigator.onLine) return null;
  try {
    const services = await loadSdk();
    const { db, firestoreModule: f } = services;

    const [postSnap, eventSnap] = await Promise.all([
      f.getDocs(f.query(f.collection(db, 'posts'), f.where('published', '==', true))),
      f.getDocs(f.query(f.collection(db, 'events'), f.where('published', '==', true)))
    ]);

    const normalize = (doc) => ({ id: doc.id, ...doc.data() });
    return {
      posts: postSnap.docs.map(normalize),
      events: eventSnap.docs.map(normalize)
    };
  } catch (error) {
    console.warn('Não foi possível carregar dados remotos. Mantendo dados locais.', error);
    return null;
  }
}

export async function sendPrayerRequest(payload) {
  if (!firebaseEnabled) {
    const key = 'iepp_local_prayers';
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    current.unshift({
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      ...payload,
      status: 'novo',
      createdAt: new Date().toISOString(),
      localOnly: true
    });
    localStorage.setItem(key, JSON.stringify(current.slice(0, 50)));
    return { mode: 'local' };
  }

  const services = await loadSdk();
  const { db, firestoreModule: f } = services;
  await f.addDoc(f.collection(db, 'prayer_requests'), {
    ...payload,
    status: 'novo',
    createdAt: f.serverTimestamp()
  });
  return { mode: 'firebase' };
}
