/**
 * Stratégie de calcul du multiplicateur de sport.
 * - `calendar`   : compteur remis à zéro chaque lundi.
 * - `cumulative` : chaîne de séances rapprochées (voir CumulativeConfig).
 */
export type MultiplierStrategy = 'calendar' | 'cumulative';

/** Paramètres de la stratégie calendaire. */
export interface CalendarConfig {
  /** Plafond du multiplicateur (`null` = illimité). */
  cap: number | null;
  /** Pas d'incrémentation entre deux séances (×1, ×1+inc, ×1+2·inc…). */
  increment: number;
}

/** Paramètres de la stratégie cumulative (chaîne de séances). */
export interface CumulativeConfig {
  /** Nombre maximum de séances cumulables dans une chaîne. */
  maxSessions: number;
  /** Écart maximum, en jours, entre deux séances consécutives. */
  maxGapDays: number;
}

/** Activité bonus rapportant au temps, à taux réduit (ex. ménage). */
export interface BonusActivity {
  id: string;
  name: string;
  /** Points par minute (réduit par rapport au sport). */
  rate: number;
  enabled: boolean;
}

/** Colonne du tableau des activités spéciales (matrice d'Eisenhower). */
export interface BoardColumn {
  id: string;
  name: string;
  /** Coefficient appliqué aux points des cartes de cette colonne. */
  coefficient: number;
  /** Ordre d'affichage. */
  order: number;
}

/** Activité spéciale : temps + bonus fixe, soumise au multiplicateur et au coef de colonne. */
export interface SpecialActivity {
  id: string;
  name: string;
  /** Points par minute. */
  rate: number;
  /** Montant fixe ajouté avant multiplication. */
  fixedBonus: number;
  /** Colonne courante (détermine le coefficient). */
  columnId: string;
}

/** Activité de dépense au temps (ex. jeux vidéo). */
export interface SpendActivity {
  id: string;
  name: string;
  /** Points consommés par minute. */
  rate: number;
}

/** Récompense à coût fixe (ex. restaurant). */
export interface Reward {
  id: string;
  name: string;
  /** Coût en points. */
  cost: number;
}

/** Configuration complète et paramétrable de l'application. */
export interface AppConfig {
  /** Points par minute de sport. */
  sportRate: number;
  multiplierStrategy: MultiplierStrategy;
  calendar: CalendarConfig;
  cumulative: CumulativeConfig;
  bonusActivities: BonusActivity[];
  specialActivities: SpecialActivity[];
  board: { columns: BoardColumn[] };
  spendActivities: SpendActivity[];
  rewards: Reward[];
  /** Autorise le solde à passer sous zéro. */
  allowNegativeBalance: boolean;
}

/** Identifiants stables des colonnes par défaut (matrice d'Eisenhower). */
export const DEFAULT_COLUMN_IDS = {
  TODO: 'todo',
  URGENT_IMPORTANT: 'urgent-important',
  URGENT_NOT_IMPORTANT: 'urgent-not-important',
  IMPORTANT_NOT_URGENT: 'important-not-urgent',
  NOT_URGENT_NOT_IMPORTANT: 'not-urgent-not-important',
} as const;

/** Colonnes par défaut avec leurs coefficients (tous ajustables). */
export const DEFAULT_COLUMNS: BoardColumn[] = [
  { id: DEFAULT_COLUMN_IDS.TODO, name: 'TODO', coefficient: 1, order: 0 },
  { id: DEFAULT_COLUMN_IDS.URGENT_IMPORTANT, name: 'URGENT ET IMPORTANT', coefficient: 2, order: 1 },
  { id: DEFAULT_COLUMN_IDS.URGENT_NOT_IMPORTANT, name: 'URGENT ET PAS IMPORTANT', coefficient: 1.5, order: 2 },
  { id: DEFAULT_COLUMN_IDS.IMPORTANT_NOT_URGENT, name: 'IMPORTANT ET PAS URGENT', coefficient: 1.25, order: 3 },
  { id: DEFAULT_COLUMN_IDS.NOT_URGENT_NOT_IMPORTANT, name: 'PAS IMPORTANT ET PAS URGENT', coefficient: 1, order: 4 },
];

/** Configuration par défaut au premier lancement. */
export const DEFAULT_CONFIG: AppConfig = {
  sportRate: 1,
  multiplierStrategy: 'calendar',
  calendar: { cap: null, increment: 1 },
  cumulative: { maxSessions: 3, maxGapDays: 3 },
  bonusActivities: [],
  specialActivities: [],
  board: { columns: DEFAULT_COLUMNS },
  spendActivities: [],
  rewards: [],
  allowNegativeBalance: false,
};
