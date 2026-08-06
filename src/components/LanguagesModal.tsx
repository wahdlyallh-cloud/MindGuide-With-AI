import React, { useState } from 'react';
import { X, Globe, Check, Sparkles, Search } from 'lucide-react';
import { AppLanguage } from '../types';
import { SUPPORTED_LANGUAGES, MULTI_TRANSLATIONS, getLanguageInfo } from '../lib/languages';

interface LanguagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  appLanguage: AppLanguage;
  onChangeLanguage: (lang: AppLanguage) => void;
  isEn?: boolean;
  isFirstTime?: boolean;
}

export default function LanguagesModal({ 
  isOpen, 
  onClose, 
  appLanguage, 
  onChangeLanguage,
  isFirstTime = false 
}: LanguagesModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTempLang, setSelectedTempLang] = useState<AppLanguage>(appLanguage);

  if (!isOpen) return null;

  const currentInfo = getLanguageInfo(appLanguage);
  const t = MULTI_TRANSLATIONS[appLanguage] || MULTI_TRANSLATIONS.ar;

  const filteredLanguages = SUPPORTED_LANGUAGES.filter((lang) =>
    lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lang.nativeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectLanguage = (langCode: AppLanguage) => {
    setSelectedTempLang(langCode);
    onChangeLanguage(langCode);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-55 font-sans animate-fadeIn" 
      dir={currentInfo.dir}
    >
      <div className="bg-[#FAF8F5] border-2 border-[#D4A373]/40 rounded-[32px] w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-2xl transition-all duration-300">
        
        {/* Header */}
        <div className="p-5 sm:p-6 pb-3 border-b border-[#E2DCC8]/60 bg-gradient-to-r from-[#FAF8F5] via-amber-50/40 to-[#FAF8F5]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#4E685B] text-white rounded-2xl shadow-xs">
                <Globe className="w-5 h-5 text-amber-300 animate-spin-slow" />
              </div>
              <div>
                <h4 className="font-extrabold text-[#2B3E50] text-base sm:text-lg flex items-center gap-2">
                  <span>{isFirstTime ? t.selectLanguageTitle : t.languagesTitle}</span>
                </h4>
                <p className="text-[11px] text-gray-500 font-bold mt-0.5">
                  {isFirstTime ? t.selectLanguageSubtitle : t.languagesSub}
                </p>
              </div>
            </div>

            {!isFirstTime && (
              <button 
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-gray-200/60 rounded-full transition-colors text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Search bar for quick filtering */}
          <div className="relative mt-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search language / ابحث عن لغتك..."
              className="w-full pl-9 pr-9 py-2.5 bg-white border border-[#E2DCC8] rounded-2xl text-xs font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#4E685B] shadow-3xs"
            />
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
          </div>
        </div>

        {/* Language Options List */}
        <div className="p-4 sm:p-6 space-y-2 overflow-y-auto flex-1 scrollbar-thin">
          <div className="grid grid-cols-1 gap-2">
            {filteredLanguages.map((lang) => {
              const isSelected = appLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`w-full py-3.5 px-4 rounded-2xl text-xs font-black transition-all flex items-center justify-between border-2 cursor-pointer group ${
                    isSelected
                      ? 'bg-[#4E685B] text-white border-[#4E685B] shadow-md scale-[1.01]'
                      : 'bg-white border-[#E2DCC8]/80 text-gray-800 hover:border-[#4E685B]/40 hover:bg-amber-50/30 shadow-3xs'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl shrink-0 group-hover:scale-110 transition-transform">
                      {lang.flag}
                    </span>
                    <div className="text-right rtl:text-right ltr:text-left">
                      <span className="block font-black text-sm">
                        {lang.nativeName}
                      </span>
                      <span className={`text-[10px] font-bold ${isSelected ? 'text-amber-200' : 'text-gray-400'}`}>
                        {lang.name}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="p-1.5 bg-amber-300 text-gray-900 rounded-full shadow-xs shrink-0">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer for First Time Selection or Close */}
        {isFirstTime && (
          <div className="p-4 bg-white border-t border-[#E2DCC8] text-center">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 bg-[#4E685B] hover:bg-[#3F5449] text-white rounded-2xl font-black text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{t.confirmLanguage}</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
