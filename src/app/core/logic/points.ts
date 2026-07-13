/**
 * Fonctions pures de calcul des points (la monnaie de l'application).
 * Aucune dépendance Angular : entièrement testable en isolation (TDD).
 * Les points sont arrondis à l'entier le plus proche.
 */

/** Sport : `durée × taux × multiplicateur`. */
export function sportPoints(durationMin: number, sportRate: number, multiplier: number): number {
  return Math.round(durationMin * sportRate * multiplier);
}

/** Activité bonus : `durée × taux` (réduit, sans multiplicateur). */
export function bonusPoints(durationMin: number, rate: number): number {
  return Math.round(durationMin * rate);
}

/** Activité spéciale : `(durée × taux + bonus_fixe) × multiplicateur × coef_colonne`. */
export function specialPoints(
  durationMin: number,
  rate: number,
  fixedBonus: number,
  multiplier: number,
  columnCoefficient: number,
): number {
  return Math.round((durationMin * rate + fixedBonus) * multiplier * columnCoefficient);
}
