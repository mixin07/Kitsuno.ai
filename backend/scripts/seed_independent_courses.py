import sys
from app.database import SessionLocal
from app.models import Course, Module, Lesson, User, UserRole, CourseDifficulty

def seed():
    db = SessionLocal()
    try:
        full_stack = (
            db.query(Course)
            .filter(
                (Course.title == "Introduction to Full-Stack Development")
                | (Course.title == "Introduction to Full Stack Web Development")
                | (Course.title == "Introduction to Full-Stack Web Development with React")
                | (Course.title == "Full Stack Web Development")
            )
            .first()
        )
        if not full_stack:
            print("Full Stack Web Development course not found.")
            return

        instructor_id = full_stack.instructor_id

        html_mod = next((m for m in full_stack.modules if m.title == "HTML"), None)
        css_mod = next((m for m in full_stack.modules if m.title == "CSS"), None)
        js_mod = next((m for m in full_stack.modules if m.title == "JavaScript"), None)

        # 1. Introduction to HTML
        html_course = (
            db.query(Course)
            .filter(
                (Course.title == "Introduction to HTML")
                | (Course.title == "Introduction to HTML & Web Fundamentals")
                | (Course.title == "HTML Basics")
            )
            .first()
        )
        if not html_course:
            html_course = Course(
                title="Introduction to HTML",
                description="Learn the fundamentals of HTML, including document structure, semantic elements, headings, links, images, forms, tables, and accessible page structure.",
                thumbnail_url="https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&auto=format&fit=crop",
                category="Frontend Foundation",
                difficulty=CourseDifficulty.BEGINNER,
                instructor_id=instructor_id,
                published=True,
            )
            db.add(html_course)
            db.commit()
            db.refresh(html_course)
            print(f"Created course: {html_course.title} (ID: {html_course.id})")

            mod = Module(
                course_id=html_course.id,
                title="HTML Fundamentals",
                description="Core HTML elements, semantic markup, and document structure.",
                order_number=1,
            )
            db.add(mod)
            db.commit()
            db.refresh(mod)

            if html_mod:
                for l in sorted(html_mod.lessons, key=lambda x: x.order_number):
                    lesson = Lesson(
                        module_id=mod.id,
                        title=l.title,
                        description=l.description,
                        content=l.content or "",
                        video_url=l.video_url,
                        resource_url=l.resource_url,
                        duration_minutes=l.duration_minutes or 5,
                        order_number=l.order_number,
                    )
                    db.add(lesson)
                db.commit()
                print(f"  + Added {len(html_mod.lessons)} lessons to {html_course.title}")
        else:
            html_course.title = "Introduction to HTML"
            html_course.description = "Learn the fundamentals of HTML, including document structure, semantic elements, headings, links, images, forms, tables, and accessible page structure."
            db.commit()
            print(f"Course verified/updated: {html_course.title}")

        # 2. Introduction to CSS
        css_course = (
            db.query(Course)
            .filter(
                (Course.title == "Introduction to CSS")
                | (Course.title == "Introduction to CSS & Responsive Design")
                | (Course.title == "CSS Explorer")
            )
            .first()
        )
        if not css_course:
            css_course = Course(
                title="Introduction to CSS",
                description="Learn how to style web pages using CSS, including selectors, the box model, colors, typography, Flexbox, Grid, responsive layouts, transitions, and basic animations.",
                thumbnail_url="https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop",
                category="Styling & Layouts",
                difficulty=CourseDifficulty.BEGINNER,
                instructor_id=instructor_id,
                published=True,
            )
            db.add(css_course)
            db.commit()
            db.refresh(css_course)
            print(f"Created course: {css_course.title} (ID: {css_course.id})")

            mod = Module(
                course_id=css_course.id,
                title="CSS Core & Layouts",
                description="Modern CSS styling, flexbox layouts, grid systems, and animations.",
                order_number=1,
            )
            db.add(mod)
            db.commit()
            db.refresh(mod)

            if css_mod:
                for l in sorted(css_mod.lessons, key=lambda x: x.order_number):
                    lesson = Lesson(
                        module_id=mod.id,
                        title=l.title,
                        description=l.description,
                        content=l.content or "",
                        video_url=l.video_url,
                        resource_url=l.resource_url,
                        duration_minutes=l.duration_minutes or 5,
                        order_number=l.order_number,
                    )
                    db.add(lesson)
                db.commit()
                print(f"  + Added {len(css_mod.lessons)} lessons to {css_course.title}")
        else:
            css_course.title = "Introduction to CSS"
            css_course.description = "Learn how to style web pages using CSS, including selectors, the box model, colors, typography, Flexbox, Grid, responsive layouts, transitions, and basic animations."
            db.commit()
            print(f"Course verified/updated: {css_course.title}")

        # 3. Introduction to JavaScript
        js_course = (
            db.query(Course)
            .filter(
                (Course.title == "Introduction to JavaScript")
                | (Course.title == "Introduction to JavaScript Programming")
                | (Course.title == "JavaScript Forest")
            )
            .first()
        )
        if not js_course:
            js_course = Course(
                title="Introduction to JavaScript",
                description="Learn JavaScript fundamentals including variables, data types, functions, arrays, objects, conditions, loops, DOM manipulation, events, and basic asynchronous programming.",
                thumbnail_url="https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800&auto=format&fit=crop",
                category="Logic & Interactivity",
                difficulty=CourseDifficulty.INTERMEDIATE,
                instructor_id=instructor_id,
                published=True,
            )
            db.add(js_course)
            db.commit()
            db.refresh(js_course)
            print(f"Created course: {js_course.title} (ID: {js_course.id})")

            mod = Module(
                course_id=js_course.id,
                title="JavaScript Fundamentals & DOM",
                description="Programming fundamentals, data structures, DOM manipulation, and asynchronous JS.",
                order_number=1,
            )
            db.add(mod)
            db.commit()
            db.refresh(mod)

            if js_mod:
                for l in sorted(js_mod.lessons, key=lambda x: x.order_number):
                    lesson = Lesson(
                        module_id=mod.id,
                        title=l.title,
                        description=l.description,
                        content=l.content or "",
                        video_url=l.video_url,
                        resource_url=l.resource_url,
                        duration_minutes=l.duration_minutes or 5,
                        order_number=l.order_number,
                    )
                    db.add(lesson)
                db.commit()
                print(f"  + Added {len(js_mod.lessons)} lessons to {js_course.title}")
        else:
            js_course.title = "Introduction to JavaScript"
            js_course.description = "Learn JavaScript fundamentals including variables, data types, functions, arrays, objects, conditions, loops, DOM manipulation, events, and basic asynchronous programming."
            db.commit()
            print(f"Course verified/updated: {js_course.title}")

        # 4. Introduction to React
        react_course = (
            db.query(Course)
            .filter(
                (Course.title == "Introduction to React")
                | (Course.title == "Introduction to React Development")
                | (Course.title == "React Mountain")
            )
            .first()
        )
        if not react_course:
            react_course = Course(
                title="Introduction to React",
                description="Learn the fundamentals of React including components, JSX, props, state, events, hooks, conditional rendering, lists, forms, and building interactive user interfaces.",
                thumbnail_url="https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop",
                category="Modern UI Architecture",
                difficulty=CourseDifficulty.ADVANCED,
                instructor_id=instructor_id,
                published=True,
            )
            db.add(react_course)
            db.commit()
            db.refresh(react_course)
            print(f"Created course: {react_course.title} (ID: {react_course.id})")

            mod = Module(
                course_id=react_course.id,
                title="React Fundamentals & Hooks",
                description="Component architecture, hooks, state management, and modern React patterns.",
                order_number=1,
            )
            db.add(mod)
            db.commit()
            db.refresh(mod)

            react_lessons = [
                ("Introduction to React & Components", "https://www.youtube.com/watch?v=SqcY0GlETPk", 12),
                ("JSX Syntax & Rendering Elements", "https://www.youtube.com/watch?v=7fPXI_MnBOY", 10),
                ("Props & Component Reusability", "https://www.youtube.com/watch?v=m7OWXtbiXX8", 14),
                ("State Management with useState", "https://www.youtube.com/watch?v=O6P86uwfdR0", 15),
                ("Handling Events & Form Inputs", "https://www.youtube.com/watch?v=IkMND33x0qQ", 12),
                ("Side Effects with useEffect", "https://www.youtube.com/watch?v=0ZJgIjIuY7U", 16),
                ("Conditional Rendering & Lists", "https://www.youtube.com/watch?v=7Vo_VCcWupg", 11),
                ("Custom Hooks & Code Organization", "https://www.youtube.com/watch?v=6ThXsUwLWvc", 15),
                ("Context API for Global State", "https://www.youtube.com/watch?v=5LrDIWkK_Bc", 18),
                ("Building & Deploying React Apps", "https://www.youtube.com/watch?v=2-crBg6wppQ", 20),
            ]
            for order, (title, vid_url, dur) in enumerate(react_lessons, 1):
                lesson = Lesson(
                    module_id=mod.id,
                    title=title,
                    description=f"Learn {title} in Introduction to React.",
                    content="",
                    video_url=vid_url,
                    resource_url="https://react.dev/learn",
                    duration_minutes=dur,
                    order_number=order,
                )
                db.add(lesson)
            db.commit()
            print(f"  + Added {len(react_lessons)} lessons to {react_course.title}")
        else:
            react_course.title = "Introduction to React"
            react_course.description = "Learn the fundamentals of React including components, JSX, props, state, events, hooks, conditional rendering, lists, forms, and building interactive user interfaces."
            db.commit()
            print(f"Course verified/updated: {react_course.title}")

        # 5. Introduction to Full-Stack Development
        if full_stack:
            full_stack.title = "Introduction to Full-Stack Development"
            full_stack.description = "Learn the fundamentals of full-stack web development by combining HTML, CSS, JavaScript, React, APIs, backend development, databases, authentication, and deployment fundamentals."
            if not full_stack.thumbnail_url:
                full_stack.thumbnail_url = "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop"
            db.commit()
            print(f"Course verified/updated: {full_stack.title}")

        print("All independent courses verified.")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
