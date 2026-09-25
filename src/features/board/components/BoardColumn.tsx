import { FlatList, Text, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { PawPrint } from '@/components/ui/PawPrint';
import type { Task, TaskStatus } from '@/domain/task';
import { TaskCard } from './TaskCard';

interface BoardColumnProps {
  status: TaskStatus;
  tasks: Task[];
  width: number;
  onTaskPress?: (task: Task) => void;
}

/** Une colonne = une page plein ecran du tableau. */
export function BoardColumn({ status, tasks, width, onTaskPress }: BoardColumnProps) {
  return (
    <View style={{ width }}>
      <FlatList
        data={tasks}
        keyExtractor={(task) => task.id}
        renderItem={({ item, index }) => (
          <TaskCard task={item} index={index} onPress={onTaskPress} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyColumn status={status} />}
      />
    </View>
  );
}

/** Une colonne vide ne doit jamais avoir l'air cassee : on la rend mignonne. */
function EmptyColumn({ status }: { status: TaskStatus }) {
  const { theme } = useUnistyles();

  const messages: Record<TaskStatus, string> = {
    todo: 'Rien à faire pour l’instant.\nProfitez-en bien 🫶',
    in_progress: 'Aucune tâche en cours.\nOn s’y met ?',
    blocked: 'Rien n’est bloqué.\nTout roule ! 🎉',
    done: 'Pas encore de tâche terminée.\nLa première arrive bientôt.',
  };

  return (
    <View style={styles.empty}>
      <View style={styles.emptyPaws}>
        <PawPrint size={30} color={theme.colors.primarySoft} rotate={-22} />
        <PawPrint size={38} color={theme.colors.primarySoft} rotate={8} />
        <PawPrint size={26} color={theme.colors.primarySoft} rotate={26} opacity={0.6} />
      </View>
      <Text style={styles.emptyText}>{messages[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  list: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    // De l'air en bas pour que la derniere carte ne soit pas sous le bouton "+"
    paddingBottom: theme.spacing.xxxl * 2,
    gap: theme.spacing.md,
  },
  empty: {
    alignItems: 'center',
    paddingTop: theme.spacing.xxxl,
    gap: theme.spacing.lg,
  },
  emptyPaws: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
    opacity: 0.8,
  },
  emptyText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.md,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
}));
