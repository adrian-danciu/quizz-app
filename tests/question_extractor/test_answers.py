import unittest
import json
from pathlib import Path

import pdfplumber

from tools.question_extractor.answers import (
    detect_correct_options,
    option_is_red,
    resolve_correct_option,
)
from tools.question_extractor.config import MODULES, PDF_PATH
from tools.question_extractor.pdf_layout import LayoutLine, LayoutWord
from tools.question_extractor.segment import RawOption
from tools.question_extractor.segment import segment_module, split_question


class AnswerTests(unittest.TestCase):
    def test_single_detected_answer_is_used(self) -> None:
        result = resolve_correct_option(
            "fundamentele-programarii",
            1,
            {"b"},
            {},
        )
        self.assertEqual(result.option_id, "b")
        self.assertEqual(result.method, "source-red")

    def test_approved_override_wins_over_conflicting_source(self) -> None:
        corrections = {
            "algoritmi-si-structuri-de-date:50": {
                "correctOptionId": "a",
                "reason": "approved",
            }
        }
        result = resolve_correct_option(
            "algoritmi-si-structuri-de-date",
            50,
            {"a", "d"},
            corrections,
        )
        self.assertEqual(result.option_id, "a")
        self.assertEqual(result.method, "approved-override")

    def test_unresolved_conflict_is_not_guessed(self) -> None:
        result = resolve_correct_option("example", 1, {"a", "c"}, {})
        self.assertIsNone(result.option_id)
        self.assertIn("multiple", result.warning)

    def test_red_marker_resolves_even_with_black_continuation_lines(self) -> None:
        option = RawOption(
            "a",
            (
                LayoutLine(
                    1,
                    (
                        LayoutWord(
                            "a)",
                            70,
                            80,
                            1,
                            10,
                            "Times",
                            (1.0, 0.0, 0.0),
                        ),
                        LayoutWord(
                            "answer",
                            85,
                            120,
                            1,
                            10,
                            "Times",
                            (1.0, 0.0, 0.0),
                        ),
                    ),
                ),
                LayoutLine(
                    2,
                    (
                        LayoutWord(
                            "PAGE HEADER",
                            70,
                            140,
                            2,
                            11,
                            "Times",
                            (0,),
                        ),
                    ),
                ),
            ),
        )
        self.assertTrue(option_is_red(option))

    def test_single_red_punctuation_mark_does_not_mark_option_correct(self) -> None:
        option = RawOption(
            "b",
            (
                LayoutLine(
                    1,
                    (
                        LayoutWord("b.", 70, 80, 1, 10, "Times", (0,)),
                        LayoutWord("wrong", 85, 120, 1, 10, "Times", (0,)),
                        LayoutWord(";", 125, 130, 1, 10, "Times", (1, 0, 0)),
                    ),
                ),
            ),
        )
        self.assertFalse(option_is_red(option))


class LiveAnswerAuditTests(unittest.TestCase):
    def test_every_question_has_a_resolved_available_answer(self) -> None:
        corrections = json.loads(
            Path("tools/question_extractor/corrections.json").read_text()
        )
        unresolved: list[str] = []
        with pdfplumber.open(PDF_PATH) as pdf:
            for module in MODULES:
                for question in segment_module(pdf, module):
                    key = f"{module.id}:{question.number}"
                    correction = corrections.get(key, {})
                    options = split_question(
                        question,
                        source_option_ids=tuple(
                            correction.get(
                                "sourceOptionIds",
                                ("a", "b", "c", "d"),
                            )
                        ),
                        canonical_option_ids=(
                            tuple(correction["canonicalOptionIds"])
                            if "canonicalOptionIds" in correction
                            else None
                        ),
                    )[1]
                    detected = detect_correct_options(options, ())
                    resolution = resolve_correct_option(
                        module.id,
                        question.number,
                        detected,
                        corrections,
                    )
                    option_ids = {option.id for option in options}
                    if (
                        resolution.option_id is None
                        or resolution.option_id not in option_ids
                    ):
                        unresolved.append(
                            f"{key}: answer={resolution.option_id}, "
                            f"options={sorted(option_ids)}"
                        )
        self.assertEqual(unresolved, [])


if __name__ == "__main__":
    unittest.main()
