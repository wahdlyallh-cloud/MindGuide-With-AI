import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, ShieldAlert, Fingerprint, Keyboard, ArrowRight, Bell, Battery, Wifi } from 'lucide-react';
import StaticNotification from './StaticNotification';

interface PINLockProps {
  correctPin: string;
  onUnlocked: () => void;
  onQuickAction?: (actionType: 'new_note' | 'voice' | 'mood' | 'ai' | 'task' | 'photo' | 'notes') => void;
}

export default function PINLock({ correctPin, onUnlocked, onQuickAction }: PINLockProps) {
  const [viewMode, setViewMode] = useState<'lockscreen' | 'pinpad'>('lockscreen');
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [isScreenOff, setIsScreenOff] = useState(false);

  const [timeString, setTimeString] = useState('');
  const [dateString, setDateString] = useState('');

  // Update time live on the lock screen
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setTimeString(`${hours}:${minutes}`);

      const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
      setDateString(now.toLocaleDateString('ar-EG', options));
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleNumberClick = (num: number) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);

      if (newPin === correctPin) {
        setSuccess(true);
        setTimeout(() => {
          onUnlocked();
        }, 800);
      } else if (newPin.length === 4) {
        // Wrong PIN
        setTimeout(() => {
          setError(true);
          setPin('');
        }, 200);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const handleFingerprintMock = () => {
    setSuccess(true);
    setTimeout(() => {
      onUnlocked();
    }, 800);
  };

  const handleNotificationAction = (actionType: 'new_note' | 'voice' | 'mood' | 'ai' | 'task' | 'photo' | 'notes') => {
    setSuccess(true);
    setTimeout(() => {
      if (onQuickAction) {
        onQuickAction(actionType);
      } else {
        onUnlocked();
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#5A5A40] via-[#8B9D83] to-[#FEFAE0] text-[#3A3A3A] z-50 flex flex-col justify-between p-6 font-sans select-none overflow-hidden" dir="rtl">
      {/* Simulated Device Status Bar */}
      <div className="w-full flex items-center justify-between text-white/90 text-xs px-3 pt-2">
        <span className="font-semibold font-mono tracking-wider">{timeString}</span>
        <div className="flex items-center space-x-1.5 space-x-reverse">
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-bold flex items-center space-x-1 space-x-reverse">
            <span>🔒</span>
            <span>مؤمن بالكامل</span>
          </span>
          <Wifi className="w-3.5 h-3.5" />
          <Battery className="w-4 h-4" />
        </div>
      </div>

      {viewMode === 'lockscreen' ? (
        /* ==================== 📱 LOCK SCREEN MODE ==================== */
        <div className="flex-1 flex flex-col justify-between py-6 animate-fade-in">
          {/* Lock Screen Time and Date */}
          <div className="flex flex-col items-center text-center mt-6 space-y-2">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/25 text-white shadow-xs">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>
            <h1 className="text-5xl font-black text-white font-mono tracking-tight drop-shadow-md">
              {timeString}
            </h1>
            <p className="text-sm font-extrabold text-[#FEFAE0] drop-shadow-xs">
              {dateString}
            </p>
          </div>

          {/* Centered Notification Card (Direct Action Trigger) */}
          <div className="my-auto max-w-md w-full mx-auto px-1">
            <div className="transform scale-[0.98] sm:scale-100 hover:scale-[1.01] transition-transform duration-200">
              <StaticNotification 
                onAction={handleNotificationAction} 
                onBodyClick={() => handleNotificationAction('notes')} 
              />
            </div>
          </div>

          {/* Lock Screen Bottom Control Panels */}
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-4 space-x-reverse">
              {/* Unlock PIN Pad Button */}
              <button
                onClick={() => setViewMode('pinpad')}
                className="flex items-center space-x-2 space-x-reverse px-5 py-3 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-2xl border border-white/25 text-xs font-black shadow-md cursor-pointer transition-colors"
              >
                <Keyboard className="w-4 h-4" />
                <span>أدخل رمز الـ PIN 🔑</span>
              </button>

              {/* Fingerprint Unlock Button */}
              <button
                onClick={handleFingerprintMock}
                className="flex items-center space-x-2 space-x-reverse px-5 py-3 bg-amber-500/80 hover:bg-amber-500 text-white rounded-2xl text-xs font-black shadow-md cursor-pointer transition-colors animate-pulse"
              >
                <Fingerprint className="w-4 h-4" />
                <span>بصمة الإصبع 👆</span>
              </button>
            </div>

            <p className="text-[10px] text-white/80 font-bold tracking-wide">
              💡 اضغط على أي اختصار بالإشعار أعلاه لفتح التطبيق والانتقال للمهمة فوراُ!
            </p>
          </div>
        </div>
      ) : (
        /* ==================== 🔑 PIN PAD DIALER MODE ==================== */
        <div className="flex-1 flex flex-col justify-between py-6 animate-fade-in bg-white/95 backdrop-blur-lg rounded-[2.5rem] p-6 shadow-2xl border border-white/40 my-2">
          {/* Header */}
          <div className="flex flex-col items-center mt-4 space-y-2 text-center">
            <div className="p-3 bg-[#8B9D83]/10 rounded-full border border-[#8B9D83]/20 text-[#8B9D83]">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>
            <h1 className="text-xl font-extrabold text-[#5A5A40]">يومياتي AI Pro</h1>
            <p className="text-xs text-gray-500 max-w-xs font-bold leading-relaxed">
              تشفير محلي متكامل. يرجى إدخال رمز الأمان أو مسح البصمة للوصول الآمن.
            </p>
          </div>

          {/* Dots & Feedbacks */}
          <div className="flex flex-col items-center space-y-4 my-auto">
            <div className="flex space-x-3.5 space-x-reverse justify-center">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-300 ${
                    pin.length > index
                      ? 'bg-[#8B9D83] border-[#8B9D83] scale-110 shadow-[0_0_12px_rgba(139,157,131,0.5)]'
                      : 'border-[#E2DCC8] bg-[#F0EDE4]'
                  }`}
                />
              ))}
            </div>

            {error && (
              <div className="flex items-center space-x-2 space-x-reverse text-[#D4A373] text-xs font-bold animate-bounce">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>الرمز غير صحيح! (الافتراضي: 1234)</span>
              </div>
            )}

            {success && (
              <div className="flex items-center space-x-2 space-x-reverse text-[#8B9D83] text-xs font-black">
                <ShieldCheck className="w-4 h-4 animate-pulse" />
                <span>تم التحقق بنجاح... جاري الدخول</span>
              </div>
            )}
          </div>

          {/* Dialer Keypad */}
          <div className="w-full max-w-xs mx-auto space-y-4">
            <div className="grid grid-cols-3 gap-3.5 text-center">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumberClick(num)}
                  className="w-14 h-14 mx-auto flex items-center justify-center text-xl font-bold bg-[#F9F7F2] hover:bg-[#F0EDE4] active:bg-[#8B9D83] active:text-white rounded-full transition-colors duration-100 focus:outline-none cursor-pointer border border-[#E2DCC8]/60 shadow-3xs"
                >
                  {num}
                </button>
              ))}

              <button
                onClick={handleDelete}
                className="w-14 h-14 mx-auto flex items-center justify-center text-xs font-black bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-full cursor-pointer border border-[#E2DCC8]/40"
              >
                مسح
              </button>

              <button
                onClick={() => handleNumberClick(0)}
                className="w-14 h-14 mx-auto flex items-center justify-center text-xl font-bold bg-[#F9F7F2] hover:bg-[#F0EDE4] active:bg-[#8B9D83] active:text-white rounded-full transition-colors duration-100 cursor-pointer border border-[#E2DCC8]/60"
              >
                0
              </button>

              <button
                onClick={handleFingerprintMock}
                className="w-14 h-14 mx-auto flex items-center justify-center text-[#D4A373] hover:text-[#c39162] bg-[#D4A373]/10 hover:bg-[#D4A373]/20 active:scale-95 rounded-full transition-all cursor-pointer border border-[#D4A373]/20"
                title="البصمة للتخطي"
              >
                <Fingerprint className="w-5 h-5" />
              </button>
            </div>

            {/* Back Button and Prompt */}
            <div className="flex items-center justify-between border-t border-[#E2DCC8]/40 pt-3.5 mt-2">
              <button
                onClick={() => setViewMode('lockscreen')}
                className="flex items-center space-x-1.5 space-x-reverse px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-[10px] font-bold cursor-pointer transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>شاشة القفل 📱</span>
              </button>
              <span className="text-[9px] text-gray-400 font-extrabold">
                تلميح الـ PIN: <strong className="text-[#D4A373] font-bold font-mono">1234</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Hardware Power Button protruding from the right edge */}
      <div 
        onClick={() => setIsScreenOff(prev => !prev)}
        className="fixed right-0 top-[35%] w-3.5 h-16 bg-gradient-to-l from-[#222] to-[#444] rounded-l-lg hover:from-[#333] hover:to-[#555] border border-gray-600 border-r-0 shadow-xl cursor-pointer transition-all hover:w-4 z-[9999] flex items-center justify-center group"
        title="زر الـ Power (إيقاظ / إغلاق الشاشة)"
      >
        <span className="opacity-0 group-hover:opacity-100 absolute right-6 bg-black/85 text-white text-[10px] font-extrabold py-1 px-2 rounded-lg whitespace-nowrap transition-opacity pointer-events-none shadow-md">
          {isScreenOff ? 'تشغيل الشاشة 🔌' : 'إغلاق الشاشة 🔌'}
        </span>
      </div>

      {/* Sleeping Black Screen Overlay if screen is simulated turned-off */}
      {isScreenOff && (
        <div 
          onClick={() => setIsScreenOff(false)}
          className="fixed inset-0 bg-black z-[9998] flex flex-col items-center justify-center cursor-pointer select-none"
        >
          <div className="text-center text-gray-500 text-xs font-bold space-y-3 animate-pulse">
            <span className="text-3xl block">💤</span>
            <p className="text-gray-400">الشاشة مغلقة بالكامل (Screen Off)</p>
            <p className="text-[10px] text-gray-600">اضغط على زر الـ Power الجانبي أو انقر في أي مكان لتشغيل الشاشة والعودة لشاشة القفل</p>
          </div>
        </div>
      )}
    </div>
  );
}
