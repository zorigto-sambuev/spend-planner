// src/components/SpendingForm.jsx
import React, { useState } from "react";

const SpendingForm = ({ setSpendingList }) => {
    const [amount, setAmount] = useState("");
    const [frequency, setFrequency] = useState("weekly");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [repeatTimes, setRepeatTimes] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!amount || !startDate) {
            alert("Please enter an amount and start date");
            return;
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount)) {
            alert("Amount must be a number");
            return;
        }

        // Generate a unique submissionId for this entire spending submission
        const submissionId = Date.now();

        // Convert start and end dates
        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : null;

        let currentDate = new Date(start);
        let newEntries = [];

        // If "Number of times" is provided, parse it; otherwise, null
        const timesCount = repeatTimes ? parseInt(repeatTimes, 10) : null;
        let iterationCount = 0;

        // Helper: increment the date based on frequency
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

        // Generate entries for each recurrence using the same submissionId
        while (true) {
            if (end && currentDate > end) break;
            if (timesCount && iterationCount >= timesCount) break;

            newEntries.push({
                submissionId, // All entries share this same id
                date: currentDate.toISOString().split("T")[0],
                amount: parsedAmount,
                frequency,
            });

            currentDate = incrementDate(currentDate, frequency);
            iterationCount++;
        }

        // Update the spending list state with the new entries
        setSpendingList((prev) => [...prev, ...newEntries]);

        // Reset form fields
        setAmount("");
        setFrequency("weekly");
        setStartDate("");
        setEndDate("");
        setRepeatTimes("");
    };

    return (
        <div style={{ border: "1px solid #ccc", padding: "1rem" }}>
            <h2>Add Spending</h2>
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

                <button type="submit">Add Spending</button>
            </form>
        </div>
    );
};

export default SpendingForm;
