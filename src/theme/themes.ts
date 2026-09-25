/**
 * THEMES — on assemble les tokens en roles semantiques.
 *
 * Dans les composants on ecrit `theme.colors.textMuted`, jamais `palette.inkSoft`.
 * Avantage : le jour ou on ajoute un mode sombre, on cree juste un `darkTheme`
 * ici et pas une seule ligne de composant ne change.
 */
import { fontFamily, fontSize, motion, palette, radius, shadow, spacing } from './tokens';

const lightTheme = {
  colors: {
    // Surfaces
    background: palette.cream,
    surface: palette.cloud,
    surfaceAlt: palette.blush,

    // Textes
    text: palette.ink,
    textMuted: palette.inkSoft,
    textFaint: palette.inkFaint,
    onAccent: palette.cloud,

    // Marque
    primary: palette.roseDeep,
    primarySoft: palette.rose,

    border: palette.line,
  },

  /** Les 6 couleurs que l'on peut donner a une tache, chacune = fond + accent. */
  taskColors: {
    rose: { soft: palette.rose, deep: palette.roseDeep },
    lavender: { soft: palette.lavender, deep: palette.lavenderDeep },
    mint: { soft: palette.mint, deep: palette.mintDeep },
    butter: { soft: palette.butter, deep: palette.butterDeep },
    sky: { soft: palette.sky, deep: palette.skyDeep },
    peach: { soft: palette.peach, deep: palette.peachDeep },
  },

  /** Une couleur par colonne du tableau. */
  statusColors: {
    todo: { soft: palette.sky, deep: palette.skyDeep },
    in_progress: { soft: palette.butter, deep: palette.butterDeep },
    blocked: { soft: palette.coral, deep: palette.coralDeep },
    done: { soft: palette.mint, deep: palette.mintDeep },
  },

  /** Une couleur par niveau d'importance. */
  priorityColors: {
    low: { soft: palette.mint, deep: palette.mintDeep },
    medium: { soft: palette.butter, deep: palette.butterDeep },
    high: { soft: palette.coral, deep: palette.coralDeep },
  },

  spacing,
  radius,
  shadow,
  fontFamily,
  fontSize,
  motion,
} as const;

export const appThemes = {
  light: lightTheme,
} as const;

export type AppTheme = typeof lightTheme;
