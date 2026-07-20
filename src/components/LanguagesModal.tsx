import React from 'react';
import { X, Globe } from 'lucide-react';

interface LanguagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  appLanguage: 'ar' | 'en';
  onChangeLanguage: (lang: 'ar' | 'en') => void;
  isEn: boolean;
}

export default function LanguagesModal({ isOpen, onClose, appLanguage, onChangeLanguage, isEn }: LanguagesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-55 font-sans" dir={isEn ? "ltr" : "rtl"}>
      <div className="bg-[#FAF8F5] border border-[#E2DCC8] rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl transition-all duration-300 transform scale-100">
        
        {/* Header */}
        <div className="p-6 pb-2 flex items-center justify-between">
          <h4 className="font-black text-[#2B3E50] text-base md:text-lg flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#8B9D83]" />
            <span>{isEn ? "App Languages" : "لغات التطبيق"}</span>
          </h4>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            
            {/* Arabic Language option */}
            <button
              onClick={() => {
                onChangeLanguage('ar');
                onClose();
              }}
              className={`w-full py-4 px-5 rounded-2xl text-xs font-black transition-all flex items-center justify-between border-2 ${
                appLanguage === 'ar'
                  ? 'bg-[#8B9D83]/10 border-[#8B9D83] text-[#4E685B]'
                  : 'bg-white border-transparent hover:border-gray-200 text-gray-700 shadow-3xs'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🇸🇦</span>
                <span>العربية (العراق / السعودية / مصر)</span>
              </div>
              {appLanguage === 'ar' && <span className="text-[#8B9D83] font-black text-xs">✓</span>}
            </button>

            {/* English Language option */}
            <button
              onClick={() => {
                onChangeLanguage('en');
                onClose();
              }}
              className={`w-full py-4 px-5 rounded-2xl text-xs font-black transition-all flex items-center justify-between border-2 ${
                appLanguage === 'en'
                  ? 'bg-[#8B9D83]/10 border-[#8B9D83] text-[#4E685B]'
                  : 'bg-white border-transparent hover:border-gray-200 text-gray-700 shadow-3xs'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🇬🇧</span>
                <span>English (US / UK)</span>
              </div>
              {appLanguage === 'en' && <span className="text-[#8B9D83] font-black text-xs">✓</span>}
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}
