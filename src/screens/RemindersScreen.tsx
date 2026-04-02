import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Modal, Switch, Platform, Alert, ScrollView, Dimensions, StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { useApp, Reminder, ReminderCategory } from '../context/AppContext';
import { C, RADIUS, SP, SHADOW } from '../theme';

const { width: W } = Dimensions.get('window');

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const CAT: Record<ReminderCategory, { name: string; short: string; device: string; icon: keyof typeof Ionicons.glyphMap; color: string; bg: string; gradient: [string, string] }> = {
  dori:     { name: 'Dori',          short: 'Dori',     device: '',            icon: 'medkit-outline',       color: '#2563EB', bg: '#EFF6FF', gradient: ['#3B82F6', '#1D4ED8'] },
  bosim:    { name: 'Qon bosimi',    short: 'Bosim',    device: 'Smart soat',  icon: 'heart-circle-outline', color: '#DC2626', bg: '#FEF2F2', gradient: ['#EF4444', '#B91C1C'] },
  puls:     { name: 'Puls / SpO2',   short: 'Puls',     device: 'Smart uzuk',  icon: 'pulse-outline',        color: '#9333EA', bg: '#FAF5FF', gradient: ['#A855F7', '#7E22CE'] },
  harorat:  { name: 'Harorat',       short: 'Harorat',  device: 'Termometr',   icon: 'thermometer-outline',  color: '#EA580C', bg: '#FFF7ED', gradient: ['#F97316', '#C2410C'] },
  faollik:  { name: 'Faollik',       short: 'Faollik',  device: 'Bilak uzuk',  icon: 'footsteps-outline',    color: '#059669', bg: '#ECFDF5', gradient: ['#10B981', '#047857'] },
  uyqu:     { name: 'Uyqu',          short: 'Uyqu',     device: 'Smart uzuk',  icon: 'moon-outline',         color: '#1D4ED8', bg: '#EFF6FF', gradient: ['#3B82F6', '#1E40AF'] },
  shifokor: { name: 'Shifokor',      short: 'Shifokor', device: '',            icon: 'person-outline',       color: '#0F766E', bg: '#F0FDFA', gradient: ['#14B8A6', '#0F766E'] },
  suv:      { name: 'Suv',           short: 'Suv',      device: '',            icon: 'water-outline',        color: '#0284C7', bg: '#F0F9FF', gradient: ['#0EA5E9', '#0369A1'] },
};

const DAYS = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];
const DAYS_FULL = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

function getNextRing(r: Reminder): string {
  const now = new Date();
  const todayIdx = now.getDay();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const rMin = r.hour * 60 + r.minute;
  const days = r.days.length > 0 ? r.days : [0, 1, 2, 3, 4, 5, 6];

  if (days.includes(todayIdx) && rMin > nowMin) {
    const diff = rMin - nowMin;
    if (diff < 60) return `${diff} daqiqada`;
    return `Bugun ${fmtT(r.hour, r.minute)} da`;
  }

  for (let i = 1; i <= 7; i++) {
    const next = (todayIdx + i) % 7;
    if (days.includes(next)) {
      if (i === 1) return `Ertaga ${fmtT(r.hour, r.minute)} da`;
      return `${DAYS_FULL[next]} ${fmtT(r.hour, r.minute)}`;
    }
  }
  return fmtT(r.hour, r.minute);
}

