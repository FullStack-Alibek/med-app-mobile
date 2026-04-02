import { io, Socket } from 'socket.io-client';
import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
  MediaStream,
  isWebRTCAvailable,
} from './webrtcShim';
import { getToken } from './authService';

const BASE_URL = 'https://med-expert.donoxonsi.uz/api';
const SOCKET_URL = 'https://med-expert.donoxonsi.uz';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

// ─── REST API ───

export async function checkUserOnline(userId: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/call/online/${encodeURIComponent(userId)}`);
    if (!res.ok) return false;
    const data = await res.json();
    return data.online === true;
  } catch {
    return false;
  }
}

export async function saveCallHistory(body: {
  receiverId: string;
  receiverName: string;
  receiverRole: string;
  callType: 'video' | 'audio';
  status: 'completed' | 'missed' | 'rejected';
  duration: number;
}): Promise<void> {
  const token = await getToken();
  if (!token) return;
  try {
    await fetch(`${BASE_URL}/call/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    // silently fail
  }
}

// ─── WebRTC + Socket.io Manager ───

export type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';

export interface IncomingCallData {
  from: string;
  fromName: string;
  offer: any;
  callType: 'video' | 'audio';
}

export interface CallCallbacks {
  onStateChange: (state: CallState) => void;
  onRemoteStream: (stream: MediaStream) => void;
  onLocalStream: (stream: MediaStream) => void;
  onEnded: (duration: number) => void;
  onError: (msg: string) => void;
  onIncomingCall: (data: IncomingCallData) => void;
}

export class CallManager {
  private socket: Socket | null = null;
  private peer: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private callbacks: CallCallbacks;
  private myUserId: string;
  private remoteUserId: string = '';
  private remoteName: string = '';
  private callType: 'video' | 'audio' = 'audio';
  private state: CallState = 'idle';
  private startTime: number = 0;
  private pendingOffer: any = null;

