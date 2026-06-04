import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { getStatsMTTR, getStatsCouts, getStatsHistorique, getInterventions } from "../api/client";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend, Title
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend, Title
);

// Palette technique unifiée aux ateliers de l'usine
const SECTION_COLORS = {
  "Automatique":    { bg: "rgba(0,114,188,0.85)",  border: "#0072BC" }, // Bleu Consomed
  "Confection":     { bg: "rgba(100,116,139,0.85)", border: "#64748b" }, // Gris Technique
  "Sterile":        { bg: "rgba(16,185,129,0.85)", border: "#10b981" }, // Vert Salle Blanche
  "Zone de coupe":  { bg: "rgba(249,115,22,0.85)",  border: "#f97316" }, // Orange Alerte
  "Laboratoire":    { bg: "rgba(79,70,229,0.85)",  border: "#4f46e5" }, 
};

const chartOptions = (title, unit = "") => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    title: { 
      display: true, 
      text: title, 
      font: { size: 11, family: "monospace", weight: "bold" }, 
      color: "#64748B",
      align: "start"
    },
    tooltip: {
      backgroundColor: "#1E293B",
      titleFont: { family: "monospace", size: 11 },
      bodyFont: { family: "monospace", size: 11 },
      callbacks: {
        label: (ctx) => ` Metrique: ${ctx.parsed.y ?? ctx.parsed} ${unit}`
      }
    }
  },
  scales: {
    y: { 
      beginAtZero: true, 
      grid: { color: "#F1F5F9" },
      ticks: { font: { family: "monospace", size: 10 }, color: "#64748B" }
    },
    x: { 
      grid: { display: false },
      ticks: { font: { family: "monospace", size: 10 }, color: "#64748B" }
    }
  }
});

