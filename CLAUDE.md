# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Chase Hanson's personal portfolio site, styled as a fake terminal (`chase@portfolio: ~`). Plain HTML/CSS/JS, no framework, no build step, no package manager, no tests — served as static files (e.g. GitHub Pages).

This is a legacy codebase. When making changes, prefer removing/consolidating code over adding to it, and keep additions minimal — do not introduce a framework, bundler, or build step unless explicitly asked.

## Commands

There is no build/lint/test tooling. To preview locally, serve the repo root with any static file server and open it over HTTP (not `file://`, since the homepage `fetch()`s `.md` files):

```
python3 -m http.server 8000
# open http://localhost:8000/index.html
```

## Architecture

Single-page terminal-themed blog — everything lives at the repo root, there are no section subdirectories.

- `index.html` defines the whole UI: a sidebar profile card plus a fake terminal window (`chase@portfolio: ~`) whose `ls -la` output is a hand-written `.file-item` list of every post.
- `script.js` handles `downloadResume()` and, when a post link is clicked, `showMarkdown(filename)` — which `fetch()`s the `.md` file, runs it through the hand-rolled regex-based `markdownToHtml()`, and swaps it into `.terminal-content` in place of the listing (a "← Back to directory listing" link calls `location.reload()` to restore it).
- Posts are plain `.md` files at the repo root (currently `methodology.md`, `deeplearning-course-notes.md`). They are **not** discovered dynamically — adding a post means dropping the `.md` file at the root *and* manually adding a matching `.file-item`/`showMarkdown('file.md')` row in `index.html`'s listing.
- `typing-animation.js` exports `initializeTypingAnimation(pageType)`, which looks up a command list from the `typingAnimations` object (currently only the `main` key is used) and types/deletes it into `#typed-command` on `DOMContentLoaded`.
- `style.css` defines the terminal look (dark theme, `#FA3A62`/`#FA5741` accent colors) and the responsive breakpoints that collapse the sidebar to an icon under 1024px/768px.
- `assets/` holds `pfpic.png` and `resume.pdf`, referenced by relative path from the root.
