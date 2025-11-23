# VADER感情分析ツール

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![VADER](https://img.shields.io/badge/VADER-Hutto%20%26%20Gilbert%202014-green)](https://github.com/cjhutto/vaderSentiment)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

[English](README.md) | **日本語**

---

## 概要

本ツールは、Hutto & Gilbert (2014) によって開発されたVADER (Valence Aware Dictionary and sEntiment Reasoner) アルゴリズムを忠実に実装した、ブラウザベースの感情分析ツールです。ソーシャルメディアテキストの感情分析に特化した辞書・ルールベースの手法を採用し、否定語処理、強調語、文脈依存的な重み付けなど、VADERのすべての主要機能を実装しています。研究者および教育者が感情分析の手法を理解し、実践的に応用するためのツールとして開発されました。

## 主な特徴

- **🌐 ブラウザベース** - インストール不要、サーバー不要、ブラウザで完結
- **📱 オフライン動作** - レキシコンファイル読み込み後はインターネット接続不要
- **🎯 ルールベース・透明性** - すべての判断が解釈可能、機械学習のブラックボックスなし
- **😊 絵文字対応** - 絵文字を説明文に変換して感情分析（オプション）
- **📊 詳細な可視化** - 各単語のスコア調整プロセスを表示
- **📄 文単位分析** - VADER論文推奨の文ごとの分析に対応
- **🔍 レキシコン探索** - 約7,500語の感情語彙を統計付きで検索
- **📈 統計分析** - 分布グラフ、上位ポジティブ/ネガティブ語、標準偏差分析

## クイックスタート

### 1. 必要なファイルのダウンロード

**必須:** VADERレキシコン（約7,500語の感情語彙）
```
https://github.com/cjhutto/vaderSentiment/blob/master/vaderSentiment/vader_lexicon.txt
```

**オプション:** 絵文字レキシコン（約3,000個の絵文字マッピング）
```
https://github.com/cjhutto/vaderSentiment/blob/master/vaderSentiment/emoji_utf8_lexicon.txt
```

💡 **ヒント:** GitHubで「Raw」ボタンをクリック後、右クリックで「名前を付けて保存」

### 2. ツールの実行

1. `vader_sentiment_analyzer.html` をブラウザで開く
2. レキシコンファイルをアップロード
3. テキストを入力して「分析する」をクリック

### 3. 分析モードの選択

- **通常モード** - テキスト全体を1つとして分析
- **文分割モード** ☑️ - 文ごとに分割して分析（VADER論文推奨）

## VADERアルゴリズムについて

### 理論的背景

VADERは、ソーシャルメディアテキストの感情分析に特化した辞書・ルールベースの感情分析ツールです。従来の感情分析手法の3つの主要な欠点に対処するために設計されました：

1. **カバレッジ** - 従来のレキシコンはソーシャルメディア特有の表現（スラング、顔文字、略語）を無視することが多い
2. **強度認識** - 多くの手法が感情の強度の違いを無視
3. **効率性** - 機械学習手法は大量の学習データが必要で計算コストが高い

### 主要な特性

- **ソーシャルメディア特化** - インフォーマルな表現、スラング、非標準的な表記に対応
- **ルールベースアプローチ** - 機械学習を使用せず完全に解釈可能
- **実証的妥当性** - 人間評価者との高い相関（元論文でPearson's r = 0.88）
- **性能** - Twitterデータで F1 スコア 0.96（元論文報告値）

### スコアの解釈

**Compound Scoreの範囲:** -1.0～+1.0（正規化済み）

Compound Scoreは以下の式で正規化されます：
```
compound = Σ(valence_i) / √(Σ(valence_i²) + α)
```
ここで α = 15（正規化パラメータ）

この正規化により：
- スコアが[-1.0, +1.0]の範囲に収まる
- 異なる長さのテキストでも公平に比較可能
- 極端な値が適切に抑制される

**分類閾値**（元論文に基づく）：

| Compound Score | 分類 | 説明 |
|----------------|------|------|
| score ≥ 0.05 | ポジティブ | 肯定的な感情を含むテキスト |
| -0.05 < score < 0.05 | 中立 | 感情的に中立的なテキスト |
| score ≤ -0.05 | ネガティブ | 否定的な感情を含むテキスト |

**注意:** これらの閾値は一般的なソーシャルメディアテキストに対して最適化されています。ドメインや研究目的に応じて、閾値の調整が必要となる場合があります。

**重要な注意: VADER論文との違い**

VADER論文では正規化の式を以下のように記述しています：
```
compound = Σ(valence_i) / √(Σ(valence_i²) + α)
```

しかし、**公式Python実装**では以下の式を使用しています：
```
compound = sum / √(sum² + α)
```

本ツールは既存のVADERユーザーとの互換性のため、公式Python実装に準拠しています。

## アルゴリズムの詳細

### 計算手順

VADERは以下の手順で感情スコアを計算します：

1. **トークン化とレキシコンマッチング**
   - 入力テキストをトークンに分割
   - 各トークンをVADERレキシコンと照合し、基本感情スコアを取得

2. **文法的・語用論的ルールの適用**

   | ルール | 効果 | 例 |
   |--------|------|-----|
   | **否定** | 極性反転（×-0.74） | "not good" → +1.9 → -1.41 |
   | **強調語** | スコア増減（±0.293） | "very good" → +1.9 → +2.19 |
   | **大文字** | 強調（±0.733） | "GOOD" → +1.9 → +2.63 |
   | **感嘆符** | 強調（±0.292/個、最大4個） | "good!" → +1.9 → +2.19 |
   | **"but"節** | 前×0.5、後×1.5 | "good but bad" → 両方調整 |

3. **正規化とCompound Scoreの計算**

   ```
   compound = Σ(valence_i) / √(Σ(valence_i²) + α)
   ```

   ここで α = 15（正規化パラメータ）

   この正規化により：
   - スコアは概ね[-1.0, +1.0]の範囲に収まる
   - 単語数が異なるテキストも公平に比較可能
   - 極端な値を抑制

### 実装の忠実性

本ツールは元のVADER実装を忠実に再現：

- ✅ オリジナルのVADERレキシコンを使用したレキシコンベーススコアリング
- ✅ 否定処理（前方3トークンをチェック）
- ✅ 強調語（距離による減衰: 1→0.95, 2→0.90, 3→0.90）
- ✅ 大文字強調（ALL CAPS判定）
- ✅ 感嘆符（最大4個まで）
- ✅ "but"による文脈調整
- ✅ 正規化（α=15）
- ✅ 絵文字対応（テキスト変換経由、オプション）
- ✅ 文分割（略語保護：Mr., Dr. など）
- ✅ 全トークン処理 - 正確なCompound Score計算のため内部で全トークンを処理（Python VADER互換）

## 使用例

### 基本的な分析
```
入力: "I love this product, it's amazing!"
結果: 強いポジティブ (0.8313)
  - love: +3.2
  - amazing: +2.9
```

### 否定の処理
```
入力: "This is not very good"
結果: 弱いネガティブ (-0.3612)
  - not: 否定語
  - very: 強調語
  - good: +1.9 → -1.62 (否定効果 ×-0.74)
```

### "but"による文脈変化
```
入力: "The book offers fascinating ideas but sadly fails"
結果: 弱いネガティブ (-0.3804)
  - fascinating: +3.0 → +1.5 ("but"前 ×0.5)
  - sadly: -1.5 → -2.25 ("but"後 ×1.5)
  - fails: -2.0 → -3.0 ("but"後 ×1.5)
```

### 文単位分析
```
入力: "I love this! It's amazing! Quality is excellent!"
結果: 3文を個別に分析
  - 文1: 強いポジティブ (0.6369)
  - 文2: 強いポジティブ (0.5994)
  - 文3: 強いポジティブ (0.6588)
  平均: 0.6317
```

## 検証と信頼性

### 元論文での検証結果

Hutto & Gilbert (2014) は以下のデータセットでVADERの性能を検証：

| データセット | F1 Score | 精度 | 相関係数 |
|------------|----------|------|---------|
| Twitter | 0.96 | 96% | r = 0.881 |
| Movie Reviews | 0.94 | 94% | r = 0.850 |
| Product Reviews | 0.92 | 92% | r = 0.870 |

### 本実装の妥当性

本ツールは元のVADER実装（Python版）の動作を忠実に再現することを目指しています：

1. **主要なアルゴリズム** - 文法的・語用論的ルール、スコア計算式、正規化パラメータ、否定語の適用範囲を実装
2. **レキシコンの使用** - オリジナルのVADERレキシコンを使用、標準偏差データも保持
3. **動作確認** - 基本的な例文による動作確認、主要機能の検証

### 制限事項

研究者は以下の制限事項を認識した上で本ツールを使用する必要があります：

1. **言語制限** - 英語テキスト専用に設計
2. **ドメイン依存性** - ソーシャルメディアテキストに最適化、フォーマルな文章では精度が低下する可能性
3. **文脈理解の限界** - 皮肉や反語の検出能力には限界
4. **時間的変化** - レキシコンは2014年時点の評価に基づく、新しいスラングには対応していない可能性

## ブラウザ互換性

- ✅ Chrome / Edge 90+（推奨）
- ✅ Firefox 88+
- ✅ Safari 14+
- ⚠️ Internet Explorer（非対応）

## セキュリティ機能

本ツールは、ブラウザ環境での安全な動作を保証するため、複数のセキュリティ対策を実装しています：

### XSS（クロスサイトスクリプティング）保護

- **安全なDOM構築** - すべての動的コンテンツは`innerHTML`の代わりに`textContent`と`createElement`を使用
- **HTMLインジェクション防止** - ユーザー入力とレキシコンデータは自動的にエスケープ
- **検証済みレンダリング** - 8か所のレンダリング箇所すべてでXSS安全な手法を使用

### 入力検証

- **ファイルサイズ制限** - DoS攻撃防止のため、ファイルあたり最大10MB
- **拡張子チェック** - `.txt`ファイルのみ受け付け
- **コンテンツ検証** - レキシコン形式の検証

### コンテンツセキュリティポリシー（CSP）

ツールはCSPヘッダーを使用して、スクリプト実行、スタイル、ネットワーク接続、フレーム埋め込みを制限しています。

## 学術利用ガイド

### 論文での記述例

#### 方法論セクション

**日本語:**

> 感情分析には、Hutto & Gilbert (2014) が開発したVADER (Valence Aware Dictionary and sEntiment Reasoner) を用いた。VADERは、約7,500語の感情語彙と文法的・語用論的ルールに基づく辞書ベースの手法であり、ソーシャルメディアテキストの感情分析に特化している。分析には、Sawada (2025) が開発したブラウザベースの実装ツールを使用した。Compound Scoreが+0.05以上をポジティブ、-0.05以下をネガティブ、その間を中立と分類した。

#### 結果セクション

**日本語:**

> VADER分析の結果、収集した1,000件のツイートのうち、62.3%がポジティブ（Compound Score ≥ 0.05）、18.7%がネガティブ（Compound Score ≤ -0.05）、19.0%が中立（-0.05 < Compound Score < 0.05）と分類された。平均Compound Scoreは+0.42（SD = 0.31）であった。

### 推奨される研究デザイン

1. **ソーシャルメディア分析** - Twitter、Facebook、Redditなどの短文テキスト
2. **時系列分析** - イベント前後の感情変化の追跡
3. **比較分析** - 複数グループ間やトピック別の感情比較
4. **妥当性検証** - データの一部を人間評価者で検証することを推奨

### 倫理的配慮

研究者は以下の倫理的配慮を行う必要があります：

1. **データの取得と使用** - 適切な同意手続き、プライバシー保護、プラットフォームの利用規約遵守
2. **結果の解釈** - アルゴリズムの限界を明示、過度な一般化を避ける、文脈の重要性を考慮
3. **透明性** - 使用したツールとバージョンの明記、分析パラメータの詳細な記載、再現可能性の確保

## 引用

### 必須（VADER元論文）

本ツールを使用する場合、以下の論文を引用してください：

```bibtex
@inproceedings{hutto2014vader,
  title={VADER: A parsimonious rule-based model for sentiment analysis of social media text},
  author={Hutto, C.J. and Gilbert, E.E.},
  booktitle={Eighth International Conference on Weblogs and Social Media (ICWSM-14)},
  year={2014},
  address={Ann Arbor, MI}
}
```

### 推奨（本ツール）

```bibtex
@software{sawada2025vader,
  author = {Sawada, Nozomi},
  title = {VADER-based Sentiment Analysis Tool},
  year = {2025},
  url = {https://github.com/nozomi-sawada/vader-sentiment-analyzer}
}
```

## ドキュメント

詳細なドキュメントは `docs/` フォルダにあります：

- **[ALGORITHM.ja.md](docs/ALGORITHM.ja.md)** - アルゴリズムの詳細実装
- **[LEXICON.ja.md](docs/LEXICON.ja.md)** - レキシコンの構造とアノテーション方法論
- **[CITATION.ja.md](docs/CITATION.ja.md)** - 学術利用のための詳細な引用ガイド

## ライセンス

本ツールはMITライセンスの下で公開されています。

**重要:** VADERレキシコンファイル自体は[元のリポジトリ](https://github.com/cjhutto/vaderSentiment)で配布されています。本ツールはレキシコンファイルを含みません。ユーザーは元のリポジトリからレキシコンファイルをダウンロードする必要があります。

## 謝辞

本ツールは以下の研究に基づいています：

> Hutto, C.J. & Gilbert, E.E. (2014). VADER: A Parsimonious Rule-based Model for Sentiment Analysis of Social Media Text. Eighth International Conference on Weblogs and Social Media (ICWSM-14). Ann Arbor, MI, June 2014.

VADERの開発者であるC.J. Hutto氏とEric Gilbert氏に感謝いたします。

---

**研究・教育目的で開発**

© 2025 Nozomi Sawada
