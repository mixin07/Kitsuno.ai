from __future__ import annotations

import json
import urllib.request
from typing import Any

from app.config import settings


class AIProviderError(RuntimeError):
    """Raised when an AI provider call fails or the response is unusable."""


class AIProvider:
    """Base interface for AI question-generation, study-assistant, and summary/notes providers."""

    def generate(self, prompt: str, count: int) -> str:
        raise NotImplementedError

    def chat(self, prompt: str, system_prompt: str, history: list[dict[str, Any]] | None = None) -> str:
        raise NotImplementedError

    def generate_summary(self, lesson_title: str, content: str | None = None) -> dict[str, Any]:
        raise NotImplementedError

    def generate_notes(self, lesson_title: str, content: str | None = None) -> dict[str, Any]:
        raise NotImplementedError


class MockAIProvider(AIProvider):
    """Deterministic local generator used for development and test runs.

    Produces structurally valid responses without external API calls.
    """

    def generate(self, prompt: str, count: int) -> str:
        topic = prompt.strip().splitlines()[1][7:] if len(prompt.splitlines()) > 1 else "topic"
        questions = []
        for index in range(1, count + 1):
            questions.append(
                {
                    "question_text": (
                        f"Mock question {index}: which statement is true regarding '{topic[:48]}'?"
                    ),
                    "question_type": "MCQ",
                    "points": 1,
                    "options": [
                        {"option_text": f"True statement about {topic[:16]}", "is_correct": True},
                        {"option_text": "A false distractor", "is_correct": False},
                        {"option_text": "Another false distractor", "is_correct": False},
                        {"option_text": "A plausible wrong answer", "is_correct": False},
                    ],
                }
            )
        return json.dumps({"questions": questions})

    def chat(self, prompt: str, system_prompt: str, history: list[dict[str, Any]] | None = None) -> str:
        p_lower = prompt.lower()

        if "action: explain" in p_lower:
            return (
                "Here is a beginner-friendly explanation of this lesson:\n\n"
                "This lesson covers core web development fundamentals. "
                "It breaks down the underlying principles, syntax rules, and practical "
                "use cases step-by-step so you can construct well-structured applications."
            )
        elif "action: summarize" in p_lower:
            return (
                "Key Takeaways for this lesson:\n"
                "• Master the primary element structures and syntax rules.\n"
                "• Understand how this concept connects to the broader web development workflow.\n"
                "• Apply best practices for clean, accessible code."
            )
        elif "action: example" in p_lower:
            return (
                "Here is a practical code example illustrating this concept:\n\n"
                "```html\n"
                "<!-- Practical lesson example -->\n"
                "<div class=\"container\">\n"
                "  <h2>Lesson Application</h2>\n"
                "  <p>Learn by building real web features!</p>\n"
                "</div>\n"
                "```"
            )
        elif "action: quiz_me" in p_lower:
            return (
                "🎯 Quick Practice Question:\n\n"
                "Which of the following best describes the primary purpose of the main concept in this lesson?\n\n"
                "A) To structure or manipulate interactive web elements\n"
                "B) To configure database connections\n"
                "C) To compile desktop software\n\n"
                "*(Hint: Think about front-end browser rendering! Reply with your answer to check.)*"
            )
        elif "outside" in p_lower or "weather" in p_lower or "recipe" in p_lower:
            return "That's outside this lesson's scope. I can help you with the concepts covered here."
        else:
            query = prompt.split("USER QUESTION:")[-1].strip() if "USER QUESTION:" in prompt else prompt
            if not query or query == "None":
                query = "this topic"
            return (
                f"Regarding your question about '{query}': "
                "In Kitsuno.ai, this concept works by providing a structured mechanism to "
                "define elements and behavior. Make sure to review the code examples and documentation linked in your lessons!"
            )

    def generate_summary(self, lesson_title: str, content: str | None = None) -> dict[str, Any]:
        return {
            "summary": (
                f"This lesson covers essential fundamentals of '{lesson_title}'. "
                "It explains the underlying mechanics, syntax structure, and standard implementation patterns "
                "used in modern web software development."
            ),
            "key_concepts": [
                f"Core Syntax and Usage of {lesson_title}",
                "Best Practices for Structure & Architecture",
                "Common Execution Lifecycle Patterns",
                "Error Handling & Debugging Techniques",
            ],
            "takeaways": [
                f"Always structure {lesson_title} declarations clearly and consistently.",
                "Review linked code examples and test your recall with lesson quizzes.",
                "Integrate this concept into real projects to solidify your understanding.",
            ],
        }

    def generate_notes(self, lesson_title: str, content: str | None = None) -> dict[str, Any]:
        lt_lower = lesson_title.lower()
        if "css" in lt_lower:
            sample_code = (
                "/* CSS Example: Responsive Card Component */\n"
                ".card {\n"
                "  display: flex;\n"
                "  flex-direction: column;\n"
                "  padding: 1.5rem;\n"
                "  border-radius: 0.75rem;\n"
                "  background-color: #ffffff;\n"
                "  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);\n"
                "  transition: transform 0.2s ease, box-shadow 0.2s ease;\n"
                "}\n\n"
                ".card:hover {\n"
                "  transform: translateY(-2px);\n"
                "  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);\n"
                "}"
            )
        elif "python" in lt_lower:
            sample_code = (
                "# Python Example: Data Processing Function\n"
                "def process_student_scores(scores: list[int]) -> dict[str, float]:\n"
                "    if not scores:\n"
                "        return {'average': 0.0, 'highest': 0.0}\n"
                "    total = sum(scores)\n"
                "    return {\n"
                "        'average': round(total / len(scores), 2),\n"
                "        'highest': float(max(scores)),\n"
                "        'count': len(scores)\n"
                "    }\n\n"
                "# Usage\n"
                "result = process_student_scores([88, 92, 79, 95])\n"
                "print(f'Average score: {result[\"average\"]}')"
            )
        elif "java" in lt_lower:
            sample_code = (
                "// Java Example: Object-Oriented Implementation\n"
                "public class StudentProgress {\n"
                "    private final String studentName;\n"
                "    private int completedLessons;\n\n"
                "    public StudentProgress(String studentName) {\n"
                "        this.studentName = studentName;\n"
                "        this.completedLessons = 0;\n"
                "    }\n\n"
                "    public void completeLesson() {\n"
                "        this.completedLessons++;\n"
                "        System.out.println(studentName + \" completed lesson #\" + completedLessons);\n"
                "    }\n"
                "}"
            )
        else:
            sample_code = (
                f"// Implementation Pattern: {lesson_title}\n"
                "function executeLearningTask(topicName) {\n"
                "  console.log(`Starting lesson module for: ${topicName}`);\n"
                "  const timestamp = new Date().toISOString();\n"
                "  return { success: true, topic: topicName, completedAt: timestamp };\n"
                "}\n\n"
                f"const result = executeLearningTask('{lesson_title}');\n"
                "console.log(result);"
            )

        return {
            "topic": lesson_title,
            "topic_overview": (
                f"In this lesson on '{lesson_title}', you learn foundational concepts, core syntax, "
                "and architectural best practices. The curriculum breaks down the mechanics into practical, "
                "reusable modules so you can apply this knowledge immediately in real-world software engineering."
            ),
            "core_concepts": [
                f"Foundational Architecture & Execution Flow of {lesson_title}",
                "State, Scope, and Data Lifecycle Management",
                "Best Practices for Clean Code, Modularity & Reusability",
                "Robust Error Handling, Defensive Validation & Performance Tuning",
            ],
            "definitions": [
                f"{lesson_title}: The primary subject of this curriculum module, providing standard interfaces and syntax rules.",
                "Execution Context: The environment in which code evaluations take place, managing memory bounds and reference pointers.",
                "Idempotency: The property where an operation produces the exact same outcome regardless of how many times it is executed.",
            ],
            "syntax_rules": [
                "Always declare identifiers within their proper scope boundaries using descriptive naming conventions.",
                "Ensure all closing delimiters, brackets, and semicolons conform strictly to the language specification.",
                "Guard against edge cases such as null, undefined, or out-of-bound indices before executing calculations.",
                "Structure reusable logic into self-contained functions or classes with single responsibilities.",
            ],
            "examples": [
                sample_code,
            ],
            "step_by_step": [
                "Step 1: Analyze the problem statement and identify required input parameters and return types.",
                "Step 2: Initialize required variables, data containers, or component scaffolding.",
                "Step 3: Implement core business logic, transformation pipelines, or element styling.",
                "Step 4: Execute automated tests or manual verification against boundary cases.",
                "Step 5: Refactor for optimal readability, performance, and accessibility.",
            ],
            "common_mistakes": [
                "Mistake: Overlooking scope boundaries or variable shadowing across nested blocks. Fix: Always use explicit local declarations.",
                "Mistake: Neglecting input validation before processing user data. Fix: Add early return guards or assertions.",
                "Mistake: Forgetting to handle asynchronous operations or side effects cleanly. Fix: Use structured error handling (try/catch or status checks).",
            ],
            "important_points": [
                f"Mastering {lesson_title} builds an essential foundation for full-stack engineering.",
                "Writing clean, tested code saves hours of debugging in production environments.",
                "Regular revision and building small side projects solidifies your retention.",
            ],
            "quick_revision": [
                f"Understand the syntax rules and purpose of {lesson_title}.",
                "Remember how to avoid common pitfalls like scope pollution and missing validations.",
                "Test your recall by explaining the core concepts and building a demo implementation from memory.",
            ],
        }


