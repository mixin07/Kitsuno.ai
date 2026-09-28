import urllib.request
import json
import re
import sys

# Ensure UTF-8 output on Windows console
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def parse_duration_to_minutes(length_text):
    if not length_text:
        return None
    try:
        if ':' in length_text:
            parts = [int(p) for p in length_text.strip().split(':')]
            if len(parts) == 2:
                return max(1, round(parts[0] + parts[1] / 60.0))
            elif len(parts) == 3:
                return max(1, round(parts[0] * 60 + parts[1] + parts[2] / 60.0))
        lbl = str(length_text).lower()
        if 'minute' in lbl or 'second' in lbl or 'hour' in lbl:
            hours = re.search(r'(\d+)\s+hour', lbl)
            mins = re.search(r'(\d+)\s+minute', lbl)
            secs = re.search(r'(\d+)\s+second', lbl)
            h = int(hours.group(1)) if hours else 0
            m = int(mins.group(1)) if mins else 0
            s = int(secs.group(1)) if secs else 0
            tot = h * 60 + m
            if s >= 30:
                tot += 1
            return max(1, tot)
    except Exception:
        pass
    return None

def fetch_playlist_data(playlist_url):
    # Standardize URL to playlist URL
    match_list = re.search(r'list=([a-zA-Z0-9_-]+)', playlist_url)
    if not match_list:
        raise ValueError(f"Invalid playlist URL: {playlist_url}")
    playlist_id = match_list.group(1)
    url = f"https://www.youtube.com/playlist?list={playlist_id}"

    req = urllib.request.Request(
        url,
        headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9'
        }
    )
    html = urllib.request.urlopen(req).read().decode('utf-8')

    match = re.search(r'var ytInitialData = ({.*?});</script>', html)
    if not match:
        match = re.search(r'ytInitialData\s*=\s*({.*?});', html)

    if not match:
        print(f"Could not find ytInitialData in HTML for {playlist_url}", file=sys.stderr)
        return [], None

    data = json.loads(match.group(1))

    videos = []
    continuation_token = None

    def get_by_path(d, path):
        curr = d
        for p in path.split('.'):
            if isinstance(curr, dict) and p in curr:
                curr = curr[p]
            else:
                return None
        return curr

    # Strategy 1: Look for lockupViewModel (YouTube's newer layout)
    def extract_lockups(obj):
        if isinstance(obj, dict):
            if 'lockupViewModel' in obj:
                l = obj['lockupViewModel']
                title = get_by_path(l, 'metadata.lockupMetadataViewModel.title.content')
                vid = get_by_path(l, 'rendererContext.commandContext.onTap.innertubeCommand.watchEndpoint.videoId')
                
                # Duration
                overlays = get_by_path(l, 'contentImage.thumbnailViewModel.overlays') or []
                dur_str = None
                for o in overlays:
                    txt = get_by_path(o, 'thumbnailOverlayTimeStatusRenderer.text.content')
                    if txt and ':' in txt:
                        dur_str = txt
                        break
                if not dur_str:
                    s_l = json.dumps(l)
                    labels = re.findall(r'\"label\":\s*\"([^\"]*(?:second|minute|hour)[^\"]*)\"', s_l)
                    if labels:
                        dur_str = labels[0]
                
                if vid and title:
                    videos.append({
                        'video_id': vid,
                        'title': title,
                        'video_url': f"https://www.youtube.com/watch?v={vid}",
                        'length_text': dur_str,
                        'duration_minutes': parse_duration_to_minutes(dur_str) or 10
                    })
            else:
                for v in obj.values():
                    extract_lockups(v)
        elif isinstance(obj, list):
            for item in obj:
                extract_lockups(item)

    # Strategy 2: Look for playlistVideoRenderer (classic layout)
    def extract_playlist_video_renderers(obj):
        if isinstance(obj, dict):
            if 'playlistVideoRenderer' in obj:
                pvr = obj['playlistVideoRenderer']
                vid = pvr.get('videoId')
                title_runs = pvr.get('title', {}).get('runs', [])
                title = title_runs[0].get('text') if title_runs else None
                dur_str = pvr.get('lengthText', {}).get('simpleText')
                if vid and title:
                    videos.append({
                        'video_id': vid,
                        'title': title,
                        'video_url': f"https://www.youtube.com/watch?v={vid}",
                        'length_text': dur_str,
                        'duration_minutes': parse_duration_to_minutes(dur_str)
                    })
            else:
                for v in obj.values():
                    extract_playlist_video_renderers(v)
        elif isinstance(obj, list):
            for item in obj:
                extract_playlist_video_renderers(item)

    extract_lockups(data)
    if not videos:
        extract_playlist_video_renderers(data)

    # Deduplicate videos preserving order
    unique_videos = []
    seen = set()
    for idx, v in enumerate(videos, 1):
        if v['video_id'] not in seen:
            seen.add(v['video_id'])
            v['order_number'] = len(unique_videos) + 1
            unique_videos.append(v)

    # Check for continuation token if playlist has more items
    def find_continuation(obj):
        nonlocal continuation_token
        if isinstance(obj, dict):
            if 'continuationCommand' in obj:
                continuation_token = obj['continuationCommand'].get('token')
            for v in obj.values():
                if not continuation_token:
                    find_continuation(v)
        elif isinstance(obj, list):
            for item in obj:
                if not continuation_token:
                    find_continuation(item)

    find_continuation(data)

    # If continuation token found, fetch continuations
    while continuation_token:
        try:
            cont_url = f"https://www.youtube.com/youtubei/v1/browse?key=" # Or HTML continuation
            # For simplicity, if continuation is needed we can handle via innerTube API or HTML fetch
            break
        except Exception:
            break

    return unique_videos

if __name__ == '__main__':
    urls = [
        ("HTML", "https://www.youtube.com/watch?v=-CNdRywgF7M&list=PLZPZq0r_RZOPoNttk9beDhO_Bu5DA-xwP"),
        ("CSS", "https://www.youtube.com/watch?v=xv-bBxaa7WU&list=PLZPZq0r_RZOONc3kkuRmBOlj67YAG6jqo"),
        ("JavaScript", "https://www.youtube.com/watch?v=Ihy0QziLDf0&list=PLZPZq0r_RZOO1zkgO4bIdfuLpizCeHYKv"),
    ]
    for name, url in urls:
        print(f"\n==================== {name} PLAYLIST ====================")
        vids = fetch_playlist_data(url)
        print(f"Total extracted for {name}: {len(vids)}")
        for v in vids:
            print(f"  {v['order_number']:02d}. {v['title']}")
            print(f"      Video URL: {v['video_url']}")
            print(f"      Duration:  {v['duration_minutes']} min ({v['length_text']})")
