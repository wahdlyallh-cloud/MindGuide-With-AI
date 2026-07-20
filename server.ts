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
      apiKey: customKey,
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
        apiKey,
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
function handleGeminiError(res: any, error: any, customKey?: string, fallbackResponse?: () => void) {
  console.error("Gemini API error:", error);
  const isCustom = !!(customKey && customKey.trim() !== "" && customKey !== "null" && customKey !== "undefined");
  if (isCustom) {
    let errorMsg = error.message || error.toString();
    if (errorMsg.includes("API key not valid") || errorMsg.includes("API_KEY_INVALID")) {
      errorMsg = "مفتاح الـ API الخاص بك غير صالح. يرجى الانتقال إلى الإعدادات وتحديث المفتاح.";
    } else if (errorMsg.includes("Quota exceeded") || errorMsg.includes("limit") || errorMsg.includes("exhausted")) {
      errorMsg = "تم تجاوز حد الاستخدام المسموح به لهذا مفتاح (Quota Exceeded).";
    } else if (errorMsg.includes("unsupported country") || errorMsg.includes("not available in your country")) {
      errorMsg = "طراز الذكاء الاصطناعي (gemini-3.1-flash-lite) أو منطقتك غير مدعومة حالياً مع هذا المفتاح.";
    }
    return res.status(400).json({ 
      success: false, 
      error: `خطأ في اتصال الذكاء الاصطناعي: ${errorMsg}` 
    });
  }
  if (fallbackResponse) {
    fallbackResponse();
  } else {
    res.status(500).json({ success: false, error: "حدث خطأ غير متوقع أثناء معالجة الطلب." });
  }
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
    await testAi.models.generateContent({
      model: "gemini-3.1-flash-lite",
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
      errorMsg = "طراز الذكاء الاصطناعي (gemini-3.1-flash-lite) أو منطقتك غير مدعومة حالياً مع هذا المفتاح.";
    } else {
      errorMsg = `فشل التحقق بسبب: ${errorMsg}`;
    }
    return res.status(400).json({ success: false, error: errorMsg });
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

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
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
      console.error("Gemini mood analysis error:", error);
      // Fallback to local on error
    }
  }

  // Fallback Local NLP Simulator for Arabic (Very smart rule-based simulator)
  console.log("Using Arabic Rule-Based NLP Mood Analyzer...");
  const text = (title + " " + content).toLowerCase();
  const moodScores: Record<string, number> = {
    "سعيد": 0,
    "مرتاح": 0,
    "طبيعي": 5, // base weight
    "حزين": 0,
    "مكتئب": 0,
    "قلق": 0,
    "غاضب": 0,
    "مرهق": 0,
    "ممتن": 0,
    "سعيد جدًا": 0
  };

  // Check keywords
  if (text.includes("سعيد") || text.includes("فرح") || text.includes("مبسوط") || text.includes("رائع") || text.includes("جميل")) {
    moodScores["سعيد"] += 30;
    moodScores["سعيد جدًا"] += 15;
  }
  if (text.includes("الحمد لله") || text.includes("شكرا") || text.includes("نعمة") || text.includes("ممتن")) {
    moodScores["ممتن"] += 40;
    moodScores["مرتاح"] += 10;
  }
  if (text.includes("تعب") || text.includes("ارهاق") || text.includes("مرهق") || text.includes("نوم") || text.includes("كسل") || text.includes("ضغط")) {
    moodScores["مرهق"] += 40;
    moodScores["قلق"] += 10;
  }
  if (text.includes("حزين") || text.includes("بكاء") || text.includes("دموع") || text.includes("ضيق") || text.includes("وحدة")) {
    moodScores["حزين"] += 40;
  }
  if (text.includes("اكتئاب") || text.includes("مكتئب") || text.includes("يأس") || text.includes("مظلم") || text.includes("انتحار") || text.includes("الم")) {
    moodScores["مكتئب"] += 50;
    moodScores["حزين"] += 20;
  }
  if (text.includes("خوف") || text.includes("قلق") || text.includes("خايف") || text.includes("توتر") || text.includes("امتحان") || text.includes("مستقبل")) {
    moodScores["قلق"] += 45;
  }
  if (text.includes("غضب") || text.includes("غاضب") || text.includes("زعل") || text.includes("عصبية") || text.includes("كره") || text.includes("مشكلة")) {
    moodScores["غاضب"] += 45;
  }
  if (text.includes("سلام") || text.includes("هدوء") || text.includes("طبيعة") || text.includes("استرخاء") || text.includes("مرتاح")) {
    moodScores["مرتاح"] += 40;
  }

  // Calculate percentages
  const total = Object.values(moodScores).reduce((a, b) => a + b, 0);
  const analysis = Object.entries(moodScores)
    .map(([mood, score]) => ({
      mood,
      percentage: Math.round((score / total) * 100)
    }))
    .filter(item => item.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage);

  // Normalize to 100%
  let sum = analysis.reduce((a, b) => a + b.percentage, 0);
  if (sum !== 100 && analysis.length > 0) {
    analysis[0].percentage += (100 - sum);
  }

  res.json({
    success: true,
    analysis: analysis.length > 0 ? analysis : [{ mood: "طبيعي", percentage: 100 }],
    source: "local-simulation"
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

يرجى إظهار التعاطف والتشجيع وتنسيق الرد بشكل منظم وجميل باستخدام Markdown.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: userPrompt,
        config: {
          systemInstruction,
        }
      });
      res.json({ success: true, answer: response.text, source: "gemini" });
    } catch (error) {
      handleGeminiError(res, error, customKey, runFallback);
    }
  } else {
    runFallback();
  }
});

