import json
import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

data_dir = os.path.join(os.path.dirname(__file__), "data")
for name in ["react", "mongodb", "c", "java", "python"]:
    path = os.path.join(data_dir, f"{name}_videos.json")
    with open(path, encoding="utf-8") as f:
        vids = json.load(f)
    print(f"\n==================== {name.upper()} ({len(vids)} videos) ====================")
    for v in vids:
        print(f"{v['order_number']:02d}. {v['title']} ({v['duration_minutes']}m)")
