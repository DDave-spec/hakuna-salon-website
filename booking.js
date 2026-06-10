// ================================================================
// booking.js
// HAKUNA Hair Salon — Appointment Booking System
//
// Responsibilities:
//  1. Validate all form fields (name, email, phone, service, date)
//  2. Save appointment to Firebase Firestore ("appointments" collection)
//  3. Send admin notification email via EmailJS
//  4. Send customer confirmation email via EmailJS
//  5. Show success / error UI states
//  6. Prevent duplicate submissions (button lock while processing)
//
// Dependencies (loaded before this file in index.html):
//  - firebase-app-compat.js
//  - firebase-firestore-compat.js
//  - emailjs browser SDK
//  - firebase-config.js  ← db, EMAILJS_CONFIG, SALON_CONFIG
// ================================================================



// ────────────────────────────────────────────────────────────────
// DOM REFERENCES
// Grab all form elements once on load — avoids repeated querying
// ────────────────────────────────────────────────────────────────
const bookingForm      = document.getElementById('bookingForm');
const bookingSuccess   = document.getElementById('bookingSuccess');
const bookingError     = document.getElementById('bookingError');
const bookingErrorMsg  = document.getElementById('bookingErrorMsg');
const submitBtn        = document.getElementById('bookingSubmitBtn');
const btnText          = document.getElementById('btnText');
const btnIcon          = document.getElementById('btnIcon');
const btnSpinner       = document.getElementById('btnSpinner');

// Individual field inputs
const fieldName    = document.getElementById('appt-name');
const fieldEmail   = document.getElementById('appt-email');
const fieldPhone   = document.getElementById('appt-phone');
const fieldService = document.getElementById('appt-service');
const fieldDate    = document.getElementById('appt-date');
const fieldNotes   = document.getElementById('appt-notes');

// ────────────────────────────────────────────────────────────────
// DATE RESTRICTION
// Prevent selecting past dates — set the <input type="date"> min
// attribute to today's date on page load
// ────────────────────────────────────────────────────────────────
(function setMinDate() {
  const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
  if (fieldDate) fieldDate.setAttribute('min', today);
})();

// ────────────────────────────────────────────────────────────────
// VALIDATION HELPERS
// ────────────────────────────────────────────────────────────────

/**
 * Show an inline error message below a field.
 * @param {string} fieldId - The id of the error <span> element
 * @param {string} message - Error text to display
 */
function showFieldError(fieldId, message) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  el.textContent = message;
  el.style.display = 'block';
}

/**
 * Clear a single field's error message.
 * @param {string} fieldId
 */
function clearFieldError(fieldId) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  el.textContent = '';
  el.style.display = 'none';
}

/** Clear ALL field errors at once */
function clearAllErrors() {
  ['err-name','err-email','err-phone','err-service','err-date'].forEach(clearFieldError);
  bookingError.style.display = 'none';
}

/**
 * Validate all fields and return true if everything is valid.
 * Shows individual inline errors where needed.
 * @returns {boolean}
 */
function validateForm() {
  let valid = true;

  // --- Full Name: not empty, at least 2 chars ---
  const name = fieldName.value.trim();
  if (!name) {
    showFieldError('err-name', 'Please enter your full name.');
    valid = false;
  } else if (name.length < 2) {
    showFieldError('err-name', 'Name must be at least 2 characters.');
    valid = false;
  } else {
    clearFieldError('err-name');
  }

  // --- Email: valid format ---
  const email = fieldEmail.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    showFieldError('err-email', 'Please enter your email address.');
    valid = false;
  } else if (!emailRegex.test(email)) {
    showFieldError('err-email', 'Please enter a valid email (e.g. name@email.com).');
    valid = false;
  } else {
    clearFieldError('err-email');
  }

  // --- Phone: Nigerian format — 11 digits starting 0, or +234 format ---
  const phone = fieldPhone.value.trim();
  // Accepts: 08012345678 | +2348012345678 | 2348012345678 | spaces/dashes optional
  const phoneRegex = /^(\+?234|0)[789][01]\d{8}$/;
  const phoneStripped = phone.replace(/[\s\-().]/g, ''); // strip formatting chars
  if (!phone) {
    showFieldError('err-phone', 'Please enter your phone number.');
    valid = false;
  } else if (!phoneRegex.test(phoneStripped)) {
    showFieldError('err-phone', 'Enter a valid Nigerian number (e.g. 08012345678 or +2348012345678).');
    valid = false;
  } else {
    clearFieldError('err-phone');
  }

  // --- Service: must not be empty/placeholder ---
  if (!fieldService.value) {
    showFieldError('err-service', 'Please select a service.');
    valid = false;
  } else {
    clearFieldError('err-service');
  }

  // --- Date: must be selected and not in the past ---
  const selectedDate = fieldDate.value;
  const today = new Date().toISOString().split('T')[0];
  if (!selectedDate) {
    showFieldError('err-date', 'Please select your preferred appointment date.');
    valid = false;
  } else if (selectedDate < today) {
    showFieldError('err-date', 'Please select a future date.');
    valid = false;
  } else {
    clearFieldError('err-date');
  }

  return valid;
}

