// src/components/IncomeForm.jsx
import React, { useState } from "react";

const IncomeForm = ({ setIncomeList }) => {
    const [amount, setAmount] = useState("");
    const [frequency, setFrequency] = useState("weekly"); // weekly, bi-weekly, monthly
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [repeatTimes, setRepeatTimes] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();

        // Basic validation
        if (!amount || !startDate) {
            alert("Please enter an amount and start date");
            return;
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount)) {
            alert("Amount must be a number");
            return;
        }

        // 1) Generate a unique submissionId for this entire submission
        const submissionId = Date.now();

        // 2) Convert start/end to Date objects
        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : null;

        let currentDate = new Date(start);
        let newEntries = [];

        // 3) Handle optional "Number of times"
        let timesCount = repeatTimes ? parseInt(repeatTimes, 10) : null;
        let iterationCount = 0;

        // Helper: increment date by frequency
        const incrementDate = (date, freq) => {
            const newDate = new Date(date);
            if (freq === "weekly") {
                newDate.setDate(newDate.getDate() + 7);
            } else if (freq === "bi-weekly") {
                newDate.setDate(newDate.getDate() + 14);
            } else if (freq === "monthly") {
                newDate.setMonth(newDate.getMonth() + 1);
            }
            return newDate;
        };

        // 4) Generate all entries for this submission
        while (true) {
            // If end date is set, stop when current date > end date
            if (end && currentDate > end) break;
            // If repeatTimes is set, stop when iterationCount >= timesCount
            if (timesCount && iterationCount >= timesCount) break;

            newEntries.push({
                submissionId, // same for ALL entries in this submission
                date: currentDate.toISOString().split("T")[0],
                amount: parsedAmount,
                frequency,
            });

            currentDate = incrementDate(currentDate, frequency);
            iterationCount++;
        }

        // 5) Update the income list with all generated entries
        setIncomeList((prev) => [...prev, ...newEntries]);

        // 6) Reset form fields
        setAmount("");
        setFrequency("weekly");
        setStartDate("");
        setEndDate("");
        setRepeatTimes("");
    };

    return (
        <div style={{ border: "1px solid #ccc", padding: "1rem" }}>
            <h2>Add Income</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Amount:</label>
                    <input
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                </div>

                <div>
                    <label>Frequency:</label>
                    <select
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value)}
                    >
                        <option value="weekly">Weekly</option>
                        <option value="bi-weekly">Bi-Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </div>

                <div>
                    <label>Start Date:</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>

                <div>
                    <label>End Date (optional):</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>

                <div>
                    <label>Number of times (optional):</label>
                    <input
                        type="number"
                        value={repeatTimes}
                        onChange={(e) => setRepeatTimes(e.target.value)}
                    />
                </div>

                <button type="submit">Add Income</button>
            </form>
        </div>
    );
};

export default IncomeForm;
