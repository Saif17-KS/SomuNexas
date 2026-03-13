    import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
    import { getDatabase, ref, onValue, push, set, remove, update } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
    import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
    // আপনার দেওয়া Firebase কনফিগ
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

    // ডুপ্লিকেট অ্যাপ এরর এড়ানোর জন্য চেক
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const db = getDatabase(app);
    const auth = getAuth(app);

    // URL থেকে আইডি নেওয়া
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (productId) {
        const productsRef = ref(db, 'products');
        onValue(productsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // আপনার ডাটাবেজের আইডি ফিল্ডের সাথে ম্যাচ করা
                const productKey = Object.keys(data).find(key => data[key].id == productId);
                const product = data[productKey];

                if (product) {
                    // ১. বেসিক তথ্য সেট করা
                        const titleEl = document.getElementById('pTitle');
                        const priceEl = document.getElementById('pPrice');
                        const warrantyEl = document.getElementById('pWarranty');

                        titleEl.innerText = product.name;
                        priceEl.innerText = (product.currentPrice || product.price) + " TK";
                        document.getElementById('pShortDesc').innerText = product.desc || "";
                        warrantyEl.innerText = product.warranty || "No Official Warranty";

                        // ২. ডেটা চলে এসেছে, তাই এখন স্কেলিটন অ্যানিমেশন সরিয়ে ফেলা
                        titleEl.classList.remove('skeleton');
                        priceEl.classList.remove('skeleton');
                        warrantyEl.classList.remove('skeleton');
                                            
                        // তোমার আগের কোড অনুযায়ী ডাটা বসানো
                        const longDesc = document.getElementById('pLongDescText');
                        if(longDesc) {
                            longDesc.innerText = product.longDescription || "বিস্তারিত তথ্য শীঘ্রই যুক্ত করা হবে।";
                            
                            // ডেসক্রিপশন যদি বড় হয় তবেই বাটন দেখাবে
                            setTimeout(() => {
                                if (longDesc.scrollHeight > 150) {
                                    document.getElementById('seeMoreBtn').style.display = 'block';
                                }
                            }, 500);
                        }

                    // See More টগল ফাংশন
                    window.toggleDescription = function() {
                        const content = document.getElementById('descriptionContent'); // আমরা এখন মেইন কন্টেইনার ধরছি
                        const btn = document.getElementById('seeMoreBtn');
                        
                        content.classList.toggle('expanded');
                        btn.classList.toggle('active');
                        
                        if (content.classList.contains('expanded')) {
                            btn.innerHTML = 'See Less <i class="fas fa-chevron-up"></i>'; // আইকন উপরে ঘুরবে
                            btn.style.background = 'transparent';
                        } else {
                            btn.innerHTML = 'See More <i class="fas fa-chevron-down"></i>';
                            btn.style.background = 'linear-gradient(to top, #000, transparent)';
                            // স্ক্রল করে উপরে নিয়ে যাবে
                            document.querySelector('.detailed-description').scrollIntoView({ behavior: 'smooth' });
                        }
                    }

                    // ২. ইমেজ হ্যান্ডলিং
                    const mainImg = document.getElementById('mainImg');
                    // images অথবা media যে নামেই থাকুক ডাটা খুঁজে নেবে
                    const allImages = product.images || (product.media ? product.media.map(m => m.url) : []);
                    
                    if(allImages.length > 0) {
                        mainImg.src = allImages[0];
                        const gallery = document.getElementById('thumbGallery');
                        if(gallery) {
                            gallery.innerHTML = ''; 
                            allImages.forEach((url, index) => {
                                const img = document.createElement('img');
                                img.src = url;
                                if(index === 0) img.classList.add('active');
                                img.onclick = () => {
                                    mainImg.src = url;
                                    document.querySelectorAll('.thumb-gallery img').forEach(i => i.classList.remove('active'));
                                    img.classList.add('active');
                                };
                                gallery.appendChild(img);
                            });
                        }
                    }

                    // ৩. ডেসক্রিপশন ইমেজ (যদি অ্যাডমিন প্যানেল থেকে আপলোড করা থাকে)
                    const descDiv = document.getElementById('pDescImages');
                    if(descDiv) {
                        descDiv.innerHTML = '';
                        if(product.descriptionImages) {
                            product.descriptionImages.forEach(url => {
                                const img = document.createElement('img');
                                img.src = url;
                                descDiv.appendChild(img);
                            });
                        }
                    }

                    // ৪. WhatsApp লিঙ্ক
                    const waBtn = document.getElementById('waBtn');
                    if(waBtn) {
                        waBtn.href = `https://wa.me/8801826435150?text=Hello, I want to buy ${product.name} (ID: ${product.id})`;
                    }
                    // --- ৫. স্টক চেক এবং বাটন আপডেট (এখানে বসাও) ---
                    let stockVal = 0;
                    if (product.stock !== undefined && product.stock !== null && product.stock !== "") {
                        stockVal = parseInt(product.stock);
                    }

                    const cartBtn = document.getElementById('detailsAddToCartBtn');

                    if (stockVal <= 0) {
                        // স্টক না থাকলে বাটন "STOCK OUT" দেখাবে
                        if(cartBtn) {
                            cartBtn.innerText = "STOCK OUT";
                            cartBtn.disabled = true;
                            cartBtn.style.background = "#444";
                            cartBtn.style.color = "#888";
                            cartBtn.style.borderColor = "#444";
                            cartBtn.style.cursor = "not-allowed";
                        }
                        // হোয়াটসঅ্যাপ বাটন স্টক আউট মোড
                        if(waBtn) {
                            waBtn.style.opacity = "0.6";
                            waBtn.style.pointerEvents = "none"; 
                            waBtn.innerHTML = `<i class="fab fa-whatsapp"></i> STOCK OUT`;
                        }
                    } else {
                        // স্টক থাকলে বাটন স্বাভাবিক থাকবে
                        if(cartBtn) {
                            cartBtn.innerText = "ADD TO CART";
                            cartBtn.disabled = false;
                            cartBtn.style.background = "transparent";
                            cartBtn.style.color = "#d4af37";
                            cartBtn.style.borderColor = "#d4af37";
                            cartBtn.style.cursor = "pointer";
                        }
                        if(waBtn) {
                            waBtn.style.opacity = "1";
                            waBtn.style.pointerEvents = "auto";
                            waBtn.innerHTML = `<i class="fab fa-whatsapp"></i> BUY NOW`;
                        }
                    }
                    // --- স্টক চেক শেষ ---
                }
            }
        });
    }

    // ৫. কোয়ান্টিটি বাটন ফাংশন
    window.updateQty = function(val) {
        const qtyVal = document.getElementById('qtyVal');
        let current = parseInt(qtyVal.innerText);
        qtyVal.innerText = Math.max(1, current + val);
    };

    // ৬. জুম ইফেক্ট (ডেস্কটপের জন্য)
    const zoomContainer = document.getElementById('zoomContainer');
    const mainImg = document.getElementById('mainImg');
    if(zoomContainer && mainImg) {
        zoomContainer.addEventListener('mousemove', (e) => {
            const { left, top, width, height } = zoomContainer.getBoundingClientRect();
            const x = ((e.pageX - left) / width) * 100;
            const y = ((e.pageY - top) / height) * 100;
            mainImg.style.transformOrigin = `${x}% ${y}%`;
            mainImg.style.transform = "scale(1.8)";
        });
        zoomContainer.addEventListener('mouseleave', () => {
            mainImg.style.transform = "scale(1)";
        });
}
window.addEventListener('scroll', () => {
    const imageSection = document.querySelector('.image-section');
    if (window.scrollY > 200) { // ২০০ পিক্সেল নিচে নামলে ইমেজ ছোট হবে
        imageSection.classList.add('scrolled');
    } else {
        imageSection.classList.remove('scrolled');
    }
});
// এই অংশটি অবশ্যই product.html এর স্ক্রিপ্টের ভেতর থাকতে হবে
// window অবজেক্টে ফাংশনটি এক্সপোজ করা হচ্ছে যেন HTML বাটন থেকে এটি পাওয়া যায়
window.addToCartFromDetails = function() {
    // ১. প্রয়োজনীয় তথ্য সংগ্রহ করা
    const name = document.getElementById('pTitle').innerText;
    const price = document.getElementById('pPrice').innerText.replace(' TK', '');
    const img = document.getElementById('mainImg').src;
    
    // ২. URL থেকে প্রোডাক্ট আইডি সংগ্রহ করা (এটি না পাঠালে Firebase error দিবে)
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    // ৩. স্টক চেক করা
    const cartBtn = document.getElementById('detailsAddToCartBtn');
    const isStockOut = cartBtn ? cartBtn.disabled : false;

    if (isStockOut) {
        alert("Sorry, this product is out of stock!");
        return;
    }

    // ৪. মেইন addToCart ফাংশন কল করা (আইডিসহ)
    if (typeof window.addToCart === "function") {
        if (!productId) {
            console.error("Product ID not found in URL!");
            return;
        }
        
        // এখানে নাম, দাম, ছবি এবং আইডি পাঠানো হচ্ছে
        window.addToCart(name, price, img, productId);
        
        alert("Product added to cart!"); 
    } else {
        console.error("Main addToCart function not found! Make sure script.js is loaded correctly.");
    }
};

