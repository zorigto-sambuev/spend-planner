// src/components/ColoredBalanceTable.jsx

import React from "react";
import {
    parseISO,
    getYear,
    getMonth,
    addMonths,
    startOfMonth,
    isBefore,
    isEqual,
    isWithinInterval,
} from "date-fns";
import { buildMonthWeeks, getMonthName, getOrdinal } from "./buildMonthWeeks";

// 1) Color map for each type, including "income"
const typeColors = {
    income: "#c3e6cb",  // green for income
    debt:   "#f5c6cb",  // red/pink
    bill:   "#add8e6",  // light blue
    sub:    "#F0E68C",  // khaki
    other:  "#e6e6fa",  // light violet
};

// 2) Large gap threshold => fewer row splits
const GAP_THRESHOLD = 10;

// 3) Type order, so "income" is at top, then "debt", "bill", "sub", "other"
const typeOrder = ["income", "debt", "bill", "sub", "other"];

/**
 * Multi-pass lift-up for all rows:
 * - If bottom row's cell != 0 and top row's cell == 0 (same type), move the value up.
 * - Repeat until no more changes, so values can bubble all the way up.
 */
function liftUpValues(rows) {
    if (!rows.length) return;
    const numCols = rows[0].columns.length;

    let changed = true;
    while (changed) {
        changed = false;
        for (let col = 0; col < numCols; col++) {
            for (let r = rows.length - 1; r > 0; r--) {
                const rowBelow = rows[r];
                const rowAbove = rows[r - 1];
                // same type?
                if (rowBelow.type && rowBelow.type === rowAbove.type) {
                    if (rowBelow.columns[col] !== 0 && rowAbove.columns[col] === 0) {
                        rowAbove.columns[col] = rowBelow.columns[col];
                        rowBelow.columns[col] = 0;
                        changed = true;
                    }
                }
            }
        }
    }
}

/**
 * Build multiple rows for a single submission if there's a big gap in columns.
 * - We do the same for both income and spending. "type" might be "income" or "debt"/"bill"/etc.
 * - We label rows as "Income #X.Y" or "Spent #X.Y (type)" accordingly.
 */
function buildRowsForSubmission(items, subIndex, type, labelPrefix, columns) {
    // 1) Gather all (colIndex, amount) data points
    let dataPoints = [];
    items.forEach((item) => {
        const d = parseISO(item.date);
        columns.forEach((col, colIndex) => {
            if (isWithinInterval(d, { start: col.start, end: col.end })) {
                dataPoints.push({ colIndex, amount: item.amount });
            }
        });
    });

    // 2) Sum multiple items in the same column
    let colMap = {};
    dataPoints.forEach((dp) => {
        if (!colMap[dp.colIndex]) colMap[dp.colIndex] = 0;
        colMap[dp.colIndex] += dp.amount;
    });

    // 3) Sort by colIndex
    let sortedCols = Object.entries(colMap).map(([ci, amt]) => ({
        colIndex: parseInt(ci, 10),
        amount: amt,
    }));
    sortedCols.sort((a, b) => a.colIndex - b.colIndex);

    // 4) Build multiple rows if skipping columns > GAP_THRESHOLD
    let rows = [];
    let currentRow = Array(columns.length).fill(0);
    let prevIndex = null;
    sortedCols.forEach((entry) => {
        if (prevIndex === null) {
            currentRow[entry.colIndex] = entry.amount;
            prevIndex = entry.colIndex;
        } else {
            if (entry.colIndex <= prevIndex + GAP_THRESHOLD) {
                currentRow[entry.colIndex] = entry.amount;
                prevIndex = entry.colIndex;
            } else {
                rows.push(currentRow);
                currentRow = Array(columns.length).fill(0);
                currentRow[entry.colIndex] = entry.amount;
                prevIndex = entry.colIndex;
            }
        }
    });
    if (prevIndex !== null) {
        rows.push(currentRow);
    }

    // 5) Return row objects
    return rows.map((cols, idx2) => ({
        label: `${labelPrefix} #${subIndex + 1}.${idx2 + 1}${type !== "income" ? ` (${type})` : ""}`,
        columns: cols,
        type,
    }));
}

