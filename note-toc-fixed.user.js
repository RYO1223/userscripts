// ==UserScript==
// @name         note.com 目次を右側に固定表示（自動生成機能付き）
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  note.comの記事で目次を右側に常に表示。目次がない場合はh2,h3から自動生成
// @author       You
// @match        https://note.com/*
// @grant        GM_addStyle
// @updateURL    https://raw.githubusercontent.com/RYO1223/userscripts/main/note-toc-fixed.user.js
// @downloadURL  https://raw.githubusercontent.com/RYO1223/userscripts/main/note-toc-fixed.user.js
// ==/UserScript==

(function() {
    'use strict';

    // 設定値の定義
    const CONFIG = {
        TOC_POSITION: {
            right: '20px',
            top: '100px'
        },
        TOC_STYLES: {
            maxWidth: '300px',
            maxHeight: '80vh',
            backgroundColor: 'white',
            borderColor: '#e0e0e0',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 1000
        },
        SCROLLBAR: {
            width: '6px',
            trackColor: '#f1f1f1',
            thumbColor: '#888',
            thumbHoverColor: '#555'
        },
        FONT_SIZES: {
            toc: '14px',
            title: '16px',
            h3: '13px'
        },
        COLORS: {
            text: '#333',
            hover: '#00a8cc'
        },
        SELECTORS: {
            existingToc: '.o-tableOfContents:not(.generated-toc)',
            generatedToc: '.generated-toc',
            contentAreas: [
                '.note-common-styles__textnote-body',
                '.p-article__content',
                'article',
                '[class*="article"]',
                '[class*="content"]'
            ]
        },
        DELAYS: {
            initial: 1000,
            mutation: 500,
            interval: 3000
        }
    };

    // CSSスタイルを追加
    GM_addStyle(`
        .o-tableOfContents {
            position: fixed !important;
            right: ${CONFIG.TOC_POSITION.right} !important;
            top: ${CONFIG.TOC_POSITION.top} !important;
            max-width: ${CONFIG.TOC_STYLES.maxWidth} !important;
            max-height: ${CONFIG.TOC_STYLES.maxHeight} !important;
            overflow-y: auto !important;
            background-color: ${CONFIG.TOC_STYLES.backgroundColor} !important;
            border: 1px solid ${CONFIG.TOC_STYLES.borderColor} !important;
            border-radius: ${CONFIG.TOC_STYLES.borderRadius} !important;
            padding: ${CONFIG.TOC_STYLES.padding} !important;
            box-shadow: ${CONFIG.TOC_STYLES.boxShadow} !important;
            z-index: ${CONFIG.TOC_STYLES.zIndex} !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }

        .o-tableOfContents * {
            visibility: visible !important;
            display: block !important;
        }

        .o-tableOfContents::-webkit-scrollbar {
            width: ${CONFIG.SCROLLBAR.width};
        }

        .o-tableOfContents::-webkit-scrollbar-track {
            background: ${CONFIG.SCROLLBAR.trackColor};
            border-radius: 3px;
        }

        .o-tableOfContents::-webkit-scrollbar-thumb {
            background: ${CONFIG.SCROLLBAR.thumbColor};
            border-radius: 3px;
        }

        .o-tableOfContents::-webkit-scrollbar-thumb:hover {
            background: ${CONFIG.SCROLLBAR.thumbHoverColor};
        }

        ${CONFIG.SELECTORS.generatedToc} {
            font-size: ${CONFIG.FONT_SIZES.toc};
            line-height: 1.6;
        }

        .generated-toc-title {
            font-weight: bold;
            margin-bottom: 15px;
            font-size: ${CONFIG.FONT_SIZES.title};
            color: ${CONFIG.COLORS.text};
        }

        ${CONFIG.SELECTORS.generatedToc} ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        ${CONFIG.SELECTORS.generatedToc} li {
            margin-bottom: 8px;
        }

        ${CONFIG.SELECTORS.generatedToc} a {
            color: ${CONFIG.COLORS.text};
            text-decoration: none;
            display: block;
            padding: 4px 0;
            transition: color 0.2s ease;
        }

        ${CONFIG.SELECTORS.generatedToc} a:hover {
            color: ${CONFIG.COLORS.hover};
        }

        ${CONFIG.SELECTORS.generatedToc} li.toc-h3 {
            margin-left: 20px;
        }

        ${CONFIG.SELECTORS.generatedToc} li.toc-h3 a {
            font-size: ${CONFIG.FONT_SIZES.h3};
        }
    `);

    let generatedTocElement = null;
    let processingTimeout = null;

    // 見出しを収集する関数
    function collectHeadings() {
        let headings = [];

        // 設定されたセレクタで見出しを検索
        for (const selector of CONFIG.SELECTORS.contentAreas) {
            const contentArea = document.querySelector(selector);
            if (contentArea) {
                headings = contentArea.querySelectorAll('h2, h3');
                if (headings.length > 0) break;
            }
        }

        // セレクタで見つからない場合は、ページ全体から検索
        if (headings.length === 0) {
            headings = document.querySelectorAll('main h2, main h3, article h2, article h3');
        }

        return Array.from(headings);
    }

    // 見出しにIDを付与する関数
    function ensureHeadingId(heading, index) {
        if (!heading.id) {
            // 見出しテキストからIDを生成（日本語対応）
            const text = heading.textContent.trim();
            const baseId = `heading-${index}-${text.substring(0, 20).replace(/[^\w\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, '')}`;
            heading.id = baseId;
        }
        return heading.id;
    }

    // 目次アイテムを作成する関数
    function createTOCItem(heading, index) {
        const id = ensureHeadingId(heading, index);
        const li = document.createElement('li');
        li.className = `toc-${heading.tagName.toLowerCase()}`;

        const link = document.createElement('a');
        link.href = `#${id}`;
        link.textContent = heading.textContent.trim();

        // スムーズスクロール
        link.addEventListener('click', (e) => {
            e.preventDefault();
            heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        li.appendChild(link);
        return li;
    }

    // 目次要素を生成する関数
    function createTOCElement(headings) {
        const toc = document.createElement('div');
        toc.className = 'o-tableOfContents generated-toc';

        // タイトル
        const title = document.createElement('div');
        title.className = 'generated-toc-title';
        title.textContent = '目次';
        toc.appendChild(title);

        // リスト
        const list = document.createElement('ul');
        headings.forEach((heading, index) => {
            list.appendChild(createTOCItem(heading, index));
        });

        toc.appendChild(list);
        return toc;
    }

    // 生成済み目次を削除する関数
    function removeGeneratedTOC() {
        if (generatedTocElement && generatedTocElement.parentNode) {
            generatedTocElement.remove();
            generatedTocElement = null;
        }
    }

    // 目次を生成する関数
    function generateTOC() {
        // 既存の目次があるかチェック
        const existingTOC = document.querySelector(CONFIG.SELECTORS.existingToc);
        if (existingTOC) {
            console.log('既存の目次が見つかりました。');
            return false;
        }

        // 既に生成した目次がある場合は削除
        removeGeneratedTOC();

        // 見出しを収集
        const headings = collectHeadings();
        if (headings.length === 0) {
            console.log('見出しが見つかりませんでした。');
            return false;
        }

        console.log(`${headings.length}個の見出しを発見しました。目次を生成します。`);

        // 目次を生成
        try {
            generatedTocElement = createTOCElement(headings);
            document.body.appendChild(generatedTocElement);
            return true;
        } catch (error) {
            console.error('目次の生成中にエラーが発生しました:', error);
            return false;
        }
    }

    // 既存の目次を処理する関数
    function processExistingTOC(toc) {
        console.log('既存の目次を発見しました。右側に固定表示します。');

        // 既存の親要素から切り離してbodyに直接追加（必要に応じて）
        if (toc.parentElement !== document.body) {
            document.body.appendChild(toc);
        }

        // 生成した目次があれば削除
        removeGeneratedTOC();
    }

    // 既存の目次要素を探して処理する関数
    function processTOC() {
        try {
            const toc = document.querySelector(CONFIG.SELECTORS.existingToc);
            if (toc) {
                processExistingTOC(toc);
            } else {
                // 既存の目次がない場合は生成を試みる
                generateTOC();
            }
        } catch (error) {
            console.error('目次の処理中にエラーが発生しました:', error);
        }
    }

    // ページ読み込み完了時に実行
    function initializeTOC() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', processTOC);
        } else {
            // 少し遅延させて実行（動的コンテンツの読み込みを待つ）
            setTimeout(processTOC, CONFIG.DELAYS.initial);
        }
    }

    // ノードが目次関連の要素かチェックする関数
    function isRelevantNode(node) {
        if (node.nodeType !== 1) return false; // Element nodeでない場合

        // 既存の目次が追加された場合
        if (node.classList && node.classList.contains('o-tableOfContents') && !node.classList.contains('generated-toc')) {
            return true;
        }

        // 子要素に目次が含まれる場合
        if (node.querySelector && node.querySelector(CONFIG.SELECTORS.existingToc)) {
            return true;
        }

        // 見出しが追加された場合
        if (node.tagName === 'H2' || node.tagName === 'H3') {
            return true;
        }

        // 子要素に見出しが含まれる場合
        if (node.querySelector && node.querySelector('h2, h3')) {
            return true;
        }

        return false;
    }

    // DOM変更を監視する関数
    function setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            let shouldProcess = false;

            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    // 追加されたノードをチェック
                    for (const node of mutation.addedNodes) {
                        if (isRelevantNode(node)) {
                            shouldProcess = true;
                            break;
                        }
                    }
                }
                if (shouldProcess) break;
            }

            if (shouldProcess) {
                // 少し遅延させて処理（連続した変更をまとめて処理）
                clearTimeout(processingTimeout);
                processingTimeout = setTimeout(processTOC, CONFIG.DELAYS.mutation);
            }
        });

        // 監視を開始
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        return observer;
    }

    // 初期化とセットアップ
    initializeTOC();
    const observer = setupMutationObserver();

    // 定期的にチェック（フォールバック）
    setInterval(processTOC, CONFIG.DELAYS.interval);

})();
