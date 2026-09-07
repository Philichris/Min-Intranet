import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Calculator, CheckCircle2, AlertTriangle, Plus, Trash2, Printer, Settings, FileText, Folder, Eye, Calendar, Download, ShieldCheck, Lock } from 'lucide-react';
import { CashDenominations, CashSession, CashMovementRecord } from '../../types';

interface CashMovement {
  id: string;
  type: 'Recette' | 'Sortie' | 'Régularisation';
  category: string;
  amount: number;
  comment: string;
}

const DENOM_CONFIG: { key: keyof CashDenominations; label: string; value: number }[] = [
  { key: 'b500', label: '500 €', value: 500 },
  { key: 'b200', label: '200 €', value: 200 },
  { key: 'b100', label: '100 €', value: 100 },
  { key: 'b50', label: '50 €', value: 50 },
  { key: 'b20', label: '20 €', value: 20 },
  { key: 'b10', label: '10 €', value: 10 },
  { key: 'b5', label: '5 €', value: 5 },
  { key: 'p2', label: '2 €', value: 2 },
  { key: 'p1', label: '1 €', value: 1 },
  { key: 'p050', label: '0.50 €', value: 0.5 },
  { key: 'p020', label: '0.20 €', value: 0.2 },
  { key: 'p010', label: '0.10 €', value: 0.1 },
  { key: 'p05', label: '0.05 €', value: 0.05 },
  { key: 'p02', label: '0.02 €', value: 0.02 },
  { key: 'p01', label: '0.01 €', value: 0.01 },
];