  constructor(userId: string, callbacks: CallCallbacks) {
    this.myUserId = userId;
    this.callbacks = callbacks;
  }

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      this.socket!.emit('register', this.myUserId);
    });

    this.socket.on('incoming-call', (data: IncomingCallData) => {
      this.remoteUserId = data.from;
      this.remoteName = data.fromName;
      this.callType = data.callType;
      this.pendingOffer = data.offer;
      this.setState('ringing');
      this.callbacks.onIncomingCall(data);
    });

    this.socket.on('call-answered', async (data: { answer: any }) => {
      if (this.peer) {
        await this.peer.setRemoteDescription(new RTCSessionDescription(data.answer));
        this.setState('connected');
        this.startTime = Date.now();
      }
    });

    this.socket.on('call-rejected', () => {
      this.cleanup();
      this.callbacks.onError('Qo\'ng\'iroq rad etildi');
    });

    this.socket.on('call-ended', () => {
      this.endCall(false);
    });

    this.socket.on('ice-candidate', async (data: { candidate: any }) => {
      if (this.peer && data.candidate) {
        try {
          await this.peer.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch {
          // ignore
        }
      }
    });
  }

  disconnect() {
    this.cleanup();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private setState(state: CallState) {
    this.state = state;
    this.callbacks.onStateChange(state);
  }

  private async getMediaStream(ct: 'video' | 'audio'): Promise<MediaStream> {
    const stream = await mediaDevices.getUserMedia({
      audio: true,
      video: ct === 'video' ? { facingMode: 'user', width: 640, height: 480 } : false,
    } as any);
    return stream as MediaStream;
  }

  private createPeerConnection() {
    this.peer = new RTCPeerConnection(ICE_SERVERS);

    (this.peer as any).onicecandidate = (event: any) => {
      if (event.candidate && this.socket) {
        this.socket.emit('ice-candidate', {
          to: this.remoteUserId,
          candidate: event.candidate,
        });
      }
    };

    (this.peer as any).ontrack = (event: any) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0] as MediaStream;
        this.callbacks.onRemoteStream(this.remoteStream);
      }
    };

    if (this.localStream) {
      this.localStream.getTracks().forEach((track: any) => {
        this.peer!.addTrack(track, this.localStream!);
      });
    }
  }

  // ── Chiquvchi qo'ng'iroq (patient -> doctor) ──
  async startCall(remoteDoctorName: string, callType: 'video' | 'audio') {
    if (this.state !== 'idle') return;
    if (!isWebRTCAvailable) {
      this.callbacks.onError('WebRTC mavjud emas. Development build kerak.');
      return;
    }

    this.remoteUserId = `doctor_${remoteDoctorName}`;
    this.remoteName = remoteDoctorName;
    this.callType = callType;
    this.setState('calling');

    try {
      this.localStream = await this.getMediaStream(callType);
      this.callbacks.onLocalStream(this.localStream);

      this.createPeerConnection();

      const offer = await this.peer!.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === 'video',
      } as any);
      await this.peer!.setLocalDescription(offer);

      this.socket!.emit('call-user', {
        to: this.remoteUserId,
        from: this.myUserId,
        fromName: this.myUserId.replace('patient_', ''),
        offer,
        callType,
      });
    } catch (err: any) {
      this.callbacks.onError(err?.message || 'Qo\'ng\'iroq boshlanmadi');
      this.cleanup();
    }
  }

  // ── Kiruvchi qo'ng'iroqni qabul qilish ──
  async answerCall() {
    if (!this.pendingOffer) return;
    if (!isWebRTCAvailable) {
      this.callbacks.onError('WebRTC mavjud emas. Development build kerak.');
      return;
    }
    try {
      this.localStream = await this.getMediaStream(this.callType);
      this.callbacks.onLocalStream(this.localStream);

      this.createPeerConnection();

      await this.peer!.setRemoteDescription(new RTCSessionDescription(this.pendingOffer));

      const answer = await this.peer!.createAnswer();
      await this.peer!.setLocalDescription(answer);

      this.socket!.emit('call-answer', {
        to: this.remoteUserId,
        answer,
      });

      this.pendingOffer = null;
      this.setState('connected');
      this.startTime = Date.now();
    } catch (err: any) {
      this.callbacks.onError(err?.message || 'Javob berishda xatolik');
      this.cleanup();
    }
  }

  // ── Kiruvchi qo'ng'iroqni rad etish ──
  rejectCall() {
    if (this.socket && this.remoteUserId) {
      this.socket.emit('call-reject', { to: this.remoteUserId });
    }
    saveCallHistory({
      receiverId: this.remoteUserId,
      receiverName: this.remoteName,
      receiverRole: 'doctor',
      callType: this.callType,
      status: 'rejected',
      duration: 0,
    });
    this.cleanup();
    this.callbacks.onEnded(0);
  }

  // ── Qo'ng'iroqni tugatish ──
  endCall(sendSignal: boolean = true) {
    const duration = this.startTime > 0 ? Math.floor((Date.now() - this.startTime) / 1000) : 0;

    if (sendSignal && this.socket && this.remoteUserId) {
      this.socket.emit('call-end', { to: this.remoteUserId });
    }

    if (this.remoteName) {
      saveCallHistory({
        receiverId: this.remoteUserId,
        receiverName: this.remoteName,
        receiverRole: 'doctor',
        callType: this.callType,
        status: duration > 0 ? 'completed' : 'missed',
        duration,
      });
    }

    this.callbacks.onEnded(duration);
    this.cleanup();
  }

  private cleanup() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track: any) => track.stop());
      this.localStream = null;
    }
    if (this.peer) {
      this.peer.close();
      this.peer = null;
    }
    this.remoteStream = null;
    this.startTime = 0;
    this.pendingOffer = null;
    this.remoteUserId = '';
    this.remoteName = '';
    this.state = 'idle';
  }

  toggleMute(): boolean {
    if (!this.localStream) return false;
    const t = this.localStream.getAudioTracks()[0];
    if (t) { t.enabled = !t.enabled; return !t.enabled; }
    return false;
  }

  toggleCamera(): boolean {
    if (!this.localStream) return false;
    const t = this.localStream.getVideoTracks()[0];
    if (t) { t.enabled = !t.enabled; return !t.enabled; }
    return false;
  }

  switchCamera() {
    if (!this.localStream) return;
    const t = this.localStream.getVideoTracks()[0] as any;
    if (t?._switchCamera) t._switchCamera();
  }

  getState(): CallState { return this.state; }
  getCallType(): 'video' | 'audio' { return this.callType; }
  getRemoteName(): string { return this.remoteName; }
}
