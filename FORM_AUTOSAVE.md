# Form Auto-Save Feature

## Description
Implemented an auto-save mechanism for Forms.
-   When users start typing, a "Partial" submission is created in the database.
-   Subsequent keystrokes (debounced 1s) update this record.
-   Upon final submission, the record status changes to "COMPLETED".

## Changes
1.  **Schema**: Added `status` ('PARTIAL' | 'COMPLETED') and `lastSavedAt` to `FormSubmission`.
2.  **API**: New endpoint `/api/forms/autosave` to handle partial saves.
3.  **Frontend**: Updated `ClientForm.tsx` to debounce inputs and call the autosave API.
4.  **Action**: Updated `submitForm.ts` to update the existing partial record instead of creating duplicates.

## Notes
-   Partial submissions will appear in the database but are filtered out of main analytics unless explicitly queried (default behavior of most reports is `count()` which now includes partials unless filtered).
-   Note: The submission count on dashboard now includes partials. This is technically "people who started filling".
