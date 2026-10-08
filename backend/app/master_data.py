import os
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(BASE_DIR, "official_ulb_static_data.json")

REGIONS = [
    "Corporation",
    "Chengalpattu Region",
    "Salem region",
    "Vellore Region",
    "Tiruppur Region",
    "Madurai Region",
    "Thanjavur region",
    "Tirunelveli Region"
]

if os.path.exists(JSON_PATH):
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        ULB_DATA = json.load(f)
else:
    ULB_DATA = []
