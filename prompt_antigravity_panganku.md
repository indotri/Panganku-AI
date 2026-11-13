# Panduan & Master Prompt Antigravity IDE: Proyek Web AI Prediksi Harga Sembako & Asisten Resep Dinamis (Chapter 11 Data Analysis)

Dokumen ini berisi **panduan langkah demi langkah** beserta **Master Prompt siap pakai (copy-paste)** untuk diberikan ke **Antigravity IDE** agar otomatis membangun aplikasi web **Next.js (React)** yang terhubung dengan **Backend AI Python (FastAPI + Scikit-Learn + Gemini AI)** menggunakan dataset `indonesia_harga_sembako_inflasi_enriched.csv`.

Sistem ini **tidak dibatasi pada resep tertentu saja**: pengguna bebas mengetik masakan atau olahan pangan apa saja (misalnya *"Rendang Sapi"*, *"Telur Asin"*, *"Seblak"*, *"Rawon"*, *"Nasi Goreng"*, dll.) maupun **menambahkan/mengatur bahan secara custom sendiri**.

## Bagian 1: Cara Menggunakan Prompt Ini di Antigravity IDE

Ikuti 5 langkah berurutan berikut agar Antigravity IDE dapat membaca dataset kalian, melatih model Machine Learning di Python, dan membangun web Next.js tanpa error:

1. **Siapkan Folder Proyek & Masukkan Dataset**
   - Buat satu folder baru di komputer kamu, misalnya bernama `panganku-chapter11`.
   - Salin file dataset `indonesia_harga_sembako_inflasi_enriched.csv` ke dalam folder `panganku-chapter11` tersebut (letakkan di bagian paling luar / *root directory*).
   - Buka aplikasi **Antigravity IDE**, lalu pilih **File -> Open Folder** dan arahkan ke folder `panganku-chapter11`.

2. **Buka Panel Agent Antigravity & Lampirkan File CSV**
   - Buka panel **Agent / Chat** di sisi kanan Antigravity IDE.
   - Pastikan mode kerja berada pada mode **Agent** supaya Antigravity memiliki izin membuat folder `backend/` dan `frontend/`, menulis kode, serta menjalankan perintah terminal otomatis.
   - Ketik simbol `@` di kolom chat Antigravity lalu pilih `@indonesia_harga_sembako_inflasi_enriched.csv` agar Agent membaca struktur asli file CSV kamu.

3. **Salin & Kirimkan Master Prompt**
   - Salin seluruh teks di dalam kotak kode pada **Bagian 2 (Master Prompt Antigravity)** di bawah.
   - Tempelkan (*paste*) ke kolom chat Antigravity setelah tag `@indonesia_harga_sembako_inflasi_enriched.csv`, lalu tekan **Enter**.
   - Saat Antigravity meminta konfirmasi untuk menjalankan perintah terminal (seperti `pip install`, `python train_model.py`, atau `npx create-next-app`), klik **Accept / Run**.

4. **Tambahkan API Key Gemini Gratis (Agar AI Bisa Mengurai Resep Bebas Apa Saja)**
   - Ambil API Key gratis di Google AI Studio (`aistudio.google.com`), lalu simpan di file `backend/.env` dengan format:
     ```bash
     GEMINI_API_KEY=isi_api_key_kamu_di_sini
     ```
   - *(Catatan: Master Prompt di bawah juga sudah menyiapkan **Smart Rule-Based & Custom Ingredient Builder**, sehingga meskipun belum diisi API Key atau sedang offline saat demo, pengguna tetap bisa mengetik menu seperti Telur Asin, Rendang, Soto, dll., serta menambah/mengedit bahan custom sesuka hati).*

5. **Cara Menjalankan Aplikasi dari Terminal**
   - **Terminal 1 — Menjalankan Server AI Python (FastAPI di Port 8000)**:
     ```bash
     cd backend
     python -m venv venv
     # Untuk Windows:
     venv\Scripts\activate
     # Untuk Mac/Linux:
     source venv/bin/activate

     pip install fastapi uvicorn pandas scikit-learn joblib numpy google-genai python-dotenv pydantic
     python train_model.py
     uvicorn main:app --reload --port 8000
     ```
   - **Terminal 2 — Menjalankan Web Frontend (Next.js di Port 3000)**:
     ```bash
     cd frontend
     npm install
     npm run dev
     ```

