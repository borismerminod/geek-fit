import { TestBed } from '@angular/core/testing';

import { TimerService } from './timer.service';

describe('TimerService', () => {
  let service: TimerService;

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 0, 1, 10, 0, 0));
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimerService);
  });

  afterEach(() => {
    service.reset();
    jasmine.clock().uninstall();
  });

  it('démarre à zéro et non actif', () => {
    expect(service.running()).toBeFalse();
    expect(service.elapsedSec()).toBe(0);
  });

  it('start passe en mode actif et mesure le temps écoulé', () => {
    service.start();
    expect(service.running()).toBeTrue();

    jasmine.clock().tick(5000);
    expect(service.elapsedSec()).toBe(5);
  });

  it('stop fige la durée écoulée et renvoie les secondes', () => {
    service.start();
    jasmine.clock().tick(90000);

    const sec = service.stop();

    expect(sec).toBe(90);
    expect(service.running()).toBeFalse();
    expect(service.elapsedSec()).toBe(90);
  });

  it('elapsedMin convertit les secondes en minutes', () => {
    service.start();
    jasmine.clock().tick(90000);
    service.stop();

    expect(service.elapsedMin()).toBe(1.5);
  });

  it('reset remet le chrono à zéro', () => {
    service.start();
    jasmine.clock().tick(5000);
    service.reset();

    expect(service.running()).toBeFalse();
    expect(service.elapsedSec()).toBe(0);
  });

  it('un double start n’est pas cumulatif', () => {
    service.start();
    jasmine.clock().tick(3000);
    service.start(); // ignoré car déjà en cours
    jasmine.clock().tick(2000);

    expect(service.elapsedSec()).toBe(5);
  });
});
