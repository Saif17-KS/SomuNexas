
window.openAddressModal = function() {
    // ফর্ম ক্লিয়ার করা যাতে নতুন অ্যাড্রেস যোগ করা যায়
    document.getElementById('new-addr-name').value = '';
    document.getElementById('new-addr-phone').value = '';
    document.getElementById('new-addr-full').value = '';
    document.getElementById('new-addr-email').value = '';
    delete document.getElementById('address-modal').dataset.editIndex;
    
    document.getElementById('address-modal').style.display = 'flex';
}

// অ্যাড্রেস পপ-আপ বন্ধ করার ফাংশন
window.closeAddressModal = function() {
    document.getElementById('address-modal').style.display = 'none';
}
document.addEventListener('DOMContentLoaded', () => {
    loadProfileData();
    renderAddressBook();
});

// ডাটাবেজ থেকে লেটেস্ট তথ্য এনে লোকাল স্টোরেজ আপডেট করা 
(async function syncProfile() {
    const userId = localStorage.getItem('userId');
    if (userId && window.db && window.ref && window.get) {
        try {
            const snapshot = await window.get(window.ref(window.db, 'users/' + userId));
            if (snapshot.exists()) {
                // ডাটাবেজের তথ্য দিয়ে লোকাল স্টোরেজ আপডেট করা হচ্ছে
                localStorage.setItem('currentUser', JSON.stringify(snapshot.val()));
                // তোমার বিদ্যমান ফাংশনটি আবার কল করা হচ্ছে যাতে স্ক্রিনে ডাটা বসে যায়
                if (typeof loadProfileData === "function") {
                    loadProfileData();
                }
            }
        } catch (e) {
            console.error("Sync failed", e);
        }
    }
})();

// ১. ডাটা লোড করা
function loadProfileData() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (!currentUser) {
        window.location.href = "login.html";
        return;
    }

    // আগের ফিল্ডগুলোর সাথে নতুন এই দুটি যোগ করুন
    document.getElementById('editContact').value = currentUser.phone || '';
    document.getElementById('editEmail').value = currentUser.email || '';
    
    // বাকি ফিল্ডগুলো (Name, Religion, etc.) আগের মতোই থাকবে
    document.getElementById('displayPic').src = currentUser.profilePic || 'https://via.placeholder.com/120';
    document.getElementById('editName').value = currentUser.name || '';
    document.getElementById('editReligion').value = currentUser.religion || 'Islam';
    document.getElementById('editCountry').value = currentUser.country || 'Bangladesh';
    document.getElementById('editAddress').value = currentUser.address || '';
    // আগের কোডগুলোর সাথে এগুলো যোগ করুন
    document.getElementById('editDOB').value = currentUser.dob || '';
    document.getElementById('editGender').value = currentUser.gender || 'Male';
}

