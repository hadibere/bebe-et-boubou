/**
 * LE CALENDRIER — arithmetique des dates, rien d'autre.
 *
 * Aucun composant, aucun style. Ces fonctions se lisent et se verifient
 * seules, ce qui est precieux : les bugs de calendrier sont sournois
 * (changements de mois, annees bissextiles, semaines a cheval).
 */

/** Libelles des jours, semaine commencant le LUNDI comme en France. */
export const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const;

/**
 * Position du jour dans une semaine commencant le lundi.
 * `getDay()` renvoie 0 pour dimanche : il faut donc decaler.
 */
export function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Mois precedent ou suivant, en gardant le 1er du mois (evite le piege du 31). */
export function shiftMonth(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

/**
 * La grille du mois : des semaines de 7 cases, `null` pour les cases vides
 * avant le 1er et apres le dernier jour.
 */
export function monthGrid(month: Date): (Date | null)[][] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

  const cells: (Date | null)[] = [];

  // Cases vides jusqu'au premier jour du mois.
  for (let i = 0; i < weekdayIndex(first); i += 1) cells.push(null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day));
  }

  // On complete la derniere semaine.
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** « octobre 2026 », pour l'en-tete du calendrier. */
export function formatMonth(month: Date): string {
  return month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

/** Combine un jour et une heure en un seul instant. */
export function combine(day: Date, hours: number, minutes: number): Date {
  const result = new Date(day);
  result.setHours(hours, minutes, 0, 0);
  return result;
}
