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
import AdminTop10MapPage from "./pages/AdminTop10MapPage";
import ErrorPage from "./pages/ErrorPage";
import ProtectedRoute from "./components/common/ProtectedRoute";

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

        {/* Custom Error Pages */}
        <Route path="/error/400" element={<ErrorPage code={400} />} />
        <Route path="/error/401" element={<ErrorPage code={401} />} />
        <Route path="/error/403" element={<ErrorPage code={403} />} />
        <Route path="/error/404" element={<ErrorPage code={404} />} />

        {/* Protected Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute><Navigate to="/admin/datasets" replace /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute><Navigate to="/admin/datasets" replace /></ProtectedRoute>} />
        <Route path="/admin/kriteria" element={<ProtectedRoute><AdminKriteriaPage /></ProtectedRoute>} />
        <Route path="/admin/indicators" element={<ProtectedRoute><AdminIndicatorsPage /></ProtectedRoute>} />
        <Route path="/admin/datasets" element={<ProtectedRoute><AdminDatasetsPage /></ProtectedRoute>} />
        <Route path="/admin/fuzzy" element={<ProtectedRoute><AdminFuzzyPage /></ProtectedRoute>} />
        <Route path="/admin/ahp" element={<ProtectedRoute><AdminAhpPage /></ProtectedRoute>} />
        <Route path="/admin/wlc" element={<ProtectedRoute><AdminWlcPage /></ProtectedRoute>} />
        <Route path="/admin/map-preview" element={<ProtectedRoute><AdminMapPreviewPage /></ProtectedRoute>} />
        <Route path="/admin/top-10-map" element={<ProtectedRoute><AdminTop10MapPage /></ProtectedRoute>} />
        <Route path="/admin/validation" element={<ProtectedRoute><AdminValidationPage /></ProtectedRoute>} />
        
        {/* Catch-all route */}
        <Route path="*" element={<ErrorPage code={404} />} />
      </Routes>
    </BrowserRouter>
  );
}
