import { Pressable, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

import { MemberAvatar } from '@/components/ui/MemberAvatar';
import { PriorityPaws } from '@/components/ui/PriorityPaws';
import type { Task } from '@/domain/task';
import { haptics } from '@/lib/haptics';
import { motion } from '@/theme/tokens';

interface TaskCardProps {
  task: Task;
  /** Sert a decaler l'animation d'apparition : les cartes arrivent en cascade. */
  index: number;
  onPress?: (task: Task) => void;
}

export function TaskCard({ task, index, onPress }: TaskCardProps) {
  // Une "shared value" vit sur le thread UI natif : l'animation continue meme
  // si le thread JavaScript est occupe. C'est ca qui donne la sensation de fluidite.
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed.value === 1 ? 0.96 : 1, motion.springBouncy) }],
  }));

  styles.useVariants({ color: task.color, done: task.status === 'done' });

  return (
    // DEUX vues imbriquees, et c'est indispensable : Reanimated interdit qu'une
    // meme vue porte une animation de layout ET un `transform` anime — les deux
    // se disputent la propriete et la carte reste coincee en cours d'animation.
    // Vue exterieure = apparition et repositionnement. Vue interieure = pression.
    <Animated.View
      entering={FadeInDown.delay(index * 55).springify().damping(16)}
      layout={LinearTransition.springify().damping(18)}
    >
      <Animated.View style={animatedStyle}>
        <Pressable
          onPressIn={() => {
            pressed.value = 1;
          }}
          onPressOut={() => {
            pressed.value = 0;
          }}
          onPress={() => {
            haptics.select();
            onPress?.(task);
          }}
          style={styles.card}
        >
          {/* Le liseré coloré : c'est lui qui permet de retrouver ses taches d'un coup d'oeil */}
          <View style={styles.stripe} />

          <View style={styles.body}>
            <Text
              style={[styles.title, task.status === 'done' && styles.titleDone]}
              numberOfLines={2}
            >
              {task.title}
            </Text>

            {task.notes ? (
              <Text style={styles.notes} numberOfLines={1}>
                {task.notes}
              </Text>
            ) : null}

            <View style={styles.footer}>
              <PriorityPaws priority={task.priority} />
              <MemberAvatar memberId={task.assigneeId} />
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    boxShadow: theme.shadow.card,
    overflow: 'hidden',
    variants: {
      done: {
        // Une tache terminee s'efface discretement au lieu de disparaitre.
        true: { opacity: 0.55 },
        false: {},
      },
    },
  },
  stripe: {
    width: 7,
    variants: {
      color: {
        rose: { backgroundColor: theme.taskColors.rose.deep },
        lavender: { backgroundColor: theme.taskColors.lavender.deep },
        mint: { backgroundColor: theme.taskColors.mint.deep },
        butter: { backgroundColor: theme.taskColors.butter.deep },
        sky: { backgroundColor: theme.taskColors.sky.deep },
        peach: { backgroundColor: theme.taskColors.peach.deep },
      },
    },
  },
  body: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  title: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    lineHeight: 21,
  },
  // Style compose plutot que variant : le systeme de variants d'Unistyles
  // elargit `textDecorationLine` en `string`, ce que React Native refuse.
  titleDone: {
    textDecorationLine: 'line-through',
    color: theme.colors.textMuted,
  },
  notes: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
  footer: {
    marginTop: theme.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
}));
