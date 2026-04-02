import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getAIResponse, Severity } from '../data/aiResponses';
import { doctors, SPECIALTY_CONFIG } from '../data/doctors';
import { C, RADIUS, SP } from '../theme';

interface AIChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  severity?: Severity;
  confidence?: number;
  category?: string;
  specialty?: string;
  followUp?: string;
}

const SEVERITY_CFG: Record<Severity, { label: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  low: { label: 'Past', color: C.green, bg: C.greenLight, icon: 'shield-checkmark' },
  medium: { label: "O'rta", color: C.amber, bg: C.amberLight, icon: 'warning' },
  high: { label: 'Yuqori', color: '#E04F16', bg: '#FEF6EE', icon: 'alert-circle' },
  critical: { label: 'Jiddiy', color: C.red, bg: C.redLight, icon: 'alert' },
};

export default function AIAssistantScreen() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 56 + Math.max(insets.bottom, 8);
  const [messages, setMessages] = useState<AIChatMessage[]>([{
    id: '0',
    text: 'Assalomu alaykum! Men MedAI — tibbiy yordamchingizman.\n\nSimptomlaringizni ayting, men sizga mos mutaxassis shifokorni topib beraman.\n\n⚠️ Men tashxis qo\'ymayman va davo tayinlamayman — faqat to\'g\'ri shifokorga yo\'naltirishga yordam beraman.',
    isUser: false,
    timestamp: new Date(),
    category: 'Umumiy',
  }]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const listRef = useRef<FlatList>(null);

  const send = () => {
    if (!input.trim()) return;
    const txt = input.trim();
    setMessages((p) => [...p, { id: Date.now().toString(), text: txt, isUser: true, timestamp: new Date() }]);
    setInput('');
    setTyping(true);

    setAnalysisStep('Simptomlar tahlil qilinmoqda...');
    setTimeout(() => setAnalysisStep('Mutaxassislik aniqlanmoqda...'), 600);
    setTimeout(() => setAnalysisStep('Mos shifokor qidirilmoqda...'), 1200);

    setTimeout(() => {
      const result = getAIResponse(txt);
      setMessages((p) => [...p, {
        id: (Date.now() + 1).toString(),
        text: result.response,
        isUser: false,
        timestamp: new Date(),
        severity: result.severity,
        confidence: result.confidence,
        category: result.category,
        specialty: result.specialty,
        followUp: result.followUp,
      }]);
      setTyping(false);
      setAnalysisStep('');
    }, 1800);
  };

  // Find recommended doctors for a specialty
  const getRecommendedDoctors = (specialty: string) => {
    return doctors.filter((d) => d.specialty === specialty && d.available).slice(0, 2);
  };

  const goToDoctor = (specialty: string) => {
    nav.navigate('DoctorsTab', { screen: 'DoctorsList', params: { specialty } });
  };

  const quickActions = [
    { label: 'Boshim og\'riyapti', icon: 'fitness-outline' as const, color: '#7C3AED', bg: '#F5F3FF' },
    { label: 'Isitmam bor', icon: 'thermometer-outline' as const, color: '#DC2626', bg: '#FEF2F2' },
    { label: 'Qorin og\'riydi', icon: 'body-outline' as const, color: '#D97706', bg: '#FFFBEB' },
    { label: 'Tomoqim og\'riydi', icon: 'snow-outline' as const, color: '#0891B2', bg: '#ECFEFF' },
    { label: 'Tishim og\'riydi', icon: 'medical-outline' as const, color: '#4F46E5', bg: '#EEF2FF' },
    { label: 'Ko\'zim og\'riydi', icon: 'eye-outline' as const, color: '#059669', bg: '#ECFDF5' },
    { label: 'Bolam kasal', icon: 'happy-outline' as const, color: '#DB2777', bg: '#FDF2F8' },
    { label: 'Stressdaman', icon: 'heart-outline' as const, color: '#EA580C', bg: '#FFF7ED' },
  ];

  const renderMsg = ({ item }: { item: AIChatMessage }) => {
    const recDoctors = item.specialty ? getRecommendedDoctors(item.specialty) : [];
    const spCfg = item.specialty ? SPECIALTY_CONFIG[item.specialty] : null;

    return (
      <View style={[st.msgRow, item.isUser && st.msgRowUser]}>
        {!item.isUser && (
          <View style={st.aiAvatar}>
            <Ionicons name="medical" size={14} color={C.brand} />
          </View>
        )}
        <View style={[st.bubble, item.isUser ? st.userBubble : st.aiBubble]}>
          {!item.isUser && (
            <View style={st.aiHeader}>
              <Text style={st.aiLabel}>MedAI</Text>
              {item.category && item.category !== 'Umumiy' && item.category !== 'Salomlashish' && (
                <View style={st.catBadge}>
                  <Text style={st.catBadgeText}>{item.category}</Text>
                </View>
              )}
            </View>
          )}

          {/* Severity bar */}
          {!item.isUser && item.severity && item.severity !== 'low' && (
            <View style={[st.severityBar, { backgroundColor: SEVERITY_CFG[item.severity].bg }]}>
              <Ionicons name={SEVERITY_CFG[item.severity].icon} size={14} color={SEVERITY_CFG[item.severity].color} />
              <Text style={[st.severityText, { color: SEVERITY_CFG[item.severity].color }]}>
                Jiddiylik: {SEVERITY_CFG[item.severity].label}
              </Text>
            </View>
          )}

          <Text style={[st.bubbleText, item.isUser && st.userText]}>{item.text}</Text>

          {/* ── Doctor Recommendation Card ── */}
          {!item.isUser && item.specialty && recDoctors.length > 0 && (
            <View style={st.recSection}>
              <View style={st.recHeader}>
                <Ionicons name="people" size={14} color={C.brand} />
                <Text style={st.recTitle}>Tavsiya etilgan shifokorlar</Text>
              </View>
              {recDoctors.map((doc) => (
                <TouchableOpacity
                  key={doc.id}
                  style={st.docCard}
                  onPress={() => goToDoctor(item.specialty!)}
                  activeOpacity={0.7}
                >
                  <View style={[st.docAvatar, { backgroundColor: spCfg?.bg || C.bg }]}>
                    <Ionicons name={(spCfg?.icon || 'medical-outline') as any} size={16} color={spCfg?.color || C.textTertiary} />
                  </View>
                  <View style={st.docInfo}>
                    <Text style={st.docName}>{doc.name}</Text>
                    <View style={st.docMeta}>
                      <Ionicons name="star" size={10} color={C.amber} />
                      <Text style={st.docRating}>{doc.rating}</Text>
                      <Text style={st.docExp}>{doc.experience} yil</Text>
                    </View>
                  </View>
                  <View style={st.docBtn}>
                    <Text style={st.docBtnText}>Murojaat</Text>
                    <Ionicons name="arrow-forward" size={12} color={C.textInverse} />
                  </View>
                </TouchableOpacity>
              ))}
              {/* Go to filtered doctors */}
              <TouchableOpacity
                style={st.allDocsBtn}
                onPress={() => nav.navigate('DoctorsTab', { screen: 'DoctorsList', params: { specialty: item.specialty } })}
                activeOpacity={0.7}
              >
                <Ionicons name={(spCfg?.icon || 'people-outline') as any} size={14} color={C.brand} />
                <Text style={st.allDocsBtnText}>{item.specialty}larni ko'rish</Text>
                <Ionicons name="arrow-forward" size={13} color={C.brand} />
              </TouchableOpacity>
            </View>
          )}

          {/* Confidence */}
          {!item.isUser && item.confidence != null && item.id !== '0' && (
            <View style={st.confidenceRow}>
              <View style={st.confidenceBarBg}>
                <View style={[st.confidenceBarFill, { width: `${item.confidence}%`, backgroundColor: item.confidence > 85 ? C.green : item.confidence > 70 ? C.amber : C.red }]} />
              </View>
              <Text style={st.confidenceText}>AI ishonch: {item.confidence}%</Text>
            </View>
          )}

          {/* Follow-up */}
          {!item.isUser && item.followUp && (
            <TouchableOpacity style={st.followUpBtn} onPress={() => setInput(item.followUp!)} activeOpacity={0.7}>
              <Ionicons name="chatbubble-ellipses-outline" size={13} color={C.brand} />
              <Text style={st.followUpText}>{item.followUp}</Text>
            </TouchableOpacity>
          )}

          <Text style={[st.time, item.isUser && st.userTime]}>
            {item.timestamp.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={st.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? TAB_BAR_HEIGHT : 0}>
      {/* Header */}
      <View style={st.header}>
        <View style={st.headerAv}>
          <Ionicons name="medical" size={20} color={C.brand} />
        </View>
        <View style={st.headerInfo}>
          <View style={st.nameRow}>
            <Text style={st.headerName}>MedAI</Text>
            <View style={st.aiBadge}><Text style={st.aiBadgeText}>AI</Text></View>
          </View>
          <View style={st.statusRow}>
            <View style={st.onDot} />
            <Text style={st.statusText}>Shifokor topish yordamchisi</Text>
          </View>
        </View>
      </View>

      {/* Disclaimer */}
      <View style={st.disclaimer}>
        <Ionicons name="shield-checkmark-outline" size={14} color={C.green} />
        <Text style={st.disclaimerText}>AI tashxis qo'ymaydi — faqat mos shifokorga yo'naltiradi</Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        renderItem={renderMsg}
        keyExtractor={(i) => i.id}
        contentContainerStyle={st.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => listRef.current?.scrollToEnd({ animated: true })}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={messages.length <= 1 ? (
          <View style={st.quickSec}>
            <View style={st.quickHeader}>
              <View style={st.quickLine} />
              <Text style={st.quickLabel}>Simptomlaringizni tanlang</Text>
              <View style={st.quickLine} />
            </View>
            <View style={st.quickGrid}>
              {quickActions.map((q, i) => (
                <TouchableOpacity key={i} style={st.quickCard} onPress={() => { setInput(q.label); }} activeOpacity={0.7}>
                  <View style={[st.quickIconBox, { backgroundColor: q.bg }]}>
                    <Ionicons name={q.icon} size={16} color={q.color} />
                  </View>
                  <Text style={st.quickText}>{q.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}
        ListFooterComponent={typing ? (
          <View style={st.typingRow}>
            <View style={st.aiAvatar}><Ionicons name="medical" size={14} color={C.brand} /></View>
            <View style={st.typingBubble}>
              <ActivityIndicator size="small" color={C.brand} />
              <View>
                <Text style={st.typingText}>{analysisStep || 'Tahlil qilmoqda...'}</Text>
                <View style={st.analysisDots}>
                  <View style={[st.aDot, { backgroundColor: C.brand }]} />
                  <View style={[st.aDot, { backgroundColor: C.brandMuted }]} />
                  <View style={[st.aDot, { backgroundColor: C.border }]} />
                </View>
              </View>
            </View>
          </View>
        ) : null}
      />

      {/* Input */}
      <View style={st.inputBar}>
        <View style={st.inputWrap}>
          <TextInput
            style={st.input}
            value={input}
            onChangeText={setInput}
            placeholder="Simptomlaringizni yozing..."
            placeholderTextColor={C.textTertiary}
            multiline
            maxLength={500}
            onFocus={() => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 300)}
          />
        </View>
        <TouchableOpacity
          style={[st.sendBtn, !input.trim() && st.sendBtnOff]}
          onPress={send}
          disabled={!input.trim()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-up" size={18} color={C.textInverse} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header: { backgroundColor: C.card, paddingTop: 52, paddingBottom: SP.md, paddingHorizontal: SP.xl, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.border },
  headerAv: { width: 44, height: 44, borderRadius: RADIUS.sm, backgroundColor: C.brandLight, justifyContent: 'center', alignItems: 'center', marginRight: SP.md },
  headerInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  headerName: { fontSize: 17, fontWeight: '700', color: C.text },
  aiBadge: { backgroundColor: C.brand, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  aiBadgeText: { fontSize: 9, fontWeight: '800', color: C.textInverse, letterSpacing: 0.5 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 5 },
  onDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },
  statusText: { fontSize: 11, color: C.textTertiary, fontWeight: '500' },

  // Disclaimer
  disclaimer: { flexDirection: 'row', alignItems: 'center', gap: SP.sm, backgroundColor: C.greenLight, paddingHorizontal: SP.lg, paddingVertical: SP.sm },
  disclaimerText: { fontSize: 11, color: C.green, fontWeight: '500' },

  // Messages
  list: { padding: SP.lg, paddingBottom: SP.sm },
  msgRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SP.lg },
  msgRowUser: { justifyContent: 'flex-end' },
  aiAvatar: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.brandLight, justifyContent: 'center', alignItems: 'center', marginRight: SP.sm, marginTop: 2 },
  bubble: { maxWidth: '82%', borderRadius: RADIUS.md, padding: SP.md },
  userBubble: { backgroundColor: C.brand, borderBottomRightRadius: SP.xs },
  aiBubble: { backgroundColor: C.card, borderBottomLeftRadius: SP.xs, borderWidth: 1, borderColor: C.border },

  // AI Header
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: SP.sm, marginBottom: SP.xs },
  aiLabel: { fontSize: 11, fontWeight: '600', color: C.brand },
  catBadge: { backgroundColor: C.brandLight, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  catBadgeText: { fontSize: 9, fontWeight: '600', color: C.brand },

  // Severity
  severityBar: { flexDirection: 'row', alignItems: 'center', gap: SP.xs, paddingHorizontal: SP.sm, paddingVertical: SP.xs, borderRadius: 6, marginBottom: SP.sm },
  severityText: { fontSize: 11, fontWeight: '600' },

  bubbleText: { fontSize: 14, lineHeight: 22, color: C.text },
  userText: { color: C.textInverse },

  // ── Doctor Recommendation ──
  recSection: { marginTop: SP.md, paddingTop: SP.md, borderTopWidth: 1, borderTopColor: C.border },
  recHeader: { flexDirection: 'row', alignItems: 'center', gap: SP.xs, marginBottom: SP.sm },
  recTitle: { fontSize: 12, fontWeight: '600', color: C.brand },

  docCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bg, borderRadius: RADIUS.sm,
    padding: SP.sm, marginBottom: SP.sm,
    borderWidth: 1, borderColor: C.border,
  },
  docAvatar: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginRight: SP.sm,
  },
  docInfo: { flex: 1 },
  docName: { fontSize: 13, fontWeight: '600', color: C.text },
  docMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  docRating: { fontSize: 11, fontWeight: '600', color: C.text },
  docExp: { fontSize: 11, color: C.textTertiary },
  docBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.brand, paddingHorizontal: SP.sm, paddingVertical: 6,
    borderRadius: 6,
  },
  docBtnText: { fontSize: 11, fontWeight: '600', color: C.textInverse },

  allDocsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.xs,
    paddingVertical: SP.sm, borderRadius: 6,
    backgroundColor: C.brandLight,
  },
  allDocsBtnText: { fontSize: 12, fontWeight: '600', color: C.brand },

  // Confidence
  confidenceRow: { flexDirection: 'row', alignItems: 'center', gap: SP.sm, marginTop: SP.md, paddingTop: SP.sm, borderTopWidth: 1, borderTopColor: C.border },
  confidenceBarBg: { flex: 1, height: 4, backgroundColor: C.bg, borderRadius: 2, overflow: 'hidden' },
  confidenceBarFill: { height: 4, borderRadius: 2 },
  confidenceText: { fontSize: 10, color: C.textTertiary, fontWeight: '500' },

  // Follow-up
  followUpBtn: { flexDirection: 'row', alignItems: 'center', gap: SP.xs, backgroundColor: C.brandLight, paddingHorizontal: SP.sm, paddingVertical: SP.xs, borderRadius: 6, marginTop: SP.sm, alignSelf: 'flex-start' },
  followUpText: { fontSize: 11, color: C.brand, fontWeight: '500' },

  time: { fontSize: 10, marginTop: SP.sm, alignSelf: 'flex-end', color: C.textTertiary },
  userTime: { color: 'rgba(255,255,255,0.5)' },

  // Quick actions
  quickSec: { marginBottom: SP.lg },
  quickHeader: { flexDirection: 'row', alignItems: 'center', gap: SP.md, marginBottom: SP.md },
  quickLine: { flex: 1, height: 1, backgroundColor: C.border },
  quickLabel: { fontSize: 12, color: C.textTertiary, fontWeight: '500' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm },
  quickCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, paddingHorizontal: SP.md, paddingVertical: 10, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: C.border, gap: SP.sm },
  quickIconBox: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  quickText: { fontSize: 13, color: C.text, fontWeight: '500' },

  // Typing
  typingRow: { flexDirection: 'row', alignItems: 'center' },
  typingBubble: { flexDirection: 'row', alignItems: 'center', gap: SP.sm, backgroundColor: C.card, borderRadius: RADIUS.sm, paddingHorizontal: SP.md, paddingVertical: 10, borderWidth: 1, borderColor: C.border },
  typingText: { fontSize: 12, color: C.textTertiary, fontWeight: '500' },
  analysisDots: { flexDirection: 'row', gap: 3, marginTop: 3 },
  aDot: { width: 4, height: 4, borderRadius: 2 },

  // Input
  inputBar: { flexDirection: 'row', padding: SP.md, backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border, alignItems: 'flex-end', gap: SP.sm },
  inputWrap: { flex: 1, backgroundColor: C.bg, borderRadius: RADIUS.xl, paddingHorizontal: SP.lg, borderWidth: 1, borderColor: C.border },
  input: { fontSize: 14, maxHeight: 100, color: C.text, paddingVertical: SP.md },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.brand, justifyContent: 'center', alignItems: 'center' },
  sendBtnOff: { backgroundColor: C.border },
});
