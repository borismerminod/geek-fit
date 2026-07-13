import { Injectable } from '@angular/core';

import * as logic from '../logic/multiplier';
import { AppConfig, LedgerEntry } from '../models';

/**
 * Expose la logique de multiplicateur de sport (fonctions pures de
 * `core/logic/multiplier`) comme point d'injection réutilisable par l'UI.
 */
@Injectable({ providedIn: 'root' })
export class MultiplierService {
  /** Multiplicateur de la prochaine séance de sport. */
  nextSportMultiplier(entries: LedgerEntry[], cfg: AppConfig, now = Date.now()): number {
    return logic.nextSportMultiplier(entries, cfg, now);
  }

  /** Multiplicateur atteint dans la période courante (pour les activités spéciales). */
  currentSportMultiplier(entries: LedgerEntry[], cfg: AppConfig, now = Date.now()): number {
    return logic.currentSportMultiplier(entries, cfg, now);
  }

  /** Nombre de séances de sport de la semaine courante. */
  sportSessionsThisWeek(entries: LedgerEntry[], now = Date.now()): number {
    return logic.sportSessionsThisWeek(entries, now);
  }
}
