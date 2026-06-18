from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from pathlib import Path

from tools.question_extractor.config import EXPECTED_TOTAL, MODULES


@dataclass(frozen=True)
class ValidationIssue:
    code: str
    message: str
    question_id: str | None = None


OPTION_COUNT_EXCEPTIONS = {
    "cloud-computing-005": 3,
}


def _non_empty_blocks(blocks: list[dict]) -> bool:
    if not blocks:
        return False
    for block in blocks:
        if block.get("type") in {"text", "code"} and not block.get(
            "value", ""
        ).strip():
            return False
        if block.get("type") == "image" and not block.get("src"):
            return False
    return True


def validate_question(
    question: dict,
    expected_option_count: int = 4,
) -> list[ValidationIssue]:
    issues: list[ValidationIssue] = []
    question_id = question.get("id")
    options = question.get("options", [])
    option_ids = [option.get("id") for option in options]
    if not question_id:
        issues.append(ValidationIssue("missing-id", "Question ID is empty"))
    if not _non_empty_blocks(question.get("content", [])):
        issues.append(
            ValidationIssue(
                "empty-prompt",
                "Question prompt has no usable content",
                question_id,
            )
        )
    if len(options) != expected_option_count:
        issues.append(
            ValidationIssue(
                "option-count",
                f"Expected {expected_option_count} options, got {len(options)}",
                question_id,
            )
        )
    if len(set(option_ids)) != len(option_ids):
        issues.append(
            ValidationIssue(
                "duplicate-option-id",
                "Option IDs are not unique",
                question_id,
            )
        )
    if any(not _non_empty_blocks(option.get("content", [])) for option in options):
        issues.append(
            ValidationIssue(
                "empty-option",
                "At least one option has no usable content",
                question_id,
            )
        )
    if question.get("correctOptionId") not in set(option_ids):
        issues.append(
            ValidationIssue(
                "invalid-correct-option",
                "Correct option does not exist in options",
                question_id,
            )
        )
    source = question.get("source", {})
    if source.get("page", 0) < 1 or source.get("questionNumber", 0) < 1:
        issues.append(
            ValidationIssue(
                "invalid-source",
                "Source page and question number must be positive",
                question_id,
            )
        )
    return issues


def validate_dataset(dataset, asset_root: Path) -> list[ValidationIssue]:
    data = dataset.to_dict() if hasattr(dataset, "to_dict") else dataset
    issues: list[ValidationIssue] = []
    if data.get("schemaVersion") != 1:
        issues.append(ValidationIssue("schema-version", "Expected schema version 1"))
    modules = data.get("modules", [])
    questions = data.get("questions", [])
    if len(modules) != 15:
        issues.append(ValidationIssue("module-count", "Expected 15 modules"))
    if len(questions) != EXPECTED_TOTAL:
        issues.append(
            ValidationIssue(
                "question-count",
                f"Expected {EXPECTED_TOTAL} questions, got {len(questions)}",
            )
        )
    ids = [question.get("id") for question in questions]
    if len(set(ids)) != len(ids):
        issues.append(ValidationIssue("duplicate-question-id", "Question IDs repeat"))

    counts = Counter(question.get("moduleId") for question in questions)
    for module in MODULES:
        if counts[module.id] != module.question_count:
            issues.append(
                ValidationIssue(
                    "module-question-count",
                    f"{module.id}: expected {module.question_count}, got {counts[module.id]}",
                )
            )

    for question in questions:
        expected = OPTION_COUNT_EXCEPTIONS.get(question["id"], 4)
        issues.extend(validate_question(question, expected))
        for block in question.get("content", []):
            if block.get("type") == "image":
                path = asset_root / block["src"].lstrip("/")
                if not path.exists():
                    issues.append(
                        ValidationIssue(
                            "missing-image",
                            f"Image does not exist: {path}",
                            question["id"],
                        )
                    )
    return issues
