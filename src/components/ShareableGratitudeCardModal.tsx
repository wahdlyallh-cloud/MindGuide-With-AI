import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Share2, Sparkles, Copy, Check, Heart, Quote, Image as ImageIcon, Layout, Palette } from 'lucide-react';
import html2canvas from 'html2canvas';
import { AppLanguage, getTranslation } from '../lib/languages';

export interface CardExportData {
  text: string;
  category?: string;
  date?: string;
  author?: string;
}

interface ShareableGratitudeCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  appLanguage: AppLanguage;
  initialData?: CardExportData;
}

export type CardThemeId = 'emerald' | 'golden' | 'midnight' | 'parchment' | 'lavender';
export type CardFormat = '1:1' | '9:16';

export default function ShareableGratitudeCardModal({
  isOpen,
  onClose,
  appLanguage = 'ar',
  initialData,
}: ShareableGratitudeCardModalProps) {
  const t = getTranslation(appLanguage);
  const isRtl = appLanguage === 'ar' || appLanguage === 'ur';

  const cardRef = useRef<HTMLDivElement>(null);

  const [cardText, setCardText] = useState(
    initialData?.text || 
    (isRtl ? 'الحمد لله على نعمة الهدوء والسلام الداخلي والصحة والعافية' : 'Grateful for the peace, quiet moments, and inner health today.')
  );
  const [authorName, setAuthorName] = useState(initialData?.author || (isRtl ? 'رحلتي مع الوعي' : 'My Mindful Journey'));
  const [cardCategory, setCardCategory] = useState(initialData?.category || (isRtl ? 'لحظة امتنان 💖' : 'Gratitude Moment 💖'));
  const [selectedTheme, setSelectedTheme] = useState<CardThemeId>('emerald');
  const [selectedFormat, setSelectedFormat] = useState<CardFormat>('1:1');
  const [showWatermark, setShowWatermark] = useState(true);

  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  // Theme styling definitions
  const THEMES: Record<CardThemeId, { nameAr: string; nameEn: string; bgClass: string; textClass: string; accentClass: string; borderClass: string }> = {
    emerald: {
      nameAr: 'زمردي هادئ 🌱',
      nameEn: 'Emerald Calm 🌱',
      bgClass: 'bg-gradient-to-br from-[#1B2E23] via-[#2A4234] to-[#16241C]',
      textClass: 'text-emerald-50',
      accentClass: 'text-amber-300',
      borderClass: 'border-emerald-500/30',
    },
    golden: {
      nameAr: 'غروب ذهبي 🌅',
      nameEn: 'Golden Sunset 🌅',
      bgClass: 'bg-gradient-to-br from-[#7C2D12] via-[#9A3412] to-[#451A03]',
      textClass: 'text-amber-50',
      accentClass: 'text-amber-300',
      borderClass: 'border-amber-500/30',
    },
    midnight: {
      nameAr: 'سماء ساطعة 🌌',
      nameEn: 'Midnight Twilight 🌌',
      bgClass: 'bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#020617]',
      textClass: 'text-slate-100',
      accentClass: 'text-sky-300',
      borderClass: 'border-indigo-500/30',
    },
    parchment: {
      nameAr: 'ورق كلاسيكي 📜',
      nameEn: 'Classic Parchment 📜',
      bgClass: 'bg-[#F5EFE6] bg-radial from-amber-50/80 to-[#E8DEC9]',
      textClass: 'text-[#3A3228]',
      accentClass: 'text-[#8B5E34]',
      borderClass: 'border-[#D4C5A9]',
    },
    lavender: {
      nameAr: 'سكينة اللافندر 💜',
      nameEn: 'Lavender Serenity 💜',
      bgClass: 'bg-gradient-to-br from-[#3B0764] via-[#581C87] to-[#1E1B4B]',
      textClass: 'text-purple-50',
      accentClass: 'text-pink-300',
      borderClass: 'border-purple-500/30',
    },
  };

  const currentTheme = THEMES[selectedTheme];

  // Download card as image using html2canvas
  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      const canvas = await html2canvas(cardRef.current, {
        scale: 2, // high DPI crisp rendering
        useCORS: true,
        backgroundColor: null,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `gratitude_card_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Error generating image export:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Native Web Share API
  const handleShareCard = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true });
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'gratitude_card.png', { type: 'image/png' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: cardCategory,
            text: cardText,
            files: [file],
          });
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(`"${cardText}" - ${authorName}`);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        }
        setIsExporting(false);
      });
    } catch (err) {
      console.error('Share error:', err);
      setIsExporting(false);
    }
  };

  // Copy text fallback
  const handleCopyText = async () => {
    await navigator.clipboard.writeText(`"${cardText}" - ${authorName}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[55] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#FAF8F5] border-2 border-[#D4A373]/40 rounded-[32px] w-full max-w-2xl my-auto flex flex-col overflow-hidden shadow-2xl transition-all"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-[#E2DCC8] flex items-center justify-between bg-gradient-to-r from-amber-50/50 via-[#FAF8F5] to-amber-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#4E685B] text-white rounded-2xl shadow-xs">
              <ImageIcon className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-[#2B3E50] text-base sm:text-lg flex items-center gap-2">
                <span>{t.shareableGratitudeTitle || (isRtl ? 'بطاقات الامتنان والافتخار القابلة للمشاركة 🎨' : 'Shareable Gratitude Cards 🎨')}</span>
              </h3>
              <p className="text-[11px] text-gray-500 font-bold mt-0.5">
                {t.shareableGratitudeSub || (isRtl ? 'صمم بطاقتك الجميلة وشارك أفكارك الملهمة مع أصدقائك' : 'Design beautiful visual cards for social media sharing')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Left Controls, Right Live Card Preview */}
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 overflow-y-auto max-h-[75vh]">
          
          {/* CONTROL PANEL (5 Cols) */}
          <div className="md:col-span-5 space-y-4">
            
            {/* Input Card Text */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-700 flex items-center gap-1.5">
                <Quote className="w-3.5 h-3.5 text-[#8B9D83]" />
                <span>{isRtl ? 'نص البطاقة أو المقولة:' : 'Card Text or Quote:'}</span>
              </label>
              <textarea
                value={cardText}
                onChange={(e) => setCardText(e.target.value)}
                rows={3}
                className="w-full p-3 bg-white border border-[#E2DCC8] rounded-2xl text-xs font-bold text-gray-800 focus:outline-none focus:border-[#4E685B] shadow-2xs resize-none"
                placeholder={isRtl ? 'اكتب كلمتك الملهمة أو فكرتك الإيجابية...' : 'Write your uplifting gratitude thought...'}
              />
            </div>

            {/* Author Signature & Category */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-black text-gray-600">
                  {isRtl ? 'التوقيع:' : 'Author:'}
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#E2DCC8] rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-[#4E685B]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-gray-600">
                  {isRtl ? 'العنوان العلوي:' : 'Tag Header:'}
                </label>
                <input
                  type="text"
                  value={cardCategory}
                  onChange={(e) => setCardCategory(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#E2DCC8] rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:border-[#4E685B]"
                />
              </div>
            </div>

            {/* Theme Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-700 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-600" />
                <span>{isRtl ? 'نمط الألوان:' : 'Card Theme:'}</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(THEMES) as CardThemeId[]).map((themeKey) => {
                  const item = THEMES[themeKey];
                  const isSelected = selectedTheme === themeKey;
                  return (
                    <button
                      key={themeKey}
                      type="button"
                      onClick={() => setSelectedTheme(themeKey)}
                      className={`p-2 rounded-xl text-xs font-extrabold border-2 text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#4E685B] bg-[#4E685B] text-white shadow-xs'
                          : 'border-[#E2DCC8] bg-white text-gray-700 hover:border-[#8B9D83]'
                      }`}
                    >
                      <span>{isRtl ? item.nameAr : item.nameEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Format Selector (1:1 Square vs 9:16 Story) */}
            <div className="space-y-1.5 pt-2 border-t border-[#E2DCC8]">
              <label className="text-xs font-black text-gray-700 flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5 text-sky-600" />
                <span>{isRtl ? 'أبعاد البطاقة:' : 'Card Aspect Ratio:'}</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedFormat('1:1')}
                  className={`p-2.5 rounded-xl text-xs font-extrabold border-2 flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedFormat === '1:1'
                      ? 'bg-[#4E685B] text-white border-[#4E685B] shadow-xs'
                      : 'bg-white text-gray-700 border-[#E2DCC8] hover:border-[#8B9D83]'
                  }`}
                >
                  <span>1:1 Square (مربع)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedFormat('9:16')}
                  className={`p-2.5 rounded-xl text-xs font-extrabold border-2 flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedFormat === '9:16'
                      ? 'bg-[#4E685B] text-white border-[#4E685B] shadow-xs'
                      : 'bg-white text-gray-700 border-[#E2DCC8] hover:border-[#8B9D83]'
                  }`}
                >
                  <span>9:16 Story (ستوري)</span>
                </button>
              </div>
            </div>

            {/* Watermark Toggle */}
            <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={showWatermark}
                onChange={(e) => setShowWatermark(e.target.checked)}
                className="w-4 h-4 rounded text-[#4E685B] accent-[#4E685B]"
              />
              <span>{isRtl ? 'إظهار شعار التطبيق والتاريخ' : 'Show app watermark & date'}</span>
            </label>

          </div>

          {/* LIVE EXPORT CANVAS PREVIEW (7 Cols) */}
          <div className="md:col-span-7 flex flex-col items-center justify-center bg-gray-200/50 p-4 rounded-3xl border border-[#E2DCC8]/80">
            <span className="text-[10px] font-black text-gray-400 mb-2 uppercase tracking-wider">
              {isRtl ? 'معاينة البطاقة النهائية:' : 'Live Render Preview:'}
            </span>

            {/* EXPORTABLE CARD CONTAINER NODE */}
            <div
              ref={cardRef}
              className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl transition-all duration-300 border ${currentTheme.bgClass} ${currentTheme.textClass} ${currentTheme.borderClass}`}
              style={{
                width: '100%',
                maxWidth: selectedFormat === '1:1' ? '340px' : '280px',
                aspectRatio: selectedFormat === '1:1' ? '1 / 1' : '9 / 16',
              }}
            >
              {/* Decorative Watermark Background Leaf / Quote */}
              <div className="absolute top-0 right-0 translate-x-1/3 translate-y-[-20%] text-white/5 text-[140px] font-serif pointer-events-none select-none">
                ”
              </div>

              {/* Card Tag Top */}
              <div className="relative z-10 flex items-center justify-between">
                <span className={`text-[11px] font-black px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 ${currentTheme.accentClass}`}>
                  {cardCategory}
                </span>
                <Sparkles className={`w-4 h-4 ${currentTheme.accentClass}`} />
              </div>

              {/* Card Quote Body */}
              <div className="relative z-10 my-auto py-4 text-center">
                <p className="text-sm sm:text-base font-extrabold leading-relaxed px-2 drop-shadow-sm font-sans">
                  «{cardText}»
                </p>
              </div>

              {/* Card Footer Signature */}
              <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] opacity-90">
                <span className="font-extrabold flex items-center gap-1">
                  <Heart className={`w-3.5 h-3.5 ${currentTheme.accentClass} fill-current`} />
                  <span>{authorName}</span>
                </span>

                {showWatermark && (
                  <span className="text-[9px] font-mono opacity-70 tracking-tight">
                    Yawmiyati App 🌿
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full mt-5 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleDownloadImage}
                disabled={isExporting}
                className="flex-1 py-3 bg-[#4E685B] hover:bg-[#3F5449] text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-amber-300" />
                <span>{downloadSuccess ? (isRtl ? 'تم التحميل! 💾' : 'Downloaded! 💾') : (isRtl ? 'تحميل صورة PNG' : 'Download PNG')}</span>
              </button>

              <button
                type="button"
                onClick={handleShareCard}
                disabled={isExporting}
                className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Share2 className="w-4 h-4" />
                <span>{isRtl ? 'مشاركة مباشرة' : 'Share Card'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyText}
                className="p-3 bg-white hover:bg-gray-100 border border-[#E2DCC8] text-gray-700 font-black text-xs rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-xs"
                title="Copy text"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

          </div>

        </div>

      </motion.div>
    </div>
  );
}
