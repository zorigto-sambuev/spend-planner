// src/components/CombinedTable.jsx
import React from "react";

const CombinedTable = ({ incomeList, spendingList }) => {
    // Calculate totals
    const totalIncome = incomeList.reduce((sum, item) => sum + item.amount, 0);
    const totalSpending = spendingList.reduce((sum, item) => sum + item.amount, 0);
    const netBalance = totalIncome - totalSpending;

    return (
        <div style={{ marginTop: "1rem" }}>
            {/* 1) Income Section */}
            <h2>Income</h2>
            <table border="1" cellPadding="6" cellSpacing="0" style={{ marginBottom: "1rem" }}>
                <thead>
                <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Frequency</th>
                </tr>
                </thead>
                <tbody>
                {incomeList.map((entry, idx) => (
                    <tr key={idx}>
                        <td>{entry.date}</td>
                        <td>{entry.amount.toFixed(2)}</td>
                        <td>{entry.frequency || "N/A"}</td>
                    </tr>
                ))}
                </tbody>
            </table>

            {/* 2) Spending Section */}
            <h2>Spending</h2>
            <table border="1" cellPadding="6" cellSpacing="0" style={{ marginBottom: "1rem" }}>
                <thead>
                <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Frequency</th>
                </tr>
                </thead>
                <tbody>
                {spendingList.map((entry, idx) => (
                    <tr key={idx}>
                        <td>{entry.date}</td>
                        <td>{entry.amount.toFixed(2)}</td>
                        <td>{entry.frequency || "N/A"}</td>
                    </tr>
                ))}
                </tbody>
            </table>

            {/* 3) Balance Summary */}
            <h2>Balance</h2>
            <table border="1" cellPadding="6" cellSpacing="0">
                <tbody>
                <tr>
                    <td><strong>Total Income</strong></td>
                    <td>{totalIncome.toFixed(2)}</td>
                </tr>
                <tr>
                    <td><strong>Total Spending</strong></td>
                    <td>{totalSpending.toFixed(2)}</td>
                </tr>
                <tr>
                    <td><strong>Net Balance</strong></td>
                    <td>{netBalance.toFixed(2)}</td>
                </tr>
                </tbody>
            </table>
        </div>
    );
};

export default CombinedTable;
