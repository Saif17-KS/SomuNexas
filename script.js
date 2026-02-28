import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, set, onValue, update, remove, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
// কনফিগ আগেরটাই থাকবে
const firebaseConfig = {
    apiKey: "AIzaSyDNv18tFenJP9XpyL7cr9BaA3vg-gLUC3U",
    authDomain: "somunexas.firebaseapp.com",
    projectId: "somunexas",
    databaseURL: "https://somunexas-default-rtdb.firebaseio.com",
    storageBucket: "somunexas.firebasestorage.app",
    messagingSenderId: "880413975961",
    appId: "1:880413975961:web:838932e24b0644473b1f08"
};
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);
const auth = getAuth(app); // এটিই আসল যা মিস হচ্ছিল
// সবগুলোকে গ্লোবাল উইন্ডোতে এক্সপোর্ট করা
window.auth = auth;
window.EmailAuthProvider = EmailAuthProvider;
window.reauthenticateWithCredential = reauthenticateWithCredential;
window.firebaseUpdatePassword = updatePassword; 
window.db = db;
window.ref = ref;
window.get = get;
window.set = set;
window.update = update;
window.onValue = onValue;

///owner use site code no use customer////
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // এখানে তোমার নিজের ইমেইলটি বসাও
        if (user.email !== "mdsaifhasan7243@gmail.com") {
            alert("আপনি এই পেজ দেখার অনুমতি নেই!");
            window.location.href = "index.html"; // সাধারণ কাস্টমার হলে বের করে দেবে
        }
    } else {
        // যদি কেউ লগইন না করেই ঢোকে
        window.location.href = "login.html";
    }
});
///End////


// এই কোডটি তোমার ফাইলের একদম শেষে অথবা Firebase initialization এর পরে বসাও
const productsRefForUI = ref(db, 'products');
onValue(productsRefForUI, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        // রিয়েল-টাইম ডাটা গ্লোবাল ভেরিয়েবলে সেট করা
        window.products = Object.keys(data).map(key => ({
            ...data[key],
            fbKey: key 
        }));
        
        products = window.products; // সার্চ ফাংশন ডাটা পায়
        if (typeof products !== 'undefined') {
         products = window.products; // যাতে সার্চের products ভ্যারিয়েবল আপডেট হয়
        }
        const currentProducts = window.products;

        // এটিই মূল সমাধান: ডাটা আসার সাথে সাথে ফাংশনগুলোকে কল করা
        if (typeof window.displayShopProducts === "function") {
            window.displayShopProducts();
        }
        if (typeof window.displayAdminProducts === "function") {
            window.displayAdminProducts();
        }
        console.log("Real-time products updated!");
    }
});

// ৩. অর্ডার সাবমিট করার ফাংশন (উইন্ডো অবজেক্টে রাখা হয়েছে যাতে HTML থেকে কাজ করে)
window.submitOrder = function() {
    // ইনপুট ফিল্ড থেকে ডাটা নেওয়া
    const name = document.getElementById('order-name').value;
    const phone = document.getElementById('order-phone').value;
    const address = document.getElementById('order-address').value;
    const email = document.getElementById('order-email').value;
    const total = document.getElementById('selected-total-display').innerText;

    if (!name || !phone || !address) {
        alert("দয়া করে নাম, ফোন এবং ঠিকানা সঠিকভাবে লিখুন!");
        return;
    }

    // কার্ট থেকে সিলেক্ট করা প্রোডাক্টগুলো নেওয়া
    const checkboxes = document.querySelectorAll('.item-checkbox:checked');
    const orderedItems = [];
    checkboxes.forEach(cb => {
        const itemContainer = cb.closest('.cart-item');
        if (itemContainer) {
            orderedItems.push({
                name: itemContainer.querySelector('h4').innerText,
                price: itemContainer.querySelector('p').innerText
            });
        }
    });

    const newOrder = {
        customerName: name,
        customerPhone: phone,
        deliveryAddress: address,
        customerEmail: email,
        totalAmount: total,
        products: orderedItems,
        orderTime: new Date().toLocaleString(),
        status: "Pending"
    };

    // Firebase-এ ডাটা পাঠানো (এটিই আপনার মিসিং ছিল)
    const ordersRef = ref(db, 'orders'); // 'db' আপনার কোডের শুরুতে ডিফাইন করা আছে
    push(ordersRef, newOrder)
        .then(() => {
            alert("অর্ডার সফলভাবে Firebase-এ জমা হয়েছে!");
            document.getElementById('checkout-modal').style.display = 'none';
            // কার্ট আপডেট করা (ঐচ্ছিক)
            window.cart = [];
            set(ref(db, 'userCarts/' + userId), []);
        })
        .catch((error) => {
            console.error("Firebase Error:", error);
            alert("Firebase-এ ডাটা পাঠাতে সমস্যা হয়েছে: " + error.message);
        });
};

// ৪. প্রোডাক্ট লোড করার কোড (যাতে প্রোডাক্ট না হারায়)
// ৪. প্রোডাক্ট লোড করার কোড (আপনার অরিজিনাল ফার্স্ট ডিজাইন রিস্টোর)
// ৪. প্রোডাক্ট লোড করার কোড (Design Restore + Stock Check)
const productsRef = ref(db, 'products');

onValue(productsRef, (snapshot) => {
    if (snapshot.exists()) {
        const data = snapshot.val();
        const productContainer = document.getElementById('product-container'); 
        const adminContainer = document.getElementById('admin-product-list'); 
        
        if (data) {
            // ১. ডাটা প্রসেসিং
            window.products = Object.keys(data).map(key => ({ ...data[key], fbKey: key }));
            const currentProducts = window.products;

            // ২. শপ পেজের জন্য ডিসপ্লে
            if (productContainer) {
                productContainer.innerHTML = ''; 
                currentProducts.forEach((product, index) => {
                    const pName = product.name || 'Exclusive Product';
                    const pPrice = product.currentPrice || product.price || '0';
                    let pImg = 'https://via.placeholder.com/150';
                    if (product.images && product.images[0]) pImg = product.images[0];
                    else if (product.media && product.media[0]) pImg = product.media[0].url;

                    // স্টক চেক লজিক
                    const stockVal = (product.stock !== undefined && product.stock !== null) ? parseInt(product.stock) : 0;
                    const isOutOfStock = stockVal <= 0;
                    
                    const cartBtnHTML = isOutOfStock 
                        ? `<button class="out-of-stock-btn" disabled style="background: #444; color: #888; cursor: not-allowed; border: none; flex: 1; padding: 10px; border-radius: 5px;">Out of Stock</button>` 
                        : `<button class="add-to-cart-btn" onclick="addToCart('${pName}', '${pPrice}', '${pImg}', '${product.id}', ${stockVal})">Add to Cart</button>`;

                    productContainer.innerHTML += `
                    <div class="product-item">
                        <div class="product-card">
                            <div class="product-image" onclick="openProductModal(${index})">
                                <img src="${pImg}" alt="${pName}">
                            </div>
                            <div class="product-info">
                                <h3 class="product-title">${pName}</h3>
                                <div class="price-container">
                                    <span class="current-price">${pPrice} TK</span>
                                </div>
                                <div class="button-group">
                                    <button class="view-btn" onclick="openProductModal(${index})">VIEW</button>
                                    ${cartBtnHTML}
                                </div>
                            </div>
                        </div>
                    </div>`;
                });
            }

            // ৩. অ্যাডমিন পেজের জন্য ডিসপ্লে
            if (adminContainer) {
                adminContainer.innerHTML = '<h3>Manage Products</h3>';
                currentProducts.forEach((product, index) => {
                    adminContainer.innerHTML += `
                    <div class="admin-item" style="display:flex; justify-content:space-between; align-items:center; background:#1a1a1a; padding:15px; margin-bottom:10px; border:1px solid #d4af37; border-radius:8px;">
                        <span style="color:white;">${product.name} - ${pPrice} TK</span>
                        <div>
                            <button onclick="editProduct(${index})" style="background:#d4af37; border:none; padding:8px 15px; border-radius:5px; cursor:pointer; font-weight:bold; margin-right:5px;">Edit</button>
                            <button onclick="deleteProduct('${product.fbKey}')" style="background:#ff4d4d; color:white; border:none; padding:8px 15px; border-radius:5px; cursor:pointer;">Delete</button>
                        </div>
                    </div>`;
                });
            }
            console.log("শপ এবং অ্যাডমিন দুই জায়গাতেই ডাটা আপডেট হয়েছে!");
        }
    }
}, (error) => {
    console.error("Firebase Error:", error);
});

