// src/App.jsx
import React, { useState } from "react";
import IncomeForm from "./components/IncomeForm";
import SpendingForm from "./components/SpendingForm";
import ColoredBalanceTable from "./components/ColoredBalanceTable";

const App = () => {
    const [incomeList, setIncomeList] = useState([]);
    const [spendingList, setSpendingList] = useState([]);

    return (
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "1rem" }}>
            <h1>Spending Planner</h1>
            <div style={{ display: "flex", gap: "2rem" }}>
                <IncomeForm setIncomeList={setIncomeList} />
                <SpendingForm setSpendingList={setSpendingList} />
            </div>

            {/* Now each new entry creates its own row in the table */}
            <ColoredBalanceTable
                incomeList={incomeList}
                spendingList={spendingList}
            />
        </div>
    );
};

export default App;
