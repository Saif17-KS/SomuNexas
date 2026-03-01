// Firebase SDK গুলো ইম্পোর্ট করা হচ্ছে
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, onValue, push, set, update, get } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

// তোমার প্রোভাইড করা Firebase কনফিগ
const firebaseConfig = {
    apiKey: "AIzaSyDNv18tFenJP9XpyL7cr9BaA3vg-gLUC3U",
    authDomain: "somunexas.firebaseapp.com",
    databaseURL: "https://somunexas-default-rtdb.firebaseio.com",
    projectId: "somunexas",
    storageBucket: "somunexas.firebasestorage.app",
    messagingSenderId: "880413975961",
    appId: "1:880413975961:web:838932e24b0644473b1f08",
    measurementId: "G-WL3RCDT4JS"
};

// Firebase ইনিশিয়ালাইজ করা
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app); // Auth ইনিশিয়ালাইজ করা হলো

// গ্লোবাল উইন্ডোতে এক্সপোর্ট করা
window.db = db;
window.ref = ref;
window.onValue = onValue;
window.push = push;
window.set = set;
window.update = update;
window.get = get;

let activeUserId = null;

/// মালিকের সিকিউরিটি চেক (অ্যাডমিন ছাড়া কেউ চ্যাট দেখতে পারবে না) ///
(function() {
    const userData = localStorage.getItem('currentUser');
    const adminEmail = "mdsaifhasan724317@gmail.com".toLowerCase().trim();

    if (!userData) {
        window.location.href = "login.html";
        return;
    }

    const user = JSON.parse(userData);
    const userEmail = user.email ? user.email.toLowerCase().trim() : "";

    if (userEmail !== adminEmail) {
        alert("প্রবেশ নিষেধ! আপনি এই শপের অ্যাডমিন নন।");
        window.location.href = "index.html";
        return;
    }
})();
/// End ///
    // ৩. বাম পাশের লিস্টে ইউজারদের চ্যাট লোড করা
    const userListDiv = document.getElementById('user-list');

onValue(ref(db, 'chats'), (snapshot) => {
    userListDiv.innerHTML = '';
    const allChats = snapshot.val();
    
    if (allChats) {
        Object.keys(allChats).forEach(uid => {
            const chatData = allChats[uid];
            const lastMsg = chatData.lastMessage;
            
            if (lastMsg) {
                const item = document.createElement('div');
                item.className = `user-item ${activeUserId === uid ? 'active' : ''}`;
                
                // এখানে ৩-ডট মেনু এবং ডিলিট বাটন যুক্ত HTML (অভাররাইট সমস্যা সমাধান করা হয়েছে)
                item.innerHTML = `
                    <div style="display: flex; align-items: center; width: 100%; position: relative;">
                        <div class="user-avatar" onclick="loadUserMessages('${uid}', '${lastMsg.userName}')" style="cursor: pointer;">
                            ${lastMsg.userName.charAt(0).toUpperCase()}
                        </div>
                        <div style="flex: 1; cursor: pointer; padding-left: 10px;" onclick="loadUserMessages('${uid}', '${lastMsg.userName}')">
                            <div style="display: flex; justify-content: space-between;">
                                <strong style="color: #d4af37;">${lastMsg.userName}</strong>
                                ${lastMsg.unread ? '<span style="background:#d4af37; width:8px; height:8px; border-radius:50%;"></span>' : ''}
                            </div>
                            <small style="color:#888;">${lastMsg.lastText.substring(0, 15)}...</small>
                        </div>
                        
                        <button onclick="event.stopPropagation(); window.toggleOptions('${uid}')" 
                                style="background:none; border:none; color:#888; cursor:pointer; padding: 10px;">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>

                        <div id="options-${uid}" class="options-menu" 
                             style="display:none; position: absolute; right: 0; top: 35px; background: #222; border: 1px solid #444; border-radius: 5px; z-index: 999; min-width: 120px; box-shadow: 0 5px 10px rgba(0,0,0,0.5);">
                            <button onclick="event.stopPropagation(); window.deleteFullChat('${uid}')" 
                                    style="background: none; border: none; color: #ff4d4d; padding: 10px; width: 100%; text-align: left; cursor: pointer; font-size: 13px;">
                                <i class="fas fa-trash"></i> Delete User
                            </button>
                        </div>
                    </div>
                `;
                // আগের item.onclick টি সরিয়ে দিয়েছি কারণ এখন ভেতরে আলাদা আলাদা ক্লিক কাজ করবে।
                userListDiv.appendChild(item);
            }
        });
    }
});

