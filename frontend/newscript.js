// ============================================
// TRIPCONNECT - COMPLETE JAVASCRIPT
// Dynamic Hero Slider, Animations & Interactions
// ============================================

// Dynamic Destination Slideshow Class
const destinationData = {
goa: {
title: "Goa",
subtitle: "Beaches • Nightlife • Relaxation"
},
jaipur: {
title: "Jaipur",
subtitle: "Royal Heritage • Palaces • Culture"
},
manali: {
title: "Manali",
subtitle: "Snow • Mountains • Adventure"
},
rishikesh: {
title: "Rishikesh",
subtitle: "Yoga • Ganga • Spirituality"
},
ayodhya: {
title: "Ayodhya",
subtitle: "Faith • History • Devotion"
}
};

class DestinationSlideshow {
constructor() {
this.slides = document.querySelectorAll('.slide');
this.indicators = document.querySelectorAll('.indicator');
this.currentSlide = 0;
this.autoPlay = true;
this.interval = null;
this.init();
}

init() {
this.updateDestinationInfo();
this.startSlideshow();
this.bindNavigation();
this.bindHoverEffects();
}

updateDestinationInfo() {
const activeSlide = this.slides[this.currentSlide];
const destinationKey = activeSlide.dataset.destination;
const infoBox = activeSlide.querySelector('.destination-info');

const data = destinationData[destinationKey];

if (data && infoBox) {
infoBox.innerHTML = `
<h3>${data.title}</h3>
<p>${data.subtitle}</p>
`;
}
}

startSlideshow() {
this.interval = setInterval(() => {
if (this.autoPlay) {
this.nextSlide();
}
}, 5000);
}

nextSlide() {
this.slides[this.currentSlide].classList.remove('active');
this.indicators[this.currentSlide].classList.remove('active');

this.currentSlide = (this.currentSlide + 1) % this.slides.length;

this.slides[this.currentSlide].classList.add('active');
this.indicators[this.currentSlide].classList.add('active');

this.updateDestinationInfo();
}

prevSlide() {
this.slides[this.currentSlide].classList.remove('active');
this.indicators[this.currentSlide].classList.remove('active');

this.currentSlide =
(this.currentSlide - 1 + this.slides.length) % this.slides.length;

this.slides[this.currentSlide].classList.add('active');
this.indicators[this.currentSlide].classList.add('active');

this.updateDestinationInfo();
}

goToSlide(index) {
clearInterval(this.interval);

this.slides[this.currentSlide].classList.remove('active');
this.indicators[this.currentSlide].classList.remove('active');

this.currentSlide = index;

this.slides[this.currentSlide].classList.add('active');
this.indicators[this.currentSlide].classList.add('active');

this.updateDestinationInfo();
this.restartAutoplay();
}

bindNavigation() {
// Indicator clicks
this.indicators.forEach((indicator, index) => {
indicator.addEventListener('click', () => this.goToSlide(index));
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
if (e.key === 'ArrowRight') this.nextSlide();
if (e.key === 'ArrowLeft') this.prevSlide();
});
}

bindHoverEffects() {
this.slides.forEach(slide => {
slide.addEventListener('mouseenter', () => {
slide.classList.add('hovered');
});

slide.addEventListener('mouseleave', () => {
slide.classList.remove('hovered');
});
});
}

pauseAutoplay() {
this.autoPlay = false;
clearInterval(this.interval);
}

restartAutoplay() {
this.autoPlay = true;
this.startSlideshow();
}
}

// Profile Dropdown Toggle
function initProfileDropdown() {
const profileIcon = document.getElementById('profileIcon');
const dropdownMenu = document.getElementById('dropdownMenu');
const profileDropdown = document.querySelector('.profile-dropdown');

if (profileIcon && dropdownMenu) {
profileIcon.addEventListener('click', (e) => {
e.stopPropagation();
profileDropdown.classList.toggle('active');
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
if (!profileDropdown.contains(e.target)) {
profileDropdown.classList.remove('active');
}
});

// Close dropdown on escape key
document.addEventListener('keydown', (e) => {
if (e.key === 'Escape') {
profileDropdown.classList.remove('active');
}
});
}
}

// Mobile Menu Toggle
function toggleMenu() {
const navLinks = document.querySelector('.nav-links');
const hamburger = document.querySelector('.hamburger');

navLinks.classList.toggle('active');
hamburger.classList.toggle('active');

// Close profile dropdown when mobile menu opens
document.querySelector('.profile-dropdown')?.classList.remove('active');

// Prevent body scroll when menu is open
document.body.classList.toggle('no-scroll', navLinks.classList.contains('active'));
}

// Smooth Scrolling & Navigation
function initSmoothScroll() {
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
anchor.addEventListener('click', function (e) {
e.preventDefault();
const targetId = this.getAttribute('href');
const target = document.querySelector(targetId);

if (target) {
target.scrollIntoView({
behavior: 'smooth',
block: 'start'
});
}

// Close mobile menu
document.querySelector('.nav-links')?.classList.remove('active');
document.querySelector('.hamburger')?.classList.remove('active');
document.body.classList.remove('no-scroll');
});
});
}

