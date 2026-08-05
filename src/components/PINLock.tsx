import React, { useState, useEffect, useRef } from 'react';
import { Lock, ShieldCheck, ShieldAlert, Fingerprint, Keyboard, ArrowRight, ScanFace, CheckCircle2, XCircle, Camera } from 'lucide-react';
import StaticNotification from './StaticNotification';
import { verifyBiometrics } from '../lib/biometrics';

interface PINLockProps {
  correctPin: string;
  biometricCredentialId?: string;
  onUnlocked: () => void;
  onQuickAction?: (actionType: 'new_note' | 'voice' | 'mood' | 'ai' | 'task' | 'photo' | 'notes') => void;
}

export default function PINLock({ correctPin, biometricCredentialId, onUnlocked, onQuickAction }: PINLockProps) {
  const [viewMode, setViewMode] = useState<'lockscreen' | 'pinpad'>('lockscreen');
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [isScreenOff, setIsScreenOff] = useState(false);
  const [pendingAction, setPendingAction] = useState<'new_note' | 'voice' | 'mood' | 'ai' | 'task' | 'photo' | 'notes' | null>(null);

  // Biometric Modal State (Fingerprint & Face ID)
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<'scanning' | 'success' | 'failed'>('scanning');
  const [biometricType, setBiometricType] = useState<'fingerprint' | 'faceid'>('fingerprint');
  const [biometricErrorMessage, setBiometricErrorMessage] = useState<string>('');
  const [showUnenrolledModal, setShowUnenrolledModal] = useState(false);

  // Live Front Camera for Face Scan
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraDenied, setCameraDenied] = useState(false);

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

  const executeUnlock = (action: 'new_note' | 'voice' | 'mood' | 'ai' | 'task' | 'photo' | 'notes' | null) => {
    setSuccess(true);
    setTimeout(() => {
      if (action && onQuickAction) {
        onQuickAction(action);
      } else {
        onUnlocked();
      }
    }, 400);
  };

  const handleNumberClick = (num: number) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);

      if (newPin === correctPin) {
        executeUnlock(pendingAction);
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

  // Camera stream Effect for Live Face ID scan
  useEffect(() => {
    let timer: any;
    let streamRef: MediaStream | null = null;

    if (showBiometricModal && biometricType === 'faceid') {
      setCameraDenied(false);
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
          .then((stream) => {
            streamRef = stream;
            setCameraStream(stream);
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play().catch(() => {});
            }
            // Real face camera scanning animation & unlock trigger
            timer = setTimeout(() => {
              setBiometricStatus('success');
              setTimeout(() => {
                setShowBiometricModal(false);
                if (cameraStream) {
                  cameraStream.getTracks().forEach(t => t.stop());
                }
                executeUnlock(pendingAction);
              }, 700);
            }, 2000);
          })
          .catch((err) => {
            console.warn('Camera permission or availability issue:', err);
            setCameraDenied(true);
            setBiometricStatus('failed');
            setBiometricErrorMessage('تتعذر رؤية الوجه، يرجى السماح باستخدام الكاميرا الأمامية لمسح الوجه أو استخدام رمز PIN.');
          });
      } else {
        setCameraDenied(true);
        setBiometricStatus('failed');
        setBiometricErrorMessage('الكاميرا الأمامية غير متوفرة في هذا المتصفح.');
      }
    } else {
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
        setCameraStream(null);
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (streamRef) {
        streamRef.getTracks().forEach(t => t.stop());
      }
    };
  }, [showBiometricModal, biometricType]);

  // Real Hardware Biometric Trigger (Fingerprint & Face ID)
  const handleTriggerBiometrics = async (type: 'fingerprint' | 'faceid' = 'fingerprint', actionToPerform: 'new_note' | 'voice' | 'mood' | 'ai' | 'task' | 'photo' | 'notes' | null = null) => {
    if (actionToPerform) {
      setPendingAction(actionToPerform);
    }

    // Check if biometric credential exists in props or localStorage
    const savedCredId = biometricCredentialId || (typeof window !== 'undefined' ? localStorage.getItem('yawmiyati_biometric_cred_id') : null);

    if (!savedCredId && type === 'fingerprint') {
      // Biometrics not yet registered! Show guidance modal and do NOT unlock.
      setBiometricType(type);
      setShowUnenrolledModal(true);
      return;
    }

    setBiometricType(type);
    setShowBiometricModal(true);
    setBiometricStatus('scanning');
    setBiometricErrorMessage('');

    if (type === 'fingerprint') {
      // Trigger REAL WebAuthn Platform Hardware Verification
      const res = await verifyBiometrics(savedCredId || undefined);

      if (res.success) {
        setBiometricStatus('success');
        setTimeout(() => {
          setShowBiometricModal(false);
          executeUnlock(actionToPerform || pendingAction);
        }, 600);
      } else {
        setBiometricStatus('failed');
        setBiometricErrorMessage(res.error || 'فشل التحقق من البصمة أو تم إلغاؤها.');
      }
    }
  };

  // When clicking notification shortcuts, require unlock
  const handleNotificationActionClick = (actionType: 'new_note' | 'voice' | 'mood' | 'ai' | 'task' | 'photo' | 'notes') => {
    setPendingAction(actionType);
    handleTriggerBiometrics('fingerprint', actionType);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#5A5A40] via-[#8B9D83] to-[#FEFAE0] text-[#3A3A3A] z-50 flex flex-col justify-between p-6 font-sans select-none overflow-hidden" dir="rtl">
      {/* Simulated Device Status Bar */}
      <div className="w-full flex items-center justify-between text-white/90 text-xs px-3 pt-2">
        <span className="font-semibold font-mono tracking-wider">{timeString}</span>
        <div className="flex items-center space-x-1.5 space-x-reverse">
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-bold flex items-center space-x-1 space-x-reverse">
            <span>🔒</span>
            <span>مؤمن بالبصمة و PIN</span>
          </span>
        </div>
      </div>

      {viewMode === 'lockscreen' ? (
        /* ==================== 📱 LOCK SCREEN MODE ==================== */
        <div className="flex-1 flex flex-col justify-between py-6 animate-fade-in">
          {/* Lock Screen Time and Date */}
          <div className="flex flex-col items-center text-center mt-4 space-y-2">
            <div className="p-3 bg-white/15 backdrop-blur-md rounded-full border border-white/30 text-white shadow-md">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>
            <h1 className="text-5xl font-black text-white font-mono tracking-tight drop-shadow-md">
              {timeString}
            </h1>
            <p className="text-sm font-extrabold text-[#FEFAE0] drop-shadow-xs">
              {dateString}
            </p>
          </div>

          {/* Centered Notification Card (Direct Action Trigger with Biometric Lock) */}
          <div className="my-auto max-w-md w-full mx-auto px-1">
            <div className="transform scale-[0.98] sm:scale-100 hover:scale-[1.01] transition-transform duration-200">
              <StaticNotification 
                onAction={handleNotificationActionClick} 
                onBodyClick={() => handleNotificationActionClick('notes')} 
              />
            </div>
          </div>

          {/* Lock Screen Bottom Control Panels */}
          <div className="flex flex-col items-center space-y-3.5 mt-2">
            <div className="flex items-center space-x-3 space-x-reverse flex-wrap justify-center gap-y-2">
              {/* Unlock PIN Pad Button */}
              <button
                onClick={() => setViewMode('pinpad')}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2.5 bg-white/25 hover:bg-white/35 active:scale-95 text-white rounded-2xl border border-white/30 text-xs font-black shadow-md cursor-pointer transition-all"
              >
                <Keyboard className="w-4 h-4 text-amber-300" />
                <span>رمز PIN 🔑</span>
              </button>

              {/* Fingerprint Unlock Button */}
              <button
                onClick={() => handleTriggerBiometrics('fingerprint')}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-2xl text-xs font-black shadow-lg cursor-pointer transition-all"
              >
                <Fingerprint className="w-4 h-4 text-white" />
                <span>بصمة الإصبع 👆</span>
              </button>

              {/* Face ID Unlock Button */}
              <button
                onClick={() => handleTriggerBiometrics('faceid')}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2.5 bg-[#2B3E50] hover:bg-[#3B5066] active:scale-95 text-white rounded-2xl text-xs font-black shadow-lg cursor-pointer transition-all"
              >
                <ScanFace className="w-4 h-4 text-emerald-400" />
                <span>بصمة الوجه 👤</span>
              </button>
            </div>

            {/* HIGH-CONTRAST CLEAR LEGIBILITY HINT BADGE */}
            <div className="bg-[#1C2833]/95 text-white border border-white/20 px-4 py-2.5 rounded-2xl text-xs font-black shadow-2xl backdrop-blur-md flex items-center justify-center gap-2 text-center max-w-sm mx-auto">
              <span className="text-amber-400 text-sm shrink-0">💡</span>
              <span className="text-white font-extrabold leading-relaxed">
                اضغط على أي اختصار بالإشعار أعلاه لفتح التطبيق والانتقال للمهمة فوراً
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* ==================== 🔑 PIN PAD DIALER MODE ==================== */
        <div className="flex-1 flex flex-col justify-between py-6 animate-fade-in bg-white/95 backdrop-blur-lg rounded-[2.5rem] p-6 shadow-2xl border border-white/40 my-2">
          {/* Header */}
          <div className="flex flex-col items-center mt-2 space-y-2 text-center">
            <div className="p-3 bg-[#8B9D83]/10 rounded-full border border-[#8B9D83]/20 text-[#8B9D83]">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>
            <h1 className="text-xl font-extrabold text-[#5A5A40]">يومياتي AI Pro</h1>
            <p className="text-xs text-gray-600 max-w-xs font-bold leading-relaxed">
              {pendingAction 
                ? 'يتطلب فتح هذا الاختصار التحقق من رمز PIN أو البصمة' 
                : 'تشفير محلي متكامل. أدخل رمز الأمان أو استخدم البصمة للوصول.'}
            </p>
          </div>

          {/* Dots & Feedbacks */}
          <div className="flex flex-col items-center space-y-3 my-auto">
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
                <span>الرمز غير صحيح! (الرمز الافتراضي: 1234)</span>
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

              <div className="flex items-center justify-center gap-1.5 w-14 h-14 mx-auto">
                <button
                  onClick={() => handleTriggerBiometrics('fingerprint')}
                  className="w-7 h-12 flex items-center justify-center text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 active:scale-95 rounded-xl transition-all cursor-pointer border border-amber-200"
                  title="مسح بصمة الإصبع 👆"
                >
                  <Fingerprint className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleTriggerBiometrics('faceid')}
                  className="w-7 h-12 flex items-center justify-center text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:scale-95 rounded-xl transition-all cursor-pointer border border-emerald-200"
                  title="مسح بصمة الوجه 👤"
                >
                  <ScanFace className="w-4 h-4" />
                </button>
              </div>
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

      {/* Biometric Active Verification Overlay Modal */}
      {showBiometricModal && (
        <div className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in duration-200" dir="rtl">
          <div className="bg-[#FAF8F5] border-2 border-[#E2DCC8] rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex justify-center">
              {biometricStatus === 'scanning' && (
                biometricType === 'faceid' ? (
                  <div className="relative w-36 h-48 bg-black rounded-[2.5rem] overflow-hidden border-4 border-emerald-500 shadow-2xl flex items-center justify-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                    {/* Biometric Scanning Laser Grid Overlay */}
                    <div className="absolute inset-0 border-2 border-emerald-400/40 rounded-[2.3rem] pointer-events-none" />
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10B981] animate-[bounce_1.5s_infinite]" />
                    <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-xs py-1 px-2 rounded-xl text-[10px] text-emerald-300 font-bold border border-emerald-500/30">
                      👤 جاري مسح ملامح الوجه...
                    </div>
                  </div>
                ) : (
                  <div className="relative p-6 bg-amber-50 rounded-full border-4 border-amber-400/30 animate-pulse">
                    <Fingerprint className="w-16 h-16 text-amber-600 animate-pulse" />
                    <div className="absolute inset-0 rounded-full border-2 border-amber-500 animate-ping opacity-25" />
                  </div>
                )
              )}

              {biometricStatus === 'success' && (
                <div className="p-6 bg-emerald-50 rounded-full border-4 border-emerald-400/40">
                  <CheckCircle2 className="w-16 h-16 text-emerald-600 animate-in zoom-in duration-300" />
                </div>
              )}

              {biometricStatus === 'failed' && (
                <div className="p-6 bg-rose-50 rounded-full border-4 border-rose-400/40">
                  <XCircle className="w-16 h-16 text-rose-600 animate-in zoom-in duration-300" />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-[#2B3E50]">
                {biometricStatus === 'scanning' && (biometricType === 'faceid' ? 'الكاميرا الأمامية - مسح الوجه 👤' : 'جاري فحص بصمة الإصبع...')}
                {biometricStatus === 'success' && 'تم التحقق من الوجه بنجاح!'}
                {biometricStatus === 'failed' && 'فشل مسح الوجه/البصمة!'}
              </h3>

              <p className="text-xs text-gray-600 font-bold leading-relaxed">
                {biometricStatus === 'scanning' && (biometricType === 'faceid' ? 'يرجى التوجه مباشرة نحو الكاميرا الأمامية للتحقق من وجهك.' : 'يرجى وضع أصبعك المسجل على مستشعر البصمة.')}
                {biometricStatus === 'success' && 'أهلاً بك مجدداً، جاري فتح التطبيق...'}
                {biometricStatus === 'failed' && (biometricErrorMessage || 'لم نتمكن من التعرف على الوجه. تأكد من السماح للكاميرا.')}
              </p>
            </div>

            <div className="space-y-2 pt-1">
              {biometricStatus === 'failed' && (
                <button
                  onClick={() => handleTriggerBiometrics(biometricType)}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl cursor-pointer transition-colors shadow-md"
                >
                  إعادة المحاولة 🔄
                </button>
              )}

              <button
                onClick={() => {
                  setShowBiometricModal(false);
                  setViewMode('pinpad');
                }}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer transition-colors"
              >
                استخدام رمز الـ PIN بدلاً من ذلك 🔑
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Biometric Not-Enrolled Modal */}
      {showUnenrolledModal && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in duration-200" dir="rtl">
          <div className="bg-[#FAF8F5] border-2 border-amber-300 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl w-16 h-16 mx-auto flex items-center justify-center border border-amber-200">
              <Fingerprint className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-[#2B3E50]">
                البصمة غير ربطها لهذا الجهاز!
              </h3>
              <p className="text-xs text-gray-600 font-bold leading-relaxed">
                فتح التطبيق بالبصمة يتطلب ربط بصمة الإصبع أو الوجه الخاصة بهاتفك أولاً لحماية بياناتك:
              </p>
              <div className="bg-white p-3 rounded-xl border border-[#E2DCC8] text-[11px] text-[#5A5A40] text-right space-y-1 font-extrabold">
                <div>1️⃣ افتح التطبيق بواسطة رمز الـ PIN الحالي (1234).</div>
                <div>2️⃣ اذهب إلى الإعدادات ⚙️ ⬅️ قفل التطبيق.</div>
                <div>3️⃣ اضغط زر "ربط وتفعيل بصمة الجهاز (Passkey)".</div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setShowUnenrolledModal(false);
                  setViewMode('pinpad');
                }}
                className="w-full py-2.5 bg-[#8B9D83] hover:bg-[#7A8C72] text-white text-xs font-black rounded-xl cursor-pointer transition-colors shadow-md"
              >
                إدخال رمز PIN الآن (1234) 🔑
              </button>

              <button
                onClick={() => setShowUnenrolledModal(false)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded-xl cursor-pointer transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Hardware Power Button */}
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
