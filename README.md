# Bingo Card Marker

A simple, phone-friendly web app for playing paper bingo. Enter your card(s) once, pick tonight's
winning pattern, then tap each number the caller announces — the app marks it on your card(s) and
tells you the moment you have a bingo.

No install, no server, no account. It's a static site: open `index.html` in a browser, or host the
folder anywhere (e.g. GitHub Pages) and open it on your phone.

## How to use it

1. **Cards tab** — Add a card for each physical card you're playing. Type the 24 numbers into the
   grid (the center square is always FREE), or paste all 24 at once into the quick-fill box in this
   reading order: B column top-to-bottom, then I, then N (skipping FREE), then G, then O.

   Numbers are entered manually rather than auto-read from a photo, since a single misread digit
   on a bingo card could cause a false or missed win — not worth the risk for a real game.

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
