import type { Persistence } from 'firebase/auth';

/**
 * Le SDK Firebase expose bien `getReactNativePersistence` a l'execution
 * (Metro resout `firebase/auth` vers la variante React Native du paquet),
 * mais ses types livres sont ceux de la version web, ou cette fonction
 * n'existe pas. On la redeclare donc ici.
 *
 * Sans cette persistance, la session serait perdue a chaque fermeture de
 * l'app : il faudrait se reconnecter a chaque lancement.
 */
declare module 'firebase/auth' {
  interface ReactNativeAsyncStorage {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  }

  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}
