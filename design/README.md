# Designs

- Canvas (all screens, clickable prototype): https://claude.ai/artifact/FPmqJf681tEWFhcskvNQxy
- `DECISIONS.md`: chosen direction, the A5 review, design decisions, component names and tokens.
- `canvas/`: the source of every artboard (`.dc.html`) and the canvas layout (`canvas.json`). They render inside the canvas, not on their own.

| Prefix | Page | Screens |
| --- | --- | --- |
| `A1-` | A1 · Directions | Saaf (picked), Ghar, Sadak: driver mid-route and parent timeline |
| `D` | A2 · Driver | 1 welcome, 2 before trip, 3 mid-route (+ English), 4 reached school, 5 afternoon, 6 no signal, 7 link off, 1 child, 18 children |
| `P` | A3 · Parent | 1 join, 2 notifications (Android, iPhone), 3 timeline ×4, 4 chutti choose and confirm, 5 lock screen, 6 settings, 7 empty |
| `C`, `AD-` | A4 · Captain & admin | setup, share, admin table |
| `Main`, `Components`, `S-` | A5 · Prototype & review | start of the day prototype, component sheet, added loading/error/offline states |