// ৪. চ্যাট মেসেজগুলো দেখানো
// ৪. চ্যাট মেসেজগুলো দেখানো
const notificationSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');

window.loadUserMessages = function(uid, name) {
    activeUserId = uid;
    document.getElementById('active-user-name').innerText = name;
    document.querySelector('.main-layout').classList.add('show-chat');

    const chatContainer = document.querySelector('.chat-container'); 
    const userSidebar = document.querySelector('.user-sidebar'); 
    const backBtn = document.querySelector('.back-btn');
    const detailsSidebar = document.getElementById('user-details-sidebar');
    const detailsName = document.getElementById('details-name');
    const detailsAvatar = document.getElementById('details-avatar');
    const phoneElem = document.getElementById('details-phone');
    const locationElem = document.getElementById('details-location');
    const emailElem = document.getElementById('details-email');
    const nameHeader = document.getElementById('active-user-name');

    if (nameHeader) {
        // নামের ওপর ক্লিক করলে প্রোফাইল দেখাবে
        nameHeader.style.cursor = 'pointer';
        nameHeader.onclick = function() {
            window.toggleDetails();
        };
    }

    // প্রাথমিক নাম ও UI সেটআপ
    document.getElementById('active-user-name').innerText = name;
    if (detailsName) detailsName.innerText = name;
    if (detailsAvatar) {
        detailsAvatar.innerText = name.charAt(0).toUpperCase();
        detailsAvatar.style.backgroundImage = "none";
    }
    if (chatContainer) chatContainer.style.display = 'flex';
    if (backBtn) backBtn.style.display = 'inline-block';
    if (window.innerWidth > 1024 && detailsSidebar) detailsSidebar.style.display = 'block';

    // --- শক্তিশালী ডাটা লোডিং লজিক (যা আইডি বা নাম দিয়ে খুঁজবে) ---
    const usersRef = window.ref(window.db, 'users');
    window.get(usersRef).then((snapshot) => {
        const allUsers = snapshot.val();
        let foundUser = null;

        if (allUsers) {
            // ১. প্রথমে সরাসরি UID দিয়ে খোঁজো
            if (allUsers[uid]) {
                foundUser = allUsers[uid];
            } else {
                // ২. যদি না পায়, তবে নাম দিয়ে ডাটাবেজে সার্চ করো
                foundUser = Object.values(allUsers).find(u => u.name === name);
            }
        }

        if (foundUser) {
            if (phoneElem) phoneElem.innerText = foundUser.phone || foundUser.contact || 'No Number';
            if (emailElem) emailElem.innerText = foundUser.email || 'No Email';
            if (locationElem) locationElem.innerText = foundUser.address || foundUser.country || 'Unknown';
            if (foundUser.profilePic && detailsAvatar) {
                detailsAvatar.style.backgroundImage = `url(${foundUser.profilePic})`;
                detailsAvatar.style.backgroundSize = "cover";
                detailsAvatar.innerText = ""; 
            }
            console.log("Success: Profile found for", name);
        } else {
            // ৩. যদি একদমই না পাওয়া যায়
            if (phoneElem) phoneElem.innerText = 'Not Registered';
            if (emailElem) emailElem.innerText = 'Not Registered';
            if (locationElem) locationElem.innerText = 'Unknown';
            console.warn("No profile data in 'users' node for:", name);
        }
    });

    // পিসি ও মোবাইল সব জায়গায় চ্যাট উইন্ডো দেখানো
    if (window.innerWidth > 1024) {
        if (detailsSidebar) detailsSidebar.style.display = 'block';
    } else {
        // মোবাইলে সাধারণত চ্যাট ওপেন হলে প্রোফাইল হাইড থাকে
        if (detailsSidebar) detailsSidebar.style.display = 'none';
    }
    // নাম এবং অবতার সেট করা
    detailsName.innerText = name;
    if (detailsAvatar) {
    detailsAvatar.innerText = name.charAt(0).toUpperCase();
    }
    if (chatContainer) chatContainer.style.display = 'flex';
    if (backBtn) backBtn.style.display = 'inline-block';

    if (window.innerWidth < 768) {
        if (userSidebar) userSidebar.style.display = 'none';
    }

    window.closeChat = function() {
        document.querySelector('.main-layout').classList.remove('show-chat');
        document.querySelector('.main-layout').classList.remove('show-details');
        if (chatContainer) chatContainer.style.display = 'none';
        if (window.innerWidth < 768 && userSidebar) userSidebar.style.display = 'flex';
        activeUserId = null;
    };

    
    // টাইপিং লজিক আগের মতোই
    const typingRef = ref(db, `chats/${uid}/typing/user`);
    onValue(typingRef, (snapshot) => {
        const typingStatus = document.getElementById('typing-status');
        if (snapshot.val() === true) {
            typingStatus.style.display = 'block';
        } else {
            typingStatus.style.display = 'none';
        }
    });
    
    const avatar = document.getElementById('active-user-avatar');
    if(avatar) {
        avatar.style.display = 'flex';
        avatar.innerText = name.charAt(0).toUpperCase();
    }

    const messagesRef = ref(db, `chats/${uid}/messages`);
    onValue(messagesRef, (snapshot) => {
        const msgDiv = document.getElementById('admin-chat-messages');
        msgDiv.innerHTML = '';
        const messages = snapshot.val();
        
        if (messages) {
            Object.keys(messages).forEach(msgId => {
                const m = messages[msgId];
                const div = document.createElement('div');
                div.className = `msg ${m.role === 'admin' ? 'sent' : 'received'}`;

// এটি লুপের ভেতরে থাকবে
let pressTimer;

// ব্রাউজারের ডিফল্ট রাইট-ক্লিক মেনু পুরোপুরি বন্ধ করা
div.oncontextmenu = function(e) {
    e.preventDefault();
    e.stopPropagation(); // অন্য কোনো পপ-আপ যেন না আসে
    window.showDeleteMenu(e, uid, msgId, m.timestamp);
    return false;
};

// ফোনের জন্য লং-প্রেস লজিক
div.addEventListener('touchstart', (e) => {
    // যদি আগে থেকেই কোনো টাইমার চলে সেটা বন্ধ করা
    clearTimeout(pressTimer);
    pressTimer = setTimeout(() => {
        window.showDeleteMenu(e, uid, msgId, m.timestamp);
    }, 700); // ০.৭ সেকেন্ড চেপে রাখলে মেনু আসবে
}, { passive: true });

div.addEventListener('touchend', () => clearTimeout(pressTimer));
div.addEventListener('touchmove', () => clearTimeout(pressTimer));

// ২. ফাইলের নিচে এই গ্লোবাল ফাংশনটি আপডেট করো (Firebase call নিশ্চিত করা হয়েছে)
window.adminDeleteMsg = function(uid, msgId, type) {
    if (type === 'everyone') {
        if (confirm("সবার জন্য ডিলিট করতে চান?")) {
            // সরাসরি window.db এবং window.ref ব্যবহার করছি যা তুমি আগেই সেট করেছো
            const msgPath = window.ref(window.db, `chats/${uid}/messages/${msgId}`);
            import("https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js").then(m => {
                m.remove(msgPath).then(() => {
                    console.log("Deleted for everyone");
                    // মেনু রিমুভ করা
                    const menu = document.querySelector('.custom-context-menu');
                    if(menu) menu.remove();
                });
            });
        }
    } else {
        // Delete for Me: ডাটাবেজে মার্ক করে রাখা
        const msgPath = window.ref(window.db, `chats/${uid}/messages/${msgId}`);
        import("https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js").then(m => {
            m.update(msgPath, { deletedByAdmin: true }).then(() => {
                alert("আপনার দিক থেকে ডিলিট হয়েছে।");
                const menu = document.querySelector('.custom-context-menu');
                if(menu) menu.remove();
            });
        });
    }
};

                // রাইট ক্লিক করলে মেসেজ ডিলিট হবে
                div.oncontextmenu = function(e) {
                e.preventDefault();
                window.deleteMsg(uid, msgId);
                };
                
                // ১. কন্টেন্ট রেন্ডারিং (তোমার আগের লজিক)
                const isImage = m.text.match(/\.(jpeg|jpg|gif|png)$/) != null || m.text.startsWith('data:image');
                const isVideo = m.text.match(/\.(mp4|webm)$/) != null;

                if (isImage) {
                    div.innerHTML = `<img src="${m.text}" style="max-width: 250px; border-radius: 10px; cursor: pointer;" onclick="window.open('${m.text}')">`;
                } else if (isVideo) {
                    div.innerHTML = `<video controls style="max-width: 250px; border-radius: 10px;"><source src="${m.text}"></video>`;
                } else {
                    const textSpan = document.createElement('span');
                    textSpan.innerText = m.text;
                    div.appendChild(textSpan);
                }

// ২. SEEN স্ট্যাটাস লজিক (সবচেয়ে সহজ ও কার্যকরী উপায়)
                if (m.role === 'admin') {
                    const statusTag = document.createElement('div');
                    statusTag.className = 'seen-status';
                    statusTag.style.cssText = "font-size: 10px; text-align: right; margin-top: 4px; font-weight: bold;";

                    // যদি m.status এর মান 'seen' হয় (ছোট হাতের বা বড় হাতের যাই হোক)
                    if (m.status && m.status.toString().toLowerCase() === 'seen') {
                        statusTag.style.color = '#34b7f1'; // নীল রঙ
                        statusTag.innerHTML = '<i class="fas fa-check-double"></i> Seen';
                    } else {
                        statusTag.style.color = '#888'; // ধূসর রঙ
                        statusTag.innerHTML = '<i class="fas fa-check"></i> Sent';
                    }
                    div.appendChild(statusTag);
                }

                msgDiv.appendChild(div);

                // ৩. অটো সিন বন্ধ রেখে ম্যানুয়াল সিন লজিক
                if (m.role === 'user' && m.status !== 'seen' && activeUserId === uid) {
                    set(ref(db, `chats/${uid}/messages/${msgId}/status`), 'seen');
                }
            });
            msgDiv.scrollTop = msgDiv.scrollHeight;
        }
    });

    set(ref(db, `chats/${uid}/lastMessage/unread`), false);
};

    // ৫. অ্যাডমিন রিপ্লাই পাঠানো
    window.sendAdminReply = function() {
        const input = document.getElementById('admin-reply-input');
        const text = input.value.trim();
        
        if (!text || !activeUserId) return;

        const chatRef = ref(db, `chats/${activeUserId}/messages`);
        const newMsgRef = push(chatRef);
        
        set(newMsgRef, {
            sender: "Admin",
            role: "admin",
            text: text,
            status: "sent",
            timestamp: Date.now()
        }).then(() => {
            // লাস্ট মেসেজ আপডেট করা (unread false করে)
            set(ref(db, `chats/${activeUserId}/lastMessage`), {
                userName: document.getElementById('active-user-name').innerText,
                lastText: text,
                timestamp: Date.now(),
                userId: activeUserId,
                unread: false
            });
            input.value = '';
        });
    };