// ২. মেসেজ পাঠানোর ফাংশন
////start chat option js/////

// ১. চ্যাট উইন্ডো ওপেন/ক্লোজ করার ফাংশন
window.toggleChat = function() {
    const chatWin = document.getElementById('nexus-chat-window');
    chatWin.classList.toggle('chat-hidden');
    document.getElementById('chat-notify').style.display = 'none';
};
// ২. মেসেজ পাঠানোর ফাংশন
////start chat option js/////

// ১. চ্যাট উইন্ডো ওপেন/ক্লোজ করার ফাংশন
window.toggleChat = function() {
    const chatWin = document.getElementById('nexus-chat-window');
    chatWin.classList.toggle('chat-hidden');
    document.getElementById('chat-notify').style.display = 'none';
};
// ২. মেসেজ পাঠানোর ফাংশন
// ১. ইউজার আইডি এবং নাম নির্ধারণের জন্য শক্তিশালী ফাংশন
function getNexusUserData() {
    let user = JSON.parse(localStorage.getItem('currentUser')) || {};
    
    // যদি লগইন না থাকে, তবে একটি স্থায়ী গেস্ট আইডি তৈরি করো
    if (!user.uid && !user.id) {
        let guestId = localStorage.getItem('chat_uid');
        if (!guestId) {
            guestId = "guest_" + Date.now();
            localStorage.setItem('chat_uid', guestId);
        }
        user.id = guestId;
        user.name = "Guest User";
    }
    
    return {
        id: user.uid || user.id,
        name: user.name || "Guest User"
    };
}

