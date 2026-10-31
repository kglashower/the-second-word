# The Second Word

A single-page site presenting the DMIN 7023 Reading Critique. Static HTML, CSS, and JS with no build step.

**Publish on GitHub Pages:** push these files to a repository, then in Settings → Pages choose "Deploy from a branch", branch `main`, folder `/ (root)`. The site is served from `index.html`.

**Edit the text:** the paper lives in `index.html` as plain HTML. Quotations are `<q class="peterson">` (or `rolheiser`, `sims`, `barton`); note markers are `<sup class="fn ..."><a href="#nN" id="rN" data-note="N">`. Notes are the ordered list under `#notes`; each `li` has `id="nN"` and a `data-books` attribute that colors its rule and popover.

**Fonts:** Source Serif 4 loads from Google Fonts. To self-host, download the variable font files, place them in `fonts/`, and replace the `<link>` tags in `index.html` with an `@font-face` block in `styles.css`.
