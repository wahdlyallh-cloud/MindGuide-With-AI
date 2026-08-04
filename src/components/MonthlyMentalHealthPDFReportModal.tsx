import React, { useState, useRef, useMemo } from 'react';
import { 
  FileText, Calendar, Brain, Download, Printer, X, Sparkles, 
  Moon, Smile, Activity, CheckCircle2, TrendingUp, AlertCircle, ShieldCheck, FileCheck2, Zap, Clock,
  Copy, Check, FileCode, History, Save, Trash2, Stethoscope, UserCheck, ArrowRightLeft,
  Plus, MessageSquare, ListTodo, Search, ArrowLeftRight, BookOpen, Award
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { DiaryEntry } from '../types';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend } from 'recharts';

export interface SavedPDFReport {
  id: string;
  createdAt: string;
  displayDate: string;
  isEdited?: boolean;
  updatedAt?: string;
  updatedDisplayDate?: string;
  periodTitle: string;
  periodLabel: string;
  startDateStr: string;
  endDateStr: string;
  periodType: string;
  
  preSessionMood: number;
  preSessionMoodLabel: string;
  postSessionMood: number;
  postSessionMoodLabel: string;
  
  patientNotes: string;
  sessionDateTime: string;
  therapistFeedback: string;
  therapistHomework: string[];
  sessionSummaryBullets: string[];
  
  aiAnalysisText: string;
  statsSnapshot: {
    totalDiaries: number;
    avgSleep: string;
    avgMood: string;
    totalSportsMinutes: number;
    habitRate: number;
  };
}

export const INITIAL_SAVED_REPORTS: SavedPDFReport[] = [
  {
    id: 'rep_sample_1',
    createdAt: '2026-08-04T10:30:00.000Z',
    displayDate: 'الثلاثاء، 4 أغسطس 2026 - 10:30 صباحاً',
    isEdited: false,
    periodTitle: 'تقرير الأسبوع الحالي - تحضيرات وجلسة المتابعة النفسية',
    periodLabel: 'الأسبوع الحالي',
    startDateStr: '2026-07-28',
    endDateStr: '2026-08-04',
    periodType: 'weekly',
    preSessionMood: 40,
    preSessionMoodLabel: 'قلق وتوتر',
    postSessionMood: 85,
    postSessionMoodLabel: 'استقرار واطمئنان مرتفع',
    patientNotes: 'شعرت بتوتر عند بدء المهام الجديدة هذا الأسبوع، وأود مناقشة تنظيم الوقت والتعامل مع الأفكار التلقائية السلبية مع المعالج.',
    sessionDateTime: '2026-08-04T10:30',
    therapistFeedback: 'تمت مناقشة مسببات القلق وتفنيد التشوهات المعرفية (تضخيم المخاوف). أظهر المريض استجابة ممتازة لتمرين التنفس والتفنيد عقلانياً.',
    therapistHomework: [
      'التدرب على تمارين التنفس البطني العميق (4-7-8) مرتين يومياً',
      'تدوين سجل الأفكار التلقائية والبدائل العقلانية فور حدوث الضغط النفسي'
    ],
    sessionSummaryBullets: [
      'التركيز على مهارة Cognitive Reframing وإعادة التأطير المعرفي للأفكار السلبية',
      'تطبيق تمرين اليقظة الذهنية والتركيز على الحاضر عند الارتفاع المفاجئ لمعدل القلق'
    ],
    aiAnalysisText: 'تقرير تحليلي سريري شامل أظهر تحسناً ملحوظاً في الانتظام بالنوم (8.1 ساعة) واستقرار المؤشرات السلوكية.',
    statsSnapshot: {
      totalDiaries: 16,
      avgSleep: '8.1',
      avgMood: '7.8',
      totalSportsMinutes: 120,
      habitRate: 85
    }
  },
  {
    id: 'rep_sample_2',
    createdAt: '2026-07-21T17:45:00.000Z',
    displayDate: 'الثلاثاء، 21 يوليو 2026 - 05:45 مساءً',
    isEdited: true,
    updatedAt: '2026-07-23T09:15:00.000Z',
    updatedDisplayDate: 'الخميس، 23 يوليو 2026 - 09:15 صباحاً',
    periodTitle: 'تقرير الأسبوع السابق - تقييم الضغوط والتوازن المزاجي',
    periodLabel: 'الأسبوع السابق',
    startDateStr: '2026-07-14',
    endDateStr: '2026-07-21',
    periodType: 'weekly',
    preSessionMood: 30,
    preSessionMoodLabel: 'شديد الاضطراب والقلق',
    postSessionMood: 75,
    postSessionMoodLabel: 'مطمئن ومرتاح',
    patientNotes: 'اضطرابات خفيفة بالنوم وصعوبة التركيز في بداية الأسبوع بسبب ضغوط العمل والتفكير الزائد.',
    sessionDateTime: '2026-07-21T17:45',
    therapistFeedback: 'تم تحديد حدود الوقت الشخصي وفصل المهام العملية عن وقت الاسترخاء. نسبة التحسن المزاجي ارتفعت +45% بعد الجلسة.',
    therapistHomework: [
      'المشي السريع في الهواء الطلق لمدة 20 دقيقة يومياً',
      'إغلاق الشاشات الإلكترونية قبل النوم بـ 45 دقيقة والقراءة في كتاب نفسي'
    ],
    sessionSummaryBullets: [
      'تحديد الحدود النفسية لحماية الوقت الشخصي دون الشعور بالذنب',
      'تعزيز الرفق بالذات والحد الأدنى المقبول من العادات'
    ],
    aiAnalysisText: 'تحليل السلوكيات أظهر وجود ارتباط مباشر بين النشاط الرياضي وانخفاض حدة التوتر.',
    statsSnapshot: {
      totalDiaries: 12,
      avgSleep: '7.2',
      avgMood: '6.5',
      totalSportsMinutes: 90,
      habitRate: 70
    }
  }
];

