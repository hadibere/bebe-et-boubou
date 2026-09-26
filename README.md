# bébé&boubou 🐾

Petit tableau de tâches partagé, pour deux. iPhone uniquement, distribué via TestFlight.

## Lancer le projet

```bash
npm install
npx expo run:ios      # compile le dev build et l'installe sur le simulateur
npm start             # les fois suivantes, le serveur de dev suffit
```

> ⚠️ **Expo Go ne fonctionne pas** pour ce projet : Unistyles, Reanimated et SVG
> embarquent du code natif. Il faut un *dev build*, d'où `expo run:ios`.
> À refaire uniquement quand on ajoute une dépendance native.

Si CocoaPods échoue avec une erreur d'encodage Ruby, c'est la locale du shell :

```bash
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8
```

## Architecture des dossiers

La règle tient en une phrase : **`src/app/` c'est le plan du métro, le reste de `src/` c'est la ville.**

```
src/
  app/                    Routage expo-router UNIQUEMENT (1 fichier = 1 écran)
    _layout.tsx           Providers globaux + routes protégées par la session
    index.tsx             Route "/"           → BoardScreen
    sign-in.tsx           Route "/sign-in"    → SignInScreen
    task/new.tsx          Route "/task/new"   → NewTaskScreen  (feuille modale)
    task/[id].tsx         Route "/task/<id>"  → EditTaskScreen (feuille modale)

  theme/                  Le design system
    tokens.ts             Valeurs brutes : couleurs, espacements, rayons, ombres
    themes.ts             Assemblage en rôles sémantiques (colors.text, taskColors…)
    unistyles.ts          Configuration Unistyles + typage TypeScript

  domain/                 Le métier pur — ni React, ni Firebase, ni couleurs
    task.ts               Task, TaskStatus, TaskPriority, TaskColor + helpers
    member.ts             Les deux membres du foyer

  data/                   Accès aux données
    firebase/
      config.ts           Lecture et validation des variables d'environnement
      app.ts              Initialisation Firebase (+ bascule émulateurs)
    auth/AuthProvider.tsx    Session : useAuth() + messages d'erreur en français
    notifications/
      push.ts             Autorisation, jeton, envoi via le service Expo
      taskAlerts.ts       QUI prévenir et avec quel texte (fonctions pures)
      PushNotifications.tsx  Publie le jeton, ouvre la tâche au tap
    members/MembersProvider.tsx  Les deux membres, lus depuis Firestore
    tasks/
      TasksProvider.tsx   LE contrat : useTasks() + Firestore temps réel
      mapping.ts          Traduction document Firestore ↔ type Task

  features/               Une fonctionnalité = un dossier autonome
    board/
      BoardScreen.tsx     L'écran assemblé
      components/         Composants qui n'existent que pour le tableau
        TaskCard.tsx      La carte, avec son geste de déplacement
        ColumnTabs.tsx
        BoardColumn.tsx
        DropBar.tsx       Les 4 cibles, visibles pendant le déplacement
        DragPreview.tsx   La carte qui suit le doigt
      drag/
        DragContext.tsx   L'état partagé du geste
    auth/SignInScreen.tsx  Connexion (pas d'inscription : comptes créés en console)
    tasks/
      NewTaskScreen.tsx   Création
      EditTaskScreen.tsx  Modification + suppression
      components/
        TaskForm.tsx      LE formulaire, partagé par les deux écrans
        ColorPicker.tsx   Les six pastilles de couleur

  components/ui/          Briques réutilisables partout
    PawPrint.tsx          L'empreinte de patte en SVG
    PriorityPaws.tsx      La jauge d'importance (1 à 3 pattes)
    MemberAvatar.tsx      La pastille de la personne assignée
    Chip.tsx              La pastille à choix unique (importance, personne, colonne)

  lib/                    Utilitaires transverses
    haptics.ts            Retours haptiques centralisés
```

### Pourquoi `src/app/` ne contient aucun style

Deux raisons qui se rejoignent. D'abord la convention du projet (`AGENTS.md`) :
les routes vivent dans `src/app/`, tout le reste en dehors. Ensuite le plugin
Babel d'Unistyles, qui ne surveille qu'**un seul dossier racine** — `src` ici,
ce qui couvre routes et composants d'un coup.

Résultat : un fichier de route ne fait que pointer vers un écran. Le routage
reste lisible d'un coup d'œil, et on ne peut pas se tromper sur l'endroit
où écrire un composant.

### Pourquoi `useTasks()` et pas un `useState` dans l'écran

`src/data/tasks/TasksProvider.tsx` est le **seul** fichier qui sait où sont
stockées les tâches. Le tableau et les formulaires ne connaissent que cinq
fonctions : `tasks`, `createTask`, `updateTask`, `deleteTask`, `moveTask`.

À l'étape 4, on remplace l'intérieur de ce fichier par un abonnement temps réel
à Firestore. Aucun écran ne change.

### Comment fonctionne le glisser-déposer

