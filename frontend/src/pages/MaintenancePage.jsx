import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import StatutBadge from "../components/StatutBadge";
import {
  getInterventions,
  getMachines,
  prendreEnCharge,
  cloturerIntervention,
} from "../api/client";

export default function MaintenancePage() {
  const [interventions, setInterventions] = useState([]);
  const [machines, setMachines] = useState([]);
  const [selected, setSelected] = useState(null); // intervention active pour clôture
  const [form, setForm] = useState(initialForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function initialForm() {
    return {
      nature_electrique: false,
      nature_mecanique: false,
      nature_autre: false,
      parametres_controles: "",
      remarques: "",
      actions_menees: "",
      piece_rechange: "",
      cout_piece_dt: "",
    };
  }

  // Initial loader on mount — inline async to avoid hook dependency warnings
  useEffect(() => {
    (async () => {
      try {
        await Promise.all([fetchInterventions(), fetchMachines()]);
      } catch (err) {
        console.error("SYS_ERR: initial fetchAll", err);
      }
    })();
  }, []);

  // Polling toutes les 5 secondes
  useEffect(() => {
    const interval = setInterval(fetchInterventions, 5000);
    return () => clearInterval(interval);
  }, []);

  // fetchAll inlined in the initial effect above; removed unused declaration

  async function fetchInterventions() {
    try {
      const { data } = await getInterventions();
      setInterventions(data);
    } catch (err) {
      console.error("SYS_ERR: fetchInterventions", err);
    }
  }

  async function fetchMachines() {
    try {
      const { data } = await getMachines();
      setMachines(data);
    } catch (err) {
      console.error("SYS_ERR: fetchMachines", err);
    }
  }

  const getMachine = (id) => machines.find((m) => m.id === id);

  const handlePrendreEnCharge = async (id) => {
    try {
      await prendreEnCharge(id);
      await fetchInterventions();
      setSuccess("Intervention prise en charge.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("SYS_ERR: handlePrendreEnCharge", err);
      setError(err.response?.data?.detail ?? "Erreur lors de la prise en charge.");
    }
  };

  const handleOuvrir = (intervention) => {
    setSelected(intervention);
    setForm(initialForm());
    setError("");
    setSuccess("");
  };

  const handleCloturer = async (e) => {
    e.preventDefault();
    if (!form.actions_menees.trim()) {
      setError("Les actions menées sont obligatoires.");
      return;
    }
    if (!form.nature_electrique && !form.nature_mecanique && !form.nature_autre) {
      setError("Sélectionnez au moins une nature de panne.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await cloturerIntervention(selected.id, {
        ...form,
        cout_piece_dt: form.cout_piece_dt ? parseFloat(form.cout_piece_dt) : null,
      });
      setSelected(null);
      setForm(initialForm());
      setSuccess("Intervention clôturée avec succès.");
      setTimeout(() => setSuccess(""), 4000);
      await fetchInterventions();
    } catch (err) {
      console.error("SYS_ERR: handleCloturer", err);
      setError(err.response?.data?.detail ?? "Erreur lors de la clôture.");
    } finally {
      setLoading(false);
    }
  };

  const enAttente = interventions.filter((i) => i.statut === "en_attente");
  const enCours = interventions.filter((i) => i.statut === "en_cours");
  const resolus = interventions.filter((i) => i.statut === "resolu");

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* En-tête GMAO */}
        <div className="mb-8 border-b border-slate-200 pb-5">
          <p className="text-xs font-mono font-bold text-[#0072BC] uppercase tracking-wider">
            // CONSOLE TECHNIQUE OPÉRATIONNELLE
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Espace Technicien de maintenance
          </h1>
        </div>

        {success && (
          <div className="mb-6 text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 flex items-center gap-2">
            <span>✓</span> {success}
          </div>
        )}

        {/* Compteurs de performance (KPI) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-xs">
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">// INCIDENTS EN ATTENTE</p>
            <p className="text-2xl font-bold font-mono text-red-600 mt-0.5">{enAttente.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-xs">
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">// TICKET(S) EN CHARGE</p>
            <p className="text-2xl font-bold font-mono text-amber-600 mt-0.5">{enCours.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-xs">
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">// RÉSOLUTIONS (JOUR J)</p>
            <p className="text-2xl font-bold font-mono text-emerald-600 mt-0.5">{resolus.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Colonne de gauche : Flux des fiches de travail */}
          <div className="space-y-6">

            {/* Section En attente */}
            {enAttente.length > 0 && (
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs">
                <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-red-600 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <span>● Demandes urgentes</span>
                  <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded text-[10px] border border-red-100">{enAttente.length}</span>
                </h2>
                <div className="space-y-3">
                  {enAttente.map((i) => (
                    <TicketCard
                      key={i.id}
                      intervention={i}
                      machine={getMachine(i.machine_id)}
                      action={
                        <button
                          type="button"
                          onClick={() => handlePrendreEnCharge(i.id)}
                          className="text-[11px] font-mono font-bold uppercase tracking-wider bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-md transition-colors cursor-pointer shadow-2xs"
                        >
                          Prendre en charge
                        </button>
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Section En cours */}
            {enCours.length > 0 && (
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs">
                <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-amber-600 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <span>// Diagnostics actifs</span>
                  <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] border border-amber-100">{enCours.length}</span>
                </h2>
                <div className="space-y-3">
                  {enCours.map((i) => (
                    <TicketCard
                      key={i.id}
                      intervention={i}
                      machine={getMachine(i.machine_id)}
                      action={
                        <button
                          type="button"
                          onClick={() => handleOuvrir(i)}
                          className="text-[11px] font-mono font-bold uppercase tracking-wider bg-[#0072BC] hover:bg-[#005c99] text-white px-3 py-2 rounded-md transition-colors cursor-pointer shadow-2xs"
                        >
                          Remplir FOR-MAI-03
                        </button>
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Section Résolus */}
            {resolus.length > 0 && (
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs">
                <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 mb-4 pb-2 border-b border-slate-100">
                  ✔ Clôturés récemment ({resolus.length})
                </h2>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {resolus.map((i) => (
                    <TicketCard
                      key={i.id}
                      intervention={i}
                      machine={getMachine(i.machine_id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {interventions.length === 0 && (
              <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-12 text-center text-slate-400 font-mono text-sm">
                Aucun ticket en attente sur le réseau.
              </div>
            )}
          </div>

          {/* Colonne de droite : Formulaire réglementaire de clôture FOR-MAI-03 */}
          <div>
            {selected ? (
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm sticky top-6">
                <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
                  <div>
                    <h2 className="text-xs font-bold font-mono text-slate-500 uppercase tracking-wider">
                      [RAPPORT QUALITÉ] FICHE FOR-MAI-03
                    </h2>
                    <p className="text-sm font-mono font-bold text-slate-900 mt-1">
                      {getMachine(selected.machine_id)?.code} — Zone {getMachine(selected.machine_id)?.section}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-slate-400 hover:text-slate-600 text-xl font-mono p-1 cursor-pointer line-none"
                  >
                    ×
                  </button>
                </div>

                {/* Encadré Alerte Émise */}
                <div className="bg-slate-50 border border-slate-200/60 rounded-lg p-3.5 mb-5 text-xs text-slate-600 font-mono">
                  <span className="font-bold uppercase text-[10px] block mb-1 text-slate-400">// ALERTE ÉMISE :</span>
                  {selected.description}
                </div>

                <form onSubmit={handleCloturer} className="space-y-5">

                  {/* Choix Multiple : Nature Panne */}
                  <div>
                    <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-600 mb-2">
                      Nature de l'avarie *
                    </label>
                    <div className="flex flex-wrap gap-4 p-3 bg-slate-50/50 border border-slate-200/60 rounded-lg">
                      {[
                        ["nature_electrique", "Électrique"],
                        ["nature_mecanique",  "Mécanique"],
                        ["nature_autre",      "Autre"],
                      ].map(([key, label]) => (
                        <label key={key} className="flex items-center gap-2 text-xs font-mono font-bold text-slate-700 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={form[key]}
                            onChange={(e) =>
                              setForm({ ...form, [key]: e.target.checked })
                            }
                            className="w-4 h-4 rounded border-slate-300 text-[#0072BC] focus:ring-0 focus:ring-offset-0"
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Input Paramètres */}
                  <div>
                    <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-600 mb-1.5">
                      Paramètres instrumentaux contrôlés
                    </label>
                    <input
                      type="text"
                      value={form.parametres_controles}
                      onChange={(e) =>
                        setForm({ ...form, parametres_controles: e.target.value })
                      }
                      placeholder="ex: Tension d'allumage, pression hydraulique..."
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#0072BC] font-mono"
                    />
                  </div>

                  {/* Textarea Remarques */}
                  <div>
                    <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-600 mb-1.5">
                      Remarques, observations & diagnostics
                    </label>
                    <textarea
                      value={form.remarques}
                      onChange={(e) =>
                        setForm({ ...form, remarques: e.target.value })
                      }
                      rows={2}
                      placeholder="Constats d'usure, anomalies annexes repérées..."
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#0072BC] font-mono resize-none"
                    />
                  </div>

                  {/* Textarea Actions */}
                  <div>
                    <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-600 mb-1.5">
                      Actions correctives menées *
                    </label>
                    <textarea
                      value={form.actions_menees}
                      onChange={(e) =>
                        setForm({ ...form, actions_menees: e.target.value })
                      }
                      rows={3}
                      placeholder="Détaillez explicitement les interventions d'ingénierie effectuées..."
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#0072BC] font-mono resize-none"
                      required
                    />
                  </div>

                  {/* Pièce & Coût */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-600 mb-1.5">
                        Composant de rechange
                      </label>
                      <input
                        type="text"
                        value={form.piece_rechange}
                        onChange={(e) =>
                          setForm({ ...form, piece_rechange: e.target.value })
                        }
                        placeholder="Réf index usine"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#0072BC] font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-600 mb-1.5">
                        Facturation pièce (DT)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.cout_piece_dt}
                        onChange={(e) =>
                          setForm({ ...form, cout_piece_dt: e.target.value })
                        }
                        placeholder="0.000"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#0072BC] font-mono"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="text-xs font-mono text-red-700 bg-red-50 border border-red-200/60 rounded-lg px-3 py-2.5 flex items-center gap-2">
                      <span>⚠</span> {error}
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-mono uppercase tracking-wider font-bold text-xs py-3 px-4 rounded-lg shadow-xs transition-colors focus:outline-hidden disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {loading ? "Archivage du rapport..." : "✓ Signer et Clôturer l'Intervention"}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-xl border-2 border-dashed border-slate-100 p-12 text-center text-slate-400 font-mono text-xs leading-relaxed flex flex-col items-center justify-center h-64">
                <p>Aucune commande de travail en focus actif.</p>
                <p className="text-slate-300 mt-1">Sélectionnez une intervention "En cours" puis cliquez sur "Remplir FOR-MAI-03" pour générer la feuille de signature.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Sous-composant TicketCard relooké
function TicketCard({ intervention, machine, action }) {
  return (
    <div className="border border-slate-100 rounded-lg p-3.5 bg-white shadow-2xs hover:bg-slate-50/60 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-sm font-mono font-bold text-slate-900 tracking-tight">
              {machine?.code ?? `UNIT-ID #${intervention.machine_id}`}
            </span>
            <StatutBadge statut={intervention.statut} />
          </div>
          
          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{intervention.description}</p>
          
          <p className="text-[10px] font-mono font-medium text-slate-400 mt-2">
            Horodatage : {new Date(intervention.heure_reclamation).toLocaleString("fr-FR")}
          </p>
          
          {intervention.statut === "resolu" && intervention.duree_minutes && (
            <div className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50/60 rounded px-2 py-0.5 mt-2 border border-emerald-100 w-fit">
              ✓ Temps d'arrêt machine : {Math.round(intervention.duree_minutes)} min
            </div>
          )}
        </div>
        
        {action && <div className="shrink-0 self-center">{action}</div>}
      </div>
    </div>
  );
}