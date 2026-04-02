import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { C, RADIUS, SP } from '../theme';
import { sendMessage, ChatMessage as ApiMessage, ChatServiceError } from '../services/chatService';
import { ApiDoctor, fetchDoctors } from '../services/doctorService';
import { SPECIALTY_CONFIG } from '../data/doctors';

// API spec -> lokal config mapping
const API_SPEC_MAP: Record<string, string> = {
  'Nevrolog': 'Nevropatolog',
  'Otorinolaringolog': 'LOR',
};
const getSpecConfig = (spec: string) =>
  SPECIALTY_CONFIG[spec] || SPECIALTY_CONFIG[API_SPEC_MAP[spec] || ''] || { icon: 'medical-outline', color: C.textTertiary, bg: C.bg };

// [SPEC:...] tag ni parse qilish
const SPEC_REGEX = /\[SPEC:([^\]]+)\]/;
const parseSpec = (text: string): { cleanText: string; spec: string | null } => {
  const match = text.match(SPEC_REGEX);
  if (match) {
    return { cleanText: text.replace(SPEC_REGEX, '').trim(), spec: match[1] };
  }
  return { cleanText: text, spec: null };
};

interface Message {
  id: string;
  text: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isError?: boolean;
  spec?: string | null;
}

const WELCOME_MSG: Message = {
  id: '0',
  text: 'Assalomu alaykum! Men MedAI — tibbiy yordamchingizman.\n\nSimptomlaringizni ayting, men sizga mos shifokorni topib beraman.',
  role: 'assistant',
  timestamp: new Date(),
};

