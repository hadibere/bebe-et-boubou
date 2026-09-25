import { Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeInDown,
  LinearTransition,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

import { MemberAvatar } from '@/components/ui/MemberAvatar';
import { PriorityPaws } from '@/components/ui/PriorityPaws';
import { useDrag } from '@/features/board/drag/DragContext';
import { TASK_STATUSES, type Task } from '@/domain/task';
import { haptics } from '@/lib/haptics';
import { motion } from '@/theme/tokens';

interface TaskCardProps {
  task: Task;
  /** Sert a decaler l'animation d'apparition : les cartes arrivent en cascade. */
  index: number;
  onPress?: (task: Task) => void;
  /** Appele au relachement au-dessus d'une colonne de la barre de depot. */
  onDrop?: (task: Task, statusIndex: number) => void;
}

/** Duree d'appui avant que la carte ne se souleve. */
const LIFT_DELAY_MS = 220;

export function TaskCard({ task, index, onPress, onDrop }: TaskCardProps) {
  const { hoveredIndex, movePointer, setHovered, draggedTask, beginDrag, endDrag } = useDrag();

  // Une "shared value" vit sur le thread UI natif : l'animation continue meme
  // si le thread JavaScript est occupe. C'est ca qui donne la sensation de fluidite.
  const pressed = useSharedValue(0);

  const isBeingDragged = draggedTask?.id === task.id;

  const lift = () => {
    haptics.pick();
    beginDrag(task);
  };

  /** Ne fait QUE deplacer la tache. Le nettoyage se fait dans onFinalize. */
  const commitDrop = (statusIndex: number) => {
    if (statusIndex >= 0 && TASK_STATUSES[statusIndex] !== task.status) {
      haptics.success();
      onDrop?.(task, statusIndex);
    }
  };

  /**
   * `activateAfterLongPress` est la clef : le geste de deplacement ne prend la
   * main qu'apres un appui maintenu. Un appui bref ne l'active jamais, et le
   * simple tap ci-dessous reste donc disponible.
   */
  const panGesture = Gesture.Pan()
    .activateAfterLongPress(LIFT_DELAY_MS)
    .onStart((event) => {
      movePointer(event.absoluteX, event.absoluteY);
      runOnJS(lift)();
    })
    .onUpdate((event) => {
      movePointer(event.absoluteX, event.absoluteY);
    })
    .onEnd(() => {
      runOnJS(commitDrop)(hoveredIndex.value);
    })
    // `onFinalize` se declenche TOUJOURS, y compris si le geste est interrompu
    // (appel entrant, retour a l'ecran d'accueil). C'est le seul endroit sur
    // pour remettre l'etat a zero : sinon une carte resterait soulevee pour
    // toujours et les defilements du tableau resteraient figes.
    .onFinalize(() => {
      setHovered(-1);
      runOnJS(endDrag)();
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(haptics.select)();
    if (onPress) runOnJS(onPress)(task);
  });

  // Le retour visuel a l'appui, commun aux deux gestes.
  const pressGesture = Gesture.LongPress()
    .minDuration(0)
    .maxDistance(10_000)
    .onBegin(() => {
      pressed.value = 1;
    })
    .onFinalize(() => {
      pressed.value = 0;
    });

  const gesture = Gesture.Simultaneous(pressGesture, Gesture.Exclusive(panGesture, tapGesture));

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
      <GestureDetector gesture={gesture}>
        <Animated.View style={animatedStyle}>
          {/* Pendant le deplacement, la carte d'origine laisse un creux :
              c'est la copie flottante qui represente la tache. */}
          <View style={[styles.card, isBeingDragged && styles.cardGhost]}>
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
          </View>
        </Animated.View>
      </GestureDetector>
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
  cardGhost: {
    opacity: 0.25,
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
