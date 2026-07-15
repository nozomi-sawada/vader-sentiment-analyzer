# VADER アルゴリズム詳細

[English](ALGORITHM.md) | **日本語**

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

**ルール**: 各感情語について、その**前方3トークン**（それ自身がレキシコン語でないもの）に否定語があればスコアに N_SCALAR を乗算

```javascript
// 否定語リスト（本家実装の NEGATE）
NEGATE = {
  "not", "never", "neither", "nor", "none", "nope", "nothing", "nowhere",
  "don't", "dont", "doesn't", "doesnt", "didn't", "didnt",
  "can't", "cant", "cannot", "won't", "wont", "couldn't", "couldnt",
  "isn't", "isnt", "wasn't", "wasnt", "weren't", "werent",
  "without", "rarely", "seldom", "despite", "uh-uh", ...
}
// さらに、"n't" を含むトークンはすべて否定語として扱われる
```

**適用方法**（本家 `_negation_check` の移植）:

```
for startI from 0 to 2:                       // 距離 1, 2, 3
    if i > startI and tokens[i-(startI+1)] not in LEXICON:
        if tokens[i-(startI+1)] が否定語:
            V₁(wᵢ) = V(wᵢ) × N_SCALAR
```

**パラメータ**:
- `N_SCALAR = -0.74`

**なぜ -0.74 なのか？**

論文の実験により、単純な反転（×-1.0）よりも、やや弱めの反転がソーシャルメディアテキストでは適切であることが判明。

**特殊ケース**（いずれも本家どおり実装）:

- `"never so <語>"` / `"never this <語>"` — 否定ではなく強調（×1.25）として扱う
- `"without doubt"` — 否定として扱わない
- `"no"` — NEGATEリストには含まれない。代わりに、"no" がレキシコン語の直前（距離1〜2、または距離3で直後が "or"/"nor"）にある場合、その語に N_SCALAR を乗算し、レキシコン語が続く "no" 自体は0点とする
- `"least <語>"` — 直前が "at"/"very" でなければ後続の語を否定（×N_SCALAR）

**例**:

```
"This is not very good"
位置: 0   1   2   3    4

"good" (位置4):
  距離1: "very" → 強調語 (+0.293)
  距離2: "not"  → 否定
  → V₁ = (1.9 + 0.293) × -0.74 = -1.623
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
            if prevToken が大文字 かつ 文中に大文字差がある:
                scalar に C_INCR を加算（符号に合わせる）
            
            // 距離による減衰
            if startI == 1:
                scalar *= 0.95  // 2語前: 5%減衰
            if startI == 2:
                scalar *= 0.90  // 3語前: 10%減衰
            
            V₂(wᵢ) = V₁(wᵢ) + scalar
```

"kind of" / "sort of" のような複数語の弱化表現も、前方トークンのバイグラムとして検出されます（本家 `_special_idioms_check`）。

**距離減衰の理論的根拠**:

強調語が感情語に近いほど影響が強い（言語学的な近接性の原則）。感情語の直前の強調語は減衰なし（×1.00）で適用されます。

**例**:

```
"This is very very good"
         ↑    ↑    ↑
      2語前  1語前  感情語

1語前の"very": scalar = +0.293 × 1.00 = +0.293
2語前の"very": scalar = +0.293 × 0.95 = +0.278
合計: V₂ = 1.9 + 0.293 + 0.278 = 2.471
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

### 4.4 句読点による強調（感嘆符・疑問符）

**ルール**: テキスト中の感嘆符・疑問符は、個々の単語ではなく**合計スコア**を増幅します。増幅値は正規化の前に、合計値の符号方向に加算されます。

```javascript
// テキスト全体でカウント（本家 _punctuation_emphasis() の移植）
epAmplifier = min(count("!"), 4) × 0.292;

qmCount = count("?");
qmAmplifier = 0;
if (qmCount > 1) {
    qmAmplifier = qmCount <= 3 ? qmCount × 0.18 : 0.96;
}

punctEmphasis = epAmplifier + qmAmplifier;

