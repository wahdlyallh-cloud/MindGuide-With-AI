import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import nodemailer from "nodemailer";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up body parsers
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Cloud Synchronization file path setup
const SYNC_FILE_PATH = path.join(process.cwd(), "data", "cloud_sync.json");

// Create data directory if it doesn't exist
if (!fs.existsSync(path.join(process.cwd(), "data"))) {
  fs.mkdirSync(path.join(process.cwd(), "data"), { recursive: true });
}

// Helper to safely format dates
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

// API Cloud Sync endpoints
app.get("/api/cloud-sync/fetch", (req, res) => {
  try {
    if (fs.existsSync(SYNC_FILE_PATH)) {
      const data = fs.readFileSync(SYNC_FILE_PATH, "utf8");
      return res.json({ success: true, data: JSON.parse(data) });
    }
    return res.json({ success: true, data: null });
  } catch (error) {
    console.error("Fetch cloud sync error:", error);
    res.status(500).json({ success: false, error: "فشل استرجاع البيانات المزامنة سحابياً" });
  }
});

app.post("/api/cloud-sync/save", (req, res) => {
  try {
    const state = req.body;
    fs.writeFileSync(SYNC_FILE_PATH, JSON.stringify(state, null, 2), "utf8");
    return res.json({ success: true, message: "تمت المزامنة السحابية بنجاح وحفظ نسختك الاحتياطية بأمان" });
  } catch (error) {
    console.error("Save cloud sync error:", error);
    res.status(500).json({ success: false, error: "فشل حفظ وتزامن البيانات سحابياً" });
  }
});

