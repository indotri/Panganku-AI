import React, { useState, useEffect } from 'react';
import { 
  ChefHat, Search, Sparkles, RefreshCw, Plus, Trash2, CheckCircle2, 
  AlertTriangle, TrendingUp, TrendingDown, ArrowRight, ShieldCheck, 
  MapPin, Store, CloudSun, ShoppingBag, Info
} from 'lucide-react';
import { MetadataResponse, RecipeAssistantResponse, CalculatedIngredient } from '../types';
import { IngredientModal } from './IngredientModal';

interface TabRecipeAssistantProps {
  metadata: MetadataResponse | null;
  recipeData: RecipeAssistantResponse | null;
  setRecipeData: React.Dispatch<React.SetStateAction<RecipeAssistantResponse | null>>;
  onAnalyzeRecipe: (payload: {
    query: string;
    portions: number;
    province: string;
    market_type: string;
    weather_scenario: string;
    demand_scenario: string;
    intervention_scenario: string;
    custom_ingredients?: any[];
  }) => Promise<void>;
  loading: boolean;
  recalculating: boolean;
  onRecalculate: (ingredients: CalculatedIngredient[]) => Promise<void>;
  selectedProvince?: string;
}

export const TabRecipeAssistant: React.FC<TabRecipeAssistantProps> = ({
  metadata,
  recipeData,
  setRecipeData,
  onAnalyzeRecipe,
  loading,
  recalculating,
  onRecalculate,
  selectedProvince
}) => {
  const [query, setQuery] = useState('Aku mau bikin telor asin 20 butir');
  const [portions, setPortions] = useState(20);
  const [province, setProvince] = useState(selectedProvince || 'Jawa Timur');
  const [marketType, setMarketType] = useState('Pasar Tradisional Rakyat');
  const [weatherScenario, setWeatherScenario] = useState('Kondisi Normal Stabil');
  const [demandScenario, setDemandScenario] = useState('Permintaan Normal Stabil');
  const [interventionScenario, setInterventionScenario] = useState('Tidak Ada Intervensi Pasar');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (selectedProvince && selectedProvince !== province) {
      setProvince(selectedProvince);
    }
  }, [selectedProvince]);

  const sampleChips = [
    { label: 'Telur Asin 20 Butir', text: 'Aku mau bikin telor asin 20 butir', p: 20 },
    { label: 'Rendang Sapi 1 kg', text: 'Mau masak Rendang Sapi 1 kg khas Padang', p: 6 },
    { label: 'Opor Ayam Lebaran', text: 'Opor Ayam Lebaran kuah kental gurih', p: 5 },
    { label: 'Seblak Kuah Pedas', text: 'Bikin Seblak Kuah Pedas Jeletot', p: 3 },
    { label: 'Rawon Jawa Timur', text: 'Rawon Daging Sapi khas Jawa Timur', p: 5 },
    { label: 'Ayam Geprek Krispi', text: 'Ayam Geprek Sambal Korek pedas mantap', p: 4 },
  ];

  const handleChipClick = (chip: { label: string; text: string; p: number }) => {
    setQuery(chip.text);
    setPortions(chip.p);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onAnalyzeRecipe({
      query: query.trim(),
      portions,
      province,
      market_type: marketType,
      weather_scenario: weatherScenario,
      demand_scenario: demandScenario,
      intervention_scenario: interventionScenario,
      custom_ingredients: []
    });
  };

  const handleQuantityChange = (index: number, newQty: number) => {
    if (!recipeData) return;
    const updated = [...recipeData.calculated_ingredients];
    updated[index] = {
      ...updated[index],
      quantity: Math.max(0.01, newQty)
    };
    setRecipeData({
      ...recipeData,
      calculated_ingredients: updated
    });
  };

  const handleDeleteIngredient = (index: number) => {
    if (!recipeData) return;
    const updated = recipeData.calculated_ingredients.filter((_, i) => i !== index);
    setRecipeData({
      ...recipeData,
      calculated_ingredients: updated
    });
  };

  const handleAddIngredient = (newItem: any) => {
    if (!recipeData) return;
    const existing = [...recipeData.calculated_ingredients];
    existing.push({
      name: newItem.name,
      quantity: newItem.quantity,
      unit: newItem.unit,
      type: newItem.type,
      dataset_commodity: newItem.dataset_commodity,
      price_multiplier: newItem.price_multiplier,
      current_unit_price_idr: newItem.estimated_unit_price_idr || 0,
      predicted_unit_price_idr: newItem.estimated_unit_price_idr || 0,
      current_subtotal_idr: (newItem.estimated_unit_price_idr || 0) * newItem.quantity,
      predicted_subtotal_idr: (newItem.estimated_unit_price_idr || 0) * newItem.quantity,
      difference_idr: 0,
      risk_tier: 'Tier 1 - Stable Baseline',
      price_source: newItem.type === 'EXACT_DATASET_MATCH' ? 'Dataset Sembako' : 'Kustom'
    });
    setRecipeData({
      ...recipeData,
      calculated_ingredients: existing
    });
    // Trigger recalculation immediately
    onRecalculate(existing);
  };

  const triggerRecalculate = () => {
    if (!recipeData) return;
    onRecalculate(recipeData.calculated_ingredients);
  };

  const toggleStep = (idx: number) => {
    setCheckedSteps(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const getRiskBadge = (tier: string) => {
    if (tier?.includes('Tier 1')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Tier 1: Stabil
        </span>
      );
    } else if (tier?.includes('Tier 2')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
          <Info className="w-3.5 h-3.5 text-sky-600" />
          Tier 2: Kenaikan Wajar
        </span>
      );
    } else if (tier?.includes('Tier 3')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          Tier 3: Tekanan Pasokan
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
        Tier 4: Lonjakan Tajam
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Search & Configuration Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-100/80">
        <div className="max-w-4xl mx-auto space-y-5">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Dynamic AI Recipe Parser + Scikit-Learn Real-Time Price Predictor
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              Mau Masak atau Bikin Apa Hari Ini?
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl mx-auto">
              Ketik masakan bebas apa saja (contoh: <em>&quot;Bikin telur asin 20 butir&quot;</em> atau <em>&quot;Rendang Sapi 1 kg&quot;</em>). AI akan mengurai bahan secara proporsional dan memprediksi modalnya minggu depan berdasarkan model Machine Learning di provinsimu!
            </p>
          </div>

          {/* Search Input Bar */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="flex items-center rounded-2xl bg-slate-50 border-2 border-emerald-200 hover:border-emerald-400 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all shadow-sm overflow-hidden p-1.5">
              <div className="pl-3 text-slate-400">
                <Search className="w-5 h-5 text-emerald-600" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ketik olahan pangan atau masakan bebas (misal: Mau bikin telur asin 20 butir, Rendang 1 kg, Seblak pedas)..."
                className="w-full px-3 py-2 text-sm sm:text-base bg-transparent text-slate-800 placeholder-slate-400 font-medium focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-emerald-200 transition-all flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menganalisis AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Urai Resep & Hitung Modal</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Example Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-slate-400">Contoh Cepat:</span>
            {sampleChips.map((chip, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleChipClick(chip)}
                className="text-xs font-mono font-medium px-3.5 py-1.5 rounded-full bg-[#faf8f6] hover:bg-[#cfdaf5]/50 hover:text-[#2b59d1] hover:border-[#a0b5eb] border border-[#cecac8] text-[#4e4d4d] transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles className="w-3 h-3 text-[#2b59d1]" />
                <span>{chip.label}</span>
              </button>
            ))}
          </div>

          {/* Regional & Market Scenario Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs">
            <div>
              <label className="block font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                Provinsi Observasi:
              </label>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {metadata?.provinces.map((prov) => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-teal-600" />
                Tipe Pasar:
              </label>
              <select
                value={marketType}
                onChange={(e) => setMarketType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {metadata?.market_types.map((mt) => (
                  <option key={mt} value={mt}>{mt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                <CloudSun className="w-3.5 h-3.5 text-sky-600" />
                Skenario Cuaca Minggu Depan:
              </label>
              <select
                value={weatherScenario}
                onChange={(e) => setWeatherScenario(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {metadata?.weather_scenarios.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                Intensitas Permintaan:
              </label>
              <select
                value={demandScenario}
                onChange={(e) => setDemandScenario(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {metadata?.demand_scenarios.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Results View */}
      {recipeData && (
        <div className="space-y-6">
          {/* Header of Recipe */}
          <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-emerald-100 text-xs font-semibold border border-white/20">
                  {recipeData.portion_label || `${recipeData.portions} porsi`}
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/30 backdrop-blur-md text-emerald-200 text-xs font-semibold border border-emerald-400/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-300" />
                  Mode Mesin: {recipeData.engine_mode === 'GEMINI_AI' ? 'Google Gemini 2.5 Flash LLM' : 'Smart Culinary Knowledge Base'}
                </span>
                <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-100 text-xs font-medium">
                  Lokasi: {recipeData.province} ({recipeData.market_type})
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {recipeData.recipe_title}
              </h3>
              <p className="text-emerald-100 text-sm max-w-3xl leading-relaxed">
                {recipeData.recipe_description}
              </p>
            </div>
          </div>

          {/* 4 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Modal Hari Ini
              </span>
              <p className="text-2xl font-extrabold text-slate-800">
                Rp {recipeData.total_cost_current_idr.toLocaleString('id-ID')}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                Data aktual eceran di {recipeData.province}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Prediksi Minggu Depan
                </span>
                <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                  recipeData.cost_difference_idr > 0 
                    ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                    : recipeData.cost_difference_idr < 0 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-50 text-slate-700 border border-slate-200'
                }`}>
                  {recipeData.cost_difference_idr > 0 ? (
                    <TrendingUp className="w-3 h-3 text-rose-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-emerald-500" />
                  )}
                  {recipeData.cost_change_pct >= 0 ? `+${recipeData.cost_change_pct}%` : `${recipeData.cost_change_pct}%`}
                </span>
              </div>
              <p className="text-2xl font-extrabold text-slate-800">
                Rp {recipeData.total_cost_predicted_idr.toLocaleString('id-ID')}
              </p>
              <p className="text-[11px] font-medium text-slate-500">
                Selisih: {recipeData.cost_difference_idr >= 0 ? `+Rp ${recipeData.cost_difference_idr.toLocaleString('id-ID')}` : `-Rp ${Math.abs(recipeData.cost_difference_idr).toLocaleString('id-ID')}`}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Status Risiko Inflasi
              </span>
              <div className="pt-1">
                {getRiskBadge(recipeData.overall_risk_tier)}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Prediksi Model RandomForestClassifier
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Efisiensi Per Porsi / Butir
              </span>
              <p className="text-2xl font-extrabold text-emerald-700">
                Rp {recipeData.portions > 0 ? Math.round(recipeData.total_cost_current_idr / recipeData.portions).toLocaleString('id-ID') : 0}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                Modal per {recipeData.portion_label || 'porsi'}
              </p>
            </div>
          </div>

          {/* AI Rationale Callout */}
          <div className="bg-emerald-50/80 rounded-2xl p-5 border border-emerald-200 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex-shrink-0 flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                Analisis Kognitif AI PanganKu (Chain-of-Thought Rationale)
              </h4>
              <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed">
                {recipeData.ai_rationale}
              </p>
            </div>
          </div>

          {/* Interactive Ingredient Editor */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
              <div>
                <h4 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-600" />
                  Daftar Bahan & Estimasi Modal (Interactive Ingredient Editor)
                </h4>
                <p className="text-xs text-slate-500">
                  Kamu bisa mengubah takaran, menghapus bahan yang sudah ada di dapur, atau menambahkan bahan baru.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  Tambah Bahan
                </button>

                <button
                  type="button"
                  onClick={triggerRecalculate}
                  disabled={recalculating}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-200 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`} />
                  <span>Hitung Ulang AI</span>
                </button>
              </div>
            </div>

            {/* Ingredients Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px] bg-slate-50/70">
                    <th className="py-3 px-3 rounded-l-xl">Nama Bahan</th>
                    <th className="py-3 px-3">Tipe Data</th>
                    <th className="py-3 px-3">Takaran</th>
                    <th className="py-3 px-3 text-right">Harga Satuan (Kini)</th>
                    <th className="py-3 px-3 text-right">Prediksi Satuan (Mg Dpn)</th>
                    <th className="py-3 px-3 text-right">Subtotal Hari Ini</th>
                    <th className="py-3 px-3 text-right">Subtotal Mg Dpn</th>
                    <th className="py-3 px-3 text-center">Risiko</th>
                    <th className="py-3 px-3 rounded-r-xl text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recipeData.calculated_ingredients.map((ing, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {ing.name}
                      </td>
                      <td className="py-3 px-3">
                        {ing.type === 'EXACT_DATASET_MATCH' ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            12 Sembako ML
                          </span>
                        ) : ing.type === 'PROXY_DATASET_MATCH' ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                            Proksi ({ing.price_source})
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Pelengkap
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step="0.05"
                            min="0.01"
                            value={ing.quantity}
                            onChange={(e) => handleQuantityChange(idx, parseFloat(e.target.value) || 0)}
                            className="w-16 px-2 py-1 text-xs font-semibold rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-white"
                          />
                          <span className="text-slate-500 font-medium">{ing.unit}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700 font-medium">
                        Rp {ing.current_unit_price_idr.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700 font-medium">
                        Rp {ing.predicted_unit_price_idr.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-800">
                        Rp {ing.current_subtotal_idr.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-800">
                        Rp {ing.predicted_subtotal_idr.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ing.risk_tier.includes('Tier 1')
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : ing.risk_tier.includes('Tier 2')
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : ing.risk_tier.includes('Tier 3')
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {ing.risk_tier.split(' - ')[0]}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteIngredient(idx)}
                          title="Hapus bahan ini"
                          className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cooking Steps Checklist */}
          {recipeData.steps && recipeData.steps.length > 0 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
              <h4 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-emerald-600" />
                Langkah Pembuatan Singkat (Checklist Memasak)
              </h4>
              <div className="space-y-2.5">
                {recipeData.steps.map((step, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggleStep(idx)}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      checkedSteps[idx]
                        ? 'bg-emerald-50/60 border-emerald-200 text-slate-500 line-through'
                        : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/60 text-slate-800'
                    }`}
                  >
                    <div className="pt-0.5">
                      <CheckCircle2 className={`w-4 h-4 ${checkedSteps[idx] ? 'text-emerald-600' : 'text-slate-300'}`} />
                    </div>
                    <div className="text-xs sm:text-sm font-medium leading-relaxed">
                      <span className="font-bold mr-1.5">Langkah {idx + 1}:</span>
                      {step}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ingredient Modal */}
      <IngredientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        metadata={metadata}
        onAddIngredient={handleAddIngredient}
      />
    </div>
  );
};
