/**
 * Les membres du foyer. L'app est faite pour exactement deux personnes,
 * donc pas de gestion d'equipe : une constante suffit.
 *
 * A l'etape Firebase, `id` deviendra l'UID Firebase Auth et cette liste
 * sera lue depuis Firestore — mais la forme restera identique.
 */
export interface Member {
  id: string;
  name: string;
  /** Emoji-avatar, affiche dans la pastille d'assignation. */
  avatar: string;
  /** Cle d'une couleur de `taskColors`, pour reconnaitre la personne d'un coup d'oeil. */
  color: 'rose' | 'sky';
}

export const MEMBERS: Member[] = [
  { id: 'bebe', name: 'Bébé', avatar: '🐱', color: 'rose' },
  { id: 'boubou', name: 'Boubou', avatar: '🐻', color: 'sky' },
];

export function findMember(id: string | null): Member | undefined {
  if (!id) return undefined;
  return MEMBERS.find((member) => member.id === id);
}
