import { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false
  };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught app error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center text-[#3A3A3A] dir-rtl font-sans">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-[#E2DCC8] shadow-lg space-y-4">
            <div className="text-4xl">🎙️</div>
            <h1 className="text-xl font-bold text-[#2B3E50]">استعادة الواجهة بسلاسة</h1>
            <p className="text-xs text-gray-600 leading-relaxed">
              حدث تنبيه غير متوقع أثناء المعالجة. تم حفظ بياناتك بأمان. انقر الزر أدناه لإكمال العمل.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="px-6 py-2.5 bg-[#8B9D83] text-white rounded-xl font-bold text-xs hover:bg-[#7A8C72] transition-colors shadow-sm cursor-pointer"
            >
              إعادة تحميل الصفحة 🔄
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
