import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';

import { isUpcoming } from '@/domain/reminder';
import type { Task } from '@/domain/task';

/**
 * Programme les rappels de CET appareil a partir des taches.
 *
 * Ce sont des notifications LOCALES : le telephone se previent lui-meme a
 * l'heure dite. Aucun serveur, aucun cout, et ca fonctionne meme sans
 * reseau une fois le rappel pose.
 *
 * Les deux telephones executent cette fonction chacun de leur cote sur les
 * memes taches : vous etes donc prevenus tous les deux, comme voulu.
 */
export async function syncReminders(tasks: Task[]): Promise<void> {
  /**
   * On efface tout puis on reprogramme, plutot que de tenir un registre
   * des identifiants deja poses. Un registre se desynchroniserait a la
   * premiere erreur ou apres une reinstallation ; repartir de zero est
   * plus court et ne peut pas deriver.
   *
   * Sans danger ici : les rappels sont les seules notifications locales
   * de l'app.
   */
  await Notifications.cancelAllScheduledNotificationsAsync();

  const pending = tasks.filter(
    (task) =>
      task.remindAt !== undefined && task.status !== 'done' && isUpcoming(task.remindAt),
  );

  const identifiers = await Promise.all(
    pending.map((task) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Petit rappel',
          body: task.title,
          // Permet d'ouvrir directement la tache en tapant la notification.
          data: { taskId: task.id },
          sound: 'default',
        },
        trigger: {
          type: SchedulableTriggerInputTypes.DATE,
          date: new Date(task.remindAt as number),
        },
      }),
    ),
  );

  // Trace de developpement : c'est la seule facon de verifier qu'un rappel
  // a bien ete pose sans attendre l'heure dite. Absente en production.
  if (__DEV__) {
    console.log(`[rappels] ${identifiers.length} programmé(s)`);
  }
}
