import os
import json
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.metrics import (
    mean_absolute_error,
    root_mean_squared_error,
    r2_score,
    accuracy_score,
    f1_score,
    classification_report
)

def find_dataset_path():
    candidates = [
        os.path.join(os.path.dirname(__file__), "..", "indonesia_harga_sembako_inflasi_enriched.csv"),
        os.path.join(os.path.dirname(__file__), "indonesia_harga_sembako_inflasi_enriched.csv"),
        "indonesia_harga_sembako_inflasi_enriched.csv",
        "../indonesia_harga_sembako_inflasi_enriched.csv",
    ]
    for path in candidates:
        if os.path.exists(path):
            return os.path.abspath(path)
    raise FileNotFoundError("Dataset indonesia_harga_sembako_inflasi_enriched.csv tidak ditemukan di direktori proyek!")

def main():
    print("=" * 60)
    print("  PANGANKU AI - Pelatihan Model ML Prediksi Harga Sembako & Risiko Inflasi")
    print("=" * 60)

    dataset_path = find_dataset_path()
    print(f"[1/6] Membaca dataset dari: {dataset_path}")
    df = pd.read_csv(dataset_path)
    print(f"      Total data: {len(df):,} baris x {df.shape[1]} kolom")

    print("[2/6] Mengekstrak fitur waktu dari observation_date...")
    df['observation_date'] = pd.to_datetime(df['observation_date'])
    df['month'] = df['observation_date'].dt.month
    df['day_of_year'] = df['observation_date'].dt.dayofyear
    df['day_of_week'] = df['observation_date'].dt.dayofweek

    # Strict Anti-Data Leakage Feature Definition
    categorical_features = [
        'province',
        'market_type',
        'commodity_name',
        'weather_shock_severity',
        'consumer_purchasing_intensity',
        'government_market_intervention'
    ]
    
    numeric_features = [
        'previous_month_baseline_price_idr',
        'market_daily_inflow_volume_tons',
        'logistics_freight_cost_per_kg_idr',
        'trader_stock_holding_days',
        'distance_to_production_hub_km',
        'month',
        'day_of_year'
    ]

    feature_cols = [
        'province', 'market_type', 'commodity_name',
        'previous_month_baseline_price_idr', 'market_daily_inflow_volume_tons',
        'logistics_freight_cost_per_kg_idr', 'weather_shock_severity',
        'trader_stock_holding_days', 'consumer_purchasing_intensity',
        'government_market_intervention', 'distance_to_production_hub_km',
        'month', 'day_of_year'
    ]

    print(f"      Fitur Input (Anti-Data Leakage X): {len(feature_cols)} fitur")
    X = df[feature_cols].copy()
    y_reg = df['current_retail_price_idr'].copy()
    y_clf = df['inflation_spike_risk_tier'].copy()

    # Split Train/Test 80:20
    print("[3/6] Membagi data Train/Test (80:20, random_state=42)...")
    X_train, X_test, y_reg_train, y_reg_test, y_clf_train, y_clf_test = train_test_split(
        X, y_reg, y_clf, test_size=0.2, random_state=42, stratify=y_clf
    )
    print(f"      Train set: {len(X_train):,} sampel | Test set: {len(X_test):,} sampel")

    # Build Preprocessor
    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_features),
            ('num', StandardScaler(), numeric_features)
        ],
        remainder='drop'
    )

    # 1. Regressor Pipeline
    print("[4/6] Melatih Model Regresi Harga (RandomForestRegressor n_estimators=150)...")
    reg_pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=150, random_state=42, n_jobs=-1))
    ])
    reg_pipeline.fit(X_train, y_reg_train)

    y_reg_pred = reg_pipeline.predict(X_test)
    mae = float(mean_absolute_error(y_reg_test, y_reg_pred))
    rmse = float(root_mean_squared_error(y_reg_test, y_reg_pred))
    mape = float(np.mean(np.abs((y_reg_test - y_reg_pred) / y_reg_test)) * 100)
    r2 = float(r2_score(y_reg_test, y_reg_pred))

    print(f"      Hasil Evaluasi Regresi:")
    print(f"      - R² Score : {r2:.4f} ({r2 * 100:.2f}%)")
    print(f"      - MAE      : Rp {mae:,.2f}")
    print(f"      - RMSE     : Rp {rmse:,.2f}")
    print(f"      - MAPE     : {mape:.2f}%")

    # 2. Classifier Pipeline
    print("[5/6] Melatih Model Klasifikasi Risiko Inflasi (RandomForestClassifier n_estimators=150)...")
    clf_pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('classifier', RandomForestClassifier(n_estimators=150, random_state=42, n_jobs=-1))
    ])
    clf_pipeline.fit(X_train, y_clf_train)

    y_clf_pred = clf_pipeline.predict(X_test)
    accuracy = float(accuracy_score(y_clf_test, y_clf_pred))
    f1_weighted = float(f1_score(y_clf_test, y_clf_pred, average='weighted'))
    clf_report = classification_report(y_clf_test, y_clf_pred, output_dict=True)

    print(f"      Hasil Evaluasi Klasifikasi:")
    print(f"      - Accuracy : {accuracy:.4f} ({accuracy * 100:.2f}%)")
    print(f"      - F1 Score : {f1_weighted:.4f}")

    # Feature Importance Extraction
    print("[6/6] Menyimpan model dan metrik evaluasi ke models/...")
    fitted_ohe = reg_pipeline.named_steps['preprocessor'].named_transformers_['cat']
    encoded_cat_names = fitted_ohe.get_feature_names_out(categorical_features).tolist()
    all_feature_names = encoded_cat_names + numeric_features

    rf_regressor = reg_pipeline.named_steps['regressor']
    importances = rf_regressor.feature_importances_
    feature_importance_list = [
        {"feature": name, "importance": float(imp)}
        for name, imp in zip(all_feature_names, importances)
    ]
    feature_importance_list.sort(key=lambda x: x['importance'], reverse=True)
    top_15_features = feature_importance_list[:15]

    # Dataset Summary Statistics
    commodity_stats = []
    for comm in sorted(df['commodity_name'].unique()):
        comm_df = df[df['commodity_name'] == comm]
        commodity_stats.append({
            "commodity_name": comm,
            "category": comm_df['commodity_category'].iloc[0],
            "unit": comm_df['unit_measurement'].iloc[0],
            "avg_price": round(float(comm_df['current_retail_price_idr'].mean()), 2),
            "min_price": float(comm_df['current_retail_price_idr'].min()),
            "max_price": float(comm_df['current_retail_price_idr'].max()),
            "sample_count": int(len(comm_df))
        })

    market_type_stats = []
    for mt in sorted(df['market_type'].unique()):
        mt_df = df[df['market_type'] == mt]
        market_type_stats.append({
            "market_type": mt,
            "avg_price": round(float(mt_df['current_retail_price_idr'].mean()), 2),
            "count": int(len(mt_df))
        })

    risk_tier_counts = {k: int(v) for k, v in df['inflation_spike_risk_tier'].value_counts().items()}
    primary_driver_counts = {k: int(v) for k, v in df['primary_inflation_driver'].value_counts().items()}

    models_dir = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(models_dir, exist_ok=True)

    reg_model_path = os.path.join(models_dir, "price_regressor.joblib")
    clf_model_path = os.path.join(models_dir, "risk_classifier.joblib")
    metrics_path = os.path.join(models_dir, "model_metrics.json")

    joblib.dump(reg_pipeline, reg_model_path)
    joblib.dump(clf_pipeline, clf_model_path)

    metrics_payload = {
        "dataset_summary": {
            "total_records": int(len(df)),
            "total_columns": int(df.shape[1]),
            "date_range": {
                "start": str(df['observation_date'].min().date()),
                "end": str(df['observation_date'].max().date())
            },
            "provinces_count": int(df['province'].nunique()),
            "provinces": sorted(df['province'].unique().tolist()),
            "market_types": sorted(df['market_type'].unique().tolist()),
            "commodities": commodity_stats,
            "market_type_stats": market_type_stats,
            "risk_tier_distribution": risk_tier_counts,
            "primary_driver_distribution": primary_driver_counts,
            "weather_severities": sorted(df['weather_shock_severity'].unique().tolist()),
            "purchasing_intensities": sorted(df['consumer_purchasing_intensity'].unique().tolist()),
            "market_interventions": sorted(df['government_market_intervention'].unique().tolist())
        },
        "regression_metrics": {
            "model_name": "RandomForestRegressor (n_estimators=150)",
            "r2_score": r2,
            "mae": mae,
            "rmse": rmse,
            "mape_pct": mape,
            "train_samples": len(X_train),
            "test_samples": len(X_test)
        },
        "classification_metrics": {
            "model_name": "RandomForestClassifier (n_estimators=150)",
            "accuracy": accuracy,
            "f1_score_weighted": f1_weighted,
            "classification_report": clf_report
        },
        "top_features": top_15_features
    }

    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics_payload, f, indent=2, ensure_ascii=False)

    print(f"      [OK] Model Regresi tersimpan di: {reg_model_path}")
    print(f"      [OK] Model Klasifikasi tersimpan di: {clf_model_path}")
    print(f"      [OK] Metrik & Ringkasan tersimpan di: {metrics_path}")
    print("=" * 60)
    print("  Pelatihan Model Selesai Sukses!")
    print("=" * 60)

if __name__ == "__main__":
    main()