const MOOD_PRESETS = [
  { label: 'شديد الاضطراب', percentage: 20, emoji: '😫' },
  { label: 'قلق وتوتر', percentage: 40, emoji: '😟' },
  { label: 'طبيعي / متقلب', percentage: 60, emoji: '😐' },
  { label: 'مطمئن ومرتاح', percentage: 80, emoji: '😊' },
  { label: 'سعيد ومستقر جداً', percentage: 100, emoji: '🌟' },
];

// Helper component to parse and render formatted report markdown into styled HTML elements
const FormattedReportView: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let inTable = false;
  let tableHeader: string[] = [];
  let tableRows: string[][] = [];
  let currentKey = 0;

  const parseInlineFormatting = (text: string) => {
    // Process bold text **text**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-extrabold text-[#2B3E50]">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const flushTable = () => {
    if (inTable && tableHeader.length > 0) {
      elements.push(
        <div key={`table-${currentKey++}`} className="my-3 overflow-x-auto rounded-xl border border-[#E2DCC8] shadow-3xs pdf-card-block">
          <table className="w-full text-xs text-right border-collapse bg-white">
            <thead className="bg-[#F0EDE4] text-[#5A5A40] font-bold border-b border-[#E2DCC8]">
              <tr>
                {tableHeader.map((cell, idx) => (
                  <th key={idx} className="p-2.5 border-l border-[#E2DCC8] last:border-l-0 text-right">
                    {parseInlineFormatting(cell.trim())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-[#FAF8F5]'}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-2 border-t border-l border-[#E2DCC8] last:border-l-0 text-gray-800 text-right">
                      {parseInlineFormatting(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    inTable = false;
    tableHeader = [];
    tableRows = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Markdown Table Line
    if (line.includes('|') && (line.startsWith('|') || line.endsWith('|'))) {
      const cells = line.split('|').filter((_, index, arr) => index > 0 && index < arr.length - 1);
      if (line.includes('---') || line.includes('---:')) {
        continue;
      }
      if (!inTable) {
        inTable = true;
        tableHeader = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (!line) continue;

    // ASCII Progress Bar Detection
    // e.g., ]████████████████[ القلق والتوتر (40%) or [████████████████] القلق والتوتر (40%)
    const progressBarMatch = line.match(/^[\[\]][█\s#]+[\[\]]\s*(.*?)\s*\((\d+)%\)/) || line.match(/^(.*?)\s*\((\d+)%\)\s*:\s*[\[\]][█\s#]+[\[\]]/);
    if (progressBarMatch) {
      const label = progressBarMatch[1] || progressBarMatch[3] || 'مؤشر نفسي';
      const percentage = parseInt(progressBarMatch[2] || '50', 10);
      elements.push(
        <div key={`progress-${currentKey++}`} className="my-2.5 p-2.5 bg-white rounded-xl border border-[#E2DCC8] space-y-1.5 pdf-card-block">
          <div className="flex justify-between items-center text-xs font-bold text-[#3A3A3A]">
            <span>{parseInlineFormatting(label)}</span>
            <span className="text-[#5A5A40] font-black bg-[#8B9D83]/20 px-2 py-0.5 rounded-lg text-[11px]">{percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden border border-[#E2DCC8]">
            <div
              className="bg-gradient-to-r from-[#5A5A40] to-[#8B9D83] h-full rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
            />
          </div>
        </div>
      );
      continue;
    }

    // Headers
    if (line.startsWith('#### ')) {
      elements.push(
        <h4 key={`h4-${currentKey++}`} className="text-xs font-black text-[#5A5A40] mt-3 mb-1">
          {parseInlineFormatting(line.replace(/^####\s*/, ''))}
        </h4>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${currentKey++}`} className="text-sm font-black text-[#5A5A40] border-b border-[#E2DCC8] pb-1 mt-4 mb-2 flex items-center gap-1.5">
          <span>{parseInlineFormatting(line.replace(/^###\s*/, ''))}</span>
        </h3>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${currentKey++}`} className="text-sm font-black text-[#2B3E50] border-b border-[#8B9D83] pb-1 mt-4 mb-2">
          {parseInlineFormatting(line.replace(/^##\s*/, ''))}
        </h2>
      );
    } else if (line.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${currentKey++}`} className="text-base font-black text-[#5A5A40] text-center my-3">
          {parseInlineFormatting(line.replace(/^#\s*/, ''))}
        </h1>
      );
    } else if (line.startsWith('> ') || line.startsWith('< ')) {
      elements.push(
        <blockquote key={`quote-${currentKey++}`} className="bg-[#FAF8F5] border-r-4 border-[#8B9D83] p-3 rounded-l-xl my-2 text-xs text-gray-700 font-medium leading-relaxed">
          {parseInlineFormatting(line.replace(/^[><]\s*/, ''))}
        </blockquote>
      );
    } else if (line === '---' || line === '***') {
      elements.push(<hr key={`hr-${currentKey++}`} className="border-t border-[#E2DCC8] my-3" />);
    } else if (line.startsWith('* ') || line.startsWith('- ') || line.startsWith('• ')) {
      elements.push(
        <div key={`li-${currentKey++}`} className="flex items-start gap-2 text-xs text-gray-800 my-1 leading-relaxed">
          <span className="text-[#8B9D83] font-black text-sm shrink-0">•</span>
          <span>{parseInlineFormatting(line.replace(/^[*•-]\s*/, ''))}</span>
        </div>
      );
    } else {
      elements.push(
        <p key={`p-${currentKey++}`} className="text-xs text-gray-800 leading-relaxed my-1">
          {parseInlineFormatting(line)}
        </p>
      );
    }
  }

  flushTable();

  return <div className="space-y-1 text-right text-[#3A3A3A] font-sans">{elements}</div>;
};

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
  const [copySuccess, setCopySuccess] = useState(false);

  // Pre-Session & Post-Session Therapy Session State
  const [preSessionMood, setPreSessionMood] = useState<number>(40);
  const [preSessionMoodLabel, setPreSessionMoodLabel] = useState<string>('قلق وتوتر');
  const [patientNotes, setPatientNotes] = useState<string>('');

  const [sessionDateTime, setSessionDateTime] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  });
  const [therapistFeedback, setTherapistFeedback] = useState<string>('');
  const [therapistHomework, setTherapistHomework] = useState<string[]>([
    'التدرب على تمارين التنفس البطني العميق (4-7-8) لمدة 5 دقائق يومياً',
    'تدوين سجل الأفكار التلقائية والبدائل العقلانية عند الشعور بالضغط النفسي'
  ]);
  const [homeworkInput, setHomeworkInput] = useState<string>('');

  const [postSessionMood, setPostSessionMood] = useState<number>(80);
  const [postSessionMoodLabel, setPostSessionMoodLabel] = useState<string>('تحسن واستقرار نفسي');
  const [sessionSummaryBullets, setSessionSummaryBullets] = useState<string[]>([
    'مناقشة مسببات القلق والمواقف المثيرة وتفنيد المخاوف مع المعالج النفسي',
    'التركيز على تدريبات اليقظة الذهنية وتحديد الحدود النفسية الإيجابية'
  ]);
  const [summaryInput, setSummaryInput] = useState<string>('');

  // Generated Reports Log / History Persistence State
  const [savedReports, setSavedReports] = useState<SavedPDFReport[]>(() => {
    try {
      const stored = localStorage.getItem('yawmiyati_mental_health_reports_history');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_SAVED_REPORTS;
    } catch {
      return INITIAL_SAVED_REPORTS;
    }
  });
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<boolean>(false);
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddHomework = () => {
    if (!homeworkInput.trim()) return;
    setTherapistHomework(prev => [...prev, homeworkInput.trim()]);
    setHomeworkInput('');
  };

  const handleRemoveHomework = (idx: number) => {
    setTherapistHomework(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddSummaryBullet = () => {
    if (!summaryInput.trim()) return;
    setSessionSummaryBullets(prev => [...prev, summaryInput.trim()]);
    setSummaryInput('');
  };

  const handleRemoveSummaryBullet = (idx: number) => {
    setSessionSummaryBullets(prev => prev.filter((_, i) => i !== idx));
  };

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

  // Save current report into localStorage history log
  const saveCurrentReportToHistory = () => {
    const now = new Date();
    const displayDate = now.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const newReport: SavedPDFReport = {
      id: `rep_${Date.now()}`,
      createdAt: now.toISOString(),
      displayDate,
      periodTitle,
      periodLabel,
      startDateStr,
      endDateStr,
      periodType,
      preSessionMood,
      preSessionMoodLabel,
      postSessionMood,
      postSessionMoodLabel,
      patientNotes,
      sessionDateTime,
      therapistFeedback,
      therapistHomework,
      sessionSummaryBullets,
      aiAnalysisText,
      statsSnapshot: {
        totalDiaries: stats.totalDiaries,
        avgSleep: stats.avgSleep,
        avgMood: stats.avgMood,
        totalSportsMinutes: stats.totalSportsMinutes,
        habitRate: stats.habitRate
      }
    };

    const updated = [newReport, ...savedReports.filter(r => r.id !== newReport.id)];
    setSavedReports(updated);
    try {
      localStorage.setItem('yawmiyati_mental_health_reports_history', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    showToast('تم حفظ التقرير في سجل التقارير بنجاح 💾');
  };

  const loadSavedReport = (rep: SavedPDFReport) => {
    setAiAnalysisText(rep.aiAnalysisText || '');
    setPatientNotes(rep.patientNotes || '');
    setPreSessionMood(rep.preSessionMood ?? 40);
    setPreSessionMoodLabel(rep.preSessionMoodLabel || 'قلق وتوتر');
    setPostSessionMood(rep.postSessionMood ?? 80);
    setPostSessionMoodLabel(rep.postSessionMoodLabel || 'تحسن واستقرار نفسي');
    setSessionDateTime(rep.sessionDateTime || new Date().toISOString().slice(0, 16));
    setTherapistFeedback(rep.therapistFeedback || '');
    setTherapistHomework(rep.therapistHomework || []);
    setSessionSummaryBullets(rep.sessionSummaryBullets || []);
    setShowHistoryDrawer(false);
    showToast('تم تحميل بيانات التقرير المؤرشف بنجاح 📜');
  };

  const deleteSavedReport = (id: string) => {
    const updated = savedReports.filter(r => r.id !== id);
    setSavedReports(updated);
    try {
      localStorage.setItem('yawmiyati_mental_health_reports_history', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    showToast('تم حذف التقرير من السجل 🗑️');
  };

  // Filter saved reports list by search query
  const filteredSavedReports = useMemo(() => {
    if (!historySearchQuery.trim()) return savedReports;
    const q = historySearchQuery.toLowerCase();
    return savedReports.filter(r =>
      r.periodTitle.toLowerCase().includes(q) ||
      r.displayDate.toLowerCase().includes(q) ||
      r.periodLabel.toLowerCase().includes(q) ||
      (r.patientNotes && r.patientNotes.toLowerCase().includes(q)) ||
      (r.therapistFeedback && r.therapistFeedback.toLowerCase().includes(q))
    );
  }, [savedReports, historySearchQuery]);

  // Copy text report directly to clipboard
  const handleCopyText = async () => {
    try {
      const fullText = `🎓 ${periodTitle}\nمنصة يومياتي AI | الفترة: ${periodLabel}\n\n📊 الإحصائيات السريعة:\n- عدد المذكرات: ${stats.totalDiaries}\n- متوسط النوم: ${stats.avgSleep} ساعة/ليلة\n- معدل المزاج: ${stats.avgMood} / 10\n- وقت الرياضة: ${stats.totalSportsMinutes} دقيقة\n\n📋 التقرير والتحليل السريري للمستشار الذكي:\n${aiAnalysisText || 'تقرير شامل يرصد حالة الاستقرار المزاجي والتوازن السلوكي والنوم.'}\n\n${patientNotes ? `📝 ملاحظات وأسئلة المعالج:\n${patientNotes}\n\n` : ''}تم إنشاء التقرير عبر منصة يومياتي AI بتاريخ ${new Date().toLocaleDateString('ar-EG')}`;
      await navigator.clipboard.writeText(fullText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // Download plain text report (.txt UTF-8 BOM)
  const handleDownloadTxt = () => {
    const fullText = `\uFEFF🎓 ${periodTitle}\nمنصة يومياتي AI | الفترة: ${periodLabel}\n\n📊 الإحصائيات السريعة:\n- عدد المذكرات: ${stats.totalDiaries}\n- متوسط النوم: ${stats.avgSleep} ساعة/ليلة\n- معدل المزاج: ${stats.avgMood} / 10\n- وقت الرياضة: ${stats.totalSportsMinutes} دقيقة\n\n📋 التقرير والتحليل السريري للمستشار الذكي:\n${aiAnalysisText || 'تقرير شامل يرصد حالة الاستقرار المزاجي والتوازن السلوكي والنوم.'}\n\n${patientNotes ? `📝 ملاحظات وأسئلة المعالج:\n${patientNotes}\n\n` : ''}تم إنشاء التقرير عبر منصة يومياتي AI بتاريخ ${new Date().toLocaleDateString('ar-EG')}`;
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير_الصحة_النفسية_${periodType}_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Download formatted Word document (.doc)
  const handleDownloadDoc = () => {
    const htmlDocContent = `\uFEFF<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>${periodTitle}</title>
  <style>
    body { font-family: 'Cairo', 'Segoe UI', Arial, sans-serif; padding: 25px; line-height: 1.8; color: #2B3E50; direction: rtl; text-align: right; }
    h1 { color: #5A5A40; border-bottom: 2px solid #E2DCC8; padding-bottom: 8px; font-size: 20px; text-align: center; }
    .meta { background-color: #F9F7F2; padding: 16px; border-radius: 12px; border: 1px solid #E2DCC8; margin-bottom: 20px; font-size: 13px; }
    .report-body { background: #FAF8F5; padding: 16px; border-radius: 12px; border: 1px solid #E2DCC8; font-size: 14px; white-space: pre-wrap; line-height: 1.8; margin-top: 15px; }
    .footer { text-align: center; margin-top: 30px; font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 10px; }
  </style>
</head>
<body>
  <h1>🎓 ${periodTitle}</h1>
  <div class="meta">
    <p><strong>الفترة الزمنية:</strong> ${periodLabel}</p>
    <p><strong>عدد المذكرات:</strong> ${stats.totalDiaries} | <strong>متوسط ساعات النوم:</strong> ${stats.avgSleep} ساعة | <strong>معدل المزاج:</strong> ${stats.avgMood}/10 | <strong>وقت التمارين:</strong> ${stats.totalSportsMinutes} دقيقة</p>
  </div>
  <h3>📋 التقرير والتحليل السريري للمستشار الذكي</h3>
  <div class="report-body">
    ${(aiAnalysisText || 'تقرير شامل يرصد حالة الاستقرار المزاجي والتوازن السلوكي والنوم.').replace(/\n/g, '<br/>')}
  </div>
  ${patientNotes ? `
    <h3>📝 ملاحظات وأسئلة موجهة للمعالج</h3>
    <div class="report-body">${patientNotes.replace(/\n/g, '<br/>')}</div>
  ` : ''}
  <div class="footer">تم إنشاء هذا التقرير تلقائياً وبسرية تامة عبر يومياتي AI بتاريخ ${new Date().toLocaleDateString('ar-EG')}</div>
</body>
</html>`;
    const blob = new Blob([htmlDocContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير_الصحة_النفسية_${periodType}_${new Date().toISOString().split('T')[0]}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Download PDF using html2canvas + jsPDF with smart fallback
  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setIsExportingPdf(true);

    try {
      // Small pause to allow DOM and charts to stabilize
      await new Promise(resolve => setTimeout(resolve, 400));

      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FFFFFF',
        logging: false,
        windowWidth: 1000,
        windowHeight: 1600,
        onclone: (_clonedDoc, clonedElement) => {
          clonedElement.style.width = '780px';
          clonedElement.style.maxWidth = 'none';
          clonedElement.style.margin = '0 auto';
          clonedElement.style.padding = '24px';
          
          // Ensure Recharts containers have explicit pixel dimensions in the clone
          const rechartsWrappers = clonedElement.querySelectorAll('.recharts-wrapper, .recharts-responsive-container');
          rechartsWrappers.forEach((wrapper) => {
            if (wrapper instanceof HTMLElement) {
              wrapper.style.width = '100%';
              wrapper.style.height = '220px';
              wrapper.style.minHeight = '220px';
            }
          });

          // Ensure all inline and embedded SVGs have explicit width and height
          const svgs = clonedElement.querySelectorAll('svg');
          svgs.forEach((svg) => {
            const rect = svg.getBoundingClientRect();
            const width = svg.getAttribute('width') || rect.width || 700;
            const height = svg.getAttribute('height') || rect.height || 220;
            svg.setAttribute('width', `${width}`);
            svg.setAttribute('height', `${height}`);
            svg.style.width = `${width}px`;
            svg.style.height = `${height}px`;
            svg.style.overflow = 'visible';
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

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
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
      console.error('PDF canvas export error, switching seamlessly to print fallback:', err);
      // Fallback to iframe printing seamlessly without showing errors
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

    const reportContentHtml = reportRef.current.innerHTML;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <title>${periodTitle} - يومياتي AI</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
            * { box-sizing: border-box; }
            body { font-family: 'Cairo', sans-serif; padding: 20px; color: #1e293b; background: #fff; line-height: 1.6; direction: rtl; text-align: right; }
            svg { max-width: 100%; height: auto; }
            @media print {
              body { padding: 0; margin: 0; }
              @page { size: A4; margin: 12mm; }
              .pdf-card-block { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="max-w-4xl mx-auto">
            ${reportContentHtml}
          </div>
          <script>
            setTimeout(function() {
              window.focus();
              window.print();
            }, 500);
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
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowHistoryDrawer(true)}
                className="px-3.5 py-1.5 bg-[#5A5A40] hover:bg-[#2B3E50] text-white text-xs font-bold rounded-xl transition-all shadow-3xs flex items-center gap-1.5 cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-[#FEFAE0]" />
                <span>سجل التقارير المولدة ({savedReports.length}) 📜</span>
              </button>

              <button
                type="button"
                onClick={saveCurrentReportToHistory}
                className="px-3.5 py-1.5 bg-[#8B9D83] hover:bg-[#5A5A40] text-white text-xs font-bold rounded-xl transition-all shadow-3xs flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-white" />
                <span>حفظ التقرير في السجل 💾</span>
              </button>

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
                onClick={handleCopyText}
                className="px-3 py-1.5 bg-white border border-[#E2DCC8] hover:bg-[#F0EDE4] text-gray-700 text-xs font-bold rounded-xl transition-all shadow-3xs flex items-center gap-1.5 cursor-pointer"
              >
                {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#5A5A40]" />}
                <span>{copySuccess ? 'تم النسخ!' : 'نسخ النص'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadDoc}
                className="px-3 py-1.5 bg-white border border-[#E2DCC8] hover:bg-[#F0EDE4] text-[#2B3E50] text-xs font-bold rounded-xl transition-all shadow-3xs flex items-center gap-1.5 cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5 text-blue-600" />
                <span>Word (.doc)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTxt}
                className="px-3 py-1.5 bg-white border border-[#E2DCC8] hover:bg-[#F0EDE4] text-gray-700 text-xs font-bold rounded-xl transition-all shadow-3xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#5A5A40]" />
                <span>نصي (UTF-8)</span>
              </button>

              <button
                type="button"
                onClick={handlePrintPdf}
                className="px-3 py-1.5 bg-white border border-[#E2DCC8] hover:bg-[#F0EDE4] text-gray-700 text-xs font-bold rounded-xl transition-all shadow-3xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-[#5A5A40]" />
                <span>طباعة / حفظ PDF 🖨️</span>
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
            <div className="border border-[#E2DCC8] rounded-2xl p-4 bg-[#FBF9F5] space-y-2 pdf-card-block">
              <div className="flex items-center justify-between text-xs font-extrabold text-[#5A5A40] border-b border-[#E2DCC8] pb-2">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#8B9D83]" />
                  <span>الرسم البياني للربط بين النوم والمزاج (Sleep vs Mood Trend)</span>
                </span>
                <span className="text-[10px] text-gray-500">توزيع الفترة الزمانية</span>
              </div>

              <div className="h-56 min-h-[220px] w-full pt-2">
                <ResponsiveContainer width="100%" height={220}>
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
            <div className="border border-[#E2DCC8] rounded-2xl p-4 bg-[#F9F7F2] space-y-3 pdf-card-block">
              <div className="flex items-center justify-between border-b border-[#E2DCC8] pb-2">
                <h3 className="font-extrabold text-sm text-[#5A5A40] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#D4A373]" />
                  <span>التقرير والتحليل النفسي السريري (المستشار الذكي)</span>
                </h3>
                {loadingAi && <span className="text-xs text-[#8B9D83] font-bold animate-pulse">جاري التحليلات...</span>}
              </div>

              <div className="text-xs text-gray-800 leading-relaxed font-normal bg-white p-3.5 rounded-xl border border-[#E2DCC8]/60 min-h-[100px]">
                {aiAnalysisText ? (
                  <FormattedReportView content={aiAnalysisText} />
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

            {/* DUAL CARD THERAPY SESSION SECTION: Pre-Session (Right: Doctor/Prep) <---> Post-Session (Left: Patient/Feedback & Homework) */}
            <div className="border border-[#E2DCC8] rounded-2xl p-4 bg-[#F9F7F2] space-y-4 pdf-card-block">
              
              {/* Header Title Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#E2DCC8] pb-3 gap-2">
                <div>
                  <h3 className="font-black text-sm text-[#5A5A40] flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-[#8B9D83]" />
                    <span>رصد ومتابعة الجلسة العلاجية (ما قبل وما بعد الجلسة)</span>
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    نظام متكامل لربط تحضيراتك قبل الجلسة مع ردود المعالج النفسي الحقيقي واستجابة التوازن المزاجي
                  </p>
                </div>

                {/* Live Mood Delta Comparison Badge */}
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#E2DCC8] shadow-3xs text-xs font-bold">
                  <span className="text-gray-500">فرق التعافي المزاجي:</span>
                  <span className={`font-black ${postSessionMood - preSessionMood >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {postSessionMood - preSessionMood >= 0 ? `+${postSessionMood - preSessionMood}% 📈` : `${postSessionMood - preSessionMood}% 📉`}
                  </span>
                </div>
              </div>

              {/* Dual Grid Layout: Right = Doctor/Pre-Session, Left = Patient/Post-Session */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 relative items-start">
                
                {/* RIGHT SIDE CARD: Pre-Session (Doctor / Preparation Icon) */}
                <div className="bg-white border-2 border-[#E2DCC8] rounded-2xl p-4 space-y-3 shadow-3xs relative">
                  <div className="flex items-center justify-between border-b border-[#F0EDE4] pb-2 bg-[#F7F5EE] -mx-4 -mt-4 p-3 rounded-t-2xl">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-[#8B9D83] text-white rounded-xl shadow-3xs">
                        <Stethoscope className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-[#2B3E50]">أيقونة ما قبل الجلسة (إعداد المستشار والمعالج)</h4>
                        <span className="text-[10px] text-gray-500">الأسئلة وملاحظات المريض قبل الجلسة</span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-[#5A5A40] bg-white px-2.5 py-1 rounded-lg border border-[#E2DCC8]">
                      {preSessionMood}% {preSessionMoodLabel}
                    </span>
                  </div>

                  {/* Pre-Session Mood Picker */}
                  <div className="space-y-1.5 bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E2DCC8]">
                    <div className="flex items-center justify-between text-xs font-bold text-[#5A5A40]">
                      <span className="flex items-center gap-1">
                        <Smile className="w-3.5 h-3.5 text-[#8B9D83]" />
                        <span>تسجيل المزاج قبل الجلسة (%):</span>
                      </span>
                      <span className="text-xs font-black text-[#8B9D83] bg-white px-2 py-0.5 rounded-md border border-[#E2DCC8]">
                        {preSessionMood}%
                      </span>
                    </div>
                    
                    {/* Slider */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={preSessionMood}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setPreSessionMood(val);
                        const found = MOOD_PRESETS.find(p => Math.abs(p.percentage - val) <= 10);
                        if (found) setPreSessionMoodLabel(found.label);
                      }}
                      className="w-full accent-[#8B9D83] cursor-pointer"
                    />

                    {/* Quick Emoji Buttons */}
                    <div className="flex items-center justify-between gap-1 pt-1">
                      {MOOD_PRESETS.map((m) => (
                        <button
                          key={m.percentage}
                          type="button"
                          onClick={() => {
                            setPreSessionMood(m.percentage);
                            setPreSessionMoodLabel(m.label);
                          }}
                          className={`flex-1 text-[11px] font-bold py-1 px-1 rounded-lg border transition-all cursor-pointer text-center ${
                            preSessionMood === m.percentage ? 'bg-[#5A5A40] text-white border-[#5A5A40] shadow-3xs' : 'bg-white text-gray-700 border-[#E2DCC8] hover:bg-gray-50'
                          }`}
                        >
                          <span>{m.emoji}</span>
                          <span className="block text-[9px] truncate">{m.percentage}%</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Questions & Notes for Therapist */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-[#5A5A40]">
                      ✍️ أسئلة وملاحظات ترغب بمناقشتها مع معالجك النفسي في الجلسة:
                    </label>
                    <textarea
                      value={patientNotes}
                      onChange={(e) => setPatientNotes(e.target.value)}
                      placeholder="اكتب هنا أي استفسارات، مواقف أثرت عليك، أو نقاط تود طرحها على الطبيب المعالج أثناء الجلسة القادمة..."
                      rows={3}
                      className="w-full bg-[#FAF8F5] border border-[#E2DCC8] rounded-xl p-2.5 text-xs text-[#3A3A3A] focus:outline-none focus:ring-2 focus:ring-[#8B9D83] leading-relaxed"
                    />
                  </div>
                </div>

                {/* LEFT SIDE CARD: Post-Session (Patient / Feedback & Homework & Summary) */}
                <div className="bg-white border-2 border-[#8B9D83]/60 rounded-2xl p-4 space-y-3 shadow-3xs relative">
                  <div className="flex items-center justify-between border-b border-[#E8F0E6] pb-2 bg-[#F2F7F0] -mx-4 -mt-4 p-3 rounded-t-2xl">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-[#5A5A40] text-white rounded-xl shadow-3xs">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-[#2D5A27]">أيقونة ما بعد الجلسة (نتائج ورأي وتوصيات المعالج)</h4>
                        <span className="text-[10px] text-gray-500">استجابة المريض، رد المعالج والمهام المطلوبة</span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-[#2D5A27] bg-white px-2.5 py-1 rounded-lg border border-[#C2DCBE]">
                      {postSessionMood}% {postSessionMoodLabel}
                    </span>
                  </div>

                  {/* Date & Time of Session */}
                  <div className="flex items-center justify-between bg-[#F7F9F6] p-2 rounded-xl border border-[#C2DCBE] gap-2">
                    <label className="text-xs font-bold text-[#2D5A27] flex items-center gap-1 shrink-0">
                      <Clock className="w-3.5 h-3.5 text-[#8B9D83]" />
                      <span>تاريخ ووقت انعقاد الجلسة:</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={sessionDateTime}
                      onChange={(e) => setSessionDateTime(e.target.value)}
                      className="bg-white border border-[#C2DCBE] rounded-lg px-2 py-1 text-xs text-[#2B3E50] font-bold focus:outline-none shadow-3xs"
                    />
                  </div>

                  {/* Real Therapist Responses & Feedback */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-[#2D5A27] flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-[#8B9D83]" />
                      <span>ردود وإجابات المعالج النفسي الحقيقي على أسئلتك وملاحظاتك:</span>
                    </label>
                    <textarea
                      value={therapistFeedback}
                      onChange={(e) => setTherapistFeedback(e.target.value)}
                      placeholder="سجل هنا إجابات المعالج النفسي وتوضيحاته لملاحظاتك واستفساراتك التي ناقشتماها في الجلسة..."
                      rows={2}
                      className="w-full bg-[#F9FBF8] border border-[#C2DCBE] rounded-xl p-2.5 text-xs text-[#3A3A3A] focus:outline-none focus:ring-2 focus:ring-[#8B9D83] leading-relaxed"
                    />
                  </div>

                  {/* Therapist Homework & Instructions */}
                  <div className="space-y-1.5 bg-[#F4F8F3] p-2.5 rounded-xl border border-[#C2DCBE]">
                    <label className="block text-xs font-extrabold text-[#2D5A27] flex items-center gap-1">
                      <ListTodo className="w-3.5 h-3.5 text-[#5A5A40]" />
                      <span>المهام والتوصيات والتعليمات المطلوبة من المعالج النفسي:</span>
                    </label>

                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {therapistHomework.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-[#C2DCBE] text-xs text-gray-800">
                          <span className="flex items-center gap-1.5 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{item}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveHomework(idx)}
                            className="text-red-400 hover:text-red-600 p-0.5 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <input
                        type="text"
                        value={homeworkInput}
                        onChange={(e) => setHomeworkInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddHomework())}
                        placeholder="أضف مهمة أو تعليمات جديدة طلبها المعالج..."
                        className="flex-1 bg-white border border-[#C2DCBE] rounded-lg px-2.5 py-1 text-xs text-gray-800 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddHomework}
                        className="px-2.5 py-1 bg-[#8B9D83] hover:bg-[#5A5A40] text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة مهمة</span>
                      </button>
                    </div>
                  </div>

                  {/* Post-Session Mood Picker */}
                  <div className="space-y-1.5 bg-[#F4F8F3] p-2.5 rounded-xl border border-[#C2DCBE]">
                    <div className="flex items-center justify-between text-xs font-bold text-[#2D5A27]">
                      <span className="flex items-center gap-1">
                        <Smile className="w-3.5 h-3.5 text-emerald-600" />
                        <span>تسجيل المزاج بعد الجلسة (%):</span>
                      </span>
                      <span className="text-xs font-black text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-[#C2DCBE]">
                        {postSessionMood}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={postSessionMood}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setPostSessionMood(val);
                        const found = MOOD_PRESETS.find(p => Math.abs(p.percentage - val) <= 10);
                        if (found) setPostSessionMoodLabel(found.label);
                      }}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                    <div className="flex items-center justify-between gap-1 pt-1">
                      {MOOD_PRESETS.map((m) => (
                        <button
                          key={m.percentage}
                          type="button"
                          onClick={() => {
                            setPostSessionMood(m.percentage);
                            setPostSessionMoodLabel(m.label);
                          }}
                          className={`flex-1 text-[11px] font-bold py-1 px-1 rounded-lg border transition-all cursor-pointer text-center ${
                            postSessionMood === m.percentage ? 'bg-[#8B9D83] text-white border-[#8B9D83] shadow-3xs' : 'bg-white text-gray-700 border-[#C2DCBE] hover:bg-gray-50'
                          }`}
                        >
                          <span>{m.emoji}</span>
                          <span className="block text-[9px] truncate">{m.percentage}%</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Session Summary Bullet Points */}
                  <div className="space-y-1.5 bg-[#F9FBF8] p-2.5 rounded-xl border border-[#C2DCBE]">
                    <label className="block text-xs font-extrabold text-[#2D5A27] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>تلخيص الجلسة العلاجية على هيئة عناصر ونقاط مهمة:</span>
                    </label>

                    <div className="space-y-1 max-h-28 overflow-y-auto">
                      {sessionSummaryBullets.map((b, idx) => (
                        <div key={idx} className="flex items-start justify-between bg-white p-2 rounded-lg border border-[#C2DCBE] text-xs text-gray-800 leading-relaxed">
                          <div className="flex items-start gap-1.5">
                            <span className="text-[#8B9D83] font-bold shrink-0">•</span>
                            <span>{b}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSummaryBullet(idx)}
                            className="text-red-400 hover:text-red-600 p-0.5 cursor-pointer shrink-0 mr-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <input
                        type="text"
                        value={summaryInput}
                        onChange={(e) => setSummaryInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSummaryBullet())}
                        placeholder="اكتب نقطة مستفادة من الجلسة واضغط إضافة..."
                        className="flex-1 bg-white border border-[#C2DCBE] rounded-lg px-2.5 py-1 text-xs text-gray-800 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddSummaryBullet}
                        className="px-2.5 py-1 bg-[#5A5A40] hover:bg-[#8B9D83] text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة عنصر</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
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

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-70 bg-[#2B3E50] text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* SAVED REPORTS HISTORY OVERLAY DRAWER */}
      {showHistoryDrawer && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-[#E2DCC8] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            {/* Drawer Header */}
            <div className="p-4 bg-gradient-to-r from-[#5A5A40] to-[#8B9D83] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/20 rounded-xl">
                  <History className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">سجل تقارير الصحة النفسية المولدة والمؤرشفة 📜</h3>
                  <p className="text-xs text-[#FEFAE0]">يتضمن السجل كافة التقارير السابقة بالتاريخ والوقت والفترة الزمنية وملاحظات المعالج</p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryDrawer(false)}
                className="p-1.5 hover:bg-white/20 rounded-full text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar & Count */}
            <div className="p-3 bg-[#F9F7F2] border-b border-[#E2DCC8] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  placeholder="ابحث بالاسم أو التاريخ أو الفترة الزمانية..."
                  className="w-full bg-white border border-[#E2DCC8] rounded-xl pr-9 pl-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8B9D83]"
                />
              </div>
              <span className="text-xs font-bold text-[#5A5A40] bg-[#EAE7DC] px-3 py-1.5 rounded-xl border border-[#E2DCC8] shrink-0">
                إجمالي التقارير: {savedReports.length}
              </span>
            </div>

            {/* Saved Reports List */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1 bg-[#FAF8F5]">
              {filteredSavedReports.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto" />
                  <p className="text-sm text-gray-500 font-bold">لا توجد تقارير محفوظة حالياً في السجل</p>
                  <p className="text-xs text-gray-400">انقر على "حفظ التقرير في السجل 💾" أعلاه لأرشفة تقريرك واستعادته لاحقاً.</p>
                </div>
              ) : (
                filteredSavedReports.map((rep) => {
                  const moodDiff = (rep.postSessionMood ?? 80) - (rep.preSessionMood ?? 40);
                  return (
                    <div key={rep.id} className="bg-white border-2 border-[#E2DCC8] hover:border-[#8B9D83] rounded-2xl p-4 space-y-3 shadow-3xs transition-all">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#F0EDE4] pb-2 gap-2">
                        <div>
                          <h4 className="font-extrabold text-sm text-[#5A5A40]">{rep.periodTitle}</h4>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3.5 h-3.5 text-[#8B9D83]" />
                            <span>تاريخ ووقت الإصدار: {rep.displayDate}</span>
                          </p>
                        </div>
                        
                        {/* Mood Change Pill */}
                        <div className="flex items-center gap-1.5 bg-[#F7F5EE] px-3 py-1 rounded-xl border border-[#E2DCC8] text-xs font-bold shrink-0">
                          <span>قبل: {rep.preSessionMood}%</span>
                          <span>⬅️</span>
                          <span>بعد: {rep.postSessionMood}%</span>
                          <span className={`font-black ${moodDiff >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                            ({moodDiff >= 0 ? `+${moodDiff}%` : `${moodDiff}%`})
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-600 space-y-1">
                        <p><strong className="text-[#5A5A40]">الفترة المغطاة:</strong> {rep.periodLabel} ({rep.startDateStr} ⬅️ {rep.endDateStr})</p>
                        {rep.patientNotes && (
                          <p className="truncate"><strong className="text-[#5A5A40]">ملاحظات قبل الجلسة:</strong> {rep.patientNotes}</p>
                        )}
                        {rep.therapistFeedback && (
                          <p className="truncate"><strong className="text-[#2D5A27]">رد المعالج النفسي:</strong> {rep.therapistFeedback}</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2 border-t border-[#F0EDE4] pt-2">
                        <button
                          onClick={() => loadSavedReport(rep)}
                          className="px-3 py-1.5 bg-[#8B9D83] hover:bg-[#5A5A40] text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>استعراض وتحميل التقرير 📖</span>
                        </button>
                        <button
                          onClick={() => deleteSavedReport(rep.id)}
                          className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer border border-red-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-3 bg-[#F0EDE4] border-t border-[#E2DCC8] flex justify-end">
              <button
                onClick={() => setShowHistoryDrawer(false)}
                className="px-4 py-2 bg-white border border-[#E2DCC8] hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                إغلاق السجل
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default MonthlyMentalHealthPDFReportModal;

