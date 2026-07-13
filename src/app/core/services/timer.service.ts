import { Injectable, computed, signal } from '@angular/core';

/**
 * Chronomètre partagé (sport, activités bonus/spéciales, dépense au temps).
 * Le temps écoulé est calculé à partir d'un horodatage de départ (précis même
 * si l'intervalle d'affichage se déclenche irrégulièrement).
 */
@Injectable({ providedIn: 'root' })
export class TimerService {
  private readonly _running = signal(false);
  private readonly _elapsedSec = signal(0);

  /** Chrono en cours ? */
  readonly running = this._running.asReadonly();
  /** Temps écoulé, en secondes. */
  readonly elapsedSec = this._elapsedSec.asReadonly();
  /** Temps écoulé, en minutes (fractionnaire). */
  readonly elapsedMin = computed(() => this._elapsedSec() / 60);

  private startedAt = 0;
  private handle: ReturnType<typeof setInterval> | null = null;

  /** Démarre le chrono (sans effet s'il tourne déjà). */
  start(): void {
    if (this._running()) {
      return;
    }
    this.startedAt = Date.now();
    this._elapsedSec.set(0);
    this._running.set(true);
    this.handle = setInterval(() => this.tick(), 250);
  }

  /** Arrête le chrono et renvoie la durée écoulée en secondes. */
  stop(): number {
    if (!this._running()) {
      return this._elapsedSec();
    }
    this.clearTick();
    this.tick();
    this._running.set(false);
    return this._elapsedSec();
  }

  /** Remet le chrono à zéro. */
  reset(): void {
    this.clearTick();
    this._running.set(false);
    this._elapsedSec.set(0);
  }

  private tick(): void {
    this._elapsedSec.set(Math.floor((Date.now() - this.startedAt) / 1000));
  }

  private clearTick(): void {
    if (this.handle !== null) {
      clearInterval(this.handle);
      this.handle = null;
    }
  }
}
