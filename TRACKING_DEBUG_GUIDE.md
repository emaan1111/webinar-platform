# Tracking Debugging Guide

We have implemented a robust tracking system that persists Split Test (`st`, `v`) and Lead Page (`lp`) identifiers across:
1.  **Redirects**: From Split Test URL -> Lead Page URL.
2.  **Lead Page**: Injected into `window.__WEBINAR_TRACKING__`.
3.  **Links**: Automatically appended to all `<a>` tags on the Lead Page.
4.  **Static Iframes**: `src` attributes updated on load.
5.  **Dynamic Popups**: `MutationObserver` now watches for new iframes (popups) and patches their `src` immediately.
6.  **Embed Form**: The registration form attempts to recover missing IDs from:
    *   URL Parameters (Props from Server) - *Primary*
    *   `window.location.search` (Client fallback)
    *   `document.referrer` (Parent URL)
    *   `window.parent.location` (Cross-frame access, if allowed)

## How to Verify Fix

1.  **Open Console** on your Lead Page (`/p/freelcass-g`).
2.  **Check Global Tracking Object**:
    ```javascript
    console.log(window.__WEBINAR_TRACKING__)
    // Should show: { splitTestId: "...", variantId: "...", leadPageId: "..." }
    ```
3.  **Trigger the Popup**.
4.  **Watch Console**:
    *   You should see: `🔗 Tracking: Modified URL ...` when the iframe is detected.
    *   If using the Embed Form, open the iframe's console context (Select "frame" in DevTools).
    *   Look for: `🔍 Tracking: Recovered params from parent window` (if we added that log).

## Troubleshooting "Custom HTML" Popups

If tracking still fails for a specific popup:
1.  **Timing**: Does the popup create an iframe with `src` immediately?
    *   If the popup creates an empty iframe and writes `document.write()`, our script might miss the `src` attribute change if it never happens.
    *   *Solution*: Ensure the popup code sets a `src` attribute if pointing to the Embed Event page.
2.  **Sandboxing**: Does the popup iframe have `sandbox` attribute?
    *   It must have `allow-same-origin` for `window.parent` access to work (though our URL injection should bypass this need).
3.  **Domain Mismatch**: Are you testing on `localhost` vs `127.0.0.1`?
    *   Ensure both Lead Page and Embed URL use the exact same origin.
