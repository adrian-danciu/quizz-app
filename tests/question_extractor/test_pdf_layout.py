import unittest

from tools.question_extractor.pdf_layout import (
    LayoutWord,
    group_words_into_lines,
    is_monospace,
    is_red,
)


class PdfLayoutTests(unittest.TestCase):
    def test_red_accepts_pdf_rgb_red(self) -> None:
        self.assertTrue(is_red((1.0, 0.0, 0.0)))
        self.assertTrue(is_red((0.784, 0.149, 0.0745)))

    def test_red_rejects_black_and_missing_color(self) -> None:
        self.assertFalse(is_red((0,)))
        self.assertFalse(is_red(None))

    def test_monospace_detects_courier_fonts(self) -> None:
        self.assertTrue(is_monospace("CourierNewPSMT"))
        self.assertFalse(is_monospace("TimesNewRomanPSMT"))

    def test_words_with_small_baseline_differences_share_a_line(self) -> None:
        words = (
            LayoutWord("a)", 90, 100, 337.30, 348.34, "CambriaMath", (0,)),
            LayoutWord(
                "(x>=1)||(x<6)",
                108,
                190,
                336.93,
                347.97,
                "CourierNewPSMT",
                (0,),
            ),
        )
        lines = group_words_into_lines(words)
        self.assertEqual(len(lines), 1)
        self.assertEqual(lines[0].text, "a) (x>=1)||(x<6)")

    def test_superscripted_formula_stays_with_its_option_marker(self) -> None:
        words = (
            LayoutWord("b.", 90, 100, 728.45, 740.45, "Times", (1, 0, 0)),
            LayoutWord(
                "O(n2)",
                108,
                145,
                727.0,
                740.45,
                "CambriaMath",
                (1, 0, 0),
            ),
        )
        lines = group_words_into_lines(words)
        self.assertEqual(len(lines), 1)
        self.assertEqual(lines[0].text, "b. O(n2)")


if __name__ == "__main__":
    unittest.main()
