import React, { useState } from 'react';
import { X, Eye, EyeOff, Globe } from 'lucide-react';
import { AppLanguage, getLanguageInfo, getTranslation } from '../lib/languages';

interface GeminiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSave: (key: string) => void;
  onClear: () => void;
  appLanguage?: AppLanguage;
  isEn?: boolean;
}

export default function GeminiKeyModal({ isOpen, onClose, apiKey, onSave, onClear, appLanguage = 'ar' }: GeminiKeyModalProps) {
  const [tempKey, setTempKey] = useState(apiKey || '');
  const [showPassword, setShowPassword] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState<string | null>(null);

  const langInfo = getLanguageInfo(appLanguage);
  const t = getTranslation(appLanguage);

  if (!isOpen) return null;

  const handleSave = async () => {
    const trimmedKey = tempKey.trim();
    if (!trimmedKey) {
      onSave('');
      onClose();
      return;
    }

    setIsValidating(true);
    setValidationError(null);
    setValidationSuccess(null);

    try {
      const response = await fetch('/api/gemini/verify-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: trimmedKey })
      });

      const data = await response.json();
      if (data.success) {
        setValidationSuccess(t.apiKeyVerified);
        setTimeout(() => {
          onSave(trimmedKey);
          onClose();
          setValidationSuccess(null);
        }, 1500);
      } else {
        setValidationError(data.error || t.apiKeyVerifyFailed);
      }
    } catch (e: any) {
      setValidationError(t.apiKeyVerifyFailed);
    } finally {
      setIsValidating(false);
    }
  };

  const handleClear = () => {
    onClear();
    setTempKey('');
    setValidationError(null);
    setValidationSuccess(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[55] font-sans" dir={langInfo.dir}>
      <div className="bg-[#FAF8F5] border border-[#E2DCC8] rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl transition-all duration-300 transform scale-100">
        
        {/* Header */}
        <div className="p-6 pb-2 flex items-center justify-between">
          <h4 className="font-black text-[#2B3E50] text-base md:text-lg flex items-center gap-2">
            <span>🔑</span>
            <span>{t.geminiKeyTitle} 🔑</span>
          </h4>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-600 font-extrabold leading-relaxed text-justify">
            {t.geminiKeyDesc}
          </p>

          <div className="bg-amber-50/10 border border-amber-200/50 rounded-2xl p-4">
            <p className="text-[10px] text-amber-800/80 font-bold leading-relaxed text-justify">
              {t.geminiKeyNotice}
            </p>
          </div>

          {/* Form Field with Label on Border */}
          <div className="relative mt-4">
            <label className={`absolute -top-2.5 ${langInfo.dir === 'rtl' ? 'right-4' : 'left-4'} px-2 bg-[#FAF8F5] text-[10px] font-black text-gray-500`}>
              {t.geminiKeyTitle}
            </label>
            <div className="flex items-center bg-white border-2 border-[#E2DCC8] rounded-2xl px-4 py-3 shadow-3xs focus-within:border-[#8B9D83] transition-all">
              <input
                type={showPassword ? "text" : "password"}
                value={tempKey}
                disabled={isValidating}
                onChange={(e) => setTempKey(e.target.value)}
                placeholder={t.geminiKeyPlaceholder}
                className="w-full bg-transparent text-xs text-[#2B3E50] font-mono focus:outline-none placeholder-gray-400 font-bold disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Validation Alert Messages */}
          {validationError && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-xs font-bold text-red-700 space-y-1">
              <p className="flex items-center gap-1">
                <span>⚠️</span>
                <span>{t.apiKeyVerifyFailed}</span>
              </p>
              <p className="font-medium text-[11px] opacity-90 leading-relaxed">{validationError}</p>
            </div>
          )}

          {validationSuccess && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-xs font-bold text-emerald-800 flex items-center gap-2">
              <span className="text-sm">✓</span>
              <span>{validationSuccess}</span>
            </div>
          )}

          {/* Get Free Key Link Card */}
          <a
            href="https://aistudio.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#F5EFE6] border border-[#E2DCC8] hover:bg-[#EADFC9] text-[#5A4F41] font-extrabold text-xs py-3.5 rounded-2xl transition-all cursor-pointer shadow-3xs"
          >
            <Globe className="w-4 h-4 text-sky-600 animate-pulse" />
            <span>{t.getFreeKeyLink}</span>
          </a>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleClear}
              disabled={isValidating}
              className="flex-1 py-3 bg-white hover:bg-red-50 border-2 border-red-100 hover:border-red-200 text-red-600 font-black text-xs rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-3xs disabled:opacity-50"
            >
              <span>🗑️</span>
              <span>{t.deleteKeyBtn}</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isValidating}
              className="flex-1 py-3 bg-[#3F5449] hover:bg-[#2C3E50] text-white font-black text-xs rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs hover:shadow-md disabled:opacity-75"
            >
              {isValidating ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{t.verifyingKey}</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>{t.saveKeyBtn}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
