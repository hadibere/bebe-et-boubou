import { createContext, use, useCallback, useMemo, useReducer, type ReactNode } from 'react';

import { MOCK_TASKS } from '@/data/mock/tasks';
import { nextOrderIn, type Task, type TaskDraft, type TaskStatus } from '@/domain/task';

/**
 * LE CONTRAT entre l'interface et les donnees.
 *
 * Tout l'ecran de tableau et tous les formulaires ne connaissent QUE ces
 * cinq fonctions. Ils ignorent totalement d'ou viennent les taches.
 *
 * A l'etape 4, on remplacera l'implementation ci-dessous par un abonnement
 * temps reel a Firestore — et pas une seule ligne de composant ne bougera.
 */
interface TasksContextValue {
  tasks: Task[];
  getTask: (id: string) => Task | undefined;
  createTask: (draft: TaskDraft) => void;
  updateTask: (id: string, draft: TaskDraft) => void;
  deleteTask: (id: string) => void;
  /** Raccourci pour le glisser-deposer de l'etape 3. */
  moveTask: (id: string, status: TaskStatus) => void;
}

const TasksContext = createContext<TasksContextValue | null>(null);

/* --------------------------------- Reducer ---------------------------------- */

type TasksAction =
  | { type: 'create'; draft: TaskDraft }
  | { type: 'update'; id: string; draft: TaskDraft }
  | { type: 'delete'; id: string }
  | { type: 'move'; id: string; status: TaskStatus };

/**
 * Un reducer plutot que plusieurs useState : toutes les facons de modifier
 * la liste sont rassemblees ici, donc il n'y a qu'un seul endroit a lire
 * pour comprendre ce qui peut arriver aux taches.
 */
function tasksReducer(tasks: Task[], action: TasksAction): Task[] {
  switch (action.type) {
    case 'create':
      return [
        ...tasks,
        {
          ...action.draft,
          id: createLocalId(),
          createdAt: Date.now(),
          order: nextOrderIn(tasks, action.draft.status),
        },
      ];

    case 'update':
      return tasks.map((task) => {
        if (task.id !== action.id) return task;

        // Si la tache change de colonne, elle repart en bas de sa nouvelle pile.
        const changedColumn = task.status !== action.draft.status;

        return {
          ...task,
          ...action.draft,
          order: changedColumn ? nextOrderIn(tasks, action.draft.status) : task.order,
        };
      });

    case 'delete':
      return tasks.filter((task) => task.id !== action.id);

    case 'move':
      return tasks.map((task) =>
        task.id === action.id
          ? { ...task, status: action.status, order: nextOrderIn(tasks, action.status) }
          : task,
      );
  }
}

/**
 * Identifiant local. Firestore generera les siens a l'etape 4 ;
 * en attendant, horodatage + suffixe aleatoire suffit largement a deux.
 */
function createLocalId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/* -------------------------------- Fournisseur ------------------------------- */

export function TasksProvider({ children }: { children: ReactNode }) {
  // Etape 4 : MOCK_TASKS disparait, remplace par onSnapshot() sur Firestore.
  const [tasks, dispatch] = useReducer(tasksReducer, MOCK_TASKS);

  const getTask = useCallback((id: string) => tasks.find((task) => task.id === id), [tasks]);

  const value = useMemo<TasksContextValue>(
    () => ({
      tasks,
      getTask,
      createTask: (draft) => dispatch({ type: 'create', draft }),
      updateTask: (id, draft) => dispatch({ type: 'update', id, draft }),
      deleteTask: (id) => dispatch({ type: 'delete', id }),
      moveTask: (id, status) => dispatch({ type: 'move', id, status }),
    }),
    [tasks, getTask],
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
