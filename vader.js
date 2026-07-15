/**
 * vader.js — JavaScript port of VADER (Valence Aware Dictionary and sEntiment Reasoner)
 *
 * This is a faithful line-by-line port of the reference Python implementation
 * (vaderSentiment 3.3.2, https://github.com/cjhutto/vaderSentiment), including
 * its documented quirks, so that outputs match the reference exactly.
 * Parity is enforced by the golden tests in test/run-tests.js.
 *
 * In addition to the scores, analyze() records a human-readable list of the
 * rule adjustments applied to each token, which the UI displays.
 *
 * If you use the VADER sentiment analysis tools, please cite:
 * Hutto, C.J. & Gilbert, E.E. (2014). VADER: A Parsimonious Rule-based Model for
 * Sentiment Analysis of Social Media Text. Eighth International Conference on
 * Weblogs and Social Media (ICWSM-14). Ann Arbor, MI, June 2014.
 */
(function (global, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else {
        global.VADER = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // ##Constants## (identical to the reference implementation)

    const B_INCR = 0.293;
    const B_DECR = -0.293;
    const C_INCR = 0.733;
    const N_SCALAR = -0.74;

    const NEGATE = new Set([
        "aint", "arent", "cannot", "cant", "couldnt", "darent", "didnt", "doesnt",
        "ain't", "aren't", "can't", "couldn't", "daren't", "didn't", "doesn't",
        "dont", "hadnt", "hasnt", "havent", "isnt", "mightnt", "mustnt", "neither",
        "don't", "hadn't", "hasn't", "haven't", "isn't", "mightn't", "mustn't",
        "neednt", "needn't", "never", "none", "nope", "nor", "not", "nothing", "nowhere",
        "oughtnt", "shant", "shouldnt", "uhuh", "wasnt", "werent",
        "oughtn't", "shan't", "shouldn't", "uh-uh", "wasn't", "weren't",
        "without", "wont", "wouldnt", "won't", "wouldn't", "rarely", "seldom", "despite"
    ]);

    const BOOSTER_DICT = {
        "absolutely": B_INCR, "amazingly": B_INCR, "awfully": B_INCR,
        "completely": B_INCR, "considerable": B_INCR, "considerably": B_INCR,
        "decidedly": B_INCR, "deeply": B_INCR, "effing": B_INCR, "enormous": B_INCR, "enormously": B_INCR,
        "entirely": B_INCR, "especially": B_INCR, "exceptional": B_INCR, "exceptionally": B_INCR,
        "extreme": B_INCR, "extremely": B_INCR,
        "fabulously": B_INCR, "flipping": B_INCR, "flippin": B_INCR, "frackin": B_INCR, "fracking": B_INCR,
        "fricking": B_INCR, "frickin": B_INCR, "frigging": B_INCR, "friggin": B_INCR, "fully": B_INCR,
        "fuckin": B_INCR, "fucking": B_INCR, "fuggin": B_INCR, "fugging": B_INCR,
        "greatly": B_INCR, "hella": B_INCR, "highly": B_INCR, "hugely": B_INCR,
        "incredible": B_INCR, "incredibly": B_INCR, "intensely": B_INCR,
        "major": B_INCR, "majorly": B_INCR, "more": B_INCR, "most": B_INCR, "particularly": B_INCR,
        "purely": B_INCR, "quite": B_INCR, "really": B_INCR, "remarkably": B_INCR,
        "so": B_INCR, "substantially": B_INCR,
        "thoroughly": B_INCR, "total": B_INCR, "totally": B_INCR, "tremendous": B_INCR, "tremendously": B_INCR,
        "uber": B_INCR, "unbelievably": B_INCR, "unusually": B_INCR, "utter": B_INCR, "utterly": B_INCR,
        "very": B_INCR,
        "almost": B_DECR, "barely": B_DECR, "hardly": B_DECR, "just enough": B_DECR,
        "kind of": B_DECR, "kinda": B_DECR, "kindof": B_DECR, "kind-of": B_DECR,
        "less": B_DECR, "little": B_DECR, "marginal": B_DECR, "marginally": B_DECR,
        "occasional": B_DECR, "occasionally": B_DECR, "partly": B_DECR,
        "scarce": B_DECR, "scarcely": B_DECR, "slight": B_DECR, "slightly": B_DECR, "somewhat": B_DECR,
        "sort of": B_DECR, "sorta": B_DECR, "sortof": B_DECR, "sort-of": B_DECR
    };

    const SPECIAL_CASES = {
        "the shit": 3, "the bomb": 3, "bad ass": 1.5, "badass": 1.5, "bus stop": 0.0,
        "yeah right": -2, "kiss of death": -1.5, "to die for": 3, "beating heart": 3.5
    };

    // Python's string.punctuation
    const PUNCTUATION = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";
    const PUNC_SET = new Set(PUNCTUATION);

    // ## Helpers mirroring Python built-ins ##

    // Python str.isupper(): at least one cased character, and no lowercase ones.
    function isUpper(word) {
        return /[A-Z]/.test(word) && !/[a-z]/.test(word);
    }

    // Python str.strip(string.punctuation)
    function stripPunctuation(token) {
        let start = 0;
        let end = token.length;
        while (start < end && PUNC_SET.has(token[start])) start++;
        while (end > start && PUNC_SET.has(token[end - 1])) end--;
        return token.slice(start, end);
    }

    function hasKey(obj, key) {
        return Object.prototype.hasOwnProperty.call(obj, key);
    }

    // ## Static methods (reference: module-level functions) ##

    function negated(inputWords, includeNt) {
        if (includeNt === undefined) includeNt = true;
        const words = inputWords.map(w => String(w).toLowerCase());
        for (const word of words) {
            if (NEGATE.has(word)) return true;
        }
        if (includeNt) {
            for (const word of words) {
                if (word.includes("n't")) return true;
            }
        }
        return false;
    }

    function normalize(score, alpha) {
        if (alpha === undefined) alpha = 15;
        const normScore = score / Math.sqrt(score * score + alpha);
        if (normScore < -1.0) return -1.0;
        if (normScore > 1.0) return 1.0;
        return normScore;
    }

    function allcapDifferential(words) {
        let allcapWords = 0;
        for (const word of words) {
            if (isUpper(word)) allcapWords++;
        }
        const capDifferential = words.length - allcapWords;
        return capDifferential > 0 && capDifferential < words.length;
    }

    function scalarIncDec(word, valence, isCapDiff) {
        let scalar = 0.0;
        const wordLower = word.toLowerCase();
        if (hasKey(BOOSTER_DICT, wordLower)) {
            scalar = BOOSTER_DICT[wordLower];
            if (valence < 0) scalar *= -1;
            // check if booster/dampener word is in ALLCAPS (while others aren't)
            if (isUpper(word) && isCapDiff) {
                if (valence > 0) scalar += C_INCR;
                else scalar -= C_INCR;
            }
        }
        return scalar;
    }

    // ## SentiText ##

    // Removes leading/trailing punctuation; if the result has two or fewer
    // characters it was likely an emoticon (":)", "<3", ":D"), keep the original.
    function stripPuncIfWord(token) {
        const stripped = stripPunctuation(token);
        if (stripped.length <= 2) return token;
        return stripped;
    }

    function wordsAndEmoticons(text) {
        const trimmed = text.trim();
        if (trimmed === '') return [];
        return trimmed.split(/\s+/).map(stripPuncIfWord);
    }

    // ## Lexicon file parsing ##

    // vader_lexicon.txt is TAB-separated: token, mean score, std. deviation, raw ratings.
    // The reference only reads the first two fields; we also keep stdDev/ratings for the UI.
    function parseLexicon(content) {
        const lexicon = Object.create(null);
        const stats = {
            total: 0, positive: 0, negative: 0, neutral: 0,
            sumScore: 0, minScore: Infinity, maxScore: -Infinity, avgScore: 0
        };

        for (const rawLine of content.split('\n')) {
            const line = rawLine.trim();
            if (!line) continue;
            const parts = line.split('\t');
            if (parts.length < 2) continue;

            const token = parts[0];
            const score = parseFloat(parts[1]);
            if (isNaN(score)) continue;

            const stdDev = parts.length > 2 ? parseFloat(parts[2]) : NaN;
            let ratings = [];
            if (parts.length > 3) {
                const ratingsMatch = parts[3].match(/\[([^\]]+)\]/);
                if (ratingsMatch) {
                    ratings = ratingsMatch[1].split(',')
                        .map(r => parseFloat(r.trim()))
                        .filter(n => !isNaN(n));
                }
            }

            lexicon[token] = { score, stdDev: isNaN(stdDev) ? 0 : stdDev, ratings };

            stats.total++;
            stats.sumScore += score;
            stats.minScore = Math.min(stats.minScore, score);
            stats.maxScore = Math.max(stats.maxScore, score);
            if (score > 0.05) stats.positive++;
            else if (score < -0.05) stats.negative++;
            else stats.neutral++;
        }

        stats.avgScore = stats.total > 0 ? stats.sumScore / stats.total : 0;
        return { lexicon, stats };
    }

    // emoji_utf8_lexicon.txt is TAB-separated: emoji, textual description.
    function parseEmojiLexicon(content) {
        const lexicon = Object.create(null);
        let count = 0;
        for (const rawLine of content.split('\n')) {
            const line = rawLine.trim();
            if (!line) continue;
            const parts = line.split('\t');
            if (parts.length < 2) continue;
            lexicon[parts[0]] = parts[1];
            count++;
        }
        return { lexicon, count };
    }

    // ## Analyzer internals (ports of SentimentIntensityAnalyzer methods) ##

    function lexScore(lexicon, key) {
        return lexicon[key].score;
    }

    // Reference: polarity_scores() emoji-to-description preprocessing.
    // Iterates code points, exactly like Python's `for chr in text`.
    function replaceEmojis(text, emojiLexicon) {
        let out = '';
        let prevSpace = true;
        for (const ch of text) {
            if (hasKey(emojiLexicon, ch)) {
                const description = emojiLexicon[ch];
                if (!prevSpace) out += ' ';
                out += description;
                prevSpace = false;
            } else {
                out += ch;
                prevSpace = ch === ' ';
            }
        }
        return out.trim();
    }

    function leastCheck(valence, wes, i, lexicon, notes) {
        if (i > 1 && !hasKey(lexicon, wes[i - 1].toLowerCase())
                && wes[i - 1].toLowerCase() === "least") {
            if (wes[i - 2].toLowerCase() !== "at" && wes[i - 2].toLowerCase() !== "very") {
                valence = valence * N_SCALAR;
                notes.push('"least"による否定 / Negation by "least" (×' + N_SCALAR + ')');
            }
        } else if (i > 0 && !hasKey(lexicon, wes[i - 1].toLowerCase())
                && wes[i - 1].toLowerCase() === "least") {
            valence = valence * N_SCALAR;
            notes.push('"least"による否定 / Negation by "least" (×' + N_SCALAR + ')');
        }
        return valence;
    }

    // Reference _but_check, including its quirk of locating each value with
    // list.index() (first occurrence) while iterating. Kept intentionally so
    // that scores match the Python implementation on every input.
    function butCheck(wesLower, valences) {
        const bi = wesLower.indexOf('but');
        if (bi === -1) return valences;
        for (let k = 0; k < valences.length; k++) {
            const sentiment = valences[k];
            const si = valences.indexOf(sentiment);
            if (si < bi) {
                valences[si] = sentiment * 0.5;
            } else if (si > bi) {
                valences[si] = sentiment * 1.5;
            }
        }
        return valences;
    }

    function specialIdiomsCheck(valence, wes, i, notes) {
        const lower = wes.map(w => String(w).toLowerCase());
        const onezero = lower[i - 1] + " " + lower[i];
        const twoonezero = lower[i - 2] + " " + lower[i - 1] + " " + lower[i];
        const twoone = lower[i - 2] + " " + lower[i - 1];
        const threetwoone = lower[i - 3] + " " + lower[i - 2] + " " + lower[i - 1];
        const threetwo = lower[i - 3] + " " + lower[i - 2];

        const sequences = [onezero, twoonezero, twoone, threetwoone, threetwo];
        for (const seq of sequences) {
            if (hasKey(SPECIAL_CASES, seq)) {
                valence = SPECIAL_CASES[seq];
                notes.push('イディオム / Idiom: "' + seq + '" (=' + valence + ')');
                break;
            }
        }

        if (lower.length - 1 > i) {
            const zeroone = lower[i] + " " + lower[i + 1];
            if (hasKey(SPECIAL_CASES, zeroone)) {
                valence = SPECIAL_CASES[zeroone];
                notes.push('イディオム / Idiom: "' + zeroone + '" (=' + valence + ')');
            }
        }
        if (lower.length - 1 > i + 1) {
            const zeroonetwo = lower[i] + " " + lower[i + 1] + " " + lower[i + 2];
            if (hasKey(SPECIAL_CASES, zeroonetwo)) {
                valence = SPECIAL_CASES[zeroonetwo];
                notes.push('イディオム / Idiom: "' + zeroonetwo + '" (=' + valence + ')');
            }
        }

        // check for booster/dampener bi-grams such as 'sort of' or 'kind of'
        const nGrams = [threetwoone, threetwo, twoone];
        for (const nGram of nGrams) {
            if (hasKey(BOOSTER_DICT, nGram)) {
                valence = valence + BOOSTER_DICT[nGram];
                notes.push('複数語の強調表現 / Multiword booster: "' + nGram + '" (' +
                    (BOOSTER_DICT[nGram] > 0 ? '+' : '') + BOOSTER_DICT[nGram] + ')');
            }
        }
        return valence;
    }

    function negationCheck(valence, wes, startI, i, notes) {
        const lower = wes.map(w => String(w).toLowerCase());
        if (startI === 0) {
            if (negated([lower[i - (startI + 1)]])) {
                valence = valence * N_SCALAR;
                notes.push('否定効果 / Negation: "' + lower[i - 1] + '" (×' + N_SCALAR + ')');
            }
        }
        if (startI === 1) {
            if (lower[i - 2] === "never" && (lower[i - 1] === "so" || lower[i - 1] === "this")) {
                valence = valence * 1.25;
                notes.push('"never so/this" 強調 / Emphasis (×1.25)');
            } else if (lower[i - 2] === "without" && lower[i - 1] === "doubt") {
                // "without doubt" is not a negation
            } else if (negated([lower[i - (startI + 1)]])) {
                valence = valence * N_SCALAR;
                notes.push('否定効果 / Negation: "' + lower[i - 2] + '" (×' + N_SCALAR + ')');
            }
        }
        if (startI === 2) {
            if (lower[i - 3] === "never" &&
                    (lower[i - 2] === "so" || lower[i - 2] === "this" ||
                     lower[i - 1] === "so" || lower[i - 1] === "this")) {
                valence = valence * 1.25;
                notes.push('"never so/this" 強調 / Emphasis (×1.25)');
            } else if (lower[i - 3] === "without" &&
                    (lower[i - 2] === "doubt" || lower[i - 1] === "doubt")) {
                // "without doubt" is not a negation
            } else if (negated([lower[i - (startI + 1)]])) {
                valence = valence * N_SCALAR;
                notes.push('否定効果 / Negation: "' + lower[i - 3] + '" (×' + N_SCALAR + ')');
            }
        }
        return valence;
    }

    function sentimentValence(valence, wes, isCapDiff, item, i, lexicon, notes) {
        const itemLower = item.toLowerCase();
        if (!hasKey(lexicon, itemLower)) {
            return valence;
        }
        // get the sentiment valence
        valence = lexScore(lexicon, itemLower);

        // "no" as negation for an adjacent lexicon item vs stand-alone "no"
        if (itemLower === "no" && i !== wes.length - 1 && hasKey(lexicon, wes[i + 1].toLowerCase())) {
            valence = 0.0;
            notes.push('次の語を否定する "no" / "no" negating the next word (score→0)');
        }
        if ((i > 0 && wes[i - 1].toLowerCase() === "no")
                || (i > 1 && wes[i - 2].toLowerCase() === "no")
                || (i > 2 && wes[i - 3].toLowerCase() === "no"
                    && ["or", "nor"].includes(wes[i - 1].toLowerCase()))) {
            valence = lexScore(lexicon, itemLower) * N_SCALAR;
            notes.push('"no"による否定 / Negation by "no" (×' + N_SCALAR + ')');
        }

        // check if sentiment laden word is in ALL CAPS (while others aren't)
        if (isUpper(item) && isCapDiff) {
            if (valence > 0) valence += C_INCR;
            else valence -= C_INCR;
            notes.push('全て大文字 / ALL CAPS (±' + C_INCR + ')');
        }

        for (let startI = 0; startI < 3; startI++) {
            // dampen the scalar modifier of preceding words and emoticons
            // (excluding the ones that immediately precede the item) based
            // on their distance from the current item.
            if (i > startI && !hasKey(lexicon, wes[i - (startI + 1)].toLowerCase())) {
                let s = scalarIncDec(wes[i - (startI + 1)], valence, isCapDiff);
                if (startI === 1 && s !== 0) s = s * 0.95;
                if (startI === 2 && s !== 0) s = s * 0.9;
                if (s !== 0) {
                    notes.push('強調・弱化語 / Booster: "' + wes[i - (startI + 1)] +
                        '" (' + (s > 0 ? '+' : '') + s.toFixed(3) + ', 距離/distance ' + (startI + 1) + ')');
                }
                valence = valence + s;
                valence = negationCheck(valence, wes, startI, i, notes);
                if (startI === 2) {
                    valence = specialIdiomsCheck(valence, wes, i, notes);
                }
            }
        }

        valence = leastCheck(valence, wes, i, lexicon, notes);
        return valence;
    }

    function amplifyEp(text) {
        let epCount = (text.match(/!/g) || []).length;
        if (epCount > 4) epCount = 4;
        return epCount * 0.292;
    }

    function amplifyQm(text) {
        const qmCount = (text.match(/\?/g) || []).length;
        if (qmCount > 1) {
            if (qmCount <= 3) return qmCount * 0.18;
            return 0.96;
        }
        return 0;
    }

    function punctuationEmphasis(text) {
        return amplifyEp(text) + amplifyQm(text);
    }

    function siftSentimentScores(valences) {
        let posSum = 0.0;
        let negSum = 0.0;
        let neuCount = 0;
        for (const v of valences) {
            if (v > 0) posSum += v + 1; // compensates for neutral words that are counted as 1
            if (v < 0) negSum += v - 1; // when used with Math.abs(), compensates for neutrals
            if (v === 0) neuCount++;
        }
        return { posSum, negSum, neuCount };
    }

    function scoreValence(valences, text) {
        let compound = 0.0, pos = 0.0, neg = 0.0, neu = 0.0;
        const punctEmphasis = punctuationEmphasis(text);
        if (valences.length > 0) {
            let sumS = valences.reduce((a, b) => a + b, 0);
            if (sumS > 0) sumS += punctEmphasis;
            else if (sumS < 0) sumS -= punctEmphasis;

            compound = normalize(sumS);

            let { posSum, negSum, neuCount } = siftSentimentScores(valences);
            if (posSum > Math.abs(negSum)) posSum += punctEmphasis;
            else if (posSum < Math.abs(negSum)) negSum -= punctEmphasis;

            const total = posSum + Math.abs(negSum) + neuCount;
            pos = Math.abs(posSum / total);
            neg = Math.abs(negSum / total);
            neu = Math.abs(neuCount / total);
        }
        return { compound, pos, neg, neu, punctEmphasis };
    }

    /**
     * Analyze the sentiment of a text. Port of polarity_scores(), returning
     * per-token detail records alongside the scores.
     *
     * @param {string} text
     * @param {Object} lexicon - token -> {score, stdDev, ratings} (from parseLexicon)
     * @param {Object} [emojiLexicon] - emoji -> description (from parseEmojiLexicon)
     * @returns {{compound:number, pos:number, neu:number, neg:number,
     *            punctEmphasis:number, analyzedText:string, sentiments:Array}}
     */
    function analyze(text, lexicon, emojiLexicon) {
        // convert emojis to their textual descriptions
        if (emojiLexicon) {
            text = replaceEmojis(text, emojiLexicon);
        } else {
            text = text.trim();
        }

        const wes = wordsAndEmoticons(text);
        const isCapDiff = allcapDifferential(wes);
        const wesLower = wes.map(w => w.toLowerCase());

        const valences = [];
        const details = [];

        for (let i = 0; i < wes.length; i++) {
            const item = wes[i];
            const itemLower = wesLower[i];
            const notes = [];
            let kind = 'word';
            let valence = 0;

            // words that may be used as modifiers or negations score 0 themselves
            if (hasKey(BOOSTER_DICT, itemLower)) {
                kind = 'booster';
                notes.push('強調・弱化語自体はスコア0 / Booster word itself scores 0');
            } else if (i < wes.length - 1 && itemLower === "kind" && wesLower[i + 1] === "of") {
                kind = 'booster';
                notes.push('"kind of" の一部 / Part of "kind of" (score 0)');
            } else {
                valence = sentimentValence(valence, wes, isCapDiff, item, i, lexicon, notes);
                if (NEGATE.has(itemLower)) {
                    kind = 'negation';
                    notes.push('否定語 / Negation word');
                }
            }

            valences.push(valence);
            const entry = hasKey(lexicon, itemLower) ? lexicon[itemLower] : null;
            details.push({
                token: item,
                kind,
                score: (kind === 'word' && entry) ? entry.score : 0,
                stdDev: (kind === 'word' && entry) ? entry.stdDev : 0,
                adjustments: notes
            });
        }

        // contrastive conjunction 'but'
        const preBut = valences.slice();
        butCheck(wesLower, valences);
        const butIndex = wesLower.indexOf('but');
        for (let k = 0; k < details.length; k++) {
            if (valences[k] !== preBut[k]) {
                details[k].adjustments.push(k < butIndex
                    ? '"but"より前の減衰 / Before "but" (×0.5)'
                    : '"but"より後の強調 / After "but" (×1.5)');
            }
            details[k].adjustedScore = valences[k];
            details[k].type = classify(details[k], valences[k]);
        }

        const scores = scoreValence(valences, text);
        return {
            compound: scores.compound,
            pos: scores.pos,
            neu: scores.neu,
            neg: scores.neg,
            punctEmphasis: scores.punctEmphasis,
            analyzedText: text,
            sentiments: details
        };
    }

    function classify(detail, finalValence) {
        if (detail.kind === 'negation') return 'negation';
        if (detail.kind === 'booster') return 'booster';
        const base = detail.score;
        if (base > 0 && finalValence < 0) return 'negated_positive';
        if (base < 0 && finalValence > 0) return 'negated_negative';
        if (finalValence > 0) return 'positive';
        if (finalValence < 0) return 'negative';
        return 'neutral';
    }

    // ## Sentence splitting (application feature, not part of the reference) ##

    function splitIntoSentences(text) {
        const protectedText = text
            .replace(/\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|Inc|Ltd|Corp|Co)\./gi, '$1<PERIOD>')
            .replace(/\b([A-Z])\./g, '$1<PERIOD>');

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

        return sentences.filter(s => s.length > 0);
    }

    return {
        analyze,
        parseLexicon,
        parseEmojiLexicon,
        splitIntoSentences,
        // exported for tests
        wordsAndEmoticons,
        allcapDifferential,
        negated,
        normalize,
        NEGATE,
        BOOSTER_DICT,
        SPECIAL_CASES,
        B_INCR, B_DECR, C_INCR, N_SCALAR
    };
});