if (sum > 0)      sum += punctEmphasis;
else if (sum < 0) sum -= punctEmphasis;
```

**パラメータ**:
- 感嘆符: 1個あたり `+0.292`、最大4個（それ以上は効果なし）
- 疑問符: 2〜3個は1個あたり `+0.18`、4個以上は合計 `+0.96`

**なぜ4個まで？**

論文の実験により、5個以上の感嘆符は追加効果がないことが判明。

**例**:

```
"This is amazing!"      → punctEmphasis = 1 × 0.292 = +0.292
"This is amazing!!!"    → punctEmphasis = 3 × 0.292 = +0.876
"This is amazing!!!!!"  → punctEmphasis = 4 × 0.292 = +1.168 (上限)
"Really bad?? Really??" → punctEmphasis = 0.96 (疑問符4個)
"Seriously???"          → punctEmphasis = 3 × 0.18 = +0.54
```

同じ増幅値は、pos/neu/neg比率の計算時にもポジティブ・ネガティブ合計の大きい側に加算されます（5.3参照）。

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
let compound = sum / Math.sqrt(sum * sum + alpha);

// Compound Scoreを[-1, 1]の範囲に確実に収める
compound = Math.max(-1, Math.min(1, compound));
```
**重要な注意:** VADER論文では `sum / √(Σ(valence²) + α)` と記述されていますが、公式Python実装では `sum / √(sum² + α)` を使用しています。本実装は互換性のためPython版に準拠しています。

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
// 本家 _sift_sentiment_scores() の移植：ポジティブ語は (スコア + 1)、
// ネガティブ語は (スコア - 1) を加算する。±1 は「中立語1個 = 1」との
// バランスを取るための補正。
let posSum = 0, negSum = 0, neuCount = 0;

valences.forEach(v => {
    if (v > 0) posSum += v + 1;
    if (v < 0) negSum += v - 1;
    if (v === 0) neuCount++;
});

// 句読点による強調は優勢な側に加算
if (posSum > Math.abs(negSum))      posSum += punctEmphasis;
else if (posSum < Math.abs(negSum)) negSum -= punctEmphasis;

const total = posSum + Math.abs(negSum) + neuCount;
const pos = Math.abs(posSum / total);
const neg = Math.abs(negSum / total);
const neu = Math.abs(neuCount / total);
```

**性質**:
- `pos + neg + neu ≈ 1.0`
- これらは感情語の**比率**を表す（Compoundとは独立）
- トークンごとの `±1` 補正は本家実装と同一。この補正がないと比率がPython版VADERとずれる

**Compound vs Pos/Neg/Neu**:

```
例: "I love this. But I hate that."

Compound: -0.12 (全体としてやや否定的)
Pos: 0.45, Neg: 0.40, Neu: 0.15 (ポジティブとネガティブが混在)
```

---

## 6. 実装の詳細

### 6.1 トークン化

トークン化は本家実装の `SentiText` と同一です：

```javascript
// 1. 空白で分割
// 2. 各トークンの先頭・末尾の句読点を除去
// 3. 除去後が2文字以下なら元のトークンを保持
//    （":)" は除去すると "" になるため、エモーティコンとみなして保持）
function stripPuncIfWord(token) {
    const stripped = stripPunctuation(token); // Python str.strip(string.punctuation) 相当
    if (stripped.length <= 2) return token;
    return stripped;
}

function wordsAndEmoticons(text) {
    return text.trim().split(/\s+/).map(stripPuncIfWord);
}
```

**トークン化の特徴**:
- 縮約形（"isn't"）と大半のエモーティコン（":)"、":D"、"<3"）を保持
- 単語の末尾の句読点は除去（"good!" → "good"）。感嘆符・疑問符はトークンではなくテキスト単位で処理（4.4参照）
- 絵文字はトークン化の**前**に説明文へ変換（6.5参照）

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

VADERのルール適用には**順序が重要**（本家実装と同一）：

```
1. 絵文字を説明文に変換
2. トークン化（空白分割＋句読点除去）
3. 各トークンについて：
   a. 強調語・"kind of" 自体はスコア0 → 次のトークンへ
   b. レキシコンスコア取得 (V₀)
   c. "no" の特殊処理
   d. ALL CAPS強調 → V₁
   e. 前方3トークンを近い順にチェック：
      強調語（距離減衰）→ 否定チェック → イディオムチェック → V₂
   f. "least" チェック → V₃
