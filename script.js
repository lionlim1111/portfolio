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
            // Only smooth scroll if it's an anchor on the same page
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
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    // 4. Select items to animate
    const itemsToAnimate = document.querySelectorAll(
        '.hero-text, .hero-image, .section-title, .about-grid, .project-card, .contact-form'
    );

    // 5. Initialize animation state
    itemsToAnimate.forEach(el => {
        el.classList.add('fade-in'); // Add initial hidden state
        observer.observe(el);        // Start watching
    });


    // 6. Auto-update footer year
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

    // 7. Load Content from data.json (CMS-like behavior)
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            // Populate Common Elements (Nav & Footer)
            if (data.common) {
                // Footer
                const footerRights = document.getElementById('footer-rights');
                if (footerRights) footerRights.textContent = data.common.footer_rights;

                // Navigation (find links by strict href match)
                const navMap = {
                    'index.html': data.common.nav.home,
                    'about.html': data.common.nav.about,
                    'articles.html': data.common.nav.articles,
                    'awards.html': data.common.nav.awards,
                    'contact.html': data.common.nav.contact
                };

                document.querySelectorAll('.nav-links a').forEach(link => {
                    const href = link.getAttribute('href');
                    if (navMap[href]) {
                        link.textContent = navMap[href];
                    }
                });
            }

            // Populate Home
            if (document.getElementById('hero-title')) document.getElementById('hero-title').innerHTML = data.home.hero_title;
            if (document.getElementById('hero-subtitle')) document.getElementById('hero-subtitle').textContent = data.home.hero_subtitle;
            if (document.getElementById('hero-cta')) document.getElementById('hero-cta').textContent = data.home.cta_button;

            // Populate About
            if (document.getElementById('about-title')) document.getElementById('about-title').textContent = data.about.title;
            const aboutText = document.getElementById('about-text');
            if (aboutText) {
                aboutText.innerHTML = data.about.content_paragraphs.map(p => `<p>${p}</p>`).join('<br>');
            }

            // Populate Awards
            if (document.getElementById('awards-title')) document.getElementById('awards-title').textContent = data.awards.title;
            const awardsGrid = document.getElementById('awards-grid');
            if (awardsGrid && data.awards.awards_list) {
                awardsGrid.innerHTML = data.awards.awards_list.map(award => `
                    <div class="project-card fade-in">
                        <div class="project-info">
                            <h3>${award.title}</h3>
                            <p>${award.description}</p>
                        </div>
                    </div>
                `).join('');

                // Re-observe new elements for animation
                document.querySelectorAll('.project-card').forEach(el => observer.observe(el));
            }

            // Populate Contact
            if (document.getElementById('contact-title')) document.getElementById('contact-title').textContent = data.contact.title;

            // Populate Articles List
            const articleList = document.getElementById('article-list');
            if (articleList && data.articles) {
                articleList.innerHTML = data.articles.map(article => `
                    <a href="article-view.html?id=${article.id}" class="article-card fade-in">
                        <h3>${article.title}</h3>
                        <span class="article-meta">${article.date} | ${article.authors}</span>
                        <div class="article-abstract">${article.abstract}</div>
                        <span class="read-more">Read Full Article &rarr;</span>
                    </a>
                `).join('');
                document.querySelectorAll('.article-card').forEach(el => observer.observe(el));
            }

            // Populate Single Article View
            const articleContent = document.getElementById('article-content');
            if (articleContent) {
                const urlParams = new URLSearchParams(window.location.search);
                const articleId = urlParams.get('id');

                if (articleId && data.articles) {
                    const article = data.articles.find(a => a.id === articleId);
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

                        // Dynamically add sections if they exist and are not empty
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

                        // References
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

                        // Observe new elements
                        document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
                    } else {
                        articleContent.innerHTML = '<p>Article not found.</p>';
                    }
                } else {
                    articleContent.innerHTML = '<p>No article specified.</p>';
                }
            }

        })
        .catch(error => console.error('Error loading content:', error));
});
