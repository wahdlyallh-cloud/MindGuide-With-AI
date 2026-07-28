import React, { useState, useEffect, useRef } from 'react';
import { Brain, Send, ShieldCheck, HelpCircle, Sparkles, Mic, Trash2, Paperclip } from 'lucide-react';
import { DiaryEntry } from '../types';

interface SmartAdvisorProps {
  diaries: DiaryEntry[];
  habits?: any[];
  gratitudeCards?: any[];
  books?: any[];
  userApiKey?: string;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  createdAt: string;
}

export default function SmartAdvisor({ diaries, habits = [], gratitudeCards = [], books = [], userApiKey }: SmartAdvisorProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('yawmiyati_chat_messages');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing chat messages:', e);
      }
    }
    return [
      {
        id: 'welcome',
        sender: 'ai',
        text: 'أهلاً بك في **المستشار الذكي لليوميات (Yawmiyati AI)**. أنا صديقك ومستشارك الخاص، ولدي الصلاحية لمساعدتك في ربط الخيوط واكتشاف الأنماط وتحليل مزاجك على مدار الأيام والأسابيع.\n\nيمكنك أن تسألني عما تشاء، مثل:\n• *"ما الذي سبب لي القلق خلال الأسبوع الماضي؟"*\n• *"ماذا حدث لي يوم 15 يوليو؟"*\n• *"متى كانت آخر مرة شعرت فيها بالسعادة؟"*\n• *"قارن بين حالتي النفسية مؤخراً ومقارنتها بالشهر الماضي."*',
        createdAt: new Date().toISOString()
      }
    ];
  });
  const [input, setInput] = useState(() => {
    return localStorage.getItem('yawmiyati_chat_input') || '';
  });
  const [hasConsent, setHasConsent] = useState(() => {
    const saved = localStorage.getItem('yawmiyati_chat_has_consent');
    return saved !== null ? saved === 'true' : true;
  });
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Chat Attachments states
  const [chatAttachments, setChatAttachments] = useState<{
    links: string[];
    videos: string[];
    pdfs: { name: string; url: string }[];
  }>(() => {
    const saved = localStorage.getItem('yawmiyati_chat_attachments');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return { links: [], videos: [], pdfs: [] };
  });
  const [activeAttachmentType, setActiveAttachmentType] = useState<'none' | 'link' | 'video' | 'pdf'>(() => {
    return (localStorage.getItem('yawmiyati_chat_active_attachment_type') as any) || 'none';
  });
  const [tempLink, setTempLink] = useState(() => localStorage.getItem('yawmiyati_chat_temp_link') || '');
  const [tempVideo, setTempVideo] = useState(() => localStorage.getItem('yawmiyati_chat_temp_video') || '');
  const [tempPdfName, setTempPdfName] = useState(() => localStorage.getItem('yawmiyati_chat_temp_pdf_name') || '');
  const [tempPdfUrl, setTempPdfUrl] = useState(() => localStorage.getItem('yawmiyati_chat_temp_pdf_url') || '');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Persist states to local storage on change immediately (to handle sudden closure/power loss)
  useEffect(() => {
    localStorage.setItem('yawmiyati_chat_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('yawmiyati_chat_input', input);
  }, [input]);

  useEffect(() => {
    localStorage.setItem('yawmiyati_chat_has_consent', String(hasConsent));
  }, [hasConsent]);

  useEffect(() => {
    localStorage.setItem('yawmiyati_chat_attachments', JSON.stringify(chatAttachments));
  }, [chatAttachments]);

  useEffect(() => {
    localStorage.setItem('yawmiyati_chat_active_attachment_type', activeAttachmentType);
  }, [activeAttachmentType]);

  useEffect(() => {
    localStorage.setItem('yawmiyati_chat_temp_link', tempLink);
  }, [tempLink]);

  useEffect(() => {
    localStorage.setItem('yawmiyati_chat_temp_video', tempVideo);
  }, [tempVideo]);

  useEffect(() => {
    localStorage.setItem('yawmiyati_chat_temp_pdf_name', tempPdfName);
  }, [tempPdfName]);

  useEffect(() => {
    localStorage.setItem('yawmiyati_chat_temp_pdf_url', tempPdfUrl);
  }, [tempPdfUrl]);

  // --- 🎙️ Real-time Audio / Speech Interface states & controls ---
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'analyzing' | 'speaking'>('idle');
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const voiceRecognitionRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);

  const stopVoiceChatSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const startListeningVoiceChat = () => {
    stopVoiceChatSpeech();
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceStatus('speaking');
      setVoiceTranscript('المتصفح لا يدعم ميزة التعرف التلقائي على الصوت باللغة العربية. سأقوم بالرد كتابياً فقط.');
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = 'ar-SA';
    rec.continuous = false;
    rec.interimResults = true;

    rec.onstart = () => {
      setVoiceStatus('listening');
      setVoiceTranscript('جاري الاستماع... تفضل بالفضفضة والتحدث معي...');
    };

    rec.onresult = (event: any) => {
      const currentResult = event.results[0];
      const text = currentResult[0].transcript;
      setVoiceTranscript(text);
    };

    rec.onerror = (event: any) => {
      console.error('Voice chat speech recognition error:', event);
      if (event.error !== 'no-speech') {
        setVoiceStatus('idle');
      }
    };

    rec.onend = () => {
      // Completed recognition
    };

    // Auto-submit when user finishes talking
    rec.onspeechend = () => {
      rec.stop();
      setTimeout(() => {
        setVoiceTranscript(prev => {
          if (prev && prev !== 'جاري الاستماع... تفضل بالفضفضة والتحدث معي...' && prev.trim().length > 0) {
            handleVoiceChatSubmit(prev);
          }
          return prev;
        });
      }, 600);
    };

    voiceRecognitionRef.current = rec;
    rec.start();
  };

  const handleVoiceChatSubmit = async (queryText: string) => {
    setVoiceStatus('analyzing');
    try {
      const diariesToPass = hasConsent ? diaries : [];
      const habitsToPass = hasConsent ? habits : [];
      const gratitudeCardsToPass = hasConsent ? gratitudeCards : [];
      const booksToPass = hasConsent ? books : [];
      const response = await fetch('/api/gemini/smart-advisor', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-gemini-key': userApiKey || ''
        },
        body: JSON.stringify({
          diaries: diariesToPass,
          habits: habitsToPass,
          gratitudeCards: gratitudeCardsToPass,
          books: booksToPass,
          query: queryText
        })
      });

      const data = await response.json();
      if (data.success) {
        setVoiceStatus('speaking');
        setVoiceTranscript(data.answer);

        // Save messages in history so we do not lose them
        const userMsgId = Date.now().toString();
        const aiMsgId = (Date.now() + 1).toString();
        const newMsgs = [
          ...messages,
          { id: userMsgId, sender: 'user' as const, text: queryText, createdAt: new Date().toISOString() },
          { id: aiMsgId, sender: 'ai' as const, text: data.answer, createdAt: new Date().toISOString() }
        ];
        setMessages(newMsgs);
        localStorage.setItem('yawmiyati_chat_messages', JSON.stringify(newMsgs));

        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const cleanText = data.answer.replace(/[*#_`~•]/g, '').replace(/🔗|🎥|📄/g, '');
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.lang = 'ar-SA';
          
          const voices = window.speechSynthesis.getVoices();
          const arabicVoice = voices.find(v => v.lang.startsWith('ar'));
          if (arabicVoice) utterance.voice = arabicVoice;

          utterance.onend = () => {
            // Once speaking finishes, automatically resume listening!
            setVoiceStatus('listening');
            startListeningVoiceChat();
          };
          utterance.onerror = () => {
            setVoiceStatus('idle');
          };
          window.speechSynthesis.speak(utterance);
        } else {
          setVoiceStatus('idle');
        }
      } else {
        throw new Error(data?.error || 'يلزم إضافة مفتاح Gemini API الخاص بك أولاً في إعدادات التطبيق.');
      }
    } catch (e: any) {
      setVoiceStatus('idle');
      setVoiceTranscript(`⚠️ ${e?.message || 'يلزم إضافة مفتاح Gemini API الخاص بك أولاً في إعدادات التطبيق.'}`);
    }
  };

  const handleToggleSpeech = (msgId: string, text: string) => {
    if (currentlySpeakingId === msgId) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setCurrentlySpeakingId(null);
    } else {
      setCurrentlySpeakingId(msgId);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const cleanText = text.replace(/[*#_`~•]/g, '').replace(/🔗|🎥|📄/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'ar-SA';
        
        const voices = window.speechSynthesis.getVoices();
        const arabicVoice = voices.find(v => v.lang.startsWith('ar'));
        if (arabicVoice) utterance.voice = arabicVoice;
        
        utterance.onend = () => {
          setCurrentlySpeakingId(null);
        };
        utterance.onerror = () => {
          setCurrentlySpeakingId(null);
        };
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const quickQuestions = [
    "ما أكثر مسببات التوتر لدي؟",
    "ماذا حدث لي يوم 15 يوليو؟",
    "متى كانت آخر مرة شعرت فيها بالسعادة؟",
    "قارن بين حالتي هذا الأسبوع والشهر الماضي.",
    "اعرض الملاحظات التي تتحدث عن الدراسة."
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() && chatAttachments.links.length === 0 && chatAttachments.videos.length === 0 && chatAttachments.pdfs.length === 0) return;
    if (loading) return;

    // Format prompt text with active chat attachments to pass transparently to AI model
    let textWithAttachments = textToSend;
    const attachmentsText: string[] = [];
    if (chatAttachments.links.length > 0) {
      attachmentsText.push(`\n🔗 الروابط المرفقة بالشات: ${chatAttachments.links.join(' ، ')}`);
    }
    if (chatAttachments.videos.length > 0) {
      attachmentsText.push(`\n🎥 الفيديوهات المرفقة بالشات: ${chatAttachments.videos.join(' ، ')}`);
    }
    if (chatAttachments.pdfs.length > 0) {
      attachmentsText.push(`\n📄 ملفات PDF المرفقة بالشات: ${chatAttachments.pdfs.map(p => `${p.name} (${p.url})`).join(' ، ')}`);
    }
    if (attachmentsText.length > 0) {
      textWithAttachments += '\n' + attachmentsText.join('\n');
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textWithAttachments,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setChatAttachments({ links: [], videos: [], pdfs: [] });
    setActiveAttachmentType('none');
    setLoading(true);

    try {
      // If user revoked consent, do not pass diaries context!
      const diariesToPass = hasConsent ? diaries : [];
      const habitsToPass = hasConsent ? habits : [];
      const gratitudeCardsToPass = hasConsent ? gratitudeCards : [];
      const booksToPass = hasConsent ? books : [];

      const response = await fetch('/api/gemini/smart-advisor', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-gemini-key': userApiKey || ''
        },
        body: JSON.stringify({
          diaries: diariesToPass,
          habits: habitsToPass,
          gratitudeCards: gratitudeCardsToPass,
          books: booksToPass,
          query: textWithAttachments
        })
      });

      const data = await response.json().catch(() => ({ success: false }));
      if (data && data.success && data.answer) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: data.answer,
          createdAt: new Date().toISOString()
        }]);
      } else {
        throw new Error(data?.error || 'Failed response');
      }
    } catch (e: any) {
      const errorMsg = e?.message || 'يلزم إضافة مفتاح Gemini API الخاص بك أولاً في إعدادات التطبيق لتشغيل المستشار الذكي.';
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `⚠️ ${errorMsg}`,
        createdAt: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Real Web Speech API Dictation (Speech To Text) with secure simulated fallback
  const handleDictation = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.lang = 'ar-SA';
        rec.continuous = false;
        rec.interimResults = false;
        
        rec.onstart = () => {
          setIsRecording(true);
        };
        
        rec.onresult = (event: any) => {
          const resultText = event.results[0][0].transcript;
          if (resultText) {
            setInput(prev => prev ? prev + ' ' + resultText : resultText);
          }
        };
        
        rec.onerror = (err: any) => {
          console.error("Speech recognition error:", err);
          setIsRecording(false);
          // Fallback to simulated text
          const mockDictations = [
            "ما هي مسببات التوتر التي قمت بكتابتها مؤخراً في يومياتي؟",
            "هل الرياضة اليومية ساعدتني في تخفيف وطأة القلق والتوتر؟",
            "لخص مذكرات الأسبوع الماضي وقدم لي نصيحة وقائية وعيادية.",
            "ما هو تقييمي النفسي العام بناءً على تدوينات النوم والرياضة؟"
          ];
          const randomQuery = mockDictations[Math.floor(Math.random() * mockDictations.length)];
          setInput(randomQuery);
        };
        
        rec.onend = () => {
          setIsRecording(false);
        };
        
        recognitionRef.current = rec;
        rec.start();
      } else {
        // Fallback for browsers without speech support (e.g. some web views)
        setIsRecording(true);
        setTimeout(() => {
          setIsRecording(false);
          const mockDictations = [
            "ما هي مسببات التوتر التي قمت بكتابتها مؤخراً في يومياتي؟",
            "هل الرياضة اليومية ساعدتني في تخفيف وطأة القلق والتوتر؟",
            "لخص مذكرات الأسبوع الماضي وقدم لي نصيحة وقائية وعيادية.",
            "ما هو تقييمي النفسي العام بناءً على تدوينات النوم والرياضة؟"
          ];
          const randomQuery = mockDictations[Math.floor(Math.random() * mockDictations.length)];
          setInput(randomQuery);
        }, 1200);
      }
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("هل أنت متأكد من رغبتك في مسح سجل محادثة المستشار الذكي؟")) {
      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: 'تم مسح سجل المحادثة. كيف يمكنني مساعدتك اليوم في تصفح وتحليل يومياتك؟ 🧠',
          createdAt: new Date().toISOString()
        }
      ]);
    }
  };

  return (
    <div className="bg-white border border-[#E2DCC8] rounded-3xl overflow-hidden shadow-sm h-[550px] flex flex-col font-sans" dir="rtl">
      
      {/* Top Bar Info & Consent Switch */}
      <div className="p-4 bg-[#F0EDE4] border-b border-[#E2DCC8] flex flex-col md:flex-row md:items-center md:justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-2.5 space-x-reverse">
          <div className="bg-[#8B9D83]/15 p-2 rounded-xl text-[#8B9D83]">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-[#5A5A40] text-sm">المستشار الذكي لليوميات Pro</h3>
            <p className="text-[10px] text-gray-500">تحليل الأنماط السلوكية، التغير المزاجي والعلاقات الزمنية</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* 🎙️ Continuous Voice Mode Button */}
          <button
            onClick={() => {
              setShowVoiceModal(true);
              startListeningVoiceChat();
            }}
            className="flex items-center space-x-1.5 space-x-reverse px-3 py-2 bg-[#8B9D83] hover:bg-[#5A5A40] text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer shrink-0"
          >
            <span className="animate-pulse">🎙️</span>
            <span>بدء محادثة صوتية مستمرة</span>
          </button>

          {/* User Consent Toggle */}
          <div className="flex items-center justify-between md:justify-end bg-white p-2 rounded-xl border border-[#E2DCC8] shadow-xs gap-3">
            <span className="text-[11px] font-bold text-gray-500 flex items-center space-x-1 space-x-reverse">
              <ShieldCheck className="w-3.5 h-3.5 text-[#8B9D83]" />
              <span>صلاحية الوصول لليوميات:</span>
            </span>
            <button
              onClick={() => setHasConsent(!hasConsent)}
              className={`w-10 h-6 rounded-full p-0.5 transition-colors focus:outline-none cursor-pointer ${
                hasConsent ? 'bg-[#8B9D83]' : 'bg-[#E2DCC8]'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                  hasConsent ? 'translate-x-0' : '-translate-x-4'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-[#F9F7F2]/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3.5 text-sm shadow-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-[#8B9D83] text-white rounded-tr-none'
                  : 'bg-white text-[#3A3A3A] border border-[#E2DCC8] rounded-tl-none font-normal'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>
              <div className="flex items-center justify-between gap-4 mt-2 pt-1 border-t border-dashed border-gray-100">
                <span className={`block text-[9px] ${msg.sender === 'user' ? 'text-[#F9F7F2]/85' : 'text-gray-400'} text-left`}>
                  {new Date(msg.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                </span>
                
                {msg.sender === 'ai' && (
                  <button
                    onClick={() => handleToggleSpeech(msg.id, msg.text)}
                    className={`p-1 rounded-lg hover:bg-[#F0EDE4]/60 transition-colors flex items-center gap-1 text-[10px] font-bold cursor-pointer ${
                      currentlySpeakingId === msg.id ? 'text-red-600 bg-red-50' : 'text-[#8B9D83]'
                    }`}
                  >
                    {currentlySpeakingId === msg.id ? (
                      <>
                        <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping"></span>
                        <span>⏹️ إيقاف الصوت</span>
                      </>
                    ) : (
                      <>
                        <span>🔊</span>
                        <span>استماع بالصوت</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-end">
            <div className="bg-white border border-[#E2DCC8] rounded-2xl rounded-tl-none p-4 shadow-xs flex items-center space-x-2 space-x-reverse">
              <span className="text-xs text-gray-500">يقوم المستشار بتحليل سجل حياتك...</span>
              <div className="flex space-x-1 space-x-reverse">
                <span className="w-1.5 h-1.5 bg-[#8B9D83] rounded-full animate-bounce delay-100"></span>
                <span className="w-1.5 h-1.5 bg-[#8B9D83] rounded-full animate-bounce delay-200"></span>
                <span className="w-1.5 h-1.5 bg-[#8B9D83] rounded-full animate-bounce delay-300"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Active Chat Attachments Preview Area */}
      {(chatAttachments.links.length > 0 || chatAttachments.videos.length > 0 || chatAttachments.pdfs.length > 0) && (
        <div className="px-4 py-2 bg-[#F9F7F2] border-t border-[#E2DCC8] flex flex-wrap gap-2 shrink-0">
          {chatAttachments.links.map((link, idx) => (
            <div key={idx} className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-blue-200 flex items-center space-x-1.5 space-x-reverse">
              <span>🌐 رابط</span>
              <span className="truncate max-w-[120px]" dir="ltr">{link}</span>
              <button onClick={() => setChatAttachments(prev => ({ ...prev, links: prev.links.filter((_, i) => i !== idx) }))} className="text-red-500 font-bold hover:text-red-700 cursor-pointer text-xs">×</button>
            </div>
          ))}
          {chatAttachments.videos.map((vid, idx) => (
            <div key={idx} className="bg-purple-50 text-purple-700 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-purple-200 flex items-center space-x-1.5 space-x-reverse">
              <span>🎥 فيديو</span>
              <span className="truncate max-w-[120px]" dir="ltr">{vid}</span>
              <button onClick={() => setChatAttachments(prev => ({ ...prev, videos: prev.videos.filter((_, i) => i !== idx) }))} className="text-red-500 font-bold hover:text-red-700 cursor-pointer text-xs">×</button>
            </div>
          ))}
          {chatAttachments.pdfs.map((pdf, idx) => (
            <div key={idx} className="bg-red-50 text-red-700 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-200 flex items-center space-x-1.5 space-x-reverse">
              <span>📄 {pdf.name}</span>
              <button onClick={() => setChatAttachments(prev => ({ ...prev, pdfs: prev.pdfs.filter((_, i) => i !== idx) }))} className="text-red-500 font-bold hover:text-red-700 cursor-pointer text-xs">×</button>
            </div>
          ))}
        </div>
      )}

      {/* Attachment Inputs Drawer */}
      {activeAttachmentType !== 'none' && (
        <div className="p-3 bg-[#F0EDE4] border-t border-[#E2DCC8] space-y-2 shrink-0">
          {activeAttachmentType === 'link' && (
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-[#5A5A40]">أدخل الرابط الإلكتروني المرجعي:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tempLink}
                  onChange={(e) => setTempLink(e.target.value)}
                  placeholder="https://example.com"
                  className="flex-grow bg-white border border-[#E2DCC8] rounded-lg px-2.5 py-1.5 text-xs text-[#3A3A3A] focus:outline-none"
                />
                <button
                  onClick={() => {
                    if (tempLink.trim()) {
                      setChatAttachments(prev => ({ ...prev, links: [...prev.links, tempLink.trim()] }));
                      setTempLink('');
                      setActiveAttachmentType('none');
                    }
                  }}
                  className="bg-[#8B9D83] text-white font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer hover:bg-[#5A5A40]"
                >
                  إضافة الرابط
                </button>
              </div>
            </div>
          )}
          {activeAttachmentType === 'video' && (
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-[#5A5A40]">أدخل رابط الفيديو (يوتيوب أو فيديو مباشر):</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tempVideo}
                  onChange={(e) => setTempVideo(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="flex-grow bg-white border border-[#E2DCC8] rounded-lg px-2.5 py-1.5 text-xs text-[#3A3A3A] focus:outline-none"
                />
                <button
                  onClick={() => {
                    if (tempVideo.trim()) {
                      setChatAttachments(prev => ({ ...prev, videos: [...prev.videos, tempVideo.trim()] }));
                      setTempVideo('');
                      setActiveAttachmentType('none');
                    }
                  }}
                  className="bg-[#8B9D83] text-white font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer hover:bg-[#5A5A40]"
                >
                  إضافة الفيديو
                </button>
              </div>
            </div>
          )}
          {activeAttachmentType === 'pdf' && (
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-[#5A5A40]">أدخل معلومات مستند الـ PDF المرفق:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tempPdfName}
                  onChange={(e) => setTempPdfName(e.target.value)}
                  placeholder="اسم الملف (مثال: تقرير_نفسي.pdf)"
                  className="w-1/3 bg-white border border-[#E2DCC8] rounded-lg px-2.5 py-1.5 text-xs text-[#3A3A3A] focus:outline-none"
                />
                <input
                  type="text"
                  value={tempPdfUrl}
                  onChange={(e) => setTempPdfUrl(e.target.value)}
                  placeholder="رابط التحميل أو المشاهدة..."
                  className="w-2/3 bg-white border border-[#E2DCC8] rounded-lg px-2.5 py-1.5 text-xs text-[#3A3A3A] focus:outline-none"
                />
                <button
                  onClick={() => {
                    if (tempPdfName.trim()) {
                      setChatAttachments(prev => ({ ...prev, pdfs: [...prev.pdfs, { name: tempPdfName.trim(), url: tempPdfUrl.trim() || '#' }] }));
                      setTempPdfName('');
                      setTempPdfUrl('');
                      setActiveAttachmentType('none');
                    }
                  }}
                  className="bg-[#8B9D83] text-white font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer hover:bg-[#5A5A40]"
                >
                  إضافة PDF
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Suggested Prompt Capsules */}
      <div className="p-2 bg-[#F0EDE4] border-t border-[#E2DCC8] overflow-x-auto whitespace-nowrap scrollbar-none shrink-0 flex gap-2">
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="inline-block bg-white hover:bg-[#F9F7F2] active:bg-[#E2DCC8] text-[#3A3A3A] hover:text-[#5A5A40] text-xs py-1.5 px-3 rounded-full border border-[#E2DCC8] shadow-xs transition-colors cursor-pointer shrink-0"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Bottom Input Area */}
      <div className="p-3 bg-white border-t border-[#E2DCC8] flex flex-col gap-2 shrink-0">
        {/* Fast toggle buttons for attachment types */}
        <div className="flex items-center space-x-2 space-x-reverse text-xs">
          <span className="text-[10px] text-gray-400">إرفاق بالشات:</span>
          <button
            onClick={() => setActiveAttachmentType(activeAttachmentType === 'link' ? 'none' : 'link')}
            className={`px-2.5 py-1 rounded-lg border text-[10px] font-semibold transition-all cursor-pointer ${
              activeAttachmentType === 'link' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50/50'
            }`}
          >
            🌐 رابط ويب
          </button>
          <button
            onClick={() => setActiveAttachmentType(activeAttachmentType === 'video' ? 'none' : 'video')}
            className={`px-2.5 py-1 rounded-lg border text-[10px] font-semibold transition-all cursor-pointer ${
              activeAttachmentType === 'video' ? 'bg-purple-500 text-white border-purple-500' : 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50/50'
            }`}
          >
            🎥 فيديو مرجعي
          </button>
          <button
            onClick={() => setActiveAttachmentType(activeAttachmentType === 'pdf' ? 'none' : 'pdf')}
            className={`px-2.5 py-1 rounded-lg border text-[10px] font-semibold transition-all cursor-pointer ${
              activeAttachmentType === 'pdf' ? 'bg-red-500 text-white border-red-500' : 'bg-white text-red-600 border-red-200 hover:bg-red-50/50'
            }`}
          >
            📄 ملف PDF
          </button>
        </div>

        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            onClick={handleClearHistory}
            className="p-2.5 text-gray-400 hover:text-[#D4A373] hover:bg-[#FAEDCD] rounded-xl transition-colors cursor-pointer shrink-0"
            title="مسح سجل المحادثة"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleDictation}
            className={`p-2.5 rounded-xl transition-all duration-200 cursor-pointer shrink-0 ${
              isRecording
                ? 'bg-[#D4A373] text-white animate-pulse ring-4 ring-[#D4A373]/20'
                : 'bg-[#F0EDE4] text-[#3A3A3A] hover:bg-[#E2DCC8]'
            }`}
            title={isRecording ? 'اضغط لإنهاء الإملاء' : 'إملاء صوتي ذكي للرسالة'}
          >
            <Mic className="w-4.5 h-4.5" />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            placeholder={isRecording ? 'جاري الاستماع لصوتك...' : 'اسأل المستشار عن يومياتك وحالتك النفسية...'}
            disabled={isRecording}
            className="flex-grow bg-[#F9F7F2] hover:bg-[#F0EDE4] focus:bg-white border border-[#E2DCC8]/60 focus:ring-2 focus:ring-[#8B9D83] focus:border-[#8B9D83] rounded-xl px-3.5 py-2.5 text-xs text-[#3A3A3A] placeholder-gray-400 focus:outline-none transition-colors"
          />

          <button
            onClick={() => handleSend(input)}
            className="p-2.5 bg-[#8B9D83] hover:bg-[#5A5A40] active:scale-95 text-white rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4 rotate-180" />
          </button>
        </div>
      </div>

      {/* 🎙️ Interactive Hands-free Voice Chat Overlay Modal */}
      {showVoiceModal && (
        <div className="fixed inset-0 bg-[#5A5A40]/45 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2DCC8] rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-6 text-center relative animate-fade-in font-sans" dir="rtl">
            
            {/* Close Button */}
            <button
              onClick={() => {
                stopVoiceChatSpeech();
                if (voiceRecognitionRef.current) voiceRecognitionRef.current.stop();
                setShowVoiceModal(false);
                setVoiceStatus('idle');
              }}
              className="absolute top-4 left-4 p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-xl transition-all cursor-pointer text-sm font-bold"
            >
              إغلاق ×
            </button>

            {/* Header Status */}
            <div className="space-y-1.5 pt-4">
              <span className="text-xs bg-[#8B9D83]/15 text-[#8B9D83] px-3 py-1 rounded-full font-bold">
                مكالمة صوتية مستمرة وعيادية
              </span>
              <h3 className="font-extrabold text-[#3A3A3A] text-lg">
                {voiceStatus === 'listening' && '🎤 جاري الاستماع بإنصات...'}
                {voiceStatus === 'analyzing' && '🧠 جاري التفكير وصياغة الدعم...'}
                {voiceStatus === 'speaking' && '🔊 يتحدث الآن...'}
                {voiceStatus === 'idle' && '💤 مستعد للبدء'}
              </h3>
            </div>

            {/* Animated Soundwave Ripple Area */}
            <div className="flex items-center justify-center bg-[#F9F7F2] rounded-2xl h-44 border border-[#E2DCC8]/65 relative overflow-hidden">
              <div className="absolute inset-0 bg-radial-gradient from-[#8B9D83]/5 to-transparent animate-pulse pointer-events-none"></div>
              
              {/* Animated Audio Wave bars */}
              <div className="flex items-end justify-center space-x-2 space-x-reverse h-24">
                <div className={`w-2 bg-[#8B9D83] rounded-full transition-all duration-300 ${
                  voiceStatus === 'listening' ? 'h-16 animate-bounce' : 
                  voiceStatus === 'speaking' ? 'h-20 animate-pulse' : 'h-4'
                }`}></div>
                <div className={`w-2 bg-[#8B9D83] rounded-full transition-all duration-300 ${
                  voiceStatus === 'listening' ? 'h-24 animate-bounce delay-75' : 
                  voiceStatus === 'speaking' ? 'h-14 animate-pulse delay-75' : 'h-4'
                }`}></div>
                <div className={`w-2 bg-[#D4A373] rounded-full transition-all duration-300 ${
                  voiceStatus === 'listening' ? 'h-28 animate-bounce delay-150' : 
                  voiceStatus === 'speaking' ? 'h-24 animate-pulse delay-150' : 'h-4'
                }`}></div>
                <div className={`w-2 bg-[#8B9D83] rounded-full transition-all duration-300 ${
                  voiceStatus === 'listening' ? 'h-18 animate-bounce delay-100' : 
                  voiceStatus === 'speaking' ? 'h-12 animate-pulse delay-100' : 'h-4'
                }`}></div>
                <div className={`w-2 bg-[#8B9D83] rounded-full transition-all duration-300 ${
                  voiceStatus === 'listening' ? 'h-10 animate-bounce delay-200' : 
                  voiceStatus === 'speaking' ? 'h-8 animate-pulse delay-200' : 'h-4'
                }`}></div>
              </div>
            </div>

            {/* Live Transcript / Response display area */}
            <div className="bg-[#F0EDE4]/45 p-4 rounded-2xl border border-[#E2DCC8]/50 max-h-40 overflow-y-auto">
              <p className="text-xs text-gray-500 font-medium mb-1">النسخ التلقائي المحادثة:</p>
              <p className="text-sm text-[#3A3A3A] font-medium leading-relaxed">
                {voiceTranscript || 'تكلم بطلاقة، وسيقوم المساعد بقراءة تدويناتك وتحليلها والرد عليك فوراً بالصوت...'}
              </p>
            </div>

            {/* Action controls */}
            <div className="flex justify-center gap-3">
              {voiceStatus === 'speaking' && (
                <button
                  onClick={() => {
                    stopVoiceChatSpeech();
                    setVoiceStatus('listening');
                    startListeningVoiceChat();
                  }}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  ⏹️ مقاطعة والحديث الآن
                </button>
              )}

              {voiceStatus === 'idle' && (
                <button
                  onClick={startListeningVoiceChat}
                  className="px-6 py-2.5 bg-[#8B9D83] hover:bg-[#5A5A40] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  🎙️ بدء الاستماع والتحدث
                </button>
              )}

              <button
                onClick={() => {
                  stopVoiceChatSpeech();
                  if (voiceRecognitionRef.current) voiceRecognitionRef.current.stop();
                  setShowVoiceModal(false);
                  setVoiceStatus('idle');
                }}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold cursor-pointer"
              >
                إنهاء المكالمة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
