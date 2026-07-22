import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, Sparkles, Plus, Trash2, Bell, Calendar, Award, 
  Lightbulb, Smile, Check, RefreshCw, Search, Filter, 
  Brain, HelpCircle, ArrowRight, Zap, Play, Volume2, Copy, Printer, Shuffle
} from 'lucide-react';
import { GratitudeCard, AppSettings, DiaryEntry } from '../types';

interface GratitudeJournalProps {
  gratitudeCards: GratitudeCard[];
  setGratitudeCards: React.Dispatch<React.SetStateAction<GratitudeCard[]>>;
  settings: AppSettings;
  diaries: DiaryEntry[];
  setActiveTab?: (tab: 'dashboard' | 'diaries' | 'advisor' | 'analytics' | 'settings') => void;
  setActiveDiariesSubTab?: (subTab: 'journal' | 'gratitude') => void;
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
  setActiveTab,
  setActiveDiariesSubTab,
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
    utterance.lang = isEn ? 'en-US' : 'ar-SA';
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
          } catch (e) {
            // If Gemini didn't return pure JSON, try to handle or parse
            console.error("Failed to parse AI Card generator response", e);
            setProposedCard({
              text: data.answer.replace(/[{}]/g, '').trim(),
              colorClass: 'lavender'
            });
          }
        } else {
          setAiResult(data.answer);
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

            {/* Smart Advisor Direct Query Link */}
            {setActiveTab && (
              <div className="pt-2 border-t border-[#E2DCC8]/40">
                <button
                  onClick={() => {
                    setActiveTab('advisor');
                    // wait and pre-fill query if possible
                    setTimeout(() => {
                      const input = document.getElementById('advisor-search-input') as HTMLTextAreaElement;
                      if (input) {
                        input.value = "استناداً لمفكرة الامتنان وبطاقاتي المسجلة، ما هي أكثر مصادر السعادة التي تدعمني نفسياً وكيف أحافظ عليها؟";
                        input.focus();
                      }
                    }, 100);
                  }}
                  className="w-full text-center text-[10px] font-extrabold text-[#8B9D83] hover:text-[#5A5A40] flex items-center justify-center space-x-1.5 space-x-reverse cursor-pointer py-1 bg-white/40 hover:bg-white/80 rounded-lg transition-all"
                >
                  <Brain className="w-3.5 h-3.5" />
                  <span>{isEn ? "Open Smart Advisor to Ask About Gratitude" : "اطرح سؤالاً ذكياً على مستشارك حول امتنانك 🤖"}</span>
                  <ArrowRight className="w-3 h-3 text-[#8B9D83] rotate-180" />
                </button>
              </div>
            )}

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
    </div>
  );
}
