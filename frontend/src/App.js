import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Web3Provider } from "./context/Web3Context";
import Navbar        from "./components/Navbar";
import NetworkBanner from "./components/NetworkBanner";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage      from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import SendPage      from "./pages/SendPage";
import SplitPage     from "./pages/SplitPage";
import HistoryPage   from "./pages/HistoryPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import QRPage        from "./pages/QRPage";

export default function App() {
  return (
    <Web3Provider>
      <BrowserRouter>
        <NetworkBanner />
        <Navbar />
        <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>
          <Routes>
            <Route path="/"          element={<HomePage />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/send"      element={<ProtectedRoute><SendPage /></ProtectedRoute>} />
            <Route path="/split"     element={<ProtectedRoute><SplitPage /></ProtectedRoute>} />
            <Route path="/history"   element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/qr"        element={<ProtectedRoute><QRPage /></ProtectedRoute>} />
            <Route path="*"          element={<Navigate to="/" />} />
          </Routes>
        </main>
      </BrowserRouter>
    </Web3Provider>
  );
}
