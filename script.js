document.addEventListener('DOMContentLoaded', () => {
    // 1. Hamburger Menu Logic
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Close menu when a link is clicked
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
                    target.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // 3. Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries, observer) => {
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
        if (currentYear > startYear) {
            yearElement.textContent = `${startYear}-${currentYear}`;
        } else {
            yearElement.textContent = startYear;
        }
    }

    // 5. Load Distributed Content (Split JSONs)

    // Helper function to load JSON
    const loadJSON = async (path) => {
        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error(`Failed to load ${path}`);
            return await response.json();
        } catch (e) {
            console.error(e);
            return null;
        }
    };

    // Load Global Settings (Nav, Footer, Titles)
    loadJSON('content/global.json').then(data => {
        if (!data) return;

        // Footer
        const footerRights = document.getElementById('footer-rights');
        if (footerRights) footerRights.textContent = data.footer_rights;

        // Page Titles (if placeholders exist)
        if (data.titles) {
            if (document.getElementById('articles-title'))
                document.getElementById('articles-title').textContent = data.titles.articles;
            if (document.getElementById('awards-title'))
                document.getElementById('awards-title').textContent = data.titles.awards;
        }

        // Dynamic Navigation
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

    // Identify current page content needs and load specific JSONs

    // Home Content
    if (document.getElementById('hero-title')) {
        loadJSON('content/home.json').then(data => {
            if (!data) return;
            document.getElementById('hero-title').innerHTML = data.hero_title;
            document.getElementById('hero-subtitle').textContent = data.hero_subtitle;
            document.getElementById('hero-cta').textContent = data.cta_button;
        });
    }

    // About Content
    if (document.getElementById('about-title')) {
        loadJSON('content/about.json').then(data => {
            if (!data) return;
            document.getElementById('about-title').textContent = data.title;
            const aboutText = document.getElementById('about-text');
            if (aboutText && data.content_paragraphs) {
                aboutText.innerHTML = data.content_paragraphs.map(p => `<p>${p}</p>`).join('<br>');
            }
        });
    }

    // Awards Content (Root Array now)
    if (document.getElementById('awards-grid')) {
        loadJSON('content/awards.json').then(data => {
            const awardsGrid = document.getElementById('awards-grid');

            if (!data || !Array.isArray(data) || data.length === 0) {
                awardsGrid.innerHTML = '<p>No Honor & Rewards Published</p>';
                return;
            }

            awardsGrid.innerHTML = data.map(award => `
                <div class="project-card fade-in">
                    <div class="project-info">
                        <h3>${award.title}</h3>
                        <p>${award.description}</p>
                    </div>
                </div>
            `).join('');
            document.querySelectorAll('.project-card').forEach(el => observer.observe(el));
        });
    }

    // Contact Content
    if (document.getElementById('contact-title')) {
        loadJSON('content/contact.json').then(data => {
            if (!data) return;
            document.getElementById('contact-title').textContent = data.title;
        });
    }

    // Articles List & View (Root Array now)
    if (document.getElementById('article-list') || document.getElementById('article-content')) {
        loadJSON('content/articles.json').then(data => {
            if (!data || !Array.isArray(data)) return;

            // List View
            if (document.getElementById('article-list')) {
                const articleList = document.getElementById('article-list');

                if (!data || !Array.isArray(data) || data.length === 0) {
                    articleList.innerHTML = '<p>No Articles Published</p>';
                } else {
                    articleList.innerHTML = data.map(article => `
                        <a href="article-view.html?id=${article.id}" class="article-card fade-in">
                            <h3>${article.title}</h3>
                            <span class="article-meta">${article.date} | ${article.authors}</span>
                            <div class="article-abstract">${article.abstract}</div>
                            <span class="read-more">Read Full Article &rarr;</span>
                        </a>
                    `).join('');
                    document.querySelectorAll('.article-card').forEach(el => observer.observe(el));
                }
            }

            // Single View
            const articleContent = document.getElementById('article-content');
            if (articleContent) {
                const urlParams = new URLSearchParams(window.location.search);
                const articleId = urlParams.get('id');

                if (articleId) {
                    const article = data.find(a => a.id === articleId);
                    if (article) {
                        const sections = ['Introduction', 'Methods', 'Results', 'Discussion', 'Conclusion'];
                        let html = `
                            <header class="article-header fade-in">
                                <h1>${article.title}</h1>
                                <div class="article-meta">
                                    <p><strong>Authors:</strong> ${article.authors}</p>
                                    <p><strong>Published:</strong> ${article.date}</p>
                                </div>
                            </header>
                            
                            <section class="article-section fade-in">
                                <h2>Abstract</h2>
                                <p>${article.abstract}</p>
                            </section>
                        `;

                        sections.forEach(sec => {
                            const content = article[sec.toLowerCase()];
                            if (content && content.trim() !== "") {
                                html += `
                                    <section class="article-section fade-in">
                                        <h2>${sec}</h2>
                                        <p>${content}</p>
                                    </section>
                                `;
                            }
                        });

                        if (article.references && article.references.length > 0) {
                            html += `
                                <section class="article-section fade-in">
                                    <h2>References</h2>
                                    <ol class="reference-list">
                                        ${article.references.map(ref => `<li>${ref}</li>`).join('')}
                                    </ol>
                                </section>
                            `;
                        }
                        articleContent.innerHTML = html;
                        document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
                    } else {
                        articleContent.innerHTML = '<p>Article not found.</p>';
                    }
                } else {
                    articleContent.innerHTML = '<p>No article specified.</p>';
                }
            }
        });
    }
});
