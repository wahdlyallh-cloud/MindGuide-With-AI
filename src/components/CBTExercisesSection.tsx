import React, { useState } from 'react';
import { 
  Brain, 
  Plus, 
  Trash2, 
  Check, 
  Sparkles, 
  ArrowDown, 
  Archive, 
  Layers, 
  Compass, 
  Clock, 
  TrendingDown, 
  ShieldCheck, 
  Activity, 
  Eye, 
  Hand, 
  Volume2, 
  Smile, 
  HelpCircle, 
  ChevronRight, 
  ChevronLeft, 
  RefreshCw,
  BarChart2,
  FileText,
  Copy,
  AlertTriangle,
  Lightbulb,
  Heart,
  BookOpen,
  Zap,
  Info
} from 'lucide-react';
import { DiaryEntry, CBTWorksheet } from '../types';

interface CBTExercisesSectionProps {
  diaries: DiaryEntry[];
  selectedDate: string;
  handleUpdateHabit: (type: 'sleep' | 'sports' | 'medication' | 'water' | 'fastMood' | 'symptoms' | 'cbt', value: any) => void;
  isDarkMode?: boolean;
}

// List of standard Cognitive Distortions with descriptions & Arabic labels
const COGNITIVE_DISTORTIONS = [
  { id: 'catastrophizing', name: '🌋 التهويل المفرط (Catastrophizing)', desc: 'توقع السيناريو الكارثي الأسوأ وتضخيم الأخطار بشكل مبالغ فيه.' },
  { id: 'mind_reading', name: '🔮 القراءة الذهنية (Mind Reading)', desc: 'افتراض معرفة ما يفكر فيه الآخرون عنك سلباً دون وجود أدلة.' },
  { id: 'all_or_nothing', name: '🌗 التفكير الاستقطابي (All or Nothing)', desc: 'رؤية الأمور باللون الأبيض أو الأسود فقط؛ إما نجاح تام أو إخفاق كامل.' },
  { id: 'overgeneralization', name: '📢 التعميم الخاطئ (Overgeneralization)', desc: 'استخلاص قاعدة دائمة سلباً من موقف فردي واحد ("دائماً أتعرض لهذا").' },
  { id: 'mental_filter', name: '💧 الترشيح السلبي (Mental Filter)', desc: 'التركيز التام على السلبيات وتجاهل كل الأمور الإيجابية المصاحبة.' },
  { id: 'should_statements', name: '⚖️ الإلزاميات "يجب/ينبغي" (Should Statements)', desc: 'فرض قوالب وشروط صارمة غير مرنة على الذات والآخرين تقود للذنب أو الغضب.' },
  { id: 'personalization', name: '🎯 الشخصنة (Personalization)', desc: 'تحميل الذات مسؤولية أحداث خارجة عن الإرادة أو فسير مواقف الآخرين كاستهداف شخصي.' },
  { id: 'emotional_reasoning', name: '🎭 التفكير العاطفي (Emotional Reasoning)', desc: 'اعتبار شعورك الداخلي حقيقة موضوعية ("أنا أشعر بالخوف إذاً الموقف خطر جداً").' }
];

// Pre-built coping cards
const PREBUILT_COPING_CARDS = [
  { id: 'c1', category: 'anxiety', title: 'الأفكار ليست حقائق', text: 'مجرد ظهور الفكرة في ذهني لا يعني أنها حقيقة واقعة. الأفكار مجرد إشارات عصبية عابرة تزول إذا لم أتغذَّ عليها.' },
  { id: 'c2', category: 'panic', title: 'التعامل مع نوبة الهلع', text: 'هذه الأعراض الجسدية (تسارع القلب، ضيق التنفس) هي استجابة أمان مؤقتة لجسدي، لن تضرني وستتراجع خلال دقائق.' },
  { id: 'c3', category: 'depression', title: 'العمل أولاً ثم الشغف', text: 'لا تنتظر توفر المزاج لبدء الخطوة. الفعل والسلوك هو ما يصنع الدافع والارتياح النفسي.' },
  { id: 'c4', category: 'ocd', title: 'تقبل عدم اليقين', text: 'ليس عليَّ التأكد 100% من كل شيء. أستطيع التعايش مع الشك والتركيز على ما أستطيع التحكم فيه الآن.' },
  { id: 'c5', category: 'general', title: 'الرفق بالذات', text: 'أعامل نفسي في أوقات التعثر بالرفق والتعاطف الذي أمنحه لصديق عزيز يمر بنفس الموقف.' }
];

