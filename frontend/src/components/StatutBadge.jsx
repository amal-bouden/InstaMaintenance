const config = {
  en_attente: { label: "En attente", classes: "bg-red-100 text-red-700 border border-red-300" },
  en_cours:   { label: "En cours",   classes: "bg-orange-100 text-orange-700 border border-orange-300" },
  resolu:     { label: "Résolu",     classes: "bg-green-100 text-green-700 border border-green-300" },
};

export default function StatutBadge({ statut }) {
  const { label, classes } = config[statut] ?? config.en_attente;
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${classes}`}>
      {label}
    </span>
  );
}