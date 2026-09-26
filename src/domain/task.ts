/**
 * LE DOMAINE — la definition de ce qu'est une tache.
 *
 * Ce fichier ne connait ni React, ni Firebase, ni les couleurs.
 * C'est volontaire : quand on branchera Firestore, on ne touchera pas a ce fichier,
 * et si un jour on change de base de donnees, il ne bougera pas non plus.
 */

/* ---------------------------------- Statuts --------------------------------- */

/** `as const` + `typeof[number]` : on ecrit la liste UNE fois et le type en decoule. */
export const TASK_STATUSES = ['todo', 'in_progress', 'blocked', 'done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'À faire',
  in_progress: 'En cours',
  blocked: 'Bloqué',
  done: 'Terminé',
};

/** Le petit emoji affiche sur l'onglet de chaque colonne. */
export const STATUS_EMOJI: Record<TaskStatus, string> = {
  todo: '🧶',
  in_progress: '🐾',
  blocked: '🙀',
  done: '😻',
};

/* -------------------------------- Importance -------------------------------- */

export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
};

/** L'importance se lit au nombre d'empreintes de patte : 1, 2 ou 3. */
export const PRIORITY_PAWS: Record<TaskPriority, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

/* ---------------------------------- Couleurs -------------------------------- */

/** Doit correspondre aux cles de `taskColors` dans src/theme/themes.ts. */
export const TASK_COLORS = ['rose', 'lavender', 'mint', 'butter', 'sky', 'peach'] as const;
export type TaskColor = (typeof TASK_COLORS)[number];

/* ---------------------------------- La tache -------------------------------- */

export interface Task {
  id: string;
  title: string;
  /** Detail optionnel, affiche sur une seule ligne dans la carte. */
  notes?: string;
  status: TaskStatus;
  priority: TaskPriority;
  color: TaskColor;
  /** `null` = tache commune, personne n'est assigne. */
  assigneeId: string | null;
  createdBy: string;
  /** Millisecondes (Date.now()). Simple a stocker et a trier. */
  createdAt: number;
  /** Position dans sa colonne — c'est ce que le glisser-deposer modifiera. */
  order: number;
  /**
   * Instant du rappel, en millisecondes. Absent = aucun rappel.
   * Chaque telephone programme sa propre notification locale a partir de la.
   */
  remindAt?: number;
}

/* --------------------------------- Utilitaires ------------------------------ */

/** Les taches d'une colonne, rangees dans l'ordre choisi par l'utilisateur. */
export function tasksForStatus(tasks: Task[], status: TaskStatus): Task[] {
  return tasks.filter((task) => task.status === status).sort((a, b) => a.order - b.order);
}

/** Le compteur affiche sur chaque onglet. */
export function countByStatus(tasks: Task[]): Record<TaskStatus, number> {
  const counts = { todo: 0, in_progress: 0, blocked: 0, done: 0 } as Record<TaskStatus, number>;
  for (const task of tasks) counts[task.status] += 1;
  return counts;
}

/** Position a donner a une tache qui arrive dans une colonne : tout en bas. */
export function nextOrderIn(tasks: Task[], status: TaskStatus): number {
  const orders = tasks.filter((task) => task.status === status).map((task) => task.order);
  return orders.length === 0 ? 0 : Math.max(...orders) + 1;
}

/**
 * Ce qu'on saisit dans le formulaire : une tache SANS les champs
 * que le systeme calcule lui-meme (identifiant, date, position).
 */
export type TaskDraft = Omit<Task, 'id' | 'createdAt' | 'order'>;