function checkUserStatus() {
    const userSection = document.getElementById('user-profile-section');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    // যদি পেজে userSection থাকে তবেই কাজ করবে
    if (userSection && currentUser) {
        userSection.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; cursor: pointer;" onclick="window.location.href='profile.html'">
                <img src="${currentUser.profilePic || 'https://via.placeholder.com/40'}" 
                     style="width: 35px; height: 35px; border-radius: 50%; border: 1px solid #d4af37; object-fit: cover;">
                
            </div>
        `;
    }
}

// লগআউট ফাংশন
window.logoutUser = function() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userId');
    alert("Logged out successfully!");
    location.reload(); // পেজ রিফ্রেশ করে লগইন বাটন ফিরিয়ে আনা
};

//////
// পেজ লোড হলে এই ফাংশনটি কল হবে
document.addEventListener('DOMContentLoaded', () => {
    renderNavbar();
});

function renderNavbar() {
    const loginNavBtn = document.getElementById('login-nav-btn'); // আপনার LOGIN বাটনের আইডি
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (currentUser && loginNavBtn) {
        // লগইন করা থাকলে LOGIN বাটন সরিয়ে প্রোফাইল দেখাবে
        const navParent = loginNavBtn.parentElement;
        loginNavBtn.remove(); // আগের বাটনটি মুছে ফেলা

        const profileDiv = document.createElement('div');
        profileDiv.style = "display: flex; align-items: center; gap: 10px; cursor: pointer;";
        profileDiv.innerHTML = `
            <img src="${currentUser.profilePic || 'https://via.placeholder.com/35'}" 
                 style="width: 35px; height: 35px; border-radius: 50%; border: 1px solid #d4af37;"
                 onclick="window.location.href='profile.html'">
            <span style="color: white; font-weight: bold;" onclick="window.location.href='profile.html'">
                ${currentUser.name.split(' ')[0]}
            </span>
            <button onclick="logoutUser()" style="background: none; border: none; color: #ff4d4d; cursor: pointer; font-size: 12px;">Logout</button>
        `;
        navParent.appendChild(profileDiv);
    }
}

// লগআউট ফাংশন
window.logoutUser = function() {
    localStorage.clear();
    alert("Logged out successfully!");
    window.location.href = "index.html";
};
/////////end

// ১. ডাটা লোড ও গ্লোবাল ভ্যারিয়েবল
let products = JSON.parse(localStorage.getItem('somu_nexus_products')) || [];
let cart = [];

// ২. ফাইল কনভার্টার (Base64)
const convertBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.readAsDataURL(file);
        fileReader.onload = () => resolve(fileReader.result);
        fileReader.onerror = (error) => reject(error);
    });
};

// ১. প্রোডাক্ট পাবলিশ বা আপডেট করা
window.publishProduct = async function() {
    const editId = document.getElementById('editProductId').value; 
    const name = document.getElementById('pName').value;
    const oldPrice = document.getElementById('pOldPrice').value; 
    const currentPrice = document.getElementById('pPrice').value; 
    const desc = document.getElementById('pDesc').value;
    const mediaFiles = document.getElementById('pMedia').files;
    const category = document.getElementById('pCategory').value; 
    const longDesc = document.getElementById('pLongDesc').value; 
    const descMediaFiles = document.getElementById('pDescMedia').files; 
    const pWarranty = document.getElementById('productWarranty').value; 
    const stock = document.getElementById('pStock').value; 
    const insideDhaka = document.getElementById('p-inside-dhaka').value || 60;
    const outsideDhaka = document.getElementById('p-outside-dhaka').value || 120;

    // ১. ভ্যালিডেশন (আগের মতোই)
    if (!name || !currentPrice || category === 'all') {
        alert("দয়া করে নাম, দাম, স্টক এবং ক্যাটাগরি সিলেক্ট করুন!");
        return;
    }

    // এডিট মোড হলে পুরনো ডাটা খুঁজে বের করা (যাতে ইমেজ বা স্টক না হারায়)
    const productToUpdate = (window.products || products).find(p => p.id == editId);

    // ২. মেইন ইমেজ প্রসেসিং (নতুন না দিলে পুরনোটা থাকবে)
    let mediaArray = [];
    if (mediaFiles.length > 0) {
        for (let file of mediaFiles) {
            const base64 = await convertBase64(file);
            mediaArray.push({ type: file.type.startsWith('video') ? 'video' : 'image', url: base64 });
        }
    } else if (productToUpdate) {
        mediaArray = productToUpdate.media || [];
    }

    // ৩. ডেসক্রিপশন ইমেজ প্রসেসিং
    let descMediaArray = [];
    if (descMediaFiles.length > 0) {
        for (let file of descMediaFiles) {
            const base64 = await convertBase64(file);
            descMediaArray.push(base64);
        }
    } else if (productToUpdate) {
        descMediaArray = productToUpdate.descriptionImages || [];
    }

    // ৪. ডাটাবেজ অবজেক্ট (আপনার অরিজিনাল স্ট্রাকচার অক্ষুণ্ণ রাখা হয়েছে)
    const productData = {
        id: editId ? Number(editId) : Date.now(),
        name: name,
        oldPrice: oldPrice,
        currentPrice: currentPrice, 
        price: currentPrice,         
        insideDhaka: parseInt(insideDhaka),
        outsideDhaka: parseInt(outsideDhaka),
        details: desc,             
        desc: desc,                
        category: category,
        images: mediaArray.map(m => m.url), 
        media: mediaArray,          
        longDescription: longDesc, 
        descriptionImages: descMediaArray,
        warranty: pWarranty || "No Official Warranty",
        stock: (stock !== "" && stock !== null) ? parseInt(stock) : 0 
    };

    if (editId) {
        // ৫. এডিট মোড: Firebase আপডেট (এখানে update ব্যবহার করা হয়েছে যাতে ডাটা না হারায়)
        if (productToUpdate && productToUpdate.fbKey) {
            const productRef = ref(db, 'products/' + productToUpdate.fbKey);
            update(productRef, productData)
                .then(() => {
                    alert("Product Updated Successfully!");
                    // ফর্ম রিসেট করা
                    document.getElementById('editProductId').value = '';
                    document.getElementById('productForm').reset();
                    document.querySelector('.publish-btn').innerText = "PUBLISH PRODUCT";
                })
                .catch(err => alert("Update Error: " + err.message));
        } else {
            alert("Error: Product Key Not Found!");
        }
    } else {
        // ৬. নতুন প্রোডাক্ট পাবলিশ (আপনার অরিজিনাল লজিক)
        push(ref(db, 'products'), productData)
            .then(() => {
                alert("সাফল্যের সাথে Firebase-এ পাবলিশ হয়েছে!");
                document.getElementById('productForm').reset();
            })
            .catch((error) => alert("Firebase Error: " + error.message));
    }
};

window.getChargeForCard = function(product) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userAddress = (currentUser && currentUser.address) ? currentUser.address.toLowerCase() : "";
    
    // ইউজারের ঠিকানায় ঢাকা থাকলে ইনসাইড চার্জ, নাহলে আউটসাইড
    if (userAddress.includes("dhaka")) {
        return (product.insideDhaka || 60) + " TK (Inside Dhaka)";
    } else {
        return (product.outsideDhaka || 120) + " TK (Outside Dhaka)";
    }
};

// ২. শপে ডিসকাউন্টসহ প্রোডাক্ট দেখানো
window.displayShopProducts = function() {
    const container = document.getElementById('product-container');
    if (!container) return;
    container.innerHTML = '';

    // ১. ইউজারের লোকেশন অনুযায়ী চার্জ বের করা
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userAddress = (currentUser && currentUser.address) ? currentUser.address.toLowerCase() : "";
    const isDhaka = userAddress.includes("dhaka");

    // ২. রিয়েল-টাইম ডাটা লিস্ট
    const listToDisplay = (window.products && window.products.length > 0) ? window.products : products;

    listToDisplay.forEach((product, pIndex) => {
        let firstImg = "";
        if (product.images && product.images[0]) {
            firstImg = product.images[0];
        } else if (product.media && product.media[0]) {
            firstImg = product.media[0].url;
        }

        let priceHTML = product.oldPrice 
            ? `<span style="text-decoration: line-through; color: #888; font-size: 14px; margin-right: 8px;">${product.oldPrice} TK</span> 
               <span style="color: #d4af37;">${product.currentPrice || product.price} TK</span>`
            : `<span style="color: #d4af37;">${product.currentPrice || product.price} TK</span>`;

        const deliveryCharge = isDhaka ? (product.insideDhaka || 60) : (product.outsideDhaka || 120);
        const locationText = isDhaka ? "Inside Dhaka" : "Outside Dhaka";

        // --- ৩. স্টক চেক লজিক (নিখুঁত করা হয়েছে) ---
        let stockVal = 0; 
        if (product.stock !== undefined && product.stock !== null && product.stock !== "") {
            stockVal = parseInt(product.stock);
        }

        const isOutOfStock = stockVal <= 0;

        // ৪. বাটন নির্ধারণ
        const cartButtonHTML = isOutOfStock 
            ? `<button class="out-of-stock-btn" disabled style="background: #444; color: #888; cursor: not-allowed; border: none; flex: 1; padding: 10px; border-radius: 5px;">Stock Out</button>` 
            : `<button class="cart-btn-premium" onclick="updateDeliveryRates(${product.insideDhaka || 60}, ${product.outsideDhaka || 120}); addToCart('${product.name}', '${product.currentPrice || product.price}', '${firstImg}', '${product.id}', ${stockVal})">Add to Cart</button>`;

        // ৫. স্টক ইনফো টেক্সট
        const stockInfoHTML = `
            <p style="font-size: 11px; color: #888; margin-top: 5px;">
                Delivery: <span style="color: #d4af37;">${deliveryCharge} TK</span> (${locationText}) | 
                Stock: <span style="color: ${stockVal > 0 ? '#d4af37' : '#ff4444'}; font-weight: bold;">
                    ${stockVal > 0 ? stockVal + " Pcs" : "Out of Stock"}
                </span>
            </p>
        `;

        // ৬. কার্ড রেন্ডারিং (এখানেই ভ্যারিয়েবলগুলো বসানো হয়েছে)
        container.innerHTML += `
        <div class="product-card">
            <div class="product-img-box" onclick="window.location.href='product.html?id=${product.id || pIndex}'">
                <img src="${firstImg}" alt="${product.name}" style="width:100%; height:250px; object-fit:cover;">
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <div class="price-box">${priceHTML}</div>
                
                ${stockInfoHTML} 

                <div class="card-action-btns" style="display: flex; gap: 10px; margin-top: 15px;">
                    <button class="view-btn-premium" onclick="window.openProductModal(${pIndex})">VIEW</button>
                    ${cartButtonHTML}
                </div>
            </div>
        </div>`;
    });
};
// ৩. এডিট করার জন্য ডাটা ফর্মে ফিরিয়ে আনা
window.editProduct = function(index) {
    const product = (window.products || products)[index];
    document.getElementById('editProductId').value = product.id;
    document.getElementById('pName').value = product.name;
    document.getElementById('pOldPrice').value = product.oldPrice || '';
    document.getElementById('pPrice').value = product.price;
    document.getElementById('pDesc').value = product.desc;
    // ১. লং ডেসক্রিপশন সেট করা (publishProduct-এর longDescription ফিল্ড থেকে)
if(document.getElementById('pLongDesc')) {
    document.getElementById('pLongDesc').value = product.longDescription || '';
}

// ২. ওয়ারেন্টি তথ্য সেট করা (publishProduct-এর warranty ফিল্ড থেকে)
if(document.getElementById('productWarranty')) {
    document.getElementById('productWarranty').value = product.warranty || 'No Official Warranty';
}

// ৩. স্টক বা প্রোডাক্টের পরিমাণ সেট করা (publishProduct-এর stock ফিল্ড থেকে)
if(document.getElementById('pStock')) {
    document.getElementById('pStock').value = product.stock || 0;
}

// ৪. ডেলিভারি চার্জ - ঢাকা (publishProduct-এর insideDhaka ফিল্ড থেকে)
if(document.getElementById('p-inside-dhaka')) {
    document.getElementById('p-inside-dhaka').value = product.insideDhaka || 60;
}

// ৫. ডেলিভারি চার্জ - ঢাকার বাইরে (publishProduct-এর outsideDhaka ফিল্ড থেকে)
if(document.getElementById('p-outside-dhaka')) {
    document.getElementById('p-outside-dhaka').value = product.outsideDhaka || 120;
}
    
    // স্ক্রল করে উপরে ফর্মে নিয়ে যাওয়া
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelector('.publish-btn').innerText = "UPDATE PRODUCT";
    
    if(document.getElementById('pCategory')) {
        document.getElementById('pCategory').value = product.category || 'all';
    }
};

// ২. প্রোডাক্ট মোডাল ওপেন করা (ডিটেইলস ও স্লাইডার)
let currentSlideIndex = 0;
window.openProductModal = function(index) {
    // ১. ডাটা সোর্স সিঙ্ক করা
    const listToUse = (window.products && window.products.length > 0) ? window.products : (typeof products !== 'undefined' ? products : []);
    const product = listToUse[index];

    if (!product) {
        console.warn("Product not ready yet or index invalid:", index);
        return;
    }

    const modal = document.getElementById('product-modal');
    const body = document.getElementById('modal-body');
    if (!modal || !body) return;

    // ২. মিডিয়া চেক (অত্যন্ত নিরাপদ লজিক)
    let mediaHTML = '';
    // এখানে মেইন ট্রিক: media অথবা images যে নামেই থাক সে খুঁজে নেবে
    const productImages = product.media || product.images || [];

    if (Array.isArray(productImages) && productImages.length > 0) {
        productImages.forEach((m, i) => {
            const url = typeof m === 'string' ? m : (m.url || "");
            if(url) {
                mediaHTML += `<img src="${url}" class="modal-slide" style="width:100%; display: ${i === 0 ? 'block' : 'none'}; border-radius:15px; border: 1px solid #d4af37;">`;
            }
        });
    } else {
        // যদি কিছুই না থাকে তবে একটি প্লেসহোল্ডার দেবে
        mediaHTML = `<img src="https://via.placeholder.com/300" style="width:100%; border-radius:15px;">`;
    }

    // ৩. বডি রেন্ডার করা
    body.innerHTML = `
        <div class="modal-left" style="flex: 1; min-width: 300px; position: relative;">
            ${mediaHTML}
            <button onclick="changeSlide(-1)" class="slide-btn prev">&#10094;</button>
            <button onclick="changeSlide(1)" class="slide-btn next">&#10095;</button>
        </div>
        <div class="modal-right" style="flex: 1; min-width: 300px; color: white; padding: 10px;">
            <h2 style="color: #d4af37; font-size: 28px; margin-bottom: 5px;">${product.name}</h2>
            <div style="background: rgba(212, 175, 55, 0.1); padding: 10px; border-radius: 8px; display: inline-block;">
                <span style="font-size: 24px; font-weight: bold; color: #d4af37;">${product.currentPrice || product.price} TK</span>
            </div>
            <p style="color: #bbb; line-height: 1.8; margin: 20px 0; font-size: 15px;">${product.desc || product.description || 'Premium quality product.'}</p>
            <div class="modal-footer-btns" style="display: flex; flex-direction: column; gap: 12px; margin-top: 30px;">
                <button class="modal-add-btn" onclick="addToCart('${product.name}', '${product.currentPrice || product.price}', '${(productImages[0] && productImages[0].url) || productImages[0] || ""}', '${product.id}')" 
                    style="width: 100%; padding: 15px; background: transparent; border: 2px solid #d4af37; color: #d4af37; border-radius: 30px; font-weight: bold;">
                    🛒 ADD TO CART
                </button>
                <button class="modal-buy-btn" onclick="buyNow('${product.name}', '${product.currentPrice || product.price}')" 
                style="width: 100%; padding: 15px; background: #25D366; border: none; color: #000000; border-radius: 30px; font-weight: bold; cursor: pointer; margin-top: 10px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                <i class="fab fa-whatsapp"></i> BUY NOW (WHATSAPP)
                </button>
            </div>
        </div>
    `;
    modal.style.display = 'block';
};
// ৩. স্লাইডার পরিবর্তনের ফাংশন
window.changeSlide = function(n) {
    const slides = document.getElementsByClassName('modal-slide');
    slides[currentSlideIndex].style.display = 'none';
    currentSlideIndex = (currentSlideIndex + n + slides.length) % slides.length;
    slides[currentSlideIndex].style.display = 'block';
};

window.closeProductModal = function() {
    document.getElementById('product-modal').style.display = 'none';
};

////star search bar code/////
// ৫. সার্চ সিস্টেম (Search Bar Logic)
const searchInp = document.getElementById('search-input');
const suggBox = document.getElementById('suggestion-box');
const searchBtn = document.getElementById('search-btn');
const searchInfoBar = document.getElementById('search-info-bar');

// শুধুমাত্র যদি সার্চ ইনপুটটি পেজে থাকে (যেমন: index.html এ), তবেই এই কোডগুলো চলবে
if (searchInp) {
    // ১. টাইপ করার সময় সাজেশন দেখানো
    searchInp.addEventListener('input', function() {
        const val = this.value.toLowerCase().trim();
        renderSuggestions(val);
    });

    // ২. এন্টার (Enter) বাটন চাপলে ফিল্টার করা
    searchInp.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            executeSearch();
        }
    });
}

// ৩. সার্চ আইকনে ক্লিক করলে কাজ করবে (যদি বাটনটি থাকে)
if (searchBtn) {
    searchBtn.addEventListener('click', executeSearch);
}

function renderSuggestions(val) {
    suggBox.innerHTML = '';
    if (val.length > 0) {
        const filtered = products.filter(p => p.name.toLowerCase().includes(val));

        if (filtered.length > 0) {
            suggBox.style.display = 'block';
            filtered.forEach(p => {
                let img = (p.images && p.images[0]) ? p.images[0] : (p.media && p.media[0] ? p.media[0].url : 'https://via.placeholder.com/50');

                const item = document.createElement('div');
                item.className = 's-item';
                item.innerHTML = `
                    <img src="${img}">
                    <div class="s-info">
                        <h4>${p.name}</h4>
                        <p>${p.currentPrice || p.price} TK</p>
                    </div>
                `;
                
                // সাজেশনে ক্লিক করলে সরাসরি মোডাল ওপেন হবে
                item.onclick = () => {
                    const originalIndex = products.findIndex(prod => prod.id === p.id);
                    openProductModal(originalIndex);
                    suggBox.style.display = 'none';
                    searchInp.value = p.name;
                };
                suggBox.appendChild(item);
            });
        } else {
            suggBox.innerHTML = '<div style="padding:15px; color:#666; text-align:center;">No results found</div>';
            suggBox.style.display = 'block';
        }
    } else {
        suggBox.style.display = 'none';
    }
}

// ৪. মূল সার্চ ফাংশন (যা পুরো মেইন পেজের কন্টেইনার ফিল্টার করবে)
function executeSearch() {
    const val = searchInp.value.toLowerCase().trim();
    if (val === "") return;

    suggBox.style.display = 'none'; 
    
    const filtered = products.filter(p => p.name.toLowerCase().includes(val));
    renderFilteredProducts(filtered);
    
    // সার্চ ইনফো বার এবং রিসেট বাটন দেখানো
    if (searchInfoBar) {
        searchInfoBar.style.display = 'block';
        document.getElementById('search-result-text').innerText = `Results for: "${val}"`;
    }

    // অটো স্ক্রল করে নিচে নিয়ে যাওয়া
    const container = document.getElementById('product-container');
    if (container) {
        container.scrollIntoView({ behavior: 'smooth' });
    }
}
window.resetSearch = function() {
    searchInp.value = ''; // ইনপুট খালি করা
    if (searchInfoBar) searchInfoBar.style.display = 'none'; // ইনফো বার লুকানো
    
    // আপনার অরিজিনাল ডাটা রেন্ডার করার ফাংশনটি কল করা
    if (typeof displayShopProducts === 'function') {
        displayShopProducts(); 
    }
}

// আপনার UI এর সাথে মিল রেখে ফিল্টার করা প্রোডাক্ট দেখানোর ছোট ফাংশন
function renderFilteredProducts(filteredList) {
    const container = document.getElementById('product-container');
    container.innerHTML = '';
    
    if (filteredList.length === 0) {
        container.innerHTML = '<h2 style="color:white; text-align:center; width:100%;">Sorry, no products found!</h2>';
        return;
    }

    filteredList.forEach((product) => {
        // আপনার অরিজিনাল শপ ডিসপ্লে কোডটি এখানে রিপিট হবে
        // যাতে ডিজাইন এক থাকে।
        const indexInOriginal = products.findIndex(p => p.id === product.id);
        
        let pImg = (product.images && product.images[0]) ? product.images[0] : (product.media && product.media[0] ? product.media[0].url : 'https://via.placeholder.com/150');

        container.innerHTML += `
            <div class="product-item">
                <div class="product-card">
                    <div class="product-image" onclick="openProductModal(${indexInOriginal})">
                        <img src="${pImg}" alt="${product.name}">
                    </div>
                    <div class="product-info">
                        <h3 class="product-title">${product.name}</h3>
                        <div class="price-container">
                            <span class="current-price">${product.currentPrice || product.price} TK</span>
                        </div>
                        <div class="button-group">
                            <button class="view-btn" onclick="openProductModal(${indexInOriginal})">VIEW</button>
                            <button class="add-to-cart-btn" onclick="addToCart('${product.name}', '${product.currentPrice || product.price}', '${pImg}', '${product.id}')">Add to Cart</button>
                        </div>
                    </div>
                </div>
            </div>`;
    });
}



// বাইরে ক্লিক করলে সার্চ বক্স বন্ধ হবে (নিরাপদ ভার্সন)
document.addEventListener('click', (e) => {
    // আগে চেক করবে suggBox এই পেজে আছে কি না
    const box = document.getElementById('suggBox'); // তোমার সার্চ বক্সের আইডি যদি suggBox হয়
    if (box && !e.target.closest('.search-wrapper')) {
        box.style.display = 'none';
    }
});

////end search code////

////start/////
// ইউজারের আইডি (লগইন করা ইউজারের UID এখানে বসবে)
let userId = localStorage.getItem('userId') || "somu_luxury_user"; 
window.cart = [];

// ২. প্রোডাক্ট কার্টে যোগ করার ফাংশন
window.addToCart = function(name, price, image, id, stock, inside, outside) {
    // ১. অ্যানিমেশনের জন্য ইভেন্ট অবজেক্ট নেওয়া
    const event = window.event; 

    // ২. লোকাল স্টোরেজ থেকে আইডি নিন
    let currentId = localStorage.getItem('userId');
    stock = parseInt(stock);

    // ৩. লগইন চেক
    if (!currentId || currentId === "somu_luxury_user" || currentId === "null") {
        alert("কার্টে প্রোডাক্ট যোগ করতে হলে দয়া করে আগে লগইন করুন!");
        window.location.href = "login.html";
        return;
    }

    // ৪. কার্ট লজিক ও স্টক চেক
    let existingItem = window.cart.find(item => String(item.id) === String(id));
    let currentQtyInCart = existingItem ? (existingItem.quantity || 1) : 0;
    
    if (stock !== undefined && stock <= 0) {
        alert("দুঃখিত, এই প্রোডাক্টটি এখন স্টকে নেই!");
        return;
    }

    if (stock !== undefined && currentQtyInCart >= stock) {
        alert("দুঃখিত, আমাদের স্টকে মাত্র " + stock + "টি প্রোডাক্ট আছে!");
        return;
    }

 if (event) {
        const cartTarget = document.querySelector('.cart-wrapper');

        if (cartTarget) {
            const rect = cartTarget.getBoundingClientRect();
            
            const flyer = document.createElement('div');
            flyer.innerText = '+1';
            flyer.style.cssText = `
                position: fixed;
                left: ${event.clientX}px;
                top: ${event.clientY}px;
                width: 32px;
                height: 32px;
                background: #d4af37;
                color: #000000;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                z-index: 1000000;
                pointer-events: none;
                box-shadow: 0 5px 15px rgba(212, 175, 55, 0.4);
                
                /* এনিমেশনটি একটু বাউন্স করার জন্য নিচের ট্রানজিশনটি খুব জরুরি */
                transition: left 1.2s cubic-bezier(0.25, 0.1, 0.25, 1), 
                            top 1.2s cubic-bezier(0.5, -0.5, 0.1, 1), 
                            transform 1.2s ease-in-out, 
                            opacity 1.2s ease-in;
            `;
            document.body.appendChild(flyer);

            // ২. এনিমেশন শুরু (একটু বাউন্স করে উড়ে যাওয়া)
            setTimeout(() => {
                // টার্গেট পজিশন
                flyer.style.left = (rect.left + rect.width / 2 - 16) + 'px';
                flyer.style.top = (rect.top + rect.height / 2 - 16) + 'px';
                flyer.style.transform = 'scale(0.4) rotate(360deg)';
                flyer.style.opacity = '0.5';
            }, 50);

            // ৩. কাজ শেষ হলে মুছে ফেলা
            setTimeout(() => {
                flyer.remove();
                // কার্ট আইকনকে একটু কাঁপানো
                cartTarget.style.transform = 'scale(1.2)';
                setTimeout(() => cartTarget.style.transform = 'scale(1)', 200);
            }, 1200); // সময় বাড়িয়ে ১.২ সেকেন্ড করা হয়েছে যাতে স্মুথ লাগে
        }
    }
    // --- অ্যানিমেশন শেষ ---
    // ----------------------------------------------------

    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
        window.cart.push({ name, price, image, id, quantity: 1 });
    }

    // ৬. Firebase-এ সেভ করা
    const userCartRef = ref(db, 'userCarts/' + currentId);
    set(userCartRef, window.cart)
        .then(() => {
            console.log("Cart saved to Firebase!");
            updateCartUI();
            
            const sideCart = document.getElementById('side-cart');
            if (sideCart) {
                sideCart.classList.add('active');
            }
        })
        .catch((error) => {
            console.error("Firebase Save Error:", error);
            alert("কার্ট সেভ করতে সমস্যা হয়েছে!");
        });
};

// ৩. পেজ লোড হওয়ার সময় Firebase থেকে ডাটা আনা (লগইন করা থাকলে)
if (userId !== "somu_luxury_user") {
    const userCartRef = ref(db, 'userCarts/' + userId);
    get(userCartRef).then((snapshot) => {
        const data = snapshot.val(); 
        
        if (data) {
            window.cart = data; 
        } else {
            window.cart = []; 
        }
        
        // আপনার কার্ট UI আপডেট করার ফাংশনটি আগের মতোই কল হবে
        if (typeof updateCartUI === 'function') {
            updateCartUI(); 
        }
    }).catch((error) => {
        console.error("Cart Loading Error:", error);
    });
}
// কার্টের ভেতরের লিস্ট আপডেট করা
window.updateCartUI = function() {
    const container = document.getElementById('cart-items-container');
    if (!container) return;

    // কার্ট হেডার হিসেবে Select All যোগ করা (এটি আগের মতোই আছে)
    let cartHTML = `
        <div class="select-all-container">
            <input type="checkbox" id="select-all" class="item-checkbox" onclick="toggleSelectAll(this)">
            <label for="select-all" style="cursor:pointer;">Select All Items</label>
        </div>
    `;

    if (window.cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart-container" style="text-align: center; padding: 50px 20px; color: #fff; animation: fadeIn 0.8s ease;">
                <div class="empty-icon" style="font-size: 50px; margin-bottom: 15px; filter: drop-shadow(0 0 8px #d4af37);">🛒</div>
                <h3 class="empty-title" style="font-size: 18px; margin-bottom: 10px; color: #d4af37;">Your cart is feeling lonely!</h3>              
                <button class="shop-now-compact" onclick="window.location.href='index.html'" style="padding: 10px 30px; background: linear-gradient(45deg, #d4af37, #f1c40f); border: none; color: #000; font-weight: bold; border-radius: 25px; cursor: pointer; transition: 0.3s; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3); font-size: 14px;">
                    SHOP NOW
                </button>
            </div>
        `;
        return;
    }

    // আপনার লুপের ভেতরে (forEach) নিচের অংশটুকু বসান
window.cart.forEach((item, index) => {
    let priceNum = parseInt(item.price.toString().replace(/[^0-9]/g, '')) || 0;
    let qty = item.quantity || 1; 
    let totalPricePerItem = priceNum * qty; 

    // ১. সঠিক আইডি লিঙ্ক তৈরি
    const productId = item.id || index; 
    const productPageUrl = `product.html?id=${productId}`; 
    const dbProduct = products.find(p => String(p.id) === String(item.id));
    const displayStock = dbProduct ? dbProduct.stock : 'N/A';

    cartHTML += `
        <div class="cart-item" style="display:flex; align-items:center; gap:12px; padding:15px; border-bottom:1px solid #222; position: relative;">
            <input type="checkbox" class="item-checkbox" style="width: 18px; height: 18px; cursor: pointer; flex-shrink: 0; position: relative; z-index: 1000;" data-price="${totalPricePerItem}" onchange="window.calculateTotal()">
            <img src="${item.image}" 
                 onclick="window.location.href='${productPageUrl}'" 
                 style="width:50px; height:50px; border-radius:8px; object-fit:cover; flex-shrink: 0; cursor: pointer; position: relative; z-index: 1000;">
            
            <div style="flex-grow:1; position: relative; z-index: 20;">
                <h4 onclick="window.location.href='${productPageUrl}'" 
                    style="font-size:14px; color:white; margin:0; cursor: pointer; transition: 0.3s; position: relative; z-index: 1000;"
                    onmouseover="this.style.color='#d4af37'" 
                    onmouseout="this.style.color='white'">
                    ${item.name}
                </h4>
                <p style="color:#d4af37; margin:4px 0; font-weight:bold;">${priceNum} TK</p>
                <p style="font-size: 11px; color: #888; margin: 2px 0;">
                Stock: <span style="color: ${displayStock <= 3 ? '#ff4d4d' : '#fff'}; font-weight: bold;">${displayStock}</span>
                </p>
                
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 5px; position: relative; z-index: 100;">
                <button class="qty-btn" onclick="window.updateQty(${index}, -1)" style="background: #222; border: 1px solid #d4af37; color: #d4af37; width: 25px; height: 25px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; position: relative; z-index: 9999; pointer-events: auto;">-</button>
                <span style="color: white; font-size: 14px; font-weight: bold; min-width: 15px; text-align: center;">${qty}</span>  
                <button class="qty-btn" onclick="window.updateQty(${index}, 1)" style="background: #d4af37; border: none; color: #000; width: 25px; height: 25px; border-radius: 4px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center; position: relative; z-index: 9999; pointer-events: auto;">+</button>
            </div>
            </div>
            
            <button onclick="removeFromCart(${index})" class="delete-btn" title="Remove Item" style="position: relative; z-index: 1000;">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
            </button>
        </div>`;
});
    const cartCountElement = document.getElementById('cart-count'); // আপনার HTML-এ এই আইডিটি থাকতে হবে
    if (cartCountElement) {
        cartCountElement.innerText = window.cart.length;
        
        // যদি কার্টে কিছু না থাকে তবে কাউন্ট লুকানো (ঐচ্ছিক)
        if (window.cart.length === 0) {
            cartCountElement.style.display = 'none';
        } else {
            cartCountElement.style.display = 'block';
        }
    }

    container.innerHTML = cartHTML;
    calculateTotal();
};

