import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { C, RADIUS, SP } from '../theme';

interface Prescription {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  doctor: string;
  specialty: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed';
  icon: string;
  color: string;
  bg: string;
  notes?: string;
}

const PRESCRIPTIONS: Prescription[] = [
  {
    id: '1',
    name: 'Amlodipin',
    dose: '5 mg',
    frequency: 'Kuniga 1 marta, ertalab',
    doctor: 'Dr. Karimov A.B.',
    specialty: 'Kardiolog',
    startDate: '2026-01-15',
    endDate: '2026-07-15',
    status: 'active',
    icon: 'heart-outline',
    color: '#DC2626',
    bg: '#FEF2F2',
    notes: 'Qon bosimini har kuni o\'lchang. 140/90 dan oshsa shifokorga murojaat qiling.',
  },
  {
    id: '2',
    name: 'Vitamin D3',
    dose: '2000 IU',
    frequency: 'Kuniga 1 marta, ovqat bilan',
    doctor: 'Dr. Rahimova S.N.',
    specialty: 'Terapevt',
    startDate: '2026-02-01',
    endDate: '2026-05-01',
    status: 'active',
    icon: 'sunny-outline',
    color: '#F79009',
    bg: '#FFFAEB',
  },
  {
    id: '3',
    name: 'Omeprazol',
    dose: '20 mg',
    frequency: 'Kuniga 1 marta, ovqatdan 30 min oldin',
    doctor: 'Dr. Toshmatov I.K.',
    specialty: 'Gastroenterolog',
    startDate: '2026-02-20',
    endDate: '2026-03-20',
    status: 'completed',
    icon: 'fitness-outline',
    color: '#7C3AED',
    bg: '#F5F3FF',
  },
  {
    id: '4',
    name: 'Loratadin',
    dose: '10 mg',
    frequency: 'Kuniga 1 marta, kerak bo\'lganda',
    doctor: 'Dr. Rahimova S.N.',
    specialty: 'Terapevt',
    startDate: '2026-03-01',
    endDate: '2026-04-01',
    status: 'completed',
    icon: 'flower-outline',
    color: '#E04F16',
    bg: '#FEF6EE',
  },
];

