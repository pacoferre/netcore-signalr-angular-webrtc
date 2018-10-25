import { Injectable } from '@angular/core';
import * as signalR from '@aspnet/signalr';
import 'webrtc-adapter';
import { BehaviorSubject, Observable } from 'rxjs';

export interface IUser {
  userName: string;
  connectionId: string;
}

export class UserConnection {
  user: IUser;
  isCurrentUser: boolean;
  rtcConnection: RTCPeerConnection;
  streamSub: BehaviorSubject<MediaStream>;
  streamObservable: Observable<MediaStream>;
  creatingOffer = false;
  creatingAnswer = false;

  constructor(user: IUser, isCurrentUser: boolean, rtcConnection: RTCPeerConnection) {
    this.user = user;
    this.isCurrentUser = isCurrentUser;
    this.rtcConnection = rtcConnection;
    this.streamSub = new BehaviorSubject<MediaStream>(undefined);
    this.streamObservable = this.streamSub.asObservable();
  }

  setStream(stream: MediaStream) {
    this.streamSub.next(stream);
  }

  end() {
    if (this.rtcConnection) {
      this.rtcConnection.close();
    }
    if (this.streamSub.getValue()) {
      this.setStream(undefined);
    }
  }
}

export interface IOtherUserMedia {
  otherUserConnectionId: string;
  track: RTCTrackEvent;
}

enum SignalType {
  newIceCandidate,
  videoOffer,
  videoAnswer
}

interface ISignal {
  type: SignalType;
  sdp?: RTCSessionDescription;
  candidate?: RTCIceCandidate;
}

@Injectable()
export class RtcSignalRService {
  private _hubConnection: signalR.HubConnection;
  private _connections: { [index: string]: UserConnection } = {};

  private connSub = new BehaviorSubject<boolean>(false);
  public connObservable = this.connSub.asObservable();
  private usersSub = new BehaviorSubject<UserConnection[]>(undefined);
  public usersObservable = this.usersSub.asObservable();

  public currentConnectionId: string;
  public currentRoomName: string;
  public currentMediaStream: MediaStream;
  public currentIceServers: RTCIceServer[];
  public connected = false;

  private reset() {
    this.connected = false;
    this.connSub.next(false);
    this.usersSub.next(undefined);
  }

  constructor() {
    this._hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('./sgr/rtc')
      .configureLogging(signalR.LogLevel.Debug)
      .build();

    (async () => {
      try {
        await this._hubConnection.start();
        const connectionId = await this._hubConnection.invoke('GetConnectionId');
        this.currentConnectionId = connectionId;
        this.connected = true;
        this.closeAllVideoCalls();
        this.connSub.next(true);
      } catch (error) {
        console.error(error);
      }
    })();

    this._hubConnection
      .onclose((err) => {
        console.error(err);
        this.connected = false;
        this.reset();
      });

    this._hubConnection
      .on('callToUserList', async (roomName: string, users: IUser[]) => {
        if (this.currentRoomName === roomName) {
          users.forEach(user => {
            if (this._connections[user.connectionId] === undefined
                && user.connectionId !== this.currentConnectionId) {
              this.initiateOffer(user);
            }
          });

          await this.updateUserList(users);
        }
      });

    this._hubConnection
      .on('updateUserList', async (roomName: string, users: IUser[]) => {
        if (this.currentRoomName === roomName) {
          Object.keys(this._connections)
            .forEach(key => {
              if (!users.find(user => user.connectionId === key)) {
                this.closeVideoCall(key);
              }
            });
          await this.updateUserList(users);
        }
      });

    this._hubConnection
      .on('receiveSignal', async (user: IUser, signal: string) => {
        await this.newSignal(user, signal);
      });
  }

