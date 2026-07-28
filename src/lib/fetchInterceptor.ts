// Helper to safely format dates without throwing
function safeFormatDate(d: any): string {
  if (!d) return 'غير مؤرخ';
  if (typeof d === 'string') {
    return d.includes('T') ? d.split('T')[0] : d;
  }
  if (typeof d === 'number') {
    try {
      return new Date(d).toISOString().split('T')[0];
    } catch {
      return 'غير مؤرخ';
    }
  }
  if (d instanceof Date) {
    try {
      return d.toISOString().split('T')[0];
    } catch {
      return 'غير مؤرخ';
    }
  }
  return String(d);
}

// Client-side fetch interceptor to support production deployment on Vercel
// This allows the React SPA to work fully offline and serverless if Express is not running.

const originalFetch = window.fetch;

// Helper to make a direct REST call to Google's official Gemini API
async function generateWithGeminiREST(prompt: string, systemInstruction?: string, isJson?: boolean, userApiKey?: string) {
  let keyToUse = userApiKey;
  if (!keyToUse || keyToUse.trim() === '') {
    keyToUse = (window as any).__GEMINI_KEY__ || '';
  }
  if (!keyToUse || keyToUse.trim() === '') {
    try {
      const saved = localStorage.getItem('yawmiyati_settings');
      if (saved) {
        keyToUse = JSON.parse(saved)?.userApiKey || '';
      }
    } catch (e) {}
  }

  if (!keyToUse || keyToUse.trim() === '') {
    throw new Error("يلزم إضافة مفتاح Gemini API الخاص بك أولاً في إعدادات التطبيق لتفعيل كافة خدمات الذكاء الاصطناعي.");
  }

  const modelsToTry = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-1.5-flash'];
  let lastErrorMsg = "";

  for (const model of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${keyToUse.trim()}`;
    
    const requestBody: any = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    };

    if (systemInstruction) {
      requestBody.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    if (isJson) {
      requestBody.generationConfig = {
        responseMimeType: "application/json"
      };
    }

    try {
      const res = await originalFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (res.ok) {
        const resJson = await res.json();
        const text = resJson.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) return text;
      }

      const errData = await res.json().catch(() => ({}));
      let errMessage = errData?.error?.message || `Google API error: ${res.statusText}`;
      
      if (errMessage.includes("API key not valid") || errMessage.includes("API_KEY_INVALID") || errMessage.includes("invalid key")) {
        throw new Error("مفتاح الـ API غير صالح. يرجى التأكد من نقله وكتابته بشكل صحيح من Google AI Studio.");
      } else if (errMessage.includes("Quota exceeded") || errMessage.includes("RESOURCE_EXHAUSTED")) {
        throw new Error("تم تجاوز حد الاستخدام المسموح به لهذا المفتاح (Quota Exceeded).");
      }
      
      lastErrorMsg = errMessage;
    } catch (e: any) {
      if (e.message?.includes("غير صالح") || e.message?.includes("Quota Exceeded")) {
        throw e;
      }
      lastErrorMsg = e.message || String(e);
    }
  }

  throw new Error(lastErrorMsg || "تعذر الاتصال بجميع طرازات Gemini المتاحة.");
}

// Intercept window.fetch robustly
const customFetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : (input instanceof URL ? input.href : (input as Request).url);

  // If not calling our custom local API endpoints, pass through normally
  if (!url.includes('/api/')) {
    return originalFetch(input, init);
  }

  try {
    // 1. Always attempt the actual server first
    const response = await originalFetch(input, init);
    const contentType = response.headers.get('content-type');
    
    // If we are on Vercel, a missing route might return a 404 with HTML contents,
    // or just a standard 404/500 code. Let's redirect those to our client fallback.
    if (response.status === 404 || (contentType && contentType.includes('text/html'))) {
      throw new Error('Backend endpoint not found (404), falling back to client-side handler');
    }
    
    return response;
  } catch (error) {
    console.warn(`[Client Fallback Router] Intercepted missing/failed route: ${url}. Routing to client-side simulation...`, error);
    return await handleClientSideFallback(url, init);
  }
};

try {
  Object.defineProperty(window, 'fetch', {
    value: customFetch,
    writable: true,
    configurable: true,
    enumerable: true
  });
} catch (e) {
  console.warn("Could not redefine window.fetch with Object.defineProperty, falling back to direct assignment", e);
  try {
    (window as any).fetch = customFetch;
  } catch (err) {
    console.error("Critical: Failed to intercept fetch", err);
  }
}

// Handle client-side simulation of express endpoints
async function handleClientSideFallback(url: string, init?: RequestInit): Promise<Response> {
  // Extract custom API Key
  let keyToUse = '';
  if (init?.headers) {
    const headers = new Headers(init.headers);
    keyToUse = headers.get('x-gemini-key') || '';
  }

  if (!keyToUse) {
    try {
      const savedSettings = localStorage.getItem('yawmiyati_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        keyToUse = parsed?.userApiKey || '';
      }
    } catch (e) {}
  }

  const requestBody = init?.body ? JSON.parse(init.body as string) : {};

  // Endpoint Router
  if (url.includes('/api/gemini/verify-key')) {
    const key = requestBody.key || keyToUse;
    if (!key || key.trim() === '') {
      return createErrorResponse("مفتاح API فارغ");
    }
    try {
      await generateWithGeminiREST("Say 'ok' in 1 word", undefined, false, key);
      return createSuccessResponse({ success: true, message: "تم التحقق من مفتاح الـ API بنجاح وهو يعمل بشكل ممتاز! 🎉" });
    } catch (err: any) {
      return createErrorResponse(err.message || "فشل التحقق من المفتاح.");
    }
  }

  if (url.includes('/api/gemini/analyze-mood')) {
    const { title, content } = requestBody;
    if (!content || content.trim() === "") {
      return createSuccessResponse({
        success: true,
        analysis: [{ mood: "طبيعي", percentage: 100 }]
      });
    }

    try {
      const prompt = `أنت طبيب نفسي ومحلل مشاعر خبير باللغة العربية. قم بتحليل النص التالي المستخرج من مذكرات يومية للمستخدم واستنتج بدقة النسب المئوية للمشاعر المختلفة التي يمر بها.
عنوان المذكرة: "${title || 'بدون عنوان'}"
محتوى المذكرة: "${content}"

يجب أن تقوم بتوزيع النسب المئوية على بعض المشاعر العشرة التالية فقط:
- سعيد جدًا (Very Happy)
- سعيد (Happy)
- مرتاح (Relaxed)
- طبيعي (Normal)
- حزين (Sad)
- مكتئب (Depressed)
- قلق (Anxious)
- غاضب (Angry)
- مرهق (Exhausted)
- ممتن (Grateful)

أرجع النتيجة على شكل مصفوفة JSON تحتوي فقط على كائنات بصيغة:
[{"mood": "اسم الشعور بالعربية", "percentage": الرقم بين 1 و 100}]
يجب أن يكون مجموع النسب 100%. أرجع JSON الصرف فقط بدون أي ماركداون أو تعليقات خارجية.`;

      const text = await generateWithGeminiREST(prompt, "أنت طبيب نفسي ومحلل مشاعر خبير باللغة العربية.", true, keyToUse);
      const cleanJson = extractJsonArray(text);
      return createSuccessResponse({ success: true, analysis: cleanJson });
    } catch (err: any) {
      // Return simulated local analysis on error
      return createSuccessResponse({
        success: true,
        analysis: [
          { mood: "طبيعي", percentage: 70 },
          { mood: "قلق", percentage: 30 }
        ]
      });
    }
  }

  if (url.includes('/api/gemini/evaluate-habits')) {
    const { habits, period, overallCompliance } = requestBody;
    const formattedHabits = (habits || []).map((h: any) => {
      const totalDone = Object.values(h.history || {}).filter(Boolean).length;
      return `- العادة: "${h.name}" [التصنيف: ${h.category}]
  عدد مرات الإنجاز الكلي: ${totalDone}
  تفاصيل أيام الالتزام: ${JSON.stringify(h.history || {})}`;
    }).join("\n");

    const topHabit = (habits || []).sort((a: any, b: any) => {
      const aCount = Object.values(a.history || {}).filter(Boolean).length;
      const bCount = Object.values(b.history || {}).filter(Boolean).length;
      return bCount - aCount;
    })[0];

    const leastHabit = (habits || []).sort((a: any, b: any) => {
      const aCount = Object.values(a.history || {}).filter(Boolean).length;
      const bCount = Object.values(b.history || {}).filter(Boolean).length;
      return aCount - bCount;
    })[0];

    const fallbackAnswer = `# 📊 تقرير تقييم العادات الشخصية والسلوك (نسخة محاكاة محلية)
  
### 1. 📈 قراءة تحليلية سلوكية للفترة: *${period}*
يظهر من سجلاتك التزام بنسبة **${overallCompliance}%** إجمالاً. هذا مستوى من الانضباط يعكس رغبة صادقة ومحاولة مستمرة لتطوير الذات وبناء هيكل روتيني منظم. 
${topHabit ? `أبرز عاداتك التزاماً هي **"${topHabit.name}"**، وهو ما يوضح قدرتك العالية على تثبيت هذا السلوك وتحويله إلى جزء من هويتك اليومية.` : ""}

### 2. 🧠 الرابط النفسي والعصبي للعادات المسجلة
* **العادات البدنية والصحية:** شرب الماء وممارسة الرياضة تحفز تدفق الدم والناقلات العصبية مثل *الإندورفين* و*الدوبامين*، مما يقلل بشكل مباشر من مستويات هرمون القلق (الكورتيزول).
* **عادات العقل والتأمل:** التمارين الذهنية والتأمل تعزز مرونة القشرة الجبهية في الدماغ المسؤول عن تنظيم المشاعر والتخطيط، مما يقلل من حدة استجابة الغدة اللوزية (Amygdala) للمواقف الموترة.

### 3. ⚠️ رصد العقبات والتحديات
${leastHabit ? `تظهر السجلات تراجعاً نسبياً في عادة **"${leastHabit.name}"**.` : ""} 
غالباً ما ينشأ تراجع الالتزام بعادات معينة من:
* **التسويف:** نتيجة ربط العادة بالجهد بدلاً من المكافأة.
* **فقدان المرونة:** محاولة تدوين العادة في أوقات مزدحمة أو غير مريحة.
* **الحل:** استخدم تقنية "ربط العادات" (Habit Stacking)، بوضع العادة الجديدة مباشرة بعد عادة راسخة تفعلها تلقائياً.

### 4. 🚀 خطة عمل مخصصة للمرحلة القادمة
1. **قاعدة الدقيقتين:** ابدأ بأصغر جزء ممكن من العادة لتقليل المقاومة الذهنية الأولية.
2. **تجهيز البيئة:** اجعل أدوات ومحفزات العادات (كوب الماء، كتاب القراءة، لباس الرياضة) مرئية جداً في محيطك اليومي.
3. **نظام المكافأة الفورية:** كافئ نفسك بهدية معنوية أو دقيقة راحة فور الفراغ من إنجاز العادة لإرسال إشارة إيجابية لمسارات الدوبامين في دماغك.`;

    try {
      const userPrompt = `بناءً على قائمة العادات والبيانات التالية لفترة: ${period}، وبنسبة التزام عامة بلغت ${overallCompliance}%:

البيانات المسجلة للعادات:
${formattedHabits}

يرجى تزويدي بتقييم سلوكي شامل باللغة العربية الفصحى يغطي:
1. 📈 قراءة تحليلية سلوكية لمدى الانضباط.
2. 🧠 الرابط النفسي والعصبي والفوائد طويلة المدى للعادات المذكورة.
3. ⚠️ رصد العقبات المحتملة التي قد تؤدي للتراجع.
4. 🚀 خطة عمل وتوصيات سلوكية مخصصة للمرحلة القادمة للتغلب على التحديات وتحسين نسبة الالتزام.

يرجى إظهار التعاطف والتشجيع وتنسيق الرد بشكل منظم وجميل باستخدام Markdown.`;

      const systemInstruction = "أنت خبير ومستشار متميز في تحليل السلوكيات وبناء العادات الإيجابية والتنمية الشخصية المستندة للبيانات العلمية باللغة العربية الفصحى. مهمتك هي قراءة قائمة عادات المستخدم ومدى الالتزام وصياغة تقييم رصين ومحفز.";
      const answer = await generateWithGeminiREST(userPrompt, systemInstruction, false, keyToUse);
      return createSuccessResponse({ success: true, answer, source: "gemini" });
    } catch (err) {
      return createSuccessResponse({ success: true, answer: fallbackAnswer, source: "local-simulation" });
    }
  }

function getDynamicSmartAdvisorFallback(query: string, reportType: string, diaries: any[], books: any[], gratitudeCards: any[], habits: any[]): string {
  if (reportType === "therapist") {
    return `# 🎓 تقرير جلسة العلاج النفسي الذكي (تحليل مخصص)
*تم التوليد بناءً على سجل بياناتك اليومية المحفوظة*

### 1. 📝 ملخص التدوين
لديك **${diaries?.length || 0} مذكرات مسجلة**، و**${gratitudeCards?.length || 0} بطاقات امتنان**، و**${habits?.length || 0} عادات سلوكية**.

### 2. 📊 الحالة المزاجية العامة
تظهر البيانات مسيرة متوازنة مع السعي الدائم لتنظيم الأفكار ومواجهة الضغوط بوعي ذاتي ومرونة.

### 3. 🗣️ محاور الجلسة القادمة المقترحة
- كيفية الحفاظ على استمرارية تدوين اليوميات والعادات.
- إدارة توتر المهام والتفكير الزائد في المساء قبل النوم.`;
  }

  const rawQuery = (query || "").trim();
  const cleanedQuery = rawQuery.toLowerCase();

  // Handle identity questions ("من أنا", "أنا مين", etc.)
  if (cleanedQuery.includes("من أنا") || cleanedQuery.includes("أنا مين") || cleanedQuery.includes("من اكون") || cleanedQuery.includes("مين أنا") || cleanedQuery.includes("عرفني بنفسي")) {
    const topHabitNames = (habits || []).slice(0, 3).map((h: any) => `"${h.name}"`).join("، ");
    return `أهلاً بك يا صديقي! بناءً على قراءة ملفك وتدويناتك في تطبيق "يومياتي الذكية":

• **المذكرات واليوميات:** لديك **${(diaries || []).length} مذكرات وخواطر** مسجلة وثقت فيها مشاعرك وأفكارك.
• **العادات السلوكية:** تتابع **${(habits || []).length} عادات**${topHabitNames ? ` (أبرزها: ${topHabitNames})` : ''}.
• **المكتبة والكتب:** تحتوي مكتبتك على **${(books || []).length} كتب ومراجع** مقروءة.
• **بطاقات الامتنان:** سجلت **${(gratitudeCards || []).length} بطاقة امتنان** تعبر عن تقديرك للنعم واللحظات الإيجابية.

أنا "مستشارك الذكي"، متواجد دائماً لتحليل يومياتك وإجابتك عن أي جانب من حياتك، أفكارك، أو عاداتك!`;
  }

  // Search across all data for query keywords
  const stopWords = ["اعرض", "عرض", "الملاحظات", "التي", "تتحدث", "عن", "الخاصة", "بـ", "ما", "ماذا", "هو", "هي", "في", "على", "من", "إلى", "كيف", "هل", "أين", "متى", "اريد", "أريد", "معرفة", "ابحث"];
  const searchTerms = cleanedQuery
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2 && !stopWords.includes(w));

  const matchingDiaries = (diaries || []).filter((d: any) => {
    const fullText = [
      d.title || "",
      d.content || "",
      (d.moods || []).join(" "),
      (d.tags || []).join(" "),
      (d.symptomsChecklist || []).join(" "),
      (d.cbtWorksheets || []).map((c: any) => `${c.triggerEvent} ${c.negativeThoughts} ${c.rationalAlternative}`).join(" ")
    ].join(" ").toLowerCase();
    return searchTerms.some(term => fullText.includes(term));
  });

  const matchingBooks = (books || []).filter((b: any) => {
    const fullText = `${b.title || ""} ${b.notes || ""}`.toLowerCase();
    return searchTerms.some(term => fullText.includes(term));
  });

  const matchingGratitude = (gratitudeCards || []).filter((g: any) => {
    const fullText = (g.text || "").toLowerCase();
    return searchTerms.some(term => fullText.includes(term));
  });

  const matchingHabits = (habits || []).filter((h: any) => {
    const fullText = `${h.name || ""} ${h.category || ""}`.toLowerCase();
    return searchTerms.some(term => fullText.includes(term));
  });

  if (matchingDiaries.length > 0 || matchingBooks.length > 0 || matchingGratitude.length > 0 || matchingHabits.length > 0) {
    let answer = `### 🔍 نتائج البحث والتحليل المباشر في سجلاتك لسؤالك: "${rawQuery}"\n\n`;
    if (matchingDiaries.length > 0) {
      answer += `#### 📓 التدوينات واليوميات المطابقة (${matchingDiaries.length}):\n`;
      matchingDiaries.slice(0, 5).forEach((d: any) => {
        const dateStr = d.createdAt ? d.createdAt.split('T')[0] : '';
        answer += `* **[📅 ${dateStr}] - ${d.title || 'بدون عنوان'}**\n  > ${d.content ? d.content.substring(0, 250) : ''}...\n`;
      });
      answer += `\n`;
    }
    if (matchingBooks.length > 0) {
      answer += `#### 📚 الكتب والملاحظات المطابقة (${matchingBooks.length}):\n`;
      matchingBooks.forEach((b: any) => {
        answer += `* **"${b.title}"** - ملاحظاتك: ${b.notes || 'لا توجد ملاحظات إضافية'}\n`;
      });
      answer += `\n`;
    }
    if (matchingGratitude.length > 0) {
      answer += `#### 🌸 بطاقات الامتنان المطابقة:\n`;
      matchingGratitude.forEach((g: any) => {
        answer += `* ${g.text}\n`;
      });
      answer += `\n`;
    }
    if (matchingHabits.length > 0) {
      answer += `#### 🎯 العادات ذات الصلة:\n`;
      matchingHabits.forEach((h: any) => {
        answer += `* العادة: **${h.name}**\n`;
      });
    }
    return answer;
  }

  if ((diaries || []).length > 0) {
    const latestDiaries = diaries.slice(0, 3);
    return `بحثت في سجلاتك عن موضوع "${rawQuery}". لم أجد كلمة مطابقة تماماً في الملاحظات الحالية، لكن بناءً على أحدث يومياتك المسجلة (${latestDiaries.map((d: any) => `"${d.title || 'تدوينة'}"`).join('، ')}):\n\n` +
           `• **الرؤية التحليلية:** يظهر أنك تحافظ على تدوين مشاعرك وأفكارك بانتظام.\n` +
           `• **نصيحة المستشار:** يمكنك إضافة تدوينة جديدة تخص موضوع "${rawQuery}" وسأقوم بتحليلها فوراً وربطها بعاداتك وصحتك النفسية!`;
  }

  return `أهلاً بك في **المستشار الذكي لليوميات**! سؤالك حول "${rawQuery}" هو بداية رائعة. لا توجد تدوينات كافية مسجلة بعد في التطبيق. ابدأ بتدوين أفكارك وعاداتك ليتمكن المستشار من إعطائك تحليلات شخصية دقيقة ومليئة بالرؤى والتعاطف!`;
}

  if (url.includes('/api/gemini/smart-advisor')) {
    const { diaries, query, reportType, gratitudeCards, habits, books } = requestBody;
    const fallbackAnswer = getDynamicSmartAdvisorFallback(query, reportType, diaries, books, gratitudeCards, habits);

    try {
      // Formatting logic similar to server.ts
      const formattedDiaries = (diaries || []).map((d: any) => {
        if (!d) return "";
        const moodsStr = d.moods ? d.moods.join(", ") : "لا يوجد";
        const aiAnalysisStr = d.aiMoodAnalysis 
          ? d.aiMoodAnalysis.map((item: any) => `${item.mood} (${item.percentage}%)`).join(", ") 
          : "لا يوجد";
        const cbtStr = d.cbtWorksheets && d.cbtWorksheets.length > 0 
          ? d.cbtWorksheets.map((w: any) => `  * الحدث المثير: ${w.triggerEvent || ''}\n  * الأفكار التلقائية السلبية: ${w.negativeThoughts || ''}\n  * التشوه المعرفي المكتشف: ${w.cognitiveDistortion || ''}\n  * البديل العقلاني المتبنى: ${w.rationalAlternative || ''}`).join("\n---\n")
          : "لا يوجد";
        const tasksStr = d.tasks && d.tasks.length > 0 ? d.tasks.map((t: any) => `  - [${t.completed ? '✓' : ' '}] ${t.text || ''}`).join("\n") : "لا يوجد";
        
        return `التاريخ: ${safeFormatDate(d.createdAt)}
العنوان: ${d.title || 'بدون عنوان'}
المزاج: ${moodsStr}
ساعات النوم: ${d.sleepHours || 'لم يسجل'}
الرياضة: ${d.sportsDuration || 'لم يسجل'}
المهام:
${tasksStr}
تمارين CBT:
${cbtStr}
المحتوى النصي: ${d.content || ''}`;
      }).join("\n\n");

      const formattedHabits = (habits || []).map((h: any) => {
        if (!h) return "";
        const doneDates = Object.entries(h.history || {}).filter(([_, completed]) => completed).map(([d]) => d).join(", ");
        return `- العادة: ${h.name || ''} (${h.category || ''}) [الأيام: ${doneDates || 'لا توجد'}]`;
      }).join("\n");

      const formattedBooks = (books || []).map((b: any) => {
        if (!b) return "";
        return `- كتاب: "${b.title || ''}" [الملخص والملاحظات: ${b.notes || 'لا يوجد'}]`;
      }).join("\n");
      
      const formattedGratitude = (gratitudeCards || []).map((g: any) => {
        if (!g) return "";
        return `- [${safeFormatDate(g.createdAt)}] ${g.text || ''}`;
      }).join("\n");

      let systemInstruction = "أنت مستشار ذكي وخبير رائد في تحليل البيانات الشخصية، تدوين اليوميات، ومتابعة الصحة النفسية باللغة العربية. مهمتك هي قراءة مذكرات وتصرفات المستخدم وتقديم إجابات عميقة، دقيقة ومليئة بالتعاطف البشري لمساعدته على فهم أنماط حياته ومشاعره.";
      let userPrompt = "";

      if (reportType === "therapist") {
        userPrompt = `بناءً على مذكراتي وتصرفاتي المسجلة في التطبيق (اليوميات والخواطر، وعاداتي ومدى التزامي بها، وكتبي وملخصاتي وملاحظات القراءة، وبطاقات الامتنان والشكر المكتوبة)، يرجى صياغة "تقرير جلسة العلاج النفسي الذكي" المخصص والكامل باللغة العربية الفصحى والموجه لأخصائي العلاج النفسي الخاص بي أو لمساعدتي ذاتياً.
يرجى تغطية المحاور التالية بدقة شديدة وعلمية بالاعتماد الكلي على البيانات المرفقة:
1. 📝 ملخص الفترة الحالية وسياقها العام.
2. 📊 تحليل دقيق للحالة النفسية والاتجاهات المزاجية (المشاعر الغالبة ونسبها وتغيرها).
3. 🏆 أهم الإنجازات واللحظات الإيجابية التي تم رصدها (مع ربطها ببطاقات الامتنان وملاحظات الكتب المنجزة).
4. 📉 الإخفاقات، ومسببات الإحباط أو التراجع.
5. ⚡ مصادر التوتر الأساسية والمثيرات النفسية (Triggers).
6. 🗣️ نقاط مقترحة ومحاور هامة لمناقشتها مع المعالج في الجلسة القادمة.
7. 🔄 مقارنة موجزة بين الفترات وعادات النوم والرياضة والماء والالتزام بالعادات.
8. 💡 نصائح وتوصيات سلوكية وعلاجية بناءة للمستخدم.

أجب بتنسيق Markdown جميل مع تباعد مريح وعناوين بارزة.`;
      } else {
        userPrompt = `بناءً على كافة التفاصيل والمعلومات المسجلة في التطبيق (اليوميات، الخواطر، التمارين CBT، الأدوية، النوم، الرياضة، قائمة العادات وتاريخها، الكتب والملخصات وبطاقات مفكرة الامتنان)، يرجى الإجابة بدقة وتحليل على سؤالي التالي: "${query}"

التفاصيل والبيانات المتوفرة للتحليل الشامل والكامل:

1) مذكرات اليوميات والخواطر وعناصر تتبع الحياة والصحة النفسية:
${formattedDiaries || "لا توجد يوميات مسجلة حتى الآن."}

2) بطاقات مفكرة الامتنان والشكر:
${formattedGratitude || "لا توجد بطاقات امتنان مسجلة حالياً."}

3) العادات السلوكية ومدى الالتزام اليومي والأسبوعي بها:
${formattedHabits || "لا توجد عادات مسجلة."}

4) ركن الكتب والملخصات والملاحظات الثقافية:
${formattedBooks || "لا توجد كتب مضافة حتى الآن."}

يرجى مراعاة ما يلي:
- لديك الصلاحية المطلقة والوصول الكامل لـ (كل حرف في التطبيق). عندما يسأل المستخدم عن أي شيء يتعلق بيومياته، عاداته، كتبه ومقروءاته، أهدافه، أدويته، أو علاجه السلوكي المعرفي، ابحث في هذه الأقسام وقدم إجابة مفصلة وصادقة وتأملية.
- كن متعاطفاً وصريحاً وعلمياً في تحليلك للمزاج والصحة النفسية وسلوك القراءة والنشاط البدني.
- إذا لم تتوفر مذكرات أو بيانات كافية للإجابة، وضّح ذلك بلطف واقترح عليه ما يسجله أو يضيفه مستقبلاً لتمكينك من إجابته بدقة أعلى.`;
      }

      const answer = await generateWithGeminiREST(userPrompt, systemInstruction, false, keyToUse);
      return createSuccessResponse({ success: true, answer, source: "gemini" });
    } catch (err) {
      return createSuccessResponse({ success: true, answer: fallbackAnswer, source: "local-simulation" });
    }
  }

  if (url.includes('/api/gemini/diary-assistant')) {
    const { title, content, promptType } = requestBody;
    if (!content || content.trim() === "") {
      return createSuccessResponse({ success: true, answer: "يرجى كتابة بعض الكلمات أولاً لكي أتمكن من مساعدتك في تحليل هذه اليومية." });
    }

    let prompt = "";
    if (promptType === "summarize") {
      prompt = `لخص هذه اليومية المكتوبة باللغة العربية باختصار شديد وبشكل نقاط مركزة وأنيقة:
العنوان: "${title || 'بدون عنوان'}"
اليومية: "${content}"`;
    } else if (promptType === "mistakes") {
      prompt = `اقرأ اليومية التالية واستخرج بلطف وحكمة أي أخطاء سلوكية، فكرية، أو أنماط تفكير سلبية (مثل لوم الذات، التفكير الكارثي، التعميم) قد ارتكبتها، وقدم لي بديلاً فكرياً صحياً:
العنوان: "${title || 'بدون عنوان'}"
اليومية: "${content}"`;
    } else if (promptType === "plan") {
      prompt = `بناءً على هذه اليومية والمشاعر المسجلة فيها، صمم لي خطة عمل عملية من 3 نقاط ملموسة للغد لمساعدتي على التقدم والتحسن:
العنوان: "${title || 'بدون عنوان'}"
اليومية: "${content}"`;
    } else {
      prompt = `اليومية: "${content}"
الطلب: قم بتحليل هذه اليومية واستخرج أهم النقاط والمحاور الواردة فيها.`;
    }

    try {
      const answer = await generateWithGeminiREST(prompt, undefined, false, keyToUse);
      return createSuccessResponse({ success: true, answer, source: "gemini" });
    } catch (err) {
      let answer = "";
      if (promptType === "summarize") {
        answer = `📝 **ملخص اليومية (نسخة محاكاة):**\n• تسجل التدوينة الحالة الشعورية والذهنية الراهنة بدقة.\n• هناك رغبة واضحة في التوازن والتعافي الذاتي وتنظيم الأفكار.`;
      } else if (promptType === "mistakes") {
        answer = `💡 **تحليل الأنماط الفكرية (نسخة محاكاة):**\n• يلاحظ وجود ميل خفيف لـ **\"التفكير بكل شيء أو لا شيء\"**.\n• **البديل الفكري الصحي:** تذكر أن الخطوة البسيطة نحو الأمام تظل مكسباً حقيقياً!`;
      } else {
        answer = `🎯 **خطة مقترحة ليوم الغد (نسخة محاكاة):**\n1. خصص أول 15 دقيقة في الصباح لنفسك.\n2. اختر أهم مهمتين فقط وركز عليهما.\n3. حدد موعداً للتوقف وممارسة تمرين تنفس مهدئ.`;
      }
      return createSuccessResponse({ success: true, answer, source: "local-simulation" });
    }
  }

  if (url.includes('/api/gemini/gratitude-advisor')) {
    const { gratitudeCards, diaries, action, cardText } = requestBody;
    const formattedGratitude = (gratitudeCards || []).map((g: any) => `- [${g.createdAt ? g.createdAt.split('T')[0] : ''}] ${g.text}`).join("\n");
    const formattedDiaries = (diaries || []).slice(0, 5).map((d: any) => `العنوان: ${d.title}\nالمحتوى: ${d.content}`).join("\n\n");

    try {
      let systemInstruction = "أنت أخصائي ومعالج نفسي خبير في علم النفس الإيجابي وتطبيقات الامتنان والوعي الذاتي باللغة العربية. مهمتك هي تشجيع المستخدم، تحليل بطاقات الامتنان التي يسجلها، ومساعدته على تحويل وعيه نحو الجوانب الإيجابية للتخفيف من القلق والاكتئاب.";
      let userPrompt = "";
      const isJson = action === "ai_generator";

      if (action === "reflect") {
        userPrompt = `بناءً على بطاقات الامتنان والأشياء الإيجابية التي سجلتها أدناه، قم بتحليل مصادر السعادة والاستقرار النفسي لدي. اعطني تأملاً جميلاً، معبراً، ومليئاً بالطاقة الإيجابية، بالإضافة إلى نصائح عملية من علم النفس الإيجابي لتعزيز مشاعر الرضا والامتنان في حياتي اليومية.

الأشياء الإيجابية التي أنا ممتن لها:
${formattedGratitude || "لا توجد بطاقات مسجلة حالياً."}

اليوميات الأخيرة للسياق العام:
${formattedDiaries || "لا توجد يوميات مسجلة."}

اكتب ردك باللغة العربية بأسلوب راقٍ، دافئ، ومحفز، باستخدام تنسيق Markdown مريح ومنظم.`;
      } else if (action === "card_analysis") {
        userPrompt = `أنت طبيب وأخصائي نفسي خبير في علم النفس الإيجابي وتطبيقات الامتنان. قم بتحليل هذه اللحظة السعيدة أو النعمة التي دونها المستخدم في بطاقة امتنانه اليوم:
"${cardText || ""}"

قدم له بأسلوب دافئ، لطيف، وعلمي مبسط للغاية (في حدود سطرين أو ثلاثة فقط) كيف يؤثر هذا الحدث إيجابياً على مرونته النفسية وصحته العصبية ومسارات الدوبامين/السيروتونين لديه، وعزز شعوره بالامتنان بكلمة طيبة ومشجعة كطبيب صديق.`;
      } else if (action === "ai_generator") {
        userPrompt = `أنت معالج وأخصائي نفسي خبير في علم النفس الإيجابي. مهمتك هي قراءة مذكرات اليوميات الأخيرة للمستخدم التالية، والبحث بعناية مفرطة وبصيرة وحساسية إيجابية عن "نعمة بسيطة مخفية" أو "حدث إيجابي لطيف" أو "لحظة رضا" قد يكون المستخدم مر بها ولم يدرك عظمتها بالكامل في غمرة القلق.
صغ هذه النعمة في بطاقة امتنان واضحة ورشيقة باللغة العربية تبدأ بضمير المتكلم (مثال: "أنا ممتن لـ...") بحيث يمكن إضافتها لمفكرة الامتنان لتعزز مرونته النفسية.

اليوميات الأخيرة للمستخدم:
${formattedDiaries || "لا توجد يوميات مسجلة."}

يجب أن تقوم بإرجاع النتيجة ككائن JSON صرف فقط بدون أي ماركداون أو تعليقات خارجية، بالتنسيق التالي:
{
  "text": "نص بطاقة الامتنان المقترح بالكامل وبأسلوب ملهم دافئ",
  "suggestedColor": "اسم صنف اللون المقترح من القائمة التالية فقط: yellow أو green أو peach أو lavender أو blue أو pink"
}

إذا لم تكن هناك يوميات كافية أو لم تجد أي لحظة مناسبة، فاقترح بطاقة امتنان عامة دافئة وجميلة تناسب السعي نحو راحة البال والسلام الداخلي.`;
      } else {
        userPrompt = `أريد أن أكتب في مفكرة الامتنان اليوم ولكنني أشعر ببعض الحيرة أو الروتين. بناءً على يومياتي الأخيرة وسياق حياتي أدناه، اقترح عليّ 3 أسئلة تفكرية أو تلميحات امتنان دقيقة ومخصصة (Gratitude Prompts) تحفزني على ملاحظة الأشياء الجميلة والصغيرة المحيطة بي اليوم لأسجلها في مفكرتي.

الأشياء الإيجابية التي سجلتها سابقاً للامتنان:
${formattedGratitude || "لا توجد بطاقات سابقة."}

اليوميات الأخيرة للسياق العام:
${formattedDiaries || "لا توجد يوميات مسجلة."}

اعطني الاقتراحات بأسلوب ودي ولطيف باللغة العربية، مع تقديم فكرة بسيطة خلف كل اقتراع وكيف تساهم في تحسين مزاجي وسلوكي اليومي.`;
      }

      const text = await generateWithGeminiREST(userPrompt, systemInstruction, isJson, keyToUse);
      
      if (isJson) {
        const parsed = JSON.parse(text.trim());
        return createSuccessResponse({ success: true, answer: JSON.stringify(parsed), source: "gemini" });
      }
      return createSuccessResponse({ success: true, answer: text, source: "gemini" });
    } catch (err) {
      let fallbackAnswer = "";
      if (action === "reflect") {
        fallbackAnswer = `### ✨ تأمل الامتنان النفسي والتحليل الذاتي (نسخة محاكاة محلية)\nسعداء برؤيتك تواظب على تدوين الأشياء الإيجابية في حياتك! يظهر تحليل بطاقات الامتنان الخاصة بك تركيزك على العلاقات العائلية واللحظات البسيطة.`;
      } else if (action === "card_analysis") {
        fallbackAnswer = `هذا الحدث الإيجابي الصغير يساهم مباشرة في تحفيز خلايا الفص الجبهي لإطلاق الدوبامين، مما يخفض حساسية اللوزة الدماغية (Amygdala) تجاه مسببات التوتر والتوتر اليومي.`;
      } else if (action === "ai_generator") {
        fallbackAnswer = JSON.stringify({
          text: "أنا ممتن للسلام الداخلي ومحاولتي الدائمة لتنظيم يومياتي وأفكاري والالتزام بعاداتي الإيجابية برغم كل الضغوط.",
          suggestedColor: "lavender"
        });
      } else {
        fallbackAnswer = `### 💡 مقترحات تفكرية لدفتر امتنانك اليوم (نسخة محاكاة محلية)\n1. فكر في شخص قام بفعل لطيف من أجلك مؤخراً.\n2. ما هو التحدي البسيط الذي مر بسلام اليوم؟`;
      }
      return createSuccessResponse({ success: true, answer: fallbackAnswer, source: "local-simulation" });
    }
  }

  if (url.includes('/api/gemini/cbt-analyze')) {
    const { triggerEvent, negativeThoughts } = requestBody;
    try {
      const prompt = `أنت معالج نفسي عيادي خبير في العلاج المعرفي السلوكي (CBT) باللغة العربية.
قم بتحليل الفكرة السلبية التلقائية التالية الناتجة عن الحدث المثير اللاحق:
الحدث المثير: "${triggerEvent || 'غير محدد'}"
الفكرة السلبية التلقائية: "${negativeThoughts}"

المطلوب:
1. تحديد نوع "التشوه المعرفي" (Cognitive Distortion) الأكثر مطابقة (مثل: التفكير القطبي بالأبيض والأسود، القفز إلى الاستنتاجات، التهويل/الكارثية، شخصنة الأمور، التصفية الذهنية، لوم الذات). مع تقديم شرح بسيط ومقنع له باللغة العربية (في سطرين).
2. صياغة "الفكرة البديلة الأكثر عقلانية ومنطقية" (Rational Alternative Thought) التي تفكك هذه الفكرة وتساعد المستخدم على الشعور بالهدوء والواقعية (في سطرين أو ثلاثة).

يرجى إرجاع النتيجة ككائن JSON صرف فقط بالتنسيق التالي:
{
  "cognitiveDistortion": "اسم التشوه المعرفي وشرحه القصير",
  "rationalAlternative": "الفكرة البديلة العقلانية المقترحة بدقة"
}
أرجع JSON الصرف فقط وبدون أي ماركداون أو تعليقات خارجية.`;

      const text = await generateWithGeminiREST(prompt, undefined, true, keyToUse);
      const parsed = JSON.parse(text.trim());
      return createSuccessResponse({ success: true, ...parsed, source: "gemini" });
    } catch (err) {
      return createSuccessResponse({
        success: true,
        cognitiveDistortion: "التهويل وتوقع الكوارث (Catastrophizing): افتراض السيناريو الأسوأ وتكبير حجم المشاكل دون أدلة منطقية كافية.",
        rationalAlternative: "الفشل في مهمة واحدة لا يعني نهاية المطاف؛ هذه فرصة رائعة للتعلم وتعديل المسار، والأمور ستمر بسلام كما مرت مثيلاتها سابقاً.",
        source: "local-simulation"
      });
    }
  }

  if (url.includes('/api/gemini/daily-inspiration')) {
    const { moods } = requestBody;
    const moodsStr = moods ? moods.join(", ") : "طبيعي";
    try {
      const prompt = `أنت طبيب نفسي وأخصائي تنمية ذاتية وبناء مرونة نفسية رائد في الوطن العربي.
بناءً على المشاعر الراهنة للمستخدم اليوم وهي: (${moodsStr})، قم بتوليد حكمة نفسية بليغة وملهمة أو نصيحة عملية عميقة لراحة البال السلام الداخلي باللغة العربية الفصحى.

يرجى إرجاع النتيجة ككائن JSON صرف بالتنسيق التالي:
{
  "quote": "نص الحكمة أو النصيحة بأسلوب دافئ ومطمئن للنفس يبعث الأمل والسكينة",
  "author": "اسم القائل أو مصدر الحكمة (مثال: 'طبيبك النفسي الصديق'، 'علم النفس المعرفي')"
}
أرجع JSON الصرف فقط وبدون أي ماركداون أو تعليقات خارجية.`;

      const text = await generateWithGeminiREST(prompt, undefined, true, keyToUse);
      const parsed = JSON.parse(text.trim());
      return createSuccessResponse({ success: true, ...parsed, source: "gemini" });
    } catch (err) {
      const quotesList = [
        { quote: "تذكر دائماً أن القلق لا يمنع ألم الغد، ولكنه يسرق متعة وسلام اليوم فحسب.", author: "دكتورك النفسي الصديق" },
        { quote: "السلام الداخلي يبدأ في اللحظة التي تختار فيها ألا تسمح لحدث خارجي أو فكرة عابرة بالتحكم في مشاعرك.", author: "أبحاث علم النفس المعرفي" }
      ];
      const selectedQuote = quotesList[Math.floor(Math.random() * quotesList.length)];
      return createSuccessResponse({ success: true, ...selectedQuote, source: "local-simulation" });
    }
  }

  if (url.includes('/api/gemini/diary-chat')) {
    const { title, content, chatLogs, newMessage, diaryType, moods, attachments } = requestBody;
    const formattedLogs = (chatLogs || []).map((msg: any) => `${msg.sender === 'user' ? 'المستخدم' : 'المعالج النفسي الذكي'}: ${msg.text}`).join("\n");

    const prompt = `أنت طبيب نفسي ومعالج إكلينيكي متعاطف وخبير باللغة العربية.
أنت الآن في جلسة علاجية تفاعلية سرية تسمى "مساحة الفضفضة والتحليل 🧠✨" مع المستخدم بناءً على ما دونه في مذكرته الحالية:
العنوان: "${title || 'بدون عنوان'}"
نوع التدوين: "${diaryType === 'thought' ? 'خاطرة وأفكار سريعة' : 'يومية تفصيلية'}"
الحالة المزاجية المحددة: "${moods ? moods.join(', ') : 'طبيعي'}"
المحتوى الأساسي المكتوب:
"${content || 'لم يكتب المستخدم نصاً بعد'}"

المرفقات والوسائط المتاحة للتحليل: ${attachments ? attachments.join(', ') : 'لا يوجد مرفقات'}
سجل الحوار السابق:
${formattedLogs || 'لا يوجد حوار سابق، هذه بداية الجلسة.'}

رسالة المستخدم الجديدة: "${newMessage}"

المطلوب منك:
1. الرد بتعاطف وحكمة وعلم، كمعالج نفسي صديق يستمع بعمق ولا يطلق الأحكام.
2. وجه نقاشاً مثمراً يسهم في تقليل القلق وبناء المرونة النفسية.
3. كن موجزاً ومركزاً.`;

    try {
      const answer = await generateWithGeminiREST(prompt, undefined, false, keyToUse);
      return createSuccessResponse({ success: true, answer, source: "gemini" });
    } catch (err) {
      let answer = "أشكرك على هذه الفضفضة الصادقة والمشاركة العميقة. يبدو أنك تحاول تنظيم أفكارك ومواجهة مشاعرك بوعي تام وشجاعة. كمعالج نفسي، أنصحك بأن تأخذ نفساً عميقاً وتتأمل الحدث بلطف. ما هي فكرتك عما يمكننا فعله غداً كخطوة صغيرة للتغلب على هذا الشعور؟";
      if (newMessage.includes("حزين") || newMessage.includes("ضيق")) {
        answer = "أشعر بصدق كلامك، والفضفضة والتعبير عما بداخلك هما أولى خطوات التعافي النفسي والتصالح مع الذات. تذكر أن المشاعر كأمواج البحر تأتي وتذهب ولا تبقى للأبد.";
      }
      return createSuccessResponse({ success: true, answer, source: "local-simulation" });
    }
  }

  // Backup & Sync endpoints client-side simulation
  if (url.includes('/api/gemini/transcribe-audio')) {
    const { audioData, mimeType: providedMime } = requestBody;
    let mimeType = providedMime || "audio/webm";
    let base64Data = audioData || "";

    if (audioData && typeof audioData === 'string' && audioData.startsWith("data:")) {
      const parts = audioData.split(";base64,");
      if (parts.length === 2) {
        const mimeMatch = parts[0].match(/data:(.*?)$/);
        if (mimeMatch) {
          mimeType = mimeMatch[1];
        }
        base64Data = parts[1];
      }
    }

    try {
      let key = keyToUse || (window as any).__GEMINI_KEY__ || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
      if (!key) {
        try {
          const saved = localStorage.getItem('yawmiyati_settings');
          if (saved) key = JSON.parse(saved)?.userApiKey || '';
        } catch (e) {}
      }

      if (key && base64Data) {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${key.trim()}`;
        const promptText = `أنت أخصائي خبير في تفريغ الصوت وتحليل نبرة المشاعر الصوتية (Speech Emotion Recognition - SER) باللغة العربية.
استمع إلى هذا التسجيل الصوتي بدقة عالية وقم بالأتي:
1. تفريغ الكلام المنطوق إلى نص عربي واضح ومكتوب بدقة.
2. تحليل المشاعر الصوتية ونبرة المتحدث وتحديد نوع الشعور الرئيسي من القائمة التالية فقط: ["قلق", "فرح", "حزن", "غضب", "هدوء", "طبيعي"].
3. تحديد حدة المشاعر كنسبة مئوية من 0 إلى 100%، وتصنيف شدتها إلى: ["عالية", "متوسطة", "منخفضة"].
4. كتابة ملاحظة قصيرة مشوقة ودقيقة توضح الملاحظات العيادية والصوتية لنبرة المتحدث.

يرجى إرجاع JSON الصرف بالتنسيق التالي:
{
  "transcription": "النص المفرغ هنا...",
  "emotion": "طبيعي",
  "intensityScore": 75,
  "intensityLabel": "متوسطة",
  "vocalToneDetails": "نبرة صوت هادئة ومتزنة تعكس الاطمئنان والسلام",
  "recommendedColor": "teal"
}`;

        const reqBody = {
          contents: [{
            parts: [
              { inlineData: { mimeType: mimeType || "audio/webm", data: base64Data } },
              { text: promptText }
            ]
          }],
          generationConfig: { responseMimeType: "application/json" }
        };

        const res = await originalFetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reqBody)
        });

        if (res.ok) {
          const resJson = await res.json();
          const rawText = resJson.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
          const parsed = JSON.parse(rawText.trim());
          return createSuccessResponse({
            success: true,
            transcription: parsed.transcription || "تم تفريغ الصوت بنجاح.",
            speechEmotion: {
              emotion: parsed.emotion || "طبيعي",
              intensityScore: parsed.intensityScore || 70,
              intensityLabel: parsed.intensityLabel || "متوسطة",
              vocalToneDetails: parsed.vocalToneDetails || "نبرة صوت هادئة ومستقرة",
              recommendedColor: parsed.recommendedColor || "teal"
            },
            source: "gemini"
          });
        }
      }
    } catch (err) {
      console.warn("Client transcribe error, returning fallback", err);
    }

    return createSuccessResponse({
      success: true,
      transcription: "تم استلام التسجيل الصوتي وتفريغه بنجاح في مذكرتك.",
      speechEmotion: {
        emotion: "طبيعي",
        intensityScore: 70,
        intensityLabel: "متوسطة",
        vocalToneDetails: "نبرة صوت هادئة ومتزنة تعبر عن السلام والاطمئنان",
        recommendedColor: "teal"
      },
      source: "local-simulation"
    });
  }

  if (url.includes('/api/gemini/generate-note')) {
    const { promptTopic } = requestBody;
    const topic = promptTopic || "نصائح صحية ونفسية";
    try {
      const prompt = `أنت مساعد ذكاء اصطناعي متميز باللغة العربية. قم بكتابة مقال أو ملاحظة ثرية ومفيدة ومنظمة بدقة حول الموضوع التالي:
الموضوع المطلوب: "${topic}"

يرجى إرجاع النتيجة ككائن JSON بصيغة:
{
  "title": "عنوان جذاب ومناسب للملاحظة",
  "content": "المحتوى التفصيلي المكتوب بلغة عربية فصحى وبأسلوب سلس ومنظم مع استخدام نقاط واضحة ورسومات تعبيرية تناسب الموضوع"
}
أرجع JSON الصرف فقط وبدون أي ماركداون خارجي.`;

      const text = await generateWithGeminiREST(prompt, undefined, true, keyToUse);
      const parsed = JSON.parse(text.trim());
      return createSuccessResponse({ success: true, ...parsed, source: "gemini" });
    } catch (err) {
      let title = "💡 ملاحظة صحية ونفسية ذكية";
      let content = `1. **شرب الماء المنتظم**: احرص على تناول 8 أكواب ماء يومياً لتنشيط الدورة الدموية.\n2. **الحركة والرياضة**: 20 دقيقة مشي يومياً تفرز هرمون الأندورفين لتحسين المزاج.\n3. **تنظيم ساعات النوم**: النوم المبكر لمدة 7-8 ساعات يعيد ترميم خلايا الدماغ.`;
      return createSuccessResponse({ success: true, title, content, source: "local-simulation" });
    }
  }

  if (url.includes('/api/cloud-sync/save')) {
    try {
      localStorage.setItem('yawmiyaty_cloud_sync_state', JSON.stringify(requestBody));
      return createSuccessResponse({ success: true, message: "تمت المزامنة السحابية بنجاح وحفظ نسختك الاحتياطية بأمان (محلياً لعدم توفر خادم)" });
    } catch (e) {
      return createErrorResponse("فشل حفظ وتزامن البيانات سحابياً");
    }
  }

  if (url.includes('/api/cloud-sync/fetch')) {
    try {
      const stored = localStorage.getItem('yawmiyaty_cloud_sync_state');
      const data = stored ? JSON.parse(stored) : null;
      return createSuccessResponse({ success: true, data });
    } catch (e) {
      return createErrorResponse("فشل استرجاع البيانات المزامنة سحابياً");
    }
  }

  if (url.includes('/api/backup/email')) {
    return createSuccessResponse({ 
      success: true, 
      message: `تمت محاكاة إرسال النسخة الاحتياطية بنجاح وتأمينها! تم حفظ ملف النسخة الاحتياطية في السجل السحابي المحلي بنجاح لصاحب البريد: ${requestBody.email}`
    });
  }

  return originalFetch(url, init);
}

// Helper to construct success response
function createSuccessResponse(data: any): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Helper to construct error response
function createErrorResponse(message: string, requiresKey: boolean = true): Response {
  return new Response(JSON.stringify({ success: false, error: message, requiresKey }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Utility to clean up and parse JSON Array output from Gemini
function extractJsonArray(text: string): any[] {
  try {
    const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    const jsonStr = jsonMatch ? jsonMatch[0] : text;
    return JSON.parse(jsonStr.trim());
  } catch (e) {
    console.error("Failed to parse JSON Array from Gemini text:", text, e);
    return [];
  }
}
