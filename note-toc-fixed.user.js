// ==UserScript==
// @name         note.com 目次を右側に固定表示
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  note.comの記事で目次(o-tableOfContents)を右側に常に表示する
// @author       You
// @match        https://note.com/*
// @grant        GM_addStyle
// @updateURL    https://raw.githubusercontent.com/[ユーザー名]/[リポジトリ名]/main/note-toc-fixed.user.js
// @downloadURL  https://raw.githubusercontent.com/[ユーザー名]/[リポジトリ名]/main/note-toc-fixed.user.js
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
    `);

    // 目次要素を探して処理する関数
    function processTOC() {
        const toc = document.querySelector('.o-tableOfContents');
        if (toc) {
            console.log('目次を発見しました。右側に固定表示します。');

            // 既存の親要素から切り離してbodyに直接追加（必要に応じて）
            if (toc.parentElement !== document.body) {
                document.body.appendChild(toc);
            }
        }
    }

    // ページ読み込み完了時に実行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', processTOC);
    } else {
        processTOC();
    }

    // MutationObserverで動的に追加される目次にも対応
    const observer = new MutationObserver((mutations) => {
        for (let mutation of mutations) {
            if (mutation.type === 'childList') {
                // 追加されたノードをチェック
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        if (node.classList && node.classList.contains('o-tableOfContents')) {
                            processTOC();
                        } else if (node.querySelector) {
                            const toc = node.querySelector('.o-tableOfContents');
                            if (toc) {
                                processTOC();
                            }
                        }
                    }
                });
            }
        }
    });

    // 監視を開始
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // 定期的にチェック（フォールバック）
    setInterval(processTOC, 2000);

})();