Sur iPhone on ne voit qu'une colonne à la fois : faire glisser une carte « vers
la colonne d'à côté » n'aurait aucun sens, la cible est hors écran. Alors :

1. un appui maintenu de 220 ms soulève la carte (`activateAfterLongPress`) ;
2. une barre apparaît en haut avec les 4 colonnes ;
3. les 4 cibles font exactement un quart de la largeur, donc savoir laquelle est
   survolée se réduit à une division — aucune mesure de vue, aucun calcul fragile ;
4. on relâche sur une cible pour déplacer, ailleurs pour annuler.

Le tap simple continue d'ouvrir le formulaire : `Gesture.Exclusive` fait que les
deux gestes ne se marchent pas dessus.

**Le détail qui évite un bug méchant** : la remise à zéro se fait dans
`onFinalize`, jamais dans `onEnd`. `onEnd` ne se déclenche pas si le geste est
interrompu (appel entrant, retour à l'accueil) — la carte resterait soulevée
pour toujours et le tableau ne défilerait plus.

### Un piège des feuilles modales (form sheet)

Une `formSheet` qui contient une zone de défilement **n'accepte que deux vues
enfants**, et React Native « aplatit » les vues qui n'ont pas de style propre.
Sans `collapsable={false}` sur l'en-tête, celui-ci sort de la mise en page et le
contenu défile par-dessus. RNScreens le signale dans les logs — il faut les lire.

Autre conséquence : `KeyboardAvoidingView` ne fonctionne pas dans une feuille
modale (ses calculs sont en coordonnées écran). On utilise
`automaticallyAdjustKeyboardInsets` sur la `ScrollView`, le mécanisme iOS natif.

### Pourquoi un dossier `domain/`

`domain/task.ts` ne sait pas que Firebase existe, ni que l'app est rose.
Conséquence concrète : à l'étape 4, brancher Firestore ne modifiera **pas une seule
ligne** de ce fichier. C'est le noyau stable autour duquel tout le reste tourne.

## Firebase

### Configuration

La configuration vit dans un fichier `.env` **jamais versionné**. Copie
`.env.example` et remplis-le avec les valeurs de la console Firebase
(*Paramètres du projet → Vos applications → application Web*).

Ces valeurs ne sont pas des secrets : elles sont embarquées dans l'app livrée.
La sécurité réelle vient de `firestore.rules`.

### ⚠️ Les variables doivent aussi exister sur EAS

`.env` est **hors du dépôt**, et EAS construit à partir de Git : les serveurs
de build ne voient donc pas ce fichier. Sans précaution, l'app compilée part
**sans configuration Firebase** et se ferme au démarrage — l'installation
réussit, le lancement échoue.

Après toute modification de `.env`, il faut pousser les valeurs :

```bash
npx eas-cli@latest env:push preview --path .env --force
npx eas-cli@latest env:push production --path .env --force
```

Pour vérifier ce que les serveurs voient réellement :

```bash
npx eas-cli@latest env:list preview
```

Le build affiche un avertissement quand il ne trouve rien — il mérite d'être lu :
*« No environment variables … found for the "preview" environment »*.

### Les comptes

Il n'y a **pas d'inscription dans l'app**. Les deux comptes se créent une fois
pour toutes dans la console (*Authentication → Users*), puis il faut ajouter,
pour chacun, un document dans la collection `members` dont **l'identifiant est
son UID** :

```
members/<UID>  →  { name: "Bébé", avatar: "🐱", color: "rose" }
```

### Pourquoi une collection `members`

Les règles n'exigent pas seulement d'être authentifié, et c'est important :
n'importe qui possédant la clé publique de l'app **peut se créer un compte**
via l'API Firebase. Être authentifié ne prouve donc rien.

On exige en plus un document à son nom dans `members`, que seule la console
peut créer (`allow write: if false`). Vérifié sur les émulateurs : un compte
créé de l'extérieur reçoit bien un `403` en lecture comme en écriture.

### Tester sans toucher au vrai projet

```bash
firebase emulators:start --project demo-bebe --only auth,firestore
```

Mets `EXPO_PUBLIC_USE_FIREBASE_EMULATOR=1` dans `.env` : l'app tape alors sur
les émulateurs locaux, avec les vraies règles chargées. Dans ce mode seulement,
l'écran de connexion arrive pré-rempli avec le compte de test.

## Notifications

### Ce qui déclenche une notification

| Événement | Message |
|---|---|
| L'autre crée une tâche | « 🐻 Boubou a ajouté une tâche » (+ « · pour toi » si assignée) |
| Une tâche t'est assignée | « 🐻 Boubou t'a assigné une tâche » |
| Une tâche passe en « Bloqué » | « 🙀 Une tâche est bloquée » |

Taper la notification ouvre directement la tâche : son identifiant voyage
dans la charge utile.

### Les rappels

Un rappel se pose sur une tâche via des raccourcis — *Dans 1 h*, *Ce soir
19 h*, *Demain 9 h*, *Samedi 10 h*. Le calcul des échéances est dans
`src/domain/reminder.ts` : des fonctions pures, sans notification ni React.

Ce sont des **notifications locales** : chaque téléphone se prévient
lui-même à l'heure dite. Aucun serveur, aucun coût, et ça fonctionne même
hors connexion une fois le rappel posé. Les deux téléphones programment les
mêmes rappels chacun de leur côté, donc vous êtes prévenus tous les deux.

`ReminderScheduler` resynchronise à chaque changement venu de Firestore :
une tâche terminée, supprimée, ou dont l'heure change voit son rappel mis à
jour sans code dédié. La stratégie est « on annule tout et on reprogramme »
plutôt que de tenir un registre d'identifiants, qui dériverait à la première
erreur.

### Pourquoi l'envoi part de l'app

Pas de Cloud Function, donc **pas besoin du plan Blaze** ni de carte
bancaire. L'app de celui qui agit appelle directement le service d'envoi
d'Expo. Contrepartie assumée : si le réseau coupe à cet instant précis, la
notification est perdue — la tâche, elle, est bien enregistrée.

### La règle de sécurité qui va avec

Chacun doit pouvoir publier le jeton de son appareil dans son document
`members`, alors que cette collection est verrouillée en écriture. La règle
est donc volontairement étroite :

```
allow update: if isMember()
  && request.auth.uid == memberId
  && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['pushToken'])
```

Uniquement son propre document, uniquement ce champ. Création et suppression
restent impossibles depuis l'app.

### Tester

⚠️ **L'obtention du jeton ne fonctionne pas sur le simulateur iOS 26** — c'est
un bug d'Apple, signalé par expo-notifications lui-même. Il faut un vrai
iPhone. Validé de bout en bout via TestFlight le 26/09/2026.

En revanche, on peut vérifier l'affichage et la navigation en injectant une
notification directement :

```bash
xcrun simctl push <UDID> com.hadibere.bebeetboubou notification.apns
```

## Le trio qui rend l'interface fluide

En React Native, la fluidité ne vient pas de la bibliothèque de styles :

| Couche | Outil | Rôle |
|---|---|---|
| Styles | **Unistyles 3** | Thème, variants, couleurs — moteur C++, pas de re-render |
| Animations | **Reanimated 4** | Tourne sur le **thread UI natif**, donc jamais saccadé |
| Gestes | **Gesture Handler 3** | Glisser-déposer, swipe — natif aussi |
| Ressenti | **expo-haptics** | Les micro-vibrations qui rendent l'app "vivante" |

Le meilleur exemple dans le code est `ColumnTabs.tsx` : plutôt que d'attendre la fin
du swipe pour changer d'onglet, on lit la position du scroll **à chaque image** et on
interpole la couleur. La pastille se colore progressivement pendant que le doigt glisse.

## Conventions

- On n'écrit **jamais** un code couleur ou un espacement en dur dans un composant.
  Tout passe par `theme.*` — sinon le mode sombre sera un cauchemar.
- Les espacements sont des multiples de 4, pris dans `theme.spacing`.
- Un composant utilisé par une seule fonctionnalité vit dans `features/<nom>/components/`.
  Il ne monte dans `components/ui/` que le jour où un **deuxième** écran s'en sert.

## Publier une nouvelle version

### Une correction JavaScript seulement

Pas de build, pas d'Apple, pas d'attente — la mise à jour arrive sur vos
téléphones au prochain lancement :

```bash
npx eas-cli@latest update --branch production --message "ce qui change"
```

C'est le cas de loin le plus fréquent : texte, couleur, logique d'écran.

### Un changement natif (nouvelle dépendance, icône, permissions)

```bash
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform ios --latest
```

⚠️ **Si `.env` a changé**, pousse-le d'abord (voir plus haut), sinon l'app
compilée partira sans configuration Firebase et se fermera au démarrage.

### Identifiants à ne jamais perdre

| | |
|---|---|
| Identifiant de lot | `com.hadibere.bebeetboubou` |
| Projet EAS | `0283cfaa-c664-4fbc-8bd9-69e88a3a6ddd` |
| App Store Connect | `6816258356` |
| Projet Firebase | `bebe-et-boubou` |

⚠️ **Ne jamais supprimer la fiche App Store Connect.** Apple ne libère ni
l'identifiant de lot ni l'UGS d'une app supprimée — il faudrait tout
reconstruire sous un nouvel identifiant. C'est déjà arrivé une fois.

## Feuille de route

- [x] **Étape 1** — Projet, architecture, design system, tableau à 4 colonnes (données d'essai)
- [x] **Étape 2** — Création / édition / suppression : titre, note, importance, couleur, assignation, colonne
- [x] **Étape 3** — Glisser-déposer entre colonnes (appui long + barre de dépôt)
- [x] **Étape 4** — Firebase : authentification + Firestore en temps réel
- [x] **Étape 5** — Notifications : création, assignation, blocage — **validé sur iPhone réel**
- [x] **Étape 6** — Icône, écran de démarrage, build EAS, TestFlight — **l'app tourne sur vos deux iPhones**
- [x] **Rappels** — échéance par tâche, notification locale sur les deux téléphones
