import { AppConfig, LedgerEntry } from '../models';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Horodatages (ms) des séances de sport, triés du plus ancien au plus récent. */
function sportTimestamps(entries: LedgerEntry[]): number[] {
  return entries
    .filter((e) => e.kind === 'sport')
    .map((e) => new Date(e.timestamp).getTime())
    .sort((a, b) => a - b);
}

/** Début (lundi 00:00, heure locale) de la semaine contenant `now`. */
function startOfWeekMonday(now: number): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = dimanche … 6 = samedi
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - daysSinceMonday);
  return d.getTime();
}

function applyCap(value: number, cap: number | null): number {
  return cap === null ? value : Math.min(value, cap);
}

/** Horodatage (ms) du dernier marqueur de réinitialisation, ou -Infinity si aucun. */
function lastResetTime(entries: LedgerEntry[], now: number): number {
  let last = -Infinity;
  for (const e of entries) {
    if (e.kind === 'multiplier-reset') {
      const t = new Date(e.timestamp).getTime();
      if (t <= now && t > last) {
        last = t;
      }
    }
  }
  return last;
}

/** Horodatages des séances de sport postérieures au dernier reset. */
function activeSportTimestamps(entries: LedgerEntry[], now: number): number[] {
  const reset = lastResetTime(entries, now);
  return sportTimestamps(entries).filter((t) => t > reset);
}

/**
 * Multiplicateur attribué à chaque séance en stratégie cumulative.
 * La chaîne s'incrémente tant que l'écart reste ≤ maxGapDays et repart à 1
 * après maxSessions séances ou dès qu'un écart dépasse maxGapDays.
 */
function cumulativeChain(times: number[], maxSessions: number, maxGapDays: number): number[] {
  const result: number[] = [];
  let pos = 0;
  for (let i = 0; i < times.length; i++) {
    if (i === 0) {
      pos = 1;
    } else if (pos >= maxSessions) {
      pos = 1; // la chaîne précédente s'est close
    } else if ((times[i] - times[i - 1]) / DAY_MS > maxGapDays) {
      pos = 1; // écart trop grand : chaîne rompue
    } else {
      pos = pos + 1;
    }
    result.push(pos);
  }
  return result;
}

/**
 * Nombre de séances de sport de la semaine courante postérieures au dernier reset.
 * Une réinitialisation du multiplicateur remet donc aussi ce compteur à zéro.
 */
export function sportSessionsThisWeek(entries: LedgerEntry[], now = Date.now()): number {
  const weekStart = startOfWeekMonday(now);
  return activeSportTimestamps(entries, now).filter((t) => t >= weekStart).length;
}

/** Multiplicateur qui s'appliquera à la PROCHAINE séance de sport. */
export function nextSportMultiplier(entries: LedgerEntry[], cfg: AppConfig, now = Date.now()): number {
  const times = activeSportTimestamps(entries, now);

  if (cfg.multiplierStrategy === 'calendar') {
    const increment = cfg.calendar.increment ?? 1;
    const count = times.filter((t) => t >= startOfWeekMonday(now)).length;
    return applyCap(1 + count * increment, cfg.calendar.cap);
  }

  const { maxSessions, maxGapDays } = cfg.cumulative;
  if (times.length === 0) {
    return 1;
  }
  const chain = cumulativeChain(times, maxSessions, maxGapDays);
  const lastMult = chain[chain.length - 1];
  const lastTs = times[times.length - 1];
  if (lastMult >= maxSessions || (now - lastTs) / DAY_MS > maxGapDays) {
    return 1;
  }
  return lastMult + 1;
}

/**
 * Multiplicateur ATTEINT dans la période courante (celui de la séance la plus
 * récente). Appliqué aux activités spéciales.
 */
export function currentSportMultiplier(entries: LedgerEntry[], cfg: AppConfig, now = Date.now()): number {
  const times = activeSportTimestamps(entries, now);

  if (cfg.multiplierStrategy === 'calendar') {
    const increment = cfg.calendar.increment ?? 1;
    const count = times.filter((t) => t >= startOfWeekMonday(now)).length;
    return count === 0 ? 1 : applyCap(1 + (count - 1) * increment, cfg.calendar.cap);
  }

  if (times.length === 0) {
    return 1;
  }
  const chain = cumulativeChain(times, cfg.cumulative.maxSessions, cfg.cumulative.maxGapDays);
  return chain[chain.length - 1];
}
