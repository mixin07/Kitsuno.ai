"""
Seed and verify all Kitsuno courses, modules, and lessons.
Idempotent script: can be run safely multiple times without creating duplicates.
Catalog contains 9 courses:
1. Introduction to HTML
2. Introduction to CSS
3. Introduction to JavaScript
4. Introduction to React
5. Introduction to Full-Stack Development
6. Introduction to Java
7. Introduction to MongoDB
8. Introduction to C
9. Introduction to Python
"""

import json
import os
import re
import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal
from app.models import Course, Module, Lesson, User, UserRole, CourseDifficulty

DATA_DIR = Path(__file__).parent / "data"

def clean_title(title: str) -> str:
    """Strip trailing emojis and extra whitespace for clean descriptions."""
    # Remove emoji characters
    cleaned = re.sub(r'[\U00010000-\U0010ffff\u2600-\u27bf\ufe0f]', '', title)
    return cleaned.strip()

def load_json(filename: str):
    filepath = DATA_DIR / filename
    if not filepath.exists():
        raise FileNotFoundError(f"Missing data file: {filepath}")
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)

def get_or_create_course(db, title_aliases, default_props):
    query_filters = [Course.title == alias for alias in title_aliases]
    from sqlalchemy import or_
    course = db.query(Course).filter(or_(*query_filters)).first()
    if not course:
        course = Course(
            title=default_props["title"],
            description=default_props["description"],
            thumbnail_url=default_props["thumbnail_url"],
            category=default_props["category"],
            difficulty=default_props["difficulty"],
            instructor_id=default_props["instructor_id"],
            published=default_props.get("published", True),
        )
        db.add(course)
        db.commit()
        db.refresh(course)
        print(f"[CREATED] Course: {course.title} (ID: {course.id})")
    else:
        # Update course metadata to target standard
        course.title = default_props["title"]
        course.description = default_props["description"]
        if default_props.get("thumbnail_url"):
            course.thumbnail_url = default_props["thumbnail_url"]
        if default_props.get("category"):
            course.category = default_props["category"]
        if default_props.get("difficulty"):
            course.difficulty = default_props["difficulty"]
        course.published = default_props.get("published", True)
        db.commit()
        db.refresh(course)
        print(f"[UPDATED] Course: {course.title} (ID: {course.id})")
    return course

def sync_module_lessons(db, module, lessons_data, resource_url, course_title):
    """
    Sync lessons for a module.
    lessons_data is a list of dicts with: video_id, title, video_url, duration_minutes.
    """
    existing_lessons = {l.order_number: l for l in module.lessons}

    for order_num, vdata in enumerate(lessons_data, 1):
        dur = vdata.get("duration_minutes") or 10
        vid_url = vdata.get("video_url") or f"https://www.youtube.com/watch?v={vdata['video_id']}"
        l_title = vdata["title"]
        l_desc = f"Learn {clean_title(l_title)} in {course_title}."

        if order_num in existing_lessons:
            lesson = existing_lessons[order_num]
            lesson.title = l_title
            lesson.description = l_desc
            lesson.video_url = vid_url
            lesson.resource_url = resource_url
            lesson.duration_minutes = dur
        else:
            lesson = Lesson(
                module_id=module.id,
                title=l_title,
                description=l_desc,
                content="",
                video_url=vid_url,
                resource_url=resource_url,
                duration_minutes=dur,
                order_number=order_num,
            )
            db.add(lesson)

    # Clean up any leftover lessons if module had more than new count
    if len(existing_lessons) > len(lessons_data):
        for order_num in range(len(lessons_data) + 1, len(existing_lessons) + 1):
            if order_num in existing_lessons:
                db.delete(existing_lessons[order_num])

    db.commit()
    db.refresh(module)