// ২. ডাটা সেভ করা
window.saveProfile = async function() {
    let currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const tempPic = localStorage.getItem('tempProfilePic');

    if(tempPic) {
        currentUser.profilePic = tempPic;
        localStorage.removeItem('tempProfilePic');
    }

    // বাকি সব আগের মতো থাকবে...
    currentUser.name = document.getElementById('editName').value;
    currentUser.phone = document.getElementById('editContact').value;
    currentUser.email = document.getElementById('editEmail').value;
    currentUser.religion = document.getElementById('editReligion').value;
    currentUser.country = document.getElementById('editCountry').value;
    currentUser.address = document.getElementById('editAddress').value;
    currentUser.addressBook = JSON.parse(localStorage.getItem('tempAddressBook')) || currentUser.addressBook || [];
    // currentUser অবজেক্টে এই নতুন ভ্যালুগুলো যোগ করুন
    currentUser.dob = document.getElementById('editDOB').value;
    currentUser.gender = document.getElementById('editGender').value;
    const updatedUserFromStorage = JSON.parse(localStorage.getItem('currentUser')); currentUser.addressBook = updatedUserFromStorage.addressBook || [];

    if (window.db && window.ref && window.set) {
        try {
            await window.set(window.ref(window.db, 'users/' + currentUser.uid), currentUser);
            console.log("Profile data synced with Firebase!");
        } catch (err) {
            console.error("Firebase Sync Error:", err);
        }
    }

// ১. বর্তমানে লগইন করা ইউজারের ডাটা আপডেট
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    // ২. অ্যাডমিন প্যানেলের জন্য মেইন ইউজার লিস্ট আপডেট (এটিই সবচেয়ে গুরুত্বপূর্ণ)
    let allUsers = JSON.parse(localStorage.getItem('somunexus_users')) || [];
    
    // চেক করা হচ্ছে এই ইউজার আগে থেকে লিস্টে আছে কি না
    const index = allUsers.findIndex(u => u.uid === currentUser.uid);
    
    if (index !== -1) {
        allUsers[index] = currentUser; // আপডেট
    } else {
        allUsers.push(currentUser); // নতুন ইউজার যোগ
    }

    localStorage.setItem('somunexus_users', JSON.stringify(allUsers));
    alert("Profile Updated Successfully!");

}

function finishSaving(user) {
    // ১. currentUser আপডেট করা
    localStorage.setItem('currentUser', JSON.stringify(user));

    // ২. মেইন ইউজার লিস্টেও আপডেট করা (যাতে পরে লগইন করলে ডাটা হারানো না যায়)
    let allUsers = JSON.parse(localStorage.getItem('somunexus_users')) || [];
    const index = allUsers.findIndex(u => u.uid === user.uid || u.phone === user.phone);
    
    if (index !== -1) {
        allUsers[index] = user;
        localStorage.setItem('somunexus_users', JSON.stringify(allUsers));
    }

    alert("Profile Updated Successfully!");
    window.location.href = "index.html"; // আপডেট শেষে হোম পেজে নিয়ে যাবে
}

let cropper;
const uploadInput = document.getElementById('uploadPic');
const cropModal = document.getElementById('cropModal');
const cropImage = document.getElementById('cropImage');

// ১. ফাইল সিলেক্ট করলে ক্রপার ওপেন হবে
uploadInput.addEventListener('change', function(e) {
    const files = e.target.files;
    if (files && files.length > 0) {
        const reader = new FileReader();
        reader.onload = function(event) {
            cropImage.src = event.target.result;
            cropModal.style.display = 'block';
            
            if (cropper) cropper.destroy();
            cropper = new Cropper(cropImage, {
                aspectRatio: 1, // গোল ছবি বা স্কয়ারের জন্য ১:১
                viewMode: 1,
                background: false
            });
        };
        reader.readAsDataURL(files[0]);
    }
});

// ২. ক্রপ করে সেভ করা
function cropAndSave() {
    const canvas = cropper.getCroppedCanvas({
        width: 300,
        height: 300
    });
    
    const croppedURL = canvas.toDataURL('image/jpeg');
    document.getElementById('displayPic').src = croppedURL;
    
    // লোকাল ডাটাতে আপডেট রাখা (সেভ বাটনে ক্লিক করলে পার্মানেন্টলি সেভ হবে)
    let currentUser = JSON.parse(localStorage.getItem('currentUser'));
    currentUser.profilePic = croppedURL;
    localStorage.setItem('tempProfilePic', croppedURL); // টেম্পোরারি সেভ
    
    closeModal();
}

