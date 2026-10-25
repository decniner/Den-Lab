# Cute Japan Adventures — KDP pilot

A prototype coloring-book project prepared from the TikTok business strategy discussion.

## Files

- `cute-japan-adventures-interior.pdf` — 64-page, 8.5 × 11 inch black-and-white interior with 30 Japan-inspired scenes and blank reverse pages.
- `cute-japan-adventures-cover.pdf` — paperback wrap sized for 64 pages on white paper.
- `launch-brief.md` — draft listing copy, unit economics, market notes, and a cautious launch plan.
- `build_coloring_book.py` — source generator for the two PDFs. It requires Python and ReportLab.

## Status

This is a **prototype**, not a finished commercial edition. The vector illustrations are simple and need a full quality review. Strengthen the product angle, review every page, verify the current KDP settings and AI-content disclosure, and order a printed proof before listing it for sale. The PDFs have not been uploaded to KDP.

The interior uses original generic Japan-inspired scenes. It does not reproduce a competitor's artwork. No sales or demand claims are made.

## Rebuild

```bash
python build_coloring_book.py
```

The script writes the interior and cover PDFs beside itself. Changing page count, trim size, or paper type requires recalculating the cover dimensions.
