import React from 'react';
import { PenTool, Mic, Brain, Heart, CheckSquare, Camera, Bell } from 'lucide-react';

interface StaticNotificationProps {
  onAction: (actionType: 'new_note' | 'voice' | 'mood' | 'ai' | 'task' | 'photo') => void;
  onBodyClick?: () => void;
}

export default function StaticNotification({ onAction, onBodyClick }: StaticNotificationProps) {
  return (
    <div 
      onClick={() => {
        if (onBodyClick) onBodyClick();
      }}
      className={`bg-[#F5F1E6] border-2 border-[#E5E1D4] text-[#3A3A3A] rounded-[2rem] p-5 shadow-md max-w-lg mx-auto font-sans transition-all duration-200 select-none ${onBodyClick ? 'cursor-pointer hover:shadow-lg hover:border-[#D4A373]' : ''}`} 
      dir="rtl"
    >
      {/* Title / Mock Android Status */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E5E1D4]/80">
        <div className="flex items-center space-x-2.5 space-x-reverse">
          <div className="bg-[#D4A373] p-1.5 rounded-xl text-white shadow-xs">
            <Bell className="w-4 h-4 animate-bounce" />
          </div>
          <span className="text-sm font-black text-gray-700">يومياتي AI • نشط الآن</span>
        </div>

      </div>

      {/* Main Body */}
      <div className="space-y-1 mb-4 text-right">
        <h4 className="text-base sm:text-lg font-black text-[#5A5A40]">كيف تشعر الآن يا صديقي؟ 😊</h4>
        <p className="text-xs sm:text-sm text-[#5A5A40]/80 leading-relaxed font-semibold">
          اضغط على أي من الاختصارات السريعة أدناه لتدوين مذكراتك أو رصد حالتك المزاجية مباشرة.
        </p>
      </div>

      {/* Interactive Quick Actions Row */}
      <div className="grid grid-cols-6 gap-2 bg-white p-3 rounded-[1.5rem] border border-[#E5E1D4]">
        {/* 1. كتابة */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAction('new_note');
          }}
          className="flex flex-col items-center justify-center p-2 hover:bg-[#F5F1E6]/50 active:scale-95 rounded-2xl transition-all cursor-pointer group"
          title="كتابة"
        >
          <div className="bg-[#E8F0FE] p-2.5 rounded-2xl text-[#1A73E8] group-hover:scale-110 transition-transform shadow-3xs">
            <PenTool className="w-5 h-5" />
          </div>
          <span className="text-[11px] sm:text-xs font-extrabold mt-1.5 text-gray-500">كتابة</span>
        </button>

        {/* 2. تسجيل */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAction('voice');
          }}
          className="flex flex-col items-center justify-center p-2 hover:bg-[#F5F1E6]/50 active:scale-95 rounded-2xl transition-all cursor-pointer group"
          title="تسجيل"
        >
          <div className="bg-[#E6F4EA] p-2.5 rounded-2xl text-[#137333] group-hover:scale-110 transition-transform shadow-3xs">
            <Mic className="w-5 h-5" />
          </div>
          <span className="text-[11px] sm:text-xs font-extrabold mt-1.5 text-gray-500">تسجيل</span>
        </button>

        {/* 3. مزاجي */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAction('mood');
          }}
          className="flex flex-col items-center justify-center p-2 hover:bg-[#F5F1E6]/50 active:scale-95 rounded-2xl transition-all cursor-pointer group"
          title="مزاجي"
        >
          <div className="bg-[#FCE8E6] p-2.5 rounded-2xl text-[#C5221F] group-hover:scale-110 transition-transform shadow-3xs">
            <Heart className="w-5 h-5" />
          </div>
          <span className="text-[11px] sm:text-xs font-extrabold mt-1.5 text-gray-500">مزاجي</span>
        </button>

        {/* 4. مستشار */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAction('ai');
          }}
          className="flex flex-col items-center justify-center p-2 hover:bg-[#F5F1E6]/50 active:scale-95 rounded-2xl transition-all cursor-pointer group"
          title="مستشار"
        >
          <div className="bg-[#FEF7E0] p-2.5 rounded-2xl text-[#B06000] group-hover:scale-110 transition-transform shadow-3xs">
            <Brain className="w-5 h-5" />
          </div>
          <span className="text-[11px] sm:text-xs font-extrabold mt-1.5 text-gray-500">مستشار</span>
        </button>

        {/* 5. مهمة */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAction('task');
          }}
          className="flex flex-col items-center justify-center p-2 hover:bg-[#F5F1E6]/50 active:scale-95 rounded-2xl transition-all cursor-pointer group"
          title="مهمة"
        >
          <div className="bg-[#F3E8FF] p-2.5 rounded-2xl text-[#7C3AED] group-hover:scale-110 transition-transform shadow-3xs">
            <CheckSquare className="w-5 h-5" />
          </div>
          <span className="text-[11px] sm:text-xs font-extrabold mt-1.5 text-gray-500">مهمة</span>
        </button>

        {/* 6. صورة */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAction('photo');
          }}
          className="flex flex-col items-center justify-center p-2 hover:bg-[#F5F1E6]/50 active:scale-95 rounded-2xl transition-all cursor-pointer group"
          title="صورة"
        >
          <div className="bg-[#E8F8FF] p-2.5 rounded-2xl text-[#0369A1] group-hover:scale-110 transition-transform shadow-3xs">
            <Camera className="w-5 h-5" />
          </div>
          <span className="text-[11px] sm:text-xs font-extrabold mt-1.5 text-gray-500">صورة</span>
        </button>
      </div>

      {/* Bottom info row */}
      <div className="flex justify-between items-center text-[10px] sm:text-xs text-gray-400 font-bold px-1 mt-3">
        <span>انقر على أي اختصار لتشغيله في التطبيق</span>
        <span className="flex items-center space-x-1 space-x-reverse text-amber-600">
          <span>🔒</span>
          <span>الخصوصية محمية بقفل PIN</span>
        </span>
      </div>
    </div>
  );
}