const nexusUser = getNexusUserData();

// ২. মেসেজ পাঠানোর ফাংশন
window.sendNexusMessage = function() {
    const chatInput = document.getElementById('chat-input');
    const message = chatInput.value.trim();
    if (!message) return;

    const chatRef = ref(db, `chats/${nexusUser.id}/messages`);
    const newMsgRef = push(chatRef);
    
    const msgData = {
        sender: nexusUser.name,
        role: "user",
        text: message,
        status: "sent",
        timestamp: Date.now()
    };

    set(newMsgRef, msgData).then(() => {
        // অ্যাডমিন লিস্টের জন্য লাস্ট মেসেজ আপডেট
        set(ref(db, `chats/${nexusUser.id}/lastMessage`), {
            userName: nexusUser.name,
            lastText: message,
            timestamp: Date.now(),
            userId: nexusUser.id,
            unread: true
        });
        chatInput.value = '';
    });
};

// ৩. রিয়েল-টাইমে মেসেজ রিসিভ করা (সঠিক পাথ ব্যবহার করে)
const userMessagesRef = ref(db, `chats/${nexusUser.id}/messages`);
onValue(userMessagesRef, (snapshot) => {
    const chatBody = document.getElementById('chat-messages');
    const data = snapshot.val();
    
    if (data) {
        chatBody.innerHTML = ''; 
        // Object.entries ব্যবহার করছি যাতে msgId পাওয়া যায়
        Object.entries(data).forEach(([msgId, msg]) => {
            const div = document.createElement('div');
            div.className = msg.role === 'user' ? 'msg user-msg' : 'msg bot-msg';

            let pressTimer;

            // ব্রাউজারের ডিফল্ট মেনু বন্ধ করা
            div.oncontextmenu = (e) => {
    e.preventDefault();
    window.showCustomerDeleteMenu(e, String(nexusUser.id), String(msgId), msg.timestamp);
    return false;
};

            // ফোনের জন্য লং-প্রেস (Touch)
            div.addEventListener('touchstart', (e) => {
                clearTimeout(pressTimer);
                pressTimer = setTimeout(() => {
                    // touch ইভেন্টের জন্য পজিশন পাস করা হচ্ছে
                    window.showCustomerDeleteMenu(e, nexusUser.id, msgId, msg.timestamp);
                }, 700);
            }, { passive: true });

            div.addEventListener('touchend', () => clearTimeout(pressTimer));
            div.addEventListener('touchmove', () => clearTimeout(pressTimer));
            
            // টেক্সট কন্টেন্ট
            const span = document.createElement('span');
            span.innerText = msg.text;
            div.appendChild(span);

            // নীল টিক (Seen Status)
            if (msg.role === 'user' && msg.status === 'seen') {
                const tick = document.createElement('i');
                tick.className = 'fas fa-check-double';
                tick.style.cssText = 'color: #34b7f1; font-size: 10px; margin-left: 5px;';
                div.appendChild(tick);
            }
            chatBody.appendChild(div);
        });
        chatBody.scrollTop = chatBody.scrollHeight;
    }
});

