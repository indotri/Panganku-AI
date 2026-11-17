import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, RefreshCw, AlertTriangle, TrendingUp, TrendingDown, 
  Store, MapPin, CloudSun, ShieldAlert, Sparkles, Check, ArrowRight,
  DollarSign, Package
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid 
} from 'recharts';
import { MetadataResponse, ShoppingPredictResponse } from '../types';

interface TabGroceryPredictorProps {
  metadata: MetadataResponse | null;
  onPredictShopping: (payload: any) => Promise<ShoppingPredictResponse | null>;
  selectedProvince?: string;
}

export const TabGroceryPredictor: React.FC<TabGroceryPredictorProps> = ({
  metadata,
  onPredictShopping,
  selectedProvince
}) => {
  const [province, setProvince] = useState(selectedProvince || 'Jawa Barat');
  const [marketType, setMarketType] = useState('Pasar Tradisional Rakyat');
  const [weatherScenario, setWeatherScenario] = useState('Kondisi Normal Stabil');
  const [demandScenario, setDemandScenario] = useState('Permintaan Normal Stabil');
  const [interventionScenario, setInterventionScenario] = useState('Tidak Ada Intervensi Pasar');

  useEffect(() => {
    if (selectedProvince && selectedProvince !== province) {
      setProvince(selectedProvince);
    }
  }, [selectedProvince]);

  // Quantities for 12 commodities
  const [quantities, setQuantities] = useState<Record<string, number>>({
    'Beras Medium': 15,
    'Beras Premium': 0,
    'Gula Pasir Konsumsi': 3,
    'Bawang Merah': 1.5,
    'Bawang Putih Honan': 1.0,
    'Cabai Merah Keriting': 1.0,
    'Cabai Rawit Merah': 0.8,
    'Minyak Goreng Kemasan Premium': 0,
    'Minyak Goreng Minyakita': 4,
    'Daging Ayam Ras': 3,
    'Daging Sapi Paha Belakang': 1,
    'Telur Ayam Ras': 3
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ShoppingPredictResponse | null>(null);

  const applyPreset = (type: 'small' | 'medium' | 'catering' | 'reset') => {
    if (type === 'small') {
      setQuantities({
        'Beras Medium': 10,
        'Beras Premium': 0,
        'Gula Pasir Konsumsi': 2,
        'Bawang Merah': 1,
        'Bawang Putih Honan': 0.5,
        'Cabai Merah Keriting': 0.5,
        'Cabai Rawit Merah': 0.5,
        'Minyak Goreng Kemasan Premium': 0,
        'Minyak Goreng Minyakita': 2,
        'Daging Ayam Ras': 2,
        'Daging Sapi Paha Belakang': 0,
        'Telur Ayam Ras': 2
      });
    } else if (type === 'medium') {
      setQuantities({
        'Beras Medium': 25,
        'Beras Premium': 0,
        'Gula Pasir Konsumsi': 4,
        'Bawang Merah': 2,
        'Bawang Putih Honan': 1.5,
        'Cabai Merah Keriting': 1.5,
        'Cabai Rawit Merah': 1.0,
        'Minyak Goreng Kemasan Premium': 2,
        'Minyak Goreng Minyakita': 4,
        'Daging Ayam Ras': 4,
        'Daging Sapi Paha Belakang': 2,
        'Telur Ayam Ras': 4
      });
    } else if (type === 'catering') {
      setQuantities({
        'Beras Medium': 100,
        'Beras Premium': 25,
        'Gula Pasir Konsumsi': 15,
        'Bawang Merah': 12,
        'Bawang Putih Honan': 10,
        'Cabai Merah Keriting': 8,
        'Cabai Rawit Merah': 6,
        'Minyak Goreng Kemasan Premium': 10,
        'Minyak Goreng Minyakita': 20,
        'Daging Ayam Ras': 25,
        'Daging Sapi Paha Belakang': 10,
        'Telur Ayam Ras': 20
      });
    } else {
      setQuantities({
        'Beras Medium': 0,
        'Beras Premium': 0,
        'Gula Pasir Konsumsi': 0,
        'Bawang Merah': 0,
        'Bawang Putih Honan': 0,
        'Cabai Merah Keriting': 0,
        'Cabai Rawit Merah': 0,
        'Minyak Goreng Kemasan Premium': 0,
        'Minyak Goreng Minyakita': 0,
        'Daging Ayam Ras': 0,
        'Daging Sapi Paha Belakang': 0,
        'Telur Ayam Ras': 0
      });
    }
  };

  const handleQtyChange = (commodityName: string, val: number) => {
    setQuantities(prev => ({
      ...prev,
      [commodityName]: Math.max(0, val)
    }));
  };

  const runSimulation = async () => {
    setLoading(true);
    const items = Object.entries(quantities).map(([comm, qty]) => ({
      commodity_name: comm,
      qty: Number(qty) || 0
    }));

    const data = await onPredictShopping({
      province,
      market_type: marketType,
      weather_scenario: weatherScenario,
      demand_scenario: demandScenario,
      intervention_scenario: interventionScenario,
      items
    });

    if (data) {
      setResult(data);
    }
    setLoading(false);
  };

  // Run initial simulation once metadata loads
  useEffect(() => {
    if (metadata && !result) {
      runSimulation();
    }
  }, [metadata]);

  // Prepare data for Recharts Bar Chart
  const chartData = (result?.commodities || [])
    .filter(c => c.qty > 0)
    .map(c => ({
      name: c.commodity_name.replace('Minyak Goreng ', 'Minyak ').replace('Daging Sapi Paha Belakang', 'Daging Sapi'),
      'Biaya Hari Ini': Math.round(c.current_subtotal_idr),
      'Prediksi Minggu Depan': Math.round(c.predicted_subtotal_idr)
    }));

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Simulation Controls Card */}
      <div className="bg-white/85 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-sm border border-[#cecac8] space-y-5">
        
        {/* Card Header: Title & Description */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#cfdaf5]/50 text-[#2b59d1] text-xs font-mono font-semibold border border-[#a0b5eb]">
            <ShoppingCart className="w-3.5 h-3.5 text-[#2b59d1]" />
            <span>Simulasi Keranjang Belanja Bulanan &amp; Prediksi Inflasi Sembako</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-normal text-[#242424] tracking-tight mt-1">
            Prediktor Belanja Sembako Cerdas
          </h2>
          <p className="text-xs sm:text-sm font-mono text-[#797776] max-w-3xl">
            Atur kuantitas belanja 12 bahan pokok dan skenario cuaca/permintaan minggu depan. Model ML akan memproyeksikan pergeseran anggaran belanja keluargamu.
          </p>
        </div>

        {/* Dedicated Preset Toolbar - Strictly 1 Single Straight Row across the card */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#cecac8]/60 overflow-x-auto no-scrollbar w-full">
          <div className="flex items-center flex-nowrap gap-2 shrink-0">
            <span className="text-xs font-mono font-semibold text-[#4e4d4d] shrink-0 mr-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#2b59d1]" />
              Preset:
            </span>
            <button
              onClick={() => applyPreset('small')}
              className="shrink-0 px-3.5 py-1.5 rounded-full bg-[#faf8f6] hover:bg-[#eae6e3] text-[#242424] text-xs font-mono font-medium border border-[#cecac8] transition-all shadow-sm"
            >
              Keluarga Kecil (2-3 org)
            </button>
            <button
              onClick={() => applyPreset('medium')}
              className="shrink-0 px-3.5 py-1.5 rounded-full bg-[#faf8f6] hover:bg-[#eae6e3] text-[#242424] text-xs font-mono font-medium border border-[#cecac8] transition-all shadow-sm"
            >
              Keluarga Menengah (4-5 org)
            </button>
            <button
              onClick={() => applyPreset('catering')}
              className="shrink-0 px-3.5 py-1.5 rounded-full bg-[#faf8f6] hover:bg-[#eae6e3] text-[#242424] text-xs font-mono font-medium border border-[#cecac8] transition-all shadow-sm"
            >
              Katering / Warung
            </button>
            <button
              onClick={() => applyPreset('reset')}
              className="shrink-0 px-3.5 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-mono font-medium border border-rose-200 transition-all shadow-sm"
            >
              Kosongkan
            </button>
          </div>
        </div>

        {/* 5 Scenario Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-4 border-t border-[#cecac8] text-xs font-mono">
          <div>
            <label className="block font-semibold text-[#4e4d4d] mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#2b59d1]" />
              <span>Provinsi Belanja:</span>
            </label>
            <select
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="w-full rounded-xl border border-[#cecac8] bg-[#faf8f6] px-3 py-2 text-xs font-medium text-[#242424] focus:outline-none focus:ring-2 focus:ring-[#2b59d1] transition-all shadow-sm"
            >
              {metadata?.provinces.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#4e4d4d] mb-1 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-teal-600" />
              <span>Tipe Pasar:</span>
            </label>
            <select
              value={marketType}
              onChange={(e) => setMarketType(e.target.value)}
              className="w-full rounded-xl border border-[#cecac8] bg-[#faf8f6] px-3 py-2 text-xs font-medium text-[#242424] focus:outline-none focus:ring-2 focus:ring-[#2b59d1] transition-all shadow-sm"
            >
              {metadata?.market_types.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#4e4d4d] mb-1 flex items-center gap-1.5">
              <CloudSun className="w-3.5 h-3.5 text-sky-600" />
              <span>Skenario Cuaca:</span>
            </label>
            <select
              value={weatherScenario}
              onChange={(e) => setWeatherScenario(e.target.value)}
              className="w-full rounded-xl border border-[#cecac8] bg-[#faf8f6] px-3 py-2 text-xs font-medium text-[#242424] focus:outline-none focus:ring-2 focus:ring-[#2b59d1] transition-all shadow-sm"
            >
              {metadata?.weather_scenarios.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#4e4d4d] mb-1 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
              <span>Intensitas Permintaan:</span>
            </label>
            <select
              value={demandScenario}
              onChange={(e) => setDemandScenario(e.target.value)}
              className="w-full rounded-xl border border-[#cecac8] bg-[#faf8f6] px-3 py-2 text-xs font-medium text-[#242424] focus:outline-none focus:ring-2 focus:ring-[#2b59d1] transition-all shadow-sm"
            >
              {metadata?.demand_scenarios.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#4e4d4d] mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#2b59d1]" />
              <span>Intervensi Pemerintah:</span>
            </label>
            <select
              value={interventionScenario}
              onChange={(e) => setInterventionScenario(e.target.value)}
              className="w-full rounded-xl border border-[#cecac8] bg-[#faf8f6] px-3 py-2 text-xs font-medium text-[#242424] focus:outline-none focus:ring-2 focus:ring-[#2b59d1] transition-all shadow-sm"
            >
              {metadata?.intervention_scenarios.map((inv) => (
                <option key={inv} value={inv}>{inv}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Run simulation button bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#cecac8]/60">
          <span className="text-xs font-mono text-[#797776]">
            Simulasi berbasis Random Forest Regressor &amp; Classifier data observasi terkini
          </span>
          <button
            onClick={runSimulation}
            disabled={loading}
            className="px-8 py-3 rounded-full bg-[#2b59d1] hover:bg-[#2247a8] text-white font-mono text-xs font-semibold uppercase tracking-wider shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Simulasikan Anggaran Belanja dengan Model ML</span>
          </button>
        </div>
      </div>

      {/* Results Overview Cards */}
      {result && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Belanja Saat Ini
              </span>
              <p className="text-2xl font-extrabold text-slate-800">
                Rp {result.total_current_budget_idr.toLocaleString('id-ID')}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                Baseline eceran di {result.province}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Prediksi Minggu Depan
                </span>
                <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                  result.net_difference_idr > 0 
                    ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                    : result.net_difference_idr < 0 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-50 text-slate-700 border border-slate-200'
                }`}>
                  {result.net_difference_idr > 0 ? (
                    <TrendingUp className="w-3 h-3 text-rose-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-emerald-500" />
                  )}
                  {result.net_percentage_change >= 0 ? `+${result.net_percentage_change}%` : `${result.net_percentage_change}%`}
                </span>
              </div>
              <p className="text-2xl font-extrabold text-slate-800">
                Rp {result.total_predicted_budget_idr.toLocaleString('id-ID')}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                Selisih: {result.net_difference_idr >= 0 ? `+Rp ${result.net_difference_idr.toLocaleString('id-ID')}` : `-Rp ${Math.abs(result.net_difference_idr).toLocaleString('id-ID')}`}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Pasar Paling Hemat
              </span>
              <p className="text-base font-extrabold text-teal-800 truncate">
                {result.recommended_market}
              </p>
              <p className="text-[11px] text-teal-600 font-medium">
                Hemat optimal untuk keranjang belanja ini
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Komoditas Rawan Lonjakan
              </span>
              <p className="text-2xl font-extrabold text-amber-600">
                {result.spiking_commodities.length} Komoditas
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                Tier 3/4 atau kenaikan harga &gt; 3%
              </p>
            </div>
          </div>

          {/* Shopping Recommendation Alert */}
          <div className="bg-teal-50/80 rounded-2xl p-5 border border-teal-200 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex-shrink-0 flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900">
                Rekomendasi Cerdas Strategi Belanja Sembako
              </h4>
              <p className="text-xs sm:text-sm text-teal-900 leading-relaxed">
                {result.shopping_recommendation}
              </p>
            </div>
          </div>

          {/* Bar Chart Comparison */}
          {chartData.length > 0 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
              <h4 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <BarChart className="w-5 h-5 text-teal-600" />
                Perbandingan Subtotal Belanja: Hari Ini vs Prediksi Minggu Depan
              </h4>
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      angle={-25} 
                      textAnchor="end" 
                      interval={0} 
                      tick={{ fontSize: 11, fill: '#64748b' }} 
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: '#64748b' }} 
                      tickFormatter={(val) => `Rp ${(val / 1000).toFixed(0)}k`} 
                    />
                    <Tooltip 
                      formatter={(val: any) => [`Rp ${Number(val || 0).toLocaleString('id-ID')}`, '']}
                      contentStyle={{ borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Bar dataKey="Biaya Hari Ini" fill="#0d9488" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Prediksi Minggu Depan" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Interactive 12 Commodities Table */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
            <h4 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <Package className="w-5 h-5 text-teal-600" />
              Detail Keranjang 12 Komoditas Sembako
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px] bg-slate-50/70">
                    <th className="py-3 px-3 rounded-l-xl">Komoditas Sembako</th>
                    <th className="py-3 px-3 text-center">Kuantitas</th>
                    <th className="py-3 px-3 text-right">Harga Satuan (Kini)</th>
                    <th className="py-3 px-3 text-right">Prediksi Satuan (Mg Dpn)</th>
                    <th className="py-3 px-3 text-right">Subtotal Kini</th>
                    <th className="py-3 px-3 text-right">Subtotal Mg Dpn</th>
                    <th className="py-3 px-3 text-right">Fluktuasi</th>
                    <th className="py-3 px-3 rounded-r-xl text-center">Tingkat Risiko</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.commodities.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {item.commodity_name}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleQtyChange(item.commodity_name, (quantities[item.commodity_name] || 0) - 1)}
                            className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 font-bold text-slate-600 text-xs flex items-center justify-center"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={quantities[item.commodity_name] || 0}
                            onChange={(e) => handleQtyChange(item.commodity_name, parseFloat(e.target.value) || 0)}
                            className="w-14 px-1.5 py-1 text-xs text-center font-bold rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleQtyChange(item.commodity_name, (quantities[item.commodity_name] || 0) + 1)}
                            className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 font-bold text-slate-600 text-xs flex items-center justify-center"
                          >
                            +
                          </button>
                          <span className="text-slate-500 text-[11px] font-medium ml-1">{item.unit}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700 font-medium">
                        Rp {item.current_unit_price_idr.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700 font-medium">
                        Rp {item.predicted_unit_price_idr.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-800">
                        Rp {item.current_subtotal_idr.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-800">
                        Rp {item.predicted_subtotal_idr.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`inline-block font-bold ${
                          item.percentage_change > 0 ? 'text-rose-600' : item.percentage_change < 0 ? 'text-emerald-600' : 'text-slate-500'
                        }`}>
                          {item.percentage_change >= 0 ? `+${item.percentage_change}%` : `${item.percentage_change}%`}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.risk_tier.includes('Tier 1')
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.risk_tier.includes('Tier 2')
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : item.risk_tier.includes('Tier 3')
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {item.risk_tier.split(' - ')[0]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4 Market Types Comparison Table */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
            <h4 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <Store className="w-5 h-5 text-teal-600" />
              Perbandingan Estimasi Belanja di 4 Tipe Pasar ({result.province})
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {result.market_comparisons.map((mc, i) => (
                <div
                  key={i}
                  className={`p-5 rounded-2xl border transition-all ${
                    mc.market_type === result.recommended_market
                      ? 'bg-teal-50/70 border-teal-300 ring-2 ring-teal-500/20 shadow-sm'
                      : 'bg-slate-50/70 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Tipe Pasar #{i + 1}
                    </span>
                    {mc.market_type === result.recommended_market && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-600 text-white">
                        Paling Hemat
                      </span>
                    )}
                  </div>
                  <h5 className="font-bold text-slate-800 text-sm mt-1">
                    {mc.market_type}
                  </h5>
                  <p className="text-xl font-extrabold text-slate-900 mt-2">
                    Rp {mc.total_estimated_budget_idr.toLocaleString('id-ID')}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Simulasi total untuk keranjang di atas
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
