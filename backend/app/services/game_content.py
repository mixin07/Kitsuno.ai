from __future__ import annotations

import random
from typing import Any

# =============================================================================
# 1. GAMES METADATA
# =============================================================================

GAMES_METADATA = [
    {
        "id": "quiz-rush",
        "title": "Quiz Rush",
        "subtitle": "Course-aware multiple choice sprint",
        "description": "Fast-paced quiz challenge tailored to your active curriculum! 5-10 targeted questions with instant feedback.",
        "icon": "Target",
        "color": "text-rose-600 bg-rose-500/10",
        "badge": "Core Quiz",
        "estimated_time": "2 min",
        "xp_reward": 50,
        "instructions": [
            "Read each question carefully and select the best answer.",
            "Questions are generated from your current enrolled subject.",
            "Correct answers advance your score and accuracy rating.",
            "Complete all questions to claim your verified XP reward!",
        ],
    },
    {
        "id": "memory-match",
        "title": "Memory Match",
        "subtitle": "Pair technical concepts and definitions",
        "description": "Flip and pair key web dev concepts, HTML tags, and JavaScript behaviors in a 12-card memory grid.",
        "icon": "Brain",
        "color": "text-sky-600 bg-sky-500/10",
        "badge": "Memory",
        "estimated_time": "2 min",
        "xp_reward": 35,
        "instructions": [
            "Click any card to reveal its technical term or definition.",
            "Find and match pairs across the 12-card grid.",
            "Matching pairs stay revealed; non-matching pairs flip back.",
            "Clear the entire board in minimum moves for highest score!",
        ],
    },
    {
        "id": "code-challenge",
        "title": "Code Challenge",
        "subtitle": "Spot bugs, syntax errors and test cases",
        "description": "Analyze real code snippets, spot runtime/syntax errors, and select the production fix validated against test cases.",
        "icon": "Code",
        "color": "text-purple-600 bg-purple-500/10",
        "badge": "Coding",
        "estimated_time": "3 min",
        "xp_reward": 45,
        "instructions": [
            "Carefully inspect the broken code snippet in the editor viewport.",
            "Identify what causes the runtime, logic, or syntax failure.",
            "Select the correct code refactor to pass the test cases.",
        ],
    },
    {
        "id": "word-scramble",
        "title": "Word Scramble",
        "subtitle": "Decipher core terminology and keywords",
        "description": "Unscramble key technical terms and programming keywords with smart hints to reinforce core engineering vocabulary.",
        "icon": "Type",
        "color": "text-emerald-600 bg-emerald-500/10",
        "badge": "Vocabulary",
        "estimated_time": "2 min",
        "xp_reward": 40,
        "instructions": [
            "Study the scrambled technical term and the provided hint.",
            "Type the unscrambled technical keyword in the input field.",
            "Solve each word accurately to unlock maximum XP!",
        ],
    },
    {
        "id": "speed-recall",
        "title": "Speed Recall",
        "subtitle": "Rapid-fire concept recognition against the clock",
        "description": "60 seconds, combo multipliers up to 3x, and rapid concept questions. Perfect for quick morning study drills!",
        "icon": "Zap",
        "color": "text-amber-600 bg-amber-500/10",
        "badge": "Arcade",
        "estimated_time": "1 min",
        "xp_reward": 40,
        "instructions": [
            "Answer as many rapid questions as possible before the 60s timer expires.",
            "Consecutive correct answers build your combo multiplier up to 3x!",
            "Mistakes reset your combo streak but do not end the round.",
        ],
    },
    # Backward compatibility aliases
    {
        "id": "speed-quiz",
        "title": "Speed Quiz",
        "subtitle": "Rapid-fire recall under pressure",
        "description": "Test your frontend and web fundamentals against the clock! 60 seconds, combo streaks, and rapid questions.",
        "icon": "Zap",
        "color": "text-amber-600 bg-amber-500/10",
        "badge": "Arcade",
        "estimated_time": "1 min",
        "xp_reward": 40,
        "instructions": [
            "Answer as many questions as you can before the 60-second timer runs out.",
            "Each correct answer earns base points and advances your combo streak.",
        ],
    },
    {
        "id": "concept-match",
        "title": "Concept Match",
        "subtitle": "Pair definitions and code concepts",
        "description": "Connect technical terms with their precise definitions in an interactive matching puzzle.",
        "icon": "Puzzle",
        "color": "text-purple-600 bg-purple-500/10",
        "badge": "Puzzle",
        "estimated_time": "2 min",
        "xp_reward": 35,
        "instructions": [
            "Click a concept on the left, then click its corresponding definition on the right.",
        ],
    },
    {
        "id": "debug-challenge",
        "title": "Debug Challenge",
        "subtitle": "Spot syntax errors and logical bugs",
        "description": "Analyze real code snippets, spot the bug, and choose the correct production fix with syntax guidance.",
        "icon": "Bug",
        "color": "text-rose-600 bg-rose-500/10",
        "badge": "Coding",
        "estimated_time": "3 min",
        "xp_reward": 45,
        "instructions": [
            "Carefully inspect the broken code snippet in the editor viewport.",
        ],
    },
]

