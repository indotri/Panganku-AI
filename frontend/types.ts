export interface ProvinceMapItem {
  province: string;
  avg_price: number;
  min_price: number;
  max_price: number;
  risk_tier: string;
  spread_vs_median: number;
  sample_count: number;
  color_bucket: string;
  color_hex: string;
}

export interface MapDataResponse {
  commodity_name: string;
  unit: string;
  national_avg: number;
  national_median: number;
  national_min: number;
  national_max: number;
  provinces: ProvinceMapItem[];
  histogram_bins: {
    range: string;
    min_val: number;
    max_val: number;
    count: number;
  }[];
  quantiles: {
    q20: number;
    q40: number;
    q60: number;
    q80: number;
  };
}

export interface CommoditySpec {
  commodity_name: string;
  category: string;
  unit: string;
  avg_price: number;
  min_price: number;
  max_price: number;
  sample_count: number;
}

export interface MarketTypeStat {
  market_type: string;
  avg_price: number;
  count: number;
}

export interface MetadataResponse {
  provinces: string[];
  market_types: string[];
  commodities: CommoditySpec[];
  weather_scenarios: string[];
  demand_scenarios: string[];
  intervention_scenarios: string[];
  proxy_suggestions: {
    label: string;
    name: string;
    proxy: string;
    multiplier: number;
    unit: string;
  }[];
}

export interface CalculatedIngredient {
  name: string;
  quantity: number;
  unit: string;
  type: string; // EXACT_DATASET_MATCH, PROXY_DATASET_MATCH, ADDITIONAL_INGREDIENT
  dataset_commodity?: string | null;
  price_multiplier: number;
  current_unit_price_idr: number;
  predicted_unit_price_idr: number;
  current_subtotal_idr: number;
  predicted_subtotal_idr: number;
  difference_idr: number;
  risk_tier: string;
  price_source: string;
}

export interface RecipeAssistantResponse {
  recipe_title: string;
  recipe_description: string;
  portions: number;
  portion_label: string;
  engine_mode: string;
  steps: string[];
  province: string;
  market_type: string;
  weather_scenario: string;
  demand_scenario: string;
  intervention_scenario: string;
  calculated_ingredients: CalculatedIngredient[];
  total_cost_current_idr: number;
  total_cost_predicted_idr: number;
  cost_difference_idr: number;
  cost_change_pct: number;
  overall_risk_tier: string;
  ai_rationale: string;
}

export interface ShoppingItemResult {
  commodity_name: string;
  unit: string;
  qty: number;
  current_unit_price_idr: number;
  predicted_unit_price_idr: number;
  unit_difference_idr: number;
  percentage_change: number;
  current_subtotal_idr: number;
  predicted_subtotal_idr: number;
  risk_tier: string;
}

export interface MarketComparison {
  market_type: string;
  total_estimated_budget_idr: number;
}

export interface ShoppingPredictResponse {
  province: string;
  market_type: string;
  total_current_budget_idr: number;
  total_predicted_budget_idr: number;
  net_difference_idr: number;
  net_percentage_change: number;
  commodities: ShoppingItemResult[];
  spiking_commodities: ShoppingItemResult[];
  market_comparisons: MarketComparison[];
  recommended_market: string;
  shopping_recommendation: string;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface AnalyticsResponse {
  model_metrics: {
    dataset_summary: {
      total_records: number;
      total_columns: number;
      date_range: { start: string; end: string };
      provinces_count: number;
      provinces: string[];
      market_types: string[];
      commodities: CommoditySpec[];
      market_type_stats: MarketTypeStat[];
      risk_tier_distribution: Record<string, number>;
      primary_driver_distribution: Record<string, number>;
      weather_severities: string[];
      purchasing_intensities: string[];
      market_interventions: string[];
    };
    regression_metrics: {
      model_name: string;
      r2_score: number;
      mae: number;
      rmse: number;
      mape_pct: number;
      train_samples: number;
      test_samples: number;
    };
    classification_metrics: {
      model_name: string;
      accuracy: number;
      f1_score_weighted: number;
      classification_report: Record<string, any>;
    };
    top_features: FeatureImportance[];
  };
  monthly_trend: Record<string, any>[];
  market_comparison: Record<string, any>[];
  province_rank: { province: string; avg_price_idr: number }[];
  risk_tier_distribution: Record<string, number>;
  primary_driver_distribution: Record<string, number>;
  top_features: FeatureImportance[];
}

