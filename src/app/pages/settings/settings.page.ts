import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToggle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';

import { AppConfig } from '../../core/models';
import { ConfigService } from '../../core/services/config.service';

@Component({
  selector: 'app-settings',
  templateUrl: 'settings.page.html',
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonToggle,
    IonButton,
    IonNote,
  ],
})
export class SettingsPage {
  private readonly configService = inject(ConfigService);
  private readonly toast = inject(ToastController);

  /** Copie éditable de la config (appliquée seulement au clic sur « Enregistrer »). */
  form: AppConfig = structuredClone(this.configService.config());
  capUnlimited = this.form.calendar.cap === null;
  capValue = this.form.calendar.cap ?? 3;

  async save(): Promise<void> {
    const f = this.form;
    await this.configService.update({
      sportRate: Number(f.sportRate),
      multiplierStrategy: f.multiplierStrategy,
      calendar: { cap: this.capUnlimited ? null : Number(this.capValue) },
      cumulative: {
        maxSessions: Number(f.cumulative.maxSessions),
        maxGapDays: Number(f.cumulative.maxGapDays),
      },
      allowNegativeBalance: f.allowNegativeBalance,
    });
    await this.presentToast('Réglages enregistrés ✅', 'success');
  }

  async reset(): Promise<void> {
    await this.configService.reset();
    this.form = structuredClone(this.configService.config());
    this.capUnlimited = this.form.calendar.cap === null;
    this.capValue = this.form.calendar.cap ?? 3;
    await this.presentToast('Réglages réinitialisés', 'medium');
  }

  private async presentToast(message: string, color: string): Promise<void> {
    const t = await this.toast.create({ message, duration: 1500, color, position: 'top' });
    await t.present();
  }
}
