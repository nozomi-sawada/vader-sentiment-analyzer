/**
 * app.js — UI layer for the VADER-based Sentiment Analysis Tool.
 * All sentiment computation lives in vader.js; this file only handles
 * file loading, DOM rendering, language switching, and event wiring.
 */
(function () {
    'use strict';

    // ============================================================================
    // SECURITY: Safe DOM construction utilities
    // ============================================================================

    /**
     * Safely creates a DOM element with properties and children
     * @param {string} tag - HTML tag name
     * @param {Object} props - Properties to set (use 'text' for textContent)
     * @param {Array} children - Child elements
     * @returns {HTMLElement}
     */
    function el(tag, props = {}, children = []) {
        const node = document.createElement(tag);

        for (const [key, value] of Object.entries(props)) {
            if (key === 'text') {
                // Safe: textContent automatically escapes HTML
                node.textContent = value;
            } else if (key === 'class') {
                node.className = value;
            } else if (key === 'style') {
                // CSSOM assignment (allowed under CSP without 'unsafe-inline')
                node.style.cssText = value;
            } else {
                // Safe: setAttribute with user data
                node.setAttribute(key, value);
            }
        }

        for (const child of children) {
            if (child) {
                node.appendChild(child);
            }
        }

        return node;
    }

    /**
     * Safely clears container and appends children
     */
    function setChildren(container, children) {
        container.textContent = ''; // Safe clear
        for (const child of children) {
            if (child) {
                container.appendChild(child);
            }
        }
    }

    /**
     * Debounce function for performance optimization
     */
    function debounce(fn, wait = 300) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn.apply(this, args), wait);
        };
    }

    // ============================================================================
    // Internationalization
    // ============================================================================

    const MESSAGES = {
        ja: {
            txtOnly: 'テキストファイル(.txt)をアップロードしてください',
            tooLarge: 'ファイルが大きすぎます（上限10MB）',
            lexiconEmpty: 'レキシコンとして読み込める行がありませんでした',
            wordsLoaded: n => n + ' 単語を読み込みました',
            emojisLoaded: n => n + ' 個の絵文字マッピングを読み込みました',
            loadFailed: 'ファイルの読み込みに失敗しました',
            emojiLoadFailed: '絵文字ファイルの読み込みに失敗しました',
            enterText: '分析するテキストを入力してください',
            loadLexiconFirst: 'まずレキシコンファイルを読み込んでください',
            noSentences: '有効な文が見つかりませんでした',
            strongPos: '強いポジティブ', weakPos: '弱いポジティブ', neutralLabel: '中立',
            weakNeg: '弱いネガティブ', strongNeg: '強いネガティブ',
            punct: v => '句読点による強調 (!, ?): +' + v,
            sentenceResults: '文ごとの分析結果',
            overallSummary: '全体の集計',
            average: '平均',
            totalSentences: '総文数',
            nSentences: n => n + '文',
            positive: 'ポジティブ', negative: 'ネガティブ', neutral: '中立',
            sentenceN: n => '文' + n,
            highlights: '感情表現のハイライト',
            tokenAnalysis: '詳細単語分析',
            thToken: '単語', thOriginal: '元スコア', thAdjusted: '調整後',
            thAdjustments: '調整内容', thStdDev: '標準偏差',
            searchPrompt: 'キーワードを入力してください',
            searchPlaceholder: '単語・記号を検索...',
            inputPlaceholder: '分析する英語テキストを入力...',
            noResults: '検索結果がありません',
            legPositive: 'ポジティブ', legNegative: 'ネガティブ',
            legNegatedPos: '否定されたポジティブ語', legNegatedNeg: '否定されたネガティブ語',
            legNegation: '否定語', legBooster: '強調・弱化語', legNeutral: '中立'
        },
        en: {
            txtOnly: 'Please upload a text file (.txt)',
            tooLarge: 'File too large (max 10MB)',
            lexiconEmpty: 'No valid lexicon entries found',
            wordsLoaded: n => n + ' words loaded',
            emojisLoaded: n => n + ' emoji mappings loaded',
            loadFailed: 'Failed to load file',
            emojiLoadFailed: 'Failed to load emoji file',
            enterText: 'Please enter text to analyze',
            loadLexiconFirst: 'Please load the lexicon file first',
            noSentences: 'No valid sentences found',
            strongPos: 'Strong Positive', weakPos: 'Weak Positive', neutralLabel: 'Neutral',
            weakNeg: 'Weak Negative', strongNeg: 'Strong Negative',
            punct: v => 'Punctuation emphasis (!, ?): +' + v,
            sentenceResults: 'Sentence-level Analysis Results',
            overallSummary: 'Overall Summary',
            average: 'Average',
            totalSentences: 'Total',
            nSentences: n => String(n),
            positive: 'Positive', negative: 'Negative', neutral: 'Neutral',
            sentenceN: n => 'Sentence ' + n,
            highlights: 'Sentiment Highlights',
            tokenAnalysis: 'Detailed Token Analysis',
            thToken: 'Token', thOriginal: 'Original', thAdjusted: 'Adjusted',
            thAdjustments: 'Adjustments', thStdDev: 'Std Dev',
            searchPrompt: 'Enter keywords to search',
            searchPlaceholder: 'Search words or symbols...',
            inputPlaceholder: 'Enter text to analyze sentiment...',
            noResults: 'No results found',
            legPositive: 'positive', legNegative: 'negative',
            legNegatedPos: 'negated positive', legNegatedNeg: 'negated negative',
            legNegation: 'negation word', legBooster: 'booster/dampener', legNeutral: 'neutral'
        }
    };

    let currentLang = 'ja';
    try {
        const saved = localStorage.getItem('vader-lang');
        if (saved === 'ja' || saved === 'en') currentLang = saved;
    } catch (e) { /* localStorage unavailable (e.g. some file:// contexts) */ }

    function t(key, ...args) {
        const v = MESSAGES[currentLang][key];
        return typeof v === 'function' ? v(...args) : v;
    }

    function applyLanguage(lang) {
        currentLang = lang;
        document.documentElement.dataset.lang = lang;
        document.documentElement.lang = lang;
        try { localStorage.setItem('vader-lang', lang); } catch (e) { /* ignore */ }

        document.querySelectorAll('[data-lang-btn]').forEach(btn => {
            const active = btn.dataset.langBtn === lang;
            btn.className = 'px-3 py-1.5 font-semibold ' +
                (active ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-100');
        });

        document.getElementById('search-input').placeholder = t('searchPlaceholder');
        document.getElementById('text-input').placeholder = t('inputPlaceholder');

        // Re-render language-dependent dynamic content
        if (state.lexiconCount !== null) {
            document.getElementById('lexicon-loaded').textContent = '✓ ' + t('wordsLoaded', state.lexiconCount.toLocaleString());
        }
        if (state.emojiCount !== null) {
            document.getElementById('emoji-loaded').textContent = '✓ ' + t('emojisLoaded', state.emojiCount.toLocaleString());
        }
        if (state.lastResult !== null) {
            displayResults(state.lastResult);
        }
        refreshSearch();
    }

    // ============================================================================
    // Application State
    // ============================================================================

    let vaderLexicon = {};
    let emojiLexicon = null;
    let lexiconStats = null;

    const state = {
        lastResult: null,
        lexiconCount: null,
        emojiCount: null
    };

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

    // ============================================================================
    // UI Helper Functions
    // ============================================================================

    function showNotification(message, type) {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = 'mb-4 p-4 rounded ' + (
            type === 'success' ? 'bg-green-100 text-green-800' :
            type === 'error' ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
        );
        notification.classList.remove('hidden');
        setTimeout(() => notification.classList.add('hidden'), 5000);
    }

    function getWordColor(type) {
        const colors = {
            positive: 'bg-green-600 text-white',
            negative: 'bg-red-600 text-white',
            negated_positive: 'bg-orange-500 text-white',
            negated_negative: 'bg-teal-600 text-white',
            negation: 'bg-amber-300 text-gray-900',
            booster: 'bg-violet-500 text-white',
            neutral: 'bg-gray-200 text-gray-700'
        };
        return colors[type] || colors.neutral;
    }

    const LEGEND_TYPES = [
        ['positive', 'legPositive'],
        ['negative', 'legNegative'],
        ['negated_positive', 'legNegatedPos'],
        ['negated_negative', 'legNegatedNeg'],
        ['negation', 'legNegation'],
        ['booster', 'legBooster'],
        ['neutral', 'legNeutral']
    ];

    function buildLegend() {
        return el('div', { class: 'flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600' },
            LEGEND_TYPES.map(([type, key]) =>
                el('span', { class: 'inline-flex items-center gap-1' }, [
                    el('span', { class: 'inline-block w-3 h-3 rounded ' + getWordColor(type) }),
                    el('span', { text: t(key) })
                ])
            )
        );
    }

    function getSentimentLabel(score) {
        if (score >= 0.5) return { label: t('strongPos'), color: 'bg-green-700' };
        if (score >= 0.05) return { label: t('weakPos'), color: 'bg-green-600' };
        if (score > -0.05) return { label: t('neutralLabel'), color: 'bg-gray-500' };
        if (score > -0.5) return { label: t('weakNeg'), color: 'bg-red-600' };
        return { label: t('strongNeg'), color: 'bg-red-700' };
    }

    function isSignificant(s) {
        return s.score !== 0 || s.type === 'negation' || s.type === 'booster' || s.adjustments.length > 0;
    }

    // ============================================================================
    // Display Functions (XSS-Safe)
    // ============================================================================

    function displayResults(result) {
        state.lastResult = result;
        const resultContainer = document.getElementById('result-container');
        resultContainer.classList.remove('hidden');

        if (Array.isArray(result)) {
            document.getElementById('sentence-mode-results').classList.remove('hidden');
            document.getElementById('single-mode-results').classList.add('hidden');
            displaySentenceResults(result);
        } else {
            document.getElementById('sentence-mode-results').classList.add('hidden');
            document.getElementById('single-mode-results').classList.remove('hidden');
            displaySingleResult(result);
        }
    }

    function displaySingleResult(result) {
        const label = getSentimentLabel(result.compound);

        const compoundDisplay = document.getElementById('compound-score-display');
        compoundDisplay.textContent = result.compound.toFixed(4);
        compoundDisplay.className = 'text-5xl font-bold mb-2 ' +
            (result.compound >= 0.05 ? 'text-green-700' :
            result.compound <= -0.05 ? 'text-red-700' : 'text-gray-600');

        const sentimentLabel = document.getElementById('sentiment-label');
        sentimentLabel.textContent = label.label;
        sentimentLabel.className = 'inline-block px-4 py-2 rounded text-white text-base font-semibold ' + label.color;

        const punctInfo = document.getElementById('punct-emphasis');
        if (result.punctEmphasis > 0) {
            punctInfo.textContent = t('punct', result.punctEmphasis.toFixed(3));
            punctInfo.classList.remove('hidden');
        } else {
            punctInfo.classList.add('hidden');
        }

        const bar = document.getElementById('sentiment-bar');
        bar.style.width = ((result.compound + 1) / 2) * 100 + '%';

        document.getElementById('pos-score').textContent = (result.pos * 100).toFixed(1) + '%';
        document.getElementById('neu-score').textContent = (result.neu * 100).toFixed(1) + '%';
        document.getElementById('neg-score').textContent = (result.neg * 100).toFixed(1) + '%';

        // SECURITY: Safe rendering of highlighted text using DOM construction
        const highlightedText = document.getElementById('highlighted-text');
        setChildren(highlightedText, result.sentiments.map(s => {
            return el('span', {
                class: 'inline-block px-2 py-1 m-1 rounded ' + getWordColor(s.type),
                title: 'Score: ' + s.adjustedScore.toFixed(2),
                text: s.token // Safe: textContent
            });
        }));

        setChildren(document.getElementById('highlight-legend'), [buildLegend()]);

        // SECURITY: Safe rendering of token table
        const tokenTable = document.getElementById('token-table');
        const significantTokens = result.sentiments.filter(isSignificant);

        setChildren(tokenTable, significantTokens.map(s => {
            const stdDevCell = el('td', { class: 'border p-2' });
            if (s.stdDev) {
                stdDevCell.textContent = s.stdDev.toFixed(2);
                const barBg = el('div', { class: 'w-full bg-gray-200 rounded-full h-2 mt-1' });
                const bar = el('div', {
                    class: 'bg-blue-700 h-2 rounded-full',
                    style: 'width: ' + Math.min(100, (s.stdDev / 3) * 100) + '%'
                });
                barBg.appendChild(bar);
                stdDevCell.appendChild(barBg);
            } else {
                stdDevCell.textContent = '-';
            }

            return el('tr', { class: 'hover:bg-gray-50' }, [
                el('td', { class: 'border p-2 font-semibold', text: s.token }),
                el('td', { class: 'border p-2 text-center', text: s.score.toFixed(2) }),
                el('td', { class: 'border p-2 text-center font-semibold', text: s.adjustedScore.toFixed(2) }),
                el('td', { class: 'border p-2', text: (s.adjustments && s.adjustments.length > 0) ? s.adjustments.join(', ') : '-' }),
                stdDevCell
            ]);
        }));
    }

    function displaySentenceResults(results) {
        const container = document.getElementById('sentence-mode-results');

        const avgCompound = results.reduce((sum, r) => sum + r.compound, 0) / results.length;
        const posCount = results.filter(r => r.compound >= 0.05).length;
        const negCount = results.filter(r => r.compound <= -0.05).length;

        // SECURITY: Build all elements safely
        const elements = [];

        elements.push(el('h2', { class: 'text-xl font-bold mb-4', text: t('sentenceResults') }));

        // Summary section
        const summaryDiv = el('div', { class: 'mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6' }, [
            el('h3', { class: 'text-lg font-bold mb-4 text-blue-900', text: t('overallSummary') }),
            el('div', { class: 'grid grid-cols-2 md:grid-cols-4 gap-4' }, [
                el('div', { class: 'bg-white rounded-lg p-4 text-center border border-gray-200' }, [
                    el('div', { class: 'text-sm text-gray-600 mb-1', text: t('average') }),
                    el('div', {
                        class: 'text-2xl font-bold ' + (avgCompound >= 0 ? 'text-green-700' : 'text-red-700'),
                        text: avgCompound.toFixed(4)
                    })
                ]),
                el('div', { class: 'bg-white rounded-lg p-4 text-center border border-gray-200' }, [
                    el('div', { class: 'text-sm text-gray-600 mb-1', text: t('totalSentences') }),
                    el('div', { class: 'text-2xl font-bold text-gray-800', text: t('nSentences', results.length) })
                ]),
                el('div', { class: 'bg-white rounded-lg p-4 text-center border border-gray-200' }, [
                    el('div', { class: 'text-sm text-gray-600 mb-1', text: t('positive') }),
                    el('div', { class: 'text-xl font-bold text-green-700', text: t('nSentences', posCount) }),
                    el('div', { class: 'text-xs text-gray-500', text: '(' + ((posCount / results.length) * 100).toFixed(1) + '%)' })
                ]),
                el('div', { class: 'bg-white rounded-lg p-4 text-center border border-gray-200' }, [
                    el('div', { class: 'text-sm text-gray-600 mb-1', text: t('negative') }),
                    el('div', { class: 'text-xl font-bold text-red-700', text: t('nSentences', negCount) }),
                    el('div', { class: 'text-xs text-gray-500', text: '(' + ((negCount / results.length) * 100).toFixed(1) + '%)' })
                ])
            ])
        ]);

        elements.push(summaryDiv);
        elements.push(el('div', { class: 'mb-4' }, [buildLegend()]));

        // Individual sentence results
        results.forEach((result, i) => {
            const label = getSentimentLabel(result.compound);
            const borderColor = result.compound >= 0.05 ? 'border-green-300' :
                               result.compound <= -0.05 ? 'border-red-300' : 'border-gray-300';

            const sentenceDiv = el('div', { class: 'mb-6 bg-white rounded-lg border ' + borderColor + ' p-5' }, [
                el('div', { class: 'flex items-start justify-between mb-3' }, [
                    el('div', { class: 'flex-1' }, [
                        el('div', { class: 'text-lg font-bold text-gray-800 mb-2', text: t('sentenceN', i + 1) }),
                        el('div', { class: 'text-base text-gray-700 italic mb-3 bg-gray-50 p-3 rounded', text: '"' + result.originalText + '"' })
                    ]),
                    el('span', {
                        class: 'ml-4 px-3 py-1 rounded text-white text-sm font-semibold whitespace-nowrap ' + label.color,
                        text: label.label + ' ' + result.compound.toFixed(4)
                    })
                ]),
                el('div', { class: 'grid grid-cols-3 gap-3 mb-4' }, [
                    el('div', { class: 'border border-gray-200 rounded p-2 text-center bg-green-50' }, [
                        el('div', { class: 'text-xs text-gray-600 mb-1', text: t('positive') }),
                        el('div', { class: 'text-lg font-bold text-green-700', text: (result.pos * 100).toFixed(1) + '%' })
                    ]),
                    el('div', { class: 'border border-gray-200 rounded p-2 text-center bg-gray-50' }, [
                        el('div', { class: 'text-xs text-gray-600 mb-1', text: t('neutral') }),
                        el('div', { class: 'text-lg font-bold text-gray-600', text: (result.neu * 100).toFixed(1) + '%' })
                    ]),
                    el('div', { class: 'border border-gray-200 rounded p-2 text-center bg-red-50' }, [
                        el('div', { class: 'text-xs text-gray-600 mb-1', text: t('negative') }),
                        el('div', { class: 'text-lg font-bold text-red-700', text: (result.neg * 100).toFixed(1) + '%' })
                    ])
                ]),
                result.punctEmphasis > 0
                    ? el('p', { class: 'text-xs text-gray-600 mb-3', text: t('punct', result.punctEmphasis.toFixed(3)) })
                    : null,
                el('div', { class: 'mb-4' }, [
                    el('h4', { class: 'font-semibold text-sm mb-2', text: t('highlights') }),
                    el('div', { class: 'bg-gray-50 p-3 rounded leading-relaxed' },
                        result.sentiments.map(s => el('span', {
                            class: 'inline-block px-2 py-1 m-1 rounded text-sm ' + getWordColor(s.type),
                            title: 'Score: ' + s.adjustedScore.toFixed(2),
                            text: s.token
                        }))
                    )
                ])
            ]);

            const significantTokens = result.sentiments.filter(isSignificant);

            if (significantTokens.length > 0) {
                const tableDiv = el('div', {}, [
                    el('h4', { class: 'font-semibold text-sm mb-2', text: t('tokenAnalysis') }),
                    el('div', { class: 'overflow-x-auto' }, [
                        el('table', { class: 'w-full border-collapse text-xs' }, [
                            el('thead', {}, [
                                el('tr', { class: 'bg-gray-100' }, [
                                    el('th', { class: 'border p-2 text-left', text: t('thToken') }),
                                    el('th', { class: 'border p-2', text: t('thOriginal') }),
                                    el('th', { class: 'border p-2', text: t('thAdjusted') }),
                                    el('th', { class: 'border p-2 text-left', text: t('thAdjustments') }),
                                    el('th', { class: 'border p-2', text: t('thStdDev') })
                                ])
                            ]),
                            el('tbody', {}, significantTokens.map(s => {
                                return el('tr', { class: 'hover:bg-gray-50' }, [
                                    el('td', { class: 'border p-2 font-semibold', text: s.token }),
                                    el('td', { class: 'border p-2 text-center', text: s.score.toFixed(2) }),
                                    el('td', { class: 'border p-2 text-center font-semibold', text: s.adjustedScore.toFixed(2) }),
                                    el('td', { class: 'border p-2 text-xs', text: s.adjustments && s.adjustments.length > 0 ? s.adjustments.join(', ') : '-' }),
                                    el('td', { class: 'border p-2', text: s.stdDev ? s.stdDev.toFixed(2) : '-' })
                                ]);
                            }))
                        ])
                    ])
                ]);
                sentenceDiv.appendChild(tableDiv);
            }

            elements.push(sentenceDiv);
        });

        setChildren(container, elements);
    }

    function displayStatistics() {
        document.getElementById('stats-section').classList.remove('hidden');
        document.getElementById('tabs-section').classList.remove('hidden');

        document.getElementById('stat-total').textContent = lexiconStats.total.toLocaleString();
        document.getElementById('stat-positive').textContent = lexiconStats.positive + ' (' + ((lexiconStats.positive / lexiconStats.total) * 100).toFixed(1) + '%)';
        document.getElementById('stat-negative').textContent = lexiconStats.negative + ' (' + ((lexiconStats.negative / lexiconStats.total) * 100).toFixed(1) + '%)';
        document.getElementById('stat-neutral').textContent = lexiconStats.neutral + ' (' + ((lexiconStats.neutral / lexiconStats.total) * 100).toFixed(1) + '%)';

        // Distribution chart
        const bins = {};
        for (let i = -4; i <= 4; i += 0.5) {
            bins[i.toFixed(1)] = 0;
        }

        Object.values(vaderLexicon).forEach(data => {
            const binKey = (Math.round(data.score * 2) / 2).toFixed(1);
            if (bins[binKey] !== undefined) {
                bins[binKey]++;
            }
        });

        const maxCount = Math.max(...Object.values(bins));
        const entries = Object.entries(bins).sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]));

        // SECURITY: Safe chart rendering
        const chartContainer = document.getElementById('distribution-chart');
        setChildren(chartContainer, entries.map(([score, count]) => {
            const height = (count / maxCount) * 100;
            const numScore = parseFloat(score);
            const color = numScore > 0 ? 'bg-green-600' : numScore < 0 ? 'bg-red-600' : 'bg-gray-400';

            return el('div', { class: 'flex-1 flex flex-col items-center', style: 'height: 100%' }, [
                el('div', { class: 'w-full flex items-end justify-center', style: 'height: 100%' }, [
                    el('div', {
                        class: 'chart-bar w-full ' + color + ' rounded-t transition-all hover:opacity-80',
                        style: 'height: ' + height + '%',
                        title: score + ': ' + count
                    })
                ])
            ]);
        }));

        // Top positive/negative words
        const getTopTokens = (type, count) => {
            const tokens = Object.entries(vaderLexicon).map(([token, data]) => ({
                token,
                score: data.score,
                stdDev: data.stdDev
            }));

            if (type === 'positive') {
                return tokens.filter(t => t.score > 0).sort((a, b) => b.score - a.score).slice(0, count);
            } else {
                return tokens.filter(t => t.score < 0).sort((a, b) => a.score - b.score).slice(0, count);
            }
        };

        const topPositive = getTopTokens('positive', 20);
        const topNegative = getTopTokens('negative', 20);

        // SECURITY: Safe rendering
        const topPositiveContainer = document.getElementById('top-positive');
        setChildren(topPositiveContainer, topPositive.map(t => {
            return el('div', { class: 'border border-gray-200 rounded p-2 bg-green-50' }, [
                el('div', { class: 'font-semibold text-sm break-all', text: t.token }),
                el('div', { class: 'text-green-700 font-bold', text: t.score.toFixed(2) })
            ]);
        }));

        const topNegativeContainer = document.getElementById('top-negative');
        setChildren(topNegativeContainer, topNegative.map(t => {
            return el('div', { class: 'border border-gray-200 rounded p-2 bg-red-50' }, [
                el('div', { class: 'font-semibold text-sm break-all', text: t.token }),
                el('div', { class: 'text-red-700 font-bold', text: t.score.toFixed(2) })
            ]);
        }));

        // High standard deviation
        const highStdDev = Object.entries(vaderLexicon)
            .map(([token, data]) => ({ token, score: data.score, stdDev: data.stdDev }))
            .sort((a, b) => b.stdDev - a.stdDev)
            .slice(0, 20);

        const highStdDevContainer = document.getElementById('high-stddev');
        setChildren(highStdDevContainer, highStdDev.map(t => {
            return el('div', { class: 'border border-gray-200 rounded p-2 bg-amber-50' }, [
                el('div', { class: 'font-semibold text-sm break-all', text: t.token }),
                el('div', { class: 'text-xs' }, [
                    el('span', { class: 'text-gray-700', text: 'Score: ' + t.score.toFixed(2) }),
                    document.createElement('br'),
                    el('span', { class: 'text-amber-700 font-bold', text: 'σ: ' + t.stdDev.toFixed(2) })
                ])
            ]);
        }));
    }

    // ============================================================================
    // Event Listeners
    // ============================================================================

    function validateFile(file) {
        // SECURITY: File validation
        if (!file.name.endsWith('.txt')) {
            showNotification(t('txtOnly'), 'error');
            return false;
        }
        if (file.size > MAX_FILE_SIZE) {
            showNotification(t('tooLarge'), 'error');
            return false;
        }
        return true;
    }

    document.getElementById('lexicon-file').addEventListener('change', async function (e) {
        const file = e.target.files[0];
        e.target.value = ''; // allow re-selecting the same file later
        if (!file || !validateFile(file)) return;

        try {
            const text = await file.text();
            const result = VADER.parseLexicon(text);

            if (result.stats.total === 0) {
                showNotification(t('lexiconEmpty'), 'error');
                return;
            }

            vaderLexicon = result.lexicon;
            lexiconStats = result.stats;
            state.lexiconCount = result.stats.total;

            document.getElementById('lexicon-loaded').textContent = '✓ ' + t('wordsLoaded', result.stats.total.toLocaleString());
            document.getElementById('lexicon-loaded').classList.remove('hidden');

            displayStatistics();
            showNotification(t('wordsLoaded', result.stats.total.toLocaleString()), 'success');
        } catch (error) {
            showNotification(t('loadFailed'), 'error');
            console.error(error);
        }
    });

    document.getElementById('emoji-file').addEventListener('change', async function (e) {
        const file = e.target.files[0];
        e.target.value = ''; // allow re-selecting the same file later
        if (!file || !validateFile(file)) return;

        try {
            const text = await file.text();
            const result = VADER.parseEmojiLexicon(text);

            emojiLexicon = result.lexicon;
            state.emojiCount = result.count;

            document.getElementById('emoji-loaded').textContent = '✓ ' + t('emojisLoaded', result.count.toLocaleString());
            document.getElementById('emoji-loaded').classList.remove('hidden');

            showNotification(t('emojisLoaded', result.count.toLocaleString()), 'success');
        } catch (error) {
            showNotification(t('emojiLoadFailed'), 'error');
            console.error(error);
        }
    });

    document.getElementById('analyze-btn').addEventListener('click', function () {
        const text = document.getElementById('text-input').value.trim();
        if (!text) {
            showNotification(t('enterText'), 'error');
            return;
        }
        if (Object.keys(vaderLexicon).length === 0) {
            showNotification(t('loadLexiconFirst'), 'error');
            return;
        }

        const splitBySentence = document.getElementById('split-sentences-checkbox').checked;

        if (splitBySentence) {
            const sentences = VADER.splitIntoSentences(text);
            if (sentences.length === 0) {
                showNotification(t('noSentences'), 'error');
                return;
            }

            const results = sentences.map(sentence => {
                const result = VADER.analyze(sentence, vaderLexicon, emojiLexicon);
                result.originalText = sentence;
                return result;
            });

            displayResults(results);
        } else {
            const result = VADER.analyze(text, vaderLexicon, emojiLexicon);
            displayResults(result);
        }
    });

    document.querySelectorAll('.sample-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.getElementById('text-input').value = btn.textContent;
        });
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const tab = btn.dataset.tab;

            document.querySelectorAll('.tab-btn').forEach(b => {
                b.classList.remove('border-blue-700', 'text-blue-700', 'border-b-2');
                b.classList.add('text-gray-500');
            });
            btn.classList.add('border-blue-700', 'text-blue-700', 'border-b-2');
            btn.classList.remove('text-gray-500');

            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.add('hidden');
            });
            document.getElementById(tab + '-tab').classList.remove('hidden');
        });
    });

    document.querySelectorAll('[data-lang-btn]').forEach(btn => {
        btn.addEventListener('click', () => applyLanguage(btn.dataset.langBtn));
    });

    // Debounced search input for performance
    function renderSearch() {
        const query = document.getElementById('search-input').value.toLowerCase().trim();
        const resultsDiv = document.getElementById('search-results');

        if (query.length < 1) {
            setChildren(resultsDiv, [
                el('div', { class: 'p-8 text-center text-gray-500', text: t('searchPrompt') })
            ]);
            return;
        }

        const matches = Object.entries(vaderLexicon)
            .filter(([token]) => token.toLowerCase().includes(query))
            .slice(0, 50);

        if (matches.length === 0) {
            setChildren(resultsDiv, [
                el('div', { class: 'p-8 text-center text-gray-500', text: t('noResults') })
            ]);
            return;
        }

        // SECURITY: Safe rendering of search results
        setChildren(resultsDiv, matches.map(([token, data]) => {
            const scoreColor = data.score > 0 ? 'text-green-700' : data.score < 0 ? 'text-red-700' : 'text-gray-600';

            return el('div', { class: 'border-b p-3 flex justify-between items-center hover:bg-gray-50' }, [
                el('span', { class: 'font-semibold', text: token }),
                el('div', { class: 'text-sm' }, [
                    el('span', { class: 'font-bold ' + scoreColor, text: data.score.toFixed(2) }),
                    el('span', { class: 'text-gray-500 ml-2', text: 'σ=' + data.stdDev.toFixed(2) })
                ])
            ]);
        }));
    }

    function refreshSearch() {
        // Re-render search results (or prompt) in the current language
        if (document.getElementById('search-input').value.trim() || state.lexiconCount !== null) {
            renderSearch();
        }
    }

    document.getElementById('search-input').addEventListener('input', debounce(renderSearch, 300));

    // Apply saved language on startup
    applyLanguage(currentLang);
})();
