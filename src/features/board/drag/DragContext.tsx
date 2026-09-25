import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

import type { Task } from '@/domain/task';

/**
 * L'etat partage du glisser-deposer.
 *
 * Deux natures de donnees cohabitent, et c'est volontaire :
 *
 * - les valeurs partagees (`x`, `y`, `hoveredIndex`) vivent sur le thread UI.
 *   Elles changent a chaque image pendant le geste, donc elles ne doivent
 *   surtout PAS passer par un re-rendu React.
 * - `draggedTask` est un etat React classique : il ne change que deux fois
 *   par geste (debut et fin) et sert a afficher le contenu de la carte
 *   flottante, ce qui demande du rendu.
 */
interface DragContextValue {
  /** Position absolue du doigt, en points, mise a jour a chaque image. */
  x: SharedValue<number>;
  y: SharedValue<number>;
  /** Colonne survolee dans la barre de depot. -1 = aucune. */
  hoveredIndex: SharedValue<number>;
  /**
   * Les valeurs partagees ne se modifient QUE par ces deux fonctions.
   *
   * Ce n'est pas un caprice de style : le compilateur React interdit de muter
   * une valeur renvoyee par un hook depuis un autre composant. En definissant
   * les ecritures ici, la ou les valeurs sont creees, la regle est respectee
   * et on gagne un point d'entree unique, plus facile a suivre.
   *
   * Ce sont des "worklets" : ils s'executent sur le thread UI.
   */
  movePointer: (px: number, py: number) => void;
  setHovered: (index: number) => void;
  /** La tache actuellement soulevee, ou null. */
  draggedTask: Task | null;
  beginDrag: (task: Task) => void;
  endDrag: () => void;
}

const DragContext = createContext<DragContextValue | null>(null);

export function DragProvider({ children }: { children: ReactNode }) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const hoveredIndex = useSharedValue(-1);

  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  /*
   * Les `eslint-disable` ci-dessous sont assumes.
   *
   * La regle `react-hooks/immutability` du compilateur React interdit de muter
   * une valeur issue d'un hook. Or affecter `.value` EST l'API de Reanimated :
   * c'est ainsi qu'on ecrit dans une valeur partagee, et il n'existe pas
   * d'alternative. La regle ne connait simplement pas Reanimated.
   *
   * On ne la neutralise donc que sur ces trois lignes, et uniquement dans ce
   * fichier : c'est le seul de l'app autorise a ecrire dans l'etat du geste.
   */
  const movePointer = useCallback(
    (px: number, py: number) => {
      'worklet';
      // eslint-disable-next-line react-hooks/immutability
      x.value = px;
      // eslint-disable-next-line react-hooks/immutability
      y.value = py;
    },
    [x, y],
  );

  const setHovered = useCallback(
    (index: number) => {
      'worklet';
      // eslint-disable-next-line react-hooks/immutability
      hoveredIndex.value = index;
    },
    [hoveredIndex],
  );

  const beginDrag = useCallback((task: Task) => setDraggedTask(task), []);
  const endDrag = useCallback(() => setDraggedTask(null), []);

  const value = useMemo<DragContextValue>(
    () => ({ x, y, hoveredIndex, movePointer, setHovered, draggedTask, beginDrag, endDrag }),
    [x, y, hoveredIndex, movePointer, setHovered, draggedTask, beginDrag, endDrag],
  );

  return <DragContext value={value}>{children}</DragContext>;
}

export function useDrag(): DragContextValue {
  const context = use(DragContext);

  if (!context) {
    throw new Error('useDrag doit être utilisé à l’intérieur de <DragProvider>.');
  }

  return context;
}

/** Hauteur de la barre de depot, hors encoche. Partagee entre la barre et le calcul de survol. */
export const DROP_BAR_HEIGHT = 78;
