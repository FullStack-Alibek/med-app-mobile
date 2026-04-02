const BASE_URL = 'https://med-expert.donoxonsi.uz/api';

export interface ApiMedCard {
  _id?: string;
  username: string;
  fullName: string;
  birthYear: string;
  gender: 'erkak' | 'ayol' | '';
  bloodType: string;
  allergies: string;
  chronicDiseases: string;
  currentMeds: string;
  complaints: string;
  updatedAt?: string;
}

export interface ApiFamilyMember {
  _id: string;
  username: string;
  name: string;
  relation: string;
  birthYear: string;
  gender: 'erkak' | 'ayol';
  medCard?: Omit<ApiMedCard, '_id' | 'username' | 'updatedAt'>;
}

class MedCardError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'MedCardError';
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });

    if (res.status === 404) {
      throw new MedCardError('Topilmadi', 404);
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new MedCardError(data.error || `Server xatosi: ${res.status}`, res.status);
    }

    return await res.json();
  } catch (error) {
    if (error instanceof MedCardError) throw error;
    if ((error as any)?.name === 'AbortError') {
      throw new MedCardError("So'rov vaqti tugadi.");
    }
    throw new MedCardError('Internetga ulanishda xatolik.');
  } finally {
    clearTimeout(timeout);
  }
}

// ─── MedKarta ───

export async function fetchMedCard(username: string): Promise<ApiMedCard | null> {
  try {
    return await request<ApiMedCard>(`${BASE_URL}/medcard/${encodeURIComponent(username)}`);
  } catch (e) {
    if (e instanceof MedCardError && e.statusCode === 404) return null;
    throw e;
  }
}

export function saveMedCardApi(username: string, card: {
  fullName: string;
  birthYear: string;
  gender: string;
  bloodType: string;
  allergies: string;
  chronicDiseases: string;
  currentMeds: string;
  complaints: string;
}): Promise<ApiMedCard> {
  return request<ApiMedCard>(`${BASE_URL}/medcard/${encodeURIComponent(username)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(card),
  });
}

// ─── Oila a'zolari ───

export function fetchFamily(username: string): Promise<ApiFamilyMember[]> {
  return request<ApiFamilyMember[]>(`${BASE_URL}/family/${encodeURIComponent(username)}`);
}

export function addFamilyMemberApi(username: string, member: {
  name: string;
  relation: string;
  birthYear: string;
  gender: 'erkak' | 'ayol';
  medCard?: {
    fullName: string;
    birthYear: string;
    gender: string;
    bloodType: string;
    allergies: string;
    chronicDiseases: string;
    currentMeds: string;
    complaints: string;
  };
}): Promise<ApiFamilyMember> {
  return request<ApiFamilyMember>(`${BASE_URL}/family/${encodeURIComponent(username)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(member),
  });
}

export function removeFamilyMemberApi(username: string, memberId: string): Promise<{ message: string }> {
  return request<{ message: string }>(`${BASE_URL}/family/${encodeURIComponent(username)}/${encodeURIComponent(memberId)}`, {
    method: 'DELETE',
  });
}

export function updateFamilyMedCardApi(username: string, memberId: string, medCard: {
  fullName: string;
  birthYear: string;
  gender: string;
  bloodType: string;
  allergies: string;
  chronicDiseases: string;
  currentMeds: string;
  complaints: string;
}): Promise<ApiFamilyMember> {
  return request<ApiFamilyMember>(`${BASE_URL}/family/${encodeURIComponent(username)}/${encodeURIComponent(memberId)}/medcard`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(medCard),
  });
}