function closeModal() {
    cropModal.style.display = 'none';
    if (cropper) cropper.destroy();
}
//////
function openSection(sectionId) {
    // সব সেকশন লুকানো (এখানে .tab-content ক্লাসটিও যোগ করা হয়েছে যাতে Orders সেকশন হাইড হয়)
    document.querySelectorAll('.profile-section, .tab-content').forEach(sec => sec.style.display = 'none');
    
    // সব ট্যাবের এক্টিভ ক্লাস রিমুভ করা
    document.querySelectorAll('.p-tab').forEach(tab => tab.classList.remove('active'));
    
    // সিলেক্ট করা সেকশন দেখানো
    document.getElementById(sectionId).style.display = 'block';
    
    // যে বাটনে ক্লিক করা হয়েছে তাকে এক্টিভ করা
    if(event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }

    // অর্ডার হিস্ট্রি ট্যাব হলে ডাটাবেস থেকে ডাটা লোড হবে
    if (sectionId === 'order-history') { 
        loadUserOrders(); 
    }
    
    // উইশলিস্ট ট্যাব হলে উইশলিস্ট লোড হবে
    if (sectionId === 'wishlist') {
        displayWishlist(); // আপনার নিচের দিকে থাকা উইশলিস্ট ফাংশনটি কল হবে
    }

    // --- নিচে আপনার loadWishlist ফাংশনটি যেমন ছিল তেমনই আছে ---
    function loadWishlist() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const wishlistContainer = document.getElementById('wishlist-items');
        
        if (!currentUser.wishlist || currentUser.wishlist.length === 0) {
            wishlistContainer.innerHTML = "<p style='color:#666;'>Your wishlist is empty.</p>";
            return;
        }

        wishlistContainer.innerHTML = currentUser.wishlist.map(item => `
            <div class="wish-item" style="background:#1a1a1a; padding:10px; border-radius:10px; border:1px solid #333;">
                <img src="${item.image}" style="width:100%; height:100px; object-fit:cover; border-radius:5px;">
                <h4 style="font-size:14px; margin:10px 0;">${item.name}</h4>
                <p style="color:#d4af37;">${item.price} TK</p>
                <button onclick="removeFromWishlist('${item.id}')" style="background:none; border:none; color:red; cursor:pointer; font-size:12px;">Remove</button>
            </div>
        `).join('');
    }
}

function loadOrders() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const orderList = document.getElementById('order-list');
    
    if(currentUser.orders && currentUser.orders.length > 0) {
        orderList.innerHTML = currentUser.orders.map(order => `
            <div style="border:1px solid #222; padding:10px; margin-bottom:10px; text-align:left; border-radius:5px;">
                <p>Order ID: ${order.id} | Date: ${order.date}</p>
                <p style="color:#d4af37;">Total: $${order.total}</p>
            </div>
        `).join('');
    }
}
//////
window.loadWishlist = function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const container = document.getElementById('wishlist-items');
    
    if (!currentUser || !currentUser.wishlist || currentUser.wishlist.length === 0) {
        container.innerHTML = "<p>Your wishlist is empty.</p>";
        return;
    }

    container.innerHTML = currentUser.wishlist.map(item => `
        <div class="wish-item" style="border: 1px solid #333; padding: 10px; border-radius: 10px; background: #111;">
            <img src="${item.image}" style="width: 100%; height: 120px; object-fit: cover;">
            <h4>${item.name}</h4>
            <p style="color: #d4af37;">${item.price} TK</p>
            <button onclick="removeFromWishlist('${item.id}')" style="color: red; background: none; border: none; cursor: pointer;">Remove</button>
        </div>
    `).join('');
}
// উইশলিস্ট রেন্ডার করার ফাংশন
window.displayWishlist = function() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const container = document.getElementById('wishlist-items'); // নিশ্চিত করুন এই ID টি আপনার HTML এ আছে
    
    if (!container) return;

    if (!currentUser || !currentUser.wishlist || currentUser.wishlist.length === 0) {
        container.innerHTML = `<p style="color:#666; padding:20px;">No favorite items yet.</p>`;
        return;
    }

    // উইশলিস্টের ডাটা দিয়ে HTML তৈরি
    container.innerHTML = currentUser.wishlist.map(item => `
        <div class="wish-card" style="background:#1a1a1a; border:1px solid #333; padding:15px; border-radius:10px; text-align:center;">
            <img src="${item.image}" style="width:100%; height:120px; object-fit:cover; border-radius:5px;">
            <h4 style="color:white; margin:10px 0; font-size:14px;">${item.name}</h4>
            <p style="color:#d4af37; font-weight:bold;">${item.price} TK</p>
            <button onclick="removeFromWishlist('${item.id}')" style="background:none; border:none; color:#ff4d4d; cursor:pointer; font-size:12px; margin-top:5px;">
                <i class="fas fa-trash"></i> Remove
            </button>
        </div>
    `).join('');
}

