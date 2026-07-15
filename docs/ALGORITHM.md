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

**Rule**: For each sentiment word, if a negation word appears among the **preceding 3 tokens** (that are not themselves lexicon words), multiply the score by N_SCALAR

```javascript
// Negation word list (NEGATE in the reference implementation)
NEGATE = {
  "not", "never", "neither", "nor", "none", "nope", "nothing", "nowhere",
  "don't", "dont", "doesn't", "doesnt", "didn't", "didnt",
  "can't", "cant", "cannot", "won't", "wont", "couldn't", "couldnt",
  "isn't", "isnt", "wasn't", "wasnt", "weren't", "werent",
  "without", "rarely", "seldom", "despite", "uh-uh", ...
}
// In addition, any token containing "n't" acts as a negation.
```

**Application Method** (port of the reference `_negation_check`):

```
for startI from 0 to 2:                       // distance 1, 2, 3
    if i > startI and tokens[i-(startI+1)] not in LEXICON:
        if tokens[i-(startI+1)] is a negation word:
            V₁(wᵢ) = V(wᵢ) × N_SCALAR
```

**Parameter**:
- `N_SCALAR = -0.74`

**Why -0.74?**

Experiments in the paper found that a somewhat weaker inversion is more appropriate for social media text than simple reversal (×-1.0).

**Special cases** (all implemented, as in the reference):

- `"never so <word>"` / `"never this <word>"` — treated as emphasis (×1.25), not negation
- `"without doubt"` — not a negation
- `"no"` — not in the NEGATE list; instead, when "no" directly precedes a lexicon word (distance 1–2, or distance 3 followed by "or"/"nor"), that word is multiplied by N_SCALAR, and a "no" followed by a lexicon word contributes 0 itself
- `"least <word>"` — negates the following word (×N_SCALAR) unless preceded by "at" or "very"

**Example**:

```
"This is not very good"
Position: 0   1   2   3    4

"good" (position 4):
  distance 1: "very" → booster (+0.293)
  distance 2: "not"  → negation
  → V₁ = (1.9 + 0.293) × -0.74 = -1.623
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
            if prevToken is ALL CAPS and text has cap differential:
                scalar += C_INCR (sign-matched)
            
            // Distance decay
            if startI == 1:
                scalar *= 0.95  // 2 tokens back: 5% decay
            if startI == 2:
                scalar *= 0.90  // 3 tokens back: 10% decay
            
            V₂(wᵢ) = V₁(wᵢ) + scalar
```

Multiword dampeners such as "kind of" / "sort of" are also detected as bigrams
in the preceding tokens (reference `_special_idioms_check`).

**Theoretical Basis for Distance Decay**:

Closer boosters have stronger influence (linguistic proximity principle). The
booster immediately before the word applies at full strength (×1.00).

**Example**:

```
"This is very very good"
         ↑    ↑    ↑
   2 back   1 back  Sentiment word

1 back "very":  scalar = +0.293 × 1.00 = +0.293
2 back "very":  scalar = +0.293 × 0.95 = +0.278
Total: V₂ = 1.9 + 0.293 + 0.278 = 2.471
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

### 4.4 Punctuation Emphasis (Exclamation and Question Marks)

**Rule**: Exclamation and question marks anywhere in the text amplify the
**summed** sentiment (not individual words). The amplifier is added to the
total valence sum before normalization, in the direction of the sum's sign.

```javascript
// counted over the whole text, port of _punctuation_emphasis()
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

**Parameters**:
- Exclamation: `+0.292` each, maximum 4 (no additional effect beyond 4)
- Question marks: 2–3 marks: `+0.18` each; 4 or more: `+0.96` total

**Why limit to 4?**

Paper experiments found that 5 or more exclamation marks provide no additional effect.

**Example**:

```
"This is amazing!"      → punctEmphasis = 1 × 0.292 = +0.292
"This is amazing!!!"    → punctEmphasis = 3 × 0.292 = +0.876
"This is amazing!!!!!"  → punctEmphasis = 4 × 0.292 = +1.168 (ceiling)
"Really bad?? Really??" → punctEmphasis = 0.96 (4 question marks)
"Seriously???"          → punctEmphasis = 3 × 0.18 = +0.54
```

The same amplifier is also distributed to the larger of the positive/negative
sums when computing the pos/neu/neg proportions (see 5.3).

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
// port of _sift_sentiment_scores(): each positive token adds (score + 1),
// each negative token adds (score - 1). The ±1 compensates for neutral
// tokens, which each count as 1.
let posSum = 0, negSum = 0, neuCount = 0;

valences.forEach(v => {
    if (v > 0) posSum += v + 1;
    if (v < 0) negSum += v - 1;
    if (v === 0) neuCount++;
});

// punctuation emphasis is added to the dominant side
if (posSum > Math.abs(negSum))      posSum += punctEmphasis;
else if (posSum < Math.abs(negSum)) negSum -= punctEmphasis;

