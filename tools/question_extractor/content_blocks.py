from __future__ import annotations

import re

from tools.question_extractor.models import ContentBlock
from tools.question_extractor.pdf_layout import LayoutLine, is_monospace
from tools.question_extractor.segment import OPTION_RE, QUESTION_RE


LANGUAGES = {
    "fundamentele-programarii": "c",
    "programare-in-python": "python",
    "programare-orientata-pe-obiecte-cpp": "cpp",
    "metode-avansate-de-programare-java": "java",
    "tehnici-avansate-de-programare": "c",
    "algoritmi-si-structuri-de-date": "c",
    "baze-de-date": "sql",
    "sisteme-de-gestiune-a-bazelor-de-date": "sql",
    "sisteme-de-operare": "bash",
    "tehnologii-web": "text",
}


def infer_language(module_id: str) -> str:
    return LANGUAGES.get(module_id, "text")


def clean_first_line(text: str) -> str:
    if QUESTION_RE.match(text):
        text = QUESTION_RE.sub("", text, count=1).lstrip(" .)\t")
    text = OPTION_RE.sub(lambda match: match.group(2), text, count=1)
    return text.strip()


def line_is_code(line: LayoutLine) -> bool:
    visible_words = [word for word in line.words if word.text.strip()]
    if not visible_words:
        return False
    mono_ratio = (
        sum(is_monospace(word.font) for word in visible_words)
        / len(visible_words)
    )
    syntax = re.search(
        r"[{};]|#include|def\s+\w+|class\s+\w+|SELECT\s+|"
        r"for\s*\(|while\s*\(|System\.out|printf\s*\(",
        line.text,
        re.IGNORECASE,
    )
    return mono_ratio >= 0.6 or syntax is not None


def _code_values(lines: list[LayoutLine], values: list[str]) -> list[str]:
    base_x = min(line.words[0].x0 for line in lines if line.words)
    rendered: list[str] = []
    for line, value in zip(lines, values, strict=True):
        indent_steps = max(0, round((line.words[0].x0 - base_x) / 18))
        rendered.append(("    " * indent_steps) + value)
    return rendered


def lines_to_blocks(
    lines: tuple[LayoutLine, ...],
    module_id: str,
) -> tuple[ContentBlock, ...]:
    groups: list[tuple[str, list[LayoutLine], list[str]]] = []
    for index, line in enumerate(lines):
        value = clean_first_line(line.text) if index == 0 else line.text.strip()
        if not value:
            continue
        kind = "code" if line_is_code(line) else "text"
        if groups and groups[-1][0] == kind:
            groups[-1][1].append(line)
            groups[-1][2].append(value)
        else:
            groups.append((kind, [line], [value]))

    blocks: list[ContentBlock] = []
    for kind, group_lines, values in groups:
        if kind == "code":
            blocks.append(
                ContentBlock(
                    type="code",
                    language=infer_language(module_id),
                    value="\n".join(
                        _code_values(group_lines, values)
                    ).strip("\n"),
                )
            )
        else:
            blocks.append(
                ContentBlock(type="text", value=" ".join(values).strip())
            )
    return tuple(blocks)


def explanation_blocks(
    lines: tuple[LayoutLine, ...],
    module_id: str,
) -> tuple[ContentBlock, ...] | None:
    explanation_index = next(
        (
            index
            for index, line in enumerate(lines)
            if line.text.strip().startswith("Explicație:")
        ),
        None,
    )
    if explanation_index is None:
        return None
    return lines_to_blocks(lines[explanation_index:], module_id)
