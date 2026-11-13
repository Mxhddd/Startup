# Pohnch Z-fold brochure

- `pohnch-brochure.pdf`: the one file. A4 landscape, 2 pages (outside, inside).
- `pohnch-brochure-outside.png`, `pohnch-brochure-inside.png`: previews.

Print: A4, double-sided, flip on the SHORT edge. Fold into a Z (accordion) with the dark cover panel on top.
Folds at 99 mm and 198 mm. Nothing crosses a fold (checked by the build).

The QR code opens https://pohnch.pk/app (checked by decoding the render). That page decides where people go,
so the printed code never needs to change: today the closed-testing steps, later the Play listing
(`JOIN.public` in packages/core/src/contact.ts).

Rebuild: from apps/web, `npx tsx ../../design/print/brochure/build.mts ../../design/print/brochure`.