export const CBTExercisesSection: React.FC<CBTExercisesSectionProps> = ({
  diaries,
  selectedDate,
  handleUpdateHabit,
  isDarkMode = false
}) => {
  // Main Sub-Tab view
  const [activeTab, setActiveTab] = useState<
    'thought_records' | 'downward_arrow' | 'worry_box' | 'exposure_ladder' | 'coping_cards' | 'grounding' | 'analytics'
  >('thought_records');

  // Extract all CBT Worksheets across all diaries
  const allCbtWorksheets = diaries.flatMap(d => 
    (d.cbtWorksheets || []).map(w => ({
      ...w,
      diaryDate: d.createdAt ? d.createdAt.split('T')[0] : selectedDate
    }))
  );

  // Active Diary for Selected Date
  const activeDiaryForDate = diaries.find(d => d.createdAt && d.createdAt.split('T')[0] === selectedDate);
  const todaysCbtWorksheets = activeDiaryForDate?.cbtWorksheets || [];

  // --- STATE: THOUGHT RECORD WIZARD MODAL ---
  const [showThoughtWizard, setShowThoughtWizard] = useState(false);
  const [trStep, setTrStep] = useState(1);
  const [trTrigger, setTrTrigger] = useState('');
  const [trNegativeThought, setTrNegativeThought] = useState('');
  const [trDistortion, setTrDistortion] = useState('');
  const [trEvidenceFor, setTrEvidenceFor] = useState('');
  const [trEvidenceAgainst, setTrEvidenceAgainst] = useState('');
  const [trRationalAlt, setTrRationalAlt] = useState('');
  const [trEmotionBefore, setTrEmotionBefore] = useState(8);
  const [trEmotionAfter, setTrEmotionAfter] = useState(4);
  const [trAiLoading, setTrAiLoading] = useState(false);

  // --- STATE: DOWNWARD ARROW WIZARD ---
  const [showArrowWizard, setShowArrowWizard] = useState(false);
  const [daStep, setDaStep] = useState(1);
  const [daTrigger, setDaTrigger] = useState('');
  const [daLevel1, setDaLevel1] = useState(''); // ماذا يعني لك ذلك؟
  const [daLevel2, setDaLevel2] = useState(''); // وإذا حدث هذا فما المعنى الأسوأ؟
  const [daCoreBelief, setDaCoreBelief] = useState(''); // المعتقد الأساسي المكتشف
  const [daHealthyBelief, setDaHealthyBelief] = useState(''); // المعتقد الصحي البديل

  // --- STATE: WORRY BOX ---
  const [worryText, setWorryText] = useState('');
  const [worryCategory, setWorryCategory] = useState<'actionable' | 'uncontrollable'>('actionable');
  const [worryStep1, setWorryStep1] = useState('');
  const [worryStep2, setWorryStep2] = useState('');
  const [worryTimerRunning, setWorryTimerRunning] = useState(false);
  const [worryTimerSeconds, setWorryTimerSeconds] = useState(900); // 15 mins

  // --- STATE: EXPOSURE HIERARCHY ---
  const [showExposureWizard, setShowExposureWizard] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expStepsInput, setExpStepsInput] = useState<{ situation: string; expectedAnxiety: number }[]>([
    { situation: '', expectedAnxiety: 30 },
    { situation: '', expectedAnxiety: 50 },
    { situation: '', expectedAnxiety: 80 }
  ]);

  // --- STATE: COPING CARDS ---
  const [customCards, setCustomCards] = useState<{ id: string; title: string; text: string; category: string }[]>(() => {
    try {
      const saved = localStorage.getItem('app_custom_coping_cards');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardText, setNewCardText] = useState('');
  const [newCardCategory, setNewCardCategory] = useState('general');
  const [showAddCardModal, setShowAddCardModal] = useState(false);

  // --- STATE: SENSORY GROUNDING (5-4-3-2-1) ---
  const [groundingStep, setGroundingStep] = useState(1);
  const [groundingInputs, setGroundingInputs] = useState<{
    see: string[];
    touch: string[];
    hear: string[];
    smell: string[];
    taste: string[];
  }>({
    see: ['', '', '', '', ''],
    touch: ['', '', '', ''],
    hear: ['', '', ''],
    smell: ['', ''],
    taste: ['']
  });

  // Helper to save a CBT Worksheet into current diary
  const saveCbtItemToDiary = (newWorksheet: CBTWorksheet) => {
    const updated = [...todaysCbtWorksheets, newWorksheet];
    handleUpdateHabit('cbt', updated);
  };

  // Helper to delete CBT Worksheet
  const handleDeleteCbtItem = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا التمرين العلاجي؟')) {
      const updated = todaysCbtWorksheets.filter(w => w.id !== id);
      handleUpdateHabit('cbt', updated);
    }
  };

  // AI Reframe Helper
  const handleAiAnalyzeThought = async () => {
    if (!trNegativeThought.trim()) return;
    setTrAiLoading(true);
    try {
      const res = await fetch('/api/gemini/cbt-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          triggerEvent: trTrigger,
          negativeThoughts: trNegativeThought,
          cognitiveDistortion: trDistortion
        })
      });
      const data = await res.json();

      if (data.detectedDistortion && !trDistortion) {
        setTrDistortion(data.detectedDistortion);
      }
      if (data.rationalAlternative) {
        setTrRationalAlt(data.rationalAlternative);
      }
      if (data.evidenceAgainst) {
        setTrEvidenceAgainst(data.evidenceAgainst);
      }
    } catch (e) {
      // Fallback Arabic rational alternative
      setTrRationalAlt(
        `الفكرة "${trNegativeThought}" هي مجرد فرضية ذهنية مؤقتة. دعنا ننظر للواقع بإنصاف: هناك تفسيرات متزنة أكثر، وحقيقة الموقف لا تعني النهاية السيئة المتوقعة.`
      );
    } finally {
      setTrAiLoading(false);
    }
  };

  // Worry timer effect
  React.useEffect(() => {
    let timer: any;
    if (worryTimerRunning && worryTimerSeconds > 0) {
      timer = setInterval(() => {
        setWorryTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (worryTimerSeconds === 0) {
      setWorryTimerRunning(false);
      alert('انتهت 15 دقيقة المخصصة لساعة القلق اليومية! حان الوقت لإغلاق الصندوق والتفرغ لحياتك الحالية. 🧘✨');
    }
    return () => clearInterval(timer);
  }, [worryTimerRunning, worryTimerSeconds]);

  // Save new custom coping card
  const handleSaveCustomCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardTitle.trim() || !newCardText.trim()) return;

    const newCard = {
      id: `card-${Date.now()}`,
      title: newCardTitle.trim(),
      text: newCardText.trim(),
      category: newCardCategory
    };

    const updated = [newCard, ...customCards];
    setCustomCards(updated);
    localStorage.setItem('app_custom_coping_cards', JSON.stringify(updated));

    setNewCardTitle('');
    setNewCardText('');
    setShowAddCardModal(false);
  };

  // Render Category Tab Switcher
  return (
    <div className={`space-y-6 ${isDarkMode ? 'text-gray-200' : 'text-[#3A3A3A]'}`} dir="rtl" id="cbt-exercises-section-main">
      
      {/* Top Banner Header */}
      <div className={`p-6 rounded-3xl border relative overflow-hidden ${
        isDarkMode 
          ? 'bg-[#1A1917] border-gray-800' 
          : 'bg-gradient-to-br from-[#8B9D83]/15 via-white to-[#F0EDE4]/60 border-[#E2DCC8]'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B9D83]/20 text-[#5A5A40] text-xs font-bold">
              <Brain className="w-4 h-4 text-[#8B9D83]" />
              <span>مركز العلاج المعرفي السلوكي المتقدم (CBT & Psychological Suite)</span>
            </div>
            <h3 className="text-lg font-black text-[#3A3A3A]">
              تمارين إعادة الهيكلة المعرفية وضبط استجابات الذهن 🧠✨
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              مجموعة أدوات علاجية نفسية مثبتة علمياً لتشخيص الأفكار المقلقة، تفكيك المعتقدات الأساسية، تأجيل الوساوس، وبناء مرونة نفسية راسخة.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-gray-500 font-mono bg-white/80 px-3 py-1.5 rounded-xl border border-[#E2DCC8]">
              📅 {selectedDate}
            </span>
          </div>
        </div>
      </div>

      {/* 1. Main Sub-Tab Navigation Switcher */}
      <div className="flex overflow-x-auto pb-1 gap-2 bg-[#F0EDE4] p-1.5 rounded-2xl border border-[#E2DCC8]/60 shadow-2xs no-scrollbar">
        {[
          { id: 'thought_records', label: '🧠 أوراق الهيكلة المعرفية', icon: FileText, color: 'text-emerald-700' },
          { id: 'downward_arrow', label: '⬇️ سهم التفكير (المعتقدات العميقة)', icon: ArrowDown, color: 'text-indigo-700' },
          { id: 'worry_box', label: '📦 صندوق القلق وتأجيل الوساوس', icon: Archive, color: 'text-amber-700' },
          { id: 'exposure_ladder', label: '🪜 سلم التعريض التدريجي', icon: Layers, color: 'text-sky-700' },
          { id: 'coping_cards', label: '📇 بطاقات المواجهة والتأقلم', icon: ShieldCheck, color: 'text-pink-700' },
          { id: 'grounding', label: '🧘 التأريض الحسي 5-4-3-2-1', icon: Compass, color: 'text-teal-700' },
          { id: 'analytics', label: '📊 تحليلات وتشوهات الأفكار', icon: BarChart2, color: 'text-purple-700' }
        ].map(tab => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-1.5 space-x-reverse py-2.5 px-3.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-white text-[#5A5A40] shadow-xs font-extrabold border border-[#E2DCC8]/60'
                  : 'text-gray-600 hover:text-[#5A5A40] hover:bg-white/50'
              }`}
            >
              <IconComp className={`w-4 h-4 ${tab.color}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: THOUGHT RECORDS (أوراق الهيكلة المعرفية) */}
      {activeTab === 'thought_records' && (
        <div className="space-y-6">
          
          <div className="bg-white border border-[#E2DCC8] rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-[#3A3A3A] flex items-center space-x-2 space-x-reverse">
                <span>🧠</span>
                <span>سجل أوراق العمل المعرفية (CBT Thought Records)</span>
              </h4>
              <p className="text-[10px] text-gray-500 font-medium">
                فكك الأفكار السلبية التلقائية، حدد التشوه المعرفي، ووازن الأدلة للوصول إلى بديل عقلاني مريح للذهن.
              </p>
            </div>

            <button
              onClick={() => {
                setTrTrigger('');
                setTrNegativeThought('');
                setTrDistortion('');
                setTrEvidenceFor('');
                setTrEvidenceAgainst('');
                setTrRationalAlt('');
                setTrEmotionBefore(8);
                setTrEmotionAfter(4);
                setTrStep(1);
                setShowThoughtWizard(true);
              }}
              className="flex items-center justify-center space-x-1.5 space-x-reverse py-2.5 px-4 bg-[#8B9D83] hover:bg-[#72856A] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>تمرين إعادة هيكلة جديد</span>
            </button>
          </div>

          {/* List of Thought Worksheets */}
          {allCbtWorksheets.length === 0 ? (
            <div className="bg-white border border-[#E2DCC8] rounded-3xl p-12 text-center text-gray-400 text-sm">
              <Brain className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#8B9D83]" />
              <p className="font-bold text-[#3A3A3A]">لم تقم بأي تمارين إعادة هيكلة معرفية حتى الآن.</p>
              <p className="text-xs mt-1 text-gray-400">انقر على زر "تمرين إعادة هيكلة جديد" للبدء في تفكيك الأفكار المزعجة.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allCbtWorksheets.map((item) => {
                const reliefPct = Math.round(((item.emotionBefore - item.emotionAfter) / item.emotionBefore) * 100);
                const distortionInfo = COGNITIVE_DISTORTIONS.find(d => d.id === item.cognitiveDistortion);

                return (
                  <div 
                    key={item.id}
                    className={`p-5 rounded-3xl border space-y-3 transition-all relative ${
                      isDarkMode ? 'bg-[#1A1917] border-gray-800' : 'bg-white border-[#E2DCC8] hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-[#E2DCC8]/40 pb-2.5">
                      <span className="text-[10px] font-bold font-mono text-gray-400 bg-[#F9F7F2] px-2.5 py-0.5 rounded-md border border-[#E2DCC8]">
                        🗓️ {item.diaryDate}
                      </span>

                      <div className="flex items-center gap-2">
                        {reliefPct > 0 && (
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            📉 تراجع التوتر: -{reliefPct}%
                          </span>
                        )}
                        <button
                          onClick={() => handleDeleteCbtItem(item.id)}
                          className="p-1 text-gray-400 hover:text-red-500 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 block">🚩 الموقف أو المحفز:</span>
                        <p className="font-bold text-gray-800">{item.triggerEvent || 'غير محدد'}</p>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-gray-400 block">💭 الفكرة التلقائية السلبية:</span>
                        <p className="font-medium text-red-700 bg-red-50/50 p-2 rounded-xl border border-red-100">
                          "{item.negativeThoughts}"
                        </p>
                      </div>

                      {distortionInfo && (
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 block">🔍 التشوه المعرفي:</span>
                          <span className="inline-block text-[10px] font-extrabold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                            {distortionInfo.name}
                          </span>
                        </div>
                      )}

                      <div>
                        <span className="text-[10px] font-bold text-gray-400 block">✨ البديل العقلاني المستنتج:</span>
                        <p className="font-bold text-emerald-800 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100 leading-relaxed">
                          {item.rationalAlternative}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-[#E2DCC8]/30 text-[10px]">
                        <span className="text-gray-500">شدة التوتر قبل: <strong className="text-red-600 font-mono text-xs">{item.emotionBefore}/10</strong></span>
                        <span className="text-gray-500">شدة التوتر بعد: <strong className="text-emerald-600 font-mono text-xs">{item.emotionAfter}/10</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* TAB 2: DOWNWARD ARROW TECHNIQUE (سهم التفكير للأسفل) */}
      {activeTab === 'downward_arrow' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E2DCC8] rounded-3xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h4 className="font-black text-base text-[#3A3A3A] flex items-center gap-2">
                  <ArrowDown className="w-5 h-5 text-indigo-600" />
                  <span>تقنية سهم التفكير للأسفل (Downward Arrow Technique)</span>
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  تمرين استكشافي ينقب عن المعتقد الجذري العميق (Core Belief / Schema) المسبب للتوتر المزمن، عبر طرح سؤال متكرر: "إذا افتُرض أن هذه الفكرة صحيحة، فما المعنى المترتب على ذلك بالنسبة لك؟"
                </p>
              </div>

              <button
                onClick={() => {
                  setDaTrigger('');
                  setDaLevel1('');
                  setDaLevel2('');
                  setDaCoreBelief('');
                  setDaHealthyBelief('');
                  setDaStep(1);
                  setShowArrowWizard(true);
                }}
                className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>بدء تمرين السهم للأسفل</span>
              </button>
            </div>

            {/* Explanatory Steps Card */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-1 text-xs">
                <span className="font-extrabold text-indigo-900 block">1️⃣ الفكرة الظاهرة</span>
                <p className="text-[10px] text-gray-600">مثال: "تأخر عميلي في الرد على الرسالة."</p>
              </div>
              <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-1 text-xs">
                <span className="font-extrabold text-indigo-900 block">2️⃣ ماذا يعني لك ذلك؟</span>
                <p className="text-[10px] text-gray-600">"معناه أنه غاضب مني وسيُلغي العقد."</p>
              </div>
              <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-1 text-xs">
                <span className="font-extrabold text-indigo-900 block">3️⃣ وإذا أُلغي العقد؟</span>
                <p className="text-[10px] text-gray-600">"معناه أنني فاشل ولا أصلح للعمل."</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1 text-xs">
                <span className="font-extrabold text-emerald-900 block">4️⃣ المعتقد البديل الصحي</span>
                <p className="text-[10px] text-gray-600">"قيمتي لا ترتبط بسلوك الآخرين اليومي."</p>
              </div>
            </div>
          </div>

          {/* List of Downward Arrow Exercises saved */}
          {allCbtWorksheets.filter(w => w.exerciseType === 'downward_arrow').length === 0 ? (
            <div className="bg-white border border-[#E2DCC8] rounded-3xl p-10 text-center text-gray-400 text-xs">
              <ArrowDown className="w-10 h-10 mx-auto mb-2 opacity-30 text-indigo-600" />
              <p className="font-bold text-gray-700">لم تقم بتسجيل أي تمارين سهم التفكير للأسفل حتى الآن.</p>
              <p className="mt-1 text-gray-400">استخدم هذه التقنية عندما تجد أن أفكارك السلبية تخفي خلفها خوفاً عميقاً غير معلن.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allCbtWorksheets.filter(w => w.exerciseType === 'downward_arrow').map(item => (
                <div key={item.id} className="p-5 bg-white border border-[#E2DCC8] rounded-3xl space-y-3">
                  <div className="flex justify-between items-center border-b pb-2 text-xs">
                    <span className="font-bold text-[#8B9D83]">🗓️ {item.diaryDate} • تمرين سهم التفكير</span>
                    <button onClick={() => handleDeleteCbtItem(item.id)} className="text-gray-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-gray-50 rounded-xl">
                      <span className="font-bold text-gray-400 block text-[10px]">الفكرة التلقائية المبدئية:</span>
                      <p className="font-bold text-gray-800">{item.negativeThoughts}</p>
                    </div>
                    {item.coreBelief && (
                      <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl">
                        <span className="font-bold text-indigo-900 block text-[10px]">🔍 المعتقد الأساسي المكتشف (Core Belief):</span>
                        <p className="font-extrabold text-indigo-950">"{item.coreBelief}"</p>
                      </div>
                    )}
                    {item.healthierBelief && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <span className="font-bold text-emerald-900 block text-[10px]">🌱 المعتقد المرن البديل:</span>
                        <p className="font-bold text-emerald-800">{item.healthierBelief}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: WORRY BOX & WORRY TIME (صندوق المخاوف) */}
      {activeTab === 'worry_box' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left: Deposit Worry Box Form */}
          <div className="bg-white border border-[#E2DCC8] rounded-3xl p-6 space-y-4">
            <div className="space-y-1">
              <h4 className="font-black text-sm text-[#3A3A3A] flex items-center gap-2">
                <Archive className="w-5 h-5 text-amber-600" />
                <span>إسكاب المخاوف داخل الصندوق (Worry Container)</span>
              </h4>
              <p className="text-[10px] text-gray-500">
                إذا كانت الفكرة المقلقة تطاردك الآن، اسكبها هنا فوراً، وقرّر عدم التفكير فيها حتى موعد "ساعة القلق المخصصة".
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">ما هي الفكرة أو الموقف المقلق حالياً؟</label>
                <textarea
                  rows={3}
                  value={worryText}
                  onChange={(e) => setWorryText(e.target.value)}
                  placeholder="اكتب مخاوفك بصراحة (مثلاً: أخشى ألا أكون جاهزاً للمقابلة الشفهية...)"
                  className="w-full p-3 rounded-2xl border border-[#E2DCC8] text-xs font-normal outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">تصنيف طبيعة الفكرة المقلقة:</label>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setWorryCategory('actionable')}
                    className={`p-2.5 rounded-xl border transition-all text-center cursor-pointer ${
                      worryCategory === 'actionable'
                        ? 'bg-amber-50 border-amber-400 text-amber-900 font-extrabold'
                        : 'bg-gray-50 text-gray-600'
                    }`}
                  >
                    🎯 مشكلة حقيقية قابلة للحل
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorryCategory('uncontrollable')}
                    className={`p-2.5 rounded-xl border transition-all text-center cursor-pointer ${
                      worryCategory === 'uncontrollable'
                        ? 'bg-amber-50 border-amber-400 text-amber-900 font-extrabold'
                        : 'bg-gray-50 text-gray-600'
                    }`}
                  >
                    ☁️ خوف وهمي خارج نطاق التحكم
                  </button>
                </div>
              </div>

              {worryCategory === 'actionable' ? (
                <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-2 text-xs">
                  <span className="font-bold text-amber-900 block">خطوات العمل الحلولية (Action Plan):</span>
                  <input
                    type="text"
                    placeholder="خطوة 1: مراجعة نقاط العرض الأساسية..."
                    value={worryStep1}
                    onChange={(e) => setWorryStep1(e.target.value)}
                    className="w-full p-2 bg-white border rounded-xl text-xs"
                  />
                  <input
                    type="text"
                    placeholder="خطوة 2: ممارسة تمرين النفس المهدئ..."
                    value={worryStep2}
                    onChange={(e) => setWorryStep2(e.target.value)}
                    className="w-full p-2 bg-white border rounded-xl text-xs"
                  />
                </div>
              ) : (
                <div className="p-3 bg-sky-50 border border-sky-200 rounded-2xl text-xs space-y-1">
                  <span className="font-extrabold text-sky-900 block">💡 مبدأ التقبل والتخلي:</span>
                  <p className="text-[10px] text-sky-800 leading-relaxed">
                    بما أن هذا الخوف خارج عن سيطرتك المباشرة، فإن كثرة التفكير فيه لن تغيّر من الواقع شيئاً. أغلق الصندوق ووجّه انتباهك إلى مهمتك الحالية.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  if (!worryText.trim()) return;
                  const newWorry: CBTWorksheet = {
                    id: `worry-${Date.now()}`,
                    createdAt: new Date().toISOString(),
                    triggerEvent: 'صندوق القلق',
                    negativeThoughts: worryText,
                    cognitiveDistortion: worryCategory === 'actionable' ? 'مشكلة حقيقية' : 'خوف غير مسيطر عليه',
                    rationalAlternative: worryCategory === 'actionable' 
                      ? `خطة العمل: ${worryStep1 || 'تحديد موعد للحل'} - ${worryStep2 || ''}` 
                      : 'تطبيق التقبل والتخلي عن الأفكار الخيالية غير الخاضعة للتحكم.',
                    emotionBefore: 8,
                    emotionAfter: 3,
                    exerciseType: 'worry_box',
                    worryCategory: worryCategory
                  };
                  saveCbtItemToDiary(newWorry);
                  setWorryText('');
                  setWorryStep1('');
                  setWorryStep2('');
                  alert('تم إغلاق الفكرة وإسكابها في صندوق المخاوف بنجاح! 🔒✨');
                }}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Archive className="w-4 h-4" />
                <span>إقغال وقفل الفكرة داخل الصندوق 🔒</span>
              </button>
            </div>
          </div>

          {/* Right: Worry Time Timer & Guidelines */}
          <div className="bg-white border border-[#E2DCC8] rounded-3xl p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <h4 className="font-black text-sm text-[#3A3A3A] flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <span>ساعة القلق اليومية (Daily Worry Time)</span>
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                بدلاً من القلق المستمر طوال اليوم، خصص 15 دقيقة فقط يومياً في وقت محدد لمراجعة وتفنيد كل ما سكبته داخل صندوق المخاوف.
              </p>
            </div>

            <div className="bg-[#F9F7F2] border border-[#E2DCC8] rounded-3xl p-6 text-center space-y-3">
              <span className="text-xs font-bold text-gray-500 block">العداد التنازلي لجلسة التفنيد:</span>
              <div className="font-mono text-4xl font-black text-amber-700 tracking-wider">
                {Math.floor(worryTimerSeconds / 60).toString().padStart(2, '0')}:
                {(worryTimerSeconds % 60).toString().padStart(2, '0')}
              </div>

              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setWorryTimerRunning(!worryTimerRunning)}
                  className={`py-2 px-4 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    worryTimerRunning
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-amber-600 hover:bg-amber-700 text-white'
                  }`}
                >
                  {worryTimerRunning ? 'إيقاف مؤقت ⏸️' : 'بدء ساعة القلق (15 دقيقة) ⏱️'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWorryTimerRunning(false);
                    setWorryTimerSeconds(900);
                  }}
                  className="py-2 px-3 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200"
                >
                  إعادة ضبط
                </button>
              </div>
            </div>

            <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200 text-[10px] text-amber-900 space-y-1">
              <span className="font-bold block">💡 قاعدة القلق الذهبية:</span>
              <p>إذا ظهرت فكرة مقلقة خارج وقت "ساعة القلق"، قل لنفسك: "لقد سجلت هذه الفكرة وسأنظر فيها لاحقاً أثناء وقت القلق المخصص".</p>
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: EXPOSURE HIERARCHY LADDER (سلم التعريض التدريجي) */}
      {activeTab === 'exposure_ladder' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E2DCC8] rounded-3xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <h4 className="font-black text-base text-[#3A3A3A] flex items-center gap-2">
                  <Layers className="w-5 h-5 text-sky-600" />
                  <span>سلم التعريض التدريجي للمخاوف (Exposure Hierarchy Ladder)</span>
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  أسلوب العلاج بالتعريض (Exposure Therapy) لكسر حاجز الخوف أو الفوبيا أو القلق الاجتماعي عن طريق تفتيت الموقف إلى درجات تصاعدية من الأكثر سهولة إلى الأكثر تحدياً.
                </p>
              </div>

              <button
                onClick={() => setShowExposureWizard(true)}
                className="py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>إنشاء سلم تعريض جديد</span>
              </button>
            </div>
          </div>

          {/* List of Exposure Ladders saved */}
          {allCbtWorksheets.filter(w => w.exerciseType === 'exposure_ladder').length === 0 ? (
            <div className="bg-white border border-[#E2DCC8] rounded-3xl p-10 text-center text-gray-400 text-xs">
              <Layers className="w-10 h-10 mx-auto mb-2 opacity-30 text-sky-600" />
              <p className="font-bold text-gray-700">لم تقم ببناء أي سلم تعريض تدريجي حتى الآن.</p>
              <p className="mt-1 text-gray-400">انقر على "إنشاء سلم تعريض جديد" لتفكيك المخاوف الكبيرة لمواجهات آمنة متدرجة.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allCbtWorksheets.filter(w => w.exerciseType === 'exposure_ladder').map(item => (
                <div key={item.id} className="p-5 bg-white border border-[#E2DCC8] rounded-3xl space-y-4">
                  <div className="flex justify-between items-center border-b pb-2 text-xs">
                    <span className="font-bold text-sky-800">🪜 {item.triggerEvent}</span>
                    <button onClick={() => handleDeleteCbtItem(item.id)} className="text-gray-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {item.exposureSteps?.map((step, idx) => (
                      <div key={step.id || idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-800 font-extrabold flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-gray-800">{step.situation}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-400">الشدة المتوقعة:</span>
                          <span className="font-mono font-extrabold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                            {step.expectedAnxiety}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: COPING CARDS (بطاقات المواجهة) */}
      {activeTab === 'coping_cards' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-[#E2DCC8] rounded-3xl p-5">
            <div className="space-y-1">
              <h4 className="font-black text-sm text-[#3A3A3A] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-pink-600" />
                <span>بطاقات المواجهة والتأقلم (Coping Cards)</span>
              </h4>
              <p className="text-[10px] text-gray-500">
                عبارات تذكيرية متزنة وموثوقة استمدها من نتائج تمارينك لتراجعها سريعاً في أوقات التوتر والنوبات القلقة.
              </p>
            </div>

            <button
              onClick={() => setShowAddCardModal(true)}
              className="py-2 px-3.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة بطاقة مواجهة</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Render Pre-built cards + Custom Cards */}
            {[...PREBUILT_COPING_CARDS, ...customCards].map((card) => (
              <div 
                key={card.id}
                className="p-5 rounded-3xl border bg-gradient-to-br from-white via-pink-50/20 to-pink-100/30 border-pink-200 space-y-3 shadow-2xs hover:shadow-xs transition-all relative"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-extrabold text-pink-700 bg-pink-100/70 px-2.5 py-0.5 rounded-full border border-pink-200">
                    🛡️ بطاقة مواجهة
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const utterance = new SpeechSynthesisUtterance(card.text);
                        utterance.lang = 'ar-SA';
                        window.speechSynthesis.cancel();
                        window.speechSynthesis.speak(utterance);
                      }}
                      className="p-1 bg-white/80 hover:bg-pink-100 text-pink-600 rounded-lg text-xs transition-colors cursor-pointer border border-pink-200"
                      title="استماع للعبارة بصوت واضح 🔊"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(card.text);
                        alert('تم نسخ نص بطاقة المواجهة بنجاح! 📋');
                      }}
                      className="p-1 bg-white/80 hover:bg-pink-100 text-pink-600 rounded-lg text-xs transition-colors cursor-pointer border border-pink-200"
                      title="نسخ النص 📋"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h5 className="font-extrabold text-xs text-gray-800">{card.title}</h5>
                <p className="text-xs text-gray-600 leading-relaxed font-medium">"{card.text}"</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: SENSORY GROUNDING 5-4-3-2-1 (التأريض الحسي) */}
      {activeTab === 'grounding' && (
        <div className="bg-white border border-[#E2DCC8] rounded-3xl p-6 space-y-6 max-w-3xl mx-auto">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl mx-auto flex items-center justify-center font-bold text-lg mb-2">
              🧭
            </div>
            <h4 className="font-black text-base text-[#3A3A3A]">
              تمرين التأريض الحسي 5-4-3-2-1 (Sensory Grounding Guide)
            </h4>
            <p className="text-xs text-gray-500 max-w-lg mx-auto">
              تمرين موجه يربط حواسك بالمكان واللحظة الحالية لقطع تسارع القلق والهلع واستعادة السكينة فوراً.
            </p>
          </div>

          {/* Progress Steps Header */}
          <div className="flex justify-between items-center px-4 py-2 bg-teal-50/60 rounded-2xl border border-teal-100 text-xs font-bold text-teal-900">
            <span>الخطوة {groundingStep} من 5</span>
            <span>
              {groundingStep === 1 && '👁️ 5 أشياء يمكنك رؤيتها'}
              {groundingStep === 2 && '✋ 4 أشياء يمكنك لمسها'}
              {groundingStep === 3 && '👂 3 أصوات يمكنك سماعها'}
              {groundingStep === 4 && '👃 شيئان يمكنك شمهما'}
              {groundingStep === 5 && '👅 شيء واحد يمكنك تذوقه'}
            </span>
          </div>

          {/* Step Contents */}
          <div className="space-y-4">
            {groundingStep === 1 && (
              <div className="space-y-3">
                <p className="text-xs text-gray-700 font-bold">انظر حولك الآن واذكر 5 أشياء تقع عينك عليها:</p>
                {groundingInputs.see.map((val, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      placeholder={`شيء أراه رقم ${idx + 1} (مثال: الشاشة، الساعة، النبتة...)`}
                      value={val}
                      onChange={(e) => {
                        const updated = [...groundingInputs.see];
                        updated[idx] = e.target.value;
                        setGroundingInputs({ ...groundingInputs, see: updated });
                      }}
                      className="flex-1 p-2 bg-gray-50 border rounded-xl text-xs font-bold outline-none focus:border-teal-500"
                    />
                  </div>
                ))}
              </div>
            )}

            {groundingStep === 2 && (
              <div className="space-y-3">
                <p className="text-xs text-gray-700 font-bold">ركز على الملمس واذكر 4 أشياء تشعر بلمسها الآن:</p>
                {groundingInputs.touch.map((val, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      placeholder={`شيء ألمسه رقم ${idx + 1} (مثال: ملمس المقعد، الثوب، هواء المكيف...)`}
                      value={val}
                      onChange={(e) => {
                        const updated = [...groundingInputs.touch];
                        updated[idx] = e.target.value;
                        setGroundingInputs({ ...groundingInputs, touch: updated });
                      }}
                      className="flex-1 p-2 bg-gray-50 border rounded-xl text-xs font-bold outline-none focus:border-teal-500"
                    />
                  </div>
                ))}
              </div>
            )}

            {groundingStep === 3 && (
              <div className="space-y-3">
                <p className="text-xs text-gray-700 font-bold">أنصت بهدوء واذكر 3 أصوات تسمعها محيطة بك:</p>
                {groundingInputs.hear.map((val, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      placeholder={`صوت أسمعه رقم ${idx + 1} (مثال: صفيحة المروحة، حفيف الشجر...)`}
                      value={val}
                      onChange={(e) => {
                        const updated = [...groundingInputs.hear];
                        updated[idx] = e.target.value;
                        setGroundingInputs({ ...groundingInputs, hear: updated });
                      }}
                      className="flex-1 p-2 bg-gray-50 border rounded-xl text-xs font-bold outline-none focus:border-teal-500"
                    />
                  </div>
                ))}
              </div>
            )}

            {groundingStep === 4 && (
              <div className="space-y-3">
                <p className="text-xs text-gray-700 font-bold">استشعر رائحة المكان واذكر شيئين تشمهما:</p>
                {groundingInputs.smell.map((val, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      placeholder={`رائحة رقم ${idx + 1} (مثال: رائحة القهوة، العطر، الهواء...)`}
                      value={val}
                      onChange={(e) => {
                        const updated = [...groundingInputs.smell];
                        updated[idx] = e.target.value;
                        setGroundingInputs({ ...groundingInputs, smell: updated });
                      }}
                      className="flex-1 p-2 bg-gray-50 border rounded-xl text-xs font-bold outline-none focus:border-teal-500"
                    />
                  </div>
                ))}
              </div>
            )}

            {groundingStep === 5 && (
              <div className="space-y-3">
                <p className="text-xs text-gray-700 font-bold">اذكر شيئاً واحداً يمكنك تذوقه أو تذكر طعمه في فمك:</p>
                <input
                  type="text"
                  placeholder="نكهة القهوة، طعم الماء، النعناع..."
                  value={groundingInputs.taste[0]}
                  onChange={(e) => setGroundingInputs({ ...groundingInputs, taste: [e.target.value] })}
                  className="w-full p-2.5 bg-gray-50 border rounded-xl text-xs font-bold outline-none focus:border-teal-500"
                />
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center pt-3 border-t">
            {groundingStep > 1 ? (
              <button
                onClick={() => setGroundingStep(groundingStep - 1)}
                className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                ← الخطوة السابقة
              </button>
            ) : <div />}

            {groundingStep < 5 ? (
              <button
                onClick={() => setGroundingStep(groundingStep + 1)}
                className="py-2 px-5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
              >
                الخطوة التالية →
              </button>
            ) : (
              <button
                onClick={() => {
                  alert('أحسنت! خذ نفساً عميقاً، واستشعر السكينة والاستقرار في حواسك الآن. 🌿✨');
                  setGroundingStep(1);
                }}
                className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
              >
                ✓ إنهاء تمرين التأريض واستعادة الهدوء
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: ANALYTICS & DISTORTION DISTRIBUTION */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="bg-white border border-[#E2DCC8] rounded-3xl p-5 space-y-2">
              <span className="text-[10px] font-bold text-gray-400 block">إجمالي تمارين CBT المكتملة</span>
              <span className="text-2xl font-black text-purple-700 font-mono">{allCbtWorksheets.length}</span>
              <p className="text-[10px] text-gray-500">جلسة تفكير متزنة وموثقة</p>
            </div>

            <div className="bg-white border border-[#E2DCC8] rounded-3xl p-5 space-y-2">
              <span className="text-[10px] font-bold text-gray-400 block">متوسط انخفاض شدة التوتر</span>
              {(() => {
                const totalRelief = allCbtWorksheets.reduce((acc, w) => acc + (w.emotionBefore - w.emotionAfter), 0);
                const avg = allCbtWorksheets.length > 0 ? (totalRelief / allCbtWorksheets.length).toFixed(1) : 0;
                return (
                  <div>
                    <span className="text-2xl font-black text-emerald-600 font-mono">-{avg} درجة</span>
                    <p className="text-[10px] text-gray-500">معدل تحسن الاستجابة العاطفية</p>
                  </div>
                );
              })()}
            </div>

            <div className="bg-white border border-[#E2DCC8] rounded-3xl p-5 space-y-2">
              <span className="text-[10px] font-bold text-gray-400 block">بطاقات المواجهة المفضلة</span>
              <span className="text-2xl font-black text-pink-600 font-mono">
                {PREBUILT_COPING_CARDS.length + customCards.length}
              </span>
              <p className="text-[10px] text-gray-500">بطاقة داعمة في لحظات النوبات</p>
            </div>

          </div>

          {/* Distortion Distribution */}
          <div className="bg-white border border-[#E2DCC8] rounded-3xl p-6 space-y-4">
            <h4 className="font-bold text-sm text-[#3A3A3A] flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-purple-600" />
              <span>توزيع التشوهات المعرفية الأكثر تكراراً (Cognitive Distortions Stats)</span>
            </h4>

            <div className="space-y-3">
              {COGNITIVE_DISTORTIONS.map(dist => {
                const count = allCbtWorksheets.filter(w => w.cognitiveDistortion === dist.id).length;
                const pct = allCbtWorksheets.length > 0 ? Math.round((count / allCbtWorksheets.length) * 100) : 0;

                return (
                  <div key={dist.id} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                      <span>{dist.name}</span>
                      <span className="font-mono text-purple-700">{count} مرّة ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-purple-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL WIZARD: THOUGHT RECORD --- */}
      {showThoughtWizard && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 space-y-5 shadow-2xl border border-[#E2DCC8] max-h-[90vh] overflow-y-auto" dir="rtl">
            <div className="flex justify-between items-center border-b pb-3">
              <span className="text-xs font-black text-[#5A5A40] flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-[#8B9D83]" />
                <span>معالج إعادة الهيكلة المعرفية - الخطوة {trStep} من 5</span>
              </span>
              <button onClick={() => setShowThoughtWizard(false)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>

            {trStep === 1 && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-700 block">الخطوة 1: الموقف أو الحدث المثير (Trigger Event)</label>
                <textarea
                  rows={3}
                  value={trTrigger}
                  onChange={(e) => setTrTrigger(e.target.value)}
                  placeholder="ما الموقف الذي حدث قبل أن تشعر بالضيق؟ (مثال: تلقيت رسالة تنبيه من المدير...)"
                  className="w-full p-3 border rounded-2xl text-xs font-normal outline-none focus:border-[#8B9D83]"
                />
              </div>
            )}

            {trStep === 2 && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-700 block">الخطوة 2: الفكرة التلقائية السلبية (Automatic Thought)</label>
                <textarea
                  rows={3}
                  value={trNegativeThought}
                  onChange={(e) => setTrNegativeThought(e.target.value)}
                  placeholder="ما الفكرة التلقائية التي خطرت ببالك فوراً؟ (مثال: سيتم طردي من العمل بالتأكيد...)"
                  className="w-full p-3 border rounded-2xl text-xs font-normal outline-none focus:border-[#8B9D83]"
                />
              </div>
            )}

            {trStep === 3 && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-700 block">الخطوة 3: اختر التشوه المعرفي المحتمل (Cognitive Distortion)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                  {COGNITIVE_DISTORTIONS.map(dist => (
                    <button
                      type="button"
                      key={dist.id}
                      onClick={() => setTrDistortion(dist.id)}
                      className={`p-3 text-right rounded-2xl border text-xs cursor-pointer transition-all ${
                        trDistortion === dist.id
                          ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                      }`}
                    >
                      <span className="font-extrabold block">{dist.name}</span>
                      <span className="text-[10px] text-gray-500 font-medium block mt-0.5">{dist.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {trStep === 4 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-700 block">الخطوة 4: البديل العقلاني المنطقي (Rational Alternative)</label>
                  <button
                    type="button"
                    onClick={handleAiAnalyzeThought}
                    disabled={trAiLoading}
                    className="py-1 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{trAiLoading ? 'جاري التحليل...' : 'اقتراح بديل بالذكاء الاصطناعي'}</span>
                  </button>
                </div>

                <textarea
                  rows={4}
                  value={trRationalAlt}
                  onChange={(e) => setTrRationalAlt(e.target.value)}
                  placeholder="اكتب البديل العقلاني الأكثر اتزاناً والمستند للحقائق الواقعية..."
                  className="w-full p-3 border rounded-2xl text-xs font-normal outline-none focus:border-[#8B9D83]"
                />
              </div>
            )}

            {trStep === 5 && (
              <div className="space-y-4">
                <label className="text-xs font-bold text-gray-700 block">الخطوة 5: تقييم شدة التوتر بعد التمرين (0 - 10)</label>
                <div className="p-4 bg-gray-50 rounded-2xl border space-y-2 text-center">
                  <span className="text-2xl font-black font-mono text-emerald-600">{trEmotionAfter} / 10</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={trEmotionAfter}
                    onChange={(e) => setTrEmotionAfter(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t">
              {trStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setTrStep(trStep - 1)}
                  className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold"
                >
                  السابق
                </button>
              ) : <div />}

              {trStep < 5 ? (
                <button
                  type="button"
                  onClick={() => setTrStep(trStep + 1)}
                  className="py-2 px-5 bg-[#8B9D83] hover:bg-[#72856A] text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  التالي
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (!trRationalAlt.trim()) return;
                    const newW: CBTWorksheet = {
                      id: `cbt-${Date.now()}`,
                      createdAt: new Date().toISOString(),
                      triggerEvent: trTrigger,
                      negativeThoughts: trNegativeThought,
                      cognitiveDistortion: trDistortion,
                      rationalAlternative: trRationalAlt,
                      emotionBefore: trEmotionBefore,
                      emotionAfter: trEmotionAfter,
                      exerciseType: 'thought_record'
                    };
                    saveCbtItemToDiary(newW);
                    setShowThoughtWizard(false);
                    alert('تم حفظ تمرين إعادة الهيكلة بنجاح في مذكرتك لليوم! 🎉🧠');
                  }}
                  className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  💾 حفظ التمرين بنجاح
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL WIZARD: DOWNWARD ARROW --- */}
      {showArrowWizard && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 space-y-5 shadow-2xl border border-[#E2DCC8]" dir="rtl">
            <div className="flex justify-between items-center border-b pb-3">
              <span className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                <ArrowDown className="w-4 h-4 text-indigo-600" />
                <span>تمرين سهم التفكير للأسفل - الخطوة {daStep} من 3</span>
              </span>
              <button onClick={() => setShowArrowWizard(false)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>

            {daStep === 1 && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-700 block">الفكرة الظاهرة اليومية المزعجة:</label>
                <textarea
                  rows={3}
                  value={daTrigger}
                  onChange={(e) => setDaTrigger(e.target.value)}
                  placeholder="اكتب الفكرة المبدئية (مثال: تأخر صديقي في الرد علي)..."
                  className="w-full p-3 border rounded-2xl text-xs font-normal outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {daStep === 2 && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-700 block">إذا افتُرض أن هذا صحيح، فما المعنى الأشد سوءاً بالنسبة لك؟</label>
                <textarea
                  rows={3}
                  value={daLevel1}
                  onChange={(e) => setDaLevel1(e.target.value)}
                  placeholder="مثال: معناه أنه متجاهل لي ولا يرغب في صحبتي..."
                  className="w-full p-3 border rounded-2xl text-xs font-normal outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {daStep === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">🔍 المعتقد الأساسي المكتشف (Core Belief):</label>
                  <input
                    type="text"
                    value={daCoreBelief}
                    onChange={(e) => setDaCoreBelief(e.target.value)}
                    placeholder="مثال: أنا شخص غير محبوب أو غير جدير بالاحترام..."
                    className="w-full p-3 border rounded-2xl text-xs font-bold text-indigo-900 bg-indigo-50/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">🌱 المعتقد المرن البديل الصحي:</label>
                  <textarea
                    rows={3}
                    value={daHealthyBelief}
                    onChange={(e) => setDaHealthyBelief(e.target.value)}
                    placeholder="صاغ معتقداً متزناً (مثال: قيمتي كإنسان ثابته ولا ترتبط بسرعة استجابة الآخرين)..."
                    className="w-full p-3 border rounded-2xl text-xs font-bold text-emerald-900 bg-emerald-50/50"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t">
              {daStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setDaStep(daStep - 1)}
                  className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold"
                >
                  السابق
                </button>
              ) : <div />}

              {daStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setDaStep(daStep + 1)}
                  className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  التالي
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (!daTrigger.trim()) return;
                    const newArrow: CBTWorksheet = {
                      id: `da-${Date.now()}`,
                      createdAt: new Date().toISOString(),
                      triggerEvent: 'سهم التفكير للأسفل',
                      negativeThoughts: daTrigger,
                      cognitiveDistortion: 'معتقد أساسي عميق',
                      rationalAlternative: daHealthyBelief || 'معتقد متزن بديل',
                      emotionBefore: 9,
                      emotionAfter: 4,
                      exerciseType: 'downward_arrow',
                      coreBelief: daCoreBelief,
                      healthierBelief: daHealthyBelief
                    };
                    saveCbtItemToDiary(newArrow);
                    setShowArrowWizard(false);
                    alert('تم حفظ تمرين سهم التفكير للأسفل بنجاح! 🎯✨');
                  }}
                  className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  💾 حفظ تمرين المعتقد العميق
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL WIZARD: EXPOSURE LADDER --- */}
      {showExposureWizard && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 space-y-5 shadow-2xl border border-[#E2DCC8]" dir="rtl">
            <div className="flex justify-between items-center border-b pb-3">
              <span className="text-xs font-black text-sky-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-sky-600" />
                <span>إنشاء سلم تعريض تدريجي للمواجهة</span>
              </span>
              <button onClick={() => setShowExposureWizard(false)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-700 block">عنوان السلم (الموقف أو الخوف المستهدف):</label>
              <input
                type="text"
                placeholder="مثال: مواجهة القلق الاجتماعي عند التحدث بالاجتماعات..."
                value={expTitle}
                onChange={(e) => setExpTitle(e.target.value)}
                className="w-full p-2.5 border rounded-2xl text-xs font-bold outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              <label className="text-xs font-bold text-gray-700 block">درجات المواجهة المتدرجة (من الأسهل للأصعب):</label>
              {expStepsInput.map((step, idx) => (
                <div key={idx} className="p-3 bg-gray-50 border rounded-2xl flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-800 text-xs font-extrabold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    placeholder={`خطوة ${idx + 1} (مثال: إبداء الرأي أمام صديق مقرب)`}
                    value={step.situation}
                    onChange={(e) => {
                      const updated = [...expStepsInput];
                      updated[idx].situation = e.target.value;
                      setExpStepsInput(updated);
                    }}
                    className="flex-1 p-2 bg-white border rounded-xl text-xs font-medium"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] text-gray-400">الشدة %:</span>
                    <input
                      type="number"
                      min="10"
                      max="100"
                      step="10"
                      value={step.expectedAnxiety}
                      onChange={(e) => {
                        const updated = [...expStepsInput];
                        updated[idx].expectedAnxiety = Number(e.target.value);
                        setExpStepsInput(updated);
                      }}
                      className="w-14 p-1 bg-white border rounded-xl text-xs font-mono font-bold text-center"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-3 border-t">
              <button
                type="button"
                onClick={() => setExpStepsInput([...expStepsInput, { situation: '', expectedAnxiety: 60 }])}
                className="py-1.5 px-3 bg-sky-50 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold"
              >
                + إضافة درخة للسلم
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!expTitle.trim()) return;
                  const newLadder: CBTWorksheet = {
                    id: `exp-${Date.now()}`,
                    createdAt: new Date().toISOString(),
                    triggerEvent: expTitle,
                    negativeThoughts: 'سلم تعريض تدريجي',
                    cognitiveDistortion: 'مواجهة متدرجة',
                    rationalAlternative: 'التعريض التدريجي يكشف للذهن آمان المواقف ويلاشي الخوف.',
                    emotionBefore: 8,
                    emotionAfter: 3,
                    exerciseType: 'exposure_ladder',
                    exposureSteps: expStepsInput.map((s, i) => ({
                      id: `step-${i}`,
                      stepNumber: i + 1,
                      situation: s.situation,
                      expectedAnxiety: s.expectedAnxiety,
                      completed: false
                    }))
                  };
                  saveCbtItemToDiary(newLadder);
                  setShowExposureWizard(false);
                  alert('تم إنشاء سلم التعريض التدريجي وحفظه بنجاح! 🪜✨');
                }}
                className="py-2.5 px-6 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                💾 حفظ السلم
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: ADD CUSTOM COPING CARD --- */}
      {showAddCardModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSaveCustomCard} className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl border border-[#E2DCC8]" dir="rtl">
            <div className="flex justify-between items-center border-b pb-3">
              <span className="text-xs font-black text-pink-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-pink-600" />
                <span>إضافة بطاقة مواجهة مخصصة</span>
              </span>
              <button type="button" onClick={() => setShowAddCardModal(false)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">عنوان البطاقة الإلهامي:</label>
                <input
                  type="text"
                  placeholder="مثال: عبارة الأمان عند نوبة التفكير المفرط..."
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  className="w-full p-2.5 border rounded-2xl text-xs font-bold outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">نص العبارة أو الحقيقة المتزنة:</label>
                <textarea
                  rows={3}
                  placeholder="اكتب العبارة التي تعيد إليك طمأنينتك ووعيك..."
                  value={newCardText}
                  onChange={(e) => setNewCardText(e.target.value)}
                  className="w-full p-2.5 border rounded-2xl text-xs font-medium outline-none focus:border-pink-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowAddCardModal(false)}
                className="py-2 px-4 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="py-2 px-5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                حفظ البطاقة 💖
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
