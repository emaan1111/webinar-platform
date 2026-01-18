# Forms Enhancements

## Features Added
1.  **Form Submission Counter**: Added a submission count badge to the "Forms" item in the dashboard side menu.
2.  **Side Menu on Forms Pages**: Added a layout wrapper to ensure the dashboard sidebar and navigation persist across all Forms pages.
3.  **Form View Tracking**: Implemented tracking for form visits ("clicks") even if the user doesn't submit.

## Implementation Details
-   **Schema**: Added `FormView` model to track visits (IP, UserAgent, Referrer).
-   **API**: 
    -   New `/api/forms/stats` endpoint to fetch submission counts.
-   **Dashboard**:
    -   Updated `DashboardLayout.tsx` to display the "Forms" badge.
    -   Created `src/app/dashboard/forms/layout.tsx` to enforce the layout.
-   **Public Form**:
    -   Updated `src/app/f/[slug]/page.tsx` to log a `FormView` record on page load.
