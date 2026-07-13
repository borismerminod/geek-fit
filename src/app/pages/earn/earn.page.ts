import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, playOutline, stopOutline } from 'ionicons/icons';

import { sportPoints } from '../../core/logic/points';
import { ConfigService } from '../../core/services/config.service';
import { LedgerService } from '../../core/services/ledger.service';
import { MultiplierService } from '../../core/services/multiplier.service';
import { TimerService } from '../../core/services/timer.service';

@Component({
  selector: 'app-earn',
  templateUrl: 'earn.page.html',
  imports: [
    DatePipe,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonItem,
    IonInput,
    IonLabel,
    IonList,
    IonNote,
  ],
})
export class EarnPage {
  private readonly config = inject(ConfigService);
  private readonly ledger = inject(LedgerService);
  private readonly multiplier = inject(MultiplierService);
  private readonly toast = inject(ToastController);
  readonly timer = inject(TimerService);

  readonly balance = this.ledger.balance;
  readonly running = this.timer.running;
  readonly display = computed(() => this.formatClock(this.timer.elapsedSec()));

  /** Multiplicateur qui s'appliquera à la prochaine séance. */
  readonly nextMultiplier = computed(() =>
    this.multiplier.nextSportMultiplier(this.ledger.entries(), this.config.config()),
  );

  /** Les 5 dernières séances de sport, de la plus récente à la plus ancienne. */
  readonly recentSport = computed(() =>
    this.ledger
      .entries()
      .filter((e) => e.kind === 'sport')
      .slice(-5)
      .reverse(),
  );

  manualMinutes: number | null = null;

  constructor() {
    addIcons({ playOutline, stopOutline, addOutline });
  }

  /** Démarre le chrono, ou l'arrête et enregistre la séance. */
  async toggleTimer(): Promise<void> {
    if (this.running()) {
      const sec = this.timer.stop();
      this.timer.reset();
      await this.logSport(sec / 60, 'Séance chronométrée');
    } else {
      this.timer.start();
    }
  }

  /** Ajoute une séance saisie manuellement (en minutes). */
  async addManual(): Promise<void> {
    const min = Number(this.manualMinutes);
    if (!Number.isFinite(min) || min <= 0) {
      await this.presentToast('Saisir une durée valide (minutes)', 'warning');
      return;
    }
    await this.logSport(min, 'Saisie manuelle');
    this.manualMinutes = null;
  }

  private async logSport(minutes: number, label: string): Promise<void> {
    const rate = this.config.config().sportRate;
    const multiplier = this.multiplier.nextSportMultiplier(this.ledger.entries(), this.config.config());
    const points = sportPoints(minutes, rate, multiplier);
    await this.ledger.add({
      kind: 'sport',
      label,
      durationMin: Math.round(minutes * 100) / 100,
      multiplier,
      points,
    });
    await this.presentToast(`Séance enregistrée : +${points} pts (×${multiplier})`, 'success');
  }

  private formatClock(totalSec: number): string {
    const m = Math.floor(totalSec / 60)
      .toString()
      .padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  private async presentToast(message: string, color: string): Promise<void> {
    const t = await this.toast.create({ message, duration: 1500, color, position: 'top' });
    await t.present();
  }
}
