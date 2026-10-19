---
name: token-refresh
description: Use when an existing Google OAuth token expires, is revoked, or fails a service preflight and the user asks to restore access.
---

# Token Refresh

Refresh an existing OAuth authorization for the already configured account and service. Reuse the project's documented client, token path, and scopes; do not change the account, channel, or application configuration.

## Flow

1. Inspect the relevant project instructions to find its OAuth refresh command, configured token path, and a read-only preflight. Do not print or expose token contents, client secrets, authorization codes, or full OAuth URLs.
2. Run the documented authorization flow from the directory and Python environment where its module is available. Keep the existing token in place until the OAuth flow succeeds.
3. When Windows desktop-control commands are available and authorized, keep OAuth command output in a temporary local file, extract the authorization URL in memory, and open it in the user's visible Edge window without displaying or logging the URL. Capture the browser page area, inspect it, and click only the visible account labeled exactly **Denver Sanchez**. Use a fresh screenshot to locate the target on every page; never reuse coordinates from a prior screen or click blindly. Keep the address bar out of screenshots when practical, and capture/inspect again after the click. Delete temporary OAuth output after the flow ends.
4. Do not enter passwords, one-time codes, recovery codes, or security answers. Do not solve CAPTCHAs or click consent/permission approval buttons. Pause for the user to complete those steps. Do not expose OAuth URLs, authorization codes, tokens, client secrets, or unnecessary screen contents in logs or messages.
5. If desktop-control commands are unavailable or blocked, do not claim to control the browser or simulate a click. Give the user the exact command and ask them to finish Google sign-in in their browser.
6. After authorization, verify that the configured token file was updated, then run the documented read-only preflight. Confirm the intended account/service identity before any follow-on operation.

Token refresh does not authorize unrelated writes such as uploads, publishing, or account changes. Perform those only when the user separately requests them. If reauthorization fails, report the sanitized error and stop; never switch OAuth clients or accounts as a workaround.
