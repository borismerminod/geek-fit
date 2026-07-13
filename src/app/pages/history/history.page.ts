import { Component } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-history',
  templateUrl: 'history.page.html',
  imports: [IonHeader, IonToolbar, IonTitle, IonContent],
})
export class HistoryPage {}
