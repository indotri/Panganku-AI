import json
import math

with open('indonesia-38-raw.geojson', 'r', encoding='utf-8') as f:
    geo = json.load(f)

# Name normalization mapping to match indonesia_harga_sembako_inflasi_enriched.csv
NAME_MAP = {
    'Daerah Istimewa Yogyakarta': 'DI Yogyakarta',
    'Kepulauan Bangka Belitung': 'Bangka Belitung',
    'DKI Jakarta': 'DKI Jakarta'
}

# Bounds for Indonesia
min_lon, max_lon = 94.8, 141.1
min_lat, max_lat = -11.2, 6.2

width = 960
height = 420
padding_x = 20
padding_y = 15

def mercator_y(lat):
    lat = max(min(lat, 85), -85)
    lat_rad = math.radians(lat)
    return math.log(math.tan(math.pi / 4 + lat_rad / 2))

min_my = mercator_y(min_lat)
max_my = mercator_y(max_lat)

def project(lon, lat):
    x = (lon - min_lon) / (max_lon - min_lon) * (width - 2 * padding_x) + padding_x
    my = mercator_y(lat)
    y = (max_my - my) / (max_my - min_my) * (height - 2 * padding_y) + padding_y
    return round(x, 1), round(y, 1)

def simplify_ring(pts, min_dist=0.4):
    if len(pts) <= 4:
        return pts
    result = [pts[0]]
    for pt in pts[1:-1]:
        prev = result[-1]
        dist = math.hypot(pt[0] - prev[0], pt[1] - prev[1])
        if dist >= min_dist:
            result.append(pt)
    result.append(pts[-1])
    return result

provinces_output = []

for feat in geo['features']:
    props = feat['properties']
    raw_name = props.get('PROVINSI') or props.get('NAME_1') or props.get('name')
    standard_name = NAME_MAP.get(raw_name, raw_name)
    
    geom = feat['geometry']
    g_type = geom['type']
    coords = geom['coordinates']
    
    path_commands = []
    all_pts_x = []
    all_pts_y = []
    
    if g_type == 'Polygon':
        coords_list = [coords]
    elif g_type == 'MultiPolygon':
        coords_list = coords
    else:
        continue
        
    for poly in coords_list:
        for ring in poly:
            pts = [project(p[0], p[1]) for p in ring]
            simplified = simplify_ring(pts, min_dist=0.6)
            if len(simplified) >= 3:
                for p in simplified:
                    all_pts_x.append(p[0])
                    all_pts_y.append(p[1])
                cmd = f"M {simplified[0][0]},{simplified[0][1]} " + " ".join([f"L {p[0]},{p[1]}" for p in simplified[1:]]) + " Z"
                path_commands.append(cmd)
                
    full_path = " ".join(path_commands)
    cx = round(sum(all_pts_x) / len(all_pts_x), 1) if all_pts_x else 500
    cy = round(sum(all_pts_y) / len(all_pts_y), 1) if all_pts_y else 200
    
    provinces_output.append({
        'name': standard_name,
        'path': full_path,
        'cx': cx,
        'cy': cy
    })

print(f"Generated SVG paths for {len(provinces_output)} provinces!")

# Write TypeScript file for Next.js frontend
ts_content = f"""// Official 38 Provinces SVG Map Data for Indonesia (WGS84 Projected Mercator)
export interface ProvinceSVG {{
  name: string;
  path: string;
  cx: number;
  cy: number;
}}

export const INDONESIA_38_PROVINCES: ProvinceSVG[] = {json.dumps(provinces_output, ensure_ascii=False, indent=2)};
"""

with open('frontend/components/indonesiaMapData.ts', 'w', encoding='utf-8') as f:
    f.write(ts_content)

print("Saved to frontend/components/indonesiaMapData.ts successfully!")

