import { Component, OnInit } from '@angular/core';
import { ChatSignalRService } from '../services/chat-signalr.service';

@Component({
  selector: 'app-intro',
  templateUrl: './app-intro.component.html'
})
export class AppIntroComponent implements OnInit {
  message = '';
  messages: string[] = [];

  constructor(private signalrService: ChatSignalRService) {
  }

  ngOnInit() {
    this.signalrService.getObservable().subscribe(messs => {
      this.messages = messs;
    });
  }

  public sendMessage(): void {
    this.signalrService.sendMessage(this.message);
  }
}
