<script>
// ========================================
// نظام تسجيل السائق - الإصدار المحسن والمصحح
// ========================================

// دالة للانتظار حتى يتم تحميل Firebase بشكل كامل
function waitForFirebase() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50; // انتظر 5 ثوان كحد أقصى
        
        const checkFirebase = () => {
            attempts++;
            
            // تحقق من وجود Firebase SDK
            if (typeof firebase === 'undefined') {
                if (attempts >= maxAttempts) {
                    reject(new Error('Firebase SDK غير محمل'));
                    return;
                }
                setTimeout(checkFirebase, 100);
                return;
            }
            
            // تحقق من تهيئة Firebase
            if (!firebase.apps || firebase.apps.length === 0) {
                if (attempts >= maxAttempts) {
                    reject(new Error('Firebase غير مهيأ'));
                    return;
                }
                setTimeout(checkFirebase, 100);
                return;
            }
            
            // تحقق من وجود firebaseApp
            if (!window.firebaseApp || !window.firebaseApp.auth) {
                if (attempts >= maxAttempts) {
                    reject(new Error('firebaseApp غير محمل'));
                    return;
                }
                setTimeout(checkFirebase, 100);
                return;
            }
            
            console.log('✅ Firebase محمل وجاهز');
            resolve(window.firebaseApp);
        };
        
        checkFirebase();
    });
}

// التحقق من صحة النموذج
function validateForm(firebaseApp) {
    const fullName = document.getElementById('fullName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const vehicleType = document.getElementById('vehicleType').value;
    const nationalIdFile = document.getElementById('nationalId').files[0];
    const drivingLicenseFile = document.getElementById('drivingLicense').files[0];
    const vehicleRegistrationFile = document.getElementById('vehicleRegistration').files[0];
    
    // التحقق من الاسم
    if (fullName.length < 3) {
        if (firebaseApp && firebaseApp.showNotification) {
            firebaseApp.showNotification('الاسم يجب أن يكون أكثر من حرفين', 'error');
        } else {
            alert('الاسم يجب أن يكون أكثر من حرفين');
        }
        return false;
    }
    
    // التحقق من الهاتف
    const phoneRegex = /^(06|07)\d{8}$/;
    if (!phoneRegex.test(phone.replace(/\s+/g, ''))) {
        if (firebaseApp && firebaseApp.showNotification) {
            firebaseApp.showNotification('رقم الهاتف غير صحيح (يجب أن يبدأ بـ 06 أو 07 ويتكون من 10 أرقام)', 'error');
        } else {
            alert('رقم الهاتف غير صحيح');
        }
        return false;
    }
    
    // التحقق من البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        if (firebaseApp && firebaseApp.showNotification) {
            firebaseApp.showNotification('البريد الإلكتروني غير صحيح', 'error');
        } else {
            alert('البريد الإلكتروني غير صحيح');
        }
        return false;
    }
    
    // التحقق من كلمة المرور
    if (password.length < 6) {
        if (firebaseApp && firebaseApp.showNotification) {
            firebaseApp.showNotification('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
        } else {
            alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        }
        return false;
    }
    
    // التحقق من تطابق كلمتي المرور
    if (password !== confirmPassword) {
        if (firebaseApp && firebaseApp.showNotification) {
            firebaseApp.showNotification('كلمتا المرور غير متطابقتين', 'error');
        } else {
            alert('كلمتا المرور غير متطابقتين');
        }
        return false;
    }
    
    // التحقق من نوع المركبة
    if (!vehicleType) {
        if (firebaseApp && firebaseApp.showNotification) {
            firebaseApp.showNotification('يرجى اختيار نوع المركبة', 'error');
        } else {
            alert('يرجى اختيار نوع المركبة');
        }
        return false;
    }
    
    // التحقق من رفع جميع المستندات
    if (!nationalIdFile || !drivingLicenseFile || !vehicleRegistrationFile) {
        if (firebaseApp && firebaseApp.showNotification) {
            firebaseApp.showNotification('يرجى رفع جميع الوثائق المطلوبة', 'error');
        } else {
            alert('يرجى رفع جميع الوثائق المطلوبة');
        }
        return false;
    }
    
    return true;
}

