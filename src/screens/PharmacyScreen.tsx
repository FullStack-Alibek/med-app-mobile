import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { medicines, categories } from '../data/medicines';
import { Medicine, CartItem } from '../types';
import AppModal from '../components/AppModal';
import CategoryFilter, { CategoryItem } from '../components/CategoryFilter';
import { C, RADIUS, SHADOW, SP } from '../theme';

// AI Drug Interaction Database
const INTERACTIONS: Record<string, { with: string; warning: string }[]> = {
  'Paratsetamol': [{ with: 'Ibuprofen', warning: 'Bir vaqtda qabul qilish oshqozon shilliq qavatiga ta\'sir qilishi mumkin. 4+ soat oraliq tavsiya qilinadi.' }],
  'Ibuprofen': [{ with: 'Paratsetamol', warning: 'Bir vaqtda qabul qilish oshqozon shilliq qavatiga ta\'sir qilishi mumkin. 4+ soat oraliq tavsiya qilinadi.' }],
  'Amoksitsillin': [{ with: 'Omeprazol', warning: 'Omeprazol amoksitsillin samarasini oshirishi mumkin. Shifokor nazorati tavsiya qilinadi.' }],
  'Omeprazol': [{ with: 'Amoksitsillin', warning: 'Omeprazol amoksitsillin samarasini oshirishi mumkin. Shifokor nazorati tavsiya qilinadi.' }],
};

const CAT_CFG: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  'Barchasi': { icon: 'grid-outline', color: C.textTertiary, bg: C.bg },
  'Og\'riq qoldiruvchi': { icon: 'bandage-outline', color: '#D92D20', bg: '#FEF3F2' },
  'Antibiotik': { icon: 'flask-outline', color: C.purple, bg: C.purpleLight },
  'Oshqozon': { icon: 'fitness-outline', color: C.amber, bg: C.amberLight },
  'Allergiya': { icon: 'flower-outline', color: '#E04F16', bg: '#FEF6EE' },
  'Vitaminlar': { icon: 'leaf-outline', color: C.green, bg: C.greenLight },
};

