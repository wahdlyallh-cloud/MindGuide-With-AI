import { AppLanguage } from '../types';

export type AppFontFamily = 'cairo' | 'tajawal' | 'almarai' | 'amiri' | 'noto_naskh' | 'jakarta' | 'system';
export type AppLineHeight = 'compact' | 'normal' | 'relaxed' | 'spacious';

export interface FontOption {
  id: AppFontFamily;
  nameAr: string;
  nameEn: string;
  categoryAr: string;
  categoryEn: string;
  fontFamilyCss: string;
  sampleTextAr: string;
  sampleTextEn: string;
  badge?: string;
}

export interface LineHeightOption {
  id: AppLineHeight;
  val: number;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
}

export const APP_FONTS: FontOption[] = [
  {
    id: 'cairo',
    nameAr: 'خط كايرو العصري (Cairo)',
    nameEn: 'Cairo Modern',
    categoryAr: 'حديث ومتوازن (Default)',
    categoryEn: 'Modern & Balanced',
    fontFamilyCss: '"Cairo", sans-serif',
    sampleTextAr: 'كتابة اليوميات تمنح العقل والروح صفاءً وراحة استثنائية',
    sampleTextEn: 'Journaling brings clarity and peace to your mind.',
    badge: 'المُفضّل ✨',
  },
  {
    id: 'tajawal',
    nameAr: 'خط تجوّل الهادئ (Tajawal)',
    nameEn: 'Tajawal Soft',
    categoryAr: 'عصري وهندسي ناعم',
    categoryEn: 'Modern & Soft Geometric',
    fontFamilyCss: '"Tajawal", sans-serif',
    sampleTextAr: 'تأمل أفكارك اليومية ودوّن مشاعرك بأسلوب مريح',
    sampleTextEn: 'Reflect on your daily thoughts and feelings comfortably.',
  },
  {
    id: 'almarai',
    nameAr: 'خط المراعي النقي (Almarai)',
    nameEn: 'Almarai Clean',
    categoryAr: 'سلس وواضح جداً',
    categoryEn: 'Ultra Clean Sans',
    fontFamilyCss: '"Almarai", sans-serif',
    sampleTextAr: 'وضوح الأفكار يبدأ بسلام الداخلي والتدوين الملتزم',
    sampleTextEn: 'Clear thoughts begin with mindful writing.',
  },
  {
    id: 'amiri',
    nameAr: 'خط الأُميري النسخي الكلاسيكي (Amiri)',
    nameEn: 'Amiri Classic Naskh',
    categoryAr: 'كلاسيكي تقليدي أصيل (أدبي)',
    categoryEn: 'Classic Literary Naskh',
    fontFamilyCss: '"Amiri", serif',
    sampleTextAr: '«إنّ في حكايات اليوميات حكمة وفكرة تضيء درب الغد»',
    sampleTextEn: 'Every story written holds wisdom for tomorrow.',
    badge: 'كلاسيكي 📚',
  },
  {
    id: 'noto_naskh',
    nameAr: 'خط النسخ العريق (Noto Naskh)',
    nameEn: 'Noto Naskh Traditional',
    categoryAr: 'نسخ واضح للقراءة الطويلة',
    categoryEn: 'Traditional Clear Naskh',
    fontFamilyCss: '"Noto Naskh Arabic", serif',
    sampleTextAr: 'مفكرة راقية تحفظ ذكرياتك ومشاعرك بأصالة الخط العربي',
    sampleTextEn: 'An elegant diary preserving your memories.',
  },
  {
    id: 'jakarta',
    nameAr: 'خط جاكارتا العالمي (Plus Jakarta Sans)',
    nameEn: 'Plus Jakarta Sans',
    categoryAr: 'مودرن للغات اللاتينية والعربية',
    categoryEn: 'Modern International Sans',
    fontFamilyCss: '"Plus Jakarta Sans", "Cairo", sans-serif',
    sampleTextAr: 'Modern typography for daily habit tracking & mindfulness.',
    sampleTextEn: 'Modern typography for daily habit tracking & mindfulness.',
    badge: 'Modern 🌐',
  },
  {
    id: 'system',
    nameAr: 'خط الجهاز الافتراضي (System Default)',
    nameEn: 'System Default Font',
    categoryAr: 'سريع ومتوافق مع النظام',
    categoryEn: 'Native System Typography',
    fontFamilyCss: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    sampleTextAr: 'خط النظام الأصلي المعتمد في هاتفك أو جهازك',
    sampleTextEn: 'Your device native typography font.',
  },
];

export const LINE_HEIGHT_OPTIONS: LineHeightOption[] = [
  {
    id: 'compact',
    val: 1.45,
    nameAr: 'مضغوط (1.45x)',
    nameEn: 'Compact (1.45x)',
    descAr: 'مناسب لشبكات البيانات والبطاقات السريعة',
    descEn: 'Compact view for dense lists and quick stats',
  },
  {
    id: 'normal',
    val: 1.65,
    nameAr: 'متوازن (1.65x)',
    nameEn: 'Standard (1.65x)',
    descAr: 'المستوى القياسي لتصفح القوائم والإعدادات',
    descEn: 'Standard spacing for general navigation',
  },
  {
    id: 'relaxed',
    val: 1.85,
    nameAr: 'مريح للعين (1.85x) - مُوصى به',
    nameEn: 'Relaxed (1.85x) - Recommended',
    descAr: 'مثالي لقراءة اليوميات والمذكرات الطويلة دون إجهاد',
    descEn: 'Optimal comfort for reading long diary entries',
  },
  {
    id: 'spacious',
    val: 2.15,
    nameAr: 'واسع وممتد (2.15x)',
    nameEn: 'Spacious (2.15x)',
    descAr: 'أقصى مساحة وراحة للعين لجلسات القراءة المطوّلة',
    descEn: 'Maximum line spacing for immersive reading sessions',
  },
];

export function getFontCss(font?: AppFontFamily): string {
  const match = APP_FONTS.find(f => f.id === font);
  return match ? match.fontFamilyCss : '"Cairo", sans-serif';
}

export function getLineHeightCss(lineHeight?: AppLineHeight): number {
  const match = LINE_HEIGHT_OPTIONS.find(l => l.id === lineHeight);
  return match ? match.val : 1.85;
}