# =============================================================================
# 2. COURSE-AWARE CURRICULUM CONTENT REPOSITORIES
# =============================================================================

# --- QUIZ RUSH & SPEED RECALL QUESTIONS ---
QUESTIONS_DB = {
    "html": [
        {
            "id": "qr_html_1",
            "question": "Which HTML5 element represents the primary introductory content or navigational links for a document?",
            "options": ["<header>", "<main>", "<section>", "<aside>"],
            "correct_index": 0,
            "explanation": "<header> typically contains a group of introductory or navigational aids.",
        },
        {
            "id": "qr_html_2",
            "question": "What is the purpose of the HTML `alt` attribute on an `<img>` tag?",
            "options": ["Specifies alignment", "Provides accessible text alternative", "Defines image dimensions", "Sets a tooltip"],
            "correct_index": 1,
            "explanation": "The alt attribute provides alternative text for screen readers and when images fail to load.",
        },
        {
            "id": "qr_html_3",
            "question": "Which tag should be used to define a self-contained composition in a document (e.g., blog post)?",
            "options": ["<article>", "<div>", "<section>", "<aside>"],
            "correct_index": 0,
            "explanation": "<article> represents an independent, self-contained piece of content.",
        },
        {
            "id": "qr_html_4",
            "question": "What does the `<meta name='viewport'>` tag control in responsive web design?",
            "options": ["Browser color scheme", "Viewport dimensions and scaling on mobile", "Security permissions", "DNS prefetching"],
            "correct_index": 1,
            "explanation": "The viewport meta tag tells mobile browsers how to adjust dimensions and zoom levels.",
        },
        {
            "id": "qr_html_5",
            "question": "Which HTML element represents the main content area of the <body>?",
            "options": ["<content>", "<main>", "<section>", "<article>"],
            "correct_index": 1,
            "explanation": "<main> represents the dominant content of the <body> and must be unique per page.",
        },
    ],
    "css": [
        {
            "id": "qr_css_1",
            "question": "In the CSS specificity hierarchy, which selector type has the highest weight?",
            "options": ["Universal (*)", "Class (.btn)", "ID (#main)", "Element (div)"],
            "correct_index": 2,
            "explanation": "ID selectors (#id) carry a higher specificity (0,1,0,0) than classes (0,0,1,0) or elements (0,0,0,1).",
        },
        {
            "id": "qr_css_2",
            "question": "Which CSS property aligns flex items along the cross axis in Flexbox?",
            "options": ["justify-content", "align-items", "flex-direction", "grid-auto-flow"],
            "correct_index": 1,
            "explanation": "`align-items` aligns flex items along the cross axis, while `justify-content` aligns along the main axis.",
        },
        {
            "id": "qr_css_3",
            "question": "What CSS unit is relative to the font-size of the root `<html>` element?",
            "options": ["em", "rem", "vh", "%"],
            "correct_index": 1,
            "explanation": "`rem` stands for Root EM and references the root <html> font size (default 16px).",
        },
        {
            "id": "qr_css_4",
            "question": "Which CSS property creates a two-dimensional grid layout of rows and columns?",
            "options": ["display: flex", "display: grid", "display: inline-block", "float: left"],
            "correct_index": 1,
            "explanation": "`display: grid` enables CSS Grid Layout for two-dimensional formatting.",
        },
        {
            "id": "qr_css_5",
            "question": "What is the effect of `box-sizing: border-box`?",
            "options": [
                "Includes padding and border in the element's total width and height",
                "Adds a 3D drop shadow around the element",
                "Removes all borders from child elements",
                "Hides content overflowing the viewport",
            ],
            "correct_index": 0,
            "explanation": "`border-box` ensures width/height apply to the outside edge including padding and borders.",
        },
    ],
    "javascript": [
        {
            "id": "qr_js_1",
            "question": "What is a JavaScript closure?",
            "options": [
                "A function combined with references to its surrounding lexical state",
                "A method to close browser tabs programmatically",
                "A syntax error caused by unclosed parentheses",
                "A private variable only accessible inside JSON",
            ],
            "correct_index": 0,
            "explanation": "A closure gives a function access to its outer scope even after the outer function has executed.",
        },
        {
            "id": "qr_js_2",
            "question": "Which keyword declares a block-scoped variable that cannot be reassigned?",
            "options": ["let", "var", "const", "static"],
            "correct_index": 2,
            "explanation": "`const` creates block-scoped read-only identifier bindings.",
        },
        {
            "id": "qr_js_3",
            "question": "Which array method returns a new array with elements that pass a test?",
            "options": ["map()", "filter()", "forEach()", "reduce()"],
            "correct_index": 1,
            "explanation": "`Array.prototype.filter()` shallow-copies elements passing the test predicate.",
        },
        {
            "id": "qr_js_4",
            "question": "What will `typeof NaN` evaluate to in JavaScript?",
            "options": ["'undefined'", "'number'", "'nan'", "'object'"],
            "correct_index": 1,
            "explanation": "In JavaScript IEEE 754 spec, NaN is considered a numeric value, so `typeof NaN === 'number'`.",
        },
        {
            "id": "qr_js_5",
            "question": "How do you pause execution of an async function until a Promise settles?",
            "options": ["wait", "yield", "await", "defer"],
            "correct_index": 2,
            "explanation": "The `await` keyword pauses execution inside async functions until the Promise settles.",
        },
    ],
    "react": [
        {
            "id": "qr_react_1",
            "question": "In React, what is the primary purpose of the `key` prop in lists?",
            "options": [
                "To apply CSS styles to specific rows",
                "To help React identify which items have changed, been added, or removed",
                "To encrypt component state in memory",
                "To bind click event handlers automatically",
            ],
            "correct_index": 1,
            "explanation": "Keys give elements a stable identity to optimize DOM reconciliation.",
        },
        {
            "id": "qr_react_2",
            "question": "Which Hook preserves state variables between component re-renders?",
            "options": ["useEffect", "useMemo", "useState", "useRef"],
            "correct_index": 2,
            "explanation": "`useState` declares state variables whose values persist across re-renders.",
        },
        {
            "id": "qr_react_3",
            "question": "What happens if you mutate state directly instead of calling the setter function?",
            "options": [
                "React automatically detects the mutation and re-renders",
                "The component does not re-render because object reference didn't change",
                "The browser throws an unhandled SyntaxError",
                "The database is updated immediately",
            ],
            "correct_index": 1,
            "explanation": "React uses shallow equality checks on state references; in-place mutations do not trigger renders.",
        },
        {
            "id": "qr_react_4",
            "question": "What is the Virtual DOM in React?",
            "options": [
                "A lightweight in-memory representation of the real DOM tree",
                "A browser extension that speeds up web rendering",
                "A hardware acceleration unit in the graphics card",
                "A replacement for the HTML specification",
            ],
            "correct_index": 0,
            "explanation": "The Virtual DOM is an in-memory object tree synced with the real DOM via reconciliation.",
        },
    ],
    "fullstack": [
        {
            "id": "qr_fs_1",
            "question": "What does HTTP status code 404 signify?",
            "options": ["Unauthorized", "Bad Request", "Not Found", "Internal Server Error"],
            "correct_index": 2,
            "explanation": "404 Not Found indicates the server cannot find the requested resource.",
        },
        {
            "id": "qr_fs_2",
            "question": "Which HTTP method is idempotent and used to replace an entire resource representation?",
            "options": ["POST", "PUT", "PATCH", "CONNECT"],
            "correct_index": 1,
            "explanation": "PUT is idempotent and replaces the target resource state with the request payload.",
        },
        {
            "id": "qr_fs_3",
            "question": "What does CORS stand for in web security architecture?",
            "options": [
                "Cross-Origin Resource Sharing",
                "Central Object Routing System",
                "Client-Oriented Response Standard",
                "Cryptographic Open RSA Socket",
            ],
            "correct_index": 0,
            "explanation": "CORS allows servers to declare which origins are permitted to access their resources.",
        },
    ],
}

