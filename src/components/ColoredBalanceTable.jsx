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

const ColoredBalanceTable = ({ incomeList, spendingList }) => {
    // 1) Gather all dates
    const allDates = [
        ...incomeList.map((i) => parseISO(i.date)),
        ...spendingList.map((s) => parseISO(s.date)),
    ];

    if (allDates.length === 0) {
        return <div>No data yet</div>;
    }

    // Earliest + latest
    const minDate = allDates.reduce((a, b) => (isBefore(a, b) ? a : b));
    const maxDate = allDates.reduce((a, b) => (isBefore(a, b) ? b : a));

    // 2) Build a list of all (year, month) combos
    let monthYearArray = [];
    {
        let current = startOfMonth(minDate);
        const lastMonthStart = startOfMonth(maxDate);

        while (isBefore(current, lastMonthStart) || isEqual(current, lastMonthStart)) {
            const y = getYear(current);
            const m = getMonth(current);
            monthYearArray.push({ year: y, month: m });
            current = addMonths(current, 1);
        }
    }

    // 3) For each (year, month), get the "weeks" from buildMonthWeeks
    //    Then build an array of { key, label, start, end }
    const columns = [];
    monthYearArray.forEach(({ year, month }) => {
        const weeks = buildMonthWeeks(year, month);
        weeks.forEach((w, idx) => {
            // We'll label them "Week 1", "Week 2", etc. or "Wk #"
            columns.push({
                key: `${year}-${month}-wk${idx}`,
                year,
                month,
                start: w.start,
                end: w.end,
                week: w.week, // <--- carry the numeric week from buildMonthWeeks
            });
        });
    });

    // Build a map from column.key => index
    const columnsMap = {};
    columns.forEach((col, index) => {
        columnsMap[col.key] = index;
    });

    // Helper to create zero-filled array
    const makeEmptyCols = () => Array(columns.length).fill(0);

    // 4) Group income by submissionId => one row per submission
    const incomeGroups = {};
    incomeList.forEach((item) => {
        const id = item.submissionId || "noId"; // fallback if none
        if (!incomeGroups[id]) {
            incomeGroups[id] = [];
        }
        incomeGroups[id].push(item);
    });

    const incomeRows = Object.entries(incomeGroups).map(([id, groupItems], idx) => {
        const rowCols = makeEmptyCols();
        groupItems.forEach((item) => {
            const d = parseISO(item.date);
            // find which column range [start..end] this date belongs to
            columns.forEach((col, colIndex) => {
                if (isWithinInterval(d, { start: col.start, end: col.end })) {
                    rowCols[colIndex] += item.amount;
                }
            });
        });
        return {
            label: `Income #${idx + 1}`,
            columns: rowCols,
        };
    });

    // 5) Group spending by submissionId => one row per submission
    const spendingGroups = {};
    spendingList.forEach((item) => {
        const id = item.submissionId || "noId";
        if (!spendingGroups[id]) {
            spendingGroups[id] = [];
        }
        spendingGroups[id].push(item);
    });

    const spendingRows = Object.entries(spendingGroups).map(([id, groupItems], idx) => {
        const rowCols = makeEmptyCols();
        groupItems.forEach((item) => {
            const d = parseISO(item.date);
            columns.forEach((col, colIndex) => {
                if (isWithinInterval(d, { start: col.start, end: col.end })) {
                    rowCols[colIndex] += item.amount;
                }
            });
        });
        return {
            label: `Spent #${idx + 1}`,
            columns: rowCols,
        };
    });

    // 6) Aggregators
    const totalIncomeCols = makeEmptyCols();
    incomeRows.forEach((row) => {
        row.columns.forEach((val, i) => {
            totalIncomeCols[i] += val;
        });
    });

    const totalSpentCols = makeEmptyCols();
    spendingRows.forEach((row) => {
        row.columns.forEach((val, i) => {
            totalSpentCols[i] += val;
        });
    });

    const balanceCols = totalIncomeCols.map((incVal, i) => incVal - totalSpentCols[i]);

    // 7) Build monthMap for merged headers
    const monthMap = {};
    columns.forEach((col) => {
        const myKey = `${col.year}-${col.month}`;
        if (!monthMap[myKey]) {
            monthMap[myKey] = [];
        }
        monthMap[myKey].push(col);
    });
    const monthYearKeys = monthYearArray.map(({ year, month }) => `${year}-${month}`);

    // 8) Render
    // const monthNames = [
    //     "January","February","March","April","May","June",
    //     "July","August","September","October","November","December"
    // ];

    return (
        <div style={{ overflowX: "auto", marginTop: "1rem" }}>
            <table border="1" cellPadding="6" cellSpacing="0">
                <thead>
                {/* 1) Top header row for each month */}
                <tr>
                    <th></th>
                    {monthYearKeys.map((myKey) => {
                        // "2025-1", "2025-2", etc.
                        const [y, m] = myKey.split("-").map(Number);
                        const colSpan = monthMap[myKey].length; // how many weeks for that month
                        return (
                            <th
                                key={myKey}
                                colSpan={colSpan}
                                style={{textAlign: "center", backgroundColor: "#eee"}}
                            >
                                {getMonthName(m)} {y}
                            </th>
                        );
                    })}
                </tr>
                {/* 2) Sub-header row: label each "week" block */}
                <tr>
                    <th></th>
                    {columns.map((col) => (
                        <th key={col.key} style={{textAlign: "center"}}>
                            {getOrdinal(col.week)} {/* Now col.week is a real number */}
                        </th>
                    ))}
                </tr>
                </thead>

                <tbody>
                {/* Income rows (green) */}
                {incomeRows.map((row, idx) => (
                    <tr key={`inc-${idx}`}>
                        <td>{row.label}</td>
                        {row.columns.map((val, i) => (
                            <td
                                key={i}
                                style={{ textAlign: "right", backgroundColor: "#c3e6cb" }}
                            >
                                {val.toFixed(2)}
                            </td>
                        ))}
                    </tr>
                ))}

                {/* Spending rows (red) */}
                {spendingRows.map((row, idx) => (
                    <tr key={`sp-${idx}`}>
                        <td>{row.label}</td>
                        {row.columns.map((val, i) => (
                            <td
                                key={i}
                                style={{ textAlign: "right", backgroundColor: "#f5c6cb" }}
                            >
                                {val.toFixed(2)}
                            </td>
                        ))}
                    </tr>
                ))}

                {/* Aggregators */}
                <tr>
                    <td style={{ fontWeight: "bold", backgroundColor: "#c3e6cb" }}>
                        Total Income
                    </td>
                    {totalIncomeCols.map((val, i) => (
                        <td
                            key={i}
                            style={{ textAlign: "right", backgroundColor: "#c3e6cb" }}
                        >
                            {val.toFixed(2)}
                        </td>
                    ))}
                </tr>
                <tr>
                    <td style={{ fontWeight: "bold", backgroundColor: "#f5c6cb" }}>
                        Total Spent
                    </td>
                    {totalSpentCols.map((val, i) => (
                        <td
                            key={i}
                            style={{ textAlign: "right", backgroundColor: "#f5c6cb" }}
                        >
                            {val.toFixed(2)}
                        </td>
                    ))}
                </tr>
                <tr>
                    <td style={{ fontWeight: "bold" }}>Balance</td>
                    {balanceCols.map((val, i) => (
                        <td key={i} style={{ textAlign: "right" }}>
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
