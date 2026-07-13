# Plan — Application « Geek-Fit »

## Contexte

L'utilisateur veut une application mobile personnelle pour se **motiver à faire du sport**.
Le principe : le temps passé à faire du sport génère une **monnaie unique (des « points », exprimés en minutes)**.
Ces points se **dépensent** ensuite pour faire ce qu'il aime (geeker, etc.) selon deux modes, et tout le
système de gains/dépenses doit être **paramétrable**. C'est un projet *greenfield* (dossier vide).

Décisions déjà validées avec l'utilisateur :
- **Techno** : Ionic + Angular (standalone, signals) + Capacitor.
- **Stockage** : 100 % local / hors-ligne (aucun compte, aucun backend).
- **Saisie du sport** : chronomètre en direct **+** saisie manuelle de rattrapage.
- **Activités bonus** : rapportent **au temps, à un taux réduit** configurable (chrono comme le sport).
- **Activités spéciales** : tableau type Trello (matrice d'Eisenhower). Gains = temps + bonus fixe,
  **le tout multiplié** par le multiplicateur de sport **et** par le coefficient de la colonne ; débloquées par le sport.
- **Définition de « la semaine »** : paramétrable, deux stratégies (voir § Moteur de multiplicateur).
- **Cible** : **Android d'abord** (machine Windows ; iOS nécessiterait un Mac — hors périmètre pour l'instant).

---

## Concept fonctionnel (règles métier)

Une seule monnaie : **les points** (1 point ≈ 1 minute, mais les taux sont configurables).

### Gagner des points
- **Sport** : `points = durée_minutes × taux_sport × multiplicateur`.
- **Activités bonus** (ménage, etc.) : `points = durée_minutes × taux_bonus_de_l_activité` (taux réduit).
  - **Débloquées uniquement si du sport a été fait dans la période courante** (semaine/streak).
  - Pas de multiplicateur sur les bonus.

### Activités spéciales (tableau type Trello / matrice d'Eisenhower)
Des activités chronométrées portant **un montant bonus fixe** en plus du temps passé, organisées en cartes
sur un tableau à colonnes (backlog + quadrants d'Eisenhower).
- Formule : `points = (durée_minutes × taux + montant_fixe) × multiplicateur_sport × coef_colonne`.
- **Débloquées uniquement si du sport a été fait dans la période courante** (comme les activités bonus).
- Soumises au **multiplicateur de sport courant** (niveau atteint dans la période — voir `MultiplierService`).
- **Colonnes** (chacune avec un coefficient configurable) :
  `TODO`, `URGENT ET IMPORTANT`, `URGENT ET PAS IMPORTANT`, `IMPORTANT ET PAS URGENT`, `PAS IMPORTANT ET PAS URGENT`.
- Les cartes se déplacent d'une colonne à l'autre en glisser-déposer (priorisation façon Trello) ;
  la colonne d'une carte détermine le `coef_colonne` appliqué au moment où l'activité est validée.

### Multiplicateur progressif (2 stratégies, paramétrable)
- **Stratégie « Calendaire »** : compteur de séances de sport remis à zéro chaque **lundi**.
  1ʳᵉ séance ×1, 2ᵉ ×2, 3ᵉ ×3… (plafond configurable, `null` = illimité).
- **Stratégie « Cumulative »** (chaîne) : indépendante du calendrier, avec contraintes configurables :
  - Chaîne de **max 3 séances** (`maxSessions`).
  - **≤ 3 jours** entre deux séances consécutives (`maxGapDays`) sinon la chaîne repart à ×1.
  - Multiplicateur = position dans la chaîne (×1, ×2, ×3). Après la 3ᵉ, la chaîne se clôt et repart à ×1.

### Dépenser des points
- **Dépense au temps** (ex. geeker) : un chrono **décompte** le solde en temps réel
  (`points_consommés = durée_minutes × taux_dépense_de_l_activité`). Configurable par activité.
- **Dépense d'un montant fixe** (récompense, ex. « droit d'aller au resto ») : coût fixe en points
  débité en une fois lors de l'« achat ». Configurable par récompense.

### Solde
- `solde = Σ(gains) − Σ(dépenses)`, dérivé de l'historique (source de vérité = le journal d'opérations).
- Les dépenses au temps sont bloquées si le solde tombe à 0 (option : autoriser le négatif = paramètre).

---

## Stack technique & mise en place

- **Ionic Angular** (composants UI mobiles, thème adaptatif) — projet standalone components + **signals**.
- **Capacitor** pour empaqueter en app Android installable (`.apk`) et accéder au natif.
- **Persistance locale** : `@capacitor/preferences` (JSON) pour la config + le journal.
  Suffisant pour un usage perso ; migration possible vers `@capacitor-community/sqlite` si le journal grossit trop.