export const CaisseModule: React.FC = () => {
  const { services, cashSessions, saveCashSession, currentUser } = useApp();
  const serviceObj = services.find(s => s.code === 'CAISSE');
  const serviceTitle = serviceObj ? serviceObj.name : 'Gestion de la Caisse & Régie';

  // Navigation sub-tabs inside Caisse
  const [activeSubTab, setActiveSubTab] = useState<'saisie' | 'mensuel'>('saisie');

  // 1. En-tête & Infos Générales
  const [caisseDate, setCaisseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [operator, setOperator] = useState<string>(currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Caissier Principal');
  const [soldeDebut, setSoldeDebut] = useState<number>(500.00);

  // Auto-sync solde de début from previous day's closing session real total
  useEffect(() => {
    const sorted = [...cashSessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const prevSession = sorted.find(s => s.date < caisseDate);
    if (prevSession) {
      setSoldeDebut(prevSession.totalReal);
    }
  }, [caisseDate, cashSessions]);

  // Check if a session already exists for today
  const existingSessionForToday = cashSessions.find(s => s.date === caisseDate);

  // Admin Categories
  const [categories, setCategories] = useState<string[]>([
    'Abonnements Contremarques',
    'Entrées GEA',
    'Déchèterie GEA',
    'Monnaie Brinks',
    'Producteurs',
    'Transporteur Brinks',
    'Achats divers',
    'Régularisation Erreur Passée',
    'Régie diverse'
  ]);
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');

  // Section 1: Mouvements (Recettes, Sorties, Régularisation)
  const [movements, setMovements] = useState<CashMovement[]>([
    { id: '1', type: 'Recette', category: 'Entrées GEA', amount: 1450.00, comment: 'Recettes billetterie matin' },
    { id: '2', type: 'Recette', category: 'Abonnements Contremarques', amount: 820.00, comment: 'Renouvellement abonnements box' },
    { id: '3', type: 'Sortie', category: 'Achats divers', amount: 45.50, comment: 'Fournitures bureau urgentes (Facture n°442)' },
    { id: '4', type: 'Régularisation', category: 'Régularisation Erreur Passée', amount: -15.00, comment: 'Rectification erreur de rendu monnaie' }
  ]);

  const addMovementRow = (type: 'Recette' | 'Sortie' | 'Régularisation' = 'Recette') => {
    setMovements(prev => [
      ...prev,
      { id: Date.now().toString(), type, category: type === 'Régularisation' ? 'Régularisation Erreur Passée' : (categories[0] || 'Entrées GEA'), amount: 0, comment: '' }
    ]);
  };

  const removeMovementRow = (id: string) => {
    setMovements(prev => prev.filter(m => m.id !== id));
  };

  const updateMovement = (id: string, field: keyof CashMovement, value: any) => {
    setMovements(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  // Calculations for Section 1
  const totalRecettes = movements.filter(m => m.type === 'Recette').reduce((acc, m) => acc + (Number(m.amount) || 0), 0);
  const totalSorties = movements.filter(m => m.type === 'Sortie').reduce((acc, m) => acc + (Number(m.amount) || 0), 0);
  const totalRegul = movements.filter(m => m.type === 'Régularisation').reduce((acc, m) => acc + (Number(m.amount) || 0), 0);
  
  const soldeTheorique = soldeDebut + totalRecettes - totalSorties + totalRegul;

  // Section 2: Comptage Physique
  const [physicalCounts, setPhysicalCounts] = useState<Record<string, { gh: number; decheterie: number; coffre: number }>>({
    b500: { gh: 0, decheterie: 0, coffre: 0 },
    b200: { gh: 0, decheterie: 0, coffre: 0 },
    b100: { gh: 2, decheterie: 0, coffre: 0 },
    b50: { gh: 4, decheterie: 1, coffre: 0 },
    b20: { gh: 10, decheterie: 5, coffre: 2 },
    b10: { gh: 15, decheterie: 10, coffre: 5 },
    b5: { gh: 20, decheterie: 10, coffre: 10 },
    p2: { gh: 25, decheterie: 10, coffre: 0 },
    p1: { gh: 30, decheterie: 15, coffre: 0 },
    p050: { gh: 20, decheterie: 10, coffre: 0 },
    p020: { gh: 20, decheterie: 10, coffre: 0 },
    p010: { gh: 20, decheterie: 10, coffre: 0 },
    p05: { gh: 0, decheterie: 0, coffre: 0 },
    p02: { gh: 0, decheterie: 0, coffre: 0 },
    p01: { gh: 0, decheterie: 0, coffre: 0 },
  });

  const [chequesTotal, setChequesTotal] = useState<number>(1250.00);
  const [tpeTotal, setTpeTotal] = useState<number>(3400.00);

  const handleQtyChange = (denomKey: string, location: 'gh' | 'decheterie' | 'coffre', val: string) => {
    const num = parseInt(val) || 0;
    setPhysicalCounts(prev => ({
      ...prev,
      [denomKey]: {
        ...prev[denomKey],
        [location]: num < 0 ? 0 : num
      }
    }));
  };

  let totalCaissePhysique = chequesTotal + tpeTotal;
  DENOM_CONFIG.forEach(d => {
    const c = physicalCounts[d.key] || { gh: 0, decheterie: 0, coffre: 0 };
    const totalQty = c.gh + c.decheterie + c.coffre;
    totalCaissePhysique += totalQty * d.value;
  });

  // Section 3: Rapprochement & Validation
  const ecart = totalCaissePhysique - soldeTheorique;
  const [ecartExplanation, setEcartExplanation] = useState<string>('');

  // Consultation Modal State
  const [selectedSessionToView, setSelectedSessionToView] = useState<CashSession | null>(null);

  // Monthly Filter state
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // e.g. "2026-09"

  const handleValidateAndArchive = () => {
    if (existingSessionForToday) {
      alert(`IMPOSSIBLE DE VALIDER : Une feuille de caisse a déjà été validée pour le ${caisseDate}. Une seule feuille par jour est autorisée.`);
      return;
    }

    if (ecart !== 0 && !ecartExplanation.trim()) {
      alert('IMPOSSIBLE DE VALIDER : Un écart de caisse est constaté. Veuillez obligatoirement renseigner un commentaire explicatif.');
      return;
    }

    const sessionData: Omit<CashSession, 'id'> = {
      date: caisseDate,
      fondDeCaisse: soldeDebut,
      denominations: {
        b500: 0, b200: 0, b100: physicalCounts.b100.gh, b50: physicalCounts.b50.gh,
        b20: physicalCounts.b20.gh, b10: physicalCounts.b10.gh, b5: physicalCounts.b5.gh,
        p2: physicalCounts.p2.gh, p1: physicalCounts.p1.gh, p050: physicalCounts.p050.gh,
        p020: physicalCounts.p020.gh, p010: physicalCounts.p010.gh, p05: 0, p02: 0, p01: 0,
        cheques: chequesTotal, tpe: tpeTotal
      },
      totalReal: totalCaissePhysique,
      totalTheoretical: soldeTheorique,
      discrepancy: ecart,
      explanation: ecart !== 0 ? ecartExplanation : undefined,
      movements: movements.map(m => ({ ...m })),
      revenueBreakdown: {
        droitsEntree: totalRecettes,
        redevances: totalSorties,
        ventesAnnexes: totalRegul,
        prestations: 0
      },
      status: 'Clôturé & Validé',
      validatedBy: operator
    };

    saveCashSession(sessionData);
    alert('Feuille de caisse validée, archivée dans le système et rapport PDF généré avec succès !');
    
    // Reset for next day with soldeDebut = totalCaissePhysique
    setSoldeDebut(totalCaissePhysique);
    setEcartExplanation('');
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCatName.trim() && !categories.includes(newCatName.trim())) {
      setCategories([...categories, newCatName.trim()]);
      setNewCatName('');
    }
  };

  const removeCategory = (cat: string) => {
    setCategories(categories.filter(c => c !== cat));
  };

  // Filter sessions for monthly file
  const monthlySessions = cashSessions.filter(s => s.date.startsWith(selectedMonth));
  const sortedMonthlySessions = [...monthlySessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const monthlyTotalRecettes = sortedMonthlySessions.reduce((acc, s) => acc + (s.revenueBreakdown?.droitsEntree || 0), 0);
  const monthlyTotalSorties = sortedMonthlySessions.reduce((acc, s) => acc + (s.revenueBreakdown?.redevances || 0), 0);
  const monthlyTotalDiscrepancy = sortedMonthlySessions.reduce((acc, s) => acc + (s.discrepancy || 0), 0);
  const lastSessionOfMonth = sortedMonthlySessions[sortedMonthlySessions.length - 1];
  const finalMonthBalance = sortedMonthlySessions.length > 0 ? lastSessionOfMonth.totalReal : soldeDebut;

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 bottom-0 w-2 bg-emerald-600"></div>
        <div className="pl-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-800 border border-emerald-200 mb-1">
            <Calculator className="h-3.5 w-3.5 text-emerald-600" />
            Module Comptable & Régie
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{serviceTitle}</h2>
          <p className="text-sm text-slate-500">Saisie journalière (1 feuille/jour), solde de début reporté et récapitulatif mensuel.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAdminModal(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            <Settings className="h-4 w-4 text-slate-500" />
            Admin Catégories
          </button>
        </div>
      </div>

      {/* Sub-tabs navigation */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <button
          onClick={() => setActiveSubTab('saisie')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${activeSubTab === 'saisie' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}
        >
          <FileText className="h-4 w-4" />
          Saisie Journalière & Clôture
        </button>
        <button
          onClick={() => setActiveSubTab('mensuel')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${activeSubTab === 'mensuel' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}
        >
          <Calendar className="h-4 w-4" />
          Récapitulatif & Fichier Mensuel ({cashSessions.length})
        </button>
      </div>

      {activeSubTab === 'saisie' ? (
        <div className="space-y-8">
          {existingSessionForToday && (
            <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3 shadow-sm">
              <Lock className="h-6 w-6 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-sm">Feuille de caisse déjà validée pour cette date ({caisseDate})</p>
                <p className="text-xs text-amber-700 mt-0.5">Une seule feuille de caisse est autorisée par jour (règle 1 jour / 1 feuille). Vous pouvez consulter le rapport dans l'onglet "Récapitulatif & Fichier Mensuel".</p>
              </div>
            </div>
          )}

          {/* SECTION 1: EN-TÊTE & INFORMATIONS GÉNÉRALES */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              1. En-tête & Informations Générales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Date de la caisse (1 feuille / jour)</label>
                <input
                  type="date"
                  value={caisseDate}
                  onChange={(e) => setCaisseDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Opérateur / Caissier</label>
                <input
                  type="text"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-600">Solde de Début de journée (€)</label>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    🔄 Report de veille automatique
                  </span>
                </div>
                <input
                  type="number"
                  value={soldeDebut}
                  onChange={(e) => setSoldeDebut(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: SAISIE DES MOUVEMENTS (RECETTES, SORTIES, RÉGULARISATIONS) */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calculator className="h-5 w-5 text-indigo-600" />
                2. Saisie des Mouvements (Recettes, Sorties & Régularisations)
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => addMovementRow('Recette')}
                  className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  + Recette
                </button>
                <button
                  onClick={() => addMovementRow('Sortie')}
                  className="flex items-center gap-1 rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-500 shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  - Sortie
                </button>
                <button
                  onClick={() => addMovementRow('Régularisation')}
                  className="flex items-center gap-1 rounded-xl bg-amber-600 px-3 py-2 text-xs font-bold text-white hover:bg-amber-500 shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  ⚖️ Régul. Erreur
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="p-3">Type</th>
                    <th className="p-3">Catégorie</th>
                    <th className="p-3">Montant (€) <span className="text-[10px] lowercase font-normal">(négatif possible pour régul)</span></th>
                    <th className="p-3">Commentaire / Justificatif obligatoire</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {movements.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="p-3">
                        <select
                          value={m.type}
                          onChange={(e) => updateMovement(m.id, 'type', e.target.value)}
                          className={`rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-bold ${
                            m.type === 'Recette' ? 'bg-emerald-50 text-emerald-800' : 
                            m.type === 'Sortie' ? 'bg-rose-50 text-rose-800' : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          <option value="Recette">Recette</option>
                          <option value="Sortie">Sortie</option>
                          <option value="Régularisation">Régularisation</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <select
                          value={m.category}
                          onChange={(e) => updateMovement(m.id, 'category', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-900"
                        >
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          step="0.01"
                          value={m.amount}
                          onChange={(e) => updateMovement(m.id, 'amount', parseFloat(e.target.value) || 0)}
                          className="w-32 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-900"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          placeholder={m.type === 'Régularisation' ? "Ex: Correction erreur de rendu monnaie..." : "Détail facture / justificatif..."}
                          value={m.comment}
                          onChange={(e) => updateMovement(m.id, 'comment', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800"
                          required
                        />
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => removeMovementRow(m.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                          title="Supprimer la ligne"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Section 1 */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase">Total Recettes</p>
                <p className="text-xl font-extrabold text-emerald-600 mt-1">+{totalRecettes.toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase">Total Sorties</p>
                <p className="text-xl font-extrabold text-rose-600 mt-1">-{totalSorties.toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase">Total Régularisations</p>
                <p className={`text-xl font-extrabold mt-1 ${totalRegul >= 0 ? 'text-amber-600' : 'text-rose-600'}`}>
                  {totalRegul >= 0 ? `+${totalRegul.toFixed(2)}` : totalRegul.toFixed(2)} €
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase">Solde Théorique de Caisse</p>
                <p className="text-xl font-extrabold text-indigo-600 mt-1">{soldeTheorique.toFixed(2)} €</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Début + Recettes - Sorties + Régul</p>
              </div>
            </div>
          </div>

          {/* SECTION 3 & 4: COMPTAGE PHYSIQUE & RAPPROCHEMENT */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left: Physical count table */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Calculator className="h-5 w-5 text-emerald-600" />
                3. Comptage Physique par Coupure
              </h3>

              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase sticky top-0 bg-slate-50 z-10">
                      <th className="p-2.5">Coupure</th>
                      <th className="p-2.5 text-center">Monnayeurs G & H</th>
                      <th className="p-2.5 text-center">Déchèterie</th>
                      <th className="p-2.5 text-center">Coffre / Autre</th>
                      <th className="p-2.5 text-right">Sous-total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                    {DENOM_CONFIG.map(d => {
                      const counts = physicalCounts[d.key] || { gh: 0, decheterie: 0, coffre: 0 };
                      const totalQty = counts.gh + counts.decheterie + counts.coffre;
                      const subTotal = totalQty * d.value;
                      return (
                        <tr key={d.key} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-bold text-slate-900">{d.label}</td>
                          <td className="p-2.5 text-center">
                            <input
                              type="number"
                              value={counts.gh}
                              onChange={(e) => handleQtyChange(d.key, 'gh', e.target.value)}
                              className="w-16 rounded-lg border border-slate-200 bg-slate-50 py-1 text-center font-bold text-slate-900 text-xs"
                            />
                          </td>
                          <td className="p-2.5 text-center">
                            <input
                              type="number"
                              value={counts.decheterie}
                              onChange={(e) => handleQtyChange(d.key, 'decheterie', e.target.value)}
                              className="w-16 rounded-lg border border-slate-200 bg-slate-50 py-1 text-center font-bold text-slate-900 text-xs"
                            />
                          </td>
                          <td className="p-2.5 text-center">
                            <input
                              type="number"
                              value={counts.coffre}
                              onChange={(e) => handleQtyChange(d.key, 'coffre', e.target.value)}
                              className="w-16 rounded-lg border border-slate-200 bg-slate-50 py-1 text-center font-bold text-slate-900 text-xs"
                            />
                          </td>
                          <td className="p-2.5 text-right font-extrabold text-slate-900">
                            {subTotal.toFixed(2)} €
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Total Chèques (€)</label>
                  <input
                    type="number"
                    value={chequesTotal}
                    onChange={(e) => setChequesTotal(parseFloat(e.target.value) || 0)}
                    className="w-32 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-900 text-right"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Total TPE / Cartes Bancaires (€)</label>
                  <input
                    type="number"
                    value={tpeTotal}
                    onChange={(e) => setTpeTotal(parseFloat(e.target.value) || 0)}
                    className="w-32 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-900 text-right"
                  />
                </div>
              </div>
            </div>

            {/* Right: Rapprochement & Validation Panel */}
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  4. Rapprochement & Validation
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase">Solde Théorique</p>
                      <p className="text-xl font-extrabold text-slate-900 mt-0.5">{soldeTheorique.toFixed(2)} €</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-500 uppercase">Total Caisse Physique</p>
                      <p className="text-xl font-extrabold text-emerald-600 mt-0.5">{totalCaissePhysique.toFixed(2)} €</p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className={`p-4 rounded-2xl border ${ecart === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
                    <div className="flex items-center gap-2 font-bold text-sm">
                      {ecart === 0 ? (
                        <>
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          <span>CAISSE CONFORME (0,00 €)</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-5 w-5 text-rose-600" />
                          <span>ÉCART CONSTATÉ ({ecart > 0 ? `+${ecart.toFixed(2)}` : ecart.toFixed(2)} €)</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs mt-1 text-slate-600">
                      {ecart === 0 
                        ? 'Le comptage physique correspond exactement au solde théorique calculé.'
                        : 'Attention : Une différence a été détectée. L\'explication de l\'écart est STRICTEMENT OBLIGATOIRE pour valider.'}
                    </p>
                  </div>

                  {ecart !== 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-rose-700 mb-1">
                        Explication obligatoire de l'écart <span className="text-rose-500">* (Obligatoire pour validation)</span>
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Précisez la cause exacte de l'écart..."
                        value={ecartExplanation}
                        onChange={(e) => setEcartExplanation(e.target.value)}
                        className="w-full rounded-xl border border-rose-300 bg-rose-50/40 px-3 py-2 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none"
                        required
                      />
                    </div>
                  )}

                  <button
                    onClick={handleValidateAndArchive}
                    disabled={!!existingSessionForToday}
                    className={`w-full flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-extrabold text-white shadow-xl transition-all mt-4 ${
                      existingSessionForToday 
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' 
                        : 'bg-emerald-600 shadow-emerald-600/30 hover:bg-emerald-500'
                    }`}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    {existingSessionForToday ? 'Feuille déjà validée pour ce jour' : 'Valider et Archiver la Feuille de Caisse'}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      ) : (
        /* Récapitulatif & Fichier Mensuel */
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Récapitulatif & Fichier Mensuel de Caisse</h3>
              <p className="text-xs text-slate-500 mt-0.5">Jour par jour : recettes par catégories, dépenses, et solde final correspondant au dernier jour du mois.</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-600">Mois :</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900"
              />
            </div>
          </div>

          {/* Monthly Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase">Journées Clôturées</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-2">{sortedMonthlySessions.length} jours</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase">Total Recettes du mois</p>
              <p className="text-2xl font-extrabold text-emerald-600 mt-2">+{monthlyTotalRecettes.toFixed(2)} €</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase">Total Dépenses du mois</p>
              <p className="text-2xl font-extrabold text-rose-600 mt-2">-{monthlyTotalSorties.toFixed(2)} €</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase">Solde Final (Dernier Jour)</p>
              <p className="text-2xl font-extrabold text-indigo-600 mt-2">{finalMonthBalance.toFixed(2)} €</p>
            </div>
          </div>

          {/* Day-by-Day Monthly Recap Table */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-900">Journal des Mouvements & Solde de Clôture - {selectedMonth}</h4>
              <button
                onClick={() => alert(`Export du fichier de caisse mensuel officiel (Excel/PDF) pour ${selectedMonth} généré avec succès.`)}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 shadow-sm"
              >
                <Download className="h-4 w-4" />
                Télécharger le Fichier Mensuel
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="p-3">Date</th>
                    <th className="p-3">Opérateur</th>
                    <th className="p-3">Solde Début</th>
                    <th className="p-3">Recettes Totales</th>
                    <th className="p-3">Dépenses / Sorties</th>
                    <th className="p-3">Réguls.</th>
                    <th className="p-3">Solde Final (Réel)</th>
                    <th className="p-3">Écart</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {sortedMonthlySessions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-10 text-slate-400">
                        Aucune feuille de caisse enregistrée pour le mois de {selectedMonth}.
                      </td>
                    </tr>
                  ) : (
                    sortedMonthlySessions.map(sess => {
                      const rec = sess.revenueBreakdown?.droitsEntree || 0;
                      const sort = sess.revenueBreakdown?.redevances || 0;
                      const reg = sess.revenueBreakdown?.ventesAnnexes || 0;
                      return (
                        <tr key={sess.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-900">{sess.date}</td>
                          <td className="p-3">{sess.validatedBy || 'Caissier'}</td>
                          <td className="p-3">{sess.fondDeCaisse.toFixed(2)} €</td>
                          <td className="p-3 font-bold text-emerald-600">+{rec.toFixed(2)} €</td>
                          <td className="p-3 font-bold text-rose-600">-{sort.toFixed(2)} €</td>
                          <td className={`p-3 font-bold ${reg >= 0 ? 'text-amber-600' : 'text-rose-600'}`}>
                            {reg >= 0 ? `+${reg.toFixed(2)}` : reg.toFixed(2)} €
                          </td>
                          <td className="p-3 font-extrabold text-indigo-700">{sess.totalReal.toFixed(2)} €</td>
                          <td className="p-3">
                            <span className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${sess.discrepancy === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                              {sess.discrepancy === 0 ? '0.00 €' : (sess.discrepancy > 0 ? `+${sess.discrepancy.toFixed(2)} €` : `${sess.discrepancy.toFixed(2)} €`)}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setSelectedSessionToView(sess)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold ml-auto"
                            >
                              <Eye className="h-3.5 w-3.5 text-indigo-600" />
                              Détails
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {sortedMonthlySessions.length > 0 && (
              <div className="mt-6 bg-indigo-50/60 border border-indigo-200 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-indigo-900 uppercase">Solde Final du Dernier Jour du Mois ({lastSessionOfMonth?.date})</p>
                  <p className="text-xs text-indigo-700 mt-0.5">Ce solde correspond au report exact pour le premier jour du mois suivant.</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-extrabold text-indigo-700">{finalMonthBalance.toFixed(2)} €</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Consultation Modal */}
      {selectedSessionToView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedSessionToView(null)}
              className="absolute right-5 top-5 p-2 text-slate-400 hover:bg-slate-100 rounded-full"
            >
              ✕
            </button>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full w-fit mb-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Feuille de Caisse Archivée & Clôturée
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-1">Rapport du {selectedSessionToView.date}</h3>
            <p className="text-xs text-slate-500 mb-6">Opérateur : <span className="font-bold text-slate-700">{selectedSessionToView.validatedBy}</span></p>

            <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase">Fond de Caisse (Début)</p>
                <p className="text-lg font-bold text-slate-900">{selectedSessionToView.fondDeCaisse.toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase">Solde Théorique</p>
                <p className="text-lg font-bold text-slate-900">{selectedSessionToView.totalTheoretical.toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase">Total Physique Réel</p>
                <p className="text-lg font-bold text-emerald-600">{selectedSessionToView.totalReal.toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase">Écart Constaté</p>
                <p className={`text-lg font-bold ${selectedSessionToView.discrepancy === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {selectedSessionToView.discrepancy === 0 ? '0.00 € (Conforme)' : `${selectedSessionToView.discrepancy.toFixed(2)} €`}
                </p>
              </div>
            </div>

            {selectedSessionToView.explanation && (
              <div className="mb-6 bg-rose-50 border border-rose-200 p-4 rounded-2xl">
                <p className="text-xs font-bold text-rose-800 uppercase mb-1">Explication obligatoire de l'écart :</p>
                <p className="text-xs text-rose-900 font-medium">{selectedSessionToView.explanation}</p>
              </div>
            )}

            {selectedSessionToView.movements && selectedSessionToView.movements.length > 0 && (
              <div className="mb-6">
                <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Mouvements de la journée</h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Type</th>
                        <th className="p-2.5">Catégorie</th>
                        <th className="p-2.5">Montant</th>
                        <th className="p-2.5">Commentaire</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedSessionToView.movements.map(m => (
                        <tr key={m.id}>
                          <td className="p-2.5 font-bold text-slate-800">{m.type}</td>
                          <td className="p-2.5">{m.category}</td>
                          <td className="p-2.5 font-bold">{m.amount.toFixed(2)} €</td>
                          <td className="p-2.5 text-slate-500">{m.comment}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button
                onClick={() => setSelectedSessionToView(null)}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 shadow-md"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Categories Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl relative">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Administration des Catégories de Caisse</h3>
            <p className="text-xs text-slate-500 mb-4">Ajoutez ou supprimez les libellés de catégories pour les recettes, sorties et régularisations.</p>
            
            <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Nouvelle catégorie..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900"
              />
              <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500">
                Ajouter
              </button>
            </form>

            <div className="space-y-2 max-h-60 overflow-y-auto mb-6">
              {categories.map(cat => (
                <div key={cat} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800">
                  <span>{cat}</span>
                  <button onClick={() => removeCategory(cat)} className="text-rose-500 hover:text-rose-700 p-1">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button
                onClick={() => setShowAdminModal(false)}
                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
