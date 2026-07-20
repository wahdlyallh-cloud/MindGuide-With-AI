import React, { useState } from 'react';
import { Calendar, Brain, FileText, AlertTriangle, Sparkles, Printer, Download } from 'lucide-react';
import { DiaryEntry } from '../types';
import SmartAdvisor from './SmartAdvisor';

interface IntegratedTherapyReportProps {
  diaries: DiaryEntry[];
  habits?: any[];
  gratitudeCards?: any[];
  books?: any[];
  userApiKey?: string;
}

export default function IntegratedTherapyReport({ diaries, habits = [], gratitudeCards = [], books = [], userApiKey }: IntegratedTherapyReportProps) {
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

  // Filter diaries in date range
  const filteredDiaries = diaries.filter(d => {
    const entryDate = d.createdAt.split('T')[0];
    return entryDate >= startDate && entryDate <= endDate;
  });

  // Calculate statistics
  const totalEntries = filteredDiaries.length;
  const averageSleep = filteredDiaries.length > 0 
    ? (filteredDiaries.reduce((sum, d) => sum + (d.sleepHours || 0), 0) / (filteredDiaries.filter(d => d.sleepHours).length || 1)).toFixed(1)
    : "8.0";
  
  const totalSports = filteredDiaries.reduce((sum, d) => sum + (d.sportsDuration || 0), 0);

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
          habits,
          gratitudeCards,
          books,
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
        setReportText("عذراً، حدث خطأ أثناء الاتصال بالمستشار الذكي لتوليد التقرير.");
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
          <title>تقرير جلسة العلاج النفسي - يومياتي AI</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            h1 { color: #5A5A40; text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
            h2 { color: #0f172a; margin-top: 30px; border-bottom: 1px solid #f1f5f9; padding-bottom: 5px; }
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
            تم توليد هذا التقرير تلقائياً وبسرية تامة بواسطة منصة Yawmiyati AI (يومياتي AI).
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = () => {
    const textContent = `تقرير مجهز لجلسة العلاج النفسي - يومياتي AI\nالفترة: من ${startDate} إلى ${endDate}\n\nإحصائيات مكملة:\n- عدد المذكرات: ${totalEntries}\n- متوسط النوم: ${averageSleep} ساعة\n- وقت الرياضة: ${totalSports} دقيقة\n\nالتقرير التحليلي:\n${reportText}`;
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير_العلاج_النفسي_${startDate}_إلى_${endDate}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl" id="therapy-report-panel">
      {/* 🎓 Therapist Session Banner */}
      <div className="bg-gradient-to-l from-[#5A5A40] to-[#8B9D83] text-white p-6 rounded-3xl shadow-sm border border-[#E2DCC8]/40">
        <div className="flex items-center space-x-3.5 space-x-reverse">
          <div className="p-3 bg-white/10 rounded-2xl">
            <FileText className="w-6.5 h-6.5 text-[#FEFAE0]" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white">🎓 تحضير جلسة العلاج النفسي والتقرير السريري</h3>
            <p className="text-xs text-[#E2DCC8]/90 font-medium mt-1">توليد تقرير شامل ومنظم يقدم لمعالجك النفسي لرصد المشاعر والسلوكيات بدقة عيادية متكاملة.</p>
          </div>
        </div>
      </div>

      {/* Date Range Selection & Local Stats */}
      <div className="bg-white border border-[#E2DCC8] rounded-3xl p-5 shadow-xs space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#5A5A40] mb-1.5 flex items-center space-x-1 space-x-reverse">
              <Calendar className="w-3.5 h-3.5 text-[#8B9D83]" />
              <span>تاريخ البدء:</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-white border border-[#E2DCC8] rounded-xl px-3 py-2 text-sm text-[#3A3A3A] focus:outline-none focus:ring-2 focus:ring-[#8B9D83]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#5A5A40] mb-1.5 flex items-center space-x-1 space-x-reverse">
              <Calendar className="w-3.5 h-3.5 text-[#8B9D83]" />
              <span>تاريخ الانتهاء:</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-white border border-[#E2DCC8] rounded-xl px-3 py-2 text-sm text-[#3A3A3A] focus:outline-none focus:ring-2 focus:ring-[#8B9D83]"
            />
          </div>
        </div>

        {/* Clinical Statistics Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-[#F0EDE4]/60 rounded-2xl border border-[#E2DCC8] text-center">
            <span className="block text-[10px] font-bold text-gray-500">عدد اليوميات المدونة</span>
            <span className="text-base font-black text-[#5A5A40]">{totalEntries}</span>
          </div>
          <div className="p-3 bg-[#CCD5AE]/20 rounded-2xl border border-[#CCD5AE]/60 text-center">
            <span className="block text-[10px] font-bold text-gray-500">متوسط ساعات النوم</span>
            <span className="text-base font-black text-[#8B9D83]">{averageSleep} ساعة</span>
          </div>
          <div className="p-3 bg-[#FAEDCD]/30 rounded-2xl border border-[#E2DCC8]/60 text-center">
            <span className="block text-[10px] font-bold text-gray-500">ممارسة الأنشطة</span>
            <span className="text-base font-black text-[#D4A373]">{totalSports} دقيقة</span>
          </div>
        </div>

        {/* Action Button */}
        {filteredDiaries.length === 0 ? (
          <div className="bg-[#FAEDCD]/40 border border-[#D4A373]/30 rounded-2xl p-4 text-center text-[#D4A373] text-xs flex items-center justify-center space-x-2 space-x-reverse font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>لا توجد مذكرات مدونة في الفترة المحددة. يرجى تدوين مذكرات أو تعديل نطاق التاريخ أولاً!</span>
          </div>
        ) : (
          !reportText && !loading && (
            <button
              onClick={generateReport}
              className="w-full py-3.5 px-4 bg-gradient-to-tr from-[#5A5A40] to-[#8B9D83] hover:from-[#5A5A40]/95 hover:to-[#8B9D83]/95 text-white rounded-2xl font-bold text-sm shadow-sm transition-all flex items-center justify-center space-x-2 space-x-reverse cursor-pointer group active:scale-99"
            >
              <Brain className="w-4.5 h-4.5 animate-pulse text-[#FEFAE0]" />
              <span>تحليل البيانات وتوليد التقرير السريري الفوري بالذكاء الاصطناعي 🧠</span>
            </button>
          )
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="p-8 border border-[#E2DCC8] rounded-3xl bg-[#F9F7F2] flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-[#E2DCC8]"></div>
              <div className="absolute inset-0 rounded-full border-4 border-[#8B9D83] border-t-transparent animate-spin"></div>
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-[#5A5A40] text-sm">جاري قراءة وتحليل المذكرات...</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed max-w-md">يقوم المساعد الذكي الآن بفرز الحالة المزاجية والترابط السلوكي وصياغة مستند طبي جاهز للطباعة أو التقديم.</p>
            </div>
          </div>
        )}

        {/* Generated Clinical Report */}
        {reportText && (
          <div className="border border-[#E2DCC8] rounded-2xl overflow-hidden shadow-2xs bg-[#F9F7F2]/50 animate-fade-in">
            <div className="bg-[#F0EDE4] p-3 px-4 border-b border-[#E2DCC8] flex items-center justify-between">
              <div className="flex items-center space-x-2 space-x-reverse text-xs font-bold text-[#5A5A40]">
                <Sparkles className="w-4 h-4 text-[#D4A373] animate-pulse" />
                <span>التقرير السريري المولد بواسطة {reportSource === 'gemini' ? 'Gemini 3.5-Flash 🚀' : 'المستشار المحلي 🖥️'}</span>
              </div>
              <button
                onClick={generateReport}
                className="text-[10px] text-[#8B9D83] hover:text-[#5A5A40] font-black cursor-pointer bg-white px-2 py-1 rounded-lg border border-[#E2DCC8] shadow-3xs"
              >
                إعادة توليد 🔄
              </button>
            </div>
            <div className="p-5 max-h-[350px] overflow-y-auto text-xs text-[#3A3A3A] leading-relaxed font-normal whitespace-pre-wrap text-right prose prose-slate">
              {reportText}
            </div>
            
            {/* Actions for Report */}
            <div className="p-3 bg-[#F0EDE4]/60 border-t border-[#E2DCC8] flex items-center justify-end space-x-2 space-x-reverse">
              <button
                onClick={handleDownload}
                className="flex items-center space-x-1.5 space-x-reverse px-3.5 py-2 bg-white border border-[#E2DCC8] hover:bg-[#F9F7F2] text-gray-700 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-3xs"
              >
                <Download className="w-3.5 h-3.5 text-[#5A5A40]" />
                <span>تحميل كملف نصي</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center space-x-1.5 space-x-reverse px-4 py-2 bg-[#5A5A40] hover:bg-[#5A5A40]/90 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <Printer className="w-3.5 h-3.5 text-white" />
                <span>طباعة التقرير للجلسة</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🧠 Smart Advisor Section (المستشار الذكي والفضفضة) */}
      <div className="space-y-3">
        <div className="bg-[#EEF1EB] border border-[#DCE4D8] p-4 rounded-3xl flex items-center space-x-3 space-x-reverse">
          <span className="text-xl">💬</span>
          <div>
            <h4 className="font-extrabold text-sm text-[#556E4F]">مساعد الجلسة والتحليل النفسي</h4>
            <p className="text-[10px] text-gray-500 font-medium">ابدأ حواراً استكشافياً مع المستشار الذكي حول هذا التقرير، أو اسأل عن استراتيجيات CBT مخصصة.</p>
          </div>
        </div>
        <SmartAdvisor diaries={diaries} habits={habits} gratitudeCards={gratitudeCards} books={books} userApiKey={userApiKey} />
      </div>
    </div>
  );
}