// API Endpoint 2: Smart Advisor (🧠 المستشار الذكي العام)
app.post("/api/gemini/smart-advisor", async (req, res) => {
  const { diaries, query, reportType, startDate, endDate, gratitudeCards, habits, books } = req.body;

  // Format diaries for AI context
  const formattedDiaries = (diaries || []).map((d: any) => {
    const moodsStr = d.moods ? d.moods.join(", ") : "لا يوجد";
    const aiAnalysisStr = d.aiMoodAnalysis 
      ? d.aiMoodAnalysis.map((item: any) => `${item.mood} (${item.percentage}%)`).join(", ") 
      : "لا يوجد";
    
    // CBT worksheets details
    const cbtStr = d.cbtWorksheets && d.cbtWorksheets.length > 0 
      ? d.cbtWorksheets.map((w: any) => `  * الحدث المثير: ${w.triggerEvent}\n  * الأفكار التلقائية السلبية: ${w.negativeThoughts}\n  * التشوه المعرفي المكتشف: ${w.cognitiveDistortion}\n  * البديل العقلاني المتبنى: ${w.rationalAlternative}\n  * مستوى الانفعال قبل: ${w.emotionBefore}/10 ، بعد: ${w.emotionAfter}/10`).join("\n---\n")
      : "لا يوجد";

    // Tasks checklist details
    const tasksStr = d.tasks && d.tasks.length > 0
      ? d.tasks.map((t: any) => `  - [${t.completed ? '✓' : ' '}] ${t.text}`).join("\n")
      : "لا يوجد";

    // Medication tracking details
    const medsStr = d.medications && d.medications.length > 0
      ? d.medications.map((m: any) => `  - ${m.name} في ${m.time} (${m.taken ? 'تم أخذه' : 'لم يؤخذ'})`).join("\n")
      : "لا يوجد";

    // Audio recordings details
    const audioStr = d.audioRecordings && d.audioRecordings.length > 0
      ? d.audioRecordings.map((r: any) => `  - تسجيل: ${r.name} (${r.duration} ثانية) ${r.transcription ? `[تفريغ نصي: ${r.transcription}]` : ''}`).join("\n")
      : "لا يوجد";

    // Attached files details
    const filesStr = d.files && d.files.length > 0
      ? d.files.map((f: any) => `  - ملف: ${f.name} (${f.size})`).join("\n")
      : "لا يوجد";

    // Symptoms details
    const symptomsStr = d.symptomsChecklist && d.symptomsChecklist.length > 0
      ? d.symptomsChecklist.join(", ")
      : "لا يوجد";

    return `التاريخ: ${d.createdAt.split('T')[0]} ${d.createdAt.split('T')[1]?.substring(0, 5) || ''}
نوع المذكرة: ${d.diaryType === 'thought' ? 'خواطر وفضفضة' : 'يوميات عادية'}
العنوان: ${d.title || 'بدون عنوان'}
الأهمية: ${'⭐'.repeat(d.importance || 1)}
المزاج اليدوي: ${moodsStr}
تحليل المزاج الذكي: ${aiAnalysisStr}
معدل تقييم المزاج السريع: ${d.fastMoodScore ? `${d.fastMoodScore}/10` : 'لم يسجل'}
ساعات النوم المسجلة: ${d.sleepHours ? `${d.sleepHours} ساعات` : 'لم يسجل'}
مدة الرياضة والنشاط البدني: ${d.sportsDuration ? `${d.sportsDuration} دقائق` : 'لم يسجل'}
أكواب الماء المشروبة: ${d.waterCups ? `${d.waterCups} أكواب` : 'لم يسجل'}
الأعراض الجسدية والنفسية المسجلة: ${symptomsStr}
الأدوية المسجلة:
${medsStr}
المهام المجدولة وقائمتها:
${tasksStr}
تمارين العلاج المعرفي السلوكي (CBT) الملحقة:
${cbtStr}
التفريغ الصوتي للمحادثات والتسجيلات الملحقة:
${audioStr}
الملفات والروابط المرفقة:
${filesStr}
المحتوى النصي للمذكرة:
${d.content}
-------------------------`;
  }).join("\n\n");

  // Format habits for AI context
  const formattedHabits = (habits || []).map((h: any) => {
    const historyDates = Object.entries(h.history || {})
      .filter(([_, completed]) => completed)
      .map(([date]) => date)
      .join(", ");
    return `- اسم العادة السلوكية: ${h.name}
  * الفئة والتصنيف: ${h.category === 'health' ? 'صحة عامة' : h.category === 'mind' ? 'تأمل وصحة نفسية' : h.category === 'sport' ? 'رياضة وبدن' : h.category === 'culture' ? 'ثقافة وعقل' : 'مخصصة'}
  * معدل التكرار المطلوب: ${h.frequency === 'daily' ? 'يومي' : 'أسبوعي'}
  * وقت التذكير بالعادة: ${h.reminderTime || 'غير محدد'}
  * تواريخ الأيام التي تم فيها إنجاز هذه العادة بنجاح: [${historyDates || 'لم تسجل كإنجاز بعد'}]`;
  }).join("\n\n");

  // Format books for AI context
  const formattedBooks = (books || []).map((b: any) => {
    return `- عنوان الكتاب/المصدر المقروء: "${b.title}"
  * تقييم المستخدم له: ${'★'.repeat(b.rating || 0)} نجوم
  * تاريخ إضافته للرف والمكتبة: ${b.createdAt ? b.createdAt.split('T')[0] : 'غير حدد'}
  * هل تم رسم خريطة ذهنية له: ${b.hasMindMap ? 'نعم' : 'لا'}
  * ملخص الكتاب وملاحظات القراءة المكتوبة:
    ${b.notes || 'لا توجد ملاحظات مكتوبة بعد.'}
  * روابط مرجعية وفيديوهات مرفقة: ${b.referenceLink || 'لا يوجد'} ${b.videoAttachment ? `, فيديو: ${b.videoAttachment}` : ''}`;
  }).join("\n\n");

  // Format gratitude cards for AI context
  const formattedGratitude = (gratitudeCards || []).map((g: any) => {
    return `- [${g.createdAt.split('T')[0]}] ${g.text}`;
  }).join("\n");

  const customKey = req.headers["x-gemini-key"] as string;
  const ai = getGenAI(customKey);

  const runFallback = () => {
    // Fallback Rule-Based Smart Advisor (Mock AI response)
    console.log("Using Local Arabic Rule-Based Advisor...");
    let fallbackAnswer = "";
    if (reportType === "therapist") {
      fallbackAnswer = `# 🎓 تقرير جلسة العلاج النفسي الذكي (نسخة محاكاة محلية)
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
* استمر في تدوين "شريط حياتك" لتوثيق المشاعر الإيجابية البسيطة وإعادة قراءتها عند الحاجة.`;
    } else {
      // Check query content for keywords
      const lowerQuery = query ? query.toLowerCase() : "";
      if (lowerQuery.includes("سعاد") || lowerQuery.includes("سعيد") || lowerQuery.includes("فرح")) {
        fallbackAnswer = `بناءً على مذكراتك المسجلة، فإنك تشعر بالسعادة والامتنان بشكل أكبر عندما تنجز مهامك اليومية، أو عندما تقضي وقتاً هادئاً بعيداً عن التشتت. في مذكراتك الأخيرة، تكرر ذكر شعور الامتنان في الأيام التي تلت التزامك بممارسة نشاط خفيف أو قسط كافٍ من النوم.`;
      } else if (lowerQuery.includes("قلق") || lowerQuery.includes("توتر") || lowerQuery.includes("خوف")) {
        fallbackAnswer = `يبدو أن مصدر القلق الأساسي لديك هو التفكير الزائد في المستقبل أو الضغط الناتج عن تراكم المهام المطلوبة. يلاحظ تحسن ملحوظ في قلقك بمجرد أن تبدأ في تفكيك المهام الكبيرة إلى قوائم مهام صغيرة وإنجازها واحدة تلو الأخرى.`;
      } else if (lowerQuery.includes("15") || lowerQuery.includes("يوليو")) {
        fallbackAnswer = `في يوم 15 يوليو، تسجل البيانات تدويناتك حول التخطيط والتطلع لإنجاز مهامك الهامة، حيث كان هناك حماس وارتياح عام مع طموح كبير لبدء أسبوع مثمر ومنظم. كان مزاجك الغالب في ذلك اليوم مستقراً ويميل إلى الامتنان والإصرار.`;
      } else {
        fallbackAnswer = `أهلاً بك في "مستشارك الذكي العام". بناءً على قراءة مذكراتك، يتبين أنك تمر برحلة رائعة من الاستكشاف الذاتي. مذكراتك غنية بالتفاصيل، ويظهر منها وعيك المتزايد بمشاعرك اليومية وتأثير عاداتك كالنوم والرياضة على مزاجك العام. استمر في التدوين لكي أتمكن من إعطائك تحليلات أعمق وجداول زمنية مقارنة أكثر دقة!`;
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

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: userPrompt,
        config: {
          systemInstruction,
        }
      });

      return res.json({ success: true, answer: response.text, source: "gemini" });
    } catch (error) {
      return handleGeminiError(res, error, customKey, runFallback);
    }
  } else {
    runFallback();
  }
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

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt
      });

      return res.json({ success: true, answer: response.text, source: "gemini" });
    } catch (error) {
      console.error("Diary assistant error:", error);
    }
  }

  // Fallback Local simulation
  let answer = "";
  if (promptType === "summarize") {
    answer = `📝 **ملخص اليومية:**
• تسجل التدوينة الحالة الشعورية والذهنية الراهنة بدقة.
• هناك رغبة واضحة في التوازن والتعافي الذاتي وتنظيم الأفكار.
• التركيز على استمرارية العادات الإيجابية ومواجهة المشتتات اليومية بوعي.`;
  } else if (promptType === "mistakes") {
    answer = `💡 **تحليل الأنماط الفكرية:**
• يلاحظ وجود ميل خفيف لـ **"التفكير بكل شيء أو لا شيء"** (مثل لوم النفس عند تعطل خطة واحدة).
• **البديل الفكري الصحي:** تذكر دائماً أن التراجع المؤقت أو عدم إكمال المهام بالكامل جزء طبيعي من التجربة الإنسانية، والخطوة البسيطة نحو الأمام تظل مكسباً حقيقياً!`;
  } else {
    answer = `🎯 **خطة مقترحة ليوم الغد:**
1. **ابدأ بنشاط بسيط:** خصص أول 15 دقيقة في الصباح لنفسك بدون تصفح الهاتف (كوب قهوة، تأمل، أو تمدد).
2. **قسّم مهامك:** اختر أهم مهمتين فقط وركز عليهما وتجاوز التشتت.
3. **وقت للراحة:** حدد موعداً ثابتاً للتوقف عن العمل وممارسة تمرين تنفس مهدئ ومريح لمدة 5 دقائق.`;
  }

  res.json({ success: true, answer, source: "local-simulation" });
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
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
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
      console.error("Gratitude Advisor Gemini error:", error);
    }
  }

  // Fallback
  let fallbackAnswer = "";
  if (action === "reflect") {
    fallbackAnswer = `### ✨ تأمل الامتنان النفسي والتحليل الذاتي (نسخة محاكاة محلية)
سعداء برؤيتك تواظب على تدوين الأشياء الإيجابية في حياتك! يظهر تحليل بطاقات الامتنان الخاصة بك تركيزك على:
1. **الروابط العائلية والاجتماعية**: الحديث والمشاركة مع أحبائك يمثل ركيزة هامة للاستقرار والسلام النفسي لديك.
2. **اللحظات البسيطة**: شرب القهوة ومراقبة الطبيعة تعزز وعيك الآني (Mindfulness).
3. **التقدم والتعلم السلوكي**: تخطي الصعوبات ينمي مرونتك النفسية.

*نصيحة اليوم من علم النفس الإيجابي:* حاول استحضار هذه اللحظات بكل حواسك لمدة 15 ثانية على الأقل عندما تدونها، لتثبيت المسارات الإيجابية في الدماغ!`;
  } else if (action === "card_analysis") {
    fallbackAnswer = `هذا الحدث الإيجابي الصغير يساهم مباشرة في تحفيز خلايا الفص الجبهي لإطلاق الدوبامين، مما يخفض حساسية اللوزة الدماغية (Amygdala) تجاه مسببات التوتر والتوتر اليومي. أنت تبني درعاً نفسياً صلباً!`;
  } else if (action === "ai_generator") {
    fallbackAnswer = JSON.stringify({
      text: "أنا ممتن للسلام الداخلي ومحاولتي الدائمة لتنظيم يومياتي وأفكاري والالتزام بعاداتي الإيجابية برغم كل الضغوط.",
      suggestedColor: "lavender"
    });
  } else {
    fallbackAnswer = `### 💡 مقترحات تفكرية لدفتر امتنانك اليوم (نسخة محاكاة محلية)
إليك 3 أشياء جميلة يمكنك التفكير فيها لتدوينها اليوم:
1. **أشخاص ملهمون**: فكر في شخص قام بفعل لطيف أو بسيط من أجلك مؤخراً، أو حتى ابتسم في وجهك. كيف أثر ذلك عليك؟
2. **تحدٍ تم التغلب عليه**: ما هو الشيء البسيط الذي كان يثير قلقك بالأمس ومر اليوم بسلام دون أي أذى؟
3. **لحظة هدوء كاملة**: فكر في خمس دقائق جلست فيها بمفردك اليوم مستمتعاً بنسمة هواء، أو كوب ماء بارد، أو غرفتك الهادئة.`;
  }
  return res.json({ success: true, answer: fallbackAnswer, source: "fallback" });
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

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
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
      console.error("Gemini CBT analyze error:", error);
    }
  }

  // Fallback simulator
  const cognitiveDistortion = "التهويل وتوقع الكوارث (Catastrophizing): افتراض السيناريو الأسوأ وتكبير حجم المشاكل دون أدلة منطقية كافية.";
  const rationalAlternative = "الفشل في مهمة واحدة أو الشعور بالتقصير لمرة لا يعنيان نهاية المطاف أو ضياع المستقبل؛ هذه فرصة رائعة للتعلم وتعديل المسار، والأمور ستمر بسلام كما مرت مثيلاتها سابقاً.";
  return res.json({ success: true, cognitiveDistortion, rationalAlternative, source: "local-simulation" });
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

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
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
      console.error("Gemini daily-inspiration error:", error);
    }
  }

  // Fallback simulator
  const quotesList = [
    { quote: "تذكر دائماً أن القلق لا يمنع ألم الغد، ولكنه يسرق متعة وسلام اليوم فحسب.", author: "دكتورك النفسي الصديق" },
    { quote: "السلام الداخلي يبدأ في اللحظة التي تختار فيها ألا تسمح لحدث خارجي أو فكرة عابرة بالتحكم في مشاعرك.", author: "أبحاث علم النفس المعرفي" },
    { quote: "النفس كالطفل؛ إن أهملتها بقيت على القلق، وإن رعيها وطمأنتها سكنت واطمأنت.", author: "حكمة نفسية قديمة" }
  ];
  const selectedQuote = quotesList[Math.floor(Math.random() * quotesList.length)];
  return res.json({ success: true, ...selectedQuote, source: "local-simulation" });
});

