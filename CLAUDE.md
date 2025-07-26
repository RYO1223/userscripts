# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a Tampermonkey/Greasemonkey userscripts repository containing browser automation scripts written in JavaScript. The scripts enhance functionality on various websites.

## Project Structure

```
/workspaces/userscripts/
├── README.md              # Japanese documentation with installation links
└── note-toc-fixed.user.js # Table of contents script for note.com
```

## Development Workflow

### Userscript Header Format
All userscripts must include a metadata block following the Greasemonkey/Tampermonkey format:
- `@name`: Script name in Japanese
- `@namespace`: http://tampermonkey.net/
- `@version`: Semantic versioning (e.g., 2.0)
- `@description`: Japanese description
- `@match`: Target URL patterns
- `@grant`: Required permissions (e.g., GM_addStyle)
- `@updateURL` / `@downloadURL`: GitHub raw URLs for auto-updates

### Code Patterns

1. **Strict Mode**: All scripts use 'use strict' within an IIFE
2. **DOM Manipulation**: Scripts wait for DOM ready state or use setTimeout for dynamic content
3. **MutationObserver**: Used for handling dynamically loaded content
4. **Japanese Comments**: Code comments and user-facing text are in Japanese

### Key Considerations

- No build system or package.json - scripts are distributed as raw JavaScript files
- Scripts are hosted on GitHub and installed via raw GitHub URLs
- Target websites may have dynamic content requiring observers and timeouts
- CSS is injected using GM_addStyle for style modifications
- Scripts should handle multiple selector patterns for robustness

### GitHub Integration

- Main branch: `main`
- Update URLs point to: `https://raw.githubusercontent.com/RYO1223/userscripts/main/[filename]`
- Installation links in README use raw GitHub URLs