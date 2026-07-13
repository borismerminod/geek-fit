import { Routes } from '@angular/router';

import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'accueil',
        loadComponent: () => import('../pages/home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'gagner',
        loadComponent: () => import('../pages/earn/earn.page').then((m) => m.EarnPage),
      },
      {
        path: 'depenser',
        loadComponent: () => import('../pages/spend/spend.page').then((m) => m.SpendPage),
      },
      {
        path: 'historique',
        loadComponent: () => import('../pages/history/history.page').then((m) => m.HistoryPage),
      },
      {
        path: 'reglages',
        loadComponent: () => import('../pages/settings/settings.page').then((m) => m.SettingsPage),
      },
      {
        path: '',
        redirectTo: 'accueil',
        pathMatch: 'full',
      },
    ],
  },
];
