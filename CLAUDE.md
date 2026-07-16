# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Chase Hanson's personal portfolio site, styled as a fake terminal (`chase@portfolio: ~`). Plain HTML/CSS/JS, no framework, no build step, no package manager, no tests — served as static files (e.g. GitHub Pages).

This is a legacy codebase with real duplication (see below). When making changes, prefer removing/consolidating code over adding to the duplication, and keep additions minimal — do not introduce a framework, bundler, or build step unless explicitly asked.

## Commands

There is no build/lint/test tooling. To preview locally, serve the repo root with any static file server and open it over HTTP (not `file://`, since section pages `fetch()` their `.md` files):

```
python3 -m http.server 8000
# open http://localhost:8000/index.html
```

## Architecture

- `index.html`, `style.css`, `script.js`, `typing-animation.js` (repo root) define the shared UI — a sidebar profile card plus a fake terminal window — and drive the homepage.
- Each top-level content directory (`AI-Writeups/`, `Blog-Posts/`, `Hacking-Writeups/`, `Projects/`) is a "section" with its own `index.html`. Section pages reuse the same sidebar/terminal markup and link `../style.css` and `../typing-animation.js`, but do **not** load the root `script.js`. Instead, each section's `index.html` inlines its own copies of `downloadResume()`, `showMarkdown()`, and a hand-rolled regex-based `markdownToHtml()` converter in a `<script>` block at the bottom of the file — five near-identical copies of this logic exist across the repo (`script.js` + the four section pages).
- Write-ups within a section are plain `.md` files (e.g. `Projects/test.md`). They are **not** discovered dynamically: the `ls -la`-style file listing in each section's `index.html` is hand-written HTML. Adding a post means manually adding a `.file-item` row with a `showMarkdown('file.md')` link *and* dropping the `.md` file alongside it — there is no directory scanning, despite what `Projects/test.md`'s own text claims.
- `typing-animation.js` exports `initializeTypingAnimation(pageType)`, which looks up the current page's command list from the `typingAnimations` object keyed by directory name (`main`, `Blog-Posts`, `Projects`, `AI-Writeups`, `Hacking-Writeups`). Each page calls it with its own key on `DOMContentLoaded`.
- `assets/` holds `pfpic.png` and `resume.pdf`, referenced by relative path (`../assets/...` from section pages, `assets/...` from root).

## Highest-leverage cleanup

`downloadResume()`, `showMarkdown()`, and `markdownToHtml()` are copy-pasted across `script.js` and all four section `index.html` files instead of living in one shared script; the sidebar/terminal-header markup is likewise duplicated across all five HTML files. Consolidating these (one shared JS file, one templated shell) is the most effective way to shrink this codebase without changing behavior.
