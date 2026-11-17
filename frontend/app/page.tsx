'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { Header } from '../components/Header';
import { IndonesiaPriceMap } from '../components/IndonesiaPriceMap';
import { TabRecipeAssistant } from '../components/TabRecipeAssistant';
import { TabGroceryPredictor } from '../components/TabGroceryPredictor';
import { TabAnalyticsDashboard } from '../components/TabAnalyticsDashboard';
import { 
  MetadataResponse, 
  RecipeAssistantResponse, 
  AnalyticsResponse, 
  ShoppingPredictResponse,
  CalculatedIngredient 
} from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'recipe' | 'grocery' | 'analytics'>('recipe');
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [selectedProvince, setSelectedProvince] = useState<string>('Jawa Timur');
  
  const [metadata, setMetadata] = useState<MetadataResponse | null>(null);
  const [recipeData, setRecipeData] = useState<RecipeAssistantResponse | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsResponse | null>(null);

  const [loadingRecipe, setLoadingRecipe] = useState<boolean>(false);
  const [recalculatingRecipe, setRecalculatingRecipe] = useState<boolean>(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(false);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Initial load: Metadata & Health Check
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/metadata`);
        if (res.ok) {
          const data: MetadataResponse = await res.json();
          setMetadata(data);
          setBackendOnline(true);
        } else {
          setBackendOnline(false);
        }
      } catch (err) {
        console.error('Failed to connect to backend API:', err);
        setBackendOnline(false);
      }
    };

    fetchMetadata();
    const interval = setInterval(fetchMetadata, 30000);
    return () => clearInterval(interval);
  }, []);

  // Initial recipe load once metadata is loaded
  useEffect(() => {
    if (metadata && !recipeData) {
      handleAnalyzeRecipe({
        query: 'Aku mau bikin telor asin 20 butir',
        portions: 20,
        province: selectedProvince,
        market_type: 'Pasar Tradisional Rakyat',
        weather_scenario: 'Kondisi Normal Stabil',
        demand_scenario: 'Permintaan Normal Stabil',
        intervention_scenario: 'Tidak Ada Intervensi Pasar',
        custom_ingredients: []
      });
    }
  }, [metadata]);

  // Load analytics when switching to analytics tab
  useEffect(() => {
    if (activeTab === 'analytics' && !analyticsData) {
      const fetchAnalytics = async () => {
        setLoadingAnalytics(true);
        try {
          const res = await fetch(`${API_BASE}/api/analytics`);
          if (res.ok) {
            const data: AnalyticsResponse = await res.json();
            setAnalyticsData(data);
          }
        } catch (err) {
          console.error('Failed to fetch analytics:', err);
        } finally {
          setLoadingAnalytics(false);
        }
      };
      fetchAnalytics();
    }
  }, [activeTab]);

  const handleSelectProvince = (prov: string) => {
    setSelectedProvince(prov);
    // If recipe is already open, notify user and smoothly scroll to workspace
    if (recipeData) {
      handleAnalyzeRecipe({
        query: recipeData.recipe_title,
        portions: recipeData.portions,
        province: prov,
        market_type: recipeData.market_type,
        weather_scenario: recipeData.weather_scenario,
        demand_scenario: recipeData.demand_scenario,
        intervention_scenario: recipeData.intervention_scenario,
        custom_ingredients: recipeData.calculated_ingredients.map(ing => ({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          type: ing.type,
          dataset_commodity: ing.dataset_commodity,
          price_multiplier: ing.price_multiplier,
          estimated_unit_price_idr: ing.current_unit_price_idr
        }))
      });
    }
  };

  const scrollToWorkspace = (tab: 'recipe' | 'grocery' | 'analytics') => {
    setActiveTab(tab);
    if (workspaceRef.current) {
      workspaceRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToMap = () => {
    if (mapRef.current) {
      mapRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAnalyzeRecipe = async (payload: {
    query: string;
    portions: number;
    province: string;
    market_type: string;
    weather_scenario: string;
    demand_scenario: string;
    intervention_scenario: string;
    custom_ingredients?: any[];
  }) => {
    setLoadingRecipe(true);
    try {
      const res = await fetch(`${API_BASE}/api/recipe-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data: RecipeAssistantResponse = await res.json();
        setRecipeData(data);
        setBackendOnline(true);
      }
    } catch (err) {
      console.error('Recipe assistant error:', err);
    } finally {
      setLoadingRecipe(false);
    }
  };

  const handleRecalculateRecipe = async (ingredients: CalculatedIngredient[]) => {
    if (!recipeData) return;
    setRecalculatingRecipe(true);
    try {
      const payload = {
        query: recipeData.recipe_title,
        portions: recipeData.portions,
        province: selectedProvince,
        market_type: recipeData.market_type,
        weather_scenario: recipeData.weather_scenario,
        demand_scenario: recipeData.demand_scenario,
        intervention_scenario: recipeData.intervention_scenario,
        custom_ingredients: ingredients.map(ing => ({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          type: ing.type,
          dataset_commodity: ing.dataset_commodity,
          price_multiplier: ing.price_multiplier,
          estimated_unit_price_idr: ing.current_unit_price_idr
        }))
      };

      const res = await fetch(`${API_BASE}/api/recipe-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data: RecipeAssistantResponse = await res.json();
        setRecipeData({
          ...data,
          recipe_title: recipeData.recipe_title,
          recipe_description: recipeData.recipe_description,
          steps: recipeData.steps
        });
      }
    } catch (err) {
      console.error('Recalculation error:', err);
    } finally {
      setRecalculatingRecipe(false);
    }
  };

  const handlePredictShopping = async (payload: any): Promise<ShoppingPredictResponse | null> => {
    try {
      const res = await fetch(`${API_BASE}/api/predict-shopping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error('Shopping predict error:', err);
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#f6f3f1] text-[#242424] flex flex-col font-mono selection:bg-[#2b59d1] selection:text-white">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendOnline={backendOnline}
        onExploreMapClick={scrollToMap}
      />

      {/* Main Container (Max 1432px matching Monad Design Spec) */}
      <main className="flex-1 max-w-[1432px] w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-12 sm:space-y-16">
        
        {/* HERO SECTION — Centered Map directly under Title + Action Buttons below Map */}
        <section className="relative text-center max-w-6xl mx-auto space-y-6 pt-2 sm:pt-4">
          {/* Subtle Monad gradient wash behind hero */}
          <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-[#ff9473]/15 via-[#a0b5eb]/20 to-[#a7fccd]/15 blur-3xl pointer-events-none rounded-full"></div>

          {/* Untitled Serif Headline (Weight 400, Editorial Contrast) */}
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal tracking-[-0.02em] text-[#242424] leading-[1.12] relative z-10">
            Smart Recipe Cost &amp; Grocery Price Predictor
          </h1>

          {/* HERO GEOSPATIAL MAP (PIHPS Bank Indonesia Interactive Map placed directly below Title) */}
          <div ref={mapRef} className="w-full relative z-10 text-left pt-2">
            <IndonesiaPriceMap
              metadata={metadata}
              onSelectProvince={handleSelectProvince}
              selectedProvince={selectedProvince}
            />
          </div>

          {/* Pill Action Buttons (Monad 100px Pill Language - Moved below the Map) */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3 pb-2 relative z-10">
            <button
              onClick={() => scrollToWorkspace('recipe')}
              className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#2b59d1] hover:bg-[#2247a8] text-white font-mono text-xs font-semibold uppercase tracking-wider shadow-lg hover:shadow-xl transition-all scale-100 hover:scale-[1.02]"
            >
              <span>Mulai Urai Resep AI</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => scrollToWorkspace('grocery')}
              className="px-8 py-3.5 rounded-full bg-[#242424] hover:bg-[#383838] text-white font-mono text-xs font-semibold uppercase tracking-wider transition-all shadow-md hover:shadow-lg"
            >
              Simulasi Belanja Sembako
            </button>
            <button
              onClick={() => scrollToWorkspace('analytics')}
              className="px-7 py-3.5 rounded-full bg-transparent hover:bg-[#eae6e3] text-[#242424] border border-[#242424] font-mono text-xs font-semibold uppercase tracking-wider transition-all"
            >
              Evaluasi Model ML
            </button>
          </div>
        </section>

        {/* WORKSPACE SECTION (3 Tabs) */}
        <section ref={workspaceRef} className="space-y-6 pt-6 border-t border-[#cecac8]">
          {/* Section Divider & Active Tab Indicator */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[#797776] block">
                Ruang Kerja Aplikasi
              </span>
              <h3 className="font-serif text-2xl font-normal text-[#242424]">
                {activeTab === 'recipe' && '1. Asisten Resep AI Bebas & Custom Builder'}
                {activeTab === 'grocery' && '2. Simulasi & Prediktor Anggaran Belanja Sembako'}
                {activeTab === 'analytics' && '3. Dashboard Analisis Data & Kinerja Model ML (Chapter 11)'}
              </h3>
            </div>

            <div className="flex items-center gap-2 bg-[#eae6e3] p-1 rounded-full border border-[#cecac8]">
              <button
                onClick={() => setActiveTab('recipe')}
                className={`px-4 py-1.5 rounded-full text-xs font-mono font-medium uppercase tracking-wider transition-all ${
                  activeTab === 'recipe' ? 'bg-[#242424] text-white' : 'text-[#4e4d4d] hover:text-[#242424]'
                }`}
              >
                Resep
              </button>
              <button
                onClick={() => setActiveTab('grocery')}
                className={`px-4 py-1.5 rounded-full text-xs font-mono font-medium uppercase tracking-wider transition-all ${
                  activeTab === 'grocery' ? 'bg-[#242424] text-white' : 'text-[#4e4d4d] hover:text-[#242424]'
                }`}
              >
                Belanja
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-1.5 rounded-full text-xs font-mono font-medium uppercase tracking-wider transition-all ${
                  activeTab === 'analytics' ? 'bg-[#242424] text-white' : 'text-[#4e4d4d] hover:text-[#242424]'
                }`}
              >
                Analitik ML
              </button>
            </div>
          </div>

          {/* Active Tab View */}
          {activeTab === 'recipe' && (
            <TabRecipeAssistant
              metadata={metadata}
              recipeData={recipeData}
              setRecipeData={setRecipeData}
              onAnalyzeRecipe={handleAnalyzeRecipe}
              loading={loadingRecipe}
              recalculating={recalculatingRecipe}
              onRecalculate={handleRecalculateRecipe}
              selectedProvince={selectedProvince}
            />
          )}

          {activeTab === 'grocery' && (
            <TabGroceryPredictor
              metadata={metadata}
              onPredictShopping={handlePredictShopping}
              selectedProvince={selectedProvince}
            />
          )}

          {activeTab === 'analytics' && (
            <TabAnalyticsDashboard
              analytics={analyticsData}
              loading={loadingAnalytics}
            />
          )}
        </section>

      </main>

      {/* Editorial Footer (Monad Style Reference) */}
      <footer className="bg-[#f6f3f1] border-t border-[#cecac8] py-12 mt-16 text-[#4e4d4d]">
        <div className="max-w-[1432px] mx-auto px-4 sm:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#cecac8] pb-8">
            <div className="space-y-1">
              <span className="font-serif text-2xl text-[#242424] font-normal block">
                PanganKu AI
              </span>
              <p className="text-xs font-mono text-[#797776]">
                Smart Recipe Cost &amp; Grocery Price Predictor • AI Applications Chapter 11
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#eae6e3] border border-[#cecac8] text-[11px] font-mono text-[#4e4d4d]">
                FastAPI Python
              </span>
              <span className="px-3 py-1 rounded-full bg-[#eae6e3] border border-[#cecac8] text-[11px] font-mono text-[#4e4d4d]">
                Scikit-Learn ML
              </span>
              <span className="px-3 py-1 rounded-full bg-[#eae6e3] border border-[#cecac8] text-[11px] font-mono text-[#4e4d4d]">
                Google Gemini API
              </span>
              <span className="px-3 py-1 rounded-full bg-[#eae6e3] border border-[#cecac8] text-[11px] font-mono text-[#4e4d4d]">
                Next.js &amp; Recharts
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-[#797776]">
            <p>Projek Akhir UAS AI Applications — Chapter 11: Data Analysis (Tahun Ajaran 2026)</p>
            <p>Dataset: 10.000 Observasi Sembako di 38 Provinsi Indonesia • 0 Missing Values</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
