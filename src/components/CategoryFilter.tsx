import React, { useCallback, useRef } from 'react';
import {
  Animated,
  FlatList,
  ListRenderItemInfo,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, SP } from '../theme';

// ─── Public types ───────────────────────────────────────
export interface CategoryItem {
  key: string;
  label: string;
  icon?: string;
  color: string;
  count?: number;
}

interface CategoryFilterProps {
  data: CategoryItem[];
  selected: string;
  onSelect: (key: string) => void;
  contentStyle?: ViewStyle;
}

// ─── Animated chip ──────────────────────────────────────
interface ChipProps {
  item: CategoryItem;
  active: boolean;
  onPress: () => void;
}

const Chip = React.memo<ChipProps>(
  function Chip({ item, active, onPress }) {
    const scale = useRef(new Animated.Value(1)).current;

    const animateTo = (v: number) =>
      Animated.spring(scale, {
        toValue: v,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();

    return (
      <Animated.View style={[{ transform: [{ scale }] }, active && st.shadow]}>
        <Pressable
          onPress={onPress}
          onPressIn={() => animateTo(0.94)}
          onPressOut={() => animateTo(1)}
          style={[st.chip, active ? st.chipOn : st.chipOff]}
        >
          {item.icon != null && (
            <Ionicons
              name={item.icon as any}
              size={15}
              color={active ? '#FFF' : item.color}
            />
          )}

          <Text
            style={[st.label, { color: active ? '#FFF' : C.text }]}
            numberOfLines={1}
          >
            {item.label}
          </Text>

          {item.count != null && (
            <View style={[st.badge, active ? st.badgeOn : st.badgeOff]}>
              <Text
                style={[
                  st.badgeText,
                  { color: active ? 'rgba(255,255,255,0.85)' : C.textTertiary },
                ]}
              >
                {item.count}
              </Text>
            </View>
          )}
        </Pressable>
      </Animated.View>
    );
  },
  (a, b) =>
    a.active === b.active &&
    a.item.key === b.item.key &&
    a.item.count === b.item.count,
);

// ─── Main component ─────────────────────────────────────
const extractKey = (i: CategoryItem) => i.key;

function CategoryFilter({
  data,
  selected,
  onSelect,
  contentStyle,
}: CategoryFilterProps) {
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<CategoryItem>) => (
      <Chip
        item={item}
        active={selected === item.key}
        onPress={() => onSelect(item.key)}
      />
    ),
    [selected, onSelect],
  );

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={extractKey}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={st.flatList}
      contentContainerStyle={[st.list, contentStyle]}
      initialNumToRender={data.length}
      maxToRenderPerBatch={data.length}
    />
  );
}

export default React.memo(CategoryFilter);

// ─── Styles ─────────────────────────────────────────────
const H = 38;

const st = StyleSheet.create({
  flatList: {
    flexShrink: 0,
    flexGrow: 0,
  },

  list: {
    paddingHorizontal: SP.xl,
    paddingTop: SP.md,
    paddingBottom: SP.lg,
    gap: 10,
  },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: H,
    paddingHorizontal: 14,
    borderRadius: H / 2,
    borderWidth: 1,
    gap: 6,
  },
  chipOn: {
    backgroundColor: C.brand,
    borderColor: C.brand,
  },
  chipOff: {
    backgroundColor: C.card,
    borderColor: C.border,
  },

  shadow: {
    shadowColor: C.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 5,
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 0,
  },

  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeOn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  badgeOff: {
    backgroundColor: C.bg,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
