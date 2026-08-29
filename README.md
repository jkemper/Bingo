# Bingo Card Marker

A simple, phone-friendly web app for playing paper bingo. Enter your card(s) once, pick tonight's
winning pattern, then tap each number the caller announces — the app marks it on your card(s) and
tells you the moment you have a bingo.

No install, no server, no account. It's a static site: open `index.html` in a browser, or host the
folder anywhere (e.g. GitHub Pages) and open it on your phone.

## How to use it

1. **Cards tab** — The app ships pre-loaded with the 6 cards from serial 6811532 (named by their
   printed card ID: 235, 735, 1235, 1735, 2235, 2735), transcribed from the photo. Double check
   them against the physical cards before playing — worth the 30 seconds since a single wrong digit
   could cause a false or missed win.

   To add more cards or fix a number, type into the grid (the center square is always FREE), or
   paste all 24 at once into the quick-fill box in this reading order: B column top-to-bottom, then
   I, then N (skipping FREE), then G, then O.

   This pre-fill only applies the first time the app runs with no saved data — "New Game" clears
   marks, not card numbers, so it won't restore them. If you'd already opened the app before the
   cards were added, either edit the existing card(s) by hand on the Cards tab, or clear this
   site's browsing data to pick up the pre-filled set on next load.

2. **Patterns tab** — Games 1–6 come preloaded with common patterns (Across, Letter L, Top &
   Bottom, Block of 4, Plus Sign, Triple Bingo). If tonight's caller describes something different,
   tap squares on that game's grid to set an exact custom pattern — it's remembered until you reset
   it.

3. **Play tab** — Pick the current game number, then tap the letter and number the caller announces.
   It's marked automatically on every card. Each card shows how many squares are still needed
   ("X to go"), and a full-screen alert (with sound/vibration) fires the instant a card completes
   the active pattern. You can also tap a square directly on a card to mark/unmark it by hand, and
   "Undo last" fixes a mis-tap. "New Game" clears all marks and called numbers between rounds,
   keeping your card numbers intact.

Everything is saved to the browser's local storage, so closing and reopening the page keeps your
cards, patterns, and progress.
