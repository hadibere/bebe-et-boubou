import { router } from 'expo-router';

import { useTasks } from '@/data/tasks/TasksProvider';
import { haptics } from '@/lib/haptics';
import { TaskForm } from './components/TaskForm';

/**
 * Ecran de creation.
 *
 * Il ne rend QUE le formulaire, sans vue englobante : une form sheet
 * n'accepte qu'un nombre limite de vues enfants (voir TaskForm).
 */
export function NewTaskScreen() {
  const { createTask } = useTasks();

  return (
    <TaskForm
      title="Nouvelle tâche 🐾"
      submitLabel="Créer la tâche"
      onSubmit={(draft) => {
        createTask(draft);
        haptics.success();
        router.back();
      }}
    />
  );
}
