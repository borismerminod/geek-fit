import { TestBed } from '@angular/core/testing';
import { Preferences } from '@capacitor/preferences';

import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageService);
    await Preferences.clear();
  });

  it('retourne null pour une clé absente', async () => {
    expect(await service.getJson('inconnue')).toBeNull();
  });

  it('persiste puis relit un objet JSON', async () => {
    await service.setJson('cle', { a: 1, b: 'x' });
    expect(await service.getJson('cle')).toEqual({ a: 1, b: 'x' });
  });

  it('écrase une valeur existante', async () => {
    await service.setJson('cle', { v: 1 });
    await service.setJson('cle', { v: 2 });
    expect(await service.getJson<{ v: number }>('cle')).toEqual({ v: 2 });
  });

  it('supprime une clé', async () => {
    await service.setJson('cle', { v: 1 });
    await service.remove('cle');
    expect(await service.getJson('cle')).toBeNull();
  });
});
