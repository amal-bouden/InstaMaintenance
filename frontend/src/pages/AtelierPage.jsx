import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import StatutBadge from "../components/StatutBadge";
import { getMachines, getInterventions, creerIntervention } from "../api/client";
import { useAuth } from "../context/useAuth";

export default function AtelierPage() {
  const { user } = useAuth();

  const [machines, setMachines] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [machineId, setMachineId] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Chargement initial
  useEffect(() => {
    fetchMachines();
    fetchInterventions();
  }, []);

  // Polling toutes les 5 secondes pour les mises à jour temps réel
  useEffect(() => {
    const interval = setInterval(fetchInterventions, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchMachines() {
    try {
      const { data } = await getMachines();
      setMachines(data);
    } catch {
      setError("Impossible de charger les machines.");
    }
  }

  async function fetchInterventions() {
    try {
      const { data } = await getInterventions();
      setInterventions(data);
    } catch (err) {
      console.error("SYS_ERR: fetchInterventions", err);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!machineId) { setError("Sélectionnez une machine."); return; }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await creerIntervention({
        machine_id: parseInt(machineId),
        description: description.trim(),
      });
      setSuccess("Réclamation envoyée. Le technicien a été notifié.");
      setMachineId("");
      setDescription("");
      fetchInterventions();
    } catch {
      setError("Erreur lors de l'envoi. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  // Groupe les machines par section pour le sélecteur
  const machinesParSection = machines.reduce((acc, m) => {
    acc[m.section] = acc[m.section] ? [...acc[m.section], m] : [m];
    return acc;
  }, {});

  // Enrichit les interventions avec le code machine
  const interventionsEnrichies = interventions.map((i) => ({
    ...i,
    machine: machines.find((m) => m.id === i.machine_id),
  }));

  const stats = {
    en_attente: interventions.filter(i => i.statut === "en_attente").length,
    en_cours:   interventions.filter(i => i.statut === "en_cours").length,
    resolu:     interventions.filter(i => i.statut === "resolu").length,
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* En-tête de section style ERP */}
        <div className="mb-8 border-b border-slate-200 pb-5">
          <p className="text-xs font-mono font-bold text-[#0072BC] uppercase tracking-wider">
            // INTERFACE SUPERVISION ATELIER
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1 flex items-center gap-2">
            Espace Chef d'atelier
            {user?.section && (
              <span className="text-xs font-mono bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded border border-slate-200">
                SECTION: {user.section}
              </span>
            )}
          </h1>
        </div>

        {/* Cartes statistiques techniques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs">
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">// ALERTES EN ATTENTE</p>
            <p className="text-3xl font-bold font-mono tracking-tight text-red-600 mt-1">{stats.en_attente}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs">
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">// INTERVENTIONS EN COURS</p>
            <p className="text-3xl font-bold font-mono tracking-tight text-amber-600 mt-1">{stats.en_cours}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs">
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">// RAPPORTS RÉSOLUS</p>
            <p className="text-3xl font-bold font-mono tracking-tight text-emerald-600 mt-1">{stats.resolu}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Formulaire de déclaration clinique */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-xs h-fit">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-5">
              <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500">
                [FORM-MAI-01] Signaler un dysfonctionnement
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-600 mb-1.5">
                  Équipement cible
                </label>
                <select
                  value={machineId}
                  onChange={(e) => setMachineId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-50 font-mono text-slate-800 focus:outline-hidden focus:border-[#0072BC] focus:bg-white transition-all"
                  required
                >
                  <option value="" className="font-sans">-- Sélectionner une machine du parc --</option>
                  {Object.entries(machinesParSection).map(([section, liste]) => (
                    <optgroup key={section} label={`Zone : ${section}`} className="font-sans font-bold text-slate-500">
                      {liste.map((m) => (
                        <option key={m.id} value={m.id} className="font-mono text-slate-800">
                          {m.code} — {m.famille}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-600 mb-1.5">
                  Description technique de l'anomalie
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Ex: Rupture mécanique, défaut d'alimentation ultrasonique, bruit anormal au niveau de l'arbre de transmission..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#0072BC] focus:bg-white transition-all resize-none"
                  required
                />
              </div>

              {error && (
                <div className="text-xs font-mono text-red-700 bg-red-50 border border-red-200/60 rounded-lg px-3 py-2.5 flex items-center gap-2">
                  <span className="text-sm">⚠</span> {error}
                </div>
              )}
              {success && (
                <div className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-lg px-3 py-2.5 flex items-center gap-2">
                  <span className="text-sm">✓</span> {success}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0072BC] hover:bg-[#005c99] text-white font-mono uppercase tracking-wider font-bold text-xs py-3 px-4 rounded-lg shadow-xs transition-colors focus:outline-hidden disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {loading ? "Transmission en cours..." : "Transmettre l'alerte à la maintenance →"}
                </button>
              </div>
            </form>
          </div>

          {/* Registre des interventions en direct */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-xs flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500">
                // SUIVI DES COMMANDES DE TRAVAIL
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 animate-pulse">
                ● Live 5s
              </span>
            </div>

            {interventionsEnrichies.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm font-mono border-2 border-dashed border-slate-100 rounded-xl">
                Aucun ticket d'intervention actif sur le serveur.
              </div>
            ) : (
              <div className="space-y-3 max-h-110 overflow-y-auto pr-1 scrollbar-thin">
                {interventionsEnrichies.map((i) => (
                  <div
                    key={i.id}
                    className="border border-slate-100 rounded-lg p-3.5 hover:bg-slate-50/70 transition-colors bg-white shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono font-bold text-slate-900 tracking-tight">
                          {i.machine?.code ?? `UNIT-ID #${i.machine_id}`}
                        </p>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {i.description}
                        </p>
                        <p className="text-[10px] font-mono font-medium text-slate-400 mt-2">
                          Horodatage : {new Date(i.heure_reclamation).toLocaleString("fr-FR")}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <StatutBadge statut={i.statut} />
                      </div>
                    </div>

                    {i.statut === "resolu" && i.duree_minutes && (
                      <div className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50/50 rounded-md px-2.5 py-1 mt-3 border border-emerald-100 w-fit flex items-center gap-1.5">
                        <span>✓</span> Temps d'arrêt : {Math.round(i.duree_minutes)} min
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}