import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatToolbarModule } from '@angular/material/toolbar';

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
