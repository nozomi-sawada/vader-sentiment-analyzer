#!/usr/bin/env python3
"""Regenerate test/golden.json from the reference Python implementation.

Usage:
    pip install vaderSentiment==3.3.2
    python3 test/generate_golden.py

The golden file pins the exact scores of the reference implementation
(vaderSentiment 3.3.2) for every sentence in test/sentences.json.
test/run-tests.js then asserts that vader.js reproduces them.
"""
import json
import os
import sys

try:
    import vaderSentiment
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
except ImportError:
    sys.exit("vaderSentiment is not installed. Run: pip install vaderSentiment==3.3.2")

HERE = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(HERE, "sentences.json"), encoding="utf-8") as f:
    sentences = json.load(f)

analyzer = SentimentIntensityAnalyzer()

golden = {
    "reference": "vaderSentiment %s" % getattr(vaderSentiment, "__version__", "3.3.2"),
    "lexicon_entries": len(analyzer.lexicon),
    "emoji_entries": len(analyzer.emojis),
    "cases": [
        {"text": s, "expected": analyzer.polarity_scores(s)}
        for s in sentences
    ],
}

out_path = os.path.join(HERE, "golden.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(golden, f, ensure_ascii=False, indent=2)
    f.write("\n")

print("Wrote %d cases to %s" % (len(golden["cases"]), out_path))