// উইশলিস্ট থেকে রিমুভ করার ফাংশন
window.removeFromWishlist = function(id) {
    let currentUser = JSON.parse(localStorage.getItem('currentUser'));
    currentUser.wishlist = currentUser.wishlist.filter(item => item.id !== id);
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    displayWishlist(); // সাথে সাথে পেজ আপডেট
    alert("Removed from Favorites!");
}
///////
window.updatePassword = function() {
    const newPass = document.getElementById('newPass').value;
    if (newPass.length < 6) {
        alert("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে!");
        return;
    }

    let currentUser = JSON.parse(localStorage.getItem('currentUser'));
    currentUser.password = newPass; 

    // ডাটা সেভ এবং সিঙ্ক করা
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateMainUserList(currentUser); 
    alert("পাসওয়ার্ড সফলভাবে আপডেট হয়েছে!");
};
////order///
async function loadUserOrders() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userId = (currentUser && currentUser.uid) ? currentUser.uid : localStorage.getItem('userId');
    const container = document.getElementById('orderListContainer');

    if (!userId) {
        container.innerHTML = '<p style="color: red;">User ID not found!</p>';
        return;
    }

    try {
        const snapshot = await window.get(window.ref(window.db, 'orders'));
        container.innerHTML = '';

        if (snapshot.exists()) {
            const data = snapshot.val();
            let hasOrder = false;

            for (let id in data) {
                const order = data[id];
                
                if (order.userId === userId) {
                    hasOrder = true;
                    
                    // --- নতুন অংশ: পণ্যগুলোর (products) লিস্ট তৈরি করা ---
let productsListHTML = '';
if (order.products) {
    Object.values(order.products).forEach(prod => {
        // ডাটাবেস অনুযায়ী সঠিক মিডিয়া চেক (pMedia অথবা media)
        const mediaSource = prod.pMedia || prod.media || prod.image || '';
        const productImage = Array.isArray(mediaSource) ? mediaSource[0] : mediaSource;

    if (Array.isArray(mediaSource) && mediaSource.length > 0) {
        productImage = mediaSource[0]; // তালিকার প্রথম ছবিটি নিন
    } else if (typeof mediaSource === 'string' && mediaSource !== '') {
        productImage = mediaSource; // যদি একটিই সরাসরি লিঙ্ক থাকে
    }

productsListHTML += `
            <div style="display: flex; align-items: center; gap: 12px; margin: 10px 0; background: #1a1a1a; padding: 10px; border-radius: 8px; border: 1px solid #222;">
                ${productImage ? 
                    `<img src="${productImage}" style="width: 55px; height: 55px; object-fit: cover; border-radius: 6px;">` : 
                    `<div style="width: 55px; height: 55px; background: #333; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #666;">No Pic</div>`
                }
                <div>
                    <p style="margin: 0; font-size: 14px; color: #fff; font-weight: 600;">${prod.name || 'Product'}</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #d4af37;">${prod.price || '0'} TK x ${prod.quantity || 1}</p>
                </div>
            </div>
        `;
    });
                    }
                    // ------------------------------------------------

                    const orderTimeStr = order.orderTime; // যেমন: "2/18/2026, 4:48:57 PM"
                    const orderDate = new Date(orderTimeStr);
                    const now = new Date();
                    const diffInMinutes = (now - orderDate) / (1000 * 60);
                    
                    const canCancel = !isNaN(diffInMinutes) && diffInMinutes <= 60 && order.status === 'Pending';

// ট্র্যাকিং লজিক (তোমার কোড ঠিক রেখেই)
const status = order.status || 'Pending';
let progressWidth = "0%";
let s1="active", s2="", s3="", s4=""; // s1 সব সময় এক্টিভ (Pending)

if(status === 'Confirmed') { progressWidth = "33%"; s2="active"; }
else if(status === 'Shipped') { progressWidth = "66%"; s2="active"; s3="active"; }
else if(status === 'Out for Delivery') { progressWidth = "85%"; s2="active"; s3="active"; } // নতুন স্ট্যাটাস
else if(status === 'Delivered') { progressWidth = "100%"; s2="active"; s3="active"; s4="active"; }

const trackingHTML = `
    <div class="track">
        <div class="progress-line" style="width: ${progressWidth}"></div>
        <div class="track-step ${s1}"><i class="fas fa-box"></i><span>Pending</span></div>
        <div class="track-step ${s2}"><i class="fas fa-check"></i><span>Confirmed</span></div>
        <div class="track-step ${s3}"><i class="fas fa-truck"></i><span>Shipped</span></div>
        <div class="track-step ${s4}"><i class="fas fa-home"></i><span>Delivered</span></div>
    </div>
`;

                    const cardHTML = `
                        <div class="order-card" style="background: #111; border: 1px solid #333; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <p style="margin: 0; color: #d4af37; font-weight: bold;">Order ID: ${id}</p>
                                    <small style="color: #888;">${order.orderTime || 'Date Not Available'}</small>
                                </div>
                                <span style="background: ${order.status === 'Cancelled' ? '#ff4d4d' : '#d4af37'}; color: black; padding: 3px 10px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                                    ${order.status || 'Pending'}
                                </span>
                            </div>

                            ${trackingHTML} <hr style="border: 0.5px solid #222; margin: 10px 0;">
                            ${productsListHTML}
                            <div class="order-items-container">
                                ${productsListHTML}
                            </div>

                            <p style="color: #eee; margin: 10px 0 5px 0;">Total Amount: <span style="color: #d4af37;">${order.totalAmount || '0 TK'}</span></p>
                            
                            ${canCancel ? 
                                `<button onclick="cancelMyOrder('${id}')" style="background: #ff4d4d; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 10px; font-weight: bold; width: 100%;">Cancel Order</button>` 
                                : (order.status === 'Cancelled' ? 
                                    `<p style="color: #ff4d4d; font-size: 13px; margin-top: 10px; font-weight: bold;">✕ Order Cancelled</p>` : 
                                    `<p style="color: #555; font-size: 12px; margin-top: 10px;">🕒 Cancellation period expired</p>`)
                            }
                        </div>
                    `;
                    container.innerHTML += cardHTML;
                }
            }
            if (!hasOrder) container.innerHTML = '<p style="color: #888; text-align: center;">No orders found for your ID.</p>';
        }
    } catch (e) {
        console.error(e);
        container.innerHTML = '<p style="color: red;">Error loading orders.</p>';
    }
}

