import React, { useState } from 'react';
import { X, Plus, Sparkles, ShoppingBag, Layers, Edit3 } from 'lucide-react';
import { CommoditySpec, MetadataResponse } from '../types';

interface IngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: MetadataResponse | null;
  onAddIngredient: (item: {
    name: string;
    quantity: number;
    unit: string;
    type: string;
    dataset_commodity?: string | null;
    price_multiplier: number;
    estimated_unit_price_idr: number;
  }) => void;
}

export const IngredientModal: React.FC<IngredientModalProps> = ({
  isOpen,
  onClose,
  metadata,
  onAddIngredient,
}) => {
  const [tab, setTab] = useState<'dataset' | 'proxy' | 'custom'>('dataset');

  // Exact dataset state
  const [selectedComm, setSelectedComm] = useState<string>(
    metadata?.commodities[0]?.commodity_name || 'Beras Medium'
  );
  const [datasetQty, setDatasetQty] = useState<number>(1.0);

  // Proxy state
  const [selectedProxyIdx, setSelectedProxyIdx] = useState<number>(0);
  const [proxyQty, setProxyQty] = useState<number>(1.0);

  // Custom state
  const [customName, setCustomName] = useState<string>('');
  const [customQty, setCustomQty] = useState<number>(1.0);
  const [customUnit, setCustomUnit] = useState<string>('kg');
  const [customPrice, setCustomPrice] = useState<number>(10000);

  if (!isOpen) return null;

  const handleAddExact = () => {
    const comm = metadata?.commodities.find(c => c.commodity_name === selectedComm);
    onAddIngredient({
      name: selectedComm,
      quantity: Number(datasetQty) || 1,
      unit: comm?.unit || 'kg',
      type: 'EXACT_DATASET_MATCH',
      dataset_commodity: selectedComm,
      price_multiplier: 1.0,
      estimated_unit_price_idr: 0
    });
    onClose();
  };

  const handleAddProxy = () => {
    const proxyItem = metadata?.proxy_suggestions[selectedProxyIdx];
    if (!proxyItem) return;
    onAddIngredient({
      name: proxyItem.name,
      quantity: Number(proxyQty) || 1,
      unit: proxyItem.unit,
      type: 'PROXY_DATASET_MATCH',
      dataset_commodity: proxyItem.proxy,
      price_multiplier: proxyItem.multiplier,
      estimated_unit_price_idr: 0
    });
    onClose();
  };

  const handleAddCustom = () => {
    if (!customName.trim()) return;
    onAddIngredient({
      name: customName.trim(),
      quantity: Number(customQty) || 1,
      unit: customUnit || 'kg',
      type: 'ADDITIONAL_INGREDIENT',
      dataset_commodity: null,
      price_multiplier: 1.0,
      estimated_unit_price_idr: Number(customPrice) || 0
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Tambah Bahan Masakan Sendiri</h3>
              <p className="text-[11px] text-slate-500">Pilih dari dataset sembako ML, proksi inflasi, atau bahan bebas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Subtabs */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setTab('dataset')}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                tab === 'dataset' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>12 Sembako ML</span>
            </button>
            <button
              onClick={() => setTab('proxy')}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                tab === 'proxy' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Proksi Ternak</span>
            </button>
            <button
              onClick={() => setTab('custom')}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                tab === 'custom' ? 'bg-white text-indigo-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Bahan Kustom</span>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          {tab === 'dataset' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Komoditas Sembako (100% Mengikuti Dataset & Model ML):
                </label>
                <select
                  value={selectedComm}
                  onChange={(e) => setSelectedComm(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {metadata?.commodities.map((c) => (
                    <option key={c.commodity_name} value={c.commodity_name}>
                      {c.commodity_name} ({c.unit}) — Kat: {c.category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jumlah Takaran ({metadata?.commodities.find(c => c.commodity_name === selectedComm)?.unit || 'kg'}):
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0.01"
                  value={datasetQty}
                  onChange={(e) => setDatasetQty(parseFloat(e.target.value))}
                  className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs text-emerald-800 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Presisi Model Machine Learning:
                </p>
                <p className="text-[11px] text-emerald-700">
                  Harga komoditas ini akan dihitung berdasarkan data eceran provinsi kamu dan diprediksi fluktuasinya minggu depan menggunakan model RandomForestRegressor.
                </p>
              </div>

              <button
                onClick={handleAddExact}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-md shadow-emerald-200"
              >
                <Plus className="w-4 h-4" />
                Tambahkan Komoditas Ini ke Resep
              </button>
            </div>
          )}

          {tab === 'proxy' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Bahan Proksi (Otomatis Mengikuti Tren Harga Sembako):
                </label>
                <select
                  value={selectedProxyIdx}
                  onChange={(e) => setSelectedProxyIdx(Number(e.target.value))}
                  className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {metadata?.proxy_suggestions.map((p, idx) => (
                    <option key={p.name} value={idx}>
                      {p.label} (Faktor: {p.multiplier}x {p.proxy})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jumlah Takaran ({metadata?.proxy_suggestions[selectedProxyIdx]?.unit || 'kg'}):
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0.01"
                  value={proxyQty}
                  onChange={(e) => setProxyQty(parseFloat(e.target.value))}
                  className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="p-3 bg-teal-50/70 border border-teal-100 rounded-xl text-xs text-teal-800 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  Mekanisme Proksi Inflasi Cerdas:
                </p>
                <p className="text-[11px] text-teal-700">
                  Contoh: Telur Bebek Mentah dipetakan ke <strong>Telur Ayam Ras x1.25</strong>. Jika harga telur ayam di provinsimu naik karena pasokan turun, biaya telur bebek otomatis disesuaikan secara proporsional!
                </p>
              </div>

              <button
                onClick={handleAddProxy}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-md shadow-teal-200"
              >
                <Plus className="w-4 h-4" />
                Tambahkan Bahan Proksi Ini
              </button>
            </div>
          )}

          {tab === 'custom' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Bahan Pelengkap Bebas:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Garam Krosok, Santan Kelapa, Lengkuas..."
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jumlah Takaran:
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.01"
                    value={customQty}
                    onChange={(e) => setCustomQty(parseFloat(e.target.value))}
                    className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Satuan Takaran:
                  </label>
                  <select
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="kg">kg</option>
                    <option value="liter">liter</option>
                    <option value="butir">butir</option>
                    <option value="ikat">ikat</option>
                    <option value="paket">paket / bungkus</option>
                    <option value="buah">buah</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimasi Harga Satuan Hari Ini (Rp):
                </label>
                <input
                  type="number"
                  step="500"
                  min="0"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(parseFloat(e.target.value))}
                  className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={handleAddCustom}
                disabled={!customName.trim()}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-md shadow-indigo-200"
              >
                <Plus className="w-4 h-4" />
                Tambahkan Bahan Kustom Ini
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