export default function DashboardPage() {
  const [mttr, setMttr] = useState([]);
  const [couts, setCouts] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [r1, r2, r3, r4] = await Promise.all([
        getStatsMTTR(),
        getStatsCouts(),
        getStatsHistorique(),
        getInterventions(),
      ]);
      setMttr(r1.data);
      setCouts(r2.data);
      setHistorique(r3.data);
      setInterventions(r4.data);
    } catch {
      console.error("SYS_ERR: Échec de la compilation des métriques de performance.");
    } finally {
      setLoading(false);
    }
  };

  const total = interventions.length;
  const enAttente = interventions.filter(i => i.statut === "en_attente").length;
  const enCours = interventions.filter(i => i.statut === "en_cours").length;
  const resolus = interventions.filter(i => i.statut === "resolu").length;
  const mttrGlobal = mttr.length
    ? (mttr.reduce((s, r) => s + r.mttr_minutes, 0) / mttr.length).toFixed(1)
    : "0.0";
  const coutTotal = couts.reduce((s, r) => s + r.cout_total_dt, 0).toFixed(2);

  const mttrData = {
    labels: mttr.map(r => r.section),
    datasets: [{
      label: "MTTR (min)",
      data: mttr.map(r => r.mttr_minutes),
      backgroundColor: mttr.map(r => SECTION_COLORS[r.section]?.bg ?? "rgba(148,163,184,0.8)"),
      borderColor: mttr.map(r => SECTION_COLORS[r.section]?.border ?? "#94a3b8"),
      borderWidth: 1,
      borderRadius: 2, // Angles fins industriels
    }]
  };

  const coutsData = {
    labels: couts.map(r => r.section),
    datasets: [{
      data: couts.map(r => r.cout_total_dt),
      backgroundColor: couts.map(r => SECTION_COLORS[r.section]?.bg ?? "rgba(148,163,184,0.8)"),
      borderColor: couts.map(r => SECTION_COLORS[r.section]?.border ?? "#94a3b8"),
      borderWidth: 1,
    }]
  };

  const sections = [...new Set(historique.map(r => r.section))];
  const intervParSectionData = {
    labels: sections,
    datasets: [
      {
        label: "EN ATTENTE",
        data: sections.map(s => {
          const r = historique.find(h => h.section === s && h.statut === "en_attente");
          return r?.total ?? 0;
        }),
        backgroundColor: "rgba(239,68,68,0.85)", // Alerte rouge
        borderRadius: 2,
      },
      {
        label: "EN COURS",
        data: sections.map(s => {
          const r = historique.find(h => h.section === s && h.statut === "en_cours");
          return r?.total ?? 0;
        }),
        backgroundColor: "rgba(249,115,22,0.85)", // Orange technique
        borderRadius: 2,
      },
      {
        label: "RÉSOLUS",
        data: sections.map(s => {
          const r = historique.find(h => h.section === s && h.statut === "resolu");
          return r?.total ?? 0;
        }),
        backgroundColor: "rgba(16,185,129,0.85)", // Vert stable
        borderRadius: 2,
      },
    ]
  };

  const stackedOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: "top", 
        labels: { font: { family: "monospace", size: 10 }, boxWidth: 12, color: "#64748B" } 
      },
      title: { 
        display: true, 
        text: "VOLUMÉTRIE DES PANNES PAR ATELIER / STATUT",
        font: { size: 11, family: "monospace", weight: "bold" }, 
        color: "#64748B",
        align: "start"
      },
    },
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { font: { family: "monospace", size: 10 }, color: "#64748B" } },
      y: { stacked: true, beginAtZero: true, grid: { color: "#F1F5F9" }, ticks: { font: { family: "monospace", size: 10 }, color: "#64748B" } },
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-64 font-mono text-xs text-slate-400 tracking-wider">
          <div className="animate-pulse mb-2">// COMM_RECRUTEMENT_METRIQUES...</div>
          <p>Initialisation des flux analytiques en cours.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* En-tête de section */}
        <div className="mb-8 border-b border-slate-200 pb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono font-bold text-[#0072BC] uppercase tracking-wider">
              // CORE_PERFORMANCE / ANALYSE BI & KPI
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
              Tableau de Bord Directeur & Ratios ISO
            </h1>
          </div>
          <button
            onClick={fetchAll}
            className="text-xs font-mono font-bold text-slate-500 hover:text-[#0072BC] border border-slate-200 bg-white hover:border-slate-300 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
          >
            [ RECOMPILER_LOGS ]
          </button>
        </div>

        {/* KPIs Globaux formatés Registre */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: "// INCIDENTS DECLARES", value: total.toString().padStart(2, "0"), color: "text-slate-900" },
            { label: "// TICKETS EN ATTENTE", value: enAttente.toString().padStart(2, "0"), color: "text-red-600" },
            { label: "// REPARATIONS EN COURS", value: enCours.toString().padStart(2, "0"), color: "text-orange-500" },
            { label: "// CLOS_STABLES", value: resolus.toString().padStart(2, "0"), color: "text-emerald-600" },
            { label: "// RATIO_MTTR_MOYEN", value: `${mttrGlobal}m`, color: "text-[#0072BC]" },
            { label: "// FLUX_VALEUR_RECHANGE", value: `${Math.round(coutTotal)} DT`, color: "text-slate-800" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <p className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">{label}</p>
              <p className={`text-2xl font-bold font-mono tracking-tight mt-1 ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Graphiques Ligne 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs h-80">
            {mttr.length > 0 ? (
              <Bar data={mttrData} options={chartOptions("TEMPS MOYEN DE RÉPARATION PAR SECTEUR (MTTR)", "min")} />
            ) : (
              <EmptyChart message="ERR_NO_DATA: Aucun relevé de fermeture d'incident détecté pour le calcul du MTTR." />
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs h-80 flex flex-col">
            {couts.length > 0 ? (
              <>
                <p className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider mb-4">
                  // REPARTITION FINANCIERE DES PIÈCES (DT)
                </p>
                <div className="h-full flex items-center justify-center pb-2">
                  <div className="w-48 h-48">
                    <Doughnut
                      data={coutsData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { 
                            position: "right", 
                            labels: { font: { family: "monospace", size: 9 }, boxWidth: 10, color: "#64748B" } 
                          },
                          tooltip: {
                            backgroundColor: "#1E293B",
                            bodyFont: { family: "monospace", size: 11 },
                            callbacks: { label: (ctx) => ` Charge: ${ctx.parsed} DT` }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <EmptyChart message="ERR_NO_COSTS: Aucun composant ou consommable n'a généré de facturation sur les rapports FOR-MAI-03." />
            )}
          </div>
        </div>

        {/* Graphique Ligne 2 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs h-80">
          {historique.length > 0 ? (
            <Bar data={intervParSectionData} options={stackedOptions} />
          ) : (
            <EmptyChart message="ERR_NO_HISTORY: Le journal global analytique de production est vierge." />
          )}
        </div>

      </div>
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center px-6">
      <span className="font-mono text-xs font-bold text-slate-300 uppercase bg-slate-50 border border-slate-200 px-3 py-1 rounded mb-2">
        // NO_DATA_STREAM
      </span>
      <p className="font-mono text-[11px] max-w-md leading-relaxed text-slate-400">{message}</p>
    </div>
  );
}