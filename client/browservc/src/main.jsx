import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import GuestPage from "./GuestPage.jsx"; // Ensure this path is correct

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/join/:roomId" element={<GuestPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