// معالجة أخطاء المصادقة
function handleAuthError(error, firebaseApp) {
    let message = 'حدث خطأ في التسجيل. يرجى المحاولة مرة أخرى.';
    
    if (error.code) {
        switch (error.code) {
            case 'auth/email-already-in-use':
                message = 'هذا البريد الإلكتروني مستخدم مسبقاً';
                break;
            case 'auth/invalid-email':
                message = 'البريد الإلكتروني غير صحيح';
                break;
            case 'auth/weak-password':
                message = 'كلمة المرور ضعيفة جداً (6 أحرف على الأقل)';
                break;
            case 'auth/network-request-failed':
                message = 'خطأ في الاتصال بالشبكة. يرجى التحقق من اتصالك بالإنترنت';
                break;
            default:
                message = error.message || message;
        }
    }
    
    if (firebaseApp && firebaseApp.showNotification) {
        firebaseApp.showNotification(message, 'error');
    } else {
        alert(message);
    }
    
    console.error('❌ خطأ في المصادقة:', error);
}

// إعادة تعيين الزر
function resetButton() {
    const registerBtn = document.getElementById('registerBtn');
    const spinner = document.getElementById('spinner');
    const btnText = document.getElementById('registerBtnText');
    
    if (registerBtn) registerBtn.disabled = false;
    if (spinner) spinner.style.display = 'none';
    if (btnText) btnText.textContent = 'تأكيد التسجيل';
}

// رفع ملف واحد
async function uploadSingleFile(file, userId, fileType, firebaseApp) {
    try {
        const timestamp = Date.now();
        const fileExt = file.name.split('.').pop();
        const fileName = `${fileType}_${timestamp}.${fileExt}`;
        const path = `drivers/${userId}/documents/${fileName}`;
        
        console.log(`📤 رفع ${fileType}: ${file.name}`);
        
        // استخدم firebaseApp.uploadFile إذا كان موجوداً
        if (firebaseApp && firebaseApp.uploadFile) {
            return await firebaseApp.uploadFile(file, path);
        }
        
        // أو استخدم Firebase Storage مباشرة
        const storage = firebase.storage();
        const storageRef = storage.ref(path);
        
        // رفع الملف
        const snapshot = await storageRef.put(file, {
            contentType: file.type,
            customMetadata: {
                originalName: file.name,
                fileType: fileType,
                userId: userId
            }
        });
        
        // الحصول على رابط التنزيل
        const downloadURL = await snapshot.ref.getDownloadURL();
        
        return {
            url: downloadURL,
            path: path,
            name: file.name,
            size: file.size,
            type: file.type
        };
    } catch (error) {
        console.error(`❌ خطأ في رفع ${fileType}:`, error);
        throw error;
    }
}

