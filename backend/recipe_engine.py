import os
import re
import json
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

EXACT_COMMODITIES = [
    "Beras Medium",
    "Beras Premium",
    "Gula Pasir Konsumsi",
    "Bawang Merah",
    "Bawang Putih Honan",
    "Cabai Merah Keriting",
    "Cabai Rawit Merah",
    "Minyak Goreng Kemasan Premium",
    "Minyak Goreng Minyakita",
    "Daging Ayam Ras",
    "Daging Sapi Paha Belakang",
    "Telur Ayam Ras"
]

PROXY_MAPPINGS = {
    "telur bebek": {"proxy": "Telur Ayam Ras", "multiplier": 1.25, "unit": "kg"},
    "telur bebek mentah": {"proxy": "Telur Ayam Ras", "multiplier": 1.25, "unit": "kg"},
    "telur asin mentah": {"proxy": "Telur Ayam Ras", "multiplier": 1.30, "unit": "kg"},
    "telur puyuh": {"proxy": "Telur Ayam Ras", "multiplier": 1.40, "unit": "kg"},
    "daging kambing": {"proxy": "Daging Sapi Paha Belakang", "multiplier": 1.10, "unit": "kg"},
    "daging domba": {"proxy": "Daging Sapi Paha Belakang", "multiplier": 1.10, "unit": "kg"},
    "iga sapi": {"proxy": "Daging Sapi Paha Belakang", "multiplier": 1.05, "unit": "kg"},
    "buntut sapi": {"proxy": "Daging Sapi Paha Belakang", "multiplier": 1.15, "unit": "kg"},
    "daging bebek": {"proxy": "Daging Ayam Ras", "multiplier": 1.35, "unit": "kg"},
    "daging ayam kampung": {"proxy": "Daging Ayam Ras", "multiplier": 1.50, "unit": "kg"},
    "ikan tongkol": {"proxy": "Daging Ayam Ras", "multiplier": 0.85, "unit": "kg"},
    "ikan kembung": {"proxy": "Daging Ayam Ras", "multiplier": 0.90, "unit": "kg"},
    "ikan mas": {"proxy": "Daging Ayam Ras", "multiplier": 0.85, "unit": "kg"},
    "ikan nila": {"proxy": "Daging Ayam Ras", "multiplier": 0.80, "unit": "kg"},
    "ikan lele": {"proxy": "Daging Ayam Ras", "multiplier": 0.65, "unit": "kg"},
    "cumi-cumi": {"proxy": "Daging Sapi Paha Belakang", "multiplier": 0.65, "unit": "kg"},
    "udang basah": {"proxy": "Daging Sapi Paha Belakang", "multiplier": 0.70, "unit": "kg"},
    "beras ketan": {"proxy": "Beras Premium", "multiplier": 1.20, "unit": "kg"},
    "beras merah": {"proxy": "Beras Premium", "multiplier": 1.30, "unit": "kg"},
    "bawang bombay": {"proxy": "Bawang Merah", "multiplier": 0.90, "unit": "kg"},
    "bawang daun": {"proxy": "Bawang Merah", "multiplier": 0.60, "unit": "kg"},
    "cabai hijau besar": {"proxy": "Cabai Merah Keriting", "multiplier": 0.75, "unit": "kg"},
    "cabai hijau keriting": {"proxy": "Cabai Merah Keriting", "multiplier": 0.80, "unit": "kg"},
    "cabai rawit hijau": {"proxy": "Cabai Rawit Merah", "multiplier": 0.75, "unit": "kg"},
    "gula merah": {"proxy": "Gula Pasir Konsumsi", "multiplier": 1.30, "unit": "kg"},
    "gula jawa": {"proxy": "Gula Pasir Konsumsi", "multiplier": 1.30, "unit": "kg"},
    "gula aren": {"proxy": "Gula Pasir Konsumsi", "multiplier": 1.45, "unit": "kg"},
    "minyak jagung": {"proxy": "Minyak Goreng Kemasan Premium", "multiplier": 1.40, "unit": "liter"},
    "minyak kelapa": {"proxy": "Minyak Goreng Kemasan Premium", "multiplier": 1.35, "unit": "liter"},
}

