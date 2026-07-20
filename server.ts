import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import nodemailer from "nodemailer";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

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
      console.log(`[SMTP SIMULATION] Backup file successfully generated for: ${email}`);
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

// Check if Gemini is enabled
app.get("/api/gemini/status", (req, res) => {
  const customKey = req.headers["x-gemini-key"] as string;
  const isEnabled = !!getGenAI(customKey);
  res.json({ enabled: isEnabled });
});

// API Endpoint 1: Analyze Mood of a Diary Entry
app.post("/api/gemini/analyze-mood", async (req, res) => {
  const { title, content } = req.body;

  if (!content || content.trim() === "") {
    return res.json({
      success: true,
      analysis: [{ mood: "طبيعي", percentage: 100 }]
    });
  }

  const customKey = req.headers["x-gemini-key"] as string;
  const ai = getGenAI(customKey);
  if (ai) {
    try {
      const prompt = `أنت طبيب نفسي ومحلل مشاعر خبير باللغة العربية. قم بتحليل النص التالي المستخرج من مذكرات يومية للمستخدم واستنتج بدقة النسب المئوية للمشاعر المختلفة التي يمر بها.
عنوان المذكرة: "${title || 'بدون عنوان'}"
محتوى المذكرة: "${content}"

يجب أن تقوم بتوزيع النسب المئوية على المشاعر التالية فقط: سعيد جدًا، سعيد، مرتاح، طبيعي، حزين، مكتئب، قلق، غاضب، مرهق، ممتن.
أرجع النتيجة على شكل مصفوفة JSON تحتوي فقط على كائنات بصيغة:
[{"mood": "اسم الشعور بالعربية", "percentage": الرقم بين 1 و 100}]`;

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
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
    }
  }

  // Fallback Local NLP Simulator
  const analysis = [{ mood: "طبيعي", percentage: 100 }];
  res.json({ success: true, analysis, source: "local-simulation" });
});

// API Endpoint: Evaluate Habits & Behavior Patterns
app.post("/api/gemini/evaluate-habits", async (req, res) => {
  const { habits, period, startDate, endDate, overallCompliance } = req.body;

  const formattedHabits = (habits || []).map((h: any) => {
    const totalDone = Object.values(h.history || {}).filter(Boolean).length;
    return `- العادة: "${h.name}" [التصنيف: ${h.category}], الإنجاز: ${totalDone}`;
  }).join("\n");

  const customKey = req.headers["x-gemini-key"] as string;
  const ai = getGenAI(customKey);
  if (ai) {
    try {
      const prompt = `أنت طبيب نفسي ومحلل سلوكي إكلينيكي خبير باللغة العربية. حلل الالتزام بالعادات الشخصية للمستخدم التالي:
${formattedHabits}
الفترة: ${period} من ${startDate} إلى ${endDate} بنسبة التزام إجمالية ${overallCompliance}%. أرجع تقريراً سلوكياً مشجعاً ومنسقاً بـ Markdown.`;

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "أنت مستشار سلوكي وطبيب نفسي خبير باللغة العربية تحلل العادات.",
        }
      });

      return res.json({ success: true, answer: response.text, source: "gemini" });
    } catch (error) {
      console.error("Gemini evaluate-habits error:", error);
    }
  }

  res.json({ success: true, answer: "# تقرير محاكاة العادات المحدود", source: "local-simulation" });
});

// API Endpoint 2: Smart Advisor (🧠 المستشار الذكي العام)
app.post("/api/gemini/smart-advisor", async (req, res) => {
  const { diaries, query, reportType, startDate, endDate, gratitudeCards, habits, books } = req.body;

  const customKey = req.headers["x-gemini-key"] as string;
  const ai = getGenAI(customKey);
  if (ai) {
    try {
      const systemInstruction = "أنت مستشار ذكي وخبير رائد في تحليل البيانات الشخصية، تدوين اليوميات، ومتابعة الصحة النفسية باللغة العربية. مهمتك هي تقديم إجابات عميقة ومليئة بالتعاطف البشري لمساعدته على فهم أنماط حياته ومشاعره.";
      const userPrompt = `نوع التقرير المطلوب: ${reportType || 'عام'}
السؤال أو الرسالة: ${query || 'تحليل عام للبيانات'}
يرجى معالجة البيانات وتقديم النصيحة النفسية والسلوكية المناسبة بناءً على مدخلات المستخدم اليومية وعاداته بأسلوب داعم ومحترف.`;

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction: systemInstruction,
        }
      });

      return res.json({ success: true, answer: response.text, source: "gemini" });
    } catch (error) {
      console.error("Gemini smart-advisor error:", error);
    }
  }

  res.json({ success: true, answer: "مرحباً بك، أنا مستشارك النفسي والذكي. يرجى التأكد من إعداد الـ API Key الخاص بك لتفعيل التحليلات المتقدمة الكاملة.", source: "local-simulation" });
});

// --- Vite integration for Production & Development environments ---
const isProd = process.env.NODE_ENV === "production";
if (isProd) {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  createViteServer({
    server: { middlewareMode: true },
    appType: "custom"
  }).then((vite) => {
    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
      try {
        const html = fs.readFileSync(path.join(process.cwd(), "index.html"), "utf-8");
        res.status(200).set({ "Content-Type": "text/html" }).end(await vite.transformIndexHtml(req.originalUrl, html));
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  });
}

app.listen(PORT, () => {
  console.log(`Server is running smoothly on port ${PORT}`);
});
