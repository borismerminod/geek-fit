import { Injectable, inject, signal } from '@angular/core';

import { AppConfig, DEFAULT_CONFIG } from '../models';
import { StorageService } from './storage.service';

/** Clé de stockage de la configuration. */
export const CONFIG_KEY = 'geekfit.config';

/**
 * Détient la configuration paramétrable de l'application sous forme de signal,
 * la persiste via {@link StorageService} et la réhydrate au démarrage (`load`).
 */
@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly storage = inject(StorageService);

  private readonly _config = signal<AppConfig>(structuredClone(DEFAULT_CONFIG));
  /** Configuration courante (lecture seule). */
  readonly config = this._config.asReadonly();

  /** Recharge la config depuis le stockage, en complétant les champs manquants. */
  async load(): Promise<void> {
    const stored = await this.storage.getJson<Partial<AppConfig>>(CONFIG_KEY);
    if (stored) {
      this._config.set({ ...structuredClone(DEFAULT_CONFIG), ...stored });
    }
  }

  /** Applique une modification partielle, met à jour le signal et persiste. */
  async update(patch: Partial<AppConfig>): Promise<void> {
    const next: AppConfig = { ...this._config(), ...patch };
    this._config.set(next);
    await this.storage.setJson(CONFIG_KEY, next);
  }

  /** Restaure la configuration par défaut et la persiste. */
  async reset(): Promise<void> {
    const fresh = structuredClone(DEFAULT_CONFIG);
    this._config.set(fresh);
    await this.storage.setJson(CONFIG_KEY, fresh);
  }
}
