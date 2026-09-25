import {
  Quicksand_500Medium,
  Quicksand_600SemiBold,
  Quicksand_700Bold,
  useFonts,
} from '@expo-google-fonts/quicksand';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider, useAuth } from '@/data/auth/AuthProvider';
import { MembersProvider } from '@/data/members/MembersProvider';
import { PushNotifications } from '@/data/notifications/PushNotifications';
import { TasksProvider } from '@/data/tasks/TasksProvider';

// On garde l'ecran de demarrage tant que les polices ne sont pas pretes ET
// qu'on ne sait pas si une session existe : sinon l'app clignoterait en
// affichant brievement l'ecran de connexion a quelqu'un de deja connecte.
SplashScreen.preventAutoHideAsync();

/**
 * Les deux formulaires s'ouvrent en feuille remontante plutot qu'en plein ecran :
 * on garde le tableau visible derriere, c'est moins brutal et plus naturel au pouce.
 */
const SHEET_OPTIONS = {
  // `as const` uniquement ici : ailleurs il rendrait le tableau
  // en lecture seule, ce que la navigation refuse.
  presentation: 'formSheet' as const,
  sheetAllowedDetents: [0.92],
  sheetGrabberVisible: true,
  sheetCornerRadius: 28,
};

/**
 * Layout racine : uniquement les "providers" globaux et la declaration des routes.
 *
 * Regle d'architecture : le dossier src/app ne contient QUE du routage.
 * Aucun style, aucune logique metier — tout ca vit ailleurs dans src/.
 */
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Quicksand_500Medium,
    Quicksand_600SemiBold,
    Quicksand_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    // Requis par react-native-gesture-handler : sans cette racine,
    // le glisser-deposer ne recevrait aucun geste.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <MembersProvider>
          <TasksProvider>
            <StatusBar style="dark" />
            {/* N'affiche rien : enregistre l'appareil et ouvre la tache
                quand on tape une notification. */}
            <PushNotifications />
            <RootNavigator />
          </TasksProvider>
        </MembersProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Le routeur doit etre A L'INTERIEUR de AuthProvider pour savoir
 * si quelqu'un est connecte.
 */
function RootNavigator() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  // Firebase restaure la session depuis le stockage local : tant que ce
  // n'est pas fini, on ne sait pas quoi afficher, donc on n'affiche rien
  // et l'ecran de demarrage reste visible.
  if (isLoading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* `Stack.Protected` retire purement et simplement les routes du
          routeur quand la condition est fausse. Impossible d'atteindre le
          tableau sans session, meme via un lien profond. */}
      <Stack.Protected guard={user !== null}>
        <Stack.Screen name="index" />
        <Stack.Screen name="task/new" options={SHEET_OPTIONS} />
        <Stack.Screen name="task/[id]" options={SHEET_OPTIONS} />
      </Stack.Protected>

      <Stack.Protected guard={user === null}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
    </Stack>
  );
}