let lastStatusMap = {}; // আগের স্ট্যাটাসগুলো মনে রাখার জন্য
let isFirstLoad = true; 

const currentUser = JSON.parse(localStorage.getItem('currentUser'));
const myId = (currentUser && currentUser.uid) ? currentUser.uid : localStorage.getItem('userId');

if (myId) {
    // রিট্রাই করার জন্য একটি ফাংশন
    const setupOrderListener = () => {
        if (typeof window.ref === 'function' && window.db) {
            const statusRef = window.ref(window.db, 'orders');
            window.onValue(statusRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    for (let id in data) {
                        const order = data[id];
                        if (order.userId === myId) {
                            const currentStatus = order.status || 'Pending';
                            if (!isFirstLoad && lastStatusMap[id] && lastStatusMap[id] !== currentStatus) {
                                if (window.showStatusNotification) {
                                    window.showStatusNotification(`অর্ডার #${id.slice(-5)} এখন ${currentStatus}!`);
                                }
                            }
                            lastStatusMap[id] = currentStatus;
                        }
                    }
                }
                isFirstLoad = false; 
            });
        } else {
            // পেজ রিফ্রেশ না করে জাস্ট ৫০০ মিলিসেকেন্ড পর আবার ট্রাই করবে
            setTimeout(setupOrderListener, 500); 
        }
    };

    setupOrderListener(); // ফাংশনটি কল করা হলো
}
// তোমার নোটিফিকেশন ফাংশনটি (যা আগে ছিল ঠিক তেমনই থাকবে)
window.showStatusNotification = function(message) {
    const noti = document.getElementById('custom-notification');
    const msgBox = document.getElementById('noti-message');
    
    if(noti && msgBox) {
        msgBox.innerText = message;
        noti.classList.add('show');
        setTimeout(() => {
            noti.classList.remove('show');
        }, 5000);
    }
};

