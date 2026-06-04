import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const roleLabels = {
  admin:      "Administrateur",
  chef:       "Chef d'atelier",
  technicien: "Technicien",
};

export default function Navbar() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-lg font-semibold text-gray-800">⚙️ InstaMaintenance</span>
        {user?.section && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            {user.section}
          </span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">
          {user?.username} —{" "}
          <span className="font-medium text-gray-700">{roleLabels[user?.role]}</span>
        </span>
        <button
          onClick={handleLogout}
          className="text-sm text-red-500 hover:text-red-700 transition-colors"
        >
          Déconnexion
        </button>
      </div>
    </nav>
  );
}