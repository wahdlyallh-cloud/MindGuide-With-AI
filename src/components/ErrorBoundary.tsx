import React, { Component, ReactNode, ErrorInfo } from 'react';
import { getTranslation, getLanguageInfo, AppLanguage } from '../lib/languages';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false
  };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught app error:", error, errorInfo);
  }

  public override render() {
    if (this.state.hasError) {
      const savedLang = (typeof window !== 'undefined' ? localStorage.getItem('app_language') : null) || 'ar';
      const langCode = (['ar', 'en', 'fr', 'de', 'es', 'tr', 'ur', 'ru', 'zh', 'ja'].includes(savedLang) ? savedLang : 'ar') as AppLanguage;
      const t = getTranslation(langCode);
      const langInfo = getLanguageInfo(langCode);
      const isRtl = langInfo.dir === 'rtl';

      const title = t['errorBoundaryTitle'] || (isRtl ? "استعادة الواجهة بسلاسة" : "Smooth Interface Recovery");
      const desc = t['errorBoundaryDesc'] || (isRtl 
        ? "حدث تنبيه غير متوقع أثناء المعالجة. تم حفظ بياناتك بأمان. انقر الزر أدناه لإكمال العمل."
        : "An unexpected notice occurred during processing. Your data is stored safely. Click the button below to resume.");
      const reloadBtn = t['errorBoundaryReloadBtn'] || (isRtl ? "إعادة تحميل الصفحة 🔄" : "Reload Page 🔄");

      return (
        <div className={`min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center text-[#3A3A3A] font-sans ${isRtl ? 'dir-rtl' : 'dir-ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-[#E2DCC8] shadow-lg space-y-4">
            <div className="text-4xl">🎙️</div>
            <h1 className="text-xl font-bold text-[#2B3E50]">{title}</h1>
            <p className="text-xs text-gray-600 leading-relaxed">
              {desc}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="px-6 py-2.5 bg-[#8B9D83] text-white rounded-xl font-bold text-xs hover:bg-[#7A8C72] transition-colors shadow-sm cursor-pointer"
            >
              {reloadBtn}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


