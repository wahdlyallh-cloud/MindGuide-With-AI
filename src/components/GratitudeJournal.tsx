import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, Sparkles, Plus, Trash2, Bell, Calendar, Award, 
  Lightbulb, Smile, Check, RefreshCw, Search, Filter, 
  Brain, HelpCircle, ArrowRight, Zap, Play, Volume2, Copy, Printer, Shuffle,
  Send, Edit3, MessageSquare
} from 'lucide-react';
import { GratitudeCard, AppSettings, DiaryEntry } from '../types';
import { getLanguageInfo } from '../lib/languages';

export interface AIGratitudeHistoryItem {
  id: string;
  type: 'reflect' | 'suggest' | 'ai_generator' | 'qa';
  title: string;
  promptOrContext?: string;
  content: string;
  userAnswer?: string;
  createdAt: string;
}

interface GratitudeJournalProps {
  gratitudeCards: GratitudeCard[];
  setGratitudeCards: React.Dispatch<React.SetStateAction<GratitudeCard[]>>;
  settings: AppSettings;
  diaries: DiaryEntry[];
  setDiaries?: React.Dispatch<React.SetStateAction<DiaryEntry[]>>;
  setActiveTab?: (tab: 'dashboard' | 'diaries' | 'advisor' | 'analytics' | 'settings') => void;
  setActiveDiariesSubTab?: (subTab: 'journal' | 'gratitude') => void;
  setDiaryTypeFilter?: (filter: 'all' | 'diary' | 'thought') => void;
  triggerGratitudeNotificationNow?: () => void;
}

const PASTEL_COLORS = [
  { id: 'yellow', name: 'أصفر ذهبي', class: 'bg-[#FEF9E7] border-[#FADBD8] text-[#78281F] shadow-amber-100/50 hover:bg-[#FDF2E9]' },
  { id: 'green', name: 'أخضر نعناعي', class: 'bg-[#E8F8F5] border-[#A3E4D7] text-[#117864] shadow-teal-100/50 hover:bg-[#D1F2EB]' },
  { id: 'peach', name: 'خوخي ناعم', class: 'bg-[#FBEEE6] border-[#F5CBA7] text-[#6E2C00] shadow-orange-100/50 hover:bg-[#F5CBA7]/30' },
  { id: 'lavender', name: 'لافندر هادئ', class: 'bg-[#F4ECF7] border-[#D7BDE2] text-[#5B2C6F] shadow-purple-100/50 hover:bg-[#EBDEF0]' },
  { id: 'blue', name: 'أزرق سماوي', class: 'bg-[#EBF5FB] border-[#AED6F1] text-[#1B4F72] shadow-blue-100/50 hover:bg-[#D4E6F1]' },
  { id: 'pink', name: 'وردي لطيف', class: 'bg-[#FDEDEC] border-[#F2D7D5] text-[#641E16] shadow-red-100/50 hover:bg-[#FADBD8]' },
];

const ARABIC_PROMPTS = [
  { label: 'لقاء لطيف ☕', text: 'شرب فنجان قهوة ساخن وممتع بمشاركة صديق مقرب والحديث الدافئ معه...' },
  { label: 'إنجاز عملي 💻', text: 'إكمال جزء مذهل من كود المشروع وحل المشكلة التي واجهتني بالأمس...' },
  { label: 'صحة وعافية 🥦', text: 'الشعور بالنشاط بعد ممارسة تمرين خفيف وتناول وجبة صحية تروي جسدي...' },
  { label: 'موقف مضحك 😂', text: 'موقف طريف حدث اليوم جعلني أضحك من قلبي وأتشارك الابتسامة...' },
  { label: 'نعمة السكن 🏠', text: 'العودة لغرفتي الدافئة والهادئة والشعور بالأمان والسلام بعد يوم حافل...' },
];

const ENGLISH_PROMPTS = [
  { label: 'Warm Drink ☕', text: 'Enjoying a fresh cup of coffee in absolute peace and quiet...' },
  { label: 'Code Win 💻', text: 'Finally fixing that stubborn bug and making the application work smoothly...' },
  { label: 'Nature Walk 🌳', text: 'Feeling the fresh breeze on my face during a short walk outside...' },
  { label: 'Good laugh 😂', text: 'A funny conversation that brought an authentic smile to my face...' },
  { label: 'Cozy Room 🏠', text: 'Returning to my clean, quiet workspace and feeling cozy and secure...' },
];