function fmtT(h: number, m: number) {
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

async function requestPerms() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function scheduleNotifs(r: Reminder): Promise<string[]> {
  const ids: string[] = [];
  const weekdays = r.days.length > 0 ? r.days : [0, 1, 2, 3, 4, 5, 6];
  const cfg = CAT[r.category];
  for (const day of weekdays) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${cfg.name}`,
        body: r.title + (r.description ? ` — ${r.description}` : ''),
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: day === 0 ? 1 : day + 1,
        hour: r.hour,
        minute: r.minute,
      },
    });
    ids.push(id);
  }
  return ids;
}

async function cancelNotifs(ids: string[]) {
  for (const id of ids) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }
}

export default function RemindersScreen() {
  const nav = useNavigation();
  const { reminders, addReminder, updateReminder, deleteReminder, toggleReminder } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState<ReminderCategory>('dori');
  const [selDays, setSelDays] = useState<number[]>([]);
  const [time, setTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => { requestPerms(); }, []);

  const activeCount = useMemo(() => reminders.filter((r) => r.enabled).length, [reminders]);

  const nextReminder = useMemo(() => {
    const enabled = reminders.filter((r) => r.enabled);
    if (enabled.length === 0) return null;
    // Find the closest upcoming
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const today = now.getDay();
    let best: Reminder | null = null;
    let bestDist = Infinity;
    for (const r of enabled) {
      const rMin = r.hour * 60 + r.minute;
      const days = r.days.length > 0 ? r.days : [0, 1, 2, 3, 4, 5, 6];
      for (let i = 0; i <= 7; i++) {
        const d = (today + i) % 7;
        if (days.includes(d)) {
          const dist = i * 1440 + (i === 0 && rMin <= nowMin ? 7 * 1440 : rMin - nowMin);
          if (dist > 0 && dist < bestDist) {
            bestDist = dist;
            best = r;
          }
          break;
        }
      }
    }
    return best;
  }, [reminders]);

  const reset = () => { setTitle(''); setDesc(''); setCategory('dori'); setSelDays([]); setTime(new Date()); setEditId(null); };
  const openAdd = () => { reset(); setShowModal(true); };
  const openEdit = (r: Reminder) => {
    setEditId(r.id); setTitle(r.title); setDesc(r.description); setCategory(r.category); setSelDays(r.days);
    const d = new Date(); d.setHours(r.hour, r.minute, 0, 0); setTime(d);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    const ok = await requestPerms();
    if (!ok) { Alert.alert('Ruxsat kerak', 'Bildirishnoma ruxsatini bering.'); return; }
    const data = { title: title.trim(), description: desc.trim(), category, hour: time.getHours(), minute: time.getMinutes(), days: selDays, enabled: true };
    if (editId) {
      const old = reminders.find((r) => r.id === editId);
      if (old) await cancelNotifs(old.notificationIds);
      const ids = await scheduleNotifs({ ...data, id: editId, createdAt: new Date(), notificationIds: [] });
      updateReminder(editId, { ...data, notificationIds: ids });
    } else {
      const r = addReminder(data);
      const ids = await scheduleNotifs(r);
      updateReminder(r.id, { notificationIds: ids });
    }
    setShowModal(false); reset();
  };

  const handleDelete = async (r: Reminder) => { await cancelNotifs(r.notificationIds); deleteReminder(r.id); };
  const handleToggle = async (r: Reminder) => {
    if (r.enabled) {
      await cancelNotifs(r.notificationIds);
      updateReminder(r.id, { notificationIds: [], enabled: false });
    } else {
      const ids = await scheduleNotifs(r);
      updateReminder(r.id, { notificationIds: ids, enabled: true });
    }
    toggleReminder(r.id);
  };
  const toggleDay = (d: number) => setSelDays((p) => p.includes(d) ? p.filter((x) => x !== d) : [...p, d]);

  // ────────────── RENDER CARD ──────────────
  const renderCard = ({ item }: { item: Reminder }) => {
    const c = CAT[item.category];
    const daysLabel = item.days.length === 0 || item.days.length === 7 ? 'Har kuni' : item.days.map((d) => DAYS[d]).join(' · ');
    const next = item.enabled ? getNextRing(item) : "To'xtatilgan";

    return (
      <TouchableOpacity style={st.card} onPress={() => openEdit(item)} activeOpacity={0.8}>
        {/* Color accent */}
        <LinearGradient colors={item.enabled ? c.gradient : [C.border, C.border]} style={st.cardAccent} />

        <View style={st.cardBody}>
          {/* Top row */}
          <View style={st.cardTop}>
            <View style={[st.cardIconBox, { backgroundColor: item.enabled ? c.bg : C.bg }]}>
              <Ionicons name={c.icon} size={20} color={item.enabled ? c.color : C.textTertiary} />
            </View>
            <View style={st.cardInfo}>
              <Text style={[st.cardTitle, !item.enabled && st.cardTitleOff]} numberOfLines={1}>{item.title}</Text>
              <View style={st.cardMetaRow}>
                <View style={[st.cardCatPill, { backgroundColor: item.enabled ? c.bg : C.bg }]}>
                  <Text style={[st.cardCatText, { color: item.enabled ? c.color : C.textTertiary }]}>{c.short}</Text>
                </View>
                {c.device ? (
                  <View style={st.cardDevicePill}>
                    <Ionicons name="watch-outline" size={9} color={C.textTertiary} />
                    <Text style={st.cardDeviceText}>{c.device}</Text>
                  </View>
                ) : null}
                <View style={st.cardDaysPill}>
                  <Ionicons name="repeat-outline" size={10} color={C.textTertiary} />
                  <Text style={st.cardDaysText}>{daysLabel}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Time + Toggle row */}
          <View style={st.cardTimeRow}>
            <View style={st.cardTimeLeft}>
              <Text style={[st.cardTimeText, !item.enabled && st.cardTimeOff]}>
                {fmtT(item.hour, item.minute)}
              </Text>
              {item.description ? (
                <Text style={st.cardDescText} numberOfLines={1}>{item.description}</Text>
              ) : null}
            </View>
            <Switch
              value={item.enabled}
              onValueChange={() => handleToggle(item)}
              trackColor={{ false: C.border, true: c.color + '30' }}
              thumbColor={item.enabled ? c.color : C.textTertiary}
              style={{ transform: [{ scale: 0.9 }] }}
            />
          </View>

          {/* Footer */}
          <View style={st.cardFooter}>
            <View style={st.cardNextRow}>
              <View style={[st.cardNextDot, { backgroundColor: item.enabled ? c.color : C.border }]} />
              <Text style={st.cardNextText}>{next}</Text>
            </View>
            <TouchableOpacity style={st.cardDelBtn} onPress={() => handleDelete(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="trash-outline" size={14} color={C.red} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ────────────── SCREEN ──────────────
  return (
    <View style={st.root}>
      {/* ── Gradient Header ── */}
      <StatusBar barStyle="light-content" backgroundColor={C.dark} />
      <LinearGradient colors={[C.dark, C.darkSecondary]} style={st.header}>
        <View style={st.headerRow}>
          <TouchableOpacity style={st.backBtn} onPress={() => nav.goBack()}>
            <Ionicons name="arrow-back" size={20} color={C.textInverse} />
          </TouchableOpacity>
          <View style={st.headerMid}>
            <Text style={st.headerTitle}>Eslatmalar</Text>
            <Text style={st.headerSub}>{activeCount} ta faol · {reminders.length} ta jami</Text>
          </View>
          <TouchableOpacity style={st.headerAddBtn} onPress={openAdd} activeOpacity={0.7}>
            <Ionicons name="add" size={20} color={C.brand} />
          </TouchableOpacity>
        </View>

        {/* Next reminder highlight */}
        {nextReminder ? (
          <View style={st.nextCard}>
            <View style={st.nextLeft}>
              <View style={[st.nextIcon, { backgroundColor: CAT[nextReminder.category].color + '20' }]}>
                <Ionicons name={CAT[nextReminder.category].icon} size={18} color={CAT[nextReminder.category].color} />
              </View>
              <View>
                <Text style={st.nextLabel}>Keyingi eslatma</Text>
                <Text style={st.nextTitle} numberOfLines={1}>{nextReminder.title}</Text>
              </View>
            </View>
            <View style={st.nextTimeBox}>
              <Text style={st.nextTime}>{fmtT(nextReminder.hour, nextReminder.minute)}</Text>
              <Text style={st.nextCountdown}>{getNextRing(nextReminder)}</Text>
            </View>
          </View>
        ) : (
          <View style={st.nextCard}>
            <View style={st.nextLeft}>
              <View style={[st.nextIcon, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                <Ionicons name="notifications-off-outline" size={18} color={C.textTertiary} />
              </View>
              <View>
                <Text style={st.nextLabel}>Eslatma yo'q</Text>
                <Text style={[st.nextTitle, { color: C.textTertiary }]}>Yangi eslatma qo'shing</Text>
              </View>
            </View>
          </View>
        )}
      </LinearGradient>

      {/* ── Category Grid ── */}
      <View style={st.catSection}>
        <View style={st.catGrid}>
          {(Object.keys(CAT) as ReminderCategory[]).map((key) => {
            const c = CAT[key];
            const count = reminders.filter((r) => r.category === key && r.enabled).length;
            return (
              <View key={key} style={st.catItem}>
                <View style={[st.catIconWrap, { backgroundColor: c.bg }]}>
                  <Ionicons name={c.icon} size={18} color={c.color} />
                  {count > 0 && (
                    <View style={[st.catBadge, { backgroundColor: c.color }]}>
                      <Text style={st.catBadgeText}>{count}</Text>
                    </View>
                  )}
                </View>
                <Text style={st.catName} numberOfLines={1}>{c.short}</Text>
                {c.device ? (
                  <View style={st.catDeviceRow}>
                    <Ionicons name="watch-outline" size={8} color={C.textTertiary} />
                    <Text style={st.catDeviceLabel}>{c.device}</Text>
                  </View>
                ) : (
                  <Text style={st.catDevicePlaceholder}>Qo'lda</Text>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* ── List or Empty ── */}
      {reminders.length === 0 ? (
        <ScrollView contentContainerStyle={st.empty} showsVerticalScrollIndicator={false}>
          <View style={st.emptyRing1}>
            <View style={st.emptyRing2}>
              <View style={st.emptyCenter}>
                <Ionicons name="notifications-outline" size={32} color={C.brand} />
              </View>
            </View>
          </View>
          <Text style={st.emptyTitle}>Hali eslatma yo'q</Text>
          <Text style={st.emptyDesc}>Dori ichish, suv rejimi, mashq yoki shifokor qabuli — barchasini o'z vaqtida eslatib turamiz</Text>

          <View style={st.emptyPresets}>
            {[
              { t: 'Ertalab dori', cat: 'dori' as ReminderCategory, h: 8, m: 0 },
              { t: 'Qon bosimi o\'lchash', cat: 'bosim' as ReminderCategory, h: 7, m: 30 },
              { t: 'Puls tekshirish', cat: 'puls' as ReminderCategory, h: 10, m: 0 },
              { t: 'Uyqu tahlili', cat: 'uyqu' as ReminderCategory, h: 22, m: 30 },
            ].map((p, i) => {
              const c = CAT[p.cat];
              return (
                <TouchableOpacity
                  key={i}
                  style={st.emptyPresetCard}
                  activeOpacity={0.7}
                  onPress={() => {
                    setTitle(p.t); setCategory(p.cat);
                    const d = new Date(); d.setHours(p.h, p.m, 0, 0); setTime(d);
                    setShowModal(true);
                  }}
                >
                  <View style={[st.emptyPresetIcon, { backgroundColor: c.bg }]}>
                    <Ionicons name={c.icon} size={18} color={c.color} />
                  </View>
                  <Text style={st.emptyPresetTitle}>{p.t}</Text>
                  <Text style={st.emptyPresetTime}>{fmtT(p.h, p.m)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={st.emptyBtn} onPress={openAdd} activeOpacity={0.8}>
            <Ionicons name="add-circle-outline" size={18} color={C.textInverse} />
            <Text style={st.emptyBtnText}>Yangi eslatma</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <FlatList
          data={reminders}
          renderItem={renderCard}
          keyExtractor={(i) => i.id}
          contentContainerStyle={st.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── FAB ── */}
      {reminders.length > 0 && (
        <TouchableOpacity style={st.fab} onPress={openAdd} activeOpacity={0.85}>
          <LinearGradient colors={[C.brand, C.brandDark]} style={st.fabGrad}>
            <Ionicons name="add" size={26} color={C.textInverse} />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* ══════════ MODAL ══════════ */}
      <Modal visible={showModal} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setShowModal(false)}>
        <View style={st.mOverlay}>
          <View style={st.mSheet}>
            <View style={st.mHandle} />

            {/* Header */}
            <View style={st.mHeader}>
              <View>
                <Text style={st.mTitle}>{editId ? 'Eslatmani tahrirlash' : 'Yangi eslatma'}</Text>
                <Text style={st.mSubtitle}>Sog'lig'ingiz uchun eslatma o'rnating</Text>
              </View>
              <TouchableOpacity style={st.mCloseBtn} onPress={() => { setShowModal(false); reset(); }}>
                <Ionicons name="close" size={18} color={C.textTertiary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {/* ── Time (Hero) ── */}
              <TouchableOpacity style={st.mTimeHero} onPress={() => setShowPicker(true)} activeOpacity={0.8}>
                <LinearGradient colors={CAT[category].gradient} style={st.mTimeGrad}>
                  <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.6)" />
                  <Text style={st.mTimeText}>{fmtT(time.getHours(), time.getMinutes())}</Text>
                  <Text style={st.mTimeSub}>bosib o'zgartiring</Text>
                </LinearGradient>
              </TouchableOpacity>

              {showPicker && (
                <DateTimePicker
                  value={time}
                  mode="time"
                  is24Hour
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(_, d) => { setShowPicker(Platform.OS === 'ios'); if (d) setTime(d); }}
                />
              )}

              {/* ── Category ── */}
              <Text style={st.mLabel}>Kategoriya</Text>
              <View style={st.mCatGrid}>
                {(Object.keys(CAT) as ReminderCategory[]).map((key) => {
                  const c = CAT[key];
                  const on = category === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[st.mCatBtn, on && { backgroundColor: c.color, borderColor: c.color }]}
                      onPress={() => setCategory(key)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name={c.icon} size={16} color={on ? C.textInverse : c.color} />
                      <View>
                        <Text style={[st.mCatLabel, on && { color: C.textInverse }]}>{c.short}</Text>
                        {c.device ? <Text style={[st.mCatDevice, on && { color: 'rgba(255,255,255,0.6)' }]}>{c.device}</Text> : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* ── Title ── */}
              <Text style={st.mLabel}>Nomi</Text>
              <View style={st.mInputBox}>
                <TextInput
                  style={st.mInput}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Masalan: Paratsetamol ichish"
                  placeholderTextColor={C.textTertiary}
                  maxLength={60}
                />
              </View>

              {/* ── Description ── */}
              <Text style={st.mLabel}>Izoh <Text style={{ color: C.textTertiary, fontWeight: '400' }}>(ixtiyoriy)</Text></Text>
              <View style={st.mInputBox}>
                <TextInput
                  style={[st.mInput, { minHeight: 48 }]}
                  value={desc}
                  onChangeText={setDesc}
                  placeholder="Qo'shimcha ma'lumot..."
                  placeholderTextColor={C.textTertiary}
                  multiline
                  maxLength={200}
                />
              </View>

              {/* ── Days ── */}
              <Text style={st.mLabel}>Kunlar</Text>
              <Text style={st.mHint}>Tanlanmasa har kuni takrorlanadi</Text>
              <View style={st.mDaysRow}>
                {DAYS.map((label, i) => {
                  const on = selDays.includes(i);
                  const isWeekend = i === 0 || i === 6;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[st.mDayBtn, on && { backgroundColor: CAT[category].color, borderColor: CAT[category].color }]}
                      onPress={() => toggleDay(i)}
                      activeOpacity={0.7}
                    >
                      <Text style={[st.mDayText, on && st.mDayTextOn, !on && isWeekend && { color: C.red }]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* ── Presets ── */}
              {!editId && (
                <>
                  <Text style={st.mLabel}>Tezkor shablonlar</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.mPresetsRow}>
                    {[
                      { t: 'Ertalab dori', cat: 'dori' as ReminderCategory, h: 8, m: 0 },
                      { t: 'Qon bosimi o\'lchash', cat: 'bosim' as ReminderCategory, h: 7, m: 30 },
                      { t: 'Puls · SpO\u2082 tekshirish', cat: 'puls' as ReminderCategory, h: 10, m: 0 },
                      { t: 'Harorat o\'lchash', cat: 'harorat' as ReminderCategory, h: 6, m: 30 },
                      { t: 'Kunlik yurish', cat: 'faollik' as ReminderCategory, h: 18, m: 0 },
                      { t: 'Uyqu tahlili', cat: 'uyqu' as ReminderCategory, h: 22, m: 30 },
                      { t: 'Suv ichish', cat: 'suv' as ReminderCategory, h: 9, m: 0 },
                      { t: 'Shifokor qabuli', cat: 'shifokor' as ReminderCategory, h: 9, m: 0 },
                    ].map((p, i) => {
                      const pc = CAT[p.cat];
                      return (
                        <TouchableOpacity
                          key={i}
                          style={st.mPresetChip}
                          onPress={() => { setTitle(p.t); setCategory(p.cat); const d = new Date(); d.setHours(p.h, p.m, 0, 0); setTime(d); }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name={pc.icon} size={14} color={pc.color} />
                          <Text style={st.mPresetText}>{p.t}</Text>
                          <Text style={st.mPresetTime}>{fmtT(p.h, p.m)}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </>
              )}

              <View style={{ height: 16 }} />
            </ScrollView>

            {/* Save */}
            <TouchableOpacity
              style={[st.mSaveBtn, !title.trim() && st.mSaveBtnOff]}
              onPress={handleSave}
              disabled={!title.trim()}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={title.trim() ? CAT[category].gradient : [C.border, C.border]}
                style={st.mSaveGrad}
              >
                <Ionicons name={editId ? 'checkmark-circle' : 'notifications'} size={18} color={C.textInverse} />
                <Text style={st.mSaveText}>{editId ? 'Saqlash' : 'Eslatma qo\'shish'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // ══ HEADER ══
  header: { paddingTop: 48, paddingBottom: SP.lg, paddingHorizontal: SP.xl },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SP.lg },
  backBtn: { width: 40, height: 40, borderRadius: RADIUS.sm, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', marginRight: SP.md },
  headerMid: { flex: 1 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: C.textInverse, letterSpacing: -0.5 },
  headerSub: { fontSize: 12, color: C.textTertiary, marginTop: 2 },
  headerAddBtn: { width: 40, height: 40, borderRadius: RADIUS.sm, backgroundColor: C.card, justifyContent: 'center', alignItems: 'center' },

  // Next reminder card
  nextCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.md,
    padding: SP.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  nextLeft: { flexDirection: 'row', alignItems: 'center', gap: SP.md, flex: 1 },
  nextIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  nextLabel: { fontSize: 10, color: C.textTertiary, fontWeight: '500', letterSpacing: 0.5, textTransform: 'uppercase' },
  nextTitle: { fontSize: 14, fontWeight: '600', color: C.textInverse, marginTop: 1 },
  nextTimeBox: { alignItems: 'flex-end' },
  nextTime: { fontSize: 24, fontWeight: '700', color: C.textInverse, letterSpacing: -1 },
  nextCountdown: { fontSize: 10, color: C.green, fontWeight: '600', marginTop: 1 },

  // ══ CATEGORY GRID ══
  catSection: { paddingHorizontal: SP.xl, paddingTop: SP.lg, paddingBottom: SP.sm },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm },
  catItem: {
    width: (W - 40 - 24) / 4,  // 4 columns
    alignItems: 'center', backgroundColor: C.card,
    paddingVertical: SP.md, borderRadius: RADIUS.sm,
    borderWidth: 1, borderColor: C.border,
  },
  catIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SP.xs, position: 'relative',
  },
  catBadge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 16, height: 16, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 3, borderWidth: 1.5, borderColor: C.card,
  },
  catBadgeText: { fontSize: 9, fontWeight: '700', color: C.textInverse },
  catName: { fontSize: 11, fontWeight: '600', color: C.text, textAlign: 'center' },
  catDeviceRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  catDeviceLabel: { fontSize: 8, color: C.textTertiary, fontWeight: '500' },
  catDevicePlaceholder: { fontSize: 8, color: C.border, fontWeight: '500', marginTop: 2 },

  // ══ LIST ══
  list: { paddingHorizontal: SP.xl, paddingTop: SP.xs, paddingBottom: 100 },

  // ══ CARD ══
  card: { flexDirection: 'row', backgroundColor: C.card, borderRadius: RADIUS.md, marginBottom: SP.md, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, padding: SP.lg },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: SP.md },
  cardIconBox: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: SP.md },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 3 },
  cardTitleOff: { color: C.textTertiary },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  cardCatPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  cardCatText: { fontSize: 10, fontWeight: '600' },
  cardDevicePill: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: C.bg, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: C.border },
  cardDeviceText: { fontSize: 9, color: C.textTertiary, fontWeight: '500' },
  cardDaysPill: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardDaysText: { fontSize: 10, color: C.textTertiary, fontWeight: '500' },

  cardTimeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SP.sm },
  cardTimeLeft: {},
  cardTimeText: { fontSize: 28, fontWeight: '700', color: C.text, letterSpacing: -1 },
  cardTimeOff: { color: C.border },
  cardDescText: { fontSize: 12, color: C.textTertiary, marginTop: 1 },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: SP.sm, borderTopWidth: 1, borderTopColor: C.border },
  cardNextRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardNextDot: { width: 6, height: 6, borderRadius: 3 },
  cardNextText: { fontSize: 11, color: C.textTertiary, fontWeight: '500' },
  cardDelBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.redLight, justifyContent: 'center', alignItems: 'center' },

  // ══ EMPTY ══
  empty: { flexGrow: 1, alignItems: 'center', paddingTop: 32, paddingHorizontal: 32, paddingBottom: 32 },
  emptyRing1: { width: 110, height: 110, borderRadius: 55, borderWidth: 1, borderColor: C.brandMuted, justifyContent: 'center', alignItems: 'center', marginBottom: SP.xxl },
  emptyRing2: { width: 88, height: 88, borderRadius: 44, borderWidth: 1, borderColor: C.brandLight, justifyContent: 'center', alignItems: 'center' },
  emptyCenter: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.brandLight, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: SP.sm },
  emptyDesc: { fontSize: 13, color: C.textTertiary, textAlign: 'center', lineHeight: 20, marginBottom: SP.xxl },

  emptyPresets: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm, marginBottom: SP.xxl },
  emptyPresetCard: { width: (W - 80) / 2, backgroundColor: C.card, borderRadius: RADIUS.md, padding: SP.md, borderWidth: 1, borderColor: C.border, alignItems: 'center', gap: SP.xs },
  emptyPresetIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  emptyPresetTitle: { fontSize: 12, fontWeight: '600', color: C.text },
  emptyPresetTime: { fontSize: 11, color: C.textTertiary, fontWeight: '500' },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: SP.sm, backgroundColor: C.brand, paddingHorizontal: SP.xxl, paddingVertical: 14, borderRadius: RADIUS.md },
  emptyBtnText: { fontSize: 15, fontWeight: '600', color: C.textInverse },

  // ══ FAB ══
  fab: { position: 'absolute', bottom: 24, right: SP.xl, ...SHADOW.lg },
  fabGrad: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },

  // ══ MODAL ══
  mOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  mSheet: { backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: SP.xl, paddingBottom: Platform.OS === 'ios' ? 40 : 24, maxHeight: '93%' },
  mHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginTop: SP.sm, marginBottom: SP.lg },

  mHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SP.lg },
  mTitle: { fontSize: 22, fontWeight: '700', color: C.text, letterSpacing: -0.3 },
  mSubtitle: { fontSize: 12, color: C.textTertiary, marginTop: 2 },
  mCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },

  // Time hero
  mTimeHero: { marginBottom: SP.lg },
  mTimeGrad: { borderRadius: RADIUS.lg, padding: SP.xl, alignItems: 'center', gap: SP.xs },
  mTimeText: { fontSize: 56, fontWeight: '700', color: C.textInverse, letterSpacing: -2 },
  mTimeSub: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },

  // Category
  mLabel: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: SP.sm, marginTop: SP.md },
  mHint: { fontSize: 11, color: C.textTertiary, marginBottom: SP.sm, marginTop: -4 },
  mCatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm },
  mCatBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SP.md, paddingVertical: SP.sm, borderRadius: RADIUS.sm, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card },
  mCatLabel: { fontSize: 12, fontWeight: '600', color: C.text },
  mCatDevice: { fontSize: 9, color: C.textTertiary, fontWeight: '500', marginTop: 1 },

  // Input
  mInputBox: { backgroundColor: C.bg, borderRadius: RADIUS.sm, paddingHorizontal: SP.md, borderWidth: 1, borderColor: C.border },
  mInput: { fontSize: 14, color: C.text, paddingVertical: SP.md },

  // Days
  mDaysRow: { flexDirection: 'row', gap: 6 },
  mDayBtn: { flex: 1, aspectRatio: 1, borderRadius: RADIUS.sm, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: C.border },
  mDayText: { fontSize: 13, fontWeight: '600', color: C.text },
  mDayTextOn: { color: C.textInverse },

  // Presets
  mPresetsRow: { gap: SP.sm },
  mPresetChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.bg, paddingHorizontal: SP.md, paddingVertical: SP.sm, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: C.border },
  mPresetText: { fontSize: 12, fontWeight: '500', color: C.text },
  mPresetTime: { fontSize: 11, color: C.textTertiary, fontWeight: '600' },

  // Save
  mSaveBtn: { marginTop: SP.lg, marginBottom: SP.sm },
  mSaveBtnOff: { opacity: 0.5 },
  mSaveGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.sm, paddingVertical: 16, borderRadius: RADIUS.md },
  mSaveText: { fontSize: 16, fontWeight: '600', color: C.textInverse },
});
