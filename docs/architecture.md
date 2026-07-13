# Architecture — Geek-Fit

Ce document suit l'architecture de l'application au fil des jalons. Le diagramme de classe est
**mis à jour à chaque changement de structure** (nouveau modèle, service, méthode publique, relation).

Légende : ✅ implémenté · 🕓 prévu (jalon indiqué).

## Diagramme de classe

```mermaid
classDiagram
    direction LR

    %% ---------- Modèles (✅ Jalon 1) ----------
    class AppConfig {
        +number sportRate
        +MultiplierStrategy multiplierStrategy
        +CalendarConfig calendar
        +CumulativeConfig cumulative
        +BonusActivity[] bonusActivities
        +SpecialActivity[] specialActivities
        +BoardColumn[] board.columns
        +SpendActivity[] spendActivities
        +Reward[] rewards
        +boolean allowNegativeBalance
    }
    class BonusActivity {
        +string id
        +string name
        +number rate
        +boolean enabled
    }
    class SpecialActivity {
        +string id
        +string name
        +number rate
        +number fixedBonus
        +string columnId
    }
    class BoardColumn {
        +string id
        +string name
        +number coefficient
        +number order
    }
    class SpendActivity {
        +string id
        +string name
        +number rate
    }
    class Reward {
        +string id
        +string name
        +number cost
    }
    class LedgerEntry {
        +string id
        +string timestamp
        +LedgerKind kind
        +string label
        +number durationMin
        +number multiplier
        +number columnCoefficient
        +number points
    }

    AppConfig "1" o-- "*" BonusActivity
    AppConfig "1" o-- "*" SpecialActivity
    AppConfig "1" o-- "*" BoardColumn
    AppConfig "1" o-- "*" SpendActivity
    AppConfig "1" o-- "*" Reward
    SpecialActivity ..> BoardColumn : columnId

    %% ---------- Logique pure (✅ Jalon 1) ----------
    class points {
        <<module pur>>
        +sportPoints(durationMin, sportRate, multiplier) number
        +bonusPoints(durationMin, rate) number
        +specialPoints(durationMin, rate, fixedBonus, multiplier, columnCoefficient) number
    }

    %% ---------- Services (🕓 jalons suivants) ----------
    class StorageService {
        <<✅ Jalon 2>>
        +getJson(key) Promise~T~
        +setJson(key, value) Promise
        +remove(key) Promise
    }
    class ConfigService {
        <<✅ Jalon 2>>
        +config: Signal~AppConfig~
        +load() Promise
        +update(patch) Promise
        +reset() Promise
    }
    class LedgerService {
        <<✅ Jalon 3>>
        +entries: Signal~LedgerEntry[]~
        +balance: Signal~number~
        +load() Promise
        +add(entry) Promise~LedgerEntry~
        +clear() Promise
    }
    class MultiplierService {
        <<✅ Jalon 4>>
        +nextSportMultiplier(entries, cfg, now) number
        +currentSportMultiplier(entries, cfg, now) number
        +sportSessionsThisWeek(entries, now) number
    }
    class multiplier {
        <<module pur · ✅ Jalon 4>>
        +nextSportMultiplier(entries, cfg, now) number
        +currentSportMultiplier(entries, cfg, now) number
        +sportSessionsThisWeek(entries, now) number
    }
    class EligibilityService {
        <<🕓 Jalon 5>>
        +isBonusUnlocked() boolean
    }
    class TimerService {
        <<✅ Jalon 3>>
        +running: Signal~boolean~
        +elapsedSec: Signal~number~
        +elapsedMin: Signal~number~
        +start() void
        +stop() number
        +reset() void
    }

    ConfigService ..> StorageService
    ConfigService ..> AppConfig
    LedgerService ..> StorageService
    LedgerService ..> LedgerEntry
    LedgerService ..> points
    MultiplierService ..> multiplier
    multiplier ..> AppConfig
    multiplier ..> LedgerEntry
    EligibilityService ..> LedgerService
    TimerService ..> LedgerService
    TimerService ..> points
```

## Navigation (coque Ionic — ✅ Jalon 1)

5 onglets en bas + une page routée pour le tableau (accessible depuis « Gagner ») :

```
/accueil     HomePage      (solde, progression, multiplicateur)
/gagner      EarnPage      (chrono sport, saisie manuelle, bonus, accès tableau)
/depenser    SpendPage     (dépense au temps, récompenses)
/historique  HistoryPage   (journal filtrable)
/reglages    SettingsPage  (paramétrage complet)
```

Bootstrap **standalone** (`bootstrapApplication`) + `provideIonicAngular()` +
`provideRouter()` avec lazy `loadComponent`. État applicatif via **signals** (pas de NgRx).

## Notes de modèle

- `CalendarConfig = { cap: number | null, increment: number }` — l'**incrément** (défaut 1)
  paramètre le pas du multiplicateur calendaire : ×1, ×(1+inc), ×(1+2·inc)…
- `LedgerKind` inclut `multiplier-reset` : marqueur (points = 0) posé dans le journal pour
  **réinitialiser le multiplicateur** au plus bas. Le multiplicateur **et** le compteur
  « séances cette semaine » (`sportSessionsThisWeek`) n'utilisent que les séances de sport
  **postérieures** au dernier marqueur de reset — un reset repart donc « de zéro pour la semaine ».