export default function PharmacyScreen() {
  const [query, setQuery] = useState('');
  const [selCat, setSelCat] = useState('Barchasi');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showStock, setShowStock] = useState(false);
  const [showInteraction, setShowInteraction] = useState(false);
  const [interactionMsg, setInteractionMsg] = useState('');

  const filtered = medicines.filter((m) => {
    const matchQ = m.name.toLowerCase().includes(query.toLowerCase()) ||
      m.description.toLowerCase().includes(query.toLowerCase());
    const matchC = selCat === 'Barchasi' || m.category === selCat;
    return matchQ && matchC;
  });

  const checkInteraction = (med: Medicine): string | null => {
    const interactions = INTERACTIONS[med.name];
    if (!interactions) return null;
    for (const inter of interactions) {
      if (cart.some((c) => c.medicine.name === inter.with)) {
        return `⚠️ AI ogohlantirish: ${med.name} + ${inter.with}\n\n${inter.warning}`;
      }
    }
    return null;
  };

  const addToCart = (med: Medicine) => {
    if (!med.inStock) { setShowStock(true); return; }
    const warning = checkInteraction(med);
    if (warning && getQty(med.id) === 0) {
      setInteractionMsg(warning);
      setShowInteraction(true);
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.medicine.id === med.id);
      if (existing) return prev.map((i) => i.medicine.id === med.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { medicine: med, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.medicine.id === id);
      if (existing && existing.quantity > 1) return prev.map((i) => i.medicine.id === id ? { ...i, quantity: i.quantity - 1 } : i);
      return prev.filter((i) => i.medicine.id !== id);
    });
  };

  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = cart.reduce((sum, i) => sum + i.medicine.price * i.quantity, 0);
  const getQty = (id: string) => cart.find((c) => c.medicine.id === id)?.quantity ?? 0;
  const getCfg = (cat: string) => CAT_CFG[cat] || { icon: 'medical-outline' as const, color: C.textTertiary, bg: C.bg };

  const categoryData: CategoryItem[] = useMemo(
    () =>
      categories.map((cat) => {
        const cfg = CAT_CFG[cat] || { icon: 'grid-outline', color: C.textTertiary };
        return {
          key: cat,
          label: cat,
          icon: cfg.icon as string,
          color: cfg.color,
          count: cat === 'Barchasi' ? medicines.length : medicines.filter((m) => m.category === cat).length,
        };
      }),
    [],
  );

  // ────────────── MEDICINE CARD ──────────────
  const renderMedicine = ({ item }: { item: Medicine }) => {
    const qty = getQty(item.id);
    const cfg = getCfg(item.category);
    const isOut = !item.inStock;

    return (
      <View style={[st.medCard, isOut && st.medCardOut]}>
        {/* Header row */}
        <View style={st.medHeader}>
          <View style={[st.medIcon, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon} size={20} color={cfg.color} />
          </View>
          <View style={st.medMeta}>
            <Text style={st.medName}>{item.name}</Text>
            <View style={st.medSubRow}>
              <View style={[st.catBadge, { backgroundColor: cfg.bg }]}>
                <Text style={[st.catBadgeText, { color: cfg.color }]}>{item.category}</Text>
              </View>
              {isOut && (
                <View style={st.outBadge}>
                  <Text style={st.outBadgeText}>Mavjud emas</Text>
                </View>
              )}
            </View>
          </View>
          <View style={st.medPriceCol}>
            <Text style={st.medPrice}>{item.price.toLocaleString()}</Text>
            <Text style={st.medPriceUnit}>so'm</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={st.medDesc}>{item.description}</Text>

        {/* Footer */}
        <View style={st.medFooter}>
          <View style={st.mfgRow}>
            <Ionicons name="business-outline" size={12} color={C.textTertiary} />
            <Text style={st.mfgText}>{item.manufacturer}</Text>
          </View>

          {isOut ? (
            <View style={st.outLabel}>
              <Ionicons name="ban-outline" size={14} color={C.textTertiary} />
            </View>
          ) : qty > 0 ? (
            <View style={st.qtyControl}>
              <TouchableOpacity style={st.qtyBtn} onPress={() => removeFromCart(item.id)} activeOpacity={0.6}>
                <Ionicons name="remove" size={16} color={C.text} />
              </TouchableOpacity>
              <Text style={st.qtyNum}>{qty}</Text>
              <TouchableOpacity style={st.qtyBtn} onPress={() => addToCart(item)} activeOpacity={0.6}>
                <Ionicons name="add" size={16} color={C.text} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={st.addBtn} onPress={() => addToCart(item)} activeOpacity={0.7}>
              <Ionicons name="cart-outline" size={15} color={C.brand} />
              <Text style={st.addBtnText}>Savatga</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // ────────────── CART VIEW ──────────────
  if (showCart) {
    return (
      <View style={st.root}>
        {/* Cart header */}
        <View style={st.cartHeader}>
          <TouchableOpacity style={st.cartBackBtn} onPress={() => setShowCart(false)}>
            <Ionicons name="arrow-back" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={st.cartTitle}>Savat</Text>
          <View style={st.cartCountChip}>
            <Text style={st.cartCountText}>{totalItems} ta</Text>
          </View>
        </View>

        {cart.length === 0 ? (
          <View style={st.emptyState}>
            <View style={st.emptyIcon}>
              <Ionicons name="cart-outline" size={32} color={C.textTertiary} />
            </View>
            <Text style={st.emptyTitle}>Savat bo'sh</Text>
            <Text style={st.emptyDesc}>Aptekadan dori-darmonlar qo'shing</Text>
          </View>
        ) : (
          <>
            <FlatList
              data={cart}
              keyExtractor={(i) => i.medicine.id}
              contentContainerStyle={st.cartList}
              renderItem={({ item }) => {
                const cfg = getCfg(item.medicine.category);
                const lineTotal = item.medicine.price * item.quantity;
                return (
                  <View style={st.cartItem}>
                    <View style={[st.cartItemIcon, { backgroundColor: cfg.bg }]}>
                      <Ionicons name={cfg.icon} size={16} color={cfg.color} />
                    </View>
                    <View style={st.cartItemMid}>
                      <Text style={st.cartItemName}>{item.medicine.name}</Text>
                      <Text style={st.cartItemSub}>
                        {item.medicine.price.toLocaleString()} x {item.quantity}
                      </Text>
                    </View>
                    <View style={st.cartItemRight}>
                      <Text style={st.cartItemTotal}>{lineTotal.toLocaleString()}</Text>
                      <View style={st.qtyControlSm}>
                        <TouchableOpacity style={st.qtyBtnSm} onPress={() => removeFromCart(item.medicine.id)}>
                          <Ionicons name="remove" size={14} color={C.text} />
                        </TouchableOpacity>
                        <Text style={st.qtyNumSm}>{item.quantity}</Text>
                        <TouchableOpacity style={st.qtyBtnSm} onPress={() => addToCart(item.medicine)}>
                          <Ionicons name="add" size={14} color={C.text} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              }}
            />

            {/* Cart summary */}
            <View style={st.cartSummary}>
              <View style={st.summaryRow}>
                <Text style={st.summaryLabel}>Mahsulotlar ({totalItems})</Text>
                <Text style={st.summaryValue}>{totalPrice.toLocaleString()} so'm</Text>
              </View>
              <View style={st.summaryRow}>
                <Text style={st.summaryLabel}>Yetkazib berish</Text>
                <Text style={[st.summaryValue, { color: C.green }]}>Bepul</Text>
              </View>
              <View style={st.summaryDivider} />
              <View style={st.summaryRow}>
                <Text style={st.summaryTotal}>Jami</Text>
                <Text style={st.summaryTotalVal}>{totalPrice.toLocaleString()} so'm</Text>
              </View>
              <TouchableOpacity style={st.checkoutBtn} onPress={() => setShowConfirm(true)} activeOpacity={0.8}>
                <Text style={st.checkoutBtnText}>Buyurtma berish</Text>
                <Ionicons name="arrow-forward" size={18} color={C.textInverse} />
              </TouchableOpacity>
            </View>
          </>
        )}

        <AppModal
          visible={showConfirm} type="confirm" title="Buyurtmani tasdiqlang"
          message="Barcha ma'lumotlarni tekshiring va tasdiqlang."
          details={[
            { label: 'Mahsulotlar', value: `${totalItems} ta` },
            { label: 'Yetkazish', value: 'Bepul' },
            { label: 'Jami summa', value: `${totalPrice.toLocaleString()} so'm` },
          ]}
          confirmText="Tasdiqlash" cancelText="Orqaga"
          onConfirm={() => { setShowConfirm(false); setCart([]); setShowCart(false); setTimeout(() => setShowSuccess(true), 300); }}
          onCancel={() => setShowConfirm(false)}
          onClose={() => setShowConfirm(false)}
        />
      </View>
    );
  }

  // ────────────── MAIN VIEW ──────────────
  return (
    <View style={st.root}>
      {/* Header */}
      <View style={st.header}>
        <View style={st.headerTop}>
          <View>
            <Text style={st.headerTitle}>Apteka</Text>
            <Text style={st.headerSub}>{filtered.length} ta dori topildi</Text>
          </View>
          {totalItems > 0 && (
            <TouchableOpacity style={st.cartHeaderBtn} onPress={() => setShowCart(true)} activeOpacity={0.7}>
              <Ionicons name="cart-outline" size={20} color={C.brand} />
              <View style={st.cartHeaderBadge}>
                <Text style={st.cartHeaderBadgeText}>{totalItems}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Search */}
        <View style={st.searchBar}>
          <Ionicons name="search-outline" size={18} color={C.textTertiary} />
          <TextInput
            style={st.searchInput}
            placeholder="Dori nomi yoki tavsifi..."
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
      <CategoryFilter data={categoryData} selected={selCat} onSelect={setSelCat} />

      {/* Medicine list */}
      <FlatList
        data={filtered}
        renderItem={renderMedicine}
        keyExtractor={(i) => i.id}
        contentContainerStyle={st.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={st.emptyState}>
            <View style={st.emptyIcon}>
              <Ionicons name="search-outline" size={28} color={C.textTertiary} />
            </View>
            <Text style={st.emptyTitle}>Hech narsa topilmadi</Text>
            <Text style={st.emptyDesc}>Boshqa kalit so'z yoki kategoriya tanlang</Text>
          </View>
        }
      />

      {/* Floating cart bar */}
      {totalItems > 0 && !showCart && (
        <TouchableOpacity style={st.floatingCart} onPress={() => setShowCart(true)} activeOpacity={0.9}>
          <View style={st.floatingLeft}>
            <View style={st.floatingBadge}>
              <Text style={st.floatingBadgeText}>{totalItems}</Text>
            </View>
            <Text style={st.floatingText}>Savatni ko'rish</Text>
          </View>
          <Text style={st.floatingPrice}>{totalPrice.toLocaleString()} so'm</Text>
        </TouchableOpacity>
      )}

      <AppModal visible={showStock} type="info" title="Mavjud emas" message="Bu dori hozirda omborda mavjud emas. Boshqa dorini tanlang yoki keyinroq urinib ko'ring." onClose={() => setShowStock(false)} />
      <AppModal visible={showSuccess} type="success" title="Buyurtma qabul qilindi" message="Buyurtmangiz muvaffaqiyatli ro'yxatga olindi. Tez orada yetkazib beriladi." onClose={() => setShowSuccess(false)} />
      <AppModal visible={showInteraction} type="info" title="AI Dori ta'siri tekshiruvi" message={interactionMsg} onClose={() => setShowInteraction(false)} />
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // ── Header ──
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
  cartHeaderBtn: {
    width: 44, height: 44, borderRadius: RADIUS.sm,
    backgroundColor: C.brandLight, justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  cartHeaderBadge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: C.brand, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4, borderWidth: 1.5, borderColor: C.card,
  },
  cartHeaderBadgeText: { fontSize: 10, fontWeight: '700', color: C.textInverse },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bg, borderRadius: RADIUS.sm,
    paddingHorizontal: SP.md, height: 44, gap: SP.sm,
    borderWidth: 1, borderColor: C.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.text },

  // ── Medicine list ──
  list: { padding: SP.xl, paddingTop: SP.md, paddingBottom: SP.xxl },

  medCard: {
    backgroundColor: C.card, borderRadius: RADIUS.md,
    padding: SP.lg, marginBottom: SP.sm,
    borderWidth: 1, borderColor: C.border,
  },
  medCardOut: { opacity: 0.5 },

  medHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SP.md },
  medIcon: {
    width: 44, height: 44, borderRadius: RADIUS.sm,
    justifyContent: 'center', alignItems: 'center', marginRight: SP.md,
  },
  medMeta: { flex: 1 },
  medName: { fontSize: 15, fontWeight: '600', color: C.text, marginBottom: SP.xs },
  medSubRow: { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  catBadge: { paddingHorizontal: SP.sm, paddingVertical: 2, borderRadius: 6 },
  catBadgeText: { fontSize: 10, fontWeight: '600' },
  outBadge: { paddingHorizontal: SP.sm, paddingVertical: 2, borderRadius: 6, backgroundColor: C.redLight },
  outBadgeText: { fontSize: 10, fontWeight: '600', color: C.red },

  medPriceCol: { alignItems: 'flex-end' },
  medPrice: { fontSize: 16, fontWeight: '700', color: C.text },
  medPriceUnit: { fontSize: 10, color: C.textTertiary, fontWeight: '500' },

  medDesc: { fontSize: 13, color: C.textSecondary, lineHeight: 20, marginBottom: SP.md },

  medFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: SP.md, borderTopWidth: 1, borderTopColor: C.border,
  },
  mfgRow: { flexDirection: 'row', alignItems: 'center', gap: SP.xs },
  mfgText: { fontSize: 11, color: C.textTertiary },

  outLabel: { opacity: 0.4 },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SP.xs,
    backgroundColor: C.brandLight, paddingHorizontal: SP.md, paddingVertical: SP.sm,
    borderRadius: RADIUS.xs,
  },
  addBtnText: { fontSize: 13, fontWeight: '600', color: C.brand },

  qtyControl: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bg, borderRadius: RADIUS.xs, padding: 3,
    borderWidth: 1, borderColor: C.border,
  },
  qtyBtn: {
    width: 30, height: 30, justifyContent: 'center', alignItems: 'center',
    backgroundColor: C.card, borderRadius: 6,
  },
  qtyNum: { fontSize: 14, fontWeight: '700', marginHorizontal: SP.md, color: C.text },

  // ── Floating cart ──
  floatingCart: {
    position: 'absolute', bottom: SP.lg,
    left: SP.xl, right: SP.xl,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.brand, borderRadius: RADIUS.md,
    paddingHorizontal: SP.lg, paddingVertical: SP.md,
    ...SHADOW.lg,
  },
  floatingLeft: { flexDirection: 'row', alignItems: 'center', gap: SP.md },
  floatingBadge: {
    minWidth: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: SP.xs,
  },
  floatingBadgeText: { fontSize: 12, fontWeight: '700', color: C.textInverse },
  floatingText: { fontSize: 14, fontWeight: '600', color: C.textInverse },
  floatingPrice: { fontSize: 15, fontWeight: '700', color: C.textInverse },

  // ── Cart view ──
  cartHeader: {
    backgroundColor: C.card, paddingTop: 52, paddingBottom: SP.md,
    paddingHorizontal: SP.xl, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: C.border,
  },
  cartBackBtn: {
    width: 40, height: 40, borderRadius: RADIUS.sm,
    backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  cartTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  cartCountChip: {
    backgroundColor: C.brandLight, paddingHorizontal: SP.md, paddingVertical: SP.xs,
    borderRadius: RADIUS.full,
  },
  cartCountText: { fontSize: 12, fontWeight: '600', color: C.brand },

  cartList: { padding: SP.xl },
  cartItem: {
    backgroundColor: C.card, borderRadius: RADIUS.md, padding: SP.lg,
    marginBottom: SP.sm, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  cartItemIcon: {
    width: 40, height: 40, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginRight: SP.md,
  },
  cartItemMid: { flex: 1 },
  cartItemName: { fontSize: 14, fontWeight: '600', color: C.text },
  cartItemSub: { fontSize: 12, color: C.textTertiary, marginTop: 2 },
  cartItemRight: { alignItems: 'flex-end', gap: SP.sm },
  cartItemTotal: { fontSize: 14, fontWeight: '700', color: C.text },

  qtyControlSm: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bg, borderRadius: 6, padding: 2,
    borderWidth: 1, borderColor: C.border,
  },
  qtyBtnSm: {
    width: 26, height: 26, justifyContent: 'center', alignItems: 'center',
    backgroundColor: C.card, borderRadius: 5,
  },
  qtyNumSm: { fontSize: 13, fontWeight: '700', marginHorizontal: SP.sm, color: C.text },

  // ── Cart summary ──
  cartSummary: {
    backgroundColor: C.card, paddingHorizontal: SP.xl,
    paddingTop: SP.xl, paddingBottom: SP.xl,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SP.sm },
  summaryLabel: { fontSize: 14, color: C.textTertiary },
  summaryValue: { fontSize: 14, fontWeight: '500', color: C.text },
  summaryDivider: { height: 1, backgroundColor: C.border, marginVertical: SP.md },
  summaryTotal: { fontSize: 16, fontWeight: '700', color: C.text },
  summaryTotalVal: { fontSize: 16, fontWeight: '700', color: C.text },
  checkoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.brand, borderRadius: RADIUS.md,
    paddingVertical: SP.lg, marginTop: SP.lg, gap: SP.sm,
  },
  checkoutBtnText: { fontSize: 16, fontWeight: '600', color: C.textInverse },

  // ── Empty ──
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: C.bg,
    justifyContent: 'center', alignItems: 'center', marginBottom: SP.lg,
    borderWidth: 1, borderColor: C.border,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: C.text, marginBottom: SP.xs },
  emptyDesc: { fontSize: 13, color: C.textTertiary },
});
