import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage       from "./pages/LoginPage";
import AtelierPage     from "./pages/AtelierPage";
import MaintenancePage from "./pages/MaintenancePage";
import AdminPage       from "./pages/AdminPage";
import DashboardPage   from "./pages/DashboardPage";


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/dashboard" element={
  <ProtectedRoute roles={["admin"]}>
    <DashboardPage />
  </ProtectedRoute>
}/>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/atelier" element={
            <ProtectedRoute roles={["chef", "admin"]}>
              <AtelierPage />
            </ProtectedRoute>
          }/>

          <Route path="/maintenance" element={
            <ProtectedRoute roles={["technicien", "admin"]}>
              <MaintenancePage />
            </ProtectedRoute>
          }/>

          <Route path="/admin" element={
            <ProtectedRoute roles={["admin"]}>
              <AdminPage />
            </ProtectedRoute>
          }/>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}