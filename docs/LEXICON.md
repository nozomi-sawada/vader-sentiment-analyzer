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

