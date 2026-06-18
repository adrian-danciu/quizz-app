from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class LayoutWord:
    text: str
    x0: float
    x1: float
    top: float
    bottom: float
    font: str
    color: Any


@dataclass(frozen=True)
class LayoutLine:
    top: float
    words: tuple[LayoutWord, ...]

    @property
    def text(self) -> str:
        return " ".join(word.text for word in self.words)


def is_red(color: Any) -> bool:
    if not isinstance(color, (tuple, list)) or len(color) != 3:
        return False
    red, green, blue = (float(value) for value in color)
    return (
        red >= 0.65
        and green <= 0.3
        and blue <= 0.2
        and red >= green * 2
        and red >= blue * 3
    )


def is_monospace(font_name: str) -> bool:
    lowered = font_name.lower()
    return "courier" in lowered or "mono" in lowered


def group_words_into_lines(
    words: tuple[LayoutWord, ...],
    top_tolerance: float = 2.0,
) -> tuple[LayoutLine, ...]:
    grouped: list[list[LayoutWord]] = []
    group_tops: list[float] = []
    for word in sorted(words, key=lambda item: (item.top, item.x0)):
        if group_tops and abs(word.top - group_tops[-1]) <= top_tolerance:
            grouped[-1].append(word)
            group_tops[-1] = sum(item.top for item in grouped[-1]) / len(
                grouped[-1]
            )
        else:
            grouped.append([word])
            group_tops.append(word.top)
    return tuple(
        LayoutLine(
            top=round(group_tops[index], 1),
            words=tuple(sorted(line_words, key=lambda item: item.x0)),
        )
        for index, line_words in enumerate(grouped)
    )


def extract_page_lines(pdf, page_number: int) -> tuple[LayoutLine, ...]:
    page = pdf.pages[page_number - 1]
    words = page.extract_words(
        keep_blank_chars=False,
        use_text_flow=False,
        extra_attrs=["fontname", "non_stroking_color"],
    )
    layout_words: list[LayoutWord] = []
    for raw in words:
        layout_words.append(
            LayoutWord(
                text=raw["text"],
                x0=float(raw["x0"]),
                x1=float(raw["x1"]),
                top=float(raw["top"]),
                bottom=float(raw["bottom"]),
                font=raw.get("fontname") or "",
                color=raw.get("non_stroking_color"),
            )
        )
    return group_words_into_lines(tuple(layout_words))
