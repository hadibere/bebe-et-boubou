import { View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { PawPrint } from './PawPrint';
import { PRIORITY_PAWS, type TaskPriority } from '@/domain/task';

interface PriorityPawsProps {
  priority: TaskPriority;
  size?: number;
}

/**
 * L'importance sous forme de jauge : toujours trois empreintes,
 * mais seules celles qui "comptent" sont colorees.
 * On lit le niveau en un coup d'oeil sans avoir a lire un mot.
 */
export function PriorityPaws({ priority, size = 13 }: PriorityPawsProps) {
  const { theme } = useUnistyles();
  const filled = PRIORITY_PAWS[priority];
  const accent = theme.priorityColors[priority].deep;

  return (
    <View style={styles.row}>
      {[0, 1, 2].map((index) => (
        <PawPrint
          key={index}
          size={size}
          color={index < filled ? accent : theme.colors.textFaint}
          opacity={index < filled ? 1 : 0.35}
          rotate={index === 0 ? -14 : index === 2 ? 14 : 0}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
});