// ১. কার্ট বন্ধ করার ফাংশন
window.closeCart = function() {
    const sideCart = document.getElementById('side-cart');
    if (sideCart) sideCart.classList.remove('active');
};

// ২. কার্টের বাইরে ক্লিক করলে যেন বন্ধ হয় (ঐচ্ছিক কিন্তু জরুরি)
document.addEventListener('click', function(event) {
    const sideCart = document.getElementById('side-cart');
    const cartIcon = document.querySelector('.cart-icon-wrapper');

    if (sideCart && sideCart.classList.contains('active')) {
        // এখানে চেক করা হচ্ছে sideCart এবং cartIcon আসলেই আছে কি না
        if (cartIcon && !sideCart.contains(event.target) && !cartIcon.contains(event.target)) {
            sideCart.classList.remove('active');
        }
    }
});

// ১. টোটাল হিসাব করার ফাংশন
window.calculateTotal = function() {
    const checkboxes = document.querySelectorAll('.item-checkbox');
    let total = 0;
    
    checkboxes.forEach(cb => {
        if (cb.checked) {
            // আপনার আগের মতোই data-price থেকে দাম নেওয়া হচ্ছে
            let price = parseInt(cb.getAttribute('data-price')) || 0;
            total += price;
        }
    });
    
    // টোটাল ডিসপ্লে আপডেট - এখানে আমরা অ্যানিমেশন ফাংশনটি কল করছি
    const totalDisplay = document.getElementById('selected-total-display');
    if (totalDisplay) {
        // সরাসরি টেক্সট পরিবর্তনের বদলে আমরা অ্যানিমেশন দিয়ে পরিবর্তন করব
        window.animatePriceUpdate(total); 
        console.log("Current Selected Total: " + total);
    }
 // ১. কার্টে থাকা শেষ প্রোডাক্ট থেকে ডেলিভারি রেট খুঁজে বের করা
const lastProduct = window.cart[window.cart.length - 1]; 
const currentInsideRate = lastProduct ? (lastProduct.insideDhaka || 60) : 60;
const currentOutsideRate = lastProduct ? (lastProduct.outsideDhaka || 120) : 120;

// ২. ইউজারের অ্যাড্রেস অনুযায়ী ফাইনাল চার্জ নির্ধারণ করা
const addressVal = document.getElementById('order-address').value.toLowerCase();
let finalDeliveryCharge = addressVal.includes("dhaka") ? currentInsideRate : currentOutsideRate;

// ৩. তোমার ডিসপ্লে আপডেট করা
const delDisplay = document.getElementById('delivery-charge-display');
if (delDisplay) {
    delDisplay.innerText = finalDeliveryCharge;
}

// ৪. ফাইনাল টোটাল (প্রোডাক্টের দাম + ডেলিভারি চার্জ)
const finalTotalDisplay = document.getElementById('final-total');
if (finalTotalDisplay) {
    finalTotalDisplay.innerText = total + finalDeliveryCharge;
}
};

