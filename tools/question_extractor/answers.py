from __future__ import annotations

import re
from dataclasses import dataclass

from tools.question_extractor.pdf_layout import is_red


EXPLICIT_ANSWER_RE = re.compile(
    r"Răspuns corect:\s*([a-dA-D])[.)]?",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class AnswerResolution:
    option_id: str | None
    method: str
    warning: str | None = None


def option_is_red(option) -> bool:
    semantic_words = [
        word
        for line in option.lines
        for word in line.words
        if any(character.isalnum() for character in word.text)
    ]
    if not semantic_words:
        return False
    return any(is_red(word.color) for word in semantic_words)


def detect_correct_options(options, trailing_lines) -> set[str]:
    trailing_text = " ".join(line.text for line in trailing_lines)
    explicit = EXPLICIT_ANSWER_RE.search(trailing_text)
    if explicit:
        return {explicit.group(1).lower()}
    return {option.id for option in options if option_is_red(option)}


def resolve_correct_option(
    module_id: str,
    question_number: int,
    detected: set[str],
    corrections: dict,
) -> AnswerResolution:
    key = f"{module_id}:{question_number}"
    if key in corrections:
        return AnswerResolution(
            corrections[key]["correctOptionId"],
            "approved-override",
        )
    if len(detected) == 1:
        return AnswerResolution(next(iter(detected)), "source-red")
    if not detected:
        return AnswerResolution(
            None,
            "unresolved",
            "no correct option detected",
        )
    return AnswerResolution(
        None,
        "unresolved",
        f"multiple correct options detected: {sorted(detected)}",
    )
