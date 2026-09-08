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

// Native dialogs provide focus containment and keep the background inert.
const dialogTriggers = new WeakMap();
function showDialog(dialog, trigger = document.activeElement) {
    if (dialog.open) return;
    dialogTriggers.set(dialog, trigger);
    dialog.showModal();
    dialog.classList.add('active');
    document.body.style.overflow = 'hidden';
    dialog.querySelector('button')?.focus();
}

for (const dialog of document.querySelectorAll('dialog')) {
    dialog.addEventListener('close', () => {
        dialog.classList.remove('active');
        document.body.style.overflow = mainNav.classList.contains('active') ? 'hidden' : '';
        dialogTriggers.get(dialog)?.focus();
    });
}

let currentIndex = 0;
let articleImages = [];
function initArticleLightbox() {
    const article = document.querySelector('.article-page');
    if (!article) return;
    articleImages = Array.from(article.querySelectorAll('img')).filter(img => !img.closest('.article-hero, a'));
    const label = { es: 'Ampliar imagen', en: 'Enlarge image', it: 'Ingrandisci immagine' }[document.documentElement.lang] || 'Ampliar imagen';
    articleImages.forEach((img, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'image-trigger';
        button.setAttribute('aria-label', img.alt ? `${label}: ${img.alt}` : `${label} ${index + 1}`);
        button.setAttribute('aria-haspopup', 'dialog');
        img.before(button);
        button.append(img);
        button.addEventListener('click', () => openLightbox(index, button));
    });
}

function openLightbox(index, trigger) {
    if (!Number.isInteger(index) || !articleImages[index]) return;
    currentIndex = index;
    updateLightboxImage();
    showDialog(document.getElementById('lightbox'), trigger);
}

function closeLightbox(event) {
    if (!event || event.target.classList.contains('lightbox') || event.target.closest('.lightbox-close')) {
        document.getElementById('lightbox').close();
    }
}

function navigateLightbox(event, direction) {
    event.stopPropagation();
    event.preventDefault();
    currentIndex = (currentIndex + direction + articleImages.length) % articleImages.length;
    updateLightboxImage();
}

function updateLightboxImage() {
    const img = articleImages[currentIndex];
    const enlarged = document.getElementById('lightbox-img');
    enlarged.src = img.dataset.fullSrc || img.currentSrc || img.src;
    enlarged.alt = img.alt;
    document.getElementById('lightbox-caption').textContent = img.closest('figure')?.querySelector('figcaption')?.textContent || img.alt;
    document.getElementById('lightbox-counter').textContent = `${currentIndex + 1} / ${articleImages.length}`;
}
initArticleLightbox();
document.getElementById('lightbox').addEventListener('keydown', function(e) {
    if (e.key === 'ArrowLeft') navigateLightbox(e, -1);
    if (e.key === 'ArrowRight') navigateLightbox(e, 1);
});

function openHelpModal() { showDialog(document.getElementById('help-modal')); }
function closeHelpModal(event) {
    if (!event || event.target.classList.contains('help-modal') || event.target.closest('.help-modal-close')) {
        document.getElementById('help-modal').close();
    }
}

document.querySelector('.help-toggle')?.addEventListener('click', openHelpModal);
const shortcutsToggle = document.getElementById('enable-shortcuts');
try { shortcutsToggle.checked = localStorage.getItem('shortcuts') === 'enabled'; } catch { /* Use the accessible default. */ }
shortcutsToggle.addEventListener('change', () => {
    try { localStorage.setItem('shortcuts', shortcutsToggle.checked ? 'enabled' : 'disabled'); } catch { /* Current-page preference still works. */ }
});

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
    try { localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch { /* Theme still works without storage. */ }
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
    if (lightbox.open) return;

    // Handle help modal
    if (helpModal.open) {
        if (e.key === 'Escape') {
            closeHelpModal();
            e.preventDefault();
        }
        return;
    }

    // Handle search being open
    if (isSearchOpen) return;

    // Character shortcuts are opt-in and can always be disabled in help.
    if (!shortcutsToggle.checked) return;

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
    const links = Array.from(document.querySelectorAll('.lang-nav--desktop a'));
    const current = links.findIndex(link => link.classList.contains('active'));
    if (links.length > 1) window.location.href = links[(current + 1) % links.length].href;
}

// External links: open in new tab with icon
document.querySelectorAll('a[href^="http"]').forEach(function(link) {
    // Skip pagination and other internal navigation
    if (link.closest('.pagination')) return;

    if (link.hostname !== window.location.hostname) {
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
                img.addEventListener('load', () => skeleton.classList.add('loaded'));
                img.addEventListener('error', () => skeleton.classList.add('loaded'));
                if (img.complete) skeleton.classList.add('loaded');
            }
        }
    });
}

// Run on DOM ready
initImageSkeletons();

document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && mainNav.classList.contains('active')) {
        mainNav.classList.remove('active');
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        menuToggle.focus();
    }
});