// প্রাইস কাউন্টিং অ্যানিমেশন ফাংশন (এটি ফাইলের যেকোনো জায়গায় থাকলেই হবে)
window.animatePriceUpdate = function(newTotal) {
    const totalDisplay = document.getElementById('selected-total-display');
    if (!totalDisplay) return;

    let currentTotal = parseInt(totalDisplay.innerText.replace(/[^0-9]/g, '')) || 0;
    let start = currentTotal;
    let end = newTotal;
    let duration = 500; // ০.৫ সেকেন্ড
    let startTime = null;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        let progress = Math.min((timestamp - startTime) / duration, 1);
        let value = Math.floor(progress * (end - start) + start);
        
        totalDisplay.innerText = value.toLocaleString() + " TK";
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    }
    
    // প্রাইজ পরিবর্তনের সময় হালকা গোল্ডেন গ্লো ইফেক্ট
    totalDisplay.style.transition = "text-shadow 0.3s ease";
    totalDisplay.style.textShadow = "0 0 15px rgba(212, 175, 55, 0.7)";
    setTimeout(() => { totalDisplay.style.textShadow = "none"; }, 500);
    
    window.requestAnimationFrame(step);
};

// ২. চেকআউট বাটন ফাংশন
// চেকআউট ফর্ম খোলার সময় প্রোফাইল থেকে ডাটা আনা
window.proceedToCheckout = function() {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
        // যদি ইউজার লগইন থাকে, সরাসরি তার প্রোফাইল থেকে ডাটা বক্সে বসাবে
        document.getElementById('order-name').value = user.displayName || "";
        // যদি ডাটাবেজে ফোন এবং ঠিকানা সেভ থাকে, তবে সেখান থেকে গেট করে বসাবেন
    }
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
    document.getElementById('order-name').value = currentUser.name || "";
    document.getElementById('order-phone').value = currentUser.phone || "";
    document.getElementById('order-address').value = currentUser.address || "";
    }
    document.getElementById('checkout-modal').style.display = 'flex';
};

