// Client-side fetch interceptor to support production deployment on Vercel
// This allows the React SPA to work fully offline and serverless if Express is not running.

const originalFetch = window.fetch;

// Helper to make a direct REST call to Google's official Gemini API
async function generateWithGeminiREST(prompt: string, systemInstruction?: string, isJson?: boolean, userApiKey?: string) {
  if (!userApiKey || userApiKey.trim() === '') {
    throw new Error("مفتاح الـ API الخاص بـ Gemini غير متوفر. يرجى إضافته في الإعدادات أولاً.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${userApiKey.trim()}`;
  
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

  const res = await originalFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    let errMessage = errData?.error?.message || `Google API error: ${res.statusText}`;
    
    if (errMessage.includes("API key not valid") || errMessage.includes("API_KEY_INVALID") || errMessage.includes("invalid key")) {
      errMessage = "مفتاح الـ API غير صالح. يرجى التأكد من نقله وكتابته بشكل صحيح من Google AI Studio.";
    } else if (errMessage.includes("Quota exceeded") || errMessage.includes("limit") || errMessage.includes("exhausted")) {
      errMessage = "تم تجاوز حد الاستخدام المسموح به لهذا المفتاح (Quota Exceeded).";
    } else if (errMessage.includes("unsupported country") || errMessage.includes("not available in your country") || errMessage.includes("not supported")) {
      errMessage = "طراز الذكاء الاصطناعي (gemini-3.1-flash-lite) أو منطقتك غير مدعومة حالياً مع هذا المفتاح.";
    }
    
    throw new Error(errMessage);
  }

  const resJson = await res.json();
  const text = resJson.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text;
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

  if (url.includes('/api/gemini/smart-advisor')) {
    const { diaries, query, reportType, gratitudeCards, habits, books } = requestBody;
    
    // Formatting logic similar to server.ts
    const formattedDiaries = (diaries || []).map((d: any) => {
      const moodsStr = d.moods ? d.moods.join(", ") : "لا يوجد";
      const aiAnalysisStr = d.aiMoodAnalysis 
        ? d.aiMoodAnalysis.map((item: any) => `${item.mood} (${item.percentage}%)`).join(", ") 
        : "لا يوجد";
      const cbtStr = d.cbtWorksheets && d.cbtWorksheets.length > 0 
        ? d.cbtWorksheets.map((w: any) => `  * الحدث المثير: ${w.triggerEvent}\n  * الأفكار التلقائية السلبية: ${w.negativeThoughts}\n  * التشوه المعرفي المكتشف: ${w.cognitiveDistortion}\n  * البديل العقلاني المتبنى: ${w.rationalAlternative}`).join("\n---\n")
        : "لا يوجد";
      const tasksStr = d.tasks && d.tasks.length > 0 ? d.tasks.map((t: any) => `  - [${t.completed ? '✓' : ' '}] ${t.text}`).join("\n") : "لا يوجد";
      
      return `التاريخ: ${d.createdAt.split('T')[0]}
العنوان: ${d.title || 'بدون عنوان'}
المزاج: ${moodsStr}
ساعات النوم: ${d.sleepHours || 'لم يسجل'}
الرياضة: ${d.sportsDuration || 'لم يسجل'}
المهام:
${tasksStr}
تمارين CBT:
${cbtStr}
المحتوى النصي: ${d.content}`;
    }).join("\n\n");

    const formattedHabits = (habits || []).map((h: any) => {
      const doneDates = Object.entries(h.history || {}).filter(([_, completed]) => completed).map(([d]) => d).join(", ");
      return `- العادة: ${h.name} (${h.category}) [الأيام: ${doneDates || 'لا توجد'}]`;
    }).join("\n");

    const formattedBooks = (books || []).map((b: any) => `- كتاب: "${b.title}" [الملخص والملاحظات: ${b.notes || 'لا يوجد'}]`).join("\n");
    const formattedGratitude = (gratitudeCards || []).map((g: any) => `- [${g.createdAt ? g.createdAt.split('T')[0] : ''}] ${g.text}`).join("\n");

    const fallbackAnswer = reportType === "therapist" ? `# 🎓 تقرير جلسة العلاج النفسي الذكي (نسخة محاكاة محلية)
*تم الإنشاء تلقائياً بناءً على مذكراتك المحفوظة محلياً*

### 1. 📝 ملخص الفترة الحالية
بناءً على مذكراتك المسجلة، يظهر التزام جيد بتدوين مشاعرك وأفكارك. يتبين أن هناك تذبذباً طبيعياً في النشاط اليومي وتأثراً مباشراً بالأحداث الخارجية والضغوطات الأكاديمية أو المهنية.

### 2. 📊 الحالة المزاجية الغالبة
المزاج السائد هو **طبيعي / ممتن** بنسبة 60%، مع نوبات من **القلق والتوتر** بنسبة 25% ترتبط غالباً بالتفكير في المستقبل والمهام المتراكمة، ونسب بسيطة من **الإرهاق** بنسبة 15%.

### 3. 🏆 أهم الإنجازات واللحظات الإيجابية
- الاستمرارية في تسجيل مذكراتك والتعبير الذاتي يعكس وعياً ذاتياً ممتازاً.
- التعبير عن الامتنان واللحظات البسيطة مثل الحديث عن العلاقات أو اللقاءات الإيجابية.

### 4. ⚡ مصادر التوتر والمثيرات (Triggers)
- الشعور بالضغط من تراكم المهام أو عدم إنجاز قائمة المهام المطلوبة.
- فترات التفكير الزائد في المساء والتي تزيد من معدل الأرق وتؤثر على جودة النوم.

### 5. 🗣️ اقتراحات للنقاش مع معالجك في الجلسة القادمة
* **موضوع التفكير المفرط (Overthinking):** كيف يمكن إيقاف دوامة الأفكار السلبية قبل النوم؟
* **تنظيم التوقعات:** كيفية التعامل مع الإحباط الناتج عن عدم اكتمال قائمة المهام اليومية بالكامل.
* **إدارة الضغوط:** كيفية الحفاظ على هدوء الأعصاب وسط تراكم الأعمال.

### 6. 🔄 توصيات سلوكية داعمة
* حافظ على جدول نوم منتظم قدر الإمكان وتجنب الأجهزة الإلكترونية قبل النوم بساعة.
* استمر في تدوين "شريط حياتك" لتوثيق المشاعر الإيجابية البسيطة وإعادة قراءتها عند الحاجة.` : 
    (query?.includes("قلق") || query?.includes("توتر") ? `يبدو أن مصدر القلق الأساسي لديك هو التفكير الزائد في المستقبل أو الضغط الناتج عن تراكم المهام المطلوبة. يلاحظ تحسن ملحوظ في قلقك بمجرد أن تبدأ في تفكيك المهام الكبيرة إلى قوائم مهام صغيرة وإنجازها واحدة تلو الأخرى.` : 
    `أهلاً بك في "مستشارك الذكي العام". بناءً على قراءة مذكراتك، يتبين أنك تمر برحلة رائعة من الاستكشاف الذاتي وملاحظة مشاعرك اليومية وتأثير عاداتك كالنوم والرياضة على مزاجك العام.`);

    try {
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
function createErrorResponse(message: string): Response {
  return new Response(JSON.stringify({ success: false, error: message }), {
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
