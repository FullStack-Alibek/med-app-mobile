// WebRTC modulini xavfsiz import qilish
// Expo Go da native module yo'q — shu shim ishlatiladi
// Development build da real WebRTC ishlaydi

let RTCPeerConnection: any;
let RTCSessionDescription: any;
let RTCIceCandidate: any;
let mediaDevices: any;
let MediaStream: any;
let RTCView: any;

try {
  const webrtc = require('react-native-webrtc');
  RTCPeerConnection = webrtc.RTCPeerConnection;
  RTCSessionDescription = webrtc.RTCSessionDescription;
  RTCIceCandidate = webrtc.RTCIceCandidate;
  mediaDevices = webrtc.mediaDevices;
  MediaStream = webrtc.MediaStream;
  RTCView = webrtc.RTCView;
} catch {
  // Expo Go da — stublar
  RTCPeerConnection = null;
  RTCSessionDescription = null;
  RTCIceCandidate = null;
  mediaDevices = null;
  MediaStream = null;
  RTCView = null;
}

export const isWebRTCAvailable = RTCPeerConnection !== null;

export {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
  MediaStream,
  RTCView,
};
