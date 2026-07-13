import { Component, computed, inject } from '@angular/core';
import {
  AlertController,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { refreshOutline } from 'ionicons/icons';

import { ConfigService } from '../../core/services/config.service';
import { LedgerService } from '../../core/services/ledger.service';
import { MultiplierService } from '../../core/services/multiplier.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonChip,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonButton,
    IonIcon,
  ],
})
export class HomePage {
  private readonly config = inject(ConfigService);
  private readonly ledger = inject(LedgerService);
  private readonly multiplier = inject(MultiplierService);
  private readonly alert = inject(AlertController);
  private readonly toast = inject(ToastController);

  readonly balance = this.ledger.balance;

  readonly strategy = computed(() => this.config.config().multiplierStrategy);

  readonly sportThisWeek = computed(() =>
    this.multiplier.sportSessionsThisWeek(this.ledger.entries()),
  );

  readonly currentMultiplier = computed(() =>
    this.multiplier.currentSportMultiplier(this.ledger.entries(), this.config.config()),
  );

  readonly nextMultiplier = computed(() =>
    this.multiplier.nextSportMultiplier(this.ledger.entries(), this.config.config()),
  );

  constructor() {
    addIcons({ refreshOutline });
  }

  /** Demande confirmation avant de réinitialiser le multiplicateur au plus bas. */
  async resetMultiplier(): Promise<void> {
    const alert = await this.alert.create({
      header: 'Réinitialiser le multiplicateur ?',
      message: 'Le multiplicateur repart au niveau le plus bas (×1). Les points déjà gagnés sont conservés.',
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        { text: 'Réinitialiser', role: 'destructive', handler: () => void this.doReset() },
      ],
    });
    await alert.present();
  }

  private async doReset(): Promise<void> {
    await this.ledger.add({
      kind: 'multiplier-reset',
      label: 'Réinitialisation du multiplicateur',
      points: 0,
    });
    const t = await this.toast.create({
      message: 'Multiplicateur réinitialisé (×1)',
      duration: 1500,
      color: 'medium',
      position: 'top',
    });
    await t.present();
  }
}

