importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDNv18tFenJP9XpyL7cr9BaA3vg-gLUC3U",
    authDomain: "somunexas.firebaseapp.com",
    projectId: "somunexas",
    storageBucket: "somunexas.firebasestorage.app",
    messagingSenderId: "880413975961",
    appId: "1:880413975961:web:838932e24b0644473b1f08"
});

const messaging = firebase.messaging();

// ব্যাকগ্রাউন্ডে নোটিফিকেশন রিসিভ করার লজিক
messaging.onBackgroundMessage((payload) => {
    console.log('Background Message received: ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: 'icon/Mekxus_logo_no_bg.png' // তোমার লোগোর পাথ
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});