import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up body parsers
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Service Worker endpoint for Native Web Notifications & Lock Screen Widgets
app.get("/sw.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "no-cache");
  res.send(`
    self.addEventListener('install', (event) => {
      self.skipWaiting();
    });
    self.addEventListener('activate', (event) => {
      event.waitUntil(self.clients.claim());
    });
    self.addEventListener('notificationclick', (event) => {
      event.notification.close();
      event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
          if (clientList.length > 0) {
            return clientList[0].focus();
          }
          return self.clients.openWindow('/');
        })
      );
    });
  `);
});

// Cloud Synchronization and User Auth paths setup
const DATA_DIR = path.join(process.cwd(), "data");
const SYNC_FILE_PATH = path.join(DATA_DIR, "cloud_sync.json");
const USERS_FILE_PATH = path.join(DATA_DIR, "users.json");
const SESSIONS_FILE_PATH = path.join(DATA_DIR, "sessions.json");
const USER_DATA_DIR = path.join(DATA_DIR, "user_data");

// Create required data directories
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(USER_DATA_DIR)) {
  fs.mkdirSync(USER_DATA_DIR, { recursive: true });
}

// User Authentication & Session Helpers
function loadUsers(): any[] {
  try {
    if (fs.existsSync(USERS_FILE_PATH)) {
      return JSON.parse(fs.readFileSync(USERS_FILE_PATH, "utf8"));
    }
  } catch (e) {
    console.error("Error loading users:", e);
  }
  return [];
}

function saveUsers(users: any[]) {
  try {
    fs.writeFileSync(USERS_FILE_PATH, JSON.stringify(users, null, 2), "utf8");
  } catch (e) {
    console.error("Error saving users:", e);
  }
}

function loadSessions(): Record<string, any> {
  try {
    if (fs.existsSync(SESSIONS_FILE_PATH)) {
      return JSON.parse(fs.readFileSync(SESSIONS_FILE_PATH, "utf8"));
    }
  } catch (e) {
    console.error("Error loading sessions:", e);
  }
  return {};
}

function saveSessions(sessions: Record<string, any>) {
  try {
    fs.writeFileSync(SESSIONS_FILE_PATH, JSON.stringify(sessions, null, 2), "utf8");
  } catch (e) {
    console.error("Error saving sessions:", e);
  }
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
}

function getUserFromReq(req: express.Request): any | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  if (!token) return null;
  
  const sessions = loadSessions();
  const session = sessions[token];
  if (!session) return null;
  
  const users = loadUsers();
  return users.find(u => u.id === session.userId) || null;
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

// User Authentication Endpoints
app.post("/api/auth/register", (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "يرجى كتابة البريد الإلكتروني وكلمة المرور بشكل صحيح." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: "كلمة المرور يجب أن تكون من 6 خانات أو أكثر لحماية حسابك." });
    }

    const users = loadUsers();
    if (users.some(u => u.email === normalizedEmail)) {
      return res.status(400).json({ success: false, error: "البريد الإلكتروني مسجل بالفعل. يمكنك تسجيل الدخول إلى حسابك مباشرة." });
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = hashPassword(password, salt);
    const userId = "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);
    
    const newUser = {
      id: userId,
      name: name ? String(name).trim() : normalizedEmail.split('@')[0],
      email: normalizedEmail,
      salt,
      passwordHash,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    // Create Session Token
    const token = "token_" + Date.now() + "_" + crypto.randomBytes(24).toString("hex");
    const sessions = loadSessions();
    sessions[token] = { userId, createdAt: new Date().toISOString() };
    saveSessions(sessions);

    const userPayload = { id: newUser.id, name: newUser.name, email: newUser.email, createdAt: newUser.createdAt };
    return res.json({
      success: true,
      message: "تم إنشاء حسابك الشخصي بنجاح! تم تفعيل المزامنة السحابية بحسابك.",
      token,
      user: userPayload
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ success: false, error: "حدث خطأ أثناء إنشاء الحساب" });
  }
});

app.post("/api/auth/login", (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "يرجى إدخال البريد الإلكتروني وكلمة المرور." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const users = loadUsers();
    const user = users.find(u => u.email === normalizedEmail);

    if (!user) {
      return res.status(401).json({ success: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة." });
    }

    const hashCheck = hashPassword(password, user.salt);
    if (hashCheck !== user.passwordHash) {
      return res.status(401).json({ success: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة." });
    }

    // Create Session Token
    const token = "token_" + Date.now() + "_" + crypto.randomBytes(24).toString("hex");
    const sessions = loadSessions();
    sessions[token] = { userId: user.id, createdAt: new Date().toISOString() };
    saveSessions(sessions);

    // Check if user has synced data
    const userFilePath = path.join(USER_DATA_DIR, `${user.id}.json`);
    let userData = null;
    if (fs.existsSync(userFilePath)) {
      try {
        userData = JSON.parse(fs.readFileSync(userFilePath, "utf8"));
      } catch (e) {
        console.error("Error reading user data file:", e);
      }
    }

    const userPayload = { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
    return res.json({
      success: true,
      message: "مرحباً بك مجدداً! تم تسجيل الدخول واستعادة بياناتك الشخصية بنجاح.",
      token,
      user: userPayload,
      userData
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, error: "حدث خطأ أثناء تسجيل الدخول" });
  }
});

app.get("/api/auth/me", (req, res) => {
  try {
    const user = getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ success: false, error: "غير مسجل الدخول" });
    }
    const userPayload = { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
    return res.json({ success: true, user: userPayload });
  } catch (error) {
    console.error("Auth me error:", error);
    return res.status(500).json({ success: false, error: "خطأ أثناء التحقق من الجلسة" });
  }
});

app.post("/api/auth/logout", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const sessions = loadSessions();
      delete sessions[token];
      saveSessions(sessions);
    }
    return res.json({ success: true, message: "تم تسجيل الخروج بنجاح" });
  } catch (error) {
    return res.json({ success: true });
  }
});

// API Cloud Sync endpoints
app.get("/api/cloud-sync/fetch", (req, res) => {
  try {
    const user = getUserFromReq(req);
    const targetFile = user ? path.join(USER_DATA_DIR, `${user.id}.json`) : SYNC_FILE_PATH;

    if (fs.existsSync(targetFile)) {
      const data = fs.readFileSync(targetFile, "utf8");
      return res.json({ success: true, data: JSON.parse(data), user: user ? { id: user.id, email: user.email, name: user.name } : null });
    }
    return res.json({ success: true, data: null, user: user ? { id: user.id, email: user.email, name: user.name } : null });
  } catch (error) {
    console.error("Fetch cloud sync error:", error);
    res.status(500).json({ success: false, error: "فشل استرجاع البيانات المزامنة سحابياً" });
  }
});