export default function PrescriptionsScreen() {
  const nav = useNavigation();
  const { medCard } = useApp();

  const activeMeds = PRESCRIPTIONS.filter((p) => p.status === 'active');
  const completedMeds = PRESCRIPTIONS.filter((p) => p.status === 'completed');

  const renderCard = (p: Prescription) => {
    const isActive = p.status === 'active';
    return (
      <View key={p.id} style={[st.card, !isActive && st.cardDim]}>
        <View style={st.cardHeader}>
          <View style={[st.cardIcon, { backgroundColor: p.bg }]}>
            <Ionicons name={p.icon as any} size={20} color={p.color} />
          </View>
          <View style={st.cardMeta}>
            <Text style={st.cardName}>{p.name} — {p.dose}</Text>
            <Text style={st.cardFreq}>{p.frequency}</Text>
          </View>
          <View style={[st.statusBadge, { backgroundColor: isActive ? C.greenLight : C.bg }]}>
            <View style={[st.statusDot, { backgroundColor: isActive ? C.green : C.textTertiary }]} />
            <Text style={[st.statusText, { color: isActive ? C.green : C.textTertiary }]}>
              {isActive ? 'Faol' : 'Tugagan'}
            </Text>
          </View>
        </View>

        <View style={st.cardBody}>
          <View style={st.infoRow}>
            <Ionicons name="person-outline" size={13} color={C.textTertiary} />
            <Text style={st.infoText}>{p.doctor} · {p.specialty}</Text>
          </View>
          <View style={st.infoRow}>
            <Ionicons name="calendar-outline" size={13} color={C.textTertiary} />
            <Text style={st.infoText}>{p.startDate} — {p.endDate}</Text>
          </View>
        </View>

        {p.notes && (
          <View style={st.noteBox}>
            <Ionicons name="alert-circle-outline" size={14} color={C.amber} />
            <Text style={st.noteText}>{p.notes}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={st.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.card} />

      {/* Header */}
      <View style={st.header}>
        <TouchableOpacity style={st.backBtn} onPress={() => nav.goBack()}>
          <Ionicons name="arrow-back" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={st.headerTitle}>Retseptlar</Text>
        <View style={st.headerBadge}>
          <Text style={st.headerBadgeText}>{activeMeds.length} faol</Text>
        </View>
      </View>

      <ScrollView style={st.body} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Allergy warning */}
        {medCard.allergies.length > 0 && (
          <View style={st.allergyCard}>
            <View style={st.allergyIcon}>
              <Ionicons name="warning-outline" size={18} color={C.red} />
            </View>
            <View style={st.allergyContent}>
              <Text style={st.allergyTitle}>Allergiyalar</Text>
              <Text style={st.allergyText}>{medCard.allergies}</Text>
            </View>
          </View>
        )}

        {/* Current meds from medcard */}
        {medCard.currentMeds.length > 0 && (
          <View style={st.currentMedsCard}>
            <View style={st.currentMedsHeader}>
              <Ionicons name="medkit-outline" size={16} color={C.brand} />
              <Text style={st.currentMedsTitle}>Hozirgi dorilar</Text>
            </View>
            <Text style={st.currentMedsText}>{medCard.currentMeds}</Text>
          </View>
        )}

        {/* Active prescriptions */}
        <Text style={st.sectionTitle}>Faol retseptlar</Text>
        {activeMeds.length > 0 ? (
          activeMeds.map(renderCard)
        ) : (
          <View style={st.emptyBox}>
            <Ionicons name="checkmark-circle-outline" size={24} color={C.textTertiary} />
            <Text style={st.emptyText}>Faol retseptlar yo'q</Text>
          </View>
        )}

        {/* Completed */}
        {completedMeds.length > 0 && (
          <>
            <Text style={st.sectionTitle}>Tugagan retseptlar</Text>
            {completedMeds.map(renderCard)}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    backgroundColor: C.card,
    paddingTop: 52,
    paddingBottom: SP.lg,
    paddingHorizontal: SP.xl,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: C.bg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    marginRight: SP.md,
  },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: C.text },
  headerBadge: {
    backgroundColor: C.greenLight,
    paddingHorizontal: SP.md,
    paddingVertical: SP.xs,
    borderRadius: RADIUS.full,
  },
  headerBadgeText: { fontSize: 12, fontWeight: '600', color: C.green },

  body: { flex: 1, paddingHorizontal: SP.xl, paddingTop: SP.xl },

  // Allergy warning
  allergyCard: {
    flexDirection: 'row',
    backgroundColor: C.redLight,
    borderRadius: RADIUS.md,
    padding: SP.lg,
    marginBottom: SP.md,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  allergyIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SP.md,
  },
  allergyContent: { flex: 1 },
  allergyTitle: { fontSize: 13, fontWeight: '700', color: C.red, marginBottom: 2 },
  allergyText: { fontSize: 13, color: '#991B1B', lineHeight: 19 },

  // Current meds
  currentMedsCard: {
    backgroundColor: C.brandLight,
    borderRadius: RADIUS.md,
    padding: SP.lg,
    marginBottom: SP.xl,
    borderWidth: 1,
    borderColor: C.brandMuted,
  },
  currentMedsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.sm,
    marginBottom: SP.sm,
  },
  currentMedsTitle: { fontSize: 13, fontWeight: '700', color: C.brand },
  currentMedsText: { fontSize: 13, color: C.brandDark, lineHeight: 19 },

  // Section
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    marginBottom: SP.md,
    letterSpacing: -0.2,
  },

  // Card
  card: {
    backgroundColor: C.card,
    borderRadius: RADIUS.md,
    padding: SP.lg,
    marginBottom: SP.sm,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardDim: { opacity: 0.6 },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SP.md,
  },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SP.md,
  },
  cardMeta: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '600', color: C.text },
  cardFreq: { fontSize: 12, color: C.textTertiary, marginTop: 2 },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SP.sm,
    paddingVertical: SP.xs,
    borderRadius: RADIUS.full,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },

  cardBody: { gap: SP.sm, marginBottom: SP.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: SP.xs },
  infoText: { fontSize: 12, color: C.textTertiary },

  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SP.sm,
    backgroundColor: C.amberLight,
    borderRadius: RADIUS.sm,
    padding: SP.md,
    marginTop: SP.xs,
  },
  noteText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 },

  // Empty
  emptyBox: {
    alignItems: 'center',
    paddingVertical: SP.xxl,
    gap: SP.sm,
  },
  emptyText: { fontSize: 13, color: C.textTertiary },
});
