import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  fetchMedCard,
  saveMedCardApi,
  fetchFamily,
  addFamilyMemberApi,
  removeFamilyMemberApi,
  ApiFamilyMember,
} from '../services/medCardService';

export interface BookingDay {
  date: string;
  time: string;
}

export interface Booking {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  days: BookingDay[];
  price: number;
  totalPrice: number;
  status: 'confirmed' | 'completed' | 'cancelled';
  createdAt: Date;
}

export interface DoctorMessage {
  id: string;
  bookingId: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  image?: string;
  audio?: string;
  audioDuration?: number;
}

export type ReminderCategory = 'dori' | 'bosim' | 'puls' | 'harorat' | 'faollik' | 'uyqu' | 'shifokor' | 'suv';

export interface Reminder {
  id: string;
  title: string;
  description: string;
  category: ReminderCategory;
  hour: number;
  minute: number;
  days: number[];        // 0=Sun..6=Sat, empty = daily
  enabled: boolean;
  createdAt: Date;
  notificationIds: string[];
}

export interface MedCardFile {
  uri: string;
  name: string;
  type: 'image' | 'pdf';
}

export interface MedCard {
  fullName: string;
  birthYear: string;
  gender: 'erkak' | 'ayol' | '';
  bloodType: string;
  allergies: string;
  chronicDiseases: string;
  currentMeds: string;
  complaints: string;
  files: MedCardFile[];
}

export const EMPTY_MED_CARD: MedCard = {
  fullName: '', birthYear: '', gender: '', bloodType: '',
  allergies: '', chronicDiseases: '', currentMeds: '', complaints: '',
  files: [],
};

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  birthYear: string;
  gender: 'erkak' | 'ayol';
  medCard?: MedCard;
}

export interface HealthData {
  sleepHours: number;
  sleepGoal: number;
  sleepBedtime: string;
  sleepWakeup: string;
  steps: number;
  stepsGoal: number;
  waterMl: number;
  waterGoal: number;
}

interface AppState {
  bookings: Booking[];
  messages: Record<string, DoctorMessage[]>;
  reminders: Reminder[];
  health: HealthData;
  medCard: MedCard;
  family: FamilyMember[];
  medCardLoading: boolean;
  familyLoading: boolean;
  saveMedCard: (card: MedCard) => void;
  addFamilyMember: (m: Omit<FamilyMember, 'id'>) => void;
  removeFamilyMember: (id: string) => void;
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => Booking;
  cancelBooking: (id: string) => void;
  addMessage: (bookingId: string, text: string, isUser: boolean, extra?: { image?: string; audio?: string; audioDuration?: number }) => void;
  getMessages: (bookingId: string) => DoctorMessage[];
  addReminder: (data: Omit<Reminder, 'id' | 'createdAt' | 'notificationIds'>) => Reminder;
  updateReminder: (id: string, patch: Partial<Omit<Reminder, 'id' | 'createdAt'>>) => void;
  deleteReminder: (id: string) => void;
  toggleReminder: (id: string) => void;
  updateHealth: (patch: Partial<HealthData>) => void;
  addWater: (ml: number) => void;
  addSteps: (n: number) => void;
}

const AppContext = createContext<AppState | null>(null);

