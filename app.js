// ========================================
// الوظائف المشتركة لتطبيق ALLO BILAL - النسخة المحسنة
// ========================================

const AppUtilities = {
    // تهيئة التطبيق
    initialize: function() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupLanguage();
            this.setupAuthCheck();
            this.setupEventListeners();
            this.setupNetworkListener();
            console.log('✓ App utilities initialized');
        });
    },

    // إعداد اللغة
    setupLanguage: function() {
        const savedLang = localStorage.getItem('appLanguage') || 'ar';
        this.setLanguage(savedLang);
    },

    // تعيين اللغة
    setLanguage: function(lang) {
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.body.style.direction = lang === 'ar' ? 'rtl' : 'ltr';
        
        // تحديث نص الصفحة بناءً على اللغة
        this.updateTextByLanguage(lang);
        
        // تحديث أزرار اللغة
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
            btn.setAttribute('aria-pressed', btn.dataset.lang === lang);
        });
        
        // حفظ اللغة
        localStorage.setItem('appLanguage', lang);
        sessionStorage.setItem('registrationLanguage', lang);
    },

    // تحديث النصوص حسب اللغة
    updateTextByLanguage: function(lang) {
        // يمكن توسيع هذا لتشمل جميع النصوص في المستقبل
        const translations = {
            ar: {
                loading: 'جاري التحميل...',
                error: 'حدث خطأ',
                success: 'تمت العملية بنجاح',
                confirm: 'تأكيد',
                cancel: 'إلغاء'
            },
            fr: {
                loading: 'Chargement...',
                error: 'Erreur',
                success: 'Succès',
                confirm: 'Confirmer',
                cancel: 'Annuler'
            },
            en: {
                loading: 'Loading...',
                error: 'Error',
                success: 'Success',
                confirm: 'Confirm',
                cancel: 'Cancel'
            },
            es: {
                loading: 'Cargando...',
                error: 'Error',
                success: 'Éxito',
                confirm: 'Confirmar',
                cancel: 'Cancelar'
            }
        };
        
        // تحديث النصوص ذات البيانات المحددة
        document.querySelectorAll('[data-translate]').forEach(el => {
            const key = el.dataset.translate;
            if (translations[lang] && translations[lang][key]) {
                el.textContent = translations[lang][key];
            }
        });
    },

    // إعداد التحقق من المصادقة
    setupAuthCheck: function() {
        const protectedPages = ['dashboard', 'tracking', 'chat', 'profile', 'orders'];
        const currentPage = window.location.pathname.split('/').pop().split('.')[0];
        
        if (protectedPages.some(page => currentPage.includes(page))) {
            this.checkAuthentication();
        }
    },

    // التحقق من تسجيل الدخول
    checkAuthentication: function() {
        if (!window.firebaseApp) {
            this.redirectToLogin();
            return;
        }
        
        window.firebaseApp.checkAuth((user) => {
            if (!user) {
                this.showNotification('يرجى تسجيل الدخول أولاً', 'error');
                setTimeout(() => this.redirectToLogin(), 2000);
                return;
            }
            
            this.loadUserInfo(user.uid);
        });
    },

    // تحميل معلومات المستخدم
    loadUserInfo: function(userId) {
        if (!window.firebaseApp) return;
        
        return window.firebaseApp.loadUserInfo(userId).then(userData => {
            if (!userData) {
                this.showNotification('لم يتم العثور على معلومات المستخدم', 'error');
                window.firebaseApp.logout('login.html');
                return null;
            }
            
            this.updateUserInterface(userData);
            return userData;
        }).catch(error => {
            console.error('Error loading user info:', error);
            this.showNotification('خطأ في تحميل معلومات المستخدم', 'error');
            return null;
        });
    },

    // تحديث واجهة المستخدم
    updateUserInterface: function(userData) {
        // تحديث الاسم
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            const name = userData.name || userData.fullName || 
                        (userData.role === 'driver' ? 'السائق' : 'الزبون');
            userNameElement.textContent = name;
            userNameElement.setAttribute('title', name);
        }
        
        // تحديث الأفاتار
        const userAvatarElement = document.getElementById('userAvatar');
        if (userAvatarElement) {
            const name = userData.name || userData.fullName || 
                        (userData.role === 'driver' ? 'س' : 'ز');
            const initials = name.charAt(0).toUpperCase();
            userAvatarElement.textContent = initials;
            userAvatarElement.style.background = this.generateAvatarColor(initials);
        }
        
        // تحديث معلومات السائق
        if (userData.role === 'driver') {
            this.updateDriverInfo(userData);
        }
        
        // تحديث الرتبة أو التقييم
        if (userData.rating || userData.totalOrders) {
            this.updateUserStats(userData);
        }
    },

    // توليد لون للأفاتار بناءً على الحرف
    generateAvatarColor: function(char) {
        const colors = [
            'linear-gradient(135deg, #4facfe, #00f2fe)',
            'linear-gradient(135deg, #ff9a9e, #fad0c4)',
            'linear-gradient(135deg, #a1c4fd, #c2e9fb)',
            'linear-gradient(135deg, #ffecd2, #fcb69f)',
            'linear-gradient(135deg, #ff9a9e, #fecfef)'
        ];
        const index = char.charCodeAt(0) % colors.length;
        return colors[index];
    },

    // تحديث معلومات السائق
    updateDriverInfo: function(userData) {
        const vehicleTypeElement = document.getElementById('vehicleType');
        if (vehicleTypeElement && userData.vehicleType) {
            const vehicleNames = {
                'motorcycle': 'دراجة نارية',
                'car': 'سيارة',
                'truck': 'شاحنة'
            };
            vehicleTypeElement.textContent = vehicleNames[userData.vehicleType] || userData.vehicleType;
        }
        
        // تحديث لوحة الأرقام إذا كانت موجودة
        const licensePlateElement = document.getElementById('licensePlate');
        if (licensePlateElement && userData.licensePlate) {
            licensePlateElement.textContent = userData.licensePlate;
        }
    },

    // تحديث إحصائيات المستخدم
    updateUserStats: function(userData) {
        const ratingElement = document.getElementById('userRating');
        if (ratingElement && userData.rating) {
            ratingElement.textContent = userData.rating.toFixed(1);
        }
        
        const ordersElement = document.getElementById('totalOrders');
        if (ordersElement && userData.totalOrders) {
            ordersElement.textContent = userData.totalOrders;
        }
        
        const completedElement = document.getElementById('completedOrders');
        if (completedElement && userData.completedOrders) {
            completedElement.textContent = userData.completedOrders;
        }
    },

    // إعداد مستمعي الأحداث
    setupEventListeners: function() {
        // أزرار اللغة
        document.addEventListener('click', (e) => {
            if (e.target.closest('.lang-btn')) {
                const btn = e.target.closest('.lang-btn');
                const lang = btn.dataset.lang;
                this.setLanguage(lang);
                this.showNotification(`تم تغيير اللغة إلى ${this.getLanguageName(lang)}`, 'success');
            }
        });
        
        // الروابط الداخلية
        document.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                const href = e.target.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    const targetId = href.substring(1);
                    this.scrollToElement(targetId);
                }
            }
        });
        
        // حماية من النقرات المتعددة
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.tagName === 'FORM') {
                this.preventMultipleSubmit(form);
            }
        });
    },

    // الحصول على اسم اللغة
    getLanguageName: function(code) {
        const names = {
            'ar': 'العربية',
            'fr': 'الفرنسية',
            'en': 'الإنجليزية',
            'es': 'الإسبانية'
        };
        return names[code] || code;
    },

    // التمرير إلى العنصر
    scrollToElement: function(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            const offset = 80; // تعويض للرأس الثابت
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    },

    // منع الإرسال المتعدد
    preventMultipleSubmit: function(form) {
        const submitBtn = form.querySelector('[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            setTimeout(() => {
                submitBtn.disabled = false;
            }, 3000);
        }
    },

    // إعداد مستمع حالة الشبكة
    setupNetworkListener: function() {
        window.addEventListener('online', () => {
            this.showNotification('تم استعادة الاتصال بالإنترنت', 'success');
            document.body.classList.remove('offline');
        });
        
        window.addEventListener('offline', () => {
            this.showNotification('فقدان الاتصال بالإنترنت', 'error');
            document.body.classList.add('offline');
        });
        
        // التحقق الأولي
        if (!navigator.onLine) {
            document.body.classList.add('offline');
        }
    },

    // عرض الإشعار
    showNotification: function(message, type = 'info') {
        // استخدام Firebase App إذا كان متاحاً
        if (window.firebaseApp && typeof window.firebaseApp.showNotification === 'function') {
            window.firebaseApp.showNotification(message, type);
            return;
        }
        
        // تنفيذ بديل محلي
        this.showLocalNotification(message, type);
    },

    // عرض إشعار محلي
    showLocalNotification: function(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="close-btn">&times;</button>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 9999;
            animation: slideIn 0.3s ease;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        `;
        
        // زر الإغلاق
        notification.querySelector('.close-btn').onclick = () => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        };
        
        // الإغلاق التلقائي
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
        
        document.body.appendChild(notification);
        
        // إضافة الأنيميشن
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
                .notification button.close-btn {
                    background: transparent;
                    border: none;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                    margin-right: -5px;
                }
            `;
            document.head.appendChild(style);
        }
    },

    // الحصول على أيقونة الإشعار
    getNotificationIcon: function(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'info': 'info-circle',
            'warning': 'exclamation-triangle'
        };
        return icons[type] || 'info-circle';
    },

    // الحصول على لون الإشعار
    getNotificationColor: function(type) {
        const colors = {
            'success': '#10b981',
            'error': '#ef4444',
            'info': '#3b82f6',
            'warning': '#f59e0b'
        };
        return colors[type] || '#3b82f6';
    },

    // إعادة التوجيه لصفحة تسجيل الدخول
    redirectToLogin: function() {
        window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
    },

    // تنسيق التاريخ
    formatDate: function(date, format = 'full') {
        if (!date) return 'غير معروف';
        
        const d = new Date(date);
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        // إذا كان اليوم
        if (diffDays === 0) {
            if (diffMins < 60) {
                return `قبل ${diffMins} دقيقة`;
            }
            return `قبل ${diffHours} ساعة`;
        }
        
        // إذا كان الأمس
        if (diffDays === 1) {
            return 'أمس';
        }
        
        // إذا كان خلال الأسبوع
        if (diffDays < 7) {
            return `قبل ${diffDays} أيام`;
        }
        
        // تنسيق كامل
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        return d.toLocaleDateString('ar-MA', options);
    },

    // تنسيق العملة
    formatCurrency: function(amount) {
        if (isNaN(amount)) return '0.00 درهم';
        return `${parseFloat(amount).toLocaleString('ar-MA')} درهم`;
    },

    // التحقق من رقم الهاتف المغربي
    isValidMoroccanPhone: function(phone) {
        if (!phone) return false;
        // دعم الأرقام الدولية والمحلية
        const patterns = [
            /^(\+212|0)(6|7)\d{8}$/, // +212 أو 0 ثم 6 أو 7 ثم 8 أرقام
            /^(06|07)\d{8}$/ // 06 أو 07 ثم 8 أرقام
        ];
        return patterns.some(pattern => pattern.test(phone));
    },

    // تنظيف رقم الهاتف
    cleanPhoneNumber: function(phone) {
        return phone.replace(/\D/g, '').replace(/^0/, '212');
    },

    // التحقق من البريد الإلكتروني
    isValidEmail: function(email) {
        if (!email) return false;
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return pattern.test(email);
    },

    // التحقق من القوة
    isValidPassword: function(password) {
        if (!password) return false;
        // 6 أحرف على الأقل، حرف كبير، حرف صغير، رقم
        const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
        return pattern.test(password);
    },

    // عرض رسالة التحميل
    showLoading: function(message = 'جاري المعالجة...') {
        // إزالة أي رسالة تحميل موجودة
        this.hideLoading();
        
        const loadingHTML = `
            <div class="loading-overlay" id="globalLoading">
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">${message}</div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', loadingHTML);
        
        // إضافة الأنماط إذا لم تكن موجودة
        if (!document.querySelector('#loading-styles')) {
            const style = document.createElement('style');
            style.id = 'loading-styles';
            style.textContent = `
                .loading-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(15, 23, 42, 0.95);
                    backdrop-filter: blur(10px);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 99999;
                    animation: fadeIn 0.3s ease;
                }
                .loading-content {
                    text-align: center;
                    color: white;
                    font-family: 'Cairo', sans-serif;
                }
                .loading-spinner {
                    width: 60px;
                    height: 60px;
                    border: 5px solid rgba(255, 255, 255, 0.3);
                    border-top: 5px solid #ffd700;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                }
                .loading-text {
                    font-size: 18px;
                    font-weight: 600;
                    color: #f1f5f9;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
    },

    // إخفاء رسالة التحميل
    hideLoading: function() {
        const loadingElement = document.getElementById('globalLoading');
        if (loadingElement) {
            loadingElement.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => loadingElement.remove(), 300);
        }
    },

    // عرض رسالة تأكيد
    confirmAction: function(message, confirmText = 'تأكيد', cancelText = 'إلغاء') {
        return new Promise((resolve) => {
            // إنشاء عنصر التأكيد
            const confirmHTML = `
                <div class="confirm-overlay" id="confirmDialog">
                    <div class="confirm-content">
                        <div class="confirm-message">${message}</div>
                        <div class="confirm-buttons">
                            <button class="confirm-btn" id="confirmOk">${confirmText}</button>
                            <button class="confirm-btn cancel" id="confirmCancel">${cancelText}</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', confirmHTML);
            
            // إضافة الأنماط إذا لم تكن موجودة
            if (!document.querySelector('#confirm-styles')) {
                const style = document.createElement('style');
                style.id = 'confirm-styles';
                style.textContent = `
                    .confirm-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.7);
                        backdrop-filter: blur(5px);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        z-index: 99998;
                        animation: fadeIn 0.3s ease;
                    }
                    .confirm-content {
                        background: #1e293b;
                        padding: 30px;
                        border-radius: 15px;
                        max-width: 400px;
                        width: 90%;
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    }
                    .confirm-message {
                        color: #f1f5f9;
                        font-size: 18px;
                        margin-bottom: 25px;
                        text-align: center;
                        line-height: 1.5;
                    }
                    .confirm-buttons {
                        display: flex;
                        gap: 15px;
                        justify-content: center;
                    }
                    .confirm-btn {
                        padding: 12px 30px;
                        border: none;
                        border-radius: 10px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s;
                        font-family: 'Cairo', sans-serif;
                    }
                    .confirm-btn:not(.cancel) {
                        background: linear-gradient(90deg, #4facfe, #00f2fe);
                        color: #0f172a;
                    }
                    .confirm-btn.cancel {
                        background: rgba(255, 255, 255, 0.1);
                        color: white;
                    }
                    .confirm-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                    }
                    @keyframes fadeOut {
                        from { opacity: 1; }
                        to { opacity: 0; }
                    }
                `;
                document.head.appendChild(style);
            }
            
            // إعداد الأزرار
            document.getElementById('confirmOk').onclick = () => {
                document.getElementById('confirmDialog').remove();
                resolve(true);
            };
            
            document.getElementById('confirmCancel').onclick = () => {
                document.getElementById('confirmDialog').remove();
                resolve(false);
            };
            
            // الإغلاق بالنقر خارج النافذة
            document.getElementById('confirmDialog').onclick = (e) => {
                if (e.target.id === 'confirmDialog') {
                    document.getElementById('confirmDialog').remove();
                    resolve(false);
                }
            };
        });
    },

    // الحصول على موقع المستخدم
    getUserLocation: function() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject('المتصفح لا يدعم تحديد الموقع');
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
                (error) => {
                    const errors = {
                        1: 'تم رفض إذن الموقع',
                        2: 'غير قادر على الحصول على الموقع',
                        3: 'انتهت مهلة الطلب'
                    };
                    reject(errors[error.code] || 'خطأ في الحصول على الموقع');
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    },

    // حساب المسافة بين نقطتين (كم)
    calculateDistance: function(lat1, lon1, lat2, lon2) {
        const R = 6371; // نصف قطر الأرض بالكيلومترات
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        return distance.toFixed(1);
    },

    // تحويل الدرجات إلى راديان
    deg2rad: function(deg) {
        return deg * (Math.PI/180);
    },

    // نسخ النص للحافظة
    copyToClipboard: function(text) {
        return new Promise((resolve, reject) => {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text)
                    .then(() => resolve(true))
                    .catch(() => {
                        // الطريقة القديمة
                        this.fallbackCopyToClipboard(text, resolve, reject);
                    });
            } else {
                this.fallbackCopyToClipboard(text, resolve, reject);
            }
        });
    },

    // طريقة بديلة للنسخ
    fallbackCopyToClipboard: function(text, resolve, reject) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            if (successful) {
                resolve(true);
            } else {
                reject(false);
            }
        } catch (err) {
            document.body.removeChild(textArea);
            reject(false);
        }
    },

    // توليد معرف فريد
    generateId: function() {
        return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    },

    // فتح الصور في معرض
    openImageGallery: function(imageUrl, title = '') {
        const galleryHTML = `
            <div class="image-gallery" id="imageGallery">
                <div class="gallery-overlay"></div>
                <div class="gallery-content">
                    <button class="gallery-close">&times;</button>
                    <img src="${imageUrl}" alt="${title}">
                    ${title ? `<div class="gallery-title">${title}</div>` : ''}
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', galleryHTML);
        
        // الإغلاق
        document.querySelector('.gallery-overlay').onclick = () => {
            document.getElementById('imageGallery').remove();
        };
        
        document.querySelector('.gallery-close').onclick = () => {
            document.getElementById('imageGallery').remove();
        };
        
        // إضافة الأنماط
        if (!document.querySelector('#gallery-styles')) {
            const style = document.createElement('style');
            style.id = 'gallery-styles';
            style.textContent = `
                .image-gallery {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 99997;
                }
                .gallery-overlay {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.9);
                    backdrop-filter: blur(10px);
                }
                .gallery-content {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    max-width: 90%;
                    max-height: 90%;
                    background: transparent;
                    border-radius: 10px;
                    overflow: hidden;
                }
                .gallery-content img {
                    max-width: 100%;
                    max-height: 70vh;
                    display: block;
                    border-radius: 10px;
                }
                .gallery-close {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    font-size: 24px;
                    cursor: pointer;
                    z-index: 1;
                }
                .gallery-title {
                    color: white;
                    text-align: center;
                    padding: 15px;
                    font-size: 18px;
                    background: rgba(0, 0, 0, 0.7);
                }
            `;
            document.head.appendChild(style);
        }
    }
};

// تهيئة التطبيق
AppUtilities.initialize();

// تصدير للاستخدام في الوحدات الأخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppUtilities;
} else {
    window.AppUtilities = AppUtilities;
}

console.log('✓ App utilities loaded successfully!');