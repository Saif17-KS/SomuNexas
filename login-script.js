// ফর্ম পরিবর্তন করার লজিক
function showForm(type) {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const btns = document.querySelectorAll('.tab-btn');

    if (type === 'login') {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        btns[0].classList.add('active');
        btns[1].classList.remove('active');
    } else {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        btns[1].classList.add('active');
        btns[0].classList.remove('active');
    }
}

// সাইন আপ হ্যান্ডলার
async function handleSignup() {
    // ১. ফর্ম থেকে ডাটা নেওয়া (তোমার কোডই রাখা হয়েছে)
    const name = document.getElementById('regName').value;
    const phone = document.getElementById('regPhone').value;
    const email = document.getElementById('regEmail').value || "No Email";
    const religion = document.getElementById('regReligion').value;
    const country = document.getElementById('regCountry').value;
    const address = document.getElementById('regAddress').value;
    const pass = document.getElementById('regPass').value;
    
    if (!name || !phone || !pass) {
        alert("Please fill necessary fields!");
        return;
    }

    // ২. প্রফেশনাল চেক: ডাটাবেস থেকে নম্বর চেক করা
    const usersRef = window.ref(window.db, 'users');
    
    try {
        // ফায়ারবেস থেকে ডাটা রিড করা
        const snapshot = await window.get(usersRef); 
        let isDuplicate = false;

        if (snapshot.exists()) {
            const data = snapshot.val();
            // তোমার দেওয়া নম্বরটি কি অন্য কারো সাথে মিলে যাচ্ছে?
            for (let id in data) {
                if (data[id].phone === phone) {
                    isDuplicate = true;
                    break;
                }
            }
        }

        if (isDuplicate) {
            alert("এই নম্বর দিয়ে আগেই অ্যাকাউন্ট খোলা হয়েছে! দয়া করে লগইন করুন।");
            showForm('login'); 
            return; // নম্বর ডুপ্লিকেট হলে এখানেই কোড থেমে যাবে, আর সেভ হবে না।
        } else {
            // ৩. নতুন ইউজার তৈরি (তোমার অবজেক্ট ফরম্যাট ঠিক রাখা হয়েছে)
            const uid = "user_" + Date.now();
            const user = {
                uid: uid,
                name: name,
                phone: phone,
                email: email,
                religion: religion,
                country: country,
                address: address,
                pass: pass,
                profilePic: "https://via.placeholder.com/150"
            };

            // ফায়ারবেসে সেভ করা
            await window.set(window.ref(window.db, 'users/' + uid), user);
            
            // লোকাল স্টোরেজে ব্যাকআপ রাখা
            let users = JSON.parse(localStorage.getItem('somunexus_users')) || [];
            users.push(user);
            localStorage.setItem('somunexus_users', JSON.stringify(users));
            
            // ৪. সফল হওয়ার পর ফর্ম রিসেট (এটি পাসওয়ার্ড সেভ পপ-আপ আনতে সাহায্য করে)
            const signupFormTag = document.querySelector('#signupForm form');
            if(signupFormTag) signupFormTag.reset();

            alert("Account Created Successfully!");
            showForm('login');
        }
    } catch (error) {
        // পারমিশন ডিনাইড বা অন্য কোনো এরর হ্যান্ডলিং
        alert("Firebase Error: " + error.message);
    }
}
//////////
// ১. Google Login Function
// ১. Google Login Function (Firebase এর সাথে কানেক্টেড)
function loginWithGoogle() {
    console.log("Google Login Initialized...");
    // এটি আমাদের HTML-এর মডিউল ফাংশনটিকে কল করবে
    if (typeof window.firebaseGoogleLogin === "function") {
        window.firebaseGoogleLogin();
    } else {
        alert("Firebase is still loading... please wait.");
    }
}

// ২. Facebook Login Function
function loginWithFacebook() {
    alert("Connecting to Facebook...");
}