## Bagian 2: Master Prompt untuk Diberikan ke Antigravity IDE

Salin seluruh blok teks di bawah ini dan tempelkan langsung ke Agent Antigravity IDE kamu:

```markdown
Saya sedang mengerjakan tugas projek akhir (UAS) untuk mata kuliah AI Applications — Chapter 11: Data Analysis. Tolong bangunkan aplikasi web full-stack bernama **"PanganKu AI: Smart Recipe Cost & Grocery Price Predictor"** yang mengintegrasikan **Frontend Next.js (React + TypeScript + Tailwind CSS + Recharts)** dengan **Backend Python (FastAPI + Scikit-Learn + Pandas + Google Gemini API)** menggunakan dataset `@indonesia_harga_sembako_inflasi_enriched.csv` yang ada di root folder ini.

### 1. Spesifikasi Dataset (`indonesia_harga_sembako_inflasi_enriched.csv`)
Dataset ini memiliki 10.000 baris, 26 kolom, dan 0 missing values (periode observasi 2026-01-02 hingga 2026-10-19 di 38 provinsi Indonesia). Gunakan nama kolom dan nilai kategorikal persis seperti di bawah ini:
- **Kolom Identitas & Waktu**: `commodity_record_id`, `observation_date` (YYYY-MM-DD), `province` (38 provinsi), `market_type` (`Pasar Tradisional Rakyat`, `Ritel Modern & Supermarket`, `Kios Toko Kelontong Permukiman`, `Pasar Induk Grosir Regional`).
- **Kolom Komoditas (12 Komoditas dalam 5 Kategori)**:
  - `commodity_name`: `Beras Medium`, `Beras Premium`, `Gula Pasir Konsumsi`, `Bawang Merah`, `Bawang Putih Honan`, `Cabai Merah Keriting`, `Cabai Rawit Merah`, `Minyak Goreng Kemasan Premium`, `Minyak Goreng Minyakita`, `Daging Ayam Ras`, `Daging Sapi Paha Belakang`, `Telur Ayam Ras`.
  - `commodity_category`: `Bahan Pokok Beras`, `Gula & Bumbu Dapur`, `Hortikultura Cabai & Bawang`, `Minyak Nabati`, `Protein Hewani Ternak`.
  - `unit_measurement`: `kg` atau `liter`.
- **Kolom Harga & Fitur Prediktor (Input Model)**:
  - `current_retail_price_idr` (Target Regresi: harga eceran saat ini dalam Rupiah)
  - `previous_month_baseline_price_idr` (Harga baseline bulan sebelumnya)
  - `market_daily_inflow_volume_tons` (Pasokan harian dalam ton)
  - `logistics_freight_cost_per_kg_idr` (Biaya logistik per kg dalam Rupiah)
  - `weather_shock_severity` (`Kondisi Normal Stabil`, `Curah Hujan Tinggi Moderat`, `Kekeringan Musiman`, `Banjir Sentra Hortikultura`)
  - `trader_stock_holding_days` (Ketahanan stok pedagang dalam hari)
  - `consumer_purchasing_intensity` (`Permintaan Normal Stabil`, `Penurunan Akhir Bulan`, `Lonjakan Menjelang Ramadhan/Lebaran`, `Panik Borong Spekulatif`)
  - `government_market_intervention` (`Tidak Ada Intervensi Pasar`, `Penyaluran Minyakita Subsidi`, `Gerakan Pangan Murah Serentak`, `Operasi Pasar Beras SPHP Bulog`)
  - `distance_to_production_hub_km` (Jarak ke sentra produksi dalam km)
- **Kolom Indeks Turunan, Target Klasifikasi & Penjelasan AI**:
  - `price_volatility_mom_pct`, `freight_cost_share_pct`, `supply_pressure_index`, `food_affordability_burden_score`, `price_spread_vs_national_median_idr`, `market_intervention_effectiveness_score`, `confidence_score`.
  - `inflation_spike_risk_tier` (Target Klasifikasi: `Tier 1 - Stable Baseline`, `Tier 2 - Moderate Price Drift`, `Tier 3 - High Supply Strain`, `Tier 4 - Severe Inflationary Spike`).
  - `primary_inflation_driver` (`Normal-Equilibrium`, `Ramadhan-Demand-Shock`, `Intervention-Price-Stabilized`, `Weather-Supply-Deficit`, `Middleman-Margin-Markup`, `High-Freight-Distance-Penalty`).
  - `cot_food_inflation_rationale` (Teks analisis naratif Chain-of-Thought penyebab fluktuasi harga).

---

### 2. Struktur Folder Proyek yang Harus Dibuat
Buat struktur monorepo bersih sebagai berikut:
- `/backend` (Python FastAPI + Script Pelatihan Model ML + Hybrid AI Recipe Engine)
  - `train_model.py`
  - `main.py`
  - `recipe_engine.py` (AI Dinamis pengurai masakan bebas + Custom Ingredient Calculator)
  - `requirements.txt`
  - `.env.example` (`GEMINI_API_KEY=`)
  - `models/` (tempat menyimpan artefak `.joblib` dan `model_metrics.json`)
- `/frontend` (Next.js App Router + TypeScript + Tailwind CSS + Recharts + Lucide Icons)

---

### 3. Tugas Backend (`/backend`) — Python Data Analysis, ML Training, Dynamic AI Recipe & FastAPI

1. **Buat & Jalankan Script `backend/train_model.py`**:
   - Baca `../indonesia_harga_sembako_inflasi_enriched.csv`.
   - Ekstrak fitur waktu dari `observation_date`: `month`, `day_of_year`, dan `day_of_week`.
   - **Aturan Ketat Anti-Data Leakage**: Saat melatih model untuk memprediksi `current_retail_price_idr` dan `inflation_spike_risk_tier`, HANYA gunakan fitur input (`X`) berikut:
     `['province', 'market_type', 'commodity_name', 'previous_month_baseline_price_idr', 'market_daily_inflow_volume_tons', 'logistics_freight_cost_per_kg_idr', 'weather_shock_severity', 'trader_stock_holding_days', 'consumer_purchasing_intensity', 'government_market_intervention', 'distance_to_production_hub_km', 'month', 'day_of_year']`.
     JANGAN gunakan `price_volatility_mom_pct`, `price_spread_vs_national_median_idr`, atau `cot_food_inflation_rationale` sebagai fitur input `X` karena kolom tersebut merupakan turunan langsung dari harga saat ini.
   - Gunakan `ColumnTransformer` dengan `OneHotEncoder(handle_unknown='ignore')` untuk fitur kategorikal dan `StandardScaler` untuk fitur numerik di dalam `Pipeline` Scikit-Learn.
   - Latih 2 model dengan pembagian data Train/Test (80:20):
     1. **Model Regresi Harga (`price_regressor.joblib`)**: Gunakan `RandomForestRegressor(n_estimators=150, random_state=42, n_jobs=-1)` untuk memprediksi harga sembako (`current_retail_price_idr`). Hitung metrik evaluasi **MAE**, **RMSE**, **MAPE (%)**, dan **R² Score** pada data uji.
     2. **Model Klasifikasi Risiko Inflasi (`risk_classifier.joblib`)**: Gunakan `RandomForestClassifier(n_estimators=150, random_state=42, n_jobs=-1)` untuk memprediksi `inflation_spike_risk_tier`. Hitung **Accuracy** dan **F1-Score Weighted**.
   - Simpan kedua model beserta rangkuman statistik dataset, Feature Importance teratas, dan metrik evaluasi ke dalam `backend/models/model_metrics.json`.

2. **Buat `backend/recipe_engine.py` (AI Pengurai Resep Bebas Tanpa Batas + Custom Builder)**:
   - Sistem TIDAK BOLEH dibatasi hanya pada beberapa resep statis. Pengguna bebas mengetik masakan atau olahan pangan apa saja (contoh: *"Mau masak Rendang"*, *"Bikin Telur Asin 20 butir"*, *"Seblak Kuah Pedas"*, *"Rawon Sapi"*, *"Martabak Telur"*, *"Ayam Geprek"*, dll.).
   - Cara kerja `recipe_engine.py`:
     - **Mode 1 — Dynamic LLM Parser (Google Gemini API `gemini-2.5-flash` via `google-genai`)**: Jika `GEMINI_API_KEY` tersedia di `.env`, kirim prompt terstruktur (JSON Schema) ke Gemini untuk mengurai masakan apa pun yang diketik pengguna menjadi daftar bahan lengkap beserta takarannya (sesuai jumlah porsi/butir yang diminta) dan langkah pembuatannya.
     - **Mode 2 — Smart Local Knowledge Base & Heuristic Parser (Offline Fallback)**: Jika `GEMINI_API_KEY` belum diisi, sediakan kamus katalog kuliner Indonesia yang luas (mencakup puluhan masakan populer termasuk **Telur Asin**, **Rendang Sapi**, **Opor Ayam**, **Soto Ayam**, **Rawon**, **Seblak**, **Bakso Sapi**, **Nasi Goreng**, **Sambal Goreng Telur**, **Gado-Gado**, **Semur**, **Ayam Bakar**, dll.) serta parser kata kunci pintar yang otomatis mendeteksi komoditas dari kalimat pengguna.
     - **Sistem Pemetaan Harga Hybrid (Dataset ML + Proksi Komoditas + Bahan Tambahan)**:
       Setiap bahan hasil uraian resep dikelompokkan menjadi 3 tipe harga:
       1. `EXACT_DATASET_MATCH`: Bahan yang ada persis di 12 `commodity_name` CSV (misal `Daging Sapi Paha Belakang`, `Telur Ayam Ras`, `Cabai Rawit Merah`, `Cabai Merah Keriting`, `Bawang Merah`, `Bawang Putih Honan`, `Minyak Goreng Minyakita`, `Beras Medium`, `Gula Pasir Konsumsi`, `Daging Ayam Ras`) -> Harganya diambil 100% dari data aktual provinsi tersebut di CSV dan diprediksi harga minggu depannya menggunakan model Machine Learning `price_regressor.joblib`.
       2. `PROXY_DATASET_MATCH`: Bahan sejenis yang mengikuti tren inflasi komoditas di CSV dengan faktor pengali rasio pasar (`price_multiplier`). Contohnya: ketika pengguna ingin membuat **Telur Asin**, bahan utamanya adalah **Telur Bebek Mentah** yang dipetakan ke proksi `Telur Ayam Ras` di CSV (dengan pengali harga ~1.25x dari harga per kg Telur Ayam Ras di provinsi tersebut, sehingga jika harga telur di Jawa Timur naik, estimasi biaya bahan pembuatan Telur Asin juga ikut naik secara dinamis mengikuti prediksi model ML!).
       3. `ADDITIONAL_INGREDIENT`: Bahan pelengkap di luar sembako utama (contoh untuk Telur Asin: *Garam Kasar / Garam Krosok*, *Abu Gosok / Bubuk Bata Merah*, *Air*; atau untuk Rendang: *Santan Kelapa*, *Serai*, *Lengkuas*, *Daun Kunyit*) -> Diberikan estimasi harga pasar wajar (`estimated_unit_price_idr`) yang tetap bisa diedit/di-custom langsung oleh pengguna di layar web.

3. **Buat Server API `backend/main.py` dengan FastAPI**:
   - Aktifkan `CORSMiddleware` untuk `http://localhost:3000`.
   - Sediakan 4 endpoint utama:
     - `GET /api/metadata`: Mengembalikan daftar 38 provinsi, 4 `market_type`, 12 `commodity_name` beserta satuan dan harga rata-rata terbarunya, serta opsi skenario cuaca/permintaan.
     - `POST /api/recipe-assistant`: Menerima `{ "query": "Aku mau bikin telor asin 20 butir", "portions": 4, "province": "Jawa Timur", "market_type": "Pasar Tradisional Rakyat", "weather_scenario": "Kondisi Normal Stabil", "demand_scenario": "Permintaan Normal Stabil", "custom_ingredients": [] }`.
       - Jika `custom_ingredients` kosong, panggil `recipe_engine` untuk mengurai masakan apa pun yang diketik pengguna menjadi daftar bahan lengkap, langkah pembuatan singkat, dan estimasi harga hari ini vs minggu depan.
       - Jika pengguna mengubah takaran atau menambahkan bahan sendiri di UI (`custom_ingredients` terisi), hitung ulang total biaya hari ini dan prediksi minggu depan secara presisi menggunakan model ML `price_regressor.joblib` dan `risk_classifier.joblib`.
     - `POST /api/predict-shopping`: Menerima input perencanaan belanja bulanan/minggu depan `{ "province": "...", "market_type": "...", "weather_scenario": "...", "demand_scenario": "...", "intervention_scenario": "...", "items": [{ "commodity_name": "Beras Medium", "qty": 10 }, ...] }`. Mengembalikan prediksi harga satuan minggu depan untuk ke-12 sembako, total anggaran belanja sekarang vs prediksi minggu depan, persentase kenaikan/penurunan, prediksi `inflation_spike_risk_tier`, dan rekomendasi waktu/pasar belanja paling hemat.
     - `GET /api/analytics`: Mengembalikan data untuk visualisasi Chapter 11 Data Analysis (tren rata-rata harga per bulan Jan–Okt 2026 per komoditas, perbandingan rata-rata harga di 4 tipe pasar, distribusi `primary_inflation_driver`, distribusi `inflation_spike_risk_tier`, serta isi `model_metrics.json`).

