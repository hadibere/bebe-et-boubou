import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import {
  combine,
  formatMonth,
  isSameDay,
  monthGrid,
  shiftMonth,
  startOfDay,
  WEEKDAY_LABELS,
} from '@/domain/calendar';
import { haptics } from '@/lib/haptics';

interface ReminderPickerProps {
  /** L'instant actuellement choisi. */
  value: Date;
  onChange: (next: Date) => void;
}

/** Minutes proposees, par pas de 5 : suffisant pour un rappel. */
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);
const HOURS = Array.from({ length: 24 }, (_, i) => i);

/**
 * Choix precis du jour et de l'heure, ecrit entierement en JavaScript.
 *
 * Pourquoi pas le selecteur iOS natif : c'est un module natif, donc chaque
 * evolution imposerait un build complet et un passage par TestFlight. Ici
 * tout se livre en mise a jour immediate — et l'apparence suit le theme de
 * l'app au lieu de trancher avec.
 */
export function ReminderPicker({ value, onChange }: ReminderPickerProps) {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(value));

  const today = startOfDay(new Date());
  const weeks = monthGrid(visibleMonth);

  const pickDay = (day: Date) => {
    haptics.select();
    onChange(combine(day, value.getHours(), value.getMinutes()));
  };

  const pickHour = (hour: number) => {
    haptics.select();
    onChange(combine(value, hour, value.getMinutes()));
  };

  const pickMinute = (minute: number) => {
    haptics.select();
    onChange(combine(value, value.getHours(), minute));
  };

  return (
    <View style={styles.container}>
      {/* --- En-tete du mois --- */}
      <View style={styles.monthHeader}>
        <Pressable
          onPress={() => setVisibleMonth(shiftMonth(visibleMonth, -1))}
          style={styles.arrow}
          accessibilityLabel="Mois précédent"
        >
          <Text style={styles.arrowText}>‹</Text>
        </Pressable>

        <Text style={styles.monthLabel}>{formatMonth(visibleMonth)}</Text>

        <Pressable
          onPress={() => setVisibleMonth(shiftMonth(visibleMonth, 1))}
          style={styles.arrow}
          accessibilityLabel="Mois suivant"
        >
          <Text style={styles.arrowText}>›</Text>
        </Pressable>
      </View>

      {/* --- Jours de la semaine --- */}
      <View style={styles.weekRow}>
        {WEEKDAY_LABELS.map((label, index) => (
          <Text key={index} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>

      {/* --- Grille du mois --- */}
      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.weekRow}>
          {week.map((day, dayIndex) => {
            if (!day) return <View key={dayIndex} style={styles.dayCell} />;

            const selected = isSameDay(day, value);
            // Un rappel dans le passe ne se declencherait jamais.
            const past = day < today;

            return (
              <Pressable
                key={dayIndex}
                onPress={() => pickDay(day)}
                disabled={past}
                style={styles.dayCell}
              >
                <View style={[styles.dayBubble, selected && styles.dayBubbleSelected]}>
                  <Text
                    style={[
                      styles.dayText,
                      selected && styles.dayTextSelected,
                      past && styles.dayTextPast,
                    ]}
                  >
                    {day.getDate()}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}

      {/* --- Heure --- */}
      <Text style={styles.sectionLabel}>Heure</Text>
      <NumberStrip
        values={HOURS}
        selected={value.getHours()}
        onSelect={pickHour}
      />

      {/* --- Minutes --- */}
      <Text style={styles.sectionLabel}>Minutes</Text>
      <NumberStrip
        values={MINUTES}
        selected={value.getMinutes()}
        onSelect={pickMinute}
      />
    </View>
  );
}

/** Largeur fixe d'une pastille, marge comprise. Elle rend le calcul de
 *  defilement exact — une largeur automatique le rendrait approximatif. */
const CHIP_PITCH = 56;

function NumberStrip({
  values,
  selected,
  onSelect,
}: {
  values: number[];
  selected: number;
  onSelect: (value: number) => void;
}) {
  const index = values.indexOf(selected);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.strip}
      /**
       * Positionne la bande sur la valeur choisie des l'ouverture.
       * Sans ca, un rappel a 17 h s'ouvrait sur « 00 » et il fallait
       * faire defiler a l'aveugle pour retrouver sa propre selection.
       * On recule de deux pastilles pour montrer un peu de contexte.
       */
      contentOffset={{ x: Math.max(0, (index - 2) * CHIP_PITCH), y: 0 }}
    >
      {values.map((entry) => (
        <Pressable key={entry} onPress={() => onSelect(entry)}>
          <View style={[styles.numberChip, entry === selected && styles.numberChipSelected]}>
            <Text style={[styles.numberText, entry === selected && styles.numberTextSelected]}>
              {String(entry).padStart(2, '0')}
            </Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  arrow: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
  },
  arrowText: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.xl,
    color: theme.colors.primary,
    lineHeight: 28,
  },
  monthLabel: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    textTransform: 'capitalize',
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.xs,
    color: theme.colors.textFaint,
    paddingBottom: theme.spacing.xs,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
  },
  dayBubble: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBubbleSelected: {
    backgroundColor: theme.taskColors.lavender.deep,
  },
  dayText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
  dayTextSelected: {
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.onAccent,
  },
  dayTextPast: {
    color: theme.colors.textFaint,
  },
  sectionLabel: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
  },
  strip: {
    flexGrow: 0,
  },
  numberChip: {
    // Largeur fixe : voir CHIP_PITCH, le calcul de defilement en depend.
    width: 52,
    paddingVertical: theme.spacing.sm,
    marginRight: 4,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
  },
  numberChipSelected: {
    backgroundColor: theme.taskColors.lavender.deep,
  },
  numberText: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
  numberTextSelected: {
    color: theme.colors.onAccent,
  },
}));