// ক্যানসেল করার ফাংশন
async function cancelMyOrder(orderId) {
    if (confirm("আপনি কি নিশ্চিত যে অর্ডারটি ক্যানসেল করতে চান?")) {
        try {
            await window.update(window.ref(window.db, 'orders/' + orderId), {
                status: 'Cancelled'
            });
            alert("Order Cancelled!");
            loadUserOrders(); // লিস্ট রিফ্রেশ করা
        } catch (e) {
            alert("Error: " + e.message);
        }
    }
}

////passwordupdate////
// ১. পাসওয়ার্ড দেখা বা লুকানোর লজিক (Eye Icon Toggle)
document.getElementById('toggleCurrPass').addEventListener('click', function() {
    const passInput = document.getElementById('currPass');
    const type = passInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passInput.setAttribute('type', type);
    this.classList.toggle('fa-eye-slash');
});

document.getElementById('toggleNewPass').addEventListener('click', function() {
    const passInput = document.getElementById('newPass');
    const type = passInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passInput.setAttribute('type', type);
    this.classList.toggle('fa-eye-slash');
});

// ২. সংশোধিত পাসওয়ার্ড আপডেট ফাংশন

// প্রোফাইল পেজের পাসওয়ার্ড আপডেট ফাংশন
window.handleUpdatePassword = async function() {
    // ১. Firebase পুরোপুরি না আসা পর্যন্ত অপেক্ষা (সর্বোচ্চ ৩ সেকেন্ড)
    if (!window.auth || !window.auth.currentUser) {
        let count = 0;
        while (!window.auth?.currentUser && count < 30) {
            await new Promise(r => setTimeout(r, 100));
            count++;
        }
    }

    const user = window.auth?.currentUser;
    if (!user) {
        alert("Account sync error. Please login again or refresh.");
        return;
    }

    const currPass = document.getElementById('currPass').value;
    const newPass = document.getElementById('newPass').value;

    if (!currPass || !newPass) {
        alert("Please fill in both fields.");
        return;
    }

    try {
        const credential = window.EmailAuthProvider.credential(user.email, currPass);
        await window.reauthenticateWithCredential(user, credential);
        await window.firebaseUpdatePassword(user, newPass);
        
        alert("Success! Password updated.");
        document.getElementById('currPass').value = "";
        document.getElementById('newPass').value = "";
    } catch (error) {
        console.error(error);
        alert("Error: " + error.message);
    }
};
window.logoutUser = function() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userId');
    alert("Logged out successfully!");
    window.location.href = 'index.html'; // লগআউট করে মেইন পেজে পাঠিয়ে দেবে
};

// অ্যাড্রেস পপ-আপ খোলার ফাংশন

