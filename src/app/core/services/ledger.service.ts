import { Injectable, computed, inject, signal } from '@angular/core';

import { LedgerEntry } from '../models';
import { StorageService } from './storage.service';

/** Clé de stockage du journal d'opérations. */
export const LEDGER_KEY = 'geekfit.ledger';

/** Entrée à ajouter : l'id et le timestamp sont générés par le service. */
export type NewLedgerEntry = Omit<LedgerEntry, 'id' | 'timestamp'> & { timestamp?: string };

/**
 * Journal d'opérations : unique source de vérité du solde.
 * Le solde est dérivé (computed) et n'est jamais stocké tel quel.
 */
@Injectable({ providedIn: 'root' })
export class LedgerService {
  private readonly storage = inject(StorageService);

  private readonly _entries = signal<LedgerEntry[]>([]);
  /** Journal courant (lecture seule), du plus ancien au plus récent. */
  readonly entries = this._entries.asReadonly();
  /** Solde = somme des points de toutes les entrées. */
  readonly balance = computed(() => this._entries().reduce((sum, e) => sum + e.points, 0));

  /** Recharge le journal depuis le stockage. */
  async load(): Promise<void> {
    const stored = await this.storage.getJson<LedgerEntry[]>(LEDGER_KEY);
    if (stored) {
      this._entries.set(stored);
    }
  }

  /** Ajoute une entrée (id + timestamp générés), met à jour le signal et persiste. */
  async add(entry: NewLedgerEntry): Promise<LedgerEntry> {
    const full: LedgerEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: entry.timestamp ?? new Date().toISOString(),
    };
    this._entries.update((list) => [...list, full]);
    await this.persist();
    return full;
  }

  /** Vide le journal et le stockage. */
  async clear(): Promise<void> {
    this._entries.set([]);
    await this.persist();
  }

  private async persist(): Promise<void> {
    await this.storage.setJson(LEDGER_KEY, this._entries());
  }
}
