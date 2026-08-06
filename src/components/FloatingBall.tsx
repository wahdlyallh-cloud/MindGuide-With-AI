import React, { useState } from 'react';
import { Plus, PenTool, Mic, Camera, Heart, Brain, CheckSquare, X } from 'lucide-react';

interface FloatingBallProps {
  onAction: (actionType: 'new_note' | 'voice' | 'photo' | 'mood' | 'ai' | 'notes' | 'task') => void;
  isCollapsed?: boolean;
}

export default function FloatingBall({ onAction, isCollapsed = false }: FloatingBallProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleAction = (type: 'new_note' | 'voice' | 'photo' | 'mood' | 'ai' | 'notes' | 'task') => {
    onAction(type);
    setIsOpen(false);
  };

  return (
    <div 
      className={`fixed bottom-18 sm:bottom-20 left-3 sm:left-6 z-40 font-sans transition-all duration-300 transform ${
        isCollapsed 
          ? 'max-sm:translate-y-28 max-sm:opacity-0 max-sm:pointer-events-none' 
          : 'max-sm:translate-y-0 max-sm:opacity-100'
      }`} 
      dir="rtl"
    >
      {/* Expanded Menu Options with Animations */}
      {isOpen && (
        <div className="flex flex-col items-center space-y-3 mb-4 animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Quick AI Advisor */}
          <div className="flex items-center group">
            <span className="bg-[#5A5A40] text-[#F9F7F2] text-[11px] py-1 px-2.5 rounded-lg opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity ml-2 border border-[#8B9D83] shadow-lg pointer-events-none whitespace-nowrap">
              🧠 اسأل المستشار الذكي
            </span>
            <button
              onClick={() => handleAction('ai')}
              className="p-2.5 sm:p-3 bg-gradient-to-tr from-[#D4A373] to-[#FEFAE0] text-[#5A5A40] rounded-full shadow-lg hover:scale-110 hover:rotate-12 transition-transform cursor-pointer"
              title="مستشار AI"
            >
              <Brain className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Quick Task */}
          <div className="flex items-center group">
            <span className="bg-[#5A5A40] text-[#F9F7F2] text-[11px] py-1 px-2.5 rounded-lg opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity ml-2 border border-[#8B9D83] shadow-lg pointer-events-none whitespace-nowrap">
              ☑️ إضافة مهمة جديدة
            </span>
            <button
              onClick={() => handleAction('task')}
              className="p-2.5 sm:p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:scale-110 hover:rotate-12 transition-transform cursor-pointer"
              title="مهمة جديدة"
            >
              <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Quick Mood Log */}
          <div className="flex items-center group">
            <span className="bg-[#5A5A40] text-[#F9F7F2] text-[11px] py-1 px-2.5 rounded-lg opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity ml-2 border border-[#8B9D83] shadow-lg pointer-events-none whitespace-nowrap">
              😊 تسجيل المزاج اليومي
            </span>
            <button
              onClick={() => handleAction('mood')}
              className="p-2.5 sm:p-3 bg-[#D4A373] text-white rounded-full shadow-lg hover:scale-110 hover:rotate-12 transition-transform cursor-pointer"
              title="تسجيل المزاج"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Snap Photo */}
          <div className="flex items-center group">
            <span className="bg-[#5A5A40] text-[#F9F7F2] text-[11px] py-1 px-2.5 rounded-lg opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity ml-2 border border-[#8B9D83] shadow-lg pointer-events-none whitespace-nowrap">
              📷 إضافة لقطة جديدة
            </span>
            <button
              onClick={() => handleAction('photo')}
              className="p-2.5 sm:p-3 bg-[#CCD5AE] text-[#5A5A40] rounded-full shadow-lg hover:scale-110 hover:rotate-12 transition-transform cursor-pointer"
              title="صورة جديدة"
            >
              <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Quick Recording */}
          <div className="flex items-center group">
            <span className="bg-[#5A5A40] text-[#F9F7F2] text-[11px] py-1 px-2.5 rounded-lg opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity ml-2 border border-[#8B9D83] shadow-lg pointer-events-none whitespace-nowrap">
              🎤 تسجيل صوتي سريع
            </span>
            <button
              onClick={() => handleAction('voice')}
              className="p-2.5 sm:p-3 bg-[#8B9D83] text-white rounded-full shadow-lg hover:scale-110 hover:rotate-12 transition-transform cursor-pointer"
              title="تسجيل سريع"
            >
              <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* New Note / Diary */}
          <div className="flex items-center group">
            <span className="bg-[#5A5A40] text-[#F9F7F2] text-[11px] py-1 px-2.5 rounded-lg opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity ml-2 border border-[#8B9D83] shadow-lg pointer-events-none whitespace-nowrap">
              📝 كتابة يومية جديدة
            </span>
            <button
              onClick={() => handleAction('new_note')}
              className="p-2.5 sm:p-3 bg-[#5A5A40] text-white rounded-full shadow-lg hover:scale-110 hover:rotate-12 transition-transform cursor-pointer"
              title="يومية جديدة"
            >
              <PenTool className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Trigger Button */}
      <button
        onClick={toggleMenu}
        className={`p-3.5 sm:p-4 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 cursor-pointer ${
          isOpen
            ? 'bg-[#5A5A40] text-white rotate-90 scale-95 ring-4 ring-[#8B9D83]/50'
            : 'bg-gradient-to-tr from-[#5A5A40] to-[#8B9D83] text-white hover:scale-110 active:scale-95 ring-4 ring-[#8B9D83]/20 shadow-[#8B9D83]/30'
        }`}
        id="floating-ball-trigger"
      >
        {isOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Plus className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />}
      </button>
    </div>
  );
}