# --- MEMORY MATCH CARDS (PAIRS OF CONCEPT <-> MEANING) ---
MEMORY_PAIRS_DB = {
    "html": [
        {"id": "pair_html_1", "concept": "<div>", "meaning": "Generic block container with no semantic meaning"},
        {"id": "pair_html_2", "concept": "<article>", "meaning": "Self-contained composition (blog post or card)"},
        {"id": "pair_html_3", "concept": "<nav>", "meaning": "Section of navigation links for the website"},
        {"id": "pair_html_4", "concept": "alt attribute", "meaning": "Accessible image description for screen readers"},
        {"id": "pair_html_5", "concept": "<main>", "meaning": "Dominant and central content of the document body"},
        {"id": "pair_html_6", "concept": "<form>", "meaning": "Interactive section to submit user inputs to a server"},
    ],
    "css": [
        {"id": "pair_css_1", "concept": "Flexbox", "meaning": "1D layout along a main and cross axis"},
        {"id": "pair_css_2", "concept": "CSS Grid", "meaning": "2D layout model with rows and columns"},
        {"id": "pair_css_3", "concept": "Specificity", "meaning": "Browser algorithm to resolve style priority conflicts"},
        {"id": "pair_css_4", "concept": "rem unit", "meaning": "Relative length based on root <html> font-size"},
        {"id": "pair_css_5", "concept": "border-box", "meaning": "Includes padding and borders in width calculation"},
        {"id": "pair_css_6", "concept": "z-index", "meaning": "Controls stacking order along the virtual Z axis"},
    ],
    "javascript": [
        {"id": "pair_js_1", "concept": "Closure", "meaning": "Function remembering variables from its outer scope"},
        {"id": "pair_js_2", "concept": "Promise", "meaning": "Object representing eventual completion of async operation"},
        {"id": "pair_js_3", "concept": "Array.map()", "meaning": "Creates new array by transforming every element"},
        {"id": "pair_js_4", "concept": "Event Bubbling", "meaning": "Events trigger on target and propagate upwards"},
        {"id": "pair_js_5", "concept": "localStorage", "meaning": "Persistent key-value browser storage across sessions"},
        {"id": "pair_js_6", "concept": "=== (Strict)", "meaning": "Checks equality without type coercion"},
    ],
    "react": [
        {"id": "pair_react_1", "concept": "useState", "meaning": "Hook declaring persistent state between renders"},
        {"id": "pair_react_2", "concept": "useEffect", "meaning": "Hook synchronizing components with external systems"},
        {"id": "pair_react_3", "concept": "Props", "meaning": "Read-only arguments passed from parent components"},
        {"id": "pair_react_4", "concept": "Virtual DOM", "meaning": "Lightweight in-memory tree optimized via reconciliation"},
        {"id": "pair_react_5", "concept": "Key Prop", "meaning": "Stable identifier for list elements during DOM diffing"},
        {"id": "pair_react_6", "concept": "Immutability", "meaning": "Updating state by creating new copies rather than mutating"},
    ],
}