// ২. প্রোডাক্ট কার্ট থেকে ডিলিট করার জন্য
window.removeFromCart = function(index) {
    const cartItems = document.querySelectorAll('.cart-item');
    const targetItem = cartItems[index];

    if (targetItem) {
        // ডিলিট হওয়ার আগে অ্যানিমেশন যোগ করা
        targetItem.style.transition = "all 0.4s ease";
        targetItem.style.transform = "translateX(100px)";
        targetItem.style.opacity = "0";

        // অ্যানিমেশন শেষ হওয়ার পর ডাটা ডিলিট করা
        setTimeout(() => {
            window.cart.splice(index, 1);
            if (typeof userId !== 'undefined') {
                const userCartRef = ref(db, 'userCarts/' + userId);
                set(userCartRef, window.cart);
            }
            updateCartUI();
        }, 400); 
    }
};

// ২. "Select All" বাটন সচল করা
window.toggleSelectAll = function(source) {
    const checkboxes = document.querySelectorAll('.item-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = source.checked;
    });
    calculateTotal(); // সব সিলেক্ট হলে টোটাল আপডেট হবে
};

// ৪. চেকআউট বাটন (Proceed to Checkout)
window.proceedToCheckout = function() {
    const totalDisplay = document.getElementById('selected-total-display').innerText;
    const totalValue = parseInt(totalDisplay.replace(/[^0-9]/g, '')) || 0;

    if (totalValue <= 0) {
        alert("দয়া করে অন্তত একটি প্রোডাক্ট সিলেক্ট করুন!");
        return;
    }

    const modal = document.getElementById('checkout-modal');
    if (modal) {
        modal.style.display = 'flex'; // পপ-আপ দেখাবে
        closeCart(); // কার্ট স্লাইডার বন্ধ করবে
    } else {
        alert("ভুল: 'checkout-modal' আইডিটি আপনার এইচটিএমএল-এ পাওয়া যায়নি!");
    }
};
window.submitOrder = function() {
 const currentId = localStorage.getItem('userId');

    // কনসোলে চেক করার জন্য (অপশনাল)
    console.log("Current User ID in Order:", currentId);

    // শর্তটি খুব সাবধানে লক্ষ্য করুন
    if (!currentId || currentId === "somu_luxury_user" || currentId === "null" || currentId === "") {
        alert("অর্ডার সম্পন্ন করতে হলে দয়া করে আগে লগইন করুন!");
        window.location.href = "login.html";
        return; // এটি নিচের কোড চলতে বাধা দেবে
    }

    const db = getDatabase(); 
    
    const name = document.getElementById('order-name').value;
    const phone = document.getElementById('order-phone').value;
    const address = document.getElementById('order-address').value;
    const email = document.getElementById('order-email').value;
    const total = document.getElementById('selected-total-display').innerText;
    const deliveryCharge = parseInt(document.getElementById('delivery-charge-display').innerText) || 0;
    const finalTotal = parseInt(document.getElementById('final-total-display').innerText) || 0;

    if (!name || !phone || !address) {
        alert("সব তথ্য পূরণ করুন!");
        return;
    }

    const checkboxes = document.querySelectorAll('.item-checkbox:checked');
    const orderedItems = [];
    const orderedNames = []; 

    checkboxes.forEach(cb => {
        const itemContainer = cb.closest('.cart-item');
        if (itemContainer) {
            const pName = itemContainer.querySelector('h4').innerText;
            const pPrice = itemContainer.querySelector('p').innerText;
            orderedItems.push({ name: pName, price: pPrice });
            orderedNames.push(pName); // নামটা সেভ করে রাখছি ফিল্টার করার জন্য
        }
    });

    const newOrder = {
        customerName: name,
        customerPhone: phone,
        deliveryAddress: address,
        customerEmail: email,
        products: orderedItems,
        orderTime: new Date().toLocaleString(),
        status: "Pending",
        userId: currentId,
        deliveryCharge: deliveryCharge,
        totalAmount: finalTotal
    };

    const ordersRef = ref(db, 'orders'); 
    push(ordersRef, newOrder)
        .then(() => {
// --- স্টক কমানোর আরও শক্তিশালী লজিক শুরু ---
checkboxes.forEach(cb => {
    const itemContainer = cb.closest('.cart-item');
    if (itemContainer) {
        // ১. কার্ট আইটেম থেকে নাম বের করা
        const pName = itemContainer.querySelector('h4').innerText.trim();
        
        // ২. সরাসরি window.cart থেকে ওই প্রোডাক্টের অরিজিনাল ডাটা খুঁজে বের করা
        // এটিই নিশ্চিত করবে যে ৭টা কিনলে ৭-ই বিয়োগ হবে
        const cartItem = window.cart.find(item => item.name.trim() === pName);
        
        if (cartItem) {
            const orderedQty = parseInt(cartItem.quantity) || 1; // এখানে আসল সংখ্যা পাওয়া যাবে

            // ৩. মেইন প্রোডাক্ট লিস্ট থেকে ডাটাবেজ ইনফো (fbKey) বের করা
            const productIndex = (window.products || products).findIndex(p => p.name.trim() === pName);
            const dbProduct = (window.products || products)[productIndex];
            
            if (dbProduct && dbProduct.fbKey) {
                const currentStock = parseInt(dbProduct.stock) || 0;
                
                // ৪. নতুন স্টক হিসাব (Current Stock - Ordered Quantity)
                const newStock = Math.max(0, currentStock - orderedQty);

                // ৫. Firebase আপডেট (সরাসরি আপডেট কমান্ড)
                const productRef = ref(db, 'products/' + dbProduct.fbKey);
                update(productRef, { 
                    stock: newStock 
                }).then(() => {
                    // ৬. মেমোরি আপডেট যাতে পেজ রিফ্রেশ ছাড়াই স্টক কমে যায়
                    if (window.products && window.products[productIndex]) {
                        window.products[productIndex].stock = newStock;
                    }
                    console.log(`সফল! ${pName} এর ${orderedQty} টি বিয়োগ হয়েছে। নতুন স্টক: ${newStock}`);
                    
                    // ৭. শপ পেজ রিফ্রেশ (বাটন স্টক আউট করার জন্য)
                    if (typeof window.displayShopProducts === 'function') {
                        window.displayShopProducts();
                    }
                });
            }
        }
    }
});
// --- স্টক কমানোর লজিক শেষ ---
            Swal.fire({
                title: 'Order Confirmed!',
                text: 'ধন্যবাদ! আপনার অর্ডারটি সফলভাবে SomuNexus-এ জমা হয়েছে।',
                icon: 'success',
                background: '#111',
                color: '#d4af37',
                confirmButtonColor: '#d4af37',
                showClass: { popup: 'animate__animated animate__zoomIn' }
            });
            document.getElementById('checkout-modal').style.display = 'none';
            window.cart = window.cart.filter(item => !orderedNames.includes(item.name));
            
            // ডাটাবেসে নতুন কার্ট (বাকি আইটেমসহ) আপডেট করে দিন
            if (currentId) {
                set(ref(db, 'userCarts/' + currentId), window.cart);
            }

            // কার্ট UI রিফ্রেশ করুন যাতে বাকি আইটেমগুলো দেখা যায়
            if (typeof updateCartUI === 'function') {
                updateCartUI();
            }
            // -------------------------------------------------------
        })
        .catch((error) => {
            alert("অর্ডার সেভ হয়নি: " + error.message);
        });
};

// কার্টের ভেতরে ক্লিক করলে যেন বন্ধ না হয় (Stop Propagation)
const sideCart = document.getElementById('side-cart');
if (sideCart) {
    sideCart.addEventListener('click', (e) => {
        e.stopPropagation(); // কার্টের ভেতরে ক্লিক করলে এটি বন্ধ হবে না
    });
}
// ৭. হোয়াটসঅ্যাপ অর্ডার (Buy Now)
window.buyNow = function(name, price) {
    let myNumber = "8801826435150"; 
    let message = `Hello SomuNexus! I want to order:\nProduct: ${name}\nPrice: ${price} TK`;
    window.open(`https://wa.me/${myNumber}?text=${encodeURIComponent(message)}`, '_blank');
};

// ৮. অ্যাডমিন প্যানেলে প্রোডাক্ট ম্যানেজ (Delete Option)
window.displayAdminProducts = function() {
    const adminContainer = document.getElementById('admin-product-list');
    if (!adminContainer) return;

    adminContainer.innerHTML = '<h3>Manage Products</h3>';
    
    // window.products থেকে ডাটা নেওয়া নিশ্চিত করা
    const listToDisplay = (window.products && window.products.length > 0) ? window.products : products;

    if (listToDisplay.length === 0) {
        adminContainer.innerHTML += '<p>No products found.</p>';
        return;
    }

    listToDisplay.forEach((product, index) => {
        const stockStatus = (product.stock !== undefined) ? `(Stock: ${product.stock})` : "(No Stock)";
        
        adminContainer.innerHTML += `
    <div class="admin-item" style="display:flex; justify-content:space-between; align-items:center; background:#1a1a1a; padding:15px; margin-bottom:10px; border:1px solid #d4af37; border-radius:8px;">
        <span style="color:white;">${product.name} - ${product.currentPrice || product.price} TK <br> <small style="color:#d4af37;">${stockStatus}</small></span>
        <div>
            <button onclick="editProduct(${index})" style="background:#d4af37; border:none; padding:8px 15px; border-radius:5px; cursor:pointer; font-weight:bold; margin-right:5px;">Edit</button>
            <button onclick="deleteProduct('${product.fbKey}')" style="background:#ff4d4d; color:white; border:none; padding:8px 15px; border-radius:5px; cursor:pointer;">Delete</button>
        </div>
    </div>`;
    });
};

