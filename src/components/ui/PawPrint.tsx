import Svg, { Ellipse, G } from 'react-native-svg';

interface PawPrintProps {
  size?: number;
  color: string;
  /** Legere inclinaison, en degres — evite l'effet "tampon" quand on en aligne plusieurs. */
  rotate?: number;
  opacity?: number;
}

/**
 * L'empreinte de chaton : quatre coussinets et une palme.
 * Dessinee en SVG (et non en image) pour rester nette a toute taille
 * et pouvoir changer de couleur a la volee.
 */
export function PawPrint({ size = 16, color, rotate = 0, opacity = 1 }: PawPrintProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" opacity={opacity}>
      <G rotation={rotate} origin="12, 12" fill={color}>
        {/* Les quatre doigts, en arc de cercle */}
        <Ellipse cx="5.6" cy="9.4" rx="2.5" ry="3.1" rotation={-18} origin="5.6, 9.4" />
        <Ellipse cx="10.3" cy="5.9" rx="2.6" ry="3.3" rotation={-6} origin="10.3, 5.9" />
        <Ellipse cx="15.5" cy="6.2" rx="2.6" ry="3.3" rotation={8} origin="15.5, 6.2" />
        <Ellipse cx="19.6" cy="10.2" rx="2.5" ry="3.1" rotation={20} origin="19.6, 10.2" />
        {/* Le gros coussinet central */}
        <Ellipse cx="12.4" cy="16.8" rx="6.2" ry="5.4" />
      </G>
    </Svg>
  );
}
