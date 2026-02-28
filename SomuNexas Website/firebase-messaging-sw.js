importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// তোমার ফায়ারবেস কনফিগ এখানে বসাও
firebase.initializeApp({
    apiKey: "YOUR_API_KEY",
    projectId: "YOUR_PROJECT_ID",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
});

const messaging = firebase.messaging();

// ব্যাকগ্রাউন্ড নোটিফিকেশন হ্যান্ডলার
messaging.onBackgroundMessage((payload) => {
    console.log('Background Message:', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: 'assets/brand-logo.png', // তোমার লোগো
        image: payload.data.image || 'assets/default-promo.jpg', // নোটিফিকেশনে বড় ছবি
        badge: 'assets/badge-icon.png',
        silent: false, // ডিভাইসের সাউন্ড বাজবে
        data: { url: payload.data.click_action }
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});