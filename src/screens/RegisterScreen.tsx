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

export default function RegisterScreen({ onGoLogin }: { onGoLogin: () => void }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [phone, setPhone] = useState('+998');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name.trim() || !surname.trim() || !phone.trim() || !username.trim() || !password.trim()) {
      setError("Barcha maydonlarni to'ldiring");
      return;
    }
    if (password.length < 6) {
      setError("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register({ name: name.trim(), surname: surname.trim(), phone: phone.trim(), username: username.trim(), password });
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
          <AppLogo size={56} />
          <Text style={s.logoText}>Med Expert</Text>
        </View>

        {/* Form */}
        <View style={s.card}>
          <Text style={s.title}>Ro'yxatdan o'tish</Text>
          <Text style={s.subtitle}>Yangi hisob yarating</Text>

          {error ? (
            <View style={s.errorBox}>
              <Ionicons name="alert-circle" size={16} color={C.red} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={s.row}>
            <View style={s.half}>
              <Text style={s.label}>Ism</Text>
              <View style={s.inputBox}>
                <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Ism" placeholderTextColor={C.textTertiary} />
              </View>
            </View>
            <View style={s.half}>
              <Text style={s.label}>Familiya</Text>
              <View style={s.inputBox}>
                <TextInput style={s.input} value={surname} onChangeText={setSurname} placeholder="Familiya" placeholderTextColor={C.textTertiary} />
              </View>
            </View>
          </View>

          <Text style={s.label}>Telefon</Text>
          <View style={s.inputBox}>
            <Ionicons name="call-outline" size={18} color={C.textTertiary} />
            <TextInput
              style={s.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+998901234567"
              placeholderTextColor={C.textTertiary}
              keyboardType="phone-pad"
            />
          </View>

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
              placeholder="Kamida 6 ta belgi"
              placeholderTextColor={C.textTertiary}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.textTertiary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[s.btn, loading && s.btnOff]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={C.textInverse} />
            ) : (
              <Text style={s.btnText}>Ro'yxatdan o'tish</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Login link */}
        <View style={s.footer}>
          <Text style={s.footerText}>Hisobingiz bormi? </Text>
          <TouchableOpacity onPress={onGoLogin}>
            <Text style={s.footerLink}>Kirish</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: SP.xl, paddingVertical: 40 },

  logoSection: { alignItems: 'center', marginBottom: SP.xl },
  logoBox: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: C.brandLight, justifyContent: 'center', alignItems: 'center',
    marginBottom: SP.sm,
  },
  logoText: { fontSize: 22, fontWeight: '700', color: C.text },

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

  row: { flexDirection: 'row', gap: SP.md },
  half: { flex: 1 },

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
