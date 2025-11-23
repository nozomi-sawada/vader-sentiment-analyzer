# VADER Algorithm Details

**English** | [日本語](ALGORITHM.ja.md)

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
let compound = sum / Math.sqrt(sum * sum + alpha);

// Ensure compound stays within [-1, 1] range
compound = Math.max(-1, Math.min(1, compound));
```
**Important Note:** The VADER paper describes the formula as `sum / √(Σ(valence²) + α)`, but the official Python implementation uses `sum / √(sum² + α)`. This implementation follows the Python version for compatibility.

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

### 6.4 Token Processing Strategy

**Important Note on Token Processing:**

The implementation processes **all tokens** in the input text, not just sentiment-bearing words:

```javascript
// Process ALL tokens for Python VADER compatibility
tokens.forEach((token, i) => {
    const lower = token.lower;
    const original = token.text;
    
    // Check lexicon
    let lexiconEntry = vaderLexicon[lower] || vaderLexicon[original];
    
    if (!lexiconEntry) {
        // Non-sentiment words are also added with score 0
        sentiments.push({
            token: original,
            type: 'neutral',
            score: 0,
            adjustedScore: 0
        });
        return;
    }
    
    // Process sentiment words...
});
```

**Why Process All Tokens?**

1. **Python VADER Compatibility**: The original Python implementation includes all tokens in calculations
2. **Accurate pos/neg/neu Ratios**: The proportions are calculated based on all tokens:
   ```javascript
   const total = posSum + Math.abs(negSum) + neuCount;  // All tokens
   const pos = Math.abs(posSum / total);
   const neg = Math.abs(negSum / total);
   const neu = Math.abs(neuCount / total);
   ```

3. **Display Optimization**: While all tokens are processed internally, only sentiment-bearing words are shown in the detailed analysis for clarity

**Processing Example:**

Input: "I love this product"

Internal processing (all 4 tokens):
```
[
  {token: "I", score: 0, type: "neutral"},
  {token: "love", score: 3.2, type: "positive"},
  {token: "this", score: 0, type: "neutral"},
  {token: "product", score: 0, type: "neutral"}
]
```

Display (only sentiment words):
```
love: +3.2 (positive)
```
```

### 6.5 Emoji Processing (Optional)

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