// ৪. টাইপিং এবং সিন স্ট্যাটাস লজিক (এন্টার বাটন সহ)
const chatInputField = document.getElementById('chat-input');

if (chatInputField) {
    chatInputField.addEventListener('input', () => {
        set(ref(db, `chats/${nexusUser.id}/typing/user`), true);
        clearTimeout(window.typingTimeout);
        window.typingTimeout = setTimeout(() => {
            set(ref(db, `chats/${nexusUser.id}/typing/user`), false);
        }, 2000);
    });

    // এন্টার বাটনে মেসেজ পাঠানোর লজিক
    chatInputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // নতুন লাইন তৈরি হওয়া বন্ধ করবে
            window.sendNexusMessage(); // মেসেজ পাঠানোর ফাংশন কল করবে
        }
    });
}

// অ্যাডমিন টাইপিং এবং অটো সিন
onValue(ref(db, `chats/${nexusUser.id}/typing/admin`), (snapshot) => {
    const isTyping = snapshot.val();
    const adminStatus = document.getElementById('admin-typing-status');
    if (adminStatus) adminStatus.style.display = isTyping ? 'block' : 'none';

    // চ্যাট খোলা থাকলে মেসেজ Seen করা
    onValue(ref(db, `chats/${nexusUser.id}/messages`), (msgSnapshot) => {
        const messages = msgSnapshot.val();
        if (messages) {
            Object.keys(messages).forEach(msgId => {
                if (messages[msgId].role === 'admin' && messages[msgId].status !== 'seen') {
                    set(ref(db, `chats/${nexusUser.id}/messages/${msgId}/status`), 'seen');
                }
            });
        }
    }, { onlyOnce: true });
});

