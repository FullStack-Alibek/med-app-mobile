const API_URL = 'https://med-expert.donoxonsi.uz/api/chat';

const SYSTEM_PROMPT = `Sen MedAI. O'zbek tilida gapir. Qisqa va lo'nda gapir.

QOIDA 1 — Noaniq simptomda aniq so'ra:
Bemor "oyog'im og'riyapti" desa → "Aniqroq ayting — tizzangizmi, tovon, boldirmi yoki butun oyoq?"
Bemor "boshim og'riyapti" desa → "Boshingizning qayeri — old qismi, yon tomoni yoki orqa?"
Bemor "qornim og'riydi" desa → "Qorningizning qayeri — yuqori, pastki, o'ng yoki chap tomoni?"
Har doim og'riq joyini ANIQ so'ra. Bir vaqtda faqat 1 ta savol.

QOIDA 2 — Bemor aniq javob berganda batafsil yordam ber:
- Nima bo'lishi mumkin (2-3 variant)
- Nima qilish kerak
- Risk darajasi
- Oxirida ALBATTA qaysi mutaxassisga borish kerakligini yoz

QOIDA 3 — Doktor tavsiyasi:
Javob oxirida mos mutaxassislikni shu formatda yoz: [SPEC:mutaxassislik_nomi]
Mavjud mutaxassisliklar: Kardiolog, Nevrolog, Pediatr, Dermatolog, Terapevt, Otorinolaringolog, Ortoped, Stomatolog, Okulist, Ginekolog, Urolog, Psixolog
Masalan: [SPEC:Kardiolog] yoki [SPEC:Ortoped]
Faqat aniq tavsiya berayotganda yoz. Savol berayotganda yozma.

Ko'krak og'rig'i, nafas qisilishi, hushdan ketish — darhol "Tez yordam chaqiring!" de.
Tashxis qo'yma. Dori tayinlama.`;

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  text: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
}

export interface ChatResponse {
  reply: string;
}

export class ChatServiceError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = 'ChatServiceError';
  }
}

export async function sendMessage(messages: ChatMessage[]): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  // System prompt ni birinchi xabar sifatida qo'shish
  const allMessages: ChatMessage[] = [
    { role: 'system', text: SYSTEM_PROMPT },
    ...messages,
  ];

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: allMessages } as ChatRequest),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ChatServiceError(
        `Server xatosi: ${response.status}`,
        response.status,
      );
    }

    const data: ChatResponse = await response.json();

    if (!data.reply) {
      throw new ChatServiceError('Serverdan javob kelmadi');
    }

    return data.reply;
  } catch (error) {
    if (error instanceof ChatServiceError) throw error;

    if (error && typeof error === 'object' && 'name' in error && (error as any).name === 'AbortError') {
      throw new ChatServiceError('So\'rov vaqti tugadi. Qaytadan urinib ko\'ring.');
    }

    throw new ChatServiceError(
      'Internetga ulanishda xatolik. Tarmoqni tekshiring.',
    );
  } finally {
    clearTimeout(timeout);
  }
}
