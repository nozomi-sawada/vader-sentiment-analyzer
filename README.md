# VADER-based Sentiment Analysis Tool

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![VADER](https://img.shields.io/badge/VADER-Hutto%20%26%20Gilbert%202014-green)](https://github.com/cjhutto/vaderSentiment)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

**English** | [日本語](README.ja.md)

---

## Abstract

This tool provides a faithful browser-based implementation of the VADER (Valence Aware Dictionary and sEntiment Reasoner) algorithm developed by Hutto & Gilbert (2014). It employs a lexicon and rule-based approach specifically designed for sentiment analysis of social media text, implementing all core VADER features including negation handling, booster words, and context-dependent weighting. Developed as a practical tool for researchers and educators to understand and apply sentiment analysis methodologies.

## Key Features

- **🌐 Browser-based** - No installation, no server, runs entirely in your browser
- **📱 Offline capable** - Works offline after loading lexicon files
- **🎯 Rule-based & transparent** - All decisions are interpretable, no black-box ML
- **😊 Emoji support** - Analyzes emojis by converting them to text descriptions (optional)
- **📊 Detailed visualization** - Shows score adjustment process for each word
- **📄 Sentence-level analysis** - Supports sentence-by-sentence analysis as recommended by VADER paper
- **🔍 Lexicon explorer** - Search and browse ~7,500 sentiment words with statistics
- **📈 Statistical insights** - Distribution charts, top positive/negative words, standard deviation analysis

## Quick Start

### 1. Download Required Files

**Required:** VADER Lexicon (~7,500 sentiment words)
```
https://github.com/cjhutto/vaderSentiment/blob/master/vaderSentiment/vader_lexicon.txt
```

**Optional:** Emoji Lexicon (~3,000 emoji mappings)
```
https://github.com/cjhutto/vaderSentiment/blob/master/vaderSentiment/emoji_utf8_lexicon.txt
```

💡 **Tip:** Click "Raw" button on GitHub, then right-click and "Save As"

### 2. Run the Tool

1. Open `index.html` in your browser (keep `vader.js` and `app.js` in the same folder)
2. Upload the lexicon file(s)
3. Enter text and click "Analyze"

### 3. Choose Analysis Mode

- **Normal mode** - Analyzes entire text as one unit
- **Sentence mode** ☑️ - Splits text and analyzes each sentence (recommended by VADER paper)

## About VADER Algorithm

### Theoretical Background

VADER is a lexicon and rule-based sentiment analysis tool specifically attuned to sentiments expressed in social media. It was designed to address three key shortcomings of traditional sentiment analysis approaches:

1. **Coverage** - Traditional lexicons often ignore features relevant to social media (slang, emoticons, abbreviations)
2. **Intensity awareness** - Many approaches ignore sentiment intensity differentials
3. **Efficiency** - Machine learning approaches require extensive training data and are computationally expensive

### Key Characteristics

- **Social media specialization** - Handles informal expressions, slang, non-standard orthography
- **Rule-based approach** - Fully interpretable without machine learning
- **Empirical validity** - High correlation with human raters (Pearson's r = 0.88 in original paper)
- **Performance** - F1 score of 0.96 on Twitter data (reported in original paper)

### Score Interpretation

**Compound Score Range:** -1.0 to +1.0 (normalized)

The compound score is normalized using the formula:
```
compound = Σ(valence_i) / √(Σ(valence_i²) + α)
```
where α = 15 (normalization parameter)

This normalization ensures that:
- Scores fall within the [-1.0, +1.0] range
- Texts of different lengths can be fairly compared
- Extreme values are appropriately dampened

**Classification Thresholds** (based on the original paper):

| Compound Score | Classification | Description |
|----------------|----------------|-------------|
| score ≥ 0.05 | Positive | Text containing positive sentiment |
| -0.05 < score < 0.05 | Neutral | Emotionally neutral text |
| score ≤ -0.05 | Negative | Text containing negative sentiment |

**Note:** These thresholds were optimized for general social media text. Threshold adjustment may be necessary depending on domain and research objectives.

**Important Note: Difference from VADER Paper**

The VADER paper describes the normalization formula as:
```
compound = Σ(valence_i) / √(Σ(valence_i²) + α)
```

However, the **official Python implementation** uses:
```
compound = sum / √(sum² + α)
```

This tool follows the official Python implementation for compatibility with existing VADER users.

## Algorithm Details

### Computational Procedure

VADER calculates sentiment scores through the following steps:

1. **Tokenization and Lexicon Matching**
   - Split input text into tokens
   - Match each token with VADER lexicon to get base sentiment score

2. **Application of Grammatical and Pragmatic Rules**

   | Rule | Effect | Example |
   |------|--------|---------|
   | **Negation** | Reverses polarity (×-0.74) | "not good" → +1.9 → -1.41 |
   | **Booster words** | Amplifies score (±0.293) | "very good" → +1.9 → +2.19 |
   | **ALL CAPS** | Emphasizes (±0.733) | "GOOD" → +1.9 → +2.63 |
   | **Exclamation marks** | Text-level emphasis (+0.292 each, max 4) applied to the summed score | "good!" → sum +1.9 → +2.19 |
   | **Question marks** | Text-level emphasis (2–3: +0.18 each, 4+: +0.96) | "really??" |
   | **"but" clause** | Before ×0.5, After ×1.5 | "good but bad" → adjust both |
   | **Idioms & special cases** | Fixed valence for phrases | "bad ass" → +1.5, "the shit" → +3 |
   | **"least" / "no"** | Contextual negation | "least good", "no good" |

3. **Normalization and Compound Score Calculation**

   ```
   compound = Σ(valence_i) / √(Σ(valence_i²) + α)
   ```
   
   where α = 15 (normalization parameter)

   This normalization:
   - Scales scores to approximately [-1.0, +1.0]
   - Enables fair comparison across different text lengths
   - Dampens extreme values

### Implementation Fidelity

The analysis engine (`vader.js`) is a line-by-line port of the reference Python
implementation ([vaderSentiment 3.3.2](https://github.com/cjhutto/vaderSentiment)),
and its output is verified against the reference by an automated golden test
suite (see [Testing](#testing)):

- ✅ Lexicon-based scoring using original VADER lexicon
- ✅ Tokenization identical to the reference (`SentiText`): whitespace split with punctuation stripping that preserves emoticons such as `:)`, `:D`, `<3`
- ✅ Negation handling (checks 3 tokens back), including contractions ("n't"), "never so/this" emphasis, "without doubt", "least", and "no" special cases
- ✅ Booster words with distance decay (immediate → ×1.00, 2 back → ×0.95, 3 back → ×0.90), including ALL CAPS boosters
- ✅ ALL CAPS detection and emphasis (±0.733)
- ✅ Punctuation emphasis at text level: exclamation marks (up to 4, +0.292 each) and question marks (2–3: +0.18 each, 4+: +0.96)
- ✅ "but" clause contextual adjustment (before ×0.5, after ×1.5)
- ✅ Special-case idioms ("bad ass", "the shit", "to die for", "yeah right", ...) and multiword dampeners ("kind of", "sort of")
- ✅ Compound normalization (α=15) and pos/neu/neg proportions computed exactly as in the reference (±1 compensation per token)
- ✅ Emoji support via inline text-description conversion, identical to the reference (optional)
- ✅ Sentence splitting with abbreviation protection (Mr., Dr., etc.) — an application feature on top of VADER

### Project Structure

```
index.html   – markup only (no inline scripts)
vader.js     – the VADER algorithm (browser + Node.js)
app.js       – UI layer (file loading, rendering, events)
test/        – golden tests against the reference Python implementation
```

### Testing

The golden test suite pins the exact scores of the reference Python
implementation for ~100 sentences (negation, boosters, ALL CAPS, punctuation,
idioms, emoticons, emojis, edge cases) and asserts that `vader.js` reproduces
them:

```bash
bash test/fetch-fixtures.sh   # download lexicon files (not committed, see License)
node test/run-tests.js        # compare vader.js against test/golden.json
```

To regenerate the golden data from the reference implementation:

```bash
pip install vaderSentiment==3.3.2
python3 test/generate_golden.py
```

## Examples

### Basic Analysis
```
Input: "I love this product, it's amazing!"
Result: Strong Positive (0.8516)
  - love: +3.2
  - amazing: +2.8
  - punctuation emphasis (!): +0.292
```

### Negation Handling
```
Input: "This is not very good"
Result: Weak Negative (-0.3865)
  - not: negation word
  - very: booster
  - good: +1.9 → -1.62 (booster +0.293, then negation ×-0.74)
```

### Context Shift with "but"
```
Input: "The book offers fascinating ideas but sadly fails in its delivery."
Result: Strong Negative (-0.7311)
  - fascinating: +2.5 → +1.25 (before "but" ×0.5)
  - sadly: -1.8 → -2.70 (after "but" ×1.5)
  - fails: -1.8 → -2.70 (after "but" ×1.5)
```

### Sentence-level Analysis
```
Input: "I love this! It's amazing! Quality is excellent!"
Result: 3 sentences analyzed separately
  - Sentence 1: Strong Positive (0.6696)
  - Sentence 2: Strong Positive (0.6239)
  - Sentence 3: Strong Positive (0.6114)
  Average: 0.6350
```

All example scores are identical to those of the reference Python implementation (vaderSentiment 3.3.2).

## Validation and Reliability

### Validation Results from Original Paper

Hutto & Gilbert (2014) validated VADER's performance on the following datasets:

| Dataset | F1 Score | Accuracy | Correlation |
|---------|----------|----------|-------------|
| Twitter | 0.96 | 96% | r = 0.881 |
| Movie Reviews | 0.94 | 94% | r = 0.850 |
| Product Reviews | 0.92 | 92% | r = 0.870 |

### Validity of This Implementation

This tool aims to faithfully reproduce the behavior of the original VADER implementation (Python version). Key implementation aspects:

1. **Core Algorithm** - Direct port of the reference implementation: grammatical and pragmatic rules, score calculation formulas, normalization parameters, and negation scope (3 tokens)
2. **Lexicon Usage** - Uses original VADER lexicon with compatibility for lexicon format and preservation of standard deviation data
3. **Verification** - Automated golden tests assert that compound/pos/neu/neg scores match the reference Python implementation (vaderSentiment 3.3.2) on ~100 test sentences (see [Testing](#testing))

### Limitations

Researchers should be aware of the following limitations:

1. **Language limitation** - Designed specifically for English text
2. **Domain dependency** - Optimized for social media; may have reduced accuracy on formal text
3. **Contextual understanding** - Limited ability to detect sarcasm or irony
4. **Temporal changes** - Lexicon based on 2014 ratings; may not cover newer slang

## Browser Compatibility

- ✅ Chrome / Edge 90+ (Recommended)
- ✅ Firefox 88+
- ✅ Safari 14+
- ⚠️ Internet Explorer (Not supported)

## Security Features

This tool implements multiple security measures to ensure safe operation in browser environments:

### XSS (Cross-Site Scripting) Protection

- **Safe DOM Construction** - All dynamic content is rendered using `textContent` and `createElement` instead of `innerHTML`
- **No HTML Injection** - User input and lexicon data are automatically escaped
- **Validated Rendering** - All 8 rendering locations use XSS-safe methods

### Input Validation

- **File Size Limit** - Maximum 10MB per file to prevent DoS attacks
- **Extension Check** - Only `.txt` files are accepted
- **Content Validation** - Lexicon format verification

### Content Security Policy (CSP)

The tool uses CSP headers to restrict script execution, styles, network connections, and frame embedding.

## Academic Usage Guide

### Citation Examples in Papers

#### Methodology Section

**English:**

> For sentiment analysis, we employed VADER (Valence Aware Dictionary and sEntiment Reasoner), developed by Hutto & Gilbert (2014). VADER is a lexicon-based approach utilizing approximately 7,500 sentiment-bearing words combined with grammatical and pragmatic rules, specifically designed for social media text analysis. We used the browser-based implementation tool developed by Sawada (2025). Texts with Compound Scores ≥ +0.05 were classified as positive, scores ≤ -0.05 as negative, and intermediate scores as neutral.

#### Results Section

**English:**

> VADER analysis revealed that among 1,000 collected tweets, 62.3% were classified as positive (Compound Score ≥ 0.05), 18.7% as negative (Compound Score ≤ -0.05), and 19.0% as neutral (-0.05 < Compound Score < 0.05). The mean Compound Score was +0.42 (SD = 0.31).

### Recommended Research Designs

1. **Social Media Analysis** - Twitter, Facebook, Reddit short text with informal expressions
2. **Time Series Analysis** - Tracking sentiment changes before/after events
3. **Comparative Analysis** - Sentiment comparison between groups or topics
4. **Validity Verification** - Recommended to verify with human raters on subset of data

### Ethical Considerations

Researchers should observe the following:

1. **Data Collection** - Appropriate consent procedures, privacy protection, platform TOS compliance
2. **Result Interpretation** - Acknowledge algorithm limitations, avoid over-generalization, consider context
3. **Transparency** - Document tool version, analysis parameters, ensure reproducibility

## Citation

### Required (VADER Paper)

If you use this tool, please cite the original VADER paper:

```bibtex
@inproceedings{hutto2014vader,
  title={VADER: A parsimonious rule-based model for sentiment analysis of social media text},
  author={Hutto, C.J. and Gilbert, E.E.},
  booktitle={Eighth International Conference on Weblogs and Social Media (ICWSM-14)},
  year={2014},
  address={Ann Arbor, MI}
}
```

### Optional (This Tool)

```bibtex
@software{sawada2025vader,
  author = {Sawada, Nozomi},
  title = {VADER-based Sentiment Analysis Tool},
  year = {2025},
  url = {https://github.com/nozomi-sawada/vader-sentiment-analyzer}
}
```

## Documentation

For more detailed information, see the `docs/` folder:

- **[ALGORITHM.md](docs/ALGORITHM.md)** - Detailed algorithm implementation
- **[LEXICON.md](docs/LEXICON.md)** - Lexicon structure and annotation methodology
- **[CITATION.md](docs/CITATION.md)** - Detailed citation guide for academic use


## License

This tool is released under the MIT License.

**Important:** VADER lexicon files are distributed in the [original repository](https://github.com/cjhutto/vaderSentiment). This tool does not include the lexicon files. Users must download them separately to comply with licensing requirements.

## Acknowledgments

This tool is based on:

> Hutto, C.J. & Gilbert, E.E. (2014). VADER: A Parsimonious Rule-based Model for Sentiment Analysis of Social Media Text. Eighth International Conference on Weblogs and Social Media (ICWSM-14). Ann Arbor, MI, June 2014.

Special thanks to C.J. Hutto and Eric Gilbert for developing VADER.

---

**Developed for research and educational purposes**

© 2025 Nozomi Sawada