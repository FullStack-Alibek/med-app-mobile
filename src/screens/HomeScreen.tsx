import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useApp } from '../context/AppContext';
import { SPECIALTY_CONFIG } from '../data/doctors';
import { C, RADIUS, SP } from '../theme';

const SCREEN_W = Dimensions.get('window').width;

function Ring({ size, pct, color, trackColor, strokeWidth = 6, children }: {
  size: number; pct: number; color: string; trackColor: string; strokeWidth?: number; children?: React.ReactNode;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (Math.min(pct, 100) / 100);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeLinecap="round" strokeDasharray={`${dash} ${circ - dash}`} rotation={-90} origin={`${size / 2}, ${size / 2}`} />
      </Svg>
      {children}
    </View>
  );
}

export default function HomeScreen() {
  const nav = useNavigation<any>();
  const { bookings, reminders, health, medCard } = useApp();
  const active = bookings.filter((b) => b.status === 'confirmed');
  const activeReminders = reminders.filter((r) => r.enabled);

  const sleepPct = Math.min(Math.round((health.sleepHours / health.sleepGoal) * 100), 100);
  const stepsPct = Math.min(Math.round((health.steps / health.stepsGoal) * 100), 100);
  const waterPct = Math.min(Math.round((health.waterMl / health.waterGoal) * 100), 100);

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <TouchableOpacity style={s.userRow} onPress={() => nav.navigate('Profile')} activeOpacity={0.7}>
            <View style={s.avatar}>
              <Ionicons name="person-circle-outline" size={28} color={C.brand} />
            </View>
            <View>
              <Text style={s.hello}>{medCard.fullName || 'Assalomu alaykum'}</Text>
              <Text style={s.sub}>{medCard.fullName ? 'Profilni ko\'rish' : 'Profil to\'ldirish uchun bosing'}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} onPress={() => nav.navigate('Reminders')}>
            <Ionicons name="notifications-outline" size={20} color={C.textTertiary} />
            {activeReminders.length > 0 && (
              <View style={s.bellBadge}>
                <Text style={s.bellBadgeText}>{activeReminders.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={s.body} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>

        {/* ── Health Charts ── */}
        <TouchableOpacity style={s.healthCard} onPress={() => nav.navigate('Health')} activeOpacity={0.8}>
          <View style={s.healthHeader}>
            <View>
              <Text style={s.healthTitle}>Kunlik salomatlik</Text>
              <Text style={s.healthSub}>Bugungi ko'rsatkichlar</Text>
            </View>
            <View style={s.healthMore}>
              <Text style={s.healthMoreText}>Batafsil</Text>
              <Ionicons name="chevron-forward" size={14} color={C.brand} />
            </View>
          </View>

          {/* 3 Ring Charts */}
          <View style={s.chartsRow}>
            {/* Sleep Ring */}
            <View style={s.chartItem}>
              <Ring size={80} pct={sleepPct} color="#6366F1" trackColor="#EEF2FF" strokeWidth={7}>
                <Ionicons name="moon" size={18} color="#6366F1" />
              </Ring>
              <Text style={s.chartVal}>{health.sleepHours} <Text style={s.chartUnit}>soat</Text></Text>
              <Text style={s.chartLabel}>Uyqu</Text>
              <View style={[s.chartPctBadge, { backgroundColor: sleepPct >= 80 ? '#ECFDF5' : '#FFF7ED' }]}>
                <Text style={[s.chartPctText, { color: sleepPct >= 80 ? '#059669' : '#D97706' }]}>{sleepPct}%</Text>
              </View>
            </View>

            {/* Steps Ring */}
            <View style={s.chartItem}>
              <Ring size={80} pct={stepsPct} color="#10B981" trackColor="#ECFDF5" strokeWidth={7}>
                <Ionicons name="footsteps" size={18} color="#10B981" />
              </Ring>
              <Text style={s.chartVal}>{(health.steps / 1000).toFixed(1)}<Text style={s.chartUnit}>k</Text></Text>
              <Text style={s.chartLabel}>Qadam</Text>
              <View style={[s.chartPctBadge, { backgroundColor: stepsPct >= 80 ? '#ECFDF5' : '#FFF7ED' }]}>
                <Text style={[s.chartPctText, { color: stepsPct >= 80 ? '#059669' : '#D97706' }]}>{stepsPct}%</Text>
              </View>
            </View>

            {/* Water Ring */}
            <View style={s.chartItem}>
              <Ring size={80} pct={waterPct} color="#0EA5E9" trackColor="#F0F9FF" strokeWidth={7}>
                <Ionicons name="water" size={18} color="#0EA5E9" />
              </Ring>
              <Text style={s.chartVal}>{(health.waterMl / 1000).toFixed(1)}<Text style={s.chartUnit}>L</Text></Text>
              <Text style={s.chartLabel}>Suv</Text>
              <View style={[s.chartPctBadge, { backgroundColor: waterPct >= 80 ? '#ECFDF5' : '#FFF7ED' }]}>
                <Text style={[s.chartPctText, { color: waterPct >= 80 ? '#059669' : '#D97706' }]}>{waterPct}%</Text>
              </View>
            </View>
          </View>

          {/* Bottom details strip */}
          <View style={s.chartDetails}>
            <View style={s.chartDetail}>
              <View style={[s.chartDetailDot, { backgroundColor: '#6366F1' }]} />
              <Text style={s.chartDetailText}>{health.sleepBedtime} — {health.sleepWakeup}</Text>
            </View>
            <View style={s.chartDetailDiv} />
            <View style={s.chartDetail}>
              <View style={[s.chartDetailDot, { backgroundColor: '#10B981' }]} />
              <Text style={s.chartDetailText}>{(health.steps * 0.0007).toFixed(1)} km</Text>
            </View>
            <View style={s.chartDetailDiv} />
            <View style={s.chartDetail}>
              <View style={[s.chartDetailDot, { backgroundColor: '#0EA5E9' }]} />
              <Text style={s.chartDetailText}>{health.waterGoal / 1000}L maqsad</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Stats */}
        <View style={s.statsRow}>
          {[
            { icon: 'calendar-outline' as const, n: `${active.length}`, l: 'Navbatlar', c: C.brand, bg: C.brandLight, screen: 'Bookings' },
            { icon: 'receipt-outline' as const, n: '3', l: 'Retseptlar', c: C.green, bg: C.greenLight, screen: 'Prescriptions' },
            { icon: 'shield-checkmark-outline' as const, n: '98%', l: 'Salomatlik', c: C.red, bg: C.redLight, screen: 'Health' },
          ].map((st, i) => (
            <TouchableOpacity key={i} style={s.statCard} onPress={() => nav.navigate(st.screen)} activeOpacity={0.7}>
              <View style={[s.statIcon, { backgroundColor: st.bg }]}>
                <Ionicons name={st.icon} size={18} color={st.c} />
              </View>
              <Text style={s.statNum}>{st.n}</Text>
              <Text style={s.statLabel}>{st.l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* AI CTA */}
        <TouchableOpacity onPress={() => nav.navigate('AIAssistant')} activeOpacity={0.9}>
          <LinearGradient colors={[C.dark, C.darkSecondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.aiCard}>
            <View style={s.aiLeft}>
              <View style={s.aiBadge}>
                <View style={s.aiPulse} />
                <Text style={s.aiBadgeText}>AI POWERED</Text>
              </View>
              <Text style={s.aiTitle}>MedAI Assistent</Text>
              <Text style={s.aiDesc}>Simptomlaringizni ayting — mos shifokorni topamiz</Text>
              <View style={s.aiBtn}>
                <Text style={s.aiBtnText}>Boshlash</Text>
                <Ionicons name="arrow-forward" size={14} color={C.brand} />
              </View>
            </View>
            <View style={s.aiRight}>
              <View style={s.aiCircle1} />
              <View style={s.aiCircle2} />
              <Ionicons name="pulse" size={28} color="rgba(27,110,243,0.3)" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Services */}
        <Text style={s.secTitle}>Xizmatlar</Text>
        <View style={s.servGrid}>
          {[
            { icon: 'pulse-outline' as const, title: 'AI Diagnostika', desc: 'Simptom tahlili', c: C.brand, bg: C.brandLight, screen: 'AIAssistant' },
            { icon: 'people-outline' as const, title: 'Shifokorlar', desc: 'Navbatga yozilish', c: C.green, bg: C.greenLight, screen: 'DoctorsTab' },
            { icon: 'bag-handle-outline' as const, title: 'Apteka', desc: 'Dori buyurtma', c: C.red, bg: C.redLight, screen: 'PharmacyTab' },
            { icon: 'chatbubbles-outline' as const, title: 'Suhbatlar', desc: 'Shifokor bilan aloqa', c: C.purple, bg: C.purpleLight, screen: 'ChatsTab' },
          ].map((sv, i) => (
            <TouchableOpacity key={i} style={s.servCard} onPress={() => nav.navigate(sv.screen)} activeOpacity={0.7}>
              <View style={[s.servIcon, { backgroundColor: sv.bg }]}>
                <Ionicons name={sv.icon} size={22} color={sv.c} />
              </View>
              <Text style={s.servTitle}>{sv.title}</Text>
              <Text style={s.servDesc}>{sv.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Upcoming bookings */}
        {active.length > 0 && (
          <>
            <View style={s.secRow}>
              <Text style={s.secTitle}>Yaqin navbatlar</Text>
              <TouchableOpacity onPress={() => nav.navigate('ChatsTab')}>
                <Text style={s.seeAll}>Barchasi</Text>
              </TouchableOpacity>
            </View>
            {active.slice(0, 2).map((b) => {
              const sp = SPECIALTY_CONFIG[b.specialty] || { icon: 'medical-outline', color: C.textTertiary, bg: C.bg };
              return (
                <TouchableOpacity key={b.id} style={s.bookCard} onPress={() => nav.navigate('ChatsTab')} activeOpacity={0.7}>
                  <View style={[s.bookAv, { backgroundColor: sp.bg }]}>
                    <Ionicons name={sp.icon as any} size={18} color={sp.color} />
                  </View>
                  <View style={s.bookInfo}>
                    <Text style={s.bookName}>{b.doctorName}</Text>
                    <Text style={s.bookSpec}>{b.specialty} · {b.days.length} kun</Text>
                  </View>
                  <View style={s.bookRight}>
                    <Text style={s.bookDate}>{b.days[0]?.date}</Text>
                    <Text style={s.bookTime}>{b.days[0]?.time}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={C.border} style={{ marginLeft: SP.sm }} />
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {/* Quick links row */}
        <View style={s.quickLinks}>
          <TouchableOpacity style={s.quickLink} onPress={() => nav.navigate('Reminders')} activeOpacity={0.7}>
            <View style={[s.quickLinkIcon, { backgroundColor: C.amberLight }]}>
              <Ionicons name="alarm-outline" size={18} color={C.amber} />
            </View>
            <Text style={s.quickLinkTitle}>Eslatmalar</Text>
            {activeReminders.length > 0 && <View style={s.qlBadge}><Text style={s.qlBadgeText}>{activeReminders.length}</Text></View>}
          </TouchableOpacity>
          <TouchableOpacity style={s.quickLink} onPress={() => nav.navigate('DeviceMarket')} activeOpacity={0.7}>
            <View style={[s.quickLinkIcon, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="watch-outline" size={18} color="#2563EB" />
            </View>
            <Text style={s.quickLinkTitle}>Qurilmalar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickLink} onPress={() => nav.navigate('Health')} activeOpacity={0.7}>
            <View style={[s.quickLinkIcon, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="analytics-outline" size={18} color="#10B981" />
            </View>
            <Text style={s.quickLinkTitle}>Statistika</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header: { backgroundColor: C.card, paddingTop: 52, paddingBottom: SP.lg, paddingHorizontal: SP.xl, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: SP.md },
  avatar: { width: 40, height: 40, borderRadius: RADIUS.sm, backgroundColor: C.brandLight, justifyContent: 'center', alignItems: 'center' },
  hello: { fontSize: 16, fontWeight: '600', color: C.text },
  sub: { fontSize: 13, color: C.textTertiary, marginTop: 2 },
  iconBtn: { width: 40, height: 40, borderRadius: RADIUS.sm, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border, position: 'relative' },
  bellBadge: { position: 'absolute', top: -3, right: -3, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: C.red, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: C.card },
  bellBadgeText: { fontSize: 9, fontWeight: '700', color: C.textInverse },

  body: { flex: 1, paddingHorizontal: SP.xl, paddingTop: SP.xl },

  // Health charts
  healthCard: { backgroundColor: C.card, borderRadius: RADIUS.md, padding: SP.lg, marginBottom: SP.lg, borderWidth: 1, borderColor: C.border },
  healthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SP.lg },
  healthTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  healthSub: { fontSize: 11, color: C.textTertiary, marginTop: 1 },
  healthMore: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: C.brandLight, paddingHorizontal: SP.sm, paddingVertical: SP.xs, borderRadius: 6 },
  healthMoreText: { fontSize: 11, fontWeight: '600', color: C.brand },

  chartsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: SP.lg },
  chartItem: { alignItems: 'center', gap: SP.xs },
  chartVal: { fontSize: 16, fontWeight: '700', color: C.text, marginTop: SP.sm },
  chartUnit: { fontSize: 11, fontWeight: '500', color: C.textTertiary },
  chartLabel: { fontSize: 11, color: C.textTertiary, fontWeight: '500' },
  chartPctBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, marginTop: 2 },
  chartPctText: { fontSize: 10, fontWeight: '700' },

  chartDetails: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: RADIUS.sm, padding: SP.sm },
  chartDetail: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  chartDetailDot: { width: 6, height: 6, borderRadius: 3 },
  chartDetailText: { fontSize: 10, color: C.textTertiary, fontWeight: '500' },
  chartDetailDiv: { width: 1, height: 14, backgroundColor: C.border },

  // Stats
  statsRow: { flexDirection: 'row', gap: SP.sm, marginBottom: SP.xl },
  statCard: { flex: 1, backgroundColor: C.card, borderRadius: RADIUS.md, padding: SP.lg, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  statIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: SP.sm },
  statNum: { fontSize: 20, fontWeight: '700', color: C.text },
  statLabel: { fontSize: 10, color: C.textTertiary, fontWeight: '500', marginTop: 2, letterSpacing: 0.3 },

  // AI Card
  aiCard: { borderRadius: RADIUS.lg, padding: SP.xxl, flexDirection: 'row', marginBottom: SP.xxl, overflow: 'hidden' },
  aiLeft: { flex: 1 },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginBottom: SP.md },
  aiPulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.green },
  aiBadgeText: { fontSize: 10, fontWeight: '700', color: C.textTertiary, letterSpacing: 1.5 },
  aiTitle: { fontSize: 20, fontWeight: '700', color: C.textInverse, marginBottom: SP.xs, letterSpacing: -0.3 },
  aiDesc: { fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 19, marginBottom: SP.lg },
  aiBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.card, paddingHorizontal: SP.lg, paddingVertical: SP.sm, borderRadius: RADIUS.xs, alignSelf: 'flex-start' },
  aiBtnText: { fontSize: 13, fontWeight: '600', color: C.brand },
  aiRight: { width: 80, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  aiCircle1: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  aiCircle2: { position: 'absolute', width: 80, height: 80, borderRadius: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },

  // Services
  secTitle: { fontSize: 16, fontWeight: '700', color: C.text, letterSpacing: -0.2, marginBottom: SP.md },
  servGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm, marginBottom: SP.xxl },
  servCard: { flexBasis: '48%', flexGrow: 1, backgroundColor: C.card, borderRadius: RADIUS.md, padding: SP.lg, borderWidth: 1, borderColor: C.border },
  servIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: SP.md },
  servTitle: { fontSize: 14, fontWeight: '600', color: C.text },
  servDesc: { fontSize: 11, color: C.textTertiary, marginTop: 2 },

  // Section
  secRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SP.md },
  seeAll: { fontSize: 13, fontWeight: '600', color: C.brand },

  // Bookings
  bookCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: RADIUS.md, padding: SP.lg, marginBottom: SP.sm, borderWidth: 1, borderColor: C.border },
  bookAv: { width: 44, height: 44, borderRadius: RADIUS.sm, justifyContent: 'center', alignItems: 'center', marginRight: SP.md },
  bookInfo: { flex: 1 },
  bookName: { fontSize: 14, fontWeight: '600', color: C.text },
  bookSpec: { fontSize: 12, color: C.textTertiary, marginTop: 2 },
  bookRight: { alignItems: 'flex-end', marginRight: SP.xs },
  bookDate: { fontSize: 13, fontWeight: '600', color: C.text },
  bookTime: { fontSize: 11, color: C.textTertiary, marginTop: 2 },

  // Quick links
  quickLinks: { flexDirection: 'row', gap: SP.sm, marginTop: SP.lg, marginBottom: SP.sm },
  quickLink: { flex: 1, backgroundColor: C.card, borderRadius: RADIUS.md, padding: SP.md, alignItems: 'center', borderWidth: 1, borderColor: C.border, gap: SP.xs },
  quickLinkIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  quickLinkTitle: { fontSize: 11, fontWeight: '600', color: C.text },
  qlBadge: { position: 'absolute', top: SP.sm, right: SP.sm, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: C.amber, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  qlBadgeText: { fontSize: 9, fontWeight: '700', color: C.textInverse },
});