# Catalog of common Indonesian dishes for Mode 2 (Offline Knowledge Base)
LOCAL_RECIPES_CATALOG = {
    "telur asin": {
        "title": "Telur Asin Gurih Masir Tradisional",
        "description": "Olahan telur bebek berbumbu garam krosok dan adonan abu gosok/bubuk bata merah yang diawetkan hingga kuning telurnya berminyak dan masir sempurna.",
        "default_portions": 20,
        "portion_unit": "butir",
        "scale_basis": 20, # 20 butir basis
        "ingredients": [
            {
                "name": "Telur Bebek Mentah",
                "base_qty": 1.3, # ~20 butir x 65g
                "unit": "kg",
                "type": "PROXY_DATASET_MATCH",
                "dataset_commodity": "Telur Ayam Ras",
                "price_multiplier": 1.25,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Garam Krosok / Kasar",
                "base_qty": 0.5,
                "unit": "kg",
                "type": "ADDITIONAL_INGREDIENT",
                "dataset_commodity": None,
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 8000
            },
            {
                "name": "Abu Gosok / Bubuk Bata Merah",
                "base_qty": 1.0,
                "unit": "kg",
                "type": "ADDITIONAL_INGREDIENT",
                "dataset_commodity": None,
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 5000
            },
            {
                "name": "Air Bersih",
                "base_qty": 1.0,
                "unit": "liter",
                "type": "ADDITIONAL_INGREDIENT",
                "dataset_commodity": None,
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            }
        ],
        "steps": [
            "Cuci bersih telur bebek mentah dan amplas cangkang secara perlahan agar pori-pori terbuka.",
            "Campurkan abu gosok atau bubuk bata merah dengan garam krosok dan air hingga membentuk pasta kental.",
            "Balut setiap butir telur dengan adonan setebal 1-2 cm, lalu simpan dalam wadah kedap selama 12-14 hari.",
            "Setelah 14 hari, bersihkan baluran adonan lalu kukus atau rebus telur dengan api sedang selama 60 menit hingga matang masir."
        ]
    },
    "rendang": {
        "title": "Rendang Daging Sapi Khas Minang",
        "description": "Kare daging sapi kaya rempah dengan karamelisasi santan kelapa pekat khas Nusantara.",
        "default_portions": 6,
        "portion_unit": "porsi",
        "scale_basis": 6,
        "ingredients": [
            {
                "name": "Daging Sapi Paha Belakang",
                "base_qty": 1.0,
                "unit": "kg",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Daging Sapi Paha Belakang",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Cabai Merah Keriting",
                "base_qty": 0.25,
                "unit": "kg",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Cabai Merah Keriting",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Bawang Merah",
                "base_qty": 0.15,
                "unit": "kg",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Bawang Merah",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Bawang Putih Honan",
                "base_qty": 0.08,
                "unit": "kg",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Bawang Putih Honan",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Minyak Goreng Minyakita",
                "base_qty": 0.1,
                "unit": "liter",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Minyak Goreng Minyakita",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Gula Pasir Konsumsi",
                "base_qty": 0.05,
                "unit": "kg",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Gula Pasir Konsumsi",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Santan Kelapa Kental Murni",
                "base_qty": 1.5,
                "unit": "liter",
                "type": "ADDITIONAL_INGREDIENT",
                "dataset_commodity": None,
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 18000
            },
            {
                "name": "Rempah Lengkuas, Jahe, Serai & Daun Kunyit",
                "base_qty": 1.0,
                "unit": "ikat",
                "type": "ADDITIONAL_INGREDIENT",
                "dataset_commodity": None,
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 6000
            }
        ],
        "steps": [
            "Potong daging sapi searah serat dengan ketebalan 2-3 cm.",
            "Haluskan cabai merah keriting, bawang merah, bawang putih, jahe, dan lengkuas.",
            "Rebus santan bersama bumbu halus, serai, daun jeruk, dan daun kunyit dengan api sedang sambil diaduk konstan hingga mengeluarkan minyak (gulai).",
            "Masukkan potongan daging sapi, kecilkan api dan masak perlahan selama 3-4 jam hingga kuah mengering dan bumbu berwarna cokelat gelap (kalio -> rendang)."
        ]
    },
    "opor ayam": {
        "title": "Opor Ayam Kuah Gurih Lebaran",
        "description": "Masakan ayam berkuah santan kental dengan aroma ketumbar, jintan, dan serai yang harum nan menggugah selera.",
        "default_portions": 5,
        "portion_unit": "porsi",
        "scale_basis": 5,
        "ingredients": [
            {
                "name": "Daging Ayam Ras",
                "base_qty": 1.0,
                "unit": "kg",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Daging Ayam Ras",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Bawang Merah",
                "base_qty": 0.1,
                "unit": "kg",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Bawang Merah",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Bawang Putih Honan",
                "base_qty": 0.06,
                "unit": "kg",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Bawang Putih Honan",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Minyak Goreng Minyakita",
                "base_qty": 0.1,
                "unit": "liter",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Minyak Goreng Minyakita",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Gula Pasir Konsumsi",
                "base_qty": 0.03,
                "unit": "kg",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Gula Pasir Konsumsi",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Santan Kelapa Segar",
                "base_qty": 1.0,
                "unit": "liter",
                "type": "ADDITIONAL_INGREDIENT",
                "dataset_commodity": None,
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 15000
            },
            {
                "name": "Bumbu Rempah Opor (Ketumbar, Jinten, Serai, Daun Salam)",
                "base_qty": 1.0,
                "unit": "paket",
                "type": "ADDITIONAL_INGREDIENT",
                "dataset_commodity": None,
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 5000
            }
        ],
        "steps": [
            "Potong daging ayam ras menjadi 8-10 bagian lalu bersihkan.",
            "Tumis bumbu halus bawang merah, bawang putih, kemiri, ketumbar dengan sedikit minyak hingga harum.",
            "Masukkan serai dan daun salam, masukkan potongan ayam, aduk hingga ayam berubah warna keputihan.",
            "Tuang santan cair dan santan kental secara bertahap, bumbui dengan garam dan gula pasir. Masak dengan api kecil hingga ayam empuk meresap."
        ]
    },
    "soto ayam": {
        "title": "Soto Ayam Lamongan Kuah Bening Gurih",
        "description": "Sup ayam tradisional berkuah kaldu kuning harum bertabur koya gurih, suwiran ayam, dan pelengkap bihun.",
        "default_portions": 4,
        "portion_unit": "porsi",
        "scale_basis": 4,
        "ingredients": [
            {
                "name": "Daging Ayam Ras",
                "base_qty": 0.8,
                "unit": "kg",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Daging Ayam Ras",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Telur Ayam Ras",
                "base_qty": 0.25, # ~4 butir
                "unit": "kg",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Telur Ayam Ras",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Bawang Merah",
                "base_qty": 0.08,
                "unit": "kg",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Bawang Merah",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Bawang Putih Honan",
                "base_qty": 0.06,
                "unit": "kg",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Bawang Putih Honan",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Minyak Goreng Minyakita",
                "base_qty": 0.1,
                "unit": "liter",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Minyak Goreng Minyakita",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Bihun Jagung & Sayur Kol",
                "base_qty": 0.3,
                "unit": "kg",
                "type": "ADDITIONAL_INGREDIENT",
                "dataset_commodity": None,
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 7000
            },
            {
                "name": "Kunyit, Jahe, Serai & Daun Jeruk",
                "base_qty": 1.0,
                "unit": "ikat",
                "type": "ADDITIONAL_INGREDIENT",
                "dataset_commodity": None,
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 4000
            }
        ],
        "steps": [
            "Rebus ayam dalam air mendidih untuk kaldu kuah soto.",
            "Tumis bumbu halus bawang, kunyit bakar, jahe, kemiri hingga harum lalu tuang ke panci kaldu.",
            "Tiriskan ayam, goreng sebentar lalu suwir-suwir tipis.",
            "Tata bihun rebus, irisan kol, tauge, potongan telur rebus dan suwiran ayam di mangkuk, lalu siram kuah panas."
        ]
    },
    "rawon": {
        "title": "Rawon Daging Sapi Khas Jawa Timur",
        "description": "Sup daging sapi legendaris berwarna hitam pekat dari kluwek matang dengan aroma rempah istimewa.",
        "default_portions": 5,
        "portion_unit": "porsi",
        "scale_basis": 5,
        "ingredients": [
            {
                "name": "Daging Sapi Paha Belakang",
                "base_qty": 0.8,
                "unit": "kg",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Daging Sapi Paha Belakang",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Bawang Merah",
                "base_qty": 0.1,
                "unit": "kg",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Bawang Merah",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Bawang Putih Honan",
                "base_qty": 0.06,
                "unit": "kg",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Bawang Putih Honan",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Cabai Merah Keriting",
                "base_qty": 0.05,
                "unit": "kg",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Cabai Merah Keriting",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Minyak Goreng Minyakita",
                "base_qty": 0.1,
                "unit": "liter",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Minyak Goreng Minyakita",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Buah Kluwek Hitam Pilihan",
                "base_qty": 5.0,
                "unit": "buah",
                "type": "ADDITIONAL_INGREDIENT",
                "dataset_commodity": None,
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 8000
            },
            {
                "name": "Tauge Pendek, Daun Bawang & Sambal Terasi",
                "base_qty": 1.0,
                "unit": "paket",
                "type": "ADDITIONAL_INGREDIENT",
                "dataset_commodity": None,
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 6000
            }
        ],
        "steps": [
            "Rebus daging sapi sandung lamur/paha belakang hingga setengah empuk, lalu potong dadu kecil.",
            "Rendam isi buah kluwek dalam air hangat lalu haluskan bersama bawang merah, bawang putih, ketumbar, dan kunyit.",
            "Tumis bumbu halus bersama serai dan lengkuas hingga harum berminyak.",
            "Tuang bumbu tumis ke dalam air rebusan daging. Masak dengan api kecil hingga kuah hitam meresap dan daging empuk."
        ]
    },
    "seblak": {
        "title": "Seblak Kuah Pedas Jeletot Khas Bandung",
        "description": "Jajanan gurih pedas khas Priangan berbahan kerupuk kenyal, telur, aneka topping dengan aroma kencur yang dominan.",
        "default_portions": 3,
        "portion_unit": "porsi",
        "scale_basis": 3,
        "ingredients": [
            {
                "name": "Cabai Rawit Merah",
                "base_qty": 0.1,
                "unit": "kg",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Cabai Rawit Merah",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Cabai Merah Keriting",
                "base_qty": 0.08,
                "unit": "kg",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Cabai Merah Keriting",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Bawang Putih Honan",
                "base_qty": 0.05,
                "unit": "kg",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Bawang Putih Honan",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Bawang Merah",
                "base_qty": 0.05,
                "unit": "kg",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Bawang Merah",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Telur Ayam Ras",
                "base_qty": 0.12, # ~2 butir
                "unit": "kg",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Telur Ayam Ras",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Minyak Goreng Minyakita",
                "base_qty": 0.08,
                "unit": "liter",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Minyak Goreng Minyakita",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Kerupuk Bawang Mentah",
                "base_qty": 0.25,
                "unit": "kg",
                "type": "ADDITIONAL_INGREDIENT",
                "dataset_commodity": None,
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 15000
            },
            {
                "name": "Kencur Segar",
                "base_qty": 0.05,
                "unit": "kg",
                "type": "ADDITIONAL_INGREDIENT",
                "dataset_commodity": None,
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 4000
            },
            {
                "name": "Sosis & Bakso Sapi Olahan",
                "base_qty": 0.2,
                "unit": "kg",
                "type": "ADDITIONAL_INGREDIENT",
                "dataset_commodity": None,
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 12000
            }
        ],
        "steps": [
            "Rendam kerupuk bawang mentah dalam air panas hingga lentur kenyal.",
            "Haluskan kencur, cabai rawit merah, cabai merah keriting, bawang merah, dan bawang putih.",
            "Tumis bumbu kencur dengan sedikit minyak hingga harum pedas, lalu tuang 500 ml air.",
            "Masukkan kocokan telur orak-arik, kerupuk kenyal, sosis, dan bakso. Masak hingga mendidih kental."
        ]
    },
    "bakso": {
        "title": "Bakso Sapi Kuah Gurih Komplit",
        "description": "Bola daging sapi kenyal lezat disajikan dengan kuah kaldu sapi bening gurih dan pelengkap mie.",
        "default_portions": 4,
        "portion_unit": "porsi",
        "scale_basis": 4,
        "ingredients": [
            {
                "name": "Daging Sapi Paha Belakang",
                "base_qty": 0.6,
                "unit": "kg",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Daging Sapi Paha Belakang",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Bawang Putih Honan",
                "base_qty": 0.08,
                "unit": "kg",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Bawang Putih Honan",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Bawang Merah (Bawang Goreng)",
                "base_qty": 0.06,
                "unit": "kg",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Bawang Merah",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Minyak Goreng Minyakita",
                "base_qty": 0.08,
                "unit": "liter",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Minyak Goreng Minyakita",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Tepung Tapioka / Sagu Aren",
                "base_qty": 0.15,
                "unit": "kg",
                "type": "ADDITIONAL_INGREDIENT",
                "dataset_commodity": None,
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 4000
            },
            {
                "name": "Mi Kuning, Bihun & Daun Seledri",
                "base_qty": 0.3,
                "unit": "kg",
                "type": "ADDITIONAL_INGREDIENT",
                "dataset_commodity": None,
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 8000
            }
        ],
        "steps": [
            "Giling daging sapi segar bersama es batu, bawang putih goreng, garam, dan merica hingga halus kalis.",
            "Campurkan tepung tapioka lalu uleni hingga adonan membal.",
            "Bentuk bulat-bulat dengan tangan lalu cemplungkan ke dalam air hangat hingga terapung matang.",
            "Rebus tulang sumsum untuk kuah kaldu gurih, sajikan bakso bersama mie dan taburan bawang goreng."
        ]
    },
    "nasi goreng": {
        "title": "Nasi Goreng Spesial Komplit",
        "description": "Nasi goreng harum beraroma bawang dan kecap manis berpadu suwiran ayam dan telur mata sapi.",
        "default_portions": 3,
        "portion_unit": "porsi",
        "scale_basis": 3,
        "ingredients": [
            {
                "name": "Beras Medium",
                "base_qty": 0.4,
                "unit": "kg",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Beras Medium",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Telur Ayam Ras",
                "base_qty": 0.2, # ~3 butir
                "unit": "kg",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Telur Ayam Ras",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Daging Ayam Ras",
                "base_qty": 0.2,
                "unit": "kg",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Daging Ayam Ras",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Cabai Merah Keriting",
                "base_qty": 0.05,
                "unit": "kg",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Cabai Merah Keriting",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Bawang Merah",
                "base_qty": 0.05,
                "unit": "kg",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Bawang Merah",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Bawang Putih Honan",
                "base_qty": 0.04,
                "unit": "kg",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Bawang Putih Honan",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Minyak Goreng Minyakita",
                "base_qty": 0.08,
                "unit": "liter",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Minyak Goreng Minyakita",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Kecap Manis, Saus Tiram & Daun Bawang",
                "base_qty": 1.0,
                "unit": "paket",
                "type": "ADDITIONAL_INGREDIENT",
                "dataset_commodity": None,
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 5000
            }
        ],
        "steps": [
            "Masak beras hingga menjadi nasi pera lalu dinginkan.",
            "Tumis bumbu halus bawang merah, bawang putih, dan cabai merah dengan minyak panas.",
            "Sisihkan bumbu di tepi wajan, masukkan telur lalu buat orak-arik matang.",
            "Masukkan nasi pera, potongan ayam, tuang kecap manis dan garam. Aduk cepat di atas api besar (smoky) hingga merata."
        ]
    },
    "ayam geprek": {
        "title": "Ayam Geprek Sambal Korek Pedas Nampol",
        "description": "Ayam goreng tepung renyah krispi yang digeprek langsung bersama ulekan sambal cabai rawit pedas berminyak panas.",
        "default_portions": 4,
        "portion_unit": "porsi",
        "scale_basis": 4,
        "ingredients": [
            {
                "name": "Daging Ayam Ras",
                "base_qty": 0.8,
                "unit": "kg",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Daging Ayam Ras",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Cabai Rawit Merah",
                "base_qty": 0.15,
                "unit": "kg",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Cabai Rawit Merah",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Bawang Putih Honan",
                "base_qty": 0.06,
                "unit": "kg",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Bawang Putih Honan",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Minyak Goreng Minyakita",
                "base_qty": 0.3,
                "unit": "liter",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Minyak Goreng Minyakita",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Tepung Bumbu Renyah Krispi",
                "base_qty": 0.25,
                "unit": "kg",
                "type": "ADDITIONAL_INGREDIENT",
                "dataset_commodity": None,
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 7000
            }
        ],
        "steps": [
            "Marinasi potongan ayam dengan bawang putih dan garam selama 30 menit.",
            "Balut ayam dengan adonan tepung basah lalu gulingkan ke tepung kering sambil dicubit-cubit.",
            "Goreng ayam dalam minyak panas hingga berwarna kuning keemasan dan krispi.",
            "Ulek kasar cabai rawit merah, bawang putih mentah, dan garam di cobek, siram dengan minyak jelantah panas lalu geprek ayam di atasnya."
        ]
    },
    "martabak telur": {
        "title": "Martabak Telur Spesial Daging Gurih",
        "description": "Gorengan martabak kulit krispi berlapis telur bebek/ayam berisikan daging cincang berbumbu kari dan daun bawang melimpah.",
        "default_portions": 4,
        "portion_unit": "porsi",
        "scale_basis": 4,
        "ingredients": [
            {
                "name": "Telur Ayam Ras",
                "base_qty": 0.25, # ~4 butir
                "unit": "kg",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Telur Ayam Ras",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Daging Sapi Paha Belakang",
                "base_qty": 0.25,
                "unit": "kg",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Daging Sapi Paha Belakang",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Bawang Merah",
                "base_qty": 0.08,
                "unit": "kg",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Bawang Merah",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Minyak Goreng Minyakita",
                "base_qty": 0.2,
                "unit": "liter",
                "type": "EXACT_DATASET_MATCH",
                "dataset_commodity": "Minyak Goreng Minyakita",
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 0
            },
            {
                "name": "Kulit Martabak / Lumpia & Daun Bawang",
                "base_qty": 1.0,
                "unit": "paket",
                "type": "ADDITIONAL_INGREDIENT",
                "dataset_commodity": None,
                "price_multiplier": 1.0,
                "estimated_unit_price_idr": 10000
            }
        ],
        "steps": [
            "Tumis daging cincang dengan bawang merah, bawang putih, dan bubuk kari hingga matang.",
            "Kocok telur bersama irisan daun bawang tebal, garam, dan tumisan daging.",
            "Bentangkan adonan kulit martabak tipis di atas wajan datar berminyak panas.",
            "Tuang isian telur dan daging ke tengah kulit, lipat rapi membentuk amplop lalu goreng hingga cokelat keemasan krispi."
        ]
    }
}