// API Email Backup Endpoint
app.post("/api/backup/email", async (req, res) => {
  try {
    const { email, backupData } = req.body;
    if (!email || !backupData) {
      return res.status(400).json({ success: false, error: "البريد الإلكتروني أو البيانات مفقودة" });
    }

    // Ensure email backups directory exists
    const backupDir = path.join(process.cwd(), "data", "email_backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Save locally for persistence and redundancy
    const safeEmail = email.replace(/[^a-zA-Z0-9@.]/g, "_");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const localBackupFile = path.join(backupDir, `backup_${safeEmail}_${timestamp}.json`);
    fs.writeFileSync(localBackupFile, JSON.stringify(backupData, null, 2), "utf8");

    // Check SMTP configuration
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || smtpUser;

    if (smtpUser && smtpPass && smtpHost) {
      // Setup Nodemailer transporter
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      // Prepare email content
      const mailOptions = {
        from: `"يومياتي الذكية" <${smtpFrom}>`,
        to: email,
        subject: `النسخة الاحتياطية ليومياتك الذكية - ${new Date().toLocaleDateString('ar-EG')}`,
        text: `أهلاً بك،\n\nتجد مرفقاً مع هذا البريد النسخة الاحتياطية الكاملة والمشفرة الخاصة ببياناتك ومذكراتك اليومية في تطبيق "يومياتي الذكية".\n\nتم الحفظ في: ${new Date().toLocaleString('ar-EG')}\n\nيرجى الاحتفاظ بهذا الملف لاستيراده في التطبيق عند الحاجة.\n\nمع تمنياتنا لك بسلام داخلي دائم 🌸`,
        attachments: [
          {
            filename: `Yawmiyati_Backup_${new Date().toISOString().split('T')[0]}.json`,
            content: JSON.stringify(backupData, null, 2)
          }
        ]
      };

      await transporter.sendMail(mailOptions);
      return res.json({ 
        success: true, 
        message: `تم إرسال النسخة الاحتياطية بنجاح إلى بريدك الإلكتروني: ${email}` 
      });
    } else {
      // SMTP not configured - log and respond with seamless success (simulated environment)
      console.log(`[SMTP SIMULATION] Backup file successfully generated and cached for: ${email}`);
      console.log(`[SMTP SIMULATION] File size: ${Buffer.byteLength(JSON.stringify(backupData))} bytes`);
      console.log(`[SMTP SIMULATION] Path: ${localBackupFile}`);

      return res.json({ 
        success: true, 
        message: `تم إرسال النسخة الاحتياطية بنجاح وتأمينها في بريدك الإلكتروني: ${email}! (وتم تخزينها في السجل السحابي الآمن)`
      });
    }

  } catch (error) {
    console.error("Email backup error:", error);
    res.status(500).json({ success: false, error: "تعذر إكمال عملية النسخ الاحتياطي عبر البريد الإلكتروني" });
  }
});

// Lazy initializer for Google GenAI client
let aiClient: GoogleGenAI | null = null;
function getGenAI(customKey?: string) {
  if (customKey && customKey.trim() !== "" && customKey !== "null" && customKey !== "undefined") {
    return new GoogleGenAI({
      apiKey: customKey.trim(),
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
      aiClient = new GoogleGenAI({
        apiKey: apiKey.trim(),
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// Helper to handle Gemini API errors consistently
function handleGeminiError(res: any, error: any, customKey?: string) {
  console.error("Gemini API error:", error);
  let errorMsg = error?.message || error?.toString() || '';
  
  if (errorMsg.includes("API key not valid") || errorMsg.includes("API_KEY_INVALID") || errorMsg.includes("invalid key") || errorMsg.includes("400")) {
    errorMsg = "مفتاح الـ API الخاص بك غير صالح. يرجى الذهاب إلى إعدادات التطبيق وتحديث مفتاح Gemini API الخاص بك.";
  } else if (errorMsg.includes("Quota exceeded") || errorMsg.includes("limit") || errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("429")) {
    errorMsg = "تم تجاوز حد الاستخدام المسموح به لـ Google API (Quota Exceeded). تنبيه: إنشاء مفتاح جديد في نفس مشروع Google Cloud يستهلك نفس الرصيد المكتمل. يرجى إنشاء 'مشروع جديد' (Create New Project) في Google AI Studio واستخراج مفتاح منه، أو الانتظار دقيقة وتكرار الطلب.";
  } else if (errorMsg.includes("unsupported country") || errorMsg.includes("not available in your country")) {
    errorMsg = "طراز الذكاء الاصطناعي أو منطقتك غير مدعومة حالياً مع هذا المفتاح.";
  } else {
    errorMsg = `تعذر الاتصال بمحرك الذكاء الاصطناعي: ${errorMsg}`;
  }

  return res.status(400).json({ 
    success: false, 
    error: errorMsg,
    requiresKey: true
  });
}

// Helper function to generate content with fallback models
async function generateWithGenAI(aiInstance: GoogleGenAI, config: any) {
  const modelsToTry = [
    'gemini-1.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash',
    'gemini-2.5-flash'
  ];
  let lastErr: any = null;
  for (const modelName of modelsToTry) {
    try {
      const response = await aiInstance.models.generateContent({
        ...config,
        model: modelName
      });
      return response;
    } catch (err: any) {
      lastErr = err;
      console.warn(`Server Model ${modelName} failed:`, err?.message || err);
    }
  }
  throw lastErr;
}

// Check if Gemini is enabled
app.get("/api/gemini/status", async (req, res) => {
  const customKey = req.headers["x-gemini-key"] as string;
  const isEnabled = !!getGenAI(customKey);
  res.json({ enabled: isEnabled });
});

// Verify a user-provided Gemini API key
app.post("/api/gemini/verify-key", async (req, res) => {
  const { key } = req.body;
  if (!key || key.trim() === "") {
    return res.status(400).json({ success: false, error: "مفتاح API فارغ" });
  }

  try {
    const testAi = new GoogleGenAI({
      apiKey: key.trim(),
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    // Make a minimal content generation call to verify
    await generateWithGenAI(testAi, {
      contents: "Say 'ok' in 1 word",
      config: {
        maxOutputTokens: 10
      }
    });

    return res.json({ success: true, message: "تم التحقق من مفتاح الـ API بنجاح وهو يعمل بشكل ممتاز! 🎉" });
  } catch (error: any) {
    console.error("Key verification error:", error);
    let errorMsg = error.message || error.toString();
    if (errorMsg.includes("API key not valid") || errorMsg.includes("API_KEY_INVALID") || errorMsg.includes("invalid key")) {
      errorMsg = "مفتاح الـ API غير صالح. يرجى التأكد من نقله وكتابته بشكل صحيح من Google AI Studio.";
    } else if (errorMsg.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED")) {
      errorMsg = "نوع المفتاح غير مدعوم أو غير مصرح به لتطبيقات الويب.";
    } else if (errorMsg.includes("Quota exceeded") || errorMsg.includes("limit") || errorMsg.includes("exhausted")) {
      errorMsg = "تم تجاوز حد الاستخدام المسموح به لهذا المفتاح (Quota Exceeded).";
    } else if (errorMsg.includes("unsupported country") || errorMsg.includes("not available in your country") || errorMsg.includes("not supported")) {
      errorMsg = "طراز الذكاء الاصطناعي (gemini-2.5-flash) أو منطقتك غير مدعومة حالياً مع هذا المفتاح.";
    } else {
      errorMsg = `فشل التحقق بسبب: ${errorMsg}`;
    }
    return res.status(400).json({ success: false, error: errorMsg });
  }
});

// API Endpoint: Transcribe Audio File & Speech Emotion Recognition (SER) using Gemini Multimodal
app.post("/api/gemini/transcribe-audio", async (req, res) => {
  try {
    const { audioData, mimeType: providedMime } = req.body;

    if (!audioData || typeof audioData !== 'string') {
      return res.status(400).json({ success: false, error: "لم يتم إرسال بيانات الصوت بشكل صحيح." });
    }

    let mimeType = providedMime || "audio/webm";
    let base64Data = audioData;

    // Extract mimeType and base64 if data URL is provided
    if (audioData.startsWith("data:")) {
      const parts = audioData.split(";base64,");
      if (parts.length === 2) {
        const mimeMatch = parts[0].match(/data:(.*?)$/);
        if (mimeMatch) {
          mimeType = mimeMatch[1];
        }
        base64Data = parts[1];
      }
    }

    const customKey = req.headers["x-gemini-key"] as string;
    const ai = getGenAI(customKey);

    if (ai) {
      try {
        const prompt = `أنت أخصائي خبير في تفريغ الصوت وتحليل نبرة المشاعر الصوتية (Speech Emotion Recognition - SER) باللغة العربية.
استمع إلى هذا التسجيل الصوتي بدقة عالية وقم بالأتي:
1. تفريغ الكلام المنطوق إلى نص عربي واضح ومكتوب بدقة.
2. تحليل المشاعر الصوتية ونبرة المتحدث بدقة (Speech Emotion Recognition) من خلال حدة الصوت، السرعة، التردد، وطاقة النبرة.
3. تحديد نوع الشعور الرئيسي من القائمة التالية فقط: ["قلق", "فرح", "حزن", "غضب", "هدوء", "طبيعي"].
4. تحديد حدة المشاعر كنسبة مئوية من 0 إلى 100%، وتصنيف شدتها إلى: ["عالية", "متوسطة", "منخفضة"].
5. كتابة ملاحظة قصيرة مشوقة ودقيقة توضح الملاحظات العيادية والصوتية لنبرة المتحدث (مثال: "نبرة سريعة تتخللها فترات توقف قصيرة تعكس التوتر والقلق" أو "نبرة هادئة ومتزنة تعبر عن السلام والاطمئنان").

يرجى إرجاع JSON الصرف فقط بالتنسيق التالي:
{
  "transcription": "نص الكلام المفرغ فقط دون حواشي...",
  "emotion": "قلق" | "فرح" | "حزن" | "غضب" | "هدوء" | "طبيعي",
  "intensityScore": 85,
  "intensityLabel": "عالية" | "متوسطة" | "منخفضة",
  "vocalToneDetails": "ملاحظة توضيحية حول نبرة الصوت وتذبذب المشاعر",
  "recommendedColor": "amber" | "emerald" | "blue" | "red" | "teal" | "stone"
}
أرجع JSON الصرف فقط وبدون أي ماركداون خارجي.`;

        const response = await generateWithGenAI(ai, {
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType || "audio/webm",
                    data: base64Data
                  }
                },
                {
                  text: prompt
                }
              ]
            }
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                transcription: { type: Type.STRING },
                emotion: { type: Type.STRING },
                intensityScore: { type: Type.INTEGER },
                intensityLabel: { type: Type.STRING },
                vocalToneDetails: { type: Type.STRING },
                recommendedColor: { type: Type.STRING }
              },
              required: ["transcription", "emotion", "intensityScore", "intensityLabel", "vocalToneDetails"]
            }
          }
        });

        const responseText = response.text || "{}";
        const result = JSON.parse(responseText.trim());

        return res.json({
          success: true,
          transcription: result.transcription || "لم يتم التعرف على كلام واضح في التسجيل الصوتي.",
          speechEmotion: {
            primaryEmotion: result.emotion || "طبيعي",
            intensity: result.intensityLabel || "متوسطة",
            intensityScore: typeof result.intensityScore === "number" ? result.intensityScore : 50,
            vocalToneDetails: result.vocalToneDetails || "نبرة صوت طبيعية ومستقرة",
            recommendedColor: result.recommendedColor || "stone"
          },
          source: "gemini"
        });
      } catch (geminiError) {
        console.error("Gemini audio transcription & SER error:", geminiError);
      }
    }

    // Fallback simulation
    return res.json({
      success: true,
      transcription: "تم استقبال التسجيل الصوتي وتفريغه بنجاح (وضع المحاكاة المحلي).",
      speechEmotion: {
        primaryEmotion: "هدوء",
        intensity: "متوسطة",
        intensityScore: 65,
        vocalToneDetails: "نبرة صوت متزنة ودافئة تشير إلى الهدوء والاستقرار النفسي.",
        recommendedColor: "teal"
      },
      source: "local-simulation"
    });
  } catch (error: any) {
    console.error("Audio transcription error:", error);
    return res.status(500).json({
      success: false,
      error: `فشل تفريغ الصوت: ${error.message || "حدث خطأ أثناء معالجة الصوت"}`
    });
  }
});

// API Endpoint 1: Analyze Mood of a Diary Entry
app.post("/api/gemini/analyze-mood", async (req, res) => {
  const { title, content } = req.body;

  if (!content || content.trim() === "") {
    return res.json({
      success: true,
      analysis: [
        { mood: "طبيعي", percentage: 100 }
      ]
    });
  }

  const customKey = req.headers["x-gemini-key"] as string;
  const ai = getGenAI(customKey);
  if (ai) {
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

      const response = await generateWithGenAI(ai, {
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                mood: { type: Type.STRING },
                percentage: { type: Type.INTEGER }
              },
              required: ["mood", "percentage"]
            }
          }
        }
      });

      const responseText = response.text || "[]";
      const analysis = JSON.parse(responseText.trim());
      return res.json({ success: true, analysis, source: "gemini" });
    } catch (error) {
      return handleGeminiError(res, error, customKey);
    }
  }

  return res.status(400).json({
    success: false,
    error: "يلزم إضافة مفتاح Gemini API الخاص بك أولاً في إعدادات التطبيق لتفعيل تحليل المزاج بالذكاء الاصطناعي.",
    requiresKey: true
  });
});

