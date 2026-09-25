import type { ReactNode } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { haptics } from '@/lib/haptics';
import { motion } from '@/theme/tokens';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Teinte pastel du fond quand la pastille est choisie. */
  softColor: string;
  /** Teinte soutenue du texte et de la bordure quand elle est choisie. */
  deepColor: string;
  /** Petit visuel a gauche du texte : emoji ou empreintes de patte. */
  leading?: ReactNode;
}

/**
 * La pastille a choix unique, utilisee pour l'importance, la personne
 * assignee et la colonne. Un seul composant pour les trois : si on change
 * l'animation ou l'arrondi, les trois champs suivent.
 */
export function Chip({ label, selected, onPress, softColor, deepColor, leading }: ChipProps) {
  const { theme } = useUnistyles();

  const idleBg = theme.colors.surface;
  const idleBorder = theme.colors.border;
  const idleText = theme.colors.textMuted;

  // `useDerivedValue` avec dependances : la valeur se recalcule quand `selected`
  // change, sans qu'on ait a modifier une valeur partagee a la main.
  const progress = useDerivedValue(
    () => withSpring(selected ? 1 : 0, motion.spring),
    [selected],
  );

  const pillStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [idleBg, softColor]),
    borderColor: interpolateColor(progress.value, [0, 1], [idleBorder, deepColor]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 1.04]) }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [idleText, deepColor]),
  }));

  return (
    <Pressable
      onPress={() => {
        haptics.select();
        onPress();
      }}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <Animated.View style={[styles.pill, pillStyle]}>
        {leading}
        <Animated.Text style={[styles.label, labelStyle]}>{label}</Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.pill,
    borderWidth: 1.5,
  },
  label: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.sm,
  },
}));
