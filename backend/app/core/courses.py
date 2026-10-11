"""
Kitsuno.ai Canonical Approved Course Catalog Definition & Validation Layer.

Only the 9 approved platform courses are permitted in the official curriculum:
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

import re

APPROVED_COURSE_TITLES = [
    "Introduction to HTML",
    "Introduction to CSS",
    "Introduction to JavaScript",
    "Introduction to React",
    "Introduction to Full-Stack Development",
    "Introduction to Java",
    "Introduction to MongoDB",
    "Introduction to C",
    "Introduction to Python",
]


def normalize_course_title(title: str) -> str:
    """Normalize a course title by removing non-ASCII emojis, special delimiters, and whitespace."""
    cleaned = re.sub(r"[\U00010000-\U0010ffff\u2600-\u27bf\ufe0f]", "", title or "")
    cleaned = re.sub(r"[\s\-_]+", " ", cleaned.strip().lower())
    return cleaned


# Normalized map of approved courses
_NORMALIZED_APPROVED = {normalize_course_title(t): t for t in APPROVED_COURSE_TITLES}

# Aliases mapping to standard canonical titles
_TITLE_ALIASES = {
    normalize_course_title("Introduction to HTML & Web Fundamentals"): "Introduction to HTML",
    normalize_course_title("HTML Basics"): "Introduction to HTML",
    normalize_course_title("Introduction to CSS & Responsive Design"): "Introduction to CSS",
    normalize_course_title("CSS Explorer"): "Introduction to CSS",
    normalize_course_title("Introduction to JavaScript Programming"): "Introduction to JavaScript",
    normalize_course_title("JavaScript Forest"): "Introduction to JavaScript",
    normalize_course_title("Introduction to React Development"): "Introduction to React",
    normalize_course_title("React Mountain"): "Introduction to React",
    normalize_course_title("Introduction to Full Stack Web Development"): "Introduction to Full-Stack Development",
    normalize_course_title("Introduction to Full-Stack Web Development with React"): "Introduction to Full-Stack Development",
    normalize_course_title("Full Stack Web Development"): "Introduction to Full-Stack Development",
    normalize_course_title("Java Basics"): "Introduction to Java",
    normalize_course_title("Java Programming"): "Introduction to Java",
    normalize_course_title("MongoDB Basics"): "Introduction to MongoDB",
    normalize_course_title("MongoDB for Beginners"): "Introduction to MongoDB",
    normalize_course_title("C Basics"): "Introduction to C",
    normalize_course_title("C Programming"): "Introduction to C",
    normalize_course_title("Python Basics"): "Introduction to Python",
    normalize_course_title("Python Programming"): "Introduction to Python",
}


def get_canonical_course_title(title: str) -> str | None:
    """Returns the canonical approved title if matched, otherwise None."""
    norm = normalize_course_title(title)
    if norm in _NORMALIZED_APPROVED:
        return _NORMALIZED_APPROVED[norm]
    if norm in _TITLE_ALIASES:
        return _TITLE_ALIASES[norm]
    return None


def is_approved_course_title(title: str) -> bool:
    """Check if title matches one of the 9 approved platform courses."""
    return get_canonical_course_title(title) is not None
