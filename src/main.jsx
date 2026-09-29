import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { seedDB } from "./services/mockDbServices.js";

// Populate local mock data before the first render reads from browser storage.
seedDB();
createRoot(document.getElementById("root")).render(<App />);
