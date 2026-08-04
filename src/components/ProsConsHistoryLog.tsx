import React, { useState, useEffect } from 'react';
import { 
  Scale, Brain, Sparkles, Plus, Trash2, Download, Printer, Copy, Check, 
  Search, Filter, Calendar, CheckCircle2, XCircle, Edit3, FileText, RefreshCw, FileCheck2
} from 'lucide-react';
import { DiaryEntry } from '../types';
import DailyProsConsModal, { 
  DailyProsConsEntry, 
  loadAllProsConsRecords, 
  saveAllProsConsRecords 
} from './DailyProsConsModal';

interface ProsConsHistoryLogProps {
  diaries: DiaryEntry[];
  userApiKey?: string;
}

export default function ProsConsHistoryLog({ diaries, userApiKey }: ProsConsHistoryLogProps) {
  const [records, setRecords] = useState<DailyProsConsEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'positives' | 'negatives'>('all');

  // Modal State
  const [activeModalDayKey, setActiveModalDayKey] = useState<string | null>(null);
  const [activeModalDisplayDate, setActiveModalDisplayDate] = useState<string>('');
  const [activeModalDiaries, setActiveModalDiaries] = useState<DiaryEntry[]>([]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Refresh records from localStorage
  const refreshRecords = () => {
    const loaded = loadAllProsConsRecords();
    setRecords(loaded);
  };

  useEffect(() => {
    refreshRecords();
  }, []);

  // Filter records
  const filteredRecords = records.filter(r => {
    const totalPositives = [...(r.aiPositives || []), ...(r.userPositives || [])];
    const totalNegatives = [...(r.aiNegatives || []), ...(r.userNegatives || [])];

    const matchSearch = 
      r.displayDate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.dayKey.includes(searchQuery) ||
      totalPositives.some(p => p.toLowerCase().includes(searchQuery.toLowerCase())) ||
      totalNegatives.some(n => n.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchSearch) return false;

    if (selectedFilter === 'positives') {
      return totalPositives.length >= totalNegatives.length;
    }
    if (selectedFilter === 'negatives') {
      return totalNegatives.length > totalPositives.length;
    }

    return true;

    return true;
  });

  // Calculate Global Stats
  const totalDaysTracked = records.length;
  const totalGlobalPositives = records.reduce((acc, r) => acc + (r.aiPositives?.length || 0) + (r.userPositives?.length || 0), 0);
  const totalGlobalNegatives = records.reduce((acc, r) => acc + (r.aiNegatives?.length || 0) + (r.userNegatives?.length || 0), 0);
  const positivityRatio = totalGlobalPositives + totalGlobalNegatives > 0
    ? Math.round((totalGlobalPositives / (totalGlobalPositives + totalGlobalNegatives)) * 100)
    : 50;

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

  // Open Edit Modal for a specific day
  const handleOpenEdit = (entry: DailyProsConsEntry) => {
    // Find matching diaries for that dayKey
    const dayDiaries = diaries.filter(d => {
      const entryDayKey = new Date(d.createdAt).toISOString().split('T')[0];
      return entryDayKey === entry.dayKey;
    });

    setActiveModalDayKey(entry.dayKey);
    setActiveModalDisplayDate(entry.displayDate);
    setActiveModalDiaries(dayDiaries);
  };

  // Delete Record
  const handleDeleteRecord = (dayKey: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف سجل هذا اليوم من الإيجابيات والسلبيات؟')) {
      const updated = records.filter(r => r.dayKey !== dayKey);
      saveAllProsConsRecords(updated);
      setRecords(updated);
      showToast('تم حذف السجل اليومي بنجاح.');
    }
  };

  // Master Export All to Word
  const handleExportAllWord = () => {
    if (records.length === 0) {
      alert('لا توجد سجلات مسجلة بعد للتصدير.');
      return;
    }

    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>سجل الإيجابيات والسلبيات الشامل</title></head>
      <body style="font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 25px;">
        <h1 style="color: #2B3E50; text-align: center;">⚖️ سجل الإيجابيات والسلبيات الشامل لجميع الأيام</h1>
        <p style="text-align: center; color: #5A5A40;">إجمالي الأيام المسجلة: ${totalDaysTracked} | نسبة الإيجابية العامة: ${positivityRatio}%</p>
        <hr/>
        ${records.map(r => `
          <div style="margin-bottom: 30px; border: 1px solid #E2DCC8; padding: 15px; border-radius: 10px;">
            <h2 style="color: #3B5066;">📅 ${r.displayDate} (${r.dayKey})</h2>
            
            <h3 style="color: #2D5A27;">🧠 الإيجابيات المولدة بالذكاء الاصطناعي:</h3>
            <ul>${(r.aiPositives || []).map(p => `<li>${p}</li>`).join('')}</ul>

            <h3 style="color: #902923;">🧠 السلبيات المولدة بالذكاء الاصطناعي:</h3>
            <ul>${(r.aiNegatives || []).map(n => `<li>${n}</li>`).join('')}</ul>

            <h3 style="color: #2D5A27;">✍️ الإيجابيات المدخلة يدوياً:</h3>
            <ul>${(r.userPositives || []).map(p => `<li>${p}</li>`).join('')}</ul>

            <h3 style="color: #902923;">✍️ السلبيات المدخلة يدوياً:</h3>
            <ul>${(r.userNegatives || []).map(n => `<li>${n}</li>`).join('')}</ul>
          </div>
        `).join('')}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `سجل_الإيجابيات_والسلبيات_الشامل.doc`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('تم تحميل السجل الكامل كـ Word 📝');
  };

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl" id="pros-cons-history-panel">
      
      {/* Top Banner & Analytics Summary */}
      <div className="bg-gradient-to-l from-[#2B3E50] via-[#3B5066] to-[#5A5A40] text-white p-6 rounded-3xl shadow-md border border-[#E2DCC8]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        
        <div className="flex items-center space-x-4 space-x-reverse relative z-10">
          <div className="p-3.5 bg-white/10 rounded-2xl border border-white/15 shrink-0 shadow-inner">
            <Scale className="w-8 h-8 text-[#FEFAE0]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-black text-white">
                ⚖️ سجل الإيجابيات والسلبيات اليومية
              </h3>
              <span className="bg-[#8B9D83] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full border border-white/20">
                سجل تاريخي كامل 🧠
              </span>
            </div>
            <p className="text-xs text-[#E2DCC8] font-medium mt-1 leading-relaxed max-w-xl">
              أرشيف وتوثيق زمني لجميع نقاط القوة والفرص والإيجابيات، إلى جانب التحديات والسلبيات المسجلة آلياً بالذكاء الاصطناعي أو يدوياً عبر الأيام.
            </p>
          </div>
        </div>

        {/* Action Button: Export Master Log */}
        <button
          onClick={handleExportAllWord}
          className="relative z-10 px-5 py-3 bg-gradient-to-r from-[#FEFAE0] to-[#E2DCC8] hover:from-white hover:to-[#FEFAE0] text-[#2B3E50] rounded-2xl font-black text-xs shadow-md transition-all flex items-center justify-center space-x-2 space-x-reverse cursor-pointer shrink-0 hover:scale-102 border border-white/40"
        >
          <FileText className="w-4 h-4 text-[#8B9D83]" />
          <span>تصدير السجل الكامل (Word / PDF) 📄</span>
        </button>

      </div>

      {/* Global Stat Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-[#E2DCC8] rounded-2xl p-4 shadow-3xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-gray-500">إجمالي الأيام المسجلة</p>
            <p className="text-xl font-black text-[#2B3E50] mt-0.5">{totalDaysTracked} أيام</p>
          </div>
          <Calendar className="w-6 h-6 text-[#8B9D83] opacity-80" />
        </div>

        <div className="bg-[#F2F7F2] border border-[#C2DCBE] rounded-2xl p-4 shadow-3xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-emerald-800">مجموع الإيجابيات المسجلة</p>
            <p className="text-xl font-black text-emerald-900 mt-0.5">{totalGlobalPositives} نقطة</p>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-600 opacity-80" />
        </div>

        <div className="bg-[#FDF3F2] border border-[#F5C6C3] rounded-2xl p-4 shadow-3xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-rose-800">مجموع التحديات والسلبيات</p>
            <p className="text-xl font-black text-rose-900 mt-0.5">{totalGlobalNegatives} نقطة</p>
          </div>
          <XCircle className="w-6 h-6 text-rose-600 opacity-80" />
        </div>

        <div className="bg-white border border-[#E2DCC8] rounded-2xl p-4 shadow-3xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold text-gray-500">نسبة التوازن الإيجابي</p>
            <p className="text-xl font-black text-[#5A5A40] mt-0.5">{positivityRatio}%</p>
          </div>
          <Brain className="w-6 h-6 text-[#5A5A40] opacity-80" />
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-[#E2DCC8] rounded-2xl p-4 shadow-3xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث برمز اليوم، التاريخ، أو الكلمات المفتاحية..."
            className="w-full bg-[#FAF8F5] border border-[#E2DCC8] rounded-xl pr-9 pl-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B9D83]"
          />
          <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center space-x-2 space-x-reverse w-full md:w-auto justify-end">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-[#2B3E50] text-white shadow-3xs'
                : 'bg-[#FAF8F5] text-gray-600 border border-[#E2DCC8]'
            }`}
          >
            الكل ({records.length})
          </button>

          <button
            onClick={() => setSelectedFilter('positives')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedFilter === 'positives'
                ? 'bg-emerald-800 text-white shadow-3xs'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            الأغلبية إيجابية 🟢
          </button>

          <button
            onClick={() => setSelectedFilter('negatives')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedFilter === 'negatives'
                ? 'bg-rose-800 text-white shadow-3xs'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            تحديات أعلى 🔴
          </button>
        </div>

      </div>

      {/* Main Records Grid */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-[#E2DCC8] rounded-3xl p-10 text-center space-y-3">
          <Scale className="w-12 h-12 text-[#8B9D83] mx-auto opacity-50" />
          <h4 className="text-base font-black text-[#2B3E50]">لا توجد سجلات مطابقة حالياً</h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            انتقل إلى صفحة اليوميات وانقر على أيقونة ⚖️ الإيجابيات والسلبيات بجانب تاريخ أي يوم لحفظ تقرير الإيجابيات والسلبيات الخاص به.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredRecords.map((entry) => {
            const allPositives = [...(entry.aiPositives || []), ...(entry.userPositives || [])];
            const allNegatives = [...(entry.aiNegatives || []), ...(entry.userNegatives || [])];

            return (
              <div 
                key={entry.dayKey}
                className="bg-white border-2 border-[#E2DCC8] hover:border-[#8B9D83] rounded-3xl p-5 shadow-xs transition-all space-y-4"
              >
                
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E2DCC8]/60 pb-3 gap-2">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="p-2 bg-[#8B9D83]/15 text-[#5A5A40] rounded-2xl shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-[#2B3E50]">
                        {entry.displayDate}
                      </h4>
                      <p className="text-[10px] text-gray-400 font-bold">
                        تاريخ التوثيق: {entry.dayKey}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <button
                      onClick={() => handleOpenEdit(entry)}
                      className="px-3 py-1.5 bg-[#8B9D83] hover:bg-[#5A5A40] text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-all shadow-3xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل التفاصيل</span>
                    </button>

                    <button
                      onClick={() => handleDeleteRecord(entry.dayKey)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-xl hover:bg-rose-50 transition-all cursor-pointer"
                      title="حذف السجل"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Content Grid: Positives (Right) vs Negatives (Left) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Positives Column (Right) */}
                  <div className="bg-[#F2F7F2] border border-[#C2DCBE] rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between border-b border-[#C2DCBE] pb-1.5">
                      <span className="text-xs font-black text-[#2D5A27] flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>الإيجابيات (مجموع {allPositives.length}):</span>
                      </span>
                    </div>

                    <ul className="space-y-1.5">
                      {entry.aiPositives?.map((pos, idx) => (
                        <li key={'ai-'+idx} className="text-xs text-gray-800 leading-relaxed flex items-start gap-1.5">
                          <span className="text-emerald-700 font-bold">🧠</span>
                          <span>{renderFormattedText(pos)}</span>
                        </li>
                      ))}
                      {entry.userPositives?.map((pos, idx) => (
                        <li key={'usr-'+idx} className="text-xs text-gray-800 leading-relaxed flex items-start gap-1.5">
                          <span className="text-emerald-700 font-bold">✍️</span>
                          <span>{renderFormattedText(pos)}</span>
                        </li>
                      ))}
                      {allPositives.length === 0 && (
                        <li className="text-xs text-gray-400 italic">لا توجد إيجابيات مدونة لليوم.</li>
                      )}
                    </ul>
                  </div>

                  {/* Negatives Column (Left) */}
                  <div className="bg-[#FDF3F2] border border-[#F5C6C3] rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between border-b border-[#F5C6C3] pb-1.5">
                      <span className="text-xs font-black text-[#902923] flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span>التحديات والسلبيات (مجموع {allNegatives.length}):</span>
                      </span>
                    </div>

                    <ul className="space-y-1.5">
                      {entry.aiNegatives?.map((neg, idx) => (
                        <li key={'ai-'+idx} className="text-xs text-gray-800 leading-relaxed flex items-start gap-1.5">
                          <span className="text-rose-700 font-bold">🧠</span>
                          <span>{renderFormattedText(neg)}</span>
                        </li>
                      ))}
                      {entry.userNegatives?.map((neg, idx) => (
                        <li key={'usr-'+idx} className="text-xs text-gray-800 leading-relaxed flex items-start gap-1.5">
                          <span className="text-rose-700 font-bold">✍️</span>
                          <span>{renderFormattedText(neg)}</span>
                        </li>
                      ))}
                      {allNegatives.length === 0 && (
                        <li className="text-xs text-gray-400 italic">لا توجد سلبيات مدونة لليوم.</li>
                      )}
                    </ul>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal Instance */}
      {activeModalDayKey && (
        <DailyProsConsModal
          isOpen={!!activeModalDayKey}
          onClose={() => setActiveModalDayKey(null)}
          dayKey={activeModalDayKey}
          displayDate={activeModalDisplayDate}
          dayDiaries={activeModalDiaries}
          userApiKey={userApiKey}
          onSaveSuccess={refreshRecords}
        />
      )}

    </div>
  );
}
