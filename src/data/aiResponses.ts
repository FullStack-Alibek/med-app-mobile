  export type Severity = 'low' | 'medium' | 'high' | 'critical';

  export interface AIResult {
    response: string;
    severity: Severity;
    confidence: number;
    category: string;
    specialty?: string;     // mos shifokor mutaxassisligi
    followUp?: string;
  }

  interface AIResponse {
    keywords: string[];
    category: string;
    specialty: string;      // SPECIALTY_CONFIG dagi kalit
    severity: Severity;
    confidence: number;
    responses: string[];
    followUp?: string;
  }

  const aiResponses: AIResponse[] = [
    {
      keywords: ['salom', 'hey', 'assalomu', 'hayrli'],
      category: 'Salomlashish',
      specialty: '',
      severity: 'low',
      confidence: 95,
      responses: [
        'Assalomu alaykum! Men MedAI — tibbiy yordamchingizman.\n\nSimptomlaringizni ayting, men sizga mos mutaxassis shifokorni topib beraman.\n\n⚠️ Men tashxis qo\'ymayman va davo tayinlamayman — faqat to\'g\'ri shifokorga yo\'naltirishga yordam beraman.',
      ],
    },
    {
      keywords: ['bosh', 'og\'riq', 'bosh og\'riyapti', 'migren', 'bosh og\'rig\'i'],
      category: 'Nevrologiya',
      specialty: 'Nevropatolog',
      severity: 'medium',
      confidence: 87,
      responses: [
        'Simptomlaringiz tahlil qilindi.\n\nBosh og\'rig\'ining sabablari turlicha bo\'lishi mumkin — stress, uyqusizlik, qon bosimi o\'zgarishi yoki boshqa omillar.\n\nAniq sababni faqat mutaxassis shifokor aniqlashi mumkin.\n\n👨‍⚕️ AI tavsiyasi: Nevropatolog ko\'rigidan o\'tishingizni tavsiya qilaman. Nevropatolog asab tizimi va bosh og\'rig\'i bo\'yicha mutaxassis.',
      ],
      followUp: 'Og\'riq qachondan beri davom etmoqda?',
    },
    {
      keywords: ['isitma', 'temperatura', 'qizib', 'bezgak', 'harorat'],
      category: 'Terapiya',
      specialty: 'Terapevt',
      severity: 'high',
      confidence: 91,
      responses: [
        'Simptomlaringiz tahlil qilindi.\n\nIsitma ko\'tarilishi organizmda yallig\'lanish yoki infeksiya borligidan dalolat berishi mumkin.\n\n📊 Normal harorat: 36.1–37.2°C\n⚠️ 38°C dan yuqori bo\'lsa — shifokorga murojaat zarur\n🚨 39°C dan yuqori bo\'lsa — zudlik bilan murojaat qiling\n\n👨‍⚕️ AI tavsiyasi: Terapevt ko\'rigidan o\'tishingizni tavsiya qilaman. Terapevt dastlabki tekshiruv o\'tkazib, kerak bo\'lsa tor mutaxassisga yo\'naltiradi.',
      ],
      followUp: 'Haroratingiz necha gradus? Boshqa simptomlar bormi?',
    },
    {
      keywords: ['qorin', 'oshqozon', 'ich', 'ko\'ngil aynash', 'qayt', 'ich ketish'],
      category: 'Gastroenterologiya',
      specialty: 'Terapevt',
      severity: 'medium',
      confidence: 84,
      responses: [
        'Simptomlaringiz tahlil qilindi.\n\nOshqozon va qorin sohasidagi og\'riqlar turli sabablarga ega bo\'lishi mumkin — ovqatlanish tartibidan tortib, jiddiyroq holatlargacha.\n\nAniq tashxis faqat shifokor tekshiruvidan keyin qo\'yiladi.\n\n⚠️ Qon ketishi yoki 39°C dan yuqori isitma bo\'lsa — zudlik bilan murojaat qiling!\n\n👨‍⚕️ AI tavsiyasi: Terapevt yoki gastroenterologga murojaat qilishingizni tavsiya qilaman.',
      ],
      followUp: 'Og\'riq qayerda joylashgan? Ovqatdan keyin kuchayib ketadimi?',
    },
    {
      keywords: ['shamollash', 'gripp', 'burun', 'yo\'tal', 'tomoq', 'tumov'],
      category: 'Terapiya',
      specialty: 'Terapevt',
      severity: 'medium',
      confidence: 89,
      responses: [
        'Simptomlaringiz tahlil qilindi.\n\nShamollash belgilari — burun oqishi, yo\'tal, tomoq og\'rig\'i — odatda virusli infeksiyaga ishora qiladi.\n\nLekin gripp, sinusit yoki boshqa kasalliklar ham o\'xshash belgilarga ega.\n\nAniq tashxis va davolash rejasini faqat shifokor belgilashi mumkin.\n\n👨‍⚕️ AI tavsiyasi: Terapevtga murojaat qilishingizni tavsiya qilaman. Simptomlar 5 kundan ortiq davom etsa, albatta ko\'rikdan o\'ting.',
      ],
      followUp: 'Isitma bormi? Qachondan beri davom etmoqda?',
    },
    {
      keywords: ['allergiya', 'tosma', 'qichish', 'shishish', 'urtikaria'],
      category: 'Dermatologiya',
      specialty: 'Dermatolog',
      severity: 'high',
      confidence: 82,
      responses: [
        'Simptomlaringiz tahlil qilindi.\n\nAllergik reaksiyalar turli darajada bo\'lishi mumkin — engil teri toshmadan tortib, jiddiy nafas qisilishigacha.\n\n🚨 MUHIM: Nafas qisilishi, til/lab shishishi bo\'lsa — ZUDLIK bilan 103 ga qo\'ng\'iroq qiling!\n\nAllergiyaning aniq sababini va davolash usulini faqat mutaxassis aniqlashi mumkin.\n\n👨‍⚕️ AI tavsiyasi: Dermatolog yoki allergolog ko\'rigidan o\'tishingizni tavsiya qilaman.',
      ],
      followUp: 'Qanday allergen bilan aloqada bo\'ldingiz? Nafas olish qiyinmi?',
    },
    {
      keywords: ['yurak', 'ko\'krak', 'qon bosim', 'bosim', 'aritmiya', 'taxikardiya'],
      category: 'Kardiologiya',
      specialty: 'Kardiolog',
      severity: 'critical',
      confidence: 78,
      responses: [
        'Simptomlaringiz tahlil qilindi.\n\n🚨 DIQQAT: Yurak va qon bosimi bilan bog\'liq simptomlar jiddiy bo\'lishi mumkin!\n\n🚨 Ko\'krak og\'rig\'i + nafas qisilishi + terlash = ZUDLIK bilan 103 ga qo\'ng\'iroq qiling!\n\nYurak va qon tomir kasalliklari faqat kardiolog tomonidan tashxis qo\'yiladi. EKG, exokardiografiya va qon tahlillari zarur bo\'lishi mumkin.\n\n👨‍⚕️ AI tavsiyasi: Kardiologga ZUDLIK bilan murojaat qilishingizni kuchli tavsiya qilaman.',
      ],
      followUp: 'Qon bosimingiz qancha? Ko\'krak og\'rig\'i bormi?',
    },
    {
      keywords: ['uxlay', 'uyqu', 'insomnia', 'uxlolmay', 'uyqusizlik'],
      category: 'Nevrologiya',
      specialty: 'Nevropatolog',
      severity: 'medium',
      confidence: 85,
      responses: [
        'Simptomlaringiz tahlil qilindi.\n\nUyqu buzilishi turli sabablarga ega — stress, noto\'g\'ri kun tartibi, tibbiy holatlar yoki boshqa omillar.\n\nSurunkali uyqusizlik organizmga jiddiy ta\'sir ko\'rsatadi va mutaxassis yordami zarur.\n\n👨‍⚕️ AI tavsiyasi: Uyqu muammolari 2 haftadan ortiq davom etsa — nevropatologga murojaat qilishingizni tavsiya qilaman.',
      ],
      followUp: 'Qachondan beri uyqu muammosi bor?',
    },
    {
      keywords: ['stress', 'asab', 'xavotir', 'depressiya', 'tashvish', 'ruhiy'],
      category: 'Psixologiya',
      specialty: 'Psixolog',
      severity: 'medium',
      confidence: 80,
      responses: [
        'Simptomlaringiz tahlil qilindi.\n\nStress va ruhiy holat jismoniy salomatlikka ham ta\'sir qiladi. Bu juda muhim masala va professional yordam olish zarurati bor.\n\nRuhiy salomatlik — jismoniy salomatlik kabi muhim. Mutaxassis bilan gaplashish — kuchlilik belgisi.\n\n👨‍⚕️ AI tavsiyasi: Professional psixolog bilan maslahatlashishingizni tavsiya qilaman. Psixolog sizga stressni boshqarish va ruhiy holatni yaxshilash usullarini o\'rgatadi.',
      ],
      followUp: 'Qachondan beri bu holat davom etmoqda?',
    },
    {
      keywords: ['tish', 'og\'iz', 'milk', 'stomatolog'],
      category: 'Stomatologiya',
      specialty: 'Stomatolog',
      severity: 'medium',
      confidence: 88,
      responses: [
        'Simptomlaringiz tahlil qilindi.\n\nTish og\'rig\'i turli sabablarga ega — kariyes, pulpit, milk yallig\'lanishi va boshqalar.\n\n⚠️ Tish og\'rig\'ini uyda davolash faqat vaqtinchalik yechim! Muammoning asosiy sababini faqat stomatolog aniqlashi va bartaraf qilishi mumkin.\n\n👨‍⚕️ AI tavsiyasi: Imkon qadar tezroq stomatologga murojaat qilishingizni tavsiya qilaman.',
      ],
      followUp: 'Og\'riq qachon boshlangan? Issiq/sovuqqa sezgirmi?',
    },
    {
      keywords: ['ko\'z', 'ko\'rish', 'ko\'z og\'riydi', 'qizarish'],
      category: 'Oftalmologiya',
      specialty: 'Okulist',
      severity: 'medium',
      confidence: 79,
      responses: [
        'Simptomlaringiz tahlil qilindi.\n\nKo\'z bilan bog\'liq muammolar turli sabablarga ega bo\'lishi mumkin — ko\'z charchashi, infeksiya, allergiya yoki ko\'rish muammolari.\n\n⚠️ Ko\'rish keskin pasaysa yoki og\'riq kuchli bo\'lsa — zudlik bilan murojaat qiling!\n\n👨‍⚕️ AI tavsiyasi: Okulist (ko\'z shifokori) ko\'rigidan o\'tishingizni tavsiya qilaman.',
      ],
      followUp: 'Ko\'rish o\'zgarganmi? Kompyuterda ko\'p ishlaysizmi?',
    },
    {
      keywords: ['bolam', 'bola', 'chaqaloq', 'pediatr', 'bolaning'],
      category: 'Pediatriya',
      specialty: 'Pediatr',
      severity: 'high',
      confidence: 75,
      responses: [
        'Simptomlaringiz tahlil qilindi.\n\n⚠️ MUHIM: Bolalar uchun o\'z-o\'zini davolash xavfli! Bolalar organizmi kattalarnidan farq qiladi.\n\n🚨 Zudlik bilan shifokorga murojaat qiling:\n• 38.5°C dan yuqori isitma (1 yoshgacha)\n• Nafas qisilishi yoki surunkali yo\'tal\n• Tana bo\'ylab tosma\n• 24 soatdan ortiq ishtaha yo\'qolishi\n\n👨‍⚕️ AI tavsiyasi: Pediatr (bolalar shifokori) ko\'rigiga ZUDLIK bilan murojaat qilishingizni kuchli tavsiya qilaman.',
      ],
      followUp: 'Bolaning yoshi nechida? Qanday simptomlar bor?',
    },
    {
      keywords: ['quloq', 'eshit', 'quloq og\'riydi'],
      category: 'Otorinolaringologiya',
      specialty: 'LOR',
      severity: 'medium',
      confidence: 83,
      responses: [
        'Simptomlaringiz tahlil qilindi.\n\nQuloq og\'rig\'i yoki eshitish muammolari — otit, oltingugurt tiqilishi yoki boshqa sabablardan kelib chiqishi mumkin.\n\nAniq tashxis va davolashni faqat LOR shifokor belgilashi mumkin.\n\n👨‍⚕️ AI tavsiyasi: LOR (quloq-burun-tomoq) shifokoriga murojaat qilishingizni tavsiya qilaman.',
      ],
      followUp: 'Quloqdan ajralma bormi? Eshitish pasayganmi?',
    },
    {
      keywords: ['bel', 'orqa', 'umurtqa', 'bo\'g\'im', 'oyoq og\'riydi', 'tizza'],
      category: 'Ortopediya',
      specialty: 'Ortoped',
      severity: 'medium',
      confidence: 81,
      responses: [
        'Simptomlaringiz tahlil qilindi.\n\nBel, bo\'g\'im va suyak-mushak tizimi og\'riqlari turli sabablarga ega — noto\'g\'ri holat, zo\'riqish, yallig\'lanish yoki boshqa omillar.\n\nAniq sababni va davolash rejasini faqat mutaxassis belgilashi mumkin.\n\n👨‍⚕️ AI tavsiyasi: Ortoped ko\'rigidan o\'tishingizni tavsiya qilaman. Kerak bo\'lsa rentgen yoki MRT tekshiruvi tayinlanadi.',
      ],
      followUp: 'Og\'riq qayerda aniq joylashgan? Harakat qilganda kuchayib ketadimi?',
    },
  ];

  export function getAIResponse(message: string): AIResult {
    const lower = message.toLowerCase();

    for (const item of aiResponses) {
      if (item.keywords.some((kw) => lower.includes(kw))) {
        const response = item.responses[Math.floor(Math.random() * item.responses.length)];
        return {
          response,
          severity: item.severity,
          confidence: item.confidence + Math.floor(Math.random() * 6) - 3,
          category: item.category,
          specialty: item.specialty || undefined,
          followUp: item.followUp,
        };
      }
    }

    return {
      response: 'Simptomlaringizni batafsil yozing — men sizga mos mutaxassis shifokorni topishga yordam beraman.\n\nMasalan:\n• "Boshim og\'riyapti"\n• "Isitmam bor"\n• "Tishim og\'riydi"\n• "Ko\'zim qizarib ketdi"\n• "Bolam kasal"\n\n⚠️ Eslatma: Men tashxis qo\'ymayman — faqat to\'g\'ri shifokorga yo\'naltirishga yordam beraman.',
      severity: 'low',
      confidence: 95,
      category: 'Umumiy',
    };
  }