---

### 4. Tugas Frontend (`/frontend`) — Next.js, Tailwind CSS & Recharts
Bangun antarmuka pengguna berbahasa Indonesia yang bersih, modern, responsif, dan memiliki 3 Tab Utama:
1. **Tab 1: Asisten Resep AI Bebas & Custom Builder ("Mau Masak atau Bikin Apa Hari Ini?")**
   - Sediakan **Chat/Input Bar Bebas** di mana pengguna bisa mengetik apa saja (contoh: *"Mau masak rendang sapi 1 kg"*, *"Cara bikin telor asin 20 butir dan modal bahannya"*, *"Bikin seblak pedas untuk 3 orang"*), ditambah chip contoh cepat, pilihan **Provinsi**, **Tipe Pasar**, dan **Jumlah Porsi/Takaran**.
   - Tampilkan **Fitur Custom Bahan Interaktif (Interactive Ingredient Editor)**: Setelah AI mengurai bahan-bahan masakan tersebut, pengguna bisa:
     - Mengubah jumlah/takaran (`qty`) tiap bahan secara langsung.
     - Menambahkan bahan baru sendiri (bisa memilih dari 12 komoditas sembako dataset, proksi komoditas, atau mengetik bahan custom sendiri beserta harganya).
     - Menghapus bahan yang sudah ada di dapur.
     - Klik tombol **"Hitung Ulang dengan Model AI"** untuk memperbarui kalkulasi harga hari ini vs prediksi minggu depan secara *real-time*.
   - Tampilkan kartu ringkasan: **Total Modal Bahan Hari Ini**, **Prediksi Modal Minggu Depan**, **Status Risiko Inflasi Bahan Utama**, **Langkah Pembuatan Singkat**, dan **Analisis AI PanganKu** (berdasarkan kondisi pasokan dan `cot_food_inflation_rationale` di provinsi tersebut).