// API dan kelgan family member ni lokal formatga o'girish
function apiToLocalFamily(m: ApiFamilyMember): FamilyMember {
  return {
    id: m._id,
    name: m.name,
    relation: m.relation,
    birthYear: m.birthYear || '',
    gender: m.gender,
    medCard: m.medCard ? { ...m.medCard, gender: m.medCard.gender as MedCard['gender'], files: [] } : undefined,
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [messages, setMessages] = useState<Record<string, DoctorMessage[]>>({});
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [medCard, setMedCard] = useState<MedCard>(EMPTY_MED_CARD);
  const [family, setFamily] = useState<FamilyMember[]>([]);
  const [medCardLoading, setMedCardLoading] = useState(false);
  const [familyLoading, setFamilyLoading] = useState(false);
  const [health, setHealth] = useState<HealthData>({
    sleepHours: 0, sleepGoal: 8, sleepBedtime: '23:00', sleepWakeup: '07:00',
    steps: 0, stepsGoal: 10000,
    waterMl: 0, waterGoal: 2500,
  });

  // ── User login bo'lganda backenddan medcard va family yuklash ──
  useEffect(() => {
    if (!user) {
      setMedCard(EMPTY_MED_CARD);
      setFamily([]);
      return;
    }

    // MedCard yuklash
    setMedCardLoading(true);
    fetchMedCard(user.username)
      .then((data) => {
        if (data) {
          setMedCard({
            fullName: data.fullName || '',
            birthYear: data.birthYear || '',
            gender: (data.gender as MedCard['gender']) || '',
            bloodType: data.bloodType || '',
            allergies: data.allergies || '',
            chronicDiseases: data.chronicDiseases || '',
            currentMeds: data.currentMeds || '',
            complaints: data.complaints || '',
            files: [],
          });
        } else {
          setMedCard(EMPTY_MED_CARD);
        }
      })
      .catch(() => setMedCard(EMPTY_MED_CARD))
      .finally(() => setMedCardLoading(false));

    // Family yuklash
    setFamilyLoading(true);
    fetchFamily(user.username)
      .then((data) => setFamily(data.map(apiToLocalFamily)))
      .catch(() => setFamily([]))
      .finally(() => setFamilyLoading(false));
  }, [user]);

  // ── MedCard saqlash — lokal + backend ──
  const saveMedCard = useCallback((card: MedCard) => {
    setMedCard(card);
    if (user) {
      saveMedCardApi(user.username, {
        fullName: card.fullName,
        birthYear: card.birthYear,
        gender: card.gender,
        bloodType: card.bloodType,
        allergies: card.allergies,
        chronicDiseases: card.chronicDiseases,
        currentMeds: card.currentMeds,
        complaints: card.complaints,
      }).catch(() => {});
    }
  }, [user]);

  // ── Oila a'zosi qo'shish — lokal + backend ──
  const addFamilyMember = useCallback((m: Omit<FamilyMember, 'id'>) => {
    // Darhol lokal qo'shish (vaqtinchalik id bilan)
    const tempId = Date.now().toString();
    setFamily((p) => [...p, { ...m, id: tempId }]);

    if (user) {
      addFamilyMemberApi(user.username, {
        name: m.name,
        relation: m.relation,
        birthYear: m.birthYear,
        gender: m.gender,
        medCard: m.medCard ? {
          fullName: m.medCard.fullName,
          birthYear: m.medCard.birthYear,
          gender: m.medCard.gender,
          bloodType: m.medCard.bloodType,
          allergies: m.medCard.allergies,
          chronicDiseases: m.medCard.chronicDiseases,
          currentMeds: m.medCard.currentMeds,
          complaints: m.medCard.complaints,
        } : undefined,
      }).then((created) => {
        // Backend dan kelgan _id bilan yangilash
        setFamily((p) => p.map((f) => f.id === tempId ? apiToLocalFamily(created) : f));
      }).catch(() => {});
    }
  }, [user]);

  // ── Oila a'zosini o'chirish — lokal + backend ──
  const removeFamilyMember = useCallback((id: string) => {
    setFamily((p) => p.filter((m) => m.id !== id));
    if (user) {
      removeFamilyMemberApi(user.username, id).catch(() => {});
    }
  }, [user]);

  const addBooking = useCallback((data: Omit<Booking, 'id' | 'createdAt'>): Booking => {
    const booking: Booking = { ...data, id: Date.now().toString(), createdAt: new Date() };
    setBookings((prev) => [booking, ...prev]);

    const daysText = data.days.length === 1
      ? `${data.days[0].date}, soat ${data.days[0].time}`
      : `${data.days.length} kun: ${data.days.map((d) => `${d.date} (${d.time})`).join(', ')}`;

    const welcome: DoctorMessage = {
      id: `${booking.id}-w`,
      bookingId: booking.id,
      text: `Assalomu alaykum! Men ${data.doctorName}man. Sizning navbatingiz tasdiqlandi:\n\n${daysText}\n\nSavollaringiz bo'lsa yozing, javob beraman.`,
      isUser: false,
      timestamp: new Date(),
    };
    setMessages((prev) => ({ ...prev, [booking.id]: [welcome] }));
    return booking;
  }, []);

  const cancelBooking = useCallback((id: string) => {
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'cancelled' as const } : b));
  }, []);

  const addMessage = useCallback((bookingId: string, text: string, isUser: boolean, extra?: { image?: string; audio?: string; audioDuration?: number }) => {
    const msg: DoctorMessage = {
      id: Date.now().toString(), bookingId, text, isUser, timestamp: new Date(),
      ...extra,
    };
    setMessages((prev) => ({ ...prev, [bookingId]: [...(prev[bookingId] || []), msg] }));

    if (isUser) {
      setTimeout(() => {
        const replies = [
          'Tushunarlii, qabul vaqtida batafsil gaplashamiz.',
          'Rahmat, bu haqida qabulda muhokama qilamiz.',
          'Yaxshi, qabulga kelganingizda tekshiruvdan o\'tkazamiz.',
          'Xavotir olmang, bu odatiy holat. Qabulda batafsil ko\'rib chiqamiz.',
          'Ma\'lumotni qabul qildim. Tahlil natijalarini ham olib keling.',
          'Tushunarli. Qabuldan oldin ko\'p suv iching va dam oling.',
        ];
        const reply: DoctorMessage = {
          id: (Date.now() + 1).toString(), bookingId,
          text: replies[Math.floor(Math.random() * replies.length)],
          isUser: false, timestamp: new Date(),
        };
        setMessages((prev) => ({ ...prev, [bookingId]: [...(prev[bookingId] || []), reply] }));
      }, 1500);
    }
  }, []);

  const getMessages = useCallback((bookingId: string) => messages[bookingId] || [], [messages]);

  // ── Reminders ──
  const addReminder = useCallback((data: Omit<Reminder, 'id' | 'createdAt' | 'notificationIds'>): Reminder => {
    const reminder: Reminder = { ...data, id: Date.now().toString(), createdAt: new Date(), notificationIds: [] };
    setReminders((prev) => [reminder, ...prev]);
    return reminder;
  }, []);

  const updateReminder = useCallback((id: string, patch: Partial<Omit<Reminder, 'id' | 'createdAt'>>) => {
    setReminders((prev) => prev.map((r) => r.id === id ? { ...r, ...patch } : r));
  }, []);

  const deleteReminder = useCallback((id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const toggleReminder = useCallback((id: string) => {
    setReminders((prev) => prev.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));
  }, []);

  // ── Health ──
  const updateHealth = useCallback((patch: Partial<HealthData>) => {
    setHealth((prev) => ({ ...prev, ...patch }));
  }, []);
  const addWater = useCallback((ml: number) => {
    setHealth((prev) => ({ ...prev, waterMl: prev.waterMl + ml }));
  }, []);
  const addSteps = useCallback((n: number) => {
    setHealth((prev) => ({ ...prev, steps: prev.steps + n }));
  }, []);

  return (
    <AppContext.Provider value={{
      bookings, messages, reminders, health, medCard, family,
      medCardLoading, familyLoading,
      saveMedCard, addFamilyMember, removeFamilyMember,
      addBooking, cancelBooking, addMessage, getMessages,
      addReminder, updateReminder, deleteReminder, toggleReminder,
      updateHealth, addWater, addSteps,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