window.deleteProduct = function(index) {
    if (confirm("Are you sure you want to delete this product?")) {
        products.splice(index, 1);
        localStorage.setItem('somu_nexus_products', JSON.stringify(products));
        displayAdminProducts(); // অ্যাডমিন লিস্ট আপডেট
        if (typeof displayShopProducts === "function") displayShopProducts(); // শপ আপডেট
        alert("Product deleted!");
    }
};

// রিভিউ এবং মিডিয়া হ্যান্ডেলিং
// ১. লোকাল স্টোরেজ থেকে আগের রিভিউগুলো লোড করা
let savedReviews = JSON.parse(localStorage.getItem('somu_nexus_reviews')) || [];

// ২. রিভিউ দেখানোর ফাংশন
window.displayReviews = function() {
    const container = document.getElementById('reviewContainer');
    if (!container) return;
    
    container.innerHTML = '';
    savedReviews.forEach(rev => {
        const reviewDiv = document.createElement('div');
        reviewDiv.className = 'review-card';
        reviewDiv.style = "background: #111; padding: 20px; border-radius: 10px; border: 1px solid #222; margin-bottom: 20px;";
        
        reviewDiv.innerHTML = `
            <div class="stars" style="color:#d4af37; font-size: 18px;">${rev.stars}</div>
            <p style="color: #eee; margin: 10px 0;">"${rev.text}"</p>
            <div class="review-media-gallery" style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px;">
                ${rev.media.map(m => m.type === 'image' 
                    ? `<img src="${m.url}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 5px; border: 1px solid #d4af37;">` 
                    : `<video src="${m.url}" controls style="width: 150px; border-radius: 5px; border: 1px solid #d4af37;"></video>`).join('')}
            </div>
            <h4 style="color: #d4af37; margin-top: 15px;">- ${rev.name}</h4>
        `;
        container.prepend(reviewDiv);
    });
};

// ৩. নতুন রিভিউ সেভ করা
const reviewForm = document.getElementById('reviewForm');
if (reviewForm) {
    reviewForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('reviewerName').value;
        const rating = document.getElementById('reviewerRating').value;
        const text = document.getElementById('reviewText').value;
        const mediaFiles = document.getElementById('reviewMedia').files;
        
        let stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
        let mediaArray = [];

        if (mediaFiles.length > 0) {
            for (let file of mediaFiles) {
                const base64 = await convertBase64(file);
                mediaArray.push({
                    type: file.type.startsWith('image') ? 'image' : 'video',
                    url: base64
                });
            }
        }

        const newReviewData = { name, stars, text, media: mediaArray };
        
        // এরেতে সেভ করা এবং লোকাল স্টোরেজে রাখা
        savedReviews.push(newReviewData);
        localStorage.setItem('somu_nexus_reviews', JSON.stringify(savedReviews));
        
        displayReviews(); // লিস্ট আপডেট করা
        this.reset();
        alert("Review saved permanently!");
    });
}

// উইন্ডো লোড হলে রিভিউগুলো দেখাবে
window.addEventListener('load', () => {
    if(typeof displayReviews === 'function') displayReviews();
});
//// reveiw option close ////

// উইন্ডো লোড হলে সব ফাংশন চালু হবে
window.onload = function() {
    displayShopProducts();
    displayAdminProducts();
};

// ৯. চেকআউট বাটন ফাংশন (হোয়াটসঅ্যাপে অর্ডার পাঠানো)
window.checkout = function() {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    let orderDetails = "Hello SomuNexus! I want to order:\n\n";
    let total = 0;

    cart.forEach((item, index) => {
        let priceNum = parseInt(item.price.toString().replace(/[^0-9]/g, '')) || 0;
        total += priceNum;
        orderDetails += `${index + 1}. ${item.name} - ${item.price} TK\n`;
    });

    orderDetails += `\nTotal Amount: ${total} TK`;
    
    // আপনার হোয়াটসঅ্যাপ নম্বর (ইন্টারন্যাশনাল ফরম্যাটে)
    let myNumber = "8801826435150"; 
    window.open(`https://wa.me/${myNumber}?text=${encodeURIComponent(orderDetails)}`, '_blank');
};
// ১০. কার্ট আইটেম সিলেকশন এবং চেকআউট প্রসেস
window.setupCartLogic = function() {
    const selectAllBtn = document.querySelector('input[type="checkbox"][id="select-all"]'); // আপনার HTML এ id="select-all" থাকতে হবে
    const checkoutBtn = document.querySelector('.checkout-btn');
    
    // সিলেক্ট অল লজিক
    if (selectAllBtn) {
        selectAllBtn.addEventListener('change', function() {
            const itemCheckboxes = document.querySelectorAll('.item-checkbox');
            itemCheckboxes.forEach(cb => cb.checked = this.checked);
            calculateSelectedTotal();
        });
    }
};

// সিলেক্ট করা আইটেমগুলোর মোট দাম বের করা
window.calculateSelectedTotal = function() {
    const itemCheckboxes = document.querySelectorAll('.item-checkbox:checked');
    let selectedTotal = 0;
    
    itemCheckboxes.forEach(cb => {
        const price = parseInt(cb.getAttribute('data-price')) || 0;
        selectedTotal += price;
    });
    
    const totalDisplay = document.getElementById('selected-total-display'); // আপনার HTML এ এই আইডিটি থাকতে হবে
    if (totalDisplay) totalDisplay.innerText = selectedTotal;
};

// সব আইটেম একসাথে সিলেক্ট বা আন-সিলেক্ট করা
window.toggleSelectAll = function(source) {
    const checkboxes = document.querySelectorAll('.item-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = source.checked;
    });
    calculateTotal(); 
};


/////Checkout code start////
// ১. গ্লোবাল ভেরিয়েবল
let globalLocation = "Not Provided";
let currentOrderItems = [];

// ২. চেকআউট মডাল ওপেন করা
window.proceedToCheckout = function() {
    // ১. টোটাল চেক করা
    const totalDisplay = document.getElementById('selected-total-display').innerText;
    const totalValue = parseInt(totalDisplay.replace(/[^0-9]/g, '')) || 0;

    if (totalValue <= 0) {
        alert("দয়া করে অন্তত একটি প্রোডাক্ট সিলেক্ট করুন!");
        return;
    }

    // ২. চেকআউট মডাল (পপ-আপ) খুঁজে বের করা
    const modal = document.getElementById('checkout-modal'); 
    
    if (modal) {
        modal.style.display = 'flex'; // পপ-আপ দেখাবে
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (currentUser) {
    // ১. মেইন প্রোফাইল থেকে ডাটা অটো-ফিল
    document.getElementById('order-name').value = currentUser.name || "";
    document.getElementById('order-phone').value = currentUser.phone || "";
    document.getElementById('order-email').value = currentUser.email || ""; // ইমেইল ফিল্ড
    document.getElementById('order-address').value = currentUser.address || "";

    // ২. সেভ করা অ্যাড্রেস বুক থাকলে সিলেকশন মেনু তৈরি
    const selectionContainer = document.getElementById('saved-addresses-selection');
    if (selectionContainer && currentUser.addressBook) {
        selectionContainer.innerHTML = currentUser.addressBook.map((item, index) => `
            <div onclick="applySavedAddress(${index})" style="flex:0 0 auto; background:#1a1a1a; border:1px solid #d4af37; padding:8px 12px; border-radius:8px; cursor:pointer; font-size:11px; color:#d4af37; text-align:center; min-width:100px;">
                <strong>${item.name}</strong><br><span style="color:#888; font-size:9px;">Select This</span>
            </div>
        `).join('');
    }
}
        closeCart(); // কার্ট স্লাইডারটি বন্ধ করে দেবে
    } else {
        alert("চেকআউট ফর্মটি (ID: checkout-modal) আপনার HTML ফাইলে খুঁজে পাওয়া যাচ্ছে না!");
    }
};

window.applySavedAddress = function(index) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser && currentUser.addressBook) {
        const selected = currentUser.addressBook[index];
        document.getElementById('order-name').value = selected.name;
        document.getElementById('order-phone').value = selected.phone;
        document.getElementById('order-address').value = selected.address;
        if(selected.email) document.getElementById('order-email').value = selected.email;
        alert("ঠিকানাটি সিলেক্ট করা হয়েছে!");
    }
};

// ৩. লোকেশন কনফার্ম করা
window.getLocation = function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            // গুগোল ম্যাপের লিঙ্ক ঠিকানায় যোগ করে দেওয়া
            document.getElementById('order-address').value += `\nLocation: https://www.google.com/maps?q=${lat},${lon}`;
            alert("লোকেশন যোগ করা হয়েছে!");
        }, () => {
            alert("লোকেশন পাওয়া যায়নি। দয়া করে পারমিশন চেক করুন।");
        });
    } else {
        alert("আপনার ব্রাউজার লোকেশন সাপোর্ট করে না।");
    }
};
// ৪. ডাটাবেজে অর্ডার কনফার্ম করা
window.confirmOrder = function() {
    const name = document.getElementById('custName').value;
    const phone = document.getElementById('custNumber').value;
    const address = document.getElementById('custAddress').value;
    const payment = document.getElementById('paymentMethod').value;

    if (!name || !phone || !address) {
        alert("দয়া করে নাম, ফোন এবং ঠিকানা সঠিকভাবে দিন!");
        return;
    }

    // বাটন এনিমেশন শুরু (ঐচ্ছিক)
    const btn = document.querySelector('.confirm-btn');
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> processing...`;
    btn.disabled = true;

    const orderData = {
        customerInfo: { name, phone, address, location: globalLocation },
        items: currentOrderItems,
        totalAmount: currentOrderItems.reduce((sum, item) => sum + parseInt(item.price), 0),
        paymentMethod: payment,
        status: "Pending",
        orderDate: new Date().toLocaleString()
    };

    // Firebase Realtime Database-এ অর্ডার সেভ করা
    const ordersRef = ref(db, 'orders'); // নিশ্চিত হোন 'db' আগে ডিফাইন করা আছে
    const newOrderRef = push(ordersRef);

    set(newOrderRef, orderData)
        .then(() => {

    orderData.items.forEach(orderItem => {
    // ১. প্রোডাক্ট লিস্টে এই আইটেমটি খুঁজে বের করা
    const targetProduct = products.find(p => p.id == orderItem.id);
    
    if (targetProduct && targetProduct.fbKey) {
        // ২. বর্তমান স্টক থেকে কোয়ান্টিটি কমানো
        const currentStock = targetProduct.stock || 0;
        const newStock = Math.max(0, currentStock - (orderItem.quantity || 1));

        // ৩. Firebase-এ স্টক আপডেট করা
        const productRef = ref(db, 'products/' + targetProduct.fbKey);
        update(productRef, { stock: newStock });
    }
    });
            // ৫. অর্ডার সফল হলে হোয়াটসঅ্যাপ মেসেজ তৈরি (যাদের হোয়াটসঅ্যাপ আছে তাদের জন্য)
            let waMessage = `*New Order Confirmed!*\n\n`;
            waMessage += `Name: ${name}\nPhone: ${phone}\nAddress: ${address}\n`;
            waMessage += `Location: ${globalLocation}\n\n`;
            waMessage += `*Items:*\n`;
            currentOrderItems.forEach((item, i) => {
                waMessage += `${i+1}. ${item.name} - ${item.price} TK\n`;
            });
            waMessage += `\n*Total: ${orderData.totalAmount} TK*`;

            alert("🎉 অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে!");
            
            // হোয়াটসঅ্যাপে পাঠানো (ব্যাকআপ হিসেবে)
            window.open(`https://wa.me/8801826435150?text=${encodeURIComponent(waMessage)}`, '_blank');
            
            // ফর্ম রিসেট ও মডাল বন্ধ
            localStorage.removeItem('cart');
            window.location.reload();
        })
        .catch((error) => {
            alert("Error: " + error.message);
            btn.innerHTML = "Confirm Order";
            btn.disabled = false;
        });
};