const ColoredBalanceTable = ({ incomeList, spendingList }) => {
    // 1) Gather all relevant dates
    const allDates = [
        ...incomeList.map((i) => parseISO(i.date)),
        ...spendingList.map((s) => parseISO(s.date)),
    ];
    if (!allDates.length) return <div>No data yet</div>;

    // earliest + latest
    const minDate = allDates.reduce((a, b) => (isBefore(a, b) ? a : b));
    const maxDate = allDates.reduce((a, b) => (isBefore(a, b) ? b : a));

    // 2) Build (year, month) combos
    let monthYearArray = [];
    {
        let current = startOfMonth(minDate);
        const lastMonthStart = startOfMonth(maxDate);
        while (isBefore(current, lastMonthStart) || isEqual(current, lastMonthStart)) {
            monthYearArray.push({ year: getYear(current), month: getMonth(current) });
            current = addMonths(current, 1);
        }
    }

    // 3) Build columns
    const columns = [];
    monthYearArray.forEach(({ year, month }) => {
        const weeks = buildMonthWeeks(year, month);
        weeks.forEach((w, idx) => {
            columns.push({
                key: `${year}-${month}-wk${idx}`,
                year,
                month,
                start: w.start,
                end: w.end,
                week: w.week,
            });
        });
    });

    // ------------------------------------------------------------------
    // Build row arrays for Income and Spending, then unify them
    // ------------------------------------------------------------------

    // 4) Income: group by submission, but use same row-splitting logic
    const incomeGroups = incomeList.reduce((acc, item) => {
        const id = item.submissionId || "noId";
        if (!acc[id]) acc[id] = [];
        acc[id].push(item);
        return acc;
    }, {});
    const incomeGroupsArr = Object.values(incomeGroups);

    let allRows = [];
    incomeGroupsArr.forEach((groupItems, groupIdx) => {
        // Build rows with type="income"
        const built = buildRowsForSubmission(groupItems, groupIdx, "income", "Income", columns);
        allRows.push(...built);
    });

    // 5) Spending: group by submission, row-splitting
    const spendingGroups = spendingList.reduce((acc, item) => {
        const id = item.submissionId || "noId";
        if (!acc[id]) acc[id] = [];
        acc[id].push(item);
        return acc;
    }, {});
    const spendingGroupsArr = Object.values(spendingGroups);

    spendingGroupsArr.forEach((groupItems, groupIdx) => {
        // get the actual type from the first item
        const realType = groupItems[0]?.type || "other";
        const built = buildRowsForSubmission(groupItems, groupIdx, realType, "Spent", columns);
        allRows.push(...built);
    });

    // 6) Multi-pass Lift Up across all rows (including "income")
    liftUpValues(allRows);

    // 7) Aggregators: compute total income & total spent
    // We'll separate them by row.type
    const numCols = columns.length;
    let totalIncomeCols = Array(numCols).fill(0);
    let totalSpentCols = Array(numCols).fill(0);

    allRows.forEach((row) => {
        row.columns.forEach((val, i) => {
            if (row.type === "income") {
                totalIncomeCols[i] += val;
            } else {
                totalSpentCols[i] += val;
            }
        });
    });
    // netWeekCols = totalIncomeCols[i] - totalSpentCols[i]
    const netWeekCols = totalIncomeCols.map((inc, i) => inc - totalSpentCols[i]);
    // runningBalanceCols = cumulative sum of netWeekCols
    let runningTotal = 0;
    const runningBalanceCols = netWeekCols.map((netVal) => {
        runningTotal += netVal;
        return runningTotal;
    });

    // 7.1) Hide zero rows
    allRows = allRows.filter((row) => {
        const sum = row.columns.reduce((a, b) => a + b, 0);
        return sum !== 0;
    });

    // 8) Build monthMap for merged headers
    const monthMap = {};
    columns.forEach((col) => {
        const key = `${col.year}-${col.month}`;
        if (!monthMap[key]) {
            monthMap[key] = [];
        }
        monthMap[key].push(col);
    });
    const monthYearKeys = monthYearArray.map(({ year, month }) => `${year}-${month}`);

    // 9) Sort all rows by type (so "income" appears first, then "debt", "bill", "sub", "other")
    allRows.sort((a, b) => {
        const aIdx = typeOrder.indexOf(a.type);
        const bIdx = typeOrder.indexOf(b.type);
        return aIdx - bIdx;
    });

    return (
        <div style={{ overflowX: "auto", marginTop: "1rem" }}>
            <table border="1" cellPadding="6" cellSpacing="0">
                <thead>
                {/* 1) Merged month headers */}
                <tr>
                    <th></th>
                    {monthYearKeys.map((myKey) => {
                        const [y, m] = myKey.split("-").map(Number);
                        const colSpan = monthMap[myKey].length;
                        return (
                            <th
                                key={myKey}
                                colSpan={colSpan}
                                style={{ textAlign: "center", backgroundColor: "#eee" }}
                            >
                                {getMonthName(m)} {y}
                            </th>
                        );
                    })}
                </tr>
                {/* 2) Sub-header row for each "week" */}
                <tr>
                    <th></th>
                    {columns.map((col) => (
                        <th key={col.key} style={{ textAlign: "center" }}>
                            {getOrdinal(col.week)}
                        </th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {/* 1) All unified rows (income + spending), zero => white */}
                {allRows.map((row, rowIdx) => {
                    // pick color if non-zero, else white
                    return (
                        <tr key={rowIdx}>
                            <td>{row.label}</td>
                            {row.columns.map((val, i) => {
                                const bgColor = val === 0 ? "#fff" : (typeColors[row.type] || "#f5c6cb");
                                return (
                                    <td key={i} style={{textAlign: "right", backgroundColor: bgColor}}>
                                        {val.toFixed(2)}
                                    </td>
                                );
                            })}
                        </tr>
                    );
                })}

                {/* Aggregator rows: total income, total spent, balance */}
                <tr>
                    <td style={{fontWeight: "bold", backgroundColor: "#00FA9A"}}>
                        Total Income
                    </td>
                    {totalIncomeCols.map((val, i) => (
                        <td
                            key={i}
                            style={{
                                textAlign: "right",
                                backgroundColor: val === 0 ? "#fff" : "#00FA9A",
                            }}
                        >
                            {val.toFixed(2)}
                        </td>
                    ))}
                </tr>
                <tr>
                    <td style={{fontWeight: "bold", backgroundColor: "#FA8072"}}>
                        Total Spent
                    </td>
                    {totalSpentCols.map((val, i) => (
                        <td
                            key={i}
                            style={{
                                textAlign: "right",
                                backgroundColor: val === 0 ? "#fff" : "#FA8072",
                            }}
                        >
                            {val.toFixed(2)}
                        </td>
                    ))}
                </tr>
                {/* Net Week row */}
                <tr>
                    <td style={{fontWeight: "bold", backgroundColor: "#ff6ec7"}}>Net Week</td>
                    {netWeekCols.map((val, i) => (
                        <td
                            key={i}
                            style={{
                                textAlign: "right",
                                backgroundColor: val === 0 ? "#fff" : "#ff6ec7",
                            }}
                        >
                            {val.toFixed(2)}
                        </td>
                    ))}
                </tr>
                {/* Balance row (running total of net weeks) */}
                <tr>
                    <td style={{fontWeight: "bold", backgroundColor: "#40E0D0"}}>Balance</td>
                    {runningBalanceCols.map((val, i) => (
                        <td
                            key={i}
                            style={{
                                textAlign: "right",
                                backgroundColor: val === 0 ? "#fff" : "#40E0D0",
                            }}
                        >
                            {val.toFixed(2)}
                        </td>
                    ))}
                </tr>
                </tbody>
            </table>
        </div>
    );
};

export default ColoredBalanceTable;
