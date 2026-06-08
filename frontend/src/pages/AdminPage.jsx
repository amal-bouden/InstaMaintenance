import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { getUsers, creerUser, getMachines, creerMachine, modifierMachine, supprimerMachine } from "../api/client";

const roleLabels = {
  admin:            { label: "Admin",            classes: "bg-purple-100 text-purple-700 border border-purple-200" },
  chef:             { label: "Chef",             classes: "bg-blue-100 text-blue-700 border border-blue-200" },
  technicien:       { label: "Technicien",       classes: "bg-green-100 text-green-700 border border-green-200" },
  chef_maintenance: { label: "Chef Maintenance", classes: "bg-amber-100 text-amber-700 border border-amber-200" },
};

const SECTIONS = ["Automatique", "Confection", "Sterile", "Zone de coupe", "Laboratoire"];

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [machines, setMachines] = useState([]);
  const [form, setForm] = useState({ username: "", password: "", role: "chef", section: "" });
  const [machineForm, setMachineForm] = useState({ code: "", section: "Automatique", famille: "", etat: "Fonctionnelle" });
  const [editingMachine, setEditingMachine] = useState(null);
  const [loading, setLoading] = useState(false);
  const [machineLoading, setMachineLoading] = useState(false);
  const [error, setError] = useState("");
  const [machineError, setMachineError] = useState("");
  const [success, setSuccess] = useState("");
  const [machineSuccess, setMachineSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showMachineForm, setShowMachineForm] = useState(false);

  

  const fetchUsers = async () => {
    try {
      const { data } = await getUsers();
      setUsers(data);
    } catch (err) {
      setError("SYS_ERR: Impossible de charger le registre des utilisateurs.");
      console.error(err);
    }
  };

  const fetchMachines = async () => {
    try {
      const { data } = await getMachines();
      setMachines(data);
    } catch (err) {
      setMachineError("SYS_ERR: Impossible de charger le registre des machines.");
      console.error(err);
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [usersRes, machinesRes] = await Promise.all([getUsers(), getMachines()]);
        if (mounted) {
          setUsers(usersRes.data);
          setMachines(machinesRes.data);
        }
      } catch (err) {
        if (mounted) {
          setError("SYS_ERR: Impossible de charger le registre des utilisateurs.");
          setMachineError("SYS_ERR: Impossible de charger le registre des machines.");
        }
        console.error(err);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);
  
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
        section: ["technicien", "admin", "chef_maintenance"].includes(form.role) ? null : form.section,
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

  const resetMachineForm = () => {
    setMachineForm({ code: "", section: "Automatique", famille: "", etat: "Fonctionnelle" });
    setEditingMachine(null);
    setMachineError("");
    setMachineSuccess("");
  };

  const handleMachineSubmit = async (e) => {
    e.preventDefault();
    setMachineLoading(true);
    setMachineError("");
    setMachineSuccess("");
    try {
      const payload = {
        code: machineForm.code,
        section: machineForm.section,
        famille: machineForm.famille,
        etat: machineForm.etat,
      };
      if (editingMachine) {
        await modifierMachine(editingMachine.id, payload);
        setMachineSuccess(`Machine "${machineForm.code}" mise à jour avec succès.`);
      } else {
        await creerMachine(payload);
        setMachineSuccess(`Machine "${machineForm.code}" créée avec succès.`);
      }
      resetMachineForm();
      setShowMachineForm(false);
      fetchMachines();
    } catch (err) {
      setMachineError(err.response?.data?.detail ?? "Erreur lors de l'enregistrement de la machine.");
    } finally {
      setMachineLoading(false);
    }
  };

  const handleEditMachine = (machine) => {
    setMachineForm({
      code: machine.code,
      section: machine.section,
      famille: machine.famille,
      etat: machine.etat,
    });
    setEditingMachine(machine);
    setShowMachineForm(true);
    setMachineError("");
    setMachineSuccess("");
  };

  const handleDeleteMachine = async (machine) => {
    if (!window.confirm(`Supprimer la machine ${machine.code} ? Cette opération est irréversible.`)) {
      return;
    }
    try {
      await supprimerMachine(machine.id);
      setMachineSuccess(`Machine "${machine.code}" supprimée.`);
      fetchMachines();
    } catch (err) {
      setMachineError(err.response?.data?.detail ?? "Erreur lors de la suppression de la machine.");
    }
  };

  const stats = {
    total: users.length,
    chefs: users.filter((u) => u.role === "chef").length,
    techniciens: users.filter((u) => u.role === "technicien").length,
    admins: users.filter((u) => u.role === "admin").length,
    chefMaintenances: users.filter((u) => u.role === "chef_maintenance").length,
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
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { label: "// COMPTES ENREGISTRÉS", value: stats.total, color: "text-slate-900" },
            { label: "// ADMINISTRATEURS", value: stats.admins, color: "text-slate-500" },
            { label: "// CHEFS D'ATELIER", value: stats.chefs, color: "text-[#0072BC]" },
            { label: "// TECHNICIENS SITE", value: stats.techniciens, color: "text-emerald-600" },
            { label: "// CHEFS MAINTENANCE", value: stats.chefMaintenances, color: "text-indigo-600" },
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
                    <option value="chef_maintenance">Chef de Maintenance (Vue Globale)</option>
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

        {/* Gestion des Machines */}
        <div className="mb-8 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                Gestion des Machines
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Créez, modifiez ou supprimez les machines disponibles pour les interventions.
              </p>
            </div>
            <button
              onClick={() => {
                setShowMachineForm(!showMachineForm);
                resetMachineForm();
              }}
              className="text-xs font-mono font-bold uppercase tracking-wider px-4 py-2.5 rounded-md bg-[#0072BC] hover:bg-[#005c99] text-white border border-transparent"
            >
              {showMachineForm ? "[ ANNULER ]" : "[ + GÉRER UNE MACHINE ]"}
            </button>
          </div>

          {machineSuccess && (
            <div className="mb-4 text-xs font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
              STATUS_OK: {machineSuccess}
            </div>
          )}
          {machineError && (
            <div className="mb-4 text-xs font-mono font-bold text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              ERROR_MACHINE: {machineError}
            </div>
          )}

          {showMachineForm && (
            <form onSubmit={handleMachineSubmit} className="space-y-5 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                    Code machine
                  </label>
                  <input
                    type="text"
                    value={machineForm.code}
                    onChange={(e) => setMachineForm({ ...machineForm, code: e.target.value })}
                    placeholder="ex : P-124"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#0072BC] font-mono bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                    Section
                  </label>
                  <select
                    value={machineForm.section}
                    onChange={(e) => setMachineForm({ ...machineForm, section: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-[#0072BC] font-mono bg-white"
                    required
                  >
                    {SECTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                    Famille
                  </label>
                  <input
                    type="text"
                    value={machineForm.famille}
                    onChange={(e) => setMachineForm({ ...machineForm, famille: e.target.value })}
                    placeholder="ex : Presse, Cutter, Nettoyeur"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#0072BC] font-mono bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                    Etat
                  </label>
                  <select
                    value={machineForm.etat}
                    onChange={(e) => setMachineForm({ ...machineForm, etat: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-[#0072BC] font-mono bg-white"
                  >
                    <option value="Fonctionnelle">Fonctionnelle</option>
                    <option value="En panne">En panne</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={machineLoading}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-mono uppercase tracking-wider font-bold text-xs py-2.5 rounded-lg transition-colors focus:outline-hidden disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {machineLoading ? "ENVOI EN COURS..." : editingMachine ? "METTRE À JOUR" : "CRÉER LA MACHINE"}
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {[
                    "ID",
                    "CODE",
                    "SECTION",
                    "FAMILLE",
                    "ETAT",
                    "ACTIONS",
                  ].map((h) => (
                    <th key={h} className="px-4 py-3.5 text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {machines.map((machine) => (
                  <tr key={machine.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4 text-slate-500">#{machine.id.toString().padStart(3, "0")}</td>
                    <td className="px-4 py-4 font-semibold text-slate-900">{machine.code}</td>
                    <td className="px-4 py-4 text-slate-600">{machine.section}</td>
                    <td className="px-4 py-4 text-slate-600">{machine.famille}</td>
                    <td className="px-4 py-4 text-slate-600">{machine.etat}</td>
                    <td className="px-4 py-4 space-x-2">
                      <button
                        onClick={() => handleEditMachine(machine)}
                        className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded border border-slate-300 text-slate-700 bg-slate-50 hover:bg-slate-100"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDeleteMachine(machine)}
                        className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded border border-red-200 text-red-700 bg-red-50 hover:bg-red-100"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
                {machines.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-slate-400 font-mono text-xs">
                      Aucune machine disponible. Utilisez le bouton ci-dessus pour en créer une.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

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