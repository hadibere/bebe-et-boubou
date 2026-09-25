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

import { TasksProvider } from '@/data/tasks/TasksProvider';

// On garde l'ecran de demarrage tant que les polices ne sont pas pretes,
// sinon l'app clignote avec la police systeme pendant une fraction de seconde.
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

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    // Requis par react-native-gesture-handler : sans cette racine,
    // le glisser-deposer de l'etape 3 ne recevrait aucun geste.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TasksProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="task/new" options={SHEET_OPTIONS} />
          <Stack.Screen name="task/[id]" options={SHEET_OPTIONS} />
        </Stack>
      </TasksProvider>
    </GestureHandlerRootView>
  );
}
