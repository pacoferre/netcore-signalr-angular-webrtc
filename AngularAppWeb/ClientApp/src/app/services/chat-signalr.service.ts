import { Injectable } from '@angular/core';
import { HubConnection } from '@aspnet/signalr';
import * as signalR from '@aspnet/signalr';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable()
export class ChatSignalRService {
  private messSub = new BehaviorSubject<string[]>([]);
  private messObservable: Observable<string[]>;
  private _hubConnection: HubConnection | undefined;
  private messages: string[] = [];

  constructor() {
    this._hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('./sgr/chat')
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this._hubConnection
      .start()
      .catch(err => console.error(err.toString()));

    this._hubConnection
      .on('Send', (data: any) => {
        const received = `Received: ${data}`;
        this.messages.push(received);

        this.messSub.next(this.messages);
      });
  }

  public getObservable() {
    if (!this.messObservable) {
      this.messObservable = this.messSub.asObservable();
    }

    return this.messObservable;
  }

  public sendMessage(message: string): void {
    if (this._hubConnection) {
      this._hubConnection.invoke('Send', message);
    }
  }
}
