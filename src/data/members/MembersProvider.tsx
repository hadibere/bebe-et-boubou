import { collection, onSnapshot } from 'firebase/firestore';
import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from '@/data/auth/AuthProvider';
import { db } from '@/data/firebase/app';
import { FALLBACK_MEMBER, MEMBER_COLORS, type Member, type MemberColor } from '@/domain/member';

interface MembersContextValue {
  /** Les deux personnes du foyer, telles que declarees dans Firestore. */
  members: Member[];
  /** Celle qui utilise l'app sur cet appareil. */
  currentMember: Member | null;
  /** Retrouve une personne par son UID. `null` = tache commune. */
  findMember: (id: string | null) => Member | undefined;
}

const MembersContext = createContext<MembersContextValue | null>(null);

const MEMBERS_COLLECTION = 'members';
const NO_MEMBERS: Member[] = [];

/**
 * Lit un champ texte en traitant le vide comme absent.
 *
 * Ce n'est pas du zele : un champ laisse vide dans la console affichait
 * une pastille totalement vide, impossible a diagnostiquer d'un coup d'oeil.
 * Avec ce repli, un document mal rempli montre une patte 🐾 — on voit
 * immediatement qu'il y a quelque chose a corriger.
 */
function readText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

export function MembersProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [received, setReceived] = useState<{ userId: string; members: Member[] } | null>(null);

  useEffect(() => {
    if (!user) return;

    const userId = user.uid;

    const unsubscribe = onSnapshot(
      collection(db, MEMBERS_COLLECTION),
      (snapshot) => {
        setReceived({
          userId,
          members: snapshot.docs.map((document) => {
            const data = document.data();
            const color = data.color;

            return {
              id: document.id,
              name: readText(data.name, FALLBACK_MEMBER.name),
              avatar: readText(data.avatar, FALLBACK_MEMBER.avatar),
              color: (MEMBER_COLORS as readonly string[]).includes(color)
                ? (color as MemberColor)
                : FALLBACK_MEMBER.color,
            };
          }),
        });
      },
      (error) => {
        console.warn('[members] écoute interrompue :', error);
        setReceived({ userId, members: [] });
      },
    );

    return unsubscribe;
  }, [user]);

  const members = user && received?.userId === user.uid ? received.members : NO_MEMBERS;

  const findMember = useCallback(
    (id: string | null) => (id ? members.find((member) => member.id === id) : undefined),
    [members],
  );

  const currentMember = useMemo(
    () => (user ? (members.find((member) => member.id === user.uid) ?? null) : null),
    [members, user],
  );

  const value = useMemo<MembersContextValue>(
    () => ({ members, currentMember, findMember }),
    [members, currentMember, findMember],
  );

  return <MembersContext value={value}>{children}</MembersContext>;
}

export function useMembers(): MembersContextValue {
  const context = use(MembersContext);

  if (!context) {
    throw new Error('useMembers doit être utilisé à l’intérieur de <MembersProvider>.');
  }

  return context;
}