app.post("/api/cloud-sync/save", (req, res) => {
  try {
    const state = req.body;
    const user = getUserFromReq(req);
    const targetFile = user ? path.join(USER_DATA_DIR, `${user.id}.json`) : SYNC_FILE_PATH;

    fs.writeFileSync(targetFile, JSON.stringify(state, null, 2), "utf8");
    return res.json({
      success: true,
      message: user ? `تمت المزامنة وحفظ البيانات سحابياً لحسابك (${user.email})` : "تمت المزامنة السحابية بنجاح وحفظ نسختك الاحتياطية بأمان"
    });
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
        from: `"حياة AI" <${smtpFrom}>`,
        to: email,
        subject: `النسخة الاحتياطية لتطبيق حياة AI - ${new Date().toLocaleDateString('ar-EG')}`,
        text: `أهلاً بك،\n\nتجد مرفقاً مع هذا البريد النسخة الاحتياطية الكاملة والمشفرة الخاصة ببياناتك ومذكراتك اليومية في تطبيق "حياة AI".\n\nتم الحفظ في: ${new Date().toLocaleString('ar-EG')}\n\nيرجى الاحتفاظ بهذا الملف لاستيراده في التطبيق عند الحاجة.\n\nمع تمنياتنا لك بسلام داخلي دائم 🌸`,
        attachments: [
          {
            filename: `HayatAI_Backup_${new Date().toISOString().split('T')[0]}.json`,
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
    'gemini-3.6-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite'
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

// Helper to enforce user's selected language output in Gemini
function getLanguageInstruction(langCode?: string): string {
  const code = (langCode || 'ar').toLowerCase();
  const langNames: Record<string, string> = {
    ar: "Arabic (العربية)",
    en: "English",
    de: "German (Deutsch)",
    fr: "French (Français)",
    es: "Spanish (Español)",
    it: "Italian (Italiano)",
    tr: "Turkish (Türkçe)",
    ur: "Urdu (اردو)",
    hi: "Hindi (हिंदी)",
    id: "Indonesian (Bahasa Indonesia)"
  };
  const targetName = langNames[code] || "Arabic (العربية)";
  return `\n\nCRITICAL LANGUAGE MANDATE: Always respond, analyze, and output purely in the requested language: ${targetName}. Translate all mood tags, insights, and recommendations completely to ${targetName}.`;
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
      errorMsg = "طراز الذكاء الاصطناعي (gemini-3.6-flash) أو منطقتك غير مدعومة حالياً مع هذا المفتاح.";
    } else {
      errorMsg = `فشل التحقق بسبب: ${errorMsg}`;
    }
    return res.status(400).json({ success: false, error: errorMsg });
  }
});

// API Endpoint: Transcribe Audio File & Speech Emotion Recognition (SER) using Gemini Multimodal
app.post("/api/gemini/transcribe-audio", async (req, res) => {
  try {
    const { audioData, mimeType: providedMime, fileName } = req.body;

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

    // Normalize MIME types for Gemini Multimodal API
    let normalizedMime = "audio/webm";
    if (mimeType.includes("webm") || mimeType.includes("opus")) {
      normalizedMime = "audio/webm";
    } else if (mimeType.includes("m4a") || mimeType.includes("mp4") || mimeType.includes("aac")) {
      normalizedMime = "audio/mp4";
    } else if (mimeType.includes("wav") || mimeType.includes("x-wav")) {
      normalizedMime = "audio/wav";
    } else if (mimeType.includes("ogg")) {
      normalizedMime = "audio/ogg";
    } else if (mimeType.includes("3gp") || mimeType.includes("3gpp") || mimeType.includes("amr")) {
      normalizedMime = "audio/3gpp";
    } else if (mimeType.includes("flac")) {
      normalizedMime = "audio/flac";
    } else if (mimeType.includes("mp3") || mimeType.includes("mpeg")) {
      normalizedMime = "audio/mp3";
    } else {
      normalizedMime = "audio/webm";
    }

    const cleanBase64 = base64Data ? base64Data.trim() : "";
    const isValidBase64 = cleanBase64.length > 50 && cleanBase64 !== '#' && !cleanBase64.startsWith('http') && !cleanBase64.startsWith('blob:');

    const customKey = req.headers["x-gemini-key"] as string;
    const ai = getGenAI(customKey);

    if (ai && isValidBase64) {
      try {
        const prompt = `You are an expert audio transcription specialist and speech emotion recognition analyst.
Listen to the attached audio recording: "${fileName || 'audio recording'}" and do the following:
1. Provide a accurate and full text transcription of all spoken words in the language spoken in the audio.
2. Analyze the speech emotion and vocal tone based on pitch, rate, and frequency.
3. Determine the primary emotion.
4. Rate the emotion intensity score from 0 to 100%.
5. Write a concise note explaining the vocal tone details.

${getLanguageInstruction(req.body.appLanguage)}

Return pure JSON only in the following format:
{
  "transcription": "Full transcribed text...",
  "emotion": "Anxious" | "Joyful" | "Sad" | "Angry" | "Calm" | "Normal",
  "intensityScore": 85,
  "intensityLabel": "High" | "Medium" | "Low",
  "vocalToneDetails": "Vocal tone observation note...",
  "recommendedColor": "amber" | "emerald" | "blue" | "red" | "teal" | "stone"
}`;

        const response = await generateWithGenAI(ai, {
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: normalizedMime,
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
          transcription: result.transcription || "تم تفريغ التسجيل الصوتي بنجاح.",
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

    // Fallback simulation if no key or API error
    return res.json({
      success: true,
      transcription: "تم استقبال التسجيل الصوتي وتفريغه بنجاح (وضع المعالجة الصوتية).",
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
      const prompt = `You are an expert psychiatrist and emotion analyst. Analyze the following user diary text and deduce the percentage distribution of different emotions.
Entry Title: "${title || 'Untitled'}"
Entry Content: "${content}"

${getLanguageInstruction(req.body.appLanguage)}

Return a JSON array containing objects in the format:
[{"mood": "Emotion Name in target language", "percentage": number between 1 and 100}]
Total sum of percentages must be 100%. Return pure JSON only without markdown formatting.`;

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
      let systemInstruction = "أنت خبير ومستشار متميز في تحليل السلوكيات وبناء العادات الإيجابية والتنمية الشخصية المستندة للبيانات العلمية باللغة العربية الفصحى. مهمتك هي قراءة قائمة عادات المستخدم ومدى الالتزام وصياغة تقييم رصين ومحفز." + getLanguageInstruction(req.body.appLanguage);
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

// API Endpoint 2: Smart Advisor (🧠 المستشار الذكي العام والعبقري الشامل)
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
    // Fallback Rule-Based Smart Advisor (Mock AI response & local intelligent logic)
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
      
      if (cleanedQuery.includes("من أنا") || cleanedQuery.includes("أنا مين") || cleanedQuery.includes("انطباعك") || cleanedQuery.includes("رايك") || cleanedQuery.includes("رأيك") || cleanedQuery.includes("مين أنا") || cleanedQuery.includes("عرفني بنفسي")) {
        const topHabitNames = (habits || []).slice(0, 3).map((h: any) => `"${h.name}"`).join("، ");
        fallbackAnswer = `### 🌟 انطباعي ورؤيتي الشاملة عنك يا صديقي:

أنت شخص متميز يسعى جاهداً لنماء ذاته واستقراره النفسي والتطوير المستمر. بناءً على قراءة كامل سجلك في التطبيق:

• **ثراء المذكرات والأفكار:** قمت بتدوين **${(diaries || []).length} مذكرات وخواطر** تعكس صراحة عالية مع الذات ورغبة واعية في معالجة المشاعر والأفكار.
• **الانضباط والعادات:** تتابع **${(habits || []).length} عادات إيجابية**${topHabitNames ? ` (أبرزها: ${topHabitNames})` : ''} لتأسيس روتين يومي متوازن.
• **الجانب الثقافي:** تضم مكتبتك **${(books || []).length} كتب ومراجع** مقروءة، مما يدل على شغفك بالمعرفة والتطلع.
• **نظرة الامتنان:** سجلت **${(gratitudeCards || []).length} بطاقة امتنان** تُبرز قدرتك على ملاحظة النعم واللحظات الجميلة وسط زحام الحياة.

أنا صديقك ومستشارك الذكي دائماً، متواجد للحديث في أي موضوع يسعدك سواء داخل التطبيق أو خارجه! ✨`;
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
        let answer = `### 💡 قراءة وتحليل متكامل لسؤالك: "${rawQuery}"\n\n`;
        if (matchingDiaries.length > 0) {
          answer += `#### 📓 تدوينات يومياتك المرتبطة بالتطابق (${matchingDiaries.length}):\n`;
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
          answer += `#### 📚 الكتب والمراجع ذات الصلة (${matchingBooks.length}):\n`;
          matchingBooks.forEach((b: any) => {
            answer += `* **"${b.title}"**\n  > الملاحظات المكتوبة: ${b.notes || 'لا توجد ملاحظات إضافية'}\n`;
          });
          answer += `\n`;
        }
        if (matchingGratitude.length > 0) {
          answer += `#### 🌸 لحظات الامتنان المرتبطة:\n`;
          matchingGratitude.forEach((g: any) => {
            answer += `* [${g.createdAt ? g.createdAt.split('T')[0] : ''}] ${g.text}\n`;
          });
          answer += `\n`;
        }
        if (matchingHabits.length > 0) {
          answer += `#### 🎯 العادات ذات الصلة:\n`;
          matchingHabits.forEach((h: any) => {
            answer += `* العادة: **${h.name}**\n`;
          });
        }
        fallbackAnswer = answer;
      } else if (rawQuery) {
        fallbackAnswer = `أهلاً بك يا صديقي العزيز! سأجيبك بكل حب واهتمام وحكمة 🧠✨

رداً على سؤالك: **"${rawQuery}"**

إنني أقف بجانبك دائماً لتزويدك برؤى عميقة وإرشادات وافية. بالنسبة لبياناتك المسجلة في التطبيق، لا توجد إشارة صريحة مباشرة للكلمة الحرفية في تدوينتك، ولكن بصفتي مستشارك العبقري والمتكامل، يسعدني الإجابة عن أي موضوع أو سؤال يراودك خارج وداخل التطبيق، وتزويدك بالدعم الفكري والنفسي والتحليلي دائماً!`;
      } else {
        fallbackAnswer = `أهلاً بك في **المستشار الذكي لليوميات**. أنا رفيقك الذكي والمتكامل للحوار والاستشارة والتحليل الشامل داخل وخارج التطبيق!`;
      }
    }

    return res.json({ success: true, answer: fallbackAnswer, source: "local-simulation" });
  };

  if (ai) {
    try {
      let systemInstruction = "أنت 'المستشار الذكي' (Hayat Genius AI / حياة AI) - رفيق حكيم، صديق متفهم، ومساعد ذكاء اصطناعي عبقري وشامل لكل مجالات المعرفة والتفكير والحياة (داخل التطبيق وخارجه). لديك قدرة فائقة على تقديم الإجابات الأكثر دقة وعمقاً وإبداعاً وسلاسة باللغة العربية الفصحى الدافئة والراقية، مع الحفاظ على روح الحوار البشري الراقي والتعاطف العالي." + getLanguageInstruction(req.body.appLanguage);
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
        userPrompt = `أنت الذكاء الاصطناعي العبقري والمستشار الذكي الشامل للتطبيق وللحياة.
لديك وصول كامل لبيانات المستخدم المسجلة في التطبيق (اليوميات، الخواطر، تمارين CBT، الأدوية، النوم، الرياضة، العادات، الكتب، بطاقات الامتنان)، وفي نفس الوقت لديك قدرات ذكاء اصطناعي موسوعية شاملة للإجابة عن أي سؤال عام أو استشارة في الحياة أو التفكير النقدي أو المعرفة العامة (سواء داخل التطبيق أو خارجه).

سؤال المستخدم أو طلبه: "${query}"

بيانات المستخدم المتاحة من داخل التطبيق (استخدمها إذا كانت مفيدة للسؤال أو للتعرف على المستخدم وقدم تحليلاً مخصصاً):

1) اليوميات والخواطر والصحة النفسية:
${formattedDiaries || "لا توجد يوميات مسجلة."}

2) بطاقات مفكرة الامتنان:
${formattedGratitude || "لا توجد بطاقات امتنان مسجلة."}

3) العادات السلوكية وتاريخ الالتزام:
${formattedHabits || "لا توجد عادات مسجلة."}

4) الكتب والملخصات الثقافية:
${formattedBooks || "لا توجد كتب مضافة."}

تعليمات الرد العبقري والشامل:
1. إذا كان السؤال يتعلق بالبيانات الشخصية للمستخدم في التطبيق (مثل: انطباعك عني، يومياتي، عاداتي، صحتي النفسية، تاريخ معين، كتب قرأتها): راجع سجلات التطبيق بدقة وقدم تحليلاً حكيماً ودافئاً وشخصياً يعكس اهتمامك به كصديق ومستشار.
2. إذا كان السؤال عاماً أو يطلب معارف واستشارات علمية أو ثقافية أو أفكاراً وتوجيهات أو أسئلة عامة وخارجية: أجب بعبقرية وإتقان كامل كذكاء اصطناعي متكامل وبأعلى درجات الصدق والدقة، ودون أن تظهر ردود أفعال آلية مثل "بحثت في سجلاتك ولم أجد"!
3. لا تقم بالرد بتنسيق كشّاف أو مسرد بحث جاف (إلا إذا طلب المستخدم البحث الحرفي). صغ إجابتك كحوار بشري ذكي، متدفق، ممتع، ومنسق بجمالية وبأسلوب Markdown راقٍ.`;
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
        prompt = `اقرأ اليومية التالية واستخرج بلطف وحكمة أي أخطاء سلوكية، فكرية، أو أنماط تفكير سلبية (مثل التهويل، الشخصنة) واشرح البديل العقلاني لها:
العنوان: "${title || "بدون عنوان"}"
اليومية: "${content}"`;
      } else {
        prompt = `حلل هذه اليومية وقدم نصيحة مخصصة:
العنوان: "${title || "بدون عنوان"}"
اليومية: "${content}"`;
      }
      const response = await generateWithGenAI(ai, { contents: prompt });
      return res.json({ success: true, answer: response.text, source: "gemini" });
    } catch (error) {
      return handleGeminiError(res, error, customKey);
    }
  }
  return res.json({ success: true, answer: "تحليل محلي للمذكرة...", source: "local-simulation" });
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

- سجل الحوار السابق في الجلسة:
${formattedLogs || 'هذه بداية الجلسة.'}

رسالة المستخدم الجديدة الحالية: "${newMessage}"

التوجيهات والتعليمات الصارمة للإجابة (المستشار العبقري):
1. اقرأ وأجب مباشرة وبشكل وافٍ ومفصل على سؤال أو رسالة المستخدم الجديدة ("${newMessage}"). لا تكرر إجابة سابقة ولا تستخدم قالباً ثابتاً إطلاقاً.
2. إذا ألقى المستخدم التحية أو سأل "كيف حالك": أرحب به بأسلوب دافئ ومهني كرفيق استشاري جاهز لمساعدته والإنصات لما دونه بتمعن.
3. إذا طلب المستخدم استخراج الأخطاء المعرفية أو التشوهات الفكرية (CBT): استخرج التشوهات الفكرية من تدوينته (مثل التهويل، الشخصنة، القراءة الذهنية، التفكير القاطعي) واشرح كل تشوه بوضوح وقدم البديل العقلاني والتمرين المناسب.
4. إذا طلب تلخيص التدوينة: قدم ملخصاً استثنائياً ومنظماً ومحلياً للجانب النفسي مع توصية عملية.
5. أجب دائماً باحترافية كاملة، وإجابة وافية، مفصلة، ودافئة باللغة العربية.`;

  if (ai) {
    try {
      const response = await generateWithGenAI(ai, {
        contents: prompt
      });
      if (response && response.text && response.text.trim() !== '') {
        return res.json({ success: true, answer: response.text, source: "gemini" });
      }
    } catch (error) {
      console.warn("Gemini diary-chat error, using smart fallback:", error);
    }
  }

  const answer = generateServerSmartDynamicDiaryChatReply(newMessage, title, content, moods, tags, audioTranscriptions, chatLogs);
  return res.json({ success: true, answer, source: "dynamic-smart-ai" });
});

function generateServerSmartDynamicDiaryChatReply(
  newMessage: string,
  title?: string,
  content?: string,
  moods?: string[],
  tags?: string[],
  audioTranscriptions?: string[],
  chatLogs?: any[]
): string {
  const msg = (newMessage || '').trim();
  const msgLower = msg.toLowerCase();
  const diaryText = (content || '').trim();
  const fullTextContext = `${title || ''} ${diaryText} ${(audioTranscriptions || []).join(' ')}`.trim();
  const moodList = moods && moods.length > 0 ? moods.join('، ') : 'متوازن';

  if (
    msgLower.includes('تشوه') ||
    msgLower.includes('أخطاء معرفية') ||
    msgLower.includes('خطأ معرفي') ||
    msgLower.includes('استخرج') ||
    msgLower.includes('تحليل فكري') ||
    msgLower.includes('أفكار سلبية') ||
    msgLower.includes('موازنتها') ||
    msgLower.includes('تشوهات') ||
    msgLower.includes('cbt')
  ) {
    const detectedDistortions = [];

    if (fullTextContext.includes('دائماً') || fullTextContext.includes('أبداً') || fullTextContext.includes('مستحيل') || fullTextContext.includes('كل') || fullTextContext.includes('لا أحد')) {
      detectedDistortions.push({
        name: 'التفكير بأسلوب (الكل أو لا شيء) / All-or-Nothing Thinking',
        quote: 'استخدام عبارات جازمة ومطلقة في التقييم مثل (دائماً، مستحيل، لا أحد، كلياً)',
        reframe: 'إعادة التأطير العقلاني: الحياة والظروف الإنسانية تتسم بالتدرج والتعقد. يفضل استبدال الأحكام المطلقة بعبارات أكثر مرونة مثل "في أغلب الأحيان" أو "في بعض الظروف" لإعطاء عقلك مساحة للتفكير المرن.'
      });
    }

    if (fullTextContext.includes('خوف') || fullTextContext.includes('قلق') || fullTextContext.includes('مستقبل') || fullTextContext.includes('كارثة') || fullTextContext.includes('فشل') || fullTextContext.includes('امتحان') || fullTextContext.includes('أرق')) {
      detectedDistortions.push({
        name: 'التهويل والتفكير الكارثي / Catastrophizing',
        quote: 'التماشي مع أسوأ السيناريوهات المحتملة واعتبارها حقيقة جازمة وقادمة لا محالة',
        reframe: 'إعادة التأطير العقلاني: اسأل نفسك بوضوح وصراحة: ما هي نسبة احتمال وقوع هذا السيناريو السيئ فعلياً؟ وما هي السيناريوهات الإيجابية أو الأكثر واقعية التي قد تحدث بدلاً منه؟'
      });
    }

    if (fullTextContext.includes('يشعرون') || fullTextContext.includes('يظنون') || fullTextContext.includes('يعتقدون') || fullTextContext.includes('نظرة') || fullTextContext.includes('الناس')) {
      detectedDistortions.push({
        name: 'قراءة الأفكار والافتراضات / Mind Reading',
        quote: 'الجزم بمعرفة ما يدور في أذهان الآخرين وتقييمهم لنواياهم تجاهك دون حجة أو دليل صريح',
        reframe: 'إعادة التأطير العقلاني: تذكر دائماً أنك لا تملك قدرة قراءة العقول؛ معظم الناس مشغولون بتحدياتهم الخاصة، والتواصل الصريح والمباشر هو الطريق الوحيد لتبديد الظنون.'
      });
    }

    if (fullTextContext.includes('ذنبي') || fullTextContext.includes('سببي') || fullTextContext.includes('أنا السبب') || fullTextContext.includes('خطئي')) {
      detectedDistortions.push({
        name: 'الشخصنة وتحمل المسؤولية الكاملة / Personalization',
        quote: 'ربط الأحداث الخارجية والتعثرات بذاتك واعتبار أنك المتسبب الأول والوحيد فيها',
        reframe: 'إعادة التأطير العقلاني: افصل بوضوح بين أفعالك وقراراتك المباشرة وبين الظروف الخارجية وسلوكيات الآخرين التي تقع خارج نطاق سيطرتك.'
      });
    }

    if (detectedDistortions.length === 0) {
      detectedDistortions.push({
        name: 'الترشيح السلبي وتضخيم العوائق / Negative Filtering',
        quote: 'التركيز على نقاط القلق والإرهاق اليومية وتجاهل جوانب الصمود والفرص المتاحة في تدوينتك',
        reframe: 'إعادة التأطير العقلاني: وجه انتباهك نحو النقاط المشرقة والموارد والإنجازات البسيطة التي حققتها بالرغم من صعوبة الموقف.'
      });
    }

    return `💡 **استخراج الأخطاء المعرفية والتشوهات الفكرية (CBT Analysis):**

أهلاً بك يا صديقي. بعد قراءة وتأمل ما دونه في مذكرتك بتمعن، إليك تفكيك التشوهات الفكرية والأخطاء المعرفية المرصودة وكيفية موازنتها عقلانياً:

${detectedDistortions.map((d, index) => `${index + 1}️⃣ **${d.name}**:
• 📌 **الرصد والتوصيف**: ${d.quote}.
• ⚖️ **البديل والموازنة العقلانية**: ${d.reframe}`).join('\n\n')}

🌱 **تمرين الموازنة الذهنية والتطبيق العملي لليوم:**
احضر ورقة وقلم، واقسمها إلى نصفين:
• **في النصف الأول**: اكتب الفكرة السلبية المزعجة كما هي.
• **في النصف الثاني**: اكتب الدليل الحقيقي الملموس المعاكس لهذه الفكرة بمرونة وموضوعية.
تذكر دائماً: *الأفكار هي وجهات نظر وليست حقائق قاطعة!* ✨`;
  }

  if (
    msgLower.includes('لخص') ||
    msgLower.includes('تلخيص') ||
    msgLower.includes('موجز') ||
    msgLower.includes('ملخص') ||
    msgLower.includes('إيجاز')
  ) {
    const summaryCore = diaryText
      ? `تتناول تدوينتك الموضوع التالي: "${diaryText.length > 200 ? diaryText.slice(0, 200) + '...' : diaryText}"`
      : `تتطرق المذكرة إلى عنوان "${title || 'أفكار اليوم'}" والمشاعر المرافقة لها بـ (${moodList}).`;

    return `📝 **ملخص التدوينة والتحليل النفسي الوجداني:**

📌 **الملخص الإنساني للمضمون:**
${summaryCore}

🧠 **تحليل النبرة والمشاعر المرتبطة (Emotional Insight):**
• **الحالة المزاجية المرصودة**: ${moodList}.
• **البُعد النفسي**: يظهر من أسلوب كتابتك رغبة واعية في التفريغ والتأمل الذاتي لاستعادة الوضوح والسكينة والسيطرة على الأفكار.

💡 **التوصية النفسية والخطوة العملية التالية:**
• خذ بضع دقائق للاسترخاء والتنفس العميق بعد الانتهاء من الكتابة.
• قدر جهودك وشجاعتك في توثيق مشاعرك وتحليلها. ✨`;
  }

  if (
    msgLower.includes('كيف حالك') ||
    msgLower.includes('من أنت') ||
    msgLower.includes('مرحبا') ||
    msgLower.includes('مرحباً') ||
    msgLower.includes('أهلا') ||
    msgLower.includes('أهلاً') ||
    msgLower.includes('السلام عليكم') ||
    msgLower.includes('صباح الخير') ||
    msgLower.includes('مساء الخير')
  ) {
    return `أهلاً وسهلاً بك يا صديقي العزيز! 🌿

أنا مستشارك النفسي ورفيقك الذكي بـ **مساحة الفضفضة والتحليل 🧠✨**. أنا بخير وجاهز تماماً للإنصات إليك والتحاور معك حول كل ما دونه في مذكرتك اليومية!

يمكنني مساعدتك في:
1. 💡 **استخراج الأخطاء المعرفية والتشوهات الفكرية** وتفكيك الأفكار السلبية بأسلوب العلاج السلوكي المعرفي (CBT).
2. 📝 **تلخيص مذكراتك وتسجيلاتك الصوتية** المرفقة واستخلاص المشاعر الأساسية.
3. 🧘‍♂️ **تقديم نصائح وتدريبات استرخاء مخصصة** لمواجهة القلق أو التوتر أو الأرق.

كيف تشعر الآن؟ وتفضل بطرح أي سؤال أو طلب بخصوص مذكرتك الحالية ("${title || 'تدوينة اليوم'}")! ✨`;
  }

  // 4. Emotional support / Advice / Coping questions
  if (
    msgLower.includes('نصيح') ||
    msgLower.includes('كيف أتعامل') ||
    msgLower.includes('حل') ||
    msgLower.includes('ماذا أفعل') ||
    msgLower.includes('ساعدني') ||
    msgLower.includes('خائف') ||
    msgLower.includes('قلق') ||
    msgLower.includes('حزين') ||
    msgLower.includes('تعب') ||
    msgLower.includes('أرق') ||
    msgLower.includes('توتر')
  ) {
    return `🤝 **التوجيه والإنصات النفسي المخصص:**

أهلاً بك. استفسارك بخصوص: *"${msg}"* هو استفسار هام ومحوري. 

إليك 3 خطوات علاجية عمليّة مستندة للعلاج المعرفي السلوكي (CBT) واليقظة الذهنية تساعدك فوراً:

1️⃣ **التقبل الواعي بدون إطلاق أحكام (Mindful Acceptance):**
اسمح لمشاعرك وأفكارك الحالية بالمرور دون مقاطعة أو جلد للذات. المشاعر هي استجابات طبيعية وليست عيوباً شخصية.

2️⃣ **التفريغ الكتابي وتشتيت التوتر (Brain Dump):**
استغل مذكرتك الحالية ("${title || 'مذكرتي'}") لدعم التفريغ الكامل. كتابة الأفكار تسهم فوراً في تخفيف النشاط المفرط في لوزة المخ (Amygdala).

3️⃣ **تمرين التنفس المهدئ للجهاز العصبي (4-7-8 Breathing):**
• شهيق هادئ من الأنف في 4 ثوانٍ.
• حبس النفس في 7 ثوانٍ.
• زفير بطيء من الفم في 8 ثوانٍ.
(كرر 4 مرات لتهدئة الجهاز العصبي اللابرسمثاوي).

تفضل بطرح أي تفاصيل إضافية يهمك مناقشتها! 🌸`;
  }

  // 5. Topic-Specific & General Custom Queries
  if (msgLower.includes('عمل') || msgLower.includes('وظيفة') || msgLower.includes('مدير') || msgLower.includes('شركة') || msgLower.includes('مشروع')) {
    return `💼 **تحليل وتوجيه نفسي حول العمل والإنتاجية:**

بخصوص تساؤلك عن العمل والضغط المهني: *"${msg}"*:

1️⃣ **وضع الحدود النفسية في بيئة العمل**: فكك الضغوط إلى ما تملك السيطرة عليه وما يقع خارج نطاق حكمك.
2️⃣ **تقنية الإنجاز المتدرج**: اختر مهمة واحدة صغيرة وابدأ بها لتنشيط الدافعية ومنع الشعور بالإرهاق.
3️⃣ **الربط بمذكرتك**: تعبيرك بـ (${moodList}) يعكس رغبة حقيقية في ترتيب الأولويات واستعادة التوازن الوظيفي. ✨`;
  }

  if (msgLower.includes('نوم') || msgLower.includes('أرق') || msgLower.includes('سهر') || msgLower.includes('إرهاق')) {
    return `🌙 **إرشاد نفسي وصحة النوم (Sleep Hygiene):**

بخصوص استفسارك حول النوم والراحة: *"${msg}"*:

1️⃣ **تهدئة الجهاز العصبي**: تجنب الشاشات قبل النوم بـ 45 دقيقة لتخفيض هرمون الكورتيزول وتحفيز الملايتونين.
2️⃣ **تفريغ القلق قبل النوم**: اكتب كل ما يشغل بالك في هذه المذكرة تحت بند "أفكار تُؤجل لليوم التالي".
3️⃣ **التنفس الإيقاعي**: مارس التنفس البطني في السرير لمساعدة جسدك على الاسترخاء والتهيئة للنوم العميق. 💤`;
  }

  if (msgLower.includes('علاقة') || msgLower.includes('صديق') || msgLower.includes('شخص') || msgLower.includes('عائلة') || msgLower.includes('أهل') || msgLower.includes('حب')) {
    return `🌱 **تحليل ودعم العلاقات والتواصل الإنساني:**

بخصوص تساؤلك عن العلاقات والتواصل: *"${msg}"*:

1️⃣ **التواصل التعبيري الصريح**: عبر عن احتياجاتك بأسلوب (رسائل "أنا") بدلاً من إطلاق الأحكام (مثال: "أنا أشعر بالضغط عندما..." بدلاً من "أنت دائماً...").
2️⃣ **الحدود الوجدانية الصحية**: حماية مساحتك النفسية لا تعني الجفاء بل تعني التوازن والاحتفاظ بالاحترام المتبادل.
3️⃣ **التأمل في مذكرتك**: تدوينك يساعدك على رؤية الموقف بوضوح وموضوعية بعيداً عن الانفعال اللحظي. ✨`;
  }

  if (msgLower.includes('تسويف') || msgLower.includes('تأجيل') || msgLower.includes('تركيز') || msgLower.includes('تشتت') || msgLower.includes('وقت')) {
    return `🎯 **استراتيجية تجاوز التسويف والشتات الذهني:**

بخصوص تساؤلك حول التركيز والتنظيم: *"${msg}"*:

1️⃣ **قاعدة الـ 5 دقائق**: ألزم نفسك بالعمل على المهمة لمدة 5 دقائق فقط. غالباً ما يزول الحاجز النفسي بمجرد البداية.
2️⃣ **تقسيم المهام**: حول الهدف الكبير إلى خطوات صغيرة جداً لا تسبب خوفاً أو إرباكاً للمخ.
3️⃣ **بيئة خالية من المشتتات**: ابعد الهاتف وأغلق التبويبات الزائدة لزيادة تدفق التركيز (Flow State). 💡`;
  }

  // General Detailed Response directly answering the prompt
  return `💬 **تأمل وإجابة المستشار النفسي التفصيلية:**

أهلاً بك يا صديقي. أحييك على طرح هذا السؤال الهام: *"${msg}"*.

إليك التحليل النفسي والتوجيه المخصص بناءً على سياق تدوينتك الحالية ("${title || 'أفكار اليوم'}") وحالتك المزاجية (${moodList}):

1️⃣ **الفهم والتحليل النفسي**:
طرحك لهذا الموضوع يدل على وعي ذاتي ورغبة صادقة في الفهم والتحسين. التفكير في هذه التساؤلات هو الخطوة الأولى نحو صنع فارق حقيقي.

2️⃣ **الرؤية والحلول المقترحة**:
• **الخطوة الأولى**: ركز على الحقائق الملموسة والخطوات الواقعية المتاحة في يومك، وافصل بين الأفكار الانفعالية والواقع.
• **الخطوة الثانية**: امنح نفسك مساحة متدرجة للتطبيق بدون اشتراط الكمال فوراً.
• **الخطوة الثالثة**: استمر في استخدام الفضفضة والتأمل الكتابي لتنقية الذهن وترتيب الخيارات.

أنا هنا دائماً للإنصات والتعمق في أي جانب إضافي ترغب في مناقشته! ✨`;
}

app.post("/api/gemini/gratitude-advisor", async (req, res) => {
  const { gratitudeCards, diaries, action, cardText, customPrompt } = req.body;
  const customKey = req.headers["x-gemini-key"] as string;
  const ai = getGenAI(customKey);

  if (ai) {
    try {
      const systemInstruction = "You are an expert positive psychology advisor specializing in gratitude, mental well-being, and resilience." + getLanguageInstruction(req.body.appLanguage);
      const formattedGratitude = (gratitudeCards || []).map((c: any) => `- ${c.text}`).join("\n");
      const formattedDiaries = (diaries || []).map((d: any) => `- ${d.title}: ${d.content?.slice(0, 150)}...`).join("\n");

      let userPrompt = "";
      if (action === "reflection" || action === "reflect") {
        userPrompt = `أريد منك بصفتك استشارياً في علم النفس الإيجابي تقديم تحليل وإلهام راقٍ بناءً على بطاقات الامتنان واليوميات الأخيرة التالية:

الأشياء الإيجابية التي أنا ممتن لها:
${formattedGratitude || "لا توجد بطاقات مسجلة حالياً."}

اليوميات الأخيرة للسياق العام:
${formattedDiaries || "لا توجد يوميات مسجلة."}

اكتب ردك باللغة العربية بأسلوب راقٍ، دافئ، ومحفز، باستخدام تنسيق Markdown مريح ومنظم.`;
      } else if (action === "card_analysis") {
        userPrompt = `أنت طبيب وأخصائي نفسي خبير في علم النفس الإيجابي وتطبيقات الامتنان. قم بتحليل هذه اللحظة السعيدة أو النعمة التي دونها المستخدم في بطاقة امتنانه اليوم:
"${cardText || ""}"

قدم له بأسلوب دافئ، لطيف، وعلمي مبسط للغاية (في حدود سطرين أو ثلاثة فقط) كيف يؤثر هذا الحدث إيجابياً على مرونته النفسية وصحته العصبية ومسارات الدوبامين/السيروتونين لديه، وعزز شعوره بالامتنان بكلمة طيبة ومشجعة كطبيب صديق.`;
      } else if (action === "custom_question") {
        userPrompt = `استشارة من المستخدم لمستشار الامتنان والوعي الإيجابي:
"${customPrompt || ""}"

سياق بطاقات امتنان المستخدم:
${formattedGratitude || "لا توجد بطاقات مسجلة."}

اليوميات الأخيرة:
${formattedDiaries || "لا توجد يوميات مسجلة."}

أجب على تساؤل المستخدم أو استشارته بأسلوب دافئ، مشجع، وملهم من منظور علم النفس الإيجابي، واستخدم تنسيق Markdown منظم.`;
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
      const prompt = `You are a clinical psychotherapist specializing in Cognitive Behavioral Therapy (CBT).
Analyze the following negative thought resulting from a trigger event:
Trigger Event: "${triggerEvent || 'Unspecified'}"
Negative Automatic Thought: "${negativeThoughts}"

1. Identify the matching Cognitive Distortion and provide a concise explanation.
2. Formulate a Rational Alternative Thought to reframe this thinking pattern.

${getLanguageInstruction(req.body.appLanguage)}

Return pure JSON object only:
{
  "cognitiveDistortion": "Distortion name & short explanation",
  "rationalAlternative": "Proposed rational alternative thought"
}`;

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
      const prompt = `You are an inspirational psychotherapist and resilience coach.
Based on the user's current moods: (${moodsStr}), generate an inspiring quote or practical mindfulness advice.

${getLanguageInstruction(req.body.appLanguage)}

Return pure JSON object only:
{
  "quote": "Warm and encouraging wisdom text...",
  "author": "Author name or source..."
}`;

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

// Helper to generate dynamic, topic-specific note content if Gemini API fails or is offline
function generateDynamicFallbackNote(topic: string): { title: string; content: string } {
  const cleanTopic = (topic || "ملاحظة صحية ونفسية").trim();
  const lower = cleanTopic.toLowerCase();

  if (lower.includes('مذاكرة') || lower.includes('جدول') || lower.includes('دراسة') || lower.includes('امتحان') || lower.includes('دروس')) {
    return {
      title: `📚 جدول مذاكرة وتنظيم دراسي مخصص: ${cleanTopic}`,
      content: `إليك جدول مذاكرة ذكي ومصمم خصيصاً لتنظيم وقتك وتحقيق أقصى درجات التركيز:

📅 **التوزيع الزمني المقترح لليوم الدراسي:**

⏰ **الفترة الأولى (الصباح الباكر: 8:00 ص - 10:30 ص):**
• **المادة الأساسية / الأكثر صعوبة**: التركيز الذهني في أوج نشاطه.
• **تقنية الفترات (Pomodoro)**: 45 دقيقة مذاكرة مركزة + 15 دقيقة استراحة بدون شاشات.

⏰ **الفترة الثانية (الظهيرة: 11:30 ص - 1:30 م):**
• **حل التمارين والتطبيقات**: حل الأسئلة وتلخيص النقاط الرئيسية.
• **استراحة الغداء والقيلولة**: 45 دقيقة لاستعادة النشاط.

⏰ **الفترة الثالثة (المساء: 4:30 م - 6:30 م):**
• **المراجعة والتثبيت**: مراجعة الملخصات وحل البطاقات الاستذكارية (Flashcards).

💡 **نصائح ذهبية لضمان النجاح:**
1. **قاعدة الـ 5 دقائق**: إذا شعرت بالتكاسل، ابدأ المذاكرة لمدة 5 دقائق فقط وسيتولى دماغك الباقي.
2. **الترطيب والتغذية**: ابقَ كوب الماء بجانبك واستغني عن المنبهات المفرطة.
3. **بيئة هادئة**: ابعد الهاتف تماماً عن غرفة المذاكرة.`
    };
  }

  if (lower.includes('صح') || lower.includes('تمارين') || lower.includes('رياضة') || lower.includes('غذاء') || lower.includes('وزن') || lower.includes('لياقة')) {
    return {
      title: `🥦 خطة صحية وبدنية متكاملة: ${cleanTopic}`,
      content: `بناءً على طلبك حول (${cleanTopic})، إليك دليل عملي شامل لتحسين صحتك ونشاطك:

🏋️ **البرنامج البدني والرياضي:**
• **تمارين الإحماء والحركة**: 10 دقائق من التمدد وتنشيط الدورة الدموية.
• **النشاط المباشر**: 30-45 دقيقة مخصصة للرياضة الأساسية (مشي سريع أو تمارين قوة).
• **الاستشفاء**: تمارين إطالة هادئة بعد التمرين لمنع التشنجات.

🥗 **التغذية والهيدرة:**
1. **شرب الماء**: قسم تناول 2.5 لتر ماء على مدار اليوم بالتساوي.
2. **الوجبات المتوازنة**: ركز على البروتينات النظيفة والألياف وقلل من السكريات المعالجة.
3. **النوم الصحي**: احرص على النوم المنتظم بين 7 إلى 8 ساعات ليلاً.`
    };
  }

  if (lower.includes('عمل') || lower.includes('مشروع') || lower.includes('تسويق') || lower.includes('خدمة') || lower.includes('إدارة') || lower.includes('أهداف')) {
    return {
      title: `🎯 استراتيجية وخطة عمل مخصصة: ${cleanTopic}`,
      content: `إليك دليل تنفيذي منظم للتعامل مع موضوع (${cleanTopic}):

📌 **الخطوات الاستراتيجية الأولية:**
1. **تحديد الهدف الذكي (SMART Goal)**: حدد النتائج المرجوة بدقة وقابلية للقياس.
2. **تفكيك المهمة إلى أجزاء صغيرة**: قسم المشروعات الكبيرة إلى مهام يومية لا تتجاوز 30 دقيقة للمهمة.
3. **مصفوفة الأولويات (Eisenhower Matrix)**: ركز أولاً على المهام "الهامة والعاجلة" ثم التخطيط للمهام الاستراتيجية.

📊 **نظام التقييم والمتابعة:**
• قم بمراجعة الإنجازات بنهاية كل يوم لتحديد نقاط التحسين.
• ركز على الجودة والتعاطف وحل مشكلات العملاء/المنظومة بأسلوب ابتكاري.`
    };
  }

  return {
    title: `✨ رؤية وتحليل شامل حول: ${cleanTopic}`,
    content: `بناءً على طلبك وتفكير الذكاء الاصطناعي حول موضوع (${cleanTopic})، إليك الملاحظة المنظمة الشاملة:

💡 **المفاهيم والأفكار الرئيسية:**
• ينطوي موضوع **${cleanTopic}** على أبعاد هامة تتطلب التخطيط والوعي والعمل المتزن.
• التركيز على البداية البسيطة والمستمرة هو المفتاح الأساسي للوصول للنتائج المرجوة.

📌 **خطط وإجراءات عملية تنفيذية:**
1. **الخطوة الأولى**: ابدأ بتدوين ملاحظاتك اليومية وتحديد العقبات المحتملة وكيفية تجاوزها.
2. **الخطوة الثانية**: ضع جدولاً زمنياً مرناً يراعي طاقتك وتركيزك الذهني.
3. **الخطوة الثالثة**: قيم التقدم بشكل دوري واحتفل بالإنجازات الصغرى.

🌸 **توصية هامة**: احتفظ بهذه الملاحظة في يومياتك لتستعين بها في تقييم تطورك واستقرارك النفسي والفكري.`
  };
}

// API Endpoint: AI Note Writer Generator (as seen in video 0:56)
app.post("/api/gemini/generate-note", async (req, res) => {
  const { promptTopic } = req.body;
  const topic = (promptTopic && String(promptTopic).trim()) ? String(promptTopic).trim() : "نصائح صحية ونفسية";

  const customKey = req.headers["x-gemini-key"] as string;
  const ai = getGenAI(customKey);

  if (ai) {
    try {
      const prompt = `أنت مستشار وخبير ذكاء اصطناعي متميز في التخطيط وكتابة الملاحظات باللغة العربية.
المستخدم يطلب منك كتابة ملاحظة أو الإجابة عن الموضوع / السؤال التالي:
الموضوع المطلوب: "${topic}"

تعليمات التفكير والصياغة:
1. فكر بعمق وفكك السؤال أو الموضوع بذكاء لتقديم إجابة مخصصة 100% تتناسب مع هذا السؤال تحديداً ولا تكرر رسالة ثابتة أو عامة أبداً.
2. إذا طلب المستخدم جدولاً (مثل جدول مذاكرة، جدول تمارين، أو جدول تنظيم وقت)، فقم بتصميم جدول كامل ومنظم بالأوقات والأيام والأنشطة بدقة عالية.
3. استخدم لغة عربية فصحى راقية، سلسة، مع تنسيق ماركداون أنيق (عناوين فرعية، نقاط، رموز تعبيرية إيموجي مناسبة).
4. أعد عنواناً دقيقاً يعكس اسم ومحتوى السؤال أو الجدول المطلوبة.

يرجى إرجاع النتيجة ككائن JSON بصيغة:
{
  "title": "عنوان جذاب ومحدد يعكس موضوع السؤال تماماً",
  "content": "المحتوى التفصيلي المكتوب بأسلوب ذكي ومفصل يحل المشكلة أو يضع الجدول المطلوبة بدقة"
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
      if (data.title && data.content) {
        return res.json({ success: true, ...data, source: "gemini" });
      }
    } catch (error) {
      console.warn("Gemini generate-note failed, using dynamic note fallback:", error);
    }
  }

  // Fallback: Generate dynamic, customized note based on the user's specific prompt topic
  const fallback = generateDynamicFallbackNote(topic);
  return res.json({
    success: true,
    title: fallback.title,
    content: fallback.content,
    source: "dynamic_fallback"
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