2. **Tab 2: Prediktor Belanja Bulanan Sembako ("Simulasi Anggaran Minggu/Bulan Depan")**
   - Pengguna dapat memilih provinsi, tipe pasar, serta mengatur simulasi kondisi minggu depan (Cuaca, Intensitas Permintaan Konsumen, dan Intervensi Pemerintah) serta mengisi jumlah kuantitas belanja bulanan untuk masing-masing dari 12 bahan pokok.
   - Tampilkan perbandingan **Total Belanja Bulan Ini vs Prediksi Minggu/Bulan Depan**, daftar komoditas yang berpotensi naik tajam, serta grafik batang perbandingan harga tiap item.
3. **Tab 3: Dashboard Analisis Data & Evaluasi Model (Khusus Presentasi UAS Chapter 11)**
   - Tampilkan Kartu Metrik Evaluasi Model Machine Learning (**R² Score**, **MAE**, **RMSE**, **MAPE**, dan **Akurasi Klasifikasi Risiko**).
   - Tampilkan Grafik Garis (*Line Chart*) tren pergerakan harga komoditas dari Januari–Oktober 2026.
   - Tampilkan Grafik Batang (*Bar Chart*) perbandingan harga antar 4 Tipe Pasar dan grafik *Feature Importance* faktor penentu harga sembako.

Setelah selesai menulis seluruh kode backend dan frontend, tolong langsung jalankan `python train_model.py` di dalam `/backend` untuk memastikan model `.joblib` dan `model_metrics.json` berhasil terbentuk tanpa error, lalu jalankan server backend dan frontend.
```