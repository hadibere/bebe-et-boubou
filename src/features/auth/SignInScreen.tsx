import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { PawPrint } from '@/components/ui/PawPrint';
import { describeAuthError, useAuth } from '@/data/auth/AuthProvider';
import { useEmulators } from '@/data/firebase/config';
import { haptics } from '@/lib/haptics';

/**
 * Confort de developpement : quand on travaille sur les emulateurs locaux,
 * le formulaire arrive pre-rempli avec le compte de test.
 *
 * Strictement sans effet en production : `useEmulators` vaut faux des que
 * EXPO_PUBLIC_USE_FIREBASE_EMULATOR n'est pas a 1, ce qui est le cas du
 * fichier .env reel.
 */
const DEV_CREDENTIALS = useEmulators
  ? { email: 'bebe@test.fr', password: 'sortiepetit' }
  : { email: '', password: '' };

/**
 * L'ecran de connexion.
 *
 * Il n'y a pas d'inscription : les deux comptes sont crees une fois pour
 * toutes dans la console Firebase. C'est volontaire — une app familiale a
 * deux n'a aucune raison d'ouvrir les inscriptions.
 */
export function SignInScreen() {
  const { theme } = useUnistyles();
  const { signIn } = useAuth();

  const [email, setEmail] = useState(DEV_CREDENTIALS.email);
  const [password, setPassword] = useState(DEV_CREDENTIALS.password);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await signIn(email, password);
      haptics.success();
      // Pas de navigation ici : le changement d'etat d'authentification
      // fait basculer les routes protegees tout seul.
    } catch (caught) {
      setError(describeAuthError(caught));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <View style={styles.hero}>
        <View style={styles.paws}>
          <PawPrint size={34} color={theme.colors.primarySoft} rotate={-20} />
          <PawPrint size={46} color={theme.colors.primary} rotate={6} />
          <PawPrint size={30} color={theme.colors.primarySoft} rotate={24} />
        </View>
        <Text style={styles.title}>bébé&boubou</Text>
        <Text style={styles.subtitle}>Notre petit tableau à deux</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Ton e-mail"
          placeholderTextColor={theme.colors.textFaint}
          style={styles.input}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Ton mot de passe"
          placeholderTextColor={theme.colors.textFaint}
          style={styles.input}
          secureTextEntry
          // Sans ces deux lignes, iOS met une majuscule a la premiere lettre
          // et tente de corriger la saisie : le mot de passe envoye n'est
          // alors pas celui qui a ete tape.
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={[styles.submit, !canSubmit && styles.submitDisabled]}
        >
          {isSubmitting ? (
            <ActivityIndicator color={theme.colors.onAccent} />
          ) : (
            <>
              <PawPrint size={22} color={theme.colors.onAccent} />
              <Text style={styles.submitLabel}>Entrer</Text>
            </>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: rt.insets.top + theme.spacing.xxxl,
    paddingBottom: rt.insets.bottom + theme.spacing.xxxl,
    gap: theme.spacing.xxxl,
  },
  hero: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  paws: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.xxl,
    color: theme.colors.text,
  },
  subtitle: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.md,
    color: theme.colors.textMuted,
  },
  form: {
    gap: theme.spacing.md,
  },
  input: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  error: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.sm,
    color: theme.priorityColors.high.deep,
    textAlign: 'center',
  },
  submit: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    minHeight: 56,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    boxShadow: theme.shadow.card,
  },
  submitDisabled: {
    opacity: 0.4,
  },
  submitLabel: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.md,
    color: theme.colors.onAccent,
  },
}));
