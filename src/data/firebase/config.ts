/**
 * La configuration Firebase, lue depuis les variables d'environnement.
 *
 * Pourquoi pas en dur dans le fichier ? Cette configuration n'est pas un secret
 * (elle est de toute facon embarquee dans l'app livree), mais la laisser dans
 * l'historique Git d'un depot potentiellement public invite les robots a
 * consommer notre quota. La vraie protection, ce sont les regles Firestore.
 *
 * Expo remplace `process.env.EXPO_PUBLIC_*` par sa valeur a la compilation.
 * Il faut donc ecrire chaque nom EN TOUTES LETTRES : une lecture dynamique
 * du style process.env[nom] ne serait pas remplacee et vaudrait undefined.
 */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

/** Passe a "1" dans .env pour taper sur les emulateurs locaux plutot que sur le vrai projet. */
export const useEmulators = process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === '1';

/**
 * On verifie au demarrage plutot que de laisser Firebase echouer plus tard
 * avec un message obscur : une variable oubliee doit se voir tout de suite.
 */
export function readFirebaseConfig() {
  const missing = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Configuration Firebase incomplète : ${missing.join(', ')}.\n` +
        'Copie .env.example vers .env et renseigne les valeurs du projet Firebase.',
    );
  }

  return firebaseConfig as Required<typeof firebaseConfig>;
}