// ────────────────────────────────────────────────────────────────
// UI STATE HELPERS
// ────────────────────────────────────────────────────────────────

/** Switch submit button to loading state */
function setLoadingState() {
  submitBtn.disabled = true;
  btnText.textContent = 'Booking…';
  btnIcon.style.display = 'none';
  btnSpinner.style.display = 'inline-block';
}

/** Restore submit button to default state */
function clearLoadingState() {
  submitBtn.disabled = false;
  btnText.textContent = 'Book Appointment';
  btnIcon.style.display = 'inline-block';
  btnSpinner.style.display = 'none';
}

/** Show the global error banner with a custom message */
function showGlobalError(message) {
  bookingErrorMsg.textContent = message;
  bookingError.style.display = 'block';
  // Scroll error into view smoothly
  bookingError.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ────────────────────────────────────────────────────────────────
// FIRESTORE — SAVE APPOINTMENT
// Writes one document to the "appointments" collection.
// Returns the new document's ID on success.
// ────────────────────────────────────────────────────────────────
async function saveAppointmentToFirestore(data) {
  // db is initialised in firebase-config.js
  const docRef = await db.collection('appointments').add({
    fullName:      data.fullName,
    email:         data.email,
    phone:         data.phone,
    service:       data.service,
    preferredDate: data.preferredDate,
    notes:         data.notes || '',
    status:        'pending',           // admin dashboard can update this later
    createdAt:     firebase.firestore.FieldValue.serverTimestamp(),
    // Human-readable timestamp for email templates
    timestamp:     new Date().toLocaleString('en-NG', {
                     dateStyle: 'full', timeStyle: 'short', timeZone: 'Africa/Lagos'
                   })
  });
  return docRef.id; // return the Firestore document ID
}

// ────────────────────────────────────────────────────────────────
// EMAILJS — SEND EMAILS
// Uses two separate templates:
//  1. Admin notification → SALON_CONFIG.email
//  2. Customer confirmation → customer's email
// Both use the same template variables object for simplicity.
// ────────────────────────────────────────────────────────────────

/**
 * Build the shared template params object used in both emails.
 * Variable names must match your EmailJS template placeholders.
 */
function buildEmailParams(data, appointmentId) {
  return {
    // Customer details
    fullName:      data.fullName,
    email:         data.email,          // EmailJS uses this as "to" in customer template
    phone:         data.phone,
    service:       data.service,
    preferredDate: new Date(data.preferredDate + 'T00:00:00')
                     .toLocaleDateString('en-NG', {
                       weekday: 'long', year: 'numeric',
                       month: 'long',  day: 'numeric'
                     }),
    notes:         data.notes || 'None',
    timestamp:     new Date().toLocaleString('en-NG', {
                     dateStyle: 'full', timeStyle: 'short', timeZone: 'Africa/Lagos'
                   }),
    appointmentId,                      // Firestore doc ID — useful for admin reference
    // Salon contact details (used in customer email template)
    salonName:     SALON_CONFIG.name,
    salonPhone:    SALON_CONFIG.phone,
    salonAddress:  SALON_CONFIG.address,
    adminEmail:    SALON_CONFIG.email   // where admin notification is sent
  };
}

/**
 * Send admin notification email.
 * Wrapped in try/catch so a failed email never blocks the Firestore save.
 */
async function sendAdminEmail(params) {
  try {
    await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.adminNotificationTemplateId,
      params
    );
    console.log('[HAKUNA] Admin notification sent ✓');
  } catch (err) {
    // Log the error but don't throw — appointment is already saved
    console.warn('[HAKUNA] Admin email failed (non-critical):', err);
  }
}

