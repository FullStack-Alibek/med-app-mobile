import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { AuthError } from '../services/authService';
import AppLogo from '../components/AppLogo';
import { C, RADIUS, SP } from '../theme';

export default function LoginScreen({ onGoRegister }: { onGoRegister: () => void }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Barcha maydonlarni to'ldiring");
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (e: any) {
      setError(e instanceof AuthError ? e.message : 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={s.logoSection}>
          <AppLogo size={64} />
          <Text style={s.logoText}>Med Expert</Text>
          <Text style={s.logoSub}>Tibbiy yordamchi ilovangiz</Text>
        </View>

        {/* Form */}
        <View style={s.card}>
          <Text style={s.title}>Kirish</Text>
          <Text style={s.subtitle}>Hisobingizga kiring</Text>

          {error ? (
            <View style={s.errorBox}>
              <Ionicons name="alert-circle" size={16} color={C.red} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={s.label}>Username</Text>
          <View style={s.inputBox}>
            <Ionicons name="person-outline" size={18} color={C.textTertiary} />
            <TextInput
              style={s.input}
              value={username}
              onChangeText={setUsername}
              placeholder="username"
              placeholderTextColor={C.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Text style={s.label}>Parol</Text>
          <View style={s.inputBox}>
            <Ionicons name="lock-closed-outline" size={18} color={C.textTertiary} />
            <TextInput
              style={s.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Parolingiz"
              placeholderTextColor={C.textTertiary}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.textTertiary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[s.btn, loading && s.btnOff]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={C.textInverse} />
            ) : (
              <Text style={s.btnText}>Kirish</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Register link */}
        <View style={s.footer}>
          <Text style={s.footerText}>Hisobingiz yo'qmi? </Text>
          <TouchableOpacity onPress={onGoRegister}>
            <Text style={s.footerLink}>Ro'yxatdan o'tish</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: SP.xl, paddingBottom: 40 },

  logoSection: { alignItems: 'center', marginBottom: SP.xxl },
  logoBox: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: C.brandLight, justifyContent: 'center', alignItems: 'center',
    marginBottom: SP.md,
  },
  logoText: { fontSize: 24, fontWeight: '700', color: C.text, letterSpacing: -0.5 },
  logoSub: { fontSize: 13, color: C.textTertiary, marginTop: 4 },

  card: {
    backgroundColor: C.card, borderRadius: RADIUS.lg, padding: SP.xl,
    borderWidth: 1, borderColor: C.border,
  },
  title: { fontSize: 22, fontWeight: '700', color: C.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: C.textTertiary, marginTop: 4, marginBottom: SP.xl },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: SP.sm,
    backgroundColor: C.redLight, paddingHorizontal: SP.md, paddingVertical: SP.sm,
    borderRadius: RADIUS.xs, marginBottom: SP.lg,
  },
  errorText: { fontSize: 13, color: C.red, fontWeight: '500', flex: 1 },

  label: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: SP.sm },
  inputBox: {
    flexDirection: 'row', alignItems: 'center', gap: SP.sm,
    backgroundColor: C.bg, borderRadius: RADIUS.sm, paddingHorizontal: SP.md,
    borderWidth: 1, borderColor: C.border, marginBottom: SP.lg,
  },
  input: { flex: 1, fontSize: 14, color: C.text, paddingVertical: 14 },

  btn: {
    backgroundColor: C.brand, paddingVertical: 16, borderRadius: RADIUS.md,
    alignItems: 'center', marginTop: SP.sm,
  },
  btnOff: { opacity: 0.6 },
  btnText: { fontSize: 16, fontWeight: '600', color: C.textInverse },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: SP.xl },
  footerText: { fontSize: 14, color: C.textTertiary },
  footerLink: { fontSize: 14, fontWeight: '600', color: C.brand },
});
