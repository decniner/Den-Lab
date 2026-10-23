# Somewhere in Japan Fixes Implementation Plan

**Goal:** Correct source-level content integrity, guide status, seasonal matching, origin scoping, map controls, story-dialog behavior, and responsive accessibility issues identified in the attached fix brief.

**Architecture:** Keep the static site and existing catalogue pipeline. Make source data and existing generators authoritative; add focused validation to the existing Node test suite; produce a photo provenance audit with conservative verdicts and remove images that cannot be verified.

**Tech Stack:** HTML, CSS, browser JavaScript, CommonJS build scripts, Node's built-in test runner.

**Spec:** User attachment `Codex prompt — Somewhere in Japan fixes.md`.

## Global constraints

- Preserve the dark green and cream palette, serif display type, existing filters, Local Finds, saves, shares, Tokyo planner, and travel honesty notes.
- Do not invent facts or photo provenance. Use provisional/unknown states when evidence is missing.
- Group commits by issue and publish the completed source to the existing GitHub Pages site.

## Tasks

1. Add source/output integrity checks; repair malformed numeric ranges and text corruption at the authoritative source; replace literal-question-mark icon placeholders.
2. Derive all catalogue counts from the 310-record loaded catalogue; expose honest complete/provisional guide status and gate guide CTAs accordingly.
3. Require month inclusion and month-specific rationale for seasonal picks; test all 12 months and correct contradictory seasonal entries.
4. Scope Tokyo-only tools to Tokyo; hide them for other city/airport origins or show an explicit, collapsed Tokyo-only notice.
5. Audit all 310 image records against their linked source metadata; remove unverifiable photos and generate `PHOTO_AUDIT.md`.
6. Separate southwest region pins and guarantee 44px hit targets; add accessible hero carousel controls with reduced-motion handling.
7. Correct gallery loading states, preserve complete contact copy, verify native-dialog focus behavior, fix heading levels and slash shortcut guards, and address contrast/overflow at the requested widths.
8. Run focused and full regression checks, generate `FIX_REPORT.md`, commit issue groups, deploy, and check the live site.

## Review focus

- A generated guide or seasonal card must never claim unsupported completeness or month relevance.
- An unverified image must not render as the named place.
- Tokyo estimates must not be shown as applying to another origin.
- Keyboard and mobile users must be able to use the map, carousel, dialog, filters, and search without losing existing state.

