import { AppConfig, DEFAULT_CONFIG, LedgerEntry } from '../models';
import {
  currentSportMultiplier,
  nextSportMultiplier,
  sportSessionsThisWeek,
} from './multiplier';

/** Fabrique une entrée « sport » à la date donnée. */
function sport(date: Date): LedgerEntry {
  return { id: Math.random().toString(), timestamp: date.toISOString(), kind: 'sport', label: 's', points: 10 };
}

/** Fabrique un marqueur de réinitialisation du multiplicateur. */
function reset(date: Date): LedgerEntry {
  return { id: Math.random().toString(), timestamp: date.toISOString(), kind: 'multiplier-reset', label: 'reset', points: 0 };
}

function calendarCfg(cap: number | null = null, increment = 1): AppConfig {
  return { ...DEFAULT_CONFIG, multiplierStrategy: 'calendar', calendar: { cap, increment } };
}

function cumulativeCfg(maxSessions = 3, maxGapDays = 3): AppConfig {
  return { ...DEFAULT_CONFIG, multiplierStrategy: 'cumulative', cumulative: { maxSessions, maxGapDays } };
}

describe('multiplier — stratégie calendaire', () => {
  // Mercredi 7 janvier 2026 ; lundi de la semaine = 5 janvier.
  const now = new Date(2026, 0, 7, 12, 0, 0).getTime();

  it('sans séance : prochaine ×1, courante ×1', () => {
    const cfg = calendarCfg();
    expect(nextSportMultiplier([], cfg, now)).toBe(1);
    expect(currentSportMultiplier([], cfg, now)).toBe(1);
  });

  it('1 séance cette semaine : prochaine ×2, courante ×1', () => {
    const entries = [sport(new Date(2026, 0, 5, 9, 0))]; // lundi
    const cfg = calendarCfg();
    expect(nextSportMultiplier(entries, cfg, now)).toBe(2);
    expect(currentSportMultiplier(entries, cfg, now)).toBe(1);
  });

  it('2 séances cette semaine : prochaine ×3, courante ×2', () => {
    const entries = [sport(new Date(2026, 0, 5, 9, 0)), sport(new Date(2026, 0, 6, 9, 0))];
    const cfg = calendarCfg();
    expect(nextSportMultiplier(entries, cfg, now)).toBe(3);
    expect(currentSportMultiplier(entries, cfg, now)).toBe(2);
  });

  it('les séances des semaines précédentes sont ignorées', () => {
    const entries = [sport(new Date(2026, 0, 1, 9, 0))]; // jeudi semaine précédente
    const cfg = calendarCfg();
    expect(nextSportMultiplier(entries, cfg, now)).toBe(1);
    expect(currentSportMultiplier(entries, cfg, now)).toBe(1);
  });

  it('respecte le plafond', () => {
    const entries = [
      sport(new Date(2026, 0, 5, 9, 0)),
      sport(new Date(2026, 0, 6, 9, 0)),
      sport(new Date(2026, 0, 7, 9, 0)),
    ];
    const cfg = calendarCfg(2);
    expect(nextSportMultiplier(entries, cfg, now)).toBe(2); // min(4, 2)
    expect(currentSportMultiplier(entries, cfg, now)).toBe(2); // min(3, 2)
  });

  it('sportSessionsThisWeek compte les séances de la semaine courante', () => {
    const entries = [
      sport(new Date(2026, 0, 1, 9, 0)), // semaine précédente
      sport(new Date(2026, 0, 5, 9, 0)),
      sport(new Date(2026, 0, 6, 9, 0)),
    ];
    expect(sportSessionsThisWeek(entries, now)).toBe(2);
  });

  it('sportSessionsThisWeek retombe à zéro après une réinitialisation', () => {
    const entries = [
      sport(new Date(2026, 0, 5, 9, 0)),
      sport(new Date(2026, 0, 6, 9, 0)),
      reset(new Date(2026, 0, 6, 12, 0)),
    ];
    expect(sportSessionsThisWeek(entries, now)).toBe(0);
  });

  it('sportSessionsThisWeek recompte les séances postérieures au reset', () => {
    const entries = [
      sport(new Date(2026, 0, 5, 9, 0)),
      reset(new Date(2026, 0, 5, 12, 0)),
      sport(new Date(2026, 0, 6, 9, 0)),
    ];
    expect(sportSessionsThisWeek(entries, now)).toBe(1);
  });

  it('incrément paramétrable (0,5) : ×1, ×1.5, ×2', () => {
    const cfg = calendarCfg(null, 0.5);
    const e1 = [sport(new Date(2026, 0, 5, 9, 0))];
    expect(currentSportMultiplier(e1, cfg, now)).toBe(1);
    expect(nextSportMultiplier(e1, cfg, now)).toBe(1.5);

    const e2 = [...e1, sport(new Date(2026, 0, 6, 9, 0))];
    expect(currentSportMultiplier(e2, cfg, now)).toBe(1.5);
    expect(nextSportMultiplier(e2, cfg, now)).toBe(2);
  });

  it('une réinitialisation ramène le multiplicateur au plus bas', () => {
    const cfg = calendarCfg();
    const entries = [
      sport(new Date(2026, 0, 5, 9, 0)),
      sport(new Date(2026, 0, 6, 9, 0)),
      reset(new Date(2026, 0, 6, 12, 0)),
    ];
    expect(currentSportMultiplier(entries, cfg, now)).toBe(1);
    expect(nextSportMultiplier(entries, cfg, now)).toBe(1);
  });

  it('les séances après une réinitialisation recomptent depuis le bas', () => {
    const cfg = calendarCfg();
    const entries = [
      sport(new Date(2026, 0, 5, 9, 0)),
      reset(new Date(2026, 0, 5, 12, 0)),
      sport(new Date(2026, 0, 6, 9, 0)), // 1 séance après le reset
    ];
    expect(currentSportMultiplier(entries, cfg, now)).toBe(1);
    expect(nextSportMultiplier(entries, cfg, now)).toBe(2);
  });
});

