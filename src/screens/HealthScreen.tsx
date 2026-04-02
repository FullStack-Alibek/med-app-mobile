import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useApp } from '../context/AppContext';
import { C, RADIUS, SP, SHADOW } from '../theme';

const W = Dimensions.get('window').width;
const RING_SIZE = (W - 64) / 3;

function CircleProgress({ pct, size, color, bg, children }: { pct: number; size: number; color: string; bg: string; children: React.ReactNode }) {
  const sw = 7;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (Math.min(pct, 100) / 100);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={bg} strokeWidth={sw} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={sw} fill="none"
          strokeLinecap="round" strokeDasharray={`${dash} ${circ - dash}`} rotation={-90} origin={`${size / 2}, ${size / 2}`} />
      </Svg>
      {children}
    </View>
  );
}

export default function HealthScreen() {
  const nav = useNavigation();
  const { health, addWater, addSteps, updateHealth } = useApp();

  const sleepPct = Math.round((health.sleepHours / health.sleepGoal) * 100);
  const stepsPct = Math.round((health.steps / health.stepsGoal) * 100);
  const waterPct = Math.round((health.waterMl / health.waterGoal) * 100);
  const km = (health.steps * 0.0007).toFixed(1);
  const cal = Math.round(health.steps * 0.04);

  const sleepStatus = health.sleepHours >= 7 ? 'Yaxshi' : health.sleepHours >= 5 ? 'Yetarli emas' : 'Kam';
  const sleepColor = health.sleepHours >= 7 ? C.green : health.sleepHours >= 5 ? C.amber : C.red;

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => nav.goBack()}>
          <Ionicons name="arrow-back" size={20} color={C.text} />
        </TouchableOpacity>
        <View style={s.headerMid}>
          <Text style={s.headerTitle}>Salomatlik</Text>
          <Text style={s.headerSub}>Kunlik ko'rsatkichlar</Text>
        </View>
        <View style={s.headerBadge}>
          <Ionicons name="heart" size={18} color={C.red} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.body}>
        {/* ── 3 Rings Summary ── */}
        <View style={s.ringsCard}>
          <View style={s.ringsRow}>
            {/* Sleep */}
            <View style={s.ringItem}>
              <CircleProgress pct={sleepPct} size={RING_SIZE - 16} color="#6366F1" bg="#EEF2FF">
                <Ionicons name="moon" size={20} color="#6366F1" />
              </CircleProgress>
              <Text style={s.ringValue}>{health.sleepHours} soat</Text>
              <Text style={s.ringLabel}>Uyqu</Text>
            </View>

            {/* Steps */}
            <View style={s.ringItem}>
              <CircleProgress pct={stepsPct} size={RING_SIZE - 16} color="#10B981" bg="#ECFDF5">
                <Ionicons name="footsteps" size={20} color="#10B981" />
              </CircleProgress>
              <Text style={s.ringValue}>{health.steps.toLocaleString()}</Text>
              <Text style={s.ringLabel}>Qadam</Text>
            </View>

            {/* Water */}
            <View style={s.ringItem}>
              <CircleProgress pct={waterPct} size={RING_SIZE - 16} color="#0EA5E9" bg="#F0F9FF">
                <Ionicons name="water" size={20} color="#0EA5E9" />
              </CircleProgress>
              <Text style={s.ringValue}>{(health.waterMl / 1000).toFixed(1)} L</Text>
              <Text style={s.ringLabel}>Suv</Text>
            </View>
          </View>
        </View>

        {/* ══════ SLEEP SECTION ══════ */}
        <View style={s.section}>
          <View style={s.secHeader}>
            <View style={[s.secIcon, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="moon" size={16} color="#6366F1" />
            </View>
            <View>
              <Text style={s.secTitle}>Uyqu monitoringi</Text>
              <Text style={s.secSub}>Kechagi uyqu tahlili</Text>
            </View>
            <View style={[s.secBadge, { backgroundColor: sleepColor + '15' }]}>
              <Text style={[s.secBadgeText, { color: sleepColor }]}>{sleepStatus}</Text>
            </View>
          </View>

          <View style={s.sleepCard}>
            <View style={s.sleepRow}>
              <View style={s.sleepBlock}>
                <Text style={s.sleepBigNum}>{health.sleepHours}</Text>
                <Text style={s.sleepUnit}>soat</Text>
              </View>
              <View style={s.sleepDivider} />
              <View style={s.sleepTimes}>
                <View style={s.sleepTimeRow}>
                  <Ionicons name="bed-outline" size={14} color="#6366F1" />
                  <Text style={s.sleepTimeLabel}>Yotish</Text>
                  <Text style={s.sleepTimeVal}>{health.sleepBedtime}</Text>
                </View>
                <View style={s.sleepTimeRow}>
                  <Ionicons name="sunny-outline" size={14} color={C.amber} />
                  <Text style={s.sleepTimeLabel}>Uyg'onish</Text>
                  <Text style={s.sleepTimeVal}>{health.sleepWakeup}</Text>
                </View>
              </View>
            </View>

            {/* Sleep quality bar */}
            <View style={s.sleepBar}>
              <View style={s.sleepBarBg}>
                <View style={[s.sleepBarFill, { width: `${sleepPct}%` }]} />
              </View>
              <Text style={s.sleepBarLabel}>{sleepPct}% / maqsad {health.sleepGoal} soat</Text>
            </View>

            {/* AI Tip */}
            <View style={s.aiTip}>
              <Ionicons name="sparkles" size={13} color={C.brand} />
              <Text style={s.aiTipText}>
                {health.sleepHours < 7
                  ? 'AI tavsiya: 7-8 soat uyqu immunitetni 40% ga oshiradi. Ertaroq yotishga harakat qiling.'
                  : 'AI tavsiya: Uyqu me\'yoringiz yaxshi! Shu tartibni davom ettiring.'}
              </Text>
            </View>
          </View>
        </View>

        {/* ══════ STEPS SECTION ══════ */}
        <View style={s.section}>
          <View style={s.secHeader}>
            <View style={[s.secIcon, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="footsteps" size={16} color="#10B981" />
            </View>
            <View>
              <Text style={s.secTitle}>Jismoniy faollik</Text>
              <Text style={s.secSub}>Bugungi qadam sanash</Text>
            </View>
            <View style={[s.secBadge, { backgroundColor: stepsPct >= 100 ? C.greenLight : C.amberLight }]}>
              <Text style={[s.secBadgeText, { color: stepsPct >= 100 ? C.green : C.amber }]}>{stepsPct}%</Text>
            </View>
          </View>

          <View style={s.stepsCard}>
            <View style={s.stepsMain}>
              <Text style={s.stepsBig}>{health.steps.toLocaleString()}</Text>
              <Text style={s.stepsGoal}>/ {health.stepsGoal.toLocaleString()} qadam</Text>
            </View>

            <View style={s.stepsBar}>
              <View style={s.stepsBarBg}>
                <View style={[s.stepsBarFill, { width: `${Math.min(stepsPct, 100)}%` }]} />
              </View>
            </View>

            <View style={s.stepsStats}>
              <View style={s.stepsStat}>
                <Ionicons name="navigate-outline" size={14} color={C.textTertiary} />
                <Text style={s.stepsStatVal}>{km} km</Text>
                <Text style={s.stepsStatLabel}>Masofa</Text>
              </View>
              <View style={s.stepsStatDiv} />
              <View style={s.stepsStat}>
                <Ionicons name="flame-outline" size={14} color={C.amber} />
                <Text style={s.stepsStatVal}>{cal}</Text>
                <Text style={s.stepsStatLabel}>Kaloriya</Text>
              </View>
              <View style={s.stepsStatDiv} />
              <View style={s.stepsStat}>
                <Ionicons name="time-outline" size={14} color={C.textTertiary} />
                <Text style={s.stepsStatVal}>{Math.round(health.steps / 100)}</Text>
                <Text style={s.stepsStatLabel}>Daqiqa</Text>
              </View>
            </View>

            {/* Quick add */}
            <View style={s.quickRow}>
              {[1000, 2000, 5000].map((n) => (
                <TouchableOpacity key={n} style={s.quickBtn} onPress={() => addSteps(n)} activeOpacity={0.7}>
                  <Text style={s.quickBtnText}>+{n.toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.aiTip}>
              <Ionicons name="sparkles" size={13} color={C.brand} />
              <Text style={s.aiTipText}>
                AI tavsiya: Kuniga 10,000 qadam yurak-qon tomir kasalliklari xavfini 35% ga kamaytiradi.
              </Text>
            </View>
          </View>
        </View>

        {/* ══════ WATER SECTION ══════ */}
        <View style={s.section}>
          <View style={s.secHeader}>
            <View style={[s.secIcon, { backgroundColor: '#F0F9FF' }]}>
              <Ionicons name="water" size={16} color="#0EA5E9" />
            </View>
            <View>
              <Text style={s.secTitle}>Suv rejimi</Text>
              <Text style={s.secSub}>Kunlik suv iste'moli</Text>
            </View>
            <View style={[s.secBadge, { backgroundColor: waterPct >= 80 ? C.greenLight : C.amberLight }]}>
              <Text style={[s.secBadgeText, { color: waterPct >= 80 ? C.green : C.amber }]}>{waterPct}%</Text>
            </View>
          </View>

          <View style={s.waterCard}>
            <View style={s.waterMain}>
              <Text style={s.waterBig}>{(health.waterMl / 1000).toFixed(1)}</Text>
              <Text style={s.waterUnit}>litr</Text>
              <Text style={s.waterGoal}>/ {(health.waterGoal / 1000).toFixed(1)} L maqsad</Text>
            </View>

            <View style={s.waterBar}>
              <View style={s.waterBarBg}>
                <View style={[s.waterBarFill, { width: `${Math.min(waterPct, 100)}%` }]} />
              </View>
            </View>

            {/* Water cups */}
            <View style={s.waterCups}>
              {Array.from({ length: 8 }, (_, i) => {
                const filled = health.waterMl >= (i + 1) * (health.waterGoal / 8);
                return (
                  <View key={i} style={[s.waterCup, filled && s.waterCupFilled]}>
                    <Ionicons name={filled ? 'water' : 'water-outline'} size={16} color={filled ? '#0EA5E9' : C.border} />
                  </View>
                );
              })}
            </View>

            {/* Quick add */}
            <View style={s.quickRow}>
              {[{ ml: 200, label: '200 ml' }, { ml: 330, label: '330 ml' }, { ml: 500, label: '500 ml' }].map((w) => (
                <TouchableOpacity key={w.ml} style={s.quickWaterBtn} onPress={() => addWater(w.ml)} activeOpacity={0.7}>
                  <Ionicons name="add" size={14} color="#0EA5E9" />
                  <Text style={s.quickWaterText}>{w.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.aiTip}>
              <Ionicons name="sparkles" size={13} color={C.brand} />
              <Text style={s.aiTipText}>
                {health.waterMl < health.waterGoal * 0.5
                  ? 'AI tavsiya: Kuniga 2-2.5 litr suv ichish konsentratsiya va energiyani 25% ga oshiradi.'
                  : 'AI tavsiya: Suv rejimingiz yaxshi! Har 1-2 soatda stakan suv iching.'}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header: { backgroundColor: C.card, paddingTop: 52, paddingBottom: SP.lg, paddingHorizontal: SP.xl, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 40, height: 40, borderRadius: RADIUS.sm, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border, marginRight: SP.md },
  headerMid: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: C.text, letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: C.textTertiary, marginTop: 2 },
  headerBadge: { width: 40, height: 40, borderRadius: RADIUS.sm, backgroundColor: C.redLight, justifyContent: 'center', alignItems: 'center' },

  body: { padding: SP.xl },

  // 3 Rings
  ringsCard: { backgroundColor: C.card, borderRadius: RADIUS.md, padding: SP.lg, marginBottom: SP.lg, borderWidth: 1, borderColor: C.border },
  ringsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  ringItem: { alignItems: 'center', gap: SP.sm },
  ringValue: { fontSize: 14, fontWeight: '700', color: C.text },
  ringLabel: { fontSize: 11, color: C.textTertiary, fontWeight: '500' },

  // Section
  section: { marginBottom: SP.lg },
  secHeader: { flexDirection: 'row', alignItems: 'center', gap: SP.sm, marginBottom: SP.md },
  secIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  secTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  secSub: { fontSize: 11, color: C.textTertiary, marginTop: 1 },
  secBadge: { marginLeft: 'auto', paddingHorizontal: SP.sm, paddingVertical: 3, borderRadius: 6 },
  secBadgeText: { fontSize: 11, fontWeight: '600' },

  // Sleep
  sleepCard: { backgroundColor: C.card, borderRadius: RADIUS.md, padding: SP.lg, borderWidth: 1, borderColor: C.border },
  sleepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SP.lg },
  sleepBlock: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  sleepBigNum: { fontSize: 42, fontWeight: '700', color: '#6366F1', letterSpacing: -2 },
  sleepUnit: { fontSize: 14, fontWeight: '500', color: C.textTertiary },
  sleepDivider: { width: 1, height: 40, backgroundColor: C.border, marginHorizontal: SP.lg },
  sleepTimes: { flex: 1, gap: SP.sm },
  sleepTimeRow: { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  sleepTimeLabel: { flex: 1, fontSize: 12, color: C.textTertiary, fontWeight: '500' },
  sleepTimeVal: { fontSize: 14, fontWeight: '600', color: C.text },
  sleepBar: { marginBottom: SP.md },
  sleepBarBg: { height: 6, backgroundColor: '#EEF2FF', borderRadius: 3, overflow: 'hidden' },
  sleepBarFill: { height: 6, backgroundColor: '#6366F1', borderRadius: 3 },
  sleepBarLabel: { fontSize: 10, color: C.textTertiary, fontWeight: '500', marginTop: 4 },

  // Steps
  stepsCard: { backgroundColor: C.card, borderRadius: RADIUS.md, padding: SP.lg, borderWidth: 1, borderColor: C.border },
  stepsMain: { flexDirection: 'row', alignItems: 'baseline', gap: SP.sm, marginBottom: SP.md },
  stepsBig: { fontSize: 36, fontWeight: '700', color: '#10B981', letterSpacing: -1 },
  stepsGoal: { fontSize: 13, color: C.textTertiary, fontWeight: '500' },
  stepsBar: { marginBottom: SP.lg },
  stepsBarBg: { height: 6, backgroundColor: '#ECFDF5', borderRadius: 3, overflow: 'hidden' },
  stepsBarFill: { height: 6, backgroundColor: '#10B981', borderRadius: 3 },
  stepsStats: { flexDirection: 'row', alignItems: 'center', marginBottom: SP.lg },
  stepsStat: { flex: 1, alignItems: 'center', gap: 2 },
  stepsStatVal: { fontSize: 15, fontWeight: '700', color: C.text },
  stepsStatLabel: { fontSize: 10, color: C.textTertiary, fontWeight: '500' },
  stepsStatDiv: { width: 1, height: 28, backgroundColor: C.border },

  // Water
  waterCard: { backgroundColor: C.card, borderRadius: RADIUS.md, padding: SP.lg, borderWidth: 1, borderColor: C.border },
  waterMain: { flexDirection: 'row', alignItems: 'baseline', gap: SP.xs, marginBottom: SP.md },
  waterBig: { fontSize: 36, fontWeight: '700', color: '#0EA5E9', letterSpacing: -1 },
  waterUnit: { fontSize: 14, fontWeight: '500', color: C.textTertiary },
  waterGoal: { fontSize: 13, color: C.textTertiary, fontWeight: '500', marginLeft: SP.sm },
  waterBar: { marginBottom: SP.lg },
  waterBarBg: { height: 6, backgroundColor: '#F0F9FF', borderRadius: 3, overflow: 'hidden' },
  waterBarFill: { height: 6, backgroundColor: '#0EA5E9', borderRadius: 3 },

  waterCups: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SP.lg },
  waterCup: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border },
  waterCupFilled: { backgroundColor: '#F0F9FF', borderColor: '#0EA5E9' },

  // Quick add
  quickRow: { flexDirection: 'row', gap: SP.sm, marginBottom: SP.md },
  quickBtn: { flex: 1, backgroundColor: '#ECFDF5', paddingVertical: SP.sm, borderRadius: RADIUS.sm, alignItems: 'center', borderWidth: 1, borderColor: '#D1FAE5' },
  quickBtnText: { fontSize: 13, fontWeight: '600', color: '#10B981' },
  quickWaterBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#F0F9FF', paddingVertical: SP.sm, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: '#BAE6FD' },
  quickWaterText: { fontSize: 12, fontWeight: '600', color: '#0EA5E9' },

  // AI Tip
  aiTip: { flexDirection: 'row', alignItems: 'flex-start', gap: SP.sm, backgroundColor: C.brandLight, padding: SP.sm, borderRadius: RADIUS.sm },
  aiTipText: { flex: 1, fontSize: 11, color: C.brandDark, fontWeight: '500', lineHeight: 16 },
});
