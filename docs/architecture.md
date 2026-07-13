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
        <<🕓 Jalon 2>>
        +get(key) Promise
        +set(key, value) Promise
    }
    class ConfigService {
        <<🕓 Jalon 2>>
        +config: Signal~AppConfig~
        +update(patch) void
    }
    class LedgerService {
        <<🕓 Jalon 3>>
        +entries: Signal~LedgerEntry[]~
        +balance: Signal~number~
        +add(entry) void
    }
    class MultiplierService {
        <<🕓 Jalon 4>>
        +nextSportMultiplier(entries, cfg) number
        +currentSportMultiplier(entries, cfg) number
    }
    class EligibilityService {
        <<🕓 Jalon 5>>
        +isBonusUnlocked() boolean
    }
    class TimerService {
        <<🕓 Jalon 3>>
        +running: Signal~boolean~
        +elapsedSec: Signal~number~
        +start(kind) void
        +stop() void
    }

    ConfigService ..> StorageService
    ConfigService ..> AppConfig
    LedgerService ..> StorageService
    LedgerService ..> LedgerEntry
    LedgerService ..> points
    MultiplierService ..> AppConfig
    MultiplierService ..> LedgerEntry
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