  private async updateUserList(users: IUser[]): Promise<void> {
    const iceServers = await this.getIceServers();

    users.forEach(async user => {
      const connection = this.getConnection(user.connectionId, iceServers);

      if (connection.user.userName !== user.userName) {
        connection.user.userName = user.userName;
      }
      if (connection.isCurrentUser && connection.streamSub.getValue() === undefined) {
        const stream = await this.getUserMediaInternal();

        if (connection.streamSub.getValue() === undefined) {
          connection.streamSub.next(stream);
        }
      }
    });
    this.usersSub.next(Object.values(this._connections));
  }

  public join(userName: string, room: string) {
    if (!this.connected) {
      this.reset();

      return;
    }

    this.closeAllVideoCalls();

    this._connections[this.currentConnectionId] =
      new UserConnection({ userName: userName, connectionId: this.currentConnectionId }, true, undefined);
    this.currentRoomName = room;
    this._hubConnection
      .invoke('Join', userName, room);
  }

  public hangUp() {
    this._hubConnection.invoke('hangUp');
    this.closeVideoCall(this.currentConnectionId);
  }

  private async getUserMediaInternal(): Promise<MediaStream> {
    if (this.currentMediaStream) {
      return this.currentMediaStream;
    }

    try {
      return await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
    } catch (error) {
      console.error('Failed to get hardware access', error);
    }
  }

  private async getIceServers(): Promise<RTCIceServer[]> {
    if (this.currentIceServers) {
      return this.currentIceServers;
    }

    try {
      return await this._hubConnection
        .invoke('GetIceServers');
    } catch (error) {
      console.error('GetIceServers error: ', error);
    }
  }

  private async initiateOffer(acceptingUser: IUser) {
    const partnerClientId = acceptingUser.connectionId;

    console.log('Initiate offer to ' + acceptingUser.userName);

    if (this._connections[partnerClientId]) {
      console.log('Cannot initiate an offer with existing partner.');
      return;
    }

    const iceServers = await this.getIceServers();
    const connection = this.getConnection(partnerClientId, iceServers);
    const localStream = await this.getUserMediaInternal();
    localStream.getTracks().forEach(track => connection.rtcConnection.addTrack(track, localStream));
  }

  private async sendSignal(message: ISignal, partnerClientId: string) {
    await this._hubConnection.invoke('SendSignal', JSON.stringify(message), partnerClientId);
  }

  private async newSignal(user: IUser, data: string) {
    const partnerClientId = user.connectionId;
    const signal: ISignal = JSON.parse(data);

    console.log('WebRTC: received signal');

    if (signal.type === SignalType.newIceCandidate) {
      await this.receivedNewIceCandidate(partnerClientId, signal.candidate);
    } else if (signal.type === SignalType.videoOffer) {
      await this.receivedVideoOffer(partnerClientId, signal.sdp);
    } else if (signal.type === SignalType.videoAnswer) {
      await this.receivedVideoAnswer(partnerClientId, signal.sdp);
    }
  }

