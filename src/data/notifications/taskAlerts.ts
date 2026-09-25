import type { Member } from '@/domain/member';
import type { Task, TaskDraft, TaskStatus } from '@/domain/task';
import type { PushMessage } from './push';

/**
 * QUI prevenir, et avec QUEL texte.
 *
 * Ces fonctions sont volontairement pures : elles ne connaissent ni
 * Firestore, ni le reseau, ni React. On peut donc raisonner dessus — et
 * plus tard les tester — sans rien simuler.
 */

/** On ne se previent jamais soi-meme, et on ignore ceux sans jeton. */
function recipients(members: Member[], actorId: string): Member[] {
  return members.filter((member) => member.id !== actorId && Boolean(member.pushToken));
}

function actorLabel(members: Member[], actorId: string): string {
  const actor = members.find((member) => member.id === actorId);
  return actor ? `${actor.avatar} ${actor.name}` : 'Quelqu’un';
}

/** Une tache vient d'etre creee : on previent l'autre. */
export function alertsForCreatedTask(
  draft: TaskDraft,
  taskId: string,
  actorId: string,
  members: Member[],
): PushMessage[] {
  const label = actorLabel(members, actorId);

  return recipients(members, actorId).map((member) => ({
    to: member.pushToken!,
    title: `${label} a ajouté une tâche`,
    // Si elle lui est assignee, autant le dire tout de suite :
    // c'est l'information qui declenche une action.
    body: draft.assigneeId === member.id ? `${draft.title} · pour toi` : draft.title,
    data: { taskId },
  }));
}

/**
 * Une tache existante a ete modifiee. Deux evenements meritent une alerte,
 * et ils peuvent se produire en meme temps.
 */
export function alertsForUpdatedTask(
  before: Task,
  after: TaskDraft,
  actorId: string,
  members: Member[],
): PushMessage[] {
  const label = actorLabel(members, actorId);
  const messages: PushMessage[] = [];

  for (const member of recipients(members, actorId)) {
    // 1. La tache vient de lui etre attribuee.
    if (after.assigneeId === member.id && before.assigneeId !== member.id) {
      messages.push({
        to: member.pushToken!,
        title: `${label} t’a assigné une tâche`,
        body: after.title,
        data: { taskId: before.id },
      });
    }

    // 2. Elle vient de passer en « Bloqué » : l'autre attend peut-etre dessus.
    if (after.status === 'blocked' && before.status !== 'blocked') {
      messages.push({
        to: member.pushToken!,
        title: '🙀 Une tâche est bloquée',
        body: `${label} a bloqué « ${after.title} »`,
        data: { taskId: before.id },
      });
    }
  }

  return messages;
}

/** Deplacement par glisser-deposer : seul le passage en « Bloqué » alerte. */
export function alertsForMovedTask(
  task: Task,
  nextStatus: TaskStatus,
  actorId: string,
  members: Member[],
): PushMessage[] {
  if (nextStatus !== 'blocked' || task.status === 'blocked') {
    return [];
  }

  const label = actorLabel(members, actorId);

  return recipients(members, actorId).map((member) => ({
    to: member.pushToken!,
    title: '🙀 Une tâche est bloquée',
    body: `${label} a bloqué « ${task.title} »`,
    data: { taskId: task.id },
  }));
}
