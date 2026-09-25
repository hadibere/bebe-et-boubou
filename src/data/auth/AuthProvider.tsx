import { FirebaseError } from 'firebase/app';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { auth } from '@/data/firebase/app';

interface AuthContextValue {
  /** L'utilisateur connecte, ou null. */
  user: User | null;
  /** Vrai tant qu'on ne sait pas encore si une session existe. */
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    /**
     * Firebase restaure la session depuis AsyncStorage de maniere asynchrone.
     * Ce callback est appele une premiere fois une fois la restauration finie :
     * c'est a ce moment, et pas avant, qu'on sait si quelqu'un est connecte.
     */
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, signIn, signOut }),
    [user, isLoading, signIn, signOut],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const context = use(AuthContext);

  if (!context) {
    throw new Error('useAuth doit être utilisé à l’intérieur de <AuthProvider>.');
  }

  return context;
}

/**
 * Traduit les codes d'erreur Firebase en phrases comprehensibles.
 *
 * Firebase renvoie volontairement le meme code pour un e-mail inconnu et un
 * mot de passe faux (`invalid-credential`), afin de ne pas reveler quels
 * comptes existent. On garde donc un message unique pour ces deux cas.
 */
export function describeAuthError(error: unknown): string {
  if (!(error instanceof FirebaseError)) {
    return 'Quelque chose s’est mal passé. Réessaie dans un instant.';
  }

  switch (error.code) {
    case 'auth/invalid-email':
      return 'Cette adresse e-mail n’a pas l’air valide.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou mot de passe incorrect.';
    case 'auth/user-disabled':
      return 'Ce compte a été désactivé.';
    case 'auth/too-many-requests':
      return 'Trop de tentatives. Attends une minute avant de réessayer.';
    case 'auth/network-request-failed':
      return 'Pas de connexion. Vérifie ton réseau.';
    default:
      return 'Connexion impossible pour le moment.';
  }
}
