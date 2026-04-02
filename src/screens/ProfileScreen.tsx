import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Platform, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useApp, FamilyMember, EMPTY_MED_CARD } from '../context/AppContext';
import { C, RADIUS, SP, SHADOW } from '../theme';

const RELATIONS = ['Turmush o\'rtog\'im', 'Farzandim', 'Otam', 'Onam', 'Akam', 'Opam', 'Boshqa'];

export default function ProfileScreen() {
  const nav = useNavigation();
  const { medCard, saveMedCard, family, addFamilyMember, removeFamilyMember, health, bookings } = useApp();

  const [showAddFamily, setShowAddFamily] = useState(false);
  const [fName, setFName] = useState('');
  const [fRelation, setFRelation] = useState('');
  const [fYear, setFYear] = useState('');
  const [fGender, setFGender] = useState<'erkak' | 'ayol'>('erkak');

  const [showEditCard, setShowEditCard] = useState(false);
  const [editFullName, setEditFullName] = useState(medCard.fullName);
  const [editYear, setEditYear] = useState(medCard.birthYear);
  const [editGender, setEditGender] = useState(medCard.gender);

  const hasMedCard = !!medCard.fullName;
  const activeBookings = bookings.filter((b) => b.status === 'confirmed').length;

  const saveProfile = () => {
    saveMedCard({ ...medCard, fullName: editFullName.trim(), birthYear: editYear.trim(), gender: editGender });
    setShowEditCard(false);
  };

  const handleAddFamily = () => {
    if (!fName.trim() || !fRelation) return;
    addFamilyMember({ name: fName.trim(), relation: fRelation, birthYear: fYear.trim(), gender: fGender });
    setShowAddFamily(false);
    setFName(''); setFRelation(''); setFYear(''); setFGender('erkak');
  };

  const confirmRemove = (m: FamilyMember) => {
    Alert.alert('O\'chirish', `${m.name}ni oila ro'yxatidan o'chirmoqchimisiz?`, [
      { text: 'Yo\'q' },
      { text: 'Ha', style: 'destructive', onPress: () => removeFamilyMember(m.id) },
    ]);
  };

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => nav.goBack()}>
          <Ionicons name="arrow-back" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Profil</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.body}>
        {/* ── Profile Card ── */}
        <View style={s.profileCard}>
          <View style={s.avatarLarge}>
            <Ionicons name="person" size={32} color={C.brand} />
          </View>
          {hasMedCard ? (
            <>
              <Text style={s.profileName}>{medCard.fullName}</Text>
              <View style={s.profileMeta}>
                {medCard.birthYear ? <Text style={s.profileMetaText}>{medCard.birthYear} yil</Text> : null}
                {medCard.gender ? (
                  <View style={s.genderPill}>
                    <Ionicons name={medCard.gender === 'erkak' ? 'male' : 'female'} size={11} color={medCard.gender === 'erkak' ? C.brand : '#DB2777'} />
                    <Text style={[s.genderPillText, { color: medCard.gender === 'erkak' ? C.brand : '#DB2777' }]}>{medCard.gender === 'erkak' ? 'Erkak' : 'Ayol'}</Text>
                  </View>
                ) : null}
                {medCard.bloodType ? <Text style={s.profileMetaText}>Qon: {medCard.bloodType}</Text> : null}
              </View>
              <TouchableOpacity style={s.editProfileBtn} onPress={() => { setEditFullName(medCard.fullName); setEditYear(medCard.birthYear); setEditGender(medCard.gender); setShowEditCard(true); }}>
                <Ionicons name="create-outline" size={14} color={C.brand} />
                <Text style={s.editProfileText}>Tahrirlash</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={s.profileName}>Profil to'ldirilmagan</Text>
              <Text style={s.profileHint}>Shifokorga yozilishda medkarta avtomatik to'ldiriladi</Text>
              <TouchableOpacity style={s.fillProfileBtn} onPress={() => { setShowEditCard(true); }}>
                <Ionicons name="person-add-outline" size={14} color={C.textInverse} />
                <Text style={s.fillProfileText}>Profil to'ldirish</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* ── Stats ── */}
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Text style={s.statNum}>{activeBookings}</Text>
            <Text style={s.statLabel}>Navbatlar</Text>
          </View>
          <View style={s.statDiv} />
          <View style={s.statItem}>
            <Text style={s.statNum}>{family.length}</Text>
            <Text style={s.statLabel}>Oila</Text>
          </View>
          <View style={s.statDiv} />
          <View style={s.statItem}>
            <Text style={s.statNum}>{health.sleepHours}s</Text>
            <Text style={s.statLabel}>Uyqu</Text>
          </View>
          <View style={s.statDiv} />
          <View style={s.statItem}>
            <Text style={s.statNum}>{(health.steps / 1000).toFixed(1)}k</Text>
            <Text style={s.statLabel}>Qadam</Text>
          </View>
        </View>

        {/* ── MedCard status ── */}
        {hasMedCard && (
          <View style={s.medCardStatus}>
            <View style={s.medCardLeft}>
              <View style={s.medCardIcon}>
                <Ionicons name="shield-checkmark" size={18} color={C.green} />
              </View>
              <View>
                <Text style={s.medCardTitle}>Medkarta to'ldirilgan</Text>
                <Text style={s.medCardSub}>
                  {medCard.allergies ? `Allergiya: ${medCard.allergies}` : 'Shifokorlarga avtomatik yuboriladi'}
                </Text>
              </View>
            </View>
            <Ionicons name="checkmark-circle" size={20} color={C.green} />
          </View>
        )}

        {/* ── Family Members ── */}
        <View style={s.secHeader}>
          <View>
            <Text style={s.secTitle}>Oila a'zolari</Text>
            <Text style={s.secSub}>Yaqinlaringiz sog'ligini kuzating</Text>
          </View>
          <TouchableOpacity style={s.addFamilyBtn} onPress={() => setShowAddFamily(true)} activeOpacity={0.7}>
            <Ionicons name="add" size={18} color={C.brand} />
          </TouchableOpacity>
        </View>

        {family.length === 0 ? (
          <View style={s.emptyFamily}>
            <View style={s.emptyFamilyIcon}>
              <Ionicons name="people-outline" size={24} color={C.textTertiary} />
            </View>
            <Text style={s.emptyFamilyTitle}>Oila a'zolari qo'shilmagan</Text>
            <Text style={s.emptyFamilySub}>Yaqinlaringizni qo'shing va ularning sog'ligini nazorat qiling</Text>
          </View>
        ) : (
          family.map((m) => (
            <View key={m.id} style={s.familyCard}>
              <View style={[s.familyAvatar, { backgroundColor: m.gender === 'erkak' ? '#EFF6FF' : '#FDF2F8' }]}>
                <Ionicons name={m.gender === 'erkak' ? 'man-outline' : 'woman-outline'} size={20} color={m.gender === 'erkak' ? C.brand : '#DB2777'} />
              </View>
              <View style={s.familyInfo}>
                <Text style={s.familyName}>{m.name}</Text>
                <View style={s.familyMeta}>
                  <View style={s.familyRelBadge}>
                    <Text style={s.familyRelText}>{m.relation}</Text>
                  </View>
                  {m.birthYear ? <Text style={s.familyYear}>{m.birthYear} yil</Text> : null}
                </View>
              </View>
              <TouchableOpacity style={s.familyRemove} onPress={() => confirmRemove(m)}>
                <Ionicons name="trash-outline" size={16} color={C.red} />
              </TouchableOpacity>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Edit Profile Modal ── */}
      <Modal visible={showEditCard} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setShowEditCard(false)}>
        <View style={s.mOverlay}>
          <View style={s.mSheet}>
            <View style={s.mHandle} />
            <View style={s.mHeader}>
              <Text style={s.mTitle}>{hasMedCard ? 'Profilni tahrirlash' : 'Profil yaratish'}</Text>
              <TouchableOpacity style={s.mClose} onPress={() => setShowEditCard(false)}>
                <Ionicons name="close" size={18} color={C.textTertiary} />
              </TouchableOpacity>
            </View>

            <Text style={s.mLabel}>To'liq ism</Text>
            <View style={s.mInput}><TextInput style={s.mInputText} value={editFullName} onChangeText={setEditFullName} placeholder="Familiya Ism" placeholderTextColor={C.textTertiary} /></View>

            <View style={s.mRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.mLabel}>Tug'ilgan yil</Text>
                <View style={s.mInput}><TextInput style={s.mInputText} value={editYear} onChangeText={setEditYear} placeholder="1990" placeholderTextColor={C.textTertiary} keyboardType="number-pad" maxLength={4} /></View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.mLabel}>Jinsi</Text>
                <View style={s.mGenderRow}>
                  <TouchableOpacity style={[s.mGenderBtn, editGender === 'erkak' && { backgroundColor: C.brand, borderColor: C.brand }]} onPress={() => setEditGender('erkak')}>
                    <Text style={[s.mGenderText, editGender === 'erkak' && { color: C.textInverse }]}>Erkak</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.mGenderBtn, editGender === 'ayol' && { backgroundColor: '#DB2777', borderColor: '#DB2777' }]} onPress={() => setEditGender('ayol')}>
                    <Text style={[s.mGenderText, editGender === 'ayol' && { color: C.textInverse }]}>Ayol</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity style={[s.mSaveBtn, !editFullName.trim() && { backgroundColor: C.border }]} onPress={saveProfile} disabled={!editFullName.trim()} activeOpacity={0.8}>
              <Text style={s.mSaveText}>Saqlash</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Add Family Modal ── */}
      <Modal visible={showAddFamily} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setShowAddFamily(false)}>
        <View style={s.mOverlay}>
          <View style={s.mSheet}>
            <View style={s.mHandle} />
            <View style={s.mHeader}>
              <Text style={s.mTitle}>Oila a'zosi qo'shish</Text>
              <TouchableOpacity style={s.mClose} onPress={() => setShowAddFamily(false)}>
                <Ionicons name="close" size={18} color={C.textTertiary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={s.mLabel}>Ismi</Text>
              <View style={s.mInput}><TextInput style={s.mInputText} value={fName} onChangeText={setFName} placeholder="Familiya Ism" placeholderTextColor={C.textTertiary} /></View>

              <Text style={s.mLabel}>Kim bo'ladi?</Text>
              <View style={s.relGrid}>
                {RELATIONS.map((r) => (
                  <TouchableOpacity key={r} style={[s.relChip, fRelation === r && s.relChipOn]} onPress={() => setFRelation(r)} activeOpacity={0.7}>
                    <Text style={[s.relChipText, fRelation === r && s.relChipTextOn]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={s.mRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.mLabel}>Tug'ilgan yil</Text>
                  <View style={s.mInput}><TextInput style={s.mInputText} value={fYear} onChangeText={setFYear} placeholder="2005" placeholderTextColor={C.textTertiary} keyboardType="number-pad" maxLength={4} /></View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.mLabel}>Jinsi</Text>
                  <View style={s.mGenderRow}>
                    <TouchableOpacity style={[s.mGenderBtn, fGender === 'erkak' && { backgroundColor: C.brand, borderColor: C.brand }]} onPress={() => setFGender('erkak')}>
                      <Text style={[s.mGenderText, fGender === 'erkak' && { color: C.textInverse }]}>Erkak</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.mGenderBtn, fGender === 'ayol' && { backgroundColor: '#DB2777', borderColor: '#DB2777' }]} onPress={() => setFGender('ayol')}>
                      <Text style={[s.mGenderText, fGender === 'ayol' && { color: C.textInverse }]}>Ayol</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity style={[s.mSaveBtn, (!fName.trim() || !fRelation) && { backgroundColor: C.border }]} onPress={handleAddFamily} disabled={!fName.trim() || !fRelation} activeOpacity={0.8}>
              <Text style={s.mSaveText}>Qo'shish</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { backgroundColor: C.card, paddingTop: 52, paddingBottom: SP.lg, paddingHorizontal: SP.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 40, height: 40, borderRadius: RADIUS.sm, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  body: { padding: SP.xl },

  // Profile card
  profileCard: { backgroundColor: C.card, borderRadius: RADIUS.md, padding: SP.xxl, alignItems: 'center', borderWidth: 1, borderColor: C.border, marginBottom: SP.lg },
  avatarLarge: { width: 72, height: 72, borderRadius: 24, backgroundColor: C.brandLight, justifyContent: 'center', alignItems: 'center', marginBottom: SP.md },
  profileName: { fontSize: 20, fontWeight: '700', color: C.text, marginBottom: SP.sm },
  profileHint: { fontSize: 12, color: C.textTertiary, textAlign: 'center', marginBottom: SP.md },
  profileMeta: { flexDirection: 'row', alignItems: 'center', gap: SP.md, marginBottom: SP.md },
  profileMetaText: { fontSize: 12, color: C.textTertiary, fontWeight: '500' },
  genderPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: C.bg, paddingHorizontal: SP.sm, paddingVertical: 2, borderRadius: 4 },
  genderPillText: { fontSize: 11, fontWeight: '600' },
  editProfileBtn: { flexDirection: 'row', alignItems: 'center', gap: SP.xs, backgroundColor: C.brandLight, paddingHorizontal: SP.lg, paddingVertical: SP.sm, borderRadius: RADIUS.sm },
  editProfileText: { fontSize: 13, fontWeight: '600', color: C.brand },
  fillProfileBtn: { flexDirection: 'row', alignItems: 'center', gap: SP.xs, backgroundColor: C.brand, paddingHorizontal: SP.lg, paddingVertical: SP.md, borderRadius: RADIUS.sm },
  fillProfileText: { fontSize: 13, fontWeight: '600', color: C.textInverse },

  // Stats
  statsRow: { flexDirection: 'row', backgroundColor: C.card, borderRadius: RADIUS.md, padding: SP.lg, borderWidth: 1, borderColor: C.border, marginBottom: SP.lg },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '700', color: C.text },
  statLabel: { fontSize: 10, color: C.textTertiary, fontWeight: '500', marginTop: 2 },
  statDiv: { width: 1, height: 30, backgroundColor: C.border },

  // MedCard status
  medCardStatus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.greenLight, borderRadius: RADIUS.md, padding: SP.lg, marginBottom: SP.lg, borderWidth: 1, borderColor: '#D1FAE5' },
  medCardLeft: { flexDirection: 'row', alignItems: 'center', gap: SP.md, flex: 1 },
  medCardIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.card, justifyContent: 'center', alignItems: 'center' },
  medCardTitle: { fontSize: 14, fontWeight: '600', color: C.green },
  medCardSub: { fontSize: 11, color: '#059669', marginTop: 1 },

  // Family
  secHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SP.md },
  secTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  secSub: { fontSize: 11, color: C.textTertiary, marginTop: 1 },
  addFamilyBtn: { width: 36, height: 36, borderRadius: RADIUS.sm, backgroundColor: C.brandLight, justifyContent: 'center', alignItems: 'center' },

  emptyFamily: { backgroundColor: C.card, borderRadius: RADIUS.md, padding: SP.xxl, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  emptyFamilyIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', marginBottom: SP.md },
  emptyFamilyTitle: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: SP.xs },
  emptyFamilySub: { fontSize: 12, color: C.textTertiary, textAlign: 'center' },

  familyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: RADIUS.md, padding: SP.lg, marginBottom: SP.sm, borderWidth: 1, borderColor: C.border },
  familyAvatar: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: SP.md },
  familyInfo: { flex: 1 },
  familyName: { fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 3 },
  familyMeta: { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  familyRelBadge: { backgroundColor: C.bg, paddingHorizontal: SP.sm, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: C.border },
  familyRelText: { fontSize: 10, fontWeight: '600', color: C.textTertiary },
  familyYear: { fontSize: 11, color: C.textTertiary },
  familyRemove: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.redLight, justifyContent: 'center', alignItems: 'center' },

  // Modal
  mOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  mSheet: { backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: SP.xl, paddingBottom: Platform.OS === 'ios' ? 36 : SP.xl, maxHeight: '80%' },
  mHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginTop: SP.sm, marginBottom: SP.lg },
  mHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SP.lg },
  mTitle: { fontSize: 20, fontWeight: '700', color: C.text },
  mClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  mLabel: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: SP.sm, marginTop: SP.md },
  mInput: { backgroundColor: C.bg, borderRadius: RADIUS.sm, paddingHorizontal: SP.md, borderWidth: 1, borderColor: C.border },
  mInputText: { fontSize: 14, color: C.text, paddingVertical: SP.md },
  mRow: { flexDirection: 'row', gap: SP.md },
  mGenderRow: { flexDirection: 'row', gap: SP.sm },
  mGenderBtn: { flex: 1, alignItems: 'center', paddingVertical: SP.md, borderRadius: RADIUS.sm, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg },
  mGenderText: { fontSize: 13, fontWeight: '600', color: C.text },
  mSaveBtn: { backgroundColor: C.brand, paddingVertical: SP.lg, borderRadius: RADIUS.md, alignItems: 'center', marginTop: SP.xl },
  mSaveText: { fontSize: 16, fontWeight: '600', color: C.textInverse },

  relGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm },
  relChip: { paddingHorizontal: SP.md, paddingVertical: SP.sm, borderRadius: RADIUS.sm, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg },
  relChipOn: { backgroundColor: C.brand, borderColor: C.brand },
  relChipText: { fontSize: 13, fontWeight: '600', color: C.text },
  relChipTextOn: { color: C.textInverse },
});