describe('multiplier — stratégie cumulative', () => {
  const now = new Date(2026, 0, 10, 12, 0, 0).getTime();
  const daysAgo = (n: number) => new Date(now - n * 24 * 60 * 60 * 1000);

  it('sans séance : prochaine ×1', () => {
    expect(nextSportMultiplier([], cumulativeCfg(), now)).toBe(1);
    expect(currentSportMultiplier([], cumulativeCfg(), now)).toBe(1);
  });

  it('1 séance récente : prochaine ×2, courante ×1', () => {
    const entries = [sport(daysAgo(1))];
    expect(nextSportMultiplier(entries, cumulativeCfg(), now)).toBe(2);
    expect(currentSportMultiplier(entries, cumulativeCfg(), now)).toBe(1);
  });

  it('2 séances rapprochées : prochaine ×3, courante ×2', () => {
    const entries = [sport(daysAgo(2)), sport(daysAgo(1))];
    expect(nextSportMultiplier(entries, cumulativeCfg(), now)).toBe(3);
    expect(currentSportMultiplier(entries, cumulativeCfg(), now)).toBe(2);
  });

  it('chaîne pleine (3 séances) : prochaine repart à ×1, courante ×3', () => {
    const entries = [sport(daysAgo(3)), sport(daysAgo(2)), sport(daysAgo(1))];
    expect(nextSportMultiplier(entries, cumulativeCfg(), now)).toBe(1);
    expect(currentSportMultiplier(entries, cumulativeCfg(), now)).toBe(3);
  });

  it('écart trop grand dans l’historique : la chaîne repart', () => {
    const entries = [sport(daysAgo(10)), sport(daysAgo(1))]; // écart 9 j > 3
    expect(currentSportMultiplier(entries, cumulativeCfg(), now)).toBe(1);
    expect(nextSportMultiplier(entries, cumulativeCfg(), now)).toBe(2);
  });

  it('écart trop grand depuis la dernière séance : prochaine ×1', () => {
    const entries = [sport(daysAgo(5))]; // 5 j > 3
    expect(nextSportMultiplier(entries, cumulativeCfg(), now)).toBe(1);
  });

  it('réinitialisation : ignore les séances antérieures au reset', () => {
    const entries = [sport(daysAgo(2)), sport(daysAgo(1)), reset(daysAgo(0.5))];
    expect(currentSportMultiplier(entries, cumulativeCfg(), now)).toBe(1);
    expect(nextSportMultiplier(entries, cumulativeCfg(), now)).toBe(1);
  });
});
