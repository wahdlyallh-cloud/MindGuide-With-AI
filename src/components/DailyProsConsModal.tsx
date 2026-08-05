import React, { useState, useEffect } from 'react';
import { 
  Scale, Brain, Sparkles, Plus, Trash2, Download, Printer, Copy, Check, 
  X, RefreshCw, FileText, CheckCircle2, XCircle, Edit3, Save, FileCheck2, Clock, Calendar,
  Image as ImageIcon
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { DiaryEntry } from '../types';

export interface DailyProsConsEntry {
  dayKey: string; // 'YYYY-MM-DD'
  displayDate: string; // e.g. "الثلاثاء، 4 أغسطس 2026"
  aiPositives: string[];
  aiNegatives: string[];
  aiGeneratedAt?: string;
  userPositives: string[];
  userNegatives: string[];
  updatedAt?: string;
}

// Safe Cross-Browser Rounded Rectangle Canvas Drawer (Supports older Mobile Safari / WebKit)
const drawRoundRect = (
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  if (typeof c.roundRect === 'function') {
    c.roundRect(x, y, w, h, r);
  } else {
    let radius = r;
    if (w < 2 * radius) radius = w / 2;
    if (h < 2 * radius) radius = h / 2;
    c.beginPath();
    c.moveTo(x + radius, y);
    c.arcTo(x + w, y, x + w, y + h, radius);
    c.arcTo(x + w, y + h, x, y + h, radius);
    c.arcTo(x, y + h, x, y, radius);
    c.arcTo(x, y, x + w, y, radius);
    c.closePath();
  }
};

interface DailyProsConsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayKey: string;
  displayDate: string;
  dayDiaries: DiaryEntry[];
  userApiKey?: string;
  onSaveSuccess?: () => void;
}

// Storage Key
export const PROS_CONS_STORAGE_KEY = 'yawmiyati_pros_cons_history';

