/**
 * Donnees de demonstration — remplacees par Firestore a l'etape 4.
 *
 * On les isole dans data/mock/ pour qu'il n'y ait qu'un seul fichier a supprimer
 * le jour ou la vraie base arrive.
 */
import type { Task } from '@/domain/task';

const HOUR = 1000 * 60 * 60;
const now = Date.now();

export const MOCK_TASKS: Task[] = [
  {
    id: '1',
    title: 'Réserver le resto de samedi',
    notes: 'Le petit italien du coin 🍝',
    status: 'todo',
    priority: 'high',
    color: 'rose',
    assigneeId: 'boubou',
    createdBy: 'bebe',
    createdAt: now - 2 * HOUR,
    order: 0,
  },
  {
    id: '2',
    title: 'Acheter la litière',
    status: 'todo',
    priority: 'medium',
    color: 'sky',
    assigneeId: 'bebe',
    createdBy: 'boubou',
    createdAt: now - 5 * HOUR,
    order: 1,
  },
  {
    id: '3',
    title: 'Appeler le vétérinaire',
    notes: 'Rappel des vaccins',
    status: 'todo',
    priority: 'low',
    color: 'mint',
    assigneeId: null,
    createdBy: 'bebe',
    createdAt: now - 26 * HOUR,
    order: 2,
  },
  {
    id: '4',
    title: 'Préparer les valises',
    notes: 'Départ vendredi matin',
    status: 'in_progress',
    priority: 'high',
    color: 'butter',
    assigneeId: 'bebe',
    createdBy: 'bebe',
    createdAt: now - 30 * HOUR,
    order: 0,
  },
  {
    id: '5',
    title: 'Monter l’étagère du salon',
    status: 'in_progress',
    priority: 'medium',
    color: 'peach',
    assigneeId: 'boubou',
    createdBy: 'bebe',
    createdAt: now - 48 * HOUR,
    order: 1,
  },
  {
    id: '6',
    title: 'Devis déménagement',
    notes: 'On attend le retour du 3e déménageur',
    status: 'blocked',
    priority: 'high',
    color: 'lavender',
    assigneeId: 'boubou',
    createdBy: 'boubou',
    createdAt: now - 72 * HOUR,
    order: 0,
  },
  {
    id: '7',
    title: 'Payer la facture d’électricité',
    status: 'done',
    priority: 'medium',
    color: 'mint',
    assigneeId: 'bebe',
    createdBy: 'boubou',
    createdAt: now - 96 * HOUR,
    order: 0,
  },
  {
    id: '8',
    title: 'Commander le cadeau de maman',
    status: 'done',
    priority: 'low',
    color: 'rose',
    assigneeId: 'boubou',
    createdBy: 'bebe',
    createdAt: now - 120 * HOUR,
    order: 1,
  },
];
