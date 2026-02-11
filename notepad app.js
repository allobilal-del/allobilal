 // ========================================
// نظام الصفحة الرئيسية مع تحسينات متقدمة
// ========================================

class HomePageManager {
    constructor() {
        this.buttonsInitialized = false;
        this.userType = null;
        this.init();
    }
    
    init() {
        try {
            // انتظار تحميل الصفحة
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setupPage());
            } else {
                this.setupPage();
            }
            
            // إضافة الأنماط
            this.addStyles();
            
        } catch (error) {
            console.error('❌ Home page initialization error:', error);
        }
    }
    
    setupPage() {
        try {
            // إعداد أزرار الاختيار
            this.setupChoiceButtons();
            
            // إعداد اللغة
            this.setupLanguage();
            
            // إعداد زر الطوارئ
            this.setupEmergencyButton();
            
            // إعداد التحقق من تسجيل الدخول
            this.checkAuthStatus();
            
            // إعداد تأثيرات الصفحة
            this.setupPageEffects();
            
            console.log('✅ Home page setup complete');
            
        } catch (error) {
            console.error('❌ Page setup error:', error);
        }
    }
    
    setupChoiceButtons() {
        const driverBtn = document.getElementById('driverBtn');
        const clientBtn = document.getElementById('clientBtn');
        
        if (!driverBtn || !clientBtn) {
            console.warn('⚠️ Choice buttons not found');
            return;
        }
        
        // إضافة تأثيرات للزرين
        this.enhanceButtons(driverBtn, clientBtn);
        
        // إضافة أحداث النقر
        driverBtn.addEventListener('click', (e) => this.handleDriverClick(e));
        clientBtn.addEventListener('click', (e) => this.handleClientClick(e));
        
        // إضافة أحداث اللمس
        driverBtn.addEventListener('touchstart', (e) => this.handleTouchStart(e.target));
        driverBtn.addEventListener('touchend', (e) => this.handleTouchEnd(e.target));
        
        clientBtn.addEventListener('touchstart', (e) => this.handleTouchStart(e.target));
        clientBtn.addEventListener('touchend', (e) => this.handleTouchEnd(e.target));
        
        // إضافة تأثيرات التمرير عند النقر
        driverBtn.addEventListener('mousedown', () => driverBtn.style.transform = 'scale(0.95)');
        driverBtn.addEventListener('mouseup', () => driverBtn.style.transform = 'scale(1)');
        driverBtn.addEventListener('mouseleave', () => driverBtn.style.transform = 'scale(1)');
        
        clientBtn.addEventListener('mousedown', () => clientBtn.style.transform = 'scale(0.95)');
        clientBtn.addEventListener('mouseup', () => clientBtn.style.transform = 'scale(1)');
        clientBtn.addEventListener('mouseleave', () => clientBtn.style.transform = 'scale(1)');
        
        this.buttonsInitialized = true;
        console.log('✅ Choice buttons enhanced');
    }
    
    enhanceButtons(driverBtn, clientBtn) {
        // إضافة أيقونات إذا لم تكن موجودة
        if (!driverBtn.querySelector('i')) {
            driverBtn.innerHTML = `
                <i class="fas fa-motorcycle"></i>
                <span class="btn-text">سائق</span>
                <span class="btn-subtext">انضم كسائق</span>
            `;
        }
        
        if (!clientBtn.querySelector('i')) {
            clientBtn.innerHTML = `
                <i class="fas fa-user"></i>
                <span class="btn-text">زبون</span>
                <span class="btn-subtext">سجل كزبون</span>
            `;
        }
        
        // إضافة فئات الأنماط
        driverBtn.className = 'choice-btn driver-btn animate-slide-up delay-100';
        clientBtn.className = 'choice-btn client-btn animate-slide-up delay-200';
    }
    
    async handleDriverClick(e) {
        e.preventDefault();
        
        try {
            const button = e.currentTarget;
            
            // تأثير النقر
            this.animateButtonClick(button);
            
            // التحقق من تسجيل الدخول
            const isAuthenticated = await this.checkAuthentication();
            
            if (isAuthenticated) {
                // تحقق إذا كان المستخدم سائقاً بالفعل
                const userData = await this.getUserData();
                
                if (userData && userData.role === 'driver') {
                    // توجيه إلى لوحة السائق
                    this.showNotification('مرحباً بعودتك أيها السائق! 🚗', 'success');
                    setTimeout(() => {
                        window.location.href = 'driver-dashboard.html';
                    }, 800);
                } else {
                    // توجيه إلى تسجيل السائق
                    this.showNotification('مرحباً بك في تسجيل السائقين 🏍️', 'info');
                    setTimeout(() => {
                        window.location.href = 'driver-register.html';
                    }, 800);
                }
            } else {
                // توجيه إلى تسجيل الدخول مع تذكر الخيار
                this.showNotification('سجل الدخول أو أنشئ حساب سائق جديد', 'info');
                sessionStorage.setItem('userChoice', 'driver');
                setTimeout(() => {
                    window.location.href = 'login.html?role=driver';
                }, 800);
            }
            
        } catch (error) {
            console.error('❌ Driver button error:', error);
            this.showNotification('حدث خطأ، يرجى المحاولة مرة أخرى', 'error');
        }
    }
    
    async handleClientClick(e) {
        e.preventDefault();
        
        try {
            const button = e.currentTarget;
            
            // تأثير النقر
            this.animateButtonClick(button);
            
            // التحقق من تسجيل الدخول
            const isAuthenticated = await this.checkAuthentication();
            
            if (isAuthenticated) {
                // تحقق إذا كان المستخدم زبوناً بالفعل
                const userData = await this.getUserData();
                
                if (userData && userData.role === 'customer') {
                    // توجيه إلى لوحة الزبون
                    this.showNotification('مرحباً بعودتك أيها الزبون! 👤', 'success');
                    setTimeout(() => {
                        window.location.href = 'customer-dashboard.html';
                    }, 800);
                } else {
                    // توجيه إلى تسجيل الزبون
                    this.showNotification('مرحباً بك في تسجيل الزبائن 👤', 'info');
                    setTimeout(() => {
                        window.location.href = 'customer-register.html';
                    }, 800);
                }
            } else {
                // توجيه إلى تسجيل الدخول مع تذكر الخيار
                this.showNotification('سجل الدخول أو أنشئ حساب زبون جديد', 'info');
                sessionStorage.setItem('userChoice', 'customer');
                setTimeout(() => {
                    window.location.href = 'login.html?role=customer';
                }, 800);
            }
            
        } catch (error) {
            console.error('❌ Client button error:', error);
            this.showNotification('حدث خطأ، يرجى المحاولة مرة أخرى', 'error');
        }
    }
    
    animateButtonClick(button) {
        // تأثير اهتزاز
        button.style.animation = 'none';
        setTimeout(() => {
            button.style.animation = 'pulse 0.5s ease';
        }, 10);
        
        // تأثير موجات
        this.createRippleEffect(button);
    }
    
    createRippleEffect(button) {
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.className = 'ripple';
        
        button.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
    
    handleTouchStart(button) {
        button.style.transform = 'scale(0.95)';
        button.style.transition = 'transform 0.1s';
    }
    
    handleTouchEnd(button) {
        button.style.transform = 'scale(1)';
        button.style.transition = 'transform 0.2s';
    }
    
    async checkAuthentication() {
        try {
            // استخدام Firebase Manager إذا كان متاحاً
            if (window.FirebaseManager && window.FirebaseManager.auth) {
                const user = window.FirebaseManager.auth.currentUser;
                return !!user;
            }
            
            // طريقة احتياطية
            const user = firebase.auth().currentUser;
            return !!user;
            
        } catch (error) {
            console.error('Auth check error:', error);
            return false;
        }
    }
    
    async getUserData() {
        try {
            if (!window.FirebaseManager) return null;
            
            const userData = await window.FirebaseManager.getCurrentUserData();
            return userData;
            
        } catch (error) {
            console.error('Get user data error:', error);
            return null;
        }
    }
    
    setupLanguage() {
        try {
            // تحميل اللغة المحفوظة
            const savedLang = localStorage.getItem('appLanguage') || 'ar';
            
            // تحديث اتجاه الصفحة
            document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
            document.documentElement.lang = savedLang;
            
            // تحديث النصوص حسب اللغة
            this.updateTexts(savedLang);
            
            // إعداد زر تغيير اللغة
            this.setupLanguageSwitcher();
            
        } catch (error) {
            console.error('Language setup error:', error);
        }
    }
    
    updateTexts(lang) {
        const translations = {
            ar: {
                pageTitle: 'ALLO BILAL',
                welcomeText: 'مرحباً بك في تطبيق التوصيل',
                chooseRole: 'اختر نوع الحساب',
                driverBtn: 'سائق',
                driverSub: 'انضم كسائق',
                clientBtn: 'زبون',
                clientSub: 'سجل كزبون',
                emergencyBtn: 'طوارئ 119'
            },
            fr: {
                pageTitle: 'ALLO BILAL',
                welcomeText: 'Bienvenue dans l\'application de livraison',
                chooseRole: 'Choisissez votre type de compte',
                driverBtn: 'Chauffeur',
                driverSub: 'Rejoignez en tant que chauffeur',
                clientBtn: 'Client',
                clientSub: 'Inscrivez-vous en tant que client',
                emergencyBtn: 'Urgence 119'
            },
            en: {
                pageTitle: 'ALLO BILAL',
                welcomeText: 'Welcome to the delivery app',
                chooseRole: 'Choose your account type',
                driverBtn: 'Driver',
                driverSub: 'Join as driver',
                clientBtn: 'Customer',
                clientSub: 'Sign up as customer',
                emergencyBtn: 'Emergency 119'
            }
        };
        
        const texts = translations[lang] || translations.ar;
        
        // تحديث النصوص
        const elements = {
            'pageTitle': texts.pageTitle,
            'welcomeText': texts.welcomeText,
            'chooseRole': texts.chooseRole,
            'driverBtn .btn-text': texts.driverBtn,
            'driverBtn .btn-subtext': texts.driverSub,
            'clientBtn .btn-text': texts.clientBtn,
            'clientBtn .btn-subtext': texts.clientSub
        };
        
        Object.entries(elements).forEach(([selector, text]) => {
            const element = document.querySelector(`[data-translate="${selector}"]`) || 
                           document.querySelector(selector);
            if (element) {
                element.textContent = text;
            }
        });
    }
    
    setupLanguageSwitcher() {
        const switcher = document.getElementById('languageSwitcher');
        if (!switcher) return;
        
        // إعداد الأزرار
        const buttons = switcher.querySelectorAll('.lang-btn');
        const currentLang = localStorage.getItem('appLanguage') || 'ar';
        
        buttons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === currentLang);
            
            btn.addEventListener('click', () => {
                const lang = btn.dataset.lang;
                this.changeLanguage(lang);
            });
        });
    }
    
    changeLanguage(lang) {
        localStorage.setItem('appLanguage', lang);
        this.updateTexts(lang);
        
        // إعادة تفعيل الأزرار النشطة
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
        
        this.showNotification(`تم التغيير إلى ${lang === 'ar' ? 'العربية' : lang === 'fr' ? 'الفرنسية' : 'الإنجليزية'}`, 'success');
    }
    
    setupEmergencyButton() {
        const emergencyBtn = document.getElementById('emergencyBtn');
        if (!emergencyBtn) return;
        
        emergencyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleEmergency();
        });
        
        // تأثير النبض للطوارئ
        emergencyBtn.style.animation = 'emergencyPulse 2s infinite';
    }
    
    handleEmergency() {
        this.showNotification('جاري الاتصال بخدمة الطوارئ...', 'warning');
        
        // محاكاة الاتصال بالطوارئ
        setTimeout(() => {
            const confirmed = confirm('هل تريد الاتصال بخدمة الطوارئ (119)؟');
            if (confirmed) {
                window.location.href = 'tel:119';
            }
        }, 500);
    }
    
    checkAuthStatus() {
        // إذا كان المستخدم مسجلاً دخوله، نعرض خيارات مختلفة
        this.checkAuthentication().then(isAuthenticated => {
            if (isAuthenticated) {
                this.getUserData().then(userData => {
                    if (userData) {
                        this.userType = userData.role;
                        this.updateUIForLoggedInUser(userData);
                    }
                });
            }
        });
    }
    
    updateUIForLoggedInUser(userData) {
        // تحديث واجهة المستخدم للمستخدم المسجل
        const welcomeText = document.getElementById('welcomeText');
        if (welcomeText) {
            welcomeText.textContent = `مرحباً ${userData.name || 'عزيزي'}!`;
        }
        
        // تحديث أزرار الاختيار
        const driverBtn = document.getElementById('driverBtn');
        const clientBtn = document.getElementById('clientBtn');
        
        if (userData.role === 'driver') {
            if (driverBtn) {
                driverBtn.querySelector('.btn-text').textContent = 'لوحة السائق';
                driverBtn.querySelector('.btn-subtext').textContent = 'اذهب إلى لوحة التحكم';
            }
            if (clientBtn) {
                clientBtn.style.opacity = '0.6';
            }
        } else if (userData.role === 'customer') {
            if (clientBtn) {
                clientBtn.querySelector('.btn-text').textContent = 'لوحة الزبون';
                clientBtn.querySelector('.btn-subtext').textContent = 'اذهب إلى لوحة التحكم';
            }
            if (driverBtn) {
                driverBtn.style.opacity = '0.6';
            }
        }
    }
    
    setupPageEffects() {
        // إضافة تأثيرات للصفحة
        this.addBackgroundEffects();
        this.addScrollEffects();
    }
    
    addBackgroundEffects() {
        // تأثيرات خلفية ديناميكية
        const bgEffects = document.createElement('div');
        bgEffects.className = 'background-effects';
        bgEffects.innerHTML = `
            <div class="gradient-circle circle-1"></div>
            <div class="gradient-circle circle-2"></div>
            <div class="gradient-circle circle-3"></div>
        `;
        document.body.appendChild(bgEffects);
    }
    
    addScrollEffects() {
        // تأثيرات التمرير
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const parallaxElements = document.querySelectorAll('.parallax');
            
            parallaxElements.forEach(el => {
                const speed = el.dataset.speed || 0.5;
                el.style.transform = `translateY(${scrolled * speed}px)`;
            });
        });
    }
    
    addStyles() {
        const styles = `
        <style>
        .choice-btn {
            width: 280px;
            height: 120px;
            margin: 20px auto;
            border-radius: 20px;
            border: none;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: 'Cairo', sans-serif;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }
        
        .choice-btn:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
        }
        
        .choice-btn:active {
            transform: translateY(0);
        }
        
        .driver-btn {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        }
        
        .client-btn {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }
        
        .choice-btn i {
            font-size: 32px;
            margin-bottom: 10px;
            opacity: 0.9;
        }
        
        .btn-text {
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 4px;
        }
        
        .btn-subtext {
            font-size: 14px;
            opacity: 0.8;
        }
        
        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0);
            animation: ripple 0.6s linear;
        }
        
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        @keyframes emergencyPulse {
            0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
            70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
            100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        
        .animate-slide-up {
            animation: slideUp 0.6s ease-out forwards;
            opacity: 0;
        }
        
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .background-effects {
            position: fixed;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
            overflow: hidden;
        }
        
        .gradient-circle {
            position: absolute;
            border-radius: 50%;
            filter: blur(80px);
            opacity: 0.15;
            animation: float 20s infinite alternate ease-in-out;
        }
        
        .circle-1 {
            top: -100px;
            right: -100px;
            width: 300px;
            height: 300px;
            background: radial-gradient(circle, #2563eb 0%, transparent 70%);
            animation-delay: 0s;
        }
        
        .circle-2 {
            bottom: -150px;
            left: -150px;
            width: 400px;
            height: 400px;
            background: radial-gradient(circle, #f59e0b 0%, transparent 70%);
            animation-delay: 5s;
        }
        
        .circle-3 {
            top: 50%;
            left: 50%;
            width: 200px;
            height: 200px;
            background: radial-gradient(circle, #16a34a 0%, transparent 70%);
            animation-delay: 10s;
        }
        
        @keyframes float {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(-30px, 30px) scale(1.1); }
            66% { transform: translate(30px, -30px) scale(0.9); }
        }
        
        @media (max-width: 768px) {
            .choice-btn {
                width: 90%;
                height: 100px;
                margin: 15px auto;
            }
            
            .btn-text {
                font-size: 20px;
            }
            
            .btn-subtext {
                font-size: 13px;
            }
        }
        
        @media (max-width: 480px) {
            .choice-btn {
                height: 90px;
            }
            
            .choice-btn i {
                font-size: 28px;
                margin-bottom: 8px;
            }
        }
        </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }
    
    showNotification(message, type = 'info') {
        // استخدام Firebase Manager إذا كان متاحاً
        if (window.FirebaseManager) {
            window.FirebaseManager.showNotification(message, type);
            return;
        }
        
        // تنفيذ بسيط للإشعارات
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                              type === 'error' ? 'exclamation-circle' : 
                              type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // إظهار الإشعار
        setTimeout(() => notification.classList.add('show'), 10);
        
        // إخفاء الإشعار تلقائياً
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// تهيئة الصفحة الرئيسية
window.HomePageManager = new HomePageManager();
console.log('✅ Home Page Manager loaded successfully');