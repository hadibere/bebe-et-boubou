import { useEffect } from 'react';

import { useTasks } from '@/data/tasks/TasksProvider';
import { syncReminders } from './reminders';

/**
 * Maintient les rappels de cet appareil en accord avec les taches.
 *
 * N'affiche rien. Se declenche a chaque changement venu de Firestore :
 * une tache terminee, supprimee ou dont l'heure change voit son rappel
 * mis a jour sans qu'on ait a y penser ailleurs dans le code.
 */
export function ReminderScheduler() {
  const { tasks } = useTasks();

  useEffect(() => {
    syncReminders(tasks).catch((error) => {
      console.warn('[rappels] programmation impossible :', error);
    });
  }, [tasks]);

  return null;
}
