# note.com 目次固定表示スクリプト

note.comの記事ページで目次を右側に常に表示するTampermonkeyスクリプトです。

## 機能

- 記事の目次（`.o-tableOfContents`）を画面右側に固定表示
- スクロールしても常に同じ位置に表示
- 動的に読み込まれる目次にも対応

## インストール方法

1. [Tampermonkey](https://www.tampermonkey.net/)をブラウザにインストール
2. 以下のリンクをクリック：
   - [📥 スクリプトをインストール](https://raw.githubusercontent.com/[ユーザー名]/[リポジトリ名]/main/note-toc-fixed.user.js)
3. Tampermonkeyのインストール画面で「インストール」をクリック

## 使い方

インストール後、note.comの記事ページにアクセスすると自動的に動作します。

## カスタマイズ

スクリプト内のCSS部分を編集することで、表示位置やスタイルを変更できます：

```javascript
GM_addStyle(`
    .o-tableOfContents {
        right: 20px !important;    // 右端からの距離
        top: 100px !important;     // 上端からの距離
        max-width: 300px !important; // 最大幅
        // ... その他のスタイル
    }
`);
```

## 動作環境

- Chrome + Tampermonkey
- Firefox + Tampermonkey
- Edge + Tampermonkey

## ライセンス

MIT License

## 作者

[あなたの名前]

## 更新履歴

- v1.0 (2024-XX-XX): 初版リリース