// تسجيل السائق - النسخة المحسنة والمصححة
async function registerDriver() {
    let firebaseApp;
    try {
        // انتظر تحميل Firebase
        firebaseApp = await waitForFirebase();
        console.log('🚀 بدء تسجيل سائق جديد...');
        
        const registerBtn = document.getElementById('registerBtn');
        const spinner = document.getElementById('spinner');
        const btnText = document.getElementById('registerBtnText');
        
        // تعطيل الزر وعرض التحميل
        registerBtn.disabled = true;
        spinner.style.display = 'inline';
        btnText.textContent = 'جاري التسجيل...';
        
        // جمع البيانات
        const fullName = document.getElementById('fullName').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim().toLowerCase();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const vehicleType = document.getElementById('vehicleType').value;
        const nationalIdFile = document.getElementById('nationalId').files[0];
        const drivingLicenseFile = document.getElementById('drivingLicense').files[0];
        const vehicleRegistrationFile = document.getElementById('vehicleRegistration').files[0];
        
        // التحقق من البيانات
        if (!validateForm(firebaseApp)) {
            resetButton();
            return;
        }
        
        // ===== بدء عملية التسجيل =====
        
        // 1. إنشاء حساب في Firebase Authentication
        console.log('1. إنشاء حساب في Firebase Authentication...');
        let userCredential;
        try {
            userCredential = await firebaseApp.auth.createUserWithEmailAndPassword(email, password);
        } catch (authError) {
            handleAuthError(authError, firebaseApp);
            resetButton();
            return;
        }
        
        const user = userCredential.user;
        console.log(`✅ تم إنشاء المستخدم: ${user.uid}`);
        
        // 2. رفع المستندات
        console.log('2. رفع المستندات...');
        btnText.textContent = 'جاري رفع المستندات...';
        
        const documents = {};
        try {
            // رفع المستندات واحداً تلو الآخر (أكثر أماناً)
            documents.nationalId = await uploadSingleFile(nationalIdFile, user.uid, 'nationalId', firebaseApp);
            documents.license = await uploadSingleFile(drivingLicenseFile, user.uid, 'license', firebaseApp);
            documents.registration = await uploadSingleFile(vehicleRegistrationFile, user.uid, 'registration', firebaseApp);
            
            console.log('✅ تم رفع جميع المستندات');
        } catch (uploadError) {
            console.error('❌ خطأ في رفع المستندات:', uploadError);
            
            // حذف المستخدم إذا فشل رفع المستندات
            try {
                await user.delete();
                console.log('🗑️ تم حذف المستخدم بسبب فشل رفع المستندات');
            } catch (deleteError) {
                console.error('❌ خطأ في حذف المستخدم:', deleteError);
            }
            
            if (firebaseApp.showNotification) {
                firebaseApp.showNotification('خطأ في رفع المستندات', 'error');
            } else {
                alert('خطأ في رفع المستندات');
            }
            
            resetButton();
            return;
        }
        
        // 3. إنشاء وثيقة المستخدم في Firestore
        console.log('3. إنشاء وثيقة المستخدم في Firestore...');
        btnText.textContent = 'جاري حفظ البيانات...';
        
        const userData = {
            name: fullName,
            email: email,
            phone: phone,
            role: 'driver',
            vehicleType: vehicleType,
            documents: {
                nationalId: documents.nationalId?.url || '',
                license: documents.license?.url || '',
                registration: documents.registration?.url || ''
            },
            status: 'pending',
            isVerified: false,
            language: firebaseApp.getLanguage ? firebaseApp.getLanguage() : 'ar',
            createdAt: new Date().toISOString(),
            settings: {
                available: false,
                earnings: 0,
                completedOrders: 0,
                rating: 0
            }
        };
        
        try {
            // استخدم firebaseApp.createUserDocument إذا كان موجوداً
            if (firebaseApp.createUserDocument) {
                await firebaseApp.createUserDocument(user.uid, userData);
            } else {
                // أو استخدم Firestore مباشرة
                await firebase.firestore().collection('users').doc(user.uid).set(userData);
            }
            console.log('✅ تم إنشاء وثيقة المستخدم في Firestore');
        } catch (firestoreError) {
            console.error('❌ خطأ في Firestore:', firestoreError);
            
            // حذف المستخدم إذا فشل حفظ البيانات
            try {
                await user.delete();
                console.log('🗑️ تم حذف المستخدم بسبب فشل Firestore');
            } catch (deleteError) {
                console.error('❌ خطأ في حذف المستخدم:', deleteError);
            }
            
            if (firebaseApp.showNotification) {
                firebaseApp.showNotification('خطأ في حفظ البيانات', 'error');
            } else {
                alert('خطأ في حفظ البيانات');
            }
            
            resetButton();
            return;
        }
        
        // 4. إرسال بريد التحقق
        try {
            await user.sendEmailVerification();
            console.log('📧 تم إرسال بريد التحقق');
        } catch (emailError) {
            console.warn('⚠️ لم يتم إرسال بريد التحقق:', emailError);
        }
        
        // 5. النجاح والتوجيه
        console.log('🎉 تم تسجيل السائق بنجاح!');
        
        if (firebaseApp.showNotification) {
            firebaseApp.showNotification('تم التسجيل بنجاح! سيتم مراجعة طلبك خلال 24 ساعة.', 'success');
        } else {
            alert('تم التسجيل بنجاح! سيتم مراجعة طلبك خلال 24 ساعة.');
        }
        
        // تسجيل الدخول تلقائياً
        try {
            await firebaseApp.auth.signInWithEmailAndPassword(email, password);
            
            // التوجيه بعد 3 ثوان
            setTimeout(() => {
                window.location.href = 'driver-dashboard.html';
            }, 3000);
        } catch (loginError) {
            console.error('❌ خطأ في تسجيل الدخول التلقائي:', loginError);
            // إذا فشل تسجيل الدخول التلقائي، أرسل المستخدم إلى صفحة تسجيل الدخول
            setTimeout(() => {
                window.location.href = 'login.html?message=account_created';
            }, 3000);
        }
        
    } catch (error) {
        console.error('❌ خطأ غير متوقع في التسجيل:', error);
        
        if (firebaseApp && firebaseApp.showNotification) {
            firebaseApp.showNotification('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.', 'error');
        } else {
            alert('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
        }
        
        resetButton();
    }
}

// تطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 صفحة تسجيل السائق محملة');
    
    // تأكد من أن زر التسجيل مرتبط بالدالة الصحيحة
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        registerBtn.onclick = registerDriver;
        console.log('✅ زر التسجيل مرتبط');
    } else {
        console.error('❌ زر التسجيل غير موجود');
    }
    
    // اختبار اتصال Firebase عند التحميل
    setTimeout(async () => {
        try {
            await waitForFirebase();
            console.log('✅ اتصال Firebase يعمل بشكل صحيح');
        } catch (error) {
            console.error('❌ خطأ في اتصال Firebase:', error.message);
            alert('تحذير: هناك مشكلة في اتصال النظام. قد لا يعمل التسجيل بشكل صحيح.');
        }
    }, 1000);
});
</script>