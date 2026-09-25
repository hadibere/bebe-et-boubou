import { router } from 'expo-router';
import { useMemo, useRef } from 'react';
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
import { useTasks } from '@/data/tasks/TasksProvider';
import { MEMBERS } from '@/domain/member';
import { countByStatus, TASK_STATUSES, tasksForStatus, type Task } from '@/domain/task';
import { haptics } from '@/lib/haptics';
import { motion } from '@/theme/tokens';
import { BoardColumn } from './components/BoardColumn';
import { ColumnTabs } from './components/ColumnTabs';
import { DragPreview } from './components/DragPreview';
import { DropBar } from './components/DropBar';
import { DragProvider, useDrag } from './drag/DragContext';

/**
 * BoardScreen n'est qu'une enveloppe : le vrai contenu doit se trouver
 * A L'INTERIEUR de DragProvider pour pouvoir appeler useDrag().
 */
export function BoardScreen() {
  return (
    <DragProvider>
      <Board />
    </DragProvider>
  );
}

function Board() {
  const { width } = useWindowDimensions();
  const { rt } = useUnistyles();
  const scrollRef = useRef<ScrollView>(null);

  // L'ecran ne sait pas d'ou viennent les taches : c'est tout l'interet
  // de passer par ce hook. A l'etape 4, Firestore prendra la place
  // sans que cette ligne change.
  const { tasks, moveTask } = useTasks();

  // Pendant qu'une carte est soulevee, on fige les deux defilements :
  // sinon le moindre mouvement du doigt ferait glisser le tableau.
  const { draggedTask } = useDrag();
  const isDragging = draggedTask !== null;

  const handleDrop = (task: Task, statusIndex: number) => {
    moveTask(task.id, TASK_STATUSES[statusIndex]);
  };

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
        scrollEnabled={!isDragging}
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
            scrollEnabled={!isDragging}
            onTaskPress={(task) => router.push({ pathname: '/task/[id]', params: { id: task.id } })}
            onTaskDrop={handleDrop}
          />
        ))}
      </Animated.ScrollView>

      <AddTaskButton />

      {/* Les deux couches du glisser-deposer, au-dessus de tout le reste. */}
      <DropBar topInset={rt.insets.top} />
      <DragPreview />
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
        onPress={() => {
          haptics.pick();
          router.push('/task/new');
        }}
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