SYSTEM_PROMPT = (
    "You are an educational quiz author. Generate multiple-choice questions that are "
    "factually accurate, self-contained, and appropriate for the requested difficulty. "
    "Each MCQ must have exactly one correct option. Return ONLY a JSON object."
)


class OpenAIProvider(AIProvider):
    """OpenAI Provider. Credentials come from settings only."""

    def __init__(self, api_key: str, model: str) -> None:
        self.api_key = api_key
        self.model = model

    def generate(self, prompt: str, count: int) -> str:
        if not self.api_key:
            raise AIProviderError("AI_API_KEY is not configured")
        payload = {
            "model": self.model,
            "temperature": 0.7,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
        }
        request = urllib.request.Request(
            "https://api.openai.com/v1/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                body = json.loads(response.read().decode("utf-8"))
        except Exception as exc:
            raise AIProviderError(f"AI provider request failed: {exc}") from exc
        try:
            content = body["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise AIProviderError("AI provider returned an unexpected response shape") from exc
        if not isinstance(content, str) or not content.strip():
            raise AIProviderError("AI provider returned empty content")
        return content

    def chat(self, prompt: str, system_prompt: str, history: list[dict[str, Any]] | None = None) -> str:
        if not self.api_key:
            raise AIProviderError("AI_API_KEY is not configured")

        messages = [{"role": "system", "content": system_prompt}]
        if history:
            for item in history:
                messages.append({"role": item.get("role", "user"), "content": item.get("content", "")})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "temperature": 0.7,
            "messages": messages,
        }
        request = urllib.request.Request(
            "https://api.openai.com/v1/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                body = json.loads(response.read().decode("utf-8"))
        except Exception as exc:
            raise AIProviderError(f"AI provider request failed: {exc}") from exc
        try:
            content = body["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise AIProviderError("AI provider returned an unexpected response shape") from exc
        if not isinstance(content, str) or not content.strip():
            raise AIProviderError("AI provider returned empty content")
        return content

    def generate_summary(self, lesson_title: str, content: str | None = None) -> dict[str, Any]:
        system = (
            "You are an expert AI curriculum author. Create a concise, structured summary "
            "for the provided lesson in JSON format with keys: 'summary' (string), 'key_concepts' (list of strings), 'takeaways' (list of strings)."
        )
        prompt = f"Lesson: {lesson_title}\nContent:\n{content or 'N/A'}"
        raw = self._json_completion(prompt, system)
        try:
            return json.loads(raw)
        except json.JSONDecodeError as exc:
            raise AIProviderError("Failed to parse structured summary JSON from AI provider") from exc

    def generate_notes(self, lesson_title: str, content: str | None = None) -> dict[str, Any]:
        system = (
            "You are an expert AI study note creator and university curriculum author. "
            "Create comprehensive, in-depth, structured revision notes for the provided lesson in JSON format with keys: "
            "'topic' (string), 'topic_overview' (string, thorough 2-3 paragraph overview), "
            "'core_concepts' (list of detailed strings), 'definitions' (list of strings formatted as 'Term: Definition'), "
            "'syntax_rules' (list of strings), 'examples' (list of complete code blocks with comments), "
            "'step_by_step' (list of numbered step-by-step guidance strings), "
            "'common_mistakes' (list of strings explaining mistakes and fixes), "
            "'important_points' (list of key takeaways), 'quick_revision' (list of concise revision bullet points)."
        )
        prompt = f"Lesson: {lesson_title}\nContent:\n{content or 'N/A'}"
        raw = self._json_completion(prompt, system)
        try:
            return json.loads(raw)
        except json.JSONDecodeError as exc:
            raise AIProviderError("Failed to parse structured study notes JSON from AI provider") from exc

    def _json_completion(self, prompt: str, system_prompt: str) -> str:
        if not self.api_key:
            raise AIProviderError("AI_API_KEY is not configured")
        payload = {
            "model": self.model,
            "temperature": 0.5,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
        }
        request = urllib.request.Request(
            "https://api.openai.com/v1/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                body = json.loads(response.read().decode("utf-8"))
            return body["choices"][0]["message"]["content"]
        except Exception as exc:
            raise AIProviderError(f"AI provider request failed: {exc}") from exc


def get_ai_provider() -> AIProvider:
    if settings.ai_provider.lower() == "openai" and settings.ai_api_key:
        return OpenAIProvider(api_key=settings.ai_api_key, model=settings.ai_model)
    return MockAIProvider()