# VADER Algorithm Details

**English** | [日本語](#日本語版)

This document explains the implementation details and mathematical definitions of the VADER algorithm.

---

## Table of Contents

1. [Algorithm Overview](#1-algorithm-overview)
2. [Analysis Unit: Sentence-Level vs Document-Level](#2-analysis-unit-sentence-level-vs-document-level)
3. [Lexicon-Based Scoring](#3-lexicon-based-scoring)
4. [Grammatical Adjustments](#4-grammatical-adjustments)
5. [Score Normalization](#5-score-normalization)
6. [Implementation Details](#6-implementation-details)

---

## 1. Algorithm Overview

VADER calculates sentiment scores through the following steps:

```
Input Text
    ↓
[0] Sentence Splitting (Optional)
    ↓
[1] Tokenization & Lexicon Score Retrieval
    ↓
[2] Grammatical Score Adjustments
    ↓
[3] Normalization & Compound Score Calculation
    ↓
Output: {compound, pos, neg, neu}
```

---

## 2. Analysis Unit: Sentence-Level vs Document-Level

### 2.1 VADER Paper Recommendation

The VADER paper (Hutto & Gilbert, 2014) **recommends sentence-level analysis**:

> "VADER performs **sentence-level sentiment analysis**"
> 
> "decomposing paragraphs, articles/reports/publications, or novels into **sentence-level analyses**"

### 2.2 Why Sentence-Level?

#### Reason 1: Context-Dependent Sentiment

Example where sentiment changes by sentence:

```
Document: "I love the design. But the quality is terrible."

Document-level analysis:
  → Compound: +0.12 (overall slightly positive?)

Sentence-level analysis:
  S1: "I love the design." → +0.6369 (clearly positive)
  S2: "But the quality is terrible." → -0.5267 (clearly negative)
```

#### Reason 2: Paper Evaluation Data

All VADER paper evaluations use sentence-level units:

| Dataset | Sample Count | Unit |
|---------|-------------|------|
| Movie reviews | 10,605 | sentence-level snippets |
| Product reviews | 3,708 | sentence-level snippets |
| News articles | 5,190 | sentence-level snippets |

#### Reason 3: Grammar Rules Scope

VADER's grammar rules (negation, "but", etc.) function within sentences:

```
"The product is good. But I don't like it."

Sentence-level:
  S1: "good" → positive (no "but" effect)
  S2: "like" → negated (affected by "don't")

Document-level:
  "good" → attenuated by "but" (applied across sentences)
  "like" → negated
  → Grammar rules applied in unintended ways
```

### 2.3 Sentence Splitting Algorithm

#### Basic Splitting Pattern

```javascript
function splitIntoSentences(text) {
    // Split by periods, exclamation marks, question marks
    return text.split(/([.!?]+\s+)/);
}
```

#### Abbreviation Protection Implementation

Prevents erroneous splits at common abbreviations:

```javascript
function splitIntoSentences(text) {
    // Step 1: Protect abbreviation periods
    const protectedText = text
        .replace(/\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr)\./gi, '$1<PERIOD>')
        .replace(/\b([A-Z])\./g, '$1<PERIOD>'); // Initials
    
    // Step 2: Split sentences
    const sentences = protectedText
        .split(/([.!?]+\s+)/)
        .reduce((acc, part, i, arr) => {
            if (i % 2 === 0) {
                const sentence = (part + (arr[i + 1] || '')).trim();
                if (sentence.length > 0) {
                    acc.push(sentence.replace(/<PERIOD>/g, '.'));
                }
            }
            return acc;
        }, []);
    
    return sentences;
}
```

**Protected Abbreviations List:**

| Category | Examples |
|----------|----------|
| Titles | Mr., Mrs., Ms., Dr., Prof. |
| Suffixes | Sr., Jr. |
| Others | vs., etc., Inc., Ltd., Corp., Co. |
| Initials | M., T., J., H., etc. |

#### Sentence Splitting Example

```
Input: 
"Mr. M. T. John and J. H. Samuel presented their papers."

Incorrect split (without protection):
  S1: "Mr."
  S2: "M."
  S3: "T."
  ...

Correct split (with protection):
  S1: "Mr. M. T. John and J. H. Samuel presented their papers."
```

### 2.4 Aggregation Methods

For multiple sentences in sentence-level analysis:

#### Method 1: Mean

```javascript
const avgCompound = sentences.reduce((sum, s) => sum + s.compound, 0) / sentences.length;
```

**Use case**: When you want overall sentiment tendency

#### Method 2: Category Count

```javascript
const posCount = sentences.filter(s => s.compound >= 0.05).length;
const negCount = sentences.filter(s => s.compound <= -0.05).length;
const neuCount = sentences.length - posCount - negCount;
```

**Use case**: When analyzing sentiment composition

#### Method 3: Weighted Average

```javascript
// Weight by sentence length
const weighted = sentences.reduce((sum, s) => {
    const weight = s.sentiments.length;
    return sum + (s.compound * weight);
}, 0) / totalTokens;
```

**Use case**: When emphasizing longer sentences

---

## 3. Lexicon-Based Scoring

### 3.1 Lexicon Structure

Each word has the following information:

```
Word    Mean Score  Std Dev    Human Ratings
good    1.9         0.94       [2,2,2,1,2,...]
bad     -1.5        0.75       [-2,-1,-2,-2,...]
```

**Score Range**: -4 (extremely negative) to +4 (extremely positive)

**Standard Deviation Meaning**:
- Low (< 1.0): High agreement among raters
- High (> 2.0): Divided opinions (context-dependent)

### 3.2 Base Score Retrieval

For each token:

```
V₀(wᵢ) = lexicon[wᵢ]
```

Where:
- `wᵢ` is token i
- `V₀(wᵢ)` is the base score retrieved from lexicon

---

## 4. Grammatical Adjustments

### 4.1 Negation

**Rule**: For each sentiment word, if a negation word appears in the **preceding 3 tokens**, invert the score

```javascript
// Negation word examples
NEGATION_WORDS = {
  "not", "no", "never", "don't", "doesn't", 
  "didn't", "can't", "won't", "couldn't",
  "isn't", "wasn't", "weren't", ...
}
```

**Application Method**:

```
for each token i with V₀(wᵢ) ≠ 0:
    for j from max(0, i-3) to i-1:
        if tokens[j] in NEGATION_WORDS:
            if j == i-3 and tokens[i-1] not in ["or", "nor"]:
                continue  // Special rule
            V₁(wᵢ) = V₀(wᵢ) × N_SCALAR
            break
```

**Parameter**:
- `N_SCALAR = -0.74`

**Why -0.74?**

Experiments in the paper found that a somewhat weaker inversion is more appropriate for social media text than simple reversal (×-1.0).

**Example**:

```
"This is not very good or nice"
Position: 0   1   2    3    4    5  6

"good" (position 4):
  Preceding 3 tokens: positions 1,2,3 ("is", "not", "very")
  → "not" at position 2 → apply negation
  → V₁ = 1.9 × -0.74 = -1.406

"nice" (position 6):
  Preceding 3 tokens: positions 3,4,5 ("very", "good", "or")
  → No negation word → no negation applied
  → V₁ = 1.8 (unchanged)
```

### 4.2 Boosters (Intensifiers)

**Rule**: Booster words in preceding 3 tokens increase/decrease score (with distance decay)

```javascript
BOOSTER_DICT = {
  // Positive boosters
  "very": +0.293,
  "extremely": +0.293,
  "incredibly": +0.293,
  "absolutely": +0.293,
  
  // Negative boosters (dampeners)
  "somewhat": -0.293,
  "barely": -0.293,
  "hardly": -0.293,
  "slightly": -0.293,
  ...
}
```

**Application Method**:

```
for startI from 0 to 2:
    if i > startI:
        prevToken = tokens[i - (startI + 1)]
        if prevToken not in LEXICON and prevToken in BOOSTER_DICT:
            scalar = BOOSTER_DICT[prevToken]
            if V(wᵢ) < 0:
                scalar *= -1  // Invert for negative words
            
            // Distance decay
            if startI == 1:
                scalar *= 0.95  // Distance 2: 5% decay
            if startI == 2:
                scalar *= 0.90  // Distance 3: 10% decay
            
            V₂(wᵢ) = V₁(wᵢ) + scalar
```

**Theoretical Basis for Distance Decay**:

Closer boosters have stronger influence (linguistic proximity principle)

**Example**:

```
"This is very very good"
         ↑    ↑    ↑
    Distance2 Distance1 Sentiment word

Distance 1 "very": scalar = +0.293 × 0.95 = +0.278
Distance 2 "very": scalar = +0.293 × 0.90 = +0.264
Total: V₂ = 1.9 + 0.278 + 0.264 = 2.442
```

### 4.3 ALL CAPS Emphasis

**Rule**: When a sentiment word is in all caps and the entire text is not all caps, apply emphasis

```javascript
function allCapDifferential(tokens) {
    let allCapCount = 0;
    tokens.forEach(t => {
        if (t.text === t.text.toUpperCase() && /[A-Z]/.test(t.text)) {
            allCapCount++;
        }
    });
    return allCapCount > 0 && allCapCount < tokens.length;
}

if (word === word.toUpperCase() && isCapDiff) {
    if (V(wᵢ) > 0) {
        V₃(wᵢ) = V₂(wᵢ) + C_INCR;
    } else {
        V₃(wᵢ) = V₂(wᵢ) - C_INCR;
    }
}
```

**Parameter**:
- `C_INCR = 0.733`

**Why only when not all text is caps?**

On social media, specific words are capitalized for emphasis. When entire text is caps (e.g., titles), there's no emphasis intent.

**Example**:

```
"This is AMAZING"
→ V₃ = 2.5 + 0.733 = 3.233

"THIS IS AMAZING"  // All caps
→ V₃ = 2.5 (unchanged)
```

### 4.4 Exclamation Marks

**Rule**: Exclamation marks immediately after a sentiment word (maximum 4) provide emphasis

```javascript
let exclamationCount = 0;
if (i + 1 < tokens.length) {
    const nextToken = tokens[i + 1];
    if (/^!+$/.test(nextToken.text)) {
        exclamationCount = Math.min(nextToken.text.length, 4);
    }
}

const boost = exclamationCount × 0.292;

if (V(wᵢ) > 0) {
    V₄(wᵢ) = V₃(wᵢ) + boost;
} else {
    V₄(wᵢ) = V₃(wᵢ) - boost;
}
```

**Parameters**:
- `E_INCR = 0.292` (per exclamation mark)
- Maximum 4 (no additional effect beyond 4)

**Why limit to 4?**

Paper experiments found that 5 or more exclamation marks provide no additional effect.

**Example**:

```
"This is amazing!"      → boost = 1 × 0.292 = +0.292
"This is amazing!!"     → boost = 2 × 0.292 = +0.584
"This is amazing!!!"    → boost = 3 × 0.292 = +0.876
"This is amazing!!!!"   → boost = 4 × 0.292 = +1.168
"This is amazing!!!!!"  → boost = 4 × 0.292 = +1.168 (ceiling)
```

### 4.5 "but" Context Adjustment

**Rule**: Sentiment before "but" is attenuated, after is emphasized

```javascript
if ("but" in tokens) {
    const butIndex = tokens.indexOf("but");
    
    for (let i = 0; i < tokens.length; i++) {
        if (V(wᵢ) !== 0) {
            if (i < butIndex) {
                V₅(wᵢ) = V₄(wᵢ) × 0.5;  // First half attenuated
            } else if (i > butIndex) {
                V₅(wᵢ) = V₄(wᵢ) × 1.5;  // Second half emphasized
            }
        }
    }
}
```

**Linguistic Basis**:

"but" is a contrastive conjunction, and content following it represents the speaker's true opinion (contrastive focus)

**Example**:

```
"The book was good but the service was terrible"

"good" (before but):
  V₅ = 1.9 × 0.5 = 0.95

"terrible" (after but):
  V₅ = -2.5 × 1.5 = -3.75

→ Overall score is pulled negative by "terrible"
```

---

## 5. Score Normalization

### 5.1 Compound Score Calculation

Using all adjusted scores, calculate the Compound Score:

```
compound = Σ(valence_i) / √(Σ(valence_i²) + α)
```

Where α = 15 (normalization parameter)

**JavaScript Implementation**:

```javascript
let sum = 0;
let sumSquares = 0;

sentiments.forEach(s => {
    sum += s.adjustedScore;
    sumSquares += s.adjustedScore * s.adjustedScore;
});

const alpha = 15;
const compound = sum / Math.sqrt(sumSquares + alpha);
```

### 5.2 Why This Normalization Formula?

#### Reason 1: Normalization to -1 to +1

The square root in denominator ensures scores fall within -1 to +1 range.

#### Reason 2: α Smoothing

Provides stable scores even for short texts (few words).

**Example**:

```
Text 1: "good" (1 word)
  sum = 1.9
  sumSquares = 3.61
  compound = 1.9 / √(3.61 + 15) = 1.9 / 4.31 = 0.441

Text 2: "good great excellent" (3 words)
  sum = 1.9 + 2.3 + 3.2 = 7.4
  sumSquares = 3.61 + 5.29 + 10.24 = 19.14
  compound = 7.4 / √(19.14 + 15) = 7.4 / 5.84 = 1.267 → normalized ≈ 0.78
```

#### Reason 3: Dampening Extreme Values

Square root prevents extremely high/low scores from dominating excessively.

### 5.3 Positive/Negative/Neutral Calculation

Calculate proportion of each category:

```javascript
let posSum = 0, negSum = 0, neuCount = 0;

sentiments.forEach(s => {
    if (s.adjustedScore > 0) {
        posSum += s.adjustedScore;
    } else if (s.adjustedScore < 0) {
        negSum += Math.abs(s.adjustedScore);
    } else {
        neuCount++;
    }
});

const total = posSum + negSum + neuCount;
const pos = total > 0 ? posSum / total : 0;
const neg = total > 0 ? negSum / total : 0;
const neu = total > 0 ? neuCount / total : 0;
```

**Properties**:
- `pos + neg + neu ≈ 1.0`
- These represent **proportions** of sentiment words (independent from Compound)

**Compound vs Pos/Neg/Neu**:

```
Example: "I love this. But I hate that."

Compound: -0.12 (overall slightly negative)
Pos: 0.45, Neg: 0.40, Neu: 0.15 (mixed positive and negative)
```

---

## 6. Implementation Details

### 6.1 Tokenization

```javascript
function tokenize(text) {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}...]/u;
    const regex = /(!+|\?+|[:()\[\]{}<>*\-_|\\\/]+|[\w']+|[emoji])/gu;
    
    let tokens = [];
    let match;
    
    while ((match = regex.exec(text)) !== null) {
        tokens.push({
            text: match[0],
            index: match.index,
            lower: match[0].toLowerCase(),
            isEmoji: emojiRegex.test(match[0])
        });
    }
    
    return tokens;
}
```

**Tokenization Features**:
- Keeps exclamation/question marks as independent tokens
- Recognizes emojis individually
- Includes symbols in processing

### 6.2 ALL CAPS Detection

```javascript
function allCapDifferential(tokens) {
    let allCapCount = 0;
    
    tokens.forEach(t => {
        if (t.text === t.text.toUpperCase() && /[A-Z]/.test(t.text)) {
            allCapCount++;
        }
    });
    
    // Only true when some but not all words are caps
    return allCapCount > 0 && allCapCount < tokens.length;
}
```

### 6.3 Importance of Processing Order

Rule application in VADER has **important ordering**:

```
1. Tokenization
2. Locate "but" position
3. For each token:
   a. Get lexicon score (V₀)
   b. Check preceding 3 tokens for boosters (distance decay) → V₂
   c. Check ALL CAPS → V₃
   d. Check next token for exclamation marks → V₄
   e. Apply "but" adjustment → V₅
   f. Check preceding 3 tokens for negation → V_final
4. Calculate Compound Score
```

**Why this order?**

Negation is applied last so it affects scores already adjusted by other rules.

### 6.4 Emoji Processing (Optional)

```javascript
if (token.isEmoji && emojiLexicon[token.text]) {
    const description = emojiLexicon[token.text];
    // Example: 😊 → "smiling face"
    
    // Look up each word in description using VADER lexicon
    const words = description.split(/\s+/);
    let totalScore = 0;
    
    words.forEach(word => {
        if (vaderLexicon[word]) {
            totalScore += vaderLexicon[word].score;
        }
    });
    
    // Use total score as emoji's score
}
```

---

## Appendix: Parameter List

| Parameter | Value | Purpose |
|-----------|-------|---------|
| N_SCALAR | -0.74 | Negation intensity |
| B_INCR | ±0.293 | Booster increment/decrement |
| C_INCR | 0.733 | ALL CAPS emphasis |
| E_INCR | 0.292 | Exclamation emphasis |
| α | 15 | Normalization smoothing |
| Negation range | 3 tokens | Preceding check range |
| Booster range | 3 tokens | Preceding check range |
| Distance 1 decay | 0.95 | Booster distance decay |
| Distance 2 decay | 0.90 | Booster distance decay |
| Before "but" | ×0.5 | Score attenuation |
| After "but" | ×1.5 | Score emphasis |
| Exclamation max | 4 | Effect ceiling |

---

## Reference

Hutto, C.J. & Gilbert, E.E. (2014). VADER: A Parsimonious Rule-based Model for Sentiment Analysis of Social Media Text. *Eighth International Conference on Weblogs and Social Media (ICWSM-14)*. Ann Arbor, MI, June 2014.

---

# 日本語版

本ドキュメントでは、VADERアルゴリズムの実装詳細と数学的な定義を説明します。

---

## 目次

1. [アルゴリズムの概要](#1-アルゴリズムの概要-1)
2. [分析単位：文レベル vs 文書レベル](#2-分析単位文レベル-vs-文書レベル)
3. [レキシコンベーススコアリング](#3-レキシコンベーススコアリング)
4. [文法ルールによる調整](#4-文法ルールによる調整)
5. [スコアの正規化](#5-スコアの正規化)
6. [実装の詳細](#6-実装の詳細)

---

## 1. アルゴリズムの概要

VADERは以下のステップで感情スコアを計算します：

```
入力テキスト
    ↓
[0] 文分割（オプション）
    ↓
[1] トークン化・レキシコンスコア取得
    ↓
[2] 文法ルールによるスコア調整
    ↓
[3] 正規化とCompound Score計算
    ↓
出力: {compound, pos, neg, neu}
```

---

## 2. 分析単位：文レベル vs 文書レベル

### 2.1 VADER論文の推奨

VADER論文（Hutto & Gilbert, 2014）では**文単位での分析を推奨**しています：

> "VADER performs **sentence-level sentiment analysis**"
> 
> "decomposing paragraphs, articles/reports/publications, or novels into **sentence-level analyses**"

### 2.2 なぜ文単位なのか？

#### 理由1：感情の文脈依存性

文によって感情が変化する例：

```
文書: "I love the design. But the quality is terrible."

文書単位分析:
  → Compound: +0.12 (全体としてやや肯定的？)

文単位分析:
  文1: "I love the design." → +0.6369 (明確に肯定的)
  文2: "But the quality is terrible." → -0.5267 (明確に否定的)
```

#### 理由2：論文の評価データ

VADER論文の評価は全て文単位：

| データセット | サンプル数 | 単位 |
|-------------|-----------|------|
| Movie reviews | 10,605 | sentence-level snippets |
| Product reviews | 3,708 | sentence-level snippets |
| News articles | 5,190 | sentence-level snippets |

#### 理由3：文法ルールの適用範囲

VADERの文法ルール（否定、"but"など）は文内で機能：

```
"The product is good. But I don't like it."

文単位:
  文1: "good" → ポジティブ（"but"の影響なし）
  文2: "like" → 否定される（"don't"の影響）

文書単位:
  "good" → "but"の影響で減衰（文をまたいで適用）
  "like" → 否定される
  → 文法ルールが意図しない形で適用される
```

### 2.3 文分割のアルゴリズム

#### 基本的な分割パターン

```javascript
function splitIntoSentences(text) {
    // ピリオド、感嘆符、疑問符で分割
    return text.split(/([.!?]+\s+)/);
}
```

#### 略語保護の実装

一般的な略語での誤分割を防ぐ：

```javascript
function splitIntoSentences(text) {
    // ステップ1: 略語のピリオドを保護
    const protectedText = text
        .replace(/\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr)\./gi, '$1<PERIOD>')
        .replace(/\b([A-Z])\./g, '$1<PERIOD>'); // イニシャル
    
    // ステップ2: 文分割
    const sentences = protectedText
        .split(/([.!?]+\s+)/)
        .reduce((acc, part, i, arr) => {
            if (i % 2 === 0) {
                const sentence = (part + (arr[i + 1] || '')).trim();
                if (sentence.length > 0) {
                    acc.push(sentence.replace(/<PERIOD>/g, '.'));
                }
            }
            return acc;
        }, []);
    
    return sentences;
}
```

**保護される略語リスト：**

| カテゴリ | 例 |
|---------|-----|
| 敬称 | Mr., Mrs., Ms., Dr., Prof. |
| 肩書き | Sr., Jr. |
| その他 | vs., etc., Inc., Ltd., Corp., Co. |
| イニシャル | M., T., J., H. など |

#### 文分割の例

```
入力: 
"Mr. M. T. John and J. H. Samuel presented their papers."

誤った分割（略語保護なし）:
  文1: "Mr."
  文2: "M."
  文3: "T."
  ...

正しい分割（略語保護あり）:
  文1: "Mr. M. T. John and J. H. Samuel presented their papers."
```

### 2.4 集計方法

文単位分析で複数の文がある場合の集計：

#### 方法1：平均値

```javascript
const avgCompound = sentences.reduce((sum, s) => sum + s.compound, 0) / sentences.length;
```

**適用場面**: 全体的な感情傾向を知りたい場合

#### 方法2：カテゴリ別カウント

```javascript
const posCount = sentences.filter(s => s.compound >= 0.05).length;
const negCount = sentences.filter(s => s.compound <= -0.05).length;
const neuCount = sentences.length - posCount - negCount;
```

**適用場面**: 感情の構成を分析したい場合

#### 方法3：重み付き平均

```javascript
// 文の長さで重み付け
const weighted = sentences.reduce((sum, s) => {
    const weight = s.sentiments.length;
    return sum + (s.compound * weight);
}, 0) / totalTokens;
```

**適用場面**: 長い文を重視したい場合

---

## 3. レキシコンベーススコアリング

### 3.1 レキシコンの構造

各単語は以下の情報を持ちます：

```
単語    平均スコア  標準偏差   人間評価値
good    1.9         0.94       [2,2,2,1,2,...]
bad     -1.5        0.75       [-2,-1,-2,-2,...]
```

**スコア範囲**: -4 (極めてネガティブ) 〜 +4 (極めてポジティブ)

**標準偏差の意味**:
- 低い（< 1.0）: 評価者間で一致度が高い
- 高い（> 2.0）: 評価が分かれる（文脈依存的）

### 3.2 基本スコアの取得

各トークンについて：

```
V₀(wᵢ) = lexicon[wᵢ]
```

ここで：
- `wᵢ` はトークン i
- `V₀(wᵢ)` はレキシコンから取得した基本スコア

---

## 4. 文法ルールによる調整

### 4.1 否定 (Negation)

**ルール**: 各感情語について、その**前方3トークン**に否定語があればスコアを反転

```javascript
// 否定語の例
NEGATION_WORDS = {
  "not", "no", "never", "don't", "doesn't", 
  "didn't", "can't", "won't", "couldn't",
  "isn't", "wasn't", "weren't", ...
}
```

**適用方法**:

```
for each token i with V₀(wᵢ) ≠ 0:
    for j from max(0, i-3) to i-1:
        if tokens[j] in NEGATION_WORDS:
            if j == i-3 and tokens[i-1] not in ["or", "nor"]:
                continue  // 特別ルール
            V₁(wᵢ) = V₀(wᵢ) × N_SCALAR
            break
```

**パラメータ**:
- `N_SCALAR = -0.74`

**なぜ -0.74 なのか？**

論文の実験により、単純な反転（×-1.0）よりも、やや弱めの反転がソーシャルメディアテキストでは適切であることが判明。

**例**:

```
"This is not very good or nice"
位置: 0   1   2    3    4    5  6

"good" (位置4):
  前方3トークン: 位置1,2,3 ("is", "not", "very")
  → "not"が位置2にある → 否定適用
  → V₁ = 1.9 × -0.74 = -1.406

"nice" (位置6):
  前方3トークン: 位置3,4,5 ("very", "good", "or")
  → 否定語なし → 否定適用なし
  → V₁ = 1.8 (変化なし)
```

### 4.2 強調語 (Boosters)

**ルール**: 前方3トークンの強調語がスコアを増減（距離に応じて減衰）

```javascript
BOOSTER_DICT = {
  // ポジティブブースター
  "very": +0.293,
  "extremely": +0.293,
  "incredibly": +0.293,
  "absolutely": +0.293,
  
  // ネガティブブースター（減衰）
  "somewhat": -0.293,
  "barely": -0.293,
  "hardly": -0.293,
  "slightly": -0.293,
  ...
}
```

**適用方法**:

```
for startI from 0 to 2:
    if i > startI:
        prevToken = tokens[i - (startI + 1)]
        if prevToken not in LEXICON and prevToken in BOOSTER_DICT:
            scalar = BOOSTER_DICT[prevToken]
            if V(wᵢ) < 0:
                scalar *= -1  // ネガティブ語の場合は反転
            
            // 距離による減衰
            if startI == 1:
                scalar *= 0.95  // 距離2: 5%減衰
            if startI == 2:
                scalar *= 0.90  // 距離3: 10%減衰
            
            V₂(wᵢ) = V₁(wᵢ) + scalar
```

**距離減衰の理論的根拠**:

強調語が感情語に近いほど影響が強い（言語学的な近接性の原則）

**例**:

```
"This is very very good"
         ↑    ↑    ↑
      距離2 距離1  感情語

距離1の"very": scalar = +0.293 × 0.95 = +0.278
距離2の"very": scalar = +0.293 × 0.90 = +0.264
合計: V₂ = 1.9 + 0.278 + 0.264 = 2.442
```

### 4.3 大文字強調 (ALL CAPS)

**ルール**: 感情語が大文字で、かつ文全体が大文字でない場合に強調

```javascript
function allCapDifferential(tokens) {
    let allCapCount = 0;
    tokens.forEach(t => {
        if (t.text === t.text.toUpperCase() && /[A-Z]/.test(t.text)) {
            allCapCount++;
        }
    });
    return allCapCount > 0 && allCapCount < tokens.length;
}

if (word === word.toUpperCase() && isCapDiff) {
    if (V(wᵢ) > 0) {
        V₃(wᵢ) = V₂(wᵢ) + C_INCR;
    } else {
        V₃(wᵢ) = V₂(wᵢ) - C_INCR;
    }
}
```

**パラメータ**:
- `C_INCR = 0.733`

**なぜ文全体が大文字でない場合のみか？**

ソーシャルメディアでは、特定の語を強調するために大文字を使用。文全体が大文字の場合（例：タイトル）は強調の意図がない。

**例**:

```
"This is AMAZING"
→ V₃ = 2.5 + 0.733 = 3.233

"THIS IS AMAZING"  // 全て大文字
→ V₃ = 2.5 (変化なし)
```

### 4.4 感嘆符 (Exclamation Marks)

**ルール**: 感情語の直後の感嘆符（最大4個）が強調

```javascript
let exclamationCount = 0;
if (i + 1 < tokens.length) {
    const nextToken = tokens[i + 1];
    if (/^!+$/.test(nextToken.text)) {
        exclamationCount = Math.min(nextToken.text.length, 4);
    }
}

const boost = exclamationCount × 0.292;

if (V(wᵢ) > 0) {
    V₄(wᵢ) = V₃(wᵢ) + boost;
} else {
    V₄(wᵢ) = V₃(wᵢ) - boost;
}
```

**パラメータ**:
- `E_INCR = 0.292` (感嘆符1個あたり)
- 最大4個まで（それ以上は効果なし）

**なぜ4個まで？**

論文の実験により、5個以上の感嘆符は追加効果がないことが判明。

**例**:

```
"This is amazing!"      → boost = 1 × 0.292 = +0.292
"This is amazing!!"     → boost = 2 × 0.292 = +0.584
"This is amazing!!!"    → boost = 3 × 0.292 = +0.876
"This is amazing!!!!"   → boost = 4 × 0.292 = +1.168
"This is amazing!!!!!"  → boost = 4 × 0.292 = +1.168 (上限)
```

### 4.5 "but"による文脈調整

**ルール**: "but"より前の感情は減衰、後は強調

```javascript
if ("but" in tokens) {
    const butIndex = tokens.indexOf("but");
    
    for (let i = 0; i < tokens.length; i++) {
        if (V(wᵢ) !== 0) {
            if (i < butIndex) {
                V₅(wᵢ) = V₄(wᵢ) × 0.5;  // 前半は減衰
            } else if (i > butIndex) {
                V₅(wᵢ) = V₄(wᵢ) × 1.5;  // 後半は強調
            }
        }
    }
}
```

**言語学的根拠**:

"but"は対照接続詞であり、その後の内容が話者の本当の意見を表す（逆接の焦点化）

**例**:

```
"The book was good but the service was terrible"

"good" (but より前):
  V₅ = 1.9 × 0.5 = 0.95

"terrible" (but より後):
  V₅ = -2.5 × 1.5 = -3.75

→ 全体のスコアは "terrible" に引きずられてネガティブになる
```

---

## 5. スコアの正規化

### 5.1 Compound Scoreの計算

すべての調整後スコアを用いて、Compound Scoreを計算します：

```
compound = Σ(valence_i) / √(Σ(valence_i²) + α)
```

ここで α = 15（正規化パラメータ）

**JavaScript実装**:

```javascript
let sum = 0;
let sumSquares = 0;

sentiments.forEach(s => {
    sum += s.adjustedScore;
    sumSquares += s.adjustedScore * s.adjustedScore;
});

const alpha = 15;
const compound = sum / Math.sqrt(sumSquares + alpha);
```

### 5.2 なぜこの正規化式なのか？

#### 理由1：-1〜+1への正規化

分母の平方根により、スコアが-1から+1の範囲に収まる。

#### 理由2：αによるスムージング

短いテキスト（語数が少ない）でも安定したスコアを出すため。

**例**:

```
テキスト1: "good" (1語)
  sum = 1.9
  sumSquares = 3.61
  compound = 1.9 / √(3.61 + 15) = 1.9 / 4.31 = 0.441

テキスト2: "good great excellent" (3語)
  sum = 1.9 + 2.3 + 3.2 = 7.4
  sumSquares = 3.61 + 5.29 + 10.24 = 19.14
  compound = 7.4 / √(19.14 + 15) = 7.4 / 5.84 = 1.267 → 正規化後 ≈ 0.78
```

#### 理由3：極端な値の抑制

平方根により、極端に高い/低いスコアが過度に影響しない。

### 5.3 Positive/Negative/Neutralの計算

各カテゴリーの比率を計算：

```javascript
let posSum = 0, negSum = 0, neuCount = 0;

sentiments.forEach(s => {
    if (s.adjustedScore > 0) {
        posSum += s.adjustedScore;
    } else if (s.adjustedScore < 0) {
        negSum += Math.abs(s.adjustedScore);
    } else {
        neuCount++;
    }
});

const total = posSum + negSum + neuCount;
const pos = total > 0 ? posSum / total : 0;
const neg = total > 0 ? negSum / total : 0;
const neu = total > 0 ? neuCount / total : 0;
```

**性質**:
- `pos + neg + neu ≈ 1.0`
- これらは感情語の**比率**を表す（Compoundとは独立）

**Compound vs Pos/Neg/Neu**:

```
例: "I love this. But I hate that."

Compound: -0.12 (全体としてやや否定的)
Pos: 0.45, Neg: 0.40, Neu: 0.15 (ポジティブとネガティブが混在)
```

---

## 6. 実装の詳細

### 6.1 トークン化

```javascript
function tokenize(text) {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}...]/u;
    const regex = /(!+|\?+|[:()\[\]{}<>*\-_|\\\/]+|[\w']+|[絵文字])/gu;
    
    let tokens = [];
    let match;
    
    while ((match = regex.exec(text)) !== null) {
        tokens.push({
            text: match[0],
            index: match.index,
            lower: match[0].toLowerCase(),
            isEmoji: emojiRegex.test(match[0])
        });
    }
    
    return tokens;
}
```

**トークン化の特徴**:
- 感嘆符・疑問符を独立トークンとして保持
- 絵文字を個別に認識
- 記号も処理対象に含む

### 6.2 ALL CAPS判定

```javascript
function allCapDifferential(tokens) {
    let allCapCount = 0;
    
    tokens.forEach(t => {
        if (t.text === t.text.toUpperCase() && /[A-Z]/.test(t.text)) {
            allCapCount++;
        }
    });
    
    // 一部の単語だけが大文字の場合のみtrue
    return allCapCount > 0 && allCapCount < tokens.length;
}
```

### 6.3 処理順序の重要性

VADERのルール適用には**順序が重要**：

```
1. トークン化
2. "but"の位置を特定
3. 各トークンについて：
   a. レキシコンスコア取得 (V₀)
   b. 前方3トークンの強調語チェック（距離減衰）→ V₂
   c. ALL CAPS判定 → V₃
   d. 次トークンの感嘆符チェック → V₄
   e. "but"による調整 → V₅
   f. 前方3トークンの否定チェック → V_final
4. Compound Score計算
```

**なぜこの順序？**

否定は最後に適用することで、他のルールで調整されたスコアに対して作用する。

### 6.4 絵文字処理（オプション）

```javascript
if (token.isEmoji && emojiLexicon[token.text]) {
    const description = emojiLexicon[token.text];
    // 例: 😊 → "smiling face"
    
    // 説明文の各単語をVADERレキシコンで検索
    const words = description.split(/\s+/);
    let totalScore = 0;
    
    words.forEach(word => {
        if (vaderLexicon[word]) {
            totalScore += vaderLexicon[word].score;
        }
    });
    
    // 合計スコアを絵文字のスコアとする
}
```

---

## 付録：パラメータ一覧

| パラメータ | 値 | 用途 |
|-----------|-----|------|
| N_SCALAR | -0.74 | 否定の強度 |
| B_INCR | ±0.293 | 強調語の増減 |
| C_INCR | 0.733 | 大文字の強調 |
| E_INCR | 0.292 | 感嘆符の強調 |
| α | 15 | 正規化のスムージング |
| 否定範囲 | 3トークン | 前方チェック範囲 |
| 強調語範囲 | 3トークン | 前方チェック範囲 |
| 距離1減衰 | 0.95 | 強調語の距離減衰 |
| 距離2減衰 | 0.90 | 強調語の距離減衰 |
| but前減衰 | 0.5 | but前のスコア調整 |
| but後強調 | 1.5 | but後のスコア調整 |
| 感嘆符上限 | 4個 | 効果の上限 |

---

## 参考文献

Hutto, C.J. & Gilbert, E.E. (2014). VADER: A Parsimonious Rule-based Model for Sentiment Analysis of Social Media Text. *Eighth International Conference on Weblogs and Social Media (ICWSM-14)*. Ann Arbor, MI, June 2014.