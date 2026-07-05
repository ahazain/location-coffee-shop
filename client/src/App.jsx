import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import PublicAhpPage from "./pages/PublicAhpPage";
import PublicMapPage from "./pages/PublicMapPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminRegisterPage from "./pages/adminRegisterPage";
import AdminIndicatorsPage from "./pages/AdminIndicatorsPage";
import AdminDatasetsPage from "./pages/AdminDatasetsPage";
import AdminFuzzyPage from "./pages/AdminFuzzyPage";
import AdminAhpPage from "./pages/AdminAhpPage";
import AdminWlcPage from "./pages/AdminWlcPage";
import AdminMapPreviewPage from "./pages/AdminMapPreviewPage";
import AdminKriteriaPage from "./pages/AdminKriteriaPage";
import AdminValidationPage from "./pages/AdminValidationPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/pembobotan-ahp" element={<PublicAhpPage />} />
        <Route path="/peta-rekomendasi" element={<PublicMapPage />} />
        <Route path="/map" element={<Navigate to="/peta-rekomendasi" replace />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/register" element={<AdminRegisterPage />} />

        <Route path="/admin" element={<Navigate to="/admin/datasets" replace />} />
        <Route path="/admin/dashboard" element={<Navigate to="/admin/datasets" replace />} />
        <Route path="/admin/kriteria" element={<AdminKriteriaPage />} />
        <Route path="/admin/indicators" element={<AdminIndicatorsPage />} />
        <Route path="/admin/datasets" element={<AdminDatasetsPage />} />
        <Route path="/admin/fuzzy" element={<AdminFuzzyPage />} />
        <Route path="/admin/ahp" element={<AdminAhpPage />} />
        <Route path="/admin/wlc" element={<AdminWlcPage />} />
        <Route path="/admin/map-preview" element={<AdminMapPreviewPage />} />
        <Route path="/admin/validation" element={<AdminValidationPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