window.showCustomerDeleteMenu = function(e, uid, msgId, msgTimestamp) {
    if (!msgTimestamp) return;

    const currentTime = Date.now();
    // মিলিসেকেন্ড থেকে সেকেন্ডে পার্থক্য বের করা
    const diffInSeconds = (currentTime - msgTimestamp) / 1000;
    
    console.log("Diff in seconds:", diffInSeconds);

    // ১০ মিনিট = ৬০০ সেকেন্ড
    if (diffInSeconds > 600) { 
        console.log("সময় পার হয়ে গেছে (১০ মিনিট লিমিট)!");
        alert("১০ মিনিট পার হয়ে যাওয়ায় মেসেজটি আর ডিলিট করা সম্ভব নয়।");
        return; 
    }

    // আগের কোনো মেনু থাকলে সরিয়ে ফেলা
    const oldMenu = document.querySelector('.custom-context-menu');
    if (oldMenu) oldMenu.remove();

    const menu = document.createElement('div');
    menu.className = 'custom-context-menu';
    
    // মোবাইল এবং পিসির জন্য সঠিক পজিশন বের করা
let posX, posY;
if (e.touches && e.touches[0]) {
    // মোবাইল টাচ পজিশন
    posX = e.touches[0].clientX;
    posY = e.touches[0].clientY;
} else {
    // পিসি মাউস পজিশন
    posX = e.clientX;
    posY = e.clientY;
}

// মেনু যেন স্ক্রিনের বাইরে না যায় (ডান থেকে বামে নিয়ে আসা)
const menuWidth = 180; // মেনুর আনুমানিক প্রস্থ
const screenWidth = window.innerWidth;

if (posX + menuWidth > screenWidth) {
    posX = posX - menuWidth; // যদি ডান দিকে জায়গা না থাকে, তবে বামে সরবে
}

menu.style.cssText = `
    position: fixed !important;
    top: ${posY}px;
    left: ${posX}px;
    background: #1a1a1a;
    border: 1px solid #d4af37;
    z-index: 10000000 !important;
    padding: 10px;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.8);
    color: white;
    cursor: pointer;
    min-width: ${menuWidth}px; /* বক্সের সাইজ নির্দিষ্ট করা হলো */
    white-space: nowrap; /* লেখা যেন না ভাঙ্গে */
`;

    menu.innerHTML = `<div onclick="window.customerDeleteForEveryone('${uid}', '${msgId}')" 
    style="color: #ff4d4d; font-weight: bold; white-space: nowrap; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 8px;">
    🔥 Delete for Everyone
    </div>`;
    
    document.body.appendChild(menu);

    // মেনুর বাইরে ক্লিক করলে সেটি বন্ধ হয়ে যাবে
    setTimeout(() => {
        const closeMenu = () => {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        };
        document.addEventListener('click', closeMenu);
    }, 100);
};
window.customerDeleteForEveryone = function(uid, msgId) {
    if (!uid || !msgId) return;

    if (confirm("আপনি কি নিশ্চিত যে এই মেসেজটি সবার জন্য ডিলিট করবেন?")) {
        // ফায়ারবেস পাথ (Path)
        const pathStr = `chats/${uid}/messages/${msgId}`;
        
        // এখানে সরাসরি ইম্পোর্ট করা মডিউল ব্যবহার করছি
        // মনে রাখবে: মডিউল স্কোপের ভেতরে থাকলে ref এবং remove সরাসরি কাজ করবে
        try {
            const messageRef = ref(db, pathStr);
            
            remove(messageRef)
                .then(() => {
                    console.log("সফলভাবে ডিলিট হয়েছে!");
                    // পপ-আপ মেনু বন্ধ করা
                    const menu = document.querySelector('.custom-context-menu');
                    if (menu) menu.remove();
                })
                .catch((error) => {
                    console.error("Firebase Remove Error:", error);
                    alert("ডিলিট করতে সমস্যা হয়েছে: " + error.message);
                });
        } catch (err) {
            console.error("Reference Error:", err);
            alert("সিস্টেম এরর! পেজটি একবার রিফ্রেশ দিন।");
        }
    }
};
///End chat js///


////start show product js////

function loadAllProducts() {
    const productsRef = ref(db, 'products'); 
    
    onValue(productsRef, (snapshot) => {
        const data = snapshot.val();

        if (data) {
            const allProductsList = Object.keys(data).map(key => ({
                id: data[key].id || key,
                ...data[key]
            }));

            const urlParams = new URLSearchParams(window.location.search);
            const currentId = urlParams.get('id');

            // বর্তমান প্রোডাক্টটিকে পুরো অবজেক্ট হিসেবে খুঁজে বের করো
            const currentProduct = allProductsList.find(p => String(p.id) === String(currentId));

            // এখন পুরো প্রোডাক্ট অবজেক্টটি পাঠাও যাতে ক্যাটাগরি পাওয়া যায়
            showRelatedProducts(allProductsList, currentProduct);
        }
    });
}

loadAllProducts();

