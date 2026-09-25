/**
 * Configuration Unistyles — execute une seule fois, depuis index.ts,
 * avant le rendu du premier composant.
 */
import { StyleSheet } from 'react-native-unistyles';
import { appThemes } from './themes';

/**
 * Points de rupture. L'app est iPhone-only, donc on en garde un seul,
 * mais Unistyles exige la cle et ca nous laisse la porte ouverte.
 */
const breakpoints = {
  xs: 0,
} as const;

type AppThemes = typeof appThemes;
type AppBreakpoints = typeof breakpoints;

// On "apprend" nos themes a TypeScript : desormais `theme.colors.primary`
// est auto-complete et une faute de frappe devient une erreur de compilation.
declare module 'react-native-unistyles' {
  // Ces interfaces vides ne sont pas une erreur : c'est la forme exacte
  // qu'Unistyles attend pour fusionner nos types avec les siens.
  /* eslint-disable @typescript-eslint/no-empty-object-type */
  export interface UnistylesThemes extends AppThemes {}
  export interface UnistylesBreakpoints extends AppBreakpoints {}
  /* eslint-enable @typescript-eslint/no-empty-object-type */
}

StyleSheet.configure({
  themes: appThemes,
  breakpoints,
  settings: {
    initialTheme: 'light',
  },
});
