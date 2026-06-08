import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import StatutBadge from "../components/StatutBadge";
import { getInterventions, getMachines } from "../api/client";
import { useAuth } from "../context/useAuth";

export default function HistoriquePage() {
  const { user } = useAuth();
  const [interventions, setInterventions] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filtres
  const [selectedSection, setSelectedSection] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal de détail
  const [selectedIntervention, setSelectedIntervention] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError("");
    try {
      const [resInterventions, resMachines] = await Promise.all([
        getInterventions(),
        getMachines(),
      ]);
      setInterventions(resInterventions.data);
      setMachines(resMachines.data);
    } catch (err) {
      console.error("SYS_ERR: Historique fetch error", err);
      setError("Impossible de charger l'historique.");
    } finally {
      setLoading(false);
    }
  }

  const getMachine = (id) => machines.find((m) => m.id === id);

  // Télécharger le PDF d'un rapport
  const telechargerPDF = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8000/interventions/${id}/telecharger-pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(errorData.detail || "Erreur lors du téléchargement du PDF");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `FOR-MAI-03_${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download error:", err.message);
      alert(`Erreur PDF: ${err.message}`);
    }
  };

  // Filtrer uniquement les interventions résolues
  const interventionsResolues = interventions.filter((i) => i.statut === "resolu");

  // Appliquer les filtres de recherche, de section, et de dates
  const filteredInterventions = interventionsResolues.filter((i) => {
    const machine = getMachine(i.machine_id);
    const sectionMatch = selectedSection
      ? machine?.section === selectedSection
      : true;

    // Filtre de date (heure_reclamation ou heure_fin)
    // On va filtrer par heure_reclamation
    const recDate = i.heure_reclamation ? i.heure_reclamation.substring(0, 10) : "";
    const startDateMatch = startDate ? recDate >= startDate : true;
    const endDateMatch = endDate ? recDate <= endDate : true;

    // Filtre textuel (code machine ou actions menées ou remarques)
    const query = searchQuery.toLowerCase().trim();
    const searchMatch = query
      ? (machine?.code?.toLowerCase().includes(query) ||
         i.description?.toLowerCase().includes(query) ||
         i.actions_menees?.toLowerCase().includes(query) ||
         i.piece_rechange?.toLowerCase().includes(query))
      : true;

    return sectionMatch && startDateMatch && endDateMatch && searchMatch;
  });

  // KPIs sur les lignes filtrées
  const totalInterventions = filteredInterventions.length;
  
  const totalDowntime = filteredInterventions.reduce(
    (sum, i) => sum + (i.duree_minutes || 0),
    0
  );
  
  const averageMTTR = totalInterventions
    ? Math.round(totalDowntime / totalInterventions)
    : 0;

  const totalCost = filteredInterventions.reduce(
    (sum, i) => sum + (i.cout_piece_dt || 0),
    0
  );

  const sectionsList = [
    "Automatique",
    "Confection",
    "Sterile",
    "Zone de coupe",
    "Laboratoire",
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* En-tête historique style ERP */}
        <div className="mb-8 border-b border-slate-200 pb-5 flex justify-between items-end">
          <div>
            <p className="text-xs font-mono font-bold text-[#0072BC] uppercase tracking-wider">
              // REGISTRE ARCHIVES & TRAÇABILITÉ
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
              Historique des Interventions Correctives
            </h1>
          </div>
          <button
            onClick={fetchData}
            className="text-xs font-mono font-bold text-[#0072BC] hover:text-blue-700 bg-white border border-slate-200 px-3 py-2 rounded-lg shadow-2xs cursor-pointer hover:bg-slate-50 transition-colors"
          >
            Rafraîchir
          </button>
        </div>

        {error && (
          <div className="mb-6 text-xs font-mono text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            ⚠ {error}
          </div>
        )}

        {/* KPIs Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-2xs">
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">// RAPPORTS ARCHIVÉS</p>
            <p className="text-2xl font-bold font-mono text-slate-900 mt-0.5">{totalInterventions}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-2xs">
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">// ARRÊT MACHINE TOTAL</p>
            <p className="text-2xl font-bold font-mono text-amber-600 mt-0.5">{Math.round(totalDowntime)} min</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-2xs">
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">// TEMPS DE RÉPARATION MOYEN (MTTR)</p>
            <p className="text-2xl font-bold font-mono text-indigo-600 mt-0.5">{averageMTTR} min</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-2xs">
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">// BUDGET PIÈCES FACTURÉ</p>
            <p className="text-2xl font-bold font-mono text-emerald-600 mt-0.5">{totalCost.toFixed(2)} DT</p>
          </div>
        </div>

        {/* Barre de Recherche et Filtres */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-2xs mb-6">
          <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-4">// FILTRES DE RECHERCHE</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Recherche globale */}
            <div>
              <label className="block text-xs font-mono font-bold text-slate-500 mb-1">Recherche textuelle</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Code machine, panne, action corrective..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-hidden focus:border-[#0072BC] placeholder-slate-400"
              />
            </div>

            {/* Section/Emplacement */}
            <div>
              <label className="block text-xs font-mono font-bold text-slate-500 mb-1">Section d'affectation</label>
              {user?.role === "chef" ? (
                <input
                  type="text"
                  value={user.section}
                  disabled
                  className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-500 font-bold"
                />
              ) : (
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-800 focus:outline-hidden focus:border-[#0072BC]"
                >
                  <option value="">Toutes les sections</option>
                  {sectionsList.map((sec) => (
                    <option key={sec} value={sec}>{sec}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Date début */}
            <div>
              <label className="block text-xs font-mono font-bold text-slate-500 mb-1">Date Début (Reclamation)</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-hidden focus:border-[#0072BC]"
              />
            </div>

            {/* Date fin */}
            <div>
              <label className="block text-xs font-mono font-bold text-slate-500 mb-1">Date Fin (Reclamation)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-hidden focus:border-[#0072BC]"
              />
            </div>

          </div>

          {(selectedSection || startDate || endDate || searchQuery) && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => {
                  setSelectedSection("");
                  setStartDate("");
                  setEndDate("");
                  setSearchQuery("");
                }}
                className="text-xs font-mono font-bold text-red-600 hover:text-red-700 cursor-pointer"
              >
                [ Réinitialiser les filtres ]
              </button>
            </div>
          )}
        </div>

        {/* Tableau des Interventions */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-2xs">
          {loading ? (
            <div className="text-center py-16 text-slate-400 font-mono text-sm">
              Chargement des archives de maintenance corrective...
            </div>
          ) : filteredInterventions.length === 0 ? (
            <div className="text-center py-16 text-slate-400 font-mono text-sm">
              Aucune intervention correspondante dans l'historique.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4">N° Fiche</th>
                    <th className="py-3.5 px-4">Machine</th>
                    <th className="py-3.5 px-4">Section</th>
                    <th className="py-3.5 px-4">Réclamation</th>
                    <th className="py-3.5 px-4">Date Résolution</th>
                    <th className="py-3.5 px-4 text-center">Durée</th>
                    <th className="py-3.5 px-4">Composant / Coût</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                  {filteredInterventions.map((i) => {
                    const machine = getMachine(i.machine_id);
                    return (
                      <tr
                        key={i.id}
                        className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                        onClick={() => setSelectedIntervention(i)}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          #{i.id.toString().padStart(4, "0")}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {machine?.code || `ID: ${i.machine_id}`}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-600">
                          {machine?.section || "—"}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(i.heure_reclamation).toLocaleString("fr-FR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {i.heure_fin
                            ? new Date(i.heure_fin).toLocaleString("fr-FR", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })
                            : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-700 bg-amber-50/20">
                          {i.duree_minutes ? `${Math.round(i.duree_minutes)} min` : "—"}
                        </td>
                        <td className="py-3.5 px-4">
                          {i.piece_rechange ? (
                            <div>
                              <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">
                                {i.piece_rechange}
                              </span>
                              {i.cout_piece_dt ? (
                                <span className="text-emerald-700 font-bold ml-1.5 font-mono">
                                  {i.cout_piece_dt.toFixed(2)} DT
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Aucune</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setSelectedIntervention(i)}
                              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer border border-slate-200"
                            >
                              Détails
                            </button>
                            <button
                              onClick={() => telechargerPDF(i.id)}
                              className="text-xs bg-gray-800 hover:bg-black text-white font-mono font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              PDF
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Détails Intervention */}
      {selectedIntervention && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-up">
            {/* Header */}
            <div className="bg-slate-950 text-white p-5 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  // FICHE INTERVENTION CORRECTIVE
                </p>
                <h3 className="text-md font-mono font-bold mt-1">
                  Rapport FOR-MAI-03 #{selectedIntervention.id.toString().padStart(4, "0")}
                </h3>
              </div>
              <button
                onClick={() => setSelectedIntervention(null)}
                className="text-slate-400 hover:text-white text-2xl font-mono p-1 cursor-pointer leading-none"
              >
                &times;
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 max-h-120 overflow-y-auto font-sans">
              
              {/* Informations Générales */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[10px]">Code Equipement:</span>
                  <span className="text-slate-900 font-bold text-sm">
                    {getMachine(selectedIntervention.machine_id)?.code ?? "Inconnu"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-bold text-[10px]">Section / Emplacement:</span>
                  <span className="text-slate-900 font-bold text-sm">
                    {getMachine(selectedIntervention.machine_id)?.section ?? "Inconnue"}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-slate-400 block uppercase font-bold text-[10px]">Date Signalement:</span>
                  <span className="text-slate-700 font-bold">
                    {new Date(selectedIntervention.heure_reclamation).toLocaleString("fr-FR")}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-slate-400 block uppercase font-bold text-[10px]">Date Clôture:</span>
                  <span className="text-slate-700 font-bold">
                    {selectedIntervention.heure_fin
                      ? new Date(selectedIntervention.heure_fin).toLocaleString("fr-FR")
                      : "—"}
                  </span>
                </div>
              </div>

              {/* Description Dysfonctionnement */}
              <div>
                <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 mb-2">
                  1 - Description de la panne
                </h4>
                <p className="text-sm bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 leading-relaxed">
                  {selectedIntervention.description}
                </p>
              </div>

              {/* Diagnostic Technique */}
              <div>
                <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 mb-2">
                  2 - Nature & Diagnostics
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-slate-400 block uppercase font-mono font-bold text-[10px]">Nature de l'avarie:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedIntervention.nature_electrique && (
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                          Electrique
                        </span>
                      )}
                      {selectedIntervention.nature_mecanique && (
                        <span className="bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                          Mecanique
                        </span>
                      )}
                      {selectedIntervention.nature_autre && (
                        <span className="bg-slate-100 text-slate-700 border border-slate-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                          Autre
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase font-mono font-bold text-[10px]">Paramètres instrumentaux contrôlés:</span>
                    <p className="text-xs text-slate-800 font-mono mt-1">
                      {selectedIntervention.parametres_controles || "—"}
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <span className="text-slate-400 block uppercase font-mono font-bold text-[10px] mb-1">Observations / Remarques:</span>
                  <p className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 font-mono leading-relaxed">
                    {selectedIntervention.remarques || "Aucune remarque particuliere."}
                  </p>
                </div>
              </div>

              {/* Actions correctives menées */}
              <div>
                <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 mb-2">
                  3 - Actions correctives de maintenance
                </h4>
                <p className="text-sm bg-emerald-50/30 border border-emerald-100 rounded-lg p-3 text-slate-900 leading-relaxed font-semibold">
                  {selectedIntervention.actions_menees}
                </p>
              </div>

              {/* Pièce de rechange et coûts */}
              <div>
                <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 mb-2">
                  4 - Pièces & Comptabilité analytique
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono">
                    <span className="text-slate-400 block font-bold text-[9px] uppercase">Composant de rechange :</span>
                    <span className="text-slate-900 font-bold text-sm block mt-1">
                      {selectedIntervention.piece_rechange || "Aucun composant de rechange"}
                    </span>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs font-mono">
                    <span className="text-emerald-700/80 block font-bold text-[9px] uppercase">Coût de facturation :</span>
                    <span className="text-emerald-700 font-bold text-sm block mt-1">
                      {selectedIntervention.cout_piece_dt ? `${selectedIntervention.cout_piece_dt.toFixed(3)} DT` : "0.000 DT"}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-between items-center">
              <button
                onClick={() => telechargerPDF(selectedIntervention.id)}
                className="text-xs bg-slate-950 hover:bg-black text-white font-mono font-bold px-4 py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Générer Fiche PDF Qualité (FOR-MAI-03)
              </button>
              <button
                onClick={() => setSelectedIntervention(null)}
                className="text-xs bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-mono font-bold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
