// ===== PAGE NAVIGATION =====
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  const navEl = document.getElementById('nav-' + id);
  if (navEl) navEl.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(observeReveal, 100);
}

function scrollToSection(id) {
  setTimeout(() => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

// ===== MOBILE MENU =====
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');
const menuIcon = document.getElementById('menuIcon');

menuToggle.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.toggle('open');
  menuIcon.textContent = isOpen ? 'close' : 'menu';
});

function closeMobileMenu() {
  mobileMenu.classList.remove('open');
  menuIcon.textContent = 'menu';
}

// ===== FAQ ACCORDION =====
function toggleFaq(el) {
  const item = el.closest('.faq-item');
  const allItems = document.querySelectorAll('.faq-item');
  allItems.forEach(i => { if (i !== item) i.classList.remove('open'); });
  item.classList.toggle('open');
}

// ===== SCROLL REVEAL =====
function observeReveal() {
  const reveals = document.querySelectorAll('.reveal:not(.visible)');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  reveals.forEach(el => observer.observe(el));
}

observeReveal();
document.addEventListener('scroll', observeReveal, { passive: true });

// ===== HEADER SCROLL EFFECT =====
window.addEventListener('scroll', () => {
  const h = document.getElementById('siteHeader');
  if (window.scrollY > 20) {
    h.style.boxShadow = '0 2px 20px rgba(27,94,32,0.12)';
  } else {
    h.style.boxShadow = '0 1px 12px rgba(27,94,32,0.06)';
  }
}, { passive: true });