// Header Scroll Effects
function initHeaderScroll() {
window.addEventListener('scroll', () => {
const header = document.querySelector('.header');
const scrolled = window.scrollY;

if (scrolled > 100) {
header.style.background = 'rgba(0, 0, 0, 0.95)';
header.style.backdropFilter = 'blur(30px)';
header.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.5)';
} else {
header.style.background = 'rgba(0, 0, 0, 0.3)';
header.style.backdropFilter = 'blur(20px)';
header.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
}
});
}

// Parallax & Mouse Effects
function initParallaxEffects() {
// Hero parallax
window.addEventListener('scroll', () => {
const scrolled = window.pageYOffset;
const heroSlides = document.querySelector('.hero-slideshow');
if (heroSlides) {
heroSlides.style.transform = `translateY(${scrolled * 0.3}px)`;
}
});
}

// SIMPLIFIED REDIRECT FUNCTION - NO AUTHENTICATION CHECKS
function redirectToDestinationPage() {
// Direct redirect to destinationhtml.html
window.location.href = 'destinationhtml.html';
}

// Intersection Observer for Scroll Animations
function initScrollAnimations() {
const observerOptions = {
threshold: 0.1,
rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
entries.forEach(entry => {
if (entry.isIntersecting) {
entry.target.style.opacity = '1';
entry.target.style.transform = 'translateY(0) scale(1)';
}
});
}, observerOptions);

// Observe all animated sections
document.querySelectorAll('.features, .how-it-works, .cta-hero, .feature-card, .step-card').forEach(el => {
el.style.opacity = '0';
el.style.transform = 'translateY(50px) scale(0.95)';
el.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
observer.observe(el);
});
}

// Word-by-Word Animation
function initHeroTextAnimation() {
const words = document.querySelectorAll('.word');

words.forEach((word, index) => {
word.style.opacity = '0';
word.style.transform = 'translateY(30px)';

setTimeout(() => {
word.style.transition = 'all 0.8s ease';
word.style.opacity = '1';
word.style.transform = 'translateY(0)';
}, index * 150);
});
}

// Floating Particles Animation
function initParticles() {
const particles = document.querySelectorAll('.particle');

particles.forEach((particle, index) => {
const duration = 15 + Math.random() * 10;
const delay = index * 0.5;

particle.style.setProperty('--particle-duration', `${duration}s`);
particle.style.setProperty('--particle-delay', `${delay}s`);

// Random horizontal movement
const sway = Math.random() * 100 - 50;
particle.style.setProperty('--sway', `${sway}px`);
});
}

// Enhanced Button Interactions
function initButtonEffects() {
document.querySelectorAll('.btn').forEach(btn => {
btn.addEventListener('mouseenter', function() {
this.style.transform = 'translateY(-5px) scale(1.05)';
});

btn.addEventListener('mouseleave', function() {
this.style.transform = 'translateY(0) scale(1)';
});

// Ripple effect
btn.addEventListener('click', function(e) {
const ripple = document.createElement('span');
const rect = this.getBoundingClientRect();
const size = Math.max(rect.width, rect.height);
const x = e.clientX - rect.left - size / 2;
const y = e.clientY - rect.top - size / 2;

ripple.style.cssText = `
position: absolute;
width: ${size}px;
height: ${size}px;
left: ${x}px;
top: ${y}px;
background: rgba(255,255,255,0.6);
border-radius: 50%;
transform: scale(0);
animation: ripple 0.6s linear;
pointer-events: none;
`;

this.style.position = 'relative';
this.style.overflow = 'hidden';
this.appendChild(ripple);

setTimeout(() => ripple.remove(), 600);
});
});

// Add CSS for ripple animation
const style = document.createElement('style');
style.textContent = `
@keyframes ripple {
to {
transform: scale(4);
opacity: 0;
}
}
`;
document.head.appendChild(style);
}

// Global Event Listeners
document.addEventListener('DOMContentLoaded', function() {
// Initialize all components
new DestinationSlideshow();

// UI Interactions
initProfileDropdown();
initSmoothScroll();
initHeaderScroll();
initScrollAnimations();
initHeroTextAnimation();
initParticles();
initButtonEffects();

// DIRECT REDIRECT TO DESTINATION PAGE - NO AUTH CHECKS
document.getElementById('planTripBtn')?.addEventListener('click', () => {
redirectToDestinationPage();
});

document.getElementById('beginJourneyBtn')?.addEventListener('click', () => {
redirectToDestinationPage();
});

// Close mobile menu on outside click
document.addEventListener('click', (e) => {
const navLinks = document.querySelector('.nav-links');
const hamburger = document.querySelector('.hamburger');

if (navLinks && hamburger && 
!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
navLinks.classList.remove('active');
hamburger.classList.remove('active');
document.body.classList.remove('no-scroll');
}
});
});

// Window Resize Handler
window.addEventListener('resize', () => {
// Recalculate hero height
const hero = document.querySelector('.hero');
if (hero && window.innerWidth >= 768) {
hero.style.height = '100vh';
}
});

// Page Visibility API for performance
document.addEventListener('visibilitychange', () => {
if (document.hidden) {
// Pause animations when tab is hidden
document.body.style.animationPlayState = 'paused';
} else {
document.body.style.animationPlayState = 'running';
}
});

// Preloader (if needed)
window.addEventListener('load', () => {
document.body.classList.add('loaded');
});

// Export for debugging (optional)
window.TripConnect = {
DestinationSlideshow,
redirectToDestinationPage,
toggleMenu,
initProfileDropdown
};