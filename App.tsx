import React, { useState, useEffect, useRef } from 'react';
import { StatusBar, View, Text, StyleSheet, Animated } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/context/AppContext';
import { AuthProvider } from './src/context/AuthContext';
import { CallProvider } from './src/context/CallContext';
import AppLogo from './src/components/AppLogo';
import AppNavigator from './src/navigation/AppNavigator';

function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => onFinish());
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={splash.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1B6EF3" />
      <Animated.View style={[splash.content, { opacity, transform: [{ scale }] }]}>
        <View style={splash.logoWrap}>
          <AppLogo size={80} />
        </View>
        <Text style={splash.title}>Med Expert</Text>
        <Text style={splash.sub}>Sog'liqni saqlash ilovasi</Text>
      </Animated.View>
    </View>
  );
}

const splash = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1B6EF3', justifyContent: 'center', alignItems: 'center' },
  content: { alignItems: 'center' },
  logoWrap: { width: 96, height: 96, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 32, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.5 },
  sub: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 6 },
});

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <AuthProvider>
        <AppProvider>
          <CallProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </CallProvider>
        </AppProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
