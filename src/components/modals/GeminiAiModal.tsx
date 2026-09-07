import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Sparkles, Send, Loader2, CheckCircle2, AlertTriangle, FileText, TrendingUp, ShieldCheck } from 'lucide-react';
import { callGeminiJson } from '../../utils/geminiClient';

export const GeminiAiModal: React.FC = () => {
  const { closeModal, contracts, documents, mails } = useApp();
  const [prompt, setPrompt] = useState('Fournis une analyse stratégique globale des flux, contrats et documents récents du MIN.');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    const contextData = `
Context summary:
- Total Contracts: ${contracts.length}
- Total Documents: ${documents.length}
- Total Mails: ${mails.length}
`;

    try {
      const systemPrompt = `Tu es l'assistant virtuel expert du Marché d'Intérêt National (MIN) Marseille Méditerranée.
Analyse la demande de l'utilisateur en tenant compte du contexte de l'intranet.
Tu dois impérativement répondre sous forme d'un objet JSON strict contenant les champs suivants :
{
  "titre": "Titre synthétique de l'analyse",
  "resumeExecutif": "Résumé en 2 phrases",
  "pointsCles": ["Point 1", "Point 2", "Point 3"],
  "indicateurs": [
    {"libelle": "Indicateur 1", "valeur": "Valeur 1", "tendance": "Hausse/Stable"},
    {"libelle": "Indicateur 2", "valeur": "Valeur 2", "tendance": "Hausse/Stable"}
  ],
  "recommendations": ["Recommandation 1", "Recommandation 2"],
  "niveauRisque": "Faible / Modéré / Élevé"
}`;

      const data = await callGeminiJson(`${contextData}\n\nRequête utilisateur : ${prompt}`, systemPrompt);
      setAnalysisResult(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la génération de l’analyse.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-3xl bg-white p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={closeModal}
          className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-600/30">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Assistant IA Gemini (JSON Structuré)</h3>
            <p className="text-xs text-slate-500">Génération et parsing automatique de réponses JSON pour pilotage stratégique</p>
          </div>
        </div>

        <form onSubmit={handleRunAnalysis} className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Votre question ou consigne pour l'IA</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Analyse les risques des contrats arrivant à échéance..."
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-500 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span>Analyser</span>
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-rose-700 text-xs mb-4">
            {error}
          </div>
        )}

        {analysisResult && (
          <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-[10px] font-extrabold text-indigo-700">Analyse JSON Structurée</span>
                <h4 className="text-base font-extrabold text-slate-900 mt-1">{analysisResult.titre || 'Rapport d’analyse IA'}</h4>
              </div>
              {analysisResult.niveauRisque && (
                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${analysisResult.niveauRisque.toLowerCase().includes('élevé') ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                  Niveau de risque : {analysisResult.niveauRisque}
                </div>
              )}
            </div>

            {analysisResult.resumeExecutif && (
              <div>
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Résumé Exécutif</h5>
                <p className="text-xs text-slate-600 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-sm">{analysisResult.resumeExecutif}</p>
              </div>
            )}

            {analysisResult.indicateurs && analysisResult.indicateurs.length > 0 && (
              <div>
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Indicateurs Clés</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysisResult.indicateurs.map((ind: any, i: number) => (
                    <div key={i} className="bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-sm flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-slate-500 font-medium">{ind.libelle}</div>
                        <div className="text-sm font-extrabold text-slate-900 mt-0.5">{ind.valeur}</div>
                      </div>
                      <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-bold text-sky-700">{ind.tendance || 'Stable'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysisResult.pointsCles && analysisResult.pointsCles.length > 0 && (
              <div>
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Points Clés</h5>
                <ul className="space-y-2">
                  {analysisResult.pointsCles.map((point: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 bg-white p-3 rounded-xl border border-slate-200/60 text-xs text-slate-700">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
              <div>
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Recommandations Opérationnelles</h5>
                <ul className="space-y-2">
                  {analysisResult.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 text-xs text-indigo-900 font-medium">
                      <ShieldCheck className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysisResult.rawText && (
              <div>
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Données Brutes</h5>
                <pre className="text-[11px] bg-slate-900 text-slate-200 p-4 rounded-xl overflow-x-auto">{JSON.stringify(analysisResult, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
