const BASE_URL = 'https://med-expert.donoxonsi.uz/api';

export interface ApiMedicine {
  name: string;
  desc: string;
  dose: string;
  price: number;
  img: string;
}

export interface ApiDoctor {
  _id: string;
  name: string;
  spec: string;
  exp: number;
  rating: number;
  price: number;
  img: string;
  online: boolean;
  tags: string[];
  reviews: number;
  medicines: ApiMedicine[];
}

export class DoctorServiceError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = 'DoctorServiceError';
  }
}

export async function fetchDoctors(): Promise<ApiDoctor[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${BASE_URL}/doctors`, {
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new DoctorServiceError(`Server xatosi: ${res.status}`, res.status);
    }

    return await res.json();
  } catch (error) {
    if (error instanceof DoctorServiceError) throw error;
    if ((error as any)?.name === 'AbortError') {
      throw new DoctorServiceError("So'rov vaqti tugadi.");
    }
    throw new DoctorServiceError('Internetga ulanishda xatolik.');
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchDoctorById(id: string): Promise<ApiDoctor> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${BASE_URL}/doctors/${id}`, {
      signal: controller.signal,
    });

    if (res.status === 404) {
      throw new DoctorServiceError('Shifokor topilmadi', 404);
    }

    if (!res.ok) {
      throw new DoctorServiceError(`Server xatosi: ${res.status}`, res.status);
    }

    return await res.json();
  } catch (error) {
    if (error instanceof DoctorServiceError) throw error;
    if ((error as any)?.name === 'AbortError') {
      throw new DoctorServiceError("So'rov vaqti tugadi.");
    }
    throw new DoctorServiceError('Internetga ulanishda xatolik.');
  } finally {
    clearTimeout(timeout);
  }
}
