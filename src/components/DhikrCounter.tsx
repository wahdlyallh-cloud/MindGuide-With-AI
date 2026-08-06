import React, { useState, useEffect } from 'react';
import { Sparkles, RotateCcw, Heart, Volume2, VolumeX } from 'lucide-react';
import { AppLanguage, getLanguageInfo, getTranslation } from '../lib/languages';

interface DhikrCounterProps {
  compact?: boolean;
  className?: string;
  appLanguage?: AppLanguage;
}

export default function DhikrCounter({ compact = false, className = '', appLanguage = 'ar' }: DhikrCounterProps) {
  const langInfo = getLanguageInfo(appLanguage);
  const t = getTranslation(appLanguage);
  const isEn = appLanguage !== 'ar' && appLanguage !== 'ur';
  // Read count from localStorage or default to 0
  const [count, setCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('yawmiyati_dhikr_total_count');
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('yawmiyati_dhikr_sound') !== 'false';
    } catch {
      return true;
    }
  });

  const [isTapped, setIsTapped] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Synchronize state to localStorage on update
  useEffect(() => {
    try {
      localStorage.setItem('yawmiyati_dhikr_total_count', count.toString());
    } catch (e) {
      console.warn('Failed to save dhikr count to localStorage', e);
    }
  }, [count]);

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent parent clicks if inside button
    const newCount = count + 1;
    setCount(newCount);

    // Visual feedback
    setIsTapped(true);
    setTimeout(() => setIsTapped(false), 150);

    // Haptic feedback if available on mobile
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        navigator.vibrate(35);
      } catch (err) {
        // ignore
      }
    }

    // Gentle audio click sound
    if (soundEnabled) {
      playSoftClickSound();
    }
  };

  const playSoftClickSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, audioCtx.currentTime); // gentle tone
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.09);
    } catch (e) {
      // AudioContext might be restricted until user interaction
    }
  };

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('yawmiyati_dhikr_sound', next ? 'true' : 'false');
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCount(0);
    setShowResetConfirm(false);
  };

  // Convert number to localized digits for presentation
  const formattedCount = count.toLocaleString(langInfo.code === 'ar' ? 'ar-EG' : 'en-US');

  return (
    <div 
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#1c3829]/90 via-[#274e3a]/85 to-[#162d21]/90 backdrop-blur-md border border-emerald-400/30 text-white p-4 sm:p-5 shadow-2xl ${className}`}
      dir={langInfo.dir}
    >
      {/* Decorative Golden Spiritual Glow background */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-emerald-400/15 rounded-full blur-2xl pointer-events-none" />

      {/* Top Bar with Sound and Reset controls */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-amber-300/90 text-xs font-black">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span>{t.dhikrTitle}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-emerald-200 transition-colors cursor-pointer"
            title={soundEnabled ? (isEn ? 'Mute click sound' : 'إيقاف صوت النقر') : (isEn ? 'Enable click sound' : 'تشغيل صوت النقر')}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-rose-300" />}
          </button>

          {!showResetConfirm ? (
            <button
              onClick={(e) => { e.stopPropagation(); setShowResetConfirm(true); }}
              className="p-1.5 rounded-full bg-white/10 hover:bg-rose-500/20 text-emerald-200 hover:text-rose-200 transition-colors cursor-pointer"
              title={isEn ? 'Reset counter' : 'تصفير العداد'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-full border border-rose-400/30 text-[10px]">
              <span className="text-rose-200 font-bold">{isEn ? 'Reset?' : 'تصفير؟'}</span>
              <button
                onClick={handleReset}
                className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-black cursor-pointer"
              >
                {isEn ? 'Yes' : 'نعم'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShowResetConfirm(false); }}
                className="px-1.5 py-0.5 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-bold cursor-pointer"
              >
                {isEn ? 'No' : 'لا'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Spiritual Phrase Card */}
      <div className="text-center space-y-2 my-2">
        <h3 className="text-lg sm:text-xl font-black text-amber-300 tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] font-serif">
          {isEn ? 'Spiritual Reflection & Mindfulness' : 'والباقيات الصالحات خير'}
        </h3>

        <p className="text-xs sm:text-sm font-extrabold text-emerald-100/95 leading-relaxed bg-white/10 py-1.5 px-3 rounded-2xl border border-emerald-300/20 inline-block shadow-inner">
          {t.dhikrSub}
        </p>

        <p className="text-sm sm:text-base font-black text-amber-200/90 flex items-center justify-center gap-1.5 drop-shadow-xs">
          <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400 animate-pulse" />
          <span>{isEn ? 'Peace, Gratitude & Serenity' : 'صلِّ على سيدك النبي'}</span>
          <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400 animate-pulse" />
        </p>
      </div>

      {/* Interactive Tasbeeh Counter Button */}
      <div className="mt-3.5 flex flex-col items-center">
        <button
          onClick={handleIncrement}
          className={`relative w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 active:scale-[0.97] text-slate-950 font-black text-sm shadow-[0_4px_20px_rgba(245,158,11,0.35)] border border-amber-200/50 cursor-pointer transition-all duration-150 flex items-center justify-between group overflow-hidden ${
            isTapped ? 'scale-95 shadow-inner' : ''
          }`}
        >
          {/* Animated Glow overlay on click */}
          <div className="absolute inset-0 bg-white/20 opacity-0 group-active:opacity-100 transition-opacity" />

          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-slate-900/20 rounded-xl text-slate-950">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-xs sm:text-sm font-black tracking-tight">
              {t.dhikrCounterBtn}
            </span>
          </div>

          {/* Persistent Counter Badge */}
          <div className="flex items-center gap-1.5 bg-slate-900 text-amber-300 py-1 px-3 rounded-xl border border-amber-400/40 font-mono text-sm sm:text-base font-black shadow-md">
            <span className="text-[10px] text-amber-200 font-sans font-extrabold">{t.dhikrCountLabel}</span>
            <span className="text-amber-300 font-extrabold">{formattedCount}</span>
          </div>
        </button>

        <p className="text-[10px] text-emerald-200/70 font-semibold mt-2 text-center">
          ✨ {t.dhikrFooter}
        </p>
      </div>
    </div>
  );
}
