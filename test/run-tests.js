#!/usr/bin/env node
/**
 * Golden test runner: asserts that vader.js reproduces the scores of the
 * reference Python implementation (vaderSentiment 3.3.2) for every sentence
 * in test/sentences.json.
 *
 * Requires the lexicon fixtures (not committed to the repository):
 *     bash test/fetch-fixtures.sh
 *
 * Then run:
 *     node test/run-tests.js
 *
 * Tolerances: the golden file stores Python's values rounded to 4 (compound)
 * and 3 (pos/neu/neg) decimals, so we allow half of the last rounded digit
 * plus a small float epsilon.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const VADER = require('../vader.js');

const HERE = __dirname;
const FIXTURES = path.join(HERE, 'fixtures');
const LEXICON_PATH = path.join(FIXTURES, 'vader_lexicon.txt');
const EMOJI_PATH = path.join(FIXTURES, 'emoji_utf8_lexicon.txt');

if (!fs.existsSync(LEXICON_PATH) || !fs.existsSync(EMOJI_PATH)) {
    console.error('Missing lexicon fixtures. Run first:\n    bash test/fetch-fixtures.sh');
    process.exit(2);
}

const golden = JSON.parse(fs.readFileSync(path.join(HERE, 'golden.json'), 'utf-8'));
const { lexicon } = VADER.parseLexicon(fs.readFileSync(LEXICON_PATH, 'utf-8'));
const { lexicon: emojiLexicon } = VADER.parseEmojiLexicon(fs.readFileSync(EMOJI_PATH, 'utf-8'));

const COMPOUND_TOL = 0.00005 + 1e-9; // golden rounded to 4 decimals
const RATIO_TOL = 0.0005 + 1e-9;     // golden rounded to 3 decimals

let failures = 0;
let checked = 0;

function check(label, condition, detail) {
    checked++;
    if (!condition) {
        failures++;
        console.error('FAIL: ' + label + (detail ? '\n      ' + detail : ''));
    }
}

// Sanity: lexicon parsing agrees with the reference loader
check('lexicon entry count matches reference (' + golden.lexicon_entries + ')',
    Object.keys(lexicon).length === golden.lexicon_entries,
    'got ' + Object.keys(lexicon).length);
check('emoji entry count matches reference (' + golden.emoji_entries + ')',
    Object.keys(emojiLexicon).length === golden.emoji_entries,
    'got ' + Object.keys(emojiLexicon).length);

for (const { text, expected } of golden.cases) {
    const r = VADER.analyze(text, lexicon, emojiLexicon);
    const diffs = [];
    if (Math.abs(r.compound - expected.compound) > COMPOUND_TOL) {
        diffs.push('compound ' + r.compound.toFixed(6) + ' != ' + expected.compound);
    }
    for (const key of ['pos', 'neu', 'neg']) {
        if (Math.abs(r[key] - expected[key]) > RATIO_TOL) {
            diffs.push(key + ' ' + r[key].toFixed(6) + ' != ' + expected[key]);
        }
    }
    check(JSON.stringify(text), diffs.length === 0, diffs.join(', '));
}

console.log('');
if (failures > 0) {
    console.log(failures + ' / ' + checked + ' checks FAILED (reference: ' + golden.reference + ')');
    process.exit(1);
} else {
    console.log('All ' + checked + ' checks passed (reference: ' + golden.reference + ')');
}