const total = posSum + Math.abs(negSum) + neuCount;
const pos = Math.abs(posSum / total);
const neg = Math.abs(negSum / total);
const neu = Math.abs(neuCount / total);
```

**Properties**:
- `pos + neg + neu ≈ 1.0`
- These represent **proportions** of sentiment words (independent from Compound)
- The `±1` per token matches the reference implementation exactly; without it the ratios would deviate from Python VADER

**Compound vs Pos/Neg/Neu**:

```
Example: "I love this. But I hate that."

Compound: -0.12 (overall slightly negative)
Pos: 0.45, Neg: 0.40, Neu: 0.15 (mixed positive and negative)
```

---

## 6. Implementation Details

### 6.1 Tokenization

Tokenization is identical to the reference implementation's `SentiText`:

```javascript
// 1. split on whitespace
// 2. strip leading/trailing punctuation from each chunk
// 3. if the stripped result has 2 or fewer characters, keep the original
//    chunk — it was likely an emoticon (":)" stripped would be "")
function stripPuncIfWord(token) {
    const stripped = stripPunctuation(token); // Python str.strip(string.punctuation)
    if (stripped.length <= 2) return token;
    return stripped;
}

function wordsAndEmoticons(text) {
    return text.trim().split(/\s+/).map(stripPuncIfWord);
}
```

**Tokenization Features**:
- Keeps contractions ("isn't") and most emoticons (":)", ":D", "<3") intact
- Trailing punctuation is removed from words ("good!" → "good"), so exclamation
  and question marks are handled at text level (see 4.4), not as tokens
- Emojis are converted to their textual descriptions *before* tokenization (see 6.5)

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

Rule application in VADER has **important ordering** (identical to the reference):

```
1. Convert emojis to text descriptions
2. Tokenization (whitespace split + punctuation strip)
3. For each token:
   a. Booster words and "kind of" themselves score 0 → next token
   b. Get lexicon score (V₀)
   c. "no" special handling
   d. ALL CAPS emphasis → V₁
   e. For each of the preceding 3 tokens (near to far):
      booster scalar (distance decay) → negation check → idiom check → V₂
   f. "least" check → V₃
4. Apply "but" adjustment to the whole token list (before ×0.5 / after ×1.5)
5. Sum all token scores, add punctuation emphasis, normalize → Compound Score
```

**Why this order?**

Multiplicative rules (negation, "but") are applied after additive ones
(ALL CAPS, boosters) so they scale the already-adjusted score, matching the
reference implementation.

### 6.4 Token Processing Strategy

**Important Note on Token Processing:**

The implementation processes **all tokens** in the input text, not just sentiment-bearing words:

```javascript
// Process ALL tokens for Python VADER compatibility (see vader.js analyze())
for (let i = 0; i < wordsAndEmoticons.length; i++) {
    // booster words and "kind of" themselves score 0
    // every other token gets its lexicon score (or 0) adjusted by the rules
    valences.push(valence);
}
```

**Why Process All Tokens?**

1. **Python VADER Compatibility**: The original Python implementation includes all tokens in calculations
2. **Accurate pos/neg/neu Ratios**: The proportions are calculated over all tokens (neutral tokens each count as 1 — see 5.3)
3. **Display Optimization**: While all tokens are processed internally, only tokens with a score or an applied rule are shown in the detailed analysis table for clarity

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

### 6.5 Emoji Processing (Optional)

Identical to the reference implementation: each emoji character in the input
text is replaced *inline* with its textual description **before** tokenization.
The description words then participate in the analysis as ordinary tokens
(including negation and booster interactions).

```javascript
// port of the emoji preprocessing in polarity_scores()
for (const ch of text) {           // iterate code points
    if (ch in emojiLexicon) {
        // e.g. 😊 → "smiling face with smiling eyes"
        output += (needsSpace ? ' ' : '') + emojiLexicon[ch];
    } else {
        output += ch;
    }
}
// analysis then runs on the emoji-free text
```

---

## Appendix: Parameter List

| Parameter | Value | Purpose |
|-----------|-------|---------|
| N_SCALAR | -0.74 | Negation intensity |
| B_INCR / B_DECR | ±0.293 | Booster increment/decrement |
| C_INCR | 0.733 | ALL CAPS emphasis |
| Exclamation emphasis | 0.292 each (max 4) | Text-level amplifier |
| Question mark emphasis | 2–3: 0.18 each; 4+: 0.96 | Text-level amplifier |
| α | 15 | Normalization smoothing |
| Negation range | 3 tokens | Preceding check range |
| Booster range | 3 tokens | Preceding check range |
| 2 tokens back decay | ×0.95 | Booster distance decay |
| 3 tokens back decay | ×0.90 | Booster distance decay |
| "never so/this" | ×1.25 | Emphasis special case |
| Before "but" | ×0.5 | Score attenuation |
| After "but" | ×1.5 | Score emphasis |

---

## Reference

Hutto, C.J. & Gilbert, E.E. (2014). VADER: A Parsimonious Rule-based Model for Sentiment Analysis of Social Media Text. *Eighth International Conference on Weblogs and Social Media (ICWSM-14)*. Ann Arbor, MI, June 2014.

---

