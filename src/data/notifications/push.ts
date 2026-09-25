import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

/**
 * Comportement quand une notification arrive alors que l'app est OUVERTE.
 *
 * Par defaut iOS ne montre rien dans ce cas : on force l'affichage de la
 * banniere, sinon Bebe ne verrait jamais les taches ajoutees par Boubou
 * pendant qu'elle a l'app sous les yeux.
 *
 * `shouldShowBanner` / `shouldShowList` ont remplace l'ancien
 * `shouldShowAlert`, qui ne fonctionne plus.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Le service d'envoi d'Expo : pas de serveur a heberger, pas de plan payant. */
const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

export interface PushMessage {
  /** Jeton `ExponentPushToken[...]` du destinataire. */
  to: string;
  title: string;
  body: string;
  /** Charge utile lue au moment ou l'on tape la notification. */
  data?: Record<string, string>;
}

/**
 * Demande l'autorisation puis recupere le jeton de cet appareil.
 *
 * Renvoie `null` si l'utilisateur refuse — ce n'est pas une erreur, l'app
 * doit continuer a fonctionner normalement sans notifications.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;

  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
    status = requested.status;
  }

  if (status !== 'granted') {
    return null;
  }

  /**
   * `projectId` est obligatoire : c'est lui qui relie cet appareil au projet
   * EAS. Il est ecrit dans app.json par `eas init`.
   */
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;

  if (!projectId) {
    console.warn('[push] projectId EAS introuvable — lance `eas init`.');
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });

  // Tres utile quand on debogue les notifications : sans le jeton sous les
  // yeux, impossible de tester un envoi a la main. Jamais en production.
  if (__DEV__) {
    console.log('[push] jeton de cet appareil :', token.data);
  }

  return token.data;
}

/**
 * Envoie les notifications depuis l'app de celui qui agit.
 *
 * On assume ce choix : pas de Cloud Function, donc aucun plan payant et
 * rien a deployer. Le prix a payer est qu'un envoi peut echouer si le
 * reseau coupe pile a cet instant — la tache, elle, reste bien enregistree.
 */
export async function sendPushMessages(messages: PushMessage[]): Promise<void> {
  if (messages.length === 0) return;

  const response = await fetch(EXPO_PUSH_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages.map((message) => ({ ...message, sound: 'default' }))),
  });

  if (!response.ok) {
    throw new Error(`Expo a refusé l’envoi (HTTP ${response.status})`);
  }

  /**
   * Expo repond 200 meme quand un message individuel echoue : il faut
   * inspecter chaque "ticket". Le cas le plus courant est un jeton devenu
   * invalide (app desinstallee puis reinstallee).
   */
  const payload = (await response.json()) as { data?: { status: string; message?: string }[] };

  for (const ticket of payload.data ?? []) {
    if (ticket.status !== 'ok') {
      console.warn('[push] message refusé :', ticket.message);
    }
  }
}
