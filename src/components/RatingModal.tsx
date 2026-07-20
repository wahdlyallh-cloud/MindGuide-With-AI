import React, { useState } from 'react';
import { X, Star, Check } from 'lucide-react';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEn: boolean;
}

export default function RatingModal({ isOpen, onClose, isEn }: RatingModalProps) {
  const [ratingValue, setRatingValue] = useState(5);
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    // Simulate API or persistence
    setTimeout(() => {
      onClose();
      setIsSubmitted(false);
      setFeedback('');
      setRatingValue(5);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 bg-[#3A3A3A]/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-sans" dir={isEn ? "ltr" : "rtl"}>
      <div className="bg-white border border-[#E2DCC8] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl transition-all duration-300 transform scale-100">
        
        {/* Header */}
        <div className="p-5 border-b border-[#E2DCC8]/50 flex items-center justify-between bg-[#F9F7F2]/50">
          <h4 className="font-extrabold text-[#3A3A3A] text-sm md:text-base">
            {isEn ? "⭐ Rate Our Application" : "⭐ تقييم تطبيق يومياتي AI"}
          </h4>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSubmitted ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <Check className="w-8 h-8" />
              </div>
              <h5 className="font-extrabold text-[#3A3A3A] text-base">
                {isEn ? "Thank you for your rating! ❤️" : "شكراً جزيلاً لتقييمك الرائع! ❤️"}
              </h5>
              <p className="text-xs text-gray-500 font-medium max-w-xs mx-auto leading-relaxed">
                {isEn 
                  ? "Your response has been securely saved. We constantly work to improve the clinical experience." 
                  : "تم حفظ تقييمك بنجاح وسريّة تامة. نقدّر اقتراحاتك كثيراً لتطوير التطبيق وتحسينه!"}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="text-center space-y-2">
                <p className="text-xs text-gray-500 font-medium">
                  {isEn 
                    ? "How would you rate your experience with our AI smart journal?" 
                    : "ما هو تقييمك لتجربتك في تدوين المذكرات والصحة النفسية مع المساعد الذكي؟"}
                </p>
                
                {/* Stars container */}
                <div className="flex items-center justify-center space-x-1.5 space-x-reverse py-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverValue(star)}
                      onMouseLeave={() => setHoverValue(null)}
                      onClick={() => setRatingValue(star)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star 
                        className={`w-8 h-8 transition-colors ${
                          star <= (hoverValue ?? ratingValue)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-200'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-[#8B9D83] bg-[#8B9D83]/10 px-3 py-1 rounded-full">
                  {ratingValue} / 5
                </span>
              </div>

              {/* Feedback textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#5A5A40]">
                  {isEn ? "Your feedback (optional):" : "ملاحظات إضافية لتحسين التطبيق (اختياري):"}
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={isEn ? "What do you like? What can we do better?" : "اكتب هنا أي مميزات ترغب بإضافتها أو اقتراحات لتطوير التطبيق..."}
                  rows={3}
                  className="w-full bg-white border border-[#E2DCC8] rounded-xl p-3 text-xs text-[#3A3A3A] focus:outline-none focus:ring-2 focus:ring-[#8B9D83] focus:border-transparent resize-none leading-relaxed"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center space-x-2 space-x-reverse pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-[#3A3A3A] font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {isEn ? "Cancel" : "إلغاء"}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-[#8B9D83] hover:bg-[#5A5A40] text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md"
                >
                  {isEn ? "Submit Rating" : "إرسال التقييم"}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