function showRelatedProducts(allProducts, currentProduct) {
    const relatedGrid = document.getElementById('related-grid');
    // currentProduct না থাকলে কিছুই দেখাবে না
    if (!relatedGrid || !currentProduct) return;

    // ১. বর্তমান প্রোডাক্টটি তালিকা থেকে বাদ দাও
    let otherProducts = allProducts.filter(p => String(p.id) !== String(currentProduct.id));

    // ২. একই ক্যাটাগরির প্রোডাক্টগুলো আলাদা করো (ফিল্টার)
    let sameCategory = otherProducts.filter(p => 
        p.category && currentProduct.category && p.category === currentProduct.category
    );
    
    // ৩. ভিন্ন ক্যাটাগরির প্রোডাক্টগুলো
    let differentCategory = otherProducts.filter(p => 
        p.category !== currentProduct.category
    );

    // ৪. সাজানো: আগে একই ক্যাটাগরি (র‍্যান্ডম), তারপর বাকিগুলো (র‍্যান্ডম)
    let finalSelection = [
        ...sameCategory.sort(() => 0.5 - Math.random()), 
        ...differentCategory.sort(() => 0.5 - Math.random())
    ].slice(0, 4); 

    relatedGrid.innerHTML = ''; 

    finalSelection.forEach(product => {
        let imgUrl = "";
        if (product.media && product.media[0]) {
            imgUrl = product.media[0].url || product.media[0];
        } else if (product.images && product.images[0]) {
            imgUrl = product.images[0];
        } else {
            imgUrl = "placeholder.jpg";
        }

        const card = `
            <div class="product-card" style="cursor:pointer;" onclick="window.location.href='product.html?id=${product.id}'">
                <div class="product-img-box">
                    <img src="${imgUrl}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/150'">
                </div>
                <div class="product-info" style="text-align:center; padding:10px;">
                    <h3 style="font-size:13px; margin:5px 0; color:#fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${product.name}</h3>
                    <div class="price-box">
                        <span style="color: #d4af37; font-weight:bold;">${product.price} TK</span>
                    </div>
                </div>
            </div>
        `;
        relatedGrid.innerHTML += card;
    });
}
////end///

// ১. পেজ লোড হওয়া মাত্রই স্কেলিটন দেখাবে
function showSkeleton() {
    document.getElementById('pTitle').classList.add('skeleton');
    document.getElementById('pPrice').classList.add('skeleton');
    document.getElementById('mainImg').style.backgroundColor = '#2a2a2a';
    document.getElementById('mainImg').classList.add('skeleton');
}

// ২. ডাটা চলে আসলে স্কেলিটন সরিয়ে ফেলবে
function hideSkeleton() {
    document.getElementById('pTitle').classList.remove('skeleton');
    document.getElementById('pPrice').classList.remove('skeleton');
    document.getElementById('mainImg').classList.remove('skeleton');
}

// তোমার Firebase onValue ফাংশনের ভেতরে এটি ব্যবহার করো
if (productId) {
    showSkeleton(); // ডাটা আসার আগে শুরু করো
    
    const singleProductRef = ref(db, `products/${productId}`);
    onValue(singleProductRef, (snapshot) => {
        const product = snapshot.val();
        if (product) {
            hideSkeleton(); // ডাটা পাওয়ার পর বন্ধ করো
            
            // তোমার বাকি কোড (renderProductDetails)
            renderProductDetails(product);
        }
    });
}
///revew///
// --- রিভিউ সিস্টেম শুরু ---

let selectedRating = 5;
let reviewsLimit = 3; 
const ADMIN_EMAIL = "mdsaifhasan724317@gmail.com";
let globalReviewData = null; // ১. ডাটা মনে রাখার জন্য নতুন ভেরিয়েবল

// ১. ইমেজ স্লাইডার (Lightbox) লজিক
let currentImages = [];
let currentImgIndex = 0;

window.openSlider = function(images, index) {
    currentImages = images;
    currentImgIndex = index;
    let modal = document.getElementById('sliderModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'sliderModal';
        modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); display:flex; align-items:center; justify-content:center; z-index:10000;";
        document.body.appendChild(modal);
    }
    modal.style.display = 'flex';
    updateSliderContent();
};

function updateSliderContent() {
    const modal = document.getElementById('sliderModal');
    modal.innerHTML = `
        <button onclick="changeImg(-1)" style="position:absolute; left:20px; color:#fff; font-size:40px; background:none; border:none; cursor:pointer;">&#10094;</button>
        <img src="${currentImages[currentImgIndex]}" style="max-width:85%; max-height:85%; border-radius:8px; transition: 0.3s;">
        <button onclick="changeImg(1)" style="position:absolute; right:20px; color:#fff; font-size:40px; background:none; border:none; cursor:pointer;">&#10095;</button>
        <button onclick="document.getElementById('sliderModal').style.display='none'" style="position:absolute; top:20px; right:20px; color:#fff; font-size:30px; background:none; border:none; cursor:pointer;">&times;</button>
        <div style="position:absolute; bottom:20px; color:#aaa; font-family:sans-serif;">${currentImgIndex + 1} / ${currentImages.length}</div>
    `;
}

