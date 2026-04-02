const BASE_URL = 'https://med-expert.donoxonsi.uz/api';

export interface ApiChatMessage {
  from: 'patient' | 'doctor';
  text: string;
  time: string;
  date: string;
  timestamp: number;
  read: boolean;
}

export interface ApiChat {
  _id: string;
  doctorName: string;
  patientUsername: string;
  patientName: string;
  messages: ApiChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export class ChatApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = 'ChatApiError';
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });

    if (res.status === 404) {
      throw new ChatApiError('Topilmadi', 404);
    }
    if (res.status === 400) {
      const data = await res.json().catch(() => ({}));
      throw new ChatApiError(data.error || "Majburiy maydonlar to'ldirilmagan", 400);
    }
    if (!res.ok) {
      throw new ChatApiError(`Server xatosi: ${res.status}`, res.status);
    }

    return await res.json();
  } catch (error) {
    if (error instanceof ChatApiError) throw error;
    if ((error as any)?.name === 'AbortError') {
      throw new ChatApiError("So'rov vaqti tugadi.");
    }
    throw new ChatApiError('Internetga ulanishda xatolik.');
  } finally {
    clearTimeout(timeout);
  }
}

/** Bemor chatlarini olish */
export function fetchPatientChats(username: string): Promise<ApiChat[]> {
  return request<ApiChat[]>(`${BASE_URL}/chats/${encodeURIComponent(username)}`);
}

/** Shifokorning barcha chatlari */
export function fetchDoctorChats(doctorName: string): Promise<ApiChat[]> {
  return request<ApiChat[]>(`${BASE_URL}/chats/doctor/${encodeURIComponent(doctorName)}`);
}

/** Yangi xabar yuborish */
export function sendChatMessage(body: {
  doctorName: string;
  patientUsername: string;
  patientName?: string;
  from: 'patient' | 'doctor';
  text: string;
}): Promise<ApiChat> {
  return request<ApiChat>(`${BASE_URL}/chats/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** Xabarlarni o'qilgan deb belgilash */
export function markMessagesRead(body: {
  doctorName: string;
  patientUsername: string;
  readerRole: 'patient' | 'doctor';
}): Promise<ApiChat> {
  return request<ApiChat>(`${BASE_URL}/chats/read`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** O'qilmagan xabarlar soni */
export async function fetchUnreadCount(username: string): Promise<number> {
  const data = await request<{ unread: number }>(
    `${BASE_URL}/chats/unread/${encodeURIComponent(username)}`,
  );
  return data.unread;
}
