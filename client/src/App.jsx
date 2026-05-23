import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import PublicAhpPage from "./pages/PublicAhpPage";
import PublicMapPage from "./pages/PublicMapPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminIndicatorsPage from "./pages/AdminIndicatorsPage";
import AdminDatasetsPage from "./pages/AdminDatasetsPage";
import AdminFuzzyPage from "./pages/AdminFuzzyPage";
import AdminAhpPage from "./pages/AdminAhpPage";
import AdminWlcPage from "./pages/AdminWlcPage";
import AdminMapPreviewPage from "./pages/AdminMapPreviewPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/pembobotan-ahp" element={<PublicAhpPage />} />
        <Route path="/peta-rekomendasi" element={<PublicMapPage />} />
        <Route path="/map" element={<Navigate to="/peta-rekomendasi" replace />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/indicators" element={<AdminIndicatorsPage />} />
        <Route path="/admin/datasets" element={<AdminDatasetsPage />} />
        <Route path="/admin/fuzzy" element={<AdminFuzzyPage />} />
        <Route path="/admin/ahp" element={<AdminAhpPage />} />
        <Route path="/admin/wlc" element={<AdminWlcPage />} />
        <Route path="/admin/map-preview" element={<AdminMapPreviewPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
