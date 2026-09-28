import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from extract_youtube import fetch_playlist_data

playlists = {
    "React": "https://youtube.com/playlist?list=PLZPZq0r_RZOMQArzyI32mVndGBZ3D99XQ",
    "MongoDB": "https://youtube.com/playlist?list=PLZPZq0r_RZONbmOn3EsHac5u5_-Rue3ne",
    "C": "https://youtube.com/playlist?list=PLZPZq0r_RZOOzY_vR4zJM32SqsSInGMwe",
    "Java": "https://youtube.com/playlist?list=PLZPZq0r_RZOOj_NOZYq_R2PECIMglLemc",
    "Python": "https://www.youtube.com/playlist?list=PLZPZq0r_RZOOkUQbat8LyQii36cJf2SWT"
}

for name, url in playlists.items():
    vids = fetch_playlist_data(url)
    print(f"\n==================== {name.upper()} ({len(vids)} videos) ====================")
    for v in vids:
        print(f"{v['order_number']:02d}. {v['title']} | {v['duration_minutes']} min | {v['video_url']}")
