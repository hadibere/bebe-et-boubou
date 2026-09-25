import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useMembers } from '@/data/members/MembersProvider';

interface MemberAvatarProps {
  memberId: string | null;
  size?: number;
}

/**
 * La pastille de la personne assignee.
 * Si personne n'est assigne, on affiche une pastille neutre : la tache est "pour nous deux".
 */
export function MemberAvatar({ memberId, size = 26 }: MemberAvatarProps) {
  const { findMember } = useMembers();
  const member = findMember(memberId);

  styles.useVariants({ assigned: member ? member.color : 'none' });

  return (
    <View style={[styles.bubble, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.emoji, { fontSize: size * 0.52 }]}>{member?.avatar ?? '🤝'}</Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  bubble: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    variants: {
      // Les "variants" d'Unistyles : une seule regle de style, plusieurs apparences.
      assigned: {
        rose: {
          backgroundColor: theme.taskColors.rose.soft,
          borderColor: theme.taskColors.rose.deep,
        },
        sky: {
          backgroundColor: theme.taskColors.sky.soft,
          borderColor: theme.taskColors.sky.deep,
        },
        none: {
          backgroundColor: theme.colors.surfaceAlt,
          borderColor: theme.colors.border,
        },
      },
    },
  },
  emoji: {
    textAlign: 'center',
  },
}));