const adminInput = document.getElementById('admin-reply-input');

adminInput.addEventListener('input', () => {
    if (activeUserId) {
        // Firebase-এ অ্যাডমিন টাইপিং 'true' করা
        set(ref(db, `chats/${activeUserId}/typing/admin`), true);
        
        // ৩ সেকেন্ড পর টাইপিং স্ট্যাটাস অটো 'false' হয়ে যাবে
        clearTimeout(window.adminTypingTimeout);
        window.adminTypingTimeout = setTimeout(() => {
            set(ref(db, `chats/${activeUserId}/typing/admin`), false);
        }, 3000);
    }
});

    // এন্টার প্রেস ইভেন্ট
    document.getElementById('admin-reply-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') window.sendAdminReply();
    });

 // ইমোজি পিকার খোলা বা বন্ধ করা
const emojis = {
    face: ['😊', '😂', '😍', '😎', '😮', '😢', '😡', '🤔', '🥳', '😴', '🙄', '😇'],
    hand: ['👍', '🙌', '👏', '🙏', '🤝', '✌️', '👌', '👋', '🔥', '✨', '💯', '✅'],
    heart: ['❤️', '💖', '💙', '💜', '🖤', '🌹', '🎁', '🎂', '🎈', '🎉', '🌟', '💎']
};

