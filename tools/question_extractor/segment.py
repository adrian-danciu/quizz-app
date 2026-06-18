from __future__ import annotations

import re
from dataclasses import dataclass

from tools.question_extractor.pdf_layout import LayoutLine, extract_page_lines


QUESTION_RE = re.compile(r"^\s*(\d{1,3})(?:\s*[.)](?:\s+|$)|\s+)")
OPTION_RE = re.compile(r"^\s*([a-eA-E])[.)]\s*(.*)$")
HEADER_FRAGMENTS = (
    "UNIVERSITATEA TITU MAIORESCU",
    "FACULTATEA DE INFORMATICĂ",
)


@dataclass(frozen=True)
class RawQuestion:
    module_id: str
    number: int
    page_start: int
    lines: tuple[LayoutLine, ...]


@dataclass(frozen=True)
class RawOption:
    id: str
    lines: tuple[LayoutLine, ...]


def question_start_number(text: str) -> int | None:
    match = QUESTION_RE.match(text)
    return int(match.group(1)) if match else None


def split_option_marker(text: str) -> tuple[str, str] | None:
    match = OPTION_RE.match(text)
    return (match.group(1).lower(), match.group(2)) if match else None


def is_document_noise(line: LayoutLine, page_number: int) -> bool:
    stripped = line.text.strip()
    if not stripped:
        return True
    if line.top < 50:
        return True
    if stripped in HEADER_FRAGMENTS:
        return True
    if stripped.isdigit() and (
        line.top > 730 or (line.words and line.words[0].x0 > 480)
    ):
        return True
    return False


def segment_module(pdf, config) -> tuple[RawQuestion, ...]:
    questions: list[RawQuestion] = []
    current_number: int | None = None
    current_page: int | None = None
    current_lines: list[LayoutLine] = []
    expected_number = 1
    question_left_edge: float | None = None

    for page_number in range(config.page_start, config.page_end + 1):
        for line in extract_page_lines(pdf, page_number):
            if is_document_noise(line, page_number):
                continue
            number = question_start_number(line.text)
            line_x0 = line.words[0].x0 if line.words else 0
            within_question_margin = (
                question_left_edge is None
                or line_x0 <= question_left_edge + 17.5
            )
            if number == expected_number and within_question_margin:
                if current_number is not None:
                    questions.append(
                        RawQuestion(
                            config.id,
                            current_number,
                            current_page or page_number,
                            tuple(current_lines),
                        )
                    )
                current_number = number
                current_page = page_number
                current_lines = [line]
                if question_left_edge is None:
                    question_left_edge = line_x0
                expected_number += 1
            elif current_number is not None:
                current_lines.append(line)

    if current_number is not None:
        questions.append(
            RawQuestion(
                config.id,
                current_number,
                current_page or config.page_end,
                tuple(current_lines),
            )
        )
    return tuple(questions)


def split_question(
    raw_question: RawQuestion,
    source_option_ids: tuple[str, ...] = ("a", "b", "c", "d"),
    canonical_option_ids: tuple[str, ...] | None = None,
) -> tuple[
    tuple[LayoutLine, ...],
    tuple[RawOption, ...],
    tuple[LayoutLine, ...],
]:
    expanded_lines: list[LayoutLine] = []
    for line in raw_question.lines:
        marker_indexes = [
            index
            for index, word in enumerate(line.words)
            if re.fullmatch(r"[a-eA-E][.)]", word.text)
        ]
        marker_ids = [
            line.words[index].text[0].lower()
            for index in marker_indexes
        ]
        if marker_ids != ["a", "b", "c", "d"]:
            expanded_lines.append(line)
            continue
        for marker_position, word_index in enumerate(marker_indexes):
            next_index = (
                marker_indexes[marker_position + 1]
                if marker_position + 1 < len(marker_indexes)
                else len(line.words)
            )
            expanded_lines.append(
                LayoutLine(
                    top=line.top,
                    words=line.words[word_index:next_index],
                )
            )

    markers = [
        (index, marker[0])
        for index, line in enumerate(expanded_lines)
        if (marker := split_option_marker(line.text)) is not None
    ]
    sequences: list[tuple[int, ...]] = []
    for position, (first_index, marker_id) in enumerate(markers):
        if marker_id != source_option_ids[0]:
            continue
        found: list[int] = [first_index]
        search_position = position + 1
        for wanted in source_option_ids[1:]:
            while (
                search_position < len(markers)
                and markers[search_position][1] != wanted
            ):
                search_position += 1
            if search_position == len(markers):
                break
            found.append(markers[search_position][0])
            search_position += 1
        if len(found) == len(source_option_ids):
            sequences.append(tuple(found))

    if not sequences:
        return tuple(expanded_lines), tuple(), tuple()

    selected_indexes = sequences[-1]
    first_index = selected_indexes[0]
    last_index = selected_indexes[-1]
    trailing_index = next(
        (
            index
            for index in range(last_index + 1, len(expanded_lines))
            if expanded_lines[index].text.strip().startswith(
                ("Răspuns corect:", "Explicație:")
            )
        ),
        len(expanded_lines),
    )
    output_ids = canonical_option_ids or source_option_ids
    ends = selected_indexes[1:] + (trailing_index,)
    boundaries = tuple(zip(output_ids, selected_indexes, ends, strict=True))
    options = tuple(
        RawOption(option_id, tuple(expanded_lines[start:end]))
        for option_id, start, end in boundaries
    )
    return (
        tuple(expanded_lines[:first_index]),
        options,
        tuple(expanded_lines[trailing_index:]),
    )
