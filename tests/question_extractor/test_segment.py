import unittest

import pdfplumber

from tools.question_extractor.config import MODULES, PDF_PATH
from tools.question_extractor.segment import (
    RawQuestion,
    is_document_noise,
    question_start_number,
    segment_module,
    split_question,
    split_option_marker,
)
from tools.question_extractor.pdf_layout import LayoutLine, LayoutWord


class SegmentTests(unittest.TestCase):
    def test_running_header_at_top_of_page_is_noise(self) -> None:
        header = LayoutLine(
            36.7,
            (
                LayoutWord(
                    "PROGRAMARE ÎN PYTHON",
                    200,
                    380,
                    36.7,
                    48,
                    "Times",
                    (0,),
                ),
            ),
        )
        self.assertTrue(is_document_noise(header, 24))

    def test_right_aligned_footer_number_is_noise(self) -> None:
        footer = LayoutLine(
            744,
            (
                LayoutWord("8", 532, 540, 744, 756, "Times", (0,)),
            ),
        )
        self.assertTrue(is_document_noise(footer, 30))

    def test_question_start_accepts_source_numbering(self) -> None:
        self.assertEqual(question_start_number("1. În care dintre"), 1)
        self.assertEqual(question_start_number("54. OpenVPN folosește"), 54)
        self.assertEqual(question_start_number("14."), 14)
        self.assertEqual(question_start_number("11 Se dă tabelul:"), 11)
        self.assertEqual(question_start_number("3 . In mod implicit"), 3)
        self.assertIsNone(question_start_number("a) răspuns"))

    def test_option_markers_accept_parenthesis_and_dot(self) -> None:
        self.assertEqual(split_option_marker("a) text"), ("a", "text"))
        self.assertEqual(split_option_marker("d. text"), ("d", "text"))
        self.assertIsNone(split_option_marker("Explicație: text"))

    def test_four_inline_options_are_split(self) -> None:
        words = tuple(
            LayoutWord(text, x0, x0 + 10, 10, 20, "Times", (0,))
            for text, x0 in (
                ("a)", 70),
                ("Matei", 85),
                ("b)", 140),
                ("Dan", 155),
                ("c)", 200),
                ("Alex", 215),
                ("d)", 260),
                ("Ion", 275),
            )
        )
        raw = RawQuestion(
            "java",
            1,
            1,
            (
                LayoutLine(0, (LayoutWord("1. Prompt", 70, 120, 0, 9, "Times", (0,)),)),
                LayoutLine(10, words),
            ),
        )

        _, options, _ = split_question(raw)

        self.assertEqual([option.id for option in options], ["a", "b", "c", "d"])

    def test_code_member_access_before_answers_is_not_an_option(self) -> None:
        raw = RawQuestion(
            "java",
            1,
            1,
            tuple(
                LayoutLine(
                    index,
                    (
                        LayoutWord(
                            text,
                            70,
                            70 + len(text) * 6,
                            index,
                            index + 9,
                            "Times",
                            (0,),
                        ),
                    ),
                )
                for index, text in enumerate(
                    (
                        "1. Prompt",
                        "C.a++;",
                        "a) first",
                        "b) second",
                        "c) third",
                        "d) fourth",
                    )
                )
            ),
        )

        _, options, _ = split_question(raw)

        self.assertEqual([option.id for option in options], ["a", "b", "c", "d"])

    def test_nonstandard_source_option_sequence_is_preserved(self) -> None:
        raw = RawQuestion(
            "cloud",
            1,
            1,
            tuple(
                LayoutLine(
                    index,
                    (
                        LayoutWord(
                            text,
                            70,
                            70 + len(text) * 6,
                            index,
                            index + 9,
                            "Times",
                            (0,),
                        ),
                    ),
                )
                for index, text in enumerate(
                    ("1. Prompt", "b) one", "c) two", "d) three", "e) all")
                )
            ),
        )

        _, options, _ = split_question(
            raw,
            source_option_ids=("b", "c", "d", "e"),
        )

        self.assertEqual([option.id for option in options], ["b", "c", "d", "e"])


class LiveInventoryTests(unittest.TestCase):
    def test_each_module_has_contiguous_question_numbers(self) -> None:
        with pdfplumber.open(PDF_PATH) as pdf:
            for module in MODULES:
                questions = segment_module(pdf, module)
                self.assertEqual(
                    [question.number for question in questions],
                    list(range(1, module.question_count + 1)),
                    module.name,
                )

    def test_numbered_code_lines_do_not_start_new_algorithm_questions(self) -> None:
        module = next(
            item
            for item in MODULES
            if item.id == "algoritmi-si-structuri-de-date"
        )
        with pdfplumber.open(PDF_PATH) as pdf:
            questions = segment_module(pdf, module)

        self.assertTrue(
            questions[2].lines[0].text.startswith("3. Se dă următoarea funcție")
        )


if __name__ == "__main__":
    unittest.main()
