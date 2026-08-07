import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Droplets, Moon, Activity, Brain, TrendingUp, Info, ChevronDown, CheckCircle2 } from 'lucide-react';
import { DiaryEntry } from '../types';
import { AppLanguage, getTranslation } from '../lib/languages';
import { computeBehavioralCorrelations, CorrelationInsight } from '../lib/behavioralCorrelation';

interface BehavioralCorrelationCardProps {
  entries: DiaryEntry[];
  appLanguage: AppLanguage;
  className?: string;
}

export default function BehavioralCorrelationCard({
  entries,
  appLanguage = 'ar',
  className = '',
}: BehavioralCorrelationCardProps) {
  const t = getTranslation(appLanguage);
  const isRtl = appLanguage === 'ar' || appLanguage === 'ur';

  const [expandedId, setExpandedId] = useState<string | null>('sleep_water_anxiety');

  const { insights, stats } = computeBehavioralCorrelations(entries, appLanguage);

  const getIcon = (iconName: CorrelationInsight['iconName']) => {
    switch (iconName) {
      case 'droplets':
        return <Droplets className="w-5 h-5 text-sky-400" />;
      case 'moon':
        return <Moon className="w-5 h-5 text-indigo-400" />;
      case 'activity':
        return <Activity className="w-5 h-5 text-emerald-400" />;
      case 'brain':
        return <Brain className="w-5 h-5 text-purple-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className={`bg-gradient-to-br from-[#1E271D] via-[#283527] to-[#1C241B] text-white rounded-[28px] p-5 sm:p-6 border border-[#435742]/60 shadow-xl space-y-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/20 border border-emerald-400/30 rounded-2xl text-emerald-300 shadow-inner">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black text-emerald-300 uppercase tracking-wider">
                {t.behavioralCorrelationsTitle || (isRtl ? 'محرك التحليلات السلوكية المتقدمة' : 'Behavioral Correlation Engine')}
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[10px] font-extrabold rounded-full">
                AI Analytics ✨
              </span>
            </div>
            <h3 className="text-base font-black text-white mt-0.5">
              {isRtl ? 'ترابط العادات الصحية مع استقرار القلق والمزاج' : 'Health Habits & Anxiety Correlations'}
            </h3>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-2xl border border-white/10 text-xs text-emerald-200">
          <Info className="w-3.5 h-3.5 text-amber-300" />
          <span>{stats.totalAnalyzedDays} {isRtl ? 'يوم تحليلي' : 'Days Analyzed'}</span>
        </div>
      </div>

      {/* Overview Metric Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-black/30 border border-white/10 p-3 rounded-2xl text-center space-y-1">
          <span className="text-[10px] font-bold text-emerald-300/80 block">{isRtl ? 'متوسط النوم' : 'Avg Sleep'}</span>
          <span className="text-sm font-black text-white">{stats.avgSleepHours} {isRtl ? 'ساعة' : 'hrs'}</span>
        </div>
        <div className="bg-black/30 border border-white/10 p-3 rounded-2xl text-center space-y-1">
          <span className="text-[10px] font-bold text-sky-300/80 block">{isRtl ? 'متوسط المياه' : 'Avg Water'}</span>
          <span className="text-sm font-black text-white">{stats.avgWaterCups} {isRtl ? 'أكواب' : 'cups'}</span>
        </div>
        <div className="bg-black/30 border border-white/10 p-3 rounded-2xl text-center space-y-1">
          <span className="text-[10px] font-bold text-amber-300/80 block">{isRtl ? 'الرياضة اليومية' : 'Avg Exercise'}</span>
          <span className="text-sm font-black text-white">{stats.avgExerciseMins} {isRtl ? 'دقيقة' : 'mins'}</span>
        </div>
        <div className="bg-black/30 border border-white/10 p-3 rounded-2xl text-center space-y-1">
          <span className="text-[10px] font-bold text-purple-300/80 block">{isRtl ? 'مؤشر المزاج' : 'Avg Mood'}</span>
          <span className="text-sm font-black text-white">{stats.avgMoodScore}/10</span>
        </div>
      </div>

      {/* Correlation Insight Cards */}
      <div className="space-y-3">
        {insights.map((insight) => {
          const isExpanded = expandedId === insight.id;

          return (
            <div
              key={insight.id}
              className={`bg-black/25 border transition-all duration-300 rounded-2xl overflow-hidden ${isExpanded ? 'border-emerald-400/50 bg-black/40 shadow-lg' : 'border-white/10 hover:border-white/20'}`}
            >
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : insight.id)}
                className="w-full p-4 flex items-center justify-between text-right rtl:text-right ltr:text-left cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-white/10 rounded-2xl border border-white/10 shrink-0 mt-0.5">
                    {getIcon(insight.iconName)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-white">{insight.title}</h4>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black rounded-full flex items-center gap-1">
                        -{insight.percentageChange}% {isRtl ? 'قلق وتوتر' : 'Anxiety'}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-100/90 font-medium mt-1 leading-relaxed">
                      {insight.description}
                    </p>
                  </div>
                </div>

                <div className="p-1.5 bg-white/10 rounded-xl text-emerald-200 shrink-0 mr-2">
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Expanded Breakdown */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-4 pt-2 border-t border-white/10 text-xs text-emerald-200/90 space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-2 bg-black/40 p-3 rounded-xl border border-white/5">
                      <div className="space-y-1">
                        <span className="text-[10px] text-emerald-300 font-bold block">
                          {isRtl ? 'الأيام المتوازنة (نوم وماء ورياضة)' : 'Optimal Habit Days'}
                        </span>
                        <div className="flex items-center gap-1.5 text-white font-black text-sm">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>{insight.details.goodDaysAvg}/10 {isRtl ? 'استقرار نفسي' : 'Balance'}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-amber-300 font-bold block">
                          {isRtl ? 'أيام نقص النوم أو الماء' : 'Suboptimal Days'}
                        </span>
                        <div className="flex items-center gap-1.5 text-white font-black text-sm">
                          <span className="text-amber-400 font-bold">⚠️</span>
                          <span>{insight.details.badDaysAvg}/10 {isRtl ? 'ارتفاع القلق' : 'Higher Anxiety'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-400/20 rounded-xl text-[11px] text-emerald-200 font-medium flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                      <span>
                        {isRtl
                          ? 'نصيحة ذكية: الاستمرار على شرب 2L ماء يومياً مع 7.5h نوم يقلل من نوبات التوتر المفاجئة بنسبة ملحوظة.'
                          : 'Smart Tip: Keeping 2L daily water & 7.5h sleep significantly buffers against sudden panic spikes.'}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
