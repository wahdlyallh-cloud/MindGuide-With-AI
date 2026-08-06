import React from 'react';
import { PenTool, Mic, Brain, Heart, CheckSquare, Camera, Bell } from 'lucide-react';
import { AppLanguage, getLanguageInfo, getTranslation } from '../lib/languages';

interface StaticNotificationProps {
  onAction: (actionType: 'new_note' | 'voice' | 'mood' | 'ai' | 'task' | 'photo') => void;
  onBodyClick?: () => void;
  appLanguage?: AppLanguage;
}

export default function StaticNotification({ onAction, onBodyClick, appLanguage = 'ar' }: StaticNotificationProps) {
  const langInfo = getLanguageInfo(appLanguage);
  const t = getTranslation(appLanguage);

  return (
    <div 
      onClick={() => {
        if (onBodyClick) onBodyClick();
      }}
      className={`bg-[#F5F1E6] border-2 border-[#E5E1D4] text-[#3A3A3A] rounded-[2rem] p-5 shadow-md max-w-lg mx-auto font-sans transition-all duration-200 select-none ${onBodyClick ? 'cursor-pointer hover:shadow-lg hover:border-[#D4A373]' : ''}`} 
      dir={langInfo.dir}
    >
      {/* Title / Status */}
      <div className={`flex items-center justify-between mb-4 pb-3 border-b border-[#E5E1D4]/80 ${langInfo.dir === 'rtl' ? 'flex-row' : 'flex-row'}`}>
        <div className={`flex items-center space-x-2.5 ${langInfo.dir === 'rtl' ? 'space-x-reverse' : ''}`}>
          <div className="bg-[#D4A373] p-1.5 rounded-xl text-white shadow-xs">
            <Bell className="w-4 h-4 animate-bounce" />
          </div>
          <span className="text-sm font-black text-gray-700">{t.notificationActiveNow}</span>
        </div>
      </div>

      {/* Main Body */}
      <div className={`space-y-1 mb-4 ${langInfo.dir === 'rtl' ? 'text-right' : 'text-left'}`}>
        <h4 className="text-base sm:text-lg font-black text-[#5A5A40]">{t.notificationHowAreYou}</h4>
        <p className="text-xs sm:text-sm text-[#5A5A40]/80 leading-relaxed font-semibold">
          {t.notificationTapShortcut}
        </p>
      </div>

      {/* Interactive Quick Actions Row */}
      <div className="grid grid-cols-6 gap-2 bg-white p-3 rounded-[1.5rem] border border-[#E5E1D4]">
        {/* 1. Write */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAction('new_note');
          }}
          className="flex flex-col items-center justify-center p-2 hover:bg-[#F5F1E6]/50 active:scale-95 rounded-2xl transition-all cursor-pointer group"
          title={t.write}
        >
          <div className="bg-[#E8F0FE] p-2.5 rounded-2xl text-[#1A73E8] group-hover:scale-110 transition-transform shadow-3xs">
            <PenTool className="w-5 h-5" />
          </div>
          <span className="text-[11px] sm:text-xs font-extrabold mt-1.5 text-gray-500">{t.write}</span>
        </button>

        {/* 2. Voice Record */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAction('voice');
          }}
          className="flex flex-col items-center justify-center p-2 hover:bg-[#F5F1E6]/50 active:scale-95 rounded-2xl transition-all cursor-pointer group"
          title={t.voiceRecord}
        >
          <div className="bg-[#E6F4EA] p-2.5 rounded-2xl text-[#137333] group-hover:scale-110 transition-transform shadow-3xs">
            <Mic className="w-5 h-5" />
          </div>
          <span className="text-[11px] sm:text-xs font-extrabold mt-1.5 text-gray-500">{t.voiceRecord}</span>
        </button>

        {/* 3. Mood */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAction('mood');
          }}
          className="flex flex-col items-center justify-center p-2 hover:bg-[#F5F1E6]/50 active:scale-95 rounded-2xl transition-all cursor-pointer group"
          title={t.mood}
        >
          <div className="bg-[#FCE8E6] p-2.5 rounded-2xl text-[#C5221F] group-hover:scale-110 transition-transform shadow-3xs">
            <Heart className="w-5 h-5" />
          </div>
          <span className="text-[11px] sm:text-xs font-extrabold mt-1.5 text-gray-500">{t.mood}</span>
        </button>

        {/* 4. Advisor */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAction('ai');
          }}
          className="flex flex-col items-center justify-center p-2 hover:bg-[#F5F1E6]/50 active:scale-95 rounded-2xl transition-all cursor-pointer group"
          title={t.advisor}
        >
          <div className="bg-[#FEF7E0] p-2.5 rounded-2xl text-[#B06000] group-hover:scale-110 transition-transform shadow-3xs">
            <Brain className="w-5 h-5" />
          </div>
          <span className="text-[11px] sm:text-xs font-extrabold mt-1.5 text-gray-500">{t.advisor}</span>
        </button>

        {/* 5. Task */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAction('task');
          }}
          className="flex flex-col items-center justify-center p-2 hover:bg-[#F5F1E6]/50 active:scale-95 rounded-2xl transition-all cursor-pointer group"
          title={t.task}
        >
          <div className="bg-[#F3E8FF] p-2.5 rounded-2xl text-[#7C3AED] group-hover:scale-110 transition-transform shadow-3xs">
            <CheckSquare className="w-5 h-5" />
          </div>
          <span className="text-[11px] sm:text-xs font-extrabold mt-1.5 text-gray-500">{t.task}</span>
        </button>

        {/* 6. Photo */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAction('photo');
          }}
          className="flex flex-col items-center justify-center p-2 hover:bg-[#F5F1E6]/50 active:scale-95 rounded-2xl transition-all cursor-pointer group"
          title={t.photo}
        >
          <div className="bg-[#E8F8FF] p-2.5 rounded-2xl text-[#0369A1] group-hover:scale-110 transition-transform shadow-3xs">
            <Camera className="w-5 h-5" />
          </div>
          <span className="text-[11px] sm:text-xs font-extrabold mt-1.5 text-gray-500">{t.photo}</span>
        </button>
      </div>

      {/* Bottom info row */}
      <div className={`flex justify-between items-center text-[10px] sm:text-xs text-gray-400 font-bold px-1 mt-3`}>
        <span>{t.notificationTapShortcut}</span>
        <span className={`flex items-center space-x-1 ${langInfo.dir === 'rtl' ? 'space-x-reverse' : ''} text-amber-600`}>
          <span>🔒</span>
          <span>{t.appLockTitle}</span>
        </span>
      </div>
    </div>
  );
}
