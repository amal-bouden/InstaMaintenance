import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { getUsers, creerUser } from "../api/client";

const roleLabels = {
  admin:      { label: "ADMINISTRATEUR", classes: "bg-slate-100 text-slate-800 border border-slate-300" },
  chef:       { label: "CHEF D'ATELIER",  classes: "bg-blue-50 text-blue-700 border border-blue-200" },
  technicien: { label: "TECHNICIEN",     classes: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
};

const SECTIONS = ["Automatique", "Confection", "Sterile", "Zone de coupe", "Laboratoire"];

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: "", password: "", role: "chef", section: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await getUsers();
      setUsers(data);
    } catch {
      setError("SYS_ERR: Impossible de charger le registre des utilisateurs.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.role === "chef" && !form.section) {
      setError("Validation échouée : La section est obligatoire pour un chef d'atelier.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await creerUser({
        username: form.username,
        password: form.password,
        role: form.role,
        section: form.role === "technicien" || form.role === "admin" ? null : form.section,
      });
      setSuccess(`Profil réseau "${form.username}" initialisé avec succès.`);
      setForm({ username: "", password: "", role: "chef", section: "" });
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail ?? "Erreur critique lors de l'écriture en base.");
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: users.length,
    chefs: users.filter((u) => u.role === "chef").length,
    techniciens: users.filter((u) => u.role === "technicien").length,
    admins: users.filter((u) => u.role === "admin").length,
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Entête Administrative */}
        <div className="mb-8 border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-mono font-bold text-[#0072BC] uppercase tracking-wider">
              // SYS_ADMIN / CONTROLE D'ACCÈS REPERTOIRE
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
              Console d'Administration & Profils Utilisateurs
            </h1>
          </div>
          <div>
            <button
              onClick={() => {
                setShowForm(!showForm);
                setError("");
                setSuccess("");
              }}
              className={`text-xs font-mono font-bold uppercase tracking-wider px-4 py-2.5 rounded-md transition-colors cursor-pointer shadow-2xs border ${
                showForm
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                  : "bg-[#0072BC] hover:bg-[#005c99] text-white border-transparent"
              }`}
            >
              {showForm ? "[ ANNULLER PROCÉDURE ]" : "[ + INITIALISER PROFIL ]"}
            </button>
          </div>
        </div>

        {success && (
          <div className="mb-6 text-xs font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
            STATUS_OK: {success}
          </div>
        )}

        {/* Dashboard Métriques - Style Épuré */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[
            { label: "// COMPTES ENREGISTRÉS", value: stats.total, color: "text-slate-900" },
            { label: "// ADMINISTRATEURS", value: stats.admins, color: "text-slate-500" },
            { label: "// CHEFS D'ATELIER", value: stats.chefs, color: "text-[#0072BC]" },
            { label: "// TECHNICIENS SITE", value: stats.techniciens, color: "text-emerald-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">{label}</p>
              <p className={`text-3xl font-bold font-mono tracking-tight mt-1 ${color}`}>
                {value.toString().padStart(2, "0")}
              </p>
            </div>
          ))}
        </div>

        {/* Formulaire de Création Look Document Officiel */}
        {showForm && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8 shadow-xs max-w-3xl">
            <div className="border-b border-slate-100 pb-3 mb-5">
              <h2 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
                CONFIG_USER_AUTH / CONFIGURATION DE NOUVEAUX ACCÈS
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                    Nom d'utilisateur / Identifiant Réseau *
                  </label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="ex: tech.mecanique"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#0072BC] font-mono bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                    Clé d'authentification / Password *
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Minimum 6 caractères alphanumériques"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#0072BC] font-mono bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                    Niveau d'accréditation (Rôle) *
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value, section: "" })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-[#0072BC] font-mono bg-white"
                  >
                    <option value="chef">Chef d'atelier (Vue Filtrée)</option>
                    <option value="technicien">Technicien Maintenancier</option>
                    <option value="admin">Administrateur Système</option>
                  </select>
                </div>

                {form.role === "chef" && (
                  <div>
                    <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                      Secteur d'affectation d'usine *
                    </label>
                    <select
                      value={form.section}
                      onChange={(e) => setForm({ ...form, section: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-[#0072BC] font-mono bg-white"
                      required
                    >
                      <option value="">-- Sélectionner l'atelier cible --</option>
                      {SECTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {error && (
                <div className="text-xs font-mono font-bold text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                  ERROR_AUTH_WRITE: {error}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-mono uppercase tracking-wider font-bold text-xs py-2.5 px-6 rounded-lg transition-colors focus:outline-hidden disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {loading ? "COMMUNICATION SERVEUR..." : "APPROUVER ET CRÉER LE COMPTE"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Registre des Utilisateurs - Version Table Industrielle */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["MATRICULE ID", "IDENTIFIANT RÉSEAU", "NIVEAU D'ACCRÉDITATION", "ZONE AFFECTÉE", "STATUT BASE"].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4 text-slate-400 font-bold">
                    #{u.id.toString().padStart(4, "0")}
                  </td>
                  <td className="px-5 py-4 font-sans font-semibold text-slate-900">
                    {u.username}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-md ${roleLabels[u.role]?.classes}`}>
                      {roleLabels[u.role]?.label}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600 font-medium">
                    {u.section ?? <span className="text-slate-300 font-bold">// GLOBAL_ROOT</span>}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                        u.is_active ?? true
                          ? "bg-emerald-50/60 text-emerald-700 border-emerald-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}
                    >
                      {u.is_active ?? true ? "CONNECTED_OK" : "REVOKED"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-12 text-slate-400 font-mono text-xs border-dashed border-t border-slate-100">
              AUCUN LOG DE SÉCURITÉ UTILISATEUR COMPILÉ DANS LE RÉPERTOIRE.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}