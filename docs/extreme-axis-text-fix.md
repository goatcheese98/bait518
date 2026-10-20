# Extreme finite tick text — reproduced follow-up

Review of explorer `4777d5c` found that a valid axis [-1e308, 0] has a finite span, but `(span * step) / 4` overflows at step 2 before division. Existing SVG-attribute assertions could not detect the resulting infinite tick text.

The new browser fixtures were run before the fix against the existing production build. Duration, regional and distribution cases all failed: their actual `svg text` included `-Infinity`, even though point/line attributes remained finite. The fixtures supply one real numeric observation with annual adjustment -1e308, preserve its exact source value in Table, then exercise HTTP error and retry recovery to production data.

All five chart tick consumers (including the primary and first-year comparisons with the same arithmetic) now multiply by the bounded fraction `step / 4` before applying the span. No source value, mean, rounding, count, bubble size, year, series or ordinary axis formula is changed. The same three browser regressions now pass and check both actual label text and every numeric SVG shape attribute. All previous 70 unit / 48 browser cases remain, producing 51 cases per engine for the full three-engine suite.

This is part of the sole-owner dependency-security pass on the same explorer draft stack. CSV bytes, foundation base, native Vue stack and LUM layout remain intact. Passing checks are not independent approval, and the private hosting blocker is unchanged.
