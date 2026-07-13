import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

/**
 * Couche d'accès au stockage persistant du téléphone.
 * Unique point de contact avec `@capacitor/preferences`
 * (Android → SharedPreferences, iOS → UserDefaults, web → localStorage).
 * Toute migration future (ex. SQLite) se fait ici.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  /** Lit et désérialise la valeur JSON associée à `key`, ou `null` si absente. */
  async getJson<T>(key: string): Promise<T | null> {
    const { value } = await Preferences.get({ key });
    return value === null ? null : (JSON.parse(value) as T);
  }

  /** Sérialise et stocke `value` sous `key`. */
  async setJson<T>(key: string, value: T): Promise<void> {
    await Preferences.set({ key, value: JSON.stringify(value) });
  }

  /** Supprime la clé `key`. */
  async remove(key: string): Promise<void> {
    await Preferences.remove({ key });
  }
}