def extract_portion_from_query(query: str, default_portions: int = 4) -> int:
    """Extract numeric portions from queries like '20 butir', '5 porsi', '10 orang'."""
    match = re.search(r'(\d+)\s*(butir|biji|buah|porsi|orang|pax|kg)', query.lower())
    if match:
        val = int(match.group(1))
        if 1 <= val <= 200:
            return val
    # Look for standalone number
    match_num = re.search(r'\b(\d+)\b', query)
    if match_num:
        val = int(match_num.group(1))
        if 1 <= val <= 100:
            return val
    return default_portions

def parse_with_gemini(query: str, portions: int) -> Optional[Dict[str, Any]]:
    """Mode 1: Dynamic LLM Parser using Google Gemini API."""
    load_dotenv(override=True)
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        return None

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        
        prompt = f"""
Kamu adalah asisten koki cerdas dan ekonom pangan Indonesia 'PanganKu AI'.
Tugasmu adalah mengurai masakan atau permintaan olahan pangan berikut menjadi daftar bahan terukur dan langkah pembuatan singkat.

Permintaan Pengguna: "{query}"
Target Porsi / Jumlah: {portions}

Daftar 12 Komoditas Sembako Dataset PanganKu:
{json.dumps(EXACT_COMMODITIES, ensure_ascii=False)}

Aturan Ketat Pengelompokan Tipe Bahan (type):
1. "EXACT_DATASET_MATCH": Jika bahan tersebut SAMA PERSIS dengan salah satu dari 12 komoditas di atas.
   - dataset_commodity diisi nama persis komoditas tersebut.
   - unit: "kg" atau "liter".
   - price_multiplier: 1.0
   - estimated_unit_price_idr: 0
2. "PROXY_DATASET_MATCH": Jika bahan sejenis hewan ternak, unggas, beras khusus, atau bumbu yang harganya berkorelasi kuat dengan salah satu komoditas sembako.
   - Contoh: Telur Bebek (proxy ke Telur Ayam Ras, multiplier 1.25, unit kg), Daging Kambing (proxy ke Daging Sapi Paha Belakang, multiplier 1.10, unit kg), Ikan Laut (proxy ke Daging Ayam Ras, multiplier 0.85, unit kg), Beras Ketan (proxy ke Beras Premium, multiplier 1.20, unit kg), Bawang Bombay (proxy ke Bawang Merah, multiplier 0.90, unit kg).
   - dataset_commodity diisi komoditas induknya.
   - unit: "kg" atau "liter".
   - estimated_unit_price_idr: 0
3. "ADDITIONAL_INGREDIENT": Bumbu dapur tambahan, garam krosok, abu gosok, santan, kecap, sayuran pelengkap, tepung, air, dll.
   - dataset_commodity: null
   - price_multiplier: 1.0
   - estimated_unit_price_idr: berikan estimasi harga pasar wajar per satuan unit dalam Rupiah (contoh santan Rp 15000/liter, garam Rp 8000/kg, kecap Rp 22000/liter, air Rp 0).

Berikan output JSON murni dengan format persis:
{{
  "recipe_title": "Nama Masakan Menarik",
  "recipe_description": "Deskripsi singkat 1-2 kalimat tentang masakan ini",
  "portions": {portions},
  "portion_label": "{portions} porsi / butir",
  "steps": [
    "Langkah 1...",
    "Langkah 2...",
    "Langkah 3...",
    "Langkah 4..."
  ],
  "ingredients": [
    {{
      "name": "Nama Bahan",
      "quantity": 0.5,
      "unit": "kg",
      "type": "EXACT_DATASET_MATCH" | "PROXY_DATASET_MATCH" | "ADDITIONAL_INGREDIENT",
      "dataset_commodity": "Nama Komoditas atau null",
      "price_multiplier": 1.0,
      "estimated_unit_price_idr": 0
    }}
  ]
}}
"""

        candidate_models = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-2.5-flash']
        response = None
        used_model = None

        for model_name in candidate_models:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.2
                    )
                )
                if response and response.text:
                    used_model = model_name
                    break
            except Exception as model_err:
                # Try next model if quota or unavailable
                continue

        if response and response.text:
            cleaned = response.text.strip()
            # If wrapped in markdown ```json
            if cleaned.startswith("```"):
                cleaned = re.sub(r"^```(?:json)?", "", cleaned).strip()
                cleaned = re.sub(r"```$", "", cleaned).strip()
            data = json.loads(cleaned)
            data["engine_mode"] = f"GEMINI_AI ({used_model})"
            return data
    except Exception as e:
        print(f"[Warning] Gemini API call failed or unavailable: {e}")
        return None

    return None

