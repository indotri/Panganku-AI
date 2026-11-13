import os
import json
import datetime
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pandas as pd
import numpy as np
import joblib

from recipe_engine import (
    EXACT_COMMODITIES,
    PROXY_MAPPINGS,
    parse_recipe_query,
    calculate_recipe_pricing
)

app = FastAPI(
    title="PanganKu AI API",
    description="Backend API untuk Asisten Resep Cerdas & Prediksi Harga Sembako Indonesia",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for models and data cache
reg_pipeline = None
clf_pipeline = None
model_metrics = {}
df_dataset = None
price_lookup = {}
feature_defaults = {}
cached_analytics = {}

def load_data_and_models():
    global reg_pipeline, clf_pipeline, model_metrics, df_dataset, price_lookup, feature_defaults, cached_analytics
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    models_dir = os.path.join(base_dir, "models")
    
    reg_path = os.path.join(models_dir, "price_regressor.joblib")
    clf_path = os.path.join(models_dir, "risk_classifier.joblib")
    metrics_path = os.path.join(models_dir, "model_metrics.json")
    
    if os.path.exists(reg_path):
        reg_pipeline = joblib.load(reg_path)
        print(f"[OK] Regressor loaded from {reg_path}")
    else:
        print(f"[WARN] {reg_path} not found. Please run train_model.py first.")

    if os.path.exists(clf_path):
        clf_pipeline = joblib.load(clf_path)
        print(f"[OK] Classifier loaded from {clf_path}")
    else:
        print(f"[WARN] {clf_path} not found. Please run train_model.py first.")

    if os.path.exists(metrics_path):
        with open(metrics_path, "r", encoding="utf-8") as f:
            model_metrics = json.load(f)
        print(f"[OK] Metrics loaded from {metrics_path}")

    # Load dataset for live lookups
    dataset_candidates = [
        os.path.join(base_dir, "..", "indonesia_harga_sembako_inflasi_enriched.csv"),
        os.path.join(base_dir, "indonesia_harga_sembako_inflasi_enriched.csv"),
        "indonesia_harga_sembako_inflasi_enriched.csv"
    ]
    csv_file = None
    for p in dataset_candidates:
        if os.path.exists(p):
            csv_file = p
            break

    if csv_file:
        print(f"[OK] Loading dataset from {csv_file} for lookup caching...")
        df = pd.read_csv(csv_file)
        df_dataset = df
        
        # 1. Precompute latest / average price per province & commodity
        lookup = {}
        for prov, p_group in df.groupby("province"):
            lookup[prov] = {}
            for comm, c_group in p_group.groupby("commodity_name"):
                # Use latest observed price if available, else mean
                lookup[prov][comm] = float(c_group['current_retail_price_idr'].iloc[-1])
        
        # National baseline lookup
        national_lookup = {}
        for comm, c_group in df.groupby("commodity_name"):
            national_lookup[comm] = float(c_group['current_retail_price_idr'].mean())
        lookup["NATIONAL"] = national_lookup
        price_lookup = lookup

        # 2. Precompute feature defaults
        prov_stats = {}
        for prov, p_group in df.groupby("province"):
            prov_stats[prov] = {
                "distance": float(p_group['distance_to_production_hub_km'].mean()),
                "freight": float(p_group['logistics_freight_cost_per_kg_idr'].mean())
            }

        comm_stats = {}
        for comm, c_group in df.groupby("commodity_name"):
            comm_stats[comm] = {
                "inflow": float(c_group['market_daily_inflow_volume_tons'].mean()),
                "stock_days": int(round(c_group['trader_stock_holding_days'].mean()))
            }
        
        feature_defaults = {
            "province_stats": prov_stats,
            "comm_stats": comm_stats
        }

        # 3. Precompute analytics charts
        df['month_str'] = df['observation_date'].str.slice(0, 7)
        # Monthly trend per commodity
        monthly_df = df.groupby(['month_str', 'commodity_name'])['current_retail_price_idr'].mean().unstack().round(0).reset_index()
        monthly_trend = monthly_df.to_dict(orient="records")

        # Market type price comparison
        market_df = df.groupby(['commodity_name', 'market_type'])['current_retail_price_idr'].mean().unstack().round(0).reset_index()
        market_comparison = market_df.to_dict(orient="records")

        # Province overall price index ranking
        prov_rank = df.groupby("province")['current_retail_price_idr'].mean().round(0).reset_index()
        prov_rank.columns = ["province", "avg_price_idr"]
        prov_rank = prov_rank.sort_values(by="avg_price_idr", ascending=False).to_dict(orient="records")

        cached_analytics = {
            "monthly_trend": monthly_trend,
            "market_comparison": market_comparison,
            "province_rank": prov_rank
        }
        print("[OK] Lookup tables and analytics cache built successfully.")
    else:
        print("[WARN] CSV file not found during startup.")

# Load models and data at startup
load_data_and_models()

# Request/Response Schemas
class IngredientItem(BaseModel):
    name: str
    quantity: float = 1.0
    unit: str = "kg"
    type: str = "ADDITIONAL_INGREDIENT" # EXACT_DATASET_MATCH, PROXY_DATASET_MATCH, ADDITIONAL_INGREDIENT
    dataset_commodity: Optional[str] = None
    price_multiplier: float = 1.0
    estimated_unit_price_idr: float = 0.0

class RecipeAssistantRequest(BaseModel):
    query: str
    portions: Optional[int] = 4
    province: str = "Jawa Timur"
    market_type: str = "Pasar Tradisional Rakyat"
    weather_scenario: str = "Kondisi Normal Stabil"
    demand_scenario: str = "Permintaan Normal Stabil"
    intervention_scenario: str = "Tidak Ada Intervensi Pasar"
    custom_ingredients: Optional[List[IngredientItem]] = []

class ShoppingItem(BaseModel):
    commodity_name: str
    qty: float = 1.0

class ShoppingPredictRequest(BaseModel):
    province: str = "Jawa Barat"
    market_type: str = "Pasar Tradisional Rakyat"
    weather_scenario: str = "Kondisi Normal Stabil"
    demand_scenario: str = "Permintaan Normal Stabil"
    intervention_scenario: str = "Tidak Ada Intervensi Pasar"
    items: List[ShoppingItem] = []

@app.get("/")
def root():
    return {
        "app": "PanganKu AI Backend",
        "status": "online",
        "version": "1.0.0",
        "models_loaded": reg_pipeline is not None and clf_pipeline is not None
    }

@app.get("/api/metadata")
def get_metadata():
    """Returns 38 provinces, 4 market types, 12 commodities with specs, and scenario lists."""
    if not model_metrics:
        raise HTTPException(status_code=500, detail="Model metrics belum dimuat. Jalankan train_model.py.")

    ds_summary = model_metrics.get("dataset_summary", {})
    return {
        "provinces": ds_summary.get("provinces", []),
        "market_types": ds_summary.get("market_types", []),
        "commodities": ds_summary.get("commodities", []),
        "weather_scenarios": ds_summary.get("weather_severities", []),
        "demand_scenarios": ds_summary.get("purchasing_intensities", []),
        "intervention_scenarios": ds_summary.get("market_interventions", []),
        "proxy_suggestions": [
            {"label": "Telur Bebek Mentah (Proxy Telur Ayam Ras)", "name": "Telur Bebek Mentah", "proxy": "Telur Ayam Ras", "multiplier": 1.25, "unit": "kg"},
            {"label": "Daging Kambing / Domba (Proxy Sapi)", "name": "Daging Kambing", "proxy": "Daging Sapi Paha Belakang", "multiplier": 1.10, "unit": "kg"},
            {"label": "Ikan Tongkol Segar (Proxy Ayam)", "name": "Ikan Tongkol Segar", "proxy": "Daging Ayam Ras", "multiplier": 0.85, "unit": "kg"},
            {"label": "Beras Ketan Putih (Proxy Beras Premium)", "name": "Beras Ketan Putih", "proxy": "Beras Premium", "multiplier": 1.20, "unit": "kg"},
            {"label": "Bawang Bombay (Proxy Bawang Merah)", "name": "Bawang Bombay", "proxy": "Bawang Merah", "multiplier": 0.90, "unit": "kg"},
            {"label": "Cabai Hijau Besar (Proxy Cabai Merah)", "name": "Cabai Hijau Besar", "proxy": "Cabai Merah Keriting", "multiplier": 0.80, "unit": "kg"}
        ]
    }

@app.get("/api/map-data")
def get_map_data(commodity: str = "Beras Medium"):
    """
    Returns spatial price distribution across 38 Indonesian provinces for interactive PIHPS map.
    """
    if df_dataset is None:
        raise HTTPException(status_code=500, detail="Dataset belum dimuat.")

    # Filter for commodity
    c_df = df_dataset[df_dataset["commodity_name"] == commodity]
    if len(c_df) == 0:
        c_df = df_dataset[df_dataset["commodity_name"] == "Beras Medium"]
        commodity = "Beras Medium"

    unit = c_df["unit_measurement"].iloc[0] if "unit_measurement" in c_df.columns else "kg"
    national_avg = float(c_df["current_retail_price_idr"].mean())
    national_median = float(c_df["current_retail_price_idr"].median())
    national_min = float(c_df["current_retail_price_idr"].min())
    national_max = float(c_df["current_retail_price_idr"].max())

    prov_list = []
    prices_list = []
    for prov, group in c_df.groupby("province"):
        avg_p = float(group["current_retail_price_idr"].mean())
        prices_list.append(avg_p)
        tier = group["inflation_spike_risk_tier"].mode().iloc[0] if "inflation_spike_risk_tier" in group.columns else "Tier 1 - Stable Baseline"
        spread = float(avg_p - national_median)
        prov_list.append({
            "province": prov,
            "avg_price": round(avg_p, 0),
            "min_price": float(group["current_retail_price_idr"].min()),
            "max_price": float(group["current_retail_price_idr"].max()),
            "risk_tier": tier,
            "spread_vs_median": round(spread, 0),
            "sample_count": len(group)
        })

    # Sort prov_list by price ascending (cheapest to highest)
    prov_list.sort(key=lambda x: x["avg_price"])

    # Quantiles for color mapping (green -> yellow -> red)
    p_series = pd.Series(prices_list)
    q20 = float(p_series.quantile(0.2))
    q40 = float(p_series.quantile(0.4))
    q60 = float(p_series.quantile(0.6))
    q80 = float(p_series.quantile(0.8))

    for item in prov_list:
        p = item["avg_price"]
        if p <= q20:
            item["color_bucket"] = "lowest"
            item["color_hex"] = "#10b981" # Hijau
        elif p <= q40:
            item["color_bucket"] = "low-medium"
            item["color_hex"] = "#84cc16" # Hijau Muda
        elif p <= q60:
            item["color_bucket"] = "medium"
            item["color_hex"] = "#eab308" # Kuning
        elif p <= q80:
            item["color_bucket"] = "medium-high"
            item["color_hex"] = "#f97316" # Oranye
        else:
            item["color_bucket"] = "highest"
            item["color_hex"] = "#b91c1c" # Merah Marun

    # Compute 7 histogram bins
    hist_counts, bin_edges = np.histogram(prices_list, bins=7)
    histogram_bins = []
    for i in range(len(hist_counts)):
        histogram_bins.append({
            "range": f"Rp {int(bin_edges[i]):,} - Rp {int(bin_edges[i+1]):,}".replace(",", "."),
            "min_val": int(bin_edges[i]),
            "max_val": int(bin_edges[i+1]),
            "count": int(hist_counts[i])
        })

    return {
        "commodity_name": commodity,
        "unit": unit,
        "national_avg": round(national_avg, 0),
        "national_median": round(national_median, 0),
        "national_min": round(national_min, 0),
        "national_max": round(national_max, 0),
        "provinces": prov_list,
        "histogram_bins": histogram_bins,
        "quantiles": {
            "q20": round(q20, 0),
            "q40": round(q40, 0),
            "q60": round(q60, 0),
            "q80": round(q80, 0)
        }
    }

@app.post("/api/recipe-assistant")
def recipe_assistant(req: RecipeAssistantRequest):
    """
    Parses any free-form recipe or recalculates costs when user modifies ingredients.
    """
    if reg_pipeline is None or clf_pipeline is None:
        raise HTTPException(status_code=500, detail="Model ML belum tersedia. Jalankan train_model.py terlebih dahulu.")

    # Step 1: Check if custom ingredients were provided by user
    if req.custom_ingredients and len(req.custom_ingredients) > 0:
        parsed_recipe = {
            "recipe_title": "Resep Kustom Anda",
            "recipe_description": f"Kalkulasi ulang modal belanja bahan di {req.province} berdasarkan takaran bahan kustom.",
            "portions": req.portions or 4,
            "portion_label": f"{req.portions or 4} porsi",
            "engine_mode": "USER_CUSTOM_BUILDER",
            "steps": [
                "Bahan telah disesuaikan oleh pengguna.",
                "Ikuti petunjuk memasak sesuai selera keluarga."
            ],
            "ingredients": [item.dict() for item in req.custom_ingredients]
        }
    else:
        # Step 1b: Parse free query with Gemini or Local Knowledge Base
        parsed_recipe = parse_recipe_query(req.query, req.portions)

    # Step 2: Calculate Pricing with ML & Province Lookup
    pricing = calculate_recipe_pricing(
        ingredients=parsed_recipe.get("ingredients", []),
        province=req.province,
        market_type=req.market_type,
        weather_scenario=req.weather_scenario,
        demand_scenario=req.demand_scenario,
        intervention_scenario=req.intervention_scenario,
        reg_pipeline=reg_pipeline,
        clf_pipeline=clf_pipeline,
        dataset_metadata=model_metrics.get("dataset_summary", {}),
        price_lookup=price_lookup,
        feature_defaults=feature_defaults
    )

    return {
        "recipe_title": parsed_recipe.get("recipe_title"),
        "recipe_description": parsed_recipe.get("recipe_description"),
        "portions": parsed_recipe.get("portions"),
        "portion_label": parsed_recipe.get("portion_label"),
        "engine_mode": parsed_recipe.get("engine_mode"),
        "steps": parsed_recipe.get("steps", []),
        "province": req.province,
        "market_type": req.market_type,
        "weather_scenario": req.weather_scenario,
        "demand_scenario": req.demand_scenario,
        "intervention_scenario": req.intervention_scenario,
        "calculated_ingredients": pricing["items"],
        "total_cost_current_idr": pricing["total_cost_current_idr"],
        "total_cost_predicted_idr": pricing["total_cost_predicted_idr"],
        "cost_difference_idr": pricing["cost_difference_idr"],
        "cost_change_pct": pricing["cost_change_pct"],
        "overall_risk_tier": pricing["overall_risk_tier"],
        "ai_rationale": pricing["ai_rationale"]
    }

@app.post("/api/predict-shopping")
def predict_shopping(req: ShoppingPredictRequest):
    """
    Simulates monthly/weekly grocery shopping budget and inflation risk.
    """
    if reg_pipeline is None or clf_pipeline is None:
        raise HTTPException(status_code=500, detail="Model ML belum tersedia.")

    today = datetime.date(2026, 10, 19)
    next_week = today + datetime.timedelta(days=7)

    # Convert items to quantity dict
    user_quantities = {item.commodity_name: item.qty for item in req.items}

    # Evaluate each of the 12 commodities
    commodity_results = []
    total_curr = 0.0
    total_pred = 0.0

    feat_prov = feature_defaults.get("province_stats", {}).get(req.province, {})

    for comm in EXACT_COMMODITIES:
        base_price = price_lookup.get(req.province, {}).get(comm)
        if not base_price:
            base_price = price_lookup.get("NATIONAL", {}).get(comm, 25000.0)

        feat_comm = feature_defaults.get("comm_stats", {}).get(comm, {})
        inflow = feat_comm.get("inflow", 15.0)
        freight = feat_prov.get("freight", 800.0)
        distance = feat_prov.get("distance", 100.0)
        trader_days = feat_comm.get("stock_days", 4)

        if req.weather_scenario == "Banjir Sentra Hortikultura":
            inflow *= 0.65
            freight *= 1.35
        elif req.weather_scenario == "Kekeringan Musiman":
            inflow *= 0.80

        row_dict = {
            "province": req.province,
            "market_type": req.market_type,
            "commodity_name": comm,
            "previous_month_baseline_price_idr": base_price,
            "market_daily_inflow_volume_tons": inflow,
            "logistics_freight_cost_per_kg_idr": freight,
            "weather_shock_severity": req.weather_scenario,
            "trader_stock_holding_days": trader_days,
            "consumer_purchasing_intensity": req.demand_scenario,
            "government_market_intervention": req.intervention_scenario,
            "distance_to_production_hub_km": distance,
            "month": next_week.month,
            "day_of_year": next_week.timetuple().tm_yday
        }

        pred_df = pd.DataFrame([row_dict])
        pred_price = float(reg_pipeline.predict(pred_df)[0])
        pred_risk = str(clf_pipeline.predict(pred_df)[0])

        qty = float(user_quantities.get(comm, 0.0))
        sub_curr = round(base_price * qty, 2)
        sub_pred = round(pred_price * qty, 2)

        total_curr += sub_curr
        total_pred += sub_pred

        price_diff = round(pred_price - base_price, 2)
        pct_diff = round((price_diff / base_price * 100), 2) if base_price > 0 else 0.0

        commodity_results.append({
            "commodity_name": comm,
            "unit": "liter" if "Minyak" in comm else "kg",
            "qty": qty,
            "current_unit_price_idr": round(base_price, 2),
            "predicted_unit_price_idr": round(pred_price, 2),
            "unit_difference_idr": price_diff,
            "percentage_change": pct_diff,
            "current_subtotal_idr": sub_curr,
            "predicted_subtotal_idr": sub_pred,
            "risk_tier": pred_risk
        })

    # Compare the same basket across 4 market types
    market_comparisons = []
    market_types_list = [
        "Pasar Tradisional Rakyat",
        "Ritel Modern & Supermarket",
        "Kios Toko Kelontong Permukiman",
        "Pasar Induk Grosir Regional"
    ]

    for mt in market_types_list:
        mt_total = 0.0
        for comm in EXACT_COMMODITIES:
            qty = float(user_quantities.get(comm, 0.0))
            if qty <= 0:
                continue
            base_price = price_lookup.get(req.province, {}).get(comm, 25000.0)
            row_dict = {
                "province": req.province,
                "market_type": mt,
                "commodity_name": comm,
                "previous_month_baseline_price_idr": base_price,
                "market_daily_inflow_volume_tons": feature_defaults.get("comm_stats", {}).get(comm, {}).get("inflow", 15.0),
                "logistics_freight_cost_per_kg_idr": feat_prov.get("freight", 800.0),
                "weather_shock_severity": req.weather_scenario,
                "trader_stock_holding_days": feature_defaults.get("comm_stats", {}).get(comm, {}).get("stock_days", 4),
                "consumer_purchasing_intensity": req.demand_scenario,
                "government_market_intervention": req.intervention_scenario,
                "distance_to_production_hub_km": feat_prov.get("distance", 100.0),
                "month": next_week.month,
                "day_of_year": next_week.timetuple().tm_yday
            }
            pred_p = float(reg_pipeline.predict(pd.DataFrame([row_dict]))[0])
            mt_total += pred_p * qty

        market_comparisons.append({
            "market_type": mt,
            "total_estimated_budget_idr": round(mt_total, 2)
        })

    market_comparisons.sort(key=lambda x: x["total_estimated_budget_idr"])
    cheapest_market = market_comparisons[0]["market_type"] if market_comparisons else req.market_type

    net_diff = round(total_pred - total_curr, 2)
    net_pct = round((net_diff / total_curr * 100), 2) if total_curr > 0 else 0.0

    # Spiking items
    spiking_items = [
        item for item in commodity_results 
        if item["percentage_change"] >= 4.0 or item["risk_tier"] in ["Tier 3 - High Supply Strain", "Tier 4 - Severe Inflationary Spike"]
    ]

    return {
        "province": req.province,
        "market_type": req.market_type,
        "total_current_budget_idr": round(total_curr, 2),
        "total_predicted_budget_idr": round(total_pred, 2),
        "net_difference_idr": net_diff,
        "net_percentage_change": net_pct,
        "commodities": commodity_results,
        "spiking_commodities": spiking_items,
        "market_comparisons": market_comparisons,
        "recommended_market": cheapest_market,
        "shopping_recommendation": (
            f"Di {req.province}, estimasi belanja pada '{cheapest_market}' memberikan efisiensi biaya paling optimal. "
            + (f"Perhatikan potensi kenaikan harga pada {len(spiking_items)} komoditas seperti {', '.join([s['commodity_name'] for s in spiking_items[:3]])}. Disarankan membeli lebih awal." if spiking_items else "Semua komoditas utama terpantau dalam koridor harga yang stabil.")
        )
    }

@app.get("/api/analytics")
def get_analytics():
    """
    Returns rich dataset analysis and ML performance for Chapter 11 Presentation.
    """
    if not model_metrics:
        raise HTTPException(status_code=500, detail="Data analitik belum siap.")

    return {
        "model_metrics": model_metrics,
        "monthly_trend": cached_analytics.get("monthly_trend", []),
        "market_comparison": cached_analytics.get("market_comparison", []),
        "province_rank": cached_analytics.get("province_rank", []),
        "risk_tier_distribution": model_metrics.get("dataset_summary", {}).get("risk_tier_distribution", {}),
        "primary_driver_distribution": model_metrics.get("dataset_summary", {}).get("primary_driver_distribution", {}),
        "top_features": model_metrics.get("top_features", [])
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