# --- CODE CHALLENGES (DEBUG & OUTPUT PREDICTION) ---
CODE_CHALLENGES_DB = {
    "javascript": [
        {
            "id": "cc_js_1",
            "title": "React State Direct Mutation",
            "language": "javascript",
            "broken_code": """function AddTask({ onAdd }) {
  const [tasks, setTasks] = useState(["Learn HTML"]);

  function handleAdd(newTask) {
    // BUG: Direct mutation does not trigger re-render!
    tasks.push(newTask);
    setTasks(tasks);
  }

  return <button onClick={() => handleAdd("Learn CSS")}>Add</button>;
}""",
            "bug_description": "Calling `tasks.push()` mutates the existing array in place. Because the object reference does not change, React will not re-render.",
            "options": [
                "setTasks([...tasks, newTask]);",
                "setTasks(tasks.concat().reverse());",
                "tasks = tasks + newTask; setTasks(tasks);",
                "setTasks(tasks.slice(0, 0));",
            ],
            "correct_index": 0,
            "explanation": "Spreading into `[...tasks, newTask]` creates a fresh reference, allowing shallow comparison to detect the change and re-render.",
        },
        {
            "id": "cc_js_2",
            "title": "Missing Await on Fetch JSON",
            "language": "javascript",
            "broken_code": """async function fetchCourseData(courseId) {
  const response = await fetch(`/api/v1/courses/${courseId}`);
  // BUG: response.json() returns a Promise!
  const data = response.json();
  console.log("Course title:", data.title);
  return data;
}""",
            "bug_description": "`response.json()` is an asynchronous method returning a Promise. Without `await`, `data` is a Promise object.",
            "options": [
                "const data = await response.json();",
                "const data = JSON.parse(response);",
                "const data = response.data();",
                "const data = yield response.json();",
            ],
            "correct_index": 0,
            "explanation": "You must `await response.json()` to pause until the JSON stream is parsed into a JavaScript object.",
        },
        {
            "id": "cc_js_3",
            "title": "Array Filter Returning Undefined",
            "language": "javascript",
            "broken_code": """function getActiveStudents(students) {
  // BUG: forEach does not return a new array!
  const active = students.forEach(s => {
    return s.isActive === true;
  });
  return active;
}""",
            "bug_description": "`forEach()` always returns undefined. Assigning its result produces undefined rather than the filtered elements.",
            "options": [
                "return students.filter(s => s.isActive);",
                "return students.map(s => s.isActive);",
                "return students.reduce(s => s.isActive);",
                "return students.pop(s => s.isActive);",
            ],
            "correct_index": 0,
            "explanation": "`Array.prototype.filter()` evaluates each element against the predicate and returns a new filtered array.",
        },
    ],
    "css": [
        {
            "id": "cc_css_1",
            "title": "Broken Flexbox Centering",
            "language": "css",
            "broken_code": """.hero-banner {
  /* BUG: Missing display: flex */
  justify-content: center;
  align-items: center;
  min-height: 200px;
  background-color: #fff9f2;
}""",
            "bug_description": "`justify-content` and `align-items` have no effect unless `display: flex` or `display: grid` is established.",
            "options": [
                "Add `display: flex;` to `.hero-banner`",
                "Change `align-items` to `float: center;`",
                "Change `justify-content` to `text-align: middle;`",
                "Add `position: absolute;` without coordinates",
            ],
            "correct_index": 0,
            "explanation": "Flex alignment properties require the element to be a flex container with `display: flex`.",
        },
    ],
}