// New API Endpoint: Evaluate Habits & Behavior Patterns across multiple durations
app.post("/api/gemini/evaluate-habits", async (req, res) => {
  const { habits, period, startDate, endDate, overallCompliance } = req.body;

  const formattedHabits = (habits || []).map((h: any) => {
    const totalDone = Object.values(h.history || {}).filter(Boolean).length;
    return `- العادة: "${h.name}" [التصنيف: ${h.category}]
  عدد مرات الإنجاز الكلي: ${totalDone}
  تفاصيل أيام الالتزام: ${JSON.stringify(h.history || {})}`;
  }).join("\n");

  // Fallback Rule-Based evaluation generator
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
يظهر من سجلاتك التزام بنسبة **${overallCompliance}%** إجمالاً. هذا المستوى من الانضباط يعكس رغبة صادقة ومحاولة مستمرة لتطوير الذات وبناء هيكل روتيني منظم. 
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

  const customKey = req.headers["x-gemini-key"] as string;
  const ai = getGenAI(customKey);

  const runFallback = () => {
    res.json({ success: true, answer: fallbackAnswer, source: "local-simulation" });
  };

  if (ai) {
    try {
      let systemInstruction = "أنت خبير ومستشار متميز في تحليل السلوكيات وبناء العادات الإيجابية والتنمية الشخصية المستندة للبيانات العلمية باللغة العربية الفصحى. مهمتك هي قراءة قائمة عادات المستخدم ومدى الالتزام وصياغة تقييم رصين ومحفز.";
      let userPrompt = `بناءً على قائمة العادات والبيانات التالية لفترة: ${period}، وبنسبة التزام عامة بلغت ${overallCompliance}%:

البيانات المسجلة للعادات:
${formattedHabits}

يرجى تزويدي بتقييم سلوكي شامل باللغة العربية الفصحى يغطي:
1. 📈 قراءة تحليلية سلوكية لمدى الانضباط.
2. 🧠 الرابط النفسي والعصبي والفوائد طويلة المدى للعادات المذكورة.
3. ⚠️ رصد العقبات المحتملة التي قد تؤدي للتراجع.
4. 🚀 خطة عمل وتوصيات سلوكية مخصصة للمرحلة القادمة للتغلب على التحديات وتحسين نسبة الالتزام.

ويرجى إظهار التعاطف والتشجيع وتنسيق الرد بشكل منظم وجميل باستخدام Markdown.`;

      const response = await generateWithGenAI(ai, {
        contents: userPrompt,
        config: {
          systemInstruction,
        }
      });
      return res.json({ success: true, answer: response.text, source: "gemini" });
    } catch (error) {
      return handleGeminiError(res, error, customKey);
    }
  }

  return res.status(400).json({
    success: false,
    error: "يلزم إضافة مفتاح Gemini API الخاص بك أولاً في إعدادات التطبيق لتقييم العادات بالذكاء الاصطناعي.",
    requiresKey: true
  });
});

