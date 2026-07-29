import React, { useState } from 'react';
import { X, Copy, Mail, Check } from 'lucide-react';

interface ContactOwnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEn: boolean;
}

export default function ContactOwnerModal({ isOpen, onClose, isEn }: ContactOwnerModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const emailAddress = "support@yawmiyati.app";

  const handleCopy = () => {
    navigator.clipboard.writeText(emailAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmailClick = () => {
    window.location.href = `mailto:${emailAddress}?subject=يومياتي AI - اقتراح وتطوير`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-55 font-sans" dir={isEn ? "ltr" : "rtl"}>
      <div className="bg-[#FAF8F5] border border-[#E2DCC8] rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl transition-all duration-300 transform scale-100">
        
        {/* Header */}
        <div className="p-6 pb-2 flex items-center justify-between">
          <h4 className="font-black text-[#2B3E50] text-lg flex items-center gap-2">
            <span>✨</span>
            <span>{isEn ? "Contact the App Owner" : "تواصل مع مالك التطبيق 📬 ✨"}</span>
          </h4>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          <p className="text-xs text-gray-600 font-extrabold leading-relaxed">
            {isEn 
              ? "This is the personal email address of the app owner, and you can contact them through it:" 
              : "هذا هو البريد الإلكتروني الخاص بمالك التطبيق ويمكنك التواصل معه من خلاله:"}
          </p>

          {/* Email Display & Copy Action */}
          <div className="flex items-center justify-between bg-white border-2 border-[#E2DCC8] rounded-2xl px-4 py-3 shadow-3xs hover:border-[#8B9D83] transition-all">
            <span className="font-mono text-sm font-black text-[#2B3E50] tracking-wide select-all">
              {emailAddress}
            </span>
            <button 
              onClick={handleCopy}
              className={`p-2 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
                copied ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-500 hover:bg-[#8B9D83]/10 hover:text-[#4E685B]'
              }`}
              title={isEn ? "Copy Email" : "نسخ البريد الإلكتروني"}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Statement box with a beautiful cream background and border */}
          <div className="bg-[#FEFBF3] border border-[#F1E8D9] rounded-2xl p-5 shadow-3xs">
            <p className="text-xs text-gray-700 font-bold leading-relaxed text-justify">
              {isEn 
                ? "I am just a person who uses this app to develop myself and make life easier for myself and others by taking advantage of technological development and artificial intelligence. Therefore, I welcome any constructive feedback or advice that benefits us all. Thank you..." 
                : "أنا مجرد شخص يستخدم هذا التطبيق لتطوير نفسه وتسهيل الحياة على نفسه وعلى غيره من خلال الاستفادة بالتطور التكنولوجي والذكاء الاصطناعي؛ وعليه فإنني أقبل أي نقد أو نصيحة تفيدنا جميعاً. وشكراً..."}
            </p>
          </div>

          {/* Buttons Row */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-white hover:bg-gray-50 border-2 border-[#E2DCC8] text-gray-600 font-black text-xs rounded-2xl transition-all cursor-pointer shadow-3xs"
            >
              {isEn ? "Close" : "إلغاء"}
            </button>
            <button
              onClick={handleEmailClick}
              className="flex-2 py-3 bg-[#3F5449] hover:bg-[#2B3E50] text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs hover:shadow-md"
            >
              <Mail className="w-4 h-4" />
              <span>{isEn ? "Message Now" : "مراسلة الآن ✉️"}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
