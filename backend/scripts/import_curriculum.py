import argparse
import json
import re
import sys
import urllib.request
import urllib.parse
from datetime import datetime

# Force UTF-8 encoding for Windows console output
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Playlist URLs
PLAYLISTS = [
    ("HTML", "https://www.youtube.com/watch?v=-CNdRywgF7M&list=PLZPZq0r_RZOPoNttk9beDhO_Bu5DA-xwP"),
    ("CSS", "https://www.youtube.com/watch?v=xv-bBxaa7WU&list=PLZPZq0r_RZOONc3kkuRmBOlj67YAG6jqo"),
    ("JavaScript", "https://www.youtube.com/watch?v=Ihy0QziLDf0&list=PLZPZq0r_RZOO1zkgO4bIdfuLpizCeHYKv"),
]

# Comprehensive Keyword -> Verified MDN / JavaScript.info Documentation Mappings
DOC_MAPPINGS = [
    ("html tutorial for beginners", "https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML/Getting_started"),
    ("hyperlinks", "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a"),
    ("images", "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img"),
    ("audio", "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio"),
    ("video", "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video"),
    ("text formatting", "https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML/HTML_text_basics"),
    ("lists", "https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML/Advanced_text_formatting"),
    ("tables", "https://developer.mozilla.org/en-US/docs/Learn/HTML/Tables/Basics"),
    ("colors", "https://developer.mozilla.org/en-US/docs/Web/HTML/Applying_color"),
    ("span & div", "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/div"),
    ("meta tags", "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta"),
    ("iframes", "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe"),
    ("buttons", "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button"),
    ("forms", "https://developer.mozilla.org/en-US/docs/Learn/Forms/Your_first_form"),

    ("css tutorial for beginners", "https://developer.mozilla.org/en-US/docs/Learn/CSS/First_steps/Getting_started"),
    ("font", "https://developer.mozilla.org/en-US/docs/Web/CSS/font-family"),
    ("border", "https://developer.mozilla.org/en-US/docs/Web/CSS/border"),
    ("shadow", "https://developer.mozilla.org/en-US/docs/Web/CSS/box-shadow"),
    ("margin", "https://developer.mozilla.org/en-US/docs/Web/CSS/margin"),
    ("padding", "https://developer.mozilla.org/en-US/docs/Web/CSS/padding"),
    ("float", "https://developer.mozilla.org/en-US/docs/Web/CSS/float"),
    ("overflow", "https://developer.mozilla.org/en-US/docs/Web/CSS/overflow"),
    ("display", "https://developer.mozilla.org/en-US/docs/Web/CSS/display"),
    ("height", "https://developer.mozilla.org/en-US/docs/Web/CSS/height"),
    ("width", "https://developer.mozilla.org/en-US/docs/Web/CSS/width"),
    ("position", "https://developer.mozilla.org/en-US/docs/Web/CSS/position"),
    ("background", "https://developer.mozilla.org/en-US/docs/Web/CSS/background"),
    ("flexbox", "https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Flexbox"),
    ("grid", "https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Grids"),
    ("selector", "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_selectors"),
    ("pseudo-class", "https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-classes"),
    ("pseudo-element", "https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-elements"),
    ("transform", "https://developer.mozilla.org/en-US/docs/Web/CSS/transform"),
    ("transition", "https://developer.mozilla.org/en-US/docs/Web/CSS/transition"),
    ("animation", "https://developer.mozilla.org/en-US/docs/Web/CSS/animation"),
    ("media quer", "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Using_media_queries"),

    ("javascript tutorial for beginners", "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/First_steps/Getting_started"),
    ("variable", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#declarations"),
    ("arithmetic", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Expressions_and_operators#arithmetic_operators"),
    ("user input", "https://developer.mozilla.org/en-US/docs/Web/API/Window/prompt"),
    ("type conversion", "https://developer.mozilla.org/en-US/docs/Glossary/Type_conversion"),
    ("const", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const"),
    ("counter", "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/First_steps/A_first_splash"),
    ("math object", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math"),
    ("random number", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random"),
    ("random password", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random"),
    ("if statement", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/if...else"),
    ("checked property", "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox#checked"),
    ("ternary", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Conditional_operator"),
    ("switch", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/switch"),
    ("string method", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String"),
    ("string slicing", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/slice"),
    ("method chaining", "https://javascript.info/object#method-chaining"),
    ("logical operator", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Expressions_and_operators#logical_operators"),
    ("strict equality", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Strict_equality"),
    ("while loop", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/while"),
    ("for loop", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for"),
    ("guessing game", "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/First_steps/A_first_splash"),
    ("temperature", "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/First_steps/A_first_splash"),
    ("2d array", "https://javascript.info/array#multidimensional-arrays"),
    ("array of object", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array"),
    ("array", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array"),
    ("spread operator", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax"),
    ("rest parameter", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters"),
    ("dice roller", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random"),
    ("callback hell", "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Promises"),
    ("callback", "https://developer.mozilla.org/en-US/docs/Glossary/Callback_function"),
    ("foreach", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach"),
    ("map()", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map"),
    ("filter()", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter"),
    ("reduce()", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce"),
    ("function expression", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/function"),
    ("arrow function", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions"),
    ("nested object", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects"),
    ("object", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects"),
    ("this", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this"),
    ("constructor", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/constructor"),
    ("static", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/static"),
    ("inheritance", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain"),
    ("super", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/super"),
    ("getter", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects#defining_getters_and_setters"),
    ("destructuring", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment"),
    ("sort", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort"),
    ("shuffle", "https://javascript.info/task/shuffle"),
    ("date", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date"),
    ("closure", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures"),
    ("settimeout", "https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout"),
    ("console.time", "https://developer.mozilla.org/en-US/docs/Web/API/console/time_static"),
    ("format currency", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat"),
    ("compound interest", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/pow"),
    ("digital clock", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date"),
    ("stopwatch", "https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval"),
    ("es6 module", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules"),
    ("asynchronous", "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Introducing"),
    ("error handling", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling"),
    ("calculator", "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/First_steps/A_first_splash"),
    ("dom explained", "https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction"),
    ("element selector", "https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector"),
    ("dom navigation", "https://developer.mozilla.org/en-US/docs/Web/API/Node"),
    ("add/change html", "https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement"),
    ("mouse event", "https://developer.mozilla.org/en-US/docs/Web/API/Element/click_event"),
    ("key event", "https://developer.mozilla.org/en-US/docs/Web/API/Element/keydown_event"),
    ("hide and show", "https://developer.mozilla.org/en-US/docs/Web/CSS/display"),
    ("nodelist", "https://developer.mozilla.org/en-US/docs/Web/API/NodeList"),
    ("classlist", "https://developer.mozilla.org/en-US/docs/Web/API/Element/classList"),
    ("rock paper scissors", "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/First_steps/A_first_splash"),
    ("image slider", "https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval"),
    ("promise", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise"),
    ("async/await", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function"),
    ("json", "https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/JSON"),
    ("cookie", "https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie"),
    ("fetch", "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch"),
    ("weather app", "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch"),
    ("class", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes"),
    ("function", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions")
]

def parse_duration_to_minutes(length_text):
    if not length_text:
        return None
    try:
        parts = [int(p) for p in length_text.strip().split(':')]
        if len(parts) == 2:
            return max(1, round(parts[0] + parts[1] / 60.0))
        elif len(parts) == 3:
            return max(1, round(parts[0] * 60 + parts[1] + parts[2] / 60.0))
    except Exception:
        pass
    return None

def find_duration_in_dict(obj):
    s = json.dumps(obj)
    matches = re.findall(r'\"(?:text|content|label)\":\s*\"(\d{1,2}:\d{2}(?:\:\d{2})?)\"', s)
    if matches:
        return matches[0]
    matches = re.findall(r'\"(\d{1,2}:\d{2}(?:\:\d{2})?)\"', s)
    if matches:
        return matches[0]
    return None

def fetch_playlist_videos(playlist_url):
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
        return []

    data = json.loads(match.group(1))
    videos = []

    def find_lockups(obj):
        if isinstance(obj, dict):
            if 'lockupViewModel' in obj:
                yield obj['lockupViewModel']
            for v in obj.values():
                yield from find_lockups(v)
        elif isinstance(obj, list):
            for item in obj:
                yield from find_lockups(item)

    for l in find_lockups(data):
        title = l.get('metadata', {}).get('lockupMetadataViewModel', {}).get('title', {}).get('content')
        vid = l.get('rendererContext', {}).get('commandContext', {}).get('onTap', {}).get('innertubeCommand', {}).get('watchEndpoint', {}).get('videoId')
        dur_str = find_duration_in_dict(l)

        if vid and title:
            videos.append({
                'video_id': vid,
                'title': title,
                'video_url': f"https://www.youtube.com/watch?v={vid}",
                'length_text': dur_str,
                'duration_minutes': parse_duration_to_minutes(dur_str)
            })

    # Deduplicate keeping original playlist order
    unique_videos = []
    seen = set()
    for v in videos:
        if v['video_id'] not in seen:
            seen.add(v['video_id'])
            v['order_number'] = len(unique_videos) + 1
            unique_videos.append(v)

    return unique_videos

def match_documentation(title):
    t_lower = title.lower()
    t_clean = re.sub(r'[^\w\s]', '', t_lower)

    for keyword, url in DOC_MAPPINGS:
        if keyword in t_lower or keyword in t_clean:
            return url
    
    if "html" in t_lower:
        return "https://developer.mozilla.org/en-US/docs/Web/HTML"
    elif "css" in t_lower:
        return "https://developer.mozilla.org/en-US/docs/Web/CSS"
    elif "javascript" in t_lower or "js" in t_lower:
        return "https://developer.mozilla.org/en-US/docs/Web/JavaScript"
    return "https://developer.mozilla.org/en-US/docs/Web"

def generate_description(title, module_name):
    clean_title = title
    for prefix in ["Learn ", "What is ", "What are ", "How to ", "Build this ", "Create a "]:
        if clean_title.startswith(prefix):
            clean_title = clean_title[len(prefix):]
            break
    clean_title = re.sub(r'[^\w\s\&\-\+\(\)]', '', clean_title).strip()
    return f"Learn fundamental concepts of {clean_title} in {module_name}."

def check_existing_db():
    try:
        from app.database import SessionLocal
        from app.models import Course, Module, Lesson
        
        db = SessionLocal()
        existing_course = db.query(Course).filter(Course.title == "Full Stack Web Development").first()
        
        existing_modules = {}
        existing_lessons = set()
        
        if existing_course:
            modules = db.query(Module).filter(Module.course_id == existing_course.id).all()
            for m in modules:
                existing_modules[m.title] = m
                lessons = db.query(Lesson).filter(Lesson.module_id == m.id).all()
                for l in lessons:
                    existing_lessons.add((m.id, l.order_number, l.title, l.video_url))
        
        db.close()
        return existing_course, existing_modules, existing_lessons
    except Exception:
        return None, {}, set()

def main():
    parser = argparse.ArgumentParser(description="Full Stack Web Development Curriculum Importer")
    parser.add_argument("--import", dest="do_import", action="store_true", help="Execute the database import (Default is dry-run)")
    args = parser.parse_args()

    is_dry_run = not args.do_import

    print("=========================================================================")
    print("        KITSUNO.AI CURRICULUM IMPORTER — FULL STACK WEB DEVELOPMENT       ")
    print("=========================================================================")
    print(f"MODE: {'[DRY RUN — NO DATABASE CHANGES]' if is_dry_run else '[LIVE DB IMPORT]'}\n")

    course_title = "Full Stack Web Development"
    course_desc = "Master modern web development from HTML5 structure and CSS3 styling to advanced ES6+ JavaScript, DOM manipulation, async programming, and API integration."

    existing_course, existing_modules, existing_lessons = check_existing_db()

    total_modules = len(PLAYLISTS)
    total_lessons = 0
    lessons_with_video = 0
    lessons_with_doc = 0
    missing_docs = 0
    missing_durations = 0
    potential_duplicates = 0

    if existing_course:
        print(f"[SKIP] Existing course: \"{course_title}\" (ID: {existing_course.id})")
        potential_duplicates += 1
    else:
        print(f"[CREATE] Course: \"{course_title}\"")

    curriculum_data = []

    for mod_order, (mod_title, playlist_url) in enumerate(PLAYLISTS, 1):
        mod_existing = existing_modules.get(mod_title)
        if mod_existing:
            print(f"  [SKIP] Existing module: \"{mod_title}\" (ID: {mod_existing.id})")
            potential_duplicates += 1
        else:
            print(f"  [CREATE] Module: \"{mod_title}\" (Order: {mod_order})")

        videos = fetch_playlist_videos(playlist_url)
        mod_lessons = []

        for v in videos:
            total_lessons += 1
            if v['video_url']:
                lessons_with_video += 1
            doc_url = match_documentation(v['title'])
            if doc_url:
                lessons_with_doc += 1
            else:
                missing_docs += 1

            if v['duration_minutes'] is None:
                missing_durations += 1

            desc = generate_description(v['title'], mod_title)

            lesson_item = {
                'order_number': v['order_number'],
                'title': v['title'],
                'description': desc,
                'content': "",
                'video_url': v['video_url'],
                'resource_url': doc_url,
                'duration_minutes': v['duration_minutes'] or 5,
                'length_text': v['length_text']
            }
            mod_lessons.append(lesson_item)

            if mod_existing and (mod_existing.id, v['order_number'], v['title'], v['video_url']) in existing_lessons:
                potential_duplicates += 1

        curriculum_data.append({
            'module_title': mod_title,
            'order_number': mod_order,
            'lessons': mod_lessons
        })

    # Print Detailed Dry Run Preview
    print("\n-------------------------------------------------------------------------")
    print("                       FULL CURRICULUM PREVIEW                           ")
    print("-------------------------------------------------------------------------\n")

    print(f"COURSE: {course_title.upper()}")
    print(f"Description: {course_desc}\n")

    for mod in curriculum_data:
        print(f"MODULE {mod['order_number']}: {mod['module_title'].upper()}")
        print(f"Total Lessons: {len(mod['lessons'])}")
        print("-" * 65)
        for l in mod['lessons']:
            print(f"  {l['order_number']:02d}. {l['title']}")
            print(f"      Video: {l['video_url']} ({l['length_text']} -> {l['duration_minutes']} min)")
            print(f"      Docs:  {l['resource_url']}")
            print(f"      Desc:  {l['description']}")
        print()

    # Print Summary Statistics
    print("=========================================================================")
    print("                         SUMMARY STATISTICS                              ")
    print("=========================================================================")
    print(f"Total modules:           {total_modules}")
    print(f"Total lessons:           {total_lessons}")
    print(f"Lessons with videos:     {lessons_with_video}")
    print(f"Lessons with docs:       {lessons_with_doc}")
    print(f"Missing documentation:   {missing_docs}")
    print(f"Missing durations:       {missing_durations}")
    print(f"Potential duplicates:    {potential_duplicates}")
    print("=========================================================================\n")

    if is_dry_run:
        print(">>> DRY RUN COMPLETE. No changes were made to the database.")
        print(">>> To perform the actual import after approval, run:")
        print(">>> python scripts/import_curriculum.py --import\n")
        return

    # Perform DB import if --import flag was provided
    print("\n>>> PERFORMING DATABASE IMPORT...")
    try:
        from app.database import SessionLocal
        from app.models import Course, Module, Lesson, User, UserRole, CourseDifficulty
        
        db = SessionLocal()
        
        instructor = db.query(User).filter(User.role.in_([UserRole.INSTRUCTOR, UserRole.ADMIN])).first()
        if not instructor:
            print("ERROR: No instructor or admin user found in database to assign course ownership.", file=sys.stderr)
            return

        course = db.query(Course).filter(Course.title == course_title).first()
        if not course:
            course = Course(
                title=course_title,
                description=course_desc,
                thumbnail_url="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop",
                category="Web Development",
                difficulty=CourseDifficulty.BEGINNER,
                instructor_id=instructor.id,
                published=True
            )
            db.add(course)
            db.commit()
            db.refresh(course)
            print(f"Created course: {course.title} (ID: {course.id})")
        else:
            print(f"[SKIP] Course already exists: {course.title}")

        for mod_data in curriculum_data:
            module = db.query(Module).filter(
                Module.course_id == course.id,
                Module.title == mod_data['module_title']
            ).first()

            if not module:
                module = Module(
                    course_id=course.id,
                    title=mod_data['module_title'],
                    description=f"{mod_data['module_title']} core concepts and practical exercises.",
                    order_number=mod_data['order_number']
                )
                db.add(module)
                db.commit()
                db.refresh(module)
                print(f"Created module: {module.title} (ID: {module.id})")
            else:
                print(f"[SKIP] Module already exists: {module.title}")

            for l_data in mod_data['lessons']:
                existing_lesson = db.query(Lesson).filter(
                    Lesson.module_id == module.id,
                    Lesson.order_number == l_data['order_number']
                ).first()

                if not existing_lesson:
                    lesson = Lesson(
                        module_id=module.id,
                        title=l_data['title'],
                        description=l_data['description'],
                        content=l_data['content'],
                        video_url=l_data['video_url'],
                        resource_url=l_data['resource_url'],
                        duration_minutes=l_data['duration_minutes'],
                        order_number=l_data['order_number']
                    )
                    db.add(lesson)
                    print(f"  + Added lesson [{l_data['order_number']:02d}]: {l_data['title']}")
                else:
                    print(f"  [SKIP] Lesson already exists: {l_data['title']}")

            db.commit()

        print("\n>>> DATABASE IMPORT COMPLETED SUCCESSFULLY!")
        db.close()
    except Exception as e:
        print(f"ERROR during import: {e}", file=sys.stderr)

if __name__ == '__main__':
    main()
