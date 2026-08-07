// Preencha estes valores com os dados do seu projeto Firebase Web.
// Enquanto apiKey permanecer vazio, o PWA funciona em modo local/demonstração.
export const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

export const firebaseEnabled = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);
