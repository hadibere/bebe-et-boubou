import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { Chip } from '@/components/ui/Chip';
import { PawPrint } from '@/components/ui/PawPrint';
import { PriorityPaws } from '@/components/ui/PriorityPaws';
import { CURRENT_MEMBER_ID, MEMBERS } from '@/domain/member';
import {
  PRIORITY_LABELS,
  STATUS_EMOJI,
  STATUS_LABELS,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Task,
  type TaskColor,
  type TaskDraft,
  type TaskPriority,
  type TaskStatus,
} from '@/domain/task';
import { ColorPicker } from './ColorPicker';

interface TaskFormProps {
  /** Absent = creation. Present = modification. */
  initialTask?: Task;
  title: string;
  submitLabel: string;
  onSubmit: (draft: TaskDraft) => void;
  onDelete?: () => void;
}

/**
 * UN seul formulaire pour creer ET modifier.
 *
 * La difference tient a une prop : si `initialTask` est fourni les champs
 * sont pre-remplis, sinon on part des valeurs par defaut. C'est ce qui evite
 * d'avoir deux ecrans presque identiques a maintenir en parallele.
 */
export function TaskForm({ initialTask, title: heading, submitLabel, onSubmit, onDelete }: TaskFormProps) {
  const { theme } = useUnistyles();

  const [title, setTitle] = useState(initialTask?.title ?? '');
  const [notes, setNotes] = useState(initialTask?.notes ?? '');
  const [priority, setPriority] = useState<TaskPriority>(initialTask?.priority ?? 'medium');
  const [color, setColor] = useState<TaskColor>(initialTask?.color ?? 'rose');
  const [assigneeId, setAssigneeId] = useState<string | null>(initialTask?.assigneeId ?? null);
  const [status, setStatus] = useState<TaskStatus>(initialTask?.status ?? 'todo');

  const trimmedTitle = title.trim();
  const canSubmit = trimmedTitle.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;

    onSubmit({
      title: trimmedTitle,
      notes: notes.trim() || undefined,
      priority,
      color,
      assigneeId,
      status,
      createdBy: initialTask?.createdBy ?? CURRENT_MEMBER_ID,
    });
  };

  return (
    // `collapsable={false}` n'est pas cosmetique : RNScreens n'accepte que
    // deux vues enfants dans une form sheet contenant une zone de defilement,
    // et React Native "aplatit" les vues sans style propre. Sans ce drapeau,
    // l'en-tete disparait de la mise en page et le contenu passe dessous.
    <View style={styles.root} collapsable={false}>
      <View style={styles.header} collapsable={false}>
        <Text style={styles.heading}>{heading}</Text>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        // Mecanisme iOS natif : la zone de defilement se retracte d'elle-meme
        // de la hauteur du clavier. Aucun calcul a faire, et ca marche dans
        // une feuille modale la ou KeyboardAvoidingView echoue.
        automaticallyAdjustKeyboardInsets
        // Faire glisser la liste referme le clavier.
        keyboardDismissMode="on-drag"
      >
        <Field label="C’est quoi la tâche ?">
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Sortir la poubelle…"
            placeholderTextColor={theme.colors.textFaint}
            style={styles.titleInput}
            autoFocus={!initialTask}
            returnKeyType="next"
            maxLength={120}
          />
        </Field>

        <Field label="Un petit détail ? (facultatif)">
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Ajoute une précision"
            placeholderTextColor={theme.colors.textFaint}
            style={styles.notesInput}
            multiline
            maxLength={200}
          />
        </Field>

        <Field label="C’est urgent ?">
          <View style={styles.chipRow}>
            {TASK_PRIORITIES.map((value) => (
              <Chip
                key={value}
                label={PRIORITY_LABELS[value]}
                selected={value === priority}
                onPress={() => setPriority(value)}
                softColor={theme.priorityColors[value].soft}
                deepColor={theme.priorityColors[value].deep}
                leading={<PriorityPaws priority={value} size={11} />}
              />
            ))}
          </View>
        </Field>

        <Field label="Quelle couleur ?">
          <ColorPicker value={color} onChange={setColor} />
        </Field>

        <Field label="Pour qui ?">
          <View style={styles.chipRow}>
            {MEMBERS.map((member) => (
              <Chip
                key={member.id}
                label={member.name}
                selected={member.id === assigneeId}
                onPress={() => setAssigneeId(member.id)}
                softColor={theme.taskColors[member.color].soft}
                deepColor={theme.taskColors[member.color].deep}
                leading={<Text style={styles.chipEmoji}>{member.avatar}</Text>}
              />
            ))}
            <Chip
              label="Nous deux"
              selected={assigneeId === null}
              onPress={() => setAssigneeId(null)}
              softColor={theme.colors.primarySoft}
              deepColor={theme.colors.primary}
              leading={<Text style={styles.chipEmoji}>🤝</Text>}
            />
          </View>
        </Field>

        <Field label="Dans quelle colonne ?">
          <View style={styles.chipRow}>
            {TASK_STATUSES.map((value) => (
              <Chip
                key={value}
                label={STATUS_LABELS[value]}
                selected={value === status}
                onPress={() => setStatus(value)}
                softColor={theme.statusColors[value].soft}
                deepColor={theme.statusColors[value].deep}
                leading={<Text style={styles.chipEmoji}>{STATUS_EMOJI[value]}</Text>}
              />
            ))}
          </View>
        </Field>

        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={[styles.submit, !canSubmit && styles.submitDisabled]}
        >
          <PawPrint size={22} color={theme.colors.onAccent} />
          <Text style={styles.submitLabel}>{submitLabel}</Text>
        </Pressable>

        {onDelete ? (
          <Pressable onPress={onDelete} style={styles.deleteButton}>
            <Text style={styles.deleteLabel}>Supprimer cette tâche</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

/** Un intitule au-dessus de son champ — evite de repeter la meme structure 6 fois. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    // Fond opaque indispensable : l'en-tete est fixe au-dessus d'une zone
    // qui defile, sans quoi le contenu se voit par transparence.
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  heading: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.xl,
    color: theme.colors.text,
  },
  content: {
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: Math.max(rt.insets.bottom, theme.spacing.xl),
    gap: theme.spacing.xl,
  },
  field: {
    gap: theme.spacing.md,
  },
  fieldLabel: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
  titleInput: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.lg,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  notesInput: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chipEmoji: {
    fontSize: theme.fontSize.md,
  },
  deleteButton: {
    alignSelf: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  deleteLabel: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.sm,
    color: theme.priorityColors.high.deep,
  },
  submit: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    paddingVertical: theme.spacing.lg,
    boxShadow: theme.shadow.card,
  },
  submitDisabled: {
    opacity: 0.4,
  },
  submitLabel: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.md,
    color: theme.colors.onAccent,
  },
}));