/**
 * Send customer confirmation email.
 * Also wrapped in try/catch — Firestore save takes priority.
 */
async function sendCustomerEmail(params) {
  try {
    await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.customerConfirmTemplateId,
      params
    );
    console.log('[HAKUNA] Customer confirmation sent ✓');
  } catch (err) {
    console.warn('[HAKUNA] Customer email failed (non-critical):', err);
  }
}

// ────────────────────────────────────────────────────────────────
// RESET FORM
// Called by the "Book Another Appointment" button in success state
// ────────────────────────────────────────────────────────────────
function resetBookingForm() {
  bookingForm.reset();
  bookingSuccess.style.display = 'none';
  bookingForm.style.display    = 'block';
  clearAllErrors();
  clearLoadingState();
  // Re-set min date after reset
  const today = new Date().toISOString().split('T')[0];
  if (fieldDate) fieldDate.setAttribute('min', today);
}
// Expose globally so the inline onclick in HTML can call it
window.resetBookingForm = resetBookingForm;

// ────────────────────────────────────────────────────────────────
// MAIN SUBMIT HANDLER
// Orchestrates: validate → save → email → show success/error
// ────────────────────────────────────────────────────────────────
bookingForm.addEventListener('submit', async (e) => {
  e.preventDefault(); // always prevent default page reload

  // 1. Clear previous errors
  clearAllErrors();

  // 2. Validate — abort early if invalid
  if (!validateForm()) {
    // Scroll to the first visible error
    const firstError = bookingForm.querySelector('.form-error[style*="block"]');
    if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  // 3. Lock the UI — prevent duplicate submissions
  setLoadingState();

  // 4. Collect form data
  const appointmentData = {
    fullName:      fieldName.value.trim(),
    email:         fieldEmail.value.trim().toLowerCase(),
    phone:         fieldPhone.value.trim(),
    service:       fieldService.value,
    preferredDate: fieldDate.value,       // stored as "YYYY-MM-DD" in Firestore
    notes:         fieldNotes.value.trim()
  };

  try {
    // 5. Save to Firestore — this is the critical step
    const appointmentId = await saveAppointmentToFirestore(appointmentData);
    console.log('[HAKUNA] Appointment saved to Firestore. ID:', appointmentId);

    // 6. Build shared email params
    const emailParams = buildEmailParams(appointmentData, appointmentId);

    // 7. Send both emails in parallel (non-blocking if one fails)
    await Promise.allSettled([
      sendAdminEmail(emailParams),
      sendCustomerEmail(emailParams)
    ]);

    // 8. Show success state
    bookingForm.style.display    = 'none';
    bookingSuccess.style.display = 'block';
    bookingSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });

  } catch (err) {
    // 9. Handle errors — show exact error for easy diagnosis
    console.error('[HAKUNA] Booking failed:', err);

    let userMessage = 'Error: ' + (err.code || err.message || 'Unknown — check browser console (F12)');

    if (err.code === 'permission-denied') {
      userMessage = 'Permission denied — go to Firebase Console > Firestore > Rules tab and redeploy your firestore.rules file.';
    } else if (err.code === 'unavailable' || !navigator.onLine) {
      userMessage = 'No internet connection. Please check your network and try again.';
    } else if (err.code === 'resource-exhausted') {
      userMessage = 'Booking system is busy. Please try again in a few minutes.';
    }

    showGlobalError(userMessage);
    clearLoadingState(); // re-enable button so user can retry

  }
});

// ────────────────────────────────────────────────────────────────
// REAL-TIME INLINE VALIDATION
// Clear an error as soon as the user starts correcting it —
// gives immediate positive feedback without waiting for re-submit
// ────────────────────────────────────────────────────────────────
fieldName.addEventListener('input',    () => clearFieldError('err-name'));
fieldEmail.addEventListener('input',   () => clearFieldError('err-email'));
fieldPhone.addEventListener('input',   () => clearFieldError('err-phone'));
fieldService.addEventListener('change',() => clearFieldError('err-service'));
fieldDate.addEventListener('change',   () => clearFieldError('err-date'));