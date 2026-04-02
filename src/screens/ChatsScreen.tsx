import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { C, RADIUS, SP } from '../theme';
import { ApiChat, fetchPatientChats } from '../services/doctorChatService';
import { useAuth } from '../context/AuthContext';

export default function ChatsScreen() {
  const nav = useNavigation<any>();
  const { user } = useAuth();
  const [chats, setChats] = useState<ApiChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const pollRef = useRef<any>(null);
  const firstLoad = useRef(true);

  const loadChats = useCallback(async (showLoader = false) => {
    if (!user) return;
    if (showLoader) { setLoading(true); setError(''); }
    try {
      const data = await fetchPatientChats(user.username);
      setChats(data);
      if (showLoader) setError('');
    } catch (e: any) {
      if (showLoader) setError(e.message || 'Xatolik');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadChats(firstLoad.current);
      firstLoad.current = false;

      // 5s polling
      pollRef.current = setInterval(() => loadChats(false), 5000);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }, [loadChats]),
  );

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Hozir';
    if (mins < 60) return `${mins} daq`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} soat`;
    return date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });
  };

  const renderChat = ({ item }: { item: ApiChat }) => {
    const lastMsg = item.messages.length > 0 ? item.messages[item.messages.length - 1] : null;
    const unreadCount = item.messages.filter((m) => m.from === 'doctor' && !m.read).length;

    const preview = lastMsg
      ? (lastMsg.from === 'patient' ? 'Siz: ' : '') + lastMsg.text
      : 'Yangi suhbat';

    return (
      <TouchableOpacity
        style={s.chatCard}
        onPress={() => nav.navigate('DoctorChat', {
          chatId: item._id,
          doctorName: item.doctorName,
          patientUsername: item.patientUsername,
          patientName: item.patientName,
        })}
        activeOpacity={0.7}
      >
        <View style={s.avatarWrap}>
          <View style={s.avatar}>
            <Ionicons name="person-outline" size={20} color={C.brand} />
          </View>
          <View style={s.onlineDot} />
        </View>

        <View style={s.chatMid}>
          <View style={s.chatNameRow}>
            <Text style={s.chatName} numberOfLines={1}>{item.doctorName}</Text>
            <Text style={s.chatTime}>
              {lastMsg ? formatTime(lastMsg.timestamp) : ''}
            </Text>
          </View>
          <View style={s.chatPreviewRow}>
            <Text style={[s.chatPreview, unreadCount > 0 && s.chatPreviewBold]} numberOfLines={1}>
              {preview}
            </Text>
            {unreadCount > 0 && (
              <View style={s.unreadBadge}>
                <Text style={s.unreadText}>{unreadCount}</Text>
              </View>
            )}
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

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.brand} />
          <Text style={s.loadingText}>Yuklanmoqda...</Text>
        </View>
      ) : error ? (
        <View style={s.center}>
          <Ionicons name="cloud-offline-outline" size={32} color={C.red} />
          <Text style={s.emptyTitle}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => loadChats(true)} activeOpacity={0.7}>
            <Ionicons name="refresh" size={16} color={C.brand} />
            <Text style={s.retryText}>Qayta yuklash</Text>
          </TouchableOpacity>
        </View>
      ) : chats.length === 0 ? (
        <View style={s.center}>
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
          keyExtractor={(i) => i._id}
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
    backgroundColor: C.brandLight,
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

  chatPreviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chatPreview: { fontSize: 13, color: C.textTertiary, flex: 1, marginRight: SP.sm },
  chatPreviewBold: { color: C.text, fontWeight: '600' },

  unreadBadge: {
    minWidth: 20, height: 20, borderRadius: 10,
    backgroundColor: C.brand, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: { fontSize: 11, fontWeight: '700', color: C.textInverse },

  // Loading / Error / Empty
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  loadingText: { fontSize: 14, color: C.textTertiary, marginTop: SP.md },
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
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SP.sm,
    backgroundColor: C.brandLight, paddingHorizontal: SP.xl, paddingVertical: SP.md,
    borderRadius: RADIUS.sm, marginTop: SP.lg,
  },
  retryText: { fontSize: 14, fontWeight: '600', color: C.brand },
});
