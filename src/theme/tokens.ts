/**
 * TOKENS — les valeurs brutes du design.
 *
 * Aucune logique ici, que des constantes. C'est le seul endroit ou on ecrit
 * un code couleur en dur : si tu veux changer l'ambiance de l'app, tu modifies
 * ce fichier et TOUT suit automatiquement.
 */

/** Notre nuancier pastel. Chaque teinte a une version claire (fond) et "Deep" (texte/bordure). */
export const palette = {
  // Fonds
  cream: '#FFF7F2',
  cloud: '#FFFFFF',
  blush: '#FFEDF2',

  // Teintes kawaii — utilisees pour colorer les taches
  rose: '#FFD6E3',
  roseDeep: '#F2678F',
  lavender: '#E4DCFF',
  lavenderDeep: '#8E74EC',
  mint: '#CCF2E5',
  mintDeep: '#3FB894',
  butter: '#FFEFC7',
  butterDeep: '#E09B1E',
  sky: '#D6ECFF',
  skyDeep: '#4A9BE0',
  peach: '#FFE0D1',
  peachDeep: '#E8825A',
  coral: '#FFDADA',
  coralDeep: '#EC6262',

  // Textes — jamais de vrai noir, ca casse la douceur
  ink: '#4A3B45',
  inkSoft: '#8A7580',
  inkFaint: '#C3B2BB',

  // Traits
  line: '#F6E6EC',
} as const;

/** Echelle d'espacement, multiples de 4. Utilise TOUJOURS ca, jamais un nombre au hasard. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/** Rayons de bordure. Genereux = mignon. */
export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

/** Ombres teintees de rose plutot que grises : c'est ce qui donne l'aspect "doux". */
export const shadow = {
  soft: '0px 4px 12px rgba(242, 103, 143, 0.10)',
  card: '0px 6px 18px rgba(242, 103, 143, 0.14)',
  lifted: '0px 14px 28px rgba(242, 103, 143, 0.26)',
} as const;

/** Familles de police — les noms viennent de @expo-google-fonts/quicksand. */
export const fontFamily = {
  regular: 'Quicksand_500Medium',
  semibold: 'Quicksand_600SemiBold',
  bold: 'Quicksand_700Bold',
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 24,
  xxl: 32,
} as const;

/**
 * Reglages d'animation partages, pour que toute l'app "rebondisse" pareil.
 * damping bas + stiffness moyen = ressort joueur facon jouet.
 */
export const motion = {
  spring: { damping: 15, stiffness: 180, mass: 0.8 },
  springBouncy: { damping: 10, stiffness: 220, mass: 0.7 },
  timing: { duration: 220 },
} as const;