window.closeOrderForm = function() {
    document.getElementById('order-modal').style.display = 'none';
};
////end checkout////
window.toggleCart = function() {
    const sideCart = document.getElementById('side-cart');
    if (sideCart) {
        // এটি চেক করবে 'active' ক্লাস আছে কি না, থাকলে সরাবে, না থাকলে যোগ করবে
        sideCart.classList.toggle('active');
        
        // কার্ট ওপেন হলে আইটেমগুলো আপডেট করার জন্য
        if (typeof updateCartUI === 'function') {
            updateCartUI();
        }
    } else {
        console.error("Side cart element found successfully but it might be hidden.");
    }
};

// script.js ফাইলে ফাংশনটি এভাবে লিখুন
window.toggleWishlist = function(id, name, price, image) {
    let currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        alert("Please login to add items to wishlist!");
        return;
    }

    if (!currentUser.wishlist) currentUser.wishlist = [];

    const index = currentUser.wishlist.findIndex(item => item.id === id);
    const heartIcon = document.getElementById(`heart-${id}`);

    if (index === -1) {
        // উইশলিস্টে যোগ করা
        currentUser.wishlist.push({ id, name, price, image });
        if(heartIcon) {
            heartIcon.classList.replace('far', 'fas');
            heartIcon.style.color = 'red';
        }
    } else {
        // উইশলিস্ট থেকে রিমুভ করা
        currentUser.wishlist.splice(index, 1);
        if(heartIcon) {
            heartIcon.classList.replace('fas', 'far');
            heartIcon.style.color = '#888';
        }
    }

    // ১. বর্তমানে লগইন করা ইউজারের ডাটা আপডেট
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // ২. আপনার মেইন ইউজার লিস্টেও ডাটা সিঙ্ক করা (যাতে পরে লগইন করলেও থাকে)
    let allUsers = JSON.parse(localStorage.getItem('somunexus_users')) || [];
    const userIndex = allUsers.findIndex(u => u.uid === currentUser.uid);
    if (userIndex !== -1) {
        allUsers[userIndex] = currentUser;
        localStorage.setItem('somunexus_users', JSON.stringify(allUsers));
    }
}

function updateMainUserList(updatedUser) {
    let allUsers = JSON.parse(localStorage.getItem('somunexus_users')) || [];
    const userIndex = allUsers.findIndex(u => u.uid === updatedUser.uid);
    if (userIndex !== -1) {
        allUsers[userIndex] = updatedUser;
        localStorage.setItem('somunexus_users', JSON.stringify(allUsers));
    }
}
window.onload = function() {
    displayShopProducts();
    displayAdminProducts();
    checkUserStatus(); // প্রোফাইল চেক করার জন্য
    if(typeof displayReviews === 'function') displayReviews();
};

////mobile view js/////
// হ্যামবার্গার মেনু ক্লিক করলে মেনু লিস্ট আসবে
document.getElementById('menu-toggle-btn').onclick = function() {
    var menu = document.getElementById('nav-menu');
    if (menu.style.display === "flex") {
        menu.style.display = "none";
    } else {
        menu.style.display = "flex";
    }
};
////end////
////page load java///
// এই ফাংশনটি নিশ্চিত করবে এরর থাকলেও লোডার চলে যাবে
function hideLoader() {
    try {
        const loader = document.getElementById("loader-wrapper");
        if (loader) {
            loader.classList.add("loader-hidden");
            setTimeout(() => {
                loader.style.display = "none";
            }, 800);
        }
    } catch (error) {
        console.log("Loader error caught, but continuing...");
        const loader = document.getElementById("loader-wrapper");
        if (loader) loader.style.display = "none";
    }
}

// এটি সরাসরি ব্যবহার করুন
window.addEventListener("load", hideLoader);

// ব্যাকআপ: যদি ৩ সেকেন্ডের মধ্যে লোড না হয়, জোর করে সরিয়ে দেবে
setTimeout(hideLoader, 3000);
///end page load java///


///page filter catagory///
// ১. মেনু খোলা এবং বন্ধ করার ফাংশন
function toggleCategoryMenu() {
    const menu = document.getElementById('categoryMenu');
    const icon = document.getElementById('drop-icon');
    
    if (menu) {
        menu.classList.toggle('active'); // CSS এর 'active' ক্লাসটি অ্যাড বা রিমুভ করবে
        
        // আইকন ঘুরানোর অ্যানিমেশন
        if (menu.classList.contains('active')) {
            icon.style.transform = 'rotate(180deg)';
        } else {
            icon.style.transform = 'rotate(0deg)';
        }
    } else {
        console.error("Error: categoryMenu ID খুঁজে পাওয়া যাচ্ছে না!");
    }
}

// ২. ক্যাটাগরি ফিল্টার ফাংশন
function filterCategory(category, element) {
    console.log("Filtering for:", category);
    
    // ক্যাটাগরি অনুযায়ী ডাটা ফিল্টার (আপনার আগের লজিক)
    const filtered = (category === 'all') 
        ? products 
        : products.filter(p => p.category === category);
    
    renderFilteredProducts(filtered);
    
    // মেনু বন্ধ করা
    const menu = document.getElementById('categoryMenu');
    if (menu) {
        menu.classList.remove('active');
        document.getElementById('drop-icon').style.transform = 'rotate(0deg)';
    }
}
/////End page filter catagory///

// --- CATEGORY FILTER SYSTEM (MODIFIED FOR MODULE CONTEXT) ---

// ১. ড্রপডাউন মেনু খোলা এবং বন্ধ করার ফাংশন
window.toggleCategoryMenu = function() {
    const menu = document.getElementById('categoryMenu');
    const icon = document.getElementById('drop-icon');
    if (menu) {
        menu.classList.toggle('active');
        // আইকন ঘোরানোর অ্যানিমেশন
        if (icon) {
            icon.style.transform = menu.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
        }
    }
};

// ২. ক্যাটাগরি অনুযায়ী ফিল্টার করার মূল লজিক
window.filterCategory = function(category, element) {
    console.log("Filtering products for category:", category);

    // সব ক্যাটাগরি আইটেম থেকে হাইলাইট মুছে ফেলা
    document.querySelectorAll('.cat-item').forEach(item => {
        item.style.background = "transparent";
        item.style.color = "#ccc";
    });

    // বর্তমান আইটেমকে হাইলাইট করা
    if (element) {
        element.style.background = "rgba(212, 175, 55, 0.2)";
        element.style.color = "#d4af37";
        
        // হেডার টেক্সট পরিবর্তন (ঐচ্ছিক - প্রিমিয়াম ফিল দেয়)
        const headerSpan = document.querySelector('.category-header span');
        if (headerSpan) headerSpan.innerText = element.innerText;
    }

    // ফিল্টার লজিক: Firebase থেকে আসা 'products' অ্যারে ব্যবহার করা হচ্ছে
    let filteredResults = [];
    if (category === 'all') {
        filteredResults = products;
    } else {
        // নিশ্চিত করুন আপনার Firebase ডাটাতে 'category' ফিল্ডটি আছে
        filteredResults = products.filter(p => p.category === category);
    }

    // আপনার বিদ্যমান রেন্ডার ফাংশনটি কল করা (যা আপনি সার্চে ব্যবহার করেছেন)
    if (typeof renderFilteredProducts === 'function') {
        renderFilteredProducts(filteredResults);
    } else {
        console.error("renderFilteredProducts function not found!");
    }

    // ড্রপডাউন বন্ধ করা
    const menu = document.getElementById('categoryMenu');
    if (menu) {
        menu.classList.remove('active');
        const icon = document.getElementById('drop-icon');
        if (icon) icon.style.transform = 'rotate(0deg)';
    }

    // স্মুথ স্ক্রল করে প্রোডাক্ট সেকশনে নিয়ে যাওয়া
    const container = document.getElementById('product-container');
    if (container) {
        container.scrollIntoView({ behavior: 'smooth' });
    }
};

// বাইরে ক্লিক করলে ড্রপডাউন বন্ধ হওয়ার লজিক
document.addEventListener('click', (e) => {
    const wrapper = document.querySelector('.category-wrapper');
    const menu = document.getElementById('categoryMenu');
    if (wrapper && !wrapper.contains(e.target)) {
        if (menu) menu.classList.remove('active');
        const icon = document.getElementById('drop-icon');
        if (icon) icon.style.transform = 'rotate(0deg)';
    }
});

