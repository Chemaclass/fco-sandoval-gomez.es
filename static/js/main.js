// Mobile menu toggle
const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');

menuToggle.addEventListener('click', function(e) {
    e.stopPropagation();
    mainNav.classList.toggle('active');
    this.classList.toggle('active');
    const expanded = mainNav.classList.contains('active');
    this.setAttribute('aria-expanded', expanded);
    document.body.style.overflow = expanded ? 'hidden' : '';
});

// Close menu when clicking outside
document.addEventListener('click', function(e) {
    if (mainNav.classList.contains('active') &&
        !mainNav.contains(e.target) &&
        !menuToggle.contains(e.target)) {
        mainNav.classList.remove('active');
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }
});

// Lightbox functionality for all article images
let currentIndex = 0;
let articleImages = [];

function initArticleLightbox() {
    const article = document.querySelector('.article-page');
    if (!article) return;

    // Find all images in the article (body, media blocks, gallery) but exclude hero image
    articleImages = Array.from(article.querySelectorAll('img')).filter(img => !img.closest('.article-hero'));

    // Make each image clickable
    articleImages.forEach((img, index) => {
        img.style.cursor = 'pointer';
        img.addEventListener('click', (e) => {
            e.preventDefault();
            openLightbox(index);
        });
    });
}

function openLightbox(index) {
    if (articleImages.length === 0) return;

    currentIndex = index;
    updateLightboxImage();
    document.getElementById('lightbox').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox(event) {
    if (event.target.classList.contains('lightbox') ||
        event.target.classList.contains('lightbox-close')) {
        document.getElementById('lightbox').classList.remove('active');
        document.body.style.overflow = '';
    }
}

function navigateLightbox(event, direction) {
    event.stopPropagation();
    currentIndex += direction;
    if (currentIndex < 0) currentIndex = articleImages.length - 1;
    if (currentIndex >= articleImages.length) currentIndex = 0;
    updateLightboxImage();
}

function updateLightboxImage() {
    const img = articleImages[currentIndex];
    document.getElementById('lightbox-img').src = img.src;
    document.getElementById('lightbox-img').alt = img.alt;
    document.getElementById('lightbox-counter').textContent =
        `${currentIndex + 1} / ${articleImages.length}`;
}

// Initialize lightbox for article images
initArticleLightbox();

// Keyboard navigation for lightbox
document.addEventListener('keydown', function(e) {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox.classList.contains('active')) return;

    if (e.key === 'Escape') {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    } else if (e.key === 'ArrowLeft') {
        navigateLightbox(e, -1);
    } else if (e.key === 'ArrowRight') {
        navigateLightbox(e, 1);
    }
});

// Help modal functions
function openHelpModal() {
    document.getElementById('help-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeHelpModal(event) {
    if (!event || event.target.classList.contains('help-modal') ||
        event.target.classList.contains('help-modal-close')) {
        document.getElementById('help-modal').classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Get home URL based on current language
function getHomeUrl() {
    const path = window.location.pathname;
    if (path.startsWith('/en/') || path === '/en') return '/en/';
    if (path.startsWith('/it/') || path === '/it') return '/it/';
    return '/';
}

// Theme toggle functions
function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('theme-dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Initialize theme toggle button
const themeToggle = document.querySelector('.theme-toggle');
if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
}

// Global keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ignore if typing in input/textarea
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

    // Ignore if modifier keys are pressed
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    // Check if any modal is open
    const lightbox = document.getElementById('lightbox');
    const helpModal = document.getElementById('help-modal');
    const searchBox = document.querySelector('.search-box');
    const isSearchOpen = searchBox && searchBox.classList.contains('active');

    // If lightbox is open, let its handler deal with it
    if (lightbox.classList.contains('active')) return;

    // Handle help modal
    if (helpModal.classList.contains('active')) {
        if (e.key === 'Escape') {
            closeHelpModal();
            e.preventDefault();
        }
        return;
    }

    // Handle search being open
    if (isSearchOpen) return;

    // Global shortcuts
    switch (e.key) {
        case '?':
            openHelpModal();
            e.preventDefault();
            break;
        case 'h':
        case 'H':
            window.location.href = getHomeUrl();
            e.preventDefault();
            break;
        case 's':
        case 'S':
        case '/':
            const searchToggle = document.querySelector('.search-toggle');
            if (searchToggle) {
                searchToggle.click();
                e.preventDefault();
            }
            break;
        case 'd':
        case 'D':
            toggleTheme();
            e.preventDefault();
            break;
        case 'l':
        case 'L':
            switchLanguage();
            e.preventDefault();
            break;
        case 'j':
        case 'J':
            navigatePost('next');
            e.preventDefault();
            break;
        case 'k':
        case 'K':
            navigatePost('prev');
            e.preventDefault();
            break;
    }
});

// Post navigation shortcuts
function navigatePost(direction) {
    const selector = direction === 'next' ? '.nav-next' : '.nav-prev';
    const link = document.querySelector('.post-navigation ' + selector);
    if (link) {
        window.location.href = link.href;
    }
}

// Language switcher: cycle through ES → EN → IT → ES
function switchLanguage() {
    const path = window.location.pathname;
    const basePath = path.replace(/^\/(en|it)\//, '/').replace(/^\/(en|it)$/, '/');

    if (path.startsWith('/en/') || path === '/en') {
        window.location.href = '/it' + basePath;
    } else if (path.startsWith('/it/') || path === '/it') {
        window.location.href = basePath;
    } else {
        window.location.href = '/en' + basePath;
    }
}

// External links: open in new tab with icon
document.querySelectorAll('a[href^="http"]').forEach(function(link) {
    // Skip pagination and other internal navigation
    if (link.closest('.pagination')) return;

    if (!link.hostname.includes(window.location.hostname)) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
        // Don't add icon to elements that already have one (SVG inside or special card classes)
        var hasIcon = link.querySelector('svg') ||
            link.classList.contains('link-card') ||
            link.classList.contains('contact-card') ||
            link.closest('.link-card') ||
            link.closest('.contact-card');
        if (!hasIcon) {
            link.classList.add('external-link');
        }
    }
});

// Optimize images in article content (markdown images)
document.querySelectorAll('.prose img').forEach(function(img) {
    if (!img.hasAttribute('loading')) img.loading = 'lazy';
    if (!img.hasAttribute('decoding')) img.decoding = 'async';
});

// Image skeleton loading: handle cached images and dynamically loaded content
function initImageSkeletons() {
    document.querySelectorAll('.img-skeleton').forEach(function(skeleton) {
        const img = skeleton.querySelector('img');
        if (img) {
            // If image is already loaded (cached), mark as loaded immediately
            if (img.complete && img.naturalHeight !== 0) {
                skeleton.classList.add('loaded');
            } else {
                // Add onload handler
                img.addEventListener('load', function() {
                    skeleton.classList.add('loaded');
                });
            }
        }
    });
}

// Run on DOM ready
initImageSkeletons();
