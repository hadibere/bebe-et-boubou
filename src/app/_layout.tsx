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

// On garde l'ecran de demarrage tant que les polices ne sont pas pretes,
// sinon l'app clignote avec la police systeme pendant une fraction de seconde.
SplashScreen.preventAutoHideAsync();

/**
 * Layout racine : uniquement les "providers" globaux.
 *
 * Regle d'architecture : le dossier app/ ne contient QUE du routage.
 * Aucun style, aucune logique metier — tout ca vit dans src/.
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
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