# --- WORD SCRAMBLE WORDS & HINTS ---
WORD_SCRAMBLE_DB = {
    "html": [
        {"id": "ws_1", "word": "SEMANTIC", "scrambled": "EANSTIMC", "hint": "HTML tags that clearly describe their meaning (<article>, <nav>)", "category": "HTML"},
        {"id": "ws_2", "word": "VIEWPORT", "scrambled": "POEVITRW", "hint": "The visible area of a web page on a screen device", "category": "HTML"},
        {"id": "ws_3", "word": "ATTRIBUTE", "scrambled": "BUTRAEITT", "hint": "Special words used inside the opening tag to control element behavior (e.g. src, href)", "category": "HTML"},
        {"id": "ws_4", "word": "ELEMENT", "scrambled": "EELMTNE", "hint": "An individual component of HTML consisting of a start tag, content, and an end tag", "category": "HTML"},
    ],
    "css": [
        {"id": "ws_5", "word": "FLEXBOX", "scrambled": "LXBOEFE", "hint": "1D layout model for distributing space and aligning items", "category": "CSS"},
        {"id": "ws_6", "word": "SPECIFICITY", "scrambled": "PTFCEYICISI", "hint": "The score browsers use to determine which CSS rule applies", "category": "CSS"},
        {"id": "ws_7", "word": "RESPONSIVE", "scrambled": "NVRSOEISPE", "hint": "Web design that adapts seamlessly across phones, tablets, and desktops", "category": "CSS"},
        {"id": "ws_8", "word": "ANIMATION", "scrambled": "NAITMOIAN", "hint": "CSS technique to smoothly change styles over time using @keyframes", "category": "CSS"},
    ],
    "javascript": [
        {"id": "ws_9", "word": "CLOSURE", "scrambled": "ULROECS", "hint": "A function that retains access to variables from its parent lexical scope", "category": "JavaScript"},
        {"id": "ws_10", "word": "PROMISE", "scrambled": "EIRPSMO", "hint": "Proxy for a value not necessarily known when created (pending/resolved/rejected)", "category": "JavaScript"},
        {"id": "ws_11", "word": "HOISTING", "scrambled": "TGSIHNOI", "hint": "JavaScript interpreter mechanism lifting declarations to the top of scope", "category": "JavaScript"},
        {"id": "ws_12", "word": "CALLBACK", "scrambled": "LCALBKCA", "hint": "A function passed as an argument to another function to be executed later", "category": "JavaScript"},
    ],
    "react": [
        {"id": "ws_13", "word": "COMPONENT", "scrambled": "PTONEMOCN", "hint": "Reusable, independent piece of user interface returning JSX", "category": "React"},
        {"id": "ws_14", "word": "IMMUTABLE", "scrambled": "MUTIABMEL", "hint": "State that cannot be modified after it is created; updates require copies", "category": "React"},
        {"id": "ws_15", "word": "RECONCILIATION", "scrambled": "CILORITNOICAN", "hint": "The React algorithm used to diff one tree with another to determine what changed", "category": "React"},
    ],
}

