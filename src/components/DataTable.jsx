import React from "react";

const DataTable = ({ incomeList, spendingList }) => {
    return (
        <div className="table-container">
            <h2>Income Entries</h2>
            <table>
                <thead>
                <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Frequency</th>
                </tr>
                </thead>
                <tbody>
                {incomeList.map((income, index) => (
                    <tr key={index}>
                        <td>{income.date}</td>
                        <td>{income.amount}</td>
                        <td>{income.frequency}</td>
                    </tr>
                ))}
                </tbody>
            </table>

            <h2>Spending Entries</h2>
            <table>
                <thead>
                <tr>
                    <th>Date</th>
                    <th>Amount</th>
                </tr>
                </thead>
                <tbody>
                {spendingList.map((spending, index) => (
                    <tr key={index}>
                        <td>{spending.date}</td>
                        <td>{spending.amount}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default DataTable;