window.filterEmoji = function(category) {
    const list = document.getElementById('emoji-list');
    list.innerHTML = '';
    emojis[category].forEach(emoji => {
        const span = document.createElement('span');
        span.innerText = emoji;
        span.onclick = () => addEmoji(emoji);
        list.appendChild(span);
    });
};

window.toggleEmojiPicker = function() {
    const picker = document.getElementById('emoji-picker');
    picker.classList.toggle('hidden');
    if(!picker.classList.contains('hidden')) {
        filterEmoji('face'); // ডিফল্টভাবে ফেস ইমোজি দেখাবে
    }
};

window.addEmoji = function(emoji) {
    const input = document.getElementById('admin-reply-input');
    input.value += emoji;
    input.focus();
    // পিকার খোলা রাখতে চাইলে নিচের লাইনটি ডিলিট করে দাও
    document.getElementById('emoji-picker').classList.add('hidden'); 
};
// কুইক রিপ্লাইয়ের লেখা ইনপুট বক্সে সেট করা
window.setQuickReply = function(text) {
    // তোমার ইনপুট আইডির নাম দেখে নাও (admin-reply-input)
    const inputField = document.getElementById('admin-reply-input'); 
    if (inputField) {
        inputField.value = text;
        inputField.focus();
    }
};
window.toggleDetails = function() {
    const detailsSidebar = document.getElementById('user-details-sidebar');
    const mainLayout = document.querySelector('.main-layout'); // মেইন কন্টেইনারটি ধরুন

    if (!detailsSidebar || !mainLayout) {
        console.error("Sidebar or Main Layout not found!");
        return;
    }

    // ক্লাস টগল করা (এটি CSS-এর right: 0 কে ট্রিগার করবে)
    if (mainLayout.classList.contains('show-details')) {
        mainLayout.classList.remove('show-details');
        // এনিমেশন শেষ হওয়ার পর হাইড করা (অপশনাল কিন্তু ভালো)
        setTimeout(() => {
            detailsSidebar.style.setProperty('display', 'none', 'important');
        }, 300);
        console.log("Profile closed");
    } else {
        // আগে ডিসপ্লে ব্লক করা, তারপর ক্লাস যোগ করা
        detailsSidebar.style.setProperty('display', 'block', 'important');
        setTimeout(() => {
            mainLayout.classList.add('show-details');
        }, 10);
        console.log("Profile opened");
    }
};

