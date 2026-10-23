# Text encoding and mojibake prevention

Save all site source files as UTF-8. The root `.editorconfig` declares UTF-8 and LF line endings; configure editors and scripts to honor it. Windows PowerShell 5.1 commands can use different defaults, so always specify UTF-8 when writing files.

## Safe editing rules

- If text appears as sequences of unrelated accented letters or replacement diamonds, treat it as an encoding error. Restore the intended punctuation or use an HTML entity.
- Never decode UTF-8 as Windows-1252 or ANSI and then save it as UTF-8. That turns valid punctuation into mojibake.
- For PowerShell, use `[System.IO.File]::WriteAllText($path, $text, [System.Text.UTF8Encoding]::new($false))` or explicitly specify `-Encoding utf8`.
- Preserve existing file encoding. Do not mass-convert unrelated files.

## Before publishing

1. Search edited source files for suspicious accented-character sequences and the Unicode replacement character.
2. Inspect every match. Confirm user-facing text displays as intended.
3. Run syntax checks and relevant tests. The city field-guide test rejects common corruption marker characters.
4. Check the rendered or published page when possible; a clean editor buffer alone does not prove the browser receives correct text.

`.editorconfig` declares the repository encoding; this guide records the safe-editing and review steps that prevent encoding mistakes from returning.