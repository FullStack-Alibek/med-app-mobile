import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SPECIALTY_CONFIG } from '../data/doctors';
import { ApiDoctor, fetchDoctors } from '../services/doctorService';
import { C, RADIUS, SP } from '../theme';

// API spec nomlari bilan lokal config ni moslashtirish
const API_SPEC_MAP: Record<string, string> = {
  'Nevrolog': 'Nevropatolog',
  'Otorinolaringolog': 'LOR',
};

const getSpecConfig = (spec: string) => {
  const mapped = API_SPEC_MAP[spec];
  return SPECIALTY_CONFIG[spec] || SPECIALTY_CONFIG[mapped || ''] || { icon: 'medical-outline', color: C.textTertiary, bg: C.bg };
};

export default function DoctorsScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const [query, setQuery] = useState('');
  const [selSpec, setSelSpec] = useState('Barchasi');
  const [doctors, setDoctors] = useState<ApiDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const pollRef = useRef<any>(null);
  const firstLoad = useRef(true);

  const loadDoctors = useCallback(async (showLoader = false) => {
    if (showLoader) { setLoading(true); setError(''); }
    try {
      const data = await fetchDoctors();
      setDoctors(data);
      if (showLoader) setError('');
    } catch (e: any) {
      if (showLoader) setError(e.message || 'Xatolik yuz berdi');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDoctors(firstLoad.current);
      firstLoad.current = false;

      // 15s polling — online status yangilanishi uchun
      pollRef.current = setInterval(() => loadDoctors(false), 15000);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }, [loadDoctors]),
  );

  // AI dan kelgan specialty filtri
  useEffect(() => {
    if (route.params?.specialty && SPECIALTY_CONFIG[route.params.specialty]) {
      setSelSpec(route.params.specialty);
    }
  }, [route.params?.specialty]);

  // API dan kelgan noyob spec nomlari
  const apiSpecs = [...new Set(doctors.map((d) => d.spec))];
  const SPECS = ['Barchasi', ...apiSpecs];

  const filtered = doctors.filter((d) => {
    const matchQ = d.name.toLowerCase().includes(query.toLowerCase()) || d.spec.toLowerCase().includes(query.toLowerCase());
    const matchS = selSpec === 'Barchasi' || d.spec === selSpec;
    return matchQ && matchS;
  });

  const renderDoctor = ({ item }: { item: ApiDoctor }) => {
    const sp = getSpecConfig(item.spec);

    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => nav.navigate('DoctorDetail', { doctorId: item._id })}
        activeOpacity={0.7}
      >
        {/* Top section: avatar + name + chevron */}
        <View style={s.cardHeader}>
          <View style={[s.avatar, { backgroundColor: sp.bg }]}>
            <Ionicons name={sp.icon as any} size={22} color={sp.color} />
          </View>
          <View style={s.headerInfo}>
            <View style={s.nameRow}>
              <Text style={s.name} numberOfLines={1}>{item.name}</Text>
              <View style={[s.statusDot, { backgroundColor: item.online ? C.green : C.red }]} />
            </View>
            <View style={[s.specBadge, { backgroundColor: sp.bg }]}>
              <Ionicons name={sp.icon as any} size={10} color={sp.color} />
              <Text style={[s.specText, { color: sp.color }]}>{item.spec}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.border} />
        </View>

        {/* Divider */}
        <View style={s.divider} />

        {/* Bottom section: stats row */}
        <View style={s.statsRow}>
          <View style={s.stat}>
            <Ionicons name="star" size={13} color={C.amber} />
            <Text style={s.statVal}>{item.rating}</Text>
            <Text style={s.statLabel}>reyting</Text>
          </View>
          <View style={s.statSep} />
          <View style={s.stat}>
            <Ionicons name="time-outline" size={13} color={C.textTertiary} />
            <Text style={s.statVal}>{item.exp}</Text>
            <Text style={s.statLabel}>yil</Text>
          </View>
          <View style={s.statSep} />
          <View style={s.stat}>
            <Ionicons name="chatbubble-outline" size={13} color={C.textTertiary} />
            <Text style={s.statVal}>{item.reviews}</Text>
            <Text style={s.statLabel}>sharh</Text>
          </View>
          <View style={s.statSep} />
          <View style={s.stat}>
            <Text style={s.priceVal}>{(item.price / 1000).toFixed(0)}k</Text>
            <Text style={s.statLabel}>so'm</Text>
          </View>
        </View>

        {/* Tags */}
        {item.tags.length > 0 && (
          <View style={s.tagsRow}>
            {item.tags.slice(0, 3).map((tag, i) => (
              <View key={i} style={[s.tag, { backgroundColor: sp.bg }]}>
                <Text style={[s.tagText, { color: sp.color }]}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.headerTitle}>Shifokorlar</Text>
            <Text style={s.headerSub}>{filtered.length} ta mutaxassis topildi</Text>
          </View>
          <View style={s.headerBadge}>
            <Ionicons name="people-outline" size={20} color={C.brand} />
          </View>
        </View>

        {/* Search */}
        <View style={s.searchBar}>
          <Ionicons name="search-outline" size={18} color={C.textTertiary} />
          <TextInput
            style={s.searchInput}
            placeholder="Shifokor yoki mutaxassislik..."
            placeholderTextColor={C.textTertiary}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={C.borderDark} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories */}
      <View style={s.catSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.catRow}
        >
          {SPECS.map((sp) => {
            const active = selSpec === sp;
            const cfg = sp !== 'Barchasi' ? getSpecConfig(sp) : null as any;
            const docCount = sp === 'Barchasi'
              ? doctors.length
              : doctors.filter((d) => d.spec === sp).length;

            return (
              <TouchableOpacity
                key={sp}
                style={[s.catCard, active && s.catCardActive]}
                onPress={() => setSelSpec(sp)}
                activeOpacity={0.7}
              >
                <View style={[
                  s.catIconBox,
                  { backgroundColor: active ? 'rgba(255,255,255,0.2)' : (cfg?.bg || C.bg) },
                ]}>
                  <Ionicons
                    name={(sp === 'Barchasi' ? 'grid-outline' : cfg?.icon) as any}
                    size={18}
                    color={active ? C.textInverse : (cfg?.color || C.textTertiary)}
                  />
                </View>
                <Text
                  style={[s.catName, active && s.catNameActive]}
                  numberOfLines={1}
                >
                  {sp}
                </Text>
                <Text style={[s.catCount, active && s.catCountActive]}>
                  {docCount} shifokor
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.brand} />
          <Text style={s.loadingText}>Yuklanmoqda...</Text>
        </View>
      ) : error ? (
        <View style={s.center}>
          <View style={s.emptyIcon}>
            <Ionicons name="cloud-offline-outline" size={28} color={C.red} />
          </View>
          <Text style={s.emptyTitle}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => loadDoctors(true)} activeOpacity={0.7}>
            <Ionicons name="refresh" size={16} color={C.brand} />
            <Text style={s.retryText}>Qayta yuklash</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderDoctor}
          keyExtractor={(i) => i._id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.center}>
              <View style={s.emptyIcon}>
                <Ionicons name="search-outline" size={28} color={C.textTertiary} />
              </View>
              <Text style={s.emptyTitle}>Natija topilmadi</Text>
              <Text style={s.emptyDesc}>Boshqa mutaxassislikni tanlang</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    backgroundColor: C.card,
    paddingTop: 52,
    paddingBottom: SP.lg,
    paddingHorizontal: SP.xl,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SP.lg,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: C.text, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: C.textTertiary, marginTop: 2 },
  headerBadge: {
    width: 44, height: 44, borderRadius: RADIUS.sm,
    backgroundColor: C.brandLight,
    justifyContent: 'center', alignItems: 'center',
  },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bg, borderRadius: RADIUS.sm,
    paddingHorizontal: SP.md, height: 44, gap: SP.sm,
    borderWidth: 1, borderColor: C.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.text },

  // Categories
  catSection: {
    paddingTop: SP.lg,
    paddingBottom: SP.sm,
  },
  catRow: {
    paddingHorizontal: SP.xl,
    gap: SP.sm,
  },
  catCard: {
    width: 88,
    backgroundColor: C.card,
    borderRadius: RADIUS.md,
    paddingVertical: SP.md,
    paddingHorizontal: SP.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  catCardActive: {
    backgroundColor: C.brand,
    borderColor: C.brand,
  },
  catIconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SP.sm,
  },
  catName: {
    fontSize: 11,
    fontWeight: '600',
    color: C.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  catNameActive: {
    color: C.textInverse,
  },
  catCount: {
    fontSize: 10,
    fontWeight: '500',
    color: C.textTertiary,
  },
  catCountActive: {
    color: 'rgba(255,255,255,0.6)',
  },

  // List
  list: { padding: SP.xl, paddingTop: SP.md, paddingBottom: SP.xxl },

  // Doctor Card
  card: {
    backgroundColor: C.card,
    borderRadius: RADIUS.md,
    marginBottom: SP.md,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SP.lg,
  },
  avatar: {
    width: 50, height: 50,
    borderRadius: RADIUS.sm,
    justifyContent: 'center', alignItems: 'center',
    marginRight: SP.md,
  },
  headerInfo: { flex: 1 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.sm,
    marginBottom: SP.xs,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
    flex: 1,
  },
  statusDot: {
    width: 8, height: 8, borderRadius: 4,
  },
  specBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SP.sm,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  specText: { fontSize: 11, fontWeight: '600' },

  divider: {
    height: 1,
    backgroundColor: C.border,
    marginHorizontal: SP.lg,
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SP.md,
    paddingHorizontal: SP.lg,
  },
  stat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  statSep: {
    width: 1,
    height: 16,
    backgroundColor: C.border,
  },
  statVal: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text,
  },
  statLabel: {
    fontSize: 10,
    color: C.textTertiary,
    fontWeight: '500',
  },
  priceVal: {
    fontSize: 14,
    fontWeight: '700',
    color: C.brand,
  },

  // Tags
  tagsRow: {
    flexDirection: 'row',
    paddingHorizontal: SP.lg,
    paddingBottom: SP.md,
    gap: SP.xs,
  },
  tag: {
    paddingHorizontal: SP.sm,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
  },

  // Loading / Error / Empty
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  loadingText: { fontSize: 14, color: C.textTertiary, marginTop: SP.md },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center',
    marginBottom: SP.lg, borderWidth: 1, borderColor: C.border,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: C.text, marginBottom: SP.xs },
  emptyDesc: { fontSize: 13, color: C.textTertiary },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SP.sm,
    backgroundColor: C.brandLight, paddingHorizontal: SP.xl, paddingVertical: SP.md,
    borderRadius: RADIUS.sm, marginTop: SP.lg,
  },
  retryText: { fontSize: 14, fontWeight: '600', color: C.brand },
});
