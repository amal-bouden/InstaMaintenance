import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/client";
import { useAuth } from "../context/useAuth";

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
    chef_maintenance: "/dashboard",
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
    <div className="min-h-screen bg-gradient-to-br from-[#f0f7ff] via-[#F8FAFC] to-[#e8f4fd] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans antialiased">
      
      {/* Top decorative bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0072BC] via-[#00a0e3] to-[#ED1C24]" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Real Consomed Logo */}
        <div className="flex justify-center mb-4">
          <img
            src="/consomed-logo.svg"
            alt="CONSOMED — Consommables Médicaux"
            className="h-20 w-auto drop-shadow-sm"
            draggable="false"
          />
        </div>

        {/* Certification badges row */}
        <div className="flex justify-center items-center gap-3 mb-5 flex-wrap">
          {/* ISO 13485 */}
          <div className="flex flex-col items-center justify-center w-12 h-12 rounded-full border-2 border-slate-300 bg-white shadow-sm">
            <span className="text-[7px] font-black text-slate-500 leading-none tracking-tight">ISO</span>
            <span className="text-[8px] font-black text-slate-700 leading-none">13485</span>
          </div>
          {/* CE */}
          <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-[#0072BC] bg-[#0072BC] shadow-sm">
            <span className="text-white text-sm font-black tracking-tight">CE</span>
          </div>
          {/* ISO 9001 */}
          <div className="flex flex-col items-center justify-center w-12 h-12 rounded-full border-2 border-slate-300 bg-white shadow-sm">
            <span className="text-[7px] font-black text-slate-500 leading-none tracking-tight">ISO</span>
            <span className="text-[7px] font-black text-slate-700 leading-none">9001:2008</span>
          </div>
          {/* BPF */}
          <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-[#005c99] bg-[#005c99] shadow-sm">
            <span className="text-white text-xs font-black tracking-tight">BPF</span>
          </div>
        </div>

        <p className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">
          // INSTAMAINTENANCE — SYSTÈME GMAO
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-lg border border-[#E2E8F0] sm:rounded-2xl sm:px-10 relative overflow-hidden">
          {/* Top accent stripe */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0072BC] to-[#00a0e3]" />

          <div className="mb-6 border-b border-slate-100 pb-4 text-center">
            <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500">
              Authentification Agent de Production
            </h2>
            <p className="text-[10px] font-mono text-slate-300 mt-1">
              Accès sécurisé — CONSOMED GMAO v2.0
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-600 mb-1.5">
                Nom d'utilisateur
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 text-slate-900 placeholder-slate-400 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0072BC] focus:ring-1 focus:ring-[#0072BC]/20 focus:bg-white transition-all font-mono"
                placeholder="ex: chef_confection"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-600 mb-1.5">
                Mot de passe système
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 text-slate-900 placeholder-slate-400 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#0072BC] focus:ring-1 focus:ring-[#0072BC]/20 focus:bg-white transition-all font-mono"
                placeholder="••••••••"
                required
                autoComplete="current-password"
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
                className="w-full bg-[#0072BC] hover:bg-[#005c99] text-white text-sm py-2.5 px-4 rounded-lg shadow-sm transition-all focus:outline-none font-mono uppercase tracking-wider font-bold disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed hover:shadow-md active:scale-[0.98]"
              >
                {loading ? "Initialisation session..." : "Initialiser la Session →"}
              </button>
            </div>
          </form>
        </div>

        {/* Footer normatif */}
        <div className="mt-6 text-center text-[10px] font-mono text-slate-400 space-y-1">
          <p>Application conforme aux normes de traçabilité qualité et réglementations BPF.</p>
          <p className="text-slate-300">© 2026 CONSOMED • Tous droits réservés • ISO 13485 • ISO 9001:2008 • BPF</p>
        </div>
      </div>
    </div>
  );
}