// Point d'entree de l'app.
// L'ordre compte : la configuration Unistyles doit etre executee AVANT
// que le moindre composant (et donc le moindre StyleSheet.create) soit charge.
import './src/theme/unistyles';
import 'expo-router/entry';
