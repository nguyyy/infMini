# Infinite Mini Crossword

A browser-based, endlessly replayable mini crossword inspired by NYT Mini interactions.

## Features
- Endless generated 5x5-style mini grids using random seeds.
- Across/Down clues with numbered starts.
- Keyboard navigation and direction switching (`Space` toggles across/down).
- Auto-check toggle for immediate correctness feedback.
- Check/reveal current word or whole puzzle.
- Puzzle timer and instant generation of a new puzzle.
- Import NYT/LA Times mini puzzle pages and recreate a playable 5x5 grid in this app.

## Run
Run with a tiny static server (recommended so script loading is consistent across browsers):

```bash
python -m http.server 4173
```

Then open http://localhost:4173.

> Note: Some browsers restrict JavaScript module loading from `file://` URLs. This app now uses a classic script for wider compatibility, but serving over HTTP is still the most reliable way to run it.
