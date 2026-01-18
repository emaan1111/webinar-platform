# Real Attendance Rate Fix

## Issue
The "% Real Attendance (Past Only)" calculation was previously strictly checking if `scheduledEnd < now`. This caused confusion when:
1. A user attended a session that was currently running (joined early or session active).
2. The session hadn't "Ended" yet according to schedule.
3. This resulted in the user being counted in "Live Attendees" (numerator-ish) but excluded from "Past Registrations" (denominator).

## Fix Implemented
### 1. Backend Logic Update (`/api/reports`)
Updated the `pastRegistrations` filter to **always include** any registration that has `attended: true`, regardless of the scheduled time. 
- **Logic**: If they attended, the session must have happened (or is happening) effectively enough to count.
- **Benefit**: Ensures that if 9 people attended, the denominator is at least 9. Previously it could represent 0/0 or 9/0 situations.

### 2. Frontend Enhancement (`/dashboard/reports`)
Added a new available column: **"Eligible Registrations (Past)"**.
- This column maps to `pastRegistrationCount`.
- Users can enable this column via "Change View" -> "Customize Columns" to see the exact denominator used for the "Real Attendance" calculation.
- Example: If `Live Attendees` is 9 and `Eligible (Past)` is 15, the rate is 60%.

## Result
The report now accurately reflects "real-time" attendance for active sessions and prevents the "Live Attendees > Eligible" impossible state.
