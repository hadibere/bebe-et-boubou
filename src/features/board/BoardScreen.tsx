import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { MemberAvatar } from '@/components/ui/MemberAvatar';
import { PawPrint } from '@/components/ui/PawPrint';
import { MOCK_TASKS } from '@/data/mock/tasks';
import { MEMBERS } from '@/domain/member';
import { countByStatus, TASK_STATUSES, tasksForStatus, type Task } from '@/domain/task';
import { haptics } from '@/lib/haptics';
import { motion } from '@/theme/tokens';
import { BoardColumn } from './components/BoardColumn';
import { ColumnTabs } from './components/ColumnTabs';

export function BoardScreen() {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  // Etape 4 : cette ligne sera remplacee par un abonnement temps reel a Firestore.
  const [tasks] = useState<Task[]>(MOCK_TASKS);

  const counts = useMemo(() => countByStatus(tasks), [tasks]);

  /**
   * `scrollX` est partagee entre le thread JS et le thread UI.
   * Les onglets s'y abonnent pour se colorer en temps reel pendant le swipe.
   */
  const scrollX = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  const goToColumn = (index: number) => {
    haptics.select();
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
  };

  return (
    <View style={styles.screen}>
      <BoardHeader />

      <ColumnTabs scrollX={scrollX} pageWidth={width} counts={counts} onSelect={goToColumn} />

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        // 16ms = une mise a jour par image a 60 fps. Indispensable pour que
        // l'animation des onglets soit lisse et non saccadee.
        scrollEventThrottle={16}
      >
        {TASK_STATUSES.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            tasks={tasksForStatus(tasks, status)}
            width={width}
          />
        ))}
      </Animated.ScrollView>

      <AddTaskButton />
    </View>
  );
}

/* --------------------------------- En-tete ---------------------------------- */

function BoardHeader() {
  const { theme } = useUnistyles();

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <PawPrint size={28} color={theme.colors.primary} rotate={-12} />
        <View>
          <Text style={styles.title}>bébé&boubou</Text>
          <Text style={styles.subtitle}>Notre petit tableau à deux</Text>
        </View>
      </View>

      <View style={styles.headerMembers}>
        {MEMBERS.map((member, index) => (
          <View key={member.id} style={index > 0 ? styles.memberOverlap : undefined}>
            <MemberAvatar memberId={member.id} size={32} />
          </View>
        ))}
      </View>
    </View>
  );
}

/* ------------------------------ Bouton d'ajout ------------------------------ */

function AddTaskButton() {
  const { theme } = useUnistyles();
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    // On anime un NOMBRE puis on compose l'unite : `withSpring('-12deg')` marche
    // parfois mais n'est pas garanti. Avec un nombre, aucune ambiguite.
    const tilt = withSpring(pressed.value === 1 ? -12 : 0, motion.springBouncy);

    return {
      transform: [
        { scale: withSpring(pressed.value === 1 ? 0.9 : 1, motion.springBouncy) },
        { rotate: `${tilt}deg` },
      ],
    };
  });

  return (
    <Animated.View style={[styles.fab, animatedStyle]}>
      <Pressable
        onPressIn={() => {
          pressed.value = 1;
        }}
        onPressOut={() => {
          pressed.value = 0;
        }}
        // TODO (etape 2) : ouvrir le formulaire de creation via router.push('/task/new')
        onPress={() => haptics.pick()}
        style={styles.fabPressable}
      >
        <PawPrint size={30} color={theme.colors.onAccent} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
    // `rt.insets` = les marges de securite de l'iPhone (encoche, barre du bas).
    // Unistyles les fournit directement, pas besoin d'englober dans un SafeAreaView.
    paddingTop: rt.insets.top + theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  title: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.xl,
    color: theme.colors.text,
  },
  subtitle: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
  headerMembers: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberOverlap: {
    // Chevauchement leger des pastilles : ca fait "couple".
    marginLeft: -10,
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.xl,
    bottom: rt.insets.bottom + theme.spacing.xl,
    width: 62,
    height: 62,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primary,
    boxShadow: theme.shadow.lifted,
  },
  fabPressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
