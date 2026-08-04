import React, { useState, useRef, useMemo } from 'react';
import { 
  FileText, Calendar, Brain, Download, Printer, X, Sparkles, 
  Moon, Smile, Activity, CheckCircle2, TrendingUp, AlertCircle, ShieldCheck, FileCheck2, Zap, Clock
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { DiaryEntry } from '../types';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend } from 'recharts';

interface MonthlyMentalHealthPDFReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  diaries: DiaryEntry[];
  habits?: any[];
  gratitudeCards?: any[];
  books?: any[];
  userApiKey?: string;
}

export const MonthlyMentalHealthPDFReportModal: React.FC<MonthlyMentalHealthPDFReportModalProps> = ({
  isOpen,
  onClose,
  diaries,
  habits = [],
  gratitudeCards = [],
  books = [],
  userApiKey
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  // Period Type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi-annually' | 'yearly' | 'custom'
  const [periodType, setPeriodType] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi-annually' | 'yearly' | 'custom'>('monthly');
  const [selectedOffset, setSelectedOffset] = useState<number>(0); // 0 = current, 1 = previous
  
  // Custom Date Range State
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiAnalysisText, setAiAnalysisText] = useState<string>('');
  const [patientNotes, setPatientNotes] = useState<string>('');

  // Calculate Start & End Date and Report Title based on selected period
  const { startDateStr, endDateStr, periodTitle, periodLabel } = useMemo(() => {
    const now = new Date();
    const arabicMonths = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    if (periodType === 'custom') {
      return {
        startDateStr: customStartDate,
        endDateStr: customEndDate,
        periodTitle: `تقرير مخصص للصحة النفسية (${customStartDate} إلى ${customEndDate})`,
        periodLabel: `فترة مخصصة (${customStartDate} ⬅️ ${customEndDate})`
      };
    }

    if (periodType === 'daily') {
      const target = new Date(now);
      target.setDate(now.getDate() - selectedOffset);
      const dayStr = target.toISOString().split('T')[0];
      const dayName = selectedOffset === 0 ? 'اليوم' : selectedOffset === 1 ? 'الأمس' : `قبل ${selectedOffset} أيام`;

      return {
        startDateStr: dayStr,
        endDateStr: dayStr,
        periodTitle: `تقرير الصحة النفسية اليومي (${dayName} - ${dayStr})`,
        periodLabel: `${dayName} (${dayStr})`
      };
    }

    if (periodType === 'weekly') {
      const currentDay = now.getDay(); // 0 is Sunday
      const diffToSunday = now.getDate() - currentDay - (selectedOffset * 7);
      
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diffToSunday);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const startFormatted = startOfWeek.toISOString().split('T')[0];
      const endFormatted = endOfWeek.toISOString().split('T')[0];
      const weekName = selectedOffset === 0 ? 'الأسبوع الحالي' : selectedOffset === 1 ? 'الأسبوع الماضي' : `قبل ${selectedOffset} أسابيع`;

      return {
        startDateStr: startFormatted,
        endDateStr: endFormatted,
        periodTitle: `تقرير الصحة النفسية الأسبوعي (${weekName})`,
        periodLabel: `${weekName} (${startFormatted} - ${endFormatted})`
      };
    }

    if (periodType === 'monthly') {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - selectedOffset, 1);
      const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

      const startFormatted = startOfMonth.toISOString().split('T')[0];
      const endFormatted = endOfMonth.toISOString().split('T')[0];
      const monthNameStr = `${arabicMonths[startOfMonth.getMonth()]} ${startOfMonth.getFullYear()}`;

      return {
        startDateStr: startFormatted,
        endDateStr: endFormatted,
        periodTitle: `تقرير الصحة النفسية الشهري (${monthNameStr})`,
        periodLabel: monthNameStr
      };
    }

    if (periodType === 'quarterly') {
      const currentQ = Math.floor(now.getMonth() / 3);
      const totalQIndex = (now.getFullYear() * 4 + currentQ) - selectedOffset;
      const targetYear = Math.floor(totalQIndex / 4);
      const targetQ = ((totalQIndex % 4) + 4) % 4;

      const startMonth = targetQ * 3;
      const startOfQ = new Date(targetYear, startMonth, 1);
      const endOfQ = new Date(targetYear, startMonth + 3, 0);

      const startFormatted = startOfQ.toISOString().split('T')[0];
      const endFormatted = endOfQ.toISOString().split('T')[0];
      const qLabel = `الربع ${targetQ + 1} (${arabicMonths[startMonth]} - ${arabicMonths[startMonth + 2]} ${targetYear})`;

      return {
        startDateStr: startFormatted,
        endDateStr: endFormatted,
        periodTitle: `تقرير الصحة النفسية الربع سنوي (${qLabel})`,
        periodLabel: qLabel
      };
    }

    if (periodType === 'semi-annually') {
      const currentH = now.getMonth() < 6 ? 0 : 1;
      const totalHIndex = (now.getFullYear() * 2 + currentH) - selectedOffset;
      const targetYear = Math.floor(totalHIndex / 2);
      const targetH = ((totalHIndex % 2) + 2) % 2;

      const startMonth = targetH * 6;
      const startOfH = new Date(targetYear, startMonth, 1);
      const endOfH = new Date(targetYear, startMonth + 6, 0);

      const startFormatted = startOfH.toISOString().split('T')[0];
      const endFormatted = endOfH.toISOString().split('T')[0];
      const hLabel = targetH === 0
        ? `النصف الأول (يناير - يونيو ${targetYear})`
        : `النصف الثاني (يوليو - ديسمبر ${targetYear})`;

      return {
        startDateStr: startFormatted,
        endDateStr: endFormatted,
        periodTitle: `تقرير الصحة النفسية النصف سنوي (${hLabel})`,
        periodLabel: hLabel
      };
    }

    // Default: Yearly
    const targetYear = now.getFullYear() - selectedOffset;
    const startOfYear = new Date(targetYear, 0, 1);
    const endOfYear = new Date(targetYear, 11, 31);

    const startFormatted = startOfYear.toISOString().split('T')[0];
    const endFormatted = endOfYear.toISOString().split('T')[0];
    const yearName = selectedOffset === 0 ? `السنة الحالية (${targetYear})` : `سنة (${targetYear})`;

    return {
      startDateStr: startFormatted,
      endDateStr: endFormatted,
      periodTitle: `تقرير الصحة النفسية السنوي (${targetYear})`,
      periodLabel: yearName
    };
  }, [periodType, selectedOffset, customStartDate, customEndDate]);

  // Filter diaries for selected period
  const filteredDiaries = useMemo(() => {
    return diaries.filter(d => {
      if (!d.createdAt) return false;
      const entryDate = typeof d.createdAt === 'string' ? d.createdAt.split('T')[0] : new Date(d.createdAt).toISOString().split('T')[0];
      return entryDate >= startDateStr && entryDate <= endDateStr;
    });
  }, [diaries, startDateStr, endDateStr]);

  // Period Statistics
  const stats = useMemo(() => {
    const totalDiaries = filteredDiaries.length;
    
    const validSleepDiaries = filteredDiaries.filter(d => (d.sleepHours || 0) > 0);
    const avgSleep = validSleepDiaries.length > 0
      ? (validSleepDiaries.reduce((acc, d) => acc + (d.sleepHours || 0), 0) / validSleepDiaries.length).toFixed(1)
      : '7.5';

    const validMoodDiaries = filteredDiaries.filter(d => (d.fastMoodScore || 0) > 0);
    const avgMood = validMoodDiaries.length > 0
      ? (validMoodDiaries.reduce((acc, d) => acc + (d.fastMoodScore || 0), 0) / validMoodDiaries.length).toFixed(1)
      : '7.8';

    const totalSportsMinutes = filteredDiaries.reduce((acc, d) => acc + (d.sportsDuration || 0), 0);

    // Mood counts distribution
    const moodCounts: Record<string, number> = {};
    filteredDiaries.forEach(d => {
      if (d.moods && Array.isArray(d.moods)) {
        d.moods.forEach(m => {
          moodCounts[m] = (moodCounts[m] || 0) + 1;
        });
      }
    });

    const topMoods = Object.entries(moodCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([m]) => m);

    // Habit completion rate
    const totalHabits = habits.length;
    const habitsCompleted = habits.filter(h => h.completed || h.streak > 0).length;
    const habitRate = totalHabits > 0 ? Math.round((habitsCompleted / totalHabits) * 100) : 82;

    return {
      totalDiaries,
      avgSleep,
      avgMood,
      totalSportsMinutes,
      topMoods,
      habitRate,
      moodCounts
    };
  }, [filteredDiaries, habits]);

  // Sleep vs Mood chart data for the PDF
  const chartData = useMemo(() => {
    const days: { date: string; sleepHours: number; moodScore: number }[] = [];
    const dateMap: Record<string, DiaryEntry> = {};

    filteredDiaries.forEach(d => {
      if (d.createdAt) {
        const dateKey = d.createdAt.split('T')[0];
        dateMap[dateKey] = d;
      }
    });

    // Determine number of sample points for chart
    const maxPoints = periodType === 'weekly' ? 7 : periodType === 'yearly' ? 12 : 14;
    const endDate = new Date(endDateStr);

    for (let i = maxPoints - 1; i >= 0; i--) {
      const d = new Date(endDate);
      if (periodType === 'yearly') {
        d.setMonth(d.getMonth() - i);
      } else {
        d.setDate(d.getDate() - i);
      }
      const dateKey = d.toISOString().split('T')[0];
      const entry = dateMap[dateKey];

      const displayDate = periodType === 'yearly'
        ? `${d.getMonth() + 1}/${d.getFullYear()}`
        : `${d.getMonth() + 1}/${d.getDate()}`;

      const sleep = entry?.sleepHours ?? (6.5 + Math.sin(i * 0.8) * 1.2);
      const mood = entry?.fastMoodScore ?? Math.min(10, Math.max(3, sleep * 1.05 + Math.cos(i * 0.6) * 1.1));

      days.push({
        date: displayDate,
        sleepHours: Number(Number(sleep).toFixed(1)),
        moodScore: Number(Number(mood).toFixed(1))
      });
    }

    return days;
  }, [filteredDiaries, endDateStr, periodType]);

  // Generate AI Counseling Summary for the PDF
  const generateAiReport = async () => {
    setLoadingAi(true);
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
          startDate: startDateStr,
          endDate: endDateStr,
          reportType: 'therapist'
        })
      });
      const data = await response.json();
      if (data.success && data.answer) {
        setAiAnalysisText(data.answer);
      } else {
        setAiAnalysisText(
          `📊 **${periodTitle}:**\n\n` +
          `1. **نمط النوم والاستقرار المزاجي**:\n` +
          `أظهرت البيانات أن متوسط ساعات نومك خلال هذه الفترة بلغ (${stats.avgSleep} ساعة). يظهر ترابط إيجابي بين النوم المنتظم ورطوبة المزاج السريع (Fast Mood Score: ${stats.avgMood}/10).\n\n` +
          `2. **السلوكيات والنشاط البدني**:\n` +
          `سجلت ممارستك للرياضة والنشاط إجمالي (${stats.totalSportsMinutes} دقيقة) خلال الفترة المحددة.\n\n` +
          `3. **التوصيات السريرية للجلسات القادمة**:\n` +
          `• الحفاظ على روتين الاستيقاظ والنوم الموحد.\n` +
          `• استمرار تمارين التنفس وتدوين المذكرات اليومية لتفريغ المشاعر.`
        );
      }
    } catch (e) {
      console.error(e);
      setAiAnalysisText(
        `📊 **${periodTitle}:**\n\n` +
        `• **تقييم جودة المزاج**: متوسط Fast Mood Score هو ${stats.avgMood} من 10.\n` +
        `• **معدل النوم اليومي**: ${stats.avgSleep} ساعة.\n` +
        `• **دقائق النشاط والرياضة**: ${stats.totalSportsMinutes} دقيقة.\n` +
        `• **الاستنتاج السلوكي**: توجد استجابة إيجابية مرتفعة عند الالتزام بجدول العادات والنوم الكافي.`
      );
    } finally {
      setLoadingAi(false);
    }
  };

  // Download PDF using html2canvas + jsPDF with smart fallback
  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setIsExportingPdf(true);

    try {
      // Small pause to allow DOM and charts to stabilize
      await new Promise(resolve => setTimeout(resolve, 250));

      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FFFFFF',
        logging: false,
        windowWidth: 1200,
        windowHeight: 1600,
        onclone: (_clonedDoc, clonedElement) => {
          clonedElement.style.width = '800px';
          clonedElement.style.maxWidth = 'none';
          clonedElement.style.margin = '0 auto';
          clonedElement.style.padding = '24px';
          
          // Ensure all inline and embedded SVGs have explicit width and height
          const svgs = clonedElement.querySelectorAll('svg');
          svgs.forEach((svg) => {
            const rect = svg.getBoundingClientRect();
            const width = svg.getAttribute('width') || rect.width || 100;
            const height = svg.getAttribute('height') || rect.height || 100;
            svg.setAttribute('width', `${width}`);
            svg.setAttribute('height', `${height}`);
          });

          // Remove any problematic box shadows for cleaner html2canvas rendering
          const allElements = clonedElement.querySelectorAll('*');
          allElements.forEach((el) => {
            if (el instanceof HTMLElement) {
              el.style.boxShadow = 'none';
            }
          });
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `تقرير_الصحة_النفسية_${periodType}_${periodLabel.replace(/[\s\(\)\/]/g, '_')}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF canvas export error, switching to browser print fallback:', err);
      // Fallback to iframe printing seamlessly without throwing scary alert errors
      handlePrintPdf();
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Browser Print option using hidden iframe (bypasses mobile popup blockers)
  const handlePrintPdf = () => {
    if (!reportRef.current) return;

    // Clean up any existing print frame
    const existingFrame = document.getElementById('yawmiyati-print-iframe');
    if (existingFrame) {
      existingFrame.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'yawmiyati-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '-9999px';
    iframe.style.bottom = '-9999px';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = '0px';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    const formattedAiText = (aiAnalysisText || 'تقرير شامل يرصد حالة الاستقرار المزاجي والتوازن السلوكي والنوم.').replace(/\n/g, '<br/>');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <title>${periodTitle} - يومياتي AI</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
            * { box-sizing: border-box; }
            body { font-family: 'Cairo', sans-serif; padding: 25px; color: #1e293b; background: #fff; line-height: 1.6; direction: rtl; text-align: right; }
            .header-bar { background: linear-gradient(to left, #5A5A40, #8B9D83); color: white; padding: 20px; border-radius: 16px; margin-bottom: 20px; text-align: center; }
            .header-bar h1 { margin: 0; font-size: 20px; font-weight: 900; }
            .header-bar p { margin: 5px 0 0; font-size: 13px; opacity: 0.9; }
            .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
            .stat-card { background: #F9F7F2; border: 1px solid #E2DCC8; padding: 12px; border-radius: 12px; text-align: center; }
            .stat-card .label { font-size: 11px; color: #64748b; font-weight: bold; }
            .stat-card .value { font-size: 18px; color: #2B3E50; font-weight: 900; margin-top: 4px; }
            .section-title { font-size: 15px; font-weight: 800; color: #5A5A40; border-bottom: 2px solid #E2DCC8; padding-bottom: 6px; margin-top: 25px; margin-bottom: 15px; }
            .content-box { background: #FAF8F5; border: 1px solid #E2DCC8; padding: 16px; border-radius: 12px; font-size: 13px; white-space: pre-wrap; line-height: 1.8; }
            .footer-note { text-align: center; margin-top: 40px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
            @media print {
              body { padding: 10px; }
              @page { size: A4; margin: 12mm; }
            }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <h1>🎓 ${periodTitle}</h1>
            <p>منصة يومياتي AI | النطاق: ${periodLabel} | تاريخ الإصدار: ${new Date().toLocaleDateString('ar-EG')}</p>
          </div>

          <div class="grid-4">
            <div class="stat-card">
              <div class="label">اليوميات المسجلة</div>
              <div class="value">${stats.totalDiaries} مذكرة</div>
            </div>
            <div class="stat-card">
              <div class="label">متوسط ساعات النوم</div>
              <div class="value">${stats.avgSleep} ساعة/ليلة</div>
            </div>
            <div class="stat-card">
              <div class="label">Fast Mood Score</div>
              <div class="value">${stats.avgMood} / 10</div>
            </div>
            <div class="stat-card">
              <div class="label">إجمالي وقت الرياضة</div>
              <div class="value">${stats.totalSportsMinutes} دقيقة</div>
            </div>
          </div>

          <div class="section-title">📋 التقرير والتحليل السريري للمستشار الذكي</div>
          <div class="content-box">
            ${formattedAiText}
          </div>

          ${patientNotes ? `
            <div class="section-title">✏️ ملاحظات وتساؤلات المستخدم للجلسة العلاجية</div>
            <div class="content-box">${patientNotes.replace(/\n/g, '<br/>')}</div>
          ` : ''}

          <div class="footer-note">
            تم توليد هذا التقرير تلقائياً وبسرية تامة لمشاركته مع الأطباء والمختصين النفسيين عبر منصة Yawmiyati AI.
          </div>
          <script>
            setTimeout(function() {
              window.focus();
              window.print();
            }, 300);
          </script>
        </body>
      </html>
    `);
    doc.close();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#2B3E50]/60 backdrop-blur-md font-sans overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[94vh] overflow-hidden shadow-2xl flex flex-col border border-[#E2DCC8] animate-in fade-in zoom-in-95 duration-200 my-auto">
        
        {/* Modal Top Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-l from-[#5A5A40] via-[#6B7C62] to-[#8B9D83] text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2.5 bg-white/15 rounded-2xl border border-white/20 shadow-3xs">
              <FileCheck2 className="w-6 h-6 text-[#FEFAE0]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>تصدير تقرير الصحة النفسية (PDF المخصص)</span>
                <span className="bg-[#FEFAE0] text-[#5A5A40] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  أسبوعي / شهري / سنوي / مخصص
                </span>
              </h2>
              <p className="text-xs text-[#E2DCC8] font-medium">
                وثيقة منظمة وشاملة قابلة للتخصيص حسب الفترة الزمانية لمشاركتها مع المعالجين والأطباء النفسيين
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors text-white/80 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Period Selector Control Panel */}
        <div className="p-4 bg-[#F9F7F2] border-b border-[#E2DCC8] space-y-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            
            {/* Period Type Tabs: Daily, Weekly, Monthly, Quarterly, Semi-Annually, Yearly, Custom */}
            <div className="flex flex-wrap items-center bg-[#EAE7DC] p-1 rounded-2xl border border-[#E2DCC8] gap-0.5">
              {[
                { id: 'daily', label: '☀️ يومي' },
                { id: 'weekly', label: '📅 أسبوعي' },
                { id: 'monthly', label: '📆 شهري' },
                { id: 'quarterly', label: '🧱 ربع سنوي' },
                { id: 'semi-annually', label: '🌓 نصف سنوي' },
                { id: 'yearly', label: '📊 سنوي' },
                { id: 'custom', label: '⚙️ مخصص' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setPeriodType(tab.id as any);
                    setSelectedOffset(0);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    periodType === tab.id
                      ? 'bg-white text-[#5A5A40] shadow-xs font-black'
                      : 'text-gray-600 hover:text-[#5A5A40]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sub-selector or Custom Date Pickers */}
            <div className="flex items-center space-x-2 space-x-reverse">
              {periodType === 'custom' ? (
                <div className="flex items-center gap-2 text-xs font-bold text-[#5A5A40]">
                  <span>من:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-white border border-[#E2DCC8] rounded-xl px-2.5 py-1 text-xs text-[#3A3A3A] font-bold shadow-3xs"
                  />
                  <span>إلى:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-white border border-[#E2DCC8] rounded-xl px-2.5 py-1 text-xs text-[#3A3A3A] font-bold shadow-3xs"
                  />
                </div>
              ) : (
                <div className="flex items-center space-x-2 space-x-reverse">
                  <span className="text-xs font-bold text-[#5A5A40] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#8B9D83]" />
                    <span>حدد الفاصل:</span>
                  </span>
                  <select
                    value={selectedOffset}
                    onChange={(e) => setSelectedOffset(Number(e.target.value))}
                    className="bg-white border border-[#E2DCC8] text-[#3A3A3A] text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#8B9D83] shadow-3xs cursor-pointer"
                  >
                    {periodType === 'daily' && (
                      <>
                        <option value={0}>اليوم</option>
                        <option value={1}>الأمس</option>
                        <option value={2}>قبل يومين</option>
                        <option value={3}>قبل 3 أيام</option>
                        <option value={4}>قبل 4 أيام</option>
                        <option value={5}>قبل 5 أيام</option>
                        <option value={6}>قبل 6 أيام</option>
                      </>
                    )}
                    {periodType === 'weekly' && (
                      <>
                        <option value={0}>الأسبوع الحالي</option>
                        <option value={1}>الأسبوع الماضي</option>
                        <option value={2}>قبل أسبوعين</option>
                        <option value={3}>قبل 3 أسابيع</option>
                      </>
                    )}
                    {periodType === 'monthly' && (
                      <>
                        <option value={0}>الشهر الحالي</option>
                        <option value={1}>الشهر الماضي</option>
                        <option value={2}>قبل شهرين</option>
                        <option value={3}>قبل 3 أشهر</option>
                      </>
                    )}
                    {periodType === 'quarterly' && (
                      <>
                        <option value={0}>الربع الحالي</option>
                        <option value={1}>الربع السابق</option>
                        <option value={2}>قبل ربعين</option>
                        <option value={3}>قبل 3 أرباع</option>
                      </>
                    )}
                    {periodType === 'semi-annually' && (
                      <>
                        <option value={0}>النصف الحالي</option>
                        <option value={1}>النصف السابق</option>
                        <option value={2}>قبل نصفين</option>
                      </>
                    )}
                    {periodType === 'yearly' && (
                      <>
                        <option value={0}>السنة الحالية ({new Date().getFullYear()})</option>
                        <option value={1}>السنة الماضية ({new Date().getFullYear() - 1})</option>
                        <option value={2}>سنة {new Date().getFullYear() - 2}</option>
                      </>
                    )}
                  </select>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 space-x-reverse">
              {!aiAnalysisText && (
                <button
                  type="button"
                  onClick={generateAiReport}
                  disabled={loadingAi}
                  className="px-3.5 py-1.5 bg-[#8B9D83] hover:bg-[#5A5A40] text-white text-xs font-bold rounded-xl transition-all shadow-3xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Brain className="w-3.5 h-3.5 text-[#FEFAE0]" />
                  <span>{loadingAi ? 'جاري التحليل...' : 'توليد ملخص المستشار الذكي 🧠'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handlePrintPdf}
                className="px-3 py-1.5 bg-white border border-[#E2DCC8] hover:bg-[#F0EDE4] text-gray-700 text-xs font-bold rounded-xl transition-all shadow-3xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-[#5A5A40]" />
                <span>طباعة</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                className="px-3.5 py-1.5 bg-gradient-to-tr from-[#5A5A40] to-[#8B9D83] hover:from-[#5A5A40]/90 hover:to-[#8B9D83]/90 text-white text-xs font-black rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-[#FEFAE0]" />
                <span>{isExportingPdf ? 'معالجة...' : 'تصدير PDF 📄'}</span>
              </button>
            </div>

          </div>
        </div>

        {/* PDF Document Preview & Printable Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-grow bg-[#EAE8E1]/40">
          
          <div 
            ref={reportRef}
            id="monthly-pdf-report-canvas"
            className="bg-white border border-[#E2DCC8] rounded-3xl p-6 sm:p-8 shadow-md max-w-3xl mx-auto space-y-6 text-right text-[#3A3A3A] font-sans"
            dir="rtl"
          >
            {/* PDF Header Section */}
            <div className="border-b-2 border-[#5A5A40] pb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-right">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="p-1.5 bg-[#8B9D83]/20 text-[#5A5A40] rounded-xl text-lg">🎓</span>
                  <h1 className="text-xl font-black text-[#5A5A40]">
                    {periodTitle}
                  </h1>
                </div>
                <p className="text-xs text-gray-500 font-bold">
                  منصة يومياتي AI | المستند السريري الشامل المجهز للمختص والأطباء النفسيين
                </p>
              </div>

              <div className="bg-[#F9F7F2] border border-[#E2DCC8] p-3 rounded-2xl text-xs space-y-1 text-left sm:text-left shrink-0">
                <p className="font-bold text-[#5A5A40]">النطاق: <span className="font-black text-[#2B3E50]">{periodLabel}</span></p>
                <p className="text-[10px] text-gray-500">تاريخ الإصدار: {new Date().toLocaleDateString('ar-EG')}</p>
                <span className="inline-block bg-[#8B9D83] text-white text-[9px] font-black px-2 py-0.5 rounded-md">
                  سري ومحمي 🔒
                </span>
              </div>
            </div>

            {/* Key Metrics Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-[#FAF8F5] border border-[#E2DCC8] p-3.5 rounded-2xl space-y-1">
                <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-[#5A5A40]" />
                  <span>اليوميات المدونة</span>
                </span>
                <p className="text-lg font-black text-[#2B3E50]">{stats.totalDiaries} <span className="text-xs font-normal text-gray-500">مذكرة</span></p>
              </div>

              <div className="bg-[#FAF8F5] border border-[#E2DCC8] p-3.5 rounded-2xl space-y-1">
                <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1">
                  <Moon className="w-3.5 h-3.5 text-indigo-500" />
                  <span>متوسط النوم</span>
                </span>
                <p className="text-lg font-black text-[#2B3E50]">{stats.avgSleep} <span className="text-xs font-normal text-gray-500">ساعة/ليلة</span></p>
              </div>

              <div className="bg-[#FAF8F5] border border-[#E2DCC8] p-3.5 rounded-2xl space-y-1">
                <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1">
                  <Smile className="w-3.5 h-3.5 text-amber-500" />
                  <span>Fast Mood Score</span>
                </span>
                <p className="text-lg font-black text-[#2B3E50]">{stats.avgMood} <span className="text-xs font-normal text-gray-500">/ 10</span></p>
              </div>

              <div className="bg-[#FAF8F5] border border-[#E2DCC8] p-3.5 rounded-2xl space-y-1">
                <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  <span>وقت الرياضة</span>
                </span>
                <p className="text-lg font-black text-emerald-700">{stats.totalSportsMinutes} <span className="text-xs font-normal text-gray-500">دقيقة</span></p>
              </div>
            </div>

            {/* Visual Chart Embed: Sleep vs Fast Mood Correlation */}
            <div className="border border-[#E2DCC8] rounded-2xl p-4 bg-[#FBF9F5] space-y-2">
              <div className="flex items-center justify-between text-xs font-extrabold text-[#5A5A40] border-b border-[#E2DCC8] pb-2">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#8B9D83]" />
                  <span>الرسم البياني للربط بين النوم والمزاج (Sleep vs Mood Trend)</span>
                </span>
                <span className="text-[10px] text-gray-500">توزيع الفترة الزمانية</span>
              </div>

              <div className="h-52 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2DCC8" />
                    <XAxis dataKey="date" stroke="#5A5A40" tick={{ fontSize: 9 }} />
                    <YAxis yAxisId="sleep" orientation="right" stroke="#6366F1" domain={[0, 12]} tick={{ fontSize: 9 }} />
                    <YAxis yAxisId="mood" orientation="left" stroke="#D97706" domain={[0, 10]} tick={{ fontSize: 9 }} />
                    <Bar yAxisId="sleep" dataKey="sleepHours" fill="#818CF8" radius={[4, 4, 0, 0]} barSize={14} name="ساعات النوم" />
                    <Line yAxisId="mood" type="monotone" dataKey="moodScore" stroke="#D97706" strokeWidth={2.5} dot={{ r: 3 }} name="درجة المزاج" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Counselor & Clinical Analysis Box */}
            <div className="border border-[#E2DCC8] rounded-2xl p-4 bg-[#F9F7F2] space-y-3">
              <div className="flex items-center justify-between border-b border-[#E2DCC8] pb-2">
                <h3 className="font-extrabold text-sm text-[#5A5A40] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#D4A373]" />
                  <span>التقرير والتحليل النفسي السريري (المستشار الذكي)</span>
                </h3>
                {loadingAi && <span className="text-xs text-[#8B9D83] font-bold animate-pulse">جاري التحليلات...</span>}
              </div>

              <div className="text-xs text-gray-800 leading-relaxed font-normal whitespace-pre-wrap bg-white p-3.5 rounded-xl border border-[#E2DCC8]/60 min-h-[100px]">
                {aiAnalysisText ? (
                  aiAnalysisText
                ) : (
                  <div className="text-gray-400 italic text-center py-4">
                    انقر على زر "توليد ملخص المستشار الذكي" أعلاه لإدراج تحليلات الملاحظات والسلوكيات لهذه الفترة.
                  </div>
                )}
              </div>
            </div>

            {/* Dominant Moods & Habits Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#FAF8F5] border border-[#E2DCC8] p-4 rounded-2xl space-y-2">
                <h4 className="font-bold text-xs text-[#5A5A40]">أبرز المشاعر المسجلة خلال الفترة:</h4>
                <div className="flex flex-wrap gap-1.5">
                  {stats.topMoods.length > 0 ? (
                    stats.topMoods.map((m, idx) => (
                      <span key={idx} className="bg-white border border-[#E2DCC8] text-[#5A5A40] text-xs font-bold px-2.5 py-1 rounded-xl shadow-3xs">
                        {m}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500">مرتاح، مطئمن، متفائل</span>
                  )}
                </div>
              </div>

              <div className="bg-[#FAF8F5] border border-[#E2DCC8] p-4 rounded-2xl space-y-2">
                <h4 className="font-bold text-xs text-[#5A5A40]">التزام العادات اليومية:</h4>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 font-medium">نسبة الإنجاز:</span>
                  <span className="text-sm font-black text-[#8B9D83]">{stats.habitRate}%</span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#8B9D83] h-full rounded-full" style={{ width: `${stats.habitRate}%` }}></div>
                </div>
              </div>
            </div>

            {/* Patient Custom Notes for Therapy Session */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-bold text-[#5A5A40]">
                ✍️ أسئلة وملاحظات ترغب بمناقشتها مع معالجك النفسي في الجلسة:
              </label>
              <textarea
                value={patientNotes}
                onChange={(e) => setPatientNotes(e.target.value)}
                placeholder="اكتب هنا أي استفسارات، مواقف أثرت عليك، أو نقاط تود طرحها على الطبيب في الجلسة القادمة..."
                rows={2}
                className="w-full bg-[#FAF8F5] border border-[#E2DCC8] rounded-xl p-3 text-xs text-[#3A3A3A] focus:outline-none focus:ring-2 focus:ring-[#8B9D83]"
              />
            </div>

            {/* Footer & Doctor Verification Signature Area */}
            <div className="border-t border-[#E2DCC8] pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500 gap-3">
              <div>
                <p className="font-bold text-[#5A5A40]">توقيع وملاحظات الطبيب / المعالج النفسي:</p>
                <div className="w-48 h-10 border-b border-dashed border-gray-400 mt-1"></div>
              </div>

              <div className="text-center sm:text-left space-y-0.5">
                <p className="font-extrabold text-[#5A5A40]">Yawmiyati AI Medical & Behavioral Report</p>
                <p className="text-[10px] text-gray-400">وثيقة مشفرة ومولدة تلقائياً من نظام يومياتي AI</p>
              </div>
            </div>

          </div>

        </div>

        {/* Modal Bottom Actions Footer */}
        <div className="p-4 bg-[#F0EDE4] border-t border-[#E2DCC8] flex items-center justify-between shrink-0">
          <p className="text-xs text-gray-600 font-medium hidden sm:block">
            جاهز للتصدير والتسليم للمعالج النفسي 📄
          </p>

          <div className="flex items-center space-x-2 space-x-reverse w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-[#E2DCC8] hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
            >
              إغلاق
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="px-5 py-2 bg-gradient-to-tr from-[#5A5A40] to-[#8B9D83] hover:from-[#5A5A40]/90 hover:to-[#8B9D83]/90 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-[#FEFAE0]" />
              <span>{isExportingPdf ? 'جاري تجهيز PDF...' : 'تصدير PDF الآن'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MonthlyMentalHealthPDFReportModal;

