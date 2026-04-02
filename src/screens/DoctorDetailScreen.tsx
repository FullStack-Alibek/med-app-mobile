import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Modal, TextInput, Image } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Doctor } from '../types';
import { timeSlots, SPECIALTY_CONFIG } from '../data/doctors';
import { useApp, BookingDay, MedCard, MedCardFile, EMPTY_MED_CARD } from '../context/AppContext';
import AppModal from '../components/AppModal';
import { C, RADIUS, SHADOW, SP } from '../theme';

interface DateItem {
  day: string;
  date: number;
  month: string;
  full: string;
  weekday: number;
}

export default function DoctorDetailScreen() {
  const route = useRoute<any>();
  const nav = useNavigation<any>();
  const doc: Doctor = route.params.doctor;
  const { addBooking, medCard, saveMedCard, family } = useApp();
  const sp = SPECIALTY_CONFIG[doc.specialty] || { icon: 'medical-outline', color: C.textTertiary, bg: C.bg };

  const [selDays, setSelDays] = useState<Record<string, string | null>>({});
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showMedCard, setShowMedCard] = useState(false);
  const [card, setCard] = useState<MedCard>(medCard.fullName ? medCard : EMPTY_MED_CARD);
  const [selectedFor, setSelectedFor] = useState<string>('me');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  // Generate 14 days
  const dates: DateItem[] = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    const mo = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
    const dy = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];
    return {
      day: dy[d.getDay()],
      date: d.getDate(),
      month: mo[d.getMonth()],
      full: `${d.getDate()} ${mo[d.getMonth()]}`,
      weekday: d.getDay(),
    };
  });

  // Split into weeks (rows of 7)
  const week1 = dates.slice(0, 7);
  const week2 = dates.slice(7, 14);
  const weekDayHeaders = ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak'];

  const cnt = Object.keys(selDays).length;
  const allTime = Object.values(selDays).every((t) => t !== null);
  const canBook = cnt > 0 && allTime;
  const total = cnt * doc.price;

  const toggleDate = (f: string) => {
    setSelDays((p) => {
      const c = { ...p };
      if (c[f] !== undefined) {
        delete c[f];
        if (activeDate === f) setActiveDate(null);
      } else {
        c[f] = null;
        setActiveDate(f);
      }
      return c;
    });
  };

  const selectTime = (t: string) => {
    if (activeDate) setSelDays((p) => ({ ...p, [activeDate]: t }));
  };

  const handleBook = () => {
    if (cnt === 0) { setErrMsg('Kamida 1 kun tanlang.'); setShowError(true); return; }
    if (!allTime) { setErrMsg('Har bir tanlangan kun uchun vaqt belgilang.'); setShowError(true); return; }
    setShowPicker(true);
  };

  const handlePickConfirm = () => {
    setShowPicker(false);
    const who = selectedFor;
    if (who === 'me') {
      if (medCard.fullName && medCard.complaints) {
        setCard(medCard);
        setTimeout(() => setShowConfirm(true), 300);
      } else {
        setCard(medCard.fullName ? medCard : EMPTY_MED_CARD);
        setTimeout(() => setShowMedCard(true), 300);
      }
    } else {
      const member = family.find((f) => f.id === who);
      if (member?.medCard?.fullName && member.medCard.complaints) {
        setCard(member.medCard);
        setTimeout(() => setShowConfirm(true), 300);
      } else {
        setCard(member?.medCard?.fullName ? member.medCard : { ...EMPTY_MED_CARD, fullName: member?.name || '', birthYear: member?.birthYear || '', gender: member?.gender || '' });
        setTimeout(() => setShowMedCard(true), 300);
      }
    }
  };

  const medCardValid = card.fullName.trim() && card.birthYear.trim() && card.gender && card.complaints.trim();

  const handleMedCardSubmit = () => {
    if (!medCardValid) return;
    saveMedCard(card);
    setShowMedCard(false);
    setTimeout(() => setShowConfirm(true), 300);
  };

  const confirmBook = () => {
    const days: BookingDay[] = Object.entries(selDays).map(([d, t]) => ({ date: d, time: t! }));
    addBooking({ doctorId: doc.id, doctorName: doc.name, specialty: doc.specialty, days, price: doc.price, totalPrice: total, status: 'confirmed' });
    setShowConfirm(false);
    setTimeout(() => setShowSuccess(true), 300);
  };

  const updateCard = (field: keyof MedCard, value: string) => setCard((p) => ({ ...p, [field]: value }));

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const name = asset.uri.split('/').pop() || 'rasm.jpg';
      setCard((p) => ({ ...p, files: [...p.files, { uri: asset.uri, name, type: 'image' }] }));
    }
  };

  const pickCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const name = asset.uri.split('/').pop() || 'foto.jpg';
      setCard((p) => ({ ...p, files: [...p.files, { uri: asset.uri, name, type: 'image' }] }));
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const isPdf = asset.mimeType?.includes('pdf');
      setCard((p) => ({ ...p, files: [...p.files, { uri: asset.uri, name: asset.name, type: isPdf ? 'pdf' : 'image' }] }));
    }
  };

  const removeFile = (idx: number) => {
    setCard((p) => ({ ...p, files: p.files.filter((_, i) => i !== idx) }));
  };

  // Render a single calendar cell
  const renderDateCell = (d: DateItem) => {
    const isSel = selDays[d.full] !== undefined;
    const isAct = activeDate === d.full;
    const hasTime = selDays[d.full] != null;
    const isSunday = d.weekday === 0;

    return (
      <TouchableOpacity
        key={d.full}
        activeOpacity={0.6}
        style={[
          st.calCell,
          isSel && !isAct && st.calCellSel,
          isAct && st.calCellActive,
        ]}
        onPress={() => {
          if (isSel && !isAct) setActiveDate(d.full);
          else toggleDate(d.full);
        }}
        onLongPress={() => { if (isSel) toggleDate(d.full); }}
      >
        <Text style={[
          st.calDate,
          isSunday && !isSel && !isAct && st.calDateSunday,
          (isSel || isAct) && st.calDateOn,
        ]}>
          {d.date}
        </Text>
        <Text style={[
          st.calMonth,
          (isSel || isAct) && st.calMonthOn,
        ]}>
          {d.month}
        </Text>
        {isSel && hasTime && (
          <View style={st.calCheck}>
            <Ionicons name="checkmark" size={8} color="#fff" />
          </View>
        )}
        {isSel && !hasTime && (
          <View style={st.calPending}>
            <View style={st.calPendingDot} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={st.root}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <LinearGradient colors={[C.green, C.greenDark]} style={st.profile}>
          <View style={st.topRow}>
            <TouchableOpacity style={st.backBtn} onPress={() => nav.goBack()}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={st.topTitle}>Shifokor profili</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={st.avBox}>
            <Ionicons name={sp.icon as any} size={34} color={sp.color} />
          </View>
          <Text style={st.name}>{doc.name}</Text>
          <View style={st.spTag}>
            <Ionicons name={sp.icon as any} size={13} color="#fff" />
            <Text style={st.spTagText}>{doc.specialty}</Text>
          </View>
          <View style={st.statsRow}>
            {[
              { i: 'star' as const, v: `${doc.rating}`, l: 'Reyting', ic: '#FCD34D' },
              { i: 'briefcase-outline' as const, v: `${doc.experience}+`, l: 'Yil', ic: '#fff' },
              { i: 'people-outline' as const, v: `${doc.experience * 120}+`, l: 'Bemorlar', ic: '#fff' },
            ].map((x, i) => (
              <React.Fragment key={i}>
                {i > 0 && <View style={st.stDiv} />}
                <View style={st.stBox}>
                  <View style={st.stIco}>
                    <Ionicons name={x.i} size={14} color={x.ic} />
                  </View>
                  <Text style={st.stVal}>{x.v}</Text>
                  <Text style={st.stLbl}>{x.l}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </LinearGradient>

        {/* Info cards */}
        <View style={st.infoCards}>
          {[
            { i: 'location' as const, t: doc.location },
            { i: 'cash-outline' as const, t: `${doc.price.toLocaleString()} so'm / seans` },
          ].map((x, i) => (
            <View key={i} style={st.infoCard}>
              <Ionicons name={x.i} size={15} color={C.green} />
              <Text style={st.infoText}>{x.t}</Text>
            </View>
          ))}
        </View>

        {/* Calendar */}
        <View style={st.sec}>
          <View style={st.secHR}>
            <Text style={st.secT}>Kunlarni tanlang</Text>
            {cnt > 0 && (
              <View style={st.cntBadge}>
                <Text style={st.cntBadgeT}>{cnt} kun tanlandi</Text>
              </View>
            )}
          </View>

          <View style={st.calCard}>
            {/* Legend */}
            <View style={st.calLegend}>
              <View style={st.legendItem}>
                <View style={[st.legendDot, { backgroundColor: C.brand }]} />
                <Text style={st.legendText}>Aktiv</Text>
              </View>
              <View style={st.legendItem}>
                <View style={[st.legendDot, { backgroundColor: C.green }]} />
                <Text style={st.legendText}>Tanlangan</Text>
              </View>
              <View style={st.legendItem}>
                <View style={[st.legendDot, { backgroundColor: C.amber }]} />
                <Text style={st.legendText}>Vaqt kerak</Text>
              </View>
            </View>

            {/* Week day headers */}
            <View style={st.calHeaderRow}>
              {weekDayHeaders.map((wd, i) => (
                <View key={i} style={st.calHeaderCell}>
                  <Text style={[st.calHeaderText, i === 6 && st.calHeaderSunday]}>{wd}</Text>
                </View>
              ))}
            </View>

            {/* Week 1 */}
            <View style={st.calWeekRow}>
              {week1.map(renderDateCell)}
            </View>

            {/* Week 2 */}
            <View style={st.calWeekRow}>
              {week2.map(renderDateCell)}
            </View>
          </View>
        </View>

        {/* Time slots */}
        {activeDate && (
          <View style={st.sec}>
            <View style={st.secHR}>
              <View>
                <Text style={st.secT}>Vaqtni tanlang</Text>
                <Text style={st.secSub}>{activeDate} uchun</Text>
              </View>
              {selDays[activeDate] && (
                <View style={st.selBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={C.green} />
                  <Text style={st.selBadgeT}>{selDays[activeDate]}</Text>
                </View>
              )}
            </View>

            <View style={st.timeCard}>
              <View style={st.timeSection}>
                <Text style={st.timeSectionLabel}>Ertalab</Text>
                <View style={st.timeGrid}>
                  {timeSlots.filter((s) => parseInt(s.time) < 12).map((slot) => {
                    const on = selDays[activeDate] === slot.time;
                    return (
                      <TouchableOpacity
                        key={slot.id} activeOpacity={0.6}
                        style={[st.timeSl, !slot.available && st.timeOff, on && st.timeOn]}
                        onPress={() => slot.available && selectTime(slot.time)}
                        disabled={!slot.available}
                      >
                        <Text style={[st.timeTxt, !slot.available && st.timeTxtOff, on && st.timeTxtOn]}>
                          {slot.time}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              <View style={st.timeDivider} />
              <View style={st.timeSection}>
                <Text style={st.timeSectionLabel}>Tushdan keyin</Text>
                <View style={st.timeGrid}>
                  {timeSlots.filter((s) => parseInt(s.time) >= 12).map((slot) => {
                    const on = selDays[activeDate] === slot.time;
                    return (
                      <TouchableOpacity
                        key={slot.id} activeOpacity={0.6}
                        style={[st.timeSl, !slot.available && st.timeOff, on && st.timeOn]}
                        onPress={() => slot.available && selectTime(slot.time)}
                        disabled={!slot.available}
                      >
                        <Text style={[st.timeTxt, !slot.available && st.timeTxtOff, on && st.timeTxtOn]}>
                          {slot.time}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Selected days summary */}
        {cnt > 0 && (
          <View style={st.sec}>
            <Text style={st.secT}>Bron tafsilotlari</Text>

            <View style={st.summaryCard}>
              {Object.entries(selDays).map(([date, time], i) => (
                <View key={i} style={[st.summaryRow, i > 0 && st.summaryRowBorder]}>
                  <View style={st.summaryNum}>
                    <Text style={st.summaryNumText}>{i + 1}</Text>
                  </View>
                  <View style={st.summaryMid}>
                    <Text style={st.summaryDate}>{date}</Text>
                    {time ? (
                      <Text style={st.summaryTime}>{time}</Text>
                    ) : (
                      <Text style={st.summaryPending}>Vaqt tanlanmagan</Text>
                    )}
                  </View>
                  <View style={st.summaryActions}>
                    {time && (
                      <View style={st.summaryCheck}>
                        <Ionicons name="checkmark" size={12} color={C.green} />
                      </View>
                    )}
                    <TouchableOpacity onPress={() => toggleDate(date)} style={st.summaryRm}>
                      <Ionicons name="trash-outline" size={14} color={C.red} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* Total */}
              <View style={st.summaryFooter}>
                <View style={st.summaryFooterLeft}>
                  <Text style={st.summaryFooterLabel}>Jami ({cnt} kun)</Text>
                  <Text style={st.summaryFooterSub}>{doc.price.toLocaleString()} x {cnt}</Text>
                </View>
                <Text style={st.summaryFooterTotal}>{total.toLocaleString()} so'm</Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom bar */}
      <View style={st.bottom}>
        <View>
          <Text style={st.pLbl}>{cnt > 0 ? `${cnt} kunlik navbat` : 'Seans narxi'}</Text>
          <Text style={st.pVal}>{(cnt > 0 ? total : doc.price).toLocaleString()} so'm</Text>
        </View>
        <TouchableOpacity
          style={[st.bookBtn, !canBook && st.bookBtnOff]}
          onPress={handleBook}
          activeOpacity={0.8}
        >
          <Text style={st.bookBtnT}>
            {cnt === 0 ? 'Kunlarni tanlang' : !allTime ? 'Vaqtlarni belgilang' : 'Bron qilish'}
          </Text>
          {canBook && (
            <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: SP.sm }} />
          )}
        </TouchableOpacity>
      </View>

      {/* ── "Kim uchun?" Picker Modal ── */}
      <Modal visible={showPicker} animationType="fade" transparent statusBarTranslucent onRequestClose={() => { setShowPicker(false); setDropdownOpen(false); }}>
        <View style={pk.overlay}>
          <View style={pk.sheet}>
            <View style={pk.handle} />
            <View style={pk.header}>
              <Text style={pk.title}>Kim uchun navbat?</Text>
              <Text style={pk.subtitle}>Bemorni tanlang</Text>
            </View>

            {/* Select Box */}
            <Text style={pk.fieldLabel}>Bemor</Text>
            <TouchableOpacity style={[pk.selectBox, dropdownOpen && pk.selectBoxOpen]} onPress={() => setDropdownOpen(!dropdownOpen)} activeOpacity={0.7}>
              <Text style={pk.selectBoxText}>
                {selectedFor === 'me' ? `O'zim — ${medCard.fullName || 'To\'ldirilmagan'}` : (() => { const m = family.find((f) => f.id === selectedFor); return m ? `${m.relation} — ${m.name}` : 'Tanlang'; })()}
              </Text>
              <Ionicons name={dropdownOpen ? 'chevron-up' : 'chevron-down'} size={20} color={C.textTertiary} />
            </TouchableOpacity>

            {/* Dropdown options */}
            {dropdownOpen && (
              <View style={pk.dropdown}>
                <ScrollView showsVerticalScrollIndicator={false} style={pk.dropdownScroll} nestedScrollEnabled>
                  {/* O'zim */}
                  <TouchableOpacity style={[pk.option, selectedFor === 'me' && pk.optionActive]} onPress={() => { setSelectedFor('me'); setDropdownOpen(false); }} activeOpacity={0.7}>
                    <Text style={[pk.optionText, selectedFor === 'me' && pk.optionTextActive]}>O'zim</Text>
                    <Text style={pk.optionSub}>{medCard.fullName || 'To\'ldirilmagan'}</Text>
                    {selectedFor === 'me' && <Ionicons name="checkmark" size={18} color={C.brand} />}
                  </TouchableOpacity>

                  {/* Oila a'zolari */}
                  {family.map((m) => {
                    const isSelected = selectedFor === m.id;
                    return (
                      <TouchableOpacity key={m.id} style={[pk.option, isSelected && pk.optionActive]} onPress={() => { setSelectedFor(m.id); setDropdownOpen(false); }} activeOpacity={0.7}>
                        <Text style={[pk.optionText, isSelected && pk.optionTextActive]}>{m.relation}</Text>
                        <Text style={pk.optionSub}>{m.name}</Text>
                        {isSelected && <Ionicons name="checkmark" size={18} color={C.brand} />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Tugmalar */}
            <TouchableOpacity style={pk.confirmBtn} onPress={() => { setDropdownOpen(false); handlePickConfirm(); }} activeOpacity={0.8}>
              <Ionicons name="checkmark-circle" size={18} color={C.textInverse} />
              <Text style={pk.confirmText}>Tanlash</Text>
            </TouchableOpacity>
            <TouchableOpacity style={pk.cancelBtn} onPress={() => { setShowPicker(false); setDropdownOpen(false); }} activeOpacity={0.8}>
              <Text style={pk.cancelText}>Bekor qilish</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Med Card Modal ── */}
      <Modal visible={showMedCard} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setShowMedCard(false)}>
        <View style={mc.overlay}>
          <View style={mc.sheet}>
            <View style={mc.handle} />
            <View style={mc.header}>
              <View>
                <Text style={mc.title}>Tibbiy karta</Text>
                <Text style={mc.subtitle}>Shifokor uchun zarur ma'lumotlar</Text>
              </View>
              <TouchableOpacity style={mc.closeBtn} onPress={() => setShowMedCard(false)}>
                <Ionicons name="close" size={18} color={C.textTertiary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Required fields */}
              <View style={mc.required}>
                <Ionicons name="alert-circle" size={13} color={C.red} />
                <Text style={mc.requiredText}>* belgilangan maydonlar majburiy</Text>
              </View>

              {/* ── 1. Shaxsiy ma'lumotlar ── */}
              <View style={mc.sectionHeader}>
                <View style={[mc.sectionIcon, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="person-outline" size={16} color="#2563EB" />
                </View>
                <Text style={mc.sectionTitle}>Shaxsiy ma'lumotlar</Text>
              </View>
              <View style={mc.sectionCard}>
                <Text style={mc.label}>To'liq ism *</Text>
                <View style={mc.inputBox}>
                  <Ionicons name="person-outline" size={16} color={C.textTertiary} />
                  <TextInput style={mc.input} value={card.fullName} onChangeText={(v) => updateCard('fullName', v)} placeholder="Familiya Ism Otasining ismi" placeholderTextColor={C.textTertiary} />
                </View>

                <View style={mc.row}>
                  <View style={mc.half}>
                    <Text style={mc.label}>Tug'ilgan yil *</Text>
                    <View style={mc.inputBox}>
                      <Ionicons name="calendar-outline" size={16} color={C.textTertiary} />
                      <TextInput style={mc.input} value={card.birthYear} onChangeText={(v) => updateCard('birthYear', v)} placeholder="1990" placeholderTextColor={C.textTertiary} keyboardType="number-pad" maxLength={4} />
                    </View>
                  </View>
                  <View style={mc.half}>
                    <Text style={mc.label}>Jinsi *</Text>
                    <View style={mc.genderRow}>
                      <TouchableOpacity style={[mc.genderBtn, card.gender === 'erkak' && mc.genderOn]} onPress={() => updateCard('gender', 'erkak')}>
                        <Ionicons name="male-outline" size={16} color={card.gender === 'erkak' ? C.textInverse : C.text} />
                        <Text style={[mc.genderText, card.gender === 'erkak' && mc.genderTextOn]}>Erkak</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[mc.genderBtn, card.gender === 'ayol' && mc.genderOnF]} onPress={() => updateCard('gender', 'ayol')}>
                        <Ionicons name="female-outline" size={16} color={card.gender === 'ayol' ? C.textInverse : C.text} />
                        <Text style={[mc.genderText, card.gender === 'ayol' && mc.genderTextOn]}>Ayol</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <Text style={mc.label}>Qon guruhi</Text>
                <View style={mc.bloodRow}>
                  {['I (O)', 'II (A)', 'III (B)', 'IV (AB)'].map((bt) => (
                    <TouchableOpacity key={bt} style={[mc.bloodBtn, card.bloodType === bt && mc.bloodOn]} onPress={() => updateCard('bloodType', card.bloodType === bt ? '' : bt)}>
                      <Text style={[mc.bloodText, card.bloodType === bt && mc.bloodTextOn]}>{bt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* ── 2. Tibbiy ma'lumotlar ── */}
              <View style={mc.sectionHeader}>
                <View style={[mc.sectionIcon, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="medkit-outline" size={16} color="#059669" />
                </View>
                <Text style={mc.sectionTitle}>Tibbiy ma'lumotlar</Text>
              </View>
              <View style={mc.sectionCard}>
                <Text style={mc.labelFirst}>Allergiyalar</Text>
                <View style={mc.inputBox}>
                  <Ionicons name="warning-outline" size={16} color={C.textTertiary} />
                  <TextInput style={mc.input} value={card.allergies} onChangeText={(v) => updateCard('allergies', v)} placeholder="Dori yoki oziq-ovqatga allergiya" placeholderTextColor={C.textTertiary} />
                </View>

                <Text style={mc.label}>Surunkali kasalliklar</Text>
                <View style={mc.inputBox}>
                  <Ionicons name="medkit-outline" size={16} color={C.textTertiary} />
                  <TextInput style={mc.input} value={card.chronicDiseases} onChangeText={(v) => updateCard('chronicDiseases', v)} placeholder="Diabet, gipertoniya va h.k." placeholderTextColor={C.textTertiary} />
                </View>

                <Text style={mc.label}>Hozir qabul qilayotgan dorilar</Text>
                <View style={mc.inputBox}>
                  <Ionicons name="flask-outline" size={16} color={C.textTertiary} />
                  <TextInput style={mc.input} value={card.currentMeds} onChangeText={(v) => updateCard('currentMeds', v)} placeholder="Dori nomlari va dozalari" placeholderTextColor={C.textTertiary} />
                </View>
              </View>

              {/* ── 3. Shikoyatlar ── */}
              <View style={mc.sectionHeader}>
                <View style={[mc.sectionIcon, { backgroundColor: '#FEF2F2' }]}>
                  <Ionicons name="document-text-outline" size={16} color="#DC2626" />
                </View>
                <Text style={mc.sectionTitle}>Shikoyatlar</Text>
              </View>
              <View style={mc.sectionCard}>
                <Text style={mc.labelFirst}>Hozirgi shikoyatlar *</Text>
                <View style={[mc.inputBox, { minHeight: 70, alignItems: 'flex-start' }]}>
                  <Ionicons name="document-text-outline" size={16} color={C.textTertiary} style={{ marginTop: 2 }} />
                  <TextInput style={[mc.input, { minHeight: 60 }]} value={card.complaints} onChangeText={(v) => updateCard('complaints', v)} placeholder="Hozirgi shikoyatlaringizni batafsil yozing..." placeholderTextColor={C.textTertiary} multiline maxLength={500} />
                </View>
              </View>

              {/* ── 4. Tibbiy hujjatlar ── */}
              <View style={mc.sectionHeader}>
                <View style={[mc.sectionIcon, { backgroundColor: '#FAF5FF' }]}>
                  <Ionicons name="attach-outline" size={16} color="#9333EA" />
                </View>
                <Text style={mc.sectionTitle}>Tibbiy hujjatlar</Text>
              </View>
              <View style={mc.sectionCard}>
                <Text style={mc.fileHintInCard}>Tahlil natijalari, rentgen, retseptlar va boshqa hujjatlar</Text>

                <View style={mc.fileActions}>
                  <TouchableOpacity style={mc.fileActionBtn} onPress={pickPhoto} activeOpacity={0.7}>
                    <Ionicons name="images-outline" size={20} color="#2563EB" />
                    <Text style={mc.fileActionLabel}>Galereya</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={mc.fileActionBtn} onPress={pickCamera} activeOpacity={0.7}>
                    <Ionicons name="camera-outline" size={20} color="#059669" />
                    <Text style={mc.fileActionLabel}>Kamera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={mc.fileActionBtn} onPress={pickDocument} activeOpacity={0.7}>
                    <Ionicons name="document-attach-outline" size={20} color="#9333EA" />
                    <Text style={mc.fileActionLabel}>Fayl (PDF)</Text>
                  </TouchableOpacity>
                </View>

                {/* Attached files list */}
                {card.files.length > 0 && (
                  <View style={mc.fileList}>
                    {card.files.map((f, i) => (
                      <View key={i} style={mc.fileItem}>
                        {f.type === 'image' ? (
                          <Image source={{ uri: f.uri }} style={mc.fileThumb} />
                        ) : (
                          <View style={mc.filePdfThumb}>
                            <Ionicons name="document-outline" size={18} color="#DC2626" />
                          </View>
                        )}
                        <View style={mc.fileMeta}>
                          <Text style={mc.fileName} numberOfLines={1}>{f.name}</Text>
                          <Text style={mc.fileType}>{f.type === 'pdf' ? 'PDF hujjat' : 'Rasm'}</Text>
                        </View>
                        <TouchableOpacity style={mc.fileRemove} onPress={() => removeFile(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <Ionicons name="close-circle" size={20} color={C.red} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <View style={{ height: 16 }} />
            </ScrollView>

            {/* Submit */}
            <TouchableOpacity style={[mc.submitBtn, !medCardValid && mc.submitOff]} onPress={handleMedCardSubmit} disabled={!medCardValid} activeOpacity={0.8}>
              <Ionicons name="shield-checkmark" size={18} color={C.textInverse} />
              <Text style={mc.submitText}>Kartani saqlash va davom etish</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modals */}
      <AppModal visible={showError} type="error" title="Xatolik" message={errMsg} onClose={() => setShowError(false)} />
      <AppModal
        visible={showConfirm} type="confirm" title="Bronni tasdiqlang"
        message={`${doc.name} ga ${cnt} kunlik navbat.`}
        details={[
          { label: 'Bemor', value: card.fullName },
          { label: 'Shifokor', value: doc.name },
          { label: 'Mutaxassislik', value: doc.specialty },
          { label: 'Kunlar', value: `${cnt}` },
          ...Object.entries(selDays).map(([d, t]) => ({ label: d, value: t || '' })),
          { label: 'Shikoyat', value: card.complaints.slice(0, 50) + (card.complaints.length > 50 ? '...' : '') },
          { label: 'Jami', value: `${total.toLocaleString()} so'm` },
        ]}
        confirmText="Tasdiqlash" cancelText="Bekor qilish"
        onConfirm={confirmBook}
        onCancel={() => setShowConfirm(false)}
        onClose={() => setShowConfirm(false)}
      />
      <AppModal
        visible={showSuccess} type="success"
        title="Bron tasdiqlandi"
        message={`${doc.name} ga ${cnt} kunlik navbat tasdiqlandi.`}
        onClose={() => { setShowSuccess(false); nav.navigate('ChatsTab' as never); }}
      />
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Profile
  profile: { paddingTop: 16, paddingBottom: 24, alignItems: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: SP.lg, paddingTop: 40, marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: RADIUS.sm, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  topTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  avBox: { width: 76, height: 76, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  name: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: SP.sm },
  spTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: SP.md, paddingVertical: 6, borderRadius: RADIUS.full },
  spTagText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  statsRow: { flexDirection: 'row', marginTop: SP.lg, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: RADIUS.md, padding: SP.lg, marginHorizontal: SP.xl },
  stBox: { flex: 1, alignItems: 'center' },
  stIco: { width: 30, height: 30, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  stVal: { fontSize: 16, fontWeight: '700', color: '#fff' },
  stLbl: { fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2, fontWeight: '500' },
  stDiv: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: SP.xs },

  // Info
  infoCards: { paddingHorizontal: SP.xl, paddingTop: SP.xl, gap: SP.sm },
  infoCard: { flexDirection: 'row', alignItems: 'center', gap: SP.md, backgroundColor: C.card, borderRadius: RADIUS.sm, padding: 14, borderWidth: 1, borderColor: C.border },
  infoText: { fontSize: 14, color: C.text, fontWeight: '500' },

  // Section
  sec: { paddingHorizontal: SP.xl, paddingTop: SP.xxl },
  secT: { fontSize: 17, fontWeight: '700', color: C.text, letterSpacing: -0.3 },
  secSub: { fontSize: 12, color: C.textTertiary, marginTop: 2 },
  secHR: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SP.md },
  cntBadge: { backgroundColor: C.greenLight, paddingHorizontal: SP.md, paddingVertical: SP.xs, borderRadius: RADIUS.xs },
  cntBadgeT: { fontSize: 12, fontWeight: '600', color: C.green },
  selBadge: { flexDirection: 'row', alignItems: 'center', gap: SP.xs, backgroundColor: C.greenLight, paddingHorizontal: 10, paddingVertical: SP.xs, borderRadius: RADIUS.xs },
  selBadgeT: { fontSize: 12, fontWeight: '600', color: C.green },

  // ── Calendar ──
  calCard: {
    backgroundColor: C.card,
    borderRadius: RADIUS.md,
    padding: SP.lg,
    borderWidth: 1,
    borderColor: C.border,
  },
  calLegend: {
    flexDirection: 'row',
    gap: SP.lg,
    marginBottom: SP.md,
    paddingBottom: SP.md,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: SP.xs },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: C.textTertiary, fontWeight: '500' },

  calHeaderRow: { flexDirection: 'row', marginBottom: SP.sm },
  calHeaderCell: { flex: 1, alignItems: 'center' },
  calHeaderText: { fontSize: 11, fontWeight: '600', color: C.textTertiary },
  calHeaderSunday: { color: C.red },

  calWeekRow: { flexDirection: 'row', marginBottom: SP.sm },
  calCell: {
    flex: 1,
    aspectRatio: 1,
    margin: 2,
    borderRadius: RADIUS.sm,
    backgroundColor: C.bg,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  calCellSel: {
    backgroundColor: C.greenLight,
    borderColor: C.green,
  },
  calCellActive: {
    backgroundColor: C.brand,
    borderColor: C.brand,
  },
  calDate: { fontSize: 16, fontWeight: '700', color: C.text },
  calDateSunday: { color: C.red },
  calDateOn: { color: '#fff' },
  calMonth: { fontSize: 9, color: C.textTertiary, fontWeight: '500', marginTop: 1 },
  calMonthOn: { color: 'rgba(255,255,255,0.7)' },
  calCheck: {
    position: 'absolute', top: 3, right: 3,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: C.green,
    justifyContent: 'center', alignItems: 'center',
  },
  calPending: {
    position: 'absolute', top: 3, right: 3,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: C.amberLight,
    justifyContent: 'center', alignItems: 'center',
  },
  calPendingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.amber },

  // ── Time slots ──
  timeCard: {
    backgroundColor: C.card,
    borderRadius: RADIUS.md,
    padding: SP.lg,
    borderWidth: 1,
    borderColor: C.border,
  },
  timeSection: { marginBottom: SP.xs },
  timeSectionLabel: { fontSize: 12, fontWeight: '600', color: C.textTertiary, marginBottom: SP.sm, letterSpacing: 0.3 },
  timeDivider: { height: 1, backgroundColor: C.border, marginVertical: SP.md },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm },
  timeSl: {
    paddingHorizontal: SP.lg, paddingVertical: 10,
    borderRadius: RADIUS.xs, backgroundColor: C.bg,
    borderWidth: 1, borderColor: C.border,
  },
  timeOff: { opacity: 0.35 },
  timeOn: { backgroundColor: C.brand, borderColor: C.brand },
  timeTxt: { fontSize: 14, fontWeight: '600', color: C.text },
  timeTxtOff: { color: C.textTertiary },
  timeTxtOn: { color: '#fff' },

  // ── Summary ──
  summaryCard: {
    backgroundColor: C.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: C.border,
    marginTop: SP.md,
    overflow: 'hidden',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SP.lg,
  },
  summaryRowBorder: {
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  summaryNum: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: C.bg,
    justifyContent: 'center', alignItems: 'center',
    marginRight: SP.md,
  },
  summaryNumText: { fontSize: 12, fontWeight: '700', color: C.textSecondary },
  summaryMid: { flex: 1 },
  summaryDate: { fontSize: 14, fontWeight: '600', color: C.text },
  summaryTime: { fontSize: 12, color: C.green, fontWeight: '500', marginTop: 2 },
  summaryPending: { fontSize: 12, color: C.amber, fontWeight: '500', marginTop: 2 },
  summaryActions: { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  summaryCheck: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: C.greenLight,
    justifyContent: 'center', alignItems: 'center',
  },
  summaryRm: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: C.redLight,
    justifyContent: 'center', alignItems: 'center',
  },
  summaryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SP.lg,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  summaryFooterLeft: {},
  summaryFooterLabel: { fontSize: 14, fontWeight: '700', color: C.text },
  summaryFooterSub: { fontSize: 11, color: C.textTertiary, marginTop: 2 },
  summaryFooterTotal: { fontSize: 18, fontWeight: '700', color: C.green },

  // ── Bottom bar ──
  bottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SP.xl, paddingVertical: SP.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : SP.xl,
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border,
    ...SHADOW.lg,
  },
  pLbl: { fontSize: 11, color: C.textTertiary, fontWeight: '500' },
  pVal: { fontSize: 19, fontWeight: '700', color: C.text, marginTop: 2 },
  bookBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.brand, paddingHorizontal: SP.xl, paddingVertical: 14,
    borderRadius: RADIUS.md,
  },
  bookBtnOff: { backgroundColor: C.border },
  bookBtnT: { fontSize: 14, fontWeight: '600', color: '#fff' },
});

// ── Med Card Styles ──
const mc = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: SP.xl, paddingBottom: Platform.OS === 'ios' ? 36 : SP.xl, maxHeight: '92%' },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginTop: SP.sm, marginBottom: SP.lg },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SP.md },
  title: { fontSize: 22, fontWeight: '700', color: C.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: C.textTertiary, marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },

  required: { flexDirection: 'row', alignItems: 'center', gap: SP.xs, backgroundColor: C.redLight, paddingHorizontal: SP.sm, paddingVertical: SP.xs, borderRadius: 6, marginBottom: SP.md },
  requiredText: { fontSize: 11, color: C.red, fontWeight: '500' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: SP.sm, marginTop: SP.xl, marginBottom: SP.sm },
  sectionIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  sectionCard: { backgroundColor: C.card, borderRadius: RADIUS.md, padding: SP.lg, borderWidth: 1, borderColor: C.border },

  label: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: SP.sm, marginTop: SP.md },
  labelFirst: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: SP.sm },

  inputBox: { flexDirection: 'row', alignItems: 'center', gap: SP.sm, backgroundColor: C.bg, borderRadius: RADIUS.sm, paddingHorizontal: SP.md, borderWidth: 1, borderColor: C.border },
  input: { flex: 1, fontSize: 14, color: C.text, paddingVertical: SP.md },

  row: { flexDirection: 'row', gap: SP.md },
  half: { flex: 1 },

  genderRow: { flexDirection: 'row', gap: SP.sm },
  genderBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.xs, backgroundColor: C.bg, paddingVertical: SP.md, borderRadius: RADIUS.sm, borderWidth: 1.5, borderColor: C.border },
  genderOn: { backgroundColor: C.brand, borderColor: C.brand },
  genderOnF: { backgroundColor: '#DB2777', borderColor: '#DB2777' },
  genderText: { fontSize: 13, fontWeight: '600', color: C.text },
  genderTextOn: { color: C.textInverse },

  bloodRow: { flexDirection: 'row', gap: SP.sm },
  bloodBtn: { flex: 1, alignItems: 'center', paddingVertical: SP.sm, backgroundColor: C.bg, borderRadius: RADIUS.sm, borderWidth: 1.5, borderColor: C.border },
  bloodOn: { backgroundColor: C.red, borderColor: C.red },
  bloodText: { fontSize: 12, fontWeight: '600', color: C.text },
  bloodTextOn: { color: C.textInverse },

  // Files
  fileHint: { fontSize: 11, color: C.textTertiary, marginBottom: SP.md, marginTop: -4 },
  fileHintInCard: { fontSize: 11, color: C.textTertiary, marginBottom: SP.md },
  fileActions: { flexDirection: 'row', gap: SP.sm, marginBottom: SP.md },
  fileActionBtn: { flex: 1, alignItems: 'center', gap: SP.xs, backgroundColor: C.bg, paddingVertical: SP.md, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: C.border },
  fileActionLabel: { fontSize: 11, fontWeight: '600', color: C.text },

  fileList: { gap: SP.sm, marginBottom: SP.sm },
  fileItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: RADIUS.sm, padding: SP.sm, borderWidth: 1, borderColor: C.border },
  fileThumb: { width: 44, height: 44, borderRadius: 8, marginRight: SP.md },
  filePdfThumb: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginRight: SP.md },
  fileMeta: { flex: 1 },
  fileName: { fontSize: 13, fontWeight: '600', color: C.text },
  fileType: { fontSize: 11, color: C.textTertiary, marginTop: 1 },
  fileRemove: { padding: SP.xs },

  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.sm, backgroundColor: C.green, paddingVertical: SP.lg, borderRadius: RADIUS.md, marginTop: SP.md },
  submitOff: { backgroundColor: C.border },
  submitText: { fontSize: 15, fontWeight: '600', color: C.textInverse },
});

// ── Person Picker Styles ──
const pk = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: SP.xl, paddingBottom: Platform.OS === 'ios' ? 36 : SP.xl },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginTop: SP.sm, marginBottom: SP.lg },
  header: { marginBottom: SP.xl },
  title: { fontSize: 20, fontWeight: '700', color: C.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: C.textTertiary, marginTop: 4 },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: SP.sm },

  // Select box
  selectBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.bg, borderRadius: RADIUS.sm, paddingHorizontal: SP.lg, paddingVertical: 14,
    borderWidth: 1.5, borderColor: C.border,
  },
  selectBoxOpen: { borderColor: C.brand, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  selectBoxText: { fontSize: 14, fontWeight: '500', color: C.text, flex: 1 },

  // Dropdown
  dropdown: {
    backgroundColor: C.bg, borderWidth: 1.5, borderTopWidth: 0, borderColor: C.brand,
    borderBottomLeftRadius: RADIUS.sm, borderBottomRightRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  dropdownScroll: { maxHeight: 250 },
  option: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SP.lg, paddingVertical: 13,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  optionActive: { backgroundColor: C.brandLight },
  optionText: { fontSize: 14, fontWeight: '600', color: C.text, minWidth: 70 },
  optionTextActive: { color: C.brand },
  optionSub: { flex: 1, fontSize: 12, color: C.textTertiary, marginLeft: SP.sm },

  confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.sm, backgroundColor: C.brand, paddingVertical: SP.lg, borderRadius: RADIUS.md, marginTop: SP.xl },
  confirmText: { fontSize: 16, fontWeight: '600', color: C.textInverse },
  cancelBtn: { alignItems: 'center', paddingVertical: SP.md, marginTop: SP.sm },
  cancelText: { fontSize: 15, fontWeight: '600', color: C.textTertiary },
});
