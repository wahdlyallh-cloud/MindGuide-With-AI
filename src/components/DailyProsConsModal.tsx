import React, { useState, useEffect } from 'react';
import { 
  Scale, Brain, Sparkles, Plus, Trash2, Download, Printer, Copy, Check, 
  X, RefreshCw, FileText, CheckCircle2, XCircle, Edit3, Save, FileCheck2, Clock, Calendar
} from 'lucide-react';
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

  // Trigger Print for PDF export
  const handlePrintPdf = () => {
    handleSave();
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      
      {/* Printable Area Wrapper */}
      <div className="bg-[#FAF8F5] border-2 border-[#E2DCC8] rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-right font-sans my-auto" dir="rtl">
        
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
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
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
                    <li key={idx} className="bg-white border border-[#C2DCBE] p-2.5 rounded-xl text-xs text-gray-800 font-medium flex items-start justify-between gap-2 shadow-3xs group">
                      <span className="leading-relaxed">🟢 {pos}</span>
                      <button
                        onClick={() => setAiPositives(prev => prev.filter((_, i) => i !== idx))}
                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
                    <li key={idx} className="bg-white border border-[#F5C6C3] p-2.5 rounded-xl text-xs text-gray-800 font-medium flex items-start justify-between gap-2 shadow-3xs group">
                      <span className="leading-relaxed">🔴 {neg}</span>
                      <button
                        onClick={() => setAiNegatives(prev => prev.filter((_, i) => i !== idx))}
                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
                      <span>• {pos}</span>
                      <button
                        onClick={() => setUserPositives(prev => prev.filter((_, i) => i !== idx))}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
                      <span>• {neg}</span>
                      <button
                        onClick={() => setUserNegatives(prev => prev.filter((_, i) => i !== idx))}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
        <div className="p-4 bg-[#F0EDE4] border-t border-[#E2DCC8] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          
          {/* Quick Exports */}
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <button
              onClick={handleCopy}
              className="px-3 py-2 bg-white border border-[#E2DCC8] hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-3xs"
            >
              {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copySuccess ? 'تم النسخ!' : 'نسخ النص'}</span>
            </button>

            <button
              onClick={handleDownloadWord}
              className="px-3 py-2 bg-white border border-[#E2DCC8] hover:bg-gray-100 text-gray-800 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-3xs"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Word (.doc)</span>
            </button>

            <button
              onClick={handlePrintPdf}
              className="px-3 py-2 bg-white border border-[#E2DCC8] hover:bg-gray-100 text-gray-800 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-3xs"
            >
              <Printer className="w-3.5 h-3.5 text-[#5A5A40]" />
              <span>طباعة / حفظ PDF</span>
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-70 bg-[#2B3E50] text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
