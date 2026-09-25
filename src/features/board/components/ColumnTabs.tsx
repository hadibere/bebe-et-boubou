import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { STATUS_EMOJI, STATUS_LABELS, TASK_STATUSES, type TaskStatus } from '@/domain/task';

interface ColumnTabsProps {
  /** Position horizontale du tableau, en pixels. Mise a jour a chaque image. */
  scrollX: SharedValue<number>;
  pageWidth: number;
  counts: Record<TaskStatus, number>;
  onSelect: (index: number) => void;
}

export function ColumnTabs({ scrollX, pageWidth, counts, onSelect }: ColumnTabsProps) {
  const tabsRef = useAnimatedRef<Animated.ScrollView>();

  // Les 4 onglets sont plus larges que l'ecran : on les fait defiler tout seuls
  // pour que l'onglet actif reste toujours visible. De simples etats suffisent,
  // ces deux mesures ne changent qu'a la rotation ou au montage.
  const [contentWidth, setContentWidth] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);

  const maxOffset = Math.max(0, contentWidth - viewportWidth);

  useAnimatedReaction(
    () => scrollX.value,
    (x) => {
      if (maxOffset === 0) return;

      const lastPage = (TASK_STATUSES.length - 1) * pageWidth;
      const progress = lastPage > 0 ? x / lastPage : 0;
      const clamped = Math.min(Math.max(progress, 0), 1);

      // `scrollTo` s'execute sur le thread UI : la barre suit le doigt sans decalage.
      scrollTo(tabsRef, clamped * maxOffset, 0, false);
    },
    // Le worklet capture `maxOffset` et `pageWidth` : il faut le recreer quand ils changent.
    [maxOffset, pageWidth],
  );

  return (
    <Animated.ScrollView
      ref={tabsRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      // Sans `flexGrow: 0`, une ScrollView horizontale dans un conteneur en colonne
      // s'etire et avale toute la hauteur restante de l'ecran.
      style={styles.scroller}
      contentContainerStyle={styles.row}
      onLayout={(event) => setViewportWidth(event.nativeEvent.layout.width)}
      onContentSizeChange={setContentWidth}
    >
      {TASK_STATUSES.map((status, index) => (
        <Tab
          key={status}
          status={status}
          index={index}
          scrollX={scrollX}
          pageWidth={pageWidth}
          count={counts[status]}
          onPress={() => onSelect(index)}
        />
      ))}
    </Animated.ScrollView>
  );
}

interface TabProps {
  status: TaskStatus;
  index: number;
  scrollX: SharedValue<number>;
  pageWidth: number;
  count: number;
  onPress: () => void;
}

function Tab({ status, index, scrollX, pageWidth, count, onPress }: TabProps) {
  const { theme } = useUnistyles();

  // On capture les couleurs AVANT le worklet : a l'interieur, on ne peut manipuler
  // que des valeurs simples, pas l'objet theme complet.
  const idleBg = theme.colors.surface;
  const activeBg = theme.statusColors[status].soft;
  const idleText = theme.colors.textMuted;
  const activeText = theme.statusColors[status].deep;

  /**
   * L'astuce qui rend le tout fluide : plutot que d'attendre la fin du swipe
   * pour changer l'onglet actif, on calcule a chaque image a quel point CETTE
   * colonne est a l'ecran (0 = absente, 1 = pleinement visible) et on interpole.
   * Resultat : la pastille se colore progressivement pendant que le doigt glisse.
   */
  const inputRange = [(index - 1) * pageWidth, index * pageWidth, (index + 1) * pageWidth];

  const pillStyle = useAnimatedStyle(() => {
    const progress = interpolate(scrollX.value, inputRange, [0, 1, 0], 'clamp');

    return {
      backgroundColor: interpolateColor(progress, [0, 1], [idleBg, activeBg]),
      transform: [{ scale: interpolate(progress, [0, 1], [0.94, 1]) }],
    };
  });

  const textStyle = useAnimatedStyle(() => {
    const progress = interpolate(scrollX.value, inputRange, [0, 1, 0], 'clamp');

    return { color: interpolateColor(progress, [0, 1], [idleText, activeText]) };
  });

  return (
    <Pressable onPress={onPress}>
      <Animated.View style={[styles.pill, pillStyle]}>
        <Text style={styles.emoji}>{STATUS_EMOJI[status]}</Text>
        <Animated.Text style={[styles.label, textStyle]}>{STATUS_LABELS[status]}</Animated.Text>
        <View style={styles.countBubble}>
          <Animated.Text style={[styles.count, textStyle]}>{count}</Animated.Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  scroller: {
    flexGrow: 0,
  },
  row: {
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingLeft: theme.spacing.md,
    paddingRight: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    boxShadow: theme.shadow.soft,
  },
  emoji: {
    fontSize: theme.fontSize.md,
  },
  label: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.sm,
  },
  countBubble: {
    minWidth: 21,
    height: 21,
    paddingHorizontal: 5,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  count: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.xs,
  },
}));
