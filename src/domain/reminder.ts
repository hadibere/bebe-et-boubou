/**
 * LES RAPPELS — calcul pur des echeances.
 *
 * Aucune notification, aucun React, aucune base de donnees ici : juste des
 * dates. On peut donc verifier ces regles en les lisant, et les tester plus
 * tard sans rien simuler.
 */

export interface ReminderPreset {
  key: string;
  label: string;
  /** Calcule l'instant du rappel a partir d'un moment donne. */
  resolve: (from: Date) => Date;
}

/** Renvoie une copie de `date` avec l'heure fixee, secondes remises a zero. */
function at(date: Date, hours: number, minutes = 0): Date {
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Les raccourcis proposes dans le formulaire.
 *
 * Regle commune : si l'heure visee est deja passee aujourd'hui, on bascule
 * au jour suivant. Un rappel dans le passe ne se declencherait jamais.
 */
export const REMINDER_PRESETS: ReminderPreset[] = [
  {
    key: 'in1h',
    label: 'Dans 1 h',
    resolve: (from) => new Date(from.getTime() + 60 * 60 * 1000),
  },
  {
    key: 'tonight',
    label: 'Ce soir · 19 h',
    resolve: (from) => {
      const tonight = at(from, 19);
      return tonight > from ? tonight : at(addDays(from, 1), 19);
    },
  },
  {
    key: 'tomorrow',
    label: 'Demain · 9 h',
    resolve: (from) => at(addDays(from, 1), 9),
  },
  {
    key: 'saturday',
    label: 'Samedi · 10 h',
    resolve: (from) => {
      // 6 = samedi. On cherche le prochain, aujourd'hui compris s'il reste du temps.
      const daysUntilSaturday = (6 - from.getDay() + 7) % 7;
      const candidate = at(addDays(from, daysUntilSaturday), 10);
      return candidate > from ? candidate : at(addDays(candidate, 7), 10);
    },
  },
];

/** Le rappel est-il encore a venir ? Un rappel passe ne sert plus a rien. */
export function isUpcoming(remindAt: number, now: number = Date.now()): boolean {
  return remindAt > now;
}

/**
 * Formate une echeance pour l'affichage : « aujourd'hui 19:00 »,
 * « demain 09:00 », ou « sam. 10:00 » au-dela.
 */
export function formatReminder(remindAt: number, now: number = Date.now()): string {
  const target = new Date(remindAt);
  const today = new Date(now);

  const heure = target.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(target, today)) return `aujourd’hui ${heure}`;
  if (sameDay(target, addDays(today, 1))) return `demain ${heure}`;

  const jour = target.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
  return `${jour} ${heure}`;
}