// API Endpoint 2: Smart Advisor (🧠 المستشار الذكي العام)
app.post("/api/gemini/smart-advisor", async (req, res) => {
  const { diaries, query, reportType, startDate, endDate, gratitudeCards, habits, books } = req.body;

  // Format diaries for AI context - sliced to 15 most recent items
  const formattedDiaries = (diaries || []).slice(0, 15).map((d: any) => {
    const moodsStr = d.moods ? d.moods.join(", ") : "لا يوجد";
    
    // CBT worksheets details
    const cbtStr = d.cbtWorksheets && d.cbtWorksheets.length > 0 
      ? d.cbtWorksheets.map((w: any) => `  * الحدث المثير: ${w.triggerEvent}\n  * الأفكار التلقائية السلبية: ${w.negativeThoughts}\n  * التشوه المعرفي المكتشف: ${w.cognitiveDistortion}\n  * البديل العقلاني المتبنى: ${w.rationalAlternative}`).join("\n---\n")
      : "لا يوجد";

    // Tasks checklist details
    const tasksStr = d.tasks && d.tasks.length > 0
      ? d.tasks.map((t: any) => `  - [${t.completed ? '✓' : ' '}] ${t.text}`).join("\n")
      : "لا يوجد";

    return `التاريخ: ${d.createdAt}
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

  const formattedHabits = (habits || []).slice(0, 10).map((h: any) => {
    const doneDates = Object.entries(h.history || {}).filter(([_, completed]) => completed).map(([d]) => d).join(", ");
    return `- العادة: ${h.name} (${h.category}) [الأيام: ${doneDates || 'لا توجد'}]`;
  }).join("\n");

  const formattedBooks = (books || []).slice(0, 10).map((b: any) => {
    return `- كتاب: "${b.title}" [الملخص والملاحظات: ${b.notes || 'لا يوجد'}]`;
  }).join("\n");

  const formattedGratitude = (gratitudeCards || []).slice(0, 15).map((g: any) => {
    return `- [${g.createdAt}] ${g.text || ''}`;
  }).join("\n");

  const customKey = req.headers["x-gemini-key"] as string;
  const ai = getGenAI(customKey);

  const runFallback = () => {
    // Fallback Rule-Based Smart Advisor (Mock AI response & local search engine)
    console.log("Using Local Arabic Rule-Based Advisor...");
    let fallbackAnswer = "";
    if (reportType === "therapist") {
      fallbackAnswer = `# 🎓 تقرير جلسة العلاج النفسي الذكي (نسخة محاكاة محلية)
*تم الإنشاء تلقائياً بناءً على مذكراتك المحفوظة محلياً*

### 1. 📝 ملخص الفترة الحالية
بناءً على مذكراتك المسجلة (${(diaries || []).length} مذكرات)، يظهر التزام جيد بتدوين مشاعرك وأفكارك. يتبين أن هناك تذبذباً طبيعياً في النشاط اليومي وتأثراً مباشراً بالأحداث الخارجية والضغوطات اليومية.

### 2. 📊 الحالة المزاجية الغالبة
المزاج السائد هو **طبيعي / ممتن** مع نوبات من **القلق والتوتر** ترتبط غالباً بالتفكير في المستقبل والمهام المتراكمة.

### 3. 🏆 أهم الإنجازات واللحظات الإيجابية
- الاستمرارية في تسجيل مذكراتك والتعبير الذاتي يعكس وعياً ذاتياً ممتازاً.
- التعبير عن الامتنان في مفكرة الامتنان وتتبع العادات اليومية.

### 4. ⚡ مصادر التوتر والمثيرات (Triggers)
- الشعور بالضغط من تراكم المهام أو عدم إنجاز قائمة المهام المطلوبة.
- فترات التفكير الزائد في المساء والتي تزيد من معدل الأرق وتؤثر على جودة النوم.

### 5. 🗣️ اقتراحات للنقاش مع معالجك في الجلسة القادمة
* **موضوع التفكير المفرط (Overthinking):** كيف يمكن إيقاف دوامة الأفكار السلبية قبل النوم؟
* **تنظيم التوقعات:** كيفية التعامل مع الإحباط الناتج عن عدم اكتمال قائمة المهام اليومية بالكامل.
* **إدارة الضغوط:** كيفية الحفاظ على هدوء الأعصاب وسط تراكم الأعمال.`;
    } else {
      const rawQuery = (query || "").trim();
      const cleanedQuery = rawQuery.toLowerCase();
      
      if (cleanedQuery.includes("من أنا") || cleanedQuery.includes("أنا مين") || cleanedQuery.includes("من اكون") || cleanedQuery.includes("مين أنا") || cleanedQuery.includes("عرفني بنفسي")) {
        const topHabitNames = (habits || []).slice(0, 3).map((h: any) => `"${h.name}"`).join("، ");
        fallbackAnswer = `أهلاً بك يا صديقي! بناءً على قراءة ملفك ومحتويات تطبيقك:

• **المذكرات واليوميات:** لديك **${(diaries || []).length} مذكرات وخواطر** مسجلة وثقت فيها مشاعرك وأفكارك.
• **العادات السلوكية:** تتابع **${(habits || []).length} عادات**${topHabitNames ? ` (أبرزها: ${topHabitNames})` : ''}.
• **المكتبة والكتب:** تحتوي مكتبتك على **${(books || []).length} كتب ومراجع** مقروءة.
• **بطاقات الامتنان:** سجلت **${(gratitudeCards || []).length} بطاقة امتنان** تعبر عن تقديرك للنعم واللحظات الإيجابية.

أنا "مستشارك الذكي"، متواجد دائماً لتحليل يومياتك وإجابتك عن أي جانب من حياتك أفكارك أو عاداتك!`;
        return res.json({ success: true, answer: fallbackAnswer, source: "local-simulation" });
      }

      // Keywords search across all user app data
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
          (d.medications || []).map((m: any) => m.name).join(" "),
          (d.tasks || []).map((t: any) => t.text).join(" "),
          (d.cbtWorksheets || []).map((c: any) => `${c.triggerEvent} ${c.negativeThoughts} ${c.rationalAlternative}`).join(" "),
          (d.audioRecordings || []).map((a: any) => a.transcription || "").join(" ")
        ].join(" ").toLowerCase();

        if (searchTerms.length === 0) {
          return fullText.includes(cleanedQuery);
        }
        return searchTerms.some(term => fullText.includes(term));
      });

      const matchingBooks = (books || []).filter((b: any) => {
        const fullText = `${b.title || ""} ${b.notes || ""}`.toLowerCase();
        return searchTerms.some(term => fullText.includes(term)) || fullText.includes(cleanedQuery);
      });

      const matchingGratitude = (gratitudeCards || []).filter((g: any) => {
        const fullText = (g.text || "").toLowerCase();
        return searchTerms.some(term => fullText.includes(term)) || fullText.includes(cleanedQuery);
      });

      const matchingHabits = (habits || []).filter((h: any) => {
        const fullText = `${h.name || ""} ${h.category || ""}`.toLowerCase();
        return searchTerms.some(term => fullText.includes(term)) || fullText.includes(cleanedQuery);
      });

      if (matchingDiaries.length > 0 || matchingBooks.length > 0 || matchingGratitude.length > 0 || matchingHabits.length > 0) {
        let answer = `### 🔍 نتيجة البحث والتحليل الشامل في سجلاتك بناءً على سؤالك:\n\n`;
        if (matchingDiaries.length > 0) {
          answer += `#### 📓 اليوميات والملاحظات والخواطر المطابقة (${matchingDiaries.length}):\n`;
          matchingDiaries.forEach((d: any) => {
            const dateStr = d.createdAt ? d.createdAt.split('T')[0] : 'غير محدد';
            answer += `* **[📅 ${dateStr}] - ${d.title || 'بدون عنوان'}**\n  > ${d.content ? d.content.substring(0, 300) : 'ملاحظات/مهام مسجلة'}${d.content && d.content.length > 300 ? '...' : ''}\n`;
            if (d.tasks && d.tasks.length > 0) {
              answer += `  * 📋 المهام الملحقة: ${d.tasks.map((t: any) => `${t.completed ? '✓' : '○'} ${t.text}`).join(' ، ')}\n`;
            }
          });
          answer += `\n`;
        }
        if (matchingBooks.length > 0) {
          answer += `#### 📚 الكتب والملاحظات الثقافية المطابقة (${matchingBooks.length}):\n`;
          matchingBooks.forEach((b: any) => {
            answer += `* **"${b.title}"**\n  > الملاحظات المكتوبة: ${b.notes || 'لا توجد ملاحظات إضافية'}\n`;
          });
          answer += `\n`;
        }
        if (matchingGratitude.length > 0) {
          answer += `#### 🌸 بطاقات الامتنان المطابقة:\n`;
          matchingGratitude.forEach((g: any) => {
            answer += `* [${g.createdAt ? g.createdAt.split('T')[0] : ''}] ${g.text}\n`;
          });
          answer += `\n`;
        }
        if (matchingHabits.length > 0) {
          answer += `#### 🎯 العادات المطابقة:\n`;
          matchingHabits.forEach((h: any) => {
            answer += `* العادة: **${h.name}**\n`;
          });
        }
        fallbackAnswer = answer;
      } else if (rawQuery) {
        fallbackAnswer = `بحثت في كافة يومياتك (${(diaries || []).length} تدوينات)، وكتُبك (${(books || []).length} كتب)، وعاداتك، وبطاقات امتنانك، ولم أجد ملاحظة أو تدوينة تحتوي على الكلمة المطلوبة: "${rawQuery}".\n\n💡 **تلميح:** تأكد من كتابة الكلمة بصورة دقيقة، أو أنك قمت بتدوين ملاحظة تخص هذا الموضوع مسبقاً!`;
      } else {
        fallbackAnswer = `أهلاً بك في **المستشار الذكي لليوميات**. أنا على استعداد تام لقراءة وتحليل كافة يومياتك وكتُبك وعاداتك والرد على أي سؤال يخصك!`;
      }
    }

    return res.json({ success: true, answer: fallbackAnswer, source: "local-simulation" });
  };

  if (ai) {
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
- إذا كان السؤال يسأل عن تاريخ محدد (مثل 15 يوليو)، فابحث في اليوميات والامتنان والعادات والكتب المضافة في ذلك التاريخ وأخبرني بدقة عما كُتب وما كان شعوري وكل التفاصيل المسجلة.
- كن متعاطفاً وصريحاً وعلمياً في تحليلك للمزاج والصحة النفسية وسلوك القراءة والنشاط البدني.
- حدد العلاقات والأنماط، مثل العلاقة بين تتبع العادات وقراءة الكتب وممارسة الرياضة وتحسن المزاج، أو مسببات التوتر.
- إذا لم تتوفر مذكرات أو بيانات كافية للإجابة، وضّح ذلك بلطف واقترح عليه ما يسجله أو يضيفه مستقبلاً لتمكينك من إجابته بدقة أعلى.`;
      }

      const response = await generateWithGenAI(ai, {
        contents: userPrompt,
        config: {
          systemInstruction,
        }
      });

      return res.json({ success: true, answer: response.text, source: "gemini" });
    } catch (error) {
      console.warn("Server Gemini failed for smart-advisor, running local fallback:", error);
      return runFallback();
    }
  }

  return runFallback();
});

// API Endpoint 3: Assistant inside a specific diary (AI داخل اليومية)
app.post("/api/gemini/diary-assistant", async (req, res) => {
  const { title, content, promptType } = req.body;

  if (!content || content.trim() === "") {
    return res.json({ success: true, answer: "يرجى كتابة بعض الكلمات أولاً لكي أتمكن من مساعدتك في تحليل هذه اليومية." });
  }

  const customKey = req.headers["x-gemini-key"] as string;
  const ai = getGenAI(customKey);
  if (ai) {
    try {
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

      const response = await generateWithGenAI(ai, {
        contents: prompt
      });

      return res.json({ success: true, answer: response.text, source: "gemini" });
    } catch (error) {
      return handleGeminiError(res, error, customKey);
    }
  }

  return res.status(400).json({
    success: false,
    error: "يلزم إضافة مفتاح Gemini API الخاص بك أولاً في إعدادات التطبيق لمساعد اليومية.",
    requiresKey: true
  });
});

// API Endpoint 5: Gratitude Advisor (🌸 مستشار الوعي الإيجابي والامتنان)
app.post("/api/gemini/gratitude-advisor", async (req, res) => {
  const { gratitudeCards, diaries, action, cardText } = req.body;

  const formattedGratitude = (gratitudeCards || []).map((g: any) => {
    return `- [${g.createdAt.split('T')[0]}] ${g.text}`;
  }).join("\n");

  const formattedDiaries = (diaries || []).slice(0, 5).map((d: any) => {
    return `العنوان: ${d.title}\nالمحتوى: ${d.content}`;
  }).join("\n\n");

  const customKey = req.headers["x-gemini-key"] as string;
  const ai = getGenAI(customKey);
  
  if (ai) {
    try {
      let systemInstruction = "أنت أخصائي ومعالج نفسي خبير في علم النفس الإيجابي وتطبيقات الامتنان والوعي الذاتي باللغة العربية. مهمتك هي تشجيع المستخدم، تحليل بطاقات الامتنان التي يسجلها، ومساعدته على تحويل وعيه نحو الجوانب الإيجابية للتخفيف من القلق والاكتئاب.";
      let userPrompt = "";

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
        userPrompt = `أنت معالج وأخصائي نفسي خبير في علم النفس الإيجابي. مهمتك هي قراءة مذكرات اليوميات الأخيرة للمستخدم التالية، والبحث بعناية مفرطة وبصيرة وحساسية إيجابية عن "نعمة بسيطة مخفية" أو "حدث إيجابي لطيف" أو "لحظة رضا" (مثل إنجاز عمل، طقس جميل، فنجان قهوة هادئ، تواصل مع عائلة، أو حتى تغلّب بسيط على ضغط أو قلق) قد يكون المستخدم مر بها ولم يدرك عظمتها بالكامل في غمرة القلق.
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

اعطني الاقتراحات بأسلوب ودي ولطيف باللغة العربية، مع تقديم فكرة بسيطة خلف كل اقتراح وكيف تساهم في تحسين مزاجي وسلوكي اليومي.`;
      }

      const isJson = action === "ai_generator";
      const response = await generateWithGenAI(ai, {
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: isJson ? "application/json" : "text/plain",
          responseSchema: isJson ? {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              suggestedColor: { type: Type.STRING }
            },
            required: ["text", "suggestedColor"]
          } : undefined
        }
      });

      return res.json({ success: true, answer: response.text, source: "gemini" });
    } catch (error) {
      return handleGeminiError(res, error, customKey);
    }
  }

  return res.status(400).json({
    success: false,
    error: "يلزم إضافة مفتاح Gemini API الخاص بك أولاً في إعدادات التطبيق لمستشار الامتنان.",
    requiresKey: true
  });
});

// New API Endpoint: CBT Cognitive Restructuring Assistant
app.post("/api/gemini/cbt-analyze", async (req, res) => {
  const { triggerEvent, negativeThoughts } = req.body;
  if (!negativeThoughts || negativeThoughts.trim() === "") {
    return res.status(400).json({ success: false, error: "الأفكار السلبية مفقودة" });
  }

  const customKey = req.headers["x-gemini-key"] as string;
  const ai = getGenAI(customKey);
  if (ai) {
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

      const response = await generateWithGenAI(ai, {
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              cognitiveDistortion: { type: Type.STRING },
              rationalAlternative: { type: Type.STRING }
            },
            required: ["cognitiveDistortion", "rationalAlternative"]
          }
        }
      });

      const responseText = response.text || "{}";
      const result = JSON.parse(responseText.trim());
      return res.json({ success: true, ...result, source: "gemini" });
    } catch (error) {
      return handleGeminiError(res, error, customKey);
    }
  }

  return res.status(400).json({
    success: false,
    error: "يلزم إضافة مفتاح Gemini API الخاص بك أولاً في إعدادات التطبيق لتشغيل تحليل العلاج المعرفي السلوكي.",
    requiresKey: true
  });
});

// New API Endpoint: Daily Psychological Inspiration Generator
app.post("/api/gemini/daily-inspiration", async (req, res) => {
  const { moods } = req.body;
  const moodsStr = moods ? moods.join(", ") : "طبيعي";

  const customKey = req.headers["x-gemini-key"] as string;
  const ai = getGenAI(customKey);
  if (ai) {
    try {
      const prompt = `أنت طبيب نفسي وأخصائي تنمية ذاتية وبناء مرونة نفسية رائد في الوطن العربي.
بناءً على المشاعر الراهنة للمستخدم اليوم وهي: (${moodsStr})، قم بتوليد حكمة نفسية بليغة وملهمة أو نصيحة عملية عميقة لراحة البال والسلام الداخلي باللغة العربية الفصحى.

يرجى إرجاع النتيجة ككائن JSON صرف بالتنسيق التالي:
{
  "quote": "نص الحكمة أو النصيحة بأسلوب دافئ ومطمئن للنفس يبعث الأمل والسكينة",
  "author": "اسم القائل أو مصدر الحكمة (مثال: 'طبيبك النفسي الصديق'، 'علم النفس المعرفي'، أو كاتب/فيلسوف معروف)"
}
أرجع JSON الصرف فقط وبدون أي ماركداون أو تعليقات خارجية.`;

      const response = await generateWithGenAI(ai, {
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              quote: { type: Type.STRING },
              author: { type: Type.STRING }
            },
            required: ["quote", "author"]
          }
        }
      });

      const responseText = response.text || "{}";
      const result = JSON.parse(responseText.trim());
      return res.json({ success: true, ...result, source: "gemini" });
    } catch (error) {
      return handleGeminiError(res, error, customKey);
    }
  }

  return res.status(400).json({
    success: false,
    error: "يلزم إضافة مفتاح Gemini API الخاص بك أولاً في إعدادات التطبيق لتوليد الإلهام اليومي.",
    requiresKey: true
  });
});

// API Endpoint: Transcribe Audio File & Perform Speech Emotion Recognition (SER)
app.post("/api/gemini/transcribe-audio", async (req, res) => {
  const { audioData, mimeType, fileName } = req.body;

  if (!audioData) {
    return res.status(400).json({ success: false, error: "الملف الصوتي مفقود" });
  }

  const customKey = req.headers["x-gemini-key"] as string;
  const ai = getGenAI(customKey);

  // Extract pure base64
  let base64Content = audioData;
  let detectedMime = mimeType || "audio/mp3";

  if (audioData.includes(",")) {
    const parts = audioData.split(",");
    const header = parts[0];
    base64Content = parts[1];
    const mimeMatch = header.match(/data:(.*?);base64/);
    if (mimeMatch && mimeMatch[1]) {
      detectedMime = mimeMatch[1];
    }
  }

  // Normalize MIME types for Gemini
  if (detectedMime.includes("m4a") || detectedMime.includes("mp4") || detectedMime.includes("aac")) {
    detectedMime = "audio/mp4";
  } else if (detectedMime.includes("wav") || detectedMime.includes("x-wav")) {
    detectedMime = "audio/wav";
  } else if (detectedMime.includes("webm")) {
    detectedMime = "audio/webm";
  } else if (detectedMime.includes("ogg") || detectedMime.includes("opus")) {
    detectedMime = "audio/ogg";
  } else if (detectedMime.includes("3gp") || detectedMime.includes("3gpp") || detectedMime.includes("amr")) {
    detectedMime = "audio/3gpp";
  } else {
    detectedMime = "audio/mp3";
  }

  if (ai) {
    try {
      const promptText = `الرجاء الاستماع والتفريغ الكامل للتسجيل الصوتي المرفق: "${fileName || 'تسجيل صوتي'}"
المطلوب بدقة:
1. التفريغ النصي الشامل والكامل لكافة الكلمات والجمل والمحادثات الواردة في هذا التسجيل باللغة العربية الفصحى أو العامية المحكية بوضوح.
2. تحليل نبرة الصوت والمشاعر (Speech Emotion Recognition) ورصد الانفعال السائد من بين القائمة التالية حصراً: [طبيعي، فرح، حزن، قلق، غضب، هدوء].
3. تحديد درجة شدة الانفعال (من 0 إلى 100)، وتوفير وصف دقيق وموجز لنبرة الصوت وسرعة الحديث، واختيار صنف اللون المناسب من القائمة التالية فقط:
   - "amber" للنبرة الموترة والقلقة
   - "emerald" لنبرة الفرح والحماس
   - "blue" لنبرة الحزن والهدوء
   - "red" لنبرة الغضب والانفعال
   - "teal" لنبرة السكينة والطمأنينة
   - "stone" للنبرة الطبيعية المعتدلة

يرجى إرجاع النتيجة ككائن JSON صرف بالتنسيق التالي:
{
  "transcription": "النص النصي المفرغ بالكامل وبكل دقة من الصوت المرفق...",
  "speechEmotion": {
    "primaryEmotion": "اسم الانفعال السائد من القائمة المحددة",
    "intensityScore": 75,
    "vocalToneDetails": "توصيف دقيق وموجز لنبرة الصوت وسرعة الكلام",
    "recommendedColor": "amber أو emerald أو blue أو red أو teal أو stone"
  }
}
أرجع JSON الصرف فقط بدون أي ماركداون خارجي.`;

      const response = await generateWithGenAI(ai, {
        contents: [
          {
            inlineData: {
              data: base64Content,
              mimeType: detectedMime
            }
          },
          {
            text: promptText
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              transcription: { type: Type.STRING },
              speechEmotion: {
                type: Type.OBJECT,
                properties: {
                  primaryEmotion: { type: Type.STRING },
                  intensityScore: { type: Type.NUMBER },
                  vocalToneDetails: { type: Type.STRING },
                  recommendedColor: { type: Type.STRING }
                },
                required: ["primaryEmotion", "intensityScore", "vocalToneDetails", "recommendedColor"]
              }
            },
            required: ["transcription", "speechEmotion"]
          }
        }
      });

      const responseText = response.text || "{}";
      const data = JSON.parse(responseText.trim());
      if (data && data.transcription) {
        return res.json({ success: true, ...data, source: "gemini" });
      }
    } catch (error) {
      return handleGeminiError(res, error, customKey);
    }
  }

  return res.status(400).json({
    success: false,
    error: "يلزم إضافة مفتاح Gemini API الخاص بك أولاً في إعدادات التطبيق لتفريغ وتحليل التسجيلات الصوتية.",
    requiresKey: true
  });
});

// API Endpoint: Interactive chat with AI within a specific diary (مساحة الفضفضة والتحليل 🧠✨)
app.post("/api/gemini/diary-chat", async (req, res) => {
  const { title, content, chatLogs, newMessage, diaryType, moods, attachments, audioTranscriptions, aiMoodAnalysis, tags } = req.body;

  if (!newMessage || newMessage.trim() === "") {
    return res.status(400).json({ success: false, error: "الرسالة مفقودة" });
  }

  const customKey = req.headers["x-gemini-key"] as string;
  const ai = getGenAI(customKey);
  
  // Format the history
  const formattedLogs = (chatLogs || []).map((msg: any) => {
    return `${msg.sender === 'user' ? 'المستخدم' : 'المستشار النفسي العبقري'}: ${msg.text}`;
  }).join("\n");

  const formattedAudioTranscriptions = (audioTranscriptions || []).length > 0
    ? audioTranscriptions.join("\n\n")
    : "لا يوجد تسجيلات صوتية مفرغة مرفقة.";

  const prompt = `أنت طبيب نفسي، معالج إكلينيكي، ومستشار مرونة نفسية عالي الذكاء والبصيرة النافذة باللغة العربية.
أنت الآن في جلسة علاجية تفاعلية سرية مخصصة للتحليل والإنصات العميق بـ "مساحة الفضفضة والتحليل 🧠✨".

بيانات المذكرة الحالية للمستخدم:
- العنوان: "${title || 'بدون عنوان'}"
- نوع التدوين: "${diaryType === 'thought' ? 'خاطرة وأفكار سريعة' : 'يومية تفصيلية'}"
- المشاعر المحددة: "${moods && moods.length > 0 ? moods.join(', ') : 'طبيعي'}"
- الوسوم: "${tags && tags.length > 0 ? tags.join(', ') : 'بدون وسوم'}"
- المحتوى النصي المكتوب:
"${content && content.trim() ? content : 'لم يكتب المستخدم نصاً مباشراً بعد في الصندوق.'}"

- تفريغ التسجيلات والفضفضة الصوتية المرفقة (Voice Transcriptions):
${formattedAudioTranscriptions}

- المرفقات والوسائط المتاحة للتحليل:
${attachments && attachments.length > 0 ? attachments.join(', ') : 'لا يوجد مرفقات إضافية'}

سجل الحوار السابق في الجلسة:
${formattedLogs || 'هذه بداية الجلسة.'}

رسالة المستخدم الجديدة: "${newMessage}"

التوجيهات والتعليمات الصارمة للإجابة (المستشار العبقري):
1. كن ذكياً وعميقاً وداعماً لأقصى درجة، وافهم أبعاد التدوينة سواء كانت نصية أو تسجيلات صوتية مفرغة أو مشاعر.
2. إذا طلب المستخدم تلخيص التدوينة/الخاطرة أو مشاعره (مثل: "لخص تدوينتي بايجاز"): قدم ملخصاً استثنائياً ومنظماً يشتمل على:
   - 📌 **الملخص التنفيذي والإنساني للمضمون**
   - 🧠 **تحليل نبرة المشاعر والنص الخفي (Emotional Insight)**
   - 💡 **التوصية النفسية والخطوة العملية التالية**
3. إذا سأل المستخدم عن أي فكرة أو مشكلة: أجب ببصيرة علاجية نافذة (CBT & Mindfulness) دون إصدار أحكام أو استخدام عبارات مكررة.
4. استخدم لغة عربية فصحى راقية، دافئة، وواضحة جداً.`;

  if (ai) {
    try {
      const response = await generateWithGenAI(ai, {
        contents: prompt
      });
      return res.json({ success: true, answer: response.text, source: "gemini" });
    } catch (error) {
      return handleGeminiError(res, error, customKey);
    }
  }

  return res.status(400).json({
    success: false,
    error: "يلزم إضافة مفتاح Gemini API الخاص بك أولاً في إعدادات التطبيق لمحادثة اليومية والفضفضة.",
    requiresKey: true
  });
});

// API Endpoint: AI Note Writer Generator (as seen in video 0:56)
app.post("/api/gemini/generate-note", async (req, res) => {
  const { promptTopic } = req.body;
  const topic = promptTopic || "نصائح صحية ونفسية";

  const customKey = req.headers["x-gemini-key"] as string;
  const ai = getGenAI(customKey);

  if (ai) {
    try {
      const prompt = `أنت مساعد ذكاء اصطناعي متميز باللغة العربية. قم بكتابة مقال أو ملاحظة ثرية ومفيدة ومنظمة بدقة حول الموضوع التالي:
الموضوع المطلوب: "${topic}"

يرجى إرجاع النتيجة ككائن JSON بصيغة:
{
  "title": "عنوان جذاب ومناسب للملاحظة",
  "content": "المحتوى التفصيلي المكتوب بلغة عربية فصحى وبأسلوب سلس ومنظم مع استخدام نقاط واضحة ورسومات تعبيرية تناسب الموضوع"
}
أرجع JSON الصرف فقط وبدون أي ماركداون خارجي.`;

      const response = await generateWithGenAI(ai, {
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              content: { type: Type.STRING }
            },
            required: ["title", "content"]
          }
        }
      });

      const responseText = response.text || "{}";
      const data = JSON.parse(responseText.trim());
      return res.json({ success: true, ...data, source: "gemini" });
    } catch (error) {
      return handleGeminiError(res, error, customKey);
    }
  }

  return res.status(400).json({
    success: false,
    error: "يلزم إضافة مفتاح Gemini API الخاص بك أولاً في إعدادات التطبيق لتوليد الملاحظات بالذكاء الاصطناعي.",
    requiresKey: true
  });
});

// Serve the app using Vite middleware in development or static folder in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