def parse_with_knowledge_base(query: str, requested_portions: int) -> Dict[str, Any]:
    """Mode 2: Smart Local Knowledge Base & Heuristic Fallback."""
    q = query.lower()

    # Check for known catalog dishes
    matched_key = None
    for key in LOCAL_RECIPES_CATALOG.keys():
        if key in q:
            matched_key = key
            break

    # If query mentions telur asin specifically
    if not matched_key:
        if "asin" in q and ("telur" in q or "telor" in q):
            matched_key = "telur asin"
        elif "rendang" in q:
            matched_key = "rendang"
        elif "opor" in q:
            matched_key = "opor ayam"
        elif "soto" in q:
            matched_key = "soto ayam"
        elif "rawon" in q:
            matched_key = "rawon"
        elif "seblak" in q:
            matched_key = "seblak"
        elif "bakso" in q:
            matched_key = "bakso"
        elif "nasi goreng" in q:
            matched_key = "nasi goreng"
        elif "geprek" in q:
            matched_key = "ayam geprek"
        elif "martabak" in q:
            matched_key = "martabak telur"

    if matched_key:
        cat = LOCAL_RECIPES_CATALOG[matched_key]
        scale = requested_portions / float(cat.get("scale_basis", 4))
        scaled_ingredients = []
        for ing in cat["ingredients"]:
            scaled_qty = round(float(ing["base_qty"]) * scale, 3)
            # keep sensible non-zero qty
            scaled_qty = max(0.01, scaled_qty)
            scaled_ingredients.append({
                "name": ing["name"],
                "quantity": scaled_qty,
                "unit": ing["unit"],
                "type": ing["type"],
                "dataset_commodity": ing.get("dataset_commodity"),
                "price_multiplier": ing.get("price_multiplier", 1.0),
                "estimated_unit_price_idr": ing.get("estimated_unit_price_idr", 0)
            })

        return {
            "recipe_title": cat["title"],
            "recipe_description": cat["description"],
            "portions": requested_portions,
            "portion_label": f"{requested_portions} {cat.get('portion_unit', 'porsi')}",
            "engine_mode": "LOCAL_KNOWLEDGE_BASE",
            "steps": cat["steps"],
            "ingredients": scaled_ingredients
        }

    # Heuristic Parser for Free Custom Dishes
    detected_ingredients = []
    
    # Check what keywords appear in query
    has_beef = any(k in q for k in ["sapi", "daging", "buntut", "iga", "rawon", "empal"])
    has_chicken = any(k in q for k in ["ayam", "unggas", "geprek", "sate"])
    has_egg = any(k in q for k in ["telur", "telor", "dadar", "ceplok"])
    has_rice = any(k in q for k in ["nasi", "beras", "bubur", "lontong"])
    has_duck_egg = any(k in q for k in ["bebek", "asin"])
    
    # Scale based on requested portions (default basis: 4 portions)
    ratio = requested_portions / 4.0

    if has_duck_egg:
        detected_ingredients.append({
            "name": "Telur Bebek Mentah",
            "quantity": round(requested_portions * 0.065, 3), # ~65g per egg
            "unit": "kg",
            "type": "PROXY_DATASET_MATCH",
            "dataset_commodity": "Telur Ayam Ras",
            "price_multiplier": 1.25,
            "estimated_unit_price_idr": 0
        })
        detected_ingredients.append({
            "name": "Garam Krosok / Kasar",
            "quantity": round(0.5 * ratio, 2),
            "unit": "kg",
            "type": "ADDITIONAL_INGREDIENT",
            "dataset_commodity": None,
            "price_multiplier": 1.0,
            "estimated_unit_price_idr": 8000
        })
    elif has_beef:
        detected_ingredients.append({
            "name": "Daging Sapi Paha Belakang",
            "quantity": round(0.7 * ratio, 2),
            "unit": "kg",
            "type": "EXACT_DATASET_MATCH",
            "dataset_commodity": "Daging Sapi Paha Belakang",
            "price_multiplier": 1.0,
            "estimated_unit_price_idr": 0
        })
    elif has_chicken:
        detected_ingredients.append({
            "name": "Daging Ayam Ras",
            "quantity": round(0.8 * ratio, 2),
            "unit": "kg",
            "type": "EXACT_DATASET_MATCH",
            "dataset_commodity": "Daging Ayam Ras",
            "price_multiplier": 1.0,
            "estimated_unit_price_idr": 0
        })
    elif has_egg:
        detected_ingredients.append({
            "name": "Telur Ayam Ras",
            "quantity": round(0.3 * ratio, 2),
            "unit": "kg",
            "type": "EXACT_DATASET_MATCH",
            "dataset_commodity": "Telur Ayam Ras",
            "price_multiplier": 1.0,
            "estimated_unit_price_idr": 0
        })

    if has_rice:
        detected_ingredients.append({
            "name": "Beras Medium",
            "quantity": round(0.5 * ratio, 2),
            "unit": "kg",
            "type": "EXACT_DATASET_MATCH",
            "dataset_commodity": "Beras Medium",
            "price_multiplier": 1.0,
            "estimated_unit_price_idr": 0
        })

    # Add standard Indonesian aromatics
    detected_ingredients.extend([
        {
            "name": "Bawang Merah",
            "quantity": round(0.08 * ratio, 2),
            "unit": "kg",
            "type": "EXACT_DATASET_MATCH",
            "dataset_commodity": "Bawang Merah",
            "price_multiplier": 1.0,
            "estimated_unit_price_idr": 0
        },
        {
            "name": "Bawang Putih Honan",
            "quantity": round(0.05 * ratio, 2),
            "unit": "kg",
            "type": "EXACT_DATASET_MATCH",
            "dataset_commodity": "Bawang Putih Honan",
            "price_multiplier": 1.0,
            "estimated_unit_price_idr": 0
        },
        {
            "name": "Cabai Merah Keriting",
            "quantity": round(0.08 * ratio, 2),
            "unit": "kg",
            "type": "EXACT_DATASET_MATCH",
            "dataset_commodity": "Cabai Merah Keriting",
            "price_multiplier": 1.0,
            "estimated_unit_price_idr": 0
        },
        {
            "name": "Minyak Goreng Minyakita",
            "quantity": round(0.15 * ratio, 2),
            "unit": "liter",
            "type": "EXACT_DATASET_MATCH",
            "dataset_commodity": "Minyak Goreng Minyakita",
            "price_multiplier": 1.0,
            "estimated_unit_price_idr": 0
        },
        {
            "name": "Bumbu Dapur Lengkap (Garam, Rempah, Penyedap)",
            "quantity": 1.0,
            "unit": "paket",
            "type": "ADDITIONAL_INGREDIENT",
            "dataset_commodity": None,
            "price_multiplier": 1.0,
            "estimated_unit_price_idr": 5000
        }
    ])

    title_words = [w.capitalize() for w in query.split() if len(w) > 2][:4]
    dish_name = " ".join(title_words) if title_words else "Menu Pilihan Spesial"

    return {
        "recipe_title": f"{dish_name} PanganKu",
        "recipe_description": f"Kreasi masakan '{query}' dengan takaran bumbu dan bahan pokok seimbang untuk {requested_portions} porsi.",
        "portions": requested_portions,
        "portion_label": f"{requested_portions} porsi",
        "engine_mode": "HEURISTIC_PARSER",
        "steps": [
            "Siapkan seluruh bahan utama dan cuci bersih sayuran/daging.",
            "Haluskan bumbu dasar bawang merah, bawang putih, dan cabai merah.",
            "Tumis bumbu halus dengan sedikit minyak hingga harum berminyak.",
            "Masukkan bahan utama, tambahkan bumbu pelengkap dan masak hingga matang meresap sempurna."
        ],
        "ingredients": detected_ingredients
    }