// ৩-ডট মেনু খোলা/বন্ধ করা
window.toggleOptions = function(uid) {
    const menu = document.getElementById(`options-${uid}`);
    document.querySelectorAll('.options-menu').forEach(m => {
        if (m.id !== `options-${uid}`) m.style.display = 'none';
    });
    if (menu) {
        menu.style.display = (menu.style.display === 'none' || menu.style.display === '') ? 'block' : 'none';
    }
};

// ইউজার ডিলিট ফাংশন (এরর ফিক্সড)
window.deleteFullChat = function(uid) {
    if (confirm("আপনি কি নিশ্চিত যে এই ইউজার এবং তার সব চ্যাট ডিলিট করবেন?")) {
        // সরাসরি ইম্পোর্ট করা ফাংশনগুলো ব্যবহার করছি
        import("https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js").then(m => {
            const chatPath = window.ref(window.db, `chats/${uid}`);
            m.remove(chatPath).then(() => {
                alert("ইউজার সফলভাবে ডিলিট হয়েছে!");
            }).catch(err => {
                console.error("Delete failed:", err);
                alert("ডিলিট করা সম্ভব হয়নি।");
            });
        });
    }
};

window.showDeleteMenu = function(e, uid, msgId, timestamp) {
    // আগের কোনো মেনু থাকলে সরিয়ে ফেলা
    const oldMenu = document.querySelector('.custom-context-menu');
    if (oldMenu) oldMenu.remove();

    const menu = document.createElement('div');
    menu.className = 'custom-context-menu';
    
    // মেনু পজিশন সেট করা (টাচ বা ক্লিক অনুযায়ী)
    const posX = e.pageX || e.touches[0].pageX;
    const posY = e.pageY || e.touches[0].pageY;

    menu.style.cssText = `
        position: fixed; top: ${posY}px; left: ${posX}px; 
        background: #1a1a1a; border: 1px solid #d4af37; 
        border-radius: 8px; z-index: 10000; padding: 5px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.5);
    `;

    // টাইম লিমিট চেক (কাস্টমারের জন্য ৫ মিনিট লজিক)
    const isWithinLimit = (Date.now() - timestamp) < (5 * 60 * 1000);

    menu.innerHTML = `
        <div onclick="window.adminDeleteMsg('${uid}', '${msgId}', 'me')" 
             style="color: white; padding: 10px 20px; cursor: pointer; border-bottom: 1px solid #333;">
             🗑️ Delete for Me
        </div>
        <div onclick="${isWithinLimit ? `window.adminDeleteMsg('${uid}', '${msgId}', 'everyone')` : `alert('Time expired for everyone delete')`}" 
             style="color: #ff4d4d; padding: 10px 20px; cursor: pointer; ${!isWithinLimit ? 'opacity: 0.5;' : ''}">
             🔥 Delete for Everyone
        </div>
    `;
    
    document.body.appendChild(menu);

    // বাইরে ক্লিক করলে মেনু উধাও
    setTimeout(() => {
        document.addEventListener('click', () => menu.remove(), { once: true });
    }, 100);
};


