/**
 * Petit retour haptique maison.
 *
 * On passe par ce module plutot que d'appeler expo-haptics partout :
 * un seul endroit a modifier si on veut regler l'intensite ou ajouter
 * un reglage "vibrations : off" dans les preferences.
 */
import * as Haptics from 'expo-haptics';

export const haptics = {
  /** Changement d'onglet, selection d'une option. */
  select: () => Haptics.selectionAsync(),
  /** On attrape une carte. */
  pick: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  /** Une tache passe en "Terminé" 🎉 */
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
};
