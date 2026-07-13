import { TestBed } from '@angular/core/testing';
import { Preferences } from '@capacitor/preferences';

import { LEDGER_KEY, LedgerService } from './ledger.service';

describe('LedgerService', () => {
  let service: LedgerService;

  beforeEach(async () => {
    await Preferences.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(LedgerService);
  });

  it('démarre avec un journal vide et un solde nul', () => {
    expect(service.entries()).toEqual([]);
    expect(service.balance()).toBe(0);
  });

  it('add génère un id et un timestamp et ajoute l’entrée', async () => {
    const entry = await service.add({
      kind: 'sport',
      label: 'Séance',
      durationMin: 30,
      multiplier: 1,
      points: 30,
    });

    expect(entry.id).toBeTruthy();
    expect(entry.timestamp).toBeTruthy();
    expect(service.entries().length).toBe(1);
  });

  it('balance somme les points (gains positifs, dépenses négatives)', async () => {
    await service.add({ kind: 'sport', label: 'Sport', points: 30 });
    await service.add({ kind: 'spend-reward', label: 'Resto', points: -20 });

    expect(service.balance()).toBe(10);
  });

  it('persiste le journal dans le stockage', async () => {
    await service.add({ kind: 'sport', label: 'Sport', points: 30 });

    const { value } = await Preferences.get({ key: LEDGER_KEY });
    expect(JSON.parse(value!).length).toBe(1);
    expect(JSON.parse(value!)[0].points).toBe(30);
  });

  it('load réhydrate le journal depuis le stockage', async () => {
    await Preferences.set({
      key: LEDGER_KEY,
      value: JSON.stringify([
        { id: 'a', timestamp: '2026-01-01T00:00:00.000Z', kind: 'sport', label: 'Sport', points: 42 },
      ]),
    });

    await service.load();

    expect(service.entries().length).toBe(1);
    expect(service.balance()).toBe(42);
  });

  it('clear vide le journal et le stockage', async () => {
    await service.add({ kind: 'sport', label: 'Sport', points: 30 });

    await service.clear();

    expect(service.entries()).toEqual([]);
    expect(service.balance()).toBe(0);
  });
});
