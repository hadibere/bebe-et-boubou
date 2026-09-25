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
    _layout.tsx           Providers globaux : polices, gestes, déclaration des routes
    index.tsx             Route "/"           → BoardScreen
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
    tasks/TasksProvider.tsx  LE contrat : useTasks() expose tasks + create/update/delete/move
    mock/tasks.ts            Jeu d'essai — sera remplacé par Firestore (étape 4)

  features/               Une fonctionnalité = un dossier autonome
    board/
      BoardScreen.tsx     L'écran assemblé
      components/         Composants qui n'existent que pour le tableau
        TaskCard.tsx
        ColumnTabs.tsx
        BoardColumn.tsx
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

## Feuille de route

- [x] **Étape 1** — Projet, architecture, design system, tableau à 4 colonnes (données d'essai)
- [x] **Étape 2** — Création / édition / suppression : titre, note, importance, couleur, assignation, colonne
- [ ] **Étape 3** — Glisser-déposer entre colonnes
- [ ] **Étape 4** — Firebase : authentification + Firestore en temps réel
- [ ] **Étape 5** — Notifications push quand l'autre crée une tâche
- [ ] **Étape 6** — Icône, écran de démarrage, build EAS et TestFlight
