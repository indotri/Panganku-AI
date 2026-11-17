import React from 'react';
import { ChefHat, ShoppingCart, BarChart3, ArrowRight } from 'lucide-react';

interface HeaderProps {
  activeTab: 'recipe' | 'grocery' | 'analytics';
  setActiveTab: (tab: 'recipe' | 'grocery' | 'analytics') => void;
  backendOnline: boolean;
  onExploreMapClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  setActiveTab, 
  backendOnline,
  onExploreMapClick 
}) => {
  return (
    <div className="w-full">
      {/* Top Black Announcement Bar (Monad Signature) */}
      <div className="bg-[#000000] text-[#f6f3f1] font-mono text-[11px] sm:text-xs py-2 px-4 sm:px-8 border-b border-[#242424]">
        <div className="max-w-[1432px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="uppercase tracking-wider font-medium truncate">
              KEMENTERIAN PERDAGANGAN & BANK INDONESIA (PIHPS) • 10.000 OBSERVASI • 38 PROVINSI
            </span>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <span className="text-[#cecac8]">•</span>
            <span className="text-emerald-300 font-medium">RANDOM FOREST R² 99.18%</span>
            <span className="text-[#cecac8]">•</span>
            <span className="bg-[#242424] px-2.5 py-0.5 rounded-full text-[10px] text-[#cfdaf5] uppercase tracking-wider border border-[#4e4d4d]">
              UAS AI APPLICATIONS CH. 11
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar (Warm Parchment Aesthetic) */}
      <header className="sticky top-0 z-40 bg-[#f6f3f1]/90 backdrop-blur-md border-b border-[#cecac8]">
        <div className="max-w-[1432px] mx-auto px-4 sm:px-8 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Editorial Brand Title */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#242424] text-[#f6f3f1] flex items-center justify-center font-serif text-lg font-normal shadow-sm">
                P
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-serif text-2xl font-normal tracking-[-0.02em] text-[#242424]">
                    PanganKu AI
                  </h1>
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-medium px-2.5 py-0.5 rounded-full border ${
                    backendOnline 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                      : 'bg-rose-50 text-rose-800 border-rose-300 animate-pulse'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${backendOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                    {backendOnline ? 'ONLINE' : 'CONNECTING...'}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-[#797776] uppercase tracking-wider">
                  Smart Recipe Cost & Grocery Price Predictor
                </p>
              </div>
            </div>

            {/* Pill Navigation Tabs (Monad 100px Pill Language) */}
            <nav className="flex items-center bg-[#eae6e3] p-1 rounded-full border border-[#cecac8]">
              <button
                onClick={() => setActiveTab('recipe')}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-mono font-medium uppercase tracking-wider transition-all ${
                  activeTab === 'recipe'
                    ? 'bg-[#242424] text-white shadow-sm'
                    : 'text-[#4e4d4d] hover:text-[#242424] hover:bg-[#dedad7]'
                }`}
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span>1. Asisten Resep</span>
              </button>

              <button
                onClick={() => setActiveTab('grocery')}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-mono font-medium uppercase tracking-wider transition-all ${
                  activeTab === 'grocery'
                    ? 'bg-[#242424] text-white shadow-sm'
                    : 'text-[#4e4d4d] hover:text-[#242424] hover:bg-[#dedad7]'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>2. Prediktor Belanja</span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-mono font-medium uppercase tracking-wider transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-[#242424] text-white shadow-sm'
                    : 'text-[#4e4d4d] hover:text-[#242424] hover:bg-[#dedad7]'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>3. Evaluasi ML Ch.11</span>
              </button>
            </nav>

            {/* Primary Action Button (Lake Blue CTA - Monad Signature) */}
            <div className="hidden xl:block">
              <button
                onClick={onExploreMapClick}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#2b59d1] hover:bg-[#2247a8] text-white font-mono text-xs font-medium uppercase tracking-wider shadow-sm transition-all"
              >
                <span>Jelajahi Peta PIHPS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};
