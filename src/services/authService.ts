import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Backend tayyor bo'lganda true qiling va API orqali ishlaydi
const USE_REAL_API = true;
const BASE_URL = 'https://med-expert.donoxonsi.uz/api';

export interface AuthUser {
  id: string;
  _id?: string;
  name: string;
  surname: string;
  phone: string;
  username: string;
  role: string;
  avatar: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// ─── Token & User storage ───

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function saveToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function removeToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(USER_KEY);
}

async function saveUser(user: AuthUser): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

async function getSavedUser(): Promise<AuthUser | null> {
  const data = await AsyncStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
}

// ─── Mock auth (lokal) ───

async function mockRegister(body: {
  name: string;
  surname: string;
  phone: string;
  username: string;
  password: string;
}): Promise<AuthResponse> {
  // Tekshirish — bu username oldin ro'yxatdan o'tganmi
  const existing = await AsyncStorage.getItem(`user_${body.username}`);
  if (existing) {
    throw new AuthError("Bu username allaqachon ro'yxatdan o'tgan", 409);
  }

  const user: AuthUser = {
    id: Date.now().toString(),
    name: body.name,
    surname: body.surname,
    phone: body.phone,
    username: body.username,
    role: 'patient',
    avatar: '',
  };

  const token = `mock_token_${Date.now()}`;

  // Saqlash
  await AsyncStorage.setItem(`user_${body.username}`, JSON.stringify({ ...user, password: body.password }));
  await saveToken(token);
  await saveUser(user);

  return { token, user };
}

async function mockLogin(body: {
  username: string;
  password: string;
}): Promise<AuthResponse> {
  const saved = await AsyncStorage.getItem(`user_${body.username}`);
  if (!saved) {
    throw new AuthError("Username yoki parol noto'g'ri", 401);
  }

  const userData = JSON.parse(saved);
  if (userData.password !== body.password) {
    throw new AuthError("Username yoki parol noto'g'ri", 401);
  }

  const user: AuthUser = {
    id: userData.id,
    name: userData.name,
    surname: userData.surname,
    phone: userData.phone,
    username: userData.username,
    role: userData.role,
    avatar: userData.avatar || '',
  };

  const token = `mock_token_${Date.now()}`;
  await saveToken(token);
  await saveUser(user);

  return { token, user };
}

async function mockGetMe(): Promise<AuthUser | null> {
  const token = await getToken();
  if (!token) return null;
  return getSavedUser();
}

// ─── Real API calls ───

async function apiRegister(body: {
  name: string;
  surname: string;
  phone: string;
  username: string;
  password: string;
}): Promise<AuthResponse> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AuthError('Internetga ulanishda xatolik.');
  }

  if (res.status === 409) {
    const data = await res.json().catch(() => ({}));
    throw new AuthError(data.error || "Bu username allaqachon ro'yxatdan o'tgan", 409);
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new AuthError(data.error || `Server xatosi (${res.status})`, res.status);
  }

  const data: AuthResponse = await res.json();
  await saveToken(data.token);
  await saveUser(data.user);
  return data;
}

async function apiLogin(body: {
  username: string;
  password: string;
}): Promise<AuthResponse> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AuthError('Internetga ulanishda xatolik.');
  }

  if (res.status === 401) {
    throw new AuthError("Username yoki parol noto'g'ri", 401);
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new AuthError(data.error || `Server xatosi (${res.status})`, res.status);
  }

  const data: AuthResponse = await res.json();
  await saveToken(data.token);
  await saveUser(data.user);
  return data;
}

async function apiGetMe(): Promise<AuthUser | null> {
  const token = await getToken();
  if (!token) return null;

  try {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      await removeToken();
      return null;
    }

    const data = await res.json();
    await saveUser(data.user);
    return data.user;
  } catch {
    return null;
  }
}

// ─── Eksport ───

export async function register(body: {
  name: string;
  surname: string;
  phone: string;
  username: string;
  password: string;
}): Promise<AuthResponse> {
  if (USE_REAL_API) return apiRegister(body);
  return mockRegister(body);
}

export async function login(body: {
  username: string;
  password: string;
}): Promise<AuthResponse> {
  if (USE_REAL_API) return apiLogin(body);
  return mockLogin(body);
}

export async function getMe(): Promise<AuthUser | null> {
  if (USE_REAL_API) return apiGetMe();
  return mockGetMe();
}

export async function logout(): Promise<void> {
  await removeToken();
}