window.changeImg = function(n) {
    currentImgIndex = (currentImgIndex + n + currentImages.length) % currentImages.length;
    updateSliderContent();
};

// ২. ইমেজ কম্প্রেশন ফাংশন (তোমার আগের কোড)
async function compressImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                let width = img.width, height = img.height;
                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.6));
            };
        };
    });
}

// ৩. রেটিং সেট করা (তোমার আগের কোড)
window.setRating = function(n) {
    selectedRating = n;
    const stars = document.querySelectorAll('.star-input i');
    stars.forEach((star, index) => {
        star.style.color = (index < n) ? "#d4af37" : "#555";
        star.className = (index < n) ? "fas fa-star" : "far fa-star";
    });
};

// ৪. রিভিউ সাবমিট ফাংশন (তোমার আগের কোড)
window.submitReview = async function() {
    const textEl = document.getElementById('reviewText');
    const imageEl = document.getElementById('reviewImage');
    const text = textEl ? textEl.value.trim() : "";
    const user = typeof auth !== 'undefined' ? auth.currentUser : null;

    if (!text) return alert("দয়া করে কিছু লিখুন!");

    let uid = user ? user.uid : localStorage.getItem('review_user_id');
    if (!uid) {
        uid = 'guest_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('review_user_id', uid);
    }

    let compressedImages = [];
    if (imageEl && imageEl.files.length > 0) {
        const files = Array.from(imageEl.files).slice(0, 6); 
        for (let file of files) {
            const compressed = await compressImage(file);
            compressedImages.push(compressed);
        }
    }

    const reviewData = {
        userId: uid,
        name: user ? (user.displayName || "Verified Buyer") : "Customer",
        userPhoto: user ? (user.photoURL || "") : "https://cdn-icons-png.flaticon.com/512/149/149071.png",
        rating: selectedRating,
        text: text,
        images: compressedImages,
        timestamp: Date.now()
    };

    try {
        await push(ref(db, `reviews/${productId}`), reviewData);
        textEl.value = "";
        imageEl.value = "";
        alert("ধন্যবাদ! রিভিউ সফলভাবে জমা হয়েছে।");
    } catch (e) {
        console.error(e);
        alert("ভুল হয়েছে: ফায়ারবেস রুলস চেক করুন।");
    }
};

