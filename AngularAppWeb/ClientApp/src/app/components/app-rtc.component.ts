import { Component, OnInit } from '@angular/core';
import { RtcSignalRService, IUser, UserConnection } from '../services/rtc-signalr.service';

@Component({
  selector: 'app-rtc',
  templateUrl: './app-rtc.component.html',
  styleUrls: ['./app-rtc.component.scss']
})
export class AppRtcComponent implements OnInit {
  userName = '';
  users: UserConnection[];

  joined = false;

  roomName = 'Test1';

  constructor(public rtcService: RtcSignalRService) {
    rtcService.usersObservable
      .subscribe(users => {
        this.users = users;
      });
  }

  ngOnInit() {
  }

  connect() {
    this.rtcService.join(this.userName, this.roomName);
    this.joined = true;
  }

  trackByFn(user: IUser) {
    return user.connectionId;
  }
}
