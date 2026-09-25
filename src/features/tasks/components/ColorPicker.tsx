import { Pressable, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { PawPrint } from '@/components/ui/PawPrint';
import { TASK_COLORS, type TaskColor } from '@/domain/task';
import { haptics } from '@/lib/haptics';
import { motion } from '@/theme/tokens';

interface ColorPickerProps {
  value: TaskColor;
  onChange: (color: TaskColor) => void;
}

/** Les six pastilles de couleur. La choisie grossit et affiche une patte. */
export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <View style={styles.row}>
      {TASK_COLORS.map((color) => (
        <Swatch
          key={color}
          color={color}
          selected={color === value}
          onPress={() => onChange(color)}
        />
      ))}
    </View>
  );
}

function Swatch({
  color,
  selected,
  onPress,
}: {
  color: TaskColor;
  selected: boolean;
  onPress: () => void;
}) {
  const { theme } = useUnistyles();
  const tint = theme.taskColors[color];

  const progress = useDerivedValue(() => withSpring(selected ? 1 : 0, motion.springBouncy), [
    selected,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 1.15]) }],
    borderWidth: interpolate(progress.value, [0, 1], [0, 3]),
  }));

  const pawStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: progress.value }],
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
      <Animated.View
        style={[styles.swatch, { backgroundColor: tint.soft, borderColor: tint.deep }, animatedStyle]}
      >
        <Animated.View style={pawStyle}>
          <PawPrint size={18} color={tint.deep} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    flexWrap: 'wrap',
  },
  swatch: {
    width: 46,
    height: 46,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
