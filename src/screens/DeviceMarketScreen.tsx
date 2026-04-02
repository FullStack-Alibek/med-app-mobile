import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Dimensions, StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { devices, Device, DEVICE_CATEGORIES } from '../data/devices';
import { DeviceCartItem } from '../types';
import AppModal from '../components/AppModal';
import CategoryFilter, { CategoryItem } from '../components/CategoryFilter';
import { C, RADIUS, SP, SHADOW } from '../theme';

const W = Dimensions.get('window').width;

export default function DeviceMarketScreen() {
  const nav = useNavigation();
  const [selCat, setSelCat] = useState('all');
  const [cart, setCart] = useState<DeviceCartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [showStock, setShowStock] = useState(false);

  const filtered = selCat === 'all' ? devices : devices.filter((d) => d.category === selCat);

  // ── Cart helpers ──
  const addToCart = (device: Device) => {
    if (!device.inStock) { setShowStock(true); return; }
    setCart((prev) => {
      const existing = prev.find((i) => i.device.id === device.id);
      if (existing) return prev.map((i) => i.device.id === device.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { device, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.device.id === id);
      if (existing && existing.quantity > 1) return prev.map((i) => i.device.id === id ? { ...i, quantity: i.quantity - 1 } : i);
      return prev.filter((i) => i.device.id !== id);
    });
  };

  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = cart.reduce((sum, i) => sum + i.device.price * i.quantity, 0);
  const getQty = (id: string) => cart.find((c) => c.device.id === id)?.quantity ?? 0;

  const categoryData: CategoryItem[] = useMemo(
    () =>
      Object.entries(DEVICE_CATEGORIES).map(([key, cfg]) => ({
        key,
        label: cfg.label,
        icon: cfg.icon,
        color: cfg.color,
        count: key === 'all' ? devices.length : devices.filter((d) => d.category === key).length,
      })),
    [],
  );

  // ── Device card ──
  const renderDevice = ({ item }: { item: Device }) => {
    const catCfg = DEVICE_CATEGORIES[item.category];
    const discount = item.oldPrice ? Math.round((1 - item.price / item.oldPrice) * 100) : 0;
    const qty = getQty(item.id);
    const isOut = !item.inStock;

    return (
      <View style={[s.card, isOut && s.cardOut]}>
        {/* Image + Discount */}
        <View style={[s.cardImgBox, { backgroundColor: catCfg.bg }]}>
          <Text style={s.cardEmoji}>{item.image}</Text>
          {discount > 0 && (
            <View style={s.discBadge}>
              <Text style={s.discText}>-{discount}%</Text>
            </View>
          )}
          {isOut && (
            <View style={s.outBadge}>
              <Text style={s.outText}>Tugagan</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={s.cardBody}>
          <Text style={s.cardBrand}>{item.brand}</Text>
          <Text style={s.cardName} numberOfLines={2}>{item.name}</Text>

          <View style={s.cardCatRow}>
            <Ionicons name={catCfg.icon as any} size={11} color={catCfg.color} />
            <Text style={[s.cardCatLabel, { color: catCfg.color }]}>{catCfg.label}</Text>
          </View>

          {/* Features */}
          <View style={s.featRow}>
            {item.features.slice(0, 3).map((f, i) => (
              <View key={i} style={s.featChip}>
                <Text style={s.featText}>{f}</Text>
              </View>
            ))}
            {item.features.length > 3 && (
              <Text style={s.featMore}>+{item.features.length - 3}</Text>
            )}
          </View>

          {/* Rating */}
          <View style={s.ratingRow}>
            <Ionicons name="star" size={12} color={C.amber} />
            <Text style={s.ratingVal}>{item.rating}</Text>
            <Text style={s.ratingCount}>({item.reviews})</Text>
          </View>

          {/* Price + Cart button */}
          <View style={s.priceRow}>
            <View>
              <Text style={s.price}>{item.price.toLocaleString()} so'm</Text>
              {item.oldPrice && (
                <Text style={s.oldPrice}>{item.oldPrice.toLocaleString()}</Text>
              )}
            </View>
            {isOut ? (
              <View style={s.orderBtnOff}>
                <Ionicons name="ban-outline" size={15} color={C.textTertiary} />
              </View>
            ) : qty > 0 ? (
              <View style={s.qtyControl}>
                <TouchableOpacity style={s.qtyBtn} onPress={() => removeFromCart(item.id)} activeOpacity={0.6}>
                  <Ionicons name="remove" size={16} color={C.text} />
                </TouchableOpacity>
                <Text style={s.qtyNum}>{qty}</Text>
                <TouchableOpacity style={s.qtyBtn} onPress={() => addToCart(item)} activeOpacity={0.6}>
                  <Ionicons name="add" size={16} color={C.text} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={s.addBtn} onPress={() => addToCart(item)} activeOpacity={0.7}>
                <Ionicons name="cart-outline" size={15} color={C.textInverse} />
                <Text style={s.addBtnText}>Savatga</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  // ────────────── CART VIEW ──────────────
  if (showCart) {
    return (
      <View style={s.root}>
        <StatusBar barStyle="dark-content" backgroundColor={C.card} />
        <View style={s.cartHeader}>
          <TouchableOpacity style={s.cartBackBtn} onPress={() => setShowCart(false)}>
            <Ionicons name="arrow-back" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={s.cartTitle}>Savat</Text>
          <View style={s.cartCountChip}>
            <Text style={s.cartCountText}>{totalItems} ta</Text>
          </View>
        </View>

        {cart.length === 0 ? (
          <View style={s.emptyState}>
            <View style={s.emptyIcon}>
              <Ionicons name="cart-outline" size={32} color={C.textTertiary} />
            </View>
            <Text style={s.emptyTitle}>Savat bo'sh</Text>
            <Text style={s.emptyDesc}>Tibbiy qurilmalar qo'shing</Text>
          </View>
        ) : (
          <>
            <FlatList
              data={cart}
              keyExtractor={(i) => i.device.id}
              contentContainerStyle={s.cartList}
              renderItem={({ item }) => {
                const catCfg = DEVICE_CATEGORIES[item.device.category];
                const lineTotal = item.device.price * item.quantity;
                return (
                  <View style={s.cartItem}>
                    <View style={[s.cartItemIcon, { backgroundColor: catCfg.bg }]}>
                      <Text style={{ fontSize: 20 }}>{item.device.image}</Text>
                    </View>
                    <View style={s.cartItemMid}>
                      <Text style={s.cartItemName}>{item.device.name}</Text>
                      <Text style={s.cartItemSub}>
                        {item.device.price.toLocaleString()} x {item.quantity}
                      </Text>
                    </View>
                    <View style={s.cartItemRight}>
                      <Text style={s.cartItemTotal}>{lineTotal.toLocaleString()}</Text>
                      <View style={s.qtyControlSm}>
                        <TouchableOpacity style={s.qtyBtnSm} onPress={() => removeFromCart(item.device.id)}>
                          <Ionicons name="remove" size={14} color={C.text} />
                        </TouchableOpacity>
                        <Text style={s.qtyNumSm}>{item.quantity}</Text>
                        <TouchableOpacity style={s.qtyBtnSm} onPress={() => addToCart(item.device)}>
                          <Ionicons name="add" size={14} color={C.text} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              }}
            />

            {/* Cart summary */}
            <View style={s.cartSummary}>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Mahsulotlar ({totalItems})</Text>
                <Text style={s.summaryValue}>{totalPrice.toLocaleString()} so'm</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Yetkazib berish</Text>
                <Text style={[s.summaryValue, { color: C.green }]}>Bepul</Text>
              </View>
              <View style={s.summaryDivider} />
              <View style={s.summaryRow}>
                <Text style={s.summaryTotal}>Jami</Text>
                <Text style={s.summaryTotalVal}>{totalPrice.toLocaleString()} so'm</Text>
              </View>
              <TouchableOpacity style={s.checkoutBtn} onPress={() => setShowConfirm(true)} activeOpacity={0.8}>
                <Text style={s.checkoutBtnText}>Buyurtma berish</Text>
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
            { label: 'Yetkazish', value: 'Bepul (2-3 kun)' },
            { label: 'Jami summa', value: `${totalPrice.toLocaleString()} so'm` },
          ]}
          confirmText="Tasdiqlash" cancelText="Orqaga"
          onConfirm={() => { setShowConfirm(false); setCart([]); setShowCart(false); setTimeout(() => setShowDone(true), 300); }}
          onCancel={() => setShowConfirm(false)}
          onClose={() => setShowConfirm(false)}
        />
      </View>
    );
  }

  // ────────────── MAIN VIEW ──────────────
  return (
    <View style={s.root}>
      {/* Header */}
      <StatusBar barStyle="light-content" backgroundColor={C.dark} />
      <LinearGradient colors={[C.dark, C.darkSecondary]} style={s.header}>
        <View style={s.headerRow}>
          <TouchableOpacity style={s.backBtn} onPress={() => nav.goBack()}>
            <Ionicons name="arrow-back" size={20} color={C.textInverse} />
          </TouchableOpacity>
          <View style={s.headerMid}>
            <Text style={s.headerTitle}>Tibbiy qurilmalar</Text>
            <Text style={s.headerSub}>{devices.length} ta mahsulot</Text>
          </View>
          {totalItems > 0 && (
            <TouchableOpacity style={s.headerCartBtn} onPress={() => setShowCart(true)} activeOpacity={0.7}>
              <Ionicons name="cart-outline" size={20} color={C.textInverse} />
              <View style={s.headerCartBadge}>
                <Text style={s.headerCartBadgeText}>{totalItems}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Promo banner */}
        <View style={s.promo}>
          <View style={s.promoLeft}>
            <View style={s.promoBadge}>
              <Ionicons name="shield-checkmark" size={10} color={C.green} />
              <Text style={s.promoBadgeText}>Sertifikatlangan</Text>
            </View>
            <Text style={s.promoTitle}>Sog'ligingizni nazorat qiling</Text>
            <Text style={s.promoDesc}>Tibbiy qurilmalar bilan puls, bosim, uyqu va SpO2 ni real vaqtda kuzating</Text>
          </View>
          <Text style={s.promoEmoji}>🏥</Text>
        </View>
      </LinearGradient>

      {/* Categories */}
      <CategoryFilter data={categoryData} selected={selCat} onSelect={setSelCat} />

      {/* List */}
      <FlatList
        data={filtered}
        renderItem={renderDevice}
        keyExtractor={(i) => i.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="search-outline" size={28} color={C.textTertiary} />
            <Text style={s.emptyText}>Bu kategoriyada mahsulot topilmadi</Text>
          </View>
        }
      />

      {/* Floating cart bar */}
      {totalItems > 0 && (
        <TouchableOpacity style={s.floatingCart} onPress={() => setShowCart(true)} activeOpacity={0.9}>
          <View style={s.floatingLeft}>
            <View style={s.floatingBadge}>
              <Text style={s.floatingBadgeText}>{totalItems}</Text>
            </View>
            <Text style={s.floatingText}>Savatni ko'rish</Text>
          </View>
          <Text style={s.floatingPrice}>{totalPrice.toLocaleString()} so'm</Text>
        </TouchableOpacity>
      )}

      <AppModal visible={showStock} type="info" title="Mavjud emas" message="Bu qurilma hozirda omborda mavjud emas. Boshqa qurilmani tanlang yoki keyinroq urinib ko'ring." onClose={() => setShowStock(false)} />
      <AppModal visible={showDone} type="success" title="Buyurtma qabul qilindi" message="Tibbiy qurilmangiz 2-3 kun ichida yetkaziladi. Rahmat!" onClose={() => setShowDone(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header: { paddingTop: 48, paddingBottom: SP.lg, paddingHorizontal: SP.xl },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SP.lg },
  backBtn: { width: 40, height: 40, borderRadius: RADIUS.sm, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', marginRight: SP.md },
  headerMid: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: C.textInverse, letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: C.textTertiary, marginTop: 2 },
  headerCartBtn: {
    width: 44, height: 44, borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  headerCartBadge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: C.red, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4, borderWidth: 1.5, borderColor: C.dark,
  },
  headerCartBadgeText: { fontSize: 10, fontWeight: '700', color: C.textInverse },

  promo: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.md, padding: SP.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  promoLeft: { flex: 1 },
  promoBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginBottom: SP.sm },
  promoBadgeText: { fontSize: 10, color: C.green, fontWeight: '600' },
  promoTitle: { fontSize: 16, fontWeight: '700', color: C.textInverse, marginBottom: SP.xs },
  promoDesc: { fontSize: 11, color: C.textTertiary, lineHeight: 16 },
  promoEmoji: { fontSize: 36, marginLeft: SP.md },

  // List
  list: { paddingHorizontal: SP.xl, paddingBottom: 80 },

  // Card
  card: { backgroundColor: C.card, borderRadius: RADIUS.md, marginBottom: SP.md, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  cardOut: { opacity: 0.5 },
  cardImgBox: { height: 100, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  cardEmoji: { fontSize: 40 },
  discBadge: { position: 'absolute', top: SP.sm, left: SP.sm, backgroundColor: C.red, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  discText: { fontSize: 10, fontWeight: '700', color: C.textInverse },
  outBadge: { position: 'absolute', top: SP.sm, right: SP.sm, backgroundColor: C.border, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  outText: { fontSize: 10, fontWeight: '600', color: C.textTertiary },

  cardBody: { padding: SP.lg },
  cardBrand: { fontSize: 10, fontWeight: '600', color: C.textTertiary, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 },
  cardName: { fontSize: 15, fontWeight: '600', color: C.text, marginBottom: SP.sm, lineHeight: 21 },
  cardCatRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SP.sm },
  cardCatLabel: { fontSize: 11, fontWeight: '500' },

  featRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: SP.sm },
  featChip: { backgroundColor: C.bg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: C.border },
  featText: { fontSize: 9, fontWeight: '500', color: C.textSecondary },
  featMore: { fontSize: 9, color: C.textTertiary, fontWeight: '600', alignSelf: 'center', marginLeft: 2 },

  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SP.md },
  ratingVal: { fontSize: 12, fontWeight: '700', color: C.text },
  ratingCount: { fontSize: 11, color: C.textTertiary },

  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  price: { fontSize: 17, fontWeight: '700', color: C.text },
  oldPrice: { fontSize: 12, color: C.textTertiary, textDecorationLine: 'line-through', marginTop: 1 },

  // Add to cart button
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: SP.xs, backgroundColor: C.brand, paddingHorizontal: SP.md, paddingVertical: SP.sm, borderRadius: RADIUS.sm },
  addBtnText: { fontSize: 12, fontWeight: '600', color: C.textInverse },

  // Qty control in card
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

  // Out of stock button
  orderBtnOff: { padding: SP.sm, opacity: 0.4 },

  // Floating cart bar
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
    width: 44, height: 44, borderRadius: 10,
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

  // ── Empty states ──
  empty: { alignItems: 'center', paddingTop: 60, gap: SP.md },
  emptyText: { fontSize: 13, color: C.textTertiary },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: C.bg,
    justifyContent: 'center', alignItems: 'center', marginBottom: SP.lg,
    borderWidth: 1, borderColor: C.border,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: C.text, marginBottom: SP.xs },
  emptyDesc: { fontSize: 13, color: C.textTertiary },
});
