document.addEventListener('DOMContentLoaded', () => {
    // 1. Hamburger Menu Logic
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }

    // 2. Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(targetId);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });

    // 3. Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const itemsToAnimate = document.querySelectorAll(
        '.hero-text, .hero-image, .section-title, .about-grid, .project-card, .contact-form'
    );

    itemsToAnimate.forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });

    // 4. Auto-update footer year
    const yearElement = document.getElementById('year');
    if (yearElement) {
        const currentYear = new Date().getFullYear();
        const startYear = 2026;
        yearElement.textContent = currentYear > startYear ? `${startYear}-${currentYear}` : startYear;
    }

    // 5. Load Distributed Content (Split JSONs)

    // Helper function to load JSON with fallback paths
    const loadJSON = async (paths) => {
        if (!Array.isArray(paths)) paths = [paths];
        for (const path of paths) {
            try {
                console.log(`Attempting to fetch: ${path}`);
                const response = await fetch(path);
                if (response.ok) {
                    const data = await response.json();
                    console.log(`Successfully loaded: ${path}`);
                    return data;
                } else {
                    console.warn(`Failed to load ${path} (${response.status})`);
                }
            } catch (e) {
                console.warn(`Error fetching ${path}:`, e);
            }
        }
        return null;
    };

    // Helper to show loading
    const showLoading = (elementId) => {
        const el = document.getElementById(elementId);
        if (el) {
            el.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div><p>Loading…</p></div>';
        }
    };

    // Helper to show error
    const showError = (elementId, message = '') => {
        const el = document.getElementById(elementId);
        if (el) {
            el.innerHTML = `
                <div class="error-message">
                    <h2>Something went wrong</h2>
                    <p>${escapeHtml(message) || 'Unable to load content. Please try again later.'}</p>
                </div>
            `;
        }
    };

    // Load Global Settings (Nav, Footer, Titles)
    loadJSON(['content/global.json', 'global.json']).then(data => {
        if (!data) return;

        const footerRights = document.getElementById('footer-rights');
        if (footerRights) footerRights.textContent = data.footer_rights;

        if (data.titles) {
            if (document.getElementById('articles-title'))
                document.getElementById('articles-title').textContent = data.titles.articles;
            if (document.getElementById('awards-title'))
                document.getElementById('awards-title').textContent = data.titles.awards;
        }

        if (data.nav && Array.isArray(data.nav)) {
            const navContainers = document.querySelectorAll('.nav-links');
            navContainers.forEach(nav => {
                nav.innerHTML = data.nav.map(item =>
                    `<li><a href="${item.url}">${item.label}</a></li>`
                ).join('');
                nav.querySelectorAll('a').forEach(link => {
                    link.addEventListener('click', () => {
                        if (hamburger) hamburger.classList.remove('active');
                        if (navLinks) navLinks.classList.remove('active');
                    });
                });
            });
        }
    });

    // Home Content
    if (document.getElementById('hero-title')) {
        loadJSON(['content/home.json', 'home.json']).then(data => {
            if (!data) return;
            document.getElementById('hero-title').innerHTML = data.hero_title;
            document.getElementById('hero-subtitle').textContent = data.hero_subtitle;
            document.getElementById('hero-cta').textContent = data.cta_button;
        });
    }

    // About Content
    if (document.getElementById('about-title')) {
        loadJSON(['content/about.json', 'about.json']).then(data => {
            if (!data) return;
            document.getElementById('about-title').textContent = data.title;
            const aboutText = document.getElementById('about-text');
            if (aboutText && data.content_paragraphs) {
                aboutText.innerHTML = data.content_paragraphs.map(p => `<p>${p}</p>`).join('<br>');
            }
        });
    }

    // Awards Content
    if (document.getElementById('awards-grid')) {
        showLoading('awards-grid');
        loadJSON(['content/awards.json', 'awards.json']).then(data => {
            const awardsGrid = document.getElementById('awards-grid');
            if (!data || !Array.isArray(data) || data.length === 0) {
                awardsGrid.innerHTML = '<div class="empty-state">No Awards Found</div>';
                return;
            }
            awardsGrid.innerHTML = data.map(award => `
                <div class="project-card fade-in">
                    <div class="project-info">
                        <h3>${escapeHtml(award.title)}</h3>
                        <p>${escapeHtml(award.description)}</p>
                    </div>
                </div>
            `).join('');
            document.querySelectorAll('.project-card').forEach(el => observer.observe(el));
        }).catch(() => {
            showError('awards-grid', 'Failed to load awards data.');
        });
    }

    // Contact Content
    if (document.getElementById('contact-title')) {
        loadJSON(['content/contact.json', 'contact.json']).then(data => {
            if (!data) return;
            document.getElementById('contact-title').textContent = data.title;
        });
    }

    // ----- ARTICLES: List & Single View (Enhanced) -----
    if (document.getElementById('article-list') || document.getElementById('article-content')) {

        // Show loading state
        if (document.getElementById('article-list')) showLoading('article-list');
        if (document.getElementById('article-content')) showLoading('article-content');

        // Try both paths: content/articles.json and articles.json
        loadJSON(['content/articles.json', 'articles.json']).then(data => {
            console.log('Articles data loaded:', data);

            if (!data || !Array.isArray(data)) {
                const errMsg = !data ? 'No data received' : 'Data is not an array';
                if (document.getElementById('article-list')) 
                    showError('article-list', `Articles data is missing or invalid (${errMsg}).`);
                if (document.getElementById('article-content')) 
                    showError('article-content', `Articles data is missing or invalid (${errMsg}).`);
                return;
            }

            // ----- List View -----
            if (document.getElementById('article-list')) {
                const articleList = document.getElementById('article-list');
                if (data.length === 0) {
                    articleList.innerHTML = '<div class="empty-state">No Articles Published</div>';
                } else {
                    articleList.innerHTML = data.map(article => `
                        <a href="article-view.html?id=${article.id}" class="article-card fade-in">
                            <h3>${escapeHtml(article.title)}</h3>
                            <span class="article-meta">${escapeHtml(article.date)} | ${escapeHtml(article.authors)}</span>
                            <div class="article-abstract">${escapeHtml(article.abstract)}</div>
                            <span class="read-more">Read Full Article &rarr;</span>
                        </a>
                    `).join('');
                    document.querySelectorAll('.article-card').forEach(el => observer.observe(el));
                }
            }

            // ----- Single View (article-content) -----
            const articleContent = document.getElementById('article-content');
            if (articleContent) {
                const urlParams = new URLSearchParams(window.location.search);
                const articleId = urlParams.get('id');

                if (!articleId) {
                    showError('article-content', 'No article ID provided in the URL.');
                    return;
                }

                const article = data.find(a => a.id === articleId);
                if (!article) {
                    showError('article-content', `Article with ID "${escapeHtml(articleId)}" not found.`);
                    return;
                }

                console.log('Rendering article:', article);

                // --- Build the article HTML ---
                let html = '';

                // Header
                html += `
                    <header class="article-header fade-in">
                        <h1>${escapeHtml(article.title)}</h1>
                        <div class="article-meta">
                            ${article.authors ? `<p><strong>Authors:</strong> ${escapeHtml(article.authors)}</p>` : ''}
                            ${article.date ? `<p><strong>Published:</strong> ${escapeHtml(article.date)}</p>` : ''}
                        </div>
                    </header>
                `;

                // Abstract
                if (article.abstract) {
                    html += `
                        <section class="article-section fade-in">
                            <h2>Abstract</h2>
                            <div class="abstract-text">${escapeHtml(article.abstract)}</div>
                        </section>
                    `;
                }

                // Rich-text sections
                const sectionKeys = ['introduction', 'methods', 'results', 'discussion', 'conclusion'];
                const sectionLabels = {
                    introduction: 'Introduction',
                    methods: 'Methods',
                    results: 'Results',
                    discussion: 'Discussion',
                    conclusion: 'Conclusion'
                };

                sectionKeys.forEach(key => {
                    const content = article[key];
                    if (content && typeof content === 'string' && content.trim() !== '') {
                        html += `
                            <section class="article-section fade-in">
                                <h2>${sectionLabels[key]}</h2>
                                <div class="rich-text">${content}</div>
                            </section>
                        `;
                    }
                });

                // ----- REFERENCES -----
                if (article.references) {
                    let refHtml = '';
                    if (Array.isArray(article.references)) {
                        refHtml = `<ol class="reference-list">${article.references.map(ref => `<li>${escapeHtml(ref)}</li>`).join('')}</ol>`;
                    } else if (typeof article.references === 'string' && article.references.trim() !== '') {
                        refHtml = `<div class="references">${escapeHtml(article.references).replace(/\n/g, '<br>')}</div>`;
                    }
                    if (refHtml) {
                        html += `
                            <section class="article-section fade-in">
                                <h2>References</h2>
                                ${refHtml}
                            </section>
                        `;
                    }
                }

                // ----- DOWNLOAD BUTTON (if download_link exists) -----
                if (article.download_link && article.download_link.trim() !== '') {
                    html += `
                        <div class="article-download fade-in" style="margin-top: 2.5rem; text-align: center;">
                            <a href="${escapeHtml(article.download_link)}" target="_blank" rel="noopener noreferrer" class="btn download-btn">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:8px;">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                Download Article
                            </a>
                        </div>
                    `;
                }

                articleContent.innerHTML = html;
                document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
            }
        }).catch(error => {
            const errMsg = error.message || 'Unknown error';
            if (document.getElementById('article-list')) 
                showError('article-list', `Error: ${errMsg}`);
            if (document.getElementById('article-content')) 
                showError('article-content', `Error: ${errMsg}`);
            console.error('Articles load error:', error);
        });
    }

    // ----- Helper: escapeHtml to prevent XSS -----
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