export default function GratitudeJournal({
  gratitudeCards,
  setGratitudeCards,
  settings,
  diaries,
  setDiaries,
  setActiveTab,
  setActiveDiariesSubTab,
  setDiaryTypeFilter,
  triggerGratitudeNotificationNow,
}: GratitudeJournalProps) {
  const isEn = settings.appLanguage === 'en';
  
  // Input states
  const [newText, setNewText] = useState('');
  const [selectedColor, setSelectedColor] = useState(PASTEL_COLORS[0].class);
  
  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColorFilter, setSelectedColorFilter] = useState<string>('all');
  
  // AI states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiActionType, setAiActionType] = useState<'reflect' | 'suggest' | 'ai_generator' | null>(null);

  // Single Card AI Analysis State
  const [analyzingCardId, setAnalyzingCardId] = useState<string | null>(null);
  const [cardAnalysisResults, setCardAnalysisResults] = useState<Record<string, string>>({});

  // Generated Card Proposal
  const [proposedCard, setProposedCard] = useState<{ text: string; colorClass: string } | null>(null);

  // New interactive states: TTS, Copy, Random Memory
  const [randomCard, setRandomCard] = useState<GratitudeCard | null>(null);
  const [copiedCardId, setCopiedCardId] = useState<string | null>(null);
  const [speakingCardId, setSpeakingCardId] = useState<string | null>(null);

  const handleSpeakCard = (cardId: string, text: string) => {
    if (!('speechSynthesis' in window)) {
      alert(isEn ? 'Speech synthesis not supported on this browser.' : 'خاصية القراءة الصوتية غير مدعومة على هذا المتصفح.');
      return;
    }
    if (speakingCardId === cardId) {
      window.speechSynthesis.cancel();
      setSpeakingCardId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getLanguageInfo(settings.appLanguage).speechLang;
    utterance.rate = 0.9;
    utterance.onend = () => setSpeakingCardId(null);
    utterance.onerror = () => setSpeakingCardId(null);
    setSpeakingCardId(cardId);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopyCard = (cardId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCardId(cardId);
    setTimeout(() => setCopiedCardId(null), 2000);
  };

  const handleShowRandomMemory = () => {
    if (gratitudeCards.length === 0) return;
    const randomIndex = Math.floor(Math.random() * gratitudeCards.length);
    setRandomCard(gratitudeCards[randomIndex]);
  };

  // Reminder states
  const [reminderEnabled, setReminderEnabled] = useState(() => {
    const saved = localStorage.getItem('yawmiyati_gratitude_reminder_enabled');
    return saved ? saved === 'true' : true;
  });
  const [reminderTime, setReminderTime] = useState(() => {
    return localStorage.getItem('yawmiyati_gratitude_reminder_time') || '21:00';
  });

  // Save reminders locally and trigger updates
  useEffect(() => {
    localStorage.setItem('yawmiyati_gratitude_reminder_enabled', String(reminderEnabled));
  }, [reminderEnabled]);

  useEffect(() => {
    localStorage.setItem('yawmiyati_gratitude_reminder_time', reminderTime);
  }, [reminderTime]);

  // Handle adding card
  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    const newCard: GratitudeCard = {
      id: `grat-${Date.now()}`,
      text: newText.trim(),
      color: selectedColor,
      createdAt: new Date().toISOString(),
    };

    setGratitudeCards(prev => [newCard, ...prev]);
    setNewText('');
  };

  // Add proposed AI card
  const handleAddProposedCard = () => {
    if (!proposedCard) return;

    // Find the class corresponding to color name
    const foundColor = PASTEL_COLORS.find(c => c.id === proposedCard.colorClass) || PASTEL_COLORS[3]; // default to lavender

    const newCard: GratitudeCard = {
      id: `grat-${Date.now()}`,
      text: proposedCard.text,
      color: foundColor.class,
      createdAt: new Date().toISOString(),
    };

    setGratitudeCards(prev => [newCard, ...prev]);
    setProposedCard(null);
  };

  // Delete card
  const handleDeleteCard = (id: string) => {
    setGratitudeCards(prev => prev.filter(c => c.id !== id));
    // clean up analysis results if any
    if (cardAnalysisResults[id]) {
      const updated = { ...cardAnalysisResults };
      delete updated[id];
      setCardAnalysisResults(updated);
    }
  };

  // Single Card AI Analysis
  const handleAnalyzeSingleCard = async (cardId: string, cardText: string) => {
    setAnalyzingCardId(cardId);
    try {
      const response = await fetch('/api/gemini/gratitude-advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': settings.userApiKey || '',
        },
        body: JSON.stringify({
          action: 'card_analysis',
          cardText,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setCardAnalysisResults(prev => ({
          ...prev,
          [cardId]: data.answer,
        }));
      } else {
        setCardAnalysisResults(prev => ({
          ...prev,
          [cardId]: isEn ? 'Failed to analyze.' : 'عذراً، فشل تحليل البطاقة حالياً.',
        }));
      }
    } catch (err) {
      console.error(err);
      setCardAnalysisResults(prev => ({
        ...prev,
        [cardId]: isEn ? 'Server error.' : 'خطأ في الاتصال بالذكاء الاصطناعي.',
      }));
    } finally {
      setAnalyzingCardId(null);
    }
  };

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // AI History state & local persistence
  const [aiHistory, setAiHistory] = useState<AIGratitudeHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('yawmiyati_gratitude_ai_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('yawmiyati_gratitude_ai_history', JSON.stringify(aiHistory));
    } catch (e) {
      console.error(e);
    }
  }, [aiHistory]);

  const [historyTab, setHistoryTab] = useState<'all' | 'reflect' | 'suggest' | 'ai_generator' | 'qa'>('all');
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  const [tempAnswerText, setTempAnswerText] = useState<string>('');

  // Direct question input
  const [directQuestionText, setDirectQuestionText] = useState('');
  const [directQuestionLoading, setDirectQuestionLoading] = useState(false);

  const addHistoryItem = (
    type: 'reflect' | 'suggest' | 'ai_generator' | 'qa',
    title: string,
    content: string,
    promptOrContext?: string,
    userAnswer?: string
  ) => {
    const newItem: AIGratitudeHistoryItem = {
      id: `ai-hist-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type,
      title,
      promptOrContext,
      content,
      userAnswer,
      createdAt: new Date().toISOString(),
    };
    setAiHistory(prev => [newItem, ...prev]);
    return newItem;
  };

  const handleSaveQuestionAnswer = (itemId: string, answer: string) => {
    if (!answer.trim()) return;
    setAiHistory(prev => prev.map(item => item.id === itemId ? { ...item, userAnswer: answer.trim() } : item));
    setEditingAnswerId(null);
    setTempAnswerText('');
    showToast(isEn ? 'Answer saved successfully! ✓' : 'تم حفظ إجابتك وتأملك بنجاح! ✓');
  };

  const handleDeleteHistoryItem = (itemId: string) => {
    setAiHistory(prev => prev.filter(item => item.id !== itemId));
    showToast(isEn ? 'Item deleted from history.' : 'تم حذف العنصر من السجل.');
  };

  // Export functions
  const handleExportToGratitudeCard = (text: string, suggestedColor?: string) => {
    if (!text.trim()) return;
    const foundColor = PASTEL_COLORS.find(c => c.id === suggestedColor) || PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)];
    const newCard: GratitudeCard = {
      id: `grat-${Date.now()}`,
      text: text.trim(),
      color: foundColor.class,
      createdAt: new Date().toISOString(),
    };
    setGratitudeCards(prev => [newCard, ...prev]);
    showToast(isEn ? 'Added to Gratitude Wall! 🌸' : 'تمت إضافة البطاقة إلى جدار امتنناك بنجاح! 🌸');
  };

  const handleExportToDailyVenting = (title: string, bodyText: string) => {
    if (!bodyText.trim()) return;
    const newEntry: DiaryEntry = {
      id: `diary-${Date.now()}`,
      title: title || (isEn ? 'Gratitude Reflection' : 'فضفضة امتنان ووعي إيجابي 🌸'),
      content: bodyText.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      moods: ['امتنان 🌸', 'سكينة ✨'],
      importance: 4,
      color: 'bg-[#FEF9E7]',
      images: [],
      videos: [],
      audioRecordings: [],
      files: [],
      tasks: [],
      tags: ['امتنان', 'تأمل_إيجابي'],
      chatLogs: [],
      isLocked: false,
      diaryType: 'diary',
    };

    if (setDiaries) {
      setDiaries(prev => [newEntry, ...prev]);
    } else {
      try {
        const saved = localStorage.getItem('yawmiyati_diaries');
        const list = saved ? JSON.parse(saved) : [];
        localStorage.setItem('yawmiyati_diaries', JSON.stringify([newEntry, ...list]));
      } catch (e) { console.error(e); }
    }
    showToast(isEn ? 'Exported to Daily Venting! 📖' : 'تمت إضافة النص بنجاح إلى قسم اليوميات! 📖');
    if (setActiveTab && setActiveDiariesSubTab) {
      setActiveTab('diaries');
      setActiveDiariesSubTab('journal');
      if (setDiaryTypeFilter) setDiaryTypeFilter('diary');
    }
  };

  const handleExportToThoughts = (title: string, bodyText: string) => {
    if (!bodyText.trim()) return;
    const newEntry: DiaryEntry = {
      id: `diary-${Date.now()}`,
      title: title || (isEn ? 'Positive Reflection' : 'خاطرة امتنان ورؤية إيجابية ✍️'),
      content: bodyText.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      moods: ['صفاء 🧘‍♂️', 'إلهام 💡'],
      importance: 5,
      color: 'bg-[#F4ECF7]',
      images: [],
      videos: [],
      audioRecordings: [],
      files: [],
      tasks: [],
      tags: ['خواطر', 'امتنان'],
      chatLogs: [],
      isLocked: false,
      diaryType: 'thought',
    };

    if (setDiaries) {
      setDiaries(prev => [newEntry, ...prev]);
    } else {
      try {
        const saved = localStorage.getItem('yawmiyati_diaries');
        const list = saved ? JSON.parse(saved) : [];
        localStorage.setItem('yawmiyati_diaries', JSON.stringify([newEntry, ...list]));
      } catch (e) { console.error(e); }
    }
    showToast(isEn ? 'Exported to Thoughts & Reflections! ✍️' : 'تمت إضافة الخاطرة بنجاح إلى قسم الخواطر! ✍️');
    if (setActiveTab && setActiveDiariesSubTab) {
      setActiveTab('diaries');
      setActiveDiariesSubTab('journal');
      if (setDiaryTypeFilter) setDiaryTypeFilter('thought');
    }
  };

  const handleSendDirectQuestion = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!directQuestionText.trim() || directQuestionLoading) return;

    const qText = directQuestionText.trim();
    setDirectQuestionLoading(true);

    try {
      const response = await fetch('/api/gemini/gratitude-advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': settings.userApiKey || '',
        },
        body: JSON.stringify({
          gratitudeCards,
          diaries,
          action: 'custom_question',
          customPrompt: qText,
        }),
      });
      const data = await response.json();
      if (data.success && data.answer) {
        addHistoryItem('qa', isEn ? 'Gratitude Consultation' : 'استشارة امتنانية خاصة', data.answer, qText);
        setDirectQuestionText('');
        showToast(isEn ? 'Consultation saved to AI History! 🤖' : 'تمت الإجابة وحفظ الاستشارة في سجل الذكاء الاصطناعي! 🤖');
      } else {
        showToast(isEn ? 'Failed to respond.' : 'تعذر الحصول على رد حالياً.');
      }
    } catch (err) {
      console.error(err);
      showToast(isEn ? 'Connection error.' : 'خطأ في الاتصال بالذكاء الاصطناعي.');
    } finally {
      setDirectQuestionLoading(false);
    }
  };

  // Trigger AI Endpoint for main panel actions
  const handleAiAction = async (action: 'reflect' | 'suggest' | 'ai_generator') => {
    setAiLoading(true);
    setAiResult(null);
    setAiActionType(action);
    setProposedCard(null);

    try {
      const response = await fetch('/api/gemini/gratitude-advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': settings.userApiKey || '',
        },
        body: JSON.stringify({
          gratitudeCards,
          diaries,
          action,
        }),
      });
      const data = await response.json();
      if (data.success) {
        if (action === 'ai_generator') {
          try {
            const parsed = JSON.parse(data.answer);
            setProposedCard({
              text: parsed.text,
              colorClass: parsed.suggestedColor || 'lavender'
            });
            addHistoryItem('ai_generator', isEn ? 'Generated Gratitude Card' : 'بطاقة امتنان مستخلصة من المذكرات', parsed.text);
          } catch (e) {
            console.error("Failed to parse AI Card generator response", e);
            const cardTxt = data.answer.replace(/[{}]/g, '').trim();
            setProposedCard({
              text: cardTxt,
              colorClass: 'lavender'
            });
            addHistoryItem('ai_generator', isEn ? 'Generated Gratitude Card' : 'بطاقة امتنان مستخلصة من المذكرات', cardTxt);
          }
        } else if (action === 'reflect') {
          setAiResult(data.answer);
          addHistoryItem('reflect', isEn ? 'Gratitude Pattern Analysis' : 'تحليل أنماط امتناني', data.answer);
        } else {
          setAiResult(data.answer);
          addHistoryItem('suggest', isEn ? 'Mindful Gratitude Questions' : 'أسئلة تفكرية للامتنان', data.answer);
        }
      } else {
        setAiResult(isEn ? 'An error occurred during AI generation.' : 'حدث خطأ أثناء الحصول على الرد السلوكي من الذكاء الاصطناعي.');
      }
    } catch (err) {
      console.error(err);
      setAiResult(isEn ? 'Could not connect to smart server.' : 'تعذر الاتصال بالخادم الذكي حالياً.');
    } finally {
      setAiLoading(false);
    }
  };

  // Filter logic
  const filteredCards = gratitudeCards.filter(card => {
    const matchesSearch = card.text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesColor = selectedColorFilter === 'all' || card.color.includes(selectedColorFilter);
    return matchesSearch && matchesColor;
  });

  const activePrompts = isEn ? ENGLISH_PROMPTS : ARABIC_PROMPTS;

  return (
    <div className="space-y-6" id="gratitude-journal-section">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-[#FDFBF7] to-[#F5EFE6] border border-[#E2DCC8] rounded-3xl p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-amber-100/25 rounded-full blur-2xl -translate-x-10 -translate-y-10" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-100/25 rounded-full blur-2xl translate-x-10 translate-y-10" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl text-right">
            <span className="inline-flex items-center space-x-1.5 space-x-reverse text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/50 px-3 py-1 rounded-full">
              <span>🌸</span>
              <span>{isEn ? "Positive Psychology Apps" : "تطبيقات علم النفس الإيجابي وعلاج القلق"}</span>
            </span>
            <h2 className="text-xl md:text-2xl font-extrabold text-[#3A3A3A] tracking-tight">
              {isEn ? "My Gratitude Journal" : "مفكرة الامتنان وجدار السلام الإيجابي"}
            </h2>
            <p className="text-xs md:text-sm text-gray-500 leading-relaxed font-normal">
              {isEn 
                ? "Record unlimited moments of peace. Focusing your mind on gratitude rewires your brain to overcome daily stress, anxiety, and depressive thoughts."
                : "دوّن عدداً لا نهائي من الأشياء واللحظات الإيجابية التي حدثت في يومك لتتحول لبطاقات ملونة مبهجة. توجيه انتباه عقلك نحو مسببات الامتنان يحفز المرونة العصبية للتغلب على القلق."}
            </p>
          </div>
          
          <div className="flex flex-row md:flex-col items-center md:items-end justify-between bg-white/70 backdrop-blur-xs p-4 rounded-2xl border border-[#E2DCC8]/65 gap-3 shrink-0">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="p-1.5 bg-rose-50 border border-rose-100 text-rose-500 rounded-xl">
                <Heart className="w-5 h-5 fill-rose-500 animate-pulse" />
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 font-bold">{isEn ? "Total Moments" : "مجموع لحظات الرضا"}</p>
                <p className="text-sm font-extrabold text-[#3A3A3A]">{gratitudeCards.length} {isEn ? "cards" : "بطاقة ملونة"}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleShowRandomMemory}
                disabled={gratitudeCards.length === 0}
                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-[10px] font-extrabold flex items-center space-x-1 space-x-reverse shadow-2xs cursor-pointer"
                title={isEn ? "Show Random Gratitude Memory" : "استرجاع لحظة امتنان عشوائية من الأرشيف"}
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>{isEn ? "Random Memory" : "ذكري عشوائية 🎰"}</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="p-1.5 bg-white border border-[#E2DCC8] hover:bg-gray-50 text-gray-600 rounded-xl text-xs font-bold cursor-pointer shadow-3xs"
                title={isEn ? "Print / Export Wall" : "طباعة وتصدير جدار الامتنان"}
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Reminders & AI Insights */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card Creation Form */}
          <div className="bg-white border border-[#E2DCC8] rounded-3xl p-5 shadow-xs space-y-4">
            <h3 className="font-extrabold text-[#3A3A3A] text-xs flex items-center space-x-2 space-x-reverse">
              <span>✍️</span>
              <span>{isEn ? "Add a New Positive Moment" : "أضف لحظة إيجابية جديدة (عدد غير محدود)"}</span>
            </h3>
            
            <form onSubmit={handleAddCard} className="space-y-4">
              <div>
                <textarea
                  rows={3}
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder={isEn 
                    ? "What small, positive thing happened today? (e.g. coffee with a friend, a warm greeting, complete code task...)"
                    : "ما هو الشيء الإيجابي الصغير الذي حدث اليوم وتريد شكر الله عليه؟ (مثلاً: ابتسامة عائلتي، طقس هادئ ومثالي، فنجان قهوة، إنجاز كود برمجي...)"}
                  className="w-full bg-[#F9F7F2] focus:bg-white border border-[#E2DCC8] focus:ring-2 focus:ring-[#8B9D83] focus:border-[#8B9D83] focus:outline-none rounded-2xl p-3.5 text-xs text-[#3A3A3A] leading-relaxed transition-all placeholder-gray-400 resize-none"
                />
              </div>

              {/* Quick Prompt Pill Helpers */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-400">{isEn ? "Quick Prompts (Click to Fill):" : "أفكار مقترحة للكتابة والتدفق (اضغط للملء الفوري):"}</label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {activePrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewText(prompt.text)}
                      className="text-[10px] font-bold px-2 py-1 bg-[#F9F7F2] hover:bg-[#8B9D83]/10 border border-[#E2DCC8]/60 text-[#5A5A40] rounded-lg transition-all cursor-pointer whitespace-nowrap"
                    >
                      {prompt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selection */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-gray-500">{isEn ? "Select Polaroid Card Color Theme:" : "اختر لون بطاقة الامتنان الفنية:"}</label>
                <div className="flex flex-wrap gap-2">
                  {PASTEL_COLORS.map((col, idx) => (
                    <button
                      key={idx}
                      type="button"
                      title={col.name}
                      onClick={() => setSelectedColor(col.class)}
                      className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer relative ${col.class.split(' ')[0]} ${
                        selectedColor === col.class ? 'scale-115 border-[#8B9D83] shadow-md' : 'border-transparent hover:scale-105'
                      }`}
                    >
                      {selectedColor === col.class && (
                        <Check className="w-3.5 h-3.5 absolute inset-0 m-auto text-current" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!newText.trim()}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 space-x-reverse cursor-pointer ${
                  newText.trim()
                    ? 'bg-[#8B9D83] hover:bg-[#72856A] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>{isEn ? "Hang this card on my Gratitude Wall" : "تعليق هذه البطاقة الملونة في جدار امتناني"}</span>
              </button>
            </form>
          </div>

          {/* Gratitude Alarms & Reminders */}
          <div className="bg-white border border-[#E2DCC8] rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-[#3A3A3A] text-xs flex items-center space-x-2 space-x-reverse">
                <Bell className="w-4 h-4 text-amber-500" />
                <span>{isEn ? "Daily Gratitude Reminder" : "تذكير ممارسة الامتنان وتخفيف القلق اليومي"}</span>
              </h3>
              
              <button
                type="button"
                onClick={() => setReminderEnabled(!reminderEnabled)}
                className={`text-[10px] px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                  reminderEnabled 
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                    : 'bg-gray-100 text-gray-400 border border-transparent'
                }`}
              >
                {reminderEnabled ? (isEn ? 'Active 🟢' : 'مفعّل حالياً 🟢') : (isEn ? 'Disabled ⚪' : 'معطّل ⚪')}
              </button>
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed font-normal">
              {isEn 
                ? "The app triggers a gentle, calming browser/in-app notification reminder to check-in on your gratitude at your selected hour."
                : "سيقوم التطبيق بإرسال تنبيه شعوري لطيف ومحبب في الوقت المحدد لتنبيهك للتنفس وكتابة اللحظات المبهجة التي تفرغ ذهنك من التوتر."}
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#F9F7F2] p-3 rounded-2xl border border-[#E2DCC8]/50">
              <div className="flex items-center space-x-2 space-x-reverse justify-between">
                <span className="text-xs text-[#5A5A40] font-bold">{isEn ? "Alarm Time:" : "وقت التنبيه اليومي:"}</span>
                {reminderEnabled && (
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="bg-white border border-[#E2DCC8] focus:border-[#8B9D83] focus:ring-1 focus:ring-[#8B9D83] rounded-lg px-2 py-1 text-xs text-[#3A3A3A] font-bold focus:outline-none"
                  />
                )}
              </div>
              
              {triggerGratitudeNotificationNow && (
                <button
                  type="button"
                  onClick={triggerGratitudeNotificationNow}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-extrabold flex items-center justify-center space-x-1 space-x-reverse shadow-3xs cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>{isEn ? "Simulate Notification Now" : "محاكاة واختبار التنبيه الآن"}</span>
                </button>
              )}
            </div>
          </div>

          {/* AI Positive Psychology Hub */}
          <div className="bg-gradient-to-br from-[#8B9D83]/10 to-amber-50/20 border border-[#E2DCC8] rounded-3xl p-5 shadow-xs space-y-4">
            <h3 className="font-extrabold text-[#3A3A3A] text-xs flex items-center space-x-2 space-x-reverse">
              <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>{isEn ? "AI Positive Psychology Companion" : "مستشار ومحفز الوعي الإيجابي الذكي AI"}</span>
            </h3>

            <p className="text-[11px] text-gray-500 leading-relaxed font-normal">
              {isEn
                ? "Let Gemini analyze your moments to highlight happiness patterns, suggest customized mindfulness cues, or extract positive moments from recent notes."
                : "دع الذكاء الاصطناعي يحلل بطاقات رضاك للكشف عن مسببات بهجتك، أو صياغة تلميحات تفرغ ذهنك، أو تصفح يومياتك لإيجاد بطاقة امتنان دافئة بالنيابة عنك."}
            </p>

            <div className="flex flex-col space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleAiAction('reflect')}
                  disabled={aiLoading || gratitudeCards.length === 0}
                  className={`py-2 px-2.5 border rounded-xl text-[10px] font-extrabold transition-all flex items-center justify-center space-x-1 space-x-reverse cursor-pointer ${
                    gratitudeCards.length === 0
                      ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'border-[#8B9D83] bg-white text-[#5A5A40] hover:bg-[#8B9D83]/5'
                  }`}
                >
                  <span>✨ {isEn ? "Reflect on Gratitude Patterns" : "تحليل أنماط امتناني"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAiAction('suggest')}
                  disabled={aiLoading}
                  className="py-2 px-2.5 border border-[#D4A373] bg-white text-[#D4A373] hover:bg-[#D4A373]/5 rounded-xl text-[10px] font-extrabold transition-all flex items-center justify-center space-x-1 space-x-reverse cursor-pointer"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>💡 {isEn ? "Mindfulness Prompts" : "اقتراح أسئلة مخصصة"}</span>
                </button>
              </div>

              {/* Direct Link to Diaries: AI generator */}
              <button
                type="button"
                onClick={() => handleAiAction('ai_generator')}
                disabled={aiLoading || diaries.length === 0}
                className={`w-full py-2 px-3 border rounded-xl text-[10px] font-extrabold transition-all flex items-center justify-center space-x-1.5 space-x-reverse cursor-pointer ${
                  diaries.length === 0
                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                    : 'border-amber-500 bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>🪄 {isEn ? "Generate Gratitude Card from Diaries" : "مولد بطاقات الامتنان الذكي من مذكراتي اليومية"}</span>
              </button>
            </div>

            {/* AI Result Area / Loading */}
            {aiLoading && (
              <div className="bg-white border border-[#E2DCC8]/50 p-4 rounded-2xl flex flex-col items-center justify-center space-y-2 py-6">
                <RefreshCw className="w-5 h-5 text-[#8B9D83] animate-spin" />
                <span className="text-[10px] text-gray-500 font-bold">{isEn ? "Reviewing card deck and diary transcripts..." : "جاري قراءة مذكراتك وتحليل بطاقات رضاك وتوليد الدعم المعرفي..."}</span>
              </div>
            )}

            {/* Proposed Generated Card */}
            <AnimatePresence>
              {proposedCard && !aiLoading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white border-2 border-dashed border-amber-300 rounded-2xl p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-amber-100">
                    <span className="text-[10px] font-bold text-amber-600 flex items-center space-x-1 space-x-reverse">
                      <span>🪄</span>
                      <span>{isEn ? "AI-Suggested Gratitude Card" : "بطاقة امتنان مستخلصة بالذكاء الاصطناعي"}</span>
                    </span>
                    <button 
                      onClick={() => setProposedCard(null)}
                      className="text-gray-400 hover:text-gray-600 text-[10px] font-bold"
                    >
                      {isEn ? 'Cancel' : 'إلغاء'}
                    </button>
                  </div>
                  
                  <p className="text-xs text-[#3A3A3A] italic leading-relaxed font-semibold text-right">
                    "{proposedCard.text}"
                  </p>

                  <div className="flex space-x-2 space-x-reverse pt-1">
                    <button
                      type="button"
                      onClick={handleAddProposedCard}
                      className="flex-1 py-1.5 px-3 bg-[#8B9D83] hover:bg-[#72856A] text-white text-[10px] font-extrabold rounded-xl transition-all cursor-pointer"
                    >
                      {isEn ? 'Accept & Save Card ✓' : 'موافق، علّق البطاقة الآن 🌸'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAiAction('ai_generator')}
                      className="py-1.5 px-3 bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100 text-[10px] font-bold rounded-xl transition-all cursor-pointer"
                    >
                      {isEn ? 'Try Another' : 'استخلص فكرة أخرى'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Direct Query Input to AI Advisor */}
            <div className="pt-2 border-t border-[#E2DCC8]/40 space-y-2">
              <label className="block text-[10px] font-extrabold text-[#5A5A40] flex items-center space-x-1 space-x-reverse">
                <Brain className="w-3.5 h-3.5 text-[#8B9D83]" />
                <span>{isEn ? "Ask Smart Advisor about your gratitude:" : "اطرح سؤالاً ذكياً مباشرًا على مستشارك حول امتنانك 🤖"}</span>
              </label>
              <form onSubmit={handleSendDirectQuestion} className="flex gap-1.5">
                <input
                  type="text"
                  value={directQuestionText}
                  onChange={(e) => setDirectQuestionText(e.target.value)}
                  placeholder={isEn ? "e.g., How can I stay grateful on tough days?" : "مثال: كيف أستثمر هذه الامتنانات لتقوية عزيمتي في الأيام الصعبة؟"}
                  className="flex-1 bg-white border border-[#E2DCC8] focus:border-[#8B9D83] focus:ring-1 focus:ring-[#8B9D83] rounded-xl px-2.5 py-1.5 text-xs text-[#3A3A3A] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={directQuestionLoading || !directQuestionText.trim()}
                  className="px-3 py-1.5 bg-[#8B9D83] hover:bg-[#72856A] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  {directQuestionLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3 h-3 rotate-180" />
                      <span>{isEn ? "Ask" : "إرسال"}</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Normal AI Text Result */}
            <AnimatePresence mode="wait">
              {aiResult && !aiLoading && !proposedCard && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white border border-[#E2DCC8] rounded-2xl p-4 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <span className="text-[10px] font-extrabold text-[#8B9D83] flex items-center space-x-1 space-x-reverse">
                      <span>🧠</span>
                      <span>{aiActionType === 'reflect' ? (isEn ? 'Gratitude Reflections' : 'تقرير التأمل الشعوري') : (isEn ? 'Mindful Prompts' : 'أسئلة تفكرية للامتنان')}</span>
                    </span>
                    <span className="text-[9px] text-gray-400">Gemini 3.5 Flash</span>
                  </div>
                  
                  <div className="text-[11px] text-gray-600 leading-relaxed font-normal whitespace-pre-wrap max-h-64 overflow-y-auto pr-1">
                    {aiResult}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI History Log & Exports Accordion Container */}
            <div className="mt-4 pt-4 border-t border-[#E2DCC8]/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="p-1.5 bg-amber-100/60 rounded-xl text-amber-700">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-[#3A3A3A]">
                      {isEn ? "AI Gratitude History & Answers Log" : "سجل نتائج ومقترحات الذكاء الاصطناعي"}
                    </h4>
                    <p className="text-[10px] text-gray-400">
                      {isEn ? "Saved reflections, answered questions, and generated cards" : "حفظ تلقائي لكافة التحليلات، الأسئلة والأجوبة، والبطاقات المولدة"}
                    </p>
                  </div>
                </div>
                
                <span className="text-[10px] font-extrabold bg-[#8B9D83]/15 text-[#5A5A40] px-2.5 py-0.5 rounded-full">
                  {aiHistory.length} {isEn ? "saved" : "عنصر محفوظ"}
                </span>
              </div>

              {/* History Filter Tabs */}
              <div className="flex flex-wrap gap-1 bg-[#F9F7F2] p-1 rounded-xl border border-[#E2DCC8]/50 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setHistoryTab('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${historyTab === 'all' ? 'bg-[#8B9D83] text-white shadow-2xs' : 'text-gray-500 hover:bg-white/60'}`}
                >
                  {isEn ? "All" : "الكل"} ({aiHistory.length})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryTab('reflect')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${historyTab === 'reflect' ? 'bg-[#8B9D83] text-white shadow-2xs' : 'text-gray-500 hover:bg-white/60'}`}
                >
                  ✨ {isEn ? "Patterns" : "أنماط امتناني"} ({aiHistory.filter(h => h.type === 'reflect').length})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryTab('suggest')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${historyTab === 'suggest' ? 'bg-[#8B9D83] text-white shadow-2xs' : 'text-gray-500 hover:bg-white/60'}`}
                >
                  💡 {isEn ? "Prompts & Answers" : "الأسئلة وإجاباتك"} ({aiHistory.filter(h => h.type === 'suggest').length})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryTab('ai_generator')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${historyTab === 'ai_generator' ? 'bg-[#8B9D83] text-white shadow-2xs' : 'text-gray-500 hover:bg-white/60'}`}
                >
                  🪄 {isEn ? "Cards" : "البطاقات المولدة"} ({aiHistory.filter(h => h.type === 'ai_generator').length})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryTab('qa')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${historyTab === 'qa' ? 'bg-[#8B9D83] text-white shadow-2xs' : 'text-gray-500 hover:bg-white/60'}`}
                >
                  🤖 {isEn ? "Consultations" : "استشارات خاصة"} ({aiHistory.filter(h => h.type === 'qa').length})
                </button>
              </div>

              {/* History items list */}
              {aiHistory.filter(item => historyTab === 'all' || item.type === historyTab).length === 0 ? (
                <div className="bg-white/60 border border-dashed border-[#E2DCC8] rounded-2xl p-5 text-center text-gray-400 text-xs space-y-1">
                  <Sparkles className="w-6 h-6 mx-auto opacity-30 text-amber-500" />
                  <p className="font-bold text-[#3A3A3A]">{isEn ? "No items saved in this category yet" : "لا توجد عناصر محفوظة في هذا التصنيف حتى الآن"}</p>
                  <p className="text-[10px] text-gray-400">
                    {isEn ? "Click any AI button above to generate and automatically save insights & questions." : "اضغط على أزرار الذكاء الاصطناعي أعلاه للحصول على تحليلات وأسئلة وحفظها تلقائياً هنا."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                  {aiHistory
                    .filter(item => historyTab === 'all' || item.type === historyTab)
                    .map((item) => (
                      <div key={item.id} className="bg-white border border-[#E2DCC8] rounded-2xl p-3.5 shadow-2xs space-y-2.5">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                          <div className="flex items-center space-x-1.5 space-x-reverse">
                            <span className="text-xs">
                              {item.type === 'reflect' ? '✨' : item.type === 'suggest' ? '💡' : item.type === 'ai_generator' ? '🪄' : '🤖'}
                            </span>
                            <span className="text-xs font-bold text-[#3A3A3A]">{item.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-gray-400">
                              {new Date(item.createdAt).toLocaleDateString(isEn ? 'en-US' : 'ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteHistoryItem(item.id)}
                              className="text-gray-300 hover:text-red-500 p-1 rounded-lg transition-colors cursor-pointer"
                              title={isEn ? "Delete from history" : "حذف من السجل"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Prompt or Question Context if available */}
                        {item.promptOrContext && (
                          <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-2 text-[11px] text-amber-900 font-semibold">
                            <span className="font-extrabold">{isEn ? "Query / Context: " : "السؤال / السياق: "}</span>
                            {item.promptOrContext}
                          </div>
                        )}

                        {/* Main AI Generated Content */}
                        <div className="text-xs text-[#3A3A3A] leading-relaxed font-normal whitespace-pre-wrap bg-[#F9F7F2]/70 p-2.5 rounded-xl border border-[#E2DCC8]/40">
                          {item.content}
                        </div>

                        {/* User Answer Area for Prompts/Questions */}
                        {item.type === 'suggest' && (
                          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-2.5 space-y-2">
                            <div className="flex items-center justify-between text-[10px] font-bold text-emerald-800">
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3 text-emerald-600" />
                                <span>{isEn ? "Your Answer / Reflection:" : "إجابتك وتأملك الشخصي على هذا السؤال:"}</span>
                              </span>
                              {item.userAnswer && (
                                <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[9px] font-bold">
                                  {isEn ? "Answered ✓" : "تمت الإجابة ✓"}
                                </span>
                              )}
                            </div>

                            {editingAnswerId === item.id ? (
                              <div className="space-y-2">
                                <textarea
                                  rows={2}
                                  value={tempAnswerText}
                                  onChange={(e) => setTempAnswerText(e.target.value)}
                                  placeholder={isEn ? "Write your thoughts and answer here..." : "اكتب إجابتك وتأملك هنا مستلهمة من هذا السؤال..."}
                                  className="w-full bg-white border border-emerald-200 focus:border-emerald-500 rounded-xl p-2 text-xs text-[#3A3A3A] focus:outline-none resize-none"
                                />
                                <div className="flex gap-1.5 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => setEditingAnswerId(null)}
                                    className="px-2.5 py-1 bg-gray-100 text-gray-500 text-[10px] font-bold rounded-lg cursor-pointer"
                                  >
                                    {isEn ? "Cancel" : "إلغاء"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveQuestionAnswer(item.id, tempAnswerText)}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold rounded-lg cursor-pointer shadow-2xs"
                                  >
                                    {isEn ? "Save Answer ✓" : "حفظ الإجابة وتأكيد الرضا ✓"}
                                  </button>
                                </div>
                              </div>
                            ) : item.userAnswer ? (
                              <div className="space-y-1.5">
                                <p className="text-xs font-semibold text-emerald-950 italic bg-white p-2 rounded-lg border border-emerald-100">
                                  "{item.userAnswer}"
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingAnswerId(item.id);
                                    setTempAnswerText(item.userAnswer || '');
                                  }}
                                  className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer flex items-center gap-1"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>{isEn ? "Edit Answer" : "تعديل الإجابة"}</span>
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingAnswerId(item.id);
                                  setTempAnswerText('');
                                }}
                                className="w-full py-1.5 bg-white border border-emerald-200 hover:bg-emerald-100/50 text-emerald-700 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>{isEn ? "Answer this question now" : "أجب على هذا السؤال وسجل تأملك الآن"}</span>
                              </button>
                            )}
                          </div>
                        )}

                        {/* Export Toolbar */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-gray-100">
                          <span className="text-[10px] text-gray-400 font-bold ml-1">{isEn ? "Export to:" : "إضافة السجل إلى:"}</span>

                          {/* Save to Gratitude Card */}
                          <button
                            type="button"
                            onClick={() => handleExportToGratitudeCard(item.userAnswer ? `${item.content}\n\nإجابتي: ${item.userAnswer}` : item.content)}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 text-amber-800 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer flex items-center gap-1"
                            title={isEn ? "Save as Gratitude Card on Wall" : "تعليق كبطاقة ملونة في جدار الامتنان"}
                          >
                            <span>🌸</span>
                            <span>{isEn ? "Gratitude Card" : "بطاقة امتنان"}</span>
                          </button>

                          {/* Export to Daily Venting */}
                          <button
                            type="button"
                            onClick={() => handleExportToDailyVenting(item.title, item.userAnswer ? `سؤال الامتنان: ${item.content}\n\nتأملي وإجابتي اليومية:\n${item.userAnswer}` : item.content)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 text-emerald-800 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer flex items-center gap-1"
                            title={isEn ? "Append to Daily Venting Entries" : "إضافة إلى اليوميات"}
                          >
                            <span>📖</span>
                            <span>{isEn ? "Daily Venting" : "اليوميات"}</span>
                          </button>

                          {/* Export to Thoughts */}
                          <button
                            type="button"
                            onClick={() => handleExportToThoughts(item.title, item.userAnswer ? `فكرة تفكرية: ${item.content}\n\nالخاطرة الإيجابية:\n${item.userAnswer}` : item.content)}
                            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 border border-purple-200/60 text-purple-800 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer flex items-center gap-1"
                            title={isEn ? "Save to Thoughts & Reflections" : "إضافة إلى الخواطر"}
                          >
                            <span>✍️</span>
                            <span>{isEn ? "Thoughts & Diary" : "الخواطر"}</span>
                          </button>

                          {/* Copy Text */}
                          <button
                            type="button"
                            onClick={() => {
                              const fullText = item.userAnswer ? `${item.content}\n\nإجابتي: ${item.userAnswer}` : item.content;
                              navigator.clipboard.writeText(fullText);
                              showToast(isEn ? "Copied to clipboard!" : "تم نسخ النص إلى الحافظة! 📋");
                            }}
                            className="px-2 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                            title={isEn ? "Copy text" : "نسخ النص"}
                          >
                            <Copy className="w-3 h-3" />
                            <span>{isEn ? "Copy" : "نسخ"}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Cards Grid with Filters & Actions */}
        <div className="lg:col-span-7 space-y-4 text-right">
          
          {/* Card Filter Toolbar */}
          <div className="bg-white border border-[#E2DCC8] p-4 rounded-3xl shadow-3xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <h3 className="font-extrabold text-[#3A3A3A] text-xs flex items-center space-x-1.5 space-x-reverse">
                <Award className="w-4 h-4 text-[#8B9D83]" />
                <span>{isEn ? "My Gratitude Wall & Happy Deck" : "جدار ممتناتي وبطاقات الرضا النفسي"}</span>
              </h3>
              
              {/* Search input */}
              <div className="relative w-full sm:max-w-xs">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isEn ? "Search positive cards..." : "ابحث في بطاقات امتنناك..."}
                  className="w-full bg-[#F9F7F2] border border-[#E2DCC8]/80 focus:border-[#8B9D83] rounded-xl py-1.5 pl-3 pr-8 text-xs text-[#3A3A3A] placeholder-gray-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Color filter pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-[#E2DCC8]/30">
              <span className="text-[10px] font-bold text-gray-400 ml-1.5 flex items-center gap-1">
                <Filter className="w-3 h-3 text-gray-400" />
                {isEn ? "Color Filter:" : "فلترة اللون:"}
              </span>
              
              <button
                onClick={() => setSelectedColorFilter('all')}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all border cursor-pointer ${
                  selectedColorFilter === 'all'
                    ? 'bg-[#8B9D83] text-white border-[#8B9D83]'
                    : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                }`}
              >
                {isEn ? "All" : "الكل"}
              </button>

              {PASTEL_COLORS.map(col => {
                const isSelected = selectedColorFilter !== 'all' && col.class.includes(selectedColorFilter);
                return (
                  <button
                    key={col.id}
                    onClick={() => setSelectedColorFilter(col.class.split(' ')[0])}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all border cursor-pointer ${col.class.split(' ')[0]} ${
                      isSelected 
                        ? 'border-[#8B9D83] ring-2 ring-[#8B9D83]/20 font-extrabold scale-102' 
                        : 'border-gray-200/40 text-current opacity-80'
                    }`}
                  >
                    {col.name}
                  </button>
                );
              })}
            </div>
          </div>

          {filteredCards.length === 0 ? (
            <div className="bg-white border border-[#E2DCC8] rounded-3xl p-12 text-center text-gray-400 text-sm">
              <Smile className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#8B9D83]" />
              <p className="font-extrabold text-[#3A3A3A]">{isEn ? "No matching gratitude cards" : "جدار ممتناتك لا يحتوي بطاقات تطابق بحثك!"}</p>
              <p className="text-xs mt-1 text-gray-400">
                {isEn 
                  ? "Try resetting filters or write your first positive card using the left panel."
                  : "جرب إعادة تعيين الفلاتر أو اكتب فكرة رضا جديدة من القائمة الجانبية وحوّلها لبطاقة ملونة!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {filteredCards.map((card) => {
                  const cardDate = new Date(card.createdAt).toLocaleDateString(isEn ? 'en-US' : 'ar-EG', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  });

                  const isAnalyzing = analyzingCardId === card.id;
                  const analysisText = cardAnalysisResults[card.id];

                  return (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                      className={`relative border rounded-3xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between min-h-40 ${card.color}`}
                    >
                      {/* Control panel inside card (top) */}
                      <div className="absolute top-3 left-3 flex items-center space-x-1 space-x-reverse z-10">
                        {/* Audio TTS Button */}
                        <button
                          type="button"
                          onClick={() => handleSpeakCard(card.id, card.text)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer border border-[#E2DCC8]/40 shadow-3xs ${
                            speakingCardId === card.id
                              ? 'bg-amber-500 text-white animate-pulse'
                              : 'bg-white/85 hover:bg-amber-50 text-amber-700'
                          }`}
                          title={isEn ? "Listen to Card" : "استماع للبطاقة بصوت واضح"}
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>

                        {/* Copy Card Text Button */}
                        <button
                          type="button"
                          onClick={() => handleCopyCard(card.id, card.text)}
                          className="p-1.5 bg-white/85 hover:bg-emerald-50 text-gray-500 hover:text-emerald-700 rounded-lg transition-colors cursor-pointer border border-[#E2DCC8]/40 shadow-3xs"
                          title={isEn ? "Copy text" : "نسخ نص البطاقة"}
                        >
                          {copiedCardId === card.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>

                        {/* Sparkle Neuro-Analysis Button */}
                        <button
                          type="button"
                          onClick={() => handleAnalyzeSingleCard(card.id, card.text)}
                          disabled={isAnalyzing}
                          className="p-1.5 bg-white/85 hover:bg-amber-50 text-amber-600 hover:text-amber-700 rounded-lg transition-colors cursor-pointer border border-[#E2DCC8]/40 shadow-3xs"
                          title={isEn ? "Analyze psychological impact" : "تحليل طبي للأثر النفسي والبيوكيميائي للبطاقة"}
                        >
                          {isAnalyzing ? (
                            <RefreshCw className="w-3 h-3 animate-spin text-amber-500" />
                          ) : (
                            <Sparkles className="w-3 h-3 fill-amber-500/10" />
                          )}
                        </button>

                        {/* Delete Card Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteCard(card.id)}
                          className="p-1.5 bg-white/85 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer border border-[#E2DCC8]/40 shadow-3xs"
                          title={isEn ? "Delete Card" : "حذف البطاقة"}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="space-y-3 pt-3">
                        {/* Polaroid Handwriting Vibe */}
                        <p className="text-xs font-bold leading-relaxed text-[#3A3A3A] font-sans text-right">
                          {card.text}
                        </p>
                      </div>

                      {/* Display Neuro-chemical Analysis if available */}
                      <AnimatePresence>
                        {analysisText && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 pt-2.5 border-t border-[#3A3A3A]/8 bg-white/45 p-2 rounded-xl text-[10px] text-gray-600 leading-relaxed font-normal text-right space-y-1"
                          >
                            <span className="font-extrabold text-amber-800 flex items-center space-x-1 space-x-reverse justify-end text-[9px]">
                              <span>🧠</span>
                              <span>الأثر الكيميائي العصبي (Gemini):</span>
                            </span>
                            <p className="italic">"{analysisText}"</p>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="pt-3 mt-3 border-t border-[#3A3A3A]/5 flex items-center justify-between text-[10px] text-gray-400 font-bold">
                        <span className="flex items-center space-x-1 space-x-reverse bg-white/50 px-2 py-0.5 rounded-md">
                          <Calendar className="w-3 h-3" />
                          <span>{cardDate}</span>
                        </span>
                        
                        <span className="text-[#8B9D83] select-none text-xs">🌸</span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* RANDOM GRATITUDE MEMORY MODAL */}
      <AnimatePresence>
        {randomCard && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl border ${randomCard.color}`}
              dir={isEn ? "ltr" : "rtl"}
            >
              <div className="flex justify-between items-center border-b border-[#3A3A3A]/10 pb-3">
                <span className="text-xs font-black text-[#5A5A40] flex items-center gap-1.5">
                  <Shuffle className="w-4 h-4 text-amber-600" />
                  <span>{isEn ? "Random Memory Flashcard 🎰" : "ذكرى امتنان استرجاعية من أرشيفك 🎰"}</span>
                </span>
                <button
                  onClick={() => setRandomCard(null)}
                  className="text-gray-400 hover:text-gray-700 text-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 bg-white/60 rounded-2xl border border-white/80 space-y-2">
                <p className="text-sm font-bold text-[#3A3A3A] leading-relaxed">
                  "{randomCard.text}"
                </p>
                <p className="text-[10px] text-gray-500 font-bold">
                  🗓️ {new Date(randomCard.createdAt).toLocaleDateString(isEn ? 'en-US' : 'ar-SA', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[11px] text-amber-900 leading-relaxed font-bold">
                💡 {isEn ? "Remember: Re-visiting past gratitude triggers dopamine and reinforces peaceful emotional pathways!" : "تذكّر: إعادة استحضار لحظات الامتنان السابقة يرفع هرمون الدوبامين ويعزز مرونة دماغك العصبي ضد القلق والتفكير السلبي!"}
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => handleSpeakCard(randomCard.id, randomCard.text)}
                  className="py-2 px-3 bg-white/80 hover:bg-white text-amber-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer border shadow-3xs"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{isEn ? "Listen 🔊" : "استمع للذكرى 🔊"}</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleShowRandomMemory}
                    className="py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    {isEn ? "Another Memory 🎰" : "ذكرى أخرى 🎰"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRandomCard(null)}
                    className="py-2 px-4 bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    {isEn ? "Close" : "إغلاق"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-[#3A3A3A] text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-extrabold flex items-center space-x-2 space-x-reverse border border-amber-400/30 backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