4. トークン列全体に "but" 調整を適用（前×0.5 / 後×1.5）
5. 全トークンのスコアを合計し、句読点強調を加算して正規化 → Compound Score
```

**なぜこの順序？**

乗算的なルール（否定、"but"）を加算的なルール（ALL CAPS、強調語）の後に適用することで、調整済みスコア全体に作用させる。本家実装と同じ順序。

### 6.4 トークン処理戦略

**トークン処理に関する重要な注意:**

この実装は、感情語だけでなく入力テキストの**全トークン**を処理します：

```javascript
// Python VADER互換のため全トークンを処理（vader.js の analyze() 参照）
for (let i = 0; i < wordsAndEmoticons.length; i++) {
    // 強調語・"kind of" 自体はスコア0
    // それ以外のトークンはレキシコンスコア（なければ0）にルールを適用
    valences.push(valence);
}
```

**なぜ全トークンを処理するのか？**

1. **Python VADER互換性**: オリジナルのPython実装は計算に全トークンを含める
2. **正確なpos/neg/neu比率**: 比率は全トークンに基づいて計算される（中立語は1個 = 1 として数える。5.3参照）
3. **表示の最適化**: 内部では全トークンを処理するが、詳細分析ではスコアまたは適用ルールのあるトークンのみを表示

**処理例:**

入力: "I love this product"

内部処理（全4トークン）:
```
[
  {token: "I", score: 0, type: "neutral"},
  {token: "love", score: 3.2, type: "positive"},
  {token: "this", score: 0, type: "neutral"},
  {token: "product", score: 0, type: "neutral"}
]
```

表示（感情語のみ）:
```
love: +3.2 (positive)
```

### 6.5 絵文字処理（オプション）

本家実装と同一：入力テキスト中の各絵文字は、トークン化の**前**にインラインで説明文へ置換されます。説明文の単語は通常のトークンとして分析に参加します（否定や強調語との相互作用も含む）。

```javascript
// polarity_scores() の絵文字前処理の移植
for (const ch of text) {           // コードポイント単位で走査
    if (ch in emojiLexicon) {
        // 例: 😊 → "smiling face with smiling eyes"
        output += (needsSpace ? ' ' : '') + emojiLexicon[ch];
    } else {
        output += ch;
    }
}
// 分析は絵文字置換後のテキストに対して実行される
```

---

## 付録：パラメータ一覧

| パラメータ | 値 | 用途 |
|-----------|-----|------|
| N_SCALAR | -0.74 | 否定の強度 |
| B_INCR / B_DECR | ±0.293 | 強調語の増減 |
| C_INCR | 0.733 | 大文字の強調 |
| 感嘆符の強調 | 1個あたり 0.292（最大4個） | テキスト単位の増幅 |
| 疑問符の強調 | 2〜3個: 0.18/個、4個以上: 0.96 | テキスト単位の増幅 |
| α | 15 | 正規化のスムージング |
| 否定範囲 | 3トークン | 前方チェック範囲 |
| 強調語範囲 | 3トークン | 前方チェック範囲 |
| 2語前の減衰 | ×0.95 | 強調語の距離減衰 |
| 3語前の減衰 | ×0.90 | 強調語の距離減衰 |
| "never so/this" | ×1.25 | 強調の特殊ケース |
| but前減衰 | ×0.5 | but前のスコア調整 |
| but後強調 | ×1.5 | but後のスコア調整 |

---

## 参考文献

Hutto, C.J. & Gilbert, E.E. (2014). VADER: A Parsimonious Rule-based Model for Sentiment Analysis of Social Media Text. *Eighth International Conference on Weblogs and Social Media (ICWSM-14)*. Ann Arbor, MI, June 2014.