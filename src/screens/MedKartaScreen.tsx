import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { C, RADIUS, SP } from '../theme';

const BLOOD_TYPES = ['I (O)', 'II (A)', 'III (B)', 'IV (AB)'];

export default function MedKartaScreen() {
  const { medCard, saveMedCard } = useApp();
  const hasMedCard = !!medCard.fullName;

  const [showEdit, setShowEdit] = useState(false);
  const [edit, setEdit] = useState(medCard);

  const openEdit = () => {
    setEdit({ ...medCard });
    setShowEdit(true);
  };

  const save = () => {
    saveMedCard({ ...edit, fullName: edit.fullName.trim() });
    setShowEdit(false);
  };

  const fields: { key: keyof typeof medCard; label: string; icon: string; iconColor: string; bg: string; placeholder: string; multiline?: boolean }[] = [
    { key: 'bloodType', label: 'Qon guruhi', icon: 'water', iconColor: '#EF4444', bg: '#FEF2F2', placeholder: 'Tanlang' },
    { key: 'allergies', label: 'Allergiyalar', icon: 'alert-circle', iconColor: '#F59E0B', bg: '#FFFBEB', placeholder: 'Allergiyalaringizni kiriting', multiline: true },
    { key: 'chronicDiseases', label: 'Surunkali kasalliklar', icon: 'heart', iconColor: '#EC4899', bg: '#FDF2F8', placeholder: 'Surunkali kasalliklarni kiriting', multiline: true },
    { key: 'currentMeds', label: 'Hozirgi dorilar', icon: 'medkit', iconColor: '#10B981', bg: '#ECFDF5', placeholder: 'Qabul qilayotgan dorilar', multiline: true },
    { key: 'complaints', label: 'Shikoyatlar', icon: 'clipboard', iconColor: '#6366F1', bg: '#EEF2FF', placeholder: 'Hozirgi shikoyatlaringiz', multiline: true },
  ];

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerIcon}>
          <Ionicons name="document-text" size={20} color={C.brand} />
        </View>
        <Text style={s.headerTitle}>Medkarta</Text>
        <TouchableOpacity style={s.editBtn} onPress={openEdit} activeOpacity={0.7}>
          <Ionicons name="create-outline" size={18} color={C.brand} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.body}>
        {/* Profile Summary */}
        <View style={s.profileCard}>
          <View style={s.avatar}>
            <Ionicons name="person" size={28} color={C.brand} />
          </View>
          {hasMedCard ? (
            <>
              <Text style={s.name}>{medCard.fullName}</Text>
              <View style={s.metaRow}>
                {medCard.birthYear ? <Text style={s.metaText}>{medCard.birthYear} yil</Text> : null}
                {medCard.gender ? (
                  <View style={[s.genderPill, { backgroundColor: medCard.gender === 'erkak' ? '#EFF6FF' : '#FDF2F8' }]}>
                    <Ionicons name={medCard.gender === 'erkak' ? 'male' : 'female'} size={11} color={medCard.gender === 'erkak' ? C.brand : '#DB2777'} />
                    <Text style={[s.genderText, { color: medCard.gender === 'erkak' ? C.brand : '#DB2777' }]}>
                      {medCard.gender === 'erkak' ? 'Erkak' : 'Ayol'}
                    </Text>
                  </View>
                ) : null}
                {medCard.bloodType ? (
                  <View style={[s.genderPill, { backgroundColor: '#FEF2F2' }]}>
                    <Ionicons name="water" size={11} color="#EF4444" />
                    <Text style={[s.genderText, { color: '#EF4444' }]}>{medCard.bloodType}</Text>
                  </View>
                ) : null}
              </View>
            </>
          ) : (
            <>
              <Text style={s.name}>Medkarta to'ldirilmagan</Text>
              <Text style={s.hint}>Ma'lumotlaringizni to'ldiring — shifokorlarga avtomatik yuboriladi</Text>
              <TouchableOpacity style={s.fillBtn} onPress={openEdit} activeOpacity={0.8}>
                <Ionicons name="add-circle-outline" size={16} color={C.textInverse} />
                <Text style={s.fillBtnText}>To'ldirish</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Status badge */}
        {hasMedCard && (
          <View style={s.statusBadge}>
            <Ionicons name="shield-checkmark" size={18} color={C.green} />
            <Text style={s.statusText}>Shifokorlarga avtomatik yuboriladi</Text>
            <Ionicons name="checkmark-circle" size={16} color={C.green} />
          </View>
        )}

        {/* Medical Info Cards */}
        {hasMedCard && (
          <>
            <Text style={s.secTitle}>Tibbiy ma'lumotlar</Text>
            {fields.map((f) => {
              const val = medCard[f.key];
              if (f.key === 'bloodType' || typeof val !== 'string') return null;
              return (
                <View key={f.key} style={s.infoCard}>
                  <View style={s.infoHeader}>
                    <View style={[s.infoIcon, { backgroundColor: f.bg }]}>
                      <Ionicons name={f.icon as any} size={16} color={f.iconColor} />
                    </View>
                    <Text style={s.infoLabel}>{f.label}</Text>
                  </View>
                  <Text style={s.infoValue}>{val || 'Ko\'rsatilmagan'}</Text>
                </View>
              );
            })}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={showEdit} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setShowEdit(false)}>
        <View style={s.mOverlay}>
          <View style={s.mSheet}>
            <View style={s.mHandle} />
            <View style={s.mHeader}>
              <Text style={s.mTitle}>Medkartani tahrirlash</Text>
              <TouchableOpacity style={s.mClose} onPress={() => setShowEdit(false)}>
                <Ionicons name="close" size={18} color={C.textTertiary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={s.mLabel}>To'liq ism</Text>
              <View style={s.mInput}>
                <TextInput style={s.mInputText} value={edit.fullName} onChangeText={(t) => setEdit({ ...edit, fullName: t })} placeholder="Familiya Ism" placeholderTextColor={C.textTertiary} />
              </View>

              <View style={s.mRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.mLabel}>Tug'ilgan yil</Text>
                  <View style={s.mInput}>
                    <TextInput style={s.mInputText} value={edit.birthYear} onChangeText={(t) => setEdit({ ...edit, birthYear: t })} placeholder="1990" placeholderTextColor={C.textTertiary} keyboardType="number-pad" maxLength={4} />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.mLabel}>Jinsi</Text>
                  <View style={s.mGenderRow}>
                    <TouchableOpacity style={[s.mGenderBtn, edit.gender === 'erkak' && { backgroundColor: C.brand, borderColor: C.brand }]} onPress={() => setEdit({ ...edit, gender: 'erkak' })}>
                      <Text style={[s.mGenderBtnText, edit.gender === 'erkak' && { color: C.textInverse }]}>Erkak</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.mGenderBtn, edit.gender === 'ayol' && { backgroundColor: '#DB2777', borderColor: '#DB2777' }]} onPress={() => setEdit({ ...edit, gender: 'ayol' })}>
                      <Text style={[s.mGenderBtnText, edit.gender === 'ayol' && { color: C.textInverse }]}>Ayol</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <Text style={s.mLabel}>Qon guruhi</Text>
              <View style={s.bloodRow}>
                {BLOOD_TYPES.map((bt) => (
                  <TouchableOpacity key={bt} style={[s.bloodChip, edit.bloodType === bt && s.bloodChipOn]} onPress={() => setEdit({ ...edit, bloodType: bt })} activeOpacity={0.7}>
                    <Text style={[s.bloodChipText, edit.bloodType === bt && s.bloodChipTextOn]}>{bt}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {fields.filter((f) => f.key !== 'bloodType').map((f) => (
                <View key={f.key}>
                  <Text style={s.mLabel}>{f.label}</Text>
                  <View style={[s.mInput, f.multiline && { minHeight: 72 }]}>
                    <TextInput
                      style={[s.mInputText, f.multiline && { textAlignVertical: 'top' }]}
                      value={edit[f.key] as string}
                      onChangeText={(t) => setEdit({ ...edit, [f.key]: t })}
                      placeholder={f.placeholder}
                      placeholderTextColor={C.textTertiary}
                      multiline={f.multiline}
                      numberOfLines={f.multiline ? 3 : 1}
                    />
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={[s.mSaveBtn, !edit.fullName.trim() && { backgroundColor: C.border }]} onPress={save} disabled={!edit.fullName.trim()} activeOpacity={0.8}>
              <Text style={s.mSaveText}>Saqlash</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: { backgroundColor: C.card, paddingTop: 52, paddingBottom: SP.lg, paddingHorizontal: SP.xl, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.border },
  headerIcon: { width: 40, height: 40, borderRadius: RADIUS.sm, backgroundColor: C.brandLight, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.text, flex: 1, marginLeft: SP.md },
  editBtn: { width: 40, height: 40, borderRadius: RADIUS.sm, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border },

  body: { padding: SP.xl },

  profileCard: { backgroundColor: C.card, borderRadius: RADIUS.md, padding: SP.xxl, alignItems: 'center', borderWidth: 1, borderColor: C.border, marginBottom: SP.lg },
  avatar: { width: 64, height: 64, borderRadius: 20, backgroundColor: C.brandLight, justifyContent: 'center', alignItems: 'center', marginBottom: SP.md },
  name: { fontSize: 18, fontWeight: '700', color: C.text, textAlign: 'center', marginBottom: SP.sm },
  hint: { fontSize: 12, color: C.textTertiary, textAlign: 'center', marginBottom: SP.md, paddingHorizontal: SP.xl },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: SP.sm, flexWrap: 'wrap', justifyContent: 'center' },
  metaText: { fontSize: 12, color: C.textTertiary, fontWeight: '500' },
  genderPill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: SP.sm, paddingVertical: 3, borderRadius: 6 },
  genderText: { fontSize: 11, fontWeight: '600' },
  fillBtn: { flexDirection: 'row', alignItems: 'center', gap: SP.xs, backgroundColor: C.brand, paddingHorizontal: SP.xl, paddingVertical: SP.md, borderRadius: RADIUS.sm },
  fillBtnText: { fontSize: 14, fontWeight: '600', color: C.textInverse },

  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: SP.sm, backgroundColor: '#ECFDF5', borderRadius: RADIUS.md, padding: SP.lg, marginBottom: SP.xl, borderWidth: 1, borderColor: '#D1FAE5' },
  statusText: { flex: 1, fontSize: 13, fontWeight: '500', color: '#059669' },

  secTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: SP.md },

  infoCard: { backgroundColor: C.card, borderRadius: RADIUS.md, padding: SP.lg, marginBottom: SP.sm, borderWidth: 1, borderColor: C.border },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: SP.sm, marginBottom: SP.sm },
  infoIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  infoLabel: { fontSize: 13, fontWeight: '600', color: C.textTertiary },
  infoValue: { fontSize: 14, color: C.text, lineHeight: 20, paddingLeft: 44 },

  // Modal
  mOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  mSheet: { backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: SP.xl, paddingBottom: Platform.OS === 'ios' ? 36 : SP.xl, maxHeight: '85%' },
  mHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginTop: SP.sm, marginBottom: SP.lg },
  mHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SP.md },
  mTitle: { fontSize: 20, fontWeight: '700', color: C.text },
  mClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  mLabel: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: SP.sm, marginTop: SP.md },
  mInput: { backgroundColor: C.bg, borderRadius: RADIUS.sm, paddingHorizontal: SP.md, borderWidth: 1, borderColor: C.border },
  mInputText: { fontSize: 14, color: C.text, paddingVertical: SP.md },
  mRow: { flexDirection: 'row', gap: SP.md },
  mGenderRow: { flexDirection: 'row', gap: SP.sm },
  mGenderBtn: { flex: 1, alignItems: 'center', paddingVertical: SP.md, borderRadius: RADIUS.sm, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg },
  mGenderBtnText: { fontSize: 13, fontWeight: '600', color: C.text },
  bloodRow: { flexDirection: 'row', gap: SP.sm },
  bloodChip: { flex: 1, alignItems: 'center', paddingVertical: SP.md, borderRadius: RADIUS.sm, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg },
  bloodChipOn: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  bloodChipText: { fontSize: 12, fontWeight: '600', color: C.text },
  bloodChipTextOn: { color: C.textInverse },
  mSaveBtn: { backgroundColor: C.brand, paddingVertical: SP.lg, borderRadius: RADIUS.md, alignItems: 'center', marginTop: SP.xl },
  mSaveText: { fontSize: 16, fontWeight: '600', color: C.textInverse },
});
