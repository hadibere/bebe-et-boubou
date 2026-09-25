import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { doc, updateDoc } from 'firebase/firestore';
import { useEffect } from 'react';

import { useAuth } from '@/data/auth/AuthProvider';
import { db } from '@/data/firebase/app';
import { registerForPushNotifications } from './push';

/**
 * Branche les notifications. Ce composant n'affiche rien : il se contente
 * de deux effets de bord, mais ils meritent d'etre isoles ici plutot que
 * noyes dans le layout.
 */
export function PushNotifications() {
  const { user } = useAuth();

  // 1. A la connexion : demander l'autorisation et publier le jeton de cet
  //    appareil, pour que l'autre puisse nous ecrire.
  useEffect(() => {
    if (!user) return;

    let abandoned = false;

    registerForPushNotifications()
      .then((token) => {
        // L'utilisateur a pu se deconnecter pendant que la demande tournait.
        if (abandoned || !token) return;
        return updateDoc(doc(db, 'members', user.uid), { pushToken: token });
      })
      .catch((error) => {
        // Un refus d'autorisation n'est pas un bug : l'app reste utilisable.
        console.warn('[push] enregistrement impossible :', error);
      });

    return () => {
      abandoned = true;
    };
  }, [user]);

  // 2. Quand on tape une notification : ouvrir directement la tache concernee.
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;

      if (__DEV__) {
        console.log('[push] notification tapée, données reçues :', JSON.stringify(data));
      }

      const taskId = data?.taskId;

      if (typeof taskId === 'string' && taskId.length > 0) {
        router.push({ pathname: '/task/[id]', params: { id: taskId } });
      }
    });

    return () => subscription.remove();
  }, []);

  return null;
}
