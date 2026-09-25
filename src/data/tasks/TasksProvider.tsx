import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from '@/data/auth/AuthProvider';
import { db } from '@/data/firebase/app';
import { useMembers } from '@/data/members/MembersProvider';
import {
  alertsForCreatedTask,
  alertsForMovedTask,
  alertsForUpdatedTask,
} from '@/data/notifications/taskAlerts';
import { sendPushMessages, type PushMessage } from '@/data/notifications/push';
import { nextOrderIn, type Task, type TaskDraft, type TaskStatus } from '@/domain/task';
import { draftToDocument, taskFromDocument } from './mapping';

/**
 * LE CONTRAT entre l'interface et les donnees.
 *
 * Tout l'ecran de tableau et tous les formulaires ne connaissent QUE ces
 * fonctions. Ils ignorent totalement d'ou viennent les taches — et c'est
 * exactement ce qui a permis de passer d'un tableau en memoire a Firestore
 * sans toucher une seule ligne de composant.
 */
interface TasksContextValue {
  tasks: Task[];
  /** Vrai tant que la premiere reponse de Firestore n'est pas arrivee. */
  isLoading: boolean;
  getTask: (id: string) => Task | undefined;
  createTask: (draft: TaskDraft) => void;
  updateTask: (id: string, draft: TaskDraft) => void;
  deleteTask: (id: string) => void;
  /** Raccourci utilise par le glisser-deposer. */
  moveTask: (id: string, status: TaskStatus) => void;
}

const TasksContext = createContext<TasksContextValue | null>(null);

/** Toutes les taches du foyer vivent dans une seule collection. */
const TASKS_COLLECTION = 'tasks';

/** Constante partagee : evite de recreer un tableau vide a chaque rendu. */
const NO_TASKS: Task[] = [];

/**
 * Les ecritures sont volontairement "tire et oublie" : on ne fait pas
 * attendre l'interface. Firestore mémorise les modifications hors ligne et
 * les rejoue a la reconnexion, et il met a jour son cache local
 * immediatement — la carte apparait donc instantanement a l'ecran.
 *
 * Un echec ici signifie presque toujours une regle de securite qui refuse
 * l'operation : on veut le voir passer dans les logs, pas l'ignorer.
 */
function reportWriteFailure(operation: string) {
  return (error: unknown) => {
    console.warn(`[tasks] ${operation} a échoué :`, error);
  };
}

/**
 * Envoie les notifications sans jamais bloquer l'interface ni faire echouer
 * l'action. Une notification perdue est genante ; une tache non enregistree
 * le serait beaucoup plus.
 */
function notify(messages: PushMessage[]) {
  sendPushMessages(messages).catch((error) => {
    console.warn('[push] envoi impossible :', error);
  });
}

export function TasksProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { members } = useMembers();

  /**
   * On memorise POUR QUEL utilisateur les taches ont ete recues.
   *
   * Sans cette precaution, se deconnecter puis se reconnecter avec l'autre
   * compte afficherait un instant les taches du precedent. Et cela permet
   * de deduire `tasks` et `isLoading` pendant le rendu plutot que de les
   * recalculer dans un effet, ce qui provoquerait un rendu de trop.
   */
  const [received, setReceived] = useState<{ userId: string; tasks: Task[] } | null>(null);

  useEffect(() => {
    // Pas de session : aucune ecoute a ouvrir, les regles la refuseraient.
    if (!user) return;

    const userId = user.uid;

    /**
     * `onSnapshot` est ce qui rend l'app collaborative : quand Boubou cree
     * une tache sur son iPhone, ce callback se declenche sur celui de Bebe
     * en une fraction de seconde. Aucun rafraichissement manuel nulle part.
     */
    const unsubscribe = onSnapshot(
      collection(db, TASKS_COLLECTION),
      (snapshot) => {
        setReceived({ userId, tasks: snapshot.docs.map(taskFromDocument) });
      },
      (error) => {
        console.warn('[tasks] écoute interrompue :', error);
        // On sort quand meme de l'attente : mieux vaut un tableau vide
        // qu'un chargement qui tourne indefiniment.
        setReceived({ userId, tasks: [] });
      },
    );

    return unsubscribe;
  }, [user]);

  // Deduit pendant le rendu, jamais dans un effet.
  const isForCurrentUser = user !== null && received?.userId === user.uid;
  const tasks = isForCurrentUser && received ? received.tasks : NO_TASKS;
  const isLoading = user !== null && !isForCurrentUser;

  const getTask = useCallback((id: string) => tasks.find((task) => task.id === id), [tasks]);

  const createTask = useCallback(
    (draft: TaskDraft) => {
      const order = nextOrderIn(tasks, draft.status);
      const actorId = user?.uid;

      addDoc(collection(db, TASKS_COLLECTION), {
        ...draftToDocument(draft, order),
        createdAt: Date.now(),
      })
        .then((created) => {
          // On attend l'ecriture pour disposer du vrai identifiant :
          // c'est lui qui permet d'ouvrir la tache en tapant la notification.
          if (actorId) {
            notify(alertsForCreatedTask(draft, created.id, actorId, members));
          }
        })
        .catch(reportWriteFailure('création'));
    },
    [tasks, user, members],
  );

  const updateTask = useCallback(
    (id: string, draft: TaskDraft) => {
      const current = tasks.find((task) => task.id === id);

      // Si la tache change de colonne, elle repart en bas de sa nouvelle pile.
      const order =
        current && current.status !== draft.status
          ? nextOrderIn(tasks, draft.status)
          : (current?.order ?? 0);

      const actorId = user?.uid;

      updateDoc(doc(db, TASKS_COLLECTION, id), draftToDocument(draft, order))
        .then(() => {
          if (actorId && current) {
            notify(alertsForUpdatedTask(current, draft, actorId, members));
          }
        })
        .catch(reportWriteFailure('modification'));
    },
    [tasks, user, members],
  );

  const deleteTask = useCallback((id: string) => {
    deleteDoc(doc(db, TASKS_COLLECTION, id)).catch(reportWriteFailure('suppression'));
  }, []);

  const moveTask = useCallback(
    (id: string, status: TaskStatus) => {
      const moved = tasks.find((task) => task.id === id);
      const actorId = user?.uid;

      updateDoc(doc(db, TASKS_COLLECTION, id), {
        status,
        order: nextOrderIn(tasks, status),
      })
        .then(() => {
          if (actorId && moved) {
            notify(alertsForMovedTask(moved, status, actorId, members));
          }
        })
        .catch(reportWriteFailure('déplacement'));
    },
    [tasks, user, members],
  );

  const value = useMemo<TasksContextValue>(
    () => ({ tasks, isLoading, getTask, createTask, updateTask, deleteTask, moveTask }),
    [tasks, isLoading, getTask, createTask, updateTask, deleteTask, moveTask],
  );

  return <TasksContext value={value}>{children}</TasksContext>;
}

/** Le seul point d'acces aux taches depuis l'interface. */
export function useTasks(): TasksContextValue {
  const context = use(TasksContext);

  if (!context) {
    throw new Error('useTasks doit être utilisé à l’intérieur de <TasksProvider>.');
  }

  return context;
}
