import sys
import os
import json

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from extract_youtube import fetch_playlist_data

playlists = {
    "react": "https://youtube.com/playlist?list=PLZPZq0r_RZOMQArzyI32mVndGBZ3D99XQ",
    "mongodb": "https://youtube.com/playlist?list=PLZPZq0r_RZONbmOn3EsHac5u5_-Rue3ne",
    "c": "https://youtube.com/playlist?list=PLZPZq0r_RZOOzY_vR4zJM32SqsSInGMwe",
    "java": "https://youtube.com/playlist?list=PLZPZq0r_RZOOj_NOZYq_R2PECIMglLemc",
    "python": "https://www.youtube.com/playlist?list=PLZPZq0r_RZOOkUQbat8LyQii36cJf2SWT"
}

data_dir = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(data_dir, exist_ok=True)

for name, url in playlists.items():
    print(f"Fetching {name}...")
    vids = fetch_playlist_data(url)
    out_path = os.path.join(data_dir, f"{name}_videos.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(vids, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(vids)} videos to {out_path}")

print("Done dumping playlists.")
