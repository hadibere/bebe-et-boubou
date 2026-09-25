import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useTasks } from '@/data/tasks/TasksProvider';
import { haptics } from '@/lib/haptics';
import { TaskForm } from './components/TaskForm';

/**
 * Ecran de modification : meme formulaire que la creation, pre-rempli,
 * plus la suppression. Pas de vue englobante (voir TaskForm).
 */
export function EditTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getTask, updateTask, deleteTask } = useTasks();

  const task = getTask(id);

  // Peut arriver si la tache vient d'etre supprimee alors que l'ecran est ouvert.
  if (!task) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>Cette tâche n’existe plus 🙀</Text>
      </View>
    );
  }

  const confirmDelete = () => {
    Alert.alert('Supprimer la tâche ?', `« ${task.title} » sera définitivement effacée.`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          deleteTask(task.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <TaskForm
      initialTask={task}
      title="Modifier la tâche"
      submitLabel="Enregistrer"
      onSubmit={(draft) => {
        updateTask(task.id, draft);
        haptics.success();
        router.back();
      }}
      onDelete={confirmDelete}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  missingText: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.md,
    color: theme.colors.textMuted,
  },
}));
