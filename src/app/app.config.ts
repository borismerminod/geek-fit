import { ApplicationConfig, inject, provideAppInitializer } from '@angular/core';
import {
  PreloadAllModules,
  provideRouter,
  RouteReuseStrategy,
  withPreloading,
} from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app.routes';
import { ConfigService } from './core/services/config.service';
import { LedgerService } from './core/services/ledger.service';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    // Réhydrate la configuration et le journal persistés avant le démarrage de l'app.
    provideAppInitializer(() =>
      Promise.all([inject(ConfigService).load(), inject(LedgerService).load()]),
    ),
  ],
};
