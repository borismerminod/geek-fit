/** Nature d'une entrée du journal (gain ou dépense). */
export type LedgerKind = 'sport' | 'bonus' | 'special' | 'spend-time' | 'spend-reward';

/**
 * Entrée du journal d'opérations : unique source de vérité du solde.
 * `points` est positif pour un gain, négatif pour une dépense.
 */
export interface LedgerEntry {
  id: string;
  /** Horodatage ISO 8601. */
  timestamp: string;
  kind: LedgerKind;
  /** Nom de l'activité ou de la récompense. */
  label: string;
  /** Durée en minutes (sport / bonus / special / spend-time). */
  durationMin?: number;
  /** Multiplicateur appliqué (sport / special). */
  multiplier?: number;
  /** Coefficient de colonne appliqué (special). */
  columnCoefficient?: number;
  /** Points gagnés (>0) ou dépensés (<0). */
  points: number;
}
