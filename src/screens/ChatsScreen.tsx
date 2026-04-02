import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useApp, Booking, DoctorMessage } from '../context/AppContext';
import { SPECIALTY_CONFIG } from '../data/doctors';
import { C, RADIUS, SP } from '../theme';

export default function ChatsScreen() {
  const nav = useNavigation<any>();
  const { bookings, messages } = useApp();

  // Only show confirmed bookings that have messages
  const chats = bookings
    .filter((b) => b.status === 'confirmed')
    .map((b) => {
      const msgs = messages[b.id] || [];
      const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
      return { booking: b, lastMsg, unread: msgs.filter((m) => !m.isUser).length > 0 };
    })
    .sort((a, b) => {
      const aTime = a.lastMsg?.timestamp.getTime() || 0;
      const bTime = b.lastMsg?.timestamp.getTime() || 0;
      return bTime - aTime;
    });

  const getSpec = (sp: string) => SPECIALTY_CONFIG[sp] || { icon: 'medical-outline', color: C.textTertiary, bg: C.bg };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Hozir';
    if (mins < 60) return `${mins} daq`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} soat`;
    return date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });
  };

  const renderChat = ({ item }: { item: typeof chats[0] }) => {
    const sp = getSpec(item.booking.specialty);
    const preview = item.lastMsg
      ? (item.lastMsg.isUser ? 'Siz: ' : '') + item.lastMsg.text
      : 'Yangi suhbat';

    return (
      <TouchableOpacity
        style={s.chatCard}
        onPress={() => nav.navigate('DoctorChat', { booking: item.booking })}
        activeOpacity={0.7}
      >
        <View style={s.avatarWrap}>
          <View style={[s.avatar, { backgroundColor: sp.bg }]}>
            <Ionicons name={sp.icon as any} size={20} color={sp.color} />
          </View>
          <View style={s.onlineDot} />
        </View>

        <View style={s.chatMid}>
          <View style={s.chatNameRow}>
            <Text style={s.chatName} numberOfLines={1}>{item.booking.doctorName}</Text>
            <Text style={s.chatTime}>
              {item.lastMsg ? formatTime(item.lastMsg.timestamp) : ''}
            </Text>
          </View>
          <View style={s.chatPreviewRow}>
            <Text style={s.chatPreview} numberOfLines={1}>{preview}</Text>
            <View style={s.chatMeta}>
              <View style={[s.chatSpecBadge, { backgroundColor: sp.bg }]}>
                <Text style={[s.chatSpecText, { color: sp.color }]}>{item.booking.specialty}</Text>
              </View>
            </View>
          </View>
          <View style={s.chatInfoRow}>
            <Ionicons name="calendar-outline" size={11} color={C.textTertiary} />
            <Text style={s.chatInfoText}>{item.booking.days.length} kun · {item.booking.days[0]?.date}</Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={16} color={C.border} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.headerTitle}>Suhbatlar</Text>
            <Text style={s.headerSub}>{chats.length} ta faol chat</Text>
          </View>
          <View style={s.headerBadge}>
            <Ionicons name="chatbubbles-outline" size={20} color={C.brand} />
          </View>
        </View>
      </View>

      {chats.length === 0 ? (
        <View style={s.empty}>
          <View style={s.emptyIcon}>
            <Ionicons name="chatbubbles-outline" size={32} color={C.textTertiary} />
          </View>
          <Text style={s.emptyTitle}>Suhbatlar yo'q</Text>
          <Text style={s.emptyDesc}>
            Shifokorga yozilganingizda avtomatik suhbat ochiladi
          </Text>
          <TouchableOpacity
            style={s.emptyBtn}
            onPress={() => nav.navigate('DoctorsTab')}
            activeOpacity={0.7}
          >
            <Ionicons name="people-outline" size={16} color={C.brand} />
            <Text style={s.emptyBtnText}>Shifokor tanlash</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderChat}
          keyExtractor={(i) => i.booking.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    backgroundColor: C.card, paddingTop: 52, paddingBottom: SP.lg,
    paddingHorizontal: SP.xl, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: C.text, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: C.textTertiary, marginTop: 2 },
  headerBadge: {
    width: 44, height: 44, borderRadius: RADIUS.sm,
    backgroundColor: C.brandLight, justifyContent: 'center', alignItems: 'center',
  },

  list: { paddingTop: SP.sm },

  chatCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.card, paddingHorizontal: SP.xl, paddingVertical: SP.lg,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },

  avatarWrap: { position: 'relative', marginRight: SP.md },
  avatar: {
    width: 50, height: 50, borderRadius: RADIUS.md,
    justifyContent: 'center', alignItems: 'center',
  },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: C.green, borderWidth: 2, borderColor: C.card,
  },

  chatMid: { flex: 1, marginRight: SP.sm },
  chatNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  chatName: { fontSize: 15, fontWeight: '600', color: C.text, flex: 1, marginRight: SP.sm },
  chatTime: { fontSize: 11, color: C.textTertiary, fontWeight: '500' },

  chatPreviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SP.xs },
  chatPreview: { fontSize: 13, color: C.textTertiary, flex: 1, marginRight: SP.sm },
  chatMeta: { flexDirection: 'row' },
  chatSpecBadge: { paddingHorizontal: SP.sm, paddingVertical: 2, borderRadius: 4 },
  chatSpecText: { fontSize: 9, fontWeight: '600' },

  chatInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chatInfoText: { fontSize: 11, color: C.textTertiary },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: RADIUS.xl,
    backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center',
    marginBottom: SP.lg, borderWidth: 1, borderColor: C.border,
  },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: C.text, marginBottom: SP.xs },
  emptyDesc: { fontSize: 13, color: C.textTertiary, textAlign: 'center', lineHeight: 19, marginBottom: SP.xl },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SP.sm,
    backgroundColor: C.brandLight, paddingHorizontal: SP.xl, paddingVertical: SP.md,
    borderRadius: RADIUS.sm,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '600', color: C.brand },
});
