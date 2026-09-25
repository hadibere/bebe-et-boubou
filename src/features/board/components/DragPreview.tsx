import { Text, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { PriorityPaws } from '@/components/ui/PriorityPaws';
import { useDrag } from '@/features/board/drag/DragContext';

/** Hauteur approximative de la carte flottante, pour la centrer sous le doigt. */
const PREVIEW_HEIGHT = 74;

/**
 * La carte qui suit le doigt pendant le deplacement.
 *
 * C'est une copie allegee de TaskCard, volontairement : la vraie carte porte
 * un geste et des animations d'apparition dont on n'a pas besoin ici, et il
 * faut que celle-ci soit libre de se positionner au-dessus de tout le reste.
 */
export function DragPreview() {
  const { width } = useWindowDimensions();
  const { theme } = useUnistyles();
  const { x, y, draggedTask } = useDrag();

  // Meme largeur que les vraies cartes du tableau.
  const cardWidth = width - theme.spacing.lg * 2;

  // La carte est ancree en haut a gauche de l'ecran ; les translations
  // l'amenent centree sous le doigt.
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value - cardWidth / 2 },
      { translateY: y.value - PREVIEW_HEIGHT / 2 },
      { rotate: '-3deg' },
      { scale: 1.04 },
    ],
  }));

  // Rien a afficher tant qu'aucune carte n'est soulevee.
  if (!draggedTask) return null;

  const tint = theme.taskColors[draggedTask.color];

  return (
    <Animated.View
      style={[styles.floating, { width: cardWidth }, animatedStyle]}
      pointerEvents="none"
    >
      <View style={[styles.stripe, { backgroundColor: tint.deep }]} />
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {draggedTask.title}
        </Text>
        <PriorityPaws priority={draggedTask.priority} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create((theme) => ({
  floating: {
    position: 'absolute',
    top: 0,
    left: 0,
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    boxShadow: theme.shadow.lifted,
    overflow: 'hidden',
    zIndex: 30,
  },
  stripe: {
    width: 7,
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
  },
}));
