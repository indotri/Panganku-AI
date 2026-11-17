import React, { useState } from 'react';
import { 
  BarChart3, TrendingUp, CheckCircle, ShieldAlert, Cpu, Database, 
  Layers, Award, FileSpreadsheet, Eye, HelpCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  Tooltip, Legend, CartesianGrid, Cell, PieChart, Pie
} from 'recharts';
import { AnalyticsResponse } from '../types';

interface TabAnalyticsDashboardProps {
  analytics: AnalyticsResponse | null;
  loading: boolean;
}

const COLORS = ['#059669', '#0284c7', '#d97706', '#dc2626', '#8b5cf6', '#ec4899', '#14b8a6'];

export const TabAnalyticsDashboard: React.FC<TabAnalyticsDashboardProps> = ({
  analytics,
  loading
}) => {
  const [selectedCommodity, setSelectedCommodity] = useState<string>('Cabai Rawit Merah');

  if (loading || !analytics) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-600">Memuat data analitik & metrik evaluasi model...</p>
      </div>
    );
  }

  const { model_metrics, monthly_trend, market_comparison, top_features } = analytics;
  const regMetrics = model_metrics.regression_metrics;
  const clfMetrics = model_metrics.classification_metrics;
  const dsSummary = model_metrics.dataset_summary;

  // Format line chart data for selected commodity
  const lineChartData = monthly_trend.map((row) => ({
    month: row.month_str,
    [selectedCommodity]: row[selectedCommodity] || 0
  }));

  // Format feature importance data for horizontal/vertical bar chart
  const featureChartData = (top_features || []).slice(0, 10).map((f) => {
    let cleanName = f.feature
      .replace('cat__commodity_name_', 'Komoditas: ')
      .replace('cat__market_type_', 'Pasar: ')
      .replace('cat__weather_shock_severity_', 'Cuaca: ')
      .replace('cat__consumer_purchasing_intensity_', 'Permintaan: ')
      .replace('cat__government_market_intervention_', 'Intervensi: ')
      .replace('cat__province_', 'Provinsi: ')
      .replace('num__', '');
    return {
      feature: cleanName,
      importance: Number((f.importance * 100).toFixed(2))
    };
  });

  // Risk tier distribution for chart
  const riskTierData = Object.entries(analytics.risk_tier_distribution || {}).map(([key, value]) => ({
    name: key.replace('Tier ', 'T'),
    fullName: key,
    count: value
  }));

  // Primary driver distribution
  const primaryDriverData = Object.entries(analytics.primary_driver_distribution || {}).map(([key, value]) => ({
    name: key,
    count: value
  }));

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Chapter 11 Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/50">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/30">
              <Award className="w-3.5 h-3.5 text-indigo-400" />
              Laporan Evaluasi Proyek Akhir (UAS) — AI Applications Chapter 11: Data Analysis
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Dashboard Analisis Data Sembako & Kinerja Model ML
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Mengevaluasi performa model regresi Random Forest (150 estimator) dan pengklasifikasi risiko inflasi dengan arsitektur ketat anti-data leakage pada dataset 10.000 observasi (Januari–Oktober 2026).
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15">
            <Database className="w-6 h-6 text-indigo-300" />
            <div className="text-xs">
              <p className="font-bold text-white">Dataset Indonesia</p>
              <p className="text-indigo-200">10,000 Data • 38 Provinsi • 0 Missing</p>
            </div>
          </div>
        </div>
      </div>

      {/* Model Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* R2 Score */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            R² Score (Regresi Harga)
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
            {(regMetrics.r2_score * 100).toFixed(2)}%
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            R² = {regMetrics.r2_score.toFixed(4)} (Random Forest)
          </p>
        </div>

        {/* MAE */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Mean Absolute Error (MAE)
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-800">
            Rp {Math.round(regMetrics.mae).toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            Rata-rata deviasi eceran
          </p>
        </div>

        {/* RMSE */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Root Mean Squared Error
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-800">
            Rp {Math.round(regMetrics.rmse).toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            Sensitif terhadap penalti outlier
          </p>
        </div>

        {/* MAPE */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            MAPE (%)
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-teal-600">
            {regMetrics.mape_pct.toFixed(2)}%
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            Akurasi harga: {(100 - regMetrics.mape_pct).toFixed(2)}%
          </p>
        </div>

        {/* Accuracy Classifier */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Akurasi Klasifikasi Risiko
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600">
            {(clfMetrics.accuracy * 100).toFixed(2)}%
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            F1-Weighted: {clfMetrics.f1_score_weighted.toFixed(4)}
          </p>
        </div>
      </div>

      {/* Strict Anti-Data Leakage Architecture Box */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-3">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          Kepatuhan Metodologi: Strict Anti-Data Leakage Feature Pipeline
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Dalam pelatihan model Machine Learning ini, seluruh kolom turunan harga masa kini seperti{' '}
          <code className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold font-mono text-[11px]">price_volatility_mom_pct</code>,{' '}
          <code className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold font-mono text-[11px]">price_spread_vs_national_median_idr</code>, dan{' '}
          <code className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold font-mono text-[11px]">cot_food_inflation_rationale</code>{' '}
          <strong>dilarang keras dan dieksklusikan dari matriks fitur masukan (X)</strong> karena merupakan konsekuensi langsung dari harga saat ini. Model murni belajar dari fitur kausal independen: <em>baseline bulan lalu, volume pasokan harian (ton), ongkos logistik per kg, cuaca, ketahanan stok pedagang, sentimen belanja, intervensi pasar, jarak sentra produksi (km), serta komponen tanggal</em>.
        </p>
      </div>

      {/* Chart 1: Monthly Trend Line Chart */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              1. Tren Pergerakan Rata-rata Harga Bulanan (Januari – Oktober 2026)
            </h4>
            <p className="text-xs text-slate-500">
              Observasi harga rata-rata bulanan di seluruh Indonesia untuk komoditas pilihan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600">Pilih Komoditas:</label>
            <select
              value={selectedCommodity}
              onChange={(e) => setSelectedCommodity(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {dsSummary.commodities.map((c) => (
                <option key={c.commodity_name} value={c.commodity_name}>
                  {c.commodity_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineChartData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis 
                tick={{ fontSize: 11, fill: '#64748b' }} 
                tickFormatter={(val) => `Rp ${(val / 1000).toFixed(0)}k`} 
              />
              <Tooltip 
                formatter={(val: any) => [`Rp ${Number(val || 0).toLocaleString('id-ID')}`, selectedCommodity]}
                contentStyle={{ borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" height={36} />
              <Line 
                type="monotone" 
                dataKey={selectedCommodity} 
                stroke="#4f46e5" 
                strokeWidth={3} 
                dot={{ r: 5, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} 
                activeDot={{ r: 7 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Feature Importance (Random Forest Regressor) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
        <h4 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-600" />
          2. Top 10 Feature Importance Penentu Harga Sembako (Model Random Forest)
        </h4>
        <p className="text-xs text-slate-500">
          Bobot pengaruh variabel masukan terhadap estimasi harga eceran sembako di Indonesia.
        </p>

        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={featureChartData} 
              layout="vertical" 
              margin={{ top: 10, right: 30, left: 140, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis 
                type="number" 
                unit="%" 
                tick={{ fontSize: 11, fill: '#64748b' }} 
              />
              <YAxis 
                dataKey="feature" 
                type="category" 
                tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} 
              />
              <Tooltip 
                formatter={(val: any) => [`${val}%`, 'Tingkat Pengaruh']}
                contentStyle={{ borderRadius: '1rem', border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="importance" fill="#6366f1" radius={[0, 6, 6, 0]}>
                {featureChartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 3 & 4: Market Type Comparison & Primary Inflation Driver */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Types Bar Chart */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
          <h4 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            3. Rata-rata Harga di 4 Tipe Pasar
          </h4>
          <p className="text-xs text-slate-500">
            Perbandingan harga agregat seluruh komoditas antar jenis pasar di Indonesia.
          </p>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dsSummary.market_type_stats} margin={{ top: 10, right: 20, left: 20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="market_type" 
                  angle={-15} 
                  textAnchor="end" 
                  interval={0} 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  tickFormatter={(val) => `Rp ${(val / 1000).toFixed(0)}k`} 
                />
                <Tooltip 
                  formatter={(val: any) => [`Rp ${Number(val || 0).toLocaleString('id-ID')}`, 'Rata-rata Harga']}
                  contentStyle={{ borderRadius: '1rem', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="avg_price" fill="#0d9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inflation Spike Risk Tier Distribution */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
          <h4 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            4. Distribusi Tingkat Risiko Inflasi (10,000 Sampel)
          </h4>
          <p className="text-xs text-slate-500">
            Komposisi kelas observasi dari Tier 1 (Stabil) hingga Tier 4 (Lonjakan Tajam).
          </p>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskTierData} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip 
                  formatter={(val: any, name: any, props: any) => [
                    `${Number(val || 0).toLocaleString('id-ID')} observasi (${((Number(val || 0) / 10000) * 100).toFixed(1)}%)`, 
                    props?.payload?.fullName || ''
                  ]}
                  contentStyle={{ borderRadius: '1rem', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {riskTierData.map((entry, index) => (
                    <Cell 
                      key={`risk-cell-${index}`} 
                      fill={
                        entry.fullName.includes('Tier 1') ? '#10b981' :
                        entry.fullName.includes('Tier 2') ? '#0284c7' :
                        entry.fullName.includes('Tier 3') ? '#f59e0b' : '#ef4444'
                      } 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Dataset Summary Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-4">
        <h4 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
          5. Rangkuman Statistik 12 Komoditas Sembako Dataset
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px] bg-slate-50/70">
                <th className="py-3 px-3 rounded-l-xl">Komoditas</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3">Satuan</th>
                <th className="py-3 px-3 text-right">Harga Terendah</th>
                <th className="py-3 px-3 text-right">Rata-rata Nasional</th>
                <th className="py-3 px-3 text-right">Harga Tertinggi</th>
                <th className="py-3 px-3 rounded-r-xl text-center">Jumlah Baris</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dsSummary.commodities.map((c, i) => (
                <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-800">{c.commodity_name}</td>
                  <td className="py-3 px-3 text-slate-600">{c.category}</td>
                  <td className="py-3 px-3 text-slate-500 font-medium">{c.unit}</td>
                  <td className="py-3 px-3 text-right text-slate-700">Rp {c.min_price.toLocaleString('id-ID')}</td>
                  <td className="py-3 px-3 text-right font-bold text-indigo-700">Rp {c.avg_price.toLocaleString('id-ID')}</td>
                  <td className="py-3 px-3 text-right text-slate-700">Rp {c.max_price.toLocaleString('id-ID')}</td>
                  <td className="py-3 px-3 text-center text-slate-500 font-medium">{c.sample_count.toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