- **État** : Angular **signals** dans des services `providedIn: 'root'` (pas besoin de NgRx).
- Pas de tests lourds au départ ; quelques tests unitaires sur la logique métier (multiplicateur, calcul de points).

Initialisation prévue (phase d'exécution, hors plan mode) :
```
npm i -g @ionic/cli
ionic start geek-fit tabs --type=angular --capacitor
# puis: ionic build && npx cap add android && npx cap open android
```

---

## Modèle de données (interfaces TypeScript)

Fichier `src/app/core/models/` :

- **`AppConfig`**
  - `sportRate: number` (points/min sport, défaut 1)
  - `multiplierStrategy: 'calendar' | 'cumulative'`
  - `calendar: { cap: number | null }`
  - `cumulative: { maxSessions: number; maxGapDays: number }` (défauts 3 / 3)
  - `bonusActivities: BonusActivity[]`
  - `specialActivities: SpecialActivity[]`
  - `board: { columns: BoardColumn[] }`  (colonnes + coefficients, ordonnées)
  - `spendActivities: SpendActivity[]`
  - `rewards: Reward[]`
  - `allowNegativeBalance: boolean` (défaut `false`)
- **`BonusActivity`** : `{ id, name, rate: number /* points/min, réduit */, enabled }`
- **`SpecialActivity`** : `{ id, name, rate: number /* points/min */, fixedBonus: number, columnId: string }`
- **`BoardColumn`** : `{ id, name, coefficient: number, order: number }`
  (défauts : `TODO` ×1, `URGENT ET IMPORTANT` ×2, `URGENT ET PAS IMPORTANT` ×1.5,
  `IMPORTANT ET PAS URGENT` ×1.25, `PAS IMPORTANT ET PAS URGENT` ×1 — tous ajustables)
- **`SpendActivity`** : `{ id, name, rate: number /* points/min consommés */ }`  (ex. « Jeux vidéo »)
- **`Reward`** : `{ id, name, cost: number }`  (ex. « Restaurant » = 300 pts)
- **`LedgerEntry`** (journal unique gain **et** dépense) :
  - `id, timestamp, kind: 'sport' | 'bonus' | 'special' | 'spend-time' | 'spend-reward'`
  - `label` (nom activité/récompense)
  - `durationMin?` (pour sport/bonus/special/spend-time)
  - `multiplier?` (pour sport/special), `columnCoefficient?` (pour special)
  - `points: number` (positif = gain, négatif = dépense)

---

## Architecture applicative

**Services (`src/app/core/services/`)**
- `StorageService` — lecture/écriture Capacitor Preferences (config + journal), sérialisation JSON.
- `ConfigService` — expose la config en `signal`, valeurs par défaut, mise à jour depuis l'écran Réglages.
- `LedgerService` — ajoute des entrées, expose `entries` et `balance` (computed signal).
- `MultiplierService` — fonctions pures testables :
  - `nextSportMultiplier(entries, cfg)` — multiplicateur de la **prochaine séance de sport** (stratégie calendaire ou cumulative).
  - `currentSportMultiplier(entries, cfg)` — niveau **atteint** dans la période courante, appliqué aux **activités spéciales**.
- `EligibilityService` — `isBonusUnlocked()` : du sport a-t-il été fait dans la période courante ?
  (partagé par les activités bonus **et** spéciales).
- `TimerService` — état du chrono actif (`running`, `elapsedSec`, type d'activité), start/stop ; à l'arrêt,
  calcule les points et délègue à `LedgerService`.

**Écrans (onglets Ionic `src/app/tabs/`)**
1. **Accueil / Solde** — solde courant en grand, séances de la semaine + multiplicateur de la prochaine séance,
   statut « activités bonus débloquées ? », raccourcis (Démarrer sport / Dépenser).
2. **Gagner** — chrono sport (start/stop) + bouton « saisie manuelle » (durée + date) ;
   liste des activités bonus (chrono), grisées si non débloquées ;
   accès au **Tableau des activités spéciales** (bouton/carte).
3. **Tableau (activités spéciales)** — page dédiée type Trello : colonnes = matrice d'Eisenhower,
   cartes déplaçables en **glisser-déposer** entre colonnes (Angular CDK DragDrop) ;
   chaque carte : chrono de validation ; grisée si le sport n'est pas fait dans la période.
4. **Dépenser** — chrono « dépense au temps » par activité (décompte live du solde) ;
   liste des récompenses à acheter (coût fixe), désactivées si solde insuffisant.
5. **Historique** — journal chronologique des gains/dépenses, avec filtre par type.
6. **Réglages** — paramétrage complet : taux sport, stratégie de multiplicateur + ses paramètres,
   CRUD des activités bonus / **spéciales** / de dépense / récompenses, **colonnes + coefficients du tableau**, option solde négatif.

Navigation : 5 onglets bas (Accueil, Gagner, Dépenser, Historique, Réglages) ; le **Tableau** est une page
routée accessible depuis **Gagner** (évite un 6ᵉ onglet, peu ergonomique sur mobile).

Dépendance UI supplémentaire : **`@angular/cdk`** (module `DragDrop`) pour le glisser-déposer du tableau.

---

## Méthode de développement (TDD + diagramme de classe)

Ces deux règles s'appliquent à **chaque** jalon ci-dessous.

### TDD (Test-Driven Development)
Cycle **Red → Green → Refactor** pour toute logique métier :
1. **Red** — écrire d'abord le(s) test(s) qui décrivent le comportement attendu ; ils échouent.
2. **Green** — écrire le minimum de code pour faire passer les tests.
3. **Refactor** — nettoyer sans casser les tests.

- Outils : **Jasmine + Karma** (fournis par le template Angular) ; `ng test` en `--watch` pendant le dev.
- Priorité aux **fonctions pures** faciles à tester : `MultiplierService` (calendaire & cumulatif),
  calcul des points (sport, bonus, spéciales avec `(temps + bonus_fixe) × mult × coef_colonne`),
  dérivation du solde dans `LedgerService`, `EligibilityService`.
- Les services à effets de bord (`StorageService`, `TimerService`) sont testés via mocks/fakes ;
  l'UI Ionic est validée par le parcours bout-en-bout (§ Vérification), pas en TDD strict.
- **Aucun code métier n'est écrit avant son test.**

### Diagramme de classe tenu à jour
- Un fichier **`docs/architecture.md`** contient un **diagramme de classe Mermaid** (`classDiagram`)
  décrivant modèles, services et leurs relations.
- **À chaque écriture/modification de code** touchant la structure (nouveau modèle, service, méthode publique
  significative, relation), le diagramme est **mis à jour dans le même lot** et un extrait est présenté dans la réponse.
- Le diagramme sert de fil conducteur pour suivre l'architecture au fil des jalons.

## Découpage en jalons (exécution)

1. **Bootstrap** — `ionic start` (template tabs), Capacitor Android, structure `core/` + modèles + thème,
   vérifier que `ng test` tourne, créer `docs/architecture.md` avec le premier diagramme de classe.
2. **Persistance & config** — `StorageService`, `ConfigService` + valeurs par défaut, écran **Réglages** (lecture/édition).
3. **Gagner du sport** — `TimerService` + chrono, `LedgerService`, saisie manuelle, écran **Gagner** (sport uniquement).
4. **Multiplicateur** — `MultiplierService` (2 stratégies) + tests unitaires, affichage sur **Accueil**.
5. **Activités bonus** — `EligibilityService`, taux réduit, intégration dans **Gagner**.
6. **Activités spéciales (tableau)** — modèle + colonnes/coefficients, page Trello avec CDK DragDrop,
   `currentSportMultiplier`, formule `(temps + bonus_fixe) × mult × coef_colonne`, CRUD dans Réglages.
7. **Dépenses** — dépense au temps (chrono décompte) + récompenses à coût fixe, écran **Dépenser**.
8. **Accueil & Historique** — solde, progression hebdo, journal filtrable.
9. **Finition** — thème/icône, build `.apk` de test sur le téléphone.

---

## Vérification (fin de parcours)

- **Logique métier** : tests unitaires des fonctions pures de `MultiplierService`
  (calendaire : ×1→×2→×3 puis reset lundi ; cumulatif : chaîne de 3, reset si gap > 3 jours ou après 3 séances)
  et du calcul de points (sport, bonus, dépenses).
- **Bout en bout dans le navigateur** (`ionic serve`) :
  1. Configurer un taux + une activité de dépense + une récompense dans Réglages.
  2. Lancer un chrono sport, l'arrêter → vérifier gain = durée × taux × multiplicateur et solde à jour.
  3. Refaire une 2ᵉ séance → vérifier ×2 (selon stratégie).
  4. Vérifier que les activités bonus se débloquent après une séance de sport et rapportent au taux réduit.
  5. **Tableau** : créer une carte spéciale, la glisser dans « URGENT ET IMPORTANT », la valider au chrono →
     vérifier `(durée × taux + bonus_fixe) × multiplicateur × coef_colonne` ; vérifier qu'elle est grisée sans sport.
  6. Dépenser au temps → vérifier le décompte live ; acheter une récompense → vérifier le débit fixe.
  7. Recharger l'app → vérifier la **persistance** (config + journal + solde).
- **Sur appareil** : `ionic build && npx cap run android` → tester le chrono et la persistance sur le téléphone.
