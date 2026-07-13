import { TestBed } from '@angular/core/testing';
import { Preferences } from '@capacitor/preferences';

import { DEFAULT_CONFIG } from '../models';
import { CONFIG_KEY, ConfigService } from './config.service';

describe('ConfigService', () => {
  let service: ConfigService;

  beforeEach(async () => {
    await Preferences.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfigService);
  });

  it('expose la config par défaut avant tout chargement', () => {
    expect(service.config()).toEqual(DEFAULT_CONFIG);
  });

  it('update modifie le signal et persiste', async () => {
    await service.update({ sportRate: 2 });
    expect(service.config().sportRate).toBe(2);

    const { value } = await Preferences.get({ key: CONFIG_KEY });
    expect(JSON.parse(value!).sportRate).toBe(2);
  });

  it('load réhydrate le signal depuis le stockage', async () => {
    await Preferences.set({
      key: CONFIG_KEY,
      value: JSON.stringify({ ...DEFAULT_CONFIG, sportRate: 5 }),
    });

    await service.load();

    expect(service.config().sportRate).toBe(5);
  });

  it('load complète les champs manquants avec les valeurs par défaut', async () => {
    await Preferences.set({ key: CONFIG_KEY, value: JSON.stringify({ sportRate: 7 }) });

    await service.load();

    expect(service.config().sportRate).toBe(7);
    expect(service.config().multiplierStrategy).toBe(DEFAULT_CONFIG.multiplierStrategy);
    expect(service.config().calendar).toEqual(DEFAULT_CONFIG.calendar);
  });

  it('load complète les sous-objets (calendar sans increment)', async () => {
    await Preferences.set({
      key: CONFIG_KEY,
      value: JSON.stringify({ ...DEFAULT_CONFIG, calendar: { cap: 5 } }),
    });

    await service.load();

    expect(service.config().calendar.cap).toBe(5);
    expect(service.config().calendar.increment).toBe(DEFAULT_CONFIG.calendar.increment);
  });

  it('reset restaure la config par défaut et persiste', async () => {
    await service.update({ sportRate: 9 });

    await service.reset();

    expect(service.config()).toEqual(DEFAULT_CONFIG);
    const { value } = await Preferences.get({ key: CONFIG_KEY });
    expect(JSON.parse(value!)).toEqual(DEFAULT_CONFIG);
  });
});
