import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Globe, ChevronDown, MapPin, Search, CheckCircle2, TrendingUp, SlidersHorizontal
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell 
} from 'recharts';
import { MapDataResponse, ProvinceMapItem, MetadataResponse } from '../types';
import { INDONESIA_38_PROVINCES } from './indonesiaMapData';

interface IndonesiaPriceMapProps {
  metadata: MetadataResponse | null;
  onSelectProvince: (prov: string) => void;
  selectedProvince: string;
}

export const IndonesiaPriceMap: React.FC<IndonesiaPriceMapProps> = ({
  metadata,
  onSelectProvince,
  selectedProvince
}) => {
  const [selectedCommodity, setSelectedCommodity] = useState<string>('Beras Medium');
  const [viewMode, setViewMode] = useState<'map' | 'histogram'>('map');
  const [mapData, setMapData] = useState<MapDataResponse | null>(null);
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'default' | 'cheapest' | 'priciest' | 'alphabetical'>('default');

  // Fetch real map data when commodity changes
  useEffect(() => {
    const fetchMap = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        const res = await fetch(`${apiBase}/api/map-data?commodity=${encodeURIComponent(selectedCommodity)}`);
        if (res.ok) {
          const data: MapDataResponse = await res.json();
          setMapData(data);
        }
      } catch (err) {
        console.error('Error fetching map data:', err);
      }
    };
    fetchMap();
  }, [selectedCommodity]);

  // Lookup province data quickly
  const provinceLookup: Record<string, ProvinceMapItem> = {};
  if (mapData?.provinces) {
    for (const p of mapData.provinces) {
      provinceLookup[p.province] = p;
    }
  }

  const activeProvDetails = hoveredProvince 
    ? provinceLookup[hoveredProvince] 
    : provinceLookup[selectedProvince] || mapData?.provinces[0];

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  // Filter & sort provinces for the price table below the map
  const filteredProvinces = (mapData?.provinces || [])
    .filter(p => p.province.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortOrder === 'cheapest') return a.avg_price - b.avg_price;
      if (sortOrder === 'priciest') return b.avg_price - a.avg_price;
      if (sortOrder === 'alphabetical') return a.province.localeCompare(b.province);
      return 0; // default (rank in mapData)
    });

  return (
    <div className="w-full bg-transparent text-[#242424] relative font-sans select-none space-y-6">
      
      {/* 1. TOP CONTROLS: Clean Minimalist Light Bar directly on Page Background (Strictly Single Straight Line) */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#cecac8]/70 overflow-x-auto no-scrollbar w-full">
        <div className="flex items-center flex-nowrap gap-2 shrink-0">
          {/* Commodity Dropdown */}
          <div className="relative shrink-0">
            <select
              value={selectedCommodity}
              onChange={(e) => setSelectedCommodity(e.target.value)}
              className="appearance-none bg-white hover:bg-[#faf8f6] border border-[#cecac8] text-[#242424] text-xs font-mono font-medium rounded-full px-3.5 py-1.5 pr-8 focus:outline-none focus:ring-2 focus:ring-[#2b59d1] cursor-pointer transition-all shadow-sm"
            >
              {metadata?.commodities.map((c) => (
                <option key={c.commodity_name} value={c.commodity_name}>
                  {c.commodity_name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#797776] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Quick Province Dropdown Selector */}
          <div className="relative shrink-0">
            <select
              value={selectedProvince}
              onChange={(e) => onSelectProvince(e.target.value)}
              className="appearance-none bg-white hover:bg-[#faf8f6] border border-[#cecac8] text-[#242424] text-xs font-mono font-medium rounded-full px-3.5 py-1.5 pr-8 focus:outline-none focus:ring-2 focus:ring-[#2b59d1] cursor-pointer transition-all shadow-sm"
            >
              {metadata?.provinces.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#797776] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Active Province Price Badge */}
          <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-mono text-emerald-900 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-300 whitespace-nowrap shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>Harga: <strong className="text-emerald-950">Rp {provinceLookup[selectedProvince]?.avg_price?.toLocaleString('id-ID') || '-'}</strong></span>
          </span>

          {/* National Median Badge */}
          <span className="shrink-0 text-xs font-mono text-[#4e4d4d] bg-[#eae6e3] px-3.5 py-1.5 rounded-full border border-[#cecac8] whitespace-nowrap shadow-sm">
            Median Nasional: <strong className="text-[#242424]">Rp {mapData?.national_median?.toLocaleString('id-ID')} / {mapData?.unit || 'kg'}</strong>
          </span>
        </div>

        {/* View Mode Toggle Buttons (Histogram & Tampilan Peta) */}
        <div className="flex items-center bg-[#eae6e3] p-1 rounded-full border border-[#cecac8] shrink-0">
          <button
            onClick={() => setViewMode('histogram')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-sans font-medium transition-all ${
              viewMode === 'histogram'
                ? 'bg-[#242424] text-white shadow-sm'
                : 'text-[#4e4d4d] hover:text-[#242424]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Histogram</span>
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-sans font-medium transition-all ${
              viewMode === 'map'
                ? 'bg-[#242424] text-white shadow-sm'
                : 'text-[#4e4d4d] hover:text-[#242424]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Tampilan Peta</span>
          </button>
        </div>
      </div>

      {/* 2. CENTER DISPLAY: Interactive Map on Seamless Light Background */}
      <div className="w-full relative">
        {viewMode === 'map' ? (
          <div className="relative flex flex-col justify-between overflow-hidden py-2">
            
            {/* Dynamic Tooltip on Hover */}
            {hoveredProvince && activeProvDetails && mousePos && (
              <div
                className="absolute z-30 pointer-events-none bg-[#242424]/95 text-white backdrop-blur-md border border-[#4e4d4d] rounded-xl px-3.5 py-2 text-xs shadow-2xl font-mono space-y-0.5 transition-all transform -translate-x-1/2 -translate-y-full"
                style={{
                  left: `${Math.min(Math.max(mousePos.x, 80), 880)}px`,
                  top: `${Math.max(mousePos.y - 12, 40)}px`
                }}
              >
                <p className="font-bold text-white text-sm">{activeProvDetails.province}</p>
                <p className="text-emerald-400 font-bold">
                  Rp {activeProvDetails.avg_price?.toLocaleString('id-ID')} / {mapData?.unit || 'kg'}
                </p>
                <p className={`text-[10px] ${activeProvDetails.spread_vs_median > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>
                  Selisih vs Median: {activeProvDetails.spread_vs_median >= 0 ? `+Rp ${activeProvDetails.spread_vs_median?.toLocaleString('id-ID')}` : `-Rp ${Math.abs(activeProvDetails.spread_vs_median)?.toLocaleString('id-ID')}`}
                </p>
                <p className="text-[9px] text-[#cecac8] italic pt-0.5">
                  Klik untuk memilih provinsi
                </p>
              </div>
            )}

            {/* Authentic Geographical SVG Map of Indonesia */}
            <div className="w-full flex items-center justify-center py-2 sm:py-4">
              <svg
                viewBox="0 0 960 400"
                className="w-full h-auto max-h-[380px] sm:max-h-[440px] drop-shadow-sm"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => { setHoveredProvince(null); setMousePos(null); }}
              >
                <defs>
                  <filter id="glow-light" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#2b59d1" floodOpacity="0.45" />
                  </filter>
                </defs>

                {/* 38 Real Provinces with Genuine Shorelines */}
                {INDONESIA_38_PROVINCES.map((p) => {
                  const data = provinceLookup[p.name];
                  const fillColor = data?.color_hex || '#10b981';
                  const isSelected = selectedProvince === p.name;
                  const isHovered = hoveredProvince === p.name;

                  return (
                    <path
                      key={p.name}
                      d={p.path}
                      fill={fillColor}
                      stroke={isSelected ? '#2b59d1' : isHovered ? '#242424' : '#ffffff'}
                      strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1.2}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      filter={isSelected ? 'url(#glow-light)' : undefined}
                      className="cursor-pointer transition-all duration-150 hover:brightness-105"
                      onMouseEnter={() => setHoveredProvince(p.name)}
                      onClick={() => onSelectProvince(p.name)}
                    />
                  );
                })}
              </svg>
            </div>

            {/* Bottom Legend Bar: Clean Light Theme */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-[#cecac8]/70 px-1">
              <div>
                <h4 className="text-sm font-serif text-[#242424] font-normal">
                  {selectedCommodity} per {mapData?.unit || 'KG'}
                </h4>
                <p className="text-[10px] font-mono text-[#797776]">
                  Rentang Nasional: Rp {mapData?.national_min?.toLocaleString('id-ID')} — Rp {mapData?.national_max?.toLocaleString('id-ID')}
                </p>
              </div>

              {/* Color Spectrum Bar */}
              <div className="space-y-1">
                <div className="flex items-center h-2.5 rounded-sm overflow-hidden w-64 sm:w-72 shadow-sm border border-[#cecac8]">
                  <div className="h-full flex-1 bg-[#10b981]" title="Harga Terendah"></div>
                  <div className="h-full flex-1 bg-[#84cc16]"></div>
                  <div className="h-full flex-1 bg-[#eab308]"></div>
                  <div className="h-full flex-1 bg-[#f97316]"></div>
                  <div className="h-full flex-1 bg-[#b91c1c]" title="Harga Tertinggi"></div>
                  <div className="h-full w-8 bg-[#94a3b8]" title="Tidak Update"></div>
                  <div className="h-full w-8 bg-[#e2e8f0]" title="Tidak Ada Data"></div>
                </div>
                <div className="flex justify-between text-[9px] font-mono text-[#797776] w-64 sm:w-72 pt-0.5">
                  <span>Harga Terendah</span>
                  <span>Harga Tertinggi</span>
                  <span>Tidak Update</span>
                  <span>Tidak Ada Data</span>
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* Histogram View on Light Background */
          <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-[#cecac8] p-5 sm:p-7 min-h-[380px] flex flex-col justify-between shadow-sm">
            <div className="space-y-1 mb-2">
              <h3 className="text-base font-serif text-[#242424] font-normal">
                Histogram Frekuensi Harga {selectedCommodity} Antar-Provinsi
              </h3>
              <p className="text-xs font-mono text-[#797776]">
                Distribusi sebaran harga eceran di 38 provinsi Indonesia
              </p>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mapData?.histogram_bins || []} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cecac8" />
                  <XAxis 
                    dataKey="range" 
                    angle={-18} 
                    textAnchor="end" 
                    interval={0} 
                    tick={{ fontSize: 10, fill: '#4e4d4d' }} 
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#4e4d4d' }} />
                  <Tooltip 
                    formatter={(val: any) => [`${val} Provinsi`, 'Frekuensi']}
                    contentStyle={{ backgroundColor: '#242424', borderColor: '#4e4d4d', borderRadius: '0.75rem', color: '#fff' }}
                  />
                  <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                    {(mapData?.histogram_bins || []).map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={['#10b981', '#84cc16', '#eab308', '#f97316', '#ef4444', '#b91c1c', '#7f1d1d'][index % 7]} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="text-right text-[11px] font-mono text-[#797776] pt-2 border-t border-[#cecac8]">
              Observasi Sembako: 38 Provinsi Indonesia
            </div>
          </div>
        )}
      </div>

      {/* 3. TABEL HARGA PROVINSI (DITAMPILKAN KEMBALI DI BAWAH PETA DENGAN GAYA CLEAN LIGHT MONAD) */}
      <div className="w-full bg-white/85 backdrop-blur-md rounded-2xl border border-[#cecac8] p-5 sm:p-6 shadow-sm space-y-4">
        
        {/* Table Header & Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#cecac8]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2b59d1]"></span>
              <h3 className="font-serif text-lg font-normal text-[#242424] flex items-center gap-2">
                <span>Tabel Pantauan Harga 38 Provinsi</span>
                <span className="text-xs font-mono text-[#2b59d1] bg-[#cfdaf5]/50 px-2.5 py-0.5 rounded-full border border-[#a0b5eb]">
                  {selectedCommodity}
                </span>
              </h3>
            </div>
            <p className="text-xs font-mono text-[#797776]">
              Klik kartu provinsi untuk menyorot lokasi pada peta di atas &amp; mengaktifkan untuk simulasi
            </p>
          </div>

          {/* Search Box & Sort Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-[#797776] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari provinsi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-44 bg-[#faf8f6] border border-[#cecac8] rounded-full pl-8 pr-3 py-1.5 text-xs font-mono text-[#242424] placeholder-[#797776] focus:outline-none focus:ring-2 focus:ring-[#2b59d1]"
              />
            </div>

            {/* Sort Buttons */}
            <div className="flex items-center gap-1 bg-[#eae6e3] p-1 rounded-full border border-[#cecac8] text-[10px] font-mono">
              <button
                type="button"
                onClick={() => setSortOrder('default')}
                className={`px-2.5 py-1 rounded-full transition-all ${
                  sortOrder === 'default' ? 'bg-[#242424] text-white shadow-sm' : 'text-[#4e4d4d] hover:text-[#242424]'
                }`}
              >
                Peringkat
              </button>
              <button
                type="button"
                onClick={() => setSortOrder('cheapest')}
                className={`px-2.5 py-1 rounded-full transition-all ${
                  sortOrder === 'cheapest' ? 'bg-[#242424] text-white shadow-sm' : 'text-[#4e4d4d] hover:text-[#242424]'
                }`}
              >
                Termurah
              </button>
              <button
                type="button"
                onClick={() => setSortOrder('priciest')}
                className={`px-2.5 py-1 rounded-full transition-all ${
                  sortOrder === 'priciest' ? 'bg-[#242424] text-white shadow-sm' : 'text-[#4e4d4d] hover:text-[#242424]'
                }`}
              >
                Termahal
              </button>
              <button
                type="button"
                onClick={() => setSortOrder('alphabetical')}
                className={`px-2.5 py-1 rounded-full transition-all ${
                  sortOrder === 'alphabetical' ? 'bg-[#242424] text-white shadow-sm' : 'text-[#4e4d4d] hover:text-[#242424]'
                }`}
              >
                A-Z
              </button>
            </div>
          </div>
        </div>

        {/* 38 Provinces Grid / Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#cecac8] scrollbar-track-transparent">
          {filteredProvinces.map((item, index) => {
            const isSelected = selectedProvince === item.province;
            const isHovered = hoveredProvince === item.province;

            return (
              <button
                key={item.province}
                type="button"
                onMouseEnter={() => setHoveredProvince(item.province)}
                onMouseLeave={() => setHoveredProvince(null)}
                onClick={() => onSelectProvince(item.province)}
                className={`flex flex-col text-left p-3 rounded-xl border transition-all text-xs ${
                  isSelected
                    ? 'bg-[#2b59d1] border-[#2b59d1] text-white shadow-md ring-2 ring-[#a0b5eb] scale-[1.02]'
                    : isHovered
                    ? 'bg-white border-[#242424] text-[#242424] shadow-sm'
                    : 'bg-[#faf8f6] border-[#e5e0db] text-[#242424] hover:bg-white hover:border-[#cecac8]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" 
                      style={{ backgroundColor: item.color_hex }}
                    ></span>
                    <span className="font-sans text-[11px] font-medium truncate">
                      {item.province}
                    </span>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0 ml-1" />
                  )}
                </div>

                <div className="flex items-baseline justify-between mt-0.5">
                  <span className={`font-mono text-xs font-bold ${isSelected ? 'text-white' : 'text-[#242424]'}`}>
                    Rp. {item.avg_price?.toLocaleString('id-ID')}
                  </span>
                  <span className={`text-[9px] font-mono ${
                    isSelected 
                      ? 'text-sky-100' 
                      : item.spread_vs_median > 0 ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {item.spread_vs_median >= 0 ? `+${item.spread_vs_median}` : item.spread_vs_median}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer of the Table */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-[#797776] pt-3 border-t border-[#cecac8]">
          <span>
            Menampilkan {filteredProvinces.length} dari 38 Provinsi Indonesia
          </span>
          <span>
            Provinsi Aktif: <strong className="text-[#2b59d1] font-bold">{selectedProvince}</strong> (Rp. {provinceLookup[selectedProvince]?.avg_price?.toLocaleString('id-ID') || '-'} / {mapData?.unit || 'kg'})
          </span>
        </div>

      </div>

    </div>
  );
};