def seed_all():
    db = SessionLocal()
    try:
        # Determine instructor ID
        instructor = db.query(User).filter(User.role == UserRole.INSTRUCTOR).first()
        if not instructor:
            instructor = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if not instructor:
            instructor = db.query(User).first()
        if not instructor:
            raise RuntimeError("No users found in database to assign as course instructor.")
        instructor_id = instructor.id
        print(f"Using instructor ID: {instructor_id} ({instructor.email})")

        # Load video datasets
        react_vids = load_json("react_videos.json")
        mongodb_vids = load_json("mongodb_videos.json")
        c_vids = load_json("c_videos.json")
        java_vids = load_json("java_videos.json")
        py_vids = load_json("python_videos.json")

        # =========================================================================
        # 1. Introduction to HTML (Preserved)
        # =========================================================================
        html_course = get_or_create_course(
            db,
            ["Introduction to HTML", "Introduction to HTML & Web Fundamentals", "HTML Basics"],
            {
                "title": "Introduction to HTML",
                "description": "Learn the fundamentals of HTML, including document structure, semantic elements, headings, links, images, forms, tables, and accessible page structure.",
                "thumbnail_url": "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&auto=format&fit=crop",
                "category": "Frontend Foundation",
                "difficulty": CourseDifficulty.BEGINNER,
                "instructor_id": instructor_id,
                "published": True,
            }
        )

        # =========================================================================
        # 2. Introduction to CSS (Preserved)
        # =========================================================================
        css_course = get_or_create_course(
            db,
            ["Introduction to CSS", "Introduction to CSS & Responsive Design", "CSS Explorer"],
            {
                "title": "Introduction to CSS",
                "description": "Learn how to style web pages using CSS, including selectors, the box model, colors, typography, Flexbox, Grid, responsive layouts, transitions, and basic animations.",
                "thumbnail_url": "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop",
                "category": "Styling & Layouts",
                "difficulty": CourseDifficulty.BEGINNER,
                "instructor_id": instructor_id,
                "published": True,
            }
        )

        # =========================================================================
        # 3. Introduction to JavaScript (Preserved)
        # =========================================================================
        js_course = get_or_create_course(
            db,
            ["Introduction to JavaScript", "Introduction to JavaScript Programming", "JavaScript Forest"],
            {
                "title": "Introduction to JavaScript",
                "description": "Learn JavaScript fundamentals including variables, data types, functions, arrays, objects, conditions, loops, DOM manipulation, events, and basic asynchronous programming.",
                "thumbnail_url": "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800&auto=format&fit=crop",
                "category": "Logic & Interactivity",
                "difficulty": CourseDifficulty.INTERMEDIATE,
                "instructor_id": instructor_id,
                "published": True,
            }
        )

        # =========================================================================
        # 4. Introduction to React (Updated in-place with 20 videos, 3 modules)
        # =========================================================================
        react_course = get_or_create_course(
            db,
            ["Introduction to React", "Introduction to React Development", "React Mountain"],
            {
                "title": "Introduction to React",
                "description": "Master modern React frontend development including components, JSX, props, state management with hooks, conditional rendering, list handling, custom hooks, and full interactive projects.",
                "thumbnail_url": "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop",
                "category": "Modern UI Architecture",
                "difficulty": CourseDifficulty.BEGINNER,
                "instructor_id": instructor_id,
                "published": True,
            }
        )

        react_module_defs = [
            (1, "React Components & Core UI", "Core component architecture, JSX syntax, custom styling, props passing, and conditional rendering.", 0, 6),
            (2, "State Management & Event Handling", "Interactive UI patterns, click events, useState hook, controlled inputs, and state array/object updates.", 6, 15),
            (3, "Advanced Hooks & Projects", "Lifecycle effects with useEffect, context API, mutable references with useRef, and building complete web applications.", 15, 20),
        ]

        # Sync modules for React
        react_mods = {m.order_number: m for m in react_course.modules}
        # If there were old extra modules, remove them
        for order_num, mod in list(react_mods.items()):
            if order_num > len(react_module_defs):
                db.delete(mod)
        db.commit()

        for mod_num, mod_title, mod_desc, start_i, end_i in react_module_defs:
            if mod_num in react_mods and react_mods[mod_num] in db:
                mod = react_mods[mod_num]
                mod.title = mod_title
                mod.description = mod_desc
            else:
                mod = Module(
                    course_id=react_course.id,
                    title=mod_title,
                    description=mod_desc,
                    order_number=mod_num,
                )
                db.add(mod)
                db.commit()
                db.refresh(mod)
            sync_module_lessons(
                db,
                mod,
                react_vids[start_i:end_i],
                "https://react.dev/learn",
                react_course.title
            )
        print(f"  + Synced 3 modules and 20 lessons for {react_course.title}")

        # =========================================================================
        # 5. Introduction to Full-Stack Development (Preserved + Updated description + Module 4 React)
        # =========================================================================
        full_stack_course = get_or_create_course(
            db,
            ["Introduction to Full-Stack Development", "Introduction to Full Stack Web Development", "Full Stack Web Development"],
            {
                "title": "Introduction to Full-Stack Development",
                "description": "Learn the fundamentals of full-stack web development by combining HTML, CSS, JavaScript, React, APIs, Backend, Databases, Authentication, and Deployment fundamentals.",
                "thumbnail_url": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop",
                "category": "Web Development",
                "difficulty": CourseDifficulty.BEGINNER,
                "instructor_id": instructor_id,
                "published": True,
            }
        )

        # Check Module 4 for React in Full-Stack
        fs_mods = {m.order_number: m for m in full_stack_course.modules}
        if 4 not in fs_mods:
            fs_react_mod = Module(
                course_id=full_stack_course.id,
                title="React Frontend Development",
                description="Modern declarative UI development with React components, hooks, state, and client-side interactions.",
                order_number=4,
            )
            db.add(fs_react_mod)
            db.commit()
            db.refresh(fs_react_mod)
        else:
            fs_react_mod = fs_mods[4]
            fs_react_mod.title = "React Frontend Development"
            fs_react_mod.description = "Modern declarative UI development with React components, hooks, state, and client-side interactions."
            db.commit()

        sync_module_lessons(
            db,
            fs_react_mod,
            react_vids,
            "https://react.dev/learn",
            full_stack_course.title
        )
        print(f"  + Synced React module for {full_stack_course.title}")

        # =========================================================================
        # 6. Introduction to Java (New, 71 videos, 5 modules)
        # =========================================================================
        java_course = get_or_create_course(
            db,
            ["Introduction to Java", "Java Basics", "Java Programming"],
            {
                "title": "Introduction to Java",
                "description": "Master the fundamentals of Java programming, including variables, data types, control flow, methods, object-oriented programming (OOP), data structures, and file handling.",
                "thumbnail_url": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop",
                "category": "Programming",
                "difficulty": CourseDifficulty.BEGINNER,
                "instructor_id": instructor_id,
                "published": True,
            }
        )

        java_module_defs = [
            (1, "Java Fundamentals & User Input", "Setting up Java, basic syntax, variables, user input with Scanner, arithmetic operators, and basic math.", 0, 10),
            (2, "Control Flow & Decision Logic", "Conditionals, printf formatting, string methods, switch statements, logical operators, and loop structures.", 10, 25),
            (3, "Methods, Scope & Arrays", "Writing modular methods, method overloading, variable scope, 1D/2D arrays, and interactive console projects.", 25, 38),
            (4, "Object-Oriented Programming (OOP)", "Core OOP principles: classes, constructors, static keyword, inheritance, polymorphism, encapsulation, and abstraction.", 38, 55),
            (5, "Data Structures, File I/O & Concurrency", "ArrayLists, HashMaps, exception handling, reading/writing files, generics, enums, and multithreading.", 55, 71),
        ]

        java_mods = {m.order_number: m for m in java_course.modules}
        for mod_num, mod_title, mod_desc, start_i, end_i in java_module_defs:
            if mod_num in java_mods:
                mod = java_mods[mod_num]
                mod.title = mod_title
                mod.description = mod_desc
            else:
                mod = Module(
                    course_id=java_course.id,
                    title=mod_title,
                    description=mod_desc,
                    order_number=mod_num,
                )
                db.add(mod)
                db.commit()
                db.refresh(mod)
            sync_module_lessons(
                db,
                mod,
                java_vids[start_i:end_i],
                "https://docs.oracle.com/en/java/",
                java_course.title
            )
        print(f"  + Synced 5 modules and 71 lessons for {java_course.title}")

        # =========================================================================
        # 7. Introduction to MongoDB (New, 12 videos, 3 modules)
        # =========================================================================
        mongo_course = get_or_create_course(
            db,
            ["Introduction to MongoDB", "MongoDB Basics", "MongoDB for Beginners"],
            {
                "title": "Introduction to MongoDB",
                "description": "Learn the core concepts of MongoDB NoSQL database, including document structure, CRUD operations, query operators, indexing, and collection management.",
                "thumbnail_url": "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop",
                "category": "Databases",
                "difficulty": CourseDifficulty.BEGINNER,
                "instructor_id": instructor_id,
                "published": True,
            }
        )

        mongo_module_defs = [
            (1, "MongoDB Fundamentals & Setup", "Introduction to NoSQL databases, installing MongoDB, and working with mongosh shell.", 0, 2),
            (2, "CRUD Operations & Data Types", "Inserting, finding, updating, and deleting documents, understanding BSON data types, and sorting/limiting results.", 2, 8),
            (3, "Query Operators & Indexing", "Advanced comparison and logical query operators, collection indexing for performance, and collection administration.", 8, 12),
        ]

        mongo_mods = {m.order_number: m for m in mongo_course.modules}
        for mod_num, mod_title, mod_desc, start_i, end_i in mongo_module_defs:
            if mod_num in mongo_mods:
                mod = mongo_mods[mod_num]
                mod.title = mod_title
                mod.description = mod_desc
            else:
                mod = Module(
                    course_id=mongo_course.id,
                    title=mod_title,
                    description=mod_desc,
                    order_number=mod_num,
                )
                db.add(mod)
                db.commit()
                db.refresh(mod)
            sync_module_lessons(
                db,
                mod,
                mongodb_vids[start_i:end_i],
                "https://www.mongodb.com/docs/",
                mongo_course.title
            )
        print(f"  + Synced 3 modules and 12 lessons for {mongo_course.title}")

        # =========================================================================
        # 8. Introduction to C (New, 46 videos, 5 modules)
        # =========================================================================
        c_course = get_or_create_course(
            db,
            ["Introduction to C", "C Basics", "C Programming"],
            {
                "title": "Introduction to C",
                "description": "Explore low-level programming with the C language, covering variables, memory, control structures, functions, arrays, pointers, structs, and dynamic memory allocation.",
                "thumbnail_url": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop",
                "category": "Programming",
                "difficulty": CourseDifficulty.BEGINNER,
                "instructor_id": instructor_id,
                "published": True,
            }
        )

        c_module_defs = [
            (1, "C Basics & Operators", "Introduction to C compilation, variables, data types, format specifiers, constants, arithmetic operators, and user input.", 0, 10),
            (2, "Control Flow & Decision Making", "If-else statements, switch statements, temperature converters, calculators, and logical operators.", 10, 17),
            (3, "Functions, Loops & Algorithms", "Function prototypes, variable scope, while and for loops, break/continue, random numbers, and console mini-games.", 17, 29),
            (4, "Arrays & Strings", "One-dimensional arrays, 2D matrices, array traversal, string handling, and building a multi-question quiz game.", 29, 34),
            (5, "Pointers, Memory & Structs", "TypeDef, enums, structs, memory addresses, pointer dereferencing, file I/O, and dynamic memory allocation.", 34, 46),
        ]

        c_mods = {m.order_number: m for m in c_course.modules}
        for mod_num, mod_title, mod_desc, start_i, end_i in c_module_defs:
            if mod_num in c_mods:
                mod = c_mods[mod_num]
                mod.title = mod_title
                mod.description = mod_desc
            else:
                mod = Module(
                    course_id=c_course.id,
                    title=mod_title,
                    description=mod_desc,
                    order_number=mod_num,
                )
                db.add(mod)
                db.commit()
                db.refresh(mod)
            sync_module_lessons(
                db,
                mod,
                c_vids[start_i:end_i],
                "https://en.cppreference.com/w/c",
                c_course.title
            )
        print(f"  + Synced 5 modules and 46 lessons for {c_course.title}")

        # =========================================================================
        # 9. Introduction to Python (New, 93 videos, 5 modules)
        # =========================================================================
        py_course = get_or_create_course(
            db,
            ["Introduction to Python", "Python Basics", "Python Programming"],
            {
                "title": "Introduction to Python",
                "description": "Build a strong foundation in Python programming, covering syntax, data types, collections, functions, object-oriented programming, file I/O, and GUI application development.",
                "thumbnail_url": "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format&fit=crop",
                "category": "Programming",
                "difficulty": CourseDifficulty.BEGINNER,
                "instructor_id": instructor_id,
                "published": True,
            }
        )

        py_module_defs = [
            (1, "Python Basics & Control Flow", "Syntax, variables, type casting, input handling, arithmetic operators, math functions, conditional logic, and string indexing.", 0, 15),
            (2, "Loops & Data Collections", "While/for loops, nested loops, lists, sets, tuples, 2D collections, dictionaries, random generation, and interactive programs.", 15, 31),
            (3, "Functions, Modules & Logic", "Custom functions, default/keyword arguments, *args and **kwargs, iterables, list comprehensions, match-case, and modules.", 31, 46),
            (4, "Object-Oriented Programming (OOP)", "Classes, class variables, inheritance, abstract classes, polymorphism, static/class methods, magic methods, and decorators.", 46, 65),
            (5, "Advanced Python, Files & PyQt5 GUI", "Exception handling, file I/O, multithreading, API requests, and building desktop GUI apps with PyQt5.", 65, 93),
        ]

        py_mods = {m.order_number: m for m in py_course.modules}
        for mod_num, mod_title, mod_desc, start_i, end_i in py_module_defs:
            if mod_num in py_mods:
                mod = py_mods[mod_num]
                mod.title = mod_title
                mod.description = mod_desc
            else:
                mod = Module(
                    course_id=py_course.id,
                    title=mod_title,
                    description=mod_desc,
                    order_number=mod_num,
                )
                db.add(mod)
                db.commit()
                db.refresh(mod)
            sync_module_lessons(
                db,
                mod,
                py_vids[start_i:end_i],
                "https://docs.python.org/3/tutorial/",
                py_course.title
            )
        print(f"  + Synced 5 modules and 93 lessons for {py_course.title}")

        print("\nAll 9 courses verified and synced successfully!")
    finally:
        db.close()

    # Automatically sync quiz assessments for all courses
    try:
        from scripts.seed_quizzes import seed_quizzes
        seed_quizzes()
    except Exception as e:
        print(f"Quiz seeding hook note: {e}")

if __name__ == "__main__":
    seed_all()
