import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

import { readFirebaseConfig, useEmulators } from './config';

/**
 * Initialisation unique de Firebase.
 *
 * Le garde `getApps().length` n'est pas superflu : en developpement, le
 * rechargement a chaud reexecute ce fichier, et Firebase refuse d'etre
 * initialise deux fois.
 */
const app = getApps().length === 0 ? initializeApp(readFirebaseConfig()) : getApp();

/**
 * `initializeAuth` et non `getAuth` : c'est le seul moyen de fournir la
 * persistance AsyncStorage, sans laquelle il faudrait se reconnecter a
 * chaque lancement de l'app.
 *
 * Le try/catch gere le rechargement a chaud : au second passage, l'instance
 * existe deja et `initializeAuth` leve une erreur. On recupere alors
 * simplement celle qui est en place.
 */
function createAuth() {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
}

export const auth = createAuth();
export const db = getFirestore(app);

/**
 * Emulateurs locaux : permet de developper et de tester sans toucher
 * au vrai projet, et sans avoir besoin d'une connexion.
 */
if (useEmulators) {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8080);
}