def parse_recipe_query(query: str, requested_portions: Optional[int] = None) -> Dict[str, Any]:
    """Top-level entry point: tries Gemini first, falls back to Smart Local Knowledge Base."""
    portions = requested_portions if (requested_portions and requested_portions > 0) else extract_portion_from_query(query)
    
    # Try Gemini Mode 1
    llm_result = parse_with_gemini(query, portions)
    if llm_result:
        return llm_result

    # Fallback to Mode 2
    return parse_with_knowledge_base(query, portions)

def calculate_recipe_pricing(
    ingredients: List[Dict[str, Any]],
    province: str,
    market_type: str,
    weather_scenario: str,
    demand_scenario: str,
    intervention_scenario: str,
    reg_pipeline,
    clf_pipeline,
    dataset_metadata: Dict[str, Any],
    price_lookup: Dict[str, Dict[str, float]],
    feature_defaults: Dict[str, Any]
) -> Dict[str, Any]:
    """Calculates current and predicted costs for each ingredient using ML models and lookup data."""
    import pandas as pd
    import datetime

    today = datetime.date(2026, 10, 19)
    next_week = today + datetime.timedelta(days=7)
    
    calculated_items = []
    total_current = 0.0
    total_predicted = 0.0
    risk_tiers_seen = []

    for ing in ingredients:
        name = ing.get("name", "Bahan")
        qty = float(ing.get("quantity", 1.0))
        unit = ing.get("unit", "kg")
        ing_type = ing.get("type", "ADDITIONAL_INGREDIENT")
        ds_comm = ing.get("dataset_commodity")
        multiplier = float(ing.get("price_multiplier", 1.0))
        est_price = float(ing.get("estimated_unit_price_idr", 0.0))

        current_unit_price = 0.0
        predicted_unit_price = 0.0
        risk_tier = "Tier 1 - Stable Baseline"
        price_source = "Estimasi Pasar Wajar"

        target_comm = ds_comm if ds_comm in EXACT_COMMODITIES else (name if name in EXACT_COMMODITIES else None)

        if target_comm:
            # Baseline from lookup
            base_price = price_lookup.get(province, {}).get(target_comm)
            if not base_price:
                # Fallback to national average
                base_price = price_lookup.get("NATIONAL", {}).get(target_comm, 25000.0)

            # Build single-row dataframe for ML inference
            feat_prov = feature_defaults.get("province_stats", {}).get(province, {})
            feat_comm = feature_defaults.get("comm_stats", {}).get(target_comm, {})

            inflow = feat_comm.get("inflow", 15.0)
            freight = feat_prov.get("freight", 800.0)
            distance = feat_prov.get("distance", 100.0)
            trader_days = feat_comm.get("stock_days", 4)

            # Weather impact on trader holding & inflow
            if weather_scenario == "Banjir Sentra Hortikultura":
                inflow *= 0.65
                freight *= 1.35
            elif weather_scenario == "Kekeringan Musiman":
                inflow *= 0.80

            row_dict = {
                "province": province,
                "market_type": market_type,
                "commodity_name": target_comm,
                "previous_month_baseline_price_idr": base_price,
                "market_daily_inflow_volume_tons": inflow,
                "logistics_freight_cost_per_kg_idr": freight,
                "weather_shock_severity": weather_scenario,
                "trader_stock_holding_days": trader_days,
                "consumer_purchasing_intensity": demand_scenario,
                "government_market_intervention": intervention_scenario,
                "distance_to_production_hub_km": distance,
                "month": next_week.month,
                "day_of_year": next_week.timetuple().tm_yday
            }

            pred_df = pd.DataFrame([row_dict])
            raw_pred_price = float(reg_pipeline.predict(pred_df)[0])
            raw_pred_risk = str(clf_pipeline.predict(pred_df)[0])

            if ing_type == "EXACT_DATASET_MATCH" or target_comm == name:
                current_unit_price = round(base_price, 2)
                predicted_unit_price = round(raw_pred_price, 2)
                price_source = f"Dataset Aktual {province}"
                risk_tier = raw_pred_risk
            else:
                # PROXY MATCH
                current_unit_price = round(base_price * multiplier, 2)
                predicted_unit_price = round(raw_pred_price * multiplier, 2)
                price_source = f"Proksi {target_comm} (x{multiplier})"
                risk_tier = raw_pred_risk

            risk_tiers_seen.append(risk_tier)
        else:
            # Additional ingredient
            current_unit_price = est_price
            # Mild 1% inflation baseline drift
            predicted_unit_price = round(est_price * 1.01, 2)
            price_source = "Bahan Pelengkap Custom"
            risk_tier = "Tier 1 - Stable Baseline"

        subtotal_curr = round(current_unit_price * qty, 2)
        subtotal_pred = round(predicted_unit_price * qty, 2)

        total_current += subtotal_curr
        total_predicted += subtotal_pred

        calculated_items.append({
            "name": name,
            "quantity": qty,
            "unit": unit,
            "type": ing_type,
            "dataset_commodity": target_comm,
            "price_multiplier": multiplier,
            "current_unit_price_idr": current_unit_price,
            "predicted_unit_price_idr": predicted_unit_price,
            "current_subtotal_idr": subtotal_curr,
            "predicted_subtotal_idr": subtotal_pred,
            "difference_idr": round(subtotal_pred - subtotal_curr, 2),
            "risk_tier": risk_tier,
            "price_source": price_source
        })

    cost_diff = round(total_predicted - total_current, 2)
    pct_change = round((cost_diff / total_current * 100), 2) if total_current > 0 else 0.0

    # Determine highest risk tier
    tier_rank = {
        "Tier 1 - Stable Baseline": 1,
        "Tier 2 - Moderate Price Drift": 2,
        "Tier 3 - High Supply Strain": 3,
        "Tier 4 - Severe Inflationary Spike": 4
    }
    highest_tier = "Tier 1 - Stable Baseline"
    for t in risk_tiers_seen:
        if tier_rank.get(t, 1) > tier_rank.get(highest_tier, 1):
            highest_tier = t

    # AI Rationale Synthesis
    rationale_text = (
        f"Analisis PanganKu AI di {province} ({market_type}): Estimasi total modal belanja bahan hari ini sebesar Rp {total_current:,.0f}, "
        f"dan diproyeksikan menjadi Rp {total_predicted:,.0f} pada minggu depan ({'+' if pct_change >= 0 else ''}{pct_change}%). "
    )
    if weather_scenario != "Kondisi Normal Stabil":
        rationale_text += f"Kondisi cuaca '{weather_scenario}' berdampak pada kenaikan biaya logistik dan penurunan pasokan komoditas hortikultura. "
    if demand_scenario != "Permintaan Normal Stabil":
        rationale_text += f"Intensitas '{demand_scenario}' memicu dorongan harga jangka pendek pada kelompok protein dan beras. "
    if intervention_scenario != "Tidak Ada Intervensi Pasar":
        rationale_text += f"Langkah pemerintah '{intervention_scenario}' membantu meredam lonjakan harga pada level eceran."

    return {
        "items": calculated_items,
        "total_cost_current_idr": round(total_current, 2),
        "total_cost_predicted_idr": round(total_predicted, 2),
        "cost_difference_idr": cost_diff,
        "cost_change_pct": pct_change,
        "overall_risk_tier": highest_tier,
        "ai_rationale": rationale_text
    }

