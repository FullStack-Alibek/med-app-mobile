import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RTCView, isWebRTCAvailable } from '../services/webrtcShim';
import { CallManager, CallState, IncomingCallData } from '../services/callService';
import { useAuth } from './AuthContext';
import { C, RADIUS, SP } from '../theme';

interface CallContextType {
  callManager: CallManager | null;
  callState: CallState;
  callType: 'video' | 'audio';
  localStream: any;
  remoteStream: any;
  callTimer: number;
  isMuted: boolean;
  isCameraOff: boolean;
  remoteName: string;
  startCall: (doctorName: string, type: 'video' | 'audio') => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  switchCamera: () => void;
}

const CallContext = createContext<CallContextType | null>(null);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [callState, setCallState] = useState<CallState>('idle');
  const [callType, setCallType] = useState<'video' | 'audio'>('audio');
  const [localStream, setLocalStream] = useState<any>(null);
  const [remoteStream, setRemoteStream] = useState<any>(null);
  const [callTimer, setCallTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [remoteName, setRemoteName] = useState('');
  const [showIncoming, setShowIncoming] = useState(false);
  const [showCallScreen, setShowCallScreen] = useState(false);

  const managerRef = useRef<CallManager | null>(null);
  const timerRef = useRef<any>(null);

  const clearCallUI = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setShowCallScreen(false);
    setShowIncoming(false);
    setLocalStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setCallTimer(0);
    setCallState('idle');
  }, []);

  useEffect(() => {
    if (!user) {
      if (managerRef.current) {
        managerRef.current.disconnect();
        managerRef.current = null;
      }
      clearCallUI();
      return;
    }

    const myUserId = `patient_${user.username}`;
    const manager = new CallManager(myUserId, {
      onStateChange: (state) => {
        setCallState(state);
        if (state === 'connected') {
          setCallTimer(0);
          setShowIncoming(false);
          setShowCallScreen(true);
          timerRef.current = setInterval(() => setCallTimer((p) => p + 1), 1000);
        }
        // idle ga faqat cleanup/endCall orqali o'tadi — boshqa joyda emas
      },
      onLocalStream: (stream) => setLocalStream(stream),
      onRemoteStream: (stream) => setRemoteStream(stream),
      onEnded: () => {
        clearCallUI();
      },
      onError: (msg) => {
        clearCallUI();
        if (msg) Alert.alert("Qo'ng'iroq xatosi", msg);
      },
      onIncomingCall: (data: IncomingCallData) => {
        setRemoteName(data.fromName);
        setCallType(data.callType);
        setShowIncoming(true);
      },
    });

    manager.connect();
    managerRef.current = manager;

    return () => {
      manager.disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [user]);

  // ── Chiquvchi qo'ng'iroq ──
  const startCall = useCallback((doctorName: string, type: 'video' | 'audio') => {
    if (!managerRef.current) return;
    if (!isWebRTCAvailable) {
      Alert.alert('Xatolik', 'Video qo\'ng\'iroq uchun development build kerak. Expo Go da ishlamaydi.');
      return;
    }
    setCallType(type);
    setRemoteName(doctorName);
    setIsMuted(false);
    setIsCameraOff(false);
    setCallTimer(0);
    setShowCallScreen(true);
    managerRef.current.startCall(doctorName, type);
  }, []);

  // ── Qo'ng'iroqni tugatish ──
  const endCall = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.endCall(true);
    } else {
      clearCallUI();
    }
  }, [clearCallUI]);

  // ── Kiruvchi qo'ng'iroqni qabul qilish ──
  const answerCall = useCallback(() => {
    if (!managerRef.current) return;
    if (!isWebRTCAvailable) {
      Alert.alert('Xatolik', 'Development build kerak.');
      managerRef.current.rejectCall();
      clearCallUI();
      return;
    }
    setShowIncoming(false);
    setShowCallScreen(true);
    managerRef.current.answerCall();
  }, [clearCallUI]);

  // ── Kiruvchi qo'ng'iroqni rad etish ──
  const rejectCall = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.rejectCall();
    }
    clearCallUI();
  }, [clearCallUI]);

  const toggleMute = useCallback(() => {
    if (managerRef.current) setIsMuted(managerRef.current.toggleMute());
  }, []);

  const toggleCamera = useCallback(() => {
    if (managerRef.current) setIsCameraOff(managerRef.current.toggleCamera());
  }, []);

  const switchCamera = useCallback(() => {
    managerRef.current?.switchCamera();
  }, []);

  const fmtSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <CallContext.Provider value={{
      callManager: managerRef.current,
      callState, callType, localStream, remoteStream, callTimer,
      isMuted, isCameraOff, remoteName,
      startCall, endCall,
      toggleMute, toggleCamera, switchCamera,
    }}>
      {children}

      {/* ── Kiruvchi qo'ng'iroq modali ── */}
      <Modal visible={showIncoming} animationType="fade" transparent statusBarTranslucent>
        <View style={s.incomingOverlay}>
          <View style={s.incomingCard}>
            <View style={s.incomingPulse}>
              <Ionicons name={callType === 'video' ? 'videocam' : 'call'} size={32} color={C.brand} />
            </View>
            <Text style={s.incomingTitle}>Kiruvchi qo'ng'iroq</Text>
            <Text style={s.incomingName}>{remoteName}</Text>
            <Text style={s.incomingType}>
              {callType === 'video' ? 'Video qo\'ng\'iroq' : 'Ovozli qo\'ng\'iroq'}
            </Text>

            <View style={s.incomingActions}>
              <TouchableOpacity style={s.rejectBtn} onPress={rejectCall} activeOpacity={0.8}>
                <Ionicons name="call" size={24} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
              </TouchableOpacity>
              <TouchableOpacity style={s.acceptBtn} onPress={answerCall} activeOpacity={0.8}>
                <Ionicons name={callType === 'video' ? 'videocam' : 'call'} size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Faol qo'ng'iroq ekrani ── */}
      <Modal visible={showCallScreen} animationType="slide" statusBarTranslucent>
        <View style={s.callRoot}>
          <View style={s.callBg}>
            {callType === 'video' && callState === 'connected' && (
              <>
                {remoteStream && RTCView ? (
                  <RTCView
                    streamURL={remoteStream.toURL()}
                    style={s.remoteVideo}
                    objectFit="cover"
                    mirror={false}
                  />
                ) : (
                  <View style={[s.remoteVideo, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="person" size={60} color="rgba(255,255,255,0.3)" />
                  </View>
                )}
                {localStream && !isCameraOff && RTCView && (
                  <View style={s.localVideo}>
                    <RTCView
                      streamURL={localStream.toURL()}
                      style={{ width: '100%', height: '100%' }}
                      objectFit="cover"
                      mirror={true}
                      zOrder={1}
                    />
                  </View>
                )}
              </>
            )}
          </View>

          <View style={s.callOverlay}>
            <View style={s.callTopInfo}>
              {callType === 'video' && callState === 'connected' && (
                <View style={s.videoLabel}>
                  <View style={s.recDot} />
                  <Text style={s.videoLabelText}>Video qo'ng'iroq</Text>
                </View>
              )}
            </View>

            <View style={s.callCenter}>
              {!(callType === 'video' && callState === 'connected' && remoteStream) && (
                <View style={s.callAvatar}>
                  <Ionicons name="person" size={40} color={C.brand} />
                </View>
              )}
              <Text style={s.callName}>{remoteName}</Text>
              <Text style={s.callStatus}>
                {callState === 'connected'
                  ? fmtSec(callTimer)
                  : callState === 'calling'
                    ? 'Qo\'ng\'iroq qilinmoqda...'
                    : callState === 'ringing'
                      ? 'Javob kutilmoqda...'
                      : 'Ulanmoqda...'}
              </Text>
            </View>

            <View style={s.callControls}>
              <View style={s.controlsRow}>
                <TouchableOpacity style={[s.ctrlBtn, isMuted && s.ctrlBtnActive]} onPress={toggleMute}>
                  <View style={[s.ctrlBtnCircle, isMuted && s.ctrlBtnCircleActive]}>
                    <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={22} color="#fff" />
                  </View>
                  <Text style={s.ctrlLabel}>{isMuted ? 'Yoqish' : 'O\'chirish'}</Text>
                </TouchableOpacity>

                {callType === 'video' && (
                  <TouchableOpacity style={s.ctrlBtn} onPress={switchCamera}>
                    <View style={s.ctrlBtnCircle}>
                      <Ionicons name="camera-reverse-outline" size={22} color="#fff" />
                    </View>
                    <Text style={s.ctrlLabel}>Almashtirish</Text>
                  </TouchableOpacity>
                )}

                {callType === 'video' && (
                  <TouchableOpacity style={[s.ctrlBtn, isCameraOff && s.ctrlBtnActive]} onPress={toggleCamera}>
                    <View style={[s.ctrlBtnCircle, isCameraOff && s.ctrlBtnCircleActive]}>
                      <Ionicons name={isCameraOff ? 'videocam-off' : 'videocam'} size={22} color="#fff" />
                    </View>
                    <Text style={s.ctrlLabel}>Kamera</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity style={s.endBtn} onPress={endCall} activeOpacity={0.8}>
                <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </CallContext.Provider>
  );
}

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall must be inside CallProvider');
  return ctx;
}

const s = StyleSheet.create({
  // ── Incoming call ──
  incomingOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center', alignItems: 'center', padding: 32,
  },
  incomingCard: {
    backgroundColor: C.card, borderRadius: 24, padding: 32,
    alignItems: 'center', width: '100%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16,
    elevation: 10,
  },
  incomingPulse: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.brandLight, justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  },
  incomingTitle: { fontSize: 13, color: C.textTertiary, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8 },
  incomingName: { fontSize: 24, fontWeight: '700', color: C.text, marginBottom: 4 },
  incomingType: { fontSize: 14, color: C.textTertiary, marginBottom: 32 },
  incomingActions: { flexDirection: 'row', gap: 48 } as any,
  rejectBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#DC2626', justifyContent: 'center', alignItems: 'center',
  },
  acceptBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#16A34A', justifyContent: 'center', alignItems: 'center',
  },

  // ── Active call ──
  callRoot: { flex: 1, backgroundColor: '#0F172A' },
  callBg: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  remoteVideo: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#1E293B',
  },
  localVideo: {
    position: 'absolute', top: 60, right: 20,
    width: 110, height: 150, borderRadius: 16,
    backgroundColor: '#334155', overflow: 'hidden' as const,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)',
  },
  callOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'space-between',
  },
  callTopInfo: { paddingTop: 60, paddingHorizontal: SP.xl, alignItems: 'center' },
  videoLabel: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20,
  } as any,
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#DC2626' },
  videoLabelText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  callCenter: { alignItems: 'center' },
  callAvatar: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(59,130,246,0.2)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  callName: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 6 },
  callStatus: { fontSize: 15, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  callControls: { paddingBottom: Platform.OS === 'ios' ? 50 : 36, alignItems: 'center' },
  controlsRow: { flexDirection: 'row', gap: 28, marginBottom: 28 } as any,
  ctrlBtn: { alignItems: 'center', gap: 8 } as any,
  ctrlBtnActive: {},
  ctrlBtnCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  ctrlBtnCircleActive: { backgroundColor: 'rgba(255,255,255,0.35)' },
  ctrlLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  endBtn: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: '#DC2626',
    justifyContent: 'center', alignItems: 'center',
  },
});