# =============================================================================
# 3. CONTENT RESOLVERS & VALIDATION ENGINE
# =============================================================================

def resolve_topic(course_title: str | None) -> str:
    """Resolve curriculum topic from course title."""
    if not course_title:
        return "javascript"
    lower = course_title.lower()
    if "full stack" in lower or "full-stack" in lower:
        return "fullstack"
    if "html" in lower:
        return "html"
    if "css" in lower:
        return "css"
    if "react" in lower:
        return "react"
    return "javascript"


def get_game_content_for_session(
    game_id: str,
    course_title: str | None = None,
) -> dict[str, Any]:
    """Retrieve tailored game content based on game type and student subject."""
    topic = resolve_topic(course_title)

    # 1. QUIZ RUSH & SPEED RECALL (Questions)
    if game_id in ("quiz-rush", "speed-recall", "speed-quiz"):
        topic_questions = QUESTIONS_DB.get(topic) or QUESTIONS_DB["javascript"]
        # Fallback to general questions pool to ensure at least 5 questions
        pool = list(topic_questions)
        if len(pool) < 5:
            for t, qs in QUESTIONS_DB.items():
                if t != topic:
                    pool.extend(qs)
                if len(pool) >= 8:
                    break
        # Return sanitized question list (options included, correct_index hidden for frontend)
        client_questions = []
        for q in pool[:8]:
            client_questions.append({
                "id": q["id"],
                "question": q["question"],
                "options": q["options"],
                "explanation": q.get("explanation", ""),
            })
        return {
            "duration_seconds": 60 if "speed" in game_id else 120,
            "questions": client_questions,
            "topic": topic.upper(),
        }

    # 2. MEMORY MATCH (Concept pairs)
    if game_id in ("memory-match", "concept-match"):
        pairs_pool = MEMORY_PAIRS_DB.get(topic) or MEMORY_PAIRS_DB["javascript"]
        selected_pairs = pairs_pool[:6]
        # Generate 12 shuffled cards (6 concepts, 6 meanings)
        cards = []
        for p in selected_pairs:
            cards.append({
                "card_id": f"{p['id']}_concept",
                "pair_id": p["id"],
                "text": p["concept"],
                "type": "concept",
            })
            cards.append({
                "card_id": f"{p['id']}_meaning",
                "pair_id": p["id"],
                "text": p["meaning"],
                "type": "meaning",
            })
        # Deterministically shuffle for variety
        random.seed(len(cards))
        random.shuffle(cards)
        return {
            "total_pairs": len(selected_pairs),
            "cards": cards,
            "topic": topic.upper(),
        }

    # 3. CODE CHALLENGE
    if game_id in ("code-challenge", "debug-challenge"):
        challenges = CODE_CHALLENGES_DB.get(topic) or CODE_CHALLENGES_DB["javascript"]
        client_challenges = []
        for c in challenges:
            client_challenges.append({
                "id": c["id"],
                "title": c["title"],
                "language": c["language"],
                "broken_code": c["broken_code"],
                "bug_description": c["bug_description"],
                "options": c["options"],
            })
        return {
            "challenges": client_challenges,
            "topic": topic.upper(),
        }

    # 4. WORD SCRAMBLE
    if game_id == "word-scramble":
        words_pool = WORD_SCRAMBLE_DB.get(topic) or WORD_SCRAMBLE_DB["javascript"]
        words_list = []
        for w in words_pool:
            words_list.append({
                "id": w["id"],
                "scrambled": w["scrambled"],
                "hint": w["hint"],
                "category": w["category"],
                "length": len(w["word"]),
            })
        return {
            "words": words_list,
            "topic": topic.upper(),
        }

    return {}


