import React, { useState } from 'react';
import { Calendar, Brain, FileText, CheckCircle, AlertTriangle, Sparkles, Printer, ArrowRight, Download, Copy, Check, FileCode } from 'lucide-react';
import { DiaryEntry } from '../types';

interface TherapistReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  diaries: DiaryEntry[];
  userApiKey?: string;
  appLanguage?: string;
}

export default function TherapistReportModal({ isOpen, onClose, diaries, userApiKey, appLanguage = 'ar' }: TherapistReportModalProps) {
  const isEn = appLanguage !== 'ar' && appLanguage !== 'ur';
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14); // default 2 weeks ago
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [loading, setLoading] = useState(false);
  const [reportText, setReportText] = useState<string>('');
  const [reportSource, setReportSource] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);

  if (!isOpen) return null;

  // Filter diaries in date range
  const filteredDiaries = diaries.filter(d => {
    const entryDate = d.createdAt ? (typeof d.createdAt === 'string' ? d.createdAt.split('T')[0] : new Date(d.createdAt).toISOString().split('T')[0]) : '';
    return entryDate >= startDate && entryDate <= endDate;
  });

  // Calculate local statistics for selected range
  const totalEntries = filteredDiaries.length;
  const averageSleep = filteredDiaries.length > 0 
    ? (filteredDiaries.reduce((sum, d) => sum + (d.sleepHours || 0), 0) / filteredDiaries.filter(d => d.sleepHours).length || 8).toFixed(1)
    : "غير متوفر";
  
  const totalSports = filteredDiaries.reduce((sum, d) => sum + (d.sportsDuration || 0), 0);
  
  // Mood summaries in date range
  const moodCounts: Record<string, number> = {};
  filteredDiaries.forEach(d => {
    d.moods.forEach(m => {
      moodCounts[m] = (moodCounts[m] || 0) + 1;
    });
  });

  const generateReport = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/gemini/smart-advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': userApiKey || ''
        },
        body: JSON.stringify({
          diaries: filteredDiaries,
          startDate,
          endDate,
          reportType: 'therapist'
        })
      });
      const data = await response.json();
      if (data.success) {
        setReportText(data.answer);
        setReportSource(data.source);
      } else {
        setReportText("عذراً، حدث خطأ أثناء الاتصال بالمستشار الذكي.");
      }
    } catch (e) {
      console.error(e);
      setReportText("عذراً، لم نتمكن من الوصول للمستشار الذكي حالياً.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>تقرير جلسة العلاج النفسي - حياة AI</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            h1 { color: #4f46e5; text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
            h2 { color: #0f172a; margin-top: 30px; border-bottom: 1px solid #f1f5f9; padding-bottom: 5px; }
            h3 { color: #475569; }
            .meta { background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .stat-box { border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; }
            pre { white-space: pre-wrap; font-family: inherit; }
            .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <h1>🎓 تقرير جاهز لجلسة العلاج النفسي</h1>
          <div class="meta">
            <strong>الفترة الزمنية للتقرير:</strong> من ${startDate} إلى ${endDate}<br/>
            <strong>عدد اليوميات المدونة:</strong> ${totalEntries} مذكرة شخصية<br/>
            <strong>تاريخ وموعد الصدور:</strong> ${new Date().toLocaleString('ar-EG')}
          </div>

          <div class="grid">
            <div class="stat-box">
              <strong>💤 متوسط ساعات النوم:</strong> ${averageSleep} ساعة / ليلة
            </div>
            <div class="stat-box">
              <strong>🏃 إجمالي وقت الرياضة:</strong> ${totalSports} دقيقة
            </div>
          </div>

          <h2>📋 التقرير التحليلي للذكاء الاصطناعي (مستشار الصحة النفسية)</h2>
          <div style="font-size: 15px;">
            ${reportText.replace(/\n/g, '<br/>')}
          </div>

          <div class="footer">
            تم توليد هذا التقرير تلقائياً وبسرية تامة بواسطة منصة Hayat AI (حياة AI).
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCopyText = async () => {
    try {
      const textToCopy = `تقرير مجهز لجلسة العلاج النفسي - حياة AI\nالفترة: من ${startDate} إلى ${endDate}\n\nإحصائيات مكملة:\n- عدد المذكرات: ${totalEntries}\n- متوسط النوم: ${averageSleep} ساعة\n- وقت الرياضة: ${totalSports} دقيقة\n\nالتقرير التحليلي:\n${reportText}`;
      await navigator.clipboard.writeText(textToCopy);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadTxt = () => {
    // UTF-8 BOM (\uFEFF) ensures proper Arabic rendering in all text viewers
    const textContent = `\uFEFFتقرير مجهز لجلسة العلاج النفسي - حياة AI\nالفترة: من ${startDate} إلى ${endDate}\n\nإحصائيات مكملة:\n- عدد المذكرات: ${totalEntries}\n- متوسط النوم: ${averageSleep} ساعة\n- وقت الرياضة: ${totalSports} دقيقة\n\nالتقرير التحليلي:\n${reportText}`;
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير_العلاج_النفسي_${startDate}_إلى_${endDate}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadDoc = () => {
    const htmlDocContent = `\uFEFF<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>تقرير العلاج النفسي</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 25px; line-height: 1.8; color: #2B3E50; direction: rtl; text-align: right; }
    h1 { color: #5A5A40; border-bottom: 2px solid #E2DCC8; padding-bottom: 8px; font-size: 20px; }
    .meta { background-color: #F9F7F2; padding: 12px; border-radius: 8px; border: 1px solid #E2DCC8; margin-bottom: 16px; font-size: 13px; }
    .report-body { font-size: 14px; white-space: pre-wrap; line-height: 1.8; }
    .footer { text-align: center; margin-top: 30px; font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 10px; }
  </style>
</head>
<body>
  <h1>🎓 تقرير جلسة العلاج النفسي - حياة AI</h1>
  <div class="meta">
    <p><strong>الفترة الزمنية:</strong> من ${startDate} إلى ${endDate}</p>
    <p><strong>إحصائيات المذكرات:</strong> ${totalEntries} | <strong>متوسط ساعات النوم:</strong> ${averageSleep} ساعة | <strong>وقت التمارين:</strong> ${totalSports} دقيقة</p>
  </div>
  <div class="report-body">
    ${reportText.replace(/\n/g, '<br/>')}
  </div>
  <div class="footer">تم إنشاء هذا التقرير تلقائياً وبسرية تامة عبر حياة AI</div>
</body>
</html>`;
    const blob = new Blob([htmlDocContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير_العلاج_النفسي_${startDate}_إلى_${endDate}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#5A5A40]/40 backdrop-blur-sm font-sans" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-[#E2DCC8] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-l from-[#5A5A40] to-[#8B9D83] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2.5 bg-white/10 rounded-2xl">
              <FileText className="w-6 h-6 text-[#FEFAE0]" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{isEn ? '🎓 Prepare Therapy Session Report' : '🎓 تجهيز تقرير جلسة العلاج'}</h2>
              <p className="text-xs text-[#E2DCC8]">{isEn ? 'Generate a comprehensive report for your therapist in seconds' : 'توليد تقرير احترافي شامل لمعالجك النفسي في ثوانٍ'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white cursor-pointer"
          >
            <ArrowRight className="w-5 h-5 rotate-180" />
          </button>
        </div>

        {/* Form & Content */}
        <div className="p-6 overflow-y-auto flex-grow space-y-6">
          
          {/* Step 1: Select Date Range */}
          <div className="bg-[#F9F7F2] p-4 rounded-2xl border border-[#E2DCC8] grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#5A5A40] mb-1.5 flex items-center space-x-1 space-x-reverse">
                <Calendar className="w-3.5 h-3.5 text-[#8B9D83]" />
                <span>{isEn ? 'Start Date:' : 'تاريخ البدء:'}</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white border border-[#E2DCC8] rounded-xl px-3 py-2 text-sm text-[#3A3A3A] focus:outline-none focus:ring-2 focus:ring-[#8B9D83] focus:border-[#8B9D83]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#5A5A40] mb-1.5 flex items-center space-x-1 space-x-reverse">
                <Calendar className="w-3.5 h-3.5 text-[#8B9D83]" />
                <span>{isEn ? 'End Date:' : 'تاريخ الانتهاء:'}</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-white border border-[#E2DCC8] rounded-xl px-3 py-2 text-sm text-[#3A3A3A] focus:outline-none focus:ring-2 focus:ring-[#8B9D83] focus:border-[#8B9D83]"
              />
            </div>
          </div>

          {/* Local Range Statistics Info */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-[#F0EDE4] rounded-xl border border-[#E2DCC8] text-center">
              <span className="block text-[10px] font-bold text-gray-500">{isEn ? 'Total Entries' : 'عدد اليوميات'}</span>
              <span className="text-lg font-extrabold text-[#5A5A40]">{totalEntries}</span>
            </div>
            <div className="p-3 bg-[#CCD5AE]/30 rounded-xl border border-[#CCD5AE]/60 text-center">
              <span className="block text-[10px] font-bold text-gray-500">{isEn ? 'Avg Sleep' : 'متوسط ساعات النوم'}</span>
              <span className="text-lg font-extrabold text-[#8B9D83]">{averageSleep} {isEn ? 'h' : 'س'}</span>
            </div>
            <div className="p-3 bg-[#FAEDCD]/40 rounded-xl border border-[#E2DCC8] text-center">
              <span className="block text-[10px] font-bold text-gray-500">{isEn ? 'Sports Time' : 'التمارين الرياضية'}</span>
              <span className="text-lg font-extrabold text-[#D4A373]">{totalSports} {isEn ? 'm' : 'د'}</span>
            </div>
          </div>

          {/* Generate Action Button */}
          {filteredDiaries.length === 0 ? (
            <div className="bg-[#FAEDCD]/50 border border-[#D4A373]/30 rounded-xl p-4 text-center text-[#D4A373] text-sm flex items-center justify-center space-x-2 space-x-reverse">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{isEn ? 'No entries found in selected period. Please log diaries or adjust date range!' : 'لا توجد مذكرات مدونة في الفترة المحددة. يرجى تدوين مذكرات أو تعديل نطاق التاريخ أولاً!'}</span>
            </div>
          ) : (
            !reportText && !loading && (
              <button
                onClick={generateReport}
                className="w-full py-3.5 px-4 bg-gradient-to-tr from-[#5A5A40] to-[#8B9D83] hover:from-[#5A5A40]/90 hover:to-[#8B9D83]/90 text-white rounded-2xl font-bold text-sm shadow-md transition-colors flex items-center justify-center space-x-2 space-x-reverse cursor-pointer group"
              >
                <Brain className="w-4 h-4 animate-pulse group-hover:scale-110 transition-transform text-[#FEFAE0]" />
                <span>{isEn ? 'Analyze Data & Generate AI Medical Report 🧠' : 'تحليل البيانات وتوليد التقرير الطبي بالذكاء الاصطناعي 🧠'}</span>
              </button>
            )
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="p-8 border border-[#E2DCC8] rounded-2xl bg-[#F9F7F2] flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-[#E2DCC8]"></div>
                <div className="absolute inset-0 rounded-full border-4 border-[#8B9D83] border-t-transparent animate-spin"></div>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-[#5A5A40]">{isEn ? 'Reading and analyzing your entries...' : 'جاري قراءة وتحليل مذكراتك...'}</h4>
                <p className="text-xs text-gray-500">{isEn ? 'AI is evaluating mood, activities, and psychological patterns to compose a clinical report.' : 'يقوم الذكاء الاصطناعي بفحص الحالة المزاجية، الأنشطة، والأنماط النفسية وصياغة تقرير عيادي.'}</p>
              </div>
            </div>
          )}

          {/* Generated Report View */}
          {reportText && (
            <div className="border border-[#E2DCC8] rounded-2xl overflow-hidden shadow-xs bg-[#F9F7F2]">
              <div className="bg-[#F0EDE4] p-3 px-4 border-b border-[#E2DCC8] flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse text-xs font-bold text-[#5A5A40]">
                  <Sparkles className="w-4 h-4 text-[#D4A373]" />
                  <span>{isEn ? 'Report generated by ' : 'التقرير النفسي المولد بواسطة '}{reportSource === 'gemini' ? 'Gemini 3.5-Flash 🚀' : (isEn ? 'Local Advisor 🖥️' : 'المستشار المحلي 🖥️')}</span>
                </div>
                {reportSource !== 'gemini' && (
                  <span className="text-[10px] bg-[#D4A373]/10 text-[#D4A373] border border-[#D4A373]/20 px-2 py-0.5 rounded-full font-semibold">
                    {isEn ? 'Demo Version' : 'نسخة تجريبية'}
                  </span>
                )}
              </div>
              <div className="p-5 overflow-y-auto max-h-[350px] text-sm text-[#3A3A3A] leading-relaxed font-normal whitespace-pre-wrap text-right prose prose-slate">
                {reportText}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        {reportText && (
          <div className="p-4 bg-[#F0EDE4] border-t border-[#E2DCC8] flex items-center justify-between">
            <button
              onClick={generateReport}
              className="px-4 py-2 text-xs font-medium text-[#8B9D83] hover:bg-white/50 rounded-lg transition-colors cursor-pointer"
              disabled={loading}
            >
              {isEn ? 'Regenerate 🔄' : 'إعادة توليد 🔄'}
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopyText}
                className="flex items-center space-x-1.5 space-x-reverse px-3 py-2 bg-white border border-[#E2DCC8] hover:bg-[#F9F7F2] text-gray-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#5A5A40]" />}
                <span>{copySuccess ? (isEn ? 'Copied!' : 'تم النسخ!') : (isEn ? 'Copy Text' : 'نسخ النص')}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadDoc}
                className="flex items-center space-x-1.5 space-x-reverse px-3 py-2 bg-white border border-[#E2DCC8] hover:bg-[#F9F7F2] text-[#2B3E50] rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5 text-blue-600" />
                <span>Word (.doc)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTxt}
                className="flex items-center space-x-1.5 space-x-reverse px-3 py-2 bg-white border border-[#E2DCC8] hover:bg-[#F9F7F2] text-gray-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#5A5A40]" />
                <span>{isEn ? 'Text File (UTF-8)' : 'ملف نصي (UTF-8)'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center space-x-1.5 space-x-reverse px-4 py-2 bg-[#5A5A40] hover:bg-[#5A5A40]/90 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-white" />
                <span>{isEn ? 'Print Report' : 'طباعة التقرير'}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
