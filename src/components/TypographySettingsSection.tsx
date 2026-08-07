import React from 'react';
import { Type, AlignLeft, Sparkles, Check, BookOpen, Eye } from 'lucide-react';
import { AppLanguage, AppFontFamily, AppLineHeight } from '../types';
import { APP_FONTS, LINE_HEIGHT_OPTIONS, getFontCss, getLineHeightCss } from '../lib/fonts';
import { getLanguageInfo } from '../lib/languages';

interface TypographySettingsSectionProps {
  appFont?: AppFontFamily;
  appLineHeight?: AppLineHeight;
  appLanguage: AppLanguage;
  onChangeFont: (font: AppFontFamily) => void;
  onChangeLineHeight: (lineHeight: AppLineHeight) => void;
}

export default function TypographySettingsSection({
  appFont = 'cairo',
  appLineHeight = 'relaxed',
  appLanguage = 'ar',
  onChangeFont,
  onChangeLineHeight,
}: TypographySettingsSectionProps) {
  const langInfo = getLanguageInfo(appLanguage);
  const isArabic = appLanguage === 'ar' || appLanguage === 'ur';

  const currentFontObj = APP_FONTS.find(f => f.id === appFont) || APP_FONTS[0];
  const currentLhObj = LINE_HEIGHT_OPTIONS.find(l => l.id === appLineHeight) || LINE_HEIGHT_OPTIONS[2];

  return (
    <div className="bg-white border-2 border-[#D4A373]/40 rounded-[28px] p-5 sm:p-6 shadow-sm space-y-6" dir={langInfo.dir}>
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E2DCC8] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-[#8B9D83] to-[#5A5A40] text-white rounded-2xl shadow-xs">
            <Type className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h3 className="font-extrabold text-[#2B3E50] text-base sm:text-lg flex items-center gap-2">
              <span>{isArabic ? 'تخصيص الخطوط وراحة القراءة' : 'Custom Typography & Reading Comfort'}</span>
              <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-black">
                {isArabic ? 'شامل للتطبيق' : 'App-wide'}
              </span>
            </h3>
            <p className="text-[11px] text-gray-500 font-bold mt-0.5">
              {isArabic 
                ? 'اختر نوع الخط المفضل وضبط التباعد بين الأسطر لراحة العين أثناء قراءة اليوميات الطويلة'
                : 'Choose your preferred font family and line spacing for optimal reading comfort'
              }
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: FONT FAMILY SELECTION */}
      <div className="space-y-3">
        <label className="text-xs font-black text-gray-700 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#8B9D83]" />
          <span>{isArabic ? 'اختر خط التطبيق الرئيسي (Arabic & International Fonts):' : 'Select Main App Font Family:'}</span>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {APP_FONTS.map((fontItem) => {
            const isSelected = appFont === fontItem.id;
            return (
              <button
                key={fontItem.id}
                type="button"
                onClick={() => onChangeFont(fontItem.id)}
                className={`p-4 rounded-2xl border-2 text-right rtl:text-right ltr:text-left transition-all duration-200 cursor-pointer relative flex flex-col justify-between group ${
                  isSelected
                    ? 'bg-gradient-to-br from-[#FAF8F5] via-amber-50/60 to-white border-[#8B9D83] shadow-md ring-2 ring-[#8B9D83]/20'
                    : 'bg-white border-[#E2DCC8]/80 hover:border-[#8B9D83]/50 hover:bg-amber-50/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-sm text-[#2B3E50] flex items-center gap-1.5">
                      <span>{isArabic ? fontItem.nameAr : fontItem.nameEn}</span>
                      {fontItem.badge && (
                        <span className="text-[9px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-black">
                          {fontItem.badge}
                        </span>
                      )}
                    </span>

                    {isSelected && (
                      <div className="p-1 bg-[#8B9D83] text-white rounded-full shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-gray-500 block font-bold mb-3">
                    {isArabic ? fontItem.categoryAr : fontItem.categoryEn}
                  </span>
                </div>

                {/* Sample Text Preview */}
                <div 
                  className="p-3 bg-white/90 border border-[#E2DCC8]/60 rounded-xl text-xs text-gray-800 shadow-2xs font-bold leading-relaxed overflow-hidden"
                  style={{ fontFamily: fontItem.fontFamilyCss }}
                >
                  {isArabic ? fontItem.sampleTextAr : fontItem.sampleTextEn}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: LINE SPACING / TABA'UD AL-ASHTAR */}
      <div className="space-y-3 pt-3 border-t border-[#E2DCC8]">
        <label className="text-xs font-black text-gray-700 flex items-center gap-2">
          <AlignLeft className="w-4 h-4 text-[#D4A373]" />
          <span>{isArabic ? 'التباعد بين الأسطر (راحة العين في المذكرات والقراءة):' : 'Line Height / Line Spacing (Eye Comfort):'}</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {LINE_HEIGHT_OPTIONS.map((lhItem) => {
            const isSelected = appLineHeight === lhItem.id;
            return (
              <button
                key={lhItem.id}
                type="button"
                onClick={() => onChangeLineHeight(lhItem.id)}
                className={`p-3.5 rounded-2xl border-2 text-right rtl:text-right ltr:text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#8B9D83] text-white border-[#8B9D83] shadow-md scale-[1.02]'
                    : 'bg-white border-[#E2DCC8] text-gray-800 hover:border-[#8B9D83]/60 hover:bg-amber-50/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-xs">
                      {isArabic ? lhItem.nameAr : lhItem.nameEn}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-amber-300 stroke-[3]" />}
                  </div>
                  <p className={`text-[10px] font-medium ${isSelected ? 'text-amber-100' : 'text-gray-500'}`}>
                    {isArabic ? lhItem.descAr : lhItem.descEn}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* LIVE READING PREVIEW CARD */}
      <div className="p-4 sm:p-5 bg-gradient-to-br from-[#FAF8F5] via-amber-50/30 to-white rounded-2xl border-2 border-amber-200/80 space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between text-xs font-black text-[#5A5A40]">
          <span className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#8B9D83]" />
            <span>{isArabic ? 'معاينة القراءة المباشرة لصفحة اليوميات:' : 'Live Reading Comfort Preview:'}</span>
          </span>
          <span className="text-[10px] bg-white border border-amber-200 px-2 py-0.5 rounded-lg text-gray-600 font-bold">
            {currentFontObj.nameEn} | {currentLhObj.val}x
          </span>
        </div>

        <div 
          className="p-4 bg-white border border-[#E2DCC8] rounded-2xl text-xs sm:text-sm text-gray-800 shadow-2xs transition-all duration-300"
          style={{ 
            fontFamily: currentFontObj.fontFamilyCss, 
            lineHeight: currentLhObj.val 
          }}
        >
          {isArabic ? (
            <p>
              «هذا النص يمثّل تجربة واقعية لتدوين مذكراتك وطريقة ظهورها في التطبيق. عندما تدوّن أفكارك اليومية وتأملاتك، يمنحك خط <strong>{currentFontObj.nameAr}</strong> مع تباعد الأسطر <strong>{currentLhObj.nameAr}</strong> راحة بصرية فائقة ويساعدك على التركيز والتعمق في ذكرياتك دون إجهاد للعين.»
            </p>
          ) : (
            <p>
              "This live preview demonstrates how your diary entries and long notes will render across the app. Using <strong>{currentFontObj.nameEn}</strong> paired with a <strong>{currentLhObj.nameEn}</strong> line spacing ensures maximum legibility and effortless reading during long reflection sessions."
            </p>
          )}
        </div>
      </div>

    </div>
  );
}
