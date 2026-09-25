import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

import {
  TASK_COLORS,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Task,
  type TaskColor,
  type TaskDraft,
  type TaskPriority,
  type TaskStatus,
} from '@/domain/task';

/**
 * Traduction entre le document Firestore et notre type `Task`.
 *
 * Deux differences a gerer, et c'est tout l'interet d'avoir ce fichier :
 *
 * 1. Firestore refuse `undefined`. Une note absente s'ecrit donc `null` en
 *    base, alors que le domaine prefere `undefined` (champ optionnel).
 * 2. Ce qui vient du reseau n'est pas digne de confiance. Un document
 *    malforme — champ oublie, valeur d'un ancien schema — ne doit pas faire
 *    planter l'app : on retombe sur une valeur par defaut.
 */

/** Verifie qu'une valeur fait bien partie d'une liste connue. */
function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

export function taskFromDocument(snapshot: QueryDocumentSnapshot<DocumentData>): Task {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    title: typeof data.title === 'string' ? data.title : '(sans titre)',
    notes: typeof data.notes === 'string' && data.notes.length > 0 ? data.notes : undefined,
    status: oneOf<TaskStatus>(data.status, TASK_STATUSES, 'todo'),
    priority: oneOf<TaskPriority>(data.priority, TASK_PRIORITIES, 'medium'),
    color: oneOf<TaskColor>(data.color, TASK_COLORS, 'rose'),
    assigneeId: typeof data.assigneeId === 'string' ? data.assigneeId : null,
    createdBy: typeof data.createdBy === 'string' ? data.createdBy : '',
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : 0,
    order: typeof data.order === 'number' ? data.order : 0,
  };
}

/** Le brouillon du formulaire, pret a etre ecrit dans Firestore. */
export function draftToDocument(draft: TaskDraft, order: number) {
  return {
    title: draft.title,
    // `null` et non `undefined` : Firestore rejette undefined.
    notes: draft.notes ?? null,
    status: draft.status,
    priority: draft.priority,
    color: draft.color,
    assigneeId: draft.assigneeId,
    createdBy: draft.createdBy,
    order,
  };
}
