document.addEventListener('DOMContentLoaded', () => {
    // ============================================================
    // 1. 汉堡菜单逻辑
    // ============================================================
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

    // ============================================================
    // 2. 锚点平滑滚动
    // ============================================================
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

    // ============================================================
    // 3. 滚动动画 (Intersection Observer)
    // ============================================================
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

    // 需要动画的元素
    const animateElements = document.querySelectorAll(
        '.hero-text, .hero-image, .section-title, .about-grid, .project-card, .contact-form'
    );
    animateElements.forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });

    // ============================================================
    // 4. 页脚年份自动更新
    // ============================================================
    const yearElement = document.getElementById('year');
    if (yearElement) {
        const currentYear = new Date().getFullYear();
        const startYear = 2026;
        yearElement.textContent = currentYear > startYear ? `${startYear}-${currentYear}` : startYear;
    }

    // ============================================================
    // 5. 工具函数：加载 JSON（支持多个备选路径）
    // ============================================================
    const loadJSON = async (paths) => {
        if (!Array.isArray(paths)) paths = [paths];
        for (const path of paths) {
            try {
                console.log(`📡 Fetching: ${path}`);
                const response = await fetch(path);
                if (response.ok) {
                    const data = await response.json();
                    console.log(`✅ Loaded: ${path}`);
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

    // ============================================================
    // 6. 工具函数：HTML 转义（防 XSS）
    // ============================================================
    const escapeHtml = (text) => {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    // ============================================================
    // 7. 加载全局设置（导航、页脚、标题）
    // ============================================================
    loadJSON(['content/global.json', 'global.json']).then(data => {
        if (!data) return;

        // 页脚文字
        const footerRights = document.getElementById('footer-rights');
        if (footerRights) footerRights.textContent = data.footer_rights;

        // 页面标题（文章页、奖项页）
        if (data.titles) {
            const articlesTitle = document.getElementById('articles-title');
            if (articlesTitle) articlesTitle.textContent = data.titles.articles;
            const awardsTitle = document.getElementById('awards-title');
            if (awardsTitle) awardsTitle.textContent = data.titles.awards;
        }

        // 导航菜单（如果存在）
        if (data.nav && Array.isArray(data.nav)) {
            const navContainers = document.querySelectorAll('.nav-links');
            navContainers.forEach(nav => {
                nav.innerHTML = data.nav.map(item =>
                    `<li><a href="${item.url}">${item.label}</a></li>`
                ).join('');
                // 重新绑定点击关闭菜单
                nav.querySelectorAll('a').forEach(link => {
                    link.addEventListener('click', () => {
                        if (hamburger) hamburger.classList.remove('active');
                        if (navLinks) navLinks.classList.remove('active');
                    });
                });
            });
        }
    });

    // ============================================================
    // 8. 首页内容
    // ============================================================
    if (document.getElementById('hero-title')) {
        loadJSON(['content/home.json', 'home.json']).then(data => {
            if (!data) return;
            document.getElementById('hero-title').innerHTML = data.hero_title;
            document.getElementById('hero-subtitle').textContent = data.hero_subtitle;
            document.getElementById('hero-cta').textContent = data.cta_button;
        });
    }

    // ============================================================
    // 9. 关于页面内容
    // ============================================================
    if (document.getElementById('about-title')) {
        loadJSON(['content/about.json', 'about.json']).then(data => {
            if (!data) return;
            document.getElementById('about-title').textContent = data.title;
            const aboutText = document.getElementById('about-text');
            if (aboutText && data.content_paragraphs) {
                aboutText.innerHTML = data.content_paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('<br>');
            }
        });
    }

    // ============================================================
    // 10. 奖项页面（含空状态和错误处理）
    // ============================================================
    if (document.getElementById('awards-grid')) {
        const awardsGrid = document.getElementById('awards-grid');

        // 显示加载状态
        awardsGrid.innerHTML = `
            <div class="loading-container" style="grid-column: 1 / -1;">
                <div class="loading-spinner"></div>
                <p>Loading awards…</p>
            </div>
        `;

        loadJSON(['content/awards.json', 'awards.json'])
            .then(data => {
                console.log('🏆 Awards data:', data);

                // 有数据且为数组且非空
                if (data && Array.isArray(data) && data.length > 0) {
                    awardsGrid.innerHTML = data.map(award => `
                        <div class="project-card fade-in">
                            <div class="project-info">
                                <h3>${escapeHtml(award.title)}</h3>
                                <p>${escapeHtml(award.description)}</p>
                            </div>
                        </div>
                    `).join('');
                    // 重新触发动画
                    document.querySelectorAll('.project-card').forEach(el => {
                        el.classList.add('fade-in');
                        observer.observe(el);
                    });
                    return;
                }

                // 无数据 → 显示空状态
                awardsGrid.innerHTML = `
                    <div class="empty-state" style="grid-column: 1 / -1;">
                        <span class="icon">🏅</span>
                        No honors & awards found
                        <div class="sub">Check back later for updates</div>
                    </div>
                `;
            })
            .catch(error => {
                console.error('❌ Awards error:', error);
                awardsGrid.innerHTML = `
                    <div class="error-message" style="grid-column: 1 / -1;">
                        <h2>⚠️ Unable to load awards</h2>
                        <p>Please try again later.</p>
                    </div>
                `;
            });
    }

    // ============================================================
    // 11. 联系页面（标题）
    // ============================================================
    if (document.getElementById('contact-title')) {
        loadJSON(['content/contact.json', 'contact.json']).then(data => {
            if (!data) return;
            document.getElementById('contact-title').textContent = data.title;
            // 如果有表单标签，也可以在这里填充
        });
    }

    // ============================================================
    // 12. 文章页面（列表 + 单页 + 实时搜索）
    // ============================================================
    if (document.getElementById('article-list') || document.getElementById('article-content')) {

        // 显示加载状态
        const articleList = document.getElementById('article-list');
        const articleContent = document.getElementById('article-content');
        if (articleList) {
            articleList.innerHTML = `
                <div class="loading-container" style="grid-column: 1 / -1;">
                    <div class="loading-spinner"></div>
                    <p>Loading articles…</p>
                </div>
            `;
        }
        if (articleContent) {
            articleContent.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p>Loading article…</p>
                </div>
            `;
        }

        // 加载文章数据
        loadJSON(['content/articles.json', 'articles.json'])
            .then(data => {
                console.log('📄 Articles data:', data);

                // 数据无效
                if (!data || !Array.isArray(data)) {
                    const errMsg = !data ? 'No data received' : 'Data is not an array';
                    if (articleList) {
                        articleList.innerHTML = `
                            <div class="error-message" style="grid-column: 1 / -1;">
                                <h2>⚠️ Error loading articles</h2>
                                <p>${escapeHtml(errMsg)}. Please try again later.</p>
                            </div>
                        `;
                    }
                    if (articleContent) {
                        articleContent.innerHTML = `
                            <div class="error-message">
                                <h2>⚠️ Error loading article</h2>
                                <p>${escapeHtml(errMsg)}.</p>
                            </div>
                        `;
                    }
                    return;
                }

                // 存储完整数据供搜索使用
                const fullArticles = data;

                // ========== 渲染文章列表（带搜索） ==========
                const renderArticleList = (articles) => {
                    if (!articleList) return;

                    if (articles.length === 0) {
                        articleList.innerHTML = `
                            <div class="no-results" style="grid-column: 1 / -1; text-align:center; padding:3rem 1rem; color:#718096;">
                                No articles found matching your search.
                            </div>
                        `;
                        const stats = document.getElementById('searchStats');
                        if (stats) stats.style.display = 'none';
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

                    // 重新触发动画
                    document.querySelectorAll('.article-card').forEach(el => {
                        el.classList.add('fade-in');
                        observer.observe(el);
                    });

                    // 更新统计信息
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

                // ========== 搜索功能 ==========
                const searchInput = document.getElementById('searchInput');
                const clearBtn = document.getElementById('clearSearch');

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
                        return title.includes(lower) || authors.includes(lower) || 
                               abstract.includes(lower) || date.includes(lower);
                    });
                    renderArticleList(filtered);
                };

                if (searchInput) {
                    searchInput.addEventListener('input', (e) => {
                        filterArticles(e.target.value);
                    });
                }
                if (clearBtn) {
                    clearBtn.addEventListener('click', () => {
                        if (searchInput) {
                            searchInput.value = '';
                            filterArticles('');
                            searchInput.focus();
                        }
                    });
                }

                // 初始渲染（全部文章）
                if (articleList) {
                    renderArticleList(fullArticles);
                }

                // ========== 文章单页 ==========
                if (articleContent) {
                    const urlParams = new URLSearchParams(window.location.search);
                    const articleId = urlParams.get('id');

                    if (!articleId) {
                        articleContent.innerHTML = `
                            <div class="error-message">
                                <h2>⚠️ No article specified</h2>
                                <p>Please select an article from the <a href="articles.html">articles page</a>.</p>
                            </div>
                        `;
                        return;
                    }

                    const article = fullArticles.find(a => a.id === articleId);
                    if (!article) {
                        articleContent.innerHTML = `
                            <div class="error-message">
                                <h2>⚠️ Article not found</h2>
                                <p>The article with ID "${escapeHtml(articleId)}" does not exist.</p>
                                <p><a href="articles.html">Return to articles list</a></p>
                            </div>
                        `;
                        return;
                    }

                    // ----- 构建文章 HTML -----
                    let html = '';

                    // 头部
                    html += `
                        <header class="article-header fade-in">
                            <h1>${escapeHtml(article.title)}</h1>
                            <div class="article-meta">
                                ${article.authors ? `<p><strong>Authors:</strong> ${escapeHtml(article.authors)}</p>` : ''}
                                ${article.date ? `<p><strong>Published:</strong> ${escapeHtml(article.date)}</p>` : ''}
                            </div>
                        </header>
                    `;

                    // 摘要
                    if (article.abstract) {
                        html += `
                            <section class="article-section fade-in">
                                <h2>Abstract</h2>
                                <div class="abstract-text">${escapeHtml(article.abstract)}</div>
                            </section>
                        `;
                    }

                    // 富文本章节
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

                    // 参考文献（支持字符串或数组）
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

                    // 下载按钮
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

                    // 触发文章内动画
                    document.querySelectorAll('.article-section, .article-header, .article-download').forEach(el => {
                        el.classList.add('fade-in');
                        observer.observe(el);
                    });
                }

            })
            .catch(error => {
                console.error('❌ Articles error:', error);
                const errMsg = error.message || 'Unknown error';
                if (articleList) {
                    articleList.innerHTML = `
                        <div class="error-message" style="grid-column: 1 / -1;">
                            <h2>⚠️ Error loading articles</h2>
                            <p>${escapeHtml(errMsg)}</p>
                        </div>
                    `;
                }
                if (articleContent) {
                    articleContent.innerHTML = `
                        <div class="error-message">
                            <h2>⚠️ Error loading article</h2>
                            <p>${escapeHtml(errMsg)}</p>
                        </div>
                    `;
                }
            });
    }
});
