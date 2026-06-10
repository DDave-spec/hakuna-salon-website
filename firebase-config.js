// ================================================================
// firebase-config.js
// HAKUNA Hair Salon — Firebase & EmailJS Configuration
// ================================================================

// ── Firebase Configuration ──────────────────────────────────────
var FIREBASE_CONFIG = {
  apiKey:            "AIzaSyCElVQkG9aNspvYs-Q9fYZ537m20a-g3eE",
  authDomain:        "hakuna-appointments.firebaseapp.com",
  projectId:         "hakuna-appointments",
  storageBucket:     "hakuna-appointments.firebasestorage.app",
  messagingSenderId: "693184687890",
  appId:             "1:693184687890:web:598a88de38652e13cb4dcb"
};

// ── EmailJS Configuration ────────────────────────────────────────
var EMAILJS_CONFIG = {
  publicKey:                   "PiG2C-8pz_YHqtnXC",
  serviceId:                   "service_s4r172i",
  adminNotificationTemplateId: "template_xytfo4q",
  customerConfirmTemplateId:   "template_vhq09b8"
};

// ── Salon Info ───────────────────────────────────────────────────
var SALON_CONFIG = {
  name:    "HAKUNA Human Hair",
  email:   "businesseji34@gmail.com",
  phone:   "+234 904 320 0000",
  address: "Utako Zuma Garden, Abuja, Nigeria"
};

// ── Initialise Firebase ──────────────────────────────────────────
firebase.initializeApp(FIREBASE_CONFIG);
var db = firebase.firestore();

// ── Initialise EmailJS ───────────────────────────────────────────
emailjs.init(EMAILJS_CONFIG.publicKey);

console.log("[HAKUNA] Firebase and EmailJS initialised successfully");