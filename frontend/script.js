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
        if (this.slides.length === 0) return;
        this.updateDestinationInfo();
        this.startSlideshow();
        this.bindNavigation();
        this.bindHoverEffects();
    }

    updateDestinationInfo() {
        if (!this.slides[this.currentSlide]) return;
        
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
        if (this.interval) clearInterval(this.interval);
        this.interval = setInterval(() => {
            if (this.autoPlay) {
                this.nextSlide();
            }
        }, 5000);
    }

    nextSlide() {
        if (this.slides.length === 0) return;
        
        this.slides[this.currentSlide].classList.remove('active');
        if (this.indicators[this.currentSlide]) {
            this.indicators[this.currentSlide].classList.remove('active');
        }

        this.currentSlide = (this.currentSlide + 1) % this.slides.length;

        this.slides[this.currentSlide].classList.add('active');
        if (this.indicators[this.currentSlide]) {
            this.indicators[this.currentSlide].classList.add('active');
        }

        this.updateDestinationInfo();
    }

    prevSlide() {
        if (this.slides.length === 0) return;
        
        this.slides[this.currentSlide].classList.remove('active');
        if (this.indicators[this.currentSlide]) {
            this.indicators[this.currentSlide].classList.remove('active');
        }

        this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;

        this.slides[this.currentSlide].classList.add('active');
        if (this.indicators[this.currentSlide]) {
            this.indicators[this.currentSlide].classList.add('active');
        }

        this.updateDestinationInfo();
    }

    goToSlide(index) {
        if (index < 0 || index >= this.slides.length) return;
        
        clearInterval(this.interval);

        this.slides[this.currentSlide].classList.remove('active');
        if (this.indicators[this.currentSlide]) {
            this.indicators[this.currentSlide].classList.remove('active');
        }

        this.currentSlide = index;

        this.slides[this.currentSlide].classList.add('active');
        if (this.indicators[this.currentSlide]) {
            this.indicators[this.currentSlide].classList.add('active');
        }

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

// Mobile Menu Toggle
function toggleMenu() {
    const navLinks = document.querySelector('.nav-links');
    const hamburger = document.querySelector('.hamburger');

    if (navLinks) navLinks.classList.toggle('active');
    if (hamburger) hamburger.classList.toggle('active');

    // Prevent body scroll when menu is open
    if (navLinks) {
        document.body.classList.toggle('no-scroll', navLinks.classList.contains('active'));
    }
}

// Smooth Scrolling & Navigation
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#') return;

            const targetId = this.getAttribute('href');
            if (targetId && targetId.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(targetId);

                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }

                // Close mobile menu
                const navLinks = document.querySelector('.nav-links');
                const hamburger = document.querySelector('.hamburger');
                if (navLinks) navLinks.classList.remove('active');
                if (hamburger) hamburger.classList.remove('active');
                document.body.classList.remove('no-scroll');
            }
        });
    });
}

// Header Scroll Effects
function initHeaderScroll() {
    window.addEventListener('scroll', () => {
        const header = document.querySelector('.header');
        const scrolled = window.scrollY;

        if (header) {
            if (scrolled > 100) {
                header.style.background = 'rgba(0, 0, 0, 0.95)';
                header.style.backdropFilter = 'blur(30px)';
                header.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.5)';
            } else {
                header.style.background = 'rgba(0, 0, 0, 0.3)';
                header.style.backdropFilter = 'blur(20px)';
                header.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
            }
        }
    });
}

// Parallax Effects
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
    const elements = document.querySelectorAll('.features, .how-it-works, .cta-hero, .reviews-section, .feature-card, .step-card, .review-card');
    elements.forEach(el => {
        if (el) {
            el.style.opacity = '0';
            el.style.transform = 'translateY(50px) scale(0.95)';
            el.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            observer.observe(el);
        }
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
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;

    // Clear existing particles
    particlesContainer.innerHTML = '';
    
    // Create 50 particles
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        const size = Math.random() * 5 + 2;
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const duration = 15 + Math.random() * 10;
        const delay = i * 0.5;
        const sway = Math.random() * 100 - 50;
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${left}%`;
        particle.style.top = `${top}%`;
        particle.style.setProperty('--particle-duration', `${duration}s`);
        particle.style.setProperty('--particle-delay', `${delay}s`);
        particle.style.setProperty('--sway', `${sway}px`);
        
        particlesContainer.appendChild(particle);
    }
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

            setTimeout(() => {
                if (ripple && ripple.remove) ripple.remove();
            }, 600);
        });
    });
}

// Add Ripple Animation CSS
function addRippleAnimation() {
    if (!document.querySelector('#ripple-style')) {
        const style = document.createElement('style');
        style.id = 'ripple-style';
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
}

// Window Resize Handler
function initResizeHandler() {
    window.addEventListener('resize', () => {
        // Recalculate hero height
        const hero = document.querySelector('.hero');
        if (hero && window.innerWidth >= 768) {
            hero.style.height = '100vh';
        }
    });
}

// Close mobile menu on outside click
function initOutsideClick() {
    document.addEventListener('click', (e) => {
        const navLinks = document.querySelector('.nav-links');
        const hamburger = document.querySelector('.hamburger');

        if (navLinks && hamburger) {
            if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
                navLinks.classList.remove('active');
                hamburger.classList.remove('active');
                document.body.classList.remove('no-scroll');
            }
        }
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize slideshow
    new DestinationSlideshow();
    
    // Initialize UI interactions
    initSmoothScroll();
    initHeaderScroll();
    initParallaxEffects();
    initScrollAnimations();
    initHeroTextAnimation();
    initParticles();
    initButtonEffects();
    initResizeHandler();
    initOutsideClick();
    addRippleAnimation();
});

// Make toggleMenu globally accessible
window.toggleMenu = toggleMenu;