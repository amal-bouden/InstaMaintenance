import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const roleRoutes = {
    admin: "/admin",
    chef: "/atelier",
    technicien: "/maintenance",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await login(username, password);
      loginUser(data);
      navigate(roleRoutes[data.role] ?? "/login");
    } catch {
      setError("Identifiants incorrects. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans antialiased">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Identité visuelle émulée de CONSOMED */}
        <h1 className="tracking-tight text-4xl font-black text-[#0072BC]">
          conso<span className="text-[#ED1C24] font-medium text-3xl">med</span>®
        </h1>
        <p className="mt-2 text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">
          // INSTAMAINTENANCE — SYSTÈME GMAO
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xs border border-[#E2E8F0] sm:rounded-xl sm:px-10">
          <div className="mb-6 border-b border-slate-100 pb-4 text-center">
            <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500">
              Authentification Agent de Production
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-600 mb-1">
                Nom d'utilisateur
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 text-slate-900 placeholder-slate-400 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:border-[#0072BC] focus:bg-white transition-all font-mono"
                placeholder="ex: chef_confection"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-600 mb-1">
                Mot de passe système
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 text-slate-900 placeholder-slate-400 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:border-[#0072BC] focus:bg-white transition-all font-mono"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="text-xs font-mono text-red-700 bg-red-50 border border-red-200/60 rounded-lg px-3 py-2.5 flex items-center gap-2">
                <span className="text-sm">⚠</span> {error}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0072BC] hover:bg-[#005c99] text-white font-medium text-sm py-2.5 px-4 rounded-lg shadow-xs transition-colors focus:outline-hidden font-mono uppercase tracking-wider font-bold disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? "Initialisation session..." : "Initialiser la Session →"}
              </button>
            </div>
          </form>
        </div>

        {/* Pied de page normatif */}
        <div className="mt-6 text-center text-[10px] font-mono text-slate-400 space-y-1">
          <p>Application conforme aux normes de traçabilité qualité et réglementations BPF.</p>
          <p className="text-slate-300">© 2026 CONSOMED • Tous droits réservés.</p>
        </div>
      </div>
    </div>
  );
}