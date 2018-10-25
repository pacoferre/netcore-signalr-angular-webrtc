import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {
  MatButtonModule,
  MatCardModule,
  MatCheckboxModule,
  MatDialogModule,
  MatIconModule,
  MatInputModule,
  MatListModule,
  MatMenuModule,
  MatSelectModule,
  MatSidenavModule,
  MatSlideToggleModule,
  MatTabsModule,
  MatGridListModule,
  MatToolbarModule
} from '@angular/material';

import 'hammerjs';

import { AppComponent } from './app.component';
import { AppIntroComponent } from './components/app-intro.component';
import { AppRtcComponent } from './components/app-rtc.component';
import { ChatSignalRService } from './services/chat-signalr.service';
import { RtcSignalRService } from './services/rtc-signalr.service';
import { AppMemberComponent } from './components/app-member.component';
import { LayoutModule } from '@angular/cdk/layout';

const appRoutes: Routes = [
  {
    path: 'intro',
    component: AppIntroComponent,
  },
  {
    path: 'rtc',
    component: AppRtcComponent,
  },
  {
    path: '',
    redirectTo: '/rtc',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/rtc' }
];


@NgModule({
  declarations: [
    AppComponent,
    AppIntroComponent,
    AppRtcComponent,
    AppMemberComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: false } // <-- debugging purposes only
    ),
    FormsModule,
    HttpClientModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDialogModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatSelectModule,
    MatSidenavModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatToolbarModule,
    MatGridListModule,
    LayoutModule
  ],
  providers: [
    ChatSignalRService,
    RtcSignalRService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
