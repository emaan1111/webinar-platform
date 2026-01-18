# Analytics Geographic Distribution

## Feature
Added a "Geographic Distribution" bar chart to the Analytics Dashboard (`/dashboard/analytics`).

## Implementation details
1.  **Backend (`/api/analytics/aggregate`)**:
    -   Iterate over fetched registrations.
    -   Aggregate counts by `country` field directly from the `Registration` model.
    -   Sort by count descending.
    -   Return `geographic.countries` array in the response.

2.  **Frontend (`/dashboard/analytics`)**:
    -   Updated `AnalyticsData` interface.
    -   Added `Geographic Distribution` section.
    -   Implemented `Recharts` horizontal Bar Chart.
    -   Shows Top 10 countries.
    -   Bar color: Indigo-600 (`#4f46e5`).

## Fixes
-   Fixed a compilation error in `route.ts` related to `formattedScheduleDistribution` which was referenced but not defined (commented it out as it appeared to be a remnant of previous logic).
