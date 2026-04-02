import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp, Booking } from '../context/AppContext';
import { SPECIALTY_CONFIG } from '../data/doctors';
import AppModal from '../components/AppModal';
import { C, RADIUS, SHADOW } from '../theme';

export default function BookingsScreen() {
  const nav = useNavigation<any>();
  const { bookings, cancelBooking } = useApp();
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'cancelled'>('all');
  const [target, setTarget] = useState<Booking | null>(null);
  const [showCancel, setShowCancel] = useState(false);
  const [showDone, setShowDone] = useState(false);

  const filtered = bookings.filter((b) => filter === 'all' || b.status === filter);
  const ac = bookings.filter((b) => b.status === 'confirmed').length;
  const cc = bookings.filter((b) => b.status === 'cancelled').length;
  const getSpec = (sp: string) => SPECIALTY_CONFIG[sp] || { icon: 'medical-outline', color: C.textTertiary, bg: C.bg };

  const renderItem = ({ item }: { item: Booking }) => {
    const sp = getSpec(item.specialty);
    const off = item.status === 'cancelled';
    return (
      <View style={[s.card, off && s.cardOff]}>
        <View style={s.cardTop}>
          <View style={[s.av, { backgroundColor: sp.bg }]}><Ionicons name={sp.icon as any} size={20} color={sp.color} /></View>
          <View style={s.cardInfo}><Text style={s.cardName}>{item.doctorName}</Text><View style={[s.spBadge, { backgroundColor: sp.bg }]}><Text style={[s.spBadgeT, { color: sp.color }]}>{item.specialty}</Text></View></View>
          <View style={[s.stBadge, { backgroundColor: off ? C.redLight : C.greenLight }]}>
            <View style={[s.stDot, { backgroundColor: off ? C.red : C.green }]} />
            <Text style={[s.stText, { color: off ? C.red : C.greenDark }]}>{off ? 'Bekor' : 'Aktiv'}</Text>
          </View>
        </View>
        <View style={s.daysBox}>
          {item.days.map((d, i) => (
            <View key={i} style={s.dayRow}>
              <View style={s.dayLeft}><View style={s.dayDot} /><Text style={s.dayDate}>{d.date}</Text></View>
              <View style={s.dayTimeBadge}><Ionicons name="time-outline" size={12} color={C.green} /><Text style={s.dayTime}>{d.time}</Text></View>
            </View>
          ))}
        </View>
        <View style={s.priceRow}><Text style={s.priceLbl}>{item.days.length} kun</Text><Text style={s.priceVal}>{item.totalPrice.toLocaleString()} so'm</Text></View>
        {!off && (
          <View style={s.actions}>
            <TouchableOpacity style={s.chatBtn} onPress={() => nav.navigate('DoctorChat', { booking: item })} activeOpacity={0.7}>
              <Ionicons name="chatbubble-outline" size={15} color={C.brand} /><Text style={s.chatBtnT}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.videoBtn} onPress={() => nav.navigate('DoctorChat', { booking: item })} activeOpacity={0.7}>
              <Ionicons name="videocam-outline" size={15} color={C.green} /><Text style={s.videoBtnT}>Video</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.callActionBtn} onPress={() => nav.navigate('DoctorChat', { booking: item })} activeOpacity={0.7}>
              <Ionicons name="call-outline" size={15} color={C.purple} />
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelBtn} onPress={() => { setTarget(item); setShowCancel(true); }} activeOpacity={0.7}>
              <Ionicons name="close-outline" size={15} color={C.red} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={s.root}>
      <LinearGradient colors={[C.dark, C.darkSecondary]} style={s.header}>
        <View style={s.hRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity style={s.backBtn} onPress={() => nav.goBack()}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View>
              <Text style={s.hTitle}>Bronlarim</Text>
              <Text style={s.hSub}>{ac} ta aktiv</Text>
            </View>
          </View>
          <View style={s.hBadge}><Text style={s.hBadgeN}>{ac}</Text></View>
        </View>
        <View style={s.filterRow}>
          {[{ k: 'all' as const, l: 'Barchasi', c: bookings.length }, { k: 'confirmed' as const, l: 'Aktiv', c: ac }, { k: 'cancelled' as const, l: 'Bekor', c: cc }].map((f) => (
            <TouchableOpacity key={f.k} style={[s.fChip, filter === f.k && s.fChipOn]} onPress={() => setFilter(f.k)}>
              <Text style={[s.fText, filter === f.k && s.fTextOn]}>{f.l}</Text>
              <View style={[s.fCnt, filter === f.k && s.fCntOn]}><Text style={[s.fCntT, filter === f.k && s.fCntTOn]}>{f.c}</Text></View>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {filtered.length === 0 ? (
        <View style={s.empty}><View style={s.emptyIco}><Ionicons name="calendar-outline" size={36} color={C.border} /></View><Text style={s.emptyT}>Navbatlar yo'q</Text><Text style={s.emptyD}>Shifokorga yozilish uchun "Shifokorlar" bo'limiga o'ting</Text></View>
      ) : (
        <FlatList data={filtered} renderItem={renderItem} keyExtractor={(i) => i.id} contentContainerStyle={s.list} showsVerticalScrollIndicator={false} />
      )}

      <AppModal visible={showCancel} type="confirm" title="Bekor qilish" message="Navbatni bekor qilmoqchimisiz?"
        details={target ? [{ label: 'Shifokor', value: target.doctorName }, { label: 'Kunlar', value: `${target.days.length}` }, { label: 'Summa', value: `${target.totalPrice.toLocaleString()} so'm` }] : []}
        confirmText="Bekor qilish" cancelText="Yo'q"
        onConfirm={() => { if (target) cancelBooking(target.id); setShowCancel(false); setTimeout(() => setShowDone(true), 300); }}
        onCancel={() => setShowCancel(false)} onClose={() => setShowCancel(false)} />
      <AppModal visible={showDone} type="success" title="Bekor qilindi" message="Navbatingiz bekor qilindi." onClose={() => setShowDone(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  hRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  hTitle: { fontSize: 26, fontWeight: '700', color: '#fff', letterSpacing: -0.5 },
  hSub: { fontSize: 13, color: C.textTertiary, marginTop: 4 },
  hBadge: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  hBadgeN: { fontSize: 18, fontWeight: '700', color: '#fff' },
  filterRow: { flexDirection: 'row', gap: 8 },
  fChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.sm },
  fChipOn: { backgroundColor: '#fff' },
  fText: { fontSize: 13, fontWeight: '500', color: C.textTertiary },
  fTextOn: { color: C.text },
  fCnt: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  fCntOn: { backgroundColor: C.bg },
  fCntT: { fontSize: 11, fontWeight: '600', color: C.textTertiary },
  fCntTOn: { color: C.text },
  list: { padding: 16, paddingBottom: 20 },
  card: { backgroundColor: C.card, borderRadius: RADIUS.lg, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border, ...SHADOW.sm },
  cardOff: { opacity: 0.5 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  av: { width: 48, height: 48, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 4 },
  spBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  spBadgeT: { fontSize: 11, fontWeight: '600' },
  stBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  stDot: { width: 6, height: 6, borderRadius: 3 },
  stText: { fontSize: 11, fontWeight: '600' },
  daysBox: { backgroundColor: C.bg, borderRadius: RADIUS.sm, padding: 12, marginBottom: 12, gap: 8 },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dayDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },
  dayDate: { fontSize: 13, fontWeight: '600', color: C.text },
  dayTimeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.greenLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  dayTime: { fontSize: 12, fontWeight: '600', color: C.green },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 12 },
  priceLbl: { fontSize: 13, color: C.textTertiary, fontWeight: '500' },
  priceVal: { fontSize: 16, fontWeight: '700', color: C.text },
  actions: { flexDirection: 'row', gap: 10 },
  chatBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.brandLight, paddingVertical: 12, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: '#D0E3FF' },
  chatBtnT: { fontSize: 12, fontWeight: '600', color: C.brand },
  videoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.greenLight, paddingVertical: 12, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: '#B8F0DB' },
  videoBtnT: { fontSize: 12, fontWeight: '600', color: C.green },
  callActionBtn: { width: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.purpleLight, paddingVertical: 12, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: '#DDD6FE' },
  cancelBtn: { width: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.redLight, paddingVertical: 12, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: '#FFD4D4' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyIco: { width: 72, height: 72, borderRadius: 24, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: C.border },
  emptyT: { fontSize: 17, fontWeight: '600', color: C.text, marginBottom: 4 },
  emptyD: { fontSize: 13, color: C.textTertiary, textAlign: 'center', lineHeight: 18 },
});