// ২. রেন্ডার করার জন্য নতুন ফাংশন (তোমার লুপের কোডটিই এখানে নিয়ে এসেছি)
function renderReviews() {
    const displayArea = document.getElementById('reviews-display-area');
    if (!displayArea || !globalReviewData) return;

    displayArea.innerHTML = "";
    const myId = (typeof auth !== 'undefined' && auth.currentUser) ? auth.currentUser.uid : localStorage.getItem('review_user_id');
    const isAdminSession = (typeof auth !== 'undefined' && auth.currentUser && auth.currentUser.email === ADMIN_EMAIL);

    const allReviews = Object.entries(globalReviewData).reverse();
    const visibleReviews = allReviews.slice(0, reviewsLimit);

    visibleReviews.forEach(([key, rev]) => {
        let stars = "";
        for (let i = 1; i <= 5; i++) {
            stars += `<i class="${i <= rev.rating ? 'fas' : 'far'} fa-star" style="color:#d4af37; font-size:11px;"></i>`;
        }

        let imageHtml = '';
        if (rev.images && rev.images.length > 0) {
            imageHtml = `<div style="display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap;">`;
            rev.images.forEach((img, index) => {
                const imagesData = JSON.stringify(rev.images).replace(/"/g, '&quot;');
                if (index < 3) {
                    imageHtml += `<img src="${img}" onclick="window.openSlider(${imagesData}, ${index})" style="width: 70px; height: 70px; object-fit: cover; border-radius: 6px; border: 1px solid #333; cursor:pointer;">`;
                } else if (index === 3) {
                    const remaining = rev.images.length - 3;
                    imageHtml += `
                        <div onclick="window.openSlider(${imagesData}, ${index})" style="position: relative; width: 70px; height: 70px; cursor:pointer;">
                            <img src="${img}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px; opacity: 0.5;">
                            <div style="position: absolute; top:0; left:0; width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:bold; font-size:14px; background: rgba(0,0,0,0.3); border-radius:6px;">+${remaining}</div>
                        </div>`;
                }
            });
            imageHtml += `</div>`;
        }

        const isOwner = (rev.userId === myId);
        const showDelete = isOwner || isAdminSession;

        const div = document.createElement('div');
        div.style.cssText = "background:#1a1a1a; padding:15px; border-radius:8px; margin-bottom:15px; border:1px solid #333;";
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="${rev.userPhoto}" style="width:30px; height:30px; border-radius:50%;">
                    <div>
                        <strong style="color:#fff; font-size:13px;">${rev.name}</strong>
                        <div>${stars}</div>
                    </div>
                </div>
                <small style="color:#555;">${new Date(rev.timestamp).toLocaleDateString()}</small>
            </div>
            <p style="color:#ccc; font-size:13px; margin:10px 0;">${rev.text}</p>
            ${imageHtml}
            <div style="display:flex; gap:15px; border-top:1px solid #222; padding-top:10px; margin-top:10px;">
                ${isOwner ? `<button onclick="window.editReview('${key}', \`${rev.text}\`)" style="color:#d4af37; background:none; border:none; cursor:pointer; font-size:11px;">Edit</button>` : ''}
                ${showDelete ? `<button onclick="window.deleteReview('${key}')" style="color:#ff4d4d; background:none; border:none; cursor:pointer; font-size:11px;">Delete</button>` : ''}
            </div>
        `;
        displayArea.appendChild(div);
    });

// See More এবং See Less বাটন লজিক
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = "display:flex; gap:10px; margin-top:10px;";

    // যদি আরও রিভিউ বাকি থাকে তবে See More দেখাবে
    if (allReviews.length > reviewsLimit) {
        const seeMoreBtn = document.createElement('button');
        seeMoreBtn.innerText = "See More Reviews";
        seeMoreBtn.style.cssText = "flex:1; background:none; border:1px solid #d4af37; color:#d4af37; padding:10px; border-radius:5px; cursor:pointer; font-weight:bold;";
        seeMoreBtn.onclick = () => {
            reviewsLimit += 5;
            renderReviews();
        };
        buttonContainer.appendChild(seeMoreBtn);
    }

    // যদি ৩টির বেশি রিভিউ বর্তমানে দেখা যায়, তবে See Less দেখাবে
    if (reviewsLimit > 3) {
        const seeLessBtn = document.createElement('button');
        seeLessBtn.innerText = "See Less";
        seeLessBtn.style.cssText = "width: 100px; background:none; border:1px solid #ff4d4d; color:#ff4d4d; padding:10px; border-radius:5px; cursor:pointer; font-weight:bold;";
        seeLessBtn.onclick = () => {
            reviewsLimit = 3; // আবার শুরুতে ফিরিয়ে নেবে
            renderReviews();
            // স্ক্রল করে রিভিউ সেকশনের উপরে নিয়ে যাওয়ার জন্য (ঐচ্ছিক)
            document.getElementById('reviews-display-area').scrollIntoView({ behavior: 'smooth' });
        };
        buttonContainer.appendChild(seeLessBtn);
    }

    if (buttonContainer.hasChildNodes()) {
        displayArea.appendChild(buttonContainer);
    }
}

// ৫. রিভিউ লোড এবং ডিসপ্লে 
if (typeof productId !== 'undefined') {
    onValue(ref(db, `reviews/${productId}`), (snapshot) => {
        globalReviewData = snapshot.val(); // ২. ডাটা গ্লোবাল ভেরিয়েবলে সেভ করা হলো
        renderReviews();
    });
}

// এডিট এবং ডিলিট লজিক
window.editReview = function(key, oldText) {
    const newText = prompt("আপনার রিভিউটি সংশোধন করুন:", oldText);
    if (newText && newText !== oldText) {
        update(ref(db, `reviews/${productId}/${key}`), { text: newText });
    }
};

window.deleteReview = function(key) {
    if (confirm("আপনি কি এটি ডিলিট করতে চান?")) {
        remove(ref(db, `reviews/${productId}/${key}`));
    }
};
// --- রিভিউ সিস্টেম শেষ ---