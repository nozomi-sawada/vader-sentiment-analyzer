# 引用ガイド

[English](CITATION.md) | **日本語**

本ドキュメントは、学術研究で本ツールを使用する際の引用方法を説明します。

---

## 目次

1. [引用の原則](#1-引用の原則-1)
2. [必須引用：VADER元論文](#2-必須引用vader元論文)
3. [推奨引用：本ツール](#3-推奨引用本ツール)
4. [論文での記述例](#4-論文での記述例)
5. [Methodsセクションの記述例](#5-methodsセクションの記述例)
6. [引用形式別](#6-引用形式別)
7. [FAQ](#7-faq-1)

---

## 1. 引用の原則

### 基本ルール

本ツールを学術研究で使用する場合：

✅ **必須**: VADER元論文（Hutto & Gilbert, 2014）を引用  
✅ **推奨**: 本ツール（Sawada, 2025）を引用  
✅ **重要**: 本ツールはVADERアルゴリズムの実装であることを明記  
✅ **推奨**: 分析単位（文単位/文書単位）を明記

### なぜ両方引用するのか？

- **VADER論文** → アルゴリズムの開発者への敬意
- **本ツール** → 使用した具体的な実装の透明性
- **分析単位** → 再現性のための重要な情報

---

## 2. 必須引用：VADER元論文

### BibTeX形式

```bibtex
@inproceedings{hutto2014vader,
  title={VADER: A parsimonious rule-based model for sentiment analysis of social media text},
  author={Hutto, C.J. and Gilbert, E.E.},
  booktitle={Eighth International Conference on Weblogs and Social Media (ICWSM-14)},
  year={2014},
  month={June},
  address={Ann Arbor, MI}
}
```

### テキスト形式

Hutto, C.J., & Gilbert, E.E. (2014). VADER: A Parsimonious Rule-based Model for Sentiment Analysis of Social Media Text. In *Proceedings of the Eighth International Conference on Weblogs and Social Media (ICWSM-14)*. Ann Arbor, MI, June 2014.

---

## 3. 推奨引用：本ツール

### BibTeX形式

```bibtex
@software{sawada2025vader,
  author = {Sawada, Nozomi},
  title = {VADER-based Sentiment Analysis Tool},
  year = {2025},
  url = {https://github.com/nozomi-sawada/vader-sentiment-analyzer},
  note = {Web-based implementation of VADER sentiment analysis with sentence-level analysis support}
}
```

### テキスト形式

Sawada, N. (2025). *VADER-based Sentiment Analysis Tool* [Web application]. GitHub. https://github.com/nozomi-sawada/vader-sentiment-analyzer

---

## 4. 論文での記述例

### パターン1：文単位分析を使用（推奨）

```
感情分析には、VADER (Valence Aware Dictionary and sEntiment Reasoner; 
Hutto & Gilbert, 2014) アルゴリズムを実装したWebベースツール（Sawada, 2025）
を使用した。VADERは、約7,500語の感情語彙と5つの文法ルール（否定、強調語、
大文字、感嘆符、"but"による文脈調整）を組み合わせて感情スコアを算出する。
VADER論文の推奨に従い、テキストを文単位に分割して各文を個別に分析した。
分析には vader_lexicon.txt (v.2014) を使用した。
```

### パターン2：文書単位分析を使用

```
テキストの感情分析にはVADER（Hutto & Gilbert, 2014）の実装ツール
（Sawada, 2025）を使用した。各テキストは全体を1つの単位として分析した。
```

### パターン3：絵文字処理を使用

```
感情分析には、Sawada (2025) が開発したVADER準拠感情分析ツールを使用した。
このツールは、元のVADERアルゴリズム（Hutto & Gilbert, 2014）の動作を
再現するブラウザベースの実装である。絵文字を含むテキストの処理には、
emoji_utf8_lexicon.txt（約3,000種類の絵文字マッピング）を使用し、
絵文字を説明文に変換してから感情分析を行った。
```

---

## 5. Methodsセクションの記述例

### 例1：基本的な文単位分析

```
3.2 感情分析

収集したテキストデータの感情分析には、VADER (Hutto & Gilbert, 2014) を
実装したWebベースツール（Sawada, 2025）を使用した。VADERは辞書ベースの
感情分析手法であり、約7,500語の感情語彙（vader_lexicon.txt, v.2014）と
文法ルール（否定、強調、大文字表記、感嘆符、対照接続詞の処理）を組み合わせて
感情スコアを算出する。

VADER論文（Hutto & Gilbert, 2014）の推奨に従い、各テキストを文単位に分割し、
文ごとに感情スコアを算出した。文分割には正規表現を使用し、Mr., Dr.などの
一般的な略語で誤分割されないよう処理した。各文について、Compound Score
（-1から+1の範囲で正規化された総合感情スコア）、およびPositive、Neutral、
Negativeの割合を算出した。

分析の閾値として、Compound Score ≥ 0.05をポジティブ、≤ -0.05をネガティブ、
それ以外を中立と分類した（Hutto & Gilbert, 2014の推奨に基づく）。
```

### 例2：集計分析を含む場合

```
各テキストについて、文単位のCompound Scoreの平均値を算出し、テキスト全体の
感情傾向を評価した。また、各テキストに含まれるポジティブ文の割合、
ネガティブ文の割合を算出し、テキストの感情構成を分析した。
```

### 例3：前処理を含む場合

```
3.1 データ前処理

収集したテキストデータに対して、以下の前処理を実施した：
1) URL、メールアドレスの削除
2) 連続する空白文字の正規化
3) 絵文字の保持（感情分析に使用するため）

前処理後のテキストを文単位に分割し、VADERによる感情分析を実施した。
```

### 例4：複数言語コーパスでの使用

```
本研究では英語テキストのみをVADER分析の対象とした。データセットに含まれる
非英語テキストは事前に除外した。言語判定には langdetect ライブラリ（v.1.0.9）
を使用し、信頼度0.9以上のものを英語と判定した。
```

---

## 6. 引用形式別

### APA Style (7th Edition)

**VADER論文**:
```
Hutto, C. J., & Gilbert, E. E. (2014, June). VADER: A parsimonious rule-based 
model for sentiment analysis of social media text. In Proceedings of the Eighth 
International Conference on Weblogs and Social Media (ICWSM-14). Ann Arbor, MI.
```

**本ツール**:
```
Sawada, N. (2025). VADER-based sentiment analysis tool (Version 1.0) [Computer software]. 
GitHub. https://github.com/nozomi-sawada/vader-sentiment-analyzer
```

### IEEE Style

**VADER論文**:
```
[1] C. J. Hutto and E. E. Gilbert, "VADER: A parsimonious rule-based model for 
    sentiment analysis of social media text," in Proc. 8th Int. AAAI Conf. Weblogs 
    Social Media (ICWSM), Ann Arbor, MI, USA, Jun. 2014.
```

**本ツール**:
```
[2] N. Sawada. (2025). VADER-based Sentiment Analysis Tool [Online]. 
    Available: https://github.com/nozomi-sawada/vader-sentiment-analyzer
```

### Chicago Style (Author-Date)

**VADER論文**:
```
Hutto, C. J., and E. E. Gilbert. 2014. "VADER: A Parsimonious Rule-based Model 
for Sentiment Analysis of Social Media Text." Paper presented at the Eighth 
International Conference on Weblogs and Social Media (ICWSM-14), Ann Arbor, MI, 
June 2014.
```

**本ツール**:
```
Sawada, Nozomi. 2025. "VADER-based Sentiment Analysis Tool." Version 1.0. GitHub. 
https://github.com/nozomi-sawada/vader-sentiment-analyzer.
```

### MLA Style (9th Edition)

**VADER論文**:
```
Hutto, C.J., and E.E. Gilbert. "VADER: A Parsimonious Rule-based Model for 
Sentiment Analysis of Social Media Text." Proceedings of the Eighth International 
Conference on Weblogs and Social Media (ICWSM-14), 2014, Ann Arbor, MI.
```

**本ツール**:
```
Sawada, Nozomi. VADER-based Sentiment Analysis Tool. Version 1.0, GitHub, 2025, 
github.com/nozomi-sawada/vader-sentiment-analyzer.
```

### Harvard Style

**VADER論文**:
```
Hutto, C.J. and Gilbert, E.E. (2014) 'VADER: A parsimonious rule-based model 
for sentiment analysis of social media text', in Proceedings of the Eighth 
International Conference on Weblogs and Social Media (ICWSM-14). Ann Arbor, MI.
```

**本ツール**:
```
Sawada, N. (2025) VADER-based Sentiment Analysis Tool. Version 1.0. Available at: 
https://github.com/nozomi-sawada/vader-sentiment-analyzer (Accessed: [date]).
```

---

## 7. FAQ

### Q1: VADER論文だけ引用すれば良いですか？

A: いいえ、両方引用することを推奨します。VADER論文はアルゴリズムの引用、本ツールは使用した実装の引用です。研究の再現性のため、使用したツールを明記することが重要です。

### Q2: 文単位分析と文書単位分析、どちらを使うべきですか？

A: VADER論文では**文単位分析を推奨**しています。論文にも以下の記述があります：

> "VADER performs sentence-level sentiment analysis"
> "decomposing paragraphs, articles into sentence-level analyses"

評価データセットも全て文単位です。ただし、研究目的によっては文書単位も適切な場合があります。

### Q3: 本文中でどのように言及すればよいですか？

A: 以下のいずれかの形式を推奨します：

**文単位分析の場合：**
- 「VADER (Hutto & Gilbert, 2014) の実装 (Sawada, 2025) を使用し、文単位で分析した」
- 「Sawada (2025) によるVADER実装を使用し、論文推奨の文単位分析を実施」

**文書単位分析の場合：**
- 「VADER (Hutto & Gilbert, 2014; 実装: Sawada, 2025) を使用し、テキスト全体を分析」

### Q4: レキシコンファイルの出典も書くべきですか？

A: はい、Methodsセクションに以下のように記述することを推奨します：

```
感情語彙には vader_lexicon.txt (Hutto & Gilbert, 2014) を使用した。
このレキシコンは約7,500語の感情語を含み、各語には-4から+4の範囲で
感情極性スコアが付与されている。各スコアは人間評価者による評定の
平均値であり、標準偏差も併記されている。
```

### Q5: GitHubリポジトリのバージョンを指定すべきですか？

A: はい、再現性のため、以下のいずれかを推奨します：

1. **バージョン番号**（リリースされている場合）
   ```
   Sawada (2025, version 1.0)
   ```

2. **アクセス日時**
   ```
   Sawada (2025, accessed January 15, 2025)
   ```

3. **コミットハッシュ**（技術的な論文の場合）
   ```
   Sawada (2025, commit a1b2c3d)
   ```

### Q6: 絵文字レキシコンを使用した場合は？

A: 絵文字レキシコンも元のVADERリポジトリに含まれるため、同じ引用で十分です。ただし、Methodsセクションで使用を明記してください：

```
絵文字を含むテキストの処理には emoji_utf8_lexicon.txt (Hutto & Gilbert, 2014) 
を使用した。このレキシコンは約3,000種類の絵文字を説明文にマッピングしており、
各説明文をVADERレキシコンで分析することで絵文字の感情スコアを算出した。
```

### Q7: 文分割で使用される略語保護について記述すべきですか？

A: 技術的詳細が重要な論文では記述することを推奨します：

```
文分割には正規表現を使用し、一般的な略語（Mr., Mrs., Dr., Prof.など）
およびイニシャル（例：M. T. John）で誤って分割されないよう処理した。
```

### Q8: 分析結果の統計処理について記述すべきですか？

A: はい、特に文単位分析を使用した場合、集計方法を明記してください：

```
各テキストについて、文単位のCompound Scoreの平均値を算出し、
テキスト全体の感情傾向として報告した。また、各テキストに含まれる
ポジティブ文（Compound Score ≥ 0.05）とネガティブ文（≤ -0.05）の
割合を算出した。
```

---

## 補足：再現性のための情報チェックリスト

論文のMethodsセクションには、以下の情報を含めることを推奨します：

### 必須項目

- [ ] 使用したVADER実装（本ツール）
- [ ] VADERレキシコンファイルとバージョン
- [ ] 分析単位（文単位 or 文書単位）
- [ ] スコアの分類閾値

### 推奨項目

- [ ] ツールのバージョンまたはアクセス日
- [ ] 絵文字レキシコンの使用有無
- [ ] 文分割の方法（文単位分析の場合）
- [ ] テキストの前処理内容
- [ ] 集計方法（文単位分析で複数文がある場合）

### オプション項目（技術的な論文の場合）

- [ ] 略語保護の詳細
- [ ] 使用したブラウザ環境
- [ ] GitHubコミットハッシュ
- [ ] カスタマイズした設定

---

## 記述例テンプレート

### テンプレート1：最小限の記述

```
感情分析にはVADER (Hutto & Gilbert, 2014) の実装 (Sawada, 2025) を使用し、
[文単位/文書単位]で分析した。vader_lexicon.txt (v.2014) を使用し、
Compound Score ≥ 0.05をポジティブ、≤ -0.05をネガティブと分類した。
```

### テンプレート2：詳細な記述

```
感情分析にはVADER (Valence Aware Dictionary and sEntiment Reasoner; 
Hutto & Gilbert, 2014) アルゴリズムを実装したWebベースツール（Sawada, 2025）
を使用した。VADERは約7,500語の感情語彙（vader_lexicon.txt, v.2014）と
5つの文法ルール（否定、強調語、大文字表記、感嘆符、"but"による文脈調整）を
組み合わせて感情スコアを算出する。

[文単位分析の場合：]
VADER論文の推奨に従い、各テキストを文単位に分割し、文ごとに
Compound Score（-1から+1）、Positive、Neutral、Negativeの割合を算出した。
分類閾値は Compound Score ≥ 0.05をポジティブ、≤ -0.05をネガティブとした。
各テキストの総合評価として、文単位スコアの平均値を使用した。

[文書単位分析の場合：]
各テキストを全体として分析し、Compound Score（-1から+1）、
Positive、Neutral、Negativeの割合を算出した。分類閾値は
Compound Score ≥ 0.05をポジティブ、≤ -0.05をネガティブとした。
```

---

## 連絡先

引用に関する質問は、以下までお問い合わせください：

- **GitHub Issues**: https://github.com/nozomi-sawada/vader-sentiment-analyzer/issues