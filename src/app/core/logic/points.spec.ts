import { bonusPoints, specialPoints, sportPoints } from './points';

describe('points (calcul des gains)', () => {
  describe('sportPoints = durée × taux × multiplicateur', () => {
    it('rapporte la durée telle quelle au taux 1 sans multiplicateur', () => {
      expect(sportPoints(30, 1, 1)).toBe(30);
    });

    it('applique le multiplicateur', () => {
      expect(sportPoints(30, 1, 2)).toBe(60);
      expect(sportPoints(30, 1, 3)).toBe(90);
    });

    it('applique un taux fractionnaire', () => {
      expect(sportPoints(30, 0.5, 3)).toBe(45);
    });

    it('arrondit à l’entier le plus proche', () => {
      expect(sportPoints(10, 0.33, 1)).toBe(3); // 3.3 -> 3
    });
  });

  describe('bonusPoints = durée × taux (réduit, sans multiplicateur)', () => {
    it('applique le taux réduit', () => {
      expect(bonusPoints(20, 0.5)).toBe(10);
    });

    it('arrondit à l’entier le plus proche', () => {
      expect(bonusPoints(15, 0.5)).toBe(8); // 7.5 -> 8
    });
  });

  describe('specialPoints = (durée × taux + bonus_fixe) × multiplicateur × coef_colonne', () => {
    it('combine temps, bonus fixe, multiplicateur et coefficient', () => {
      // (30 × 1 + 50) × 2 × 1.5 = 80 × 3 = 240
      expect(specialPoints(30, 1, 50, 2, 1.5)).toBe(240);
    });

    it('fonctionne sans bonus fixe ni coefficient particulier', () => {
      expect(specialPoints(30, 1, 0, 1, 1)).toBe(30);
    });

    it('multiplie aussi le bonus fixe', () => {
      // (0 × 1 + 10) × 3 × 1 = 30
      expect(specialPoints(0, 1, 10, 3, 1)).toBe(30);
    });

    it('arrondit à l’entier le plus proche', () => {
      // (10 × 0.3 + 0) × 1 × 1.25 = 3.75 -> 4
      expect(specialPoints(10, 0.3, 0, 1, 1.25)).toBe(4);
    });
  });
});
