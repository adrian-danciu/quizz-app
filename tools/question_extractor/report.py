from __future__ import annotations

from collections import Counter
from pathlib import Path

from tools.question_extractor.config import MODULES


def render_report(result, issues, corrections: dict) -> str:
    counts = Counter(
        question.moduleId for question in result.dataset.questions
    )
    lines = [
        "# Question Extraction Report",
        "",
        "## Summary",
        "",
        "- Source: Grile Licenta 2026.pdf",
        f"- Questions: {len(result.dataset.questions)}",
        f"- Modules: {len(result.dataset.modules)}",
        f"- Diagram assets: {len(result.assets)}",
        "",
        "## Module Counts",
        "",
        "| Module | Expected | Extracted | Status |",
        "|---|---:|---:|---|",
    ]
    for module in MODULES:
        extracted = counts[module.id]
        status = "OK" if extracted == module.question_count else "Mismatch"
        lines.append(
            f"| {module.name} | {module.question_count} | {extracted} | {status} |"
        )

    lines.extend(
        [
            "",
            "## Approved and Inferred Corrections",
            "",
            "| Question | Final answer | Reason |",
            "|---|---|---|",
        ]
    )
    for key, correction in sorted(corrections.items()):
        reason = correction["reason"].replace("|", "\\|")
        lines.append(
            f"| {key} | {correction['correctOptionId'].upper()} | {reason} |"
        )

    lines.extend(
        [
            "",
            "## Warnings Requiring Review",
            "",
        ]
    )
    if result.warnings:
        lines.extend(f"- {warning}" for warning in result.warnings)
    else:
        lines.append("- None")

    lines.extend(
        [
            "",
            "## Validation",
            "",
            f"- Structural errors: {len(issues)}",
            f"- Unresolved answers: {len(result.warnings)}",
            f"- Missing assets: {sum(issue.code == 'missing-image' for issue in issues)}",
            "",
        ]
    )
    if issues:
        lines.append("### Validation Issues")
        lines.append("")
        lines.extend(
            f"- `{issue.code}` {issue.question_id or ''}: {issue.message}"
            for issue in issues
        )
        lines.append("")
    return "\n".join(lines)


def write_report(path: Path, result, issues, corrections: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        render_report(result, issues, corrections),
        encoding="utf-8",
    )