// এই ফাংশনটি আপনার script.js এর একদম নিচে যোগ করুন
// আপনার script.js এর একদম নিচে এটি পেস্ট করুন
window.updateQty = function(index, change) {
    console.log("Updating index:", index, "by:", change); // চেক করার জন্য

    if (window.cart && window.cart[index]) {
        let currentQty = parseInt(window.cart[index].quantity) || 1;
        let newQty = currentQty + change;

        // পরিমাণ ১ এর নিচে নামতে দিবে না
        if (newQty < 1) return;
        // --- ডায়নামিক স্টক চেক শুরু ---
        const productId = window.cart[index].id;
        const originalProduct = products.find(p => String(p.id) === String(productId));

if (originalProduct && originalProduct.stock !== undefined) {
    const stockNum = parseInt(originalProduct.stock); // স্টককে সংখ্যায় রূপান্তর
    if (change > 0 && newQty > stockNum) {
        alert("দুঃখিত, আমাদের স্টকে মাত্র " + stockNum + "টি প্রোডাক্ট আছে!");
        return; 
    }
}
        // --- ডায়নামিক স্টক চেক শেষ ---
        // ১. লোকাল কার্ট আপডেট
        window.cart[index].quantity = newQty;

        // ২. Firebase-এ সেভ করা
        // আপনার কোডে যেভাবে firebase ইমপোর্ট করা আছে সেটি নিশ্চিত করতে এই পদ্ধতিটি ব্যবহার করুন
        try {
            // আপনার ইমপোর্ট করা Firebase ফাংশনগুলো ব্যবহার করে আপডেট
            const { ref, set } = window.firebaseDB || {}; // যদি গ্লোবাল থাকে
            
            // যদি আপনার ইমপোর্ট সরাসরি থাকে, তবে নিচের লাইনটি কাজ করবে
            const userCartRef = window.firebaseRef(window.firebaseDb, 'userCarts/' + userId);
            window.firebaseSet(userCartRef, window.cart)
                .then(() => {
                    console.log("Firebase sync complete!");
                    updateCartUI(); // UI রিফ্রেশ করা
                })
                .catch(err => console.error("Firebase update failed:", err));
                
        } catch (e) {
            // যদি উপরেরটা কাজ না করে, তবে সরাসরি আপনার addToCart স্টাইলে কল করুন
            console.log("Using fallback sync...");
            const userCartRef = ref(db, 'userCarts/' + userId);
            set(userCartRef, window.cart).then(() => {
                updateCartUI();
            });
        }
    }
};
// ১. কার্ট আইকনের পজিশন বের করার ফাংশন
document.addEventListener('click', function(e) {
    // বাটন ডিটেক্ট করা
    const btn = e.target.closest('.add-to-cart-btn');
    if (!btn) return;

    // ১. আপনার নিচের কার্ট আইকনের আইডি বা ক্লাস এখানে দিন
    // আপনার ছবিতে এটি একটি ফ্লোটিং বাটন, আমি ধরে নিচ্ছি এর আইডি 'floating-cart'
    // যদি আইডি না থাকে তবে নিচের ক্লাসের নাম আপনার আইকনের সাথে মিলিয়ে নিন
    const cartIcon = document.querySelector('.cart-floating-icon') || 
                     document.querySelector('.shopping-cart') || 
                     document.getElementById('cart-btn');

    const btnRect = btn.getBoundingClientRect();
    let cartRect;

    if (cartIcon) {
        cartRect = cartIcon.getBoundingClientRect();
    } else {
        // যদি আইকন খুঁজে না পায় তবে ডিফল্ট নিচের ডান কোণায় যাবে (যেখানে আপনার আইকনটি আছে)
        cartRect = { left: window.innerWidth - 60, top: window.innerHeight - 60 };
    }

    // ২. নম্বর তৈরি
    const flyNum = document.createElement('div');
    flyNum.className = 'fly-number';
    flyNum.innerText = '+1';
    
    flyNum.style.left = `${btnRect.left + btnRect.width / 2}px`;
    flyNum.style.top = `${btnRect.top}px`;

    // ৩. নিচের দিকে যাওয়ার হিসাব
    const diffX = cartRect.left - (btnRect.left + btnRect.width / 2) + 20;
    const diffY = cartRect.top - btnRect.top + 20;
    
    flyNum.style.setProperty('--target-x', `${diffX}px`);
    flyNum.style.setProperty('--target-y', `${diffY}px`);

    document.body.appendChild(flyNum);

    setTimeout(() => flyNum.remove(), 900);
});

///menu button js///
// মেনু ওপেন/ক্লোজ লজিক
// SomuNexus Final Menu System
document.addEventListener('DOMContentLoaded', function() {
    const menuBtn = document.getElementById('menu-toggle-btn');
    const navMenu = document.getElementById('nav-menu');
    
    // ১. ওভারলে তৈরি বা খুঁজে বের করা
    let overlay = document.querySelector('.menu-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'menu-overlay';
        document.body.appendChild(overlay);
    }

    // ২. ক্লোজ (X) বাটন তৈরি করা (যদি না থাকে)
    if (navMenu && !document.querySelector('.close-btn-menu')) {
        const closeIcon = document.createElement('div');
        closeIcon.innerHTML = '&times;'; // এটি 'X' চিহ্ন তৈরি করবে
        closeIcon.className = 'close-btn-menu';
        navMenu.appendChild(closeIcon);
        
        // ক্লোজ বাটনে ক্লিক করলে মেনু বন্ধ
        closeIcon.onclick = function() {
            closeMenu();
        };
    }

    // ৩. মেনু খোলার ফাংশন
    if (menuBtn) {
        menuBtn.onclick = function(e) {
            e.preventDefault();
            navMenu.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // স্ক্রল বন্ধ
        };
    }

    // ৪. মেনু বন্ধ করার ফাংশন
    function closeMenu() {
        navMenu.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = 'auto'; // স্ক্রল চালু
    }

    // ওভারলেতে ক্লিক করলে বন্ধ
    overlay.onclick = closeMenu;

    // মেনুর আইটেমে ক্লিক করলে বন্ধ (স্মুথ নেভিগেশনের জন্য)
    const links = document.querySelectorAll('.nav-item');
    links.forEach(link => {
        link.onclick = closeMenu;
    });
});
///End menu button js///

// ডেলিভারি চার্জ হিসাব করার মেইন ফাংশন
// এই দুটি ভ্যারিয়েবল ফাংশনের বাইরে উপরে ঘোষণা করো
let currentInsideCharge = parseInt(localStorage.getItem('lastInsideCharge')) || 60; 
let currentOutsideCharge = parseInt(localStorage.getItem('lastOutsideCharge')) || 120;

window.calculateDelivery = function() {
    const addressField = document.getElementById('order-address');
    const subtotalText = document.getElementById('selected-total-display').innerText;
    
    const subtotal = parseInt(subtotalText.replace(/[^0-9]/g, '')) || 0;
    const address = addressField.value.toLowerCase();
    
    let deliveryCharge = 0;

    // পরিবর্তন এখানে: সরাসরি ৬০/১২০ না লিখে ভ্যারিয়েবল ব্যবহার করছি
    if (address.includes("dhaka")) {
        deliveryCharge = currentInsideCharge; // অ্যাডমিন থেকে পাওয়া ঢাকার ভেতর চার্জ
    } else if (address.length > 5) {
        deliveryCharge = currentOutsideCharge; // অ্যাডমিন থেকে পাওয়া ঢাকার বাইরের চার্জ
    }

    document.getElementById('subtotal-display').innerText = subtotal;
    document.getElementById('delivery-charge-display').innerText = deliveryCharge;
    document.getElementById('final-total-display').innerText = subtotal + deliveryCharge;
};
// তোমার বর্তমান calculateDelivery ফাংশন যেখানে শেষ হয়েছে, তার নিচেই এটি পেস্ট করো
window.updateDeliveryRates = function(inside, outside) {
    currentInsideCharge = parseInt(inside) || 60; 
    currentOutsideCharge = parseInt(outside) || 120; 
    
    // ব্রাউজারে সেভ করে রাখা হচ্ছে যাতে রিফ্রেশ দিলেও না হারায়
    localStorage.setItem('lastInsideCharge', currentInsideCharge);
    localStorage.setItem('lastOutsideCharge', currentOutsideCharge);
    
    if (typeof window.calculateDelivery === 'function') {
        window.calculateDelivery();
    }
};

// যখনই ইউজার ঠিকানা লিখবে বা সিলেক্ট করবে, তখনই চার্জ আপডেট হবে
const addressInput = document.getElementById('order-address');
if (addressInput) {
    addressInput.addEventListener('input', window.calculateDelivery);
}

// আগের proceedToCheckout ফাংশনটি খোলার সময়ও যেন হিসাবটা হয়ে যায়
const originalProceed = window.proceedToCheckout;
window.proceedToCheckout = function() {
    if (typeof originalProceed === 'function') originalProceed();
    setTimeout(window.calculateDelivery, 500); // মডাল খোলার আধা সেকেন্ড পর ক্যালকুলেট হবে
};

// আগের applySavedAddress ফাংশনেও এটি যোগ করা হলো যাতে সেভ করা অ্যাড্রেস নিলেও কাজ করে
const originalApply = window.applySavedAddress;
window.applySavedAddress = function(index) {
    if (typeof originalApply === 'function') originalApply(index);
    setTimeout(window.calculateDelivery, 300);
};

// index.html এর জন্য নোটিফিকেশন লজিক
// --- নতুন নোটিফিকেশন সিস্টেম ---
let statusTracker = {}; 
let isPageJustLoaded = true;

const initNotificationSystem = () => {
    const userId = localStorage.getItem('userId') || (JSON.parse(localStorage.getItem('currentUser') || '{}')?.uid);
    
    if (typeof window.onValue !== "function" || !userId) {
        console.log("Firebase or User ID not ready, retrying...");
        setTimeout(initNotificationSystem, 2000);
        return;
    }

    const productsRefForUI = window.ref(window.db, 'products');
    const ordersRef = window.ref(window.db, 'orders');
    
// --- ১. প্রোডাক্ট আপডেট করার লিসেনার ---
window.onValue(productsRefForUI, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        // রিয়েল-টাইম ডাটাবেজ থেকে আসা ডাটা সেট করা
        window.products = Object.keys(data).map(key => ({
            ...data[key],
            fbKey: key 
        }));

        // ২. ৩-৪ সেকেন্ড পর যেন পুরনো ডাটা ফিরে না আসে, তাই এটি কল করা জরুরি
        if (typeof window.displayShopProducts === "function") {
            window.displayShopProducts(); 
        }
        
        // ৩. অ্যাডমিন প্যানেলও আপডেট করে দেওয়া যাতে সিঙ্ক থাকে
        if (typeof window.displayAdminProducts === "function") {
            window.displayAdminProducts();
        }
    }
});

    // --- ২. অর্ডার স্ট্যাটাস নোটিফিকেশন লিসেনার (এটি আগের মতোই থাকবে) ---
    window.onValue(ordersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            Object.keys(data).forEach(id => {
                const order = data[id];
                if (order.userId === userId) {
                    const currentStatus = order.status || 'Pending';
                    
                    if (!isPageJustLoaded && statusTracker[id] && statusTracker[id] !== currentStatus) {
                        window.showStatusNotification("অর্ডার <b>#" + id.slice(-5) + "</b> এখন <b>" + currentStatus + "</b>!");
                    }
                    statusTracker[id] = currentStatus;
                }
            });
        }
        isPageJustLoaded = false; 
    });
};

// নোটিফিকেশন দেখানোর ফাংশন (নিশ্চিত হওয়ার জন্য আবার দিচ্ছি)
window.showStatusNotification = function(message) {
    const noti = document.getElementById('custom-notification');
    const msgBox = document.getElementById('noti-message');
    
    if (noti && msgBox) {
        msgBox.innerHTML = message;
        noti.classList.add('show');
        console.log("Notification Showing: " + message); // টেস্ট করার জন্য কনসোল লগ

        setTimeout(() => {
            noti.classList.remove('show');
        }, 5000);
    } else {
        console.error("HTML Elements (custom-notification) not found!");
    }
};
// সিস্টেম চালু করা
initNotificationSystem();

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

