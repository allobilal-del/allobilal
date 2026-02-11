// نظام اللغات - يعمل تلقائياً بعد التسجيل
const LANGUAGES = {
    ar: { /* النصوص العربية */ },
    fr: { /* النصوص الفرنسية */ },
    en: { /* النصوص الإنجليزية */ },
    es: { /* النصوص الإسبانية */ }
};

function initLanguage() {
    const savedLang = localStorage.getItem('appLanguage') || 'ar';
    document.documentElement.lang = savedLang;
    document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
    document.body.style.direction = savedLang === 'ar' ? 'rtl' : 'ltr';
}