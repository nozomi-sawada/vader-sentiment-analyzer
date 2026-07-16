# Citation Guide

**English** | [日本語](CITATION.ja.md)

This document explains how to cite this tool when using it in academic research.

---

## Table of Contents

1. [Citation Principles](#1-citation-principles)
2. [Required Citation: VADER Paper](#2-required-citation-vader-paper)
3. [Recommended Citation: This Tool](#3-recommended-citation-this-tool)
4. [Example Descriptions in Papers](#4-example-descriptions-in-papers)
5. [Methods Section Examples](#5-methods-section-examples)
6. [Citation Formats by Style](#6-citation-formats-by-style)
7. [FAQ](#7-faq)

---

## 1. Citation Principles

### Basic Rules

When using this tool in academic research:

- **Required**: Cite VADER paper (Hutto & Gilbert, 2014)  
- **Recommended**: Cite this tool (Sawada, 2025)  
- **Important**: Specify that this tool implements VADER algorithm  
- **Recommended**: Specify analysis unit (sentence-level or document-level)

### Why Cite Both?

- **VADER paper** → Credits algorithm developers
- **This tool** → Specifies implementation used for transparency
- **Analysis unit** → Critical information for reproducibility

---

## 2. Required Citation: VADER Paper

### BibTeX Format

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

### Text Format

Hutto, C.J., & Gilbert, E.E. (2014). VADER: A Parsimonious Rule-based Model for Sentiment Analysis of Social Media Text. In *Proceedings of the Eighth International Conference on Weblogs and Social Media (ICWSM-14)*. Ann Arbor, MI, June 2014.

---

## 3. Recommended Citation: This Tool

### BibTeX Format

```bibtex
@software{sawada2025vader,
  author = {Sawada, Nozomi},
  title = {VADER-based Sentiment Analysis Tool},
  year = {2025},
  url = {https://github.com/nozomi-sawada/vader-sentiment-analyzer},
  note = {Web-based implementation of VADER sentiment analysis with sentence-level analysis support}
}
```

### Text Format

Sawada, N. (2025). *VADER-based Sentiment Analysis Tool* [Web application]. GitHub. https://github.com/nozomi-sawada/vader-sentiment-analyzer

---

## 4. Example Descriptions in Papers

### Pattern 1: Using Sentence-Level Analysis (Recommended)

```
Sentiment analysis was conducted using a web-based implementation 
(Sawada, 2025) of the VADER (Valence Aware Dictionary and sEntiment 
Reasoner; Hutto & Gilbert, 2014) algorithm. VADER combines a lexicon 
of approximately 7,500 sentiment-bearing words with five grammatical 
rules (negation, boosters, ALL CAPS, punctuation emphasis, and contrastive 
conjunction "but") to compute sentiment scores. Following the VADER paper's 
recommendation, texts were split into sentences and each sentence was 
analyzed separately. The analysis used vader_lexicon.txt (v.2014).
```

### Pattern 2: Using Document-Level Analysis

```
Text sentiment was analyzed using an implementation (Sawada, 2025) 
of VADER (Hutto & Gilbert, 2014). Each text was analyzed as a single unit.
```

### Pattern 3: Using Emoji Processing

```
Sentiment analysis was performed using the VADER-based Sentiment Analysis 
Tool developed by Sawada (2025), a browser-based implementation that 
reproduces the behavior of the original VADER algorithm (Hutto & Gilbert, 2014). 
For texts containing emojis, we used emoji_utf8_lexicon.txt (mapping ~3,000 
emojis) to convert emojis to text descriptions before sentiment analysis.
```

---

## 5. Methods Section Examples

### Example 1: Basic Sentence-Level Analysis

```
3.2 Sentiment Analysis

Sentiment analysis of collected text data was conducted using a web-based 
implementation (Sawada, 2025) of VADER (Hutto & Gilbert, 2014). VADER is 
a lexicon-based sentiment analysis method that combines a sentiment lexicon 
of approximately 7,500 words (vader_lexicon.txt, v.2014) with grammatical 
rules (processing negation, boosters, ALL CAPS, punctuation emphasis, and 
contrastive conjunctions) to compute sentiment scores.

Following the VADER paper's recommendation (Hutto & Gilbert, 2014), each 
text was split into sentences and sentiment scores were calculated for each 
sentence separately. Sentence splitting used regular expressions with 
protection for common abbreviations (e.g., Mr., Dr.) to prevent erroneous 
splits. For each sentence, we computed the Compound Score (overall sentiment 
score normalized to range -1 to +1) and the proportions of Positive, Neutral, 
and Negative sentiment.

Classification thresholds were set following Hutto & Gilbert (2014): 
Compound Score ≥ 0.05 as positive, ≤ -0.05 as negative, and otherwise 
as neutral.
```

### Example 2: Including Aggregation Analysis

```
For each text, we calculated the mean Compound Score across sentences to 
evaluate the overall sentiment tendency. We also computed the proportion of 
positive sentences and negative sentences within each text to analyze the 
sentiment composition.
```

### Example 3: Including Preprocessing

```
3.1 Data Preprocessing

Collected text data underwent the following preprocessing steps:
1) Removal of URLs and email addresses
2) Normalization of consecutive whitespace characters
3) Preservation of emojis (for use in sentiment analysis)

Preprocessed texts were split into sentences for VADER sentiment analysis.
```

### Example 4: Using with Multilingual Corpus

```
Only English texts were subjected to VADER analysis. Non-English texts in the 
dataset were excluded beforehand. Language detection used the langdetect library 
(v.1.0.9), with texts having confidence ≥ 0.9 classified as English.
```

---

## 6. Citation Formats by Style

### APA Style (7th Edition)

**VADER Paper**:
```
Hutto, C. J., & Gilbert, E. E. (2014, June). VADER: A parsimonious rule-based 
model for sentiment analysis of social media text. In Proceedings of the Eighth 
International Conference on Weblogs and Social Media (ICWSM-14). Ann Arbor, MI.
```

**This Tool**:
```
Sawada, N. (2025). VADER-based sentiment analysis tool (Version 1.0) [Computer software]. 
GitHub. https://github.com/nozomi-sawada/vader-sentiment-analyzer
```

### IEEE Style

**VADER Paper**:
```
[1] C. J. Hutto and E. E. Gilbert, "VADER: A parsimonious rule-based model for 
    sentiment analysis of social media text," in Proc. 8th Int. AAAI Conf. Weblogs 
    Social Media (ICWSM), Ann Arbor, MI, USA, Jun. 2014.
```

**This Tool**:
```
[2] N. Sawada. (2025). VADER-based Sentiment Analysis Tool [Online]. 
    Available: https://github.com/nozomi-sawada/vader-sentiment-analyzer
```

### Chicago Style (Author-Date)

**VADER Paper**:
```
Hutto, C. J., and E. E. Gilbert. 2014. "VADER: A Parsimonious Rule-based Model 
for Sentiment Analysis of Social Media Text." Paper presented at the Eighth 
International Conference on Weblogs and Social Media (ICWSM-14), Ann Arbor, MI, 
June 2014.
```

**This Tool**:
```
Sawada, Nozomi. 2025. "VADER-based Sentiment Analysis Tool." Version 1.0. GitHub. 
https://github.com/nozomi-sawada/vader-sentiment-analyzer.
```

### MLA Style (9th Edition)

**VADER Paper**:
```
Hutto, C.J., and E.E. Gilbert. "VADER: A Parsimonious Rule-based Model for 
Sentiment Analysis of Social Media Text." Proceedings of the Eighth International 
Conference on Weblogs and Social Media (ICWSM-14), 2014, Ann Arbor, MI.
```

**This Tool**:
```
Sawada, Nozomi. VADER-based Sentiment Analysis Tool. Version 1.0, GitHub, 2025, 
github.com/nozomi-sawada/vader-sentiment-analyzer.
```

### Harvard Style

**VADER Paper**:
```
Hutto, C.J. and Gilbert, E.E. (2014) 'VADER: A parsimonious rule-based model 
for sentiment analysis of social media text', in Proceedings of the Eighth 
International Conference on Weblogs and Social Media (ICWSM-14). Ann Arbor, MI.
```

**This Tool**:
```
Sawada, N. (2025) VADER-based Sentiment Analysis Tool. Version 1.0. Available at: 
https://github.com/nozomi-sawada/vader-sentiment-analyzer (Accessed: [date]).
```

---

## 7. FAQ

### Q1: Is it sufficient to cite only the VADER paper?

A: No, we recommend citing both. The VADER paper credits the algorithm; citing this tool specifies the implementation used. Documenting the specific tool used is important for research reproducibility.

### Q2: Which analysis unit should I use: sentence-level or document-level?

A: The VADER paper **recommends sentence-level analysis**. The paper states:

> "VADER performs sentence-level sentiment analysis"
> "decomposing paragraphs, articles into sentence-level analyses"

All evaluation datasets in the paper are sentence-level. However, document-level may be appropriate depending on research objectives.

### Q3: How should I mention it in the text?

A: We recommend one of the following formats:

**For sentence-level analysis:**
- "Using an implementation (Sawada, 2025) of VADER (Hutto & Gilbert, 2014), we analyzed texts at the sentence level"
- "We used Sawada's (2025) VADER implementation and performed sentence-level analysis as recommended by the paper"

**For document-level analysis:**
- "Using VADER (Hutto & Gilbert, 2014; implementation: Sawada, 2025), we analyzed entire texts"

### Q4: Should I cite the lexicon file source?

A: Yes, we recommend describing it in the Methods section as follows:

```
The sentiment lexicon used was vader_lexicon.txt (Hutto & Gilbert, 2014). 
This lexicon contains approximately 7,500 sentiment words, each with a 
sentiment polarity score ranging from -4 to +4. Each score is the average 
of ratings from human evaluators, with standard deviations also provided.
```

### Q5: Should I specify the GitHub repository version?

A: Yes, for reproducibility, we recommend one of the following:

1. **Version number** (if released)
   ```
   Sawada (2025, version 1.0)
   ```

2. **Access date**
   ```
   Sawada (2025, accessed January 15, 2025)
   ```

3. **Commit hash** (for technical papers)
   ```
   Sawada (2025, commit a1b2c3d)
   ```

### Q6: What if I used the emoji lexicon?

A: The emoji lexicon is also included in the original VADER repository, so the same citation suffices. However, specify its use in the Methods section:

```
For texts containing emojis, we used emoji_utf8_lexicon.txt (Hutto & Gilbert, 2014). 
This lexicon maps approximately 3,000 emojis to text descriptions, which are then 
analyzed using the VADER lexicon to derive emoji sentiment scores.
```

### Q7: Should I describe the abbreviation protection used in sentence splitting?

A: For papers where technical details are important, we recommend describing it:

```
Sentence splitting used regular expressions with protection for common 
abbreviations (Mr., Mrs., Dr., Prof., etc.) and initials (e.g., M. T. John) 
to prevent erroneous splits.
```

### Q8: Should I describe statistical processing of results?

A: Yes, especially when using sentence-level analysis, specify the aggregation method:

```
For each text, we calculated the mean Compound Score across sentences and 
reported this as the overall sentiment tendency. We also computed the 
proportion of positive sentences (Compound Score ≥ 0.05) and negative 
sentences (≤ -0.05) within each text.
```

---

## Supplement: Reproducibility Information Checklist

We recommend including the following information in your Methods section:

### Required Items

- [ ] VADER implementation used (this tool)
- [ ] VADER lexicon file and version
- [ ] Analysis unit (sentence-level or document-level)
- [ ] Score classification thresholds

### Recommended Items

- [ ] Tool version or access date
- [ ] Emoji lexicon usage
- [ ] Sentence splitting method (for sentence-level)
- [ ] Text preprocessing steps
- [ ] Aggregation method (for sentence-level with multiple sentences)

### Optional Items (for technical papers)

- [ ] Abbreviation protection details
- [ ] Browser environment used
- [ ] GitHub commit hash
- [ ] Custom settings

---

## Description Templates

### Template 1: Minimal Description

```
Sentiment analysis used an implementation (Sawada, 2025) of VADER 
(Hutto & Gilbert, 2014), analyzing texts at the [sentence/document] level. 
We used vader_lexicon.txt (v.2014) and classified Compound Score ≥ 0.05 
as positive, ≤ -0.05 as negative.
```

### Template 2: Detailed Description

```
Sentiment analysis used a web-based implementation (Sawada, 2025) of the 
VADER (Valence Aware Dictionary and sEntiment Reasoner; Hutto & Gilbert, 2014) 
algorithm. VADER combines a sentiment lexicon of approximately 7,500 words 
(vader_lexicon.txt, v.2014) with five grammatical rules (negation, boosters, 
ALL CAPS, punctuation emphasis, and "but" context adjustment) to compute 
sentiment scores.

[For sentence-level analysis:]
Following the VADER paper's recommendation, each text was split into sentences, 
and we computed Compound Score (-1 to +1), Positive, Neutral, and Negative 
proportions for each sentence. Classification thresholds were Compound Score 
≥ 0.05 as positive, ≤ -0.05 as negative. For overall text evaluation, we used 
the mean of sentence-level scores.

[For document-level analysis:]
Each text was analyzed as a whole, computing Compound Score (-1 to +1) and 
Positive, Neutral, Negative proportions. Classification thresholds were 
Compound Score ≥ 0.05 as positive, ≤ -0.05 as negative.
```

---

## Contact

For questions about citations:

- **GitHub Issues**: https://github.com/nozomi-sawada/vader-sentiment-analyzer/issues

---