  private async receivedNewIceCandidate(partnerClientId: string, candidate: RTCIceCandidate) {
    console.log('Adding received ICE candidate: ' + JSON.stringify(candidate));

    try {
      const iceServers = await this.getIceServers();
      const connection = this.getConnection(partnerClientId, iceServers);
      await connection.rtcConnection.addIceCandidate(candidate);
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }

  private async receivedVideoOffer(partnerClientId: string, sdp: RTCSessionDescription) {

    console.log('Starting to accept invitation from ' + partnerClientId);

    const desc = new RTCSessionDescription(sdp);
    const iceServers = await this.getIceServers();
    const connection = this.getConnection(partnerClientId, iceServers);

    if (connection.creatingAnswer) {
      console.warn('Second answer not created.');

      return;
    }
    connection.creatingAnswer = true;

    try {
      console.log('setRemoteDescription');
      await connection.rtcConnection.setRemoteDescription(desc);
      console.log('createAnswer');
      const senders = connection.rtcConnection.getSenders();
      if (!senders || senders.length === 0) {
        console.log('AddSenders needed');
        const localStream = await this.getUserMediaInternal();
        localStream.getTracks().forEach(track => connection.rtcConnection.addTrack(track, localStream));
      }
      const answer = await connection.rtcConnection.createAnswer();
      console.log('setLocalDescription', answer);
      await connection.rtcConnection.setLocalDescription(answer);
      await this.sendSignal({
        type: SignalType.videoAnswer,
        sdp: connection.rtcConnection.localDescription
      }, partnerClientId);
    } catch (error) {
      console.error('Error in receivedVideoOffer:', error);
    }

    connection.creatingAnswer = false;
  }

  private async receivedVideoAnswer(partnerClientId: string, sdp: RTCSessionDescription) {
    console.log('Call recipient has accepted our call');

    try {
      const iceServers = await this.getIceServers();
      const connection = this.getConnection(partnerClientId, iceServers);
      await connection.rtcConnection.setRemoteDescription(sdp);
    } catch (error) {
      console.error('Error in receivedVideoAnswer:', error);
    }
  }

  private getConnection(partnerClientId: string, iceServers: RTCIceServer[]): UserConnection {
    const connection = this._connections[partnerClientId] || this.createConnection(partnerClientId, iceServers);
    return connection;
  }

  private createConnection(partnerClientId: string, iceServers: RTCIceServer[]): UserConnection {
    console.log('WebRTC: creating connection...');

    if (this._connections[partnerClientId]) {
      this.closeVideoCall(partnerClientId);
    }

    const connection = new RTCPeerConnection({ iceServers: iceServers });
    const userConnection = new UserConnection({ userName: '', connectionId: partnerClientId },
      false, connection);

    connection.onnegotiationneeded = async () => {
      if (userConnection.creatingOffer) {
        return;
      }
      userConnection.creatingOffer = true;

      try {
        const desc = await connection.createOffer();
        await connection.setLocalDescription(desc);
        await this.sendSignal({
            type: SignalType.videoOffer,
            sdp: connection.localDescription
          }, partnerClientId);
      } catch (error) {
        console.error('Error in onnegotiationneeded:', error);
      }

      userConnection.creatingOffer = false;
    };
    connection.oniceconnectionstatechange = () => {
      switch (connection.iceConnectionState) {
        case 'closed':
        case 'failed':
        case 'disconnected':
          this.closeAllVideoCalls();
          break;
      }
    };
    connection.onicegatheringstatechange = () => {
      console.log('*** ICE gathering state changed to: ' + connection.iceGatheringState);
    };
    connection.onsignalingstatechange = (event) => {
      console.log('*** WebRTC signaling state changed to: ' + connection.signalingState);
      switch (connection.signalingState) {
        case 'closed':
          this.closeAllVideoCalls();
          break;
      }
    };
    connection.onicecandidate = async (event) => {
      if (event.candidate) {
        console.log('WebRTC: new ICE candidate');
        await this.sendSignal({
          type: SignalType.newIceCandidate,
          candidate: event.candidate
        }, partnerClientId);
      } else {
        console.log('WebRTC: ICE candidate gathering complete');
      }
    };
    connection.onconnectionstatechange = (state) => {
      const states = {
        'iceConnectionState': connection.iceConnectionState,
        'iceGatheringState': connection.iceGatheringState,
        'connectionState': connection.connectionState,
        'signalingState': connection.signalingState
      };

      console.log(JSON.stringify(states), state);
    };

    connection.ontrack = (event) => {
      console.log('Track received from ' + partnerClientId);
      userConnection.setStream(event.streams[0]);
    };

    this._connections[partnerClientId] = userConnection;

    return userConnection;
  }

  private closeAllVideoCalls() {
    Object.keys(this._connections)
      .forEach(key => {
        this.closeVideoCall(key);
      });
    this._connections = {};
  }

  private closeVideoCall(partnerClientId: string) {
    const connection = this._connections[partnerClientId];
    if (connection) {
      connection.end();
      this._connections[partnerClientId] = undefined;
    }
  }
}
