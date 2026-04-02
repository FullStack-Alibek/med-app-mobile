import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, Modal, Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { useApp, Booking, DoctorMessage } from '../context/AppContext';
import { SPECIALTY_CONFIG } from '../data/doctors';
import { C, RADIUS, SP } from '../theme';

export default function DoctorChatScreen() {
  const route = useRoute<any>();
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 56 + Math.max(insets.bottom, 8);
  const bk: Booking = route.params.booking;
  const { getMessages, addMessage } = useApp();
  const sp = SPECIALTY_CONFIG[bk.specialty] || { icon: 'medical-outline', color: C.textTertiary, bg: C.bg };

  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');
  const [callActive, setCallActive] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [showInfo, setShowInfo] = useState(false);

  // Voice recording state
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);

  // Audio playback state
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Image preview
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const ref = useRef<FlatList>(null);
  const timerRef = useRef<any>(null);
  const recTimerRef = useRef<any>(null);
  const msgs = getMessages(bk.id);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // ─── Text Send ───
  const send = () => {
    if (!input.trim()) return;
    addMessage(bk.id, input.trim(), true);
    setInput('');
    setTyping(true);
    setTimeout(() => setTyping(false), 1800);
  };

  // ─── Image Picker ───
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      addMessage(bk.id, '', true, { image: uri });
      setTyping(true);
      setTimeout(() => {
        addMessage(bk.id, 'Rasmni qabul qildim, rahmat. Qabulda batafsil ko\'rib chiqamiz.', false);
        setTyping(false);
      }, 2000);
    }
  };

  // ─── Voice Recording ───
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      setRecording(rec);
      setIsRecording(true);
      setRecordDuration(0);

      recTimerRef.current = setInterval(() => {
        setRecordDuration((p) => p + 1);
      }, 1000);
    } catch (err) {
      console.error('Recording failed:', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    clearInterval(recTimerRef.current);
    const duration = recordDuration;

    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recording.getURI();
      setRecording(null);
      setIsRecording(false);
      setRecordDuration(0);

      if (uri && duration >= 1) {
        addMessage(bk.id, '', true, { audio: uri, audioDuration: duration });
        setTyping(true);
        setTimeout(() => {
          addMessage(bk.id, 'Ovozli xabaringizni eshitdim. Tushunarlii, qabulda batafsil gaplashamiz.', false);
          setTyping(false);
        }, 2000);
      }
    } catch (err) {
      console.error('Stop recording failed:', err);
      setRecording(null);
      setIsRecording(false);
      setRecordDuration(0);
    }
  };

  const cancelRecording = async () => {
    if (!recording) return;
    clearInterval(recTimerRef.current);
    try {
      await recording.stopAndUnloadAsync();
    } catch {}
    setRecording(null);
    setIsRecording(false);
    setRecordDuration(0);
  };

  // ─── Audio Playback ───
  const playAudio = async (uri: string, msgId: string) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      if (playingId === msgId) {
        setPlayingId(null);
        setPlaybackProgress(0);
        return;
      }

      const { sound } = await Audio.Sound.createAsync({ uri });
      soundRef.current = sound;
      setPlayingId(msgId);
      setPlaybackProgress(0);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (status.durationMillis) {
            setPlaybackProgress(status.positionMillis / status.durationMillis);
          }
          if (status.didJustFinish) {
            setPlayingId(null);
            setPlaybackProgress(0);
            sound.unloadAsync();
            soundRef.current = null;
          }
        }
      });

      await sound.playAsync();
    } catch (err) {
      console.error('Playback failed:', err);
      setPlayingId(null);
    }
  };

  // ─── Call ───
  const startCall = (type: 'voice' | 'video') => {
    setCallType(type);
    setShowCall(true);
    setCallActive(false);
    setCallTimer(0);
    setTimeout(() => {
      setCallActive(true);
      timerRef.current = setInterval(() => {
        setCallTimer((p) => p + 1);
      }, 1000);
    }, 2000);
  };

  const endCall = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const duration = callTimer;
    setShowCall(false);
    setCallActive(false);
    setCallTimer(0);
    if (duration > 0) {
      const mins = Math.floor(duration / 60);
      const secs = duration % 60;
      const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
      addMessage(bk.id, `${callType === 'video' ? 'Video' : 'Ovozli'} qo'ng'iroq · ${timeStr}`, false);
    }
  };

  const fmtSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ─── Render Message ───
  const renderMsg = ({ item }: { item: DoctorMessage }) => {
    // System message (call log)
    const isCallLog = item.text.includes('qo\'ng\'iroq ·');
    if (isCallLog && !item.isUser) {
      return (
        <View style={st.sysMsg}>
          <View style={st.sysMsgInner}>
            <Ionicons name={item.text.includes('Video') ? 'videocam' : 'call'} size={14} color={C.green} />
            <Text style={st.sysMsgText}>{item.text}</Text>
          </View>
        </View>
      );
    }

    // Image message
    if (item.image) {
      return (
        <View style={[st.row, item.isUser && st.rowUser]}>
          {!item.isUser && (
            <View style={[st.docAvatar, { backgroundColor: sp.bg }]}>
              <Ionicons name={sp.icon as any} size={13} color={sp.color} />
            </View>
          )}
          <TouchableOpacity
            style={[st.imageBubble, item.isUser ? st.userBubble : st.docBubble]}
            onPress={() => setPreviewImage(item.image!)}
            activeOpacity={0.9}
          >
            {!item.isUser && <Text style={st.docLabel}>{bk.doctorName.split(' ').slice(0, 2).join(' ')}</Text>}
            <Image source={{ uri: item.image }} style={st.msgImage} resizeMode="cover" />
            {item.text ? <Text style={[st.bubbleText, item.isUser && st.userBubbleText, { marginTop: SP.xs }]}>{item.text}</Text> : null}
            <View style={st.bubbleFooter}>
              <Text style={[st.bubbleTime, item.isUser && st.userBubbleTime]}>
                {item.timestamp.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
              </Text>
              {item.isUser && <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.4)" style={{ marginLeft: 4 }} />}
            </View>
          </TouchableOpacity>
        </View>
      );
    }

    // Audio message
    if (item.audio) {
      const isPlaying = playingId === item.id;
      const dur = item.audioDuration || 0;
      return (
        <View style={[st.row, item.isUser && st.rowUser]}>
          {!item.isUser && (
            <View style={[st.docAvatar, { backgroundColor: sp.bg }]}>
              <Ionicons name={sp.icon as any} size={13} color={sp.color} />
            </View>
          )}
          <View style={[st.bubble, item.isUser ? st.userBubble : st.docBubble]}>
            {!item.isUser && <Text style={st.docLabel}>{bk.doctorName.split(' ').slice(0, 2).join(' ')}</Text>}
            <View style={st.audioRow}>
              <TouchableOpacity
                style={[st.audioPlayBtn, { backgroundColor: item.isUser ? 'rgba(255,255,255,0.2)' : C.brandLight }]}
                onPress={() => playAudio(item.audio!, item.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={18}
                  color={item.isUser ? C.textInverse : C.brand}
                />
              </TouchableOpacity>
              <View style={st.audioWaveWrap}>
                {/* Wave bars */}
                <View style={st.audioWave}>
                  {Array.from({ length: 20 }, (_, i) => {
                    const h = 4 + Math.sin(i * 0.8) * 8 + Math.random() * 6;
                    const filled = isPlaying && i / 20 <= playbackProgress;
                    return (
                      <View
                        key={i}
                        style={[
                          st.audioBar,
                          {
                            height: h,
                            backgroundColor: filled
                              ? (item.isUser ? C.textInverse : C.brand)
                              : (item.isUser ? 'rgba(255,255,255,0.3)' : C.border),
                          },
                        ]}
                      />
                    );
                  })}
                </View>
                <Text style={[st.audioDur, item.isUser && { color: 'rgba(255,255,255,0.6)' }]}>
                  {fmtSec(dur)}
                </Text>
              </View>
            </View>
            <View style={st.bubbleFooter}>
              <Text style={[st.bubbleTime, item.isUser && st.userBubbleTime]}>
                {item.timestamp.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
              </Text>
              {item.isUser && <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.4)" style={{ marginLeft: 4 }} />}
            </View>
          </View>
        </View>
      );
    }

    // Text message
    return (
      <View style={[st.row, item.isUser && st.rowUser]}>
        {!item.isUser && (
          <View style={[st.docAvatar, { backgroundColor: sp.bg }]}>
            <Ionicons name={sp.icon as any} size={13} color={sp.color} />
          </View>
        )}
        <View style={[st.bubble, item.isUser ? st.userBubble : st.docBubble]}>
          {!item.isUser && <Text style={st.docLabel}>{bk.doctorName.split(' ').slice(0, 2).join(' ')}</Text>}
          <Text style={[st.bubbleText, item.isUser && st.userBubbleText]}>{item.text}</Text>
          <View style={st.bubbleFooter}>
            <Text style={[st.bubbleTime, item.isUser && st.userBubbleTime]}>
              {item.timestamp.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {item.isUser && <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.4)" style={{ marginLeft: 4 }} />}
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={st.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? TAB_BAR_HEIGHT : 0}>
      {/* Header */}
      <View style={st.header}>
        <TouchableOpacity style={st.backBtn} onPress={() => nav.goBack()}>
          <Ionicons name="arrow-back" size={20} color={C.text} />
        </TouchableOpacity>

        <TouchableOpacity style={st.headerCenter} onPress={() => setShowInfo(true)} activeOpacity={0.7}>
          <View style={[st.headerAvatar, { backgroundColor: sp.bg }]}>
            <Ionicons name={sp.icon as any} size={16} color={sp.color} />
            <View style={st.onlineDot} />
          </View>
          <View>
            <Text style={st.headerName} numberOfLines={1}>{bk.doctorName}</Text>
            <Text style={st.headerStatus}>
              {bk.specialty} · Online
            </Text>
          </View>
        </TouchableOpacity>

        <View style={st.headerActions}>
          <TouchableOpacity style={st.headerActionBtn} onPress={() => startCall('voice')}>
            <Ionicons name="call-outline" size={19} color={C.text} />
          </TouchableOpacity>
          <TouchableOpacity style={st.headerActionBtn} onPress={() => startCall('video')}>
            <Ionicons name="videocam-outline" size={20} color={C.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Booking info bar */}
      <View style={st.infoBar}>
        <View style={st.infoLeft}>
          <Ionicons name="calendar-outline" size={14} color={C.brand} />
          <Text style={st.infoText}>{bk.days.length} kunlik bron</Text>
        </View>
        <Text style={st.infoPrice}>{bk.totalPrice.toLocaleString()} so'm</Text>
      </View>

      {/* Messages */}
      <FlatList
        ref={ref}
        data={msgs}
        renderItem={renderMsg}
        keyExtractor={(i) => i.id}
        contentContainerStyle={st.msgList}
        onContentSizeChange={() => ref.current?.scrollToEnd({ animated: true })}
        onLayout={() => ref.current?.scrollToEnd({ animated: true })}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={typing ? (
          <View style={st.typingRow}>
            <View style={[st.docAvatar, { backgroundColor: sp.bg }]}>
              <Ionicons name={sp.icon as any} size={13} color={sp.color} />
            </View>
            <View style={st.typingBubble}>
              <View style={st.typingDots}>
                <View style={[st.typDot, st.typDot1]} />
                <View style={[st.typDot, st.typDot2]} />
                <View style={[st.typDot, st.typDot3]} />
              </View>
            </View>
          </View>
        ) : null}
      />

      {/* Recording overlay */}
      {isRecording && (
        <View style={st.recOverlay}>
          <View style={st.recContent}>
            <View style={st.recDot} />
            <Text style={st.recTime}>{fmtSec(recordDuration)}</Text>
            <Text style={st.recLabel}>Yozilmoqda...</Text>
          </View>
          <View style={st.recActions}>
            <TouchableOpacity style={st.recCancelBtn} onPress={cancelRecording} activeOpacity={0.7}>
              <Ionicons name="trash-outline" size={20} color={C.red} />
            </TouchableOpacity>
            <TouchableOpacity style={st.recStopBtn} onPress={stopRecording} activeOpacity={0.8}>
              <Ionicons name="arrow-up" size={22} color={C.textInverse} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Input bar */}
      {!isRecording && (
        <View style={st.inputBar}>
          <TouchableOpacity style={st.attachBtn} onPress={pickImage} activeOpacity={0.7}>
            <Ionicons name="add-circle-outline" size={24} color={C.textTertiary} />
          </TouchableOpacity>
          <View style={st.inputWrap}>
            <TextInput
              style={st.input}
              value={input}
              onChangeText={setInput}
              placeholder="Xabar yozing..."
              placeholderTextColor={C.textTertiary}
              multiline
              maxLength={1000}
              onFocus={() => setTimeout(() => ref.current?.scrollToEnd({ animated: true }), 300)}
            />
          </View>
          {input.trim() ? (
            <TouchableOpacity style={st.sendBtn} onPress={send} activeOpacity={0.8}>
              <Ionicons name="arrow-up" size={18} color={C.textInverse} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={st.micBtn}
              onPress={startRecording}
              activeOpacity={0.7}
            >
              <Ionicons name="mic-outline" size={22} color={C.brand} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ─── Image Preview Modal ─── */}
      <Modal visible={!!previewImage} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setPreviewImage(null)}>
        <View style={st.previewOverlay}>
          <TouchableOpacity style={st.previewClose} onPress={() => setPreviewImage(null)}>
            <Ionicons name="close" size={24} color={C.textInverse} />
          </TouchableOpacity>
          {previewImage && (
            <Image source={{ uri: previewImage }} style={st.previewImg} resizeMode="contain" />
          )}
        </View>
      </Modal>

      {/* ─── Call Modal ─── */}
      <Modal visible={showCall} animationType="slide" statusBarTranslucent>
        <View style={st.callRoot}>
          <View style={st.callBg}>
            {callType === 'video' && callActive && (
              <>
                <View style={st.videoRemote}>
                  <Ionicons name={sp.icon as any} size={60} color={sp.color} />
                </View>
                <View style={st.videoLocal}>
                  <Ionicons name="person" size={20} color={C.brand} />
                </View>
              </>
            )}
          </View>

          <View style={st.callOverlay}>
            <View style={st.callTopInfo}>
              {callType === 'video' && (
                <View style={st.callVideoLabel}>
                  <View style={st.callRecDot} />
                  <Text style={st.callVideoLabelText}>Video qo'ng'iroq</Text>
                </View>
              )}
            </View>

            <View style={st.callCenter}>
              {!(callType === 'video' && callActive) && (
                <View style={[st.callAvatar, { backgroundColor: sp.bg }]}>
                  <Ionicons name={sp.icon as any} size={40} color={sp.color} />
                </View>
              )}
              <Text style={st.callName}>{bk.doctorName}</Text>
              <Text style={st.callSpec}>{bk.specialty}</Text>
              <Text style={st.callStatus}>
                {callActive ? fmtSec(callTimer) : 'Qo\'ng\'iroq qilinmoqda...'}
              </Text>
            </View>

            <View style={st.callControls}>
              <View style={st.callControlsRow}>
                <TouchableOpacity style={st.callCtrlBtn}>
                  <Ionicons name={callActive ? 'mic' : 'mic-off'} size={22} color={C.textInverse} />
                  <Text style={st.callCtrlLabel}>Mikrofon</Text>
                </TouchableOpacity>

                {callType === 'video' && (
                  <TouchableOpacity style={st.callCtrlBtn}>
                    <Ionicons name="camera-reverse-outline" size={22} color={C.textInverse} />
                    <Text style={st.callCtrlLabel}>Kamera</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={st.callCtrlBtn}>
                  <Ionicons name={callType === 'video' ? 'videocam-off-outline' : 'volume-high-outline'} size={22} color={C.textInverse} />
                  <Text style={st.callCtrlLabel}>{callType === 'video' ? 'Video' : 'Dinamik'}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={st.endCallBtn} onPress={endCall} activeOpacity={0.8}>
                <Ionicons name="call" size={24} color={C.textInverse} style={{ transform: [{ rotate: '135deg' }] }} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Info Modal ─── */}
      <Modal visible={showInfo} animationType="slide" transparent statusBarTranslucent>
        <View style={st.infoModalOverlay}>
          <View style={st.infoModal}>
            <View style={st.infoModalHandle} />

            <View style={st.infoModalHeader}>
              <View style={[st.infoModalAvatar, { backgroundColor: sp.bg }]}>
                <Ionicons name={sp.icon as any} size={28} color={sp.color} />
              </View>
              <Text style={st.infoModalName}>{bk.doctorName}</Text>
              <Text style={st.infoModalSpec}>{bk.specialty}</Text>
            </View>

            <View style={st.infoActions}>
              <TouchableOpacity style={st.infoActionBtn} onPress={() => { setShowInfo(false); startCall('voice'); }}>
                <View style={[st.infoActionIcon, { backgroundColor: C.greenLight }]}>
                  <Ionicons name="call-outline" size={20} color={C.green} />
                </View>
                <Text style={st.infoActionLabel}>Qo'ng'iroq</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.infoActionBtn} onPress={() => { setShowInfo(false); startCall('video'); }}>
                <View style={[st.infoActionIcon, { backgroundColor: C.brandLight }]}>
                  <Ionicons name="videocam-outline" size={20} color={C.brand} />
                </View>
                <Text style={st.infoActionLabel}>Video</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.infoActionBtn}>
                <View style={[st.infoActionIcon, { backgroundColor: C.purpleLight }]}>
                  <Ionicons name="document-text-outline" size={20} color={C.purple} />
                </View>
                <Text style={st.infoActionLabel}>Retsept</Text>
              </TouchableOpacity>
            </View>

            <View style={st.infoSection}>
              <Text style={st.infoSectionTitle}>Bron tafsilotlari</Text>
              {bk.days.map((d, i) => (
                <View key={i} style={st.infoDetailRow}>
                  <View style={st.infoDetailLeft}>
                    <Ionicons name="calendar-outline" size={14} color={C.textTertiary} />
                    <Text style={st.infoDetailText}>{d.date}</Text>
                  </View>
                  <View style={st.infoTimeBadge}>
                    <Text style={st.infoTimeText}>{d.time}</Text>
                  </View>
                </View>
              ))}
              <View style={st.infoTotalRow}>
                <Text style={st.infoTotalLabel}>Jami</Text>
                <Text style={st.infoTotalValue}>{bk.totalPrice.toLocaleString()} so'm</Text>
              </View>
            </View>

            <TouchableOpacity style={st.infoCloseBtn} onPress={() => setShowInfo(false)}>
              <Text style={st.infoCloseBtnText}>Yopish</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // ── Header ──
  header: {
    backgroundColor: C.card,
    paddingTop: 52, paddingBottom: SP.md, paddingHorizontal: SP.lg,
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: RADIUS.sm,
    backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center',
    marginRight: SP.md, borderWidth: 1, borderColor: C.border,
  },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SP.md },
  headerAvatar: {
    width: 40, height: 40, borderRadius: RADIUS.sm,
    justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  onlineDot: {
    position: 'absolute', bottom: -1, right: -1,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: C.green, borderWidth: 2, borderColor: C.card,
  },
  headerName: { fontSize: 15, fontWeight: '600', color: C.text },
  headerStatus: { fontSize: 11, color: C.textTertiary, marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: SP.xs },
  headerActionBtn: {
    width: 38, height: 38, borderRadius: RADIUS.sm,
    backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },

  // ── Info bar ──
  infoBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.brandLight, paddingHorizontal: SP.lg, paddingVertical: SP.sm,
    borderBottomWidth: 1, borderBottomColor: C.brandMuted,
  },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  infoText: { fontSize: 12, color: C.brandDark, fontWeight: '500' },
  infoPrice: { fontSize: 12, color: C.brandDark, fontWeight: '700' },

  // ── Messages ──
  msgList: { padding: SP.lg, paddingBottom: SP.sm },
  row: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: SP.md },
  rowUser: { justifyContent: 'flex-end' },
  docAvatar: {
    width: 30, height: 30, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    marginRight: SP.sm, marginBottom: 2,
  },
  bubble: { maxWidth: '75%', borderRadius: RADIUS.lg, padding: SP.md, paddingBottom: SP.sm },
  userBubble: { backgroundColor: C.brand, borderBottomRightRadius: SP.xs },
  docBubble: { backgroundColor: C.card, borderBottomLeftRadius: SP.xs, borderWidth: 1, borderColor: C.border },
  docLabel: { fontSize: 11, fontWeight: '600', color: C.brand, marginBottom: SP.xs },
  bubbleText: { fontSize: 14, lineHeight: 22, color: C.text },
  userBubbleText: { color: C.textInverse },
  bubbleFooter: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: SP.xs },
  bubbleTime: { fontSize: 10, color: C.textTertiary },
  userBubbleTime: { color: 'rgba(255,255,255,0.45)' },

  // ── Image message ──
  imageBubble: { maxWidth: '75%', borderRadius: RADIUS.lg, padding: SP.xs, paddingBottom: SP.sm, overflow: 'hidden' },
  msgImage: { width: 220, height: 180, borderRadius: RADIUS.md },

  // ── Audio message ──
  audioRow: { flexDirection: 'row', alignItems: 'center', gap: SP.sm, minWidth: 200 },
  audioPlayBtn: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  audioWaveWrap: { flex: 1 },
  audioWave: { flexDirection: 'row', alignItems: 'center', gap: 2, height: 24 },
  audioBar: { width: 3, borderRadius: 1.5 },
  audioDur: { fontSize: 10, color: C.textTertiary, marginTop: 2 },

  // System message
  sysMsg: { alignItems: 'center', marginVertical: SP.sm },
  sysMsgInner: {
    flexDirection: 'row', alignItems: 'center', gap: SP.sm,
    backgroundColor: C.greenLight, paddingHorizontal: SP.md, paddingVertical: SP.sm,
    borderRadius: RADIUS.full,
  },
  sysMsgText: { fontSize: 12, color: C.greenDark, fontWeight: '500' },

  // Typing
  typingRow: { flexDirection: 'row', alignItems: 'center', marginTop: SP.xs },
  typingBubble: {
    backgroundColor: C.card, borderRadius: RADIUS.md,
    paddingHorizontal: SP.lg, paddingVertical: SP.md,
    borderWidth: 1, borderColor: C.border,
  },
  typingDots: { flexDirection: 'row', gap: 4 },
  typDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.textTertiary },
  typDot1: { opacity: 0.4 },
  typDot2: { opacity: 0.6 },
  typDot3: { opacity: 0.8 },

  // ── Recording overlay ──
  recOverlay: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
    paddingHorizontal: SP.lg, paddingVertical: SP.md,
  },
  recContent: { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  recDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.red },
  recTime: { fontSize: 18, fontWeight: '700', color: C.text },
  recLabel: { fontSize: 13, color: C.textTertiary, fontWeight: '500' },
  recActions: { flexDirection: 'row', alignItems: 'center', gap: SP.md },
  recCancelBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.redLight, justifyContent: 'center', alignItems: 'center',
  },
  recStopBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.brand, justifyContent: 'center', alignItems: 'center',
  },

  // ── Input bar ──
  inputBar: {
    flexDirection: 'row', padding: SP.md,
    paddingBottom: Platform.OS === 'ios' ? 28 : SP.md,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
    alignItems: 'flex-end', gap: SP.sm,
  },
  attachBtn: { width: 42, height: 42, justifyContent: 'center', alignItems: 'center' },
  inputWrap: {
    flex: 1, backgroundColor: C.bg, borderRadius: RADIUS.xl,
    paddingHorizontal: SP.lg, borderWidth: 1, borderColor: C.border,
  },
  input: { fontSize: 14, maxHeight: 100, color: C.text, paddingVertical: SP.md },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.brand, justifyContent: 'center', alignItems: 'center',
  },
  micBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.brandLight, justifyContent: 'center', alignItems: 'center',
  },

  // ── Image Preview ──
  previewOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center', alignItems: 'center',
  },
  previewClose: {
    position: 'absolute', top: 50, right: 20, zIndex: 10,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  previewImg: { width: '90%', height: '70%' },

  // ── Call Modal ──
  callRoot: { flex: 1, backgroundColor: C.dark },
  callBg: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  videoRemote: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: C.darkSecondary, justifyContent: 'center', alignItems: 'center',
  },
  videoLocal: {
    position: 'absolute', top: 60, right: 20,
    width: 100, height: 140, borderRadius: RADIUS.md,
    backgroundColor: C.darkTertiary, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)',
  },
  callOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'space-between',
  },
  callTopInfo: { paddingTop: 60, paddingHorizontal: SP.xl, alignItems: 'center' },
  callVideoLabel: {
    flexDirection: 'row', alignItems: 'center', gap: SP.sm,
    backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: SP.md, paddingVertical: SP.sm,
    borderRadius: RADIUS.full,
  },
  callRecDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.red },
  callVideoLabelText: { fontSize: 12, fontWeight: '600', color: C.textInverse },
  callCenter: { alignItems: 'center' },
  callAvatar: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: 'center', alignItems: 'center', marginBottom: SP.lg,
  },
  callName: { fontSize: 22, fontWeight: '700', color: C.textInverse, marginBottom: SP.xs },
  callSpec: { fontSize: 14, color: C.textTertiary, marginBottom: SP.sm },
  callStatus: { fontSize: 16, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  callControls: { paddingBottom: Platform.OS === 'ios' ? 50 : 30, alignItems: 'center' },
  callControlsRow: { flexDirection: 'row', gap: SP.xxxl, marginBottom: SP.xxl },
  callCtrlBtn: { alignItems: 'center', gap: SP.sm },
  callCtrlLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  endCallBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: C.red, justifyContent: 'center', alignItems: 'center',
  },

  // ── Info Modal ──
  infoModalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  infoModal: {
    backgroundColor: C.card, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SP.xl, paddingBottom: Platform.OS === 'ios' ? 40 : SP.xl,
    maxHeight: '80%',
  },
  infoModalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: C.border, alignSelf: 'center', marginTop: SP.md, marginBottom: SP.xl,
  },
  infoModalHeader: { alignItems: 'center', marginBottom: SP.xl },
  infoModalAvatar: {
    width: 64, height: 64, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', marginBottom: SP.md,
  },
  infoModalName: { fontSize: 18, fontWeight: '700', color: C.text },
  infoModalSpec: { fontSize: 13, color: C.textTertiary, marginTop: 2 },

  infoActions: { flexDirection: 'row', justifyContent: 'center', gap: SP.xxl, marginBottom: SP.xxl },
  infoActionBtn: { alignItems: 'center', gap: SP.sm },
  infoActionIcon: {
    width: 48, height: 48, borderRadius: RADIUS.md,
    justifyContent: 'center', alignItems: 'center',
  },
  infoActionLabel: { fontSize: 11, fontWeight: '600', color: C.textSecondary },

  infoSection: {
    backgroundColor: C.bg, borderRadius: RADIUS.md, padding: SP.lg,
    marginBottom: SP.lg, borderWidth: 1, borderColor: C.border,
  },
  infoSectionTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: SP.md },
  infoDetailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: SP.sm,
  },
  infoDetailLeft: { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  infoDetailText: { fontSize: 13, color: C.text, fontWeight: '500' },
  infoTimeBadge: {
    backgroundColor: C.card, paddingHorizontal: SP.sm, paddingVertical: SP.xs,
    borderRadius: 6, borderWidth: 1, borderColor: C.border,
  },
  infoTimeText: { fontSize: 12, fontWeight: '600', color: C.text },
  infoTotalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: SP.md, marginTop: SP.sm, borderTopWidth: 1, borderTopColor: C.border,
  },
  infoTotalLabel: { fontSize: 14, fontWeight: '600', color: C.textTertiary },
  infoTotalValue: { fontSize: 15, fontWeight: '700', color: C.brand },

  infoCloseBtn: {
    backgroundColor: C.bg, paddingVertical: SP.lg,
    borderRadius: RADIUS.md, alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  infoCloseBtnText: { fontSize: 15, fontWeight: '600', color: C.textSecondary },
});
