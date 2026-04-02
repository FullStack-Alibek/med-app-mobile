import React, { createContext, useContext, useState, useCallback } from 'react';

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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [messages, setMessages] = useState<Record<string, DoctorMessage[]>>({});
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [medCard, setMedCard] = useState<MedCard>({
    fullName: 'Karimov Jasur Bahodirovich',
    birthYear: '1995',
    gender: 'erkak',
    bloodType: 'II (A)',
    allergies: 'Penisilin, changga allergiya',
    chronicDiseases: 'Gipertoniya (2-daraja)',
    currentMeds: 'Amlodipin 5mg (kuniga 1 marta)',
    complaints: 'Bosh og\'rig\'i va bosh aylanishi 2 haftadan beri bezovta qilmoqda. Qon bosimi ba\'zan 150/95 gacha ko\'tariladi.',
    files: [],
  });
  const [family, setFamily] = useState<FamilyMember[]>([
    {
      id: '1',
      name: 'Karimova Mohira Xasanovna',
      relation: 'Ayolim',
      birthYear: '1997',
      gender: 'ayol',
      medCard: {
        fullName: 'Karimova Mohira Xasanovna',
        birthYear: '1997',
        gender: 'ayol',
        bloodType: 'III (B)',
        allergies: '',
        chronicDiseases: '',
        currentMeds: '',
        complaints: 'Oshqozon og\'rig\'i va ko\'ngil aynishi 1 haftadan beri davom etmoqda.',
        files: [],
      },
    },
    {
      id: '2',
      name: 'Karimov Bahodir Rahimovich',
      relation: 'Otam',
      birthYear: '1965',
      gender: 'erkak',
      medCard: {
        fullName: 'Karimov Bahodir Rahimovich',
        birthYear: '1965',
        gender: 'erkak',
        bloodType: 'II (A)',
        allergies: '',
        chronicDiseases: 'Qandli diabet (2-tur), gipertoniya',
        currentMeds: 'Metformin 500mg, Enalapril 10mg',
        complaints: 'Oyoqlarda shishish va charchash kuzatilmoqda.',
        files: [],
      },
    },
    {
      id: '3',
      name: 'Karimova Zulfiya Toshpulatovna',
      relation: 'Onam',
      birthYear: '1968',
      gender: 'ayol',
      medCard: {
        fullName: 'Karimova Zulfiya Toshpulatovna',
        birthYear: '1968',
        gender: 'ayol',
        bloodType: 'I (O)',
        allergies: 'Penisilin',
        chronicDiseases: 'Bo\'g\'im og\'rig\'i (artrit)',
        currentMeds: 'Diklofenak 50mg',
        complaints: 'Tizza bo\'g\'imlarida og\'riq va shishish kuchaygan.',
        files: [],
      },
    },
    {
      id: '4',
      name: 'Karimov Amir Jasurovich',
      relation: 'O\'g\'lim',
      birthYear: '2018',
      gender: 'erkak',
      medCard: {
        fullName: 'Karimov Amir Jasurovich',
        birthYear: '2018',
        gender: 'erkak',
        bloodType: 'II (A)',
        allergies: 'Tuxumga allergiya',
        chronicDiseases: '',
        currentMeds: '',
        complaints: 'Yo\'tal va burun bitishi 3 kundan beri.',
        files: [],
      },
    },
    {
      id: '5',
      name: 'Karimova Madina Jasurovna',
      relation: 'Qizim',
      birthYear: '2020',
      gender: 'ayol',
      medCard: {
        fullName: 'Karimova Madina Jasurovna',
        birthYear: '2020',
        gender: 'ayol',
        bloodType: 'III (B)',
        allergies: '',
        chronicDiseases: '',
        currentMeds: '',
        complaints: 'Tana harorati 38.2, ishtaha yo\'qligi.',
        files: [],
      },
    },
  ]);
  const saveMedCard = useCallback((card: MedCard) => setMedCard(card), []);
  const addFamilyMember = useCallback((m: Omit<FamilyMember, 'id'>) => {
    setFamily((p) => [...p, { ...m, id: Date.now().toString() }]);
  }, []);
  const removeFamilyMember = useCallback((id: string) => {
    setFamily((p) => p.filter((m) => m.id !== id));
  }, []);
  const [health, setHealth] = useState<HealthData>({
    sleepHours: 6.5, sleepGoal: 8, sleepBedtime: '23:30', sleepWakeup: '06:00',
    steps: 4280, stepsGoal: 10000,
    waterMl: 800, waterGoal: 2500,
  });

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
