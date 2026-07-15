#!/usr/bin/env bash
# Download the VADER lexicon files used by the tests.
# They are distributed in the original VADER repository (MIT license) and are
# intentionally not committed here — see the License section of README.md.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
FIXTURES="$HERE/fixtures"
BASE="https://raw.githubusercontent.com/cjhutto/vaderSentiment/master/vaderSentiment"

mkdir -p "$FIXTURES"

for f in vader_lexicon.txt emoji_utf8_lexicon.txt; do
    if [ -s "$FIXTURES/$f" ]; then
        echo "already present: $f"
    else
        echo "downloading: $f"
        curl -fsSL "$BASE/$f" -o "$FIXTURES/$f"
    fi
done

echo "fixtures ready in $FIXTURES"
