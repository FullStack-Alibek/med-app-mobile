import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, RADIUS } from '../theme';

type ModalType = 'success' | 'error' | 'confirm' | 'info';

interface Props {
  visible: boolean;
  type: ModalType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose: () => void;
  details?: { label: string; value: string }[];
}

const CFG: Record<ModalType, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  success: { icon: 'checkmark-circle', color: C.green, bg: C.greenLight },
  error: { icon: 'alert-circle', color: C.red, bg: C.redLight },
  confirm: { icon: 'help-circle', color: C.brand, bg: C.brandLight },
  info: { icon: 'information-circle', color: C.purple, bg: C.purpleLight },
};

export default function AppModal({ visible, type, title, message, confirmText = 'Tasdiqlash', cancelText = 'Bekor qilish', onConfirm, onCancel, onClose, details }: Props) {
  const c = CFG[type];
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.box}>
          <View style={[s.iconCircle, { backgroundColor: c.bg }]}>
            <Ionicons name={c.icon} size={36} color={c.color} />
          </View>
          <Text style={s.title}>{title}</Text>
          <Text style={s.msg}>{message}</Text>
          {details && details.length > 0 && (
            <View style={s.detailsBox}>
              {details.map((d, i) => (
                <View key={i} style={s.detailRow}>
                  <Text style={s.detailLabel}>{d.label}</Text>
                  <Text style={s.detailValue}>{d.value}</Text>
                </View>
              ))}
            </View>
          )}
          <View style={s.btnRow}>
            {type === 'confirm' && onCancel && (
              <TouchableOpacity style={s.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
                <Text style={s.cancelBtnText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[s.confirmBtn, { backgroundColor: c.color }, type === 'confirm' && onCancel ? { flex: 1 } : { width: '100%' }]}
              onPress={onConfirm || onClose} activeOpacity={0.7}
            >
              <Text style={s.confirmBtnText}>{type === 'confirm' ? confirmText : 'Tushunarli'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(10,13,20,0.6)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 },
  box: { width: '100%', backgroundColor: C.card, borderRadius: RADIUS.xl, padding: 28, alignItems: 'center' },
  iconCircle: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '700', color: C.text, textAlign: 'center', marginBottom: 8 },
  msg: { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 16 },
  detailsBox: { width: '100%', backgroundColor: C.bg, borderRadius: RADIUS.md, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: C.border },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  detailLabel: { fontSize: 13, color: C.textTertiary, fontWeight: '500' },
  detailValue: { fontSize: 13, color: C.text, fontWeight: '600' },
  btnRow: { flexDirection: 'row', width: '100%', gap: 10 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: RADIUS.md, backgroundColor: C.bg, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: C.textSecondary },
  confirmBtn: { paddingVertical: 14, borderRadius: RADIUS.md, alignItems: 'center' },
  confirmBtnText: { fontSize: 15, fontWeight: '600', color: C.textInverse },
});
