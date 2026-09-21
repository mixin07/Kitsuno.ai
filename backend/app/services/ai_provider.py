from __future__ import annotations

import json
import urllib.request

from app.config import settings


class AIProviderError(RuntimeError):
    """Raised when an AI provider call fails or the response is unusable."""


class AIProvider:
    """Base interface for AI question-generation providers."""

    def generate(self, prompt: str, count: int) -> str:
        raise NotImplementedError


class MockAIProvider(AIProvider):
    """Deterministic local generator used for development and test runs.

    Produces structurally valid MCQs without any external API call.
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


SYSTEM_PROMPT = (
    "You are an educational quiz author. Generate multiple-choice questions that are "
    "factually accurate, self-contained, and appropriate for the requested difficulty. "
    "Each MCQ must have exactly one correct option. Return ONLY a JSON object."
)


class OpenAIProvider(AIProvider):
    """OpenAI Chat Completions provider. Credentials come from settings only."""

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


def get_ai_provider() -> AIProvider:
    if settings.ai_provider.lower() == "openai":
        return OpenAIProvider(api_key=settings.ai_api_key, model=settings.ai_model)
    return MockAIProvider()