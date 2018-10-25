import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { UserConnection } from '../services/rtc-signalr.service';

@Component({
  selector: 'app-member',
  templateUrl: './app-member.component.html',
  styleUrls: ['./app-rtc.component.scss']
})
export class AppMemberComponent implements OnInit {
  @Input()
  user: UserConnection;

  theVideo: HTMLVideoElement;
  @ViewChild('theVideo')
  set mainLocalVideo(el: ElementRef) {
    this.theVideo = el.nativeElement;
  }

  constructor() {
  }

  ngOnInit() {
    this.user.streamObservable.subscribe(stream => {
      if (stream) {
        if (this.user.isCurrentUser) {
          this.theVideo.srcObject = stream;
          this.theVideo.defaultMuted = true;
          this.theVideo.volume = 0;
          this.theVideo.muted = true;
        } else {
          this.theVideo.srcObject = stream;
        }
      }
    });
  }
}
