import { Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { DROP_BAR_HEIGHT, useDrag } from '@/features/board/drag/DragContext';
import { STATUS_EMOJI, STATUS_LABELS, TASK_STATUSES, type TaskStatus } from '@/domain/task';
import { haptics } from '@/lib/haptics';
import { motion } from '@/theme/tokens';

/**
 * La barre qui apparait en haut pendant qu'on deplace une carte.
 *
 * Elle ne s'affiche que durant le geste et recouvre l'en-tete du tableau.
 * Les quatre cibles font exactement un quart de la largeur : le calcul du
 * survol se reduit a une division, sans aucune mesure de vue a faire.
 */
export function DropBar({ topInset }: { topInset: number }) {
  const { width } = useWindowDimensions();
  const { x, y, hoveredIndex, setHovered, draggedTask } = useDrag();

  const isActive = draggedTask !== null;
  const barBottom = topInset + DROP_BAR_HEIGHT;
  const cellWidth = width / TASK_STATUSES.length;

  const progress = useDerivedValue(
    () => withSpring(isActive ? 1 : 0, motion.spring),
    [isActive],
  );

  /**
   * Le calcul du survol vit ici, avec la geometrie de la barre.
   * La carte qu'on deplace n'a donc rien a savoir de l'agencement.
   */
  useAnimatedReaction(
    () => ({ active: isActive, px: x.value, py: y.value }),
    (current) => {
      if (!current.active || current.py > barBottom) {
        setHovered(-1);
        return;
      }

      const index = Math.floor(current.px / cellWidth);
      const clamped = Math.min(Math.max(index, 0), TASK_STATUSES.length - 1);

      // Une petite vibration a chaque changement de cible : on sent ou on est
      // sans avoir a regarder precisement. `runOnJS` est obligatoire —
      // ce bloc s'execute sur le thread UI, pas sur le thread JavaScript.
      if (clamped !== hoveredIndex.value) {
        runOnJS(haptics.select)();
      }

      setHovered(clamped);
    },
    [isActive, barBottom, cellWidth, setHovered],
  );

  const containerStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: interpolate(progress.value, [0, 1], [-20, 0]) }],
  }));

  return (
    <Animated.View
      style={[styles.bar, { paddingTop: topInset, height: barBottom }, containerStyle]}
      // Sans ca, la barre intercepterait les touches alors qu'elle est invisible.
      pointerEvents="none"
    >
      {TASK_STATUSES.map((status, index) => (
        <DropCell key={status} status={status} index={index} />
      ))}
    </Animated.View>
  );
}

function DropCell({ status, index }: { status: TaskStatus; index: number }) {
  const { theme } = useUnistyles();
  const { hoveredIndex } = useDrag();

  const idleBg = theme.colors.surface;
  const activeBg = theme.statusColors[status].soft;
  const idleText = theme.colors.textMuted;
  const activeText = theme.statusColors[status].deep;

  const hovered = useDerivedValue(
    () => withTiming(hoveredIndex.value === index ? 1 : 0, { duration: 120 }),
    [index],
  );

  const cellStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(hovered.value, [0, 1], [idleBg, activeBg]),
    transform: [{ scale: interpolate(hovered.value, [0, 1], [1, 1.08]) }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(hovered.value, [0, 1], [idleText, activeText]),
  }));

  return (
    <View style={styles.cellSlot}>
      <Animated.View style={[styles.cell, cellStyle]}>
        <Text style={styles.emoji}>{STATUS_EMOJI[status]}</Text>
        <Animated.Text style={[styles.label, textStyle]} numberOfLines={1}>
          {STATUS_LABELS[status]}
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderBottomLeftRadius: theme.radius.xl,
    borderBottomRightRadius: theme.radius.xl,
    boxShadow: theme.shadow.card,
    zIndex: 20,
  },
  cellSlot: {
    flex: 1,
    paddingHorizontal: theme.spacing.xs,
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
  },
  emoji: {
    fontSize: theme.fontSize.lg,
  },
  label: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.xs,
  },
}));