// ৪. লগইন হ্যান্ডলার (ইমেইল/ফোন ও পাসওয়ার্ড)
async function handleLogin() {
    const loginId = document.getElementById('loginId').value.trim();
    const loginPass = document.getElementById('loginPass').value.trim();
    
    // ১. ফায়ারবেস রেফারেন্স (তোমার ডাটাবেস রুলস অনুযায়ী)
    const usersRef = window.ref(window.db, 'users');

    try {
        // ২. ডাটাবেস থেকে সব ইউজার নিয়ে আসা
        const snapshot = await window.get(usersRef);
        let validUser = null;

        if (snapshot.exists()) {
            const allUsers = snapshot.val();
            // ৩. তোমার লজিক অনুযায়ী ইউজার খুঁজে বের করা
            for (let id in allUsers) {
                const u = allUsers[id];
                if ((u.phone === loginId || u.email === loginId) && u.pass === loginPass) {
                    validUser = u;
                    break;
                }
            }
        }
        
        if (validUser) {
            // এই ২টা লাইন সবচেয়ে জরুরি (যা তুমি চেয়েছ):
            localStorage.setItem('currentUser', JSON.stringify(validUser));
            localStorage.setItem('userId', validUser.uid); 

            // পাসওয়ার্ড সেভ পপ-আপের জন্য ফরম রিসেট
            const loginForm = document.querySelector('#loginForm form');
            if(loginForm) loginForm.reset();

            alert("Welcome back, " + validUser.name + "!");
            window.location.href = "index.html"; 
        } else {
            // ভুল নম্বর দিলে এই মেসেজ আসবে
            alert("ভুল নম্বর বা পাসওয়ার্ড দিয়েছেন!");
        }
    } catch (error) {
        alert("Firebase Error: " + error.message);
    }
}

document.getElementById('toggleRegPass').addEventListener('click', function () {
    const passwordInput = document.getElementById('regPass');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        this.classList.replace('fa-eye', 'fa-eye-slash'); // চোখ বন্ধ আইকন
    } else {
        passwordInput.type = 'password';
        this.classList.replace('fa-eye-slash', 'fa-eye'); // চোখ খোলা আইকন
    }
});
const toggleBtn = document.getElementById('toggleRegPass');
const passwordField = document.getElementById('loginPass');

toggleBtn.addEventListener('click', function() {
    // পাসওয়ার্ড দেখা বা লুকানোর লজিক
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        this.classList.replace('fa-eye', 'fa-eye-slash'); // চোখ বন্ধ আইকন আসবে
    } else {
        passwordField.type = 'password';
        this.classList.replace('fa-eye-slash', 'fa-eye'); // চোখ খোলা আইকন আসবে
    }
});
// আপনার জাভাস্ক্রিপ্টে এই ফাংশনটি যোগ করুন
function setupPasswordToggle(toggleId, inputId) {
    const toggleBtn = document.getElementById(toggleId);
    const passwordField = document.getElementById(inputId);

    if (toggleBtn && passwordField) {
        toggleBtn.addEventListener('click', function() {
            // টাইপ পরিবর্তন
            const type = passwordField.type === 'password' ? 'text' : 'password';
            passwordField.type = type;
            
            // আইকন পরিবর্তন (eye থেকে eye-slash)
            this.classList.toggle('fa-eye-slash');
            this.classList.toggle('fa-eye');
        });
    }
}

// এখন এই লাইনগুলো দিয়ে আপনার ২টা বক্সই চালু করুন
// এই অংশটুকু সব ডিলিট করে শুধু নিচের টুকু রাখুন
setupPasswordToggle('toggleRegPass', 'regPass');    // সাইন-আপ এর জন্য
setupPasswordToggle('toggleLoginPass', 'loginPass'); // লগইন এর জন্য
// setupPasswordToggle('toggleLoginPass', 'loginPass'); // লগইন বক্সের জন্য (যদি আলাদা আইডি থাকে)

