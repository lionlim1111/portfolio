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

    // 2. Smooth scrolling
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

    // 3. Intersection Observer
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

    // 4. Footer year
    const yearElement = document.getElementById('year');
    if (yearElement) {
        const currentYear = new Date().getFullYear();
        const startYear = 2026;
        yearElement.textContent = currentYear > startYear ? `${startYear}-${currentYear}` : startYear;
    }

    // 5. Helpers
    const loadJSON = async (paths) => {
        if (!Array.isArray(paths)) paths = [paths];
        for (const path of paths) {
            try {
                console.log(`Attempting to fetch: ${path}`);
                const response = await fetch(path);
                if (response.ok) {
                    const data = await response.json();
                    console.log(`✅ Successfully loaded: ${path}`);
                    return data;
                } else {
                    console.warn(`❌ Failed to load ${path} (${response.status} ${response.statusText})`);
                }
            } catch (e) {
                console.warn(`❌ Error fetching ${path}:`, e.message);
            }
        }
        return null;
    };

    const showLoading = (elementId) => {
        const el = document.getElementById(elementId);
        if (el) {
            el.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div><p>Loading…</p></div>';
        }
    };

    const showError = (elementId, message = '') => {
        const el = document.getElementById(elementId);
        if (el) {
            el.innerHTML = `
                <div class="error-message">
                    <h2>⚠️ Something went wrong</h2>
                    <p>${escapeHtml(message) || 'Unable to load content. Please try again later.'}</p>
                    <p style="font-size:0.85rem; color:#718096; margin-top:10px;">Check console for details.</p>
                </div>
            `;
        }
    };

    const escapeHtml = (text) => {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    // 6. Load Global Settings
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

    // 7. Home, About, Awards, Contact (unchanged) — omitted for brevity
    // ... (they remain exactly as before)

    // 8. ARTICLES: List & Single View (with search)
    if (document.getElementById('article-list') || document.getElementById('article-content')) {

        if (document.getElementById('article-list')) showLoading('article-list');
        if (document.getElementById('article-content')) showLoading('article-content');

        loadJSON(['content/articles.json', 'articles.json']).then(data => {
            console.log('📄 Articles data received:', data);

            if (!data || !Array.isArray(data)) {
                const errMsg = !data ? 'No data received' : 'Data is not an array';
                if (document.getElementById('article-list'))
                    showError('article-list', `Articles data is missing or invalid (${errMsg}).`);
                if (document.getElementById('article-content'))
                    showError('article-content', `Articles data is missing or invalid (${errMsg}).`);
                return;
            }

            // ----- Store full articles list for search -----
            const fullArticles = data;

            // ----- Helper: Render article list given an array -----
            const renderArticleList = (articles) => {
                const articleList = document.getElementById('article-list');
                if (!articleList) return;

                if (articles.length === 0) {
                    articleList.innerHTML = `<div class="no-results">No articles found matching your search.</div>`;
                    document.getElementById('searchStats').style.display = 'none';
                    return;
                }

                articleList.innerHTML = articles.map(article => `
                    <a href="article-view.html?id=${article.id}" class="article-card fade-in">
                        <h3>${escapeHtml(article.title)}</h3>
                        <span class="article-meta">${escapeHtml(article.date)} | ${escapeHtml(article.authors)}</span>
                        <div class="article-abstract">${escapeHtml(article.abstract)}</div>
                        <span class="read-more">Read Full Article &rarr;</span>
                    </a>
                `).join('');

                // Re-apply observer for new cards
                document.querySelectorAll('.article-card').forEach(el => observer.observe(el));

                // Update search stats
                const stats = document.getElementById('searchStats');
                if (stats) {
                    const total = fullArticles.length;
                    const shown = articles.length;
                    if (shown < total) {
                        stats.style.display = 'block';
                        stats.innerHTML = `Showing <strong>${shown}</strong> of <strong>${total}</strong> articles`;
                    } else {
                        stats.style.display = 'none';
                    }
                }
            };

            // ----- Search logic -----
            const searchInput = document.getElementById('searchInput');
            const clearBtn = document.getElementById('clearSearch');
            let searchTerm = '';

            const filterArticles = (term) => {
                const lower = term.toLowerCase().trim();
                if (!lower) {
                    renderArticleList(fullArticles);
                    if (clearBtn) clearBtn.classList.remove('visible');
                    return;
                }
                if (clearBtn) clearBtn.classList.add('visible');

                const filtered = fullArticles.filter(article => {
                    const title = (article.title || '').toLowerCase();
                    const authors = (article.authors || '').toLowerCase();
                    const abstract = (article.abstract || '').toLowerCase();
                    const date = (article.date || '').toLowerCase();
                    return title.includes(lower) || authors.includes(lower) || abstract.includes(lower) || date.includes(lower);
                });
                renderArticleList(filtered);
            };

            // Event listeners
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    searchTerm = e.target.value;
                    filterArticles(searchTerm);
                });
            }

            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    if (searchInput) {
                        searchInput.value = '';
                        searchTerm = '';
                        filterArticles('');
                        searchInput.focus();
                    }
                });
            }

            // Initial render (all articles)
            renderArticleList(fullArticles);

            // ----- Single View (article-content) -----
            const articleContent = document.getElementById('article-content');
            if (articleContent) {
                const urlParams = new URLSearchParams(window.location.search);
                const articleId = urlParams.get('id');

                if (!articleId) {
                    showError('article-content', 'No article ID provided in the URL.');
                    return;
                }

                const article = fullArticles.find(a => a.id === articleId);
                if (!article) {
                    showError('article-content', `Article with ID "${escapeHtml(articleId)}" not found.`);
                    return;
                }

                console.log('🖨️ Rendering article:', article);
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

                // Sections
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

                // References
                if (article.references) {
                    let refHtml = '';
                    if (Array.isArray(article.references)) {
                        const citations = article.references.map(ref => {
                            if (typeof ref === 'object' && ref.citation) return ref.citation;
                            return ref;
                        });
                        refHtml = `<ol class="reference-list">${citations.map(ref => `<li>${escapeHtml(ref)}</li>`).join('')}</ol>`;
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

                // Download button
                if (article.download_link && article.download_link.trim() !== '') {
                    html += `
                        <div class="article-download fade-in">
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
                showError('article-list', `Network error: ${errMsg}`);
            if (document.getElementById('article-content'))
                showError('article-content', `Network error: ${errMsg}`);
            console.error('❌ Articles load error:', error);
        });
    }

    // The rest of your loaders for other pages (Home, About, etc.) remain unchanged.
    // I omitted them here for brevity, but you should keep them.
});
