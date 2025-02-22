// src/index.js

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
// import "./index.css"; // optional, if you have global CSS

const rootElement = document.getElementById("root");
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);
