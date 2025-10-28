# VADER Lexicon Details

**English** | [日本語](#日本語版)

---

## Table of Contents

- [Overview](#overview)
- [Main Lexicon Structure](#main-lexicon-structure)
- [Emoji Lexicon](#emoji-lexicon)
- [Annotation Methodology](#annotation-methodology)
- [Statistical Properties](#statistical-properties)
- [Quality Assurance](#quality-assurance)
- [Interpreting the Lexicon](#interpreting-the-lexicon)
- [Usage Notes](#usage-notes)
- [References](#references)
- [Appendix: How to Obtain the Lexicon](#appendix-how-to-obtain-the-lexicon)

---

## Overview

VADER provides two lexicons:

1. **Main Lexicon (vader_lexicon.txt)**: Approximately 7,500 lexical items
2. **Emoji Lexicon (emoji_utf8_lexicon.txt)**: Approximately 3,000 emoji mappings

### Main Lexicon Characteristics

The VADER lexicon is a human-rated sentiment dictionary containing sentiment scores for approximately 7,500 lexical items (words, phrases, symbols, emoticons). Each item was rated on a 9-point scale from -4 (extremely negative) to +4 (extremely positive) by multiple independent raters through crowdsourcing.

**Key Characteristics:**

- **Scale**: Approximately 7,500 items
- **Rating Range**: -4.0 to +4.0
- **Raters per Item**: Typically 10 raters
- **Year of Construction**: 2014
- **Target Language**: English

### Emoji Lexicon Characteristics

The emoji lexicon maps Unicode emojis to English text descriptions. These descriptions are analyzed using the main lexicon to derive sentiment scores for emojis.

**Key Characteristics:**

- **Scale**: Approximately 3,000 emojis
- **Format**: Emoji → text description mapping
- **Coverage**: Major emojis in the Unicode standard
- **Updates**: Can be updated as Unicode expands

---

## Main Lexicon Structure

### File Format

The VADER lexicon is provided as a tab-separated values (TSV) text file. Each line represents one lexical item and consists of four fields:

```
token[TAB]mean_score[TAB]std_dev[TAB][rating_list]
```

### Field Details

#### 1. Token

The lexical item expressing sentiment. Includes the following types:

- **Common Words**: happy, sad, angry, excellent
- **Slang**: awesome, sucks, lol
- **Phrases**: "kind of", "sort of"
- **Symbols and Emoticons**: :), :(, :-D, :-(
- **Emphatic Expressions**: very, extremely, absolutely
- **Negation Words**: not, never, no

#### 2. Mean Score

The average of ratings from multiple raters.

- **Range**: -4.0 (most negative) to +4.0 (most positive)
- **Precision**: 2 decimal places
- **Interpretation**:
  - **+3.0 to +4.0**: Extremely positive
  - **+1.5 to +2.9**: Very positive
  - **+0.5 to +1.4**: Moderately positive
  - **-0.5 to +0.5**: Neutral
  - **-1.4 to -0.5**: Moderately negative
  - **-2.9 to -1.5**: Very negative
  - **-4.0 to -3.0**: Extremely negative

#### 3. Standard Deviation

An indicator of rating variability.

- **Range**: 0.0 to approximately 3.5
- **Interpretation**:
  - **Low (< 1.0)**: High agreement among raters
  - **Moderate (1.0-2.0)**: Some variability
  - **High (> 2.0)**: Substantial disagreement

#### 4. Rating List

Individual rating values from each rater in array format.

- **Format**: `[r1, r2, r3, ..., r10]`
- **Number of Elements**: Typically 10
- **Range of Elements**: -4 to +4

### Concrete Examples

#### Example 1: Word with High Agreement

```
excellent	3.2	0.4	[3, 3, 4, 3, 3, 3, 4, 3, 3, 3]
```

**Interpretation**: "excellent" is an extremely positive word with high agreement among raters (standard deviation 0.4). All raters evaluated it as +3 or +4.

#### Example 2: Word with Divided Opinions

```
ambitious	1.5	1.8	[3, 0, 2, -1, 4, 1, 0, 3, 2, 1]
```

**Interpretation**: "ambitious" is moderately positive on average, but opinions are significantly divided among raters (standard deviation 1.8). This is a word whose interpretation varies with context and personal values.

#### Example 3: Negative Sentiment Word

```
angry	-2.3	0.9	[-2, -2, -1, -3, -1, -3, -4, -2, -3, -3]
```

**Interpretation**: "angry" is a considerably negative word, and all raters judged it as negative. The standard deviation of 0.9 indicates some variability in the intensity of negativity.

#### Example 4: Emoticon

```
:)	2.2	0.9	[2, 3, 2, 2, 2, 1, 3, 2, 2, 3]
```

**Interpretation**: The smiley emoticon is rated as a symbol expressing considerably positive emotion.

---

## Emoji Lexicon

### Overview

The emoji lexicon (emoji_utf8_lexicon.txt) maps Unicode emojis to English text descriptions, enabling sentiment analysis of texts containing emojis.

### File Format

Tab-separated format with the following structure per line:

```
emoji[TAB]description
```

### Concrete Examples

```
😀	grinning face
😊	smiling face with smiling eyes
😂	face with tears of joy
😢	crying face
😡	pouting face
❤️	red heart
👍	thumbs up
👎	thumbs down
🎉	party popper
🌟	glowing star
```

### Sentiment Score Calculation Method

Emoji sentiment scores are calculated through the following process:

```
Step 1: Retrieve emoji description
  😊 → "smiling face with smiling eyes"

Step 2: Split description into words
  ["smiling", "face", "with", "smiling", "eyes"]

Step 3: Look up each word in the main lexicon
  "smiling" → +2.7 (score from main lexicon)
  "face" → 0.0 (neutral)
  "with" → 0.0 (neutral)
  "eyes" → 0.0 (neutral)

Step 4: Sum the scores of matched words
  Total score = 2.7 + 2.7 = 5.4
  
Step 5: Apply grammar rules as needed
  (negation, emphasis, etc.)
```

### Emoji Categories

The emoji lexicon covers the following categories:

| Category | Examples | Description |
|----------|----------|-------------|
| **Faces & Emotions** | 😀😊😂😢😡 | Direct emotional expression |
| **Gestures** | 👍👎👏🙏 | Emotional expression through actions |
| **Hearts & Love** | ❤️💕💔 | Affection and fondness |
| **Celebrations** | 🎉🎊🎈🎁 | Positive events |
| **Nature & Weather** | ☀️⛈️🌈⭐ | Mood and atmosphere |
| **Food** | 🍕🍰🍺🍷 | Preference and satisfaction |
| **Animals** | 🐶🐱🐻 | Character-like emotions |

### Emoji Sentiment Score Distribution

Emoji sentiment scores generally show the following tendencies:

| Score Range | Percentage (Approx.) | Representative Emojis |
|-------------|---------------------|----------------------|
| ≥ +2.0 | ~40% | 😊😍🎉❤️👍 |
| +0.5 to +1.9 | ~35% | 🙂😌🌸🍕 |
| -0.5 to +0.5 | ~15% | 😐🤔 |
| < -0.5 | ~10% | 😢😡💔👎 |

**Characteristics:**

- Emojis have an overall positive-leaning distribution
- Reflects usage trends on social media
- Negative emojis are relatively few

### Handling Multiple Emojis

When multiple emojis appear consecutively:

```
Example: "I love this! 😊🎉❤️"

Individual scores:
😊 (smiling face) → +2.7
🎉 (party popper) → +3.1
❤️ (red heart) → +3.3

Total: +9.1 (very strong positive sentiment)
```

### Emojis and Grammar Rules

Emojis are also affected by grammar rules like other words:

#### Negation Effect

```
"I'm not happy 😊"

"not" → negation word
😊 score: +2.7 → -2.0 (negation effect ×-0.74)
```

#### Context Adjustment

```
"The food was okay but the service was great 👍"

👍 after "but" → emphasized (×1.5)
```

### Limitations of Emoji Lexicon

#### 1. Cultural Differences

The same emoji may be interpreted differently across cultures. For example, 🙏 can be interpreted as either prayer or gratitude.

#### 2. Compound Meanings

Combinations of multiple emojis can create new meanings. For example: 👀 + 👀 = stronger attention.

#### 3. Context Dependency

When used ironically or jokingly, literal interpretation is inappropriate. For example: "Worst experience ever 😂" (expressing complaints while laughing).

#### 4. Need for Updates

New emojis and usage patterns constantly emerge. Regular updates to the lexicon are desirable.

---

## Annotation Methodology

### Rating Protocol

#### Rating Task Design

Raters were given the following instructions:

> "Rate how positive or negative this word/phrase/symbol is in expressing sentiment. Rate based on general interpretation, independent of context."

#### Rating Scale

| Score | Label | Description |
|-------|-------|-------------|
| +4 | Extremely Positive | Extremely strong positive sentiment |
| +3 | Very Positive | Very strong positive sentiment |
| +2 | Positive | Clear positive sentiment |
| +1 | Slightly Positive | Slight positive sentiment |
| 0 | Neutral | Emotionally neutral |
| -1 | Slightly Negative | Slight negative sentiment |
| -2 | Negative | Clear negative sentiment |
| -3 | Very Negative | Very strong negative sentiment |
| -4 | Extremely Negative | Extremely strong negative sentiment |

### Crowdsourcing Process

#### 1. Rater Recruitment and Selection

- **Platform**: Amazon Mechanical Turk (AMT)
- **Target Population**: 
  - Native English speakers
  - Age 18 or above
  - Passed preliminary quality test
- **Compensation**: Appropriate compensation per task

#### 2. Quality Control Mechanisms

**a) Pre-test**

Pre-test using known sentiment words. Only raters meeting certain standards were employed.

**b) Gold Standard Items**

Words with clear ratings were included in each task. Data from raters with inappropriate ratings on these were excluded.

**c) Response Time Monitoring**

Detection of extremely short response times. Exclusion of raters with possible random responses.

**d) Consistency Check**

Verification of rating consistency among words with similar meanings. Detection of contradictory rating patterns.

#### 3. Data Collection Process

```
Step 1: Initial rating collection
  ↓ Collect ratings from 10+ raters for each item
Step 2: Quality check
  ↓ Verify ratings on gold standard items
Step 3: Outlier exclusion
  ↓ Exclude ratings more than 2σ from mean (optional)
Step 4: Calculate statistics
  ↓ Calculate mean and standard deviation
Step 5: Add to lexicon
  ↓ Add item to final lexicon file
```

---

## Statistical Properties

### Main Lexicon Distribution

The sentiment score distribution of the VADER lexicon has the following characteristics:

| Statistic | Value |
|-----------|-------|
| Total Items | ~7,500 |
| Mean Score | Approximately -0.18 (slightly negative-leaning) |
| Standard Deviation | Approximately 2.1 |
| Minimum | -4.0 |
| Maximum | +4.0 |
| Median | Approximately -0.1 |

### Distribution by Category

#### Classification by Polarity

| Category | Count (Approx.) | Percentage |
|----------|----------------|------------|
| Positive (> +0.5) | ~3,300 | ~44% |
| Neutral (-0.5 to +0.5) | ~300 | ~4% |
| Negative (< -0.5) | ~3,900 | ~52% |

**Note**: The slight predominance of negative vocabulary may reflect human attentional bias toward negative information.

#### Distribution of Standard Deviation

| Std Dev Range | Count (Approx.) | Interpretation |
|---------------|----------------|----------------|
| 0.0 to 0.5 | ~2,500 | Extremely high agreement |
| 0.5 to 1.0 | ~3,000 | High agreement |
| 1.0 to 1.5 | ~1,500 | Moderate agreement |
| 1.5 to 2.0 | ~400 | Somewhat low agreement |
| > 2.0 | ~100 | Low agreement |

### Characteristics by Token Type

#### 1. Common Sentiment Words

**Examples**: happy (+2.8), sad (-2.1), good (+1.9), bad (-2.5)

**Characteristics**:

- Low standard deviation (typically < 1.0)
- Clear polarity
- Basic vocabulary acquired in early language learning

#### 2. Slang

**Examples**: awesome (+3.1), sucks (-2.3), cool (+1.7)

**Characteristics**:

- Tend to express strong emotions
- Possible differences in interpretation by generation or culture
- Somewhat higher standard deviation (0.8-1.5)

#### 3. Symbols and Emoticons

**Examples**: :) (+2.2), :( (-2.2), :-D (+2.9)

**Characteristics**:

- Clear emotional expression
- Frequently used on social media
- Low to moderate standard deviation (0.5-1.0)

#### 4. Emojis (via Emoji Lexicon)

**Examples**: 😊 (~+2.7), 😢 (~-2.5), ❤️ (~+3.3)

**Characteristics**:

- Direct visual representation of emotion
- Popular with younger users and mobile users
- Calculated via main lexicon, so dependent on description quality

#### 5. Context-Dependent Words

**Examples**: ambitious (+1.5, σ=1.8), competitive (+0.8, σ=1.9)

**Characteristics**:

- High standard deviation (> 1.5)
- Interpretation varies greatly with context of use
- Dependent on cultural and personal values

---

## Quality Assurance

### Reliability Metrics

#### Inter-Rater Agreement

Inter-rater agreement across the lexicon is measured using the following metrics:

| Metric | Value | Interpretation |
|--------|-------|----------------|
| Krippendorff's α | 0.84 | High agreement |
| Mean Std Dev | 0.95 | Generally good agreement |
| ICC (Intraclass Correlation) | 0.87 | High reliability |

### Validity Verification

#### 1. Construct Validity

**Correlation with Existing Lexicons**:

- AFINN (Nielsen, 2011): r = 0.91
- SentiWordNet (Baccianella et al., 2010): r = 0.78
- General Inquirer (Stone et al., 1966): r = 0.85

#### 2. Criterion Validity

**Agreement with Human Judgments**:

- Correlation on independent test set: r = 0.88
- F1 score (3-class classification): 0.96

#### 3. Content Validity

Expert review conducted by linguists and psychologists. Verified comprehensive coverage of diverse sentiment expression categories.

### Limitations and Areas for Improvement

#### 1. Temporal Constraints

- **Issue**: Based on language use as of 2014
- **Impact**: May not cover new slang, memes, trending words, or emojis
- **Mitigation**: Regular updates are desirable but not currently implemented

#### 2. Cultural and Regional Bias

- **Issue**: Ratings primarily from North American English speakers
- **Impact**: May differ from interpretations in other English-speaking regions (UK, Australia, etc.)
- **Mitigation**: Adjustments needed based on usage domain

#### 3. Handling of Context Dependency

- **Issue**: Assumes context-independent rating
- **Impact**: Words and emojis exist whose meaning changes with context in actual use
- **Mitigation**: Adjustment through grammatical and pragmatic rules in algorithm

#### 4. Emoji Interpretation

- **Issue**: Dependent on quality of emoji descriptions
- **Impact**: Incorrect scores calculated when description is inappropriate
- **Mitigation**: Continuous improvement of emoji lexicon

---

## Interpreting the Lexicon

### Guidelines for Interpreting Mean Scores

#### Magnitude of Absolute Value

| Absolute Value | Intensity | Usage Examples |
|----------------|-----------|----------------|
| 3.0 to 4.0 | Very Strong | excellent, terrible, fantastic, horrible, 😍, 💔 |
| 2.0 to 2.9 | Strong | good, bad, happy, sad, 😊, 😢 |
| 1.0 to 1.9 | Moderate | nice, dislike, pleasant, unpleasant, 🙂 |
| 0.5 to 0.9 | Weak | okay, meh, somewhat, slightly |
| 0.0 to 0.4 | Very Weak | neutral, indifferent, ambivalent, 😐 |

### Guidelines for Interpreting Standard Deviation

#### Degree of Agreement

**Low Std Dev (< 1.0)**

- **Meaning**: Universal emotional expression
- **Characteristics**:
  - Consistent interpretation across cultures and generations
  - Common in basic emotion words and clear emojis
  - Clearly defined in education and dictionaries
- **Examples**: love (σ=0.6), hate (σ=0.7), happy (σ=0.5), 😊, ❤️

**Medium Std Dev (1.0-2.0)**

- **Meaning**: Some range of interpretation
- **Characteristics**:
  - Interpretation varies with context and personal experience
  - Nuanced expressions
- **Examples**: interesting (σ=1.2), unique (σ=1.4)

**High Std Dev (> 2.0)**

- **Meaning**: Ratings are significantly divided
- **Characteristics**:
  - Strongly dependent on values and standpoint
  - Potentially controversial culturally or politically
  - Caution needed in use
- **Examples**: ambitious (σ=1.8), competitive (σ=1.9), aggressive (σ=2.1)

### Utilizing Individual Rating Lists

Individual rating lists are useful for the following analyses:

#### 1. Visualizing Rating Distribution

```
Example: ambitious [3, 0, 2, -1, 4, 1, 0, 3, 2, 1]

Distribution:
+4: █ (1 rater)
+3: ██ (2 raters)
+2: ██ (2 raters)
+1: ██ (2 raters)
 0: ██ (2 raters)
-1: █ (1 rater)
```

This distribution shows that "ambitious" has a bimodal rating distribution.

#### 2. Detecting Outliers

For items with high standard deviation, examining individual ratings can detect bias or errors from specific raters.

#### 3. Subgroup Analysis

When rater attributes (age, region, etc.) are known, differences between subgroups can be analyzed from individual ratings.

---

## Usage Notes

### Appropriate Use of the Lexicon

#### Recommended Use Cases

**1. Social Media Analysis**

- Short texts on Twitter, Facebook, Reddit, etc.
- UGC (User Generated Content) containing informal expressions and emojis

**2. Product Review Analysis**

- Reviews on online shopping sites
- App store rating comments

**3. Customer Feedback Analysis**

- Sentiment analysis of support tickets
- Free-text survey responses

**4. Chat & Messaging Analysis**

- Customer support chat
- Social messaging (where emojis are frequently used)

#### Cases Requiring Caution

**1. Formal Writing**

- Academic papers, business documents
- Legal documents, official statements
- **Reason**: VADER is optimized for informal expressions

**2. Domain-Specific Terminology**

- Technical terms in medical, legal, technical fields
- **Reason**: Not covered by general lexicon

**3. Other Languages**

- Texts in languages other than English
- **Reason**: Designed exclusively for English

**4. Irony and Sarcasm**

- "Great, another Monday!" (ironic)
- "Love this bug 🐛😂" (joking)
- **Reason**: Context-dependent interpretation required

**5. Complex Emoji Usage**

- Ironic or joking use of emojis
- Culture-specific emoji interpretations
- **Mitigation**: Context-aware interpretation of results needed

### Lexicon Usage in This Tool

**Tool Functionality:**

This tool uses the original VADER lexicon files (vader_lexicon.txt and emoji_utf8_lexicon.txt) as-is. The tool does not provide functionality to edit or customize the lexicon within the interface.

**Usage:**

1. Download original lexicon files from GitHub
2. Open tool in browser
3. Upload lexicon files
4. Analyze text

**Limitations:**

- Cannot add or edit lexicon entries
- Cannot make domain-specific adjustments
- Cannot modify scores

---

## References

### Primary References

**Hutto, C. J., & Gilbert, E. (2014).** VADER: A Parsimonious Rule-based Model for Sentiment Analysis of Social Media Text. *Proceedings of the International AAAI Conference on Web and Social Media*, 8(1), 216-225.

### Related Lexicons

**Nielsen, F. Å. (2011).** A New ANEW: Evaluation of a Word List for Sentiment Analysis in Microblogs. *Proceedings of the ESWC2011 Workshop on 'Making Sense of Microposts'*, 93-98.

**Baccianella, S., Esuli, A., & Sebastiani, F. (2010).** SentiWordNet 3.0: An Enhanced Lexical Resource for Sentiment Analysis and Opinion Mining. *Proceedings of the Seventh International Conference on Language Resources and Evaluation (LREC'10)*.

**Stone, P. J., Dunphy, D. C., & Smith, M. S. (1966).** The General Inquirer: A Computer Approach to Content Analysis. *MIT Press*.

### Crowdsourcing Methodology

**Snow, R., O'Connor, B., Jurafsky, D., & Ng, A. Y. (2008).** Cheap and Fast—But is it Good?: Evaluating Non-Expert Annotations for Natural Language Tasks. *Proceedings of the Conference on Empirical Methods in Natural Language Processing*, 254-263.

**Mohammad, S. M., & Turney, P. D. (2013).** Crowdsourcing a Word-Emotion Association Lexicon. *Computational Intelligence*, 29(3), 436-465.

### Emoji Research

**Novak, P. K., Smailović, J., Sluban, B., & Mozetič, I. (2015).** Sentiment of Emojis. *PLOS ONE*, 10(12), e0144296.

**Rodrigues, D., Prada, M., Gaspar, R., Garrido, M. V., & Lopes, D. (2018).** Lisbon Emoji and Emoticon Database (LEED): Norms for emoji and emoticons in seven evaluative dimensions. *Behavior Research Methods*, 50(1), 392-405.

---

## Appendix: How to Obtain the Lexicon

### Official Repository

The VADER lexicon and related files can be obtained from the following GitHub repository:

**URL**: https://github.com/cjhutto/vaderSentiment

### File Paths

#### Main Lexicon

```
vaderSentiment/vader_lexicon.txt
```

**Direct Link**:
```
https://raw.githubusercontent.com/cjhutto/vaderSentiment/master/vaderSentiment/vader_lexicon.txt
```

#### Emoji Lexicon

```
vaderSentiment/emoji_utf8_lexicon.txt
```

**Direct Link**:
```
https://raw.githubusercontent.com/cjhutto/vaderSentiment/master/vaderSentiment/emoji_utf8_lexicon.txt
```

### License

The VADER lexicon and related files are distributed under the MIT License.

### Citation Requirements

When using the lexicon, always cite the original paper:

```bibtex
@inproceedings{hutto2014vader,
  title={VADER: A parsimonious rule-based model for sentiment analysis of social media text},
  author={Hutto, Clayton J and Gilbert, Eric},
  booktitle={Proceedings of the International AAAI Conference on Web and Social Media},
  volume={8},
  number={1},
  pages={216--225},
  year={2014}
}
```

---

**Document Version**: 2.0  
**Last Updated**: 2025  
**Author**: Nozomi Sawada

This document is supplementary material created to deepen understanding of the VADER lexicon and its extension, the emoji lexicon.

---

# 日本語版

## 目次

- [概要](#概要)
- [メインレキシコンの構造](#メインレキシコンの構造)
- [絵文字レキシコン](#絵文字レキシコン)
- [アノテーション方法論](#アノテーション方法論)
- [統計的特性](#統計的特性)
- [品質保証](#品質保証)
- [レキシコンの解釈](#レキシコンの解釈)
- [使用上の注意](#使用上の注意)
- [参考文献](#参考文献-1)
- [付録: レキシコンの取得方法](#付録-レキシコンの取得方法)

---

## 概要

VADERは2つのレキシコンを提供します：

1. **メインレキシコン (vader_lexicon.txt)**: 約7,500の語彙項目
2. **絵文字レキシコン (emoji_utf8_lexicon.txt)**: 約3,000の絵文字マッピング

### メインレキシコンの特徴

VADERレキシコンは、約7,500の語彙項目（単語、フレーズ、記号、顔文字）に対する感情スコアを含む、人間評価に基づく感情辞書です。各項目は、クラウドソーシングによる複数の独立した評価者によって-4（極めてネガティブ）から+4（極めてポジティブ）の9段階で評価されています。

**主要特性:**

- **規模**: 約7,500項目
- **評価範囲**: -4.0 ～ +4.0
- **評価者数**: 通常10名
- **構築年**: 2014
- **対象言語**: 英語

### 絵文字レキシコンの特徴

絵文字レキシコンは、Unicode絵文字を英語の説明文にマッピングする辞書です。この説明文をメインレキシコンで分析することで、絵文字の感情スコアを算出します。

**主要特性:**

- **規模**: 約3,000の絵文字
- **形式**: 絵文字 → 説明文のマッピング
- **対象**: Unicode標準の主要な絵文字
- **更新**: Unicode規格の拡張に応じて更新可能

---

## メインレキシコンの構造

### ファイル形式

VADERレキシコンは、タブ区切り（TSV）形式のテキストファイルとして提供されます。各行は1つの語彙項目を表し、以下の4つのフィールドで構成されます。

```
token[TAB]mean_score[TAB]std_dev[TAB][rating_list]
```

### フィールドの詳細

#### 1. トークン

感情を表す語彙項目。以下の種類を含みます：

- **一般的な単語**: happy, sad, angry, excellent
- **スラング**: awesome, sucks, lol
- **フレーズ**: "kind of", "sort of"
- **記号・顔文字**: :), :(, :-D, :-(
- **強調表現**: very, extremely, absolutely
- **否定語**: not, never, no

#### 2. 平均スコア

複数の評価者による評価の平均値。

- **範囲**: -4.0（最もネガティブ）～ +4.0（最もポジティブ）
- **精度**: 小数点以下2桁
- **解釈**:
  - **+3.0 ～ +4.0**: 極めてポジティブ
  - **+1.5 ～ +2.9**: かなりポジティブ
  - **+0.5 ～ +1.4**: ややポジティブ
  - **-0.5 ～ +0.5**: 中立
  - **-1.4 ～ -0.5**: ややネガティブ
  - **-2.9 ～ -1.5**: かなりネガティブ
  - **-4.0 ～ -3.0**: 極めてネガティブ

#### 3. 標準偏差

評価のばらつきを示す指標。

- **範囲**: 0.0 ～ 約3.5
- **解釈**:
  - **低い（< 1.0）**: 評価者間で高い一致
  - **中程度（1.0～2.0）**: 一定のばらつき
  - **高い（> 2.0）**: 評価が大きく分かれる

#### 4. 個別評価リスト

各評価者の個別評価値を配列形式で記録。

- **形式**: `[r1, r2, r3, ..., r10]`
- **要素数**: 通常10個
- **各要素の範囲**: -4 ～ +4

### 具体例

#### 例1: 高い一致度を示す単語

```
excellent	3.2	0.4	[3, 3, 4, 3, 3, 3, 4, 3, 3, 3]
```

**解釈**: "excellent"は極めてポジティブな単語であり、評価者間で高い一致が見られます（標準偏差0.4）。すべての評価者が+3または+4と評価しています。

#### 例2: 意見が分かれる単語

```
ambitious	1.5	1.8	[3, 0, 2, -1, 4, 1, 0, 3, 2, 1]
```

**解釈**: "ambitious"は平均的にはややポジティブですが、評価者間で意見が大きく分かれます（標準偏差1.8）。文脈や個人の価値観によって解釈が異なる単語です。

#### 例3: ネガティブな感情語

```
angry	-2.3	0.9	[-2, -2, -1, -3, -1, -3, -4, -2, -3, -3]
```

**解釈**: "angry"はかなりネガティブな単語で、すべての評価者がネガティブと判断しています。標準偏差0.9は、ネガティブの強度について若干のばらつきがあることを示します。

#### 例4: 顔文字

```
:)	2.2	0.9	[2, 3, 2, 2, 2, 1, 3, 2, 2, 3]
```

**解釈**: スマイリー顔文字は、かなりポジティブな感情を表現する記号として評価されています。

---

## 絵文字レキシコン

### 概要

絵文字レキシコン（emoji_utf8_lexicon.txt）は、Unicode絵文字を英語の説明文にマッピングするファイルで、絵文字を含むテキストの感情分析が可能になります。

### ファイル形式

タブ区切り形式で、各行は以下の構造：

```
emoji[TAB]description
```

### 具体例

```
😀	grinning face
😊	smiling face with smiling eyes
😂	face with tears of joy
😢	crying face
😡	pouting face
❤️	red heart
👍	thumbs up
👎	thumbs down
🎉	party popper
🌟	glowing star
```

### 感情スコアの算出方法

絵文字の感情スコアは、以下の手順で算出されます：

```
ステップ1: 絵文字の説明文を取得
  😊 → "smiling face with smiling eyes"

ステップ2: 説明文を単語に分割
  ["smiling", "face", "with", "smiling", "eyes"]

ステップ3: 各単語をメインレキシコンで検索
  "smiling" → +2.7 (メインレキシコンのスコア)
  "face" → 0.0 (中立)
  "with" → 0.0 (中立)
  "eyes" → 0.0 (中立)

ステップ4: マッチした単語のスコアを合計
  合計スコア = 2.7 + 2.7 = 5.4
  
ステップ5: 必要に応じて文法ルールを適用
  (否定、強調など)
```

### 絵文字のカテゴリ

絵文字レキシコンは以下のカテゴリをカバーしています：

| カテゴリ | 例 | 説明 |
|---------|---|------|
| **顔・表情** | 😀😊😂😢😡 | 感情を直接表現 |
| **ジェスチャー** | 👍👎👏🙏 | 動作による感情表現 |
| **ハート・愛** | ❤️💕💔 | 愛情や好意 |
| **祝祭・イベント** | 🎉🎊🎈🎁 | ポジティブなイベント |
| **自然・天気** | ☀️⛈️🌈⭐ | 気分や雰囲気 |
| **食べ物** | 🍕🍰🍺🍷 | 好みや満足感 |
| **動物** | 🐶🐱🐻 | キャラクター的な感情 |

### 絵文字の感情スコア分布

絵文字の感情スコアは、一般的に以下の傾向があります：

| スコア範囲 | 割合（概算） | 代表的な絵文字 |
|-----------|------------|---------------|
| +2.0 以上 | ~40% | 😊😍🎉❤️👍 |
| +0.5 ～ +1.9 | ~35% | 🙂😌🌸🍕 |
| -0.5 ～ +0.5 | ~15% | 😐🤔 |
| < -0.5 | ~10% | 😢😡💔👎 |

**特徴:**

- 絵文字は全体的にポジティブ寄りの分布
- ソーシャルメディアでの使用傾向を反映
- ネガティブな絵文字は比較的少数

### 複数絵文字の処理

複数の絵文字が連続する場合：

```
例: "I love this! 😊🎉❤️"

個別スコア:
😊 (smiling face) → +2.7
🎉 (party popper) → +3.1
❤️ (red heart) → +3.3

合計: +9.1 (非常に強いポジティブ感情)
```

### 絵文字と文法ルール

絵文字も他の単語と同様に文法ルールの影響を受けます：

#### 否定の影響

```
"I'm not happy 😊"

"not" → 否定語
😊 のスコア: +2.7 → -2.0 (否定効果 ×-0.74)
```

#### 文脈調整

```
"The food was okay but the service was great 👍"

"but"より後の 👍 → 強調される (×1.5)
```

### 絵文字レキシコンの制限事項

#### 1. 文化的差異

同じ絵文字でも文化圏によって解釈が異なる場合があります。例：🙏 は祈りとも感謝とも解釈されます。

#### 2. 複合的な意味

複数の絵文字の組み合わせで新しい意味が生まれます。例：👀 + 👀 = より強い注目。

#### 3. 文脈依存性

皮肉や冗談で使われる場合、文字通りの解釈は不適切です。例：「最悪だった😂」（笑いながら不満を表現）。

#### 4. 更新の必要性

新しい絵文字や使い方が常に登場します。レキシコンの定期的な更新が望ましいです。

---

## アノテーション方法論

### 評価プロトコル

#### 評価タスクの設計

評価者には以下の指示が与えられました：

> "この単語・フレーズ・記号が、どの程度ポジティブまたはネガティブな感情を表現しているかを評価してください。文脈に依存せず、一般的な解釈に基づいて評価してください。"

#### 評価尺度

| スコア | ラベル | 説明 |
|-------|-------|------|
| +4 | 極めてポジティブ | 極めて強いポジティブ感情 |
| +3 | 非常にポジティブ | 非常に強いポジティブ感情 |
| +2 | ポジティブ | 明確なポジティブ感情 |
| +1 | わずかにポジティブ | わずかなポジティブ感情 |
| 0 | 中立 | 感情的に中立 |
| -1 | わずかにネガティブ | わずかなネガティブ感情 |
| -2 | ネガティブ | 明確なネガティブ感情 |
| -3 | 非常にネガティブ | 非常に強いネガティブ感情 |
| -4 | 極めてネガティブ | 極めて強いネガティブ感情 |

### クラウドソーシングプロセス

#### 1. 評価者の募集と選定

- **プラットフォーム**: Amazon Mechanical Turk (AMT)
- **対象者**: 
  - 英語ネイティブスピーカー
  - 18歳以上
  - 事前の品質テストに合格
- **報酬**: タスクごとの適切な報酬

#### 2. 品質管理メカニズム

**a) 事前テスト**

既知の感情語を用いた評価テスト。一定の基準を満たした評価者のみを採用。

**b) ゴールドスタンダード項目**

評価が明確な単語を各タスクに混入。これらの評価が不適切な評価者のデータを除外。

**c) 評価時間の監視**

極端に短い回答時間の検出。ランダム回答の可能性がある評価者の除外。

**d) 一貫性チェック**

同様の意味を持つ単語間での評価の一貫性確認。矛盾する評価パターンの検出。

#### 3. データ収集プロセス

```
ステップ1: 初期評価収集
  ↓ 各項目について10名以上の評価者から評価を収集
ステップ2: 品質チェック
  ↓ ゴールドスタンダード項目での評価を確認
ステップ3: 外れ値の除外
  ↓ 平均値から2σ以上離れた評価を除外（オプション）
ステップ4: 統計値の計算
  ↓ 平均値と標準偏差を計算
ステップ5: レキシコンへの追加
  ↓ 最終的なレキシコンファイルに項目を追加
```

---

## 統計的特性

### メインレキシコンの分布

VADERレキシコンの感情スコア分布は以下の特性を持ちます：

| 統計量 | 値 |
|-------|---|
| 総項目数 | ~7,500 |
| 平均スコア | 約-0.18（わずかにネガティブ寄り） |
| 標準偏差 | 約2.1 |
| 最小値 | -4.0 |
| 最大値 | +4.0 |
| 中央値 | 約-0.1 |

### カテゴリ別分布

#### 極性による分類

| カテゴリ | 項目数（概算） | 割合 |
|---------|--------------|------|
| ポジティブ（> +0.5） | ~3,300 | ~44% |
| 中立（-0.5 ～ +0.5） | ~300 | ~4% |
| ネガティブ（< -0.5） | ~3,900 | ~52% |

**注**: ネガティブな語彙がわずかに多いのは、人間のネガティブ情報への注意バイアスを反映している可能性があります。

#### 標準偏差の分布

| 標準偏差範囲 | 項目数（概算） | 解釈 |
|------------|--------------|------|
| 0.0 ～ 0.5 | ~2,500 | 極めて高い一致 |
| 0.5 ～ 1.0 | ~3,000 | 高い一致 |
| 1.0 ～ 1.5 | ~1,500 | 中程度の一致 |
| 1.5 ～ 2.0 | ~400 | やや低い一致 |
| 2.0 以上 | ~100 | 低い一致 |

### トークンタイプ別の特性

#### 1. 一般的な感情語

**例**: happy (+2.8), sad (-2.1), good (+1.9), bad (-2.5)

**特徴**:

- 標準偏差が低い（通常< 1.0）
- 極性が明確
- 言語学習の早期段階で習得される基本語彙

#### 2. スラング

**例**: awesome (+3.1), sucks (-2.3), cool (+1.7)

**特徴**:

- 強い感情を表現する傾向
- 世代や文化による解釈の違いが存在する可能性
- 標準偏差はやや高め（0.8～1.5）

#### 3. 記号・顔文字

**例**: :) (+2.2), :( (-2.2), :-D (+2.9)

**特徴**:

- 明確な感情表現
- ソーシャルメディアで頻繁に使用
- 標準偏差は低～中程度（0.5～1.0）

#### 4. 絵文字（絵文字レキシコン経由）

**例**: 😊 (~+2.7), 😢 (~-2.5), ❤️ (~+3.3)

**特徴**:

- 感情の直接的な視覚表現
- 若年層やモバイルユーザーに人気
- メインレキシコン経由で算出されるため、説明文の質に依存

#### 5. 文脈依存的な単語

**例**: ambitious (+1.5, σ=1.8), competitive (+0.8, σ=1.9)

**特徴**:

- 標準偏差が高い（> 1.5）
- 使用文脈によって解釈が大きく異なる
- 文化的・個人的価値観に依存

---

## 品質保証

### 信頼性指標

#### 評価者間一致度

レキシコン全体での評価者間一致度は以下の指標で測定されています：

| 指標 | 値 | 解釈 |
|-----|---|------|
| Krippendorff's α | 0.84 | 高い一致 |
| 平均標準偏差 | 0.95 | 全体的に良好な一致 |
| ICC (Intraclass Correlation) | 0.87 | 高い信頼性 |

### 妥当性検証

#### 1. 構成概念妥当性

**既存レキシコンとの相関**:

- AFINN (Nielsen, 2011): r = 0.91
- SentiWordNet (Baccianella et al., 2010): r = 0.78
- General Inquirer (Stone et al., 1966): r = 0.85

#### 2. 基準関連妥当性

**人間評価との一致**:

- 独立したテストセットでの相関: r = 0.88
- F1スコア（3値分類）: 0.96

#### 3. 内容妥当性

言語学者および心理学者による専門家レビュー実施。多様な感情表現カテゴリの包括的カバレッジを確認。

### 制限事項と改善の余地

#### 1. 時間的制約

- **問題**: 2014年時点の言語使用に基づく
- **影響**: 新しいスラング、ミーム、流行語、絵文字には対応していない可能性
- **対策**: 定期的な更新が望ましいが、現時点では実施されていない

#### 2. 文化的・地域的バイアス

- **問題**: 主に北米英語話者による評価
- **影響**: 他の英語圏（英国、オーストラリア等）での解釈と異なる可能性
- **対策**: 使用ドメインに応じた調整が必要

#### 3. 文脈依存性の扱い

- **問題**: 文脈に依存しない評価を前提
- **影響**: 実際の使用では文脈により意味が変化する単語・絵文字が存在
- **対策**: アルゴリズムでの文法的・語用論的ルールによる調整

#### 4. 絵文字の解釈

- **問題**: 絵文字の説明文の質に依存
- **影響**: 説明文が不適切な場合、誤ったスコアが算出される
- **対策**: 絵文字レキシコンの継続的な改善

---

## レキシコンの解釈

### 平均スコアの解釈指針

#### 絶対値の大きさ

| 絶対値 | 感情強度 | 使用例 |
|-------|---------|--------|
| 3.0 ～ 4.0 | 非常に強い | excellent, terrible, fantastic, horrible, 😍, 💔 |
| 2.0 ～ 2.9 | 強い | good, bad, happy, sad, 😊, 😢 |
| 1.0 ～ 1.9 | 中程度 | nice, dislike, pleasant, unpleasant, 🙂 |
| 0.5 ～ 0.9 | 弱い | okay, meh, somewhat, slightly |
| 0.0 ～ 0.4 | 非常に弱い | neutral, indifferent, ambivalent, 😐 |

### 標準偏差の解釈指針

#### 評価の一致度

**低標準偏差（< 1.0）**

- **意味**: 普遍的な感情表現
- **特徴**:
  - 文化・世代を超えて一貫した解釈
  - 基本的な感情語・明確な絵文字に多い
  - 教育・辞書などで明確に定義されている
- **例**: love (σ=0.6), hate (σ=0.7), happy (σ=0.5), 😊, ❤️

**中標準偏差（1.0～2.0）**

- **意味**: 一定の解釈の幅がある
- **特徴**:
  - 文脈や個人の経験により解釈が変動
  - ニュアンスのある表現
- **例**: interesting (σ=1.2), unique (σ=1.4)

**高標準偏差（> 2.0）**

- **意味**: 評価が大きく分かれる
- **特徴**:
  - 価値観や立場に強く依存
  - 文化的・政治的に論争的な可能性
  - 使用に注意が必要
- **例**: ambitious (σ=1.8), competitive (σ=1.9), aggressive (σ=2.1)

### 個別評価リストの活用

個別評価リストは、以下の分析に有用です：

#### 1. 評価分布の可視化

```
例: ambitious [3, 0, 2, -1, 4, 1, 0, 3, 2, 1]

分布:
+4: █ (1人)
+3: ██ (2人)
+2: ██ (2人)
+1: ██ (2人)
 0: ██ (2人)
-1: █ (1人)
```

この分布から、"ambitious"が二峰性の評価分布を持つことが分かります。

#### 2. 外れ値の検出

標準偏差が高い項目について、個別評価を確認することで、特定の評価者の偏りや誤評価を検出できます。

#### 3. サブグループ分析

評価者の属性（年齢、地域など）が分かる場合、個別評価からサブグループ間の違いを分析できます。

---

## 使用上の注意

### レキシコンの適切な使用

#### 推奨される使用ケース

**1. ソーシャルメディア分析**

- Twitter、Facebook、Redditなどの短文テキスト
- インフォーマルな表現・絵文字を含むUGC（ユーザー生成コンテンツ）

**2. 製品レビュー分析**

- オンラインショッピングサイトのレビュー
- アプリストアの評価コメント

**3. 顧客フィードバック分析**

- サポートチケットの感情分析
- サーベイの自由記述回答

**4. チャット・メッセージング分析**

- カスタマーサポートチャット
- ソーシャルメッセージング（絵文字が頻繁に使用される）

#### 注意が必要なケース

**1. フォーマルな文章**

- 学術論文、ビジネス文書
- 法律文書、公式声明
- **理由**: VADERはインフォーマルな表現に最適化されている

**2. ドメイン特化的な用語**

- 医療、法律、技術分野の専門用語
- **理由**: 一般的なレキシコンではカバーされていない

**3. 他言語**

- 英語以外のテキスト
- **理由**: 英語専用に設計されている

**4. 皮肉・反語**

- "Great, another Monday!" （皮肉）
- "Love this bug 🐛😂" （冗談）
- **理由**: 文脈依存的な解釈が必要

**5. 絵文字の複雑な使用**

- 皮肉や冗談での絵文字使用
- 文化特有の絵文字解釈
- **対策**: 文脈を考慮した結果の解釈が必要

### 本ツールでのレキシコン使用

**本ツールの機能:**

本ツールは、元のVADERレキシコンファイル（vader_lexicon.txt）と絵文字レキシコン（emoji_utf8_lexicon.txt）をそのまま使用します。ツール内でレキシコンを編集・カスタマイズする機能は提供していません。

**使用方法:**

1. GitHubから元のレキシコンファイルをダウンロード
2. ブラウザでツールを開く
3. レキシコンファイルをアップロード
4. テキストを分析

**制限事項:**

- レキシコンの追加・編集はできない
- ドメイン特化的な調整はできない
- スコアの変更はできない

---

## 参考文献

### 主要文献

**Hutto, C. J., & Gilbert, E. (2014).** VADER: A Parsimonious Rule-based Model for Sentiment Analysis of Social Media Text. *Proceedings of the International AAAI Conference on Web and Social Media*, 8(1), 216-225.

### 関連レキシコン

**Nielsen, F. Å. (2011).** A New ANEW: Evaluation of a Word List for Sentiment Analysis in Microblogs. *Proceedings of the ESWC2011 Workshop on 'Making Sense of Microposts'*, 93-98.

**Baccianella, S., Esuli, A., & Sebastiani, F. (2010).** SentiWordNet 3.0: An Enhanced Lexical Resource for Sentiment Analysis and Opinion Mining. *Proceedings of the Seventh International Conference on Language Resources and Evaluation (LREC'10)*.

**Stone, P. J., Dunphy, D. C., & Smith, M. S. (1966).** The General Inquirer: A Computer Approach to Content Analysis. *MIT Press*.

### クラウドソーシング方法論

**Snow, R., O'Connor, B., Jurafsky, D., & Ng, A. Y. (2008).** Cheap and Fast—But is it Good?: Evaluating Non-Expert Annotations for Natural Language Tasks. *Proceedings of the Conference on Empirical Methods in Natural Language Processing*, 254-263.

**Mohammad, S. M., & Turney, P. D. (2013).** Crowdsourcing a Word-Emotion Association Lexicon. *Computational Intelligence*, 29(3), 436-465.

### 絵文字研究

**Novak, P. K., Smailović, J., Sluban, B., & Mozetič, I. (2015).** Sentiment of Emojis. *PLOS ONE*, 10(12), e0144296.

**Rodrigues, D., Prada, M., Gaspar, R., Garrido, M. V., & Lopes, D. (2018).** Lisbon Emoji and Emoticon Database (LEED): Norms for emoji and emoticons in seven evaluative dimensions. *Behavior Research Methods*, 50(1), 392-405.

---

## 付録: レキシコンの取得方法

### 公式リポジトリ

VADERレキシコンとその関連ファイルは、以下のGitHubリポジトリから取得できます：

**URL**: https://github.com/cjhutto/vaderSentiment

### ファイルパス

#### メインレキシコン

```
vaderSentiment/vader_lexicon.txt
```

**直接リンク**:
```
https://raw.githubusercontent.com/cjhutto/vaderSentiment/master/vaderSentiment/vader_lexicon.txt
```

#### 絵文字レキシコン

```
vaderSentiment/emoji_utf8_lexicon.txt
```

**直接リンク**:
```
https://raw.githubusercontent.com/cjhutto/vaderSentiment/master/vaderSentiment/emoji_utf8_lexicon.txt
```

### ライセンス

VADERレキシコンとその関連ファイルは、MITライセンスの下で配布されています。

### 引用要件

レキシコンを使用する場合は、必ず元論文を引用すること：

```bibtex
@inproceedings{hutto2014vader,
  title={VADER: A parsimonious rule-based model for sentiment analysis of social media text},
  author={Hutto, Clayton J and Gilbert, Eric},
  booktitle={Proceedings of the International AAAI Conference on Web and Social Media},
  volume={8},
  number={1},
  pages={216--225},
  year={2014}
}
```

---

**Document Version**: 2.0  
**Last Updated**: 2025  
**Author**: Nozomi Sawada

このドキュメントは、VADERレキシコンとその拡張である絵文字レキシコンの理解を深めるために作成された補足資料です。