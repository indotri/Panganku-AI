import urllib.request
import json

url = 'https://raw.githubusercontent.com/denyherianto/indonesia-geojson-topojson-maps-with-38-provinces/main/GeoJSON/indonesia-38-provinces.geojson'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print('Total features in 38 provinces GeoJSON:', len(data['features']))
        for i, feat in enumerate(data['features']):
            p = feat['properties']
            p_name = p.get('PROVINSI') or p.get('NAME_1') or p.get('name') or list(p.values())[0]
            print(f"{i+1}. {p_name}")
        with open('indonesia-38-raw.geojson', 'w', encoding='utf-8') as f:
            json.dump(data, f)
        print('Successfully saved indonesia-38-raw.geojson!')
except Exception as e:
    print('Error:', e)

