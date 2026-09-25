/**
 * Les membres du foyer.
 *
 * Depuis le passage a Firebase, `id` EST l'identifiant Firebase Auth (UID)
 * de la personne. C'est ce qui permet a `assigneeId` de designer quelqu'un
 * de facon fiable, et ce sera aussi la cle pour lui envoyer une notification.
 *
 * Les documents vivent dans la collection `members`, ajoutes a la main dans
 * la console Firebase : l'app ne permet ni inscription, ni ajout de membre.
 */
export interface Member {
  /** L'UID Firebase Auth. */
  id: string;
  name: string;
  /** Emoji-avatar, affiche dans la pastille d'assignation. */
  avatar: string;
  /** Cle d'une couleur de `taskColors`, pour reconnaitre la personne d'un coup d'oeil. */
  color: MemberColor;
}

export const MEMBER_COLORS = ['rose', 'sky'] as const;
export type MemberColor = (typeof MEMBER_COLORS)[number];

/** Valeurs de repli si un document `members` est incomplet. */
export const FALLBACK_MEMBER: Omit<Member, 'id'> = {
  name: '???',
  avatar: '🐾',
  color: 'rose',
};
