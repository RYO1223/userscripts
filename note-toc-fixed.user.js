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

    // CSSスタイルを追加
    GM_addStyle(`
        .o-tableOfContents {
            position: fixed !important;
            right: 20px !important;
            top: 100px !important;
            max-width: 300px !important;
            max-height: 80vh !important;
            overflow-y: auto !important;
            background-color: white !important;
            border: 1px solid #e0e0e0 !important;
            border-radius: 8px !important;
            padding: 20px !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
            z-index: 1000 !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }

        /* 目次内のスタイル調整 */
        .o-tableOfContents * {
            visibility: visible !important;
            display: block !important;
        }

        /* スクロールバーのスタイル */
        .o-tableOfContents::-webkit-scrollbar {
            width: 6px;
        }

        .o-tableOfContents::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 3px;
        }

        .o-tableOfContents::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 3px;
        }

        .o-tableOfContents::-webkit-scrollbar-thumb:hover {
            background: #555;
        }

        /* 自動生成された目次のスタイル */
        .generated-toc {
            font-size: 14px;
            line-height: 1.6;
        }

        .generated-toc-title {
            font-weight: bold;
            margin-bottom: 15px;
            font-size: 16px;
            color: #333;
        }

        .generated-toc ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .generated-toc li {
            margin-bottom: 8px;
        }

        .generated-toc a {
            color: #333;
            text-decoration: none;
            display: block;
            padding: 4px 0;
            transition: color 0.2s ease;
        }

        .generated-toc a:hover {
            color: #00a8cc;
        }

        /* h3の見出しをインデント */
        .generated-toc li.toc-h3 {
            margin-left: 20px;
        }

        .generated-toc li.toc-h3 a {
            font-size: 13px;
        }
    `);

    let generatedTocElement = null;

    // 見出しを収集する関数
    function collectHeadings() {
        // note.comの記事本文エリアのセレクタ（複数パターンに対応）
        const contentSelectors = [
            '.note-common-styles__textnote-body',
            '.p-article__content',
            'article',
            '[class*="article"]',
            '[class*="content"]'
        ];

        let headings = [];

        for (const selector of contentSelectors) {
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
            list.appendChild(li);
        });

        toc.appendChild(list);
        return toc;
    }

    // 目次を生成する関数
    function generateTOC() {
        // 既存の目次があるかチェック
        const existingTOC = document.querySelector('.o-tableOfContents:not(.generated-toc)');
        if (existingTOC) {
            console.log('既存の目次が見つかりました。');
            return;
        }

        // 既に生成した目次がある場合は削除
        if (generatedTocElement && generatedTocElement.parentNode) {
            generatedTocElement.remove();
        }

        // 見出しを収集
        const headings = collectHeadings();
        if (headings.length === 0) {
            console.log('見出しが見つかりませんでした。');
            return;
        }

        console.log(`${headings.length}個の見出しを発見しました。目次を生成します。`);

        // 目次を生成
        generatedTocElement = createTOCElement(headings);
        document.body.appendChild(generatedTocElement);
    }

    // 既存の目次要素を探して処理する関数
    function processTOC() {
        const toc = document.querySelector('.o-tableOfContents:not(.generated-toc)');
        if (toc) {
            console.log('既存の目次を発見しました。右側に固定表示します。');

            // 既存の親要素から切り離してbodyに直接追加（必要に応じて）
            if (toc.parentElement !== document.body) {
                document.body.appendChild(toc);
            }

            // 生成した目次があれば削除
            if (generatedTocElement && generatedTocElement.parentNode) {
                generatedTocElement.remove();
                generatedTocElement = null;
            }
        } else {
            // 既存の目次がない場合は生成を試みる
            generateTOC();
        }
    }

    // ページ読み込み完了時に実行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', processTOC);
    } else {
        // 少し遅延させて実行（動的コンテンツの読み込みを待つ）
        setTimeout(processTOC, 1000);
    }

    // MutationObserverで動的に追加される目次にも対応
    const observer = new MutationObserver((mutations) => {
        let shouldProcess = false;

        for (let mutation of mutations) {
            if (mutation.type === 'childList') {
                // 追加されたノードをチェック
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        // 既存の目次が追加された場合
                        if (node.classList && node.classList.contains('o-tableOfContents') && !node.classList.contains('generated-toc')) {
                            shouldProcess = true;
                        } else if (node.querySelector) {
                            const toc = node.querySelector('.o-tableOfContents:not(.generated-toc)');
                            if (toc) {
                                shouldProcess = true;
                            }
                        }

                        // 見出しが追加された場合
                        if (node.tagName === 'H2' || node.tagName === 'H3' ||
                            (node.querySelector && node.querySelector('h2, h3'))) {
                            shouldProcess = true;
                        }
                    }
                });
            }
        }

        if (shouldProcess) {
            // 少し遅延させて処理（連続した変更をまとめて処理）
            clearTimeout(observer.timeout);
            observer.timeout = setTimeout(processTOC, 500);
        }
    });

    // 監視を開始
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // 定期的にチェック（フォールバック）
    setInterval(processTOC, 3000);

})();