// নতুন অ্যাড্রেস সেভ করা অথবা এডিট করা
// ১. ফাংশনটিকে window এর সাথে জুড়ে দাও
window.saveAddressToBook = function() {
    const name = document.getElementById('new-addr-name').value;
    const phone = document.getElementById('new-addr-phone').value;
    const addr = document.getElementById('new-addr-full').value;
    const email = document.getElementById('new-addr-email').value;

    if(!name || !phone || !addr) return alert("সবগুলো বক্স পূরণ করুন!");

    // currentUser ডাটা ঠিকভাবে আনা
    let currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
    if (!currentUser.addressBook) currentUser.addressBook = [];

    const modal = document.getElementById('address-modal');
    const editIndex = modal.dataset.editIndex;
    
    const addressData = {
        name: name,
        phone: phone,
        address: addr,
        email: email || '',
        id: (editIndex !== undefined && editIndex !== "") ? currentUser.addressBook[editIndex].id : Date.now()
    };

    if (editIndex !== undefined && editIndex !== "") {
        currentUser.addressBook[editIndex] = addressData;
        delete modal.dataset.editIndex; 
    } else {
        currentUser.addressBook.push(addressData);
    }

    // লোকাল স্টোরেজে সেভ
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    alert("Address saved to list! Now click 'UPDATE PROFILE' to save permanently.");
    
    // মডাল বন্ধ করা এবং লিস্ট আপডেট করা
    window.closeAddressModal();
    window.renderAddressBook(); 
}

// সেভ করা অ্যাড্রেসগুলো স্ক্রিনে দেখানো (এডিট ও ডিলিট বাটনসহ)
window.renderAddressBook = function() {
    let currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const container = document.getElementById('saved-address-list');
    
    if(!container) return;
    
    // ডাটা না থাকলে মেসেজ দেখানো
    if(!currentUser || !currentUser.addressBook || currentUser.addressBook.length === 0) {
        container.innerHTML = '<p style="color: #666; font-size: 12px;">No addresses saved yet.</p>';
        return;
    }
    
    container.innerHTML = currentUser.addressBook.map((item, index) => `
        <div style="background: #1a1a1a; padding: 12px; border-radius: 8px; border: 1px solid #333; border-left: 3px solid #d4af37; margin-bottom: 10px; position: relative;">
            <p style="color: #fff; font-size: 13px; margin: 0; font-weight: bold;">${item.name}</p>
            <p style="color: #aaa; font-size: 11px; margin: 5px 0;">${item.phone} | ${item.address}</p>
            
            <div style="position: absolute; top: 10px; right: 10px; display: flex; gap: 10px;">
                <span onclick="window.editAddress(${index})" style="color: #d4af37; cursor: pointer; font-size: 12px;"><i class="fas fa-edit"></i></span>
                <span onclick="window.deleteAddress(${index})" style="color: #ff4d4d; cursor: pointer; font-size: 12px;"><i class="fas fa-trash"></i></span>
            </div>
        </div>
    `).join('');
}

// অ্যাড্রেস এডিট করার ফাংশন
window.editAddress = function(index) {
    let currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const item = currentUser.addressBook[index];

    document.getElementById('new-addr-name').value = item.name;
    document.getElementById('new-addr-phone').value = item.phone;
    document.getElementById('new-addr-full').value = item.address;
    document.getElementById('new-addr-email').value = item.email;

    document.getElementById('address-modal').dataset.editIndex = index;
    document.getElementById('address-modal').style.display = 'flex';
}

// অ্যাড্রেস ডিলিট করার ফাংশন
window.deleteAddress = function(index) {
    if(confirm("Are you sure you want to delete this address?")) {
        let currentUser = JSON.parse(localStorage.getItem('currentUser'));
        currentUser.addressBook.splice(index, 1);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        renderAddressBook();
    }
}

// পেজ লোড হলে অ্যাড্রেস বুক দেখানো (রিফ্রেশ সমস্যা সমাধান)
document.addEventListener('DOMContentLoaded', renderAddressBook);
