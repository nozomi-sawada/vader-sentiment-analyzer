# Changelog

All notable changes to this tool are documented here. Versions follow
[Semantic Versioning](https://semver.org/): a change that alters the scores the
tool produces is a major version change.

## [2.0.0] — 2026-09-13

> [!IMPORTANT]
> **This version produces different sentiment scores than earlier versions.**
> If you ran analyses with the earlier code (described in the documentation as
> "Version 1.0") and report exact scores in a publication, re-run them with this
> version. The corrected rules are listed below.

### Changed — analysis engine replaced

The engine is now a line-by-line port of the reference Python implementation
([vaderSentiment 3.3.2](https://github.com/cjhutto/vaderSentiment)), and an
automated golden test suite asserts that its output matches the reference for
97 test sentences covering negation, boosters, ALL CAPS, punctuation, idioms,
emoticons, emojis, and edge cases.

### Fixed — deviations from the reference implementation

Each of these could change the score of an affected text:

- **Emoticon tokenization** — Tokens mixing symbols and alphanumerics
  (`<3`, `:D`, `:P`, `8)`) were split apart and never matched the lexicon, so
  their sentiment was ignored. Tokenization now matches the reference
  (`SentiText`): whitespace split with punctuation stripping that preserves
  emoticons.
- **Punctuation emphasis** — Exclamation marks only amplified a sentiment word
  when they immediately followed it, so `"I love this!"` lost the effect
  entirely. Emphasis is now applied to the summed score for the whole text, as
  in the reference. Question marks (2–3: +0.18 each, 4 or more: +0.96) were not
  implemented at all and are now supported.
- **Positive/neutral/negative proportions** — The ±1 per-token compensation used
  by the reference was missing, so the reported proportions differed from
  Python VADER even when the compound score matched.
- **Negation scope** — Negations three tokens back were only applied when the
  preceding token was "or"/"nor", a rule not present in the reference. The
  `NEGATE` list was also missing entries (`rarely`, `seldom`, `despite`,
  contraction spellings without apostrophes). Added the reference's special
  cases: `"never so/this"` (×1.25), `"without doubt"`, standalone `"no"`, and
  `"least"`.
- **Contrastive "but"** — The last occurrence of "but" was used as the pivot
  instead of the first.
- **Idioms and multiword modifiers** — Special-case idioms (`bad ass`,
  `the shit`, `to die for`, `yeah right`, …) and multiword dampeners
  (`kind of`, `sort of`) were unreachable and are now implemented.
- **ALL CAPS boosters** — A booster word in capitals did not receive the
  additional emphasis the reference applies.

### Added

- Bundled VADER lexicons (`third_party/vaderSentiment/`, MIT licensed,
  redistributed unmodified) that load automatically, so the published page works
  with no downloads; manual upload remains available to substitute a different
  lexicon.
- Japanese / English interface toggle.
- Golden test suite (`node test/run-tests.js`) and a GitHub Actions workflow
  that runs it on every push and pull request.
- Per-token display of every rule applied to a word, plus a color legend.

### Changed — structure

- The single-file page was split into `vader.js` (analysis engine, usable from
  both the browser and Node.js) and `app.js` (user interface).
- Tailwind CSS is now built and committed instead of loaded from a CDN, and the
  Content Security Policy is restricted to `script-src 'self'; style-src 'self'`
  with no external resources.

## [1.0] — 2025

Initial public release. Superseded by 2.0.0; see the note above regarding score
differences.