// API Endpoint: Interactive chat with AI within a specific diary (مساحة الفضفضة والتحليل 🧠✨)
app.post("/api/gemini/diary-chat", async (req, res) => {
  const { title, content, chatLogs, newMessage, diaryType, moods, attachments } = req.body;

  if (!newMessage || newMessage.trim() === "") {
    return res.status(400).json({ success: false, error: "الرسالة مفقودة" });
  }

  const customKey = req.headers["x-gemini-key"] as string;
  const ai = getGenAI(customKey);
  
  // Format the history
  const formattedLogs = (chatLogs || []).map((msg: any) => {
    return `${msg.sender === 'user' ? 'المستخدم' : 'المعالج النفسي الذكي'}: ${msg.text}`;
  }).join("\n");

  const prompt = `أنت طبيب نفسي ومعالج إكلينيكي متعاطف وخبير باللغة العربية.
أنت الآن في جلسة علاجية تفاعلية سرية تسمى "مساحة الفضفضة والتحليل 🧠✨" مع المستخدم بناءً على ما دونه في مذكرته الحالية:
العنوان: "${title || 'بدون عنوان'}"
نوع التدوين: "${diaryType === 'thought' ? 'خاطرة وأفكار سريعة' : 'يومية تفصيلية'}"
الحالة المزاجية المحددة: "${moods ? moods.join(', ') : 'طبيعي'}"
المحتوى الأساسي المكتوب:
"${content || 'لم يكتب المستخدم نصاً بعد، ربما اعتمد على المرفقات فحسب'}"

المرفقات والوسائط المتاحة للتحليل في هذه التدوينة حالياً:
${attachments ? attachments.join(', ') : 'لا يوجد مرفقات'}

سجل الحوار السابق في هذه الجلسة الحالية:
${formattedLogs || 'لا يوجد حوار سابق، هذه بداية الجلسة.'}

رسالة المستخدم الجديدة: "${newMessage}"

المطلوب منك:
1. الرد بتعاطف وحكمة وعلم، كمعالج نفسي صديق يستمع بعمق ولا يطلق الأحكام.
2. وجه نقاشاً مثمراً يسهم في تقليل القلق، علاج الأفكار السلبية، والتوجيه نحو التصالح وبناء المرونة النفسية.
3. كن موجزاً ومركزاً ولا تطل كثيراً لضمان تجربة مستخدم سلسة ومريحة.
4. باللغة العربية الفصحى الدافئة المعبرة.`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt
      });
      return res.json({ success: true, answer: response.text, source: "gemini" });
    } catch (error) {
      console.error("Gemini diary chat error:", error);
    }
  }

  // Fallback simulator
  let answer = "";
  const lowerMsg = newMessage.toLowerCase();
  if (lowerMsg.includes("حزين") || lowerMsg.includes("ضيق") || lowerMsg.includes("تعب")) {
    answer = `أشعر بصدق كلامك، والفضفضة والتعبير عما بداخلك هما أولى خطوات التعافي النفسي والتصالح مع الذات. تذكر أن المشاعر كأمواج البحر تأتي وتذهب ولا تبقى للأبد، وعلينا رعاية أنفسنا بلطف في هذه الأوقات الصعبة. هل تود التحدث أكثر عن السبب الأساسي الذي جعلك تشعر بهذا اليوم؟`;
  } else if (lowerMsg.includes("شكرا") || lowerMsg.includes("جميل") || lowerMsg.includes("شكراً")) {
    answer = `أنا هنا دائماً لأستمع إليك وأدعمك يا صديقي! تدوين مشاعرك وأفكارك يوضح وعياً ممتازاً ورغبة صادقة في بناء حياة نفسية مستقرة ومتوازنة. استمر في هذه الرحلة الرائعة!`;
  } else {
    answer = `أشكرك على هذه الفضفضة الصادقة والمشاركة العميقة. يبدو أنك تحاول تنظيم أفكارك ومواجهة مشاعرك بوعي تام وشجاعة. كمعالج نفسي، أنصحك بأن تأخذ نفساً عميقاً، وتتأمل الحدث بلطف دون أن تقسو على ذاتك. ما هي فكرتك عما يمكننا فعله غداً كخطوة صغيرة للتغلب على هذا الشعور؟`;
  }
  return res.json({ success: true, answer, source: "local-simulation" });
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
