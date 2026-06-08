import { useAuth } from "../context/useAuth";
import { useNavigate, useLocation } from "react-router-dom";

const roleLabels = {
  admin:            "Administrateur",
  chef:             "Chef d'atelier",
  technicien:       "Technicien",
  chef_maintenance: "Chef de Maintenance",
};

const navLinks = {
  admin: [
    { path: "/admin",       label: "REGISTRE_UTILISATEURS" },
    { path: "/atelier",     label: "CONSOLE_ATELIER" },
    { path: "/maintenance", label: "FLUX_MAINTENANCE" },
    { path: "/dashboard",   label: "BI_ANALYTICS" },
  ],
  chef_maintenance: [
    { path: "/dashboard",   label: "BI_ANALYTICS" },
    { path: "/maintenance", label: "FLUX_MAINTENANCE" },
    { path: "/historique",  label: "HISTORIQUE_LOGS" },
  ],
};

export default function Navbar() {
  const { user, logoutUser } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const handleLogout = () => { 
    logoutUser(); 
    navigate("/login"); 
  };

  const links = navLinks[user?.role] ?? [];

  return (
    <nav className="bg-white border-b border-slate-200 px-6 py-2 flex items-center justify-between font-sans antialiased shadow-sm">
      
      {/* Section Gauche : Logo Consomed & Navigation dynamic par rôle */}
      <div className="flex items-center gap-8">
        {/* Real Consomed Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(links[0]?.path ?? "/")}>
          <img
            src="/consomed-logo.svg"
            alt="CONSOMED"
            className="h-10 w-auto"
            draggable="false"
          />
          <div className="border-l border-slate-200 pl-3">
            <p className="text-[9px] font-mono font-black tracking-widest text-slate-400 uppercase leading-none">
              // INSTAMAINTENANCE
            </p>
            <p className="text-[8px] font-mono text-slate-300 tracking-widest uppercase leading-tight">
              SYSTÈME GMAO
            </p>
          </div>
        </div>

        {links.length > 0 && (
          <div className="flex gap-6 text-xs font-mono font-bold">
            {links.map(({ path, label }) => {
              const isActive = location.pathname === path;
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={`transition-colors cursor-pointer tracking-wider pb-1 ${
                    isActive
                      ? "text-[#0072BC] border-b-2 border-[#0072BC]"
                      : "text-slate-400 hover:text-slate-800"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Section Droite : Statut & Profil utilisateur */}
      <div className="flex items-center gap-6">
        {user?.section && (
          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded">
            SECTION: {user.section.toUpperCase()}
          </span>
        )}

        <span className="text-xs font-mono text-slate-400">
          ID: <span className="text-slate-700 font-bold">{user?.username}</span> —{" "}
          <span className="text-[#0072BC] font-bold uppercase">
            {roleLabels[user?.role] || "Visiteur"}
          </span>
        </span>
        
        <button
          onClick={handleLogout}
          className="text-xs font-mono font-bold text-red-600 hover:text-red-700 border border-red-100 hover:border-red-200 bg-red-50/50 px-2.5 py-1 rounded transition-colors cursor-pointer"
        >
          [ DECONNEXION ]
        </button>
      </div>

    </nav>
  );
}