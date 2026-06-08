import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage       from "./pages/LoginPage";
import AtelierPage     from "./pages/AtelierPage";
import MaintenancePage from "./pages/MaintenancePage";
import AdminPage       from "./pages/AdminPage";
import DashboardPage   from "./pages/DashboardPage";
import HistoriquePage  from "./pages/HistoriquePage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/dashboard" element={
            <ProtectedRoute roles={["admin", "chef_maintenance"]}>
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
            <ProtectedRoute roles={["technicien", "admin", "chef_maintenance"]}>
              <MaintenancePage />
            </ProtectedRoute>
          }/>
          <Route path="/maintenance" element={
  <ProtectedRoute roles={["technicien", "admin", "chef_maintenance"]}>
    <MaintenancePage />
  </ProtectedRoute>
}/>

<Route path="/dashboard" element={
  <ProtectedRoute roles={["admin", "chef_maintenance"]}>
    <DashboardPage />
  </ProtectedRoute>
}/>

          <Route path="/admin" element={
            <ProtectedRoute roles={["admin"]}>
              <AdminPage />
            </ProtectedRoute>
          }/>

          <Route path="/historique" element={
            <ProtectedRoute roles={["admin", "chef", "technicien", "chef_maintenance"]}>
              <HistoriquePage />
            </ProtectedRoute>
          }/>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}