/**
 * Route "/" — le tableau.
 *
 * Le fichier de route se contente de pointer vers l'ecran reel.
 * Ca garde le routage lisible et permet au plugin Babel d'Unistyles
 * de ne surveiller qu'un seul dossier (src/).
 */
export { BoardScreen as default } from '@/features/board/BoardScreen';
