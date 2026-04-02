import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { C } from '../theme';

import HomeScreen from '../screens/HomeScreen';
import RemindersScreen from '../screens/RemindersScreen';
import DeviceMarketScreen from '../screens/DeviceMarketScreen';
import HealthScreen from '../screens/HealthScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AIAssistantScreen from '../screens/AIAssistantScreen';
import DoctorsScreen from '../screens/DoctorsScreen';
import DoctorDetailScreen from '../screens/DoctorDetailScreen';
import PharmacyScreen from '../screens/PharmacyScreen';
import ChatsScreen from '../screens/ChatsScreen';
import DoctorChatScreen from '../screens/DoctorChatScreen';
import BookingsScreen from '../screens/BookingsScreen';
import PrescriptionsScreen from '../screens/PrescriptionsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Reminders" component={RemindersScreen} />
      <Stack.Screen name="DeviceMarket" component={DeviceMarketScreen} />
      <Stack.Screen name="Health" component={HealthScreen} />
      <Stack.Screen name="Bookings" component={BookingsScreen} />
      <Stack.Screen name="Prescriptions" component={PrescriptionsScreen} />
      <Stack.Screen name="DoctorChat" component={DoctorChatScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

function DoctorsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="DoctorsList" component={DoctorsScreen} />
      <Stack.Screen name="DoctorDetail" component={DoctorDetailScreen} />
    </Stack.Navigator>
  );
}

function ChatsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="ChatsList" component={ChatsScreen} />
      <Stack.Screen name="DoctorChat" component={DoctorChatScreen} />
    </Stack.Navigator>
  );
}

const TABS = [
  { name: 'HomeTab', label: 'Asosiy', comp: HomeStack, icon: 'home-outline' as const, iconOn: 'home' as const },
  { name: 'AIAssistant', label: 'MedAI', comp: AIAssistantScreen, icon: 'pulse-outline' as const, iconOn: 'pulse' as const },
  { name: 'DoctorsTab', label: 'Shifokorlar', comp: DoctorsStack, icon: 'people-outline' as const, iconOn: 'people' as const },
  { name: 'ChatsTab', label: 'Xabarlar', comp: ChatsStack, icon: 'chatbubble-outline' as const, iconOn: 'chatbubble' as const },
  { name: 'PharmacyTab', label: 'Apteka', comp: PharmacyScreen, icon: 'bag-handle-outline' as const, iconOn: 'bag-handle' as const },
];

export default function AppNavigator() {
  const { bookings, messages } = useApp();
  const insets = useSafeAreaInsets();
  const chatCount = bookings.filter((b) => b.status === 'confirmed' && (messages[b.id]?.length || 0) > 0).length;

  const TAB_HEIGHT = 56;
  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: TAB_HEIGHT + bottomPad,
          backgroundColor: C.card,
          borderTopWidth: 1,
          borderTopColor: C.border,
          paddingBottom: bottomPad,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: C.brand,
        tabBarInactiveTintColor: C.textTertiary,
        tabBarLabelStyle: st.label,
        tabBarIconStyle: st.iconStyle,
      }}
    >
      {TABS.map((t) => (
        <Tab.Screen
          key={t.name}
          name={t.name}
          component={t.comp}
          options={{
            tabBarLabel: t.label,
            tabBarIcon: ({ focused, color }) => {
              const badge = t.name === 'ChatsTab' && chatCount > 0 ? chatCount : 0;
              return (
                <View style={st.iconWrap}>
                  <Ionicons
                    name={focused ? t.iconOn : t.icon}
                    size={22}
                    color={color}
                  />
                  {badge > 0 && (
                    <View style={st.badge}>
                      <Text style={st.badgeText}>{badge}</Text>
                    </View>
                  )}
                </View>
              );
            },
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

const st = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 0,
  },
  iconStyle: {
    marginBottom: -2,
  },
  iconWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: C.red,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: C.card,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: C.textInverse,
  },
});