const QUICK_ACTIONS = [
  { label: "Boshim og'riyapti", icon: 'fitness-outline' as const, color: '#7C3AED', bg: '#F5F3FF' },
  { label: 'Isitmam bor', icon: 'thermometer-outline' as const, color: '#DC2626', bg: '#FEF2F2' },
  { label: "Qorin og'riydi", icon: 'body-outline' as const, color: '#D97706', bg: '#FFFBEB' },
  { label: "Tomoqim og'riydi", icon: 'snow-outline' as const, color: '#0891B2', bg: '#ECFEFF' },
  { label: "Tishim og'riydi", icon: 'medical-outline' as const, color: '#4F46E5', bg: '#EEF2FF' },
  { label: "Ko'zim og'riydi", icon: 'eye-outline' as const, color: '#059669', bg: '#ECFDF5' },
  { label: 'Bolam kasal', icon: 'happy-outline' as const, color: '#DB2777', bg: '#FDF2F8' },
  { label: 'Stressdaman', icon: 'heart-outline' as const, color: '#EA580C', bg: '#FFF7ED' },
];

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();
  const TAB_BAR_HEIGHT = 56 + Math.max(insets.bottom, 8);

  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [allDoctors, setAllDoctors] = useState<ApiDoctor[]>([]);
  const listRef = useRef<FlatList>(null);

  // Doktorlar ro'yxatini yuklash
  useEffect(() => {
    fetchDoctors().then(setAllDoctors).catch(() => {});
  }, []);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const buildApiMessages = (msgs: Message[]): ApiMessage[] =>
    msgs
      .filter((m) => m.id !== '0' && !m.isError)
      .map((m) => ({ role: m.role, text: m.text }));

  // Spec bo'yicha mos doktorlarni topish
  const getDoctorsForSpec = useCallback((spec: string): ApiDoctor[] => {
    return allDoctors
      .filter((d) => d.spec === spec && d.online)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 2);
  }, [allDoctors]);

  const handleSend = useCallback(
    async (text?: string) => {
      const msg = (text ?? input).trim();
      if (!msg || loading) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        text: msg,
        role: 'user',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput('');
      setLoading(true);
      scrollToEnd();

      try {
        const allMessages = [...messages, userMsg];
        const reply = await sendMessage(buildApiMessages(allMessages));
        const { cleanText, spec } = parseSpec(reply);

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            text: cleanText,
            role: 'assistant',
            timestamp: new Date(),
            spec,
          },
        ]);
      } catch (error) {
        const errorText =
          error instanceof ChatServiceError
            ? error.message
            : "Noma'lum xatolik yuz berdi";

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            text: errorText,
            role: 'assistant',
            timestamp: new Date(),
            isError: true,
          },
        ]);
      } finally {
        setLoading(false);
        scrollToEnd();
      }
    },
    [input, loading, messages, scrollToEnd],
  );

  const handleRetry = useCallback(() => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) return;
    setMessages((prev) => prev.filter((m) => !m.isError || m.id !== prev[prev.length - 1]?.id));
    handleSend(lastUserMsg.text);
  }, [messages, handleSend]);

  const goToDoctor = (doctorId: string) => {
    nav.navigate('DoctorsTab', { screen: 'DoctorDetail', params: { doctorId } });
  };

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => {
      const recDoctors = item.spec ? getDoctorsForSpec(item.spec) : [];
      const spCfg = item.spec ? getSpecConfig(item.spec) : null;

      return (
        <View style={[s.msgRow, item.role === 'user' && s.msgRowUser]}>
          {item.role === 'assistant' && (
            <View style={[s.avatar, item.isError && s.avatarError]}>
              <Ionicons
                name={item.isError ? 'alert-circle' : 'medical'}
                size={14}
                color={item.isError ? C.red : C.brand}
              />
            </View>
          )}
          <View
            style={[
              s.bubble,
              item.role === 'user' ? s.userBubble : s.aiBubble,
              item.isError && s.errorBubble,
            ]}
          >
            {item.role === 'assistant' && (
              <View style={s.aiHeader}>
                <Text style={[s.aiLabel, item.isError && { color: C.red }]}>
                  {item.isError ? 'Xatolik' : 'MedAI'}
                </Text>
                {!item.isError && item.id !== '0' && (
                  <View style={s.aiBadge}>
                    <Text style={s.aiBadgeText}>AI</Text>
                  </View>
                )}
              </View>
            )}

            <Text style={[s.bubbleText, item.role === 'user' && s.userText]}>
              {item.text}
            </Text>

            {/* Doktor tavsiyasi */}
            {recDoctors.length > 0 && (
              <View style={s.docSection}>
                <View style={s.docSectionHeader}>
                  <Ionicons name="people" size={13} color={C.brand} />
                  <Text style={s.docSectionTitle}>Tavsiya etilgan shifokorlar</Text>
                </View>
                {recDoctors.map((doc) => (
                  <TouchableOpacity
                    key={doc._id}
                    style={s.docCard}
                    onPress={() => goToDoctor(doc._id)}
                    activeOpacity={0.7}
                  >
                    <View style={[s.docAvatar, { backgroundColor: spCfg?.bg || C.bg }]}>
                      <Ionicons name={(spCfg?.icon || 'medical-outline') as any} size={16} color={spCfg?.color || C.textTertiary} />
                    </View>
                    <View style={s.docInfo}>
                      <Text style={s.docName} numberOfLines={1}>{doc.name}</Text>
                      <View style={s.docMeta}>
                        <Ionicons name="star" size={10} color={C.amber} />
                        <Text style={s.docRating}>{doc.rating}</Text>
                        <Text style={s.docExp}>{doc.exp} yil</Text>
                        <Text style={s.docPrice}>{(doc.price / 1000).toFixed(0)}k</Text>
                      </View>
                    </View>
                    <View style={s.docBtn}>
                      <Text style={s.docBtnText}>Murojaat</Text>
                      <Ionicons name="arrow-forward" size={12} color={C.textInverse} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {item.isError && (
              <TouchableOpacity style={s.retryBtn} onPress={handleRetry} activeOpacity={0.7}>
                <Ionicons name="refresh" size={14} color={C.red} />
                <Text style={s.retryText}>Qaytadan urinish</Text>
              </TouchableOpacity>
            )}

            <Text style={[s.time, item.role === 'user' && s.userTime]}>
              {item.timestamp.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      );
    },
    [handleRetry, getDoctorsForSpec],
  );

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? TAB_BAR_HEIGHT : 0}
    >
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerAv}>
          <Ionicons name="medical" size={20} color={C.brand} />
        </View>
        <View style={s.headerInfo}>
          <View style={s.nameRow}>
            <Text style={s.headerName}>MedAI</Text>
            <View style={s.headerBadge}>
              <Text style={s.headerBadgeText}>AI</Text>
            </View>
          </View>
          <View style={s.statusRow}>
            <View style={s.onDot} />
            <Text style={s.statusText}>Tibbiy yordamchi</Text>
          </View>
        </View>
      </View>

      {/* Disclaimer */}
      <View style={s.disclaimer}>
        <Ionicons name="shield-checkmark-outline" size={14} color={C.green} />
        <Text style={s.disclaimerText}>
          AI maslahat beradi — lekin shifokor o'rnini bosmaydi
        </Text>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(m) => m.id}
        contentContainerStyle={s.list}
        onContentSizeChange={scrollToEnd}
        onLayout={scrollToEnd}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          messages.length <= 1 ? (
            <View style={s.quickSec}>
              <View style={s.quickHeader}>
                <View style={s.quickLine} />
                <Text style={s.quickLabel}>Tez savollar</Text>
                <View style={s.quickLine} />
              </View>
              <View style={s.quickGrid}>
                {QUICK_ACTIONS.map((q, i) => (
                  <TouchableOpacity
                    key={i}
                    style={s.quickCard}
                    onPress={() => handleSend(q.label)}
                    activeOpacity={0.7}
                  >
                    <View style={[s.quickIconBox, { backgroundColor: q.bg }]}>
                      <Ionicons name={q.icon} size={16} color={q.color} />
                    </View>
                    <Text style={s.quickText}>{q.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null
        }
        ListFooterComponent={
          loading ? (
            <View style={s.typingRow}>
              <View style={s.avatar}>
                <Ionicons name="medical" size={14} color={C.brand} />
              </View>
              <View style={s.typingBubble}>
                <ActivityIndicator size="small" color={C.brand} />
                <Text style={s.typingText}>Javob yozilmoqda...</Text>
              </View>
            </View>
          ) : null
        }
      />

      {/* Input */}
      <View style={s.inputBar}>
        <View style={s.inputWrap}>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="Savolingizni yozing..."
            placeholderTextColor={C.textTertiary}
            multiline
            maxLength={1000}
            editable={!loading}
            onFocus={() => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 300)}
          />
        </View>
        <TouchableOpacity
          style={[s.sendBtn, (!input.trim() || loading) && s.sendBtnOff]}
          onPress={() => handleSend()}
          disabled={!input.trim() || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color={C.textInverse} />
          ) : (
            <Ionicons name="arrow-up" size={18} color={C.textInverse} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    backgroundColor: C.card,
    paddingTop: 52,
    paddingBottom: SP.md,
    paddingHorizontal: SP.xl,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerAv: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: C.brandLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SP.md,
  },
  headerInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  headerName: { fontSize: 17, fontWeight: '700', color: C.text },
  headerBadge: {
    backgroundColor: C.brand,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  headerBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: C.textInverse,
    letterSpacing: 0.5,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 5 },
  onDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },
  statusText: { fontSize: 11, color: C.textTertiary, fontWeight: '500' },

  // Disclaimer
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.sm,
    backgroundColor: C.greenLight,
    paddingHorizontal: SP.lg,
    paddingVertical: SP.sm,
  },
  disclaimerText: { fontSize: 11, color: C.green, fontWeight: '500' },

  // Messages
  list: { padding: SP.lg, paddingBottom: SP.sm },
  msgRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SP.lg },
  msgRowUser: { justifyContent: 'flex-end' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.brandLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SP.sm,
    marginTop: 2,
  },
  avatarError: { backgroundColor: C.redLight },
  bubble: { maxWidth: '82%', borderRadius: RADIUS.md, padding: SP.md },
  userBubble: { backgroundColor: C.brand, borderBottomRightRadius: SP.xs },
  aiBubble: {
    backgroundColor: C.card,
    borderBottomLeftRadius: SP.xs,
    borderWidth: 1,
    borderColor: C.border,
  },
  errorBubble: { borderColor: C.red, backgroundColor: C.redLight },

  // AI header
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: SP.sm, marginBottom: SP.xs },
  aiLabel: { fontSize: 11, fontWeight: '600', color: C.brand },
  aiBadge: {
    backgroundColor: C.brandLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  aiBadgeText: { fontSize: 9, fontWeight: '600', color: C.brand },

  bubbleText: { fontSize: 14, lineHeight: 22, color: C.text },
  userText: { color: C.textInverse },

  // Doctor recommendation
  docSection: {
    marginTop: SP.md,
    paddingTop: SP.md,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  docSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.xs,
    marginBottom: SP.sm,
  },
  docSectionTitle: { fontSize: 12, fontWeight: '700', color: C.brand },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: RADIUS.sm,
    padding: SP.sm,
    marginBottom: SP.xs,
    borderWidth: 1,
    borderColor: C.border,
  },
  docAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SP.sm,
  },
  docInfo: { flex: 1 },
  docName: { fontSize: 13, fontWeight: '600', color: C.text },
  docMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  docRating: { fontSize: 11, fontWeight: '600', color: C.text },
  docExp: { fontSize: 11, color: C.textTertiary },
  docPrice: { fontSize: 11, fontWeight: '600', color: C.brand },
  docBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.brand,
    paddingHorizontal: SP.sm,
    paddingVertical: SP.xs,
    borderRadius: 6,
  },
  docBtnText: { fontSize: 11, fontWeight: '600', color: C.textInverse },

  // Error retry
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.xs,
    marginTop: SP.sm,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: SP.sm,
    paddingVertical: SP.xs,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.red,
  },
  retryText: { fontSize: 12, fontWeight: '600', color: C.red },

  time: { fontSize: 10, marginTop: SP.sm, alignSelf: 'flex-end', color: C.textTertiary },
  userTime: { color: 'rgba(255,255,255,0.5)' },

  // Quick actions
  quickSec: { marginBottom: SP.lg },
  quickHeader: { flexDirection: 'row', alignItems: 'center', gap: SP.md, marginBottom: SP.md },
  quickLine: { flex: 1, height: 1, backgroundColor: C.border },
  quickLabel: { fontSize: 12, color: C.textTertiary, fontWeight: '500' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm },
  quickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    paddingHorizontal: SP.md,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: C.border,
    gap: SP.sm,
  },
  quickIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickText: { fontSize: 13, color: C.text, fontWeight: '500' },

  // Typing indicator
  typingRow: { flexDirection: 'row', alignItems: 'center' },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.sm,
    backgroundColor: C.card,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SP.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  typingText: { fontSize: 12, color: C.textTertiary, fontWeight: '500' },

  // Input
  inputBar: {
    flexDirection: 'row',
    padding: SP.md,
    backgroundColor: C.card,
    borderTopWidth: 1,
    borderTopColor: C.border,
    alignItems: 'flex-end',
    gap: SP.sm,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: C.bg,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SP.lg,
    borderWidth: 1,
    borderColor: C.border,
  },
  input: { fontSize: 14, maxHeight: 100, color: C.text, paddingVertical: SP.md },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.brand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnOff: { backgroundColor: C.border },
});
