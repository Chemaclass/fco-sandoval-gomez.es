(function() {
    'use strict';

    var config = window.searchConfig || {
        lang: 'es',
        noResults: 'No se encontraron resultados'
    };

    var searchToggle, searchBox, searchInput, searchResults;
    var documents = [];
    var debounceTimer = null;
    var indexState = 'idle';
    var searchStatus;

    var DEBOUNCE_DELAY = 300;
    var MAX_RESULTS = 8;

    var sectionLabels = {
        es: {
            articulos: 'Artículo',
            investigacion: 'Investigación',
            publicaciones: 'Publicación',
            trabajos: 'Trabajo',
            'sobre-mi': 'Sobre mí'
        },
        en: {
            articulos: 'Article',
            investigacion: 'Research',
            publicaciones: 'Publication',
            trabajos: 'Work',
            'sobre-mi': 'About'
        },
        it: {
            articulos: 'Articolo',
            investigacion: 'Ricerca',
            publicaciones: 'Pubblicazione',
            trabajos: 'Lavoro',
            'sobre-mi': 'Chi sono'
        }
    };

    function init() {
        searchToggle = document.querySelector('.search-toggle');
        searchBox = document.querySelector('.search-box');
        searchInput = document.getElementById('search-input');
        searchResults = document.getElementById('search-results');
        searchStatus = document.getElementById('search-status');

        if (!searchToggle || !searchInput || !searchResults) {
            return;
        }

        searchToggle.addEventListener('click', toggleSearch);
        searchInput.addEventListener('input', handleInput);
        searchBox.addEventListener('keydown', handleKeydown);
        document.addEventListener('click', handleOutsideClick);
        document.addEventListener('keydown', handleEscape);
    }

    function loadSearchIndex() {
        if (indexState === 'loading' || indexState === 'ready') return;
        indexState = 'loading';
        searchStatus.textContent = config.loading;
        var script = document.createElement('script');
        // Posts are Spanish-only, so every locale searches the Spanish index.
        script.src = '/search_index.es.js';
        script.onload = function() {
            var docs = window.searchIndex && window.searchIndex.documentStore && window.searchIndex.documentStore.docs;
            if (!docs) return script.onerror();
            documents = Object.values(docs);
            indexState = 'ready';
            searchStatus.textContent = '';
            performSearch(searchInput.value.trim());
        };
        script.onerror = function() {
            indexState = 'error';
            searchStatus.textContent = config.loadError;
            script.remove();
        };
        document.head.appendChild(script);
    }

    function toggleSearch(e) {
        e.stopPropagation();
        var isOpen = searchBox.classList.toggle('active');
        searchToggle.classList.toggle('active', isOpen);
        searchToggle.setAttribute('aria-expanded', isOpen);
        searchBox.setAttribute('aria-hidden', !isOpen);

        if (isOpen) {
            loadSearchIndex();
            setTimeout(function() {
                searchInput.focus();
            }, 50);
        } else {
            clearSearch();
        }
    }

    function closeSearch() {
        searchBox.classList.remove('active');
        searchToggle.classList.remove('active');
        searchToggle.setAttribute('aria-expanded', 'false');
        searchBox.setAttribute('aria-hidden', 'true');
        clearSearch();
    }

    function clearSearch() {
        clearTimeout(debounceTimer);
        searchInput.value = '';
        searchResults.innerHTML = '';
        searchResults.classList.remove('active');
    }

    function handleInput(e) {
        var query = e.target.value.trim();

        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        debounceTimer = setTimeout(function() {
            performSearch(query);
        }, DEBOUNCE_DELAY);
    }

    var sectionPriority = {
        'articulos': 20,
        'trabajos': 10
    };

    function getSectionPriority(url) {
        if (url.indexOf('/articulos/') !== -1) return sectionPriority.articulos;
        if (url.indexOf('/trabajos/') !== -1) return sectionPriority.trabajos;
        return 0;
    }

    function performSearch(query) {
        if (!searchBox.classList.contains('active')) return;
        if (indexState !== 'ready' || query.length < 2) {
            searchResults.innerHTML = '';
            searchResults.classList.remove('active');
            return;
        }

        var queryLower = normalize(query);
        var results = [];

        for (var i = 0; i < documents.length; i++) {
            var doc = documents[i];
            var title = normalize(doc.title || '');
            var description = normalize(doc.description || '');

            var titleMatch = title.indexOf(queryLower) !== -1;
            var descMatch = description.indexOf(queryLower) !== -1;

            if (titleMatch || descMatch) {
                var matchScore = titleMatch ? 10 : 1;
                var priorityScore = getSectionPriority(doc.id || '');
                results.push({
                    doc: doc,
                    score: priorityScore / 100 + matchScore
                });
            }
        }

        // Sort by score (section priority, then title matches)
        results.sort(function(a, b) { return b.score - a.score; });

        displayResults(results.slice(0, MAX_RESULTS), query);
    }

    function getSectionFromUrl(url) {
        var sections = ['articulos', 'investigacion', 'publicaciones', 'trabajos', 'sobre-mi'];
        for (var i = 0; i < sections.length; i++) {
            if (url.indexOf('/' + sections[i] + '/') !== -1) {
                return sections[i];
            }
        }
        return null;
    }

    function getSectionLabel(section) {
        var labels = sectionLabels[config.lang] || sectionLabels.es;
        return labels[section] || '';
    }

    function displayResults(results, query) {
        if (results.length === 0) {
            searchResults.innerHTML = '<div class="search-no-results">' + config.noResults + '</div>';
            searchResults.classList.add('active');
            return;
        }

        var html = results.map(function(result) {
            var doc = result.doc;
            var title = highlightMatch(doc.title || '', query);
            var description = doc.description
                ? highlightMatch(truncate(doc.description, 120), query)
                : '';
            var url = doc.id || '';
            var section = getSectionFromUrl(url);
            var sectionLabel = section ? getSectionLabel(section) : '';

            return '<a href="' + escapeHtml(url) + '" class="search-result-item">' +
                (sectionLabel ? '<span class="search-result-type">' + sectionLabel + '</span>' : '') +
                '<div class="search-result-title">' + title + '</div>' +
                (description ? '<div class="search-result-description">' + description + '</div>' : '') +
                '</a>';
        }).join('');

        searchResults.innerHTML = html;
        searchResults.classList.add('active');
    }

    function normalize(text) {
        return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }

    function highlightMatch(text, query) {
        if (!text || !query) return escapeHtml(text);
        var start = normalize(text).indexOf(normalize(query));
        if (start === -1) return escapeHtml(text);
        var end = start + query.length;
        return escapeHtml(text.slice(0, start)) + '<mark class="search-highlight">' + escapeHtml(text.slice(start, end)) + '</mark>' + escapeHtml(text.slice(end));
    }

    function truncate(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }

    function escapeHtml(text) {
        if (!text) return '';
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function handleKeydown(e) {
        var items = searchResults.querySelectorAll('.search-result-item');
        var activeItem = searchResults.querySelector('.search-result-item:focus');
        var currentIndex = Array.from(items).indexOf(activeItem);

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (currentIndex < items.length - 1) {
                    items[currentIndex + 1].focus();
                } else if (items.length > 0) {
                    items[0].focus();
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (currentIndex > 0) {
                    items[currentIndex - 1].focus();
                } else {
                    searchInput.focus();
                }
                break;
            case 'Enter':
                if (activeItem) {
                    window.location.href = activeItem.href;
                }
                break;
        }
    }

    function handleOutsideClick(e) {
        var searchContainer = document.querySelector('.search-container');
        if (searchContainer && !searchContainer.contains(e.target)) {
            closeSearch();
        }
    }

    function handleEscape(e) {
        if (e.key === 'Escape' && searchBox.classList.contains('active')) {
            closeSearch();
            searchToggle.focus();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