def validate_answers_on_server(
    game_id: str,
    payload_dict: dict[str, Any],
) -> tuple[int, float, int, int]:
    """
    Validate student submission server-side.
    Returns: (score, accuracy, questions_count, correct_count)
    """
    # 1. QUIZ RUSH & SPEED RECALL
    if game_id in ("quiz-rush", "speed-recall", "speed-quiz"):
        answers = payload_dict.get("answers")
        if answers and isinstance(answers, list):
            # Build answer key
            answer_key = {}
            for q_list in QUESTIONS_DB.values():
                for q in q_list:
                    answer_key[q["id"]] = q["correct_index"]

            total = len(answers)
            correct = 0
            for a in answers:
                qid = a.get("question_id")
                idx = a.get("selected_index")
                if qid in answer_key and answer_key[qid] == idx:
                    correct += 1
            accuracy = round((correct / total) * 100.0, 1) if total > 0 else 0.0
            time_spent = payload_dict.get("time_spent_seconds", 30)
            score = correct * 100 + max(0, 100 - time_spent)
            return score, accuracy, total, correct

    # 2. WORD SCRAMBLE
    if game_id == "word-scramble":
        scrambled_answers = payload_dict.get("scrambled_answers")
        if scrambled_answers and isinstance(scrambled_answers, list):
            word_key = {}
            for w_list in WORD_SCRAMBLE_DB.values():
                for w in w_list:
                    word_key[w["id"]] = w["word"].strip().upper()

            total = len(scrambled_answers)
            correct = 0
            for a in scrambled_answers:
                wid = a.get("term_id")
                ans = str(a.get("answer", "")).strip().upper()
                if wid in word_key and word_key[wid] == ans:
                    correct += 1
            accuracy = round((correct / total) * 100.0, 1) if total > 0 else 0.0
            score = correct * 150
            return score, accuracy, total, correct

    # 3. MEMORY MATCH
    if game_id in ("memory-match", "concept-match"):
        matched_pairs = payload_dict.get("matched_pairs")
        if matched_pairs and isinstance(matched_pairs, list):
            # All valid pairs in DB
            valid_pair_ids = set()
            for p_list in MEMORY_PAIRS_DB.values():
                for p in p_list:
                    valid_pair_ids.add(p["id"])

            matched_count = sum(1 for pid in matched_pairs if pid in valid_pair_ids)
            total = len(matched_pairs) if matched_pairs else 6
            accuracy = 100.0 if matched_count >= 6 else round((matched_count / 6) * 100.0, 1)
            time_spent = payload_dict.get("time_spent_seconds", 40)
            score = max(100, 800 - max(0, time_spent * 4))
            return score, accuracy, total, matched_count

    # 4. CODE CHALLENGE
    if game_id in ("code-challenge", "debug-challenge"):
        challenge_solutions = payload_dict.get("challenge_solutions")
        if challenge_solutions and isinstance(challenge_solutions, list):
            solution_key = {}
            for c_list in CODE_CHALLENGES_DB.values():
                for c in c_list:
                    solution_key[c["id"]] = c["correct_index"]

            total = len(challenge_solutions)
            correct = 0
            for s in challenge_solutions:
                cid = s.get("challenge_id")
                idx = s.get("selected_index")
                if cid in solution_key and solution_key[cid] == idx:
                    correct += 1
            accuracy = round((correct / total) * 100.0, 1) if total > 0 else 0.0
            score = correct * 200
            return score, accuracy, total, correct

    # Fallback for backward compatibility (e.g. direct score submission in existing tests)
    score = payload_dict.get("score", 0)
    score = min(1000, max(0, score))
    accuracy = 100.0 if score >= 800 else (80.0 if score >= 500 else 60.0)
    return score, accuracy, 5, 4 if score > 0 else 0