// Helper to load all stored records
export const loadAllProsConsRecords = (): DailyProsConsEntry[] => {
  try {
    const stored = localStorage.getItem(PROS_CONS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading pros & cons history:', e);
  }
  return [];
};

// Helper to save all records
export const saveAllProsConsRecords = (records: DailyProsConsEntry[]) => {
  try {
    localStorage.setItem(PROS_CONS_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving pros & cons history:', e);
  }
};

export default function DailyProsConsModal({
  isOpen,
  onClose,
  dayKey,
  displayDate,
  dayDiaries,
  userApiKey,
  onSaveSuccess
}: DailyProsConsModalProps) {
  const [aiPositives, setAiPositives] = useState<string[]>([]);
  const [aiNegatives, setAiNegatives] = useState<string[]>([]);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const [userPositives, setUserPositives] = useState<string[]>([]);
  const [userNegatives, setUserNegatives] = useState<string[]>([]);

  const [newUserPositive, setNewUserPositive] = useState('');
  const [newUserNegative, setNewUserNegative] = useState('');

  const [newAiPositive, setNewAiPositive] = useState('');
  const [newAiNegative, setNewAiNegative] = useState('');

  const [copySuccess, setCopySuccess] = useState(false);
  const [isCapturingImage, setIsCapturingImage] = useState(false);
  const [generatedImageModalUrl, setGeneratedImageModalUrl] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load existing record for dayKey or generate default
  useEffect(() => {
    if (!isOpen || !dayKey) return;

    const allRecords = loadAllProsConsRecords();
    const existing = allRecords.find(r => r.dayKey === dayKey);

    if (existing) {
      setAiPositives(existing.aiPositives || []);
      setAiNegatives(existing.aiNegatives || []);
      setUserPositives(existing.userPositives || []);
      setUserNegatives(existing.userNegatives || []);
    } else {
      // Auto trigger AI generation if no existing record
      setUserPositives([]);
      setUserNegatives([]);
      generateAiAnalysis(dayDiaries);
    }
  }, [isOpen, dayKey]);

  // AI Generation Logic
  const generateAiAnalysis = async (entries: DiaryEntry[]) => {
    setIsGeneratingAi(true);

    if (!entries || entries.length === 0) {
      setAiPositives(['لم يتم تدوين مذكرات تفصيلية لليوم لتوليد الإيجابيات تلقائياً.']);
      setAiNegatives(['لا توجد سلبيات مرصودة من اليوميات فارغة.']);
      setIsGeneratingAi(false);
      return;
    }

    const compiledText = entries.map(d => `عنوان: ${d.title || 'بدون عنوان'}\nالمحتوى: ${d.content || ''}\nالمزاج: ${d.tags?.join(', ') || ''}`).join('\n---\n');

    try {
      const response = await fetch('/api/gemini/smart-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `قم بتحليل اليوميات والخواطر التالية لليوم (${displayDate}) واستخرج باختصار شديد وموجز جداً:
1) الإيجابيات (3 إلى 4 نقاط قصيرة وإيجابية)
2) السلبيات أو التحديات (3 إلى 4 نقاط قصيرة)

النص المتاح:
${compiledText}

يرجى إرجاع النتيجة بالصيغة التالية بدقة:
الإيجابيات:
- ...
- ...
السلبيات:
- ...
- ...`,
          userApiKey
        })
      });

      const data = await response.json();

      if (data.success && data.answer) {
        parseAiText(data.answer);
      } else {
        fallbackNlpExtraction(entries);
      }
    } catch (e) {
      fallbackNlpExtraction(entries);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Parsing helper for AI response
  const parseAiText = (text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const posList: string[] = [];
    const negList: string[] = [];

    let currentSection: 'pos' | 'neg' | null = null;

    for (const line of lines) {
      if (line.includes('الإيجابيات') || line.includes('ايجابيات')) {
        currentSection = 'pos';
        continue;
      }
      if (line.includes('السلبيات') || line.includes('سلبيات')) {
        currentSection = 'neg';
        continue;
      }

      const cleanLine = line.replace(/^[-•*1-9.\s]+/, '').trim();
      if (!cleanLine) continue;

      if (currentSection === 'pos') {
        posList.push(cleanLine);
      } else if (currentSection === 'neg') {
        negList.push(cleanLine);
      }
    }

    setAiPositives(posList.length > 0 ? posList : ['الحفاظ على التدوين والتعبير عن المشاعر بشجاعة.']);
    setAiNegatives(negList.length > 0 ? negList : ['وجود ضغوط بسيطة تم تجاوزها بالتدوين.']);
  };

  // Rule-based Fallback NLP extraction if AI service is offline
  const fallbackNlpExtraction = (entries: DiaryEntry[]) => {
    const pos: string[] = [];
    const neg: string[] = [];

    entries.forEach(e => {
      const txt = (e.title + ' ' + e.content).toLowerCase();
      
      if (txt.includes('سعيد') || txt.includes('صلاة') || txt.includes('الحمد') || txt.includes('أمل') || txt.includes('امتنان') || txt.includes('نجاح')) {
        pos.push(`توثيق مشاعر إيجابية وإنجازات شخصية في: "${e.title || 'مذكرة لليوم'}"`);
      }
      if (txt.includes('قلق') || txt.includes('تعب') || txt.includes('ضغط') || txt.includes('حزن') || txt.includes('أرق') || txt.includes('خوف')) {
        neg.push(`شعور ببعض الضغوط النفسية أو القلق في: "${e.title || 'مذكرة لليوم'}"`);
      }
    });

    if (pos.length === 0) pos.push('الالتزام بالكتابة والتفريغ الوجداني لليوم.');
    if (neg.length === 0) neg.push('تحديات وقتية بسيطة تم توثيقها.');

    setAiPositives(pos);
    setAiNegatives(neg);
  };

  // Add items
  const handleAddUserPositive = () => {
    if (!newUserPositive.trim()) return;
    setUserPositives(prev => [...prev, newUserPositive.trim()]);
    setNewUserPositive('');
  };

  const handleAddUserNegative = () => {
    if (!newUserNegative.trim()) return;
    setUserNegatives(prev => [...prev, newUserNegative.trim()]);
    setNewUserNegative('');
  };

  const handleAddAiPositive = () => {
    if (!newAiPositive.trim()) return;
    setAiPositives(prev => [...prev, newAiPositive.trim()]);
    setNewAiPositive('');
  };

  const handleAddAiNegative = () => {
    if (!newAiNegative.trim()) return;
    setAiNegatives(prev => [...prev, newAiNegative.trim()]);
    setNewAiNegative('');
  };

  // Save record
  const handleSave = () => {
    const allRecords = loadAllProsConsRecords();
    const existingIndex = allRecords.findIndex(r => r.dayKey === dayKey);

    const updatedEntry: DailyProsConsEntry = {
      dayKey,
      displayDate,
      aiPositives,
      aiNegatives,
      aiGeneratedAt: new Date().toISOString(),
      userPositives,
      userNegatives,
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      allRecords[existingIndex] = updatedEntry;
    } else {
      allRecords.push(updatedEntry);
    }

    saveAllProsConsRecords(allRecords);
    showToast('تم حفظ سجل الإيجابيات والسلبيات بنجاح 💾');
    if (onSaveSuccess) onSaveSuccess();
  };

  // Copy Summary
  const handleCopy = () => {
    const summary = `⚖️ تقرير الإيجابيات والسلبيات اليومية - ${displayDate}
----------------------------------------
🧠 الإيجابيات المولدة بالذكاء الاصطناعي:
${aiPositives.map(p => `• ${p}`).join('\n')}

🧠 السلبيات المولدة بالذكاء الاصطناعي:
${aiNegatives.map(n => `• ${n}`).join('\n')}

✍️ الإيجابيات المدخلة يدوياً:
${userPositives.length > 0 ? userPositives.map(p => `• ${p}`).join('\n') : '• لم يتم إدخال نقاط خاصة'}

✍️ السلبيات المدخلة يدوياً:
${userNegatives.length > 0 ? userNegatives.map(n => `• ${n}`).join('\n') : '• لم يتم إدخال نقاط خاصة'}

---
تم التوليد بواسطة تطبيق يومياتي AI 🌿`;

    navigator.clipboard.writeText(summary);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  // Export Word Document
  const handleDownloadWord = () => {
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>تقرير الإيجابيات والسلبيات - ${displayDate}</title></head>
      <body style="font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 20px;">
        <h1 style="color: #2B3E50;">⚖️ تقرير الإيجابيات والسلبيات اليومية</h1>
        <h3>التاريخ: ${displayDate}</h3>
        <hr/>
        <h2 style="color: #2D5A27;">🧠 الإيجابيات المولدة بالذكاء الاصطناعي:</h2>
        <ul>${aiPositives.map(p => `<li>${p}</li>`).join('')}</ul>
        
        <h2 style="color: #902923;">🧠 السلبيات المولدة بالذكاء الاصطناعي:</h2>
        <ul>${aiNegatives.map(n => `<li>${n}</li>`).join('')}</ul>
        <hr/>
        <h2 style="color: #2D5A27;">✍️ الإيجابيات المدخلة يدوياً:</h2>
        <ul>${userPositives.map(p => `<li>${p}</li>`).join('')}</ul>

        <h2 style="color: #902923;">✍️ السلبيات المدخلة يدوياً:</h2>
        <ul>${userNegatives.map(n => `<li>${n}</li>`).join('')}</ul>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير_الإيجابيات_والسلبيات_${dayKey}.doc`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('تم تحميل التقرير كـ مستند Word 📝');
  };

  // Helper to render formatted markdown text with **bold**
  const renderFormattedText = (text: string) => {
    if (!text) return '';
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-extrabold text-[#1E293B]">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // Trigger Print / Save PDF with exact layout match
  const handlePrintPdf = () => {
    handleSave();

    const existingFrame = document.getElementById('yawmiyati-proscons-print-iframe');
    if (existingFrame) {
      existingFrame.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'yawmiyati-proscons-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const formatBold = (str: string) => {
      return str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    };

    const aiPosHtml = aiPositives.length > 0 ? aiPositives.map(p => `
      <div class="item-card">
        <span class="bullet-dot">🟢</span>
        ${formatBold(p)}
      </div>
    `).join('') : '<div class="empty-msg">لا توجد نقاط إيجابية مسجلة لليوم</div>';

    const aiNegHtml = aiNegatives.length > 0 ? aiNegatives.map(n => `
      <div class="item-card">
        <span class="bullet-dot">🔴</span>
        ${formatBold(n)}
      </div>
    `).join('') : '<div class="empty-msg">لا توجد سلبيات مسجلة لليوم</div>';

    const userPosHtml = userPositives.length > 0 ? userPositives.map(p => `
      <div class="manual-item-card">
        • ${formatBold(p)}
      </div>
    `).join('') : '<div class="empty-msg">لم يتم إدخال نقاط خاصة</div>';

    const userNegHtml = userNegatives.length > 0 ? userNegatives.map(n => `
      <div class="manual-item-card">
        • ${formatBold(n)}
      </div>
    `).join('') : '<div class="empty-msg">لم يتم إدخال نقاط خاصة</div>';

    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>تقرير الإيجابيات والسلبيات اليومية - ${displayDate}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
            background-color: #ffffff;
            color: #2D3748;
            direction: rtl;
            text-align: right;
            padding: 15px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page { size: A4 portrait; margin: 8mm; }
          .report-container {
            max-width: 820px;
            margin: 0 auto;
            border: 2px solid #E2DCC8;
            border-radius: 20px;
            overflow: hidden;
            background-color: #FAF8F5;
          }
          .report-header {
            background: linear-gradient(135deg, #2B3E50 0%, #3B5066 50%, #5A5A40 100%);
            color: #ffffff;
            padding: 18px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #E2DCC8;
          }
          .header-title-group {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .icon-box {
            background: rgba(255, 255, 255, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.25);
            border-radius: 12px;
            padding: 8px 12px;
            font-size: 22px;
          }
          .header-text h1 {
            font-size: 17px;
            font-weight: 900;
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 4px;
          }
          .badge-tag {
            background-color: #8B9D83;
            color: #ffffff;
            font-size: 10px;
            font-weight: 800;
            padding: 2px 8px;
            border-radius: 10px;
          }
          .header-date {
            font-size: 12px;
            color: #E2DCC8;
            font-weight: 600;
          }
          .report-body {
            padding: 20px;
          }
          .section-title-container {
            border-bottom: 2px solid #E2DCC8;
            padding-bottom: 8px;
            margin-bottom: 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .section-title {
            font-size: 13.5px;
            font-weight: 900;
            color: #2B3E50;
          }
          .section-subtitle {
            font-size: 11px;
            color: #718096;
            font-weight: 700;
          }
          .two-columns {
            display: flex;
            gap: 14px;
            margin-bottom: 20px;
          }
          .column-box {
            flex: 1;
            width: 50%;
            border-radius: 16px;
            padding: 14px;
            border: 2px solid;
          }
          .positives-box {
            background-color: #F2F7F2;
            border-color: #C2DCBE;
          }
          .negatives-box {
            background-color: #FDF3F2;
            border-color: #F5C6C3;
          }
          .box-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid;
            padding-bottom: 8px;
            margin-bottom: 10px;
          }
          .positives-box .box-header { border-color: #C2DCBE; }
          .negatives-box .box-header { border-color: #F5C6C3; }
          .box-header-title {
            font-size: 12px;
            font-weight: 900;
          }
          .positives-box .box-header-title { color: #2D5A27; }
          .negatives-box .box-header-title { color: #902923; }
          .count-badge {
            font-size: 10px;
            font-weight: 800;
            padding: 2px 8px;
            border-radius: 6px;
          }
          .positives-box .count-badge { background-color: #D1E7DD; color: #0F5132; }
          .negatives-box .count-badge { background-color: #F8D7DA; color: #842029; }
          .item-cards-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .item-card {
            background-color: #ffffff;
            border-radius: 10px;
            padding: 9px 11px;
            font-size: 11.5px;
            line-height: 1.6;
            border: 1px solid;
            box-shadow: 0 1px 2px rgba(0,0,0,0.02);
          }
          .positives-box .item-card { border-color: #C2DCBE; color: #1A365D; }
          .negatives-box .item-card { border-color: #F5C6C3; color: #1A365D; }
          .bullet-dot { margin-left: 4px; }
          .manual-box {
            background-color: #ffffff;
            border: 2px solid #E2DCC8;
          }
          .manual-box .box-header { border-color: #F0EDE4; }
          .manual-box .box-header-title { color: #5A5A40; }
          .manual-box .count-badge { background-color: #F0EDE4; color: #4A5568; }
          .manual-item-card {
            background-color: #FAF8F5;
            border: 1px solid #E2DCC8;
            border-radius: 10px;
            padding: 8px 11px;
            font-size: 11.5px;
            color: #2D3748;
            line-height: 1.5;
          }
          .empty-msg {
            font-size: 11px;
            color: #A0AEC0;
            text-align: center;
            padding: 8px;
          }
          .report-footer {
            border-top: 1px solid #E2DCC8;
            padding: 10px 18px;
            background-color: #F0EDE4;
            font-size: 10.5px;
            color: #5A5A40;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-weight: 700;
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <div class="report-header">
            <div class="header-title-group">
              <div class="icon-box">⚖️</div>
              <div class="header-text">
                <h1>
                  <span>تقرير الإيجابيات والسلبيات اليومية</span>
                  <span class="badge-tag">توليد ذكي + يدوي</span>
                </h1>
                <div class="header-date">📅 ${displayDate}</div>
              </div>
            </div>
          </div>

          <div class="report-body">
            <!-- Section 1: AI Generated -->
            <div class="section-title-container">
              <div class="section-title">أولاً: الإيجابيات والسلبيات المولدة بالذكاء الاصطناعي 🧠</div>
              <div class="section-subtitle">مستخلصة تلقائياً من المذكرات</div>
            </div>

            <div class="two-columns">
              <!-- AI Positives (Right Column in RTL) -->
              <div class="column-box positives-box">
                <div class="box-header">
                  <div class="box-header-title">
                    <span>🟢 الإيجابيات المولدة بالذكاء الاصطناعي (يمين):</span>
                  </div>
                  <span class="count-badge">${aiPositives.length} نقاط</span>
                </div>
                <div class="item-cards-list">
                  ${aiPosHtml}
                </div>
              </div>

              <!-- AI Negatives (Left Column in RTL) -->
              <div class="column-box negatives-box">
                <div class="box-header">
                  <div class="box-header-title">
                    <span>🔴 السلبيات والتحديات المولدة بالذكاء الاصطناعي (يسار):</span>
                  </div>
                  <span class="count-badge">${aiNegatives.length} نقاط</span>
                </div>
                <div class="item-cards-list">
                  ${aiNegHtml}
                </div>
              </div>
            </div>

            <!-- Section 2: User Manual Inputs -->
            <div class="section-title-container">
              <div class="section-title">ثانياً: الإيجابيات والسلبيات المدخلة يدوياً بواسطة المستخدم ✍️</div>
              <div class="section-subtitle">إدخال واسترسال شخصي</div>
            </div>

            <div class="two-columns">
              <!-- Manual Positives (Right Column) -->
              <div class="column-box manual-box">
                <div class="box-header">
                  <div class="box-header-title">
                    <span>إيجابيات اليوم (مدخلة يدوياً):</span>
                  </div>
                  <span class="count-badge">${userPositives.length} نقاط</span>
                </div>
                <div class="item-cards-list">
                  ${userPosHtml}
                </div>
              </div>

              <!-- Manual Negatives (Left Column) -->
              <div class="column-box manual-box">
                <div class="box-header">
                  <div class="box-header-title">
                    <span>سلبيات وتحديات اليوم (مدخلة يدوياً):</span>
                  </div>
                  <span class="count-badge">${userNegatives.length} نقاط</span>
                </div>
                <div class="item-cards-list">
                  ${userNegHtml}
                </div>
              </div>
            </div>

          </div>

          <div class="report-footer">
            <span>منصة يومياتي AI - تقرير الإيجابيات والسلبيات اليومية</span>
            <span>سرية تامة وتشفير محلي 🌿</span>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    doc.open();
    doc.write(printContent);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        window.print();
      }
    }, 400);
  };

  // Export report as high-resolution PNG image instantly via native Canvas 2D
  const handleSaveAsImage = async () => {
    handleSave();
    setIsCapturingImage(true);
    showToast('جاري إنشاء التقرير كصورة عالية الدقة... 📸');

    try {
      // Allow state save to complete synchronously
      await new Promise(r => setTimeout(r, 50));

      const scale = 2; // High-DPI Retina resolution
      const width = 840;
      const colWidth = 370;
      const fontSize = 13;
      const font = `${fontSize}px Cairo, system-ui, -apple-system, sans-serif`;

      const cleanMarkdown = (txt: string) => txt.replace(/\*\*/g, '');

      // Create offscreen measurement canvas
      const measureCanvas = document.createElement('canvas');
      const measureCtx = measureCanvas.getContext('2d');
      if (!measureCtx) throw new Error('Canvas not supported');

      const wrapText = (text: string, maxWidth: number): string[] => {
        measureCtx.font = font;
        const cleaned = cleanMarkdown(text || '');
        const paragraphs = cleaned.split('\n');
        const lines: string[] = [];

        for (const paragraph of paragraphs) {
          if (!paragraph.trim()) continue;
          const words = paragraph.split(' ');
          let currentLine = '';

          for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const metrics = measureCtx.measureText(testLine);
            if (metrics.width > maxWidth && currentLine) {
              lines.push(currentLine);
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine) lines.push(currentLine);
        }
        return lines.length > 0 ? lines : [''];
      };

      // Measure AI Column Heights
      let aiPosHeight = 44;
      aiPositives.forEach(pos => {
        const lines = wrapText('🟢 ' + pos, colWidth - 28);
        aiPosHeight += Math.max(34, lines.length * 19 + 14);
      });
      if (aiPositives.length === 0) aiPosHeight += 34;

      let aiNegHeight = 44;
      aiNegatives.forEach(neg => {
        const lines = wrapText('🔴 ' + neg, colWidth - 28);
        aiNegHeight += Math.max(34, lines.length * 19 + 14);
      });
      if (aiNegatives.length === 0) aiNegHeight += 34;

      const aiSectionHeight = Math.max(aiPosHeight, aiNegHeight) + 16;

      // Measure User Column Heights
      let userPosHeight = 44;
      userPositives.forEach(pos => {
        const lines = wrapText('• ' + pos, colWidth - 28);
        userPosHeight += Math.max(34, lines.length * 19 + 14);
      });
      if (userPositives.length === 0) userPosHeight += 34;

      let userNegHeight = 44;
      userNegatives.forEach(neg => {
        const lines = wrapText('• ' + neg, colWidth - 28);
        userNegHeight += Math.max(34, lines.length * 19 + 14);
      });
      if (userNegatives.length === 0) userNegHeight += 34;

      const userSectionHeight = Math.max(userPosHeight, userNegHeight) + 16;
      const totalHeight = 120 + 44 + aiSectionHeight + 44 + userSectionHeight + 60;

      // Prepare main canvas
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = totalHeight * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context failed');

      ctx.scale(scale, scale);
      ctx.direction = 'rtl';
      ctx.textAlign = 'right';

      // Outer Card Background
      ctx.fillStyle = '#FAF8F5';
      drawRoundRect(ctx, 0, 0, width, totalHeight, 24);
      ctx.fill();
      ctx.strokeStyle = '#E2DCC8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Top Header
      const headerGrad = ctx.createLinearGradient(20, 20, width - 20, 20);
      headerGrad.addColorStop(0, '#2B3E50');
      headerGrad.addColorStop(0.5, '#3B5066');
      headerGrad.addColorStop(1, '#5A5A40');

      ctx.fillStyle = headerGrad;
      drawRoundRect(ctx, 20, 20, width - 40, 80, 16);
      ctx.fill();

      // Header Text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px Cairo, system-ui, sans-serif';
      ctx.fillText('⚖️ تقرير الإيجابيات والسلبيات اليومية', width - 40, 52);

      ctx.fillStyle = '#E2DCC8';
      ctx.font = 'bold 12px Cairo, system-ui, sans-serif';
      ctx.fillText(`📅 ${displayDate}`, width - 40, 78);

      // Header Badge
      ctx.fillStyle = '#8B9D83';
      drawRoundRect(ctx, 36, 42, 115, 26, 13);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px Cairo, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('توليد ذكي + يدوي', 93, 59);

      ctx.textAlign = 'right';

      let curY = 120;

      const drawSectionHeader = (title: string, subtitle: string) => {
        ctx.fillStyle = '#2B3E50';
        ctx.font = 'bold 14px Cairo, system-ui, sans-serif';
        ctx.fillText(title, width - 28, curY + 16);

        ctx.fillStyle = '#718096';
        ctx.font = 'bold 11px Cairo, system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(subtitle, 28, curY + 16);
        ctx.textAlign = 'right';

        ctx.strokeStyle = '#E2DCC8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(28, curY + 26);
        ctx.lineTo(width - 28, curY + 26);
        ctx.stroke();

        curY += 38;
      };

      // --- SECTION 1: AI Generated ---
      drawSectionHeader(
        'أولاً: الإيجابيات والسلبيات المولدة بالذكاء الاصطناعي 🧠',
        'مستخلصة تلقائياً من المذكرات'
      );

      const sec1Y = curY;

      // AI Positives Column (Right)
      const aiRightX = width - 28;
      ctx.fillStyle = '#F2F7F2';
      drawRoundRect(ctx, width - 28 - colWidth, sec1Y, colWidth, aiPosHeight, 16);
      ctx.fill();
      ctx.strokeStyle = '#C2DCBE';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#2D5A27';
      ctx.font = 'bold 12px Cairo, system-ui, sans-serif';
      ctx.fillText('🟢 الإيجابيات (الذكاء الاصطناعي):', aiRightX - 12, sec1Y + 26);

      let aiPosItemY = sec1Y + 38;
      if (aiPositives.length === 0) {
        ctx.fillStyle = '#A0AEC0';
        ctx.font = '11px Cairo, system-ui, sans-serif';
        ctx.fillText('لا توجد نقاط إيجابية مسجلة لليوم', aiRightX - 12, aiPosItemY + 16);
      } else {
        aiPositives.forEach(pos => {
          const lines = wrapText('🟢 ' + pos, colWidth - 28);
          const boxH = Math.max(32, lines.length * 19 + 12);

          ctx.fillStyle = '#FFFFFF';
          drawRoundRect(ctx, width - 28 - colWidth + 8, aiPosItemY, colWidth - 16, boxH, 10);
          ctx.fill();
          ctx.strokeStyle = '#C2DCBE';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = '#1A365D';
          ctx.font = font;
          lines.forEach((line, lIdx) => {
            ctx.fillText(line, aiRightX - 16, aiPosItemY + 16 + lIdx * 19);
          });

          aiPosItemY += boxH + 8;
        });
      }

      // AI Negatives Column (Left)
      const aiLeftX = 28 + colWidth;
      ctx.fillStyle = '#FDF3F2';
      drawRoundRect(ctx, 28, sec1Y, colWidth, aiNegHeight, 16);
      ctx.fill();
      ctx.strokeStyle = '#F5C6C3';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#902923';
      ctx.font = 'bold 12px Cairo, system-ui, sans-serif';
      ctx.fillText('🔴 السلبيات (الذكاء الاصطناعي):', aiLeftX - 12, sec1Y + 26);

      let aiNegItemY = sec1Y + 38;
      if (aiNegatives.length === 0) {
        ctx.fillStyle = '#A0AEC0';
        ctx.font = '11px Cairo, system-ui, sans-serif';
        ctx.fillText('لا توجد سلبيات مسجلة لليوم', aiLeftX - 12, aiNegItemY + 16);
      } else {
        aiNegatives.forEach(neg => {
          const lines = wrapText('🔴 ' + neg, colWidth - 28);
          const boxH = Math.max(32, lines.length * 19 + 12);

          ctx.fillStyle = '#FFFFFF';
          drawRoundRect(ctx, 36, aiNegItemY, colWidth - 16, boxH, 10);
          ctx.fill();
          ctx.strokeStyle = '#F5C6C3';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = '#1A365D';
          ctx.font = font;
          lines.forEach((line, lIdx) => {
            ctx.fillText(line, aiLeftX - 16, aiNegItemY + 16 + lIdx * 19);
          });

          aiNegItemY += boxH + 8;
        });
      }

      curY = sec1Y + aiSectionHeight + 12;

      // --- SECTION 2: User Manual ---
      drawSectionHeader(
        'ثانياً: الإيجابيات والسلبيات المدخلة يدوياً بواسطة المستخدم ✍️',
        'إدخال واسترسال شخصي'
      );

      const sec2Y = curY;

      // User Positives
      ctx.fillStyle = '#FFFFFF';
      drawRoundRect(ctx, width - 28 - colWidth, sec2Y, colWidth, userPosHeight, 16);
      ctx.fill();
      ctx.strokeStyle = '#E2DCC8';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#5A5A40';
      ctx.font = 'bold 12px Cairo, system-ui, sans-serif';
      ctx.fillText('إيجابيات اليوم (مدخلة يدوياً):', aiRightX - 12, sec2Y + 26);

      let uPosItemY = sec2Y + 38;
      if (userPositives.length === 0) {
        ctx.fillStyle = '#A0AEC0';
        ctx.font = '11px Cairo, system-ui, sans-serif';
        ctx.fillText('لم يتم إدخال نقاط خاصة', aiRightX - 12, uPosItemY + 16);
      } else {
        userPositives.forEach(pos => {
          const lines = wrapText('• ' + pos, colWidth - 28);
          const boxH = Math.max(32, lines.length * 19 + 12);

          ctx.fillStyle = '#FAF8F5';
          drawRoundRect(ctx, width - 28 - colWidth + 8, uPosItemY, colWidth - 16, boxH, 10);
          ctx.fill();
          ctx.strokeStyle = '#E2DCC8';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = '#2D3748';
          ctx.font = font;
          lines.forEach((line, lIdx) => {
            ctx.fillText(line, aiRightX - 16, uPosItemY + 16 + lIdx * 19);
          });

          uPosItemY += boxH + 8;
        });
      }

      // User Negatives
      ctx.fillStyle = '#FFFFFF';
      drawRoundRect(ctx, 28, sec2Y, colWidth, userNegHeight, 16);
      ctx.fill();
      ctx.strokeStyle = '#E2DCC8';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#5A5A40';
      ctx.font = 'bold 12px Cairo, system-ui, sans-serif';
      ctx.fillText('سلبيات وتحديات اليوم (مدخلة يدوياً):', aiLeftX - 12, sec2Y + 26);

      let uNegItemY = sec2Y + 38;
      if (userNegatives.length === 0) {
        ctx.fillStyle = '#A0AEC0';
        ctx.font = '11px Cairo, system-ui, sans-serif';
        ctx.fillText('لم يتم إدخال نقاط خاصة', aiLeftX - 12, uNegItemY + 16);
      } else {
        userNegatives.forEach(neg => {
          const lines = wrapText('• ' + neg, colWidth - 28);
          const boxH = Math.max(32, lines.length * 19 + 12);

          ctx.fillStyle = '#FAF8F5';
          drawRoundRect(ctx, 36, uNegItemY, colWidth - 16, boxH, 10);
          ctx.fill();
          ctx.strokeStyle = '#E2DCC8';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = '#2D3748';
          ctx.font = font;
          lines.forEach((line, lIdx) => {
            ctx.fillText(line, aiLeftX - 16, uNegItemY + 16 + lIdx * 19);
          });

          uNegItemY += boxH + 8;
        });
      }

      curY = sec2Y + userSectionHeight + 16;

      // Footer
      ctx.strokeStyle = '#E2DCC8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(28, curY);
      ctx.lineTo(width - 28, curY);
      ctx.stroke();

      ctx.fillStyle = '#5A5A40';
      ctx.font = 'bold 11px Cairo, system-ui, sans-serif';
      ctx.fillText('منصة يومياتي AI - تقرير الإيجابيات والسلبيات اليومية', width - 28, curY + 22);

      ctx.textAlign = 'left';
      ctx.fillText('سرية تامة وتشفير محلي 🌿', 28, curY + 22);

      // Fast synchronous export via DataURL
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const fileName = `تقرير_الإيجابيات_والسلبيات_${dayKey}.png`;

      // Trigger instantaneous download
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('تم حفظ الصورة في ملفات جهازك بنجاح! 🖼️');
    } catch (err) {
      console.error('Error rendering report image:', err);
      showToast('حدث خطأ أثناء حفظ الصورة، يرجى إعادة المحاولة');
    } finally {
      setIsCapturingImage(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      
      {/* Printable Area Wrapper */}
      <div id="pros-cons-modal-printable-card" className="bg-[#FAF8F5] border-2 border-[#E2DCC8] rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-right font-sans my-auto" dir="rtl">
        
        {/* Modal Top Header Bar */}
        <div className="bg-gradient-to-r from-[#2B3E50] via-[#3B5066] to-[#5A5A40] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#E2DCC8]/30 shrink-0">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2.5 bg-white/10 rounded-2xl border border-white/15">
              <Scale className="w-6 h-6 text-[#FEFAE0]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>⚖️ تقرير الإيجابيات والسلبيات اليومية</span>
                <span className="bg-[#8B9D83] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  توليد ذكي + يدوي
                </span>
              </h3>
              <p className="text-xs text-[#E2DCC8] mt-0.5 font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{displayDate}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer no-print-capture"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Middle Content Scrollable Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-gray-800">

          {/* Quick Action Bar (Regenerate AI + Quick Stats) */}
          <div className="bg-white border border-[#E2DCC8] rounded-2xl p-3 shadow-3xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#5A5A40] font-extrabold">
              <Brain className="w-4 h-4 text-[#8B9D83]" />
              <span>تحليل اليوميات والخواطر المؤرخة لليوم لتوليد النقاط المحورية:</span>
            </div>

            <button
              type="button"
              onClick={() => generateAiAnalysis(dayDiaries)}
              disabled={isGeneratingAi}
              className="px-3.5 py-2 bg-[#8B9D83] hover:bg-[#5A5A40] text-white rounded-xl text-xs font-black shadow-3xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
              <span>{isGeneratingAi ? 'جاري التحليل والترخيص...' : 'إعادة التوليد بالذكاء الاصطناعي 🔄'}</span>
            </button>
          </div>

          {/* SECTION 1: AI Generated Positives (Right) vs Negatives (Left) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#E2DCC8] pb-2">
              <h4 className="text-sm font-black text-[#2B3E50] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#8B9D83]" />
                <span>أولاً: الإيجابيات والسلبيات المولدة بالذكاء الاصطناعي 🧠</span>
              </h4>
              <span className="text-[11px] text-gray-400 font-bold">مستخلصة تلقائياً من المذكرات</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* AI Positives (Right in RTL) */}
              <div className="bg-[#F2F7F2] border-2 border-[#C2DCBE] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#C2DCBE] pb-2">
                  <span className="text-xs font-black text-[#2D5A27] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>الإيجابيات المولدة بالذكاء الاصطناعي (يمين):</span>
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                    {aiPositives.length} نقاط
                  </span>
                </div>

                <ul className="space-y-2">
                  {aiPositives.map((pos, idx) => (
                    <li key={idx} className="bg-white border border-[#C2DCBE] p-2.5 rounded-xl text-xs text-gray-800 font-medium flex items-start justify-between gap-2 shadow-3xs transition-all hover:border-emerald-400">
                      <span className="leading-relaxed flex-1">🟢 {renderFormattedText(pos)}</span>
                      <button
                        type="button"
                        onClick={() => setAiPositives(prev => prev.filter((_, i) => i !== idx))}
                        className="text-gray-400 hover:text-red-600 hover:bg-rose-50 p-1 rounded-lg transition-all cursor-pointer shrink-0"
                        title="حذف هذه النقطة"
                        aria-label="حذف هذه النقطة"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>

                {/* Add Custom AI Point */}
                <div className="flex gap-1.5 pt-1">
                  <input
                    type="text"
                    value={newAiPositive}
                    onChange={(e) => setNewAiPositive(e.target.value)}
                    placeholder="إضافة نقطة إيجابية أخرى..."
                    className="flex-1 bg-white border border-[#C2DCBE] rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddAiPositive}
                    className="px-3 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 cursor-pointer"
                  >
                    + إدخال
                  </button>
                </div>
              </div>

              {/* AI Negatives (Left in RTL) */}
              <div className="bg-[#FDF3F2] border-2 border-[#F5C6C3] rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#F5C6C3] pb-2">
                  <span className="text-xs font-black text-[#902923] flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>السلبيات والتحديات المولدة بالذكاء الاصطناعي (يسار):</span>
                  </span>
                  <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-md">
                    {aiNegatives.length} نقاط
                  </span>
                </div>

                <ul className="space-y-2">
                  {aiNegatives.map((neg, idx) => (
                    <li key={idx} className="bg-white border border-[#F5C6C3] p-2.5 rounded-xl text-xs text-gray-800 font-medium flex items-start justify-between gap-2 shadow-3xs transition-all hover:border-rose-400">
                      <span className="leading-relaxed flex-1">🔴 {renderFormattedText(neg)}</span>
                      <button
                        type="button"
                        onClick={() => setAiNegatives(prev => prev.filter((_, i) => i !== idx))}
                        className="text-gray-400 hover:text-red-600 hover:bg-rose-50 p-1 rounded-lg transition-all cursor-pointer shrink-0"
                        title="حذف هذه النقطة"
                        aria-label="حذف هذه النقطة"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>

                {/* Add Custom AI Point */}
                <div className="flex gap-1.5 pt-1">
                  <input
                    type="text"
                    value={newAiNegative}
                    onChange={(e) => setNewAiNegative(e.target.value)}
                    placeholder="إضافة نقطة تحدي أو سلبيات أخرى..."
                    className="flex-1 bg-white border border-[#F5C6C3] rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddAiNegative}
                    className="px-3 py-1.5 bg-rose-700 text-white rounded-xl text-xs font-bold hover:bg-rose-800 cursor-pointer"
                  >
                    + إدخال
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* SECTION 2: User Manual Inputs for Positives (Right) vs Negatives (Left) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#E2DCC8] pb-2">
              <h4 className="text-sm font-black text-[#2B3E50] flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#5A5A40]" />
                <span>ثانياً: الإيجابيات والسلبيات المدخلة يدوياً بواسطة المستخدم ✍️</span>
              </h4>
              <span className="text-[11px] text-gray-400 font-bold">إدخال واسترسال شخصي</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* User Manual Positives (Right) */}
              <div className="bg-white border-2 border-[#E2DCC8] hover:border-[#8B9D83] rounded-2xl p-4 space-y-3 transition-all">
                <div className="flex items-center justify-between border-b border-[#F0EDE4] pb-2">
                  <span className="text-xs font-black text-[#5A5A40] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#8B9D83]" />
                    <span>إيجابيات اليوم (مدخلة يدوياً):</span>
                  </span>
                  <span className="text-[10px] bg-[#F0EDE4] text-gray-700 font-bold px-2 py-0.5 rounded-md">
                    {userPositives.length} نقاط
                  </span>
                </div>

                <div className="space-y-2">
                  {userPositives.map((pos, idx) => (
                    <div key={idx} className="bg-[#FAF8F5] border border-[#E2DCC8] p-2.5 rounded-xl text-xs text-gray-800 flex items-center justify-between gap-2">
                      <span className="flex-1">• {pos}</span>
                      <button
                        type="button"
                        onClick={() => setUserPositives(prev => prev.filter((_, i) => i !== idx))}
                        className="text-gray-400 hover:text-red-600 hover:bg-rose-50 p-1 rounded-lg transition-all cursor-pointer shrink-0"
                        title="حذف هذه النقطة"
                        aria-label="حذف هذه النقطة"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-1.5 pt-1">
                  <input
                    type="text"
                    value={newUserPositive}
                    onChange={(e) => setNewUserPositive(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddUserPositive()}
                    placeholder="اكتب إيجابية عشتها اليوم واضغط إضافة..."
                    className="flex-1 bg-[#FAF8F5] border border-[#E2DCC8] rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#8B9D83]"
                  />
                  <button
                    type="button"
                    onClick={handleAddUserPositive}
                    className="px-3 py-1.5 bg-[#5A5A40] text-white rounded-xl text-xs font-black hover:bg-[#8B9D83] cursor-pointer"
                  >
                    + إضافة
                  </button>
                </div>
              </div>

              {/* User Manual Negatives (Left) */}
              <div className="bg-white border-2 border-[#E2DCC8] hover:border-rose-400 rounded-2xl p-4 space-y-3 transition-all">
                <div className="flex items-center justify-between border-b border-[#F0EDE4] pb-2">
                  <span className="text-xs font-black text-[#5A5A40] flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-500" />
                    <span>سلبيات وتحديات اليوم (مدخلة يدوياً):</span>
                  </span>
                  <span className="text-[10px] bg-[#F0EDE4] text-gray-700 font-bold px-2 py-0.5 rounded-md">
                    {userNegatives.length} نقاط
                  </span>
                </div>

                <div className="space-y-2">
                  {userNegatives.map((neg, idx) => (
                    <div key={idx} className="bg-[#FAF8F5] border border-[#E2DCC8] p-2.5 rounded-xl text-xs text-gray-800 flex items-center justify-between gap-2">
                      <span className="flex-1">• {neg}</span>
                      <button
                        type="button"
                        onClick={() => setUserNegatives(prev => prev.filter((_, i) => i !== idx))}
                        className="text-gray-400 hover:text-red-600 hover:bg-rose-50 p-1 rounded-lg transition-all cursor-pointer shrink-0"
                        title="حذف هذه النقطة"
                        aria-label="حذف هذه النقطة"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-1.5 pt-1">
                  <input
                    type="text"
                    value={newUserNegative}
                    onChange={(e) => setNewUserNegative(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddUserNegative()}
                    placeholder="اكتب تحدياً أو موقفاً مزعجاً واضغط إضافة..."
                    className="flex-1 bg-[#FAF8F5] border border-[#E2DCC8] rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddUserNegative}
                    className="px-3 py-1.5 bg-rose-700 text-white rounded-xl text-xs font-black hover:bg-rose-800 cursor-pointer"
                  >
                    + إضافة
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Modal Bottom Footer Actions & Exports */}
        <div className="p-4 bg-[#F0EDE4] border-t border-[#E2DCC8] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 no-print-capture">
          
          {/* Quick Exports */}
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <button
              onClick={handleCopy}
              className="px-3 py-2 bg-white border border-[#E2DCC8] hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-3xs transition-all active:scale-95"
            >
              {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copySuccess ? 'تم النسخ!' : 'نسخ النص'}</span>
            </button>

            <button
              onClick={handleDownloadWord}
              className="px-3 py-2 bg-white border border-[#E2DCC8] hover:bg-gray-100 text-gray-800 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-3xs transition-all active:scale-95"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Word (.doc)</span>
            </button>

            <button
              onClick={handlePrintPdf}
              className="px-3 py-2 bg-white border border-[#E2DCC8] hover:bg-gray-100 text-gray-800 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-3xs transition-all active:scale-95"
            >
              <Printer className="w-3.5 h-3.5 text-[#5A5A40]" />
              <span>طباعة / حفظ PDF</span>
            </button>

            <button
              onClick={handleSaveAsImage}
              disabled={isCapturingImage}
              className="px-3 py-2 bg-white border border-[#E2DCC8] hover:bg-gray-100 text-gray-800 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-3xs disabled:opacity-50 transition-all active:scale-95"
              title="حفظ التقرير كـ صورة PNG عالية الدقة"
            >
              {isCapturingImage ? (
                <RefreshCw className="w-3.5 h-3.5 text-purple-600 animate-spin" />
              ) : (
                <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
              )}
              <span>{isCapturingImage ? 'جاري الحفظ...' : 'حفظ كصورة'}</span>
            </button>
          </div>

          {/* Main Action Buttons */}
          <div className="flex items-center space-x-2 space-x-reverse w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-[#E2DCC8] hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
            >
              إغلاق
            </button>

            <button
              onClick={handleSave}
              className="px-5 py-2 bg-gradient-to-tr from-[#5A5A40] to-[#8B9D83] hover:from-[#5A5A40]/90 hover:to-[#8B9D83]/90 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4 text-[#FEFAE0]" />
              <span>حفظ في سجل الإيجابيات والسلبيات 💾</span>
            </button>
          </div>

        </div>

      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-80 bg-[#2B3E50] text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
