// buildMonthWeeks.js

import {
    // startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    // isBefore,
    differenceInCalendarDays,
} from "date-fns";

/**
 * Returns an array of full-week ranges (each with { start, end }) for the given
 * (year, month) according to your custom rule:
 *   - If the last partial week in this month has >4 days in this month,
 *     absorb the remaining days from the next month so it becomes a full 7-day block.
 *   - If the first partial week in this month has <=4 days in this month,
 *     we skip it here (it belongs to the previous month).
 *
 * By doing this, we effectively "push" small partial weeks forward or backward
 * and "pull" large partial weeks across the boundary to make them a full week.
 */


export function buildMonthWeeks(year, month) {
    const monthStart = new Date(year, month, 1);
    const monthEnd = endOfMonth(monthStart);

    let weeks = [];
    let current = monthStart;

    while (current <= monthEnd) {
        const weekStartDate = startOfWeek(current, { weekStartsOn: 0 });
        const weekEndDate = endOfWeek(current, { weekStartsOn: 0 });

        const overlapStart = weekStartDate < monthStart ? monthStart : weekStartDate;
        const overlapEnd = weekEndDate > monthEnd ? monthEnd : weekEndDate;

        const overlapDays = differenceInCalendarDays(overlapEnd, overlapStart) + 1;

        if (overlapDays <= 3) {
            current = addDays(weekEndDate, 1);
            continue;
        }

        // Here we assign a "week" property based on the index
        weeks.push({
            start: weekStartDate,
            end: weekEndDate,
            week: weeks.length + 1, // <--- Add a numeric index for labeling
        });

        current = addDays(weekEndDate, 1);
    }

    return weeks;
}


/**
 * Converts a 0-based month index to the full month name.
 * @param {number} m - 0 for January, 1 for February, etc.
 * @returns {string} e.g., "January", "February", "Unknown" if out of range
 */
export function getMonthName(m) {
    const names = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    return names[m] || "Unknown";
}

/**
 * Converts a week number (1..6) to an ordinal label, e.g. 1 -> "1st", 2 -> "2nd", etc.
 * @param {number} week - The numeric week
 * @returns {string} e.g., "1st", "2nd", "3rd", "4th", "5th", "6th"
 */
export function getOrdinal(week) {
    switch (week) {
        case 1: return "1st";
        case 2: return "2nd";
        case 3: return "3rd";
        case 4: return "4th";
        case 5: return "5th";
        case 6: return "6th";
        default: return `${week}th`;
    }
}
