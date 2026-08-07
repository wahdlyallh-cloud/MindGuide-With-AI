import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, Flame, PlusCircle, CheckCircle2, ChevronRight, Info, Heart, BookOpen, Brain, Droplets, Crown, ShieldCheck } from 'lucide-react';
import { AppLanguage, getTranslation } from '../lib/languages';

interface PsychologicalGrowthTreeProps {
  appLanguage: AppLanguage;
  diariesCount?: number;
  cbtCount?: number;
  gratitudeCount?: number;
  habitsCount?: number;
  activeStreak?: number;
  onQuickAction?: (action: 'journal' | 'gratitude' | 'cbt' | 'habits') => void;
}

export default function PsychologicalGrowthTree({
  appLanguage = 'ar',
  diariesCount = 0,
  cbtCount = 0,
  gratitudeCount = 0,
  habitsCount = 0,
  activeStreak = 1,
  onQuickAction,
}: PsychologicalGrowthTreeProps) {
  const t = getTranslation(appLanguage);
  const isRtl = appLanguage === 'ar' || appLanguage === 'ur';

  // Test mode to preview 365 days Ancient Wisdom Tree
  const [test365Mode, setTest365Mode] = useState(false);

  const effectiveStreak = test365Mode ? 365 : activeStreak;

  // Calculate Engagement XP
  const xpFromDiaries = (diariesCount || 0) * 10;
  const xpFromCbt = (cbtCount || 0) * 15;
  const xpFromGratitude = (gratitudeCount || 0) * 8;
  const xpFromHabits = (habitsCount || 0) * 5;
  const totalXP = xpFromDiaries + xpFromCbt + xpFromGratitude + xpFromHabits;

  // Growth Stage Calculation
  // Level 5 (شجرة الحكمة المعمرة) requires 365 days of continuous streak OR 320+ XP
  let stageLevel = 1;
  let stageName = t.treeStage1 || (isRtl ? 'بذرة النية 🌱' : 'Seedling of Intent 🌱');
  let stageDesc = t.treeDesc1 || (isRtl ? 'بداية رحلتك نحو السلام الداخلي' : 'Beginning your path to mindfulness');
  let maxXP = 30;
  let minXP = 0;
  let stageIcon = '🌱';

  if (effectiveStreak >= 365 || totalXP >= 320) {
    stageLevel = 5;
    stageName = t.treeStage5 || (isRtl ? 'شجرة الحكمة المعمرة 🌲👑✨' : 'Ancient Tree of Wisdom 🌲👑✨');
    stageDesc = t.treeDesc5 || (isRtl ? 'إنجاز 365 يوماً متتالياً! شجرة معمرة بالحكمة والسكينة والوعي الخالد 🌟' : '365 consecutive days milestone! An ancient tree of wisdom and eternal peace.');
    minXP = 320;
    maxXP = 500;
    stageIcon = '🌲👑✨';
  } else if (totalXP >= 180) {
    stageLevel = 4;
    stageName = t.treeStage4 || (isRtl ? 'شجرة الوعي المزهرة 🌸🌳' : 'Blooming Mind Tree 🌸🌳');
    stageDesc = t.treeDesc4 || (isRtl ? 'أثمرت مواظبتك اليومية هدوءاً وثباتاً' : 'Daily consistency blossoms into peace');
    minXP = 180;
    maxXP = 320;
    stageIcon = '🌸';
  } else if (totalXP >= 80) {
    stageLevel = 3;
    stageName = t.treeStage3 || (isRtl ? 'شجرة التوازن النفسي 🌳' : 'Tree of Balance 🌳');
    stageDesc = t.treeDesc3 || (isRtl ? 'جذورك النفسية تترسخ يوماً بعد يوم' : 'Your mental roots grow deeper every day');
    minXP = 80;
    maxXP = 180;
    stageIcon = '🌳';
  } else if (totalXP >= 30) {
    stageLevel = 2;
    stageName = t.treeStage2 || (isRtl ? 'برعم السلام الداخلي 🌿' : 'Sprout of Peace 🌿');
    stageDesc = t.treeDesc2 || (isRtl ? 'نمو ناعم مع كل فكرة تُدوّنها' : 'Gentle progress with every logged thought');
    minXP = 30;
    maxXP = 80;
    stageIcon = '🌿';
  }

  const currentLevelProgressXP = Math.max(0, totalXP - minXP);
  const neededXPForNext = Math.max(1, maxXP - minXP);
  const progressPercent = stageLevel === 5 ? 100 : Math.min(100, Math.round((currentLevelProgressXP / neededXPForNext) * 100));

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showNurtureSuccess, setShowNurtureSuccess] = useState(false);

  const handleNurtureClick = (type: 'journal' | 'gratitude' | 'cbt' | 'habits') => {
    setShowNurtureSuccess(true);
    setTimeout(() => setShowNurtureSuccess(false), 2000);
    if (onQuickAction) {
      onQuickAction(type);
    }
  };

  const isLevel5AncientTree = stageLevel === 5;

  return (
    <div className={`relative overflow-hidden ${isLevel5AncientTree ? 'bg-gradient-to-br from-[#1B281E] via-[#2D3A24] to-[#221F14] border-amber-400/60 shadow-amber-500/10' : 'bg-gradient-to-br from-[#1E2E23] via-[#2A3E31] to-[#1C2820] border-[#4E685B]/50'} text-white rounded-[32px] p-5 sm:p-6 shadow-xl border transition-all duration-500`}>
      
      {/* Background Glowing Orb & Ambient Aura */}
      {isLevel5AncientTree ? (
        <>
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-400/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-yellow-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.08)_0%,transparent_70%)] pointer-events-none" />
        </>
      ) : (
        <>
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        </>
      )}

      {/* Header Info */}
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 ${isLevel5AncientTree ? 'bg-amber-400/20 border-amber-300/40 text-amber-300' : 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300'} border rounded-2xl shadow-inner`}>
            {isLevel5AncientTree ? (
              <Crown className="w-5 h-5 text-amber-300 animate-bounce" />
            ) : (
              <Sparkles className="w-5 h-5 text-amber-300 animate-spin-slow" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-black tracking-wider ${isLevel5AncientTree ? 'text-amber-300' : 'text-emerald-300'} uppercase`}>
                {t.psychologicalGrowthTreeTitle || (isRtl ? 'شجرة النمو النفسي والوعي' : 'Mind Growth Tree')}
              </span>
              <span className={`px-2.5 py-0.5 text-[10px] ${isLevel5AncientTree ? 'bg-amber-400/30 text-amber-200 border-amber-300/50' : 'bg-amber-400/20 text-amber-300 border-amber-400/30'} border rounded-full font-black flex items-center gap-1`}>
                {isLevel5AncientTree && <Crown className="w-2.5 h-2.5 text-amber-300 fill-amber-300" />}
                Level {stageLevel} {isLevel5AncientTree && (isRtl ? '• 365 يوماً' : '• 365 Days')}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white mt-0.5 flex items-center gap-2">
              <span>{stageName}</span>
              {isLevel5AncientTree && (
                <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/40 rounded-full">
                  {isRtl ? 'إنجاز السنة ✨' : '1 Year Milestone ✨'}
                </span>
              )}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Active Streak Badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 ${effectiveStreak >= 365 ? 'bg-gradient-to-r from-amber-500/30 to-yellow-400/30 border-amber-300/60 text-amber-200' : 'bg-amber-500/20 border-amber-400/40 text-amber-300'} border rounded-2xl text-xs font-black shadow-3xs`}>
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
            <span>{effectiveStreak} {isRtl ? 'يوم' : 'Days'}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowInfoModal(true)}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-2xl text-emerald-200 transition-colors cursor-pointer"
            title="How it works"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Visual Animated Tree Canvas Display */}
      <div className={`relative z-10 my-4 ${isLevel5AncientTree ? 'bg-gradient-to-b from-black/40 via-amber-950/20 to-black/40 border-amber-400/30' : 'bg-black/20 border-white/10'} border rounded-2xl p-6 flex flex-col items-center justify-center min-h-[220px] overflow-hidden transition-all duration-500`}>
        
        {/* Particle Stars & Floating Leaves & Golden Wisdom Light */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {isLevel5AncientTree ? (
            <>
              {/* Golden Rotating Ring / Sunburst Halo */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                className="absolute w-52 h-52 border border-dashed border-amber-300/30 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
                className="absolute w-64 h-64 border border-dotted border-yellow-200/20 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              />
              {/* Floating Golden Wisdom Sparkles */}
              <motion.div 
                animate={{ y: [-15, 15, -15], x: [-5, 5, -5], opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-4 left-10 text-amber-300 text-sm drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]"
              >
                👑
              </motion.div>
              <motion.div 
                animate={{ y: [15, -15, 15], x: [8, -8, 8], opacity: [0.5, 1, 0.5], scale: [1, 1.3, 1] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-8 right-12 text-yellow-300 text-sm drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]"
              >
                ✨
              </motion.div>
              <motion.div 
                animate={{ y: [-10, 20, -10], opacity: [0.3, 0.9, 0.3] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute bottom-6 left-12 text-amber-200 text-xs"
              >
                🌟
              </motion.div>
              <motion.div 
                animate={{ y: [10, -20, 10], opacity: [0.3, 0.9, 0.3] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute bottom-8 right-16 text-emerald-300 text-xs"
              >
                🍃
              </motion.div>
            </>
          ) : (
            <>
              <motion.div 
                animate={{ y: [-10, 10, -10], opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-4 left-8 text-amber-300/40 text-xs"
              >
                ✨
              </motion.div>
              <motion.div 
                animate={{ y: [10, -10, 10], opacity: [0.2, 0.7, 0.2] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute bottom-6 right-10 text-emerald-300/40 text-xs"
              >
                🍃
              </motion.div>
            </>
          )}
        </div>

        {/* Tree Evolution Stages SVG/Icon Representation */}
        <motion.div
          key={stageLevel + (test365Mode ? '-test' : '')}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, type: 'spring' }}
          className="relative flex flex-col items-center justify-center my-2"
        >
          {/* Stage 1: Seedling */}
          {stageLevel === 1 && (
            <div className="relative flex flex-col items-center">
              <motion.div 
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-6xl drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]"
              >
                🌱
              </motion.div>
              <div className="w-20 h-3 bg-amber-900/40 rounded-full blur-xs mt-2" />
            </div>
          )}

          {/* Stage 2: Sprout */}
          {stageLevel === 2 && (
            <div className="relative flex flex-col items-center">
              <motion.div 
                animate={{ rotate: [-2, 2, -2], scale: [1, 1.04, 1] }}
                transition={{ duration: 3.5, repeat: Infinity }}
                className="text-7xl drop-shadow-[0_0_20px_rgba(52,211,153,0.6)]"
              >
                🌿
              </motion.div>
              <div className="w-24 h-3.5 bg-amber-900/50 rounded-full blur-xs mt-2" />
            </div>
          )}

          {/* Stage 3: Growing Tree */}
          {stageLevel === 3 && (
            <div className="relative flex flex-col items-center">
              <motion.div 
                animate={{ y: [-2, 2, -2] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="text-8xl drop-shadow-[0_0_25px_rgba(52,211,153,0.7)]"
              >
                🌳
              </motion.div>
              <div className="w-28 h-4 bg-amber-900/60 rounded-full blur-xs mt-2" />
            </div>
          )}

          {/* Stage 4: Blooming Tree */}
          {stageLevel === 4 && (
            <div className="relative flex flex-col items-center">
              <motion.div 
                animate={{ scale: [1, 1.05, 1], rotate: [-1, 1, -1] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="text-[90px] drop-shadow-[0_0_30px_rgba(244,114,182,0.8)]"
              >
                🌸🌳
              </motion.div>
              <div className="w-32 h-4 bg-amber-900/70 rounded-full blur-xs mt-2" />
            </div>
          )}

          {/* Stage 5: NEW LEVEL 5 - Ancient Perennial Tree of Wisdom (شجرة الحكمة المعمرة) */}
          {stageLevel >= 5 && (
            <div className="relative flex flex-col items-center">
              {/* Crown Floating Above Tree Crown */}
              <motion.div
                animate={{ y: [-6, 2, -6], scale: [1, 1.12, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="text-3xl drop-shadow-[0_0_15px_rgba(250,204,21,1)] z-20 mb-[-12px]"
              >
                👑
              </motion.div>

              {/* Glowing Golden Tree Crown */}
              <motion.div 
                animate={{ scale: [1, 1.08, 1], filter: ['drop-shadow(0 0 30px rgba(251,191,36,0.8))', 'drop-shadow(0 0 45px rgba(234,179,8,1))', 'drop-shadow(0 0 30px rgba(251,191,36,0.8))'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="text-[100px] leading-none z-10 flex items-center justify-center select-none"
              >
                🌲✨
              </motion.div>

              {/* Golden Roots Base Effect */}
              <div className="w-40 h-5 bg-gradient-to-r from-amber-600/40 via-yellow-500/60 to-amber-600/40 rounded-full blur-xs mt-1" />

              {/* Special 365 Days Master Banner */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 px-3.5 py-1 bg-gradient-to-r from-amber-500/30 via-yellow-400/40 to-amber-500/30 border border-amber-300/50 rounded-full text-[11px] font-black text-amber-200 flex items-center gap-1.5 shadow-lg backdrop-blur-md"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                <span>{isRtl ? 'وسام شجرة الحكمة المعمرة • 365 يوماً' : 'Ancient Tree of Wisdom • 365 Days'}</span>
              </motion.div>
            </div>
          )}
        </motion.div>

        {/* Motivational Stage Message */}
        <p className="text-xs text-emerald-200/90 font-medium text-center max-w-sm mt-2">
          {stageDesc}
        </p>

        {/* Floating Success Alert */}
        <AnimatePresence>
          {showNurtureSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-2 bg-emerald-500 text-gray-950 font-black text-xs px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 fill-gray-950" />
              <span>{isRtl ? 'تم سقي الشجرة وزيادة طاقة الوعي! 💧✨' : 'Tree nurtured! Consciousness XP gained! 💧✨'}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* XP Progress Bar */}
      <div className="relative z-10 space-y-1.5 mb-5">
        <div className="flex items-center justify-between text-xs font-bold text-emerald-200">
          <span className="flex items-center gap-1">
            <Trophy className={`w-3.5 h-3.5 ${isLevel5AncientTree ? 'text-amber-300' : 'text-amber-400'}`} />
            <span>{totalXP} XP</span>
          </span>
          <span className="text-amber-300 font-extrabold">
            {stageLevel === 5 ? (isRtl ? 'أعلى مستوى نمو متاح 🌟' : 'Max Level Achieved 🌟') : `${progressPercent}% ${isRtl ? 'مكتمل للمستوى التالي' : 'To Next Stage'}`}
          </span>
        </div>

        <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden p-0.5 border border-white/10">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full ${isLevel5AncientTree ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500' : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-300'} rounded-full shadow-md`}
          />
        </div>
      </div>

      {/* Quick Action Shortcuts ("Nurture Your Tree") */}
      <div className="relative z-10 space-y-2 pt-2 border-t border-white/10">
        <span className="text-[11px] font-black text-emerald-300/80 block">
          {isRtl ? 'اسقِ شجرتك وسجّل طاقاتك اليومية:' : 'Nurture your tree with daily logging:'}
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Log Diary */}
          <button
            type="button"
            onClick={() => handleNurtureClick('journal')}
            className="p-2.5 bg-white/10 hover:bg-emerald-600/30 border border-white/10 hover:border-emerald-400/50 rounded-2xl flex items-center gap-2 text-xs font-bold transition-all cursor-pointer group"
          >
            <div className="p-1.5 bg-emerald-500/30 text-emerald-300 rounded-xl group-hover:scale-110 transition-transform">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <div className="text-right rtl:text-right ltr:text-left">
              <span className="block text-[11px] leading-tight text-white">{isRtl ? 'مذكرة' : 'Journal'}</span>
              <span className="text-[9px] text-emerald-300/80 font-mono">+10 XP</span>
            </div>
          </button>

          {/* Gratitude */}
          <button
            type="button"
            onClick={() => handleNurtureClick('gratitude')}
            className="p-2.5 bg-white/10 hover:bg-rose-600/30 border border-white/10 hover:border-rose-400/50 rounded-2xl flex items-center gap-2 text-xs font-bold transition-all cursor-pointer group"
          >
            <div className="p-1.5 bg-rose-500/30 text-rose-300 rounded-xl group-hover:scale-110 transition-transform">
              <Heart className="w-3.5 h-3.5" />
            </div>
            <div className="text-right rtl:text-right ltr:text-left">
              <span className="block text-[11px] leading-tight text-white">{isRtl ? 'امتنان' : 'Gratitude'}</span>
              <span className="text-[9px] text-rose-300/80 font-mono">+8 XP</span>
            </div>
          </button>

          {/* CBT */}
          <button
            type="button"
            onClick={() => handleNurtureClick('cbt')}
            className="p-2.5 bg-white/10 hover:bg-purple-600/30 border border-white/10 hover:border-purple-400/50 rounded-2xl flex items-center gap-2 text-xs font-bold transition-all cursor-pointer group"
          >
            <div className="p-1.5 bg-purple-500/30 text-purple-300 rounded-xl group-hover:scale-110 transition-transform">
              <Brain className="w-3.5 h-3.5" />
            </div>
            <div className="text-right rtl:text-right ltr:text-left">
              <span className="block text-[11px] leading-tight text-white">{isRtl ? 'تمارين CBT' : 'CBT'}</span>
              <span className="text-[9px] text-purple-300/80 font-mono">+15 XP</span>
            </div>
          </button>

          {/* Habits */}
          <button
            type="button"
            onClick={() => handleNurtureClick('habits')}
            className="p-2.5 bg-white/10 hover:bg-sky-600/30 border border-white/10 hover:border-sky-400/50 rounded-2xl flex items-center gap-2 text-xs font-bold transition-all cursor-pointer group"
          >
            <div className="p-1.5 bg-sky-500/30 text-sky-300 rounded-xl group-hover:scale-110 transition-transform">
              <Droplets className="w-3.5 h-3.5" />
            </div>
            <div className="text-right rtl:text-right ltr:text-left">
              <span className="block text-[11px] leading-tight text-white">{isRtl ? 'عادات' : 'Habit'}</span>
              <span className="text-[9px] text-sky-300/80 font-mono">+5 XP</span>
            </div>
          </button>
        </div>
      </div>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfoModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#24362B] border border-emerald-400/30 text-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <h4 className="font-black text-emerald-300 text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>{isRtl ? 'كيف تنمو شجرة وعيك النفسي؟' : 'How Mind Growth Tree Works'}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowInfoModal(false)}
                  className="text-gray-400 hover:text-white font-black cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs text-emerald-100/90 leading-relaxed">
                <p>
                  {isRtl
                    ? 'تنمو شجرتك بصرياً وتتطور عبر 5 مراحل مميزة بناءً على تفاعلك وتدوينك اليومي:'
                    : 'Your tree visually grows through 5 stages based on your daily mindfulness interactions:'}
                </p>

                <ul className="space-y-2 bg-black/30 p-3 rounded-2xl border border-white/5">
                  <li className="flex items-center justify-between">
                    <span>🌱 {isRtl ? 'بذرة النية (المستوى 1)' : 'Seedling (Lvl 1)'}</span>
                    <span className="font-mono text-amber-300">0 - 29 XP</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>🌿 {isRtl ? 'برعم السلام (المستوى 2)' : 'Sprout (Lvl 2)'}</span>
                    <span className="font-mono text-amber-300">30 - 79 XP</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>🌳 {isRtl ? 'شجرة التوازن (المستوى 3)' : 'Tree of Balance (Lvl 3)'}</span>
                    <span className="font-mono text-amber-300">80 - 179 XP</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>🌸🌳 {isRtl ? 'الشجرة المزهرة (المستوى 4)' : 'Blooming Tree (Lvl 4)'}</span>
                    <span className="font-mono text-amber-300">180 - 319 XP</span>
                  </li>
                  <li className="flex items-center justify-between p-2 bg-amber-500/20 border border-amber-400/40 rounded-xl font-bold text-amber-200">
                    <span className="flex items-center gap-1">🌲👑 {isRtl ? 'شجرة الحكمة المعمرة (المستوى 5)' : 'Ancient Wisdom Tree (Lvl 5)'}</span>
                    <span className="font-mono text-amber-300">{isRtl ? '365 يوماً متتالياً' : '365 Days Streak'}</span>
                  </li>
                </ul>

                <p className="font-bold text-amber-300 pt-1">
                  {isRtl
                    ? 'كل تدوين يومية يمنحك +10 XP، كتابة الامتنان +8 XP، وتمارين CBT تعطي +15 XP.'
                    : 'Every journal entry awards +10 XP, Gratitude awards +8 XP, and CBT exercises award +15 XP.'}
                </p>

                {/* Developer Preview Toggle Button */}
                <div className="pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setTest365Mode(!test365Mode);
                      setShowInfoModal(false);
                    }}
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${test365Mode ? 'bg-amber-500/30 border-amber-300 text-amber-200' : 'bg-white/10 border-white/20 text-emerald-200 hover:bg-white/20'}`}
                  >
                    <Crown className="w-4 h-4 text-amber-300" />
                    <span>
                      {test365Mode
                        ? (isRtl ? 'إلغاء معاينة إنجاز 365 يوماً 🔄' : 'Disable 365 Days Preview 🔄')
                        : (isRtl ? 'اختبار معاينة مستوى شجرة الحكمة المعمرة (365 يوماً) 🧪' : 'Test Preview 365 Days Wisdom Tree Stage 🧪')}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="w-full py-3 bg-emerald-500 text-gray-950 font-black rounded-2xl hover:bg-emerald-400 transition-colors cursor-pointer"
              >
                {isRtl ? 'فهمت، لنواصل التدوين 🌱' : 'Got it, let’s grow! 🌱'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